//! Spracherkennung mit whisper.cpp: `whisper-cli` als Begleitprogramm, ein Aufruf pro Funkspruch.
//! Bewusst kein `whisper-server` – der lauscht ohne Zugangsschutz an einem Port.
//!
//! - Programm: `whisper\whisper-cli.exe` im Programmordner, die DLLs daneben. Liegt dort
//!   `ggml-vulkan.dll`, rechnet die Grafikkarte; scheitert sie, rechnet die CPU.
//! - Modelle liegen getrennt von der App unter `%LOCALAPPDATA%\<Kennung>\modelle` (überstehen Updates
//!   und Deinstallation). Die App lädt sie auf Klick von der Originalquelle nach oder man legt sie
//!   selbst dorthin. Ein Modell erkennt sie an Dateiname und genauer Größe.
//! - Die Aufnahme kommt als WAV aus der App, liegt nur während der Erkennung in einer temporären
//!   Datei und wird danach gelöscht.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::ipc::{Channel, InvokeBody, Request};
use tauri::Manager;

pub(crate) struct ModelFile {
    pub(crate) id: &'static str,
    pub(crate) file: &'static str,
    pub(crate) size: u64,
    pub(crate) sha256: &'static str,
    /// Originalquelle auf einem festen Stand (Commit), zum Nachladen auf Klick.
    pub(crate) url: &'static str,
    /// Stille vorher mit Silero-VAD herausschneiden – large-v3-turbo erfindet sonst Sätze in der Stille.
    pub(crate) vad: bool,
}

/// Modelle, die die App kennt (dieselben Dateien wie in `scripts/fetch-asr.ts`). Andere lädt sie nicht.
/// Quelle: die ggml-Umwandlungen des whisper.cpp-Autors auf Hugging Face.
const MODELS: &[ModelFile] = &[
    ModelFile {
        id: "small.en",
        file: "ggml-small.en-q5_1.bin",
        size: 190_098_681,
        sha256: "bfdff4894dcb76bbf647d56263ea2a96645423f1669176f4844a1bf8e478ad30",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-small.en-q5_1.bin",
        vad: false,
    },
    ModelFile {
        id: "base.en",
        file: "ggml-base.en-q5_1.bin",
        size: 59_721_011,
        sha256: "4baf70dd0d7c4247ba2b81fafd9c01005ac77c2f9ef064e00dcf195d0e2fdd2f",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-base.en-q5_1.bin",
        vad: false,
    },
    ModelFile {
        id: "large-v3-turbo",
        file: "ggml-large-v3-turbo-q5_0.bin",
        size: 574_041_195,
        sha256: "394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-large-v3-turbo-q5_0.bin",
        vad: true,
    },
];
static VAD: ModelFile = ModelFile {
    id: "silero-vad",
    file: "ggml-silero-v6.2.0.bin",
    size: 885_098,
    sha256: "2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987",
    url: "https://huggingface.co/ggml-org/whisper-vad/resolve/9ffd54a1e1ee413ddf265af9913beaf518d1639b/ggml-silero-v6.2.0.bin",
    vad: false,
};

const BIN: &str = "whisper-cli.exe";
const GPU_DLL: &str = "ggml-vulkan.dll";
/// 60 s Sprechzeit sind knapp 2 MB; mehr ist kein Funkspruch.
const MAX_WAV_BYTES: usize = 4 * 1024 * 1024;
const MAX_PROMPT_CHARS: usize = 2000;
/// Der allererste Lauf auf der Grafikkarte übersetzt die Shader (rund 12 s), danach 1–3 s.
const TIMEOUT: Duration = Duration::from_secs(90);
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub struct Asr {
    bin: Option<PathBuf>,
    /// Hier sucht die App nach Modellen; der erste ist der eigene Ordner (übersteht App-Updates).
    model_dirs: Vec<PathBuf>,
}

impl Asr {
    pub fn new(app: &tauri::AppHandle) -> Self {
        let user = app.path().app_local_data_dir().map(|d| d.join("modelle")).unwrap_or_else(|_| PathBuf::from("modelle"));
        let mut model_dirs = vec![user];
        let mut bins = Vec::new();
        if let Ok(res) = app.path().resource_dir() {
            bins.push(res.join("whisper").join(BIN));
        }
        // Beim Entwickeln: whisper.cpp und Modelle aus `.asr` (siehe docs/spracherkennung.md)
        #[cfg(debug_assertions)]
        if let Some(asr) = dev_asr_dir() {
            model_dirs.push(asr.join("ggml"));
            bins.push(asr.join("whisper.cpp").join("v1.9.5-vulkan").join(BIN));
            bins.push(asr.join("whisper.cpp").join("v1.9.5").join("Release").join(BIN));
        }
        model_dirs.dedup();
        Self { bin: bins.into_iter().find(|b| b.is_file()), model_dirs }
    }

    fn find(&self, m: &ModelFile) -> Option<PathBuf> {
        self.model_dirs.iter().map(|d| d.join(m.file)).find(|p| p.metadata().is_ok_and(|md| md.is_file() && md.len() == m.size))
    }

    /// Modell und – falls es eins braucht – das VAD-Modell; `None`, wenn etwas fehlt.
    fn model_paths(&self, id: &str) -> Option<(PathBuf, Option<PathBuf>)> {
        let m = MODELS.iter().find(|m| m.id == id)?;
        let model = self.find(m)?;
        if !m.vad {
            return Some((model, None));
        }
        Some((model, Some(self.find(&VAD)?)))
    }

    fn gpu_available(&self) -> bool {
        self.bin.as_ref().and_then(|b| b.parent()).is_some_and(|d| d.join(GPU_DLL).is_file())
    }
}

#[cfg(debug_assertions)]
pub(crate) fn dev_asr_dir() -> Option<PathBuf> {
    if let Some(dir) = std::env::var_os("RT_ASR_DIR") {
        return Some(PathBuf::from(dir));
    }
    // Im Worktree liegt `.asr` im Haupt-Checkout weiter oben
    Path::new(env!("CARGO_MANIFEST_DIR")).ancestors().map(|p| p.join(".asr")).find(|p| p.is_dir())
}

/// Pfad für die Anzeige: ohne das Präfix `\\?\`, mit dem Tauri den Programmordner meldet.
fn shown(p: &Path) -> String {
    let s = p.display().to_string();
    match s.strip_prefix(r"\\?\") {
        Some(rest) if !rest.starts_with("UNC\\") => rest.to_string(),
        _ => s,
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    id: &'static str,
    file: &'static str,
    size: u64,
    /// Wo das Modell gefunden wurde; `None`, wenn es (oder sein VAD-Modell) fehlt.
    path: Option<String>,
    /// Fehlende Dateien (Modell, VAD-Modell), die in den Modell-Ordner gehören.
    missing: Vec<&'static str>,
    /// So viele Bytes lädt „Laden“ (die fehlenden Dateien).
    download: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AsrStatus {
    /// whisper-cli ist dabei.
    available: bool,
    /// Die Vulkan-Version ist dabei (rechnet auf der Grafikkarte, sonst CPU).
    gpu: bool,
    /// Hierhin gehören weitere Modelle.
    model_dir: String,
    models: Vec<ModelStatus>,
}

/// Was ist da? Für die Einstellungen und vor dem ersten Funkspruch.
#[tauri::command]
pub fn asr_status(asr: tauri::State<Asr>) -> AsrStatus {
    AsrStatus {
        available: asr.bin.is_some(),
        gpu: asr.gpu_available(),
        model_dir: shown(&asr.model_dirs[0]),
        models: MODELS
            .iter()
            .map(|m| {
                let missing: Vec<&'static ModelFile> = files_of(m).filter(|f| asr.find(f).is_none()).collect();
                ModelStatus {
                    id: m.id,
                    file: m.file,
                    size: m.size,
                    path: asr.model_paths(m.id).map(|(p, _)| shown(&p)),
                    download: missing.iter().map(|f| f.size).sum(),
                    missing: missing.iter().map(|f| f.file).collect(),
                }
            })
            .collect(),
    }
}

/// Den eigenen Modell-Ordner im Explorer öffnen (legt ihn bei Bedarf an).
#[tauri::command]
pub fn open_model_dir(asr: tauri::State<Asr>) -> Result<(), String> {
    let dir = &asr.model_dirs[0];
    std::fs::create_dir_all(dir).map_err(|e| format!("Ordner nicht angelegt: {e}"))?;
    Command::new("explorer.exe").arg(dir).spawn().map(|_| ()).map_err(|e| format!("Explorer startet nicht: {e}"))
}

/// Dateien eines Modells: das Modell selbst und – falls nötig – das VAD-Modell.
fn files_of(m: &'static ModelFile) -> impl Iterator<Item = &'static ModelFile> {
    std::iter::once(m).chain(m.vad.then_some(&VAD))
}

// ---------------------------------------------------------------------------
// Nachladen auf Klick: nur die festen Dateien von oben, von der Originalquelle, mit Prüfsumme.
// Die App geht nur ins Internet, wenn man auf „Laden“ klickt.
// ---------------------------------------------------------------------------

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum DownloadEvent {
    /// Fortschritt der Datei, die gerade lädt.
    Progress { file: &'static str, done: u64, total: u64 },
    /// Verbindung abgerissen, es geht gleich an derselben Stelle weiter.
    Retry { file: &'static str, attempt: u32, max: u32 },
    /// Datei vollständig, Prüfsumme stimmt, liegt im Modell-Ordner.
    Verified { file: &'static str },
}

/// Läuft gerade ein Download, liegt hier sein Abbruch-Schalter (es lädt immer nur einer).
#[derive(Default)]
pub struct Downloads(Mutex<Option<Arc<AtomicBool>>>);

/// Gibt den Platz für den nächsten Download frei – auch bei Fehlern.
pub(crate) struct Slot<'a>(&'a Downloads);

impl<'a> Slot<'a> {
    /// Den einen Download-Platz belegen (es lädt immer nur einer, Spracherkennung wie Sprachausgabe).
    pub(crate) fn claim(downloads: &'a Downloads, cancel: Arc<AtomicBool>) -> Result<Self, String> {
        let mut active = downloads.0.lock().map_err(|_| "Download-Zustand gestört.")?;
        if active.is_some() {
            return Err("Es läuft schon ein Download.".into());
        }
        *active = Some(cancel);
        Ok(Slot(downloads))
    }
}

impl Drop for Slot<'_> {
    fn drop(&mut self) {
        if let Ok(mut active) = self.0 .0.lock() {
            *active = None;
        }
    }
}

/// Ein Modell (samt VAD-Modell, falls nötig) in den eigenen Modell-Ordner laden.
#[tauri::command]
pub async fn download_model(
    asr: tauri::State<'_, Asr>,
    downloads: tauri::State<'_, Downloads>,
    id: String,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let model = MODELS.iter().find(|m| m.id == id).ok_or("Unbekanntes Modell.")?;
    let todo: Vec<&'static ModelFile> = files_of(model).filter(|f| asr.find(f).is_none()).collect();
    let dir = asr.model_dirs[0].clone();
    let cancel = Arc::new(AtomicBool::new(false));
    let _slot = Slot::claim(&downloads, cancel.clone())?;
    tauri::async_runtime::spawn_blocking(move || todo.into_iter().try_for_each(|f| fetch(f, &dir, &cancel, &on_event)))
        .await
        .map_err(|e| format!("Download abgebrochen: {e}"))?
}

/// Laufenden Download abbrechen (die halbe Datei wird gelöscht).
#[tauri::command]
pub fn cancel_download(downloads: tauri::State<Downloads>) {
    if let Ok(active) = downloads.0.lock() {
        if let Some(cancel) = active.as_ref() {
            cancel.store(true, Ordering::Relaxed);
        }
    }
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// So oft setzt ein Download nach einem Verbindungsabbruch fort (der CDN von Hugging Face trennt
/// langsame Verbindungen gelegentlich).
const RETRIES: u32 = 5;

/// Warum ein Teilstück endete.
enum Stop {
    Cancelled,
    /// Nicht zu retten (Datei zu groß, Platte voll …).
    Fatal(String),
    /// Verbindung weg oder hängt: an derselben Stelle fortsetzen.
    Lost(String),
}

/// Laufender Download einer Datei: Ziel, Prüfsumme und Stand bleiben über Fortsetzungen erhalten.
struct Transfer<'a> {
    f: &'static ModelFile,
    out: std::io::BufWriter<std::fs::File>,
    hasher: Sha256,
    done: u64,
    events: &'a Channel<DownloadEvent>,
    shown_at: Instant,
}

impl Transfer<'_> {
    fn progress(&mut self, force: bool) {
        if force || self.shown_at.elapsed() >= Duration::from_millis(150) {
            let _ = self.events.send(DownloadEvent::Progress { file: self.f.file, done: self.done, total: self.f.size });
            self.shown_at = Instant::now();
        }
    }

    /// Von vorn (der Server liefert keine Teilstücke).
    fn restart(&mut self) -> Result<(), Stop> {
        use std::io::Seek;
        let fail = |e: std::io::Error| Stop::Fatal(format!("Schreiben fehlgeschlagen: {e}"));
        self.out.flush().map_err(fail)?;
        self.out.get_mut().set_len(0).map_err(fail)?;
        self.out.get_mut().seek(std::io::SeekFrom::Start(0)).map_err(fail)?;
        self.hasher = Sha256::new();
        self.done = 0;
        Ok(())
    }

    /// Antwort bis zum Ende lesen; fertig nur, wenn genau die erwartete Größe da ist.
    fn receive(&mut self, reader: &mut impl Read, cancel: &AtomicBool) -> Result<(), Stop> {
        let mut buf = vec![0u8; 256 * 1024];
        loop {
            if cancel.load(Ordering::Relaxed) {
                return Err(Stop::Cancelled);
            }
            let n = reader.read(&mut buf).map_err(|e| Stop::Lost(e.to_string()))?;
            if n == 0 {
                return if self.done == self.f.size { Ok(()) } else { Err(Stop::Lost("Verbindung vorzeitig beendet".into())) };
            }
            self.done += n as u64;
            if self.done > self.f.size {
                return Err(Stop::Fatal("Datei größer als erwartet – verworfen.".into()));
            }
            self.hasher.update(&buf[..n]);
            self.out.write_all(&buf[..n]).map_err(|e| Stop::Fatal(format!("Schreiben fehlgeschlagen: {e}")))?;
            self.progress(false);
        }
    }

    /// Ein Versuch: ab `done` anfragen (Range), Antwort lesen.
    fn attempt(&mut self, agent: &ureq::Agent, cancel: &AtomicBool) -> Result<(), Stop> {
        let mut request = agent.get(self.f.url);
        if self.done > 0 {
            request = request.header("Range", format!("bytes={}-", self.done));
        }
        let response = request.call().map_err(|e| Stop::Lost(format!("Quelle nicht erreichbar: {e}")))?;
        if self.done > 0 {
            let resumed = response.status().as_u16() == 206
                && response.headers().get("content-range").and_then(|v| v.to_str().ok()).is_some_and(|v| v.starts_with(&format!("bytes {}-", self.done)));
            if !resumed {
                // Ganze Datei statt des Rests: von vorn mitlesen
                if response.status().as_u16() != 200 {
                    return Err(Stop::Lost(format!("unerwartete Antwort {}", response.status())));
                }
                self.restart()?;
            }
        }
        let mut reader = response.into_body().into_reader();
        self.receive(&mut reader, cancel)
    }
}

/// Eine Datei laden: erst als `.part`, Größe und SHA-256 prüfen, dann umbenennen. Reißt die Verbindung
/// ab, geht es an derselben Stelle weiter (bis zu `RETRIES`-mal); die Prüfsumme läuft durch.
pub(crate) fn fetch(f: &'static ModelFile, dir: &Path, cancel: &AtomicBool, events: &Channel<DownloadEvent>) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| format!("Modell-Ordner nicht angelegt: {e}"))?;
    let part = dir.join(format!("{}.part", f.file));
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .timeout_connect(Some(Duration::from_secs(20)))
        .timeout_recv_response(Some(Duration::from_secs(30)))
        // Hängt die Verbindung, merkt man es hieran; die Gesamtdauer ist offen (große Dateien)
        .timeout_per_read(Some(Duration::from_secs(30)))
        .user_agent("fence-in-comms-training")
        .build()
        .into();
    let file = std::fs::File::create(&part).map_err(|e| format!("Datei nicht angelegt: {e}"))?;
    let mut t = Transfer { f, out: std::io::BufWriter::new(file), hasher: Sha256::new(), done: 0, events, shown_at: Instant::now() };
    let result = (|| -> Result<(), String> {
        let mut retries = 0;
        loop {
            match t.attempt(&agent, cancel) {
                Ok(()) => break,
                Err(Stop::Cancelled) => return Err("Abgebrochen.".into()),
                Err(Stop::Fatal(e)) => return Err(e),
                Err(Stop::Lost(e)) => {
                    retries += 1;
                    if retries > RETRIES {
                        return Err(format!("Download unterbrochen: {e}"));
                    }
                    let _ = events.send(DownloadEvent::Retry { file: f.file, attempt: retries, max: RETRIES });
                    // kurz warten (mit Abbruch), dann fortsetzen
                    let until = Instant::now() + Duration::from_secs(2 * u64::from(retries));
                    while Instant::now() < until {
                        if cancel.load(Ordering::Relaxed) {
                            return Err("Abgebrochen.".into());
                        }
                        std::thread::sleep(Duration::from_millis(100));
                    }
                }
            }
        }
        t.out.flush().map_err(|e| format!("Schreiben fehlgeschlagen: {e}"))?;
        t.progress(true);
        if to_hex(&t.hasher.clone().finalize()) != f.sha256 {
            return Err("Prüfsumme passt nicht – Datei verworfen.".into());
        }
        Ok(())
    })();
    drop(t);
    if let Err(e) = result {
        let _ = std::fs::remove_file(&part);
        return Err(e);
    }
    std::fs::rename(&part, dir.join(f.file)).map_err(|e| format!("Datei nicht abgelegt: {e}"))?;
    let _ = events.send(DownloadEvent::Verified { file: f.file });
    Ok(())
}

#[derive(Deserialize)]
struct Options {
    model: String,
    #[serde(default)]
    prompt: String,
    #[serde(default)]
    gpu: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Transcript {
    text: String,
    /// Dauer samt Start von whisper-cli und Laden des Modells.
    ms: u64,
    /// Hat die Grafikkarte gerechnet?
    gpu: bool,
    /// Die Grafikkarte ist gescheitert, die CPU hat übernommen.
    fallback: bool,
}

/// Eine Aufnahme erkennen. Rohdaten: 4 Byte Länge (little endian), JSON mit Modell, Prompt und
/// Grafikkarte, danach die WAV-Datei (16 kHz mono).
#[tauri::command]
pub async fn transcribe(asr: tauri::State<'_, Asr>, request: Request<'_>) -> Result<Transcript, String> {
    let InvokeBody::Raw(body) = request.body() else {
        return Err("Aufnahme fehlt.".into());
    };
    let (options, wav) = split_body(body)?;
    let bin = asr.bin.clone().ok_or("Die Spracherkennung ist in dieser Version nicht enthalten.")?;
    let (model, vad) = asr.model_paths(&options.model).ok_or_else(|| format!("Modell „{}“ fehlt.", options.model))?;
    let gpu = options.gpu && asr.gpu_available();
    let wav = wav.to_vec();
    let run_opts = RunOptions { prompt: options.prompt, vad, gpu };
    tauri::async_runtime::spawn_blocking(move || run(&bin, &model, &wav, &run_opts))
        .await
        .map_err(|e| format!("Erkennung abgebrochen: {e}"))?
}

fn split_body(body: &[u8]) -> Result<(Options, &[u8]), String> {
    let len: [u8; 4] = body.get(..4).and_then(|b| b.try_into().ok()).ok_or("Aufnahme fehlt.")?;
    let end = 4 + u32::from_le_bytes(len) as usize;
    let json = body.get(4..end).ok_or("Aufnahme unvollständig.")?;
    let wav = &body[end..];
    let options: Options = serde_json::from_slice(json).map_err(|e| format!("Ungültige Anfrage: {e}"))?;
    if wav.len() < 44 || &wav[0..4] != b"RIFF" || &wav[8..12] != b"WAVE" {
        return Err("Keine WAV-Aufnahme.".into());
    }
    if wav.len() > MAX_WAV_BYTES {
        return Err("Aufnahme zu lang.".into());
    }
    if options.prompt.chars().count() > MAX_PROMPT_CHARS || options.prompt.contains('\0') {
        return Err("Ungültiger Prompt.".into());
    }
    Ok((options, wav))
}

static COUNTER: AtomicU64 = AtomicU64::new(0);

/// Temporäre Datei, die beim Verlassen gelöscht wird – auch bei Fehlern.
struct TempFile(PathBuf);

impl Drop for TempFile {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

struct RunOptions {
    prompt: String,
    vad: Option<PathBuf>,
    gpu: bool,
}

fn run(bin: &Path, model: &Path, wav: &[u8], opts: &RunOptions) -> Result<Transcript, String> {
    let name = format!("fence-in-comms-training-{}-{}.wav", std::process::id(), COUNTER.fetch_add(1, Ordering::Relaxed));
    let tmp = TempFile(std::env::temp_dir().join(name));
    std::fs::write(&tmp.0, wav).map_err(|e| format!("Aufnahme nicht zwischengespeichert: {e}"))?;
    let start = Instant::now();
    let (text, used_gpu, fallback) = match whisper(bin, model, &tmp.0, opts, opts.gpu) {
        Ok(text) => (text, opts.gpu, false),
        // Grafikkarte gescheitert (Treiber, Speicher …): dann eben die CPU
        Err(e) if opts.gpu => (whisper(bin, model, &tmp.0, opts, false).map_err(|cpu| format!("{cpu} (Grafikkarte: {e})"))?, false, true),
        Err(e) => return Err(e),
    };
    Ok(Transcript { text, ms: start.elapsed().as_millis() as u64, gpu: used_gpu, fallback })
}

/// Threads für die CPU: alle Kerne bis auf einen, höchstens 8 (mehr bringt bei whisper.cpp kaum etwas).
fn threads() -> usize {
    std::thread::available_parallelism().map(|n| n.get().saturating_sub(1)).unwrap_or(4).clamp(1, 8)
}

fn whisper(bin: &Path, model: &Path, wav: &Path, opts: &RunOptions, gpu: bool) -> Result<String, String> {
    let mut cmd = Command::new(bin);
    cmd.arg("-m").arg(model).arg("-f").arg(wav).args(["-l", "en", "-nt", "-np", "-t"]).arg(threads().to_string());
    if !opts.prompt.is_empty() {
        cmd.arg("--prompt").arg(&opts.prompt);
    }
    if let Some(vad) = &opts.vad {
        cmd.arg("--vad").arg("-vm").arg(vad);
    }
    if !gpu {
        cmd.arg("-ng");
    }
    if let Some(dir) = bin.parent() {
        cmd.current_dir(dir);
    }
    cmd.stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let mut child = cmd.spawn().map_err(|e| format!("whisper-cli startet nicht: {e}"))?;
    let stdout = drain(child.stdout.take());
    let stderr = drain(child.stderr.take());
    let deadline = Instant::now() + TIMEOUT;
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if Instant::now() < deadline => std::thread::sleep(Duration::from_millis(10)),
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Erkennung dauert zu lange – abgebrochen.".into());
            }
            Err(e) => return Err(format!("whisper-cli: {e}")),
        }
    };
    let out = stdout.join().unwrap_or_default();
    let err = stderr.join().unwrap_or_default();
    if !status.success() {
        let last = err.lines().rev().find(|l| !l.trim().is_empty()).unwrap_or("").trim();
        return Err(format!("whisper-cli beendet ({status}): {last}"));
    }
    Ok(out.split_whitespace().collect::<Vec<_>>().join(" "))
}

/// Ausgabe in einem eigenen Thread lesen, damit eine volle Pipe den Prozess nie blockiert.
fn drain<R: Read + Send + 'static>(pipe: Option<R>) -> std::thread::JoinHandle<String> {
    std::thread::spawn(move || {
        let mut bytes = Vec::new();
        if let Some(mut p) = pipe {
            let _ = p.read_to_end(&mut bytes);
        }
        String::from_utf8_lossy(&bytes).into_owned()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn body(json: &str, wav: &[u8]) -> Vec<u8> {
        let mut b = (json.len() as u32).to_le_bytes().to_vec();
        b.extend_from_slice(json.as_bytes());
        b.extend_from_slice(wav);
        b
    }

    fn wav(len: usize) -> Vec<u8> {
        let mut w = vec![0u8; len];
        w[0..4].copy_from_slice(b"RIFF");
        w[8..12].copy_from_slice(b"WAVE");
        w
    }

    #[test]
    fn anfrage_wird_zerlegt() {
        let b = body(r#"{"model":"small.en","prompt":"Darkstar.","gpu":true}"#, &wav(100));
        let (o, w) = split_body(&b).unwrap();
        assert_eq!((o.model.as_str(), o.prompt.as_str(), o.gpu, w.len()), ("small.en", "Darkstar.", true, 100));
    }

    #[test]
    fn pruefsumme_als_hex() {
        assert_eq!(to_hex(&Sha256::digest(b"abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    #[test]
    fn nachladen_nur_von_festen_adressen() {
        for f in MODELS.iter().chain(std::iter::once(&VAD)) {
            assert_eq!(f.sha256.len(), 64, "{}", f.id);
            assert!(f.sha256.chars().all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase()), "{}", f.id);
            // Hugging Face, fester Commit (40 Hex-Zeichen), Dateiname am Ende
            let rest = f.url.strip_prefix("https://huggingface.co/").expect("Quelle");
            let parts: Vec<&str> = rest.split('/').collect();
            assert_eq!(parts.len(), 5, "{}", f.url);
            assert_eq!(parts[2], "resolve");
            assert!(parts[3].len() == 40 && parts[3].chars().all(|c| c.is_ascii_hexdigit()), "{}", f.url);
            assert_eq!(parts[4], f.file);
        }
        // large-v3-turbo bringt das VAD-Modell mit
        let turbo = MODELS.iter().find(|m| m.id == "large-v3-turbo").unwrap();
        assert_eq!(files_of(turbo).map(|f| f.file).collect::<Vec<_>>(), [turbo.file, VAD.file]);
    }

    /// Lokaler Server für zwei Anfragen: Die erste kündigt die ganze Datei an, schickt aber nur die
    /// Hälfte und trennt. Die zweite beantwortet er mit dem Rest (206) – oder, ohne Range-Unterstützung,
    /// noch einmal mit der ganzen Datei (200).
    fn flaky_server(data: Vec<u8>, honor_range: bool) -> (String, std::thread::JoinHandle<Vec<String>>) {
        use std::net::TcpListener;
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let url = format!("http://{}/modell.bin", listener.local_addr().unwrap());
        let handle = std::thread::spawn(move || {
            let read_request = |s: &mut std::net::TcpStream| {
                let mut req = Vec::new();
                let mut byte = [0u8; 1];
                while !req.ends_with(b"\r\n\r\n") && s.read(&mut byte).unwrap() == 1 {
                    req.push(byte[0]);
                }
                String::from_utf8(req).unwrap()
            };
            let mut requests = Vec::new();
            let (mut s, _) = listener.accept().unwrap();
            requests.push(read_request(&mut s));
            write!(s, "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", data.len()).unwrap();
            s.write_all(&data[..data.len() / 2]).unwrap();
            drop(s);
            let (mut s, _) = listener.accept().unwrap();
            let req = read_request(&mut s);
            let from: usize = req
                .lines()
                .find_map(|l| l.to_ascii_lowercase().strip_prefix("range: bytes=").map(|r| r.trim_end_matches('-').parse().unwrap()))
                .unwrap_or(0);
            requests.push(req);
            if honor_range {
                let rest = &data[from..];
                write!(s, "HTTP/1.1 206 Partial Content\r\nContent-Range: bytes {from}-{}/{}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", data.len() - 1, data.len(), rest.len()).unwrap();
                s.write_all(rest).unwrap();
            } else {
                write!(s, "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", data.len()).unwrap();
                s.write_all(&data).unwrap();
            }
            requests
        });
        (url, handle)
    }

    fn resume_case(honor_range: bool) {
        let data: Vec<u8> = (0..300_000u32).map(|i| (i * 7 % 251) as u8).collect();
        let (url, server) = flaky_server(data.clone(), honor_range);
        let leak = |s: String| -> &'static str { Box::leak(s.into_boxed_str()) };
        let f: &'static ModelFile = Box::leak(Box::new(ModelFile {
            id: "test",
            file: "test-modell.bin",
            size: data.len() as u64,
            sha256: leak(to_hex(&Sha256::digest(&data))),
            url: leak(url),
            vad: false,
        }));
        let dir = std::env::temp_dir().join(format!("fence-in-comms-training-asr-test-{}-{honor_range}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        let events = Channel::new(|_| Ok(()));
        fetch(f, &dir, &AtomicBool::new(false), &events).unwrap();
        assert_eq!(std::fs::read(dir.join(f.file)).unwrap(), data);
        assert!(!dir.join("test-modell.bin.part").exists());
        let requests = server.join().unwrap();
        assert!(!requests[0].to_ascii_lowercase().contains("range:"));
        assert!(requests[1].to_ascii_lowercase().contains(&format!("range: bytes={}-", data.len() / 2)));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn abgerissener_download_geht_an_derselben_stelle_weiter() {
        resume_case(true);
    }

    #[test]
    fn ohne_teilstuecke_liest_er_sauber_von_vorn() {
        resume_case(false);
    }

    #[test]
    fn pfade_ohne_praefix_anzeigen() {
        assert_eq!(shown(Path::new(r"\\?\C:\Programme\Fence In Comms Training\modelle")), r"C:\Programme\Fence In Comms Training\modelle");
        assert_eq!(shown(Path::new(r"C:\daten\modelle")), r"C:\daten\modelle");
        assert_eq!(shown(Path::new(r"\\?\UNC\server\freigabe")), r"\\?\UNC\server\freigabe");
    }

    #[test]
    fn kaputte_anfragen_werden_abgelehnt() {
        assert!(split_body(&[1, 0]).is_err());
        assert!(split_body(&body(r#"{"model":"small.en"}"#, b"keine wav-datei, sondern text ...............")).is_err());
        assert!(split_body(&body("{kein json", &wav(100))).is_err());
        assert!(split_body(&body(r#"{"model":"small.en"}"#, &wav(MAX_WAV_BYTES + 1))).is_err());
        let long = format!(r#"{{"model":"small.en","prompt":"{}"}}"#, "x".repeat(MAX_PROMPT_CHARS + 1));
        assert!(split_body(&body(&long, &wav(100))).is_err());
        // Länge zeigt über das Ende hinaus
        let mut b = body(r#"{"model":"small.en"}"#, &wav(100));
        b[0..4].copy_from_slice(&u32::MAX.to_le_bytes());
        assert!(split_body(&b).is_err());
    }
}
