---
id: m2-l9
module: m2
order: 9
title: Platzinfos und Verfahren in deiner Sim
summary: Woher in DCS, BMS und IL-2 die Frequenzen und Platzverfahren kommen – und welcher Quelle du trauen kannst.
minutes: 8
xp: 80
sources:
  - title: "DCS World: User Manual (liegt DCS bei) S. 39–40, 63, 103–104, 113; terrains\\<Karte>\\radio.lua; Kampagnen-Unterlagen"
  - title: "Falcon BMS 4.38: Comms & Nav Book S. 8–15, 125–130; User Manual S. 59–60, 132, 144–146, 183 (im BMS-Ordner Docs)"
  - title: "BMS KTO AIP 4.38.2 (im BMS-Ordner Docs\\03 KTO Charts\\KTO_AIP.pdf): Aufbau GEN/ENR/AD, Funkfeuer- und Preset-Tabellen"
  - title: "IL-2 Korea Dev Blog #58 (GCI)"
    url: https://media.il2-korea.com/news/dd_58
  - title: "Georgien eAIP, AD 2 UGKO Kutaisi"
    url: https://airnav.ge/eaip/2023-03-23-AIRAC/html/eAIP/UG-AD-2.UGKO-en-GB.html
---

## Woher echte Piloten ihre Infos haben

Ein echter Militärpilot hat vor dem Flug einen ganzen Stapel Unterlagen:

- **AIP** (Aeronautical Information Publication): das offizielle Handbuch eines Landes mit allen
  Plätzen, Frequenzen und Verfahren. Viele Länder veröffentlichen es online als **eAIP**.
- **NOTAM**: kurzfristige Änderungen, etwa eine gesperrte Bahn oder ein ausgefallenes ILS.
- **:term[SPINS]** (Special Instructions): besondere Anweisungen für einen Einsatz oder eine Übung.
- **Local :term[SOPs]** (Standard Operating Procedures): die Hausregeln eines Platzes oder Verbands – Abflugrouten, Einflugpunkte, wer
  wann auf welcher Frequenz spricht.
- **Briefing und Comm Card** für genau diesen Flug.

Was davon wofür da ist, steht auf der Seite [Comm Plan, Comm Card und Missionsunterlagen](/wissen/comm-plan-und-missionsunterlagen).

In der Sim gibt es davon meist nur das Briefing und ein paar Karten (Falcon BMS bringt immerhin ein eigenes AIP
für Korea mit). Umso wichtiger ist es zu wissen,
**wo deine Sim welche Info versteckt** – und welcher Quelle du trauen kannst.

---

## Die goldene Regel

:::example
**Missionsunterlagen vor Sim-Daten vor echter Welt.** Briefing, Kneeboard und Comm Card der Mission
gelten zuerst. Danach die Daten der Sim (Karte, F10, DTC). Echte Karten und AIPs zuletzt – sie stimmen
oft nicht mit der Sim überein. Und was dir ein Lotse gerade sagt, schlägt alles Gedruckte.
:::

Ein Beispiel: Kutaisi in Georgien hat in der echten Welt den Tower auf 125.5 und Approach auf 127.1
MHz. In DCS antwortet der Tower auf 134.0 bzw. 263.0. Eine DCS-Kampagne kann wieder andere
Frequenzen festlegen. In BMS ist es genauso: Für Daegu nennt die echte Sichtanflugkarte andere Frequenzen als
die BMS-eigene Platzkarte (AGC).

---

::drill{id=m2-l9-source-priority}

---

## Deine Sim

Die Kästen unten zeigen die Sims aus deinem Profil.

:::sim{sim=dcs}
**DCS World**
- **Platz-ATC:** pro Flugplatz nur **eine Frequenz je Band** für Ground, Tower und Approach zusammen –
  genau das zeigt die Zeile „ATC“ im F10-Flugplatzfenster (Lektion 8). Eine ATIS gibt es standardmäßig
  nicht. Getrennte Frequenzen gibt es nur, wenn eine Mission sie per
  Skript baut oder Menschen die Lotsen spielen.
- **Tanker, AWACS, JTAC, Flight:** legt der Missionsbauer fest. Du findest sie nur im **Briefing**,
  auf dem **Kneeboard** (RShift+K) oder in den PDF-Unterlagen der Kampagne.
- **Easy Communication:** stellt das Funkgerät selbst ein. Viele Kampagnen verlangen, es
  auszuschalten – dann musst du selbst das richtige Gerät auf den richtigen Kanal stellen. Manche
  Missionen warten so lange, bis du es tust.
- **Eigene Seiten:** Bilder (JPG/PNG) in `Saved Games\DCS\Kneeboard\<Flugzeugtyp>\` legen, z. B.
  `FA-18C_hornet`. Sie erscheinen hinter den Standardseiten.
- **Gute Vorbilder:** die Unterlagen der mitgelieferten Kampagnen, etwa die Kanaltabelle („Radio
  Channelization“) von *F-14 Speed & Angels* oder der „Radio Plan“ von *Operation Cerberus North*.
:::

:::sim{sim=bms}
**Falcon BMS**
- **Hauptquelle:** die **Comm Ladder** im Briefing – alle Frequenzen und Presets deines Flugs. Notier
  sie dir, sonst erreichst du womöglich weder Flight noch Package. Der **DTC** (Reiter COMMS) lädt sie
  als Presets in dein UFC. Ausdruckbar als Briefing.txt.
- **Fester Comm Plan:** Die Presetnummer steht für die Rolle, die Frequenz hängt am Platz.
  Merkhilfe: **raus UHF 2-3-4** (Ground, Tower, Departure), **Mission 6** (Tactical), **Tanker 13**,
  **zurück 4-3-2** bzw. am Zielplatz 7-8-9, Ausweichplatz 10-11-12. ATIS auf VHF 2/7/10.
- **Karten:** BMS-eigene Karten (AGC, APC, LOC, EOR) im Ordner `Docs\03 KTO Charts`; die LOC-Karte hat
  alle Frequenzen eines Platzes auf einer Seite. Daneben liegen echte Anflugkarten; wo sie abweichen (wie bei
  Daegu), gelten die BMS-eigenen Karten.
- **Eigenes AIP:** Im selben Ordner liegt das **KTO-AIP** (`KTO_AIP.pdf`), ein Handbuch für Korea nach dem
  Vorbild eines echten AIP – mit allgemeinem Teil, Strecken und Plätzen, Funkfeuer- und Preset-Tabellen.
- **Kneeboard:** Vorlage für die :term[Line-up-Card] (Eckdaten deines Einsatzes samt Funkblock) und „Smart Cards“ für Kunsan und Osan.
- **Rufst du falsch,** nennen dir die BMS-Lotsen meist die richtige Frequenz.
:::

:::sim{sim=il2}
**IL-2**
- **Great Battles:** keine Funkfrequenzen. Du funkst über das **Befehlsmenü**: mit deiner Rotte und mit der
  **Bodenleitstelle** des Heimatplatzes, einer KI-Platzkontrolle (Rollen, Start und Landung anfragen, Kurs zur
  Basis). Mitspieler hören davon nichts.
  Das Briefing nennt Platz, Wind, Platzhöhe und den Luftdruck in mmHg.
- **IL-2 Korea:** Dazu kommt **:term[GCI]** – Bodenradar, das dich zum Ziel, zu einem Missionspunkt oder nach
  Hause führt und vor Feinden warnt. Für die Navigation stehen im Briefing **Funkfeuer-Tabellen** mit
  Frequenz in kHz, Kanal, Kennung und Planquadrat. Schreib sie dir vor dem Flug ab.
:::

---

::drill{id=m2-l9-dcs-one-freq}

---

::drill{id=m2-l9-bms-tower}

---

::drill{id=m2-l9-bms-chain}

---

::drill{id=m2-l9-il2}

---

## Auf dem Server

:::layer{layer=community}
Auf Multiplayer-Servern steht der Comm Plan meist im **Missionsbriefing**, auf dem **Discord** des
Servers oder in dessen **SOP**. Oft wird vor dem Abend eine gemeinsame Comm Card verteilt. Fehlt sie:
im Text-Chat fragen, nicht auf Guard.
:::

---

::hangar{id=sim-vs-wirklichkeit}

---

::drill{id=m2-l9-srs-server}

---

## Merke – und Abschluss von Modul 2

:::example
**Missionsunterlagen vor Sim-Daten vor echter Welt.** DCS: Briefing und Kneeboard, eine ATC-Frequenz
je Platz. BMS: Comm Ladder → DTC → UFC, raus 2-3-4. IL-2: Befehlsmenü,
in Korea GCI und Funkfeuer-Tabellen.
:::

Damit weißt du, welche Geräte du hast, wie Kanäle und Comm Plan funktionieren – und woher die
Frequenzen kommen. In **Modul 3** geht es ans Fliegen: vom Kaltstart bis zum Abflug.
