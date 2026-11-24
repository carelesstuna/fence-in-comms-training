---
id: w-l3
module: track-w
order: 3
title: Leitstelle statt AWACS
summary: Wenn ein Radar am Boden führt – Scramble, Vector, Angels, Buster, Bogey Dope und Pancake. Dieselben Wörter wie heute, aber ein Radar, das weniger sieht.
minutes: 12
xp: 90
layer: community
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021) – SCRAMBLE S. 54, VECTOR S. 68, PANCAKE S. 46, ANGELS, BUSTER, GATE, BOGEY DOPE, PIGEONS, TALLY, CLEAN"
  - title: "Tempest's Blue Flash: Serverbriefing (GCI je Seite, EWR statt AWACS)"
  - title: "SkyEye Player Guide (Bogey Dope, Vector, Picture über SRS)"
    url: https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md
  - title: "Wikipedia: Dowding system"
    url: https://en.wikipedia.org/wiki/Dowding_system
  - title: "Wikipedia: Airborne early warning and control – History (Radar-Wellington 1944/45, TBM-3W ab 1945)"
    url: https://en.wikipedia.org/wiki/Airborne_early_warning_and_control
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – broadcast control, tactical control, close control"
  - title: "IL-2 Korea Dev Blog #58 – Bodenradar"
    url: https://media.il2-korea.com/news/dd_58
---

## Wer dich führt, wenn kein AWACS fliegt

In modernen Szenarien führt dich ein AWACS (Modul 5) – ein Radarflugzeug hoch über dem Geschehen. Radarflugzeuge, die Jäger
führen, gab es vereinzelt schon 1944/45; im großen Stil und im Luftkampf über Feindgebiet erst ab dem Vietnamkrieg
(Hangar-Karte „Big Eye“ in Modul 5, Lektion 1). Davor, und auf vielen Servern mit Weltkriegs- oder
Kalter-Krieg-Szenario bis heute, führt eine **Leitstelle am Boden**, auf Englisch **GCI** (Ground Controlled
Intercept), oft mit Frühwarnradaren (**EWR**).

- **1940** führten die Sektorleitstellen der RAF ihre Jäger nach der Lagekarte per Sprechfunk an die Bomber heran
  (Meldungen von Radarstationen und Beobachtern). Ab dem Winter 1940/41 kamen GCI-Stationen mit eigenem
  Radarschirm dazu, zuerst für die Nachtjäger.
- **Über Korea** führten sowjetische Bodenleitstellen die MiG-15.
- **Auf Kalter-Krieg-Servern** sitzt oft ein Mitspieler am Radarschirm, oder ein Bot beantwortet Anfragen.
- **In IL-2 Korea** gibt es Bodenradar-Posten in der Sim selbst.

Die Wörter sind dieselben wie beim AWACS. Die meisten stammen sogar aus der Zeit der Bodenleitstellen.

---

::hangar{id=ewr-statt-awacs}

---

## Die Wörter der Leitstelle

| Wort | Bedeutung |
|---|---|
| :term[SCRAMBLE] | So schnell wie möglich starten |
| :term[VECTOR] | Auf den genannten Kurs drehen |
| :term[ANGELS] | Höhe der Eigenen in tausend Fuß |
| :term[BUSTER] / :term[GATE] | Volle Dauerleistung ohne Nachbrenner bzw. Nachbrenner oder Höchstleistung (im Warbird: Notleistung, WEP) |
| :term[BOGEY DOPE] | Wo ist die nächste Gruppe? (Antwort in BRAA) |
| :term[TALLY] | Gegner in Sicht |
| :term[PIGEONS] | Kurs und Entfernung zum Heimatplatz |
| :term[PANCAKE] | Landen bzw. um Landung bitten |

---

::drill{id=w-l3-words}

---

## Führen statt Lagebild

AWACS und Leitstelle am Boden können beide alles – den Unterschied macht die **Kontrollart**:

- **Broadcast Control** – Lage bezogen auf einen Punkt (Bullseye), für alle auf der Frequenz.
- **Tactical Control** – Lage für dich in BRAA, Bullseye oder über einen Geländepunkt; was du daraus machst,
  entscheidest du.
- **Close Control** – die Leitstelle führt dich direkt: Kurs, Höhe und Tempo, bis zum Gegner.

In Modul 5 hast du vor allem die ersten beiden erlebt. Ohne Datenlink lief die Führung im Kalten Krieg oft als Close
Control – die Leitstelle rechnet von deiner Position aus und gibt dir einen **Abfangkurs** vor, der vorhält, wohin
die Gruppe fliegt.

::call{id=w-gci-vector}

Bestätigt wird wie beim AWACS mit dem **Rufzeichen**. Du fliegst, was sie sagt – zurücklesen musst du es
nicht.

---

::drill{id=w-l3-ack-vector}

---

## Was ein Radar am Boden nicht sieht

Ein Radar am Boden schaut nur bis zum **Horizont** – genau wie dein Funk (Funkhorizont, Hangar-Karte in Modul 1,
Lektion 5). Hohe Ziele sieht es weit, tief fliegende erst spät, weil ihr eigener Horizont klein ist. Ein AWACS
fliegt deshalb so hoch.

Für dich heißt das: Ein **CLEAN** von der Leitstelle bedeutet nur, dass ihr Radar nichts sieht – nicht,
dass nichts da ist. Augen auf, und später noch einmal fragen.

---

::hangar{id=wie-ein-radar-sieht}

---

::drill{id=w-l3-clean}

---

::drill{id=w-l3-tally}

---

## Zurück zum Platz: Pancake

Ist der Treibstoff knapp oder die Munition alle, meldest du der Leitstelle, dass du landen willst – mit
Grund – und lässt dir den Weg nach Hause geben:

::call{id=w-pancake}

---

::drill{id=w-l3-call-pancake}

---

::hangar{id=koreanisch-auf-befehl}

---

::scenario{id=w-s1-scramble-gci}

---

::hangar{id=teaball}

---

## Merke

:::example
Ohne AWACS führt eine **Leitstelle am Boden**: **scramble**, **vector**, **angels**, **buster**. Du
bestätigst mit dem **Rufzeichen**. Bogey Dope kommt in **BRAA**, gerechnet von dir aus. **CLEAN** heißt
nur: Ihr Radar sieht nichts. Nach Hause mit **pancake** und **pigeons**.
:::
