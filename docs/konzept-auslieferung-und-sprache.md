# Konzept: Auslieferung ohne Hosting und lokale Spracherkennung

Stand: 21.11.2026. Ergebnis einer Technik-Diskussion, **noch nichts davon ist umgesetzt**. Fakten mit
Quelle stehen unten. Was unbelegt oder geschätzt ist, steht als „unbelegt“ oder „geschätzt“ im Text.

## Kurzfassung

- Die App kommt als **Tauri-2-Desktop-App** zum Nutzer, als Installer (nur Setup, seit 21.11.2026 ohne Zip-Ordner). Sie läuft
  komplett offline. GitHub dient nur zum Herunterladen.
- **Spracherkennung lokal mit whisper.cpp** (`whisper-cli` als Begleitprogramm, Modell **small.en**
  im Paket). Davor steht eine `Recognizer`-Schnittstelle. In der Browser-Version kann transformers.js
  dieselbe Rolle übernehmen.
- **Sprechtaste in der App:** Leertaste oder PTT-Knopf mit der Maus, gedrückt halten. Aufnahme und
  Bewertung laufen in der Oberfläche. Nativ ist nur die Erkennung.
- Erst **messen** (eigene Aufnahmen, richtige und absichtlich falsche), dann bauen.

## Rahmenbedingungen

- Die App läuft **allein**, nicht neben der Sim. Prozessor und Grafikkarte stehen ihr zur Verfügung.
  Einzelne Übungen, bei denen man etwas in der Sim nachschaut, sind trotzdem möglich.
- Bedienung mit **Tastatur und Maus**. Kein HOTAS, keine globale Sprechtaste.
- **Kein Internet-Hosting** der App. Alles Nötige wird mitgeliefert. Was zu groß ist oder nicht mitgeliefert
  werden darf, lädt der Nutzer nach.
- Windows 10/11.

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Auslieferung | Tauri 2 als dünne Hülle: Installer pro Benutzer (ohne Admin); Zip-Ordner am 21.11.2026 gestrichen |
| Erkennung | whisper.cpp als `whisper-cli` pro Funkspruch, nicht `whisper-server` (siehe Haken) |
| Modell im Paket | Nur small.en (q5_1, 190 MB); base.en zum Nachladen |
| Transkript | Sofort bewerten und **immer anzeigen, was erkannt wurde**, damit man beim nächsten Versuch klarer spricht. Ein Knopf „Nicht richtig erkannt?“ verwirft den Versuch (beibehalten, siehe offene Punkte). |
| Sprechtaste | Halten als Grundeinstellung, Umschalten wählbar. Standard ist die Leertaste, der PTT-Knopf mit der Maus geht immer. |
| Lizenz | Open Source: Code unter MIT, Inhalte unter CC BY-SA 4.0 |
| Updates | Von Hand über GitHub Releases. In der App fragt ein Knopf „Nach Update suchen“ nur auf Klick bei GitHub nach. |

## Auslieferung: Optionen

| Weg | Geht | Scheitert an | Urteil |
|---|---|---|---|
| Doppelklick auf `index.html` | Die heutige App fast: HashRouter, ein JS-Paket. Nötig wären `base: './'` und eingebettetes JS, weil Chromium Modul-Skripte von `file://` blockt. | Worker, WASM, Modell-Downloads und Service Worker gehen unter `file://` nicht, also keine Spracherkennung. Der Speicher hängt am Browser. | Höchstens eine Version zum Lesen und Tippen |
| Ordner mit kleinem Webserver | Alles, was der Browser kann; die Sprechtaste in der App geht. | Der Fortschritt liegt im Browserprofil und hängt am Port (anderer Port, leerer Speicher). Die native Erkennung bräuchte einen eigenen offenen Port. Die exe ist genauso unsigniert. | Zweite Wahl |
| PWA | Läuft nach der Installation offline, auch von localhost. | Braucht erst einen Server. Native Erkennung ist nicht möglich. | Nicht für dieses Ziel |
| **Tauri 2** | Nutzt das vorhandene WebView2, die App selbst hat wenige MB. Eigenes Fenster, Begleitprogramme, Dateizugriff, Header (COOP/COEP) seit 2.1. | Zum Bauen einmalig Rust und die MSVC-Build-Tools. | **Gewählt** |
| Electron | Reines JavaScript; Node startet Begleitprogramme ohne Rust. | Etwa 85–150 MB mehr pro Paket. Web Speech geht dort gar nicht. | Plan B, falls die Rust-Werkzeuge stören |

## Spracherkennung: Optionen

| Engine / Modell | Lizenz Code / Modell | Größe | Stärken | Schwächen |
|---|---|---|---|---|
| **whisper.cpp + Whisper `.en`** | MIT / MIT | base.en q5_1: 60 MB, small.en q5_1: 190 MB, large-v3-turbo q5_0: 574 MB | Prompt (`--prompt`), Grammatik (`--grammar`), Ausgabe-Filter (`--suppress-regex`), Silero-VAD (885 kB). Fertige Windows-Programme für CPU und CUDA. | Rechnet in 30-s-Fenstern. Erfindet bei Stille Sätze. Lässt „äh“ weg. |
| transformers.js v4 (im WebView oder Browser) | Apache-2.0 / je Modell | whisper-base q8: 77 MB | Gleicher Code in Browser und Tauri. WebGPU oder WASM. `suppress_tokens` geht. | Kein offizieller Prompt (PR #1540 offen). Keine Stille-Wahrscheinlichkeit. Mehrere WASM-Threads nur mit COOP/COEP. WebGPU in WebView2 läuft laut Berichten, ist aber nicht dokumentiert. |
| Moonshine v2 | MIT / MIT (Englisch, Streaming) | Tiny 34M, Small 123M, Medium 245M Parameter | Für kurze Äußerungen gebaut. Die Streaming-Modelle lassen sich in der eigenen Laufzeit „Moonshine Voice“ auf Schlüsselwörter lenken. | In transformers.js nicht lenkbar. Ob die Lenkung in der JS-Version geht, ist unbelegt. |
| Parakeet TDT 0.6B v2 | – / CC-BY-4.0 | int8 ≈ 640 MB | Sehr genau, auf schneller CPU etwa 36-mal schneller als Echtzeit | Groß. Lenkung in sherpa-onnx unbelegt. Namensnennung nötig. |
| sherpa-onnx (Baukasten) | Apache-2.0 | – | Whisper, Moonshine, Parakeet, VAD und Sprachausgabe in einem Werkzeug, nativ und als WASM | Wortlisten (Hotwords) nur für Transducer-Modelle |
| Vosk | Apache-2.0 / Apache-2.0 | small-en: 40 MB | Winzig, Vokabular zur Laufzeit | Freie Erkennung schwächer. Die Browser-Version wird seit 2022 nicht gepflegt. |
| Web Speech API | – | – | Chrome erkennt ab 139 auf dem Rechner, Wortlisten ab etwa 142 | Nur in Chrome, nicht mitlieferbar. WebView2 nutzt die Microsoft-Cloud und hat seit Runtime 153 einen offenen Fehler (#5724). Electron: geht nicht. **Wird nicht verwendet.** |

**Warum whisper-cli als Standard:** Für einen Trainer zählt vor allem, dass falsche Funksprüche nicht als
richtig durchgehen. whisper.cpp hat dafür die meisten Stellschrauben: Prompt mit Vokabular, Grammatik,
Ziffern unterdrücken und die Stille-Wahrscheinlichkeit. transformers.js bleibt nützlich, um den
Sprech-Ablauf im Browser (`npm run dev`) zu entwickeln, und für die Browser-Version.

## Architektur

```
CallInput ─ Sprechtaste (Leertaste/Maus) ─ Aufnahme (AudioWorklet, 16 kHz, 300 ms Vorlauf)
                                              │ PCM
                                        Recognizer  (src/platform)
                               ┌──────────────┴───────────────┐
                    whisper-cli (Tauri, Standard)    transformers.js (Browser, optional)
                               └──────────────┬───────────────┘
              src/core/speech: Transkript aufbereiten → scoreTransmission(text, expected)
```

```ts
interface Recognizer {
  readonly id: 'whisper-cli' | 'transformers-js'
  load(onProgress?: (p: number) => void): Promise<void>
  transcribe(pcm16k: Float32Array, hints: RecognitionHints): Promise<Transcript>
}
```

Die Bewertung bleibt unverändert textbasiert: `scoreCall(text, segments)` kommt schon mit Transkripten
ohne Kommas zurecht.

### Kern: `src/core/speech/` (reines TypeScript, ohne Tauri testbar)
- **`hints.ts`** baut Vokabular und Prompt.
  - Quellen: Brevity samt `aliases`, Prowords, Alphabet, Rufzeichen-Pools und die Stationen des aktuellen
    Austauschs.
  - **Nie die Lösung:** keine Zahlen, keine Segmente des erwarteten Funkspruchs. Das sichert ein Test ab.
  - Whisper verträgt etwa 224 Tokens Prompt, also eine Auswahl pro Modul.
- **`transcript.ts`** bereitet das Transkript auf.
  - Whisper-Füllsel entfernen (`[BLANK_AUDIO]`, „Thank you.“ bei Stille).
  - Schreibweisen vereinheitlichen, z. B. „bull's eye“ → „bullseye“.
  - Zu kurze oder zu leise Aufnahmen verwerfen (unter etwa 0,4 s).
  - Typische Hörfehler stehen in einer eigenen Datei, nicht in den Glossar-`aliases`. Die zeigt das Glossar
    als „auch: …“ an.
- **Bewertung:** `scoreCall` bekommt die Option `source: 'typed' | 'spoken'`. Beim Sprechen werden
  Schreibvarianten toleriert und Füllwörter milder bewertet. Brevity-Paare bleiben streng.
- **Sprechablauf als Zustandsautomat** (bereit → sendet → erkennt → bewertet), rein und testbar.
- **Tests** mit echten Transkripten als festen Testdaten.

### Plattform: `src/platform/` (neu)
- **`audio-capture.ts`:**
  - `getUserMedia` und ein AudioWorklet mit Ringpuffer (300 ms Vorlauf)
  - Umrechnung auf 16 kHz mono und eine Pegelanzeige
  - Das Mikrofon ist nur offen, solange ein Funkspruch erwartet wird.
- **`recognizer.ts`:** Schnittstelle mit den Umsetzungen `whisper-cli` (über Tauri) und `transformers-js`
  (Worker).
- **`index.ts`:** erkennt Tauri oder Browser und liefert die Umsetzungen über einen React-Context.
  `@tauri-apps/api` wird nur bei Bedarf geladen, damit die Browser-Version unverändert bleibt.
- **Speicher-Spiegel**, siehe unten.

### Oberfläche
- **`CallInput`** (fünf Stellen in Drills und ScenarioPlayer) bekommt einen Sprechmodus.
  - Die Anzeige wechselt von „sendet“ über „erkennt“ zu Transkript und Bewertung.
  - Das Transkript ist immer sichtbar. Am besten ist markiert, welches Wort zu welchem Teil gehört und
    was nicht passte.
  - Tippen bleibt daneben möglich.
- **Einstellungen:**
  - Mikrofon, Sprechtaste, halten oder umschalten, Modell
  - Mikrofontest mit Pegel und Transkript
- **Seite „Lizenzen“** mit allen Drittbausteinen und Modellen.

### Tauri: `src-tauri/`
- **Feste App-Kennung (Bundle-Identifier) von Anfang an**, denn sie bestimmt den Datenordner von
  WebView2. `useHttpsScheme` wird nie umgeschaltet; sonst ist der localStorage weg.
- **Befehl `transcribe`:** WAV in eine temporäre Datei, `whisper-cli` mit Prompt und Threads aufrufen,
  JSON-Ausgabe zurückgeben.
- **Mikrofon:** Ab Tauri 2.12 kann die App die Freigabe für die eigene Seite über `on_permission_request`
  selbst erteilen, sonst fragt WebView2 beim ersten Mal.
- **dialog-Plugin** für Export und Import, falls der Download über `<a download>` in WebView2 nicht klappt.
- **Datei-Spiegel** für den Fortschritt (lesen und schreiben).
- **Umfang:** grob 100–200 Zeilen Rust (geschätzt). Kein global-shortcut, keine native Aufnahme.
- **DLLs:** `externalBin` nimmt nur die exe mit. Die DLLs von whisper.cpp müssen daneben liegen,
  also whisper.cpp ohne DLLs (statisch) bauen oder die DLLs als Ressourcen ins Programmverzeichnis legen.
- **Pakete:** NSIS-Installer pro Benutzer. Der Zip-Ordner (portable Version) ist entfallen; Tauri sieht ihn
  ohnehin nicht offiziell vor.

### Speicher
- Seit dem Merge von `feature/robustheit` gibt es in `src/state/persisted.ts` eine
  `KeyValueStore`-Schnittstelle mit Schemaprüfung und Sicherung, dazu Export und Import in
  `src/state/transfer.ts`. Daran hängt in Tauri ein **Spiegel**:
  - localStorage bleibt der Arbeitsspeicher.
  - Jede Änderung geht gebündelt zusätzlich nach `%APPDATA%\…\fortschritt.json`.
  - Ist localStorage beim Start leer, kommt der Stand aus der Datei zurück.
- So übersteht der Fortschritt eine neue App-Kennung, ein zurückgesetztes WebView2-Profil und eine
  Neuinstallation.

### Build
- **`scripts/fetch-asr.ts`** lädt whisper.cpp und die Modelle mit fest eingetragenen SHA-256-Prüfsummen.
  Beides kommt nicht in Git.
- **`scripts/asr-bench.ts`** ist die Messreihe, siehe Reihenfolge.
- **Lizenzliste** automatisch aus npm-Paketen und Rust-Crates, dazu whisper.cpp, die Whisper-Gewichte und
  Silero-VAD.
- **Einmalig zum Bauen:** Rust stable und die MSVC-Build-Tools.

## Paket und Größen

| Teil | Größe |
|---|---|
| App (Tauri und Inhalte) | etwa 10–15 MB (geschätzt) |
| whisper.cpp für die CPU | wenige MB |
| small.en (q5_1) | 190 MB |
| Silero-VAD | 0,9 MB |
| Vorgerenderte Funk-Clips (später) | wenige MB |
| WebView2 | 0 MB; ist unter Windows 10/11 fast immer installiert. Der Offline-Installer (+127 MB) ist nur für Sonderfälle. |

- **Gesamt etwa 210 MB**, ohne Internet installierbar.
- **Modelle liegen getrennt von der App**, in `%LOCALAPPDATA%`, die App lädt sie auf Klick nach. Ein App-Update lädt
  dann nur etwa 15 MB, Fortschritt und Modell bleiben erhalten.
- **Zum Nachladen:** base.en für schwache Rechner sowie large-v3-turbo und die CUDA-Version für
  NVIDIA-Grafikkarten.

## Sprechtaste

- **Leertaste halten = senden.** Die App ignoriert die Tastenwiederholung (`e.repeat`). Alt-Tab während
  des Haltens zählt als Loslassen (`blur`).
- **Im Sprechmodus** fängt die App die Leertaste ab: kein Scrollen, kein Auslösen fokussierter Knöpfe. Steht
  der Cursor im Textfeld, tippt sie ein normales Leerzeichen. Heute setzt `CallInput` den Fokus automatisch
  ins Textfeld (`autoFocus`); im Sprechmodus darf es das nicht.
- **Maus:** den PTT-Knopf gedrückt halten (`pointerdown`/`pointerup`, auch beim Verlassen des Knopfs
  beenden).
- **Umschaltmodus** als Einstellung für alle, denen Halten schwerfällt.
- **Halten trainiert die Sprechtasten-Disziplin mit:** erst drücken, dann sprechen, erst nach dem
  letzten Wort loslassen.

## Lizenzen und Weitergabe

- **Eigene Lizenz:** Code unter MIT, Inhalte unter CC BY-SA 4.0. Das Brevity-Glossar nennt Wikipedia als
  Grundlage. Wikipedia-Texte stehen unter CC BY-SA, darauf aufbauende Inhalte dürfen also unter CC BY-SA
  weitergegeben werden.
- **Im Paket:** whisper.cpp (MIT), Whisper-Gewichte (MIT), Silero-VAD (MIT), Tauri (MIT/Apache-2.0). Die
  Lizenztexte müssen beiliegen, auf der Seite „Lizenzen“ und als Datei.
- **Nur zum Nachladen:**
  - die CUDA-Laufzeit: NVIDIA-Lizenz, groß
  - Parakeet (CC-BY-4.0): wäre im Paket erlaubt, braucht aber eine Namensnennung
- **Sprachausgabe (später):**
  - Kokoro-82M (Apache-2.0) **beim Build vorrendern** und Zahlen und Rufzeichen aus Einzelclips
    zusammensetzen. Dann muss keine Sprachausgabe ins Paket.
  - kokoro-js hängt über den Phonemizer an eSpeak NG (GPL). Wie sich das auswirkt, ist unbelegt; beim
    Vorrendern bleibt das außerhalb des Pakets.
  - Piper meiden: Das Programm steht unter GPL-3.0, die Stimmen sind einzeln lizenziert, viele (Abkömmlinge
    von lessac) nur für die Forschung.
- **Vor dem Veröffentlichen des Repos:**
  - Die Commits tragen eine Mailadresse, die mit dem Repo öffentlich wird. Gegebenenfalls vorher eine
    noreply-Adresse von GitHub nehmen.
  - Im Repo stehen keine persönlichen Pfade (geprüft am 21.11.2026).
  - Die Inhaltsquellen auf Zitate prüfen, die länger sind als eine Paraphrase.

## Signieren und SmartScreen

- **Unsignierte exe aus dem Internet:** SmartScreen zeigt „Der Computer wurde durch Windows geschützt“,
  weiter geht es mit „Trotzdem ausführen“. Auf USB-Sticks mit FAT32 oder exFAT verliert die Datei die
  Download-Markierung, dann kommt diese Warnung nicht.
- **Smart App Control** (Windows 11) blockiert unsignierte Programme ohne Reputation trotzdem.
- **Artifact Signing** von Microsoft (früher Trusted Signing): Privatpersonen nur in den USA und Kanada.
- **EV-Zertifikate** überspringen SmartScreen seit 2024 nicht mehr.
- **Mit Open Source möglich:**
  - Certum-Open-Source-Zertifikat (etwa 49 €, Cloud-Signatur ohne Hardware-Token)
  - SignPath Foundation (kostenlos). Verlangt OSI-Lizenzen, automatisierte und nachprüfbare Builds, MFA,
    eine Richtlinienseite zum Signieren und eine Datenschutzerklärung.
- **Plan:** zuerst unsigniert mit kurzer Anleitung und SHA-256-Prüfsumme. SignPath, sobald Releases
  automatisch gebaut werden.

## Updates

- **Neue Version:** aus GitHub Releases laden und drüberinstallieren.
- **Knopf „Nach Update suchen“:** fragt nur auf Klick die GitHub-API nach der neuesten Version und zeigt den
  Link. Die App bleibt ohne Zutun komplett offline.
- **Das Tauri-Update-Plugin ist zurückgestellt:**
  - Es braucht einen eigenen Signierschlüssel; geht er verloren, nehmen bestehende Installationen keine
    Updates mehr an.
  - Die App würde bei jedem Start bei GitHub nachfragen.

## Haken

1. **`whisper-server` nicht verwenden.**
   - Er lauscht ohne Zugangsschutz an einem Port und sendet `Access-Control-Allow-Origin: *`.
   - `/load` lädt jeden vorhandenen Dateipfad. Webseiten im Browser könnten ihn ansprechen, solange die
     App läuft.
2. **`whisper-cli` lädt das Modell bei jedem Funkspruch neu.** Bei small.en geschätzt 0,3–1 s zusätzlich.
   Stört das, kommt whisper.cpp direkt in die App (whisper-rs), mit mehr Aufwand beim Bauen.
3. **Der Prompt darf die Lösung nicht verraten.** Steht der erwartete Funkspruch im Prompt, „hört“ Whisper
   die richtige Antwort, auch wenn man etwas anderes sagt. Die naheliegende Idee („`initial_prompt` mit dem
   erwarteten Funkspruch“) gilt deshalb nicht für die Bewertung. Eine Grammatik
   muss auch falsche Antworten zulassen.
4. **Ob Ziffern einzeln gesprochen werden, lässt sich kaum prüfen.**
   - Whisper schreibt „one one“ und „eleven“ beide als „11“, „two seven zero“ und „two seventy“ oft beide
     als „270“. Der Normalisierer unterscheidet das beim Tippen bewusst.
   - Für die Messreihe: Ziffern in der Ausgabe unterdrücken (`--suppress-regex` bzw. `suppress_tokens`)
     und einen Prompt mit ausgeschriebenen Ziffern verwenden.
   - Bis das belegt ist, wird beim Sprechen nur der Wert bewertet.
5. **Die Aussprache wird nicht bewertet.** „Niner“, „tree“ und „fife“ landen als Ziffern im Text. Bewertet
   wird der Inhalt.
6. **Whisper glättet.** „Äh“ und Versprecher verschwinden, der Abzug für Füllwörter greift beim Sprechen
   kaum.
7. **Stille und sehr kurze Aufnahmen:** Whisper erfindet dann Sätze. Mindestlänge und Pegel prüfen,
   Stille-Wahrscheinlichkeit und Silero-VAD nutzen. transformers.js liefert keine Stille-Wahrscheinlichkeit.
8. **Mikrofon-Filter:** Echo- und Rauschunterdrückung und automatische Lautstärke von `getUserMedia`
   beeinflussen die Erkennung. Das klärt die Messung; eher abschalten.
9. **Zwei Laufzeitwege:** Aufnahme und Sprechtaste sind in Browser und Tauri gleich, nur die Erkennung
   unterscheidet sich. Logik in `src/core` testen. Ende-zu-Ende-Tests in Tauri gehen unter Windows mit
   tauri-driver, sind aber aufwendiger.
10. **Datenschutz:** Alles bleibt auf dem Rechner. Aufnahmen bleiben nur gespeichert, wenn man das für die
    Messreihe einschaltet.
11. **Parallele Arbeit:** Tauri und der Sprechmodus berühren `main.tsx`, `App.tsx`, `store.ts` und `CallInput`.
    Robustheit und „Weg für Erfahrene“ sind gemergt; vor dem Start prüfen, ob gerade andere Branches an
    diesen Dateien arbeiten.

## Reihenfolge

0. **Messreihe, ohne die App umzubauen.**
   - 50–100 eigene Aufnahmen gewürfelter Funksprüche, richtige und absichtlich falsche (falsche Zahl,
     falsches Rufzeichen).
   - Engines im Vergleich: `whisper-cli` mit base.en und small.en, transformers.js (WebGPU), Moonshine v2.
   - Maß ist die vorhandene Bewertung: Wie oft akzeptiert sie einen falschen Funkspruch, wie oft lehnt sie
     einen richtigen ab, und wie lange dauert es?
   - Das legt Modell und Engine endgültig fest.
1. **Kern, Aufnahme und Sprechtaste im Browser**, zunächst mit transformers.js. Der ganze Ablauf lässt sich
   so mit `npm run dev` ausprobieren.
2. **Tauri-Hülle ohne Sprache:** Offline-App, Datei-Spiegel, Lizenzseite, Installer.
3. **`whisper-cli` in Tauri** als Standard-Erkennung, dazu die Einstellungen.
4. **Feinschliff:** base.en und CUDA zum Nachladen, eventuell whisper-rs.

## Offene Punkte

- **„Nicht richtig erkannt?“:** Der Knopf ist beibehalten, weil die Entscheidung zum Transkript ihn nicht
  ausschließt. Soll jeder Versuch zählen, entfällt er. Bleibt er, zählt die App Verwürfe und zeigt sie im
  Debriefing.
- **Moonshine Voice:** ob die Lenkung auf Schlüsselwörter auch in der JS/WASM-Version geht (unbelegt).
- **WebGPU in WebView2:** Es gibt keine offizielle Zusage von Microsoft; Berichte sagen, dass es läuft.
- **Wartezeit** durch das Nachladen des Modells bei `whisper-cli` messen.
- **Export:** ob `<a download>` in WebView2 unter Tauri funktioniert.
- **Hotwords in sherpa-onnx für Parakeet/NeMo-TDT:** unbelegt.

## Abweichungen von PLAN.md und Recherche 03

In `PLAN.md` sind diese Punkte am 21.11.2026 nachgezogen. Recherche 03 bleibt als Stand der ersten Recherche
unverändert.

- **Tauri** ist nicht mehr „optional später“, sondern der Auslieferungsweg. Sein Zweck ist auch nicht mehr
  die globale Sprechtaste.
- **Iteration 5** („Web Speech API und lokales Whisper/Moonshine“): Web Speech entfällt. Gründe:
  Cloud-Zwang, Fehler in WebView2, nicht mitlieferbar. Standard ist `whisper-cli`, transformers.js bleibt
  für den Browser.
- **Recherche 03**, ergänzt:
  - Web Speech gibt es auch in WebView2. Es läuft dort über die Microsoft-Cloud und ist seit Runtime 153
    gestört.
  - Der `initial_prompt` mit dem erwarteten Funkspruch passt nicht zur Bewertung (Haken 3).
  - Den Kaltstart eines Modells (6–7 s) vermeidet die App, indem sie das Modell beim Start im Hintergrund
    lädt (transformers.js). Bei `whisper-cli` fällt stattdessen pro Funkspruch eine kurze Ladezeit an
    (Haken 2).
- **Sprechtaste:** in der App statt global. Das PTT-Design aus Recherche 03 (Vorlauf, Nachlauf, Mindestlänge,
  16 kHz) gilt weiter.

## Quellen

Abgerufen am 21.11.2026.

**whisper.cpp und Whisper**
- https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5
- https://github.com/ggml-org/whisper.cpp/blob/master/examples/cli/README.md
- https://github.com/ggml-org/whisper.cpp/blob/master/examples/server/README.md
- https://raw.githubusercontent.com/ggml-org/whisper.cpp/master/examples/server/server.cpp
- https://huggingface.co/ggerganov/whisper.cpp/tree/main
- https://huggingface.co/ggml-org/whisper-vad
- https://github.com/openai/whisper

**Weitere Modelle und Werkzeuge**
- https://github.com/moonshine-ai/moonshine
- https://moonshine-voice.readthedocs.io/en/latest/models/available-models/
- https://moonshine-voice.readthedocs.io/en/latest/models/domain-customization/
- https://arxiv.org/abs/2602.12241
- https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2
- https://github.com/istupakov/onnx-asr
- https://k2-fsa.github.io/sherpa/onnx/hotwords/index.html
- https://alphacephei.com/vosk/models

**transformers.js**
- https://github.com/huggingface/transformers.js/releases
- https://raw.githubusercontent.com/huggingface/transformers.js/main/packages/transformers/src/models/whisper/modeling_whisper.js
- https://github.com/huggingface/transformers.js/pull/1540
- https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html

**Sprachausgabe**
- https://huggingface.co/hexgrad/Kokoro-82M
- https://github.com/OHF-Voice/piper1-gpl
- https://raw.githubusercontent.com/OHF-Voice/piper1-gpl/main/docs/LICENSING.md

**Web Speech, WebView2 und Electron**
- https://github.com/MicrosoftEdge/WebView2Feedback/issues/5724
- https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/browser-features
- https://developer.chrome.com/blog/new-in-chrome-139
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/phrases
- https://github.com/electron/electron/issues/31732

**Tauri**
- https://v2.tauri.app/reference/config/
- https://v2.tauri.app/security/http-headers/
- https://v2.tauri.app/develop/sidecar/
- https://v2.tauri.app/plugin/updater/
- https://v2.tauri.app/blog/tauri-2.12

**Browser-Grundlagen**
- https://vite.dev/guide/troubleshooting
- https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria

**Signieren**
- https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart
- https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation
- https://shop.certum.eu/open-source-code-signing-on-simplysign.html
- https://signpath.org/terms
