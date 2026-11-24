---
id: atis-platzansage
title: ATIS – die Platzansage und ihr Kennbuchstabe
summary: Was in der Endlosansage eines Flugplatzes steckt, was der Buchstabe wirklich bedeutet und was „information X“ beim Erstanruf soll.
terms: [ATIS]
sources:
  - title: "FAA Aeronautical Information Manual, 4-1-13 Automatic Terminal Information Service (Inhalt, Erstanruf, „have numbers“)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html
  - title: "FAA JO 7110.65, 2-9 ATIS Procedures (2-9-1 Buchstabenfolge Alpha bis Zulu, 2-9-2 neue Aufnahme, Nachfrage des Lotsen, 2-9-3 Inhalt)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_9.html
  - title: "MOOSE Ops.ATIS (DCS-Missionsskript)"
    url: https://flightcontrol-master.github.io/MOOSE_DOCS/Documentation/Ops.ATIS.html
  - title: "Falcon BMS 4.38 Comms & Nav Book (4.38.2), S. 13–14, 31, 128 – ATIS (Klartext, Farbcode nur mit g_bUseATISColorCode 1, keine Unterscheidung links/rechts)"
  - title: "IVAO Deutschland – Military Phraseology (Community-Dokument: keine ATIS, colour state)"
    url: https://de.ivao.aero/en/special-operations-en/military-aviation/military-phraseology/
  - title: "VATSIM Germany Knowledgebase – Military Procedures, Tower (Community-Dokument: Farbcodes)"
    url: https://knowledgebase.vatsim-germany.org/books/military-procedures-4ok
---

Die **ATIS** (Automatic Terminal Information Service) ist eine aufgezeichnete Ansage, die ein Flugplatz auf einer
eigenen Frequenz ständig wiederholt. Dahinter sitzt kein Lotse. Sie soll genau das ersparen: Wind, Bahn und
Luftdruck stünden sonst in jedem Erstanruf bei Ground und Tower. Du hörst sie also, **bevor** du einen Lotsen rufst.

## Was drinsteht

Die FAA nennt diese Bausteine, in dieser Reihenfolge:

1. **Name des Platzes** und der **Kennbuchstabe** der Ausgabe
2. **Uhrzeit** der letzten Wetterbeobachtung, in Zulu (UTC)
3. **Wind**, **Sicht** und **Wolken**
4. **Temperatur** und **Taupunkt**
5. **Altimeter**, der Luftdruck für den Höhenmesser
6. **Anflugverfahren** und **aktive Bahn**, dazu Hinweise

Sicht und Wolken dürfen fehlen, wenn die Wolkenuntergrenze über 5.000 ft und die Sicht über 5 Meilen liegt. Manchmal
sagt die Ansage dann „the weather is better than five thousand and five“.

Nach ICAO klingen zwei Werte anders: die Sicht in Kilometern bzw. Metern und der Luftdruck als „QNH“ in Hektopascal.
Die App spricht standardmäßig überall die US-Form. Mit der Einstellung „Kartenabhängig“ in den [Einstellungen](/einstellungen/flugprofil) richtet
sie sich nach dem Platz: In Nevada, auf Guam und in Korea hörst du die US-Form, in Georgien und am Golf die ICAO-Form
(Modul 3, Lektion 1).

::call{id=m3-atis}

## Der Buchstabe: „diese Ausgabe“

Der Kennbuchstabe sagt **nur, welche Ausgabe** du gehört hast. Er sagt nichts über gutes oder schlechtes Wetter
und nichts über die Bahn.

- Die Buchstaben laufen der Reihe nach von **Alfa bis Zulu** und beginnen dann wieder bei Alfa. Ein neuer Tag
  beginnt keine neue Reihe. (In der FAA-Schreibung heißt es „Alpha“.)
- Es gibt eine **neue Ausgabe**, sobald ein neuer amtlicher Wetterbericht kommt, **auch wenn sich die Werte nicht
  ändern**, und wenn sich etwas Wichtiges ändert, etwa die Bahn.
- Der Buchstabe steht am Anfang **und** am Ende der Ansage. Dann merkst du, wann du eine Ausgabe komplett
  gehört hast.

## Der Erstanruf: information X

Beim ersten Anruf bei Ground oder Tower nennst du den Buchstaben: „information Romeo“. Die AIM beschreibt es als
„Information Sierra received“. In den USA hört man auch kürzer „with Romeo“ (Praxis, nicht in der AIM). Der Lotse
weiß dann, dass du die Ausgabe kennst, und lässt die Werte weg, die darin stehen.

- **Veraltet?** Dann sagt der Lotse es dir: „verify you have information Charlie“ oder „information Charlie
  current“. Nennst du gar keinen Buchstaben, fragt er nach. Bei einer neuen Ausgabe ruft er sie allen zu:
  „attention all aircraft, information Bravo current“. Dann übernimmst du die neuen Werte.
- **Keine ATIS empfangen?** Dann gibt der Lotse Wetter, Bahn und Hinweise selbst durch.
- **„have numbers“** (US-Praxis) heißt nur: Wind, Bahn und Altimeter sind angekommen. Es bedeutet **nicht**, dass
  du die ATIS gehört hast, und ersetzt den Buchstaben nicht (AIM).

:::tip
Schreib dir vor dem Anruf vier Dinge aufs Kneeboard: **Buchstabe, aktive Bahn, Altimeter (bzw. QNH), Wind**. Den
Luftdruck liest du später zurück, wenn der Lotse ihn wiederholt.
:::

## Ohne ATIS: Militär und Sims

Viele Militärplätze haben eine ATIS, in BMS sogar jeder Militärplatz in Korea. Es gibt aber Plätze ohne, laut IVAO
Deutschland zum Beispiel manche deutsche Fliegerhorste. Dann nennt der Lotse Luftdruck, Bahn und
einen **Farbcode** für das Platzwetter, etwa „colour state BLU“.

Der Farbcode ist militärisches Platzwetter, keine reine Sim-Erfindung: Die Stufen reichen von Blau (beste Sicht,
höchste Wolken) über Weiß, Grün, Gelb und Bernstein bis Rot, dazu „black“ für einen geschlossenen Platz. Auch das
BMS-Handbuch beschreibt ihn. ⚠ Die NATO-Vorschrift selbst war für diese Seite nicht zugänglich; die Stufen folgen dem
BMS-Handbuch und Community-Unterlagen (IVAO Deutschland, VATSIM Germany).

:::sim{sim=dcs}
DCS hat keine ATIS mit wechselnden Buchstaben. Viele Multiplayer-Missionen bauen sie über das MOOSE-Skript
**Ops.ATIS** nach, oft mit Sprachausgabe über SRS auf einer eigenen Frequenz. Das Missionsbriefing sagt, ob es eine gibt.
:::

:::sim{sim=bms}
In Falcon BMS sendet die ATIS auf **VHF** (Preset 2 für den Startplatz, 7 für den Zielplatz, 10 für den Ausweichplatz).
Sie nennt Platz, Kennbuchstabe, aktive Bahn, Wind, Sicht und Wolken im Klartext, Temperatur und Höhenmesser, aber keinen
Taupunkt. Den Farbcode (blue bis red, „black“ heißt Platz geschlossen) spricht sie nur, wenn er in der BMS-Konfiguration
eingeschaltet ist (`set g_bUseATISColorCode 1`). An Plätzen mit Parallelbahnen unterscheidet sie nicht zwischen links
und rechts.
:::

## Wo dir das begegnet

- [Wer ruft wen?](/lesson/m1-l1) (Modul 1): „information Romeo“ im ersten Beispielfunkspruch.
- [Alfa, Bravo, Charlie](/lesson/m1-l2) (Modul 1): Der Kennbuchstabe läuft durchs Alphabet.
- [Welche Frequenz wann?](/lesson/m2-l6) (Modul 2): Die ATIS steht am Anfang des Frequenzfahrplans.
- [Platz- und Anflugkarten lesen](/lesson/m2-l7) (Modul 2): die ATIS-Frequenz im Funkblock der Karte.
- [ATIS – das Wetter vorweg](/lesson/m3-l1) (Modul 3): Werte mitschreiben, Erstanruf, veraltete Ausgabe.
