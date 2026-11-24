---
id: m2-l10
module: m2
order: 9
title: Bullseye – Positionen im Funk
summary: Positionen als Peilung und Entfernung vom gemeinsamen Bezugspunkt angeben und verstehen – und den Linealwert der Karte in die magnetische Peilung für den Funk umrechnen.
minutes: 16
xp: 100
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021) – BULLSEYE, GROUP, POSIT (liegt Falcon BMS bei)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 7 (Alpha Check: 3 NM) und S. 22 (Bullseye-Format: volle Grad und Meilen, „two-two-five thirty“, nie „bull“)"
  - title: "DCS User Manual (liegt DCS bei), S. 374 – Missionseditor: ein Bullseye je Koalition"
  - title: "DCS F-16C Early Access Guide (liegt DCS bei), S. 92 und 355–357 – Bullseye in Grad magnetisch, HUD, HSD, Steerpoint 25, DED-Seite BULL"
  - title: "DCS F/A-18C Early Access Guide (liegt DCS bei), S. 139 (Heading Mode) und S. 158–160 (A/A-Wegpunkt 59 als Bullseye)"
  - title: "Falcon BMS 4.38 Comms & Nav Book (im BMS-Ordner Docs), S. 47–48 (Bullseye und BRAA) und S. 102 (Missweisung)"
  - title: "NOAA: Magnetic declination / World Magnetic Model"
    url: https://www.ncei.noaa.gov/products/world-magnetic-model
---

## Ein Punkt, den alle kennen

Stell dir vor, du hast einen Kontakt auf dem Radar und willst ihn melden. „Kontakt 30 Meilen nördlich von mir“
hilft nur dem, der weiß, wo du gerade bist. Alle anderen müssen erst rechnen – oder nachfragen.

Die Lösung ist der **Bullseye**: ein Punkt, den alle Beteiligten vor dem Flug bekommen. Die Brevity-Vorschrift
ATP 1-02.1 nennt ihn einen festgelegten Bezugspunkt. Von dort aus gibt man die Position von allem an – als
**magnetische Peilung** und **Entfernung in Seemeilen** (NM).

- **Woher du ihn hast:** aus dem Missionsbriefing, oft auch von der Comm Card oder dem Kneeboard. Im Cockpit liegt
  er als Wegpunkt im Navigationssystem.
- **Was man damit angibt:** Kontakte, die eigene Position, Treffpunkte, Tanker- und CAP-Punkte – alles, was
  mehrere Flugzeuge an verschiedenen Orten gleich verstehen sollen.
- **Wer ihn benutzt:** AWACS und Leitstellen für das Lagebild (Modul 5) und Flights untereinander (Modul 4).
  Tower, Ground und Approach nicht – die arbeiten mit Flugplätzen, Funkfeuern und Meldepunkten.

::sketch{kind=bullseye}

---

## „bullseye 045/40“ lesen

Eine Bullseye-Angabe hat immer drei Teile:

| Teil | Bedeutung |
|---|---|
| **bullseye** | der Bezugspunkt aus dem Briefing |
| **045** | Peilung **vom Bullseye zum Objekt**, magnetisch, immer dreistellig (045, nicht 45) |
| **40** | Entfernung vom Bullseye in Seemeilen |

Beides wird auf volle Grad und volle Meilen gerundet. „bullseye 045/40“ heißt also: 40 Meilen vom Bullseye
entfernt, in Richtung 045 – nordöstlich davon. Wo du selbst gerade fliegst, spielt keine Rolle. Darum gilt
dieselbe Meldung für jeden auf der Frequenz.

**Gesprochen** wird die Peilung Ziffer für Ziffer und die Entfernung laut ATP 3-52.4 als ganze Zahl:
„bullseye zero four five, forty“. Ziffernweise („four zero“) versteht dich auch jeder, die App nimmt beides an.

:::warn
**„bull“ sagt man nie.** Die ATP 3-52.4 verbietet die Abkürzung, weil sie sich wie :term[BRAA] anhört – und BRAA
meint etwas anderes: Peilung und Entfernung **von einem bestimmten Flugzeug aus**, nur für dieses Flugzeug
(Modul 5, Lektion 3).
:::

---

::drill{id=m2-l10-plot-place repeat=2}

---

::drill{id=m2-l10-plot-read}

---

## Vom Bullseye weg – nicht zum Bullseye hin

Die Peilung zeigt immer **vom** Bullseye **zum** Objekt. Ein Kontakt bei „bullseye 045“ steht nordöstlich vom
Bullseye. Wer die Zahl andersherum liest, sucht ihn auf der Gegenseite, gut 80 Meilen daneben.

Dasselbe gilt für deine eigene Position. Zeigt dein Navigationssystem „bullseye 300/40“, stehst du 40 Meilen
nordwestlich vom Bullseye. Willst du **zum** Bullseye, fliegst du den **Gegenkurs**: 300 − 180 = 120.

::sketch{kind=from-to}

:::tip
**Gegenkurs im Kopf:** Unter 180 addierst du 180, darüber ziehst du 180 ab. Schneller geht es mit „plus 200,
minus 20“ (045 → 245 → 225) bzw. „minus 200, plus 20“ (300 → 100 → 120).
:::

---

::drill{id=m2-l10-to-bulls}

---

## Zwei Norden

Auf der Karte misst du Richtungen gegen **geografisch Nord** (rechtweisend, englisch *true*). Der Kompass zeigt
nach **magnetisch Nord**. Der Winkel zwischen beiden heißt :term[Missweisung] (englisch *magnetic variation*).
Woher er kommt, erklärt die Hangar-Karte „Zwei Norden“ (Modul 2, Lektion 8).

Für den Funk zählt vor allem eins: **Bullseye-Peilungen sind magnetisch.** So steht es in der ATP 1-02.1 und der
ATP 3-52.4.

| rechtweisend (geografisch Nord) | magnetisch (Kompass) |
|---|---|
| Gitter und Koordinaten der Karte | Kompass, meist auch die Kursanzeige im Cockpit |
| Lineal der Planungskarte – in der Regel ⚠ | Bahnnummern und Kurse von ATC |
| | Bullseye- und BRAA-Peilungen im Funk |

Die Missweisung hat eine Richtung:

- **Ost:** Magnetisch Nord liegt östlich von geografisch Nord. Dieselbe Richtung hat magnetisch eine **kleinere**
  Zahl.
- **West:** Magnetisch Nord liegt westlich. Magnetisch ist die Zahl **größer**.

**Wo du sie findest:** auf jeder Platzkarte, meist beim Nordpfeil (oft mit „VAR“ beschriftet), und auf den
Anflugkarten. Je nach Gegend sind es ein paar Grad bis über zehn Grad. Auf der BMS-Platzkarte von Kunsan stehen
zum Beispiel 7,5° West. Über ein Einsatzgebiet ändert sie sich nur langsam, für den Funk reicht der Wert eines
nahen Flugplatzes.

::sketch{kind=variation}

---

::drill{id=m2-l10-which-magnetic}

---

## Umrechnen: east is least, west is best

Vom Lineal (rechtweisend) zum Funk (magnetisch) in fünf Schritten:

1. **Messen:** Lineal **am Bullseye** anlegen und zum Objekt ziehen. Du hast Peilung und Entfernung.
2. **Nachschlagen:** die Missweisung von der Platzkarte oder aus dem Briefing.
3. **Rechnen:** Ost **abziehen**, West **addieren**. Der englische Merksatz dazu: *east is least, west is best* –
   bei Ost wird die Zahl kleiner, bei West größer.
4. **Umbrechen:** Unter 001 oder über 360 rechnest du ± 360: 003 − 6 = 357, 358 + 8 = 366 → 006.
5. **Entfernung übernehmen:** Die Missweisung dreht nur die Richtung, die Meilen bleiben gleich.

| Lineal (rechtweisend) | Missweisung | im Funk (magnetisch) |
|---|---|---|
| 070°, 35 NM | 6° Ost | bullseye 064/35 |
| 070°, 35 NM | 8° West | bullseye 078/35 |
| 003°, 20 NM | 6° Ost | bullseye 357/20 |
| 358°, 50 NM | 8° West | bullseye 006/50 |

**Der Rückweg:** Hörst du „bullseye 120/35“ und willst den Kontakt auf der Karte finden, drehst du die Regel um –
Ost **addieren**, West **abziehen**. Bei 6° Ost legst du das Lineal also auf 126 und gehst 35 Meilen hinaus.

:::tip
**Plausibel?** Prüf am Ende die Richtung: Bei Missweisung Ost muss die Funkpeilung **kleiner** sein als der
Linealwert, bei West **größer**. Wer falsch herum rechnet, liegt doppelt daneben – bei 6° Ost also 12°.
:::

---

::drill{id=m2-l10-ruler-variation}

---

::drill{id=m2-l10-input-west}

---

## Wie schlimm sind ein paar Grad?

Ein paar Grad klingen nach wenig. Über die Entfernung werden daraus Meilen: Auf **60 NM** macht **1°** etwa
**1 NM** seitlich aus (mehr auf der Hangar-Karte gleich im Anschluss). Vergisst du 6° Missweisung bei einem
Kontakt 50 NM vom Bullseye, meldest du ihn rund 5 NM neben seiner echten Position.

Das ist mehr, als im Luftkampf verziehen wird:

- Eine :term[GROUP] sind laut ATP 1-02.1 Kontakte, die höchstens 3 NM auseinander liegen. Mit 5 NM Fehler sucht
  der andere an der falschen Stelle – oder hält deinen Kontakt für eine zweite Gruppe.
- Beim **Alpha Check** mit dem AWACS gilt deine Position bis 3 NM Abweichung als bestätigt (ATP 3-52.4,
  Modul 5, Lektion 2).

Je weiter ein Objekt vom Bullseye weg ist, desto teurer wird jeder Grad.

---

::drill{id=m2-l10-error-size}

---

::hangar{id=eins-zu-sechzig}

---

## Im Cockpit: die Bullseye-Anzeige

Rechnen musst du vor allem, wenn du **von der Karte** meldest: F10-Karte, BMS-Planungskarte, Kneeboard. Moderne
Jets nehmen dir das ab. Der Bullseye liegt als Wegpunkt im Navigationssystem, und die Anzeigen nennen Peilung und
Entfernung vom Bullseye – zum Cursor und zu dir selbst. Steht die Anzeige auf magnetisch, gibst du die Werte ohne
Umrechnung weiter.

:::aircraft{aircraft=f16}
**F-16C** (laut DCS-Handbuch): Der Bullseye ist normalerweise **Steerpoint 25**, die Mission legt ihn dort an.
Auf der DED-Seite **BULL** (im MISC-Menü) schaltest du die Bullseye-Anzeigen ein. Dann nennen HSD und Radar
Peilung und Entfernung vom Bullseye zum Cursor, unten links auf dem HSD steht deine eigene Position vom Bullseye,
und das HUD zeigt sie ebenfalls – in Grad magnetisch.
:::

:::aircraft{aircraft=fa18}
**F/A-18C** (laut DCS-Handbuch): Die Mission legt den Bullseye als **Wegpunkt 59** an. Im Cockpit machst du ihn
zum A/A-Wegpunkt: auf dem HSI unter **DATA** den Wegpunkt 59 wählen und **A/A WP** drücken. Danach zeigt das
A/A-Radar oben links Peilung und Entfernung vom Bullseye zum Cursor (TDC), unten in der Mitte deine eigene
Position vom Bullseye.

Ob HSI, HUD und Radar magnetisch oder rechtweisend anzeigen, stellst du unter **DATA → A/C** mit **Heading Mode**
ein. Lass ihn für Bullseye-Calls auf **MAG**. Steht er auf TRUE, erscheint ein „T“ bzw. „TRUE“ neben den Kursen –
dann lägen deine Peilungen um die Missweisung daneben.
:::

:::sim{sim=dcs}
**DCS:** Im Missionseditor bekommt jede Koalition genau einen Bullseye. Er steht im Briefing, und die Jets laden
ihn als Wegpunkt. Ob das Lineal der F10-Karte rechtweisend oder magnetisch misst, sagt das Handbuch nicht ⚠ –
prüf es einmal an einer Bahn (Hangar-Karte „Zwei Norden“).
:::

:::sim{sim=bms}
**BMS:** Fährst du auf der Planungskarte mit der Maus über einen feindlichen Flug, zeigt der Tooltip seine
Bullseye-Peilung und -Entfernung. Ob er magnetisch rechnet, steht nicht im Handbuch ⚠ – vergleich ihn einmal mit
dem HSD. Der AWACS meldet Gruppen, die mehr als 25 NM von dir entfernt sind, im Bullseye-Format, näher dran in
BRAA (einstellbar).
:::

:::sim{sim=il2}
**IL-2:** Einen Bullseye gibt es dort nicht. Positionen gibst du über Planquadrate und Landmarken an
(Modul 2, Lektion 8).
:::

---

::drill{id=m2-l10-call-format}

---

## Den Funkspruch sprechen

Die Reihenfolge ist fest: **bullseye – Peilung – Entfernung**. Danach kommt, was der andere sonst noch braucht,
meist die Höhe. So klingt das im eigenen Flight: Der Lead fragt mit :term[POSIT] nach deiner Position (mehr dazu
in Modul 4, Lektion 5), du antwortest mit dem Bullseye.

::call{id=m2-posit-bullseye}

Die typischen Fehler:

| falsch | richtig | warum |
|---|---|---|
| „bullseye 40/045“ | „bullseye 045/40“ | erst die Peilung, dann die Entfernung |
| „bullseye 45/40“ | „bullseye 045/40“ | Peilungen sind immer dreistellig |
| „bull 045/40“ | „bullseye 045/40“ | „bull“ klingt wie BRAA |
| Linealwert direkt gesendet | um die Missweisung korrigiert | im Funk ist alles magnetisch |
| vom Kontakt zum Bullseye gemessen | vom Bullseye zum Kontakt | sonst landet er auf der Gegenseite |

---

::drill{id=m2-l10-call-posit}

---

::drill{id=m2-l10-input-east}

---

## Merke

:::example
**bullseye 045/40 = 40 NM vom Bullseye in Richtung 045, magnetisch.** Immer vom Bullseye zum Objekt, die Peilung
dreistellig zuerst, dann die Entfernung. Zum Bullseye hin fliegst du den Gegenkurs.

**Von der Karte in den Funk:** Der Linealwert ist rechtweisend. Missweisung Ost abziehen, West addieren – *east is
least, west is best*. Die Entfernung bleibt. Die Bullseye-Anzeige im Cockpit ist schon magnetisch, wenn sie
richtig eingestellt ist.
:::
