---
id: track-c-l5
module: track-c
order: 5
title: Laser und IR
summary: Eine Laser-Markierung koordinieren (ten seconds, laser on, lasing, spot, cease laser), gültige Laser-Codes erkennen und die IR-Calls bei Nacht.
minutes: 10
xp: 90
layer: core
sources:
  - title: "Wikipedia: Multiservice tactical brevity code (Zusammenfassung der ATP 1-02.1, April 2025): TEN SECONDS, LASER ON, LASING, SPOT, SPARKLE, SNAKE, STEADY, ROPE"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "ATP 1-02.1 (Mai 2020), Tabelle 2: CEASE LASER, TERMINATE (nur Training), ROPE [S/A]"
  - title: "DCS A-10C II Flight Manual: Laser-Codes 1111–1788, Standard 1688"
  - title: "DCS JFO/JTAC Pilot Guide (Community, 562nd Tactical School): LTL, PTL, Snake und Steady"
---

## Wer lasert wann

Steht in Line 7 „laser“ mit einem Code, beleuchtet der JTAC das Ziel mit seinem Laser. Den Takt gibst aber **du** vor –
denn nur du weißt, wann deine Waffe oder dein Sensor den Fleck braucht.

::call{id=track-c-laser}

1. :term[TEN SECONDS] – der JTAC macht sich bereit.
2. :term[LASER ON] – jetzt lasern. Die Anweisung kommt vom Angreifer.
3. :term[LASING] – der JTAC lasert.
4. :term[SPOT] – dein Sensor hat den Fleck.
5. :term[CEASE LASER] – Laser aus.

Findest du keinen Fleck, meldest du „negative laser“.

:::warn
In älteren Quellen und manchen Sim-Leitfäden heißt der letzte Schritt **terminate**. In der aktuellen ATP 1-02.1 (2020)
bedeutet :term[TERMINATE] nur noch „im Training das örtliche Gefecht beenden“ – für den Laser sagst du **cease laser**.
:::

---

::drill{id=track-c-l5-sequence}

---

::drill{id=track-c-l5-who-lasing}

---

::drill{id=track-c-l5-laser-on}

---

::drill{id=track-c-l5-spot}

---

::drill{id=track-c-l5-cease}

---

## Der richtige Code

Laser und Suchkopf erkennen sich am **Laser-Code** aus Line 7. Gültig sind vierstellige Codes von 1111 bis 1788: die
erste Ziffer 1, die zweite 1 bis 7, die dritte und vierte 1 bis 8 – eine 0 oder 9 gibt es nicht.

---

::drill{id=track-c-l5-code-valid}

---

::drill{id=track-c-l5-code-hear}

---

::hangar{id=laserkegel}

---

## Bei Nacht: IR-Pointer

Nachts markiert der JTAC oft mit einem **Infrarot-Pointer**. Den Strahl siehst du nur durch die Nachtsichtbrille.

::call{id=track-c-ir}

Findest du die eigenen Leute nicht, hilft der Trupp am Boden umgekehrt: Er kreist mit dem Pointer um **dein** Flugzeug,
:term[ROPE]. Das Wort kommt vom Boden, nicht von dir.

:::aircraft{aircraft=ah64}
Im AH-64D sind die Laser-Codes als Buchstaben A bis R gespeichert, der Laser Spot Tracker braucht den Code des
Markierers (DCS-Handbuch, nicht am Original geprüft ⚠).
:::

---

::drill{id=track-c-l5-ir-match}

---

## Merke

:::example
**ten seconds → laser on → lasing → spot → cease laser**. Laser on und cease laser sagst du, lasing der JTAC. Laser-Codes:
1111 bis 1788, ohne 0 und 9. Bei Nacht: **sparkle**, **snake**, **steady**.
:::
