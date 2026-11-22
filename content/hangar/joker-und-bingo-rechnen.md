---
id: joker-und-bingo-rechnen
title: Wie viel ist genug? Joker und Bingo
category: praxis
teaser: Bingo ist kein Gefühl, sondern eine Rechnung – und Joker ist der Puffer davor.
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), PDF-S. 17 (BINGO) und 40 (JOKER)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "Wikipedia: Bingo fuel"
    url: https://en.wikipedia.org/wiki/Bingo_fuel
  - title: "AFMAN 11-2F-16 V3 (2020), Abs. 3.33.1–3.33.3 (F-16, USAF)"
  - title: "Heatblur F-4E Manual (liegt DCS bei), Abschnitt Fuel Quantity Indicator, S. 88–89"
  - title: "Falcon BMS 4.38 Comms & Nav Book (liegt Falcon BMS bei) – Joker der KI"
---

**Bingo** ist der vorher festgelegte Treibstoffstand, den du für Heimflug und Landung samt Reserve
brauchst. **Joker** liegt etwas darüber: Ab hier löst du dich vom Gefecht oder brichst ab, damit du
nicht erst bei Bingo merkst, dass der Rückweg knapp wird.

Grob gerechnet setzt sich Bingo zusammen aus:

- dem Weg vom Einsatzgebiet nach Hause – meist in einer sparsamen Höhe,
- dem Anflug und der Landung, vielleicht mit einem zweiten Versuch,
- einer Reserve für Unvorhergesehenes, z. B. einen Ausweichplatz.

Joker ist dann Bingo **plus** der Sprit, den du brauchst, um dich sauber zu lösen: noch eine Kurve,
der Weg aus dem Gebiet, das Sammeln des Flights.

Das **offizielle Beispiel der US Air Force** (F-16, AFMAN 11-2F-16 V3, Abs. 3.33): Joker ist die
gebriefte Menge Kraftstoff, um ein Ereignis zu beenden und den Rest der Mission zu fliegen. Bingo
ist der gebriefte Stand, mit dem man Landebasis oder Ausweichplatz erreicht und dort noch das
**Normal Recovery Fuel** übrig hat: auf Initial oder am Final Approach Fix mindestens
**1.000 lb** (F-16 Block 10 bis 32) bzw. **1.200 lb** (ab Block 40). Den Nachbrenner nutzt man
nicht unter Bingo oder 2.000 lb Gesamtkraftstoff (je nachdem, was höher ist), außer aus
Flugsicherheitsgründen. Diese Zahlen gehören zur F-16; für andere Muster gelten andere Werte.

Zwei Beispiele aus den Sims:

- Das DCS-Handbuch der **F-4E** nennt als grobe Richtwerte **Bingo etwa 4.000 lb** und **Joker etwa
  6.000 lb**.
- In **Falcon BMS** rechnet die KI ihren Joker als **Bingo + 500 lb**.

Die Werte stehen im **Missionsbriefing** bzw. auf der Line-up-Card. Sie hängen vom Flugzeug, von der
Entfernung nach Hause und vom Wetter am Heimatplatz ab – deshalb gibt es keine festen Zahlen für
alle Missionen.

:::sim{sim=dcs}
Viele DCS-Jets haben eine **Bingo-Warnung**, die du auf deinen gebrieften Wert stellst. Wo das geht,
steht im Handbuch deines Flugzeugs (z. B. Bingo-Einstellung am Fuel-Panel bzw. im Display).
:::
