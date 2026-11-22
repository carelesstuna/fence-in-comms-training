---
id: mgrs-zehn-meter
title: Acht Ziffern, zehn Meter – wie MGRS funktioniert
category: hintergrund
era: modern
teaser: Line 6 klingt wie ein Zungenbrecher. Dahinter steckt ein einfaches Raster aus Zonen, Quadraten und Ziffern.
sources:
  - title: "Wikipedia: Military Grid Reference System"
    url: https://en.wikipedia.org/wiki/Military_Grid_Reference_System
  - title: "DCS JFO/JTAC Pilot Guide (Community, 562nd Tactical School): Line 6 immer mit Quadrat und 8 bis 10 Ziffern"
---

Breiten- und Längengrade sind für den Boden umständlich: Grad, Minuten, Sekunden, und ein Grad Länge ist am Äquator
breiter als in Norwegen. Das Militär rechnet deshalb in einem **Raster aus Metern**, dem Military Grid Reference System
(**MGRS**).

Eine vollständige Koordinate hat drei Teile:

1. **Zonenfeld**, z. B. **37T** – ein Streifen der Erde. Über einem Einsatzgebiet ist das Feld fast immer gleich, deshalb
   lässt man es im Funk meist weg.
2. **100-km-Quadrat**, zwei Buchstaben, z. B. **GG**. Im Funk buchstabiert: „Golf Golf“.
3. **Ziffern**: erst nach Osten (Rechtswert), dann nach Norden (Hochwert), immer gleich viele.

Je mehr Ziffern, desto genauer:

| Ziffern | genau auf |
|---|---|
| 4 | 1 km |
| 6 | 100 m |
| 8 | 10 m |
| 10 | 1 m |

Für ein Fahrzeug reichen **acht Ziffern**: „Golf Golf two niner three seven six two seven four“ legt das Ziel auf ein
Feld von zehn mal zehn Metern. Gesprochen wird jede Ziffer einzeln, ohne Pause zwischen Rechts- und Hochwert – beim
Aufschreiben setzt man die Lücke selbst: **GG 2937 6274**.

Genau deshalb wird Line 6 zurückgelesen: Eine verdrehte Ziffer hinten verschiebt das Ziel um ein paar Dutzend Meter,
eine verdrehte Ziffer vorn um Kilometer.
