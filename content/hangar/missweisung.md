---
id: missweisung
title: Zwei Norden
category: physik
teaser: Der Kompass zeigt nicht zum Nordpol. Warum Karte und Cockpit manchmal ein paar Grad auseinanderliegen.
sources:
  - title: "NOAA: Magnetic declination / World Magnetic Model"
    url: https://www.ncei.noaa.gov/products/world-magnetic-model
  - title: "Falcon BMS 4.38 Comms & Nav Book (im BMS-Ordner Docs), S. 99, 102 – Missweisung auf den Platzkarten"
  - title: "DCS F-16C Early Access Guide (liegt DCS bei), S. 92, 356 – Bullseye-Peilung in Grad magnetisch"
---

Es gibt zwei Norden. **Geografisch Nord** ist der Punkt, um den sich die Erde dreht – danach sind
Landkarten und die Gitter in deinen Sims ausgerichtet. **Magnetisch Nord** ist der Punkt, auf den
eine Kompassnadel zeigt. Er liegt nicht am geografischen Pol und wandert langsam.

Den Winkel zwischen beiden Richtungen nennt man **Missweisung** (englisch *magnetic variation* oder
*declination*). Er hängt davon ab, wo du bist, und ändert sich über die Jahre. Deshalb steht er auf
jeder Platzkarte – auf der BMS-Platzkarte von Kunsan zum Beispiel mit 7,5° West.

Für dich als Pilot heißt das:

- **Karten und Lineale** in der Sim messen in der Regel nach geografisch Nord ⚠ (die Handbücher von
  DCS und BMS sagen es nicht ausdrücklich – der Bahn-Check unten verrät es dir).
- **Kompass** und die **Bahnnummern** richten sich nach magnetisch Nord, ebenso **Bullseye-Calls**. In
  der DCS-F-16 zeigen auch HUD und HSD-Cursor die Bullseye-Peilung magnetisch an (laut Handbuch).
- Bei **westlicher** Missweisung ist der magnetische Kurs größer als der geografische, bei
  **östlicher** kleiner. Eine alte Fliegerregel auf Englisch: *„East is least, west is best.“*

Ein guter Plausibilitätscheck ist die Bahn: Bahn 36 zeigt etwa nach 360° **magnetisch**. Zeigt dein
Lineal auf der Karte für dieselbe Bahn 353°, kennst du die Missweisung – rund 7° West.

:::tip
Seit Version 4.38 modelliert Falcon BMS die Missweisung. In DCS hängt sie von der Karte ab. Wenn ein
Kurs von der F10-Karte nicht zu deinem Kompass oder HSI passt, ist das meist der Grund.
:::
