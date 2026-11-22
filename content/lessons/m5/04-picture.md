---
id: m5-l4
module: m5
order: 4
title: Picture – das Lagebild
summary: Erst die Gesamtzahl und je Gruppe Position, Höhe, Track, Identität – Labels wie azimuth oder vic sind der zweite Schritt.
minutes: 14
xp: 90
sources:
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 21–46 (Core Information, Gruppen, Labels, Verankern, Track im Picture S. 23 und 32–33, New Picture, Additional/Pop-up/Threat Group), S. 63–65 (Faded, Vanished)"
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – Picture: ältere Bestätigung, ein Lagebild wird nie erzwungen"
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – PICTURE, GROUP, SINGLE, HEAVY, AZIMUTH, RANGE, WALL, LADDER, VIC, CHAMPAGNE"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (PICTURE, GROUP, NEW PICTURE)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 47–48 – Picture"
  - title: "Wikipedia: Boeing E-3 Sentry"
    url: https://en.wikipedia.org/wiki/Boeing_E-3_Sentry
---

## Erst die Zahl, dann je Gruppe der Kern

Ein **Picture** ist das ganze Lagebild auf einmal. Du fragst mit „picture“ danach – die Antwort beginnt mit dem
Rufzeichen des AWACS, ohne Adressat (das Picture gilt allen) und **ohne das Wort „picture“**.

Die ATP 3-52.4 kennt vier Formen des Lagebilds. Die Grundform heißt **Core Information**; sie gilt vor dem
„commit“ und bei höchstens drei Gruppen, wenn kein Label passt:

1. **Gesamtzahl** der Gruppen
2. je Gruppe die **Position** (Bullseye)
3. die **Höhe** in thousand
4. der **Track** (Himmelsrichtung)
5. die **Identität** (hostile, :term[bandit] – als Feind erkannt, aber ohne Angriffsfreigabe –, bogey …), dazu Zusätze wie „heavy“

::call{id=m5-picture-core}

Eine **GROUP** sind Kontakte, die höchstens **3 Meilen** auseinander liegen – in Azimut **und** Entfernung. Sind
es drei oder mehr Flugzeuge, ist die Gruppe **heavy**. Ab **vier Gruppen** nennt der AWACS die Gesamtzahl und
beschreibt nur die **drei wichtigsten**.

:::example
Die Höhe spricht der AWACS als ganze Zahl: „thirty-nine thousand“. Mit dem Bullseye **verankert** er (nennt also die Bullseye-Position) die
wichtigste Gruppe zuerst und jede Gruppe, die mehr als 10 NM daneben liegt. Eine Gruppe dicht dahinter nennt er
– sobald es ein Label gibt – nur über Name, Höhe und Identität (gleich mehr dazu). Freunde und Neutrale kommen
nicht ins Picture und zählen nicht mit – sie bekommen eine eigene Meldung.
:::

---

::drill{id=m5-l4-call-picture}

---

::drill{id=m5-l4-core-order}

---

::drill{id=m5-l4-plot-g1 repeat=2}

---

::drill{id=m5-l4-four-plus}

---

## Labels – der zweite Schritt

Ein Lagebild wird nie erzwungen: Man kann den ganzen Einsatz mit Core Information fliegen. **Labels** sind ein
Hilfsmittel, wenn sie etwas bringen. Der AWACS nutzt sie, wenn

- die **Commit-Kriterien** erfüllt sind und
- die **Formation** der Gegner erkennbar ist.

Dann beschreibt das Label die Anordnung **aus Sicht der Jäger**, entlang der Bedrohungsachse (der Richtung, aus der die Bedrohung kommt):

| Label | Gruppen | Anordnung | Maß | Namen |
|---|---|---|---|---|
| **azimuth** | 2 | nebeneinander | Zahl (Meilen) | north / south (bzw. east / west) |
| **range** | 2 | hintereinander | Zahl (Meilen) | lead / trail |
| **wall** | 3 | nebeneinander | wide | north (west) / middle / south (east) |
| **ladder** | 3 | hintereinander | deep | lead / middle / trail |
| **vic** | 3 | eine vorn, zwei dahinter | erst deep, dann wide | lead / north trail / south trail |
| **champagne** | 3 | zwei vorn, eine dahinter | erst wide, dann deep | north lead / south lead / trail |

Bei **drei oder mehr** Gruppen heißen die Maße **wide** (Breite) und **deep** (Tiefe): „three groups vic 15 deep,
10 wide“. Die **5-NM-Regel** entscheidet über das Label: Bis 5 NM Tiefe ergibt drei Gruppen eine **wall**, darüber
**champagne** oder **vic**. Ob zwei Gruppen **azimuth** oder **range** sind, hängt davon ab, ob die Verbindungslinie
breiter als tief ist (ATP 3-52.4: 45-Grad-Linie von der nächsten Gruppe).

Die Gruppennamen folgen aus dem Label. So kann später jeder knapp sagen, welche Gruppe er meint: „north
group“, „trail group“.

**Der Track im Picture mit Label** (ATP 3-52.4) steht nicht automatisch bei jeder Gruppe:

- Kommen **alle Gruppen heiß** auf die Jäger zu, entfällt er ganz – „hot“ wird angenommen.
- Fliegen **alle in dieselbe andere Richtung**, nennt der AWACS sie **einmal** direkt hinter Label und Maß: „two
  groups range 10, track east“ – und bei keiner Gruppe einzeln.
- Nur bei **verschiedenen Richtungen** bekommt jede Gruppe ihren eigenen Track, auch eine Gruppe ohne Bullseye
  („trail group twenty thousand, track west, hostile“).

Im Core-Format ohne Label und bei einer einzelnen Gruppe steht der Track dagegen immer bei der Gruppe. Weitere Zusätze
(opening/closing, weighted, echelon) gehören zur später geplanten Spur Luftkampf.

**Wer bekommt den Bullseye?** Mit Label verankert der AWACS nur die Gruppen am **vorderen Rand**: bei range,
ladder und vic die lead group, bei champagne die beiden lead groups, bei azimuth und wall jede Gruppe. Gruppen
dahinter nennt er nur mit **Name, Höhe und Identität**: „trail group twenty thousand, hostile“. Wo sie steht,
sagt dir das Label – „two groups range 10“ heißt: die trail group fliegt 10 Meilen hinter der lead group, von dir
aus gesehen auf derselben Linie.

::call{id=m5-picture-two}

::call{id=m5-picture-three}

:::layer{layer=community}
Wie die Maßzahl gesprochen wird („twelve“ oder „one two“), zeigt die ATP 3-52.4 nur geschrieben. Die App spricht
sie als ganze Zahl, wie die Entfernungen beim Bullseye. ⚠
:::

---

::drill{id=m5-l4-core-or-label}

---

::drill{id=m5-l4-label-match}

---

::drill{id=m5-l4-order}

---

::drill{id=m5-l4-wide-deep}

---

::drill{id=m5-l4-five-nm}

---

::drill{id=m5-l4-plot-g2}

---

::drill{id=m5-l4-heavy}

---

::drill{id=m5-l4-label-form}

---

## Wenn sich das Bild ändert

Ein Picture veraltet schnell. Diese Wörter halten es aktuell:

- **NEW PICTURE** – ein neues Lagebild, das alles vorher Gesagte ersetzt. Der AWACS ruft es, wenn die Jäger
  **heiß** sind (sie drehen auf die erwarteten Gegner zu), nie innerhalb der **:term[Targeting-Reichweite]** (ab dort übernehmen die
  Jäger Gruppen als Ziele; sie steht im Briefing). Wer **kalt** fliegt (von den Gegnern wegdreht), fragt selbst nach dem Picture.
- **ADDITIONAL GROUP** – neu entdeckt, außerhalb der Targeting-Reichweite oder passt nicht zum Label (mit Bullseye
  verankert).
- **POP-UP GROUP** – bisher unbekannt, innerhalb der Targeting-, aber außerhalb der Threat-Reichweite.
- **THREAT GROUP** – bisher unbekannt und erfüllt gleich die Threat-Kriterien; die Meldung geht im BRAA-Format an
  den nächsten Jäger („threat group BRAA …“).

Gibt es mehrere gleiche Gruppen, steht eine Himmelsrichtung oder Zahl davor („first pop-up group“).

---

::drill{id=m5-l4-new-groups}

---

## Verloren und gestrichen: faded

Wird eine Gegnergruppe **30 Sekunden** lang von keinem Sensor aktualisiert, ist sie **FADED**. Fragst du innerhalb
einer Minute nach Picture oder Status, nennt der AWACS „faded last known“ mit letzter Position, Track und Anzahl
der Kontakte. Danach verankert er sie nicht mehr und sagt nur noch, wie viele Kontakte gefadet sind:

::call{id=m5-faded}

Wenn du die Gruppe auf deinem Sensor noch korrelierst, bleibt sie in deiner Verantwortung (:term[monitor] – das
Brevity-Wort, nicht der Frequenzwechsel der Flugsicherung). Für
**Freunde** gilt „faded“ nicht: Dort heißt es **NEGATIVE CONTACT**. **VANISHED** gibt es nur außerhalb bekannter
Blindzonen und bei einer Gruppe, die nach einem erfolgreichen Schuss gestrichen wurde – im Training nach dem
„dead“-Ruf des Trainingsleiters.

---

::drill{id=m5-l4-faded}

---

::drill{id=m5-l4-faded-match}

---

## Höhen: gerundet, mit stack

Höhen werden auf den nächsten Tausender gerundet. „Low“ oder „high“ ersetzen nie die Höhe; fehlt sie, heißt es
„altitude unknown“. **HIGH** ist nur ein Zusatz für Kontakte über 40.000 ft. Liegen Kontakte **einer** Gruppe
10.000 ft oder mehr auseinander, folgt **STACK** mit der höheren Höhe zuerst: „stack thirty-two thousand and eight
thousand“.

---

::drill{id=m5-l4-altitude}

---

::hangar{id=e3-sentry}

---

## Merke

:::example
**Picture: Gesamtzahl, dann je Gruppe Position – Höhe – Track – Identität. Labels (azimuth, range, wall, ladder,
vic, champagne) kommen als zweiter Schritt, wenn commit und Formation es hergeben.**

Das Wort „picture“ sagt nur, wer fragt. GROUP = Kontakte innerhalb 3 Meilen, heavy ab drei Flugzeugen. Ab vier
Gruppen: Gesamtzahl und die drei wichtigsten. Drei Gruppen: wide/deep, 5-NM-Regel. Track mit Label: alle hot – keiner,
gemeinsam – einmal hinter dem Label, verschieden – je Gruppe. Neue Gruppen: additional, pop-up oder threat group.
Faded: 30 Sekunden ohne Sensordaten.
:::

:::sim{sim=bms}
Das Picture in Falcon BMS folgt demselben Gerüst: erst Anzahl und Aufteilung (range oder azimuth), dann
je Gruppe Label, Position, Höhe, Aspekt und Identität.
:::
