---
id: m5-l3
module: m5
order: 3
title: BRAA und Bogey Dope
summary: Peilung, Entfernung, Höhe und Aspekt von dir aus – mit „bogey dope“ fragst du nach der nächsten Gruppe.
minutes: 10
xp: 90
sources:
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 22–26 (BRAA, Höhe, Track und Aspekt), S. 22–23 und S. 61 (Threat), S. 51–52 (Bogey Dope, BRAA)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (2020/21) – HOT, FLANK, BEAM, DRAG"
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – ältere Bestätigung der Aspektwinkel, Threat-Schwellen"
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – BRAA, BOGEY DOPE, THREAT, CLEAN, Aspekte"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (BRAA, HOT, FLANK, BEAM, DRAG)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "Hoggit-Wiki: Getting started with GCI/AWACS (Bogey Dope, BRAA)"
    url: https://wiki.hoggitworld.com/view/Gci
  - title: "SkyEye Player Guide (Threat, Standarddistanz)"
    url: https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 47–49 – BRAA unter 25 NM, Aspekte"
  - title: "DCS A-10C II Flight Manual (Eagle Dynamics), S. 790–791 – AWACS-Menü: Bogey Dope, Picture über/unter 50 NM"
---

## BRAA – von dir aus

Der Bullseye gilt für alle. Manchmal willst du aber nur wissen: **Wo ist das von mir aus?** Dafür gibt
es **BRAA**:

- **B**earing – Peilung **von dir** zur Gruppe (missweisend, wie beim Bullseye)
- **R**ange – Entfernung in Meilen
- **A**ltitude – Höhe der Gruppe in thousand
- **A**spect – wie die Gruppe zu dir steht

Danach fragst du mit **bogey dope**: „BRAA zur nächsten Gruppe, bitte.“

::call{id=m5-bogey-dope}

Ist nichts in der Nähe, antwortet der AWACS mit **clean** – keine Radardaten zu einer Gruppe.

Hast du vorher ein Picture mit Gruppennamen gehört, kannst du den Namen anhängen und bekommst das BRAA zu **genau
dieser** Gruppe:

::call{id=m5-bogey-dope-group}

:::tip
„Bogey dope“ heißt **nicht**, dass du die Gruppe targetierst – es ist nur eine Anfrage nach Information. Mit
:term[SNAP] fragst du genauso, aber mit der Absicht anzugreifen.
:::

---

::drill{id=m5-l3-call-bogey}

---

::drill{id=m5-l3-call-bogey-group}

---

::drill{id=m5-l3-bogey-targeting}

---

::drill{id=m5-l3-plot-braa repeat=2}

---

## Der Aspekt

Der Aspekt sagt, wie die Gruppe **zu dir** fliegt. Gemessen wird der Winkel zwischen dem Kurs der
Gruppe und der Linie von der Gruppe zu dir:

| Aspekt | Bedeutung | Winkel (ATP 1-02.1, 2020/21) |
|---|---|---|
| **hot** | kommt direkt auf dich zu | 0–20° |
| **flank** | kommt schräg auf dich zu | 30–60° |
| **beam** | fliegt quer zu dir | 70–110° |
| **drag** | fliegt von dir weg | 120–180° |

Diese Werte nennen sowohl die ATP 1-02.1 (2020/21) als auch das ältere Korea-BEM von 2005. Zwischen den
Klassen liegen Lücken (20–30°, 60–70°, 110–120°): Dort entscheidet das Urteil des Controllers. Eine
Sekundärquelle nennt andere Werte (hot 0–30°, flank 31–70°, beam 71–120°, drag 121–180°); sie weicht von beiden
Vorschriften ab. In den Übungen dieser App liegt der Winkel nie in einer Lücke – jede Lage hat einen eindeutigen
Aspekt.

**Himmelsrichtung:** Bei Bullseye-Meldungen steht der Track immer als Haupt- oder Nebenhimmelsrichtung („track
northeast“). Beim Aspekt tragen **flank, beam und drag** immer eine Himmelsrichtung, in die die Gruppe fliegt:
„flank northeast“, „beam west“, „drag west“. Nur **hot** hat keine. Lässt sich kein Aspekt bestimmen, sagt der
Controller „maneuver“. Ohne Aspekt nimmt man hot an. Kreist eine Gruppe über einem Punkt, darf er statt Track oder
Aspekt **„CAP“** sagen: „… thirty-nine thousand, CAP, hostile“ (ATP 3-52.4).

**Track** und **Aspekt** sind nicht dasselbe: „track west“ (im Bullseye-Call) sagt nur, wohin die
Gruppe fliegt. „drag west“ (im BRAA) sagt zusätzlich, dass sie dabei von dir wegfliegt.

---

::drill{id=m5-l3-aspect-match}

---

::drill{id=m5-l3-aspect-angle}

---

::drill{id=m5-l3-track-aspect}

---

::drill{id=m5-l3-angels-error}

---

## BRAA oder Bullseye?

Faustregel: **Bullseye für viele, BRAA für einen.** Ein Picture geht an alle – Bullseye. Bogey Dope
und Threat gelten einem einzelnen Jäger – BRAA.

Ein **THREAT** ist die Meldung, auf die du nicht wartest: Der AWACS ruft dich ungefragt, weil eine
Gruppe, die noch kein Jäger als Ziel übernommen hat, in die Bedrohungsreichweite kommt – spätestens beim Eintritt. Als
Standard nennt die ATP 3-52.4 dafür **35 NM, unabhängig vom Aspekt**; die Kriterien stehen im Briefing oder
werden beim Check-in genannt. Das Format: Gruppenname, dann „threat BRAA“, Höhe, Aspekt, Identität.

::call{id=m5-threat}

Gilt die Warnung mehreren Jägern oder ist deine Position unbekannt, folgt „threat **bullseye**“; du antwortest
dann ebenfalls mit deinem Rufzeichen. Innerhalb von 5 NM genügen Himmelsrichtung, Entfernung, Höhe, Track und
Identität. Mit „targeted“ übernimmst du die Gruppe und beendest die Warnung.

::call{id=m5-threat-bullseye}

Eine **neu entdeckte** Gruppe, die gleich die Threat-Kriterien erfüllt, meldet der AWACS als **„threat group“** im
BRAA-Format an den nächsten Jäger (siehe Lektion 4).

:::layer{layer=community}
SkyEye ruft THREAT standardmäßig ab 25 NM. Das ältere Korea-BEM (2005) staffelt die Schwelle nach
Bedrohungsart, z. B. für Wärmesuchköpfe weniger als für Radar-Raketen. Die 35 NM sind der Standardwert der ATP
3-52.4.
:::

---

::drill{id=m5-l3-threat-ack}

---

::drill{id=m5-l3-threat-bulls}

---

::hangar{id=wie-ein-radar-sieht}

---

## Merke

:::example
**BRAA = Peilung und Entfernung von DIR, Höhe in thousand, Aspekt. bogey dope fragt danach.**

hot – flank – beam – drag beschreiben die Gruppe relativ zu dir (flank/beam/drag mit Himmelsrichtung), track nur
ihre Flugrichtung. Bullseye für viele, BRAA für einen. „clean“ = nichts da. Bogey dope ist kein Targeting.
Threat: Gruppenname – threat BRAA …, Standard 35 NM.
:::

:::sim{sim=bms}
In Falcon BMS meldet der AWACS unter **25 NM** in BRAA, darüber im Bullseye-Format. Die Aspekte heißen
dort HOT, BEAMING, DRAGGING und COLD – ein „flank“ gibt es nicht. Auf große Entfernung nennt er nur
„TRACK“ und die Richtung.
:::

:::sim{sim=dcs}
Der KI-AWACS in DCS antwortet auf „Bogey dope“ (Menü **F7**) mit der nächsten Bedrohung. Laut
A-10C-Handbuch (S. 790–791) meldet er das **Picture** über **50 NM** im Bullseye-Format, darunter in BRA.
⚠ Ob das für jedes Modul gilt, prüf im Spiel. SkyEye ruft THREAT standardmäßig ab **25 NM**.
:::
