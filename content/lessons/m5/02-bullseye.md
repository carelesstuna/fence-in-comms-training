---
id: m5-l2
module: m5
order: 2
title: Bullseye – ein Punkt für alle
summary: Positionen als Peilung und Entfernung vom Bullseye – eine Ansage, die für jeden Jäger gilt.
minutes: 10
xp: 90
sources:
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 7–9 (Check-in, Alpha Check), S. 22 (Bullseye-Format)"
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – BULLSEYE, ALPHA CHECK, GROUP, PICTURE"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (BULLSEYE, TRACK)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "Hoggit-Wiki: Getting started with GCI/AWACS (Alpha Check)"
    url: https://wiki.hoggitworld.com/view/Gci
  - title: "SkyEye Player Guide (Alpha Check)"
    url: https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 47–48 – Bullseye und BRAA"
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – ältere Angabe zu „at bullseye“"
---

## Der Bullseye

Die Grundlagen – lesen, Richtung, Missweisung – kennst du aus Modul 2, Lektion 9. Hier geht es darum, wie der
AWACS mit dem Bullseye arbeitet. Zur Erinnerung: Der **Bullseye** ist ein Punkt, den alle im Einsatz vorher bekommen – aus dem Missionsbriefing, im
Navigationssystem gespeichert. Jede Position wird von dort aus angegeben:

- erst die **Peilung vom Bullseye** – drei Ziffern, missweisend
- dann die **Entfernung** in Meilen

„bullseye 045/60“ heißt also: 60 Meilen vom Bullseye in Richtung 045, also nordöstlich davon. Für
**jeden** Jäger dieselben Zahlen, egal, wo er gerade fliegt.

So meldet der AWACS eine einzelne Gruppe:

::call{id=m5-single-group}

Die Reihenfolge ist fest: **Bullseye – Höhe – Track – Identität**. Die Höhe heißt bei Kontakten
„thousand“, der **Track** ist die Flugrichtung der Gruppe als Himmelsrichtung. Das Wort „picture“ steht
nicht in der Antwort – das sagt nur, wer danach fragt. Wie der AWACS mehrere Gruppen auf einmal ansagt,
kommt in Lektion 4.

:::tip
Bullseye und BRAA werden auf volle Grad und volle Meilen gerundet. Die ATP 3-52.4 spricht sie als Peilung
plus Entfernung: „bullseye 225/30“ heißt „two-two-five thirty“. Die App versteht beim Tippen auch
„two two five, three zero“. Dazu drei Besonderheiten:

- Liegt eine Gruppe **innerhalb von 5 NM** vom Bullseye, darf der AWACS „**at bullseye**“ sagen – außer die
  Gruppe soll gezielt bekämpft werden.
- Steht im Briefing ein **Codename** für den Bullseye, nimmt der AWACS ihn statt „bullseye“.
- „Bull“ allein sagt er nie, damit es nicht mit „BRAA“ verwechselt wird.

Die Höhe spricht die ATP 3-52.4 als ganze Zahl („thirty-nine thousand“). Sprichst oder tippst du sie ziffernweise
(„three niner thousand“), zählt das genauso – getippt aber in Worten, nicht als „39000“. Ganze Zahlen bei Entfernung und Kontakthöhe sind eine
der Ausnahmen von „Ziffer für Ziffer“, siehe [Zahlen im Funk](/wissen/zahlen-im-funk). Das ältere Korea-BEM (2005) nennt für „über
dem Bullseye“ übrigens noch 3 NM.
:::

---

::drill{id=m5-l2-plot-place repeat=2}

---

::drill{id=m5-l2-build-group}

---

## Vom Bullseye, nicht zum Bullseye

Der häufigste Fehler beim Bullseye: die **Richtung**. Die Peilung zeigt immer **vom** Bullseye **zur**
Gruppe – nicht umgekehrt. Eine Gruppe bei „bullseye 045“ steht nordöstlich vom Bullseye. Wer zur
Gruppe will und vom Bullseye aus 045 fliegt, kommt hin. Wer vom Bullseye aus 225 fliegt, landet auf
der anderen Seite.

Auf der Karte heißt das: Den Strahl am Bullseye anlegen, nicht am eigenen Flugzeug.

---

::drill{id=m5-l2-plot-read}

---

::drill{id=m5-l2-at-bullseye}

---

## Alpha Check – wo bin ich?

Mit einem **Alpha Check** fragst du nach deiner eigenen Position. Der AWACS antwortet im
Bullseye-Format: von dort zu dir. Zeigt dein Bullseye-Cursor dasselbe, stimmt deine Navigation. Beim Check-in
(Lektion 1) gehört er fest dazu: „request alpha check bullseye“ – der Wortlaut steht so in der ATP 3-52.4.

::call{id=m5-alpha-check}

Zwei Regeln aus der ATP 3-52.4: Die Position gilt als **korreliert** (deine Anzeige und die Ansage decken sich), **wenn sie innerhalb von 3 NM** liegt. Und
**das Auflösen liegt beim eincheckenden Flugzeug** – passen die Zahlen nicht, klärst du es selbst, nicht der AWACS.

:::warn
Achtung, zwei Lesarten der **Richtung**: Die ATP 1-02.1 beschreibt ALPHA CHECK allgemein als Bitte, Peilung und
Entfernung **vom Flugzeug zu einem beschriebenen Punkt** zu bestätigen. Im Hoggit-Wiki und bei SkyEye ist es deine
**eigene Position vom Bullseye aus** – die beiden Richtungen sind Gegenkurse! Die ATP 3-52.4 erklärt die
Richtung der Zahlen im Beispiel nicht ausdrücklich, spricht in ihrer Prüftabelle aber vom Alpha Check „vom
Bullseye“. Das stützt die zweite Lesart, die auch in Sim-Staffeln üblich ist. Im Zweifel hilft das Briefing. ⚠
:::

Willst du **zum** Bullseye fliegen, nimmst du den **Gegenkurs**: Alpha Check 300/40 heißt, der
Bullseye liegt von dir aus auf 120, 40 Meilen entfernt.

---

::drill{id=m5-l2-alpha-call}

---

::drill{id=m5-l2-where-am-i}

---

::drill{id=m5-l2-to-bulls}

---

::hangar{id=warum-ein-bullseye}

---

## Merke

:::example
**bullseye 045/60 = 60 Meilen vom Bullseye in Richtung 045. Immer VOM Bullseye zur Gruppe.**

Eine Gruppenmeldung: Bullseye – Höhe (thousand) – Track – Identität; „picture“ sagt nur der, der fragt. Alpha
Check nennt deine eigene Position vom Bullseye aus (Toleranz 3 NM). Zum Bullseye fliegst du den Gegenkurs.
:::

:::sim{sim=dcs}
Den Bullseye einer Mission legt der Missionsersteller fest. Er steht im Briefing, und viele Jets
zeigen ihn auf Radar- und Lagedisplay an. Der KI-AWACS bietet im Menü **F7** u. a. „Vector to
bullseye“ – das ist der Kurs **zum** Bullseye, also der Gegenkurs zum Alpha Check. Peilungen im
Brevity-Funk sind missweisend, die Missweisung der DCS-Karten kann deutlich sein.
:::

:::sim{sim=bms}
In Falcon BMS meldet der AWACS Gruppen, die weiter als 25 NM entfernt sind, im Bullseye-Format
(einstellbar), näher dran in BRAA. Einen Menüpunkt „Alpha Check“ nennt das BMS-Handbuch nicht. ⚠
:::
