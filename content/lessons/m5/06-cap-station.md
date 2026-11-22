---
id: m5-l6
module: m5
order: 6
title: "Szenario: Auf CAP-Station"
summary: Eine ganze Station mit dem AWACS – vom Check-in bis zu Pigeons, mit Picture, Declare und einer Bedrohung.
minutes: 14
xp: 140
layer: community
sources:
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 5 (Funkprioritäten), S. 8–9 (Check-in), S. 28–29 (Core Information), S. 46 (Threat Group), S. 50–51 (Declare)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (2020/21) – CAP(ING), ANCHOR"
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – ANCHOR, NEW PICTURE, FADED"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "Hoggit-Wiki: Getting started with GCI/AWACS"
    url: https://wiki.hoggitworld.com/view/Gci
  - title: "SkyEye (GitHub-Repository und Player Guide)"
    url: https://github.com/dharmab/skyeye
---

## Station beziehen

**CAP** heißt *Combat Air Patrol*: Du hältst einen Luftraum frei und wartest, bis etwas passiert. Der
AWACS sagt dir, wo du kreisen sollst – mit einem Punkt, meist im Bullseye-Format. Das genaue Brevity-Wort ist
**CAP** mit dem Punkt („richte deine Combat Air Patrol dort ein“); viele Controller und Sim-Server sagen **ANCHOR**
(„kreise über diesem Punkt“). Für die Station meinen beide dasselbe:

::call{id=m5-anchor}

---

::drill{id=m5-l6-call-anchor}

---

## Zum Aufwärmen: drei Gruppen

Bevor es losgeht, noch einmal das Lagebild – diesmal mit drei Gruppen. Die hintere Gruppe hat oft keinen
eigenen Bullseye: Wo sie steht, leitest du aus dem Label und seinen Maßen (wide, deep) ab.

---

::drill{id=m5-l6-plot-three}

---

## Die ganze Station

Jetzt am Stück: Check-in „as fragged“ auf dem Weg zur Station, Station beziehen, Picture, Bogey Dope, Declare – und
irgendwann meldet sich der AWACS ungefragt mit einer „threat group“. Zum Schluss Bingo, Abmelden mit Pigeons und
zurück zu Approach.

Die Frequenzen und die Missionsnummer stehen auf deiner Line-up-Card. Dein Flight ist in diesem Szenario noch
nicht „commit“ gegangen, das Picture kommt deshalb als Core Information. Merk dir die Zahlen, die du hörst: Was
im Picture kommt, brauchst du beim Declare wieder. Jedes BRAA rechnet der AWACS von deiner Station aus.

---

::scenario{id=m5-s1-cap-station}

---

::hangar{id=wer-spricht-zuerst}

---

::hangar{id=skyeye}

---

## Merke

:::example
**Beim AWACS: knapp anfragen, mit dem Rufzeichen bestätigen, nichts zurücklesen.**

Check-in (Missionsnummer, as fragged, Alpha Check) – CAP bzw. anchor – picture (Core Information mit Bullseye, für alle) –
bogey dope und threat (BRAA, nur für dich) – declare (du nennst die Position, er die Identität) – RTB und pigeons.
Bei mehreren Meldungen auf der Frequenz gilt die Rangfolge der ATP 3-52.4: Warnungen vor Lagebild.
:::
