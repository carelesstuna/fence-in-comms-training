//! Desktop-Hülle von Fence In Comms Training: ein Fenster mit der Web-App, dazu ein Datei-Spiegel des
//! Fortschritts und die Spracherkennung mit whisper.cpp (`asr.rs`). localStorage im WebView2 bleibt
//! der Arbeitsspeicher; die Datei übersteht ein zurückgesetztes WebView2-Profil und eine
//! Neuinstallation.
//!
//! Ablage: `%APPDATA%\<Kennung>\fortschritt.json`.

mod asr;
mod tts;

use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tauri::webview::{NewWindowResponse, PermissionKind, PermissionResponse};
use tauri::{Manager, Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

const MIRROR_FILE: &str = "fortschritt.json";
const MIRROR_BACKUP: &str = "fortschritt.vorher.json";
/** Mehr ist kein Fortschritt mehr, sondern ein Fehler. */
const MAX_MIRROR_BYTES: usize = 20 * 1024 * 1024;

struct DataDir(PathBuf);

fn data_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("daten"))
}

/// Die eigene Seite der App (nie eine fremde – das Fenster navigiert nicht weg).
fn is_app_page(webview: &tauri::Webview) -> bool {
    let Ok(url) = webview.url() else { return false };
    match url.host_str() {
        Some("tauri.localhost") => true,
        // `tauri dev` lädt vom Vite-Server
        Some("localhost") => cfg!(debug_assertions),
        _ => false,
    }
}

/// Erst in eine temporäre Datei schreiben, dann umbenennen: Ein Absturz hinterlässt nie eine halbe Datei.
fn write_atomic(dir: &Path, data: &str) -> std::io::Result<()> {
    fs::create_dir_all(dir)?;
    let target = dir.join(MIRROR_FILE);
    let tmp = dir.join(format!("{MIRROR_FILE}.tmp"));
    fs::write(&tmp, data)?;
    if target.is_file() {
        let _ = fs::copy(&target, dir.join(MIRROR_BACKUP));
    }
    fs::rename(&tmp, &target)
}

/// Gespiegelten Stand lesen; `None`, wenn es noch keinen gibt.
#[tauri::command]
fn read_progress(dir: tauri::State<DataDir>) -> Result<Option<String>, String> {
    match fs::read_to_string(dir.0.join(MIRROR_FILE)) {
        Ok(text) => Ok(Some(text)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("Fortschritt nicht lesbar: {e}")),
    }
}

/// Stand spiegeln (der Inhalt kommt fertig als JSON-Text aus der App).
#[tauri::command]
fn write_progress(dir: tauri::State<DataDir>, data: String) -> Result<(), String> {
    if data.len() > MAX_MIRROR_BYTES {
        return Err("Fortschritt zu groß".into());
    }
    write_atomic(&dir.0, &data).map_err(|e| format!("Fortschritt nicht gespeichert: {e}"))
}

/// Wo der Spiegel liegt (für die Anzeige im Profil).
#[tauri::command]
fn progress_location(dir: tauri::State<DataDir>) -> String {
    dir.0.join(MIRROR_FILE).display().to_string()
}

/// Nur Seiten der App selbst dürfen in einem neuen Fenster aufgehen (Dev-Server `localhost`, fertige App
/// `tauri.localhost`). Fremde Adressen bleiben zu: Die App hat keine Rechte, Webseiten anzuzeigen.
fn is_app_url(url: &Url) -> bool {
    let host_ok = match url.host_str() {
        Some(host) => host == "localhost" || host == "127.0.0.1" || host.ends_with(".localhost"),
        None => false,
    };
    matches!(url.scheme(), "http" | "https" | "tauri") && host_ok
}

/// Ist das eine Webadresse (`http`/`https`), die der Systembrowser öffnen darf?
fn is_web_url(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
}

/// Externe Links (Quellenangaben in Lektionen und Hangar-Karten) gehen in den Systembrowser. Nur `http` und
/// `https`: `file:`, `javascript:` und eigene Protokolle bleiben abgelehnt. Die Seite selbst hat dafür keine
/// Rechte (`capabilities/default.json` gibt nichts vom Opener-Plugin frei), nur dieser Handler öffnet.
fn open_external(app: &tauri::AppHandle, url: &Url) {
    if !is_web_url(url) {
        return;
    }
    if let Err(e) = app.opener().open_url(url.as_str(), None::<&str>) {
        eprintln!("Fence In Comms Training: Link nicht geöffnet: {e}");
    }
}

/// Das Hauptfenster aus `tauri.conf.json` (dort `create: false`) – mit einem Handler für neue Fenster.
/// Ohne ihn lehnt die Webview jedes `target="_blank"` und `window.open` still ab. Links wie „Mehr dazu“
/// öffnen in der Desktop-App so in einem zweiten Fenster, und die Lektion im Hauptfenster bleibt stehen.
/// Externe Adressen öffnen im Systembrowser.
fn create_main_window(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let config = app.config().app.windows.first().cloned().ok_or("tauri.conf.json enthält kein Fenster")?;
    let handle = app.handle().clone();
    let opened = Arc::new(AtomicUsize::new(0));
    let base = config.clone();
    WebviewWindowBuilder::from_config(app.handle(), &config)?
        .on_new_window(move |url, features| {
            if !is_app_url(&url) {
                open_external(&handle, &url);
                return NewWindowResponse::Deny;
            }
            // Gleiche Gestalt wie das Hauptfenster; die Webview lädt die angeforderte Adresse selbst
            let mut tab = base.clone();
            tab.label = format!("tab-{}", opened.fetch_add(1, Ordering::Relaxed) + 1);
            tab.url = WebviewUrl::External("about:blank".parse().expect("about:blank ist eine gültige Adresse"));
            tab.center = false;
            let window = WebviewWindowBuilder::from_config(&handle, &tab).and_then(|b| b.window_features(features).build());
            match window {
                Ok(window) => NewWindowResponse::Create { window },
                Err(e) => {
                    eprintln!("Fence In Comms Training: neues Fenster nicht geöffnet: {e}");
                    NewWindowResponse::Deny
                }
            }
        })
        .build()?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(DataDir(data_dir(app.handle())));
            app.manage(asr::Asr::new(app.handle()));
            app.manage(asr::Downloads::default());
            app.manage(tts::Tts::new(app.handle()));
            create_main_window(app)
        })
        // Mikrofon für die eigene Seite ohne Rückfrage von WebView2 – geöffnet wird es ohnehin nur, wenn
        // man sprechen will. Alles andere wie gewohnt.
        .on_permission_request(|webview, kind| match kind {
            PermissionKind::Microphone if is_app_page(&webview) => PermissionResponse::Allow,
            _ => PermissionResponse::Default,
        })
        .invoke_handler(tauri::generate_handler![
            read_progress,
            write_progress,
            progress_location,
            asr::asr_status,
            asr::transcribe,
            asr::open_model_dir,
            asr::download_model,
            asr::cancel_download,
            tts::tts_missing,
            tts::download_tts,
            tts::read_tts_file
        ])
        .run(tauri::generate_context!())
        .expect("Fence In Comms Training konnte nicht starten");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn url(s: &str) -> Url {
        s.parse().expect("gültige Adresse")
    }

    #[test]
    fn app_adressen_sind_nur_localhost_und_tauri() {
        for ok in ["http://localhost:5185/#/glossary", "http://tauri.localhost/", "https://tauri.localhost/#/wissen/atc-stellen", "tauri://localhost/"] {
            assert!(is_app_url(&url(ok)), "{ok}");
        }
        for no in ["https://example.org/", "http://localhost.example.org/", "file:///C:/Windows/notepad.exe", "javascript:alert(1)"] {
            assert!(!is_app_url(&url(no)), "{no}");
        }
    }

    #[test]
    fn nur_http_und_https_gehen_in_den_systembrowser() {
        for ok in ["https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html", "http://example.org/"] {
            assert!(is_web_url(&url(ok)), "{ok}");
        }
        for no in ["file:///C:/Windows/notepad.exe", "javascript:alert(1)", "mailto:a@example.org", "ms-settings:privacy", "tauri://localhost/", "ftp://example.org/"] {
            assert!(!is_web_url(&url(no)), "{no}");
        }
    }
}
