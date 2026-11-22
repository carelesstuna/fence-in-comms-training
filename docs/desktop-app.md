# Desktop-App (Tauri 2)

Umsetzung von Phase 2 und 3 aus [`konzept-auslieferung-und-sprache.md`](konzept-auslieferung-und-sprache.md):
Tauri als dünne Hülle um die Web-App, dazu die Spracherkennung mit whisper.cpp (`whisper-cli`). Die
Browser-Version bleibt unverändert lauffähig (`npm run dev`, `npm run build`); dort erkennt weiter
transformers.js.

## Bauen

Einmalig: Rust stable (MSVC) und die MSVC-Build-Tools mit Windows-SDK. WebView2 ist unter Windows 10/11
vorhanden.

```
npm run desktop:dev     # Fenster mit Hot Reload (Vite auf Port 5185)
npm run desktop:build   # Release: NSIS-Installer + SHA256SUMS.txt
```

- Ergebnis unter `src-tauri/target/release/bundle/`:
  - `nsis/Fence In Comms Training_<Version>_x64-setup.exe`: Installer pro Benutzer, ohne Admin (rund 13 MB)
  - `SHA256SUMS.txt`
- **Ausgeliefert wird nur der Installer** (Entscheidung vom 21.11.2026). Eine Zip- bzw. portable Version
  gab es zwischendurch; sie ist entfallen, weil sie nicht gebraucht wird.
- Beim ersten Bauen lädt Cargo die Rust-Crates von crates.io, und der Tauri-Bundler lädt einmalig die
  NSIS-Werkzeuge nach `%LOCALAPPDATA%\tauri`.
- **Spracherkennung fürs Paket:** `desktop:build` ruft zuerst `scripts/stage-asr.ts` auf. Das legt
  `whisper-cli` mit seinen DLLs und die Lizenzangaben nach `src-tauri/asr-bundle/` (nicht in Git).
  Voraussetzung: am besten die selbst gebaute Vulkan-Version in `.asr` (siehe
  [`spracherkennung.md`](spracherkennung.md)); ohne sie kommt das CPU-Release ins Paket
  (`npm run fetch-asr`), das die Visual-C++-Laufzeit braucht.
- **Kein Modell im Installer:** Der Installer bleibt klein (auch jedes Update), die App lädt das Modell
  beim ersten Sprechen auf Klick nach. Ohne Internet legt man die Modelldatei selbst in den
  Modell-Ordner.
- `tauri.release.json` ergänzt beim Release-Build die Ressourcen `LICENSES.txt` und `whisper\`. Sie
  entstehen erst beim Build, deshalb stehen sie nicht in `tauri.conf.json`, sonst scheitert
  `desktop:dev`. Beim Entwickeln (`desktop:dev`) findet die App whisper.cpp und die Modelle direkt in
  `.asr`.

## Release über GitHub Actions

- `.github/workflows/checks.yml`: bei jedem Push auf `main` und jedem Pull Request Typprüfung, Lint,
  Inhaltsprüfung und Unit-Tests (Ubuntu).
- `.github/workflows/release.yml` (Windows):
  - Jeder Push auf `main` baut den Installer zur Probe; er liegt 30 Tage als Artefakt am Workflow-Lauf.
  - Ein Versions-Tag `v<Version>` (muss zu `version` in `tauri.conf.json` und `package.json` passen) baut
    ebenso, benennt den Installer ohne Leerzeichen (`Fence-In-Comms-Training_<Version>_x64-setup.exe`),
    schreibt `SHA256SUMS.txt`, hängt eine Herkunftsbescheinigung an (`gh attestation verify`) und legt
    einen **Release-Entwurf** an. Veröffentlicht wird von Hand auf GitHub; Text aus
    `.github/release-notes.md`.
  - whisper.cpp v1.9.5 baut der Workflow selbst mit Vulkan (Vulkan SDK per Prüfsumme geprüft, statische
    C-Laufzeit, ohne OpenMP) und hebt das Ergebnis im Cache auf; ein Schritt bricht ab, wenn die Dateien
    doch die Visual-C++-Laufzeit brauchen.
- Ablauf für eine neue Version: `version` in `tauri.conf.json` und `package.json` erhöhen, committen,
  `npm run export-public -- <öffentliches Repo>`, dort committen, pushen, dann `git tag v<Version>` und
  `git push origin v<Version>`.

## Festlegungen, die sich nicht mehr ändern dürfen

- **App-Kennung `io.github.carelesstuna.fence-in-comms-training`.** Sie bestimmt den Datenordner von WebView2 (localStorage)
  und den Ordner der Spiegel-Datei. Bis zur ersten Veröffentlichung lässt sie sich noch ändern, danach nicht mehr.
- **`useHttpsScheme: false`.** Die App läuft unter `http://tauri.localhost`, das gilt als sicherer
  Kontext (Mikrofon erlaubt). Wer das umschaltet, verliert den localStorage.

## Fortschritt

- localStorage im WebView2 bleibt der Arbeitsspeicher.
- Jede Änderung geht gebündelt (400 ms) zusätzlich in eine Datei:
  - `%APPDATA%\io.github.carelesstuna.fence-in-comms-training\fortschritt.json`
  - Die vorige Fassung bleibt als `fortschritt.vorher.json` liegen.
- Ist localStorage beim Start leer, kommt der Stand aus der Datei zurück. Geprüft wird er danach wie
  jeder gespeicherte Stand.
- Code: `src/state/persisted.ts` (Abschnitt Datei-Spiegel, getestet), `src/platform/desktop.ts`,
  `src-tauri/src/lib.rs`. `@tauri-apps/api` wird nur in der Desktop-App geladen.

## Spracherkennung

- **`whisper-cli` pro Funkspruch** (`src-tauri/src/asr.rs`), kein `whisper-server` (offener Port ohne
  Zugangsschutz). Die App schickt die Aufnahme als WAV (16 kHz mono) samt Prompt; Rust legt sie kurz in
  eine temporäre Datei, startet `whisper-cli` ohne Konsolenfenster und löscht die Datei danach.
- **Programmordner:** `whisper\` (exe und DLLs nebeneinander).
- **Modell-Ordner**, getrennt von der App, übersteht Updates und Deinstallation:
  `%LOCALAPPDATA%\io.github.carelesstuna.fence-in-comms-training\modelle`. Die App kennt nur feste Dateien (Name und genaue
  Größe): small.en, base.en, large-v3-turbo (braucht dazu `ggml-silero-v6.2.0.bin`).
- **Nachladen auf Klick:** Fehlt das Modell, bieten Profil → Sprechen und das Sprechfeld „Laden
  (190 MB von huggingface.co)“ an, mit Fortschritt und Abbrechen. Quelle sind die ggml-Modelle des
  whisper.cpp-Autors auf Hugging Face, auf einem festen Stand (Commit). Rust lädt in eine `.part`-Datei,
  prüft Größe und SHA-256 und benennt erst dann um; sonst wird die Datei verworfen. Reißt die
  Verbindung ab oder hängt sie 30 s, setzt die App an derselben Stelle fort (HTTP-Range, bis zu fünfmal;
  ohne Range-Unterstützung des Servers von vorn). Die App geht nur dann ins Internet. Von Hand in den
  Ordner legen geht weiterhin.
- **Grafikkarte:** Die mitgelieferte Vulkan-Version rechnet auf der Grafikkarte; scheitert sie, rechnet
  von selbst die CPU. Ausschalten: Profil → Sprechen → „Grafikkarte nutzen“.
- **Aufwärmen:** Beim Einschalten des Sprechmodus erkennt die App eine halbe Sekunde Stille. Das prüft,
  dass alles läuft, und erledigt das einmalige Übersetzen der Shader (beim allerersten Mal rund 12 s).
- **Laufzeit:** whisper.cpp ist statisch gegen die C-Laufzeit gelinkt und ohne OpenMP gebaut; die
  Visual-C++-Laufzeit ist nicht nötig. `vulkan-1.dll` kommt mit dem Grafiktreiber; fehlt sie, rechnet
  die CPU.
- **Mikrofon:** Die App erteilt die Freigabe für die eigene Seite selbst (`on_permission_request`),
  WebView2 fragt also nicht. Geöffnet wird das Mikrofon weiterhin nur, wenn man sprechen will.

## Sicherheit

- Strenge CSP: nur eigene Quellen, dazu `wasm-unsafe-eval` und `blob:` für die Spracherkennung im
  Browser-Modus, IPC über `ipc:`/`http://ipc.localhost`.
- COOP/COEP über `app.security.headers`, damit onnxruntime mehrere Threads nutzen kann.
- Links mit `target="_blank"` erreichen den Handler für neue Fenster nicht von selbst (in der laufenden App mit echten
  Mausklicks geprüft), `window.open` aus einer Nutzergeste dagegen schon. Darum fängt `setupBlankLinks`
  (`src/platform/desktop.ts`, nur in der Desktop-App) normale Klicks auf `http`/`https`-Links ab und ruft `window.open` auf.
- Ein Plugin: `tauri-plugin-opener`, nur für externe Links (`target="_blank"` mit `http`/`https`, etwa Quellenangaben). Sie
  öffnen im Systembrowser, aufgerufen vom Handler für neue Fenster in `lib.rs`. Die Seite selbst bekommt keine Rechte vom
  Plugin (`capabilities/default.json` enthält nur `core:default`); andere Adressen (`file:`, `javascript:` …) bleiben abgelehnt.
  Dazu elf eigene Befehle: Spiegel lesen, Spiegel schreiben, Speicherort anzeigen,
  Status der Spracherkennung, Erkennen, Modell-Ordner öffnen, Modell laden, Laden abbrechen,
  dazu für die Sprachausgabe (`tts.rs`): fehlende Dateien, Dateien laden, eine Datei lesen.
- `download_tts` und `read_tts_file` kennen nur die feste Dateiliste der Sprachausgabe (Kokoro, Stimmen,
  misaki-Lexika; Adresse, Größe, SHA-256 im Programm). Gelesen wird nur aus dem eigenen Ordner
  `modelle\sprachausgabe` (beim Entwickeln auch `.asr\tts`), keine Pfade von der Seite. Der Download teilt sich
  den Platz mit dem der Spracherkennung, es lädt immer nur einer. Siehe [`audio.md`](audio.md).
- `download_model` nimmt nur eine Modell-Kennung aus der festen Liste; Adresse, Größe und SHA-256 stehen
  im Programm (`asr.rs`). HTTPS mit rustls und den Mozilla-Wurzelzertifikaten (`ureq`, `webpki-roots`).
  Es lädt immer nur ein Download, eine hängende Verbindung bricht nach 30 s ohne Daten ab.
- `transcribe` nimmt nur WAV-Daten (höchstens 4 MB), einen Prompt (höchstens 2000 Zeichen) und eine
  Modell-Kennung aus einer festen Liste – keine Pfade. `whisper-cli` läuft ohne Shell, mit
  Zeitlimit (90 s).
- Mikrofon-Freigabe nur für `tauri.localhost` (beim Entwickeln `localhost`).
- Links auf der Seite „Lizenzen“ sind reiner Text, damit das App-Fenster nicht auf fremde Seiten navigiert.

## Lizenzen

- `scripts/license-plugin.ts` erzeugt beim Build `licenses.json` (für die Seite „Lizenzen“) und
  `LICENSES.txt`. Darin stehen genau die npm-Pakete, die im Bundle landen. Beim Bauen über Tauri kommen
  die Rust-Crates dazu (`cargo metadata`, nur normale Abhängigkeiten) und die Spracherkennung aus
  `asr-bundle/licenses.json`: whisper.cpp, die Whisper-Gewichte (OpenAI, MIT) und die Vulkan-Header.
- Pakete ohne eigene Lizenzdatei (onnxruntime-web, webview2-com samt fest gelinktem WebView2-Loader,
  alloc-stdlib, selectors) bekommen ihre Texte aus `third-party-licenses/` (Zuordnung: `EXTRA_TEXTS`).
  Bleibt ein Paket ohne Text, bricht der Build ab.
- Eigene Lizenz: `LICENSE` (Code, MIT), `LICENSE-CONTENT.md` (Inhalte, CC BY-SA 4.0) und `LEGAL.md`
  (Hinweise zu Marken, Simulation, Haftung, Datenschutz). Die Lizenzseite des Installers zeigt
  `dist/INSTALLER-LIZENZ.txt`, die das Plugin beim Tauri-Build aus `LEGAL.md` und `LICENSE` erzeugt.

## Geprüft am 21.11.2026 (Release-Build, über das DevTools-Protokoll von WebView2)

- Start unter `http://tauri.localhost`: sicherer Kontext, `crossOriginIsolated`, keine CSP-Verstöße.
- Spiegel unter `%APPDATA%\io.github.carelesstuna.fence-in-comms-training\`. (Die damals geprüfte portable Version ist später
  entfallen.)
- localStorage gelöscht, App neu gestartet: Der Stand kommt aus der Datei zurück (Onboarding übersprungen).
- Export über `<a download>` funktioniert im WebView2. Die Datei landet ohne Nachfrage im Download-Ordner
  von Windows; ein Dialog-Plugin ist nicht nötig.
- Seite „Lizenzen“ mit npm-Paketen und Rust-Crates.
- **Installer** (still mit `/S`):
  - Installiert ohne Admin nach `%LOCALAPPDATA%\Fence In Comms Training` (exe, `LICENSES.txt`,
    `uninstall.exe`), mit Eintrag unter HKCU, Verknüpfung im Startmenü und auf dem Desktop.
  - Deinstallieren entfernt Programm, Verknüpfungen und Eintrag. Spiegel-Datei und WebView2-Profil
    bleiben, solange man „App-Daten löschen“ nicht anhakt.
  - Neuinstallation nach gelöschtem WebView2-Profil: Der Fortschritt kommt aus der Spiegel-Datei zurück.
- Nicht geprüft: Start auf einem Rechner ohne Entwicklungswerkzeuge, SmartScreen bei einem Download aus
  dem Internet.

## Geprüft am 21.11.2026: Spracherkennung (Phase 3)

Release-Build mit Vulkan-whisper. Geprüft über das DevTools-Protokoll mit echten Aufnahmen der
Messreihe (Radeon RX 9070 XT). Der erste Stand hatte small.en noch im Installer (181,5 MiB); seit dem
Nachladen ist der Installer ohne Modell 13,2 MiB groß.

- **Erkennen:** whisper aus `whisper\` im Programmordner, Grafikkarte. Ein Funkspruch dauert rund 1 s
  (App → Rust → whisper-cli → zurück), die Übergabe kostet etwa 5 ms. (Geprüft damals mit der
  inzwischen entfallenen Zip-Version, dieselbe exe.)
- **Oberfläche:** Profil → Sprechen „jetzt laden“ → „bereit (whisper.cpp small.en · Grafikkarte)“ nach
  1,0 s samt Aufwärmen. `@tauri-apps/api` lädt unter der CSP nach.
- **Installer:** legt `whisper\` (14 Dateien) ins Programmverzeichnis; die installierte App erkennt warm
  in 0,9 s. Ein Modell im eigenen Modell-Ordner (base.en) wird gefunden und genutzt.
  Deinstallieren entfernt das Programm; Fortschritt, WebView2-Profil und eigener Modell-Ordner bleiben.
- **CPU:** mit „Grafikkarte nutzen“ aus rund 8 s pro Funkspruch (Ryzen 7 5800X).
- **Fehlerfälle:** unbekanntes Modell → „Modell „…“ fehlt.“; fehlende Dateien nennt der Status mit
  Namen (large-v3-turbo samt VAD-Modell).
- **Mikrofon:** `getUserMedia` ohne Dialog von WebView2 (vorher „prompt“, danach „granted“).
- **Lizenzen:** Seite und `LICENSES.txt` mit whisper.cpp, Whisper-Gewichten und Vulkan-Headern.
- whisper.cpp hängt nur noch an Windows-DLLs (`kernel32`, `advapi32`, UCRT) und – nur für die
  Grafikkarte – an `vulkan-1.dll` vom Treiber (geprüft mit `dumpbin /dependents`).
- Hinweis zum Test: Der Installer lief aus der Claude-App heraus; Windows hat die Installation dabei in
  deren Paketordner umgeleitet (MSIX-Virtualisierung). Normal gestartet landet sie unter
  `%LOCALAPPDATA%\Fence In Comms Training`.
- **Nachladen** (Installer ohne Modell, 13,2 MiB):
  - Ohne Modell zeigen Profil und Sprechfeld „Laden (190 MB von huggingface.co)“.
  - base.en echt von Hugging Face geladen: Fortschritt, nach rund 2 Minuten fertig, SHA-256 unabhängig
    nachgeprüft, danach „bereit (whisper.cpp base.en · Grafikkarte)“ und Erkennung in 1,1–1,4 s.
  - „Abbrechen“ nach 2 MB: Meldung „Abgebrochen.“, keine `.part`-Datei übrig.
  - Nach dem Laden bleibt eine Bestätigung stehen: „✓ Whisper base.en geladen und geprüft.
    Spracherkennung bereit – du kannst sprechen.“ (vorher verschwand der Kasten kommentarlos, und es sah
    aus, als passiere nichts). Im Sprechfeld steht sie bis zum ersten Drücken der Sprechtaste.
  - Ein früherer Versuch ohne Fortsetzen riss bei 48 MB ab („Peer disconnected“, der CDN lieferte zeitweise
    nur rund 125 KB/s – mit curl genauso). Daraufhin kam das Fortsetzen per HTTP-Range dazu; geprüft mit
    einem lokalen Server, der mitten in der Datei trennt (auch ohne Range-Unterstützung).
- Nicht geprüft: ein Rechner ohne Vulkan-fähige Grafikkarte (dann rechnet die CPU, laut ggml von selbst),
  der Rückfall von GPU auf CPU bei einem Treiberfehler (im Code vorgesehen, nicht nachgestellt), ein
  echter Funkspruch übers Mikrofon in der Desktop-App (die Aufnahme selbst ist dieselbe wie im Browser).

## Geprüft am 22.11.2026: Mikrofonliste

Befund aus dem Installer-Test: Unter Profil → Sprechen standen die angeschlossenen Mikrofone nicht zur
Auswahl. Nichts war blockiert. Chromium (also auch WebView2) gibt vor der ersten Freigabe weder Namen
noch Geräte-IDs heraus: `enumerateDevices()` liefert dann nur einen namenlosen Eintrag mit leerer ID
(Berechtigung „prompt“). Die Liste wurde nur beim Öffnen der Seite und beim Start des Mikrofontests
geholt, und zwar bevor das Mikrofon offen war.

- **Behoben:** Ist die Liste gesperrt, gibt es „Alle Mikrofone anzeigen“ (Mikrofon kurz an und wieder
  aus). Die Liste lädt außerdem neu, sobald der Mikrofontest das Mikrofon geöffnet hat und wenn Geräte
  an- oder abgesteckt werden. „Standardmikrofon“ nennt das Gerät, auf das es zeigt. Der Mikrofontest
  zeigt, welches Mikrofon offen ist.
- Geprüft mit dem Release-Build, jeweils mit frischem WebView2-Profil (`WEBVIEW2_USER_DATA_FOLDER`, so
  läuft der Test neben der installierten App) und drei Mikrofonen (Headset, Webcam, Steam):
  - vorher nur „Standardmikrofon“ und der Knopf, nach dem Klick alle drei;
  - ohne Knopf, nur über den Mikrofontest: die Liste füllt sich, sobald das Mikrofon offen ist;
  - nach einem Neustart sofort vollständig (die Freigabe bleibt im WebView2-Profil);
  - ein gewähltes Mikrofon (Webcam) wird im Mikrofontest tatsächlich geöffnet.

## Offen

- Knopf „Nach Update suchen“ (braucht die Adresse des GitHub-Repos).
- Nach „Abbrechen“ oder dem Schließen der App fängt ein Download von vorn an (Verbindungsabbrüche
  setzt sie selbst fort).
