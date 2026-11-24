---
id: sim-vs-wirklichkeit
title: Warum die Frequenz in der Sim nicht stimmt
category: hintergrund
teaser: Du hast die echte Karte, die echte Frequenz – und trotzdem antwortet niemand. Das hat Gründe.
sources:
  - title: "Georgien eAIP, AD 2 UGKO Kutaisi"
    url: https://airnav.ge/eaip/2023-03-23-AIRAC/html/eAIP/UG-AD-2.UGKO-en-GB.html
  - title: "DCS World: terrains\\Caucasus\\radio.lua und Kneeboard-Karten (im DCS-Ordner)"
  - title: "Falcon BMS 4.38: KTO AIP und Comms & Nav Book S. 8, 99 (liegt BMS bei, im Installationsordner unter Docs)"
---

Flugsims bilden echte Gegenden nach – aber nicht die echte Funkwelt. Dafür gibt es gleich mehrere
Gründe:

**Karten altern.** Eine Sim-Karte zeigt einen Stand, der Jahre zurückliegen kann. Die
Caucasus-Platzkarten in DCS tragen das Jahr 2012, die echte Welt hat sich seitdem weitergedreht:
Frequenzen wurden verlegt, Plätze haben eine ATIS bekommen.

**Sims vereinfachen.** In DCS hat jeder Platz eine einzige Lotsenstelle für Ground, Tower und Approach.
Ein echter Platz hat vier oder fünf Frequenzen. BMS kommt der Wirklichkeit näher, legt aber Departure
und Approach auf eine Frequenz und lässt die ganze Flugsicherung über UHF laufen.

**Missionen setzen eigene Werte.** Ein Missionsbauer verteilt Frequenzen für Tanker, AWACS, Flights und
oft auch für die Plätze neu – passend zu seinem Szenario, nicht zur echten Welt.

**Echte Karten liegen trotzdem bei.** DCS bringt für manche Karten echte Platzkarten mit, BMS echte
Anflugkarten aus Korea. Die sind wertvoll für Bahnen, Rollwege, Höhen und Verfahren. Bei den
Frequenzen musst du aufpassen.

Ein Beispiel: Kutaisi hat laut dem georgischen eAIP den Tower auf 125,5 MHz. In DCS antwortet er auf
134,0 bzw. 263,0 MHz. Beides ist „richtig“ – nur eben in verschiedenen Welten.

Deshalb gilt immer: **erst die Unterlagen der Mission, dann die Daten der Sim, dann die echte Welt.**
