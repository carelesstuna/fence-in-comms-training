# Funk-Audio: Gegenstellen hörbar

Stand 22.11.2026 (Iteration 4). Tower, AWACS, JTAC, Wingman und Crew Chief sprechen ihre Funksprüche – mit
Funkklang und je eigener Stimme. Die Sprachausgabe ist ein **optionaler Download** wie die Whisper-Modelle;
ohne sie bleibt alles Text, und alles bleibt ohne Ton lösbar.

## Kurzfassung

- **Sprache:** Kokoro-82M v1.0 (Apache-2.0) als ONNX **fp32**, live auf der **CPU** (onnxruntime-web, WASM mit
  Threads) im Web Worker – im Browser und in der Desktop-App (WebView2) mit demselben Code. Kein neues npm-Paket:
  onnxruntime-web kommt schon mit transformers.js.
- **Aussprache ohne espeak-ng (GPL):** die misaki-Lexika (Apache-2.0), mit denen Kokoro trainiert wurde, dazu
  Wortformen, zusammengesetzte Namen und Einträge von Hand (`src/core/audio/lexicon-extra.ts`). Ein Test prüft, dass
  jedes Wort der Inhalte eine Aussprache hat.
- **Download:** 342 MB auf Klick (Profil → Hören, oder beim ersten ▶): Modell 326 MB, acht Stimmen à 0,5 MB, vier
  Lexika zusammen 12,6 MB. Fester Commit der Originalquellen, Größe und SHA-256 geprüft. Der Installer bleibt klein.
- **Funkkette** mit Web Audio: AM (UHF/VHF), FM (JTAC), trockenes Intercom, Rauschen, Squelch, Funklöcher und zwei
  Sender gleichzeitig mit Pfeifton („blocked“).

## Messung und Entscheidung

Desktop-PC mit 8-Kern-CPU und aktueller Grafikkarte. Zeiten pro Funkspruch, warm (Modell geladen).

| Variante | Größe | kurzer Funkspruch (5 s) | BRAA (7 s) | ATIS (18–20 s) | Befund |
|---|---|---|---|---|---|
| **fp32, CPU (WASM, Browser)** | 326 MB | 2,5–3 s | 4,1 s | 11 s | **gewählt**: sauber, überall gleich |
| fp32, CPU in der Desktop-App | 326 MB | – | – | – | 0,8 s Rechenzeit je Sekunde Sprache |
| fp32, Grafikkarte (WebGPU) | 326 MB | 1,2 s | 1,4 s | 2,7 s | **unbrauchbar**: Spitzen, Stimme leise und rau |
| fp16, CPU/WebGPU | 163 MB | – | – | – | **unbrauchbar**: NaN (WebGPU immer, CPU je nach Text und Tempo) |
| q8, CPU nativ (onnxruntime-node) | 92 MB | 10 s | 15 s | 46 s | zu langsam: quantisierte Faltungen ohne schnellen Kern (87 % der Zeit) |
| fp32, CPU nativ (onnxruntime-node) | 326 MB | 3 s | – | – | Vergleich: WASM ist kaum langsamer |

- **WebGPU** rechnet schnell, gibt aber verfälschten Ton (Hüllkurve korreliert nur zu 0,54 mit der CPU, einzelne
  Spitzen). Vermutlich rechnet `sin()` auf der Grafikkarte mit den großen Phasenwerten des Sinus-Generators im
  Vocoder ungenau. Die App rechnet deshalb immer auf der CPU; `TtsEngine` kann WebGPU noch, die Oberfläche bietet es
  nicht an.
- **Rechenzeit ≈ 0,55–0,8 × Sprechdauer.** Damit niemand wartet:
  - Die Sprachausgabe lädt 2,5 s nach dem Start im Hintergrund (Laden und Aufwärmen rund 4–8 s).
  - Szenario: Der erste Schritt wird schon im Briefing gerechnet, danach jeweils der nächste, während man tippt.
  - Hörübungen rechnen beim Öffnen, die Anatomie beim Zeigen auf ▶. Fertiges bleibt im Speicher (rund 8 Minuten).
- **Verworfen:**
  - Vorgerenderte Clips: Die Werte sind gewürfelt, und Zusammenkleben klingt abgehackt.
  - Piper: GPL-Phonemizer, eine Stimme pro Modell und hörbar roboterhafter.
  - kokoro-js: bringt eine zweite transformers-Version und espeak-ng (GPL) mit.
  - Windows-Stimmen: nur in der Desktop-App verfügbar.

## Bedienung

- **Profil → Hören:** an/aus, Lautstärke, Tempo (0,8–1,3), Empfang (gut/mittel/schwach), „Funksprüche im Szenario
  sofort abspielen“, „Text immer gleich zeigen“, Hörproben (AM, FM, Intercom, blocked, eigener Funkspruch), Laden mit
  Fortschritt und Abbrechen; im Browser „Aus dem Browser entfernen“.
- **Funkspruch-Anatomie:** ▶ je Zeile, „▶ Abspielen“ für den ganzen Funkspruch. Gespielt wird nur, was sichtbar ist –
  so verrät ▶ nie eine Lösung (z. B. den eigenen Funkspruch einer Übung vor der Antwort).
- **Hörübung:** In Funkspruch-, Mitschreib- und Lagebild-Übungen und im Szenario erscheint der Text der Gegenstellen
  erst nach dem Hören. „Text zeigen“ gibt ihn jederzeit frei; ohne Sprachausgabe oder mit „Text immer gleich zeigen“
  steht er sofort da.
- **Szenario:** Neue Funksprüche spielen von selbst nacheinander, der Text folgt nach dem Hören.
- **9-Line-Decoder (Spur C):** „▶ Weiter hören“ spielt den nächsten Teil, dann erscheint sein Text; mit Ton beginnt
  auch der erste Teil verdeckt. Zwei Tempi: „Tempo: langsam“ (0,8 × Profil) zum Mitschreiben, „normal“ wie im Einsatz.
- **Tastatur:** Alle Knöpfe sind normale Buttons (Tab, Enter/Leertaste). Während der Wiedergabe wird ▶ zu ■ (Stopp).

## Klang

| Klang | Wann | Kette |
|---|---|---|
| AM | UHF/VHF (Tower, AWACS, Wingman) | Hoch-/Tiefpass 320–2800 Hz, Präsenz 1,7 kHz, sanftes Clipping, Kompressor, Rauschen solange der Träger steht, kurzer Squelch-Stoß auf/zu |
| FM | `radio: fm` (JTAC) | 300–3200 Hz, härter begrenzt, bei gutem Signal fast rauschfrei, dafür der laute, helle Squelch Tail beim Loslassen |
| Intercom | `channel: intercom`, Crew Chief, `radio: intercom` | 120–7000 Hz, leichte Kompression, kein Rauschen, kein Squelch |

- **Klangwahl** `soundFor(t)` (`src/core/audio/radio.ts`): erst das Gerät (`radio`, Spur C), dann die Leitung
  (`channel`), zuletzt der Sprecher (JTAC → FM, Crew Chief → Intercom), sonst AM.
- **Empfang** steuert Rauschen und Verzerrung.
- **Geräusche im Inhalt:** Ein Segment in eckigen Klammern wird nicht gesprochen.
  - `[Rauschen]` wird zum Funkloch an dieser Stelle (M1 „say again“).
  - Ein Pfeifton-Segment („[Pfeifton und Wortfetzen]“, M2 „blocked“) ergibt zwei Stimmen gleichzeitig mit
    Überlagerungston. Die erste ist der eigene Anruf, der danach wiederholt wird.
- Gerechnet wird vorab im `OfflineAudioContext` (rund 40 ms pro Funkspruch). Abspielen, Stoppen und WAV-Proben
  nutzen denselben Puffer.

## Stimmen

Acht Kokoro-Stimmen: US Heart, Bella (w), Michael, Fenrir, Puck (m); GB Emma (w), George, Fable (m). Innerhalb eines
Durchlaufs hat jede Station eine feste, eigene Stimme (`VoiceCast`); die Reihenfolge ist pro Durchlauf gewürfelt.
Britische Stimmen sprechen mit dem GB-Lexikon.

## Sprechform

- Jedes Segment trägt `spoken`: der Text mit allen Platzhaltern in gesprochener Form („Viper one one“ statt
  „Viper 1-1“).
- `speakable()` bringt Geschriebenes in Sprechform:
  - Muster und Waffen: „F-15E“ → „F fifteen E“, „C-130“ → „C one thirty“, „GBU-12“, „Mk-82“
  - „FL250“, „Osan AB“
  - übrige Ziffern einzeln
- Abkürzungen ohne Eintrag werden buchstabiert. Erlaubt ist das nur für echte Funk-Abkürzungen (Liste in
  `coverage.test.ts`).

## Einrichten (Entwicklung)

```
npm run fetch-asr -- tts   # Kokoro, Stimmen, Lexika nach .asr/tts (342 MB, mit Prüfsummen)
```

Liegen die Dateien in `.asr/tts`, liefert der Dev-Server sie unter `/tts/` aus, und die App lädt nichts. Die
Desktop-App findet sie beim Entwickeln ebenfalls dort.

## Ablage

- **Desktop-App:** `%LOCALAPPDATA%\io.github.carelesstuna.fence-in-comms-training\modelle\sprachausgabe`. Rust lädt mit demselben Code
  wie die Whisper-Modelle (Prüfsumme, Fortsetzen nach Abbruch, ein Download zur Zeit) und reicht die Dateien über
  `read_tts_file` an die Seite. Erlaubt sind nur Namen aus der festen Liste, keine Pfade.
- **Browser:** Cache Storage `fence-in-comms-training-tts`.

## Dateien

| Ort | Inhalt |
|---|---|
| `src/core/audio/radio.ts` | Klangwahl, Klangwerte je Klang und Empfang, Zeitplan, Kennlinie, Überlagerungston |
| `src/core/audio/speech-text.ts` | Sprechtext, Funklöcher, „blocked“ |
| `src/core/audio/g2p.ts`, `lexicon.ts`, `lexicon-extra.ts` | Aussprache, Kokoro-Vokabular |
| `src/core/audio/voices.ts` | Stimmen je Station und Durchlauf |
| `src/platform/tts-config.ts` | Dateien, Quellen, Prüfsummen, Stimmen (gleiche Liste in `src-tauri/src/tts.rs`) |
| `src/platform/tts-worker.ts`, `tts-engine.ts` | Kokoro im Worker; Warteschlange mit Vorrang, Zwischenspeicher |
| `src/platform/tts-files.ts` | Ablage und Download (Desktop, Browser, Dev-Server) |
| `src/platform/radio-fx.ts`, `radio-voice.ts`, `radio-player.ts` | Funkkette, Übertragung rechnen, Ausgabe |
| `src/platform/AudioProvider.tsx`, `audio-context.ts` | Context: laden, abspielen, vorab rechnen |
| `src/components/audio/` | `ExchangeAudio`, ▶, Hörübung, „Abspielen“, Download-Hinweis, Hooks für eigene Ansichten |
| `src/features/profile/AudioSettings.tsx` | Profil → Hören |
| `src-tauri/src/tts.rs` | Download und Lesen in der Desktop-App |

**Für eigene Ansichten:**
- `useExchangePlay()` spielt über den umgebenden `RadioPanel`.
- `usePlayTransmission(transmissions, cast)` spielt ohne Panel.
- Beide lösen sich auf, wenn die Wiedergabe zu Ende ist. Ohne Ton lösen sie sich sofort auf.

## Geprüft am 22.11.2026

- **Browser (Chromium):**
  - Hörproben aller Klänge.
  - M3-Szenario „Rollen und Abflug in Kutaisi“: Antwort spielt von selbst, Text danach, der nächste Schritt war
    vorab gerechnet.
  - M5 Lektion 2: Anatomie „▶ Abspielen“ und Lagebild-Übung als Hörübung, per Tastatur.
  - Download aus dem Browser: Fortschritt, Abbrechen, nichts bleibt liegen; CORS und Prüfsumme gegen Hugging Face
    und GitHub.
- **Desktop-App** (`npm run desktop:dev`, über das DevTools-Protokoll):
  - Sprachausgabe lädt über IPC.
  - Hörproben AM, FM und blocked spielen.
  - Download über Rust: Fortschritt, Abbrechen, keine `.part`-Datei.
- **Release-Build** (`tauri build --no-bundle`, gegen die echten Dateien unter `%LOCALAPPDATA%`, über das
  DevTools-Protokoll), nach dem Fehler aus dem ersten Test der installierten App:
  - Fehler: Die Sprachausgabe blieb bei „startet … 60 %“ stehen, auch ohne Klick auf ▶. onnxruntime startet
    seine Threads als verschachtelte Worker aus der eigenen `.mjs`. WebView2 bricht deren Anfragen an
    `tauri.localhost` ab (`net::ERR_ABORTED`), der Worker meldet keinen Fehler, und onnxruntime wartet ohne
    Frist. Auf dem Dev-Server (`desktop:dev`) tritt das nicht auf, deshalb war es dort unsichtbar.
  - Behoben in `tts-worker.ts`: Die `.mjs` kommt als Blob-URL, die Threads brauchen keine Anfrage mehr. Dazu
    `initTimeout` 30 s, damit ein Start nie wieder ewig hängt, und `TtsEngine.dispose()` bricht einen laufenden
    Start ab.
  - Danach: drei Threads starten, „bereit“ nach rund 5 s, Hörproben AM und Intercom spielen, 0,6 s Rechenzeit
    je Sekunde Sprache. Browser (Dev-Server) mit derselben Änderung ebenfalls geprüft.
- **Nicht geprüft:**
  - Installer mit dieser Änderung (nur die gebaute exe).
  - Ein vollständiger Download (342 MB) in der App; die Teilstücke und Prüfsummen schon. (Der Nutzer hat ihn
    in der installierten App gemacht; die Dateien waren danach vollständig.)
  - Langsame Rechner (doppelte Rechenzeit ist zu erwarten; das Vorab-Rechnen fängt das im Szenario ab).

## Offen

- **Streaming je Segment:** Den ersten Teil schon spielen, während der Rest rechnet. Das senkt die Wartezeit beim
  ersten ▶ von rund 4 s auf rund 1 s. Dafür müsste die Funkkette live statt vorab laufen.
- **WebGPU** erneut prüfen, sobald onnxruntime-web oder das Modell den Sinus-Generator genauer rechnet.
- **Blocked auf FM** (Capture-Effekt statt Pfeifton) gibt es nicht; M2 braucht nur AM.
