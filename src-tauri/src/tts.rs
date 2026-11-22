//! Sprachausgabe (Kokoro-82M): Dateien auf Klick laden und der Seite reichen. Gerechnet wird in der
//! Seite (onnxruntime-web im Worker), Rust lädt nur und liest.
//!
//! - Dateien liegen getrennt von der App unter `%LOCALAPPDATA%\<Kennung>\modelle\sprachausgabe`
//!   (überstehen Updates und Deinstallation). Beim Entwickeln zusätzlich `.asr\tts`.
//! - Nur die festen Dateien von unten, von der Originalquelle (Hugging Face bzw. GitHub, fester
//!   Commit), mit Größe und SHA-256 geprüft – derselbe Download wie bei den Whisper-Modellen.
//! - Dieselbe Liste steht in `src/platform/tts-config.ts`; ein Vitest-Test prüft, dass beide passen.

use crate::asr::{fetch, DownloadEvent, Downloads, ModelFile, Slot};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::ipc::{Channel, Response};
use tauri::Manager;

macro_rules! file {
    ($name:literal, $size:literal, $sha:literal, $url:literal) => {
        ModelFile { id: $name, file: $name, size: $size, sha256: $sha, url: $url, vad: false }
    };
}

/// Modell, Stimmen und Aussprache-Lexika – sonst lädt und liest die App hier nichts.
pub(crate) static TTS_FILES: &[ModelFile] = &[
    file!("kokoro-v1.0-fp32.onnx", 325_532_232, "8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/onnx/model.onnx"),
    file!("kokoro-af_heart.bin", 522_240, "d583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/af_heart.bin"),
    file!("kokoro-af_bella.bin", 522_240, "f69d836209b78eb8c66e75e3cda491e26ea838a3674257e9d4e5703cbaf55c8b", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/af_bella.bin"),
    file!("kokoro-am_michael.bin", 522_240, "1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/am_michael.bin"),
    file!("kokoro-am_fenrir.bin", 522_240, "c27989f741f7ee34d273a39d8a595cc0837d35f5ced9a29b7cc162614616df43", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/am_fenrir.bin"),
    file!("kokoro-am_puck.bin", 522_240, "fcf73c989033e9233e0b98713eca600c8c74dcc1614b37009d5450ff4a2274a0", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/am_puck.bin"),
    file!("kokoro-bf_emma.bin", 522_240, "669fe0647f9dd04fcab92f1439a40eeb4c8b4ab1f82e4996fe3d918ce4a63b73", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/bf_emma.bin"),
    file!("kokoro-bm_george.bin", 522_240, "c4b235a4c1f2cd3b939fed08b899ce9385638b763f7b73a59616c4fc9bd6c9bc", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/bm_george.bin"),
    file!("kokoro-bm_fable.bin", 522_240, "f889083196807b4adb15e9204252165f503b8d33d3982e681c52443c49d798f1", "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/voices/bm_fable.bin"),
    file!("misaki-us_gold.json", 3_000_469, "dc414872a49a28ae6c141463d502fd945f3b2fde040484fdc47d00cc4612686f", "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data/us_gold.json"),
    file!("misaki-us_silver.json", 3_099_517, "de8f67be911bb6c659187b4a65fd966b6a30e56350e0f790d763210b053ac475", "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data/us_silver.json"),
    file!("misaki-gb_gold.json", 2_838_552, "29e62f4b60261c88f7f3c2c7811ca3825978948090b72d2b27d565b729282f71", "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data/gb_gold.json"),
    file!("misaki-gb_silver.json", 3_663_898, "48131e2d92ccc41655f4543e87e0f938e71463eb5a54be7f0693bb712ebb6bce", "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data/gb_silver.json"),
];

pub struct Tts {
    /// Hier sucht die App; der erste ist der eigene Ordner (hierhin lädt sie).
    dirs: Vec<PathBuf>,
}

impl Tts {
    pub fn new(app: &tauri::AppHandle) -> Self {
        let user = app.path().app_local_data_dir().map(|d| d.join("modelle").join("sprachausgabe")).unwrap_or_else(|_| PathBuf::from("sprachausgabe"));
        #[allow(unused_mut)]
        let mut dirs = vec![user];
        #[cfg(debug_assertions)]
        if let Some(asr) = crate::asr::dev_asr_dir() {
            dirs.push(asr.join("tts"));
        }
        Self { dirs }
    }

    fn find(&self, f: &ModelFile) -> Option<PathBuf> {
        self.dirs.iter().map(|d| d.join(f.file)).find(|p| p.metadata().is_ok_and(|md| md.is_file() && md.len() == f.size))
    }
}

/// Welche Dateien fehlen noch? (Leer = Sprachausgabe bereit.)
#[tauri::command]
pub fn tts_missing(tts: tauri::State<Tts>) -> Vec<&'static str> {
    TTS_FILES.iter().filter(|f| tts.find(f).is_none()).map(|f| f.file).collect()
}

/// Alle fehlenden Dateien in den eigenen Ordner laden. Abbrechen über `cancel_download`.
#[tauri::command]
pub async fn download_tts(tts: tauri::State<'_, Tts>, downloads: tauri::State<'_, Downloads>, on_event: Channel<DownloadEvent>) -> Result<(), String> {
    let todo: Vec<&'static ModelFile> = TTS_FILES.iter().filter(|f| tts.find(f).is_none()).collect();
    let dir = tts.dirs[0].clone();
    let cancel = Arc::new(AtomicBool::new(false));
    let _slot = Slot::claim(&downloads, cancel.clone())?;
    tauri::async_runtime::spawn_blocking(move || todo.into_iter().try_for_each(|f| fetch(f, &dir, &cancel, &on_event)))
        .await
        .map_err(|e| format!("Download abgebrochen: {e}"))?
}

/// Eine Datei der Sprachausgabe als Bytes (nur Namen aus der festen Liste, keine Pfade).
#[tauri::command]
pub async fn read_tts_file(tts: tauri::State<'_, Tts>, name: String) -> Result<Response, String> {
    let f = TTS_FILES.iter().find(|f| f.file == name).ok_or("Unbekannte Datei.")?;
    let path = tts.find(f).ok_or_else(|| format!("{} fehlt.", f.file))?;
    let bytes = tauri::async_runtime::spawn_blocking(move || std::fs::read(path)).await.map_err(|e| e.to_string())?.map_err(|e| format!("{} nicht lesbar: {e}", f.file))?;
    Ok(Response::new(bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    // Hugging Face (onnx-community) und GitHub (misaki), je auf festem Commit
    const HF: &str = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231";
    const MISAKI: &str = "https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data";

    #[test]
    fn nur_feste_dateien_von_festen_quellen() {
        for f in TTS_FILES {
            assert_eq!(f.sha256.len(), 64, "{}", f.file);
            assert!(f.sha256.chars().all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase()), "{}", f.file);
            let rest = f.url.strip_prefix(HF).or_else(|| f.url.strip_prefix(MISAKI)).unwrap_or_else(|| panic!("fremde Quelle: {}", f.url));
            assert!(rest.starts_with('/') && !rest.contains(".."), "{}", f.url);
            assert!(f.file.chars().all(|c| c.is_ascii_alphanumeric() || "._-".contains(c)), "{}", f.file);
        }
        let names: std::collections::HashSet<_> = TTS_FILES.iter().map(|f| f.file).collect();
        assert_eq!(names.len(), TTS_FILES.len());
    }
}
