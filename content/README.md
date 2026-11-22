# Inhalte von Fence In Comms Training

Alle Lerninhalte sind Dateien in diesem Ordner. Für eine neue Lektion, eine neue Übung oder einen neuen
Flugplatz legst du nur eine Datei an oder ergänzt eine. Am Code ändert sich nichts.

Nach jeder Änderung prüfen:

```bash
npm run validate
```

Der Validator prüft alle Dateien gegen die Schemas in `src/core/content/schema.ts` und meldet
kaputte Querverweise. Dazu gehören fehlende Übungen, unbekannte Platzhalter und falsche Rollen.

## Grundsätze

- **Sprache:** Erklärungen auf Deutsch (du-Form, locker, präzise). Funksprüche, Brevity und Fachbegriffe
  im englischen Original.
- **Drei Ebenen** (`layer`):
  - `core`: offizielle militärische Phraseologie (ATP 1-02.1, NATOPS, JP 3-09.3, ICAO/FAA)
  - `community`: Praxis, die nicht in den Brevity-Listen steht – echte Verbands-SOP (AFMAN, Einheit) und
    Gewohnheiten der Sim-Staffeln über SRS
  - `sim`: Details einer Sim oder eines Flugzeugs (DCS-Menü, BMS, SRS-Bedienung, F-14-Intercom)
- **Aussprache:** Gesprochene Wortlaute (Funksprüche, Segmente, Beispiele, Antworten in Übungen) stehen in der
  US-Form: **three, five, niner**. Die strenge ICAO-Form (tree, fife) nimmt die App in *Antworten* an, gezeigt
  wird sie nicht (Hinweis dazu steht in Modul 1, Lektion 3). In *Antworten* gilt auch „nine“ (die Spracherkennung
  schreibt „niner“ so, die Aussprache wird nicht bewertet), in gezeigten Texten ist „nine“ als eigenes Wort verboten. Ausnahmen:
  zusammengesetzte Zahlwörter („thirty-nine thousand“, keine Ziffernfolge), Uhrzeigerpositionen („left nine
  o'clock“) und historische Zitate („zero-nine-zero“). Ein Test (`src/core/aussprache.test.ts`) prüft das über alle
  Inhalte und über die gewürfelten Funksprüche und Übungen (eine einzelne 9 spricht der Generator „niner“); eine neue Ausnahme trägst du dort in die Liste ein.
- **Zufall:** Rufzeichen, Flugplätze, Frequenzen und Zahlen nie fest hineinschreiben, sondern über
  Platzhalter würfeln. Ausnahme: Das Szenario hängt an einem bestimmten Ort, etwa einer
  Nellis-Prozedur.
- **Ehrlichkeit:** Jede Lektion nennt ihre Quellen (`sources`). Unsichere Werte werden als unsicher
  markiert. Quellen werden zusammengefasst, nicht kopiert.
- **Rhythmus:** Theorie und Übung wechseln sich ab. Nach spätestens zwei Leseseiten kommt eine Übung.
  Pro Lektion gibt es mindestens eine Hangar-Wissen-Karte (Technik, Physik, Geschichte, Hintergrund).
- **Querverweise:** Auf Lektionen verweist du mit „Modul N, Lektion M“. M zählt die Position im Modul wie die App,
  nicht die ID (`m4-l7` steht an Position 6). Hangar-Karten nennst du mit Titel und Ort, Spuren ohne Lektionen
  mit „später geplant“. Ein Test (`src/core/querverweise.test.ts`) prüft Lektionsnummern und Spur-Hinweise.

## Ordner

| Pfad | Inhalt |
|---|---|
| `curriculum.yaml` | Ränge, Module (Kern, Spuren, später), Reihenfolge der Lektionen, Einstufungstests |
| `achievements.yaml` | Abzeichen mit Bedingung (siehe „Abzeichen“) |
| `lessons/<modul>/*.md` | Lektionen: Markdown mit YAML-Frontmatter |
| `hangar/*.md` | Hangar-Wissen-Karten: Markdown mit YAML-Frontmatter |
| `topics/<id>.md` | Themenseiten: ausführliche Erklärung eines Grundbegriffs (Route `#/wissen/<id>`) |
| `calls/*.yaml` | Annotierte Funksprüche (Funkspruch-Anatomie) |
| `drills/*.yaml` | Übungen |
| `scenarios/*.yaml` | Szenarien (Walkthrough mit Funk-Log), eine Datei pro Szenario |
| `pools/callsigns.yaml` | Würfelpools für Rufzeichen (`fighter`, `attack`, `awacs`, `tanker`, `jtac`, `gci`) |
| `pools/maps.yaml` | Karten/Theater mit `sims` – es kommen nur Plätze von Karten der Sims im Profil dran (gibt es keine passenden, alle) – und der Pflichtangabe `phraseology` (`faa` oder `icao`, siehe „Phraseologie je Karte“; ob die Übungen ihr folgen, stellt das Profil ein) |
| `pools/carriers.yaml` | Flugzeugträger als Würfelpool |
| `pools/cas.yaml` | CAS-Einsatzraum: benannte Punkte (IP, Egress), Ziele, Bedrohungen, radargelenkte SAM, Waffen je Flugzeug, Danger-Close-Schwellen |
| `pools/aircraft.yaml` | **Die** Flugzeugliste: Profilauswahl (nach Epoche gruppiert), Flugzeug- und Epochen-Kästen, Würfelpool (siehe „Flugzeuge und Epochen“) |
| `airfields/<karte>/*.yaml` | Flugplätze als Würfelpool |
| `glossary/*.yaml` | Buchstabieralphabet, Rollen der Funkspruch-Teile, Standardwörter, Brevity-Codes (Glossar `#/glossary`) |

## Lektionen (`lessons/<modul>/NN-titel.md`)

```markdown
---
id: m1-l1                # eindeutig, a-z0-9 und Bindestriche
module: m1               # muss zum Modul in curriculum.yaml passen
order: 1
title: Wer ruft wen?
summary: Ein Satz für die Übersicht.
minutes: 7
xp: 60
layer: core              # optional, Standard core
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (2025)"
    url: https://www.alssa.mil/MTTPs/Brevity/
---

## Erste Seite

Text …

::call{id=m1-radio-check}

---

::drill{id=m1-l1-order}

---

::hangar{id=erster-sprechfunk}
```

- Eine Zeile `---` beginnt eine **neue Seite**.
- Eine Seite, die nur aus `::drill{id=…}` besteht, ist eine **Übungsseite**. Mit
  `::drill{id=… repeat=3}` wird die Übung dreimal gestellt, was bei gewürfelten Übungen sinnvoll ist.
- Eine Seite, die nur aus `::hangar{id=…}` besteht, zeigt eine **Hangar-Wissen-Karte**.
- Eine Seite, die nur aus `::scenario{id=…}` besteht, spielt ein **Szenario** (siehe unten).
- Alle anderen Seiten sind **Leseseiten** (Markdown). Darin sind diese Bausteine erlaubt:

| Baustein | Wirkung |
|---|---|
| `::call{id=…}` | Interaktiver Funkspruch mit farbigen, antippbaren Teilen. Gewürfelt, mit Knopf „neu würfeln“. Mit `as=two` aus Sicht einer Station. |
| `::chart{kind=approach airfield=batumi freqs=real}` | Schematische Platz- oder Anflugkarte. `airfield` und `freqs` sind optional (ohne `airfield` wird gewürfelt). |
| `:::sim{sim=dcs}` … `:::` | Sim-Kasten. Wird nur gezeigt, wenn die Sim im Profil gewählt ist. Erlaubt: `dcs`, `bms`, `il2`, `srs` |
| `:::aircraft{aircraft=f14}` … `:::` | Flugzeug-Kasten. IDs aus `pools/aircraft.yaml`; mehrere mit Komma (`aircraft=p51,p47`), dann gilt der Kasten für jedes dieser Muster |
| `:::era{era=ww2}` … `:::` | Epochen-Kasten (`ww2`, `cold-war`, `modern`, auch als Liste `era=ww2,cold-war`). Aufgeklappt, wenn ein gewähltes Flugzeug aus einer dieser Epochen stammt oder keins gewählt ist |
| `:::layer{layer=community}` … `:::` | Kasten „Praxis: Verbands-SOP und Sim-Staffeln“ |
| `:::tip` … `:::` | Tipp |
| `:::warn` … `:::` | Warnung, typischer Fehler |
| `:::example` … `:::` | Merkkasten |
| `:term[tally]` | Begriff im Fließtext (Brevity oder Standardwort): antippen zeigt die Bedeutung, mit Link ins Glossar. Muss in `glossary/brevity.yaml`, `prowords.yaml` oder `basics.yaml` stehen (Wort oder `aliases`). |
| `[Text](/wissen/<id>)` | Verweis innerhalb der App, öffnet im selben Fenster (Zurück-Taste führt zur Lektion zurück). Erlaubt: `/wissen/<id>` (Themenseite), `/wissen`, `/lesson/<id>`, `/hangar`, `/glossary`, `/profile` (z. B. für Einstellungen wie die Phraseologie). Der Validator prüft das Ziel. |

Lektionen werden im Modul über `lessons: [m1-l1, m1-l2, …]` in `curriculum.yaml` eingehängt.

## Hangar-Karten (`hangar/<id>.md`)

```markdown
---
id: funkhorizont
title: Warum dich der Tower hinter dem Berg nicht hört
category: physik          # technik | physik | geschichte | hintergrund | praxis
era: ww2                  # optional: ww2 | cold-war | modern (Filter im Hangar)
teaser: Ein Satz, der neugierig macht.
sources: [{ title: "…", url: "https://…" }]
---
Markdown-Text, 1–2 Minuten Lesezeit.
```

## Themenseiten (`topics/<id>.md`)

Eine Themenseite erklärt einen Grundbegriff ausführlicher, als es eine Lektion oder das Glossar kann: Squawk und
Transponder, den Unterschied zwischen ATC und AWACS, die ATC-Stellen. Man erreicht sie aus Lektionen, aus dem
Glossar und über die Übersicht `#/wissen`. Sie ist eine normale Seite der App: Der Rückweg ist die Zurück-Taste
bzw. „← Zurück“, und die Lektion steht danach wieder auf derselben Seite.

```markdown
---
id: squawk-transponder-iff     # eindeutig, a-z0-9 und Bindestriche; gleich dem Dateinamen
title: Squawk, Transponder und IFF
summary: Ein bis zwei Sätze für die Übersicht und unter dem Titel.
layer: core                    # optional, Standard core
era: cold-war                  # optional: nur setzen, wenn die Seite nur für eine Epoche gilt
terms: [Transponder, SQUAWK, IFF]   # optional: Glossar-Begriffe, die die Seite abdeckt
sources:                       # mindestens eine
  - title: "FAA Aeronautical Information Manual, 4-1-20"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html
---

Markdown-Text, 1–2 Minuten Lesezeit. Überschriften der zweiten Ebene (`##`), Tabellen, `:::warn`, `:::tip`,
`:::layer{layer=community}`, `::call{id=…}` und `:term[…]` sind erlaubt, `::drill`, `::hangar` und `::scenario`
nicht (die gibt es nur als ganze Lektionsseite).

## Wo dir das begegnet

- [Readback und Radio Check](/lesson/m1-l6) (Modul 1): Der Squawk gehört zu den Dingen, die du zurückliest.
```

**Schreiben:**

- Für Sim-Piloten ohne Vorkenntnisse, in der Du-Form, Funkwörter englisch, US-Aussprache (three, five, niner).
  Beispiele ohne feste Rufzeichen und Frequenzen: Platzhalter (`{callsign}`) oder ein `::call` mit gewürfelten Werten.
- Was Hangar-Karten schon erklären, nicht wiederholen: darauf hinweisen (Karten werden erst im Hangar sichtbar,
  wenn man sie in einer Lektion entdeckt hat, deshalb mit Titel nennen statt nur zu verlinken).
- Jede Seite endet mit „Wo dir das begegnet“ und Verweisen auf die Lektionen. Verweise auf Lektionen mit dem
  Lektionstitel und dem Modul beschriften, nicht mit „Lektion 3“ (die App nummeriert nach Position).
- Quellen in `sources` nennen, in eigenen Worten schreiben, unsichere Werte im Text als unsicher markieren. Wo sich
  Quellen oder Lektionen widersprechen, beide Aussagen nennen statt zu entscheiden.

**Verlinken:**

- **Aus einer Lektion:** Markdown-Link `[Text](/wissen/<id>)`, am besten mit dem Titel der Seite als Text.
  Beim ersten Vorkommen eines Begriffs zusätzlich `:term[…]`: Das Popover bietet „Ausführlich lesen →“, sobald der
  Begriff zu einer Seite gehört.
- **Aus dem Glossar:** Ein Eintrag gehört zu einer Seite, wenn er dort in `terms` steht (Wort oder Schreibweise)
  oder selbst `topic: <id>` trägt. `topic` am Eintrag geht vor; steht ein Begriff in `terms` einer anderen Seite,
  meldet der Validator den Widerspruch. Schreibweisen zählen mit: „Delivery“ steht bei „Clearance Delivery“.
  Wörter, die auf einer Seite vorkommen, aber etwas anderes meinen (das Standardwort „standby“ auf der
  Transponder-Seite), gehören nicht in `terms`.

Der Validator prüft: gültiger Kopf (`id`, `title`, `summary`, mindestens eine Quelle mit gültiger URL), Dateiname
gleich `id`, keine doppelten IDs, jeder Begriff in `terms` steht im Glossar und gehört nur zu einer Seite, jedes
`topic:` im Glossar nennt eine vorhandene Seite, `:term[…]`, Bausteine und alle Verweise `[Text](/…)` in Lektionen,
Hangar-Karten und Themenseiten führen irgendwohin.

## Funksprüche (`calls/*.yaml`) – die Funkspruch-Anatomie

Ein Eintrag ist ein **Austausch** aus einer oder mehreren Übertragungen. Jede Übertragung besteht
aus **Segmenten** mit Rolle und Erklärung:

```yaml
- id: m1-startup-request
  title: Anlassfreigabe bei Ground
  context: Wann und warum dieser Funkspruch fällt.
  freq: "{airfield.gnd} {airfield.gnd.band}"
  layer: core
  vars:
    airfield: { pool: airfields }
    atis: { letter: true }
  transmissions:
    - speaker: "{callsign}"        # Anzeigename der sprechenden Station
      you: true                     # das ist DEIN Funkspruch (Baukasten, Bewertung)
      channel: radio                # radio | intercom
      segments:
        - text: "{airfield.name} Ground"
          role: addressee
          note: Warum dieser Teil da steht und was er aussagt.
        - { text: "{callsign|spoken}", role: callsign }
        - { text: "information {atis}", role: info }
        - { text: request startup, role: request }
    - speaker: "{airfield.name} Ground"
      segments:
        - { text: "{callsign|spoken}", role: addressee }
        - { text: startup approved, role: instruction }
```

**Rollen** (Farben und Labels in `glossary/roles.yaml`):

| Rolle | Bedeutung |
|---|---|
| `addressee` | Adressat: wen rufe ich? |
| `callsign` | Rufzeichen: wer spricht? |
| `position` | Position: wo bin ich? |
| `intent` | Absicht: was habe ich vor? |
| `info` | Information, z. B. ATIS oder Lesbarkeit |
| `request` | Anfrage: was will ich? |
| `instruction` | Anweisung: was soll der andere tun? |
| `value` | Zahlenwert: Frequenz, Höhe, Kurs |
| `proword` | Standardwort: roger, wilco, say again … |
| `brevity` | Brevity-Code: PICTURE, BOGEY DOPE, FENCE IN … |

**Segmente schneiden:** Ein Segment ist die kleinste Einheit, die für sich *eine* Bedeutung trägt. Sie
wird zur Kachel im Baukasten. Lieber „request startup“ als ein Segment als „request“ und „startup“
einzeln.

### Segmente für die Tipp-Bewertung

Wenn ein Funkspruch getippt (später gesprochen) wird, ist jedes Segment ein **Slot**. Optionale Felder
am Segment steuern die Bewertung:

| Feld | Wirkung |
|---|---|
| `optional: true` | darf fehlen (z. B. Frequenz beim Radio Check) |
| `critical: true` | Pflichtteil – fehlt er, heißt es „Pflichtteil fehlt“ (hold short, Rufzeichen, Line 4/6 …) |
| `alt: ["five by five"]` | gleichwertige Formulierungen |
| `weak: [Two]`, `weakNote: "Vorschrift: …"` | Formen, die gelten, aber nicht der Vorschrift entsprechen (Kurzform „Two“ bei selbst begonnenen Meldungen, „angels“ im blind-Ruf): Der Funkspruch bleibt richtig, der Teil zählt nur halb, die App zeigt „Gilt – aber nicht ganz nach Vorschrift“ und den `weakNote` (ohne ihn: die vollständige Form). Platzhalter wie `{two}` gehen in beiden Feldern |
| `tolerance: 3` | Zahlen dürfen um ±3 abweichen (Peilungen rechnen über 360/000 hinweg) |
| `free: true` | darf an beliebiger Stelle stehen |
| `when: cas.laser` | Segment nur, wenn der Wert gesetzt ist (nicht leer, nicht „no“); `when: "!cas.laser"` nur, wenn nicht. Geht auch an einer ganzen Übertragung |

Ein Readback mit Pflicht-Slots: Pflichtteile `critical: true`, alles, was man zusätzlich zurücklesen *darf*, als
`optional: true, free: true` hinten anhängen. Dann zählt es nicht als Fehler, und der 9-Line-Decoder meldet es als
„zusätzlich zurückgelesen“.

### Funkgerät einer Übertragung (`radio`)

`radio: uhf | vhf | fm | intercom` an einer Übertragung zeigt beim Sprecher das Gerät (UHF, VHF, FM, ICS). Der JTAC
spricht auf `fm`, AWACS meist auf `uhf`. Später wählt die Audio-Kette danach den Klang.

### Eigenes Rufzeichen aus einem Pool (`callsignPool`)

`callsignPool: attack` an Funkspruch, Übung oder Szenario ersetzt den Namen des eigenen Rufzeichens durch einen aus
`pools/callsigns.yaml` („Hawg 1-1“ statt „Viper 1-1“), auch wenn das Profil ein festes nennt. Der Name hängt nur vom
eigenen Rufzeichen ab: Eine Lektion bleibt durchgehend „Hawg“. Übungen mit `call:` übernehmen den Pool des Funkspruchs.

Die Bewertung akzeptiert Ziffern, Zahlwörter („twenty five“), ICAO-Aussprache, kleine Tippfehler und
meldet falsche Reihenfolge, falsche Werte, fehlende Teile und Füllwörter („roger“, „please“). **Komma, Semikolon
und Schrägstrich trennen Zahlengruppen**: „Viper 1-1, 260.0“ wird als 11 und 260.0 gelesen, „bullseye 045/60“ als 045
und 60. Ein Komma zwischen Ziffern gilt als Dezimalkomma bzw. Tausendertrenner, wenn die erwartete Zahl es so
verlangt („121,5“ = 121.5, „25,000“ = 25000).

### „Mehr dazu“-Link in der Erklärung eines Teils

Tippt man einen Teil an, kann unter der Erklärung eine Zeile „Mehr dazu: …“ stehen. Ein Ziel im **Glossar** öffnet in einem
**neuen Tab**, weil der Stand der Lektion nicht in der Adresse steckt. Eine **Themenseite** (`/wissen/<id>`) öffnet im
**selben Fenster**: Sie ist eine normale Seite der App, und die Zurück-Taste führt zur Lektion zurück. Woher das Ziel kommt:

1. **Standardziel der Rolle** – `more` bei der Rolle in `glossary/roles.yaml`, ein Ziel oder eine Liste (es gilt das
   erste, dessen `when` zum Text des Teils passt; eines ohne `when` steht am Ende):

   | Rolle | Ziel | Hinweis |
   |---|---|---|
   | `brevity` | Brevity-Liste im Glossar | Stehen alle erkannten Codes des Teils in einer Gruppe, die Liste dieser Gruppe („Brevity-Gruppe Sicht & Kontakt“); bei mehreren Gruppen („picture clean“) die ganze Liste |
   | `proword` | Standardwörter im Glossar | |
   | `value` | Squawk, Transponder und IFF | nur wenn der Text „squawk“ enthält |
   | `value` | Höhen und Höhenmesser | angels, cherubs, flight level, altimeter, QNH, QFE, thousand, hundred |
   | `value` | Zahlen im Funk | alles andere: Ziffern, Frequenzen, Kurse, Zeiten |
   | `info` | ATIS – die Platzansage und ihr Kennbuchstabe | nur wenn der Text „information“ enthält |
   | `addressee` | Die ATC-Stellen von Clearance bis Center | nur bei Stellen der Flugsicherung (Ground, Tower, Approach, Departure, Center, Clearance Delivery) |

   Die übrigen Rollen (`callsign`, `position`, `intent`, `request`, `instruction`) haben keinen Link, solange es kein
   gutes Ziel gibt – lieber keiner als ein schlechter.

2. **`more` am Segment** – übersteuert das Standardziel, auch bei Rollen ohne Link:

   ```yaml
   - text: "taxi via {twA}, {twB}"
     role: instruction
     more:
       label: Das NATO-Alphabet                # Linktext, ohne „Mehr dazu:“ davor
       to: /wissen/nato-alphabet               # Pfad in der App
   ```

`label` ist reiner Text ohne Platzhalter. `to` muss ein Pfad in der App sein; erlaubt ist das Glossar mit `?tab=` (`basics`,
`brevity`, `prowords`, `alphabet`), `?q=` (Suchbegriff, Leerzeichen als `+`) und `?cat=` (Brevity-Gruppe, nur zusammen mit
`tab=brevity`) sowie `/wissen/<id>` ohne Parameter, wenn es die Themenseite gibt (`content/topics/<id>.md`). Der Validator
prüft das; eine neue Art von Seite muss dort (`TARGETS` in `src/core/glossary/more.ts`) erst eingetragen werden. Nutze `more`
sparsam: nur, wenn das Standardziel der Rolle nicht passt und es das Ziel wirklich gibt.

### Perspektive (wer bin ich?)

Übertragungen können eine `station` haben (`lead`, `two`, `three`, `four`, aber auch `front`, `rear`,
`pilot`, `rio` …). Mit `perspective: [two, three, four]` am Funkspruch wird pro Durchlauf eine Station
gewürfelt – deren Übertragung wird zu „du“. Bei Flight-Positionen passt sich `{callsign}` an (als Two
bist du „Viper 1-2“). Im 2-ship entfallen Übertragungen von Three und Four automatisch; wer Three oder
Four spielt, fliegt immer im 4-ship. Übungen und `::call` können die Station mit `as: two` festlegen.

## Platzhalter und Zufall

| Platzhalter | Ergebnis |
|---|---|
| `{callsign}` / `{callsign\|spoken}` | eigenes Rufzeichen „Viper 1-1“ / „Viper one one“ |
| `{flight}`, `{flightName}`, `{flightNum}` | „Viper 1“, „Viper“, „1“ |
| `{wingman}`, `{element}`, `{element2}` | Nummer 2, 3 und 4 des eigenen Flights |
| `{name}` | geschriebene Form einer Variablen |
| `{name\|spoken}` | gesprochene Form, Zahlen als Wörter: „two six zero point zero“ |
| `{name.feld}` | Unterfeld, z. B. `{airfield.name}`, `{wx.runway\|spoken}` |

**Platzhalter in Tabellen:** Die App ersetzt alle Platzhalter *bevor* sie das Markdown liest.
`{name|spoken}` in einer Tabellenzelle zerlegt die Tabelle in der App also nicht. Nur die Vorschau
im Editor (GitHub, VS Code) zeigt die Tabelle dann zerbrochen an. Wer das vermeiden will, nutzt in
Tabellen `{name}` ohne `|spoken`.

### Variablen definieren

Variablen werden pro Funkspruch bzw. Übung unter `vars` definiert, in der angegebenen Reihenfolge
gewürfelt. Übungen mit `call:` (build, anatomy, cloze, form, sequence) sehen **auch die Variablen
des Funkspruchs**. Eine gleichnamige Übungs-Variable überschreibt die des Funkspruchs.

| Definition | Ergebnis |
|---|---|
| `{ pool: airfields }` | zufälliger Flugplatz (Felder siehe unten); nur von Karten der Sims im Profil (BMS → Korea, DCS → DCS-Karten; gibt es dort keinen passenden Platz, z. B. nur IL-2, alle), `where`/`require` gelten vorher |
| `{ pool: airfields, where: { map: caucasus } }` | gefiltert, Gleichheit auf Feldern |
| `{ pool: airfields, sameMap: airfield, distinctFrom: [airfield] }` | zweiter Flugplatz auf derselben Karte wie `airfield` (z. B. Zielplatz); hat die Karte nur einen Platz, ist es derselbe |
| `{ pool: carriers }` | zufälliger Flugzeugträger (Felder siehe unten) |
| `{ pool: aircraft, where: { service: usn, era: modern } }` | zufälliger Flugzeugtyp: `type` („F/A-18C“), `radio` („Hornet“), `id`. Sammel-Einträge (`group: true`) werden nie gewürfelt. Ohne `era` kommen auch Warbirds in Frage |
| `{ pool: callsigns.awacs }` | Rufzeichen aus einem Pool: `fighter`, `attack`, `awacs`, `tanker`, `jtac` |
| `{ int: [1, 9] }` / `{ int: [10, 60], step: 5 }` | Ganzzahl, gesprochen Ziffer für Ziffer |
| `{ letter: true }` | Buchstabe als Wort („Golf“), Unterfeld `letter` = „G“ |
| `{ oneOf: [a, b, c] }` | einer der Texte |
| `{ oneOf: [{ text: "1+30", spoken: "one plus three zero" }] }` | mit eigener Sprechform |
| `{ number: heading }` | Zahl im Funkformat (Zahlenarten siehe unten) |
| `{ number: altitude, range: [3000, 9000], step: 500 }` | Zahl in eigenem Bereich |
| `{ number: pressure, airfield: af }` | Luftdruck in der gesprochenen Form am Platz: 29.92 („altimeter“) oder 1013 („QNH“), siehe „Phraseologie je Karte“ |
| `{ number: altitude, range: [3000, 9000], step: 1000, above: { airfield: af, add: 2000 } }` | mindestens Platzhöhe + `add`; bei `int` in Tausend (`{ int: [2, 4], above: { airfield: af, add: 1000, unit: 1000 } }` für „leaving {altA}000“) |
| `{ weather: true, airfield: af }` | Wetter; Runway passend zum Wind (siehe unten) |
| `{ commplan: true, airfield: af }` | gewürfelter, stimmiger Comm Plan (siehe unten) |

**Verschiedene Werte erzwingen:** Jede Definition kann `distinctFrom: [andereVariable]` haben,
z. B. `twB: { oneOf: [Alpha, Bravo, Charlie], distinctFrom: [twA] }`. Die andere Variable muss vorher
definiert sein.

### Eingebaute Variablen zum Flight

`{lead}`, `{two}`, `{three}`, `{four}` sind die Rufzeichen der Flight-Mitglieder (Nummer 1–4),
`{selfNum}` die eigene Position als Wort („Two“), `{flightSize}` die Größe des Flights (2 oder 4,
gewürfelt).

### Abgeleitete Werte (`derive`)

Gewürfelt werden nur Primärwerte, der Rest wird berechnet – so bleibt alles stimmig:

```yaml
vars:
  hdg: { number: heading }
  back: { derive: reciprocal, from: hdg }              # Gegenkurs (bei runway: Gegenbahn 13 → 31)
  t: { number: time }
  push: { derive: offset, from: t, add: 15 }           # 15 Minuten später
  joker: { number: fuel, range: [4.0, 6.0] }
  bingo: { derive: offset, from: joker, add: -1.5 }    # immer 1.5 unter Joker
  low: { derive: min, of: [joker, bingo] }             # auch max, sum
```

Das Format übernimmt die Zahlenart der Quelle (oder `kind: fuel` usw.). Kurse brechen bei 360 um,
Zeiten bei 24 Uhr.

### Lagegeometrie (`geo`)

```yaml
vars:
  pic: { geo: true, groups: 2, label: azimuth, id: hostile }   # groups 1–3; label optional; id hostile|bandit|bogey|mixed
  core: { geo: true, groups: 2, labelled: false }              # Core Information: „two groups“, jede Gruppe „group bullseye …“
```

Labels: `single`, `azimuth`, `range` (2 Gruppen), `wall`, `ladder`, `vic`, `champagne` (3 Gruppen).
Gewürfelt werden eigene Position, Gruppen, Kurse und Höhen – berechnet werden alle Werte. Der Generator folgt
der ATP 3-52.4: Kontakthöhen als ganze Zahl, Aspekt mit 8er-Rose (nie in den Lücken zwischen den Klassen), ab drei
Gruppen „wide“/„deep“, und mit Label bekommen nur die Gruppen am vorderen Rand einen Bullseye (bei range, ladder,
vic die lead group, bei champagne beide lead groups, bei azimuth und wall alle). Track mit Label (ATP 3-52.4
IV-6.b/IV-13.d): alle Gruppen hot → kein Track; gemeinsame Richtung → einmal hinter dem Label (`{pic.head}`);
verschiedene Richtungen → je Gruppe, auch ohne Bullseye. Core Information und single group nennen den Track je Gruppe.

| Platzhalter | Beispiel |
|---|---|
| `{pic.call}` | kompletter Picture-Call: „two groups range 12, track west, lead group bullseye 045/60, 25 thousand, hostile; trail group 20 thousand, hostile“ |
| `{pic.head}` | Label mit gemeinsamem Track: „two groups range 10, track east“ |
| `{pic.track}`, `{pic.trackMode}` | „track east“ bzw. leer / `none`, `common`, `each` |
| `{pic.threat}` | neue Gruppe aus derselben eigenen Position, 20–35 NM, hot oder flank, hostile (Felder wie `g1`, Name „threat group“) |
| `{pic.ingress}` | Check-in-Punkt vom Bullseye („226/18“), 15–25 NM vor der Station |
| `{pic.g1.cutoff}` | Abfangkurs („053“) |
| `{pic.g1.braaLater}` | BRAA nach halber Strecke auf dem Abfangkurs (gleiche Peilung, halbe Entfernung; `.bearing`, `.range`) |
| `{pic.label}` | „two groups azimuth 12“, „three groups vic 15 deep, 10 wide“, ohne Label „two groups“ |
| `{pic.labelKind}`, `{pic.count}` | „vic“ (ohne Label „core“), „3“ |
| `{pic.sep}`, `{pic.wide}`, `{pic.deep}` | erstes gesprochenes Maß, Breite, Tiefe in NM (0, wenn das Label sie nicht hat) |
| `{pic.g1.name}` | „north group“ (bei range: lead/trail, bei single: single group, ohne Label: group) |
| `{pic.g1.bulls}` | „045/60“, gesprochen „zero four five, sixty“; Unterfelder `.bearing`, `.range` – auch für Gruppen ohne Bullseye im Call |
| `{pic.g1.braa}` | „270/25“ von dir aus; Unterfelder `.bearing`, `.range` |
| `{pic.g1.alt}` | „25 thousand“ / „twenty-five thousand“ (ziffernweise getippt zählt genauso) |
| `{pic.g1.angels}` | dieselbe Höhe als angels („25“ / „two five“) – nur für Distraktoren |
| `{pic.g1.track}`, `{pic.g1.aspect}` | „west“, „hot“ / „flank northeast“ / „beam south“ / „drag west“ |
| `{pic.g1.id}`, `{pic.g1.heavy}` | „hostile“, „heavy“ (ab 3 Flugzeugen, sonst leer) |
| `{pic.g1.call}`, `{pic.g1.braaCall}` | Gruppe wie im Picture (Trail-Gruppe: „trail group 20 thousand, hostile“) bzw. „BRAA 270/25, 25 thousand, hot, hostile“ |
| `{pic.near}` | die Gruppe, die dir am nächsten ist (gleiche Felder wie g1) – für Bogey Dope |
| `{pic.own.bulls}` | deine eigene Position vom Bullseye |

### Einsatzraum (`casArea`)

Für CAS (Spur C) würfelt `{ casArea: true }` eine ganze Lage: Ziel, Freundkräfte mit JTAC, Bedrohung, IP, Gelände,
Tageszeit und Waffe. Daraus werden alle Werte des 9-Line berechnet, damit sie zueinander passen
(`src/core/random/cas.ts`, die Regeln stehen dort).

```yaml
vars:
  jtac: { pool: callsigns.jtac }
  cas: { casArea: true }          # control: 1|2|3|any, terrain: flat|hills|mountains|any, time: day|night|any,
                                  # mark: laser|wp|ir|none|any, dangerClose: yes|no|any (Standard no),
                                  # aircraft: a10 (Waffen), gridDigits: 6|8|10 (Standard 8)
```

| Platzhalter | Beispiel geschrieben → gesprochen |
|---|---|
| `{cas.ip}` | Line 1: „Granite“ |
| `{cas.hdg}`, `{cas.offset}` | Line 2: „270“ → „two seven zero“ (missweisend), „left“ |
| `{cas.dist}` | Line 3: „8.5“ → „eight point five“ (NM) |
| `{cas.elev}` | Line 4: „1250“ → „one two five zero“ (ft MSL) |
| `{cas.target}` | Line 5: „two BMP-2 in the open“; `.count`, `.keyword`, `.bda` („two BMP-2 destroyed“) |
| `{cas.grid}` | Line 6: „NK 1234 5678“ → „November Kilo one two three four five six seven eight“; `{cas.gridWrong}` mit einem Zahlendreher |
| `{cas.mark}` | Line 7: „laser 1688“, „Willie Pete“, „sparkle“ oder „none“; `{cas.code}` der Laser-Code |
| `{cas.friend}` | Line 8: „south 1200“ → „south one thousand two hundred“; `.dir`, `.dist`, `.grid` |
| `{cas.egress}` | Line 9: „west to Timber“; `.dir`, `.to` |
| `{cas.fah}` | Final Attack Heading „360-060“ → „three six zero to zero six zero“; `.from`, `.to` |
| `{cas.ltl}` | Laser-Target-Line (Kurs JTAC → Ziel) |
| `{cas.threat}` | „ZSU-23-4“; `.dir`, `.dist` (km) |
| `{cas.minAlt}` | Mindesthöhe aus der Bedrohung als angels |
| `{cas.ctrl}`, `{cas.attack}` | Control Type „2“, „bomb on target“ (`.short` BOT/BOC) |
| `{cas.weapon}` | „GBU-12“; `.effect` („one GBU-12“), `.call` („bombs away“, „rifle“, „guns“) |
| `{cas.tot}`, `{cas.now}` | Time on Target und Uhrzeit beim Check-in |
| `{cas.inDir}`, `{cas.offDir}` | „IN from the west“, „OFF north“ |
| `{cas.keyhole}` | Halteposition „Alfa 12“; `.letter`, `.dist` |
| `{cas.fromFriend}` | 5-Line: Richtung und Abstand von den Freunden zum Ziel |
| `{cas.initials}` | Initialen des Bodenkommandeurs bei Danger Close („Alfa Kilo“) |
| `{cas.terrain}`, `{cas.daytime}`, `{cas.magVar}` | für Situationstexte: „Hügelland“, „Tag“, „6° E“ |
| `{cas.laser}`, `.wp`, `.ir`, `.nomark`, `.dc`, `.night`, `.day`, `.type1`–`.type3`, `.bot`, `.boc`, `.bomb` | Schalter für `when:` („yes“ oder leer) |

### Karten (`chart`)

Schematische **Platzkarte** (`airport`) oder **Anflugkarte** (`approach`) aus den Flugplatzdaten. Sie
wird gezeichnet und stellt ihre Werte als Platzhalter bereit. Es sind Lernkarten im Papier-Look, keine
Navigationskarten.

```yaml
vars:
  af: { pool: airfields }
  wx: { weather: true, airfield: af }                  # optional: aktive Bahn aus dem Wind
  cp: { commplan: true, airfield: af }                 # optional: ATIS/Ground/Approach aus dem Comm Plan
  apc: { chart: approach, airfield: af, commplan: cp, weather: wx, freqs: sim }   # freqs: sim | real
```

**Was echt ist und was abgeleitet:**
- **Echt aus den Daten:** Bahnen, TACAN, ILS, Tower-Frequenz und Platzhöhe. Ohne Höhe in den Daten steht
  dort „—“, und alle Höhen gelten als Höhe über Platz.
- **Nach festen Regeln abgeleitet:**
  - FAF-Höhe aus einem 3°-Gleitpfad
  - DA = Platzhöhe + 200 ft (ILS), MDA ≈ Platzhöhe + 400–550 ft (TACAN)
  - IAF, MSA und Fehlanflug
- **Bahn der Anflugkarte**, in dieser Reihenfolge: Wetter → ILS-Bahn aus den Daten → `{af.runway}`. Im
  Text deshalb `{apc.runway}` verwenden.

| Platzhalter | Inhalt |
|---|---|
| `{apc.tower}`, `{apc.ground}`, `{apc.atis}`, `{apc.approach}`, `{apc.departure}` | Frequenzen, wie sie auf der Karte stehen |
| `{apc.runway}`, `{apc.elevation}`, `{apc.tacan}`, `{apc.icao}` | Bahn, Platzhöhe („1,870 ft“ oder „—“), TACAN, ICAO |
| `{apc.navaid}`, `{apc.type}`, `{apc.course}` | nur Anflugkarte: „ILS 13 110.3“ / „TACAN 16X“, ILS/TACAN, Endanflugkurs |
| `{apc.faf}`, `{apc.faf.nm}`, `{apc.faf.alt}` | FAF: „6 NM / 2,000 ft“, Entfernung, Höhe |
| `{apc.iaf}`, `{apc.iaf.alt}` | IAF |
| `{apc.da}`, `{apc.minimum}`, `{apc.visibility}` | Mindesthöhe (DA bei ILS, MDA bei TACAN), Sicht |
| `{apc.msa}`, `{apc.missedAlt}`, `{apc.missed}` | MSA, Fehlanflughöhe, Fehlanflugtext |

**In Leseseiten:** `::chart{kind=approach}` zeigt eine Karte für einen gewürfelten Platz (Knopf
„anderer Platz“). `::chart{kind=airport airfield=batumi freqs=real}` zeigt einen festen Platz mit den
echten Frequenzen.

### Zahlenarten (`number`)

| Art | Beispiel geschrieben → gesprochen | Standardbereich |
|---|---|---|
| `heading`, `bearing` | 090 → zero niner zero | 010–360 (Zehner) / 001–360 |
| `altitude` | 15,500 → one five thousand five hundred (geschrieben in Cockpit-Form; in deutschem Fließtext `{x|spoken}` oder eigene Form nutzen) | 2.000–35.000 ft, Schritt 500 |
| `angels` | 25 → two five | 5–35 |
| `thousands` | 16.9 → one six point niner (blind-Ruf); Felder `.angels` (17 → one seven), `.feet` (16.900) | 5.0–35.0, Schritt 0.1 |
| `uhf`, `vhf`, `vhf-fm` | 251.25 → two five one point two five | 225–399.75 / 118–136.95 / 30–87.95 MHz |
| `altimeter` | 29.92 → two niner niner two | 29.70–30.30 inHg |
| `qnh` | 1013 → one zero one three | 995–1030 hPa |
| `pressure` | 29.92 → two niner niner two bzw. 1013 → one zero one three; Felder `.word` („altimeter“/„QNH“), `.other` (das Wort der anderen Form), `.unit` („inHg“/„hPa“). Nur mit `airfield` (Pflicht), ohne `range` | FAA 29.70–30.30 inHg, ICAO 995–1030 hPa |
| `fuel` | 5.8 → five point eight | 2.0–9.9 (Tausend Pfund) |
| `time` | 1430 → one four three zero | ganzer Tag, Schritt 5 min |
| `runway` | 13 → one three | 01–36 |
| `channel` | 14 → one four | 1–20 |
| `squawk` | 4215 → four two one five | Ziffern 0–7, ohne 7500/7600/7700 |
| `speed` | 350 → three five zero | 250–450 kt, Schritt 10 |
| `mach` | 0.85 → point eight five | 0.70–1.40 |
| `playtime` | 1+30 → one plus three zero | 15–120 min, Schritt 5 |
| `modex` | 305 → three zero five | 100–115, 200–215, 300–315, 400–415 |
| `elevation` | 1250 → one two five zero (Line 4) | 0–9.000 ft, Schritt 5 |
| `lasercode` | 1688 → one six eight eight | nur gültige Codes 1111–1788 (keine 0, keine 9) |
| `nm` | 8.5 → eight point five (Line 3) | 5–15, Schritt 0.1 |
| `meters` | 1200 → one thousand two hundred | 300–3.000, Schritt 100 |
| `cardinal` | south → south, Feld `.opposite` (north) | 8er-Rose |
| `mgrs` | NK 1234 5678 → November Kilo one two three four … (`digits: 6/8/10`) | gewürfeltes Quadrat |
| `initials` | AK → Alfa Kilo | zwei Buchstaben |

`range` und `step` gelten in der natürlichen Einheit der Art (Fuß, MHz, Grad, Minuten …).

### Felder der Pools

| Variable | Felder |
|---|---|
| Flugplatz (`pool: airfields`) | `name` (Funkname), `alias` (erster Alias, z. B. Kunsan), `icao`, `map`, `uhf`, `vhf`, `twr`, `gnd`, `app`, `dep` (je mit `.band`; Tower UHF, sonst VHF; Ground aus `freqs.ground`, sonst Tower; Approach/Departure aus `freqs`, sonst gewürfelt), `hf`, `vhfLow`, `runway`, `tacan`, `parking`, `taxi`, `arming`, `atis`, `ground`, `departure`, `approach`, `elevation`, `charts`, `real.tower` / `real.ground` / `real.atis` / `real.approach` / `real.departure` / `real.clearance`, `real.source`; Phraseologie (gesprochene Form nach Profil-Einstellung und Karte): `phraseology` („FAA“/„ICAO“, `.form` „US-Form (FAA)“/„ICAO-Form“, `.here` dieselbe Form mit Hinweis, wenn sie von der Karte abweicht, `.map` die Form der Karte mit `.map.form`), `faa`/`icao` („yes“ oder leer, für `when:`), `climb`, `descend` (mit `.ing`, `.other`, `.otherIng`) |
| Träger (`pool: carriers`) | `name`, `short`, `hull`, `class`, `tacan` (gewürfelt), `icls` (gewürfelt), `brc` (gewürfelt) |
| Flugzeug (`pool: aircraft`) | `type`, `radio`, `id` |

Flugplatz-Felder, die in der Datei fehlen, liefern „—“ (`parking`: „the ramp“, `arming`: „the
arming area“). Neue optionale Felder in `airfields/*.yaml`: `freqs: { atis, ground, departure,
approach }`, `parking: [...]`, `taxiways: { "31": [Alpha, Bravo] }`, `arming`, `elevationFt`,
`charts: [{ sim: dcs, name: …, path: … }]` (mitgelieferte Karten), `realFreqs: { tower, ground, atis,
approach, departure, clearance }` (laut echtem AIP, getrennt von den Sim-Frequenzen) und `realSource`.

`name` ist der **Funkname** ohne „AB“ („Gunsan Ground“, nicht „Gunsan AB Ground“; der Validator lehnt „AB“ ab),
weitere Namen stehen in `aliases`. Unter `atc` steht mindestens `uhf` oder `vhf` (Plätze, die in der Sim nur auf VHF
erreichbar sind, haben kein `uhf`), dazu optional `hf` und `vhfLow` (Kurzwelle und tiefes VHF wie im DCS-Flugplatzfenster).

**Pool-Filter `require`:** `{ pool: airfields, require: [realFreqs] }` würfelt nur Plätze, bei denen das
Feld gesetzt ist – z. B. für die Übung „Sim-Frequenz oder echte Frequenz?“. Pfade gehen auch: `require: [atc.uhf]`.

### Wetter (`weather: true`)

```yaml
vars:
  af: { pool: airfields }
  wx: { weather: true, airfield: af, wind: any, sky: any }   # wind: any|calm|light|strong, sky: any|vmc|imc
```

Felder: `wind` („310 at 6“ / „three one zero at six“, auch „calm“ und „gusting“), `windShort` (Kneeboard-Form
„310/6“), `windDir`, `windSpeed`, `vis` (Sicht als Zahl in der Einheit des Platzes: Meilen bzw. Kilometer, `.unit`
„Meilen“/„km“), `visibility` (der ganze ATIS-Teil: „visibility one zero“ bzw. „visibility one zero kilometers“),
`clouds` (US-Form „4,500 scattered“, „ceiling 4,500 broken“ oder „sky clear“ – auch an ICAO-Plätzen), `ceiling`,
`temp`, `dew`, `altimeter` (inHg), `qnh` (hPa, derselbe Druck), `pressure` (der Luftdruck in der Form des Platzes,
Felder wie bei `number: pressure`), `case` („Case I/II/III“ für Träger, aus Wolkenuntergrenze und Sicht), `imc`. Mit
`airfield` zusätzlich `runway` (gegen den Wind) und `taxi`. **Die Runway des Flugplatzes wird dabei
angeglichen**: `{af.runway}` und `{wx.runway}` sind dann immer gleich.

### Phraseologie je Karte (FAA oder ICAO)

Jede Karte in `pools/maps.yaml` hat `phraseology: faa` oder `phraseology: icao` (Pflicht, der Validator verlangt
sie). `faa` steht für die US-Form (Nevada, Guam, Korea), `icao` für alle Karten ohne US-Flugsicherung (Georgien, Golf …).

**Profil-Einstellung „Phraseologie der Lotsen“** (`profile.phraseology`, im Würfel `ResolveEnv.phraseology`):

| Einstellung | Wirkung |
|---|---|
| `us` – „Immer US-Form (FAA)“, **Standard** | Jeder Platz spricht die US-Form, auch in Georgien und am Golf. So funkt man in den meisten Sim-Staffeln. Ältere gespeicherte Profile ohne das Feld bekommen diesen Wert. |
| `map` – „Kartenabhängig“ | Jeder Platz spricht die Form seiner Karte (realistischer). |

Die Mindesthöhen hängen nicht davon ab: Höhen mit `above` richten sich immer nach der Höhe des Platzes. Ohne
Angabe im `ResolveEnv` (z. B. in Tests) gilt `us`.

Gewürfelte Funksprüche sprechen die gesprochene Form (Einstellung, bei `map` die Karte), ohne dass man sie doppelt
schreibt:

| Baustein | US-Form (FAA) | ICAO-Form |
|---|---|---|
| `{p.word} {p\|spoken}` mit `p: { number: pressure, airfield: af }` | altimeter two niner niner two | QNH one zero one three |
| `{wx.pressure.word} {wx.pressure\|spoken}` (Wetter mit `airfield`) | altimeter three zero zero one | QNH one zero one six |
| `{wx.visibility\|spoken}` | visibility one zero | visibility one zero kilometers |
| `{af.descend} {alt\|spoken}` | descend and maintain five thousand | descend to five thousand |
| `{af.climb} flight level {fl\|spoken} zero` | climb and maintain flight level … | climb to flight level … |
| `{af.descend.ing}`, `{af.climb.ing}` | descending and maintaining, climbing and maintaining | descending to, climbing to |
| `{af.descend.other}`, `{af.descend.otherIng}` (für `weak`) | descend to, descending to | descend and maintain, descending and maintaining |
| `{af.phraseology}`, `{af.phraseology.form}` | FAA, US-Form (FAA) | ICAO, ICAO-Form |
| `{af.phraseology.here}` (für Sätze über den Platz) | US-Form (FAA); bei „Immer US“ an einem ICAO-Platz: US-Form (FAA; laut Profil-Einstellung, real wäre an diesem Platz ICAO üblich) | ICAO-Form |
| `{af.phraseology.map}`, `{af.phraseology.map.form}` | die Form der Karte, unabhängig von der Einstellung: FAA bzw. ICAO, US-Form (FAA) bzw. ICAO-Form | |
| `when: af.icao` bzw. `when: af.faa` | Segment nur an Plätzen dieser Form | |

**Readbacks:** Die gesprochene Form gilt voll, die andere als `weak` mit Hinweis (halbe Punkte, bleibt richtig). Der
Hinweis nennt die Form neutral („In der US-Form (FAA) heißt es …“, „In der ICAO-Form heißt es …“), nicht den Platz:

```yaml
- text: "{p.word} {p|spoken}"
  role: value
  weak: ["{p.other} {p|spoken}"]
  weakNote: "In der {af.phraseology.form} heißt der Luftdruck „{p.word}“"
- text: "{af.descend} {alt|spoken}"
  role: instruction
  alt: ["{af.descend.ing} {alt|spoken}"]
  weak: ["{af.descend.other} {alt|spoken}", "{af.descend.otherIng} {alt|spoken}"]
  weakNote: "In der {af.phraseology.form} heißt es „{af.descend}“"
```

**In Erklärtexten** nennst du entweder beide Formen („altimeter“ in der US-Form, „QNH“ nach ICAO) oder nimmst die
Platzhalter (`{p} {p.unit}` → „1013 hPa“, `{wx.vis} {wx.vis.unit}` → „10 km“). Sätze über den Platz („in {af.name}
gilt die …“, „der Lotse spricht die …“) nehmen `{af.phraseology.here}`, nie `.form` – sonst stünde bei „Immer US“ in
Georgien, dort gelte die US-Form. Ein Test prüft das. Feste Texte in Lektionen nennen den Standard und die
Einstellung („Mit der Einstellung „Kartenabhängig“ im [Profil](/profile) …“). Mitschreib-Felder heißen „Luftdruck
({wx.pressure.unit})“ und nehmen `{wx.pressure}` und `{wx.pressure|spoken}` an.

**Bewusst noch überall US-Form** (für ICAO fehlt ein lokaler Beleg oder der Umbau wäre groß): Wolken in der ATIS
(„4,500 scattered“), die Bitte „advise on initial contact …“, die IFR-Freigabe („cleared to … airport, as filed“),
die Rollfreigabe („taxi via …, hold short of …“), „radar contact“ und „leaving …“ (dort gilt „passing …“ gleichwertig).
Die Zahlen-Übung `number-to-spoken` mit `kind: altimeter` hat keinen Platz und bleibt bei inHg.

### Comm Plan (`commplan: true`)

Stellen: `atis`, `ground`, `tower`, `departure`, `approach`, `awacs`, `tanker`, `strike`, `flight`,
`jtac` (VHF-FM) und `guard` (243.0). Jede Stelle hat die Felder `name`, `channel`, `freq`, `band`.
Kanäle und Frequenzen sind alle verschieden. Mit `airfield` ist Tower die echte Platzfrequenz, und
bekannte `freqs` des Platzes werden übernommen (auch wenn sich Approach und Departure eine Frequenz teilen). Auf
BMS-Plätzen (`map: kto`) gilt der feste BMS-Comm-Plan: UHF 2 Ground, 3 Tower, 4 Departure/Approach, 6 AWACS/JTAC,
13 Tanker; ATIS auf VHF 2, Flight auf VHF 15. Beispiel: `push {cp.strike.name}` → Kanal
`{cp.strike.channel}`, Frequenz `{cp.strike.freq}`.

### Profil-Filter

Übungen und Funksprüche können `sims: [dcs, bms]` und/oder `aircraft: [f14, f4]` haben. Der
Lektionsplayer und der Einstufungstest überspringen Übungen, die nicht zum Profil passen. Wer im
Profil nichts gewählt hat, bekommt alles.

## Übungen (`drills/*.yaml`)

Alle Übungen haben `id`, optional `prompt`, `explain` (Erklärung nach der Antwort), `layer`, `vars`,
`sims` und `aircraft` (Profil-Filter).

**Platzhalter nie mit Lösungswort:** Das Feld `placeholder` in Eingabefeldern zeigt höchstens die Form der
Antwort („z. B. 31“, „Nummer eintippen …“), nie ein Stichwort der Lösung („angels …“, „heading …“). Muss die
Antwort mit einem Stichwort beginnen, sagt der Prompt, *dass* eines verlangt wird („mit dem passenden
Stichwort“), aber nicht welches. Ohne `placeholder` steht „Funkspruch eintippen …“. Ein Test
(`src/core/placeholder.test.ts`) prüft, dass der Platzhalter nicht mit dem ersten Wort einer akzeptierten
Antwort beginnt.

**Vorschau:** Jede Übung lässt sich in der laufenden App unter `#/drill/<id>` einzeln ansehen und
neu würfeln (z. B. `http://localhost:5173/#/drill/beispiel-atis-decoder`). Vollständige Beispiele
aller Formate stehen in `drills/beispiele-format.yaml`.

```yaml
# Multiple Choice – answer ist der Index der richtigen Option vor dem Mischen
- id: m1-l1-order
  type: choice
  prompt: Frage (Markdown, Platzhalter erlaubt)
  options: [richtig, falsch, falsch, falsch]
  answer: 0
  shuffle: true            # optional, Standard true
  explain: Warum.

# Zuordnen – Paare links ↔ rechts, rechts wird gemischt
- id: m1-l5-match
  type: match
  prompt: Ordne zu.
  pairs:
    - [roger, Empfangen]
    - [wilco, Verstanden, wird ausgeführt]

# Baukasten – Segmente einer Übertragung in die richtige Reihenfolge bringen
- id: m1-l1-build-startup
  type: build
  call: m1-startup-request
  transmission: 0          # optional, Standard: erste Übertragung mit you: true
  distractors: ["{wingman|spoken}", request taxi]

# Anatomie – auf das Segment mit der gesuchten Rolle tippen
- id: m1-l1-anatomy-request
  type: anatomy
  call: m1-startup-request
  target: request
  prompt: Wo steht, was der Pilot will?

# Freitext – Vergleich nach Normalisierung, z. B. "niner" = "nine" = "9", Groß-/Kleinschreibung egal, Bahn "21R" = "21 right" = "two one right".
# Buchstabierwörter (NATO-Alphabet) verzeiht der Vergleich: Charley/Whisky/Viktor/"x ray" und ein Tippfehler
# ("Siera") gelten als richtig, die Rückmeldung zeigt die Schreibung. Zahlen, Brevity- und Standardwörter nicht.
- id: m1-l3-input-heading
  type: input
  prompt: Sprich „Kurs 090“ im Funkformat.
  accept: ["heading zero niner zero"]
  placeholder: heading …

# Generiert – die Übung wird zur Laufzeit gewürfelt
- id: m1-l2-letter
  type: generated
  generator: phonetic-letter-to-word

# Mehrfachauswahl – answer als Liste
- id: beispiel-mehrfachauswahl
  type: choice
  prompt: Was liest du zurück? (Alles Zutreffende)
  options: [Runway, Hold short, Rollroute, Wind]
  answer: [0, 1, 2]

# Lückentext – Segmente einer Übertragung werden zu Eingabefeldern
- id: beispiel-lueckentext
  type: cloze
  call: m1-startup-request
  transmission: 0
  blanks: [0, 2]              # Segment-Indizes, mindestens eins muss sichtbar bleiben
  prompt: Du stehst in **{airfield.name}** und hast ATIS **{atis}** gehört …

# Reihenfolge – Einträge (items) ODER Übertragungen eines Funkspruchs (call, optional transmissions)
- id: beispiel-reihenfolge
  type: sequence
  prompt: In welcher Reihenfolge …?
  items: [ATIS hören, "Ground: Anlassfreigabe", "Tower: Startfreigabe"]

# Formular – mehrere Felder mit eigener accept-Liste (ATIS-, Marshal-, 9-Line-Decoder)
- id: beispiel-atis-decoder
  type: form
  vars: { af: { pool: airfields }, wx: { weather: true, airfield: af }, info: { letter: true } }
  prompt: Schreib die wichtigsten Werte mit.
  context: "{af.name} information {info}. Wind {wx.wind|spoken} …"   # Markdown, optional
  call: m3-atis               # optional: Funkspruch als Vorlage (neutral, ohne Farben)
  fields:
    - { label: Runway, accept: ["{wx.runway}"], placeholder: z. B. 31 }
    - { label: "Luftdruck ({wx.pressure.unit})", accept: ["{wx.pressure}", "{wx.pressure|spoken}"] }

# Funkspruch tippen – bewertet Segment für Segment (siehe „Segmente für die Tipp-Bewertung“)
- id: beispiel-bogey-dope-tippen
  type: call
  call: beispiel-bogey-dope
  transmission: 0          # optional, Standard: eigene Übertragung (you bzw. Perspektive)
  as: two                  # optional, Perspektive
  show: 1                  # optional, wie viele Übertragungen vorher zu hören sind
  hint: Adressat – Rufzeichen – Brevity   # optional, sonst automatisch aus den Rollen

# Schweigen ist die richtige Antwort (push, Meldungen für andere, EMCON)
- id: beispiel-push-schweigen
  type: call
  call: beispiel-push
  as: two
  expect: silence

# 9-Line-Decoder (Spur C): Brief nacheinander zeigen, Zeile für Zeile mitschreiben, dann zurücklesen
- id: beispiel-nineline
  type: nineline
  call: track-c-nineline      # der Brief mit einer casArea-Variable
  readback: track-c-readback  # optional: Readback mit Pflicht-Slots (critical) und erlaubten Zusätzen (optional + free)
  format: nineline            # oder fiveline (Felder Line 1–5 für Hubschrauber)
  fields: [4, 6, fah]         # optional: nur diese Zeilen (1–9, fah, ltl, tot); sonst alle, ltl nur bei Laser
  reveal: step                # step = Übertragung für Übertragung, click = verdeckt bis Klick (später: abspielen), all
  sketch: true                # Lageskizze nach dem Prüfen
# Prüfung je Zeile: Kurse, Höhe, Koordinate genau (ein Zahlendreher in Line 6 gibt halbe Punkte), Line 3 ±0,1 NM,
# Richtungen als Wort oder Abkürzung (S, NW), Line 5 über das Stichwort aus pools/cas.yaml, Line 7 mit Laser-Code.

# Lagebild-Decoder auf der Bullseye-Karte
- id: beispiel-lagebild-setzen
  type: plot
  vars: { pic: { geo: true, groups: 1 } }
  geo: pic                 # Name der geo-Variable
  mode: place              # place = Gruppe nach Call setzen; bullseye/braa = Peilung+Entfernung ablesen
  group: 1                 # welche Gruppe (1–3)
  call: beispiel-bogey-dope  # optional: Funkspruch dazu anzeigen; sonst context oder automatischer Call
  bearingTolerance: 5      # optional (Grad)
  rangeTolerance: 3        # optional (NM); beim Setzen gilt max(2× rangeTolerance, 12 % der Entfernung)

# Auf das richtige Element einer Karte tippen
- id: beispiel-karte-landefrequenz
  type: chart-tap
  vars:
    af: { pool: airfields }
    cp: { commplan: true, airfield: af }
    apc: { chart: approach, airfield: af, commplan: cp }
  chart: apc                 # Name der Karten-Variable
  prompt: Tippe auf die Frequenz für die Landefreigabe.
  target: tower              # oder eine Liste: [approach, departure]
  # Ziele: atis, clearance, ground, tower, approach, departure, elevation, tacan, rwy:<Bahn>, rwy:active
  #        nur Anflugkarte: navaid, course, faf, iaf, da, msa, missed, minima

# Formular mit Karte als Vorlage
- id: beispiel-anflugkarte-lesen
  type: form
  vars: { af: { pool: airfields }, apc: { chart: approach, airfield: af } }
  chart: apc
  prompt: Lies die Anflugkarte.
  fields:
    - { label: "FAF-Höhe (ft)", accept: ["{apc.faf.alt}", "{apc.faf.alt|spoken}"] }
```

Generatoren (`generator`):

| Generator | Übung |
|---|---|
| `phonetic-letter-to-word` | Buchstabe → richtiges Alphabet-Wort |
| `phonetic-word-to-letter` | Alphabet-Wort → Buchstabe |
| `phonetic-spell` | ein Wort buchstabieren (Freitext) |
| `number-to-spoken` | Zahl → richtige Funk-Aussprache. `params: { kind: heading }` wählt die Zahlenart, sonst zufällig |
| `spoken-to-number` | Funk-Aussprache → Zahl |
| `flight-position` | Rufzeichen wie „Viper 2-3“ → Rolle im Flight |
| `lasercode-valid` | Welcher von vier Laser-Codes ist gültig? |
| `mgrs-spoken-to-text` | MGRS aus der Sprechform aufschreiben (Freitext) |

`number-to-spoken` und `spoken-to-number` würfeln ohne `kind` nur die Zahlenarten aus Modul 1. Die CAS-Arten
`lasercode`, `elevation`, `nm` und `mgrs` gibt es nur mit `params: { kind: … }`.

## Szenarien (`scenarios/*.yaml`)

Ein Szenario ist ein Funkablauf Schritt für Schritt – mit Stufenleiste, Funk-Log (mit Anatomie),
Anzeige des aktiven Funkgeräts und optional einer schematischen Platzskizze. Alle Variablen werden
**einmal pro Durchlauf** gewürfelt. Eine Datei = ein Szenario. Vollständiges Beispiel:
`scenarios/beispiel-abflug.yaml`.

```yaml
id: m3-s1-kaltstart
title: Abflug von {af.name}
summary: Ein Satz für die Übersicht.
vars:
  af: { pool: airfields }
  wx: { weather: true, airfield: af, sky: vmc }
  cp: { commplan: true, airfield: af }
as: lead                          # optional: eigene Station/Position
sketch: { airfield: af, weather: wx }   # optional: Platzskizze mit aktiver Runway und Wind
steps:
  - stage: Taxi                   # Name in der Stufenleiste (gleiche Namen hintereinander = eine Stufe)
    pos: taxi                     # Position in der Skizze: parking, taxi, holdshort, runway, airborne, pattern, final, landed
    tune: { name: "{af.name} Ground", freq: "{cp.ground.freq}", channel: "{cp.ground.channel}" }
                                  # Funkgerät selbst einstellen (siehe unten); channel optional
    freq: "Intercom · Crew Chief" # nur Anzeige ohne Einstellen (z. B. Intercom); bleibt bis zur nächsten
    situation: Was gerade passiert (Markdown).
    hear: [ … Übertragungen … ]   # was du vorher hörst
    you:                          # dein Zug (weglassen = nur zuhören)
      mode: type                  # type (tippen, Slot-Bewertung) | build (Baukasten) | choice (Auswahl)
      transmission: { speaker: "{callsign}", segments: [ … ] }
      distractors: [ … ]          # build: Störbausteine
      wrong: [ … ]                # choice: falsche Alternativen als ganze Funksprüche
      hint: …                     # optional
    silence: false                # true = die richtige Antwort ist, nichts zu sagen (dann ohne you)
    decode: { area: cas }         # statt you: mitschreiben, was in hear kommt (9-Line, mit format: fiveline der 5-Line)
    reply: [ … Übertragungen … ]  # was nach deinem Zug kommt
    explain: Erklärung nach dem Schritt (Markdown).
```

### Frequenzen nachschlagen und einstellen (`kneeboard`, `tune`, `where`)

Wichtig ist nicht, ob eine Frequenz „echt“ oder „aus der Sim“ ist, sondern dass jede Übung feste
Frequenzen hat, die man **selbst findet und einstellt**. Deshalb nennt der Situationstext keine
Frequenz und keinen Kanal. Die Werte stehen im **Kneeboard**: Es erscheint vor dem Start als
Briefing und bleibt während des Szenarios über den Knopf „📋 Kneeboard“ erreichbar.

```yaml
kneeboard:
  title: "Comm Card {af.name}"      # optional
  commplan: cp                      # Comm-Plan-Variable; ohne stations: alle Stationen daraus
  stations: [atis, ground, tower, departure]
  rows:                             # freie Zeilen, z. B. eine Platzfrequenz ohne Comm Plan
    - { label: "Platzfrequenz ({af.name} Traffic)", value: "{af.twr}" }
  airfield: af                      # Flugplatz-Variable: Höhe, Bahnen, TACAN, ILS
  chart: apch                       # optional: chart-Variable als aufklappbare Karte
  where:                            # Wo steht das in der Sim? Gezeigt werden nur die Sims im Profil
    dcs: "Missionsbriefing bzw. Comm Card im Kneeboard …"
    bms: "Comm Plan im Briefing bzw. Line-up-Card …"
    il2: "…"
    srs: "…"
```

Ein Schritt mit `tune` lässt dich das Funkgerät einstellen, bevor du etwas hörst oder sagst.
Angenommen werden der Kanal („4“, „ch 4“, „Kanal 4“, „button four“, Warbird-Kanäle „A“, „Kanal B“, „button C“) oder die Frequenz („251.25“,
„251,25“). Wer danebenliegt, erfährt, wer stattdessen antwortet („Auf Kanal 7 meldet sich Tower“)
oder dass es still bleibt, dazu den richtigen Wert und den Fundort. Danach steht das Funkgerät
richtig, und das Szenario geht weiter. Das Einstellen zählt in die Wertung wie ein eigener Zug.
`tune.where` überschreibt bei Bedarf `kneeboard.where` für diesen Schritt.

Regeln (prüft `npm run validate`): Schritte mit `tune` brauchen ein `kneeboard`. Die `stations`
müssen Comm-Plan-Stationen sein (atis, ground, tower, departure, approach, awacs, tanker, strike,
flight, jtac, guard), `airfield` eine Flugplatz- und `chart` eine Karten-Variable.

**In Lektionen:** Eine Seite, die nur aus `::scenario{id=…}` besteht, spielt das Szenario als einen
Schritt der Lektion. Das Ergebnis (Anteil richtiger Schritte) zählt in die Lektionswertung.
**Einzeln spielen:** `#/scenario/<id>`, als Checkride-Vorschau `#/scenario/<id>?checkride`.

## Einstufungstest

In `curriculum.yaml` kann ein Modul `placement: { drills: [...], passScore: 0.8 }` haben. Wer beim
ersten Start sagt „kenne ich schon“, macht diesen Test. Wer besteht, hat das Modul erledigt.

## Modulprüfung

Am Ende eines Moduls (Ausbildungsweg, Modulkarte, „Modulprüfung ablegen“, Route `#/exam/<modul>`) prüft die App mit
**neuen Fragen** zu allen Lektionen. Anders als die Einstufung (feste Fragen, vor dem Modul) kommen die Fragen aus einem
Pool, aus dem jede Prüfung andere zieht: je Lektion eine, dann eine zweite, bis die Sollgröße erreicht ist, und
am Ende gemischt. Wer besteht, hat das Modul abgeschlossen (wie bei der Einstufung) und bekommt einmalig 20 % der
Lektions-XP. Die Auswertung zeigt die Fehler mit richtiger Antwort und Sprung zur Lektion.

```yaml
# curriculum.yaml, am Modul
exam:
  size: 14          # Fragen je Prüfung (höchstens 2 je Lektion)
  passScore: 0.8    # Standard 0.8
```

Der Pool besteht aus **Übungen mit `exam: true`**. Sie kommen in keiner Lektion und keiner Einstufung vor (der
Validator prüft das). Jede Prüfung zieht mindestens drei **Produktionsübungen** (Funkspruch tippen, bauen oder
zurücklesen; `MIN_PRODUCTION` in `src/core/progress/exam.ts`), wenn der Pool sie hat – je Modul also mindestens drei,
auf mindestens zwei Lektionen verteilt. Die Lektion steht am Anfang der ID (`m3-l5-x-ready` gehört zu `m3-l5`). Neue Fragen liegen in `drills/exam-<modul>.yaml`, ältere
Übungen, die in keiner Lektion eingebunden waren, tragen das Flag einfach in `<modul>.yaml`.

```yaml
- id: m1-l7-x-calc-tower
  type: input
  exam: true
  …
```

Regeln für Prüfungsfragen:
- **Je Lektion mindestens zwei, besser drei oder mehr Fragen**, damit zwei Versuche nicht gleich aussehen. Der Validator
  verlangt mindestens zwei je Lektion mit Übungen und insgesamt so viele, wie `size` verlangt.
- Der `prompt` muss für sich allein verständlich sein (nicht „wie eben“) und darf die Antwort nicht verraten.
- Würfeln, wo es geht (Rufzeichen, Plätze, Zahlen über `vars`), und eine Frage prüfen, nicht mehrere.
- Prüfungsfragen zählen nicht für den Funk-Drill des Tages, nur für die Prüfung selbst.

Der Validator prüft: Die ID beginnt mit der ID einer Lektion, das Modul hat `exam`, die Frage steht in keiner Lektion und
Einstufung, und der Pool reicht für die Sollgröße. Ein Test (`src/core/exam.test.ts`) prüft Auswahl und Fortschritt.

## Ränge und Checkrides

Die Ränge stehen in `curriculum.yaml` unter `ranks`, vom niedrigsten zum höchsten (aufsteigende
`xp`). Ein Rang ohne `checkride` gilt allein über die XP. Ein Rang mit `checkride` gilt erst, wenn
die XP reichen **und** der Checkride bestanden ist. Ränge zählen der Reihe nach: Ohne Checkride zum
Wingman bleibt man Kadett, auch mit genug XP für spätere Ränge.

```yaml
ranks:
  - id: wingman
    name: Wingman
    xp: 400                        # Mindest-XP – zugleich Zulassung zum Checkride
    description: …
    checkride:
      scenario: m4-s-checkride     # ein normales Szenario aus scenarios/
      requires: [m4]               # Module oder Lektionen, die vorher erledigt sein müssen
      passScore: 0.8               # Standard 0.8
      noCritical: true             # Standard true: kein kritischer Fehler erlaubt
```

**Ablauf:** Sind Rang davor, XP und `requires` erfüllt, erscheint auf dem Ausbildungsweg die Karte
„Checkride“ (`#/checkride/<rang-id>`). Der Checkride spielt das Szenario **ohne Hilfen**:

- Jeder Funkspruch wird getippt – auch Schritte mit `mode: build` oder `choice`. Deren Segmente
  brauchen dann `alt`/`optional` wie bei `mode: type`.
- Keine Hinweise, keine Anatomie-Farben, keine Fundort-Hinweise beim Einstellen. Im Funk-Log steht,
  was der Nutzer wirklich gesagt hat.
- Bewertung und `explain` erst im Debriefing: Urteil, kritische Fehler, jeder Schritt mit Musterlösung.

**Kritische Fehler** (bei `noCritical: true` fällt man damit durch):

- ein fehlender oder falscher Pflichtteil (`critical: true` am Segment) in einem eigenen Funkspruch,
- jeder Fehler in einem Schritt mit `critical: true` – falsche Frequenz, fehlerhafter Funkspruch,
  Schweigen statt Pflichtmeldung oder Funken, wo Schweigen richtig ist:

```yaml
  - stage: Push
    critical: true                 # Beispiel: Schweigen als Pflicht – wer hier funkt, fällt durch
    silence: true
```

Ein bestandener Checkride bleibt bestanden. Wiederholen kann man ihn jederzeit, jeder Versuch wird
neu gewürfelt. Der Validator prüft: Szenario existiert, `requires` sind Module oder Lektionen, der
erste Rang hat keinen Checkride, die XP steigen von Rang zu Rang.

## Funk-Drill des Tages

Jede Übung (`::drill`) aus einer erledigten Lektion wird zur Wiederholungskarte, auch Übungen aus
Modulen, die per Einstufung erledigt sind, und die Einstufungs-Übungen selbst. Die Antwort in der
Lektion zählt als erste Wiederholung. Danach plant FSRS (Spaced Repetition), wann die Übung wieder
drankommt: richtig = später, teilweise richtig = etwas früher, falsch = bald. Der Drill
(`#/daily`) nimmt zuerst Fälliges, dann bis zu 8 neue Karten, höchstens 15 Übungen pro Sitzung. Neue Karten
kommen zuerst aus gespielten Lektionen, dann reihum über die Module; Karten aus nie gespielten Lektionen (z. B. nach
einer Einstufung) tragen den Hinweis „Lektion noch nicht gespielt“.
Falsche Antworten kommen am Ende der Sitzung noch einmal. Jede richtige Antwort bringt 2 XP, jeder
erledigte Tag verlängert die Serie (🔥).

**Für Autoren heißt das:** Eine Übung erscheint im Drill **ohne ihre Lektion**, nur mit dem
Hinweis „aus ‚Lektionstitel‘“. Der `prompt` muss deshalb für sich allein verständlich sein: nicht
„wie eben gesehen“ oder „im Funkspruch oben“, sondern die nötige Lage selbst nennen. Gewürfelte
Übungen (`generated`, Platzhalter) eignen sich besonders gut, weil jede Wiederholung anders aussieht.
Szenarien sind (noch) nicht Teil des Drills.

## Glossar (`glossary/brevity.yaml`, `glossary/prowords.yaml`, `glossary/basics.yaml`)

Das Glossar (`#/glossary`) zeigt Grundbegriffe, Brevity-Codes, Standardwörter, Alphabet und Zahlen,
mit Suche in Begriff und Erklärung (auch deutsch, ohne Umlaute; Suchwörter zählen am Wortanfang).
**Grundbegriffe** (`basics.yaml`) sind Wörter, die man zum Verstehen braucht, die aber weder Brevity
noch Standardwort sind – Flight, Lead, AWACS, PTT, Comm Card, Ops Check … Felder: `word`, `meaning`,
optional `note`, `example`, `see`, `aliases`, `layer`, `topic` (ID einer Themenseite, siehe oben). Brevity-Einträge:

```yaml
- word: BOGEY DOPE              # wie im Original, meist groß
  meaning: Anfrage nach BRAA-Angaben zur nächsten (oder genannten) Gruppe.
  category: anfragen            # identitaet, anfragen, sicht, sensoren, waffen, treibstoff,
                                # manoever, aspekt, ablauf, lagebild, kontrolle
  example: "Darkstar, Viper 1-1, bogey dope."   # optional, Original-Wortlaut
  note: …                       # optional
  see: [BRAA, SNAP]             # optional: verwandte Einträge (Brevity oder Standardwort)
  aliases: [fox 3]              # optional: weitere Schreibweisen für Suche und Erkennung
  layer: community              # optional, Standard core
  check: true                   # optional → „⚠ nicht eindeutig belegt“
  topic: squawk-transponder-iff # optional: Themenseite mit der ausführlichen Erklärung („Ausführlich lesen“)
```

Definitionen in eigenen Worten, nie wörtlich abschreiben. Maßgeblich ist ATP 1-02.1 (Ausgabe April
2025). Wo nur Sekundärquellen vorliegen, sie sich widersprechen oder ein Begriff nicht in allen
Brevity-Listen steht: `check: true` und den inhaltlichen Unterschied in `note` – in Nutzersprache,
ohne Prüfnotizen wie „laut TPS-Liste“.

**Im Funkspruch:** Tippt man einen Teil mit Rolle `brevity` (oder `proword`) an, erscheinen unter
der Erklärung die passenden Glossar-Einträge. Bei anderen Rollen nur, wenn der ganze Teil ein
Begriff ist (z. B. „fence in“ als `instruction`). Der Validator prüft doppelte Begriffe, `see`-Verweise
und jedes `:term[…]`.

## Abzeichen (`achievements.yaml`)

Abzeichen erscheinen im Profil (mit Fortschritt wie „7 / 10“) und werden beim Erreichen unten rechts
gemeldet. Einmal erreicht bleibt erreicht; beim Start werden Abzeichen für schon vorhandenen
Fortschritt nachgetragen.

```yaml
- id: clean-comms
  title: Clean Comms
  description: Zehn Funksprüche richtig – und ohne ein einziges überflüssiges Wort.
  icon: ✨                       # ein Emoji
  rule: { cleanCalls: 10 }      # genau eine Bedingung
  hidden: true                  # optional: geheim, bis erreicht
```

Bedingungen: `lessons`, `module`, `placement: true`, `exams` (bestandene Modulprüfungen), `rank`, `xp`, `streak`, `dailyDays`,
`matureCards` (Wiederholungsabstand ab 21 Tagen), `hangar`, `correctCalls`, `cleanCalls`
(richtig und ohne überflüssiges Wort), `silences` (richtig geschwiegen), `tunes` (Funkgerät auf
Anhieb richtig), `perfectScenarios`. Die Liste mit Erklärung steht oben in der Datei. Gezählt wird
überall, wo getippt, geschwiegen oder eingestellt wird – in Übungen, Szenarien, Checkrides und im
Funk-Drill. Neue Bedingungsarten brauchen eine Erweiterung der Engine.

## Flugzeuge und Epochen (`pools/aircraft.yaml`)

Die Flugzeugliste steht nur hier; Code und Validator lesen sie von dort. Jeder Verweis auf ein
Flugzeug (`:::aircraft`, `aircraft:` an Übungen, Funksprüchen, Szenarien und Modulen) muss eine ID aus
dieser Datei sein.

```yaml
- id: f16                  # ID, wie sie in Inhalten und im gespeicherten Profil steht – nie umbenennen
  label: F-16C Viper       # Anzeige im Profil und in Kästen
  type: F-16C              # Typbezeichnung im Text
  radio: Viper             # Rufname im Funk („flight of two Vipers“)
  era: modern              # ww2 | cold-war | modern
  sims: [dcs, bms]         # wo fliegbar – danach filtert die Profilauswahl
  nation: us
  service: usaf            # usaf | usaaf | usn | usmc | usa | other
  seats: 1
  role: multirole          # fighter | attack | multirole | helicopter | trainer | transport | bomber
  radios: [AN/ARC-164 (UHF), AN/ARC-222 (VHF)]   # nur Anzeige; Einträge mit Komma in Anführungszeichen
  group: false             # true = Sammel-Eintrag „andere Muster“ (nur Profil, nie gewürfelt)
  note: …                  # optionaler Hinweis im Profil
```

- **Eigener Eintrag** nur für Muster, die sich im Funk spürbar unterscheiden (Gerät, Besatzung mit
  Intercom, eigenes Verfahren). Alles andere gehört in den Sammel-Eintrag der Epoche.
- **Epochen** richten sich nach dem Funk, nicht nach der Luftfahrtgeschichte: `ww2` (feste Kanäle,
  Leitstelle), `cold-war` inkl. Korea (UHF mit Presets, Bodenradar statt AWACS, kein Datenlink),
  `modern` (Datenlink, ARC-210, AWACS).
- **Prüfungsrelevant** ist nur, was heute in der Sim gefunkt wird. Historisches (alter Wortlaut,
  Verfahren, die keine Sim nachbildet) gehört auf Hangar-Karten mit `era`.
