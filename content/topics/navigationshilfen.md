---
id: navigationshilfen
title: Navigationshilfen – TACAN, ILS, VOR, NDB
summary: Welche Funkfeuer dir Richtung, Entfernung oder Landeführung geben, wo sie auf Karten stehen und wie du sie in der Sim einstellst.
terms: [TACAN, ILS, VOR, NDB, DME]
sources:
  - title: "FAA Aeronautical Information Manual, 1-1-2 NDB, 1-1-3 VOR, 1-1-5 TACAN, 1-1-6 VORTAC, 1-1-7 DME, 1-1-9 ILS"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html
  - title: "FAA Pilot/Controller Glossary: Tactical Air Navigation (TACAN), Decision Altitude, ILS Categories"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/glossary-t.html
  - title: "Falcon BMS 4.38 Comms & Nav Book, Abschnitt 3.1 (Tacan: Radiale, Band, T/R, Reichweite) und 3.2 (ILS)"
  - title: "DCS World, F10-Karte: Flugplatzfenster („Airdrome Data“) mit TACAN, VOR, ILS, NDB"
---

Funkfeuer am Boden helfen dir, ohne Sicht zu navigieren und anzufliegen. Auf den Plankarten stehen sie im Kopf der
Anflugkarte oder im Funkblock, in der Sim im Flugplatzfenster der Karte.

## Die fünf im Überblick

| Hilfe | Das gibt sie dir | Band laut AIM |
|---|---|---|
| **TACAN** | Richtung (Radial) und Entfernung zur Station | UHF, Pulssystem |
| **VOR** | Richtung (Radial) | VHF, 108.0 bis 117.95 MHz |
| **DME** | Entfernung zur Station | meist zusammen mit VOR oder ILS |
| **ILS** | seitliche und senkrechte Führung auf die Bahn | Localizer VHF 108.10 bis 111.95 MHz, Gleitpfad UHF 329.15 bis 335.00 MHz |
| **NDB** | Peilung zur Station mit dem Funkkompass (ADF) | 190 bis 535 kHz |

## TACAN

Die **TACAN** (Tactical Air Navigation) entstand beim Militär, weil sich das zivile VOR/DME für Schiffe und
Feldplätze nicht eignete (AIM). Sie zeigt Peilung **und** Entfernung. Dafür brauchst du ein TACAN-Gerät, ein VOR-Gerät
empfängt sie nicht. Wo VOR und TACAN an einer Stelle stehen, heißt die Anlage **VORTAC**.

- **Kanal und Band:** Du stellst eine Kanalnummer mit **X** oder **Y** ein, zum Beispiel „44X“. Die Kennung der
  Station (drei Buchstaben) steht daneben. In Falcon BMS nimmst du X für Bodenstationen und Y für Flugzeuge.
- **Radial:** Eine Station sendet 360 Radiale, eines je Grad. Auf Radial 090 bist du **östlich** der Station. Du
  kannst es mit Kurs 090 verlassen oder mit Kurs 270 anfliegen (BMS-Handbuch).
- **Boden oder Luft:** Der Schalter **T/R** empfängt Bodenstationen, **A/A TR** andere Flugzeuge, etwa den Tanker.
- **Reichweite:** Sichtlinie. Wer tief fliegt, empfängt weniger weit. BMS rechnet bei Plätzen mit 25 bis 50 NM, bei
  Streckenstationen mit 100 bis 200 NM.
- **Die Entfernung ist eine Schrägentfernung.** Direkt über der Station in 24.000 ft zeigt die Anzeige etwa 4 NM.

:::sim{sim=bms}
BMS behandelt auch zivile VOR/DME-Stationen als TACAN. Kanal, Band und T/R stellst du auf der T-ILS-Seite des UFC
ein.
:::

:::sim{sim=dcs}
Das Flugplatzfenster der F10-Karte zeigt TACAN mit Kanal und Kennung (zum Beispiel „44X KTS“), dazu VOR, ILS und NDB je
Bahnrichtung. Wie du die Werte im Cockpit einstellst, steht im Handbuch deines Musters.
:::

## ILS

Das **ILS** (Instrument Landing System) führt dich auf die Bahn: Der **Localizer** gibt die Seite vor (Kennung: ein
„I“ und drei Buchstaben), der **Gleitpfad** die Höhe. Hat eine Bahn an beiden Enden ein ILS, ist immer nur eines in
Betrieb (AIM). Wo du auf den Gleitpfad kommst und wo du entscheidest, steht auf der Anflugkarte.

- **Entscheidungshöhe (DA):** Dort entscheidest du, ob du weiterfliegst oder durchstartest, je nachdem, ob du die
  nötigen Sichtmerkmale hast.
- **Kategorie I:** Eine Entscheidungshöhe von nicht weniger als 200 ft über der Aufsetzzone und eine Bahnsichtweite von
  mindestens 1.800 ft (FAA-Glossar).
- **BMS:** Der Localizer ist nur 3 bis 6° breit. Du musst kleinere und schnellere Korrekturen fliegen als auf einem
  TACAN-Radial.

## VOR, DME und NDB

- **VOR** ist das zivile Gegenstück der TACAN: Radiale auf VHF. In den Sims brauchst du es selten.
- **DME** misst die Entfernung. Eine TACAN hat sie schon eingebaut.
- **NDB** (Funkfeuer): Die Nadel des Funkkompass zeigt zur Station. Gewitter und die Nacht stören die Anzeige (AIM). Ältere
  und östliche Muster und die Warbirds nutzen sie noch. Im Warbird-Funkmenü heißt der Kanal dafür „Homing“, die
  Peilstationen am Boden sind ein eigener Kanal (Modul W, Lektion 1).

:::tip
Alle Radiale und Kurse beziehen sich auf **magnetisch** Nord. Warum Karte und Cockpit manchmal ein paar Grad
auseinanderliegen, steht in der Hangar-Karte „Zwei Norden“.
:::

## Wo dir das begegnet

- [Kanäle, Comm Card und „push“](/lesson/m2-l2) (Modul 2): der TACAN-Kanal im BMS-Kasten.
- [Welche Frequenz wann?](/lesson/m2-l6) (Modul 2): TACAN und ILS auf der Platzkarte.
- [Platz- und Anflugkarten lesen](/lesson/m2-l7) (Modul 2): Navigationshilfe im Kopf der Anflugkarte, Bausteine der Karte.
- [Die Karte in deiner Sim lesen](/lesson/m2-l8) (Modul 2): TACAN, ILS und NDB im Flugplatzfenster.
- [Vier Knöpfe – Funk im Warbird](/lesson/w-l1) (Warbirds): Funkfeuer und Peilstationen.
