---
id: m1-l3
module: m1
order: 3
title: Zahlen im Funk
summary: Ziffer für Ziffer – Kurse, Höhen, Frequenzen, Luftdruck, Treibstoff und Zeit.
minutes: 9
xp: 80
sources:
  - title: "ICAO Annex 10, Volume II, Kapitel 5 – Übermittlung von Zahlen"
  - title: "FAA Order JO 7110.65 – 2-4-17 Numbers Usage"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_4.html
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (ANGELS über dem Meer, CHERUBS über Grund)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 22 – Bullseye „two-two-five thirty“, Höhen als ganze Zahl"
  - title: "FAA Pilot's Handbook of Aeronautical Knowledge – Kapitel Flight Instruments (Höhenmesser)"
    url: https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak
---

## Jede Ziffer einzeln

Die wichtigste Regel für Zahlen im Funk: **Ziffer für Ziffer.** Aus 250 wird „two five zero“, nicht
„two hundred fifty“ und nicht „two fifty“.

Das klingt umständlich, ist aber robust: Wenn im Rauschen eine Silbe verloren geht, fehlt eine Ziffer –
und das fällt auf. Bei „fifty“ gegen „fifteen“ fällt es nicht auf.

| Ziffer | US-Militär | streng ICAO/NATO |
|---|---|---|
| 0 | zero | zero |
| 1 | one | wun |
| 2 | two | too |
| 3 | three | **tree** |
| 4 | four | fower |
| 5 | five | **fife** |
| 6 | six | six |
| 7 | seven | seven |
| 8 | eight | ait |
| 9 | **niner** | **niner** |

„niner“ hörst du überall, es unterscheidet sich klar von „five“. „tree“ und „fife“ gehören zur strengen
:term[ICAO]/NATO-Aussprache und werden im US-Militär oft weggelassen. Beides ist richtig. „wun“, „too“ und „ait“
sind nur Lesehilfen für die Aussprache. Hörbar anders klingen vor allem tree, fower, fife und niner.

**Hinweis zur App:** Alle Beispiele und Texte sprechen die US-Form: three, five, niner. In deinen
Antworten ist die strenge ICAO-Form (tree, fife) genauso erlaubt. Wessen Regeln dahinterstehen, erklärt die Seite
[Wessen Regeln?](/wissen/regelwerke-icao-faa-atp).

Der **:term[Steuerkurs]** (heading) ist die Richtung, in die die Nase deines Flugzeugs zeigt. Im Folgenden heißt
er kurz „Kurs“. Kurse sind immer dreistellig: 090 ist „heading zero niner zero“. Norden ist **360**, nie 000. Eine
Übersicht aller Zahlenarten steht auf der Seite [Zahlen im Funk](/wissen/zahlen-im-funk).

:::warn
„oh“ statt „zero“ ist Alltags-Englisch. Im Funk heißt die Null immer „zero“.
:::

---

::drill{id=m1-l3-heading-spoken}

---

::drill{id=m1-l3-input-heading}

---

## Höhen: bei ATC und taktisch

**Bei :term[ATC]** (Air Traffic Control, der Flugsicherung: Tower, Approach, Departure) nennt man Höhen in Fuß. Die
Tausender kommen Ziffer für Ziffer, dann das Wort „thousand“. Hunderter folgen als „hundred“.

- 15.000 ft → „one five thousand“
- 8.500 ft → „eight thousand five hundred“

Weiter oben wechselt ATC auf **Flight Levels**. Die Grenze heißt **:term[Übergangshöhe]**. Darüber stellen alle den
Höhenmesser auf denselben Standard-Luftdruck. So haben alle Flugzeuge denselben Bezug. In den USA liegt die Grenze
bei 18.000 ft, in Europa meist viel tiefer (in Deutschland oft bei 5.000 ft).

**Taktisch**, also beim :term[AWACS] (der fliegenden Radar-Leitstelle) und im eigenen Flight, spricht man in
**angels**: Tausend Fuß über dem Meer. „angels two five“ heißt 25.000 ft. Das „thousand“ steckt schon im Wort.

::call{id=m1-awacs-checkin-angels}

**Wer sagt was?** Die Höhenwörter hängen davon ab, wer spricht:

| Wer | Wie er Höhen nennt | Beispiel |
|---|---|---|
| **ATC** (Tower, Approach, Center) | Fuß mit „thousand“ und „hundred“. Oberhalb der Übergangshöhe gilt **Flight Level**: Der Höhenmesser steht dann auf Standard-Luftdruck (1013 hPa bzw. 29.92 inHg). | „flight level two five zero“ = 25.000 ft |
| **Taktisch** (AWACS, eigener Flight) | **angels** = Tausend Fuß über dem Meer, **cherubs** = Hundert Fuß über Grund | „angels two five“ = 25.000 ft, „cherubs five“ = 500 ft über Grund |

:::tip
„cherubs“ ist ein :term[Brevity]-Wort, also ein eindeutiges Kurzwort für den taktischen Funk (ATP 1-02.1). Es
gehört zu „angels“, nicht zum ATC. Du brauchst es nur bei sehr niedrigen Höhen. Achte auf den Bezug: angels zählt
ab Meereshöhe, cherubs ab dem Boden unter dir. Flight Levels dagegen gehören zum ATC: Wer taktisch funkt, sagt
„angels“.
:::

Was ATC und AWACS unterscheidet, steht auf der Seite [ATC oder AWACS?](/wissen/atc-oder-awacs). Was Tower,
Approach und Center tun, steht auf der Seite [Die ATC-Stellen](/wissen/atc-stellen).

---

::drill{id=m1-l3-input-angels}

---

::drill{id=m1-l3-build-angels}

---

::drill{id=m1-l3-match-height-words}

---

::hangar{id=angels-und-buster}

---

## Frequenzen

Auch Frequenzen kommen Ziffer für Ziffer. Für den Punkt gibt es zwei Wörter:

- **„point“**: US-Militär und FAA (Federal Aviation Administration, die US-Flugsicherung)
- **„decimal“**: ICAO und die meisten europäischen Stellen

260.0 ist also „two six zero point zero“ oder „two six zero decimal zero“. Militärische Flugzeuge funken
meist auf :term[UHF] (Ultra High Frequency, 225 bis 400 MHz), die zivile Luftfahrt auf :term[VHF] (Very High
Frequency, 118 bis 137 MHz). Mehr dazu in Modul 2
und auf der Seite [Frequenzbänder, Modulation und Reichweite](/wissen/frequenzbaender-und-reichweite).

::call{id=m1-frequency-change}

---

::drill{id=m1-l3-input-frequency}

---

## Luftdruck, Treibstoff, Zeit

**Höhenmesser-Einstellung (altimeter):** In den USA in Zoll Quecksilbersäule (inHg), vier Ziffern ohne
den Punkt: 29.92 → „altimeter two niner niner two“. In Europa nennt man den Luftdruck in Hektopascal:
1013 → „QNH one zero one three“. **:term[QNH]** ist der auf Meereshöhe umgerechnete Luftdruck: Am Höhenmesser
eingestellt, zeigt er die Höhe über dem Meer. Oberhalb der **:term[Übergangshöhe]** stellst du stattdessen den
Standarddruck 1013 hPa ein und fliegst Flight Levels. Mehr zu Höhenwörtern und Luftdruck steht auf der Seite
[Höhen und Höhenmesser](/wissen/hoehen-und-hoehenmesser).

**Welche Form gilt?** Standardmäßig spricht der Lotse in der App überall die US-Form (FAA): „altimeter two niner
niner two“ und „descend and maintain …“. So funkt man in den meisten Sim-Staffeln, auch auf Karten außerhalb der USA.
Mit der Einstellung „Kartenabhängig“ in den [Einstellungen](/einstellungen/flugprofil) richtet sich die App nach dem gewürfelten Platz: In Nevada,
auf Guam und in Korea bleibt es bei der US-Form, in Georgien und am Golf gilt die ICAO-Form: „QNH one zero one three“
und „descend to …“. Liest du die andere Form zurück, zählt das noch, aber nicht voll. Welche Form gerade gilt, sagt
die Beschreibung des Funkspruchs unten.

**Treibstoff (state):** in **Tausend Pfund** mit einer Nachkommastelle. „state five point eight“ heißt
5.800 lbs. Wie man im Verband den Treibstoff abfragt, kommt in Modul 4.

**Zeit:** vierstellig in der Weltzeit UTC, die mit dem Buchstaben Z gekennzeichnet wird – „Zulu“.
14:30 UTC → „one four three zero :term[Zulu]“.

::call{id=m1-approach-numbers}

:::sim{sim=dcs}
Russische bzw. sowjetische Flugzeuge in DCS (z. B. MiG-29, Su-27) zeigen Höhen in **Metern** und
nutzen oft QFE: Der Höhenmesser zeigt am Boden 0. Westliche Muster nutzen Fuß und QNH bzw. inHg. Im
gemischten Multiplayer lohnt ein Satz im Briefing, welches System gilt.
:::

---

::drill{id=m1-l3-match-kinds}

---

::drill{id=m1-l3-spoken-to-number}

---

## Merke

:::example
**Ziffer für Ziffer.** Kurse dreistellig (Norden = 360). Höhen bei ATC: „one five thousand“,
taktisch: „angels one five“. Frequenzen mit „point“ oder „decimal“. Altimeter vierstellig ohne Punkt.
Treibstoff in Tausend Pfund. Zeit vierstellig in Zulu.
:::

:::tip
**Ausnahmen, die dir später begegnen**

- **Lagebild vom AWACS:** Der AWACS spricht Entfernungen und Höhen als ganze Zahl. „bullseye 225/30“ heißt
  „two-two-five thirty“, eine Höhe „thirty-nine thousand“ (ATP 3-52.4). Mehr dazu in Modul 5, Lektion 2.
- **Höhen bei der FAA:** Ein Lotse darf eine Höhe zur Verdeutlichung zusätzlich als ganze Zahl wiederholen, etwa
  „one zero thousand“ und dann „ten thousand“ (FAA JO 7110.65, 2-4-17). Du selbst sprichst Ziffer für Ziffer.
:::
