---
id: m2-l8
module: m2
order: 8
title: Die Karte in deiner Sim lesen
summary: F10-Karte, BMS-Planungskarte, IL-2-Karte – was sie zeigen, was nicht, und wie sie dir beim Funken helfen.
minutes: 8
xp: 80
sources:
  - title: "DCS World User Manual (liegt DCS bei), S. 40–48, 97–100, 216; DCS F-16C Guide S. 21; Heatblur F-4E S. 779 f."
  - title: "DCS World: Scripts\\UI\\F10View\\AirdromeDataNew.lua, Mods\\terrains\\<Karte>\\Radio.lua und Beacons.lua (im DCS-Ordner)"
  - title: "Falcon BMS 4.38 User Manual S. 150–156; Training Manual S. 66–68; Comms & Nav Book S. 102 – Missweisung seit 4.38 (liegt BMS bei, im Installationsordner unter Docs)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (BULLSEYE)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "IL-2 Korea Dev Blog #52 – Settings and Navigational Map"
    url: https://media.il2-korea.com/news/dd_52
---

## Drei Fragen an die Karte

Die Karte in deiner Sim beantwortet drei Fragen, die du zum Funken brauchst:

1. **Wo bin ich?** – für jede Positionsmeldung
2. **Wohin muss ich?** – Kurs und Entfernung zum Ziel oder zum Platz
3. **Wo ist der andere?** – ein Kontakt, ein Tanker, der eigene Flight

Was sie **meist nicht** beantwortet: **Mit wem funke ich auf welcher Frequenz?** Dafür bleiben
Briefing, Comm Card und Platzkarten deine Hauptquelle. Nur DCS zeigt Platzfrequenzen direkt
an der Karte, und in BMS verrät dir die Karte immerhin die Frequenzen der anderen eigenen Flights.

---

## Was alle Karten gemeinsam haben

- **Nord ist oben**, Entfernungen in **Seemeilen** (NM). IL-2 rechnet in Kilometern und Planquadraten.
- **Farben:** In DCS und BMS sind Freunde blau und Gegner rot.
- **Ein Lineal oder Messwerkzeug:** Damit misst du Kurs und Entfernung zwischen zwei Punkten.
- **Koordinaten:** Lat/Long (Breite und Länge) oder MGRS (Military Grid Reference System, ein Planquadrat-Raster) in modernen Sims, Planquadrate in IL-2.
- **Der Bullseye** (DCS, BMS): ein gemeinsamer Bezugspunkt aus dem Briefing. Positionen im Funk gibt man als
  Peilung und Entfernung **vom Bullseye aus** an. Das ist so wichtig, dass ihm die nächste Lektion ganz gehört
  (Modul 2, Lektion 9).

:::warn
**Zwei Norden.** Planungskarten sind nach **geografisch** (rechtweisend) Nord ausgerichtet, und ihre
Lineale messen in der Regel ebenso ⚠ – die Handbücher von DCS und BMS sagen dazu nichts, prüf es
einmal an einer Bahn (siehe Hangar-Karte). Kompass, Bahnnummern und alle Kurse und Peilungen im Funk sind dagegen
**magnetisch**. Die Differenz ist die :term[Missweisung]. Einen Kurs, den du auf der Karte misst, musst du also
umrechnen, bevor du ihn nach Kompass fliegst oder in den Funk gibst – wie das geht, zeigt die nächste Lektion.
:::

---

::drill{id=m2-l8-match-basics}

---

::hangar{id=missweisung}

---

## Deine Sim

:::sim{sim=dcs}
**DCS – die F10-Karte**
- **F10** öffnet sie. Oben stehen die Koordinate unter dem Mauszeiger, die Geländehöhe und die Zeit.
  Mit „Player Center“ springst du zu deinem Flugzeug, mit `LAlt+Y` wechselst du das Koordinatenformat
  (Lat/Long, MGRS).
- **Anzeigemodus:** Map Only, My A/C, Fog of War, Allies Only oder All. Die Mission kann einen Modus
  erzwingen – auf realistischen Servern siehst du oft weder Feinde noch dich selbst.
- **Farben:** Blau und Rot nach Koalition, dein Flugzeug weiß, die Auswahl gelb. Zuschaltbar sind
  Beschriftungen, Erfassungs- und Bedrohungszonen.
- **Klick auf eine Einheit:** Typ, Rufzeichen, Höhe, Geschwindigkeit, Kurs. **Klick auf den Namen
  eines Flugplatzes:** öffnet das Fenster „Airdrome Data“ mit Frequenzen und Funkfeuern (nächste Seite).
- **Lineal** (Distance Tool): Linksklick und ziehen – Länge und Kurs („HDG“) stehen in der Leiste.
- **Marker:** Mit „Add a mark“ setzt du Markierungen, die Mitspieler sehen können. In F-4E und F-14
  übernimmt Jester Marker als Wegpunkt.
:::

:::sim{sim=bms}
**BMS – die Planungskarte**
- **Linien:** Deine Route ist weiß, andere schwarz. Eine rote Route heißt: Problem mit Sprit, Zeit
  oder Steerpoints (den Wegpunkten der Route).
- **Flugzeuge** siehst du nur, wenn sie entdeckt sind. Fährst du mit der Maus über einen **feindlichen**
  Flug, zeigt der Tooltip seine Position als **Bullseye-Peilung und -Entfernung**. Bei **eigenen**
  Flights zeigt er **UHF und VHF**.
- **Ruler:** 20 NM lang, die Länge steht in der Mitte, die Peilungen an den Enden. „Doghouses“ an der
  Route zeigen Kurs und Distanz zwischen den Steerpoints.
- **Missweisung:** BMS modelliert sie. Ob Ruler und Tooltip rechtweisend oder magnetisch
  rechnen, steht nicht im Handbuch ⚠ – vergleich einmal einen Ruler-Wert mit dem HSD im Cockpit.
- **Bedrohungen und Linien:** Statt der alten Threat Circles lieber PPTs und Linien eintragen – sie
  erscheinen nach dem DTC-Laden auf deinem HSD.
- **Flugplätze:** Frequenzen und TACAN zeigt die UI-Karte bewusst nicht. Die stehen auf den Charts und
  im Briefing.
:::

:::sim{sim=il2}
**IL-2**
- **Great Battles:** Die Karte (`M`) ist in **10-km-Planquadrate** mit Nummern eingeteilt. Ob dein
  Flugzeug darauf erscheint, hängt von der Realismus-Einstellung „Navigationsmarker“ ab – viele Server
  schalten ihn ab. Dann navigierst du mit Kompass, Uhr und Landmarken.
- **IL-2 Korea:** eine neue Karte mit Höhendaten, dazu **Lineal, Winkelmesser und Marker**. Im
  Multiplayer kann jeder Spieler bis zu vier Marker setzen, die das Team sieht.
:::

---

## Frequenzen an der Karte

Zeigt deine Sim Frequenzen an der Karte, sind das ihre **Standardwerte**. Legt die Mission eigene
Frequenzen fest, gelten die aus Briefing und Kneeboard. Am meisten Zahlen auf einmal liefert DCS:

:::sim{sim=dcs}
**Das Flugplatzfenster („Airdrome Data“)** – ein Klick auf den Namen eines Flugplatzes in der
F10-Karte:

| Zeile | Was es ist | Brauchst du es? |
|---|---|---|
| **ATC (MHz, AM)** | **Eine** Lotsenstelle – Ground, Tower und Approach zusammen – auf bis zu **vier Bändern**: Kurzwelle (um 4 MHz), tiefes VHF (um 40 MHz), VHF (118 bis rund 143 MHz, teils oberhalb des zivilen Flugfunkbands, das bei 137 MHz endet) und UHF (225–400 MHz). Alle in AM. | Ja – nimm die Frequenz, die **dein** Funkgerät kann: UHF oder VHF-AM. |
| **TACAN** | Kanal und Kennung, z. B. 44X „KTS“ | Ja, für Peilung und Entfernung zum Platz |
| **VOR** | zivile Funknavigation, Frequenz und Kennung | Selten |
| **RWYs** | die beiden Richtungen einer Bahn, z. B. 07 und 25 | Ja |
| **ILS** | Instrumentenlandesystem, je Bahnrichtung eine Spalte (Frequenz, Kennung) | Ja, für den Instrumentenanflug |
| **OUTER NDB / INNER NDB** | zwei Funkfeuer vor der Bahn (in kHz), je Bahnrichtung – für den Funkkompass (ADF) | Für ältere und östliche Muster |
| **RSBN / PRMG** | russische Navigations- und Landesysteme, nur als Kanalnummer | Nur in russischen Mustern (MiG-29, Su-27 …) |
| **ICAO, ELEVATION, RWY Length, COORDINATES** | Kennung, Platzhöhe, Bahnlänge, Koordinaten | Für die Planung |

**Die vier ATC-Frequenzen sind keine vier Stellen.** Es ist derselbe Lotse, nur auf verschiedenen
Bändern, damit ihn jedes Flugzeug erreichen kann. Ein Beispiel aus den DCS-Daten: Batumi hat 4,25 –
40,4 – 131,0 – 260,0 MHz. Eine F-16 ruft auf 260,0 (COM1, UHF) oder 131,0 (COM2, VHF), eine F-4E nur
auf 260,0. Die 4,25 und die 40,4 sind für Flugzeuge mit Kurzwellen- oder tiefem VHF-Funk – für
westliche Jets uninteressant.

Die beiden Spalten bei ILS und NDB gehören zu den beiden Bahnrichtungen. Steht nur in einer Spalte
etwas, hat nur diese Richtung ein ILS. Was :term[TACAN], ILS, VOR und NDB leisten, steht auf der Seite
[Navigationshilfen](/wissen/navigationshilfen).
:::

---

::drill{id=m2-l8-dcs-atc-pick}

---

::drill{id=m2-l8-dcs-mode}

---

::drill{id=m2-l8-bms-tooltip}

---

::drill{id=m2-l8-il2-position}

---

## Merke

:::example
**Die Karte sagt dir, wo du bist, wohin du musst und wo die anderen sind** – meist aber nicht, auf
welcher Frequenz. Nord oben, Entfernungen in NM. Die Karte misst rechtweisend, Kompass und Funk sind
magnetisch – dazwischen liegt die Missweisung.
:::
