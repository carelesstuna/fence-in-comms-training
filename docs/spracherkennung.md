# Spracherkennung: Stand und Bedienung

Umsetzung des Konzepts [`konzept-auslieferung-und-sprache.md`](konzept-auslieferung-und-sprache.md).
Stand 21.11.2026: Phase 0 (Messreihe), Phase 1 (Sprechen im Browser), Phase 2 (Tauri-Hülle) und
Phase 3 (whisper-cli in der Desktop-App, siehe [`desktop-app.md`](desktop-app.md#spracherkennung)) sind
umgesetzt, die erste echte Messreihe ist ausgewertet (unten).

- **Desktop-App:** whisper.cpp small.en mit Prompt, auf der Grafikkarte (Vulkan) oder der CPU.
- **Browser:** transformers.js im Worker (ohne Prompt, deutlich ungenauer – siehe Messreihe).
- Die Gegenrichtung, das **Hören** (Sprachausgabe mit Funkklang), steht in [`audio.md`](audio.md).

## Einrichten

```
npm run fetch-asr            # whisper.cpp und Modelle nach .asr/ (rund 650 MB, mit SHA-256-Prüfung)
npm run fetch-asr -- --list  # was geladen wird, mit Größen und Lizenzen
```

- `.asr/` liegt im Haupt-Checkout und steht in `.gitignore`. Worktrees nutzen denselben Ordner;
  ein anderer Ort geht mit `RT_ASR_DIR`.
- Der Dev-Server liefert die transformers.js-Modelle unter `/models/` aus. Die App lädt zur Laufzeit
  nichts aus dem Internet, auch die WASM-Dateien von onnxruntime kommen aus dem eigenen Paket.
- Der Dev-Server setzt COOP/COEP. Erst damit rechnet onnxruntime-web mit mehreren Threads.

## Sprechen in der App

- An jeder Stelle, an der man einen Funkspruch eingibt (Übungen, Szenarien, Checkride), lässt sich
  zwischen „Tippen“ und „Sprechen“ umschalten. Die Wahl gilt dann überall. Tippen bleibt auch im
  Sprechmodus möglich.
- **Sprechtaste:** Leertaste halten oder den PTT-Knopf mit der Maus halten. Umschaltmodus und andere
  Taste stehen im Profil unter „Sprechen“. Steht der Cursor im Textfeld, tippt die Leertaste.
- **Ablauf:** sendet → erkennt → Transkript. Ist das Transkript laut Bewertung richtig, wird sofort
  gewertet. Sonst fragt die App: „Werten“ oder „Nicht richtig erkannt? Nochmal“. Ein Verwurf zählt und
  steht in der Rückmeldung bzw. im Debriefing.
- Die Rückmeldung zeigt das Erkannte Wort für Wort. Grün heißt passend, gelb an anderer Stelle,
  rot falsch, durchgestrichen zusätzlich. Der Tooltip nennt das zugehörige Segment.
- Im Profil: Mikrofon, Browser-Filter (meist besser aus), Modell, Grafikkarte (WebGPU, experimentell),
  Squelch-Klick und ein Mikrofontest mit Pegel und Transkript.

## Messreihe

1. `npm run dev`, dann in Chrome oder Edge `#/dev/aufnahme` öffnen (nur im Dev-Modus).
2. „Aufnahmen speichern“ anhaken und das Mikrofon einschalten. Die Seite würfelt Funksprüche:
   richtige, mit falscher Zahl, mit falschem Rufzeichen und Stille.
3. Gespeichert wird als WAV (16 kHz mono) samt JSON in einem Ordner neben dem Repo,
   `<Repo> Messreihe` (anders mit `RT_MESSREIHE_DIR`).
4. Auswerten:

```
npm run asr-bench                                    # alle Engines
npm run asr-bench -- --run whisper-cli:small.en+prompt --verbose
npm run asr-bench -- --rescore                       # letzte Ergebnisse mit der aktuellen Bewertung neu auswerten
```

- `--rescore [Datei]` nimmt die gespeicherten Transkripte und bewertet sie neu, ohne die Erkennung
  erneut laufen zu lassen (Sekunden statt einer halben Stunde). Gut, um Änderungen an der Bewertung zu
  prüfen.
- Fehlaufnahmen (Sprechtaste nur angetippt, schon die Pegelprüfung verwirft sie) zählen nicht mit.

- **Engines:**
  - `typed`: die Vorlage als perfektes Transkript, Gegenprobe der Bewertung
  - `whisper-cli:<base.en|small.en|large-v3-turbo-q5_0>`, mit den Zusätzen `+prompt` (Vokabular, nie
    die Lösung), `+digits` (Ziffern ausgeschrieben), `+ac` (Audio-Kontext gekürzt, schneller), `+greedy`,
    `+vad`, `+gpu` (selbst gebaute Vulkan-Version, siehe unten)
  - `tf:<whisper-base.en|whisper-tiny.en|moonshine-base>`
- **Gemessen:** falsch angenommen (falscher Funkspruch gilt als richtig), falsch abgelehnt, Stille
  erfunden (mit und ohne Pegelprüfung), Wortfehlerrate und Dauer.
- **Ergebnisse** landen unter `ergebnisse/` im Messreihe-Ordner, als `.md` und als `.json` mit allen
  Transkripten.

## Dateien

| Ort | Inhalt |
|---|---|
| `src/core/speech/` | PCM/WAV, Hinweise (`hints.ts`), Transkript, Hörfehler, Ablauf (`flow.ts`), Varianten der Messreihe |
| `src/core/scoring/score.ts` | `scoreCall(…, { source: 'spoken' })`, `heard` ordnet Wörter den Segmenten zu |
| `src/platform/` | Aufnahme (AudioWorklet), Sprechtaste, `Recognizer`, transformers.js im Worker, whisper.cpp über Tauri (`whisper-recognizer.ts`), Provider |
| `src-tauri/src/asr.rs` | `whisper-cli` aufrufen, Modelle finden, Status, Modell-Ordner |
| `scripts/stage-asr.ts` | whisper.cpp, small.en und Lizenzangaben fürs Desktop-Paket |
| `src/components/speech/` | Sprech-Bereich in `CallInput`, PTT-Knopf, Pegelanzeige |
| `src/features/dev/RecordingPage.tsx` | Aufnahme-Seite der Messreihe |
| `scripts/fetch-asr.ts`, `scripts/asr-bench.ts` | Downloads mit Prüfsummen, Messreihe |
| `scripts/vite-dev-plugins.ts` | Speichern der Aufnahmen, `/models/` (nur Dev-Server) |

## Messreihe vom 21.11.2026

110 eigene Aufnahmen (deutscher Sprecher, englische Funksprüche): 58 richtige, 22 mit falscher Zahl,
22 mit falschem Rufzeichen, 8 Stille. Rechner: Ryzen 7 5800X, 8 Threads, nur CPU. Alle Werte mit der
Bewertung nach den Änderungen unten (`--rescore`).

| Engine | falsch angenommen | falsch abgelehnt | Stille erfunden | Ø Zeit |
|---|---|---|---|---|
| whisper-cli small.en + Prompt | 0/44 | **15/58 (26 %)** | 0/8 | 7,5 s |
| whisper-cli small.en + Prompt + greedy | 0/44 | 22/58 (38 %) | 0/8 | 7,0 s |
| whisper-cli small.en + Prompt + `-ac` (alter Prompt) | 0/44 | 23/58 (40 %) | 1/8 | 4,0 s |
| whisper-cli base.en + Prompt | 0/44 | 30/58 (52 %) | 0/8 | 2,8 s |
| whisper-cli base.en ohne Prompt | 0/44 | 43/58 (74 %) | 0/8 | 1,9 s |
| transformers.js whisper-base.en | 0/44 | 42/58 (72 %) | 4/8 | 1,1 s |
| transformers.js moonshine-base | 0/44 | 47/58 (81 %) | 0/8 | 0,4 s |
| transformers.js whisper-tiny.en | 1/44 | 48/58 (83 %) | 0/8 | 0,8 s |

- **Falsch angenommen** blieb bei allen Engines bei 0, bis auf einen Fall, in dem tiny.en die absichtlich
  falsche Ziffer zufällig als die richtige erkannt hat.
- **Der Prompt hilft deutlich** (base.en 74 % → 52 %). Die Stationen müssen aber am Anfang stehen: Standen
  sie am Ende, hielt Whisper den Namen für schon gesagt und ließ ihn weg („Darkstar, Ford seven one …“
  → „471 …“).
- **`-ac` ist schneller, aber unzuverlässig:** Wiederholungen (Wortfehlerrate 61–87 %) und einmal Text
  in der Stille. **greedy** spart kaum Zeit, weil der Encoder die Zeit kostet, und erkennt schlechter.
  **`+digits`** (Ziffern ausgeschrieben) war schlechter als ohne.
- **transformers.js** kann keinen Prompt und lehnt deshalb drei von vier richtigen Funksprüchen ab. Fürs
  Sprechen im Browser bleibt es ein Versuch; die Auslieferung braucht whisper-cli.
- Die Regeln der Bewertung sind an genau diesen Aufnahmen entstanden. Mit neuen Aufnahmen liegen die
  Werte vermutlich etwas schlechter.

### Was an der Bewertung geändert wurde (nur beim Sprechen)

Die erste Auswertung ergab 56 % falsch abgelehnt bei small.en, vor allem wegen der Bewertung, nicht
wegen der Erkennung:

- **Kommas** setzt Whisper nach Sprechpausen („Runway, three, one, right“). Sie trennen jetzt nichts mehr.
- **Zahlen in Whisper-Schreibweise** (`spokenNumbers` in `transcript.ts`): „06R“, „Raven61“, „4.7.1“,
  „Chevy II“, „3000 for 6000“ (lief vorher zu einer Zahl zusammen).
- **Verhörer bei Zahlen** (`prepareSpoken` in `score.ts`): „Rage for one“, „Raven forward“, „Ghost 901“
  und „9R1“ (niner), „nine a thousand“, „for 0.8“, „411“ für „Ford one one“. Jede Umschreibung gilt nur,
  wenn dabei die erwartete Zahl herauskommt – ein falsch gesprochener Wert wird so nie richtig.
- **Namen** (Rufzeichen, Stationen) und Buchstabierwörter dürfen ab 4 Buchstaben einen Fehler haben
  („cold“ für Colt, „gulf“ für Golf). Unter den Rufzeichen-Namen der Inhalte liegen keine zwei so nah
  beieinander. Brevity und Standardwörter bleiben streng.
- **„the“, „a“, „of“** dürfen fehlen.

### Was übrig bleibt

Echte Verhörer: „For your kin“ (Four, you're clean), „Booby Dop“ (bogey dope), „Raiden“ (Raven),
„request data“ (request startup), „spring fuel“ (Springfield). Ein größeres Modell hilft etwas (unten).

## Grafikkarte (Vulkan)

whisper.cpp bietet für Windows keine fertige Vulkan-Version an (nur CPU, BLAS und CUDA für NVIDIA).
Die Vulkan-Version ist deshalb selbst gebaut und läuft auf AMD-, NVIDIA- und Intel-Karten. Ohne
passende Karte fällt sie von selbst auf die CPU zurück (`GGML_BACKEND_DL`, wie im offiziellen Release).

### Ergebnis (Radeon RX 9070 XT, gleiche 110 Aufnahmen)

| Engine | falsch angenommen | falsch abgelehnt | Stille erfunden | Ø Zeit |
|---|---|---|---|---|
| **small.en + Prompt, GPU** | 0/44 | **15/58 (26 %)** | 0/8 | **1,5 s** |
| small.en + Prompt, CPU (zum Vergleich) | 0/44 | 15/58 (26 %) | 0/8 | 7,5 s |
| small.en + Prompt + VAD, GPU | 0/44 | 22/58 (38 %) | 0/8 | 1,7 s |
| large-v3-turbo (q5_0) + Prompt, GPU | 0/44 | 12/58 (21 %) | **4/8** | 2,8 s |
| large-v3-turbo (q5_0) + Prompt + VAD, GPU | 0/44 | 13/58 (22 %) | 0/8 | 2,7 s |
| base.en + Prompt, GPU | 0/44 | 33/58 (57 %) | 0/8 | 1,1 s |

- **small.en wird auf der GPU fünfmal schneller, bei gleicher Genauigkeit.** Der Encoder braucht 69 ms
  statt rund 5 s. Von den 1,5 s pro Funkspruch gehen etwa 1 s in Programmstart, Vulkan und das Laden des
  Modells. Ein Prozess, der geladen bleibt, käme auf etwa 0,4 s (Frage für Phase 3).
- **Der allererste Start dauert rund 12 s:** Der Treiber übersetzt die Shader einmal und merkt sie sich.
  Die App sollte das beim Einschalten des Sprechmodus im Hintergrund erledigen.
- **large-v3-turbo** erkennt etwas besser, erfindet aber in der Stille Sätze („And now I'm going to show
  you how to do this.“). Mit VAD nicht mehr; dann ist es fast so gut wie ohne, aber doppelt so langsam
  wie small.en und dreimal so groß (574 MB). small.en verliert mit VAD dagegen deutlich.
- Die GPU rechnet minimal anders als die CPU und schreibt manchmal Unterstriche statt Leerzeichen
  („senaki_colte_departure“). Für die Bewertung ist das egal, `_` trennt Wörter wie ein Leerzeichen.

### Selbst bauen

Werkzeuge liegen in `.asr\tools` (nicht in Git), nichts davon ist systemweit installiert:

- CMake 4.4.5, portables Zip von github.com/Kitware/CMake (SHA-256 aus dem Release geprüft)
- Vulkan SDK 1.4.363.1 von sdk.lunarg.com (SHA-256 und Signatur geprüft), installiert mit
  `--root <Ordner> --accept-licenses --default-answer --confirm-command install copy_only=1` –
  ohne Admin, ohne Umgebungsvariablen. Gebraucht werden nur Header, `vulkan-1.lib` und `glslc`.
- Quelle: whisper.cpp Tag v1.9.5 (Commit `d1be6fde`, derselbe wie das CPU-Release b5454)

Fallstricke:

- **Kein Leerzeichen im Pfad** (etwa im Ordnernamen des Repos) und **nicht im Temp-Ordner**: Sonst scheitern zufällig
  einzelne Shader bzw. der Shader-Generator findet keinen Compiler. Gebaut wird in `C:\dev\rt-asr-build`
  mit Verknüpfungen (Junctions) auf SDK und CMake.
- Die Build Tools 18 sind beim Visual-Studio-Installer nicht registriert; CMake braucht die Version:
  `-DCMAKE_GENERATOR_INSTANCE="C:/Program Files (x86)/Microsoft Visual Studio/18/BuildTools,version=18.12.12412.261"`

```
set VULKAN_SDK=C:\dev\rt-asr-build\vksdk
cmake -S src -B build -G "Visual Studio 18 2026" -A x64 -DCMAKE_GENERATOR_INSTANCE=... ^
  -DBUILD_SHARED_LIBS=ON -DWHISPER_SDL2=OFF -DWHISPER_BUILD_TESTS=OFF -DGGML_NATIVE=OFF ^
  -DGGML_BACKEND_DL=ON -DGGML_CPU_ALL_VARIANTS=ON -DGGML_VULKAN=ON
cmake --build build --config Release -j 8
```

Ergebnis nach `.asr\whisper.cpp\v1.9.5-vulkan\` kopieren (`whisper-cli.exe`, `whisper.dll`, `ggml*.dll`;
`ggml-vulkan.dll` hat 45 MB). In der Messreihe: Zusatz `+gpu`, z. B. `whisper-cli:small.en+prompt+gpu`.
large-v3-turbo lädt `npm run fetch-asr -- ggml-large-v3-turbo` (nur auf Wunsch, nicht bei „alles“).

## Frühere Beobachtungen (Probelauf mit Windows-Sprachausgabe)

- small.en: Fast die ganze Zeit geht in den Encoder, der immer ein 30-s-Fenster rechnet. Das Laden des
  Modells kostet nur rund 0,4 s.
- `--suppress-regex` muss das ganze Token treffen. `[0-9]` wirkt nicht, `.*[0-9].*` schon.
- Der Download von whisper.cpp 1.9.5 enthält auch `parakeet-cli`. Parakeet ließe sich also ohne
  sherpa-onnx vergleichen (offen).
