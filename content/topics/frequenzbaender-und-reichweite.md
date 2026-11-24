---
id: frequenzbaender-und-reichweite
title: Frequenzbänder, Modulation und Reichweite
summary: Wer auf UHF, VHF und Kurzwelle funkt, warum AM und FM nicht zusammenpassen und wie weit dein Funk trägt.
terms: [UHF, VHF, AM, FM, HF, UNIFORM, VICTOR, FOX MIKE]
sources:
  - title: "Wikipedia: Airband (VHF-AM 118 bis 136.975 MHz, militärisches UHF-AM 225 bis 399.95 MHz mit Guard 243.0, AM weltweit, Kurzwelle über Ozeanen, etwa 200 NM Reichweite auf Reiseflughöhe)"
    url: https://en.wikipedia.org/wiki/Airband
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), UNIFORM, VICTOR, FOX MIKE (S. 32)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "ATIS Telecom Glossary: Radio horizon range (RHR)"
    url: https://glossary.atis.org/glossary/radio-horizon-range-rhr/
  - title: "DCS F-16C Early Access Guide, S. 86, 251–263 (AN/ARC-222: AM 116 bis 151.975 MHz, FM 30 bis 87.975 MHz)"
  - title: "DCS World, F10-Karte: Flugplatzfenster (ATC-Frequenzen auf Kurzwelle, tiefem VHF, VHF und UHF); VHF-Platzfrequenzen der installierten Karten laut Mods/terrains/<Karte>/Radio.lua im DCS-Ordner: 118,0 bis 142,9 MHz"
  - title: "ICAO Annex 10 Band V, Abschnitt 4.1 (Flugfunkband VHF 117,975 bis 137 MHz)"
---

Flugfunk läuft auf Frequenzbändern, und die Wahl des Bandes entscheidet, **wen** du erreichst und **wie weit**.

## Die Bänder

| Band | Bereich | Modulation | Wer funkt dort | Brevity |
|---|---|---|---|---|
| **UHF** | 225 bis 400 MHz | AM | Militär: Plätze, Tanker, in BMS auch der AWACS | uniform |
| **VHF** | 118 bis 137 MHz | AM | zivile Lotsen, in DCS oft auch der AWACS, im Kampfjet oft der Flight | victor |
| **VHF-FM** | 30 bis 88 MHz | FM | Bodentruppen, JTAC | fox mike |
| **HF** (Kurzwelle) | wenige bis rund 20 MHz | SSB | Ozeane und abgelegene Gebiete | – |

- Das **zivile VHF-Band** reicht von 118 bis 136.975 MHz. Auf **UHF** hat das Militär sein eigenes Band mit dem
  Guard-Kanal 243.0.
- **Kurzwelle** trägt weit über den Horizont und ist die Wahl über Ozeanen. Für den Sim-Funk spielt sie kaum eine Rolle.
- Wer wo liegt, legt der **Comm Plan** fest, siehe [Comm Plan, Comm Card und Missionsunterlagen](/wissen/comm-plan-und-missionsunterlagen).

:::tip
**Die Zahl auf dem Gerät ist nicht die Zahl des Bandes.** Das F-16-Funkgerät AN/ARC-222 sendet auf AM von 116 bis
151.975 MHz. In den DCS-Karten liegen die VHF-Frequenzen der Plätze zwischen 118 und rund 143 MHz. Das sind der Bereich des
Geräts und die Frequenzen, die die Sim vergibt, nicht das Flugfunkband, das bei 136.975 MHz endet.
:::

## AM und FM

**AM** und **FM** sind zwei Arten, die Stimme auf die Welle zu legen. Ein Empfänger versteht nur seine Art: Gleiche
Frequenz mit falscher Modulation heißt **kein Kontakt**. Der Flugfunk ist weltweit AM, weil bei AM zwei gleichzeitige
Sender beide hörbar bleiben, während bei FM der stärkere den schwächeren verdeckt. Die Hangar-Karte „Warum Flugfunk
immer noch AM ist“ erklärt den Grund.

## Wie weit trägt es

VHF und UHF breiten sich geradeaus aus, also bis zum **Funkhorizont**. Merkwerte für ein Flugzeug und
eine Antenne am Boden: 100 ft gut 10 NM, 1.000 ft 40 NM, 5.000 ft 90 NM, 10.000 ft 120 NM, 30.000 ft 210 NM. Vierfache
Höhe heißt doppelte Reichweite, und zwei Flugzeuge addieren ihre Reichweiten. In der Praxis ist es oft etwas weniger
(Antennen, Empfindlichkeit des Empfängers). Bei
Inversionswetterlagen reicht es auch deutlich weiter (Überreichweiten), Regen und Wolken spielen auf VHF und UHF dagegen
kaum eine Rolle. Ein Hubschrauber im Tiefflug kommt nur wenige Meilen weit, und Berge schatten ab. Ein AWACS fliegt
dagegen hoch, vor allem damit sein Radar weit über den Horizont sieht; nebenbei reicht so auch sein Funk weit. Woher die Werte kommen, steht in der Hangar-Karte „Warum dich der Tower hinter dem Berg nicht hört“.

## Senden oder hören

Solange du die Sprechtaste hältst, hörst du nichts. Senden zwei Stationen gleichzeitig, hören alle ein Gemisch mit
Pfeifton: Keiner kam durch, und der Lotse sagt „blocked“. Meist ruft er dann gezielt einen auf („…, say again“), und nur
der wiederholt. Ruft er niemanden auf, hörst du kurz hinein und wiederholst dann deinen Funkspruch vollständig.

## Wo dir das begegnet

- [Zahlen im Funk](/lesson/m1-l3) (Modul 1): die Bereiche UHF und VHF bei den Frequenzen.
- [Funk und Physik](/lesson/m1-l7) (Modul 1): Wellenlänge, Funkhorizont zum Merken, Funkschatten, Rauschen und AM/FM.
- [Funkgeräte im Cockpit](/lesson/m2-l1) (Modul 2): Bänder, Geräte und die Wörter uniform, victor, fox mike.
- [Funkdisziplin auf vollen Frequenzen](/lesson/m2-l4) (Modul 2): Senden oder hören, blocked.
- [SRS in der Praxis](/lesson/m2-l5) (Modul 2): Funkhorizont und Reichweite in der Sim.
- [Vier Knöpfe – Funk im Warbird](/lesson/w-l1) (Warbirds): feste Kanäle und ihre Reichweite.
