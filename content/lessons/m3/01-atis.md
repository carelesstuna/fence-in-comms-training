---
id: m3-l1
module: m3
order: 1
title: ATIS – das Wetter vorweg
summary: Was in einer ATIS steckt, wie sie abläuft, wann eine neue Ausgabe kommt und warum du beim Erstanruf den Buchstaben nennst.
minutes: 12
xp: 120
sources:
  - title: "FAA JO 7110.65 – 2-9 Automatic Terminal Information Service Procedures (2-9-1 Buchstabenfolge, 2-9-2 neue Aufnahme und Nachfrage des Lotsen, 2-9-3 Inhalt)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_9.html
  - title: "FAA Aeronautical Information Manual – 4-1-13 ATIS (Inhalt, Aktualisierung, Erstanruf, „have numbers“)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html
  - title: "FAA Aeronautical Information Manual – 2-3-3 Runway Designators"
  - title: "MOOSE Ops.ATIS (DCS-Missionsskript)"
    url: https://flightcontrol-master.github.io/MOOSE_DOCS/Documentation/Ops.ATIS.html
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 13, 31, 128 – ATIS"
  - title: "IVAO Deutschland – Military Phraseology (Community-Dokument: keine ATIS, colour state)"
    url: https://de.ivao.aero/en/special-operations-en/military-aviation/military-phraseology/
  - title: "VATSIM Germany Knowledgebase – Military Procedures, Tower (Community-Dokument: Farbcodes)"
    url: https://knowledgebase.vatsim-germany.org/books/military-procedures-4ok
  - title: "DCS P-51D Mustang Flight Manual, S. 174–176 – Funkmenü: ATC (Anlassen, Rollen, Start, Inbound)"
---

## Eine Ansage in Endlosschleife

Bevor du Ground rufst, hörst du die :term[ATIS] (Automatic Terminal Information Service). Das ist eine
aufgezeichnete Ansage auf einer eigenen Frequenz, die ständig wiederholt wird. Dahinter sitzt kein Lotse. Sie
enthält alles, was jeder Pilot am Platz wissen muss, und erspart es dem Lotsen, Wind, Bahn und Luftdruck jedem
Piloten einzeln vorzulesen. Die Teile kommen immer in derselben Reihenfolge:

1. **Platz und Kennbuchstabe** – den Buchstaben brauchst du gleich für den Erstanruf
2. **Uhrzeit** der letzten Wetterbeobachtung in Zulu
3. **Wind**, **Sicht**, **Wolken**
4. **Temperatur** und **Taupunkt**
5. **Altimeter** (nach ICAO **QNH**) – der Luftdruck für den Höhenmesser
6. **Aktive Runway** und Besonderheiten
7. Die Bitte: „advise on initial contact you have information …“

Ändert sich das Wetter oder etwas Wichtiges am Platz, wird die ATIS neu aufgenommen und bekommt den **nächsten
Buchstaben** im Alphabet: Alfa, Bravo, Charlie … Was der Buchstabe aussagt und was nicht, steht auf der Seite
[ATIS – die Platzansage und ihr Kennbuchstabe](/wissen/atis-platzansage).

::call{id=m3-atis}

---

::drill{id=m3-l1-atis-letter}

---

## Der Ablauf, Teil für Teil

Was hinter den sieben Teilen steckt, in der Reihenfolge der Ansage (die Beispielwerte sind erfunden, das Format ist
das der US-Flugsicherung):

| Teil | So klingt es | Was dahinter steckt |
|---|---|---|
| Platz und Kennung | „Example Field information Romeo“ | Name des Platzes und der Kennbuchstabe der Ausgabe. Der Buchstabe steht am Anfang **und** am Ende der Ansage, so merkst du, dass du eine Ausgabe komplett gehört hast. |
| Zeit | „one four five five Zulu“ | Uhrzeit der letzten **Wetterbeobachtung** (nicht der Aufnahme), vierstellig in :term[Zulu], also UTC. |
| Wind | „wind three one zero at eight“ | Richtung, **aus der** der Wind kommt, in Grad, und Stärke in Knoten. Bei fast keinem Wind „calm“. |
| Sicht | „visibility one zero“ | In den USA in Meilen (ohne Einheit), in Europa in Kilometern bzw. Metern: „visibility one zero kilometers“. |
| Wolken | „ceiling four thousand five hundred broken“ oder „sky clear“ | Untergrenze der Bewölkung in Fuß über Grund, dazu die Menge (few, scattered, broken, overcast). |
| Temperatur | „temperature one eight, dew point one two“ | Temperatur und Taupunkt in °C. Liegen beide dicht beieinander, droht Nebel. |
| Altimeter | „altimeter three zero zero two“ | 30.02 inHg. Den Punkt sprichst du nicht mit, am Höhenmesser stellst du ihn ein. Nach ICAO heißt der Wert „QNH“ und steht in Hektopascal: „QNH one zero one three“. |
| Bahn | „ILS runway three one approach in use“ | Aktive Landebahn und Anflugverfahren. Eine eigene Startbahn wird nur genannt, wenn sie anders ist. |
| Bitte | „advise on initial contact you have information Romeo“ | Nenne beim ersten Anruf den Buchstaben. |

:::tip
Sicht und Wolken dürfen fehlen, wenn die Wolkenuntergrenze über 5.000 ft und die Sicht über 5 Meilen liegt. Manchmal
sagt die Ansage dann „the weather is better than five thousand and five“. Fehlt ein Teil, ist nicht die ATIS kaputt,
sondern das Wetter gut (FAA AIM = Aeronautical Information Manual, das Handbuch der Piloten, Abs. 4-1-13).
:::

---

::drill{id=m3-l1-match-atis}

---

## Zum Mitlesen: eine ganze ATIS

So klingt eine vollständige Ausgabe im US-Format, ein erfundener Text, damit du die Teile von oben wiederfindest:

> Example Field information Romeo. One four five five Zulu. Wind three one zero at eight. Visibility one zero.
> Ceiling four thousand five hundred broken. Temperature one eight, dew point one two. Altimeter three zero zero two.
> ILS runway three one approach in use. Advise on initial contact you have information Romeo.

Und so sieht die Mitschrift auf dem Kneeboard aus, wenn du sie beim Hören mitschreibst:

| Du schreibst | Das heißt |
|---|---|
| **R** | Ausgabe Romeo |
| **1455Z** | Beobachtung um 14:55 Zulu |
| **310 / 8** | Wind aus 310 Grad mit 8 kt |
| **10 · BKN 4500** | Sicht 10 Meilen, Wolkenuntergrenze 4.500 ft (broken) |
| **18 / 12** | Temperatur und Taupunkt |
| **30.02** | Altimeter |
| **31 ILS** | aktive Bahn 31, ILS-Anflug |

Was du davon wirklich brauchst, steht im nächsten Abschnitt: vor allem **Buchstabe, Bahn, Altimeter und Wind**.

---

## Was du wirklich brauchst

Eine ATIS ist voller Zahlen. Für den Start brauchst du vor allem vier Dinge:

- den **Buchstaben** für den Erstanruf,
- die **aktive Runway**,
- das **Altimeter** (bzw. den QNH) für den Höhenmesser,
- den **Wind** – für den Start und für die Landung, wenn du zurückkommst.

Notier sie auf dem Kneeboard, bevor du Ground rufst. Dann musst du nicht nachfragen.

:::tip
Standardmäßig klingt die ATIS in der App überall nach US-Format: Sicht in Meilen, „altimeter“ in inHg. Mit der
Einstellung „Kartenabhängig“ in den [Einstellungen](/einstellungen/flugprofil) gilt in Georgien und am Golf die ICAO-Form: Sicht in Kilometern
(„visibility one zero kilometers“) und „QNH“ in Hektopascal; in Nevada, auf Guam und in Korea bleibt es beim
US-Format. Wolken und die Bitte am Schluss spricht die App überall im US-Format.
:::

---

::drill{id=m3-l1-atis-form}

---

::hangar{id=runway-nummern}

---

::drill{id=m3-l1-wind-runway}

---

## Der Buchstabe im Kreis: wann kommt eine neue Ausgabe?

Eine ATIS bleibt nicht lange gültig. Eine **neue Ausgabe** mit dem nächsten Buchstaben kommt:

- sobald ein **neuer amtlicher Wetterbericht** vorliegt, in den USA stündlich, dazu bei Sondermeldungen. Das gilt auch,
  wenn sich keiner der Werte geändert hat,
- wenn sich etwas anderes Wichtiges ändert, etwa die aktive Bahn, das Anflugverfahren oder die NOTAMs (Hinweise an Piloten),
- wenn die Bremswirkung auf der Bahn schlechter gemeldet wird als in der laufenden Ausgabe.

Die Buchstaben laufen der Reihe nach von **Alfa bis Zulu** und beginnen dann wieder bei **Alfa**. Auch über Mitternacht
hinweg geht es einfach weiter. Eine Ausgabe hält deshalb selten länger als etwa eine Stunde, bei Sondermeldungen oder
einem Bahnwechsel deutlich kürzer. Die Zeit in der ATIS ist dein Anhaltspunkt: Ist sie schon eine Stunde alt, kommt
bald eine neue.

:::warn
**Der Buchstabe sagt nur: „Das ist diese Ausgabe.“** Er sagt nichts über das Wetter und nichts über die Bahn. Ein
spätes Alphabet-Wort heißt nicht schlechteres Wetter, und „Zulu“ ist nicht „neuer“ als „Alfa“: Nach Zulu kommt wieder
Alfa. Du **vergleichst** deshalb nie nach der Reihenfolge im Alphabet, sondern nur auf **gleich oder nicht gleich**:
Dasselbe wie der Lotse sagt (Ground, Tower oder ATIS) oder etwas anderes?
:::

---

::drill{id=m3-l1-letter-says}

---

::drill{id=m3-l1-new-issue}

---

::drill{id=m3-l1-letter-circle}

---

::drill{id=m3-l1-which-current}

---

## Erstanruf mit ATIS – und was passiert, wenn sie sich ändert

Mit dem Buchstaben im Erstanruf sagst du Ground: „Ich bin auf dem Stand von Ausgabe X.“ Üblich ist
„information Kilo“, in den USA hört man oft kürzer „with Kilo“. Ist die Ausgabe inzwischen veraltet,
sagt Ground dir das – meist mit dem wichtigsten neuen Wert:

::call{id=m3-atis-update}

---

::drill{id=m3-l1-build-initial}

---

::drill{id=m3-l1-update}

---

## Merke

:::example
**ATIS vor dem Erstanruf hören.** Buchstabe, Runway, Altimeter (bzw. QNH) und Wind aufs Kneeboard.
Beim Erstanruf „information X“ nennen. Der Buchstabe sagt nur „diese Ausgabe“, vergleichen kannst du ihn nur auf gleich
oder ungleich. Neue ATIS heißt: neue Werte übernehmen, Luftdruck zurücklesen.
:::

:::layer{layer=community}
An manchen Militärplätzen gibt es **keine ATIS** – laut IVAO Deutschland etwa an deutschen Fliegerhorsten.
USAF-Plätze haben dagegen eine, und in Falcon BMS hat jeder Platz in Korea eine. Ohne ATIS nennt der Lotse
Luftdruck, Bahn und einen **Farbcode** für das Platzwetter mit der Rollfreigabe, etwa „colour state BLU“.
Die Stufen reichen von Blau (beste Sicht, höchste Wolken) über Weiß, Grün, Gelb und Bernstein bis Rot. Der
Farbcode ist ein militärisches Verfahren der NATO-Luftwaffen, nicht bloß Staffelpraxis; beschrieben ist er
hier nach Community-Unterlagen (IVAO Deutschland, VATSIM Germany) und dem BMS-Handbuch – eine
NATO-Primärquelle liegt der App nicht vor.
:::

:::sim{sim=dcs}
DCS selbst hat keine ATIS mit wechselnden Buchstaben. Viele Multiplayer-Missionen bauen sie über das
MOOSE-Skript **Ops.ATIS** (MOOSE ist eine Sammlung von Missionsskripten für DCS) nach, oft per Sprachausgabe über SRS auf einer eigenen Frequenz. Schau ins
Missionsbriefing, ob es eine ATIS-Frequenz gibt.
:::

:::sim{sim=bms}
In Falcon BMS sendet die ATIS auf **VHF** (Preset 2 für den Startplatz, 7 für den Zielplatz, 10 für
den Ausweichplatz). Die Reihenfolge: Platz, Kennbuchstabe, aktive Bahn, Wind, Sicht und Wolken im
**Klartext**, Temperatur, Höhenmesser. Den Farbcode (blue bis red, „black“ = Platz geschlossen) spricht
sie nur, wenn er in der BMS-Konfiguration eingeschaltet ist (`set g_bUseATISColorCode 1`). Einen Taupunkt
nennt die BMS-ATIS nicht, und an Plätzen mit Parallelbahnen sagt sie nicht, ob links oder rechts gemeint
ist (Comms & Nav Book, S. 13–14).
:::

:::era{era=ww2}
Mit einem Weltkriegsmuster entfällt die ATIS meist: IL-2 hat keine, und in DCS-Weltkriegsmissionen gibt es
sie nur, wenn die Mission sie per Skript einbaut (siehe oben). Wetter, Startrichtung und Luftdruck stehen im
Missionsbriefing. In der DCS-P-51D nennt der Tower auf „Inbound“ Kurs zum Platz, den QFE und die Bahn
(P-51D-Handbuch, S. 175).
:::
