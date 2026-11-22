---
id: kanalraster
title: Warum 25 und 8,33 kHz – das Kanalraster
category: technik
teaser: Warum Frequenzen drei Nachkommastellen haben, warum 251.250 dasselbe ist wie 251.25 – und warum 132.835 gar keine Frequenz ist.
sources:
  - title: "DCS F-16C Early Access Guide (Eagle Dynamics) – ARC-222: 30,000–87,975 und 108,000–151,975 MHz in 0,025-MHz-Schritten"
  - title: "UK CAA, CAP 413 Radiotelephony Manual – Aussprache von Frequenzen, 8,33-kHz-Kanäle"
  - title: "FAA Aeronautical Information Manual 4-2-8 (Figures and Letters)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_2.html
---

Ein Funkgerät kann nicht jede beliebige Frequenz einstellen, sondern springt in festen Schritten – dem
**Kanalraster**. Damit sich benachbarte Sender nicht stören, braucht jeder Kanal etwas Platz.

**25 kHz** ist das Raster im militärischen UHF-Band und im militärischen VHF: 251,000 – 251,025 – 251,050 –
251,075 … Deshalb enden alle Frequenzen auf 00, 25, 50 oder 75, und deshalb haben sie drei Nachkommastellen.
Das ARC-164 der F-16 kommt so im UHF-Band auf 7.000 Kanäle (Hangar-Karte „Zwei Funkgeräte, vier Jahrzehnte“ in
Modul 2, Lektion 1). Nullen am Ende spricht niemand mit: **251.250** ist „two five one point two five“ – und die
App behandelt 251.250 und 251.25 deshalb gleich.

**8,33 kHz** ist das Raster im zivilen VHF-Band in Europa. Der Himmel ist dort so voll, dass 25 kHz nicht mehr
reichten; ein Drittel des Abstands verdreifacht die Zahl der Kanäle. Eingeführt wurde es schrittweise, zuerst im
oberen Luftraum ⚠.

Mit 8,33 kHz passen die Frequenzen nicht mehr in drei Nachkommastellen (132,8333… MHz). Deshalb funkt man dort
**Kanalnamen** mit sechs Ziffern, und der Kanalname ist **nicht** die echte Frequenz: „132.835“ meint den Kanal bei
132,8333 MHz. Gesprochen werden dann alle sechs Ziffern. Auf VATSIM und IVAO begegnet dir das in Europa ständig.

In den Militär-Sims (DCS, BMS) bleibt es beim 25-kHz-Raster – drei Nachkommastellen, die letzte Null fällt weg.
