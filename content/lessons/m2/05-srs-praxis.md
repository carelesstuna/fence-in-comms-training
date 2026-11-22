---
id: m2-l5
module: m2
order: 5
title: SRS in der Praxis
summary: Wie SimpleRadio Standalone Funk simuliert – Funkgeräte, PTT, Intercom und die typischen Fehler auf dem Server. Mit dem BMS-Gegenstück IVC.
minutes: 9
xp: 80
layer: community
sources:
  - title: "Falcon BMS Technical Manual 4.38.1, Abs. 5 – kein Radio Check, KI-Wingmen; Comms & Nav Book 4.38.2 – Switch Flight Uniform, Backup-UHF"
  - title: "DCS-SimpleRadioStandalone (GitHub, ciribob) – Release 2.4.1.0"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone/releases/tag/2.4.1.0
  - title: "DCS-SRS Wiki: SRS Server"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone/wiki/SRS-Server-(WIP)
  - title: "DCS-SRS Wiki, Startseite: Features („In Cockpit PTT“ mit Liste der Muster) und Controls („Radio Switch works as PTT“)"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone/wiki
  - title: "DCS-SRS Quellcode: Tastenbelegungen, Modulationen, Empfangslogik"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone
  - title: "ATIS Telecom Glossary: Radio horizon range"
    url: https://glossary.atis.org/glossary/radio-horizon-range-rhr/
  - title: "Heatblur F-14 Manual (liegt DCS bei), S. 307–309, 537–541; Heatblur F-4E Manual, S. 404–405, 817 – ICS"
  - title: "Falcon BMS 4.38 Technical Manual (im BMS-Ordner Docs), S. 51 (Reichweite, falsche Frequenz), S. 56–57 (zwei Funkgeräte), S. 61 (IVC)"
  - title: "Falcon BMS 4.38 User Manual (im BMS-Ordner Docs), S. 82 – IVC-Check mit F1/F2"
  - title: "IL-2-Forum: SRS for IL-2 Community Edition – Multiplayer Radio for Korea & Great Battles"
    url: https://forum.il2-series.com/topic/4981-srs-for-il-2-community-edition-%E2%80%93-multiplayer-radio-for-korea-great-battles/
  - title: "IL-2-Forum: CB Radio with SRS on Combat Box"
    url: https://forum.il2sturmovik.com/topic/64823-announcement-cb-radio-with-srs-on-combat-box
---

## Was SRS macht

**SRS** (DCS-SimpleRadio Standalone) ist das Programm, über das in fast allen DCS-Multiplayer-Staffeln
gefunkt wird. Es läuft neben DCS und simuliert Funk über das Internet:

- SRS liest aus deinem Cockpit, welche **Funkgeräte** du hast, welche **Frequenz** und welche
  **Modulation** eingestellt sind.
- Wenn du sendest, hören dich alle, deren Gerät auf **dieselbe Frequenz und dieselbe Modulation**
  eingestellt ist. Das ist wie in echt: Ein AM-Gerät hört keine FM-Sendung.
- Je nach Server spielen auch **Entfernung** und **Sichtlinie** eine Rolle. Dann hört dich der Tower
  hinter dem Berg nicht.

Das **Overlay** zeigt deine Funkgeräte mit Frequenz und Modulation und markiert, welches Gerät gerade
zum **Senden** gewählt ist.

:::sim{sim=bms}
BMS braucht kein SRS: Es bringt mit **:term[IVC]** (Integrated Voice Communications) einen eigenen
Sprachfunk mit. Den steuerst du mit den Funkgeräten und dem :term[HOTAS] (Schalter an Gashebel und Stick) im Cockpit. Vieles hier gilt dort
genauso:
- Gehört wirst du nur auf **derselben Frequenz** – wer falsch eingestellt ist, bekommt keine Antwort.
- Die **Reichweite** hängt an der Sichtlinie, die Verständlichkeit nimmt mit der Entfernung ab.
- **UHF und VHF** hörst du gleichzeitig. Das Handbuch empfiehlt UHF für Tower und andere Flights,
  VHF für den eigenen Flight.
- Vor dem Flug, in der Oberfläche: **F2** hört nur, wer gerade in der Oberfläche ist – dort macht man
  den IVC-Check. **F1** funkt auf UHF-Preset 14 („:term[Advisory]“, 339.75), das auch im Cockpit zu hören ist.
:::

:::sim{sim=il2}
IL-2 hat kein Funkgerät zum Einstellen. Für **Great Battles und IL-2 Korea** gibt es deshalb eine
eigene Community-Fassung von SRS. Sie bringt **zwei Funkgeräte und ein :term[Intercom]** (Bordsprechanlage) mit, statt
Frequenzen aber **Kanäle**, die der Server benennt. Ein Beispiel (Stand 2026): Auf dem Server Combat Box
verbindet sich SRS beim Beitritt selbst; Kanal 1 ist das Kommando der eigenen Seite, Kanal 2 der
Platzverkehr. Welche Kanäle gelten, steht in der Serverinfo oder im Missionsbriefing.
:::

---

::hangar{id=srs-hinter-den-kulissen}

---

::drill{id=m2-l5-wrong-modulation}

---

::hangar{id=vatsim-und-ivao}

---

## Eine Sprechtaste, mehrere Funkgeräte

SRS hat **eine gemeinsame Sprechtaste (PTT)** und dazu Tasten, mit denen du das Funkgerät wählst
(„Radio 1“ bis „Radio 10“, dazu „nächstes“ und „voriges“ Gerät). Gesendet wird immer auf dem
**gewählten** Gerät. Gehört wird auf **allen** Geräten gleichzeitig.

Genau daraus entsteht der häufigste Fehler: Du hörst den Flight auf Funkgerät 2, sendest aber auf
Funkgerät 1 – beim Tower. Im echten Cockpit passiert dasselbe mit dem Funkschalter am Gashebel.

:::tip
Die Option **„Radio Switch works as Push To Talk (PTT)“** macht jede Wahltaste selbst zur
Sprechtaste: „Radio 1“ halten heißt dann senden auf Gerät 1. Viele legen so Gerät 1 und 2 auf die
beiden Richtungen des Funkschalters am :term[HOTAS]. Dann gibt es keinen Zweifel mehr, auf welchem Gerät du
sprichst.

Bei einigen Mustern kann SRS auch den Funkschalter im Cockpit selbst als Sprechtaste nehmen („In Cockpit
PTT“). Das SRS-Wiki nennt dafür unter anderem UH-1H, Mi-8, F-86, MiG-15, F-5E, P-51D und F-14 – mit dem Hinweis,
dass die Liste veraltet sein kann. Hornet, Viper und A-10C stehen nicht darin ⚠. Probier es in deinem Muster aus.
:::

::call{id=m2-flight-radio-check}

:::sim{sim=bms}
In BMS gibt es **keinen Radio Check** mit den KI-Wingmen („radio checks are not possible“, Technical Manual
4.38.1). Frag stattdessen etwas, das sie beantworten, etwa nach dem Treibstoff. Bleibt die Antwort aus,
bist du vermutlich nicht auf der VHF-Frequenz deines Flights. Auf VHF bleiben die KI-Wingmen immer auf ihrer
Flight-Frequenz (Preset 15–19). Deinen UHF-Wechseln (ATC, Tactical, Tanker) folgen sie dagegen.

Ist dein VHF- oder UHF-Gerät ausgefallen, kannst du sie über das **Backup-UHF** befehligen: C&I-Knopf
auf BACKUP, Backup-Preset gleich deinem VHF-Preset (z. B. 15), Modus PRESET, dann der Befehl **„Switch
Flight Uniform“** (Comms & Nav Book 4.38.2).
:::

---

::drill{id=m2-l5-ptt}

---

::drill{id=m2-l5-no-answer}

---

## Intercom im Mehrsitzer

Fliegst du mit einem Menschen im zweiten Sitz (F-14, F-4, AH-64 …), braucht die Besatzung einen
eigenen Kanal. SRS hat dafür ein **:term[Intercom]**, das nur die Besatzung hört (mehr auf der Seite
[Funkgerät bedienen](/wissen/funkgeraet-bedienen)). Du wählst es über
**„Intercom Select“** und sprichst mit PTT. Bei manchen Mustern geht es auch freihändig über
**Sprachaktivierung (VOX)** auf dem Intercom. Diese Option ist standardmäßig aus.

::call{id=m2-intercom-check}

:::warn
Die klassische Panne im Zweisitzer: Der Pilot will dem :term[RIO] (Rücksitz) etwas sagen und hat noch das Funkgerät
gewählt. Dann hört der ganze Flight – oder der Tower – mit. Ein Intercom-Check vor dem Anlassen deckt
das auf.
:::

Im Cockpit selbst gibt es dafür drei Stellungen am Intercom-Bedienteil, in F-14 und F-4E gleich:
**HOT MIC** (Intercom ohne Taste, alles wird gehört), **COLD MIC** (Intercom nur mit Taste) und
**RADIO OVERRIDE** (Intercom bekommt Vorrang vor dem Funk).

:::aircraft{aircraft=f14}
In der F-14 tastet der Pilot das Intercom mit dem Funkschalter am Gashebel (Stellung ICS), der RIO mit
der linken Fußtaste. Die Checklisten stellen beide Sitze auf **COLD MIC**. Jester beginnt den Kaltstart
mit einem „Comms Check“ – ein gutes Vorbild für eine Besatzung aus zwei Menschen.
:::

:::aircraft{aircraft=f4}
In der F-4E tasten Pilot und :term[WSO] das Intercom mit dem Schalter am Gashebel (**hinten = Intercom**,
vorn = Funk). Die Checkliste stellt das Intercom auf **HOT MIC**. Achtung: Ist der :term[Crew Chief] (Techniker am Boden) per
Kabel angeschlossen, blockieren sich WSO und Chief gegenseitig – kurz sprechen, Pausen lassen.
:::

---

::drill{id=m2-l5-intercom}

---

## Typische Fehler auf dem Server

| Symptom | Ursache | Abhilfe |
|---|---|---|
| Keiner antwortet | falsches Gerät zum Senden gewählt | Overlay prüfen, richtiges Gerät wählen |
| Frequenz stimmt, kein Empfang | falsche Modulation (AM/FM) | Modulation angleichen |
| Alle hören dich atmen | VOX an oder Taste hängt | VOX aus, Taste prüfen |
| Bodenstation hört dich nicht | Sichtlinie oder Entfernung (Servereinstellung) | steigen, näher heran |
| Ein Gerät ist stumm | Gerät im Cockpit aus oder leise | Cockpit-Schalter und Lautstärke prüfen |

Dazu kommen Server-Optionen, die das Verhalten ändern: ob du andere hörst, während du sendest, ob
FM-Sendungen sich gegenseitig verdrängen, ob es zusätzliche **Erweiterungsfunkgeräte** gibt (für
Flugzeuge mit zu wenigen Geräten) und ob Controller über einen **externen AWACS-Modus** ohne eigenes
Flugzeug mitfunken.

Wie weit dein Funk bei eingeschalteter Sichtlinie reicht, rechnest du mit der Faustformel aus Modul 1, Lektion 5
(Funk und Physik): 1,23 · √(Höhe in ft) ergibt Seemeilen.

---

::drill{id=m2-l5-match-errors}

---

::drill{id=m2-l5-horizon-low}

---

## Merke

:::example
**Hören auf allen Geräten, senden nur auf dem gewählten.** Frequenz UND Modulation müssen stimmen.
Im Mehrsitzer das Intercom nutzen. Vor dem Anlassen: Radio Check im Flight und Intercom-Check.
:::

:::sim{sim=srs}
**Dein erster Abend mit SRS** – eine Checkliste vom Verbinden bis zum ersten Radio Check:

1. **Tasten belegen**, vor dem Abend: Im SRS-Client unter den Controls mindestens „Push To Talk – PTT“, „Radio 1“
   und „Radio 2“ (oder die Option „Radio Switch works as PTT“), „Intercom Select“ und „Overlay Toggle“ auf Stick
   oder Tastatur legen. „Toggle Guard“ und „Radio 3“ bis „Radio 10“ kommen später dazu.
2. **Verbinden:** Die Server-Adresse steht im Missionsbriefing oder in der Serverinfo. Im Client eintragen und
   verbinden – manche Server bieten das Verbinden beim Beitritt selbst an.
3. **Ins Cockpit, Overlay öffnen:** Stehen deine Funkgeräte mit Frequenz und Modulation da? Ist das richtige Gerät
   zum Senden markiert?
4. **Funkgeräte einstellen** nach der Comm Card der Mission: Flight-Frequenz auf das eine Gerät, die erste Stelle
   (meist Ground) auf das andere.
5. **Erster Radio Check im Flight:** Der Lead ruft „radio check“, du antwortest mit deiner Nummer und der
   Lesbarkeit. Kommt nichts an: Sendegerät, Frequenz und Modulation im Overlay prüfen (Tabelle „Typische Fehler auf
   dem Server“).
6. **Im Zweisitzer:** vor dem Anlassen ein Intercom-Check.
:::

Als Nächstes geht es darum, welche Frequenz du in welcher Phase des Flugs brauchst – und woher du sie
bekommst.
