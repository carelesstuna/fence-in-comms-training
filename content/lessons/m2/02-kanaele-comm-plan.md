---
id: m2-l2
module: m2
order: 2
title: Kanäle, Comm Card und „push“
summary: Presets statt Frequenzen, die Comm Card auf dem Knie und wie ein Flight geschlossen die Frequenz wechselt.
minutes: 8
xp: 80
sources:
  - title: "Falcon BMS 4.38 Comms & Nav Book (4.38.2), Abs. 2.1.1, 2.2 – Preset-Liste, VHF/UHF je Rufzeichen; Technical Manual 4.38.1, Abs. 5.6 – Air agencies"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (PUSH)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "UOAF Codex – Communications and Brevity"
    url: https://codex.uoaf.net/index.php/Communications_and_brevity
  - title: "132nd Virtual Wing – Standing SPINS (Beispiel für einen Comm Plan)"
    url: https://132nd-vwing.github.io/OPAC-Brief/MISSION%20INFORMATION/OPAC%20STANDING%20SPINS.pdf
  - title: "Falcon BMS 4.38 Comms & Nav Book (liegt BMS bei, im Installationsordner unter Docs), S. 9, 31, 45 – Comm Plan und Presets"
  - title: "Falcon BMS 4.38 User Manual (liegt BMS bei, im Installationsordner unter Docs), S. 59 (DTC, Reiter COMMS), S. 146 und 183 (Comm Ladder im Briefing)"
  - title: "DCS P-51D und P-47D Flight Manuals – SCR-522A, Kanäle A–D; DCS Bf 109 K-4 und Fw 190 Flight Manuals – FuG 16ZY"
---

## Presets: gespeicherte Frequenzen

Eine Frequenz wie 251.725 hat sechs Ziffern. Sie im Flug einzudrehen, kostet Zeit und Aufmerksamkeit.
Deshalb haben Funkgeräte **Presets**: gespeicherte Frequenzen mit einer Nummer, meist 1 bis 20.
Im Funk heißen sie **„channel“** oder **„button“**. Beides meint dasselbe.

Vor dem Flug werden alle Funkgeräte des Flights gleich programmiert, nach dem **Comm Plan** der
Mission. Dann reicht im Flug eine Zahl: „Kanal 5“, und jeder landet auf derselben Frequenz.

Das hat drei Vorteile:

1. **Kürzer:** eine Zahl statt sechs Ziffern.
2. **Sicherer:** kein Zahlendreher beim Eindrehen.
3. **Diskreter:** Wer mithört, erfährt nur „Kanal 5“, nicht die Frequenz.

---

## Die Comm Card

Der Comm Plan steht auf einer **:term[Comm Card]**, die du auf dem Kneeboard trägst (mehr auf der Seite
[Comm Plan, Comm Card und Missionsunterlagen](/wissen/comm-plan-und-missionsunterlagen)). Typisch sind diese
Spalten:

| Kanal | Netz | Frequenz |
|---|---|---|
| Nummer des Presets | Stelle oder Netzname | die Frequenz dahinter |

Die Netze haben oft Namen statt Stellen: **Strike** (das Einsatznetz des Pakets, also des Verbands aus
mehreren Flights mit gemeinsamer Mission), **Package**, **Tanker**, **AWACS**. So kann der Lead einfach
„:term[push] Strike“ sagen, und der Flight wechselt zum Strike-Netz. Wer seine Comm Card kennt, weiß,
welcher Kanal gemeint ist.

So kann deine Comm Card aussehen (gewürfelt):

::muster{doc=commcard}

:::sim{sim=bms}
In BMS ist das die **:term[Comm Ladder]**: ein Abschnitt im Briefing mit allen Frequenzen und Presets deines
Flugs. Der :term[DTC] (Data Transfer Cartridge, der Datenträger mit den Einstellungen deiner Mission)
übernimmt sie standardmäßig als Presets ins Cockpit (Reiter COMMS, Knopf COMM PLAN stellt sie wieder her).
Mit PRINT landet die Liste als Textdatei im Unterordner `User\Briefings` deiner BMS-Installation – gut zum
Ausdrucken fürs Kneeboard.
:::

:::era{era=ww2}
Im Warbird mit festen Kanälen ist die Comm Card kurz: **vier Zeilen**, eine je Kanal (A–D, beim FuG 16ZY die Stellungen
I, II, Δ und □). Die Frequenzen dahinter legt die Mission fest. Für dich zählt, **welche Stelle** auf
welchem Kanal liegt. Ein Beispiel nach der Belegung im DCS-Handbuch von P-51D und P-47D:

| Kanal | Stelle |
|---|---|
| A | Leitstelle und andere Flugzeuge |
| B | Tower |
| C | Funkfeuer (Homing) |
| D | Peilstation |

Was in deiner Mission gilt, steht im Briefing.
:::

---

::drill{id=m2-l2-commcard-net}

---

## push – geschlossen umschalten

**PUSH** ist ein Brevity-Wort: „Wechselt auf die genannte Frequenz.“ Es braucht **keine
Bestätigung**. Jeder schaltet einfach um.

Auf der neuen Frequenz macht der Lead sofort den **Check**. Erst wenn alle geantwortet haben, weiß
er, dass niemand auf dem alten Kanal zurückgeblieben ist:

::call{id=m2-push-button}

:::layer{layer=community}
Manche Staffeln lassen „push“ trotzdem kurz bestätigen („Two“), bevor umgeschaltet wird. Das kostet
eine Sekunde, zeigt aber, dass der Befehl angekommen ist. Was gilt, steht in den :term[SOPs] bzw. im
Missionsbriefing – im Zweifel vor dem Flug klären. In Modul 4 und im Checkride trainierst du die ATP-Form:
keine Antwort.
:::

---

::drill{id=m2-l2-push-meaning}

---

::drill{id=m2-l2-build-push}

---

::hangar{id=scr-522}

---

## push mit Netznamen

Statt einer Nummer kann auch der Netzname stehen. Die Logik bleibt gleich: wechseln, dann Check.

::call{id=m2-push-named}

:::warn
Wenn du nicht weißt, welcher Kanal gemeint ist: **Bleib auf dem alten Kanal** und frag nach. Wer auf
gut Glück wechselt, ist danach für den Flight verschwunden.
:::

---

::drill{id=m2-l2-input-push repeat=2}

---

::hangar{id=have-quick}

---

## Merke

:::example
**Preset** = gespeicherte Frequenz, im Funk „channel“ oder „button“. Die **Comm Card** übersetzt
Kanäle und Netznamen. **push** = wechseln ohne Bestätigung, danach **check** auf dem neuen Kanal.
:::

:::sim{sim=dcs}
In DCS legst du die Presets im **Missionseditor** fest (pro Flugzeug, Reiter für die Funkgeräte). Auf
Multiplayer-Servern sind sie meist schon passend zur Comm Card der Mission programmiert. Ein Blick
ins Kneeboard der Mission zeigt oft die passende Karte.
:::

:::sim{sim=bms}
Falcon BMS hat einen **festen Comm Plan**: Die Presets bedeuten bei jedem Flug dasselbe. Auf UHF:

| Preset | Netz |
|---|---|
| 1 | Ops (:term[Base Ops], der Platzbetrieb des Militärplatzes) am **Startplatz** |
| 2 / 3 / 4 | Ground / Tower / Departure+Approach am **Startplatz** |
| 5 | Tactical-Check-in (Platzhalter, noch nicht genutzt) |
| 6 | Tactical (AWACS-Controller des Packages) und JTAC |
| 7 / 8 / 9 | Approach / Tower / Ground am **Zielplatz** |
| 10 / 11 / 12 | Approach / Tower / Ground am **Ausweichplatz** |
| 13 | Luftbetankung (wenn geplant) |
| 14 | UHF Common („Advisory“), immer 339.75 |
| 20 | LSO (nur wenn der Zielplatz ein Träger ist) |

Auf VHF liegen die ATIS-Frequenzen (2 Startplatz, 7 Zielplatz, 10 Ausweichplatz), die Tower (3 Start,
4 Ziel, 11 Ausweich), **14 Common (immer 123.5)** und auf 15–19 die Intra-Flight-Frequenzen der Flights
im Package. Ein typischer Flug geht also UHF 2 → 3 → 4 → 6 und zurück 4 → 3 → 2.

**Wem gehört welche Frequenz?** Sie hängt am **Rufzeichen**: Deine Intra-Flight-VHF gehört deinem
Flight-Rufzeichen. Die Tactical-UHF des Packages gehört dem **ersten Flight** im Package. Ist das ein
Tanker oder AWACS, liegt die ganze Package-Frequenz auf dessen Kanal. Die Check-in-UHF gehört dem
AWACS-Rufzeichen, die Tanker-UHF dem Tanker-Rufzeichen. Im Briefing steht deshalb deine eigene VHF und
die UHF des Packages, und deren Preset 6 kann von deiner eigenen UHF abweichen.
:::

:::sim{sim=bms}
**Welche KTO-Karte zeigt was?** Die BMS-eigenen Karten (Aufdruck „generated from Falcon BMS data“) liegen
BMS bei: im Unterordner `Docs\03 KTO Charts` des Ordners, in den du Falcon BMS installiert hast (standardmäßig
`C:\Falcon BMS 4.38\Docs\03 KTO Charts`). Im selben `Docs`-Ordner stehen auch die Handbücher von BMS.

- **AGC** (Airport Ground Chart): Funkblock oben rechts (ATIS, Ground, Tower UHF/VHF, Approach/Departure),
  dazu Rollwege, :term[TACAN] (Navigationshilfe: Richtung und Entfernung zur Station) und Platzhöhe.
- **APC**: Parkplätze je Bahn.
- **LOC**: Umgebungskarte mit Frequenztabelle der Plätze ringsum.
- **EOR-Karte** (EOR = End of Runway, das Bahnende): Flächen zum Scharf- und Entschärfen (rote und grüne Route) samt Platzfrequenzen.

Am verlässlichsten bleibt aber das Briefing „Comm Ladder“ mit dem DTC. Echte Anflugkarten nennen teils
Frequenzen, die die BMS-ATC nicht benutzt. (Quelle: BMS Comms & Nav Book, Kap. Karten.)
:::
