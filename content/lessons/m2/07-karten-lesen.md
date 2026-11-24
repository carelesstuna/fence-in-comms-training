---
id: m2-l7
module: m2
order: 7
title: Platz- und Anflugkarten lesen
summary: Wo auf einer Flugplatzkarte und einer Anflugkarte die Frequenzen stehen – und was der Rest bedeutet.
minutes: 8
xp: 90
sources:
  - title: "FAA Aeronautical Chart Users' Guide, 9 Jul 2026 – Terminal Procedures Publication (S. 100–103, 122–123)"
    url: https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/
  - title: "Falcon BMS 4.38 Comms & Nav Book (liegt BMS bei, im Installationsordner unter Docs), S. 99–121 – Karten lesen"
  - title: "DCS World, Kneeboard-Karten der Terrains Caucasus, Nevada, Kola, Syria (im DCS-Ordner Mods\\terrains)"
---

## Zwei Karten, die du immer brauchst

Für jeden Flugplatz gibt es zwei Kartenarten, die dir beim Funken helfen:

- Die **Platzkarte** (Airport Diagram): der Flugplatz von oben. Sie ist für die **Bewegungen am
  Boden** gemacht: Bahnen, Rollwege, Parkplätze. Ganz oben steht ein **Funkblock** mit den
  Platzfrequenzen.
- Die **Anflugkarte** (Approach Plate): ein Instrumentenanflug auf eine bestimmte Bahn, also ein Anflug nach
  Instrumenten, auch ohne Sicht zur Bahn. Im Kopf
  stehen die **Frequenzen in der Reihenfolge, in der du sie brauchst**.

Militärische und zivile Karten sehen sich sehr ähnlich: Die US-Streitkräfte nutzen dasselbe
Grundformat wie die FAA. Was du hier lernst, gilt in DCS und BMS gleichermaßen.

---

## Die Platzkarte

Was auf einer Platzkarte steht:

- **Funkblock:** ATIS, Ground (GND CON), Tower, oft :term[Clearance Delivery] (CLNC DEL), an Militärplätzen
  auch :term[Base Ops] (Platzbetrieb des Militärplatzes) und :term[PMSV] (Wetterberatung). Beim Tower stehen häufig zwei Frequenzen – UHF und VHF.
- **Bahnen** mit Nummer, genauem magnetischem Kurs, Länge und Breite, Höhe der Bahnenden.
- **Rollwege** mit ihren Buchstaben – genau die, die Ground dir in der Rollfreigabe nennt.
- **:term[Fangseile]** (arresting gear) an Militärplätzen, Parkflächen, Tower, Navigationshilfen (:term[TACAN]).
- **Hot Spots**: Kreuzungen, an denen es schon öfter Missverständnisse gab.
- **Platzhöhe** und Missweisung (der Unterschied zwischen magnetischem und rechtweisendem Norden, mehr dazu in Modul 2, Lektion 9).

So sieht das an einem Platz aus deiner Sim aus. Fahr mit der Maus über die blauen Punkte – oder tippe sie an –,
dann erklärt dir die Karte, was dort steht:

::chart{kind=airport annotate}

Mit der Platzkarte auf dem Knie verstehst du eine Rollfreigabe wie „taxi via Alfa, Charlie, hold short
runway …“ auf Anhieb – und brauchst kein :term[progressive taxi] (bei dem Ground dich Abschnitt für Abschnitt führt).

---

::drill{id=m2-l7-airport-form repeat=2}

---

::drill{id=m2-l7-match-abbr}

---

## Die Anflugkarte

Eine Anflugkarte hat vier Teile, von oben nach unten:

1. **Kopf (Briefing Strip)** – drei schmale Streifen:
   - **oben:** Navigationshilfe (z. B. :term[ILS] (Instrumentenlandesystem) mit Frequenz und Kennung oder TACAN-Kanal), Anflugkurs,
     Landestrecke, Aufsetzzonenhöhe (TDZE) und Platzhöhe
   - **Mitte:** Hinweise und der **Fehlanflug** als Text
   - **unten:** die **Frequenzen**, von links nach rechts in der Reihenfolge des Anflugs: ATIS →
     Approach → **Tower** (fett) → Ground → Clearance Delivery
2. **Draufsicht (Plan View):** der Weg von oben – Einflugpunkte (IAF), weitere :term[Fixes] (Wegpunkte),
   Warteschleifen (Muster, in denen du auf die nächste Freigabe wartest), der Fehlanflug gestrichelt und der
   **MSA-Kreis** mit den Mindesthöhen für Notfälle.
3. **Profil:** die Höhen entlang des Anflugs, der Gleitpfad und der **FAF** (Beginn des Endanflugs, als
   Malteserkreuz). Ungefähr dort übergibt Approach an den Tower.
4. **Minima:** die Mindestwerte für den Anflug. Dazu gehören die Entscheidungshöhe (dort entscheidest du,
   ob du weiterfliegst oder durchstartest, je nachdem, ob du die nötigen Sichtmerkmale hast) und die Sicht,
   je Flugzeugkategorie (eingeteilt nach Anfluggeschwindigkeit) – Kampfjets fallen in Kategorie D.

Die Lernkarten in dieser App sind schematisch und kürzer: Der Kopf ist in drei Spalten geteilt, und die
Frequenzen stehen rechts untereinander, in derselben Reihenfolge. Geh die Karte einmal von oben nach unten
durch – jeder blaue Punkt erklärt dir einen Teil mit den Werten genau dieses Anflugs:

::chart{kind=approach annotate}

---

::drill{id=m2-l7-strip-order}

---

::drill{id=m2-l7-tap-tower}

---

::hangar{id=jeppesen-black-book}

---

## Wenn sich Karten widersprechen

Echte Karten und Sims passen nicht immer zusammen. In DCS hat jeder Platz standardmäßig nur **eine**
ATC-Frequenz pro Band, obwohl die echte Karte getrennte Frequenzen für Ground und Tower nennt. In BMS
weichen die echten Anflugkarten im Kartenordner teils von den Frequenzen der BMS-Lotsen ab.

:::example
**Rangfolge der Quellen:** Briefing und Comm Card der Mission → Karte der Sim → echte Karte. Und
immer gilt: Was dir ein Lotse gerade sagt, schlägt alles Gedruckte.
:::

:::sim{sim=dcs}
DCS bringt echte Karten im Kneeboard mit (RShift+K), aber nicht für jede Karte:
- **Caucasus:** Platzkarte, Sichtanflugkarte und teils PAR-Karte je Platz. Unten steht ein
  Frequenzstreifen Tower | Radar | Final | TACAN | ILS.
- **Nevada:** FAA/USAF-Platzkarten und Anflugkarten, z. B. Nellis.
- **Kola:** echte Anflugkarten aus Finnland, Norwegen und Schweden.
- **Syria:** Platzkarten für Akrotiri, Incirlik und Beirut.

Für Persian Gulf, Afghanistan, Iraq, Sinai und Germany Cold War liegen keine Karten bei. Dort hilft
nur das Missionsbriefing – oder Karten aus der Community.
:::

:::sim{sim=bms}
BMS erzeugt für alle Plätze in Korea vier eigene Karten. Sie liegen im BMS-Installationsordner unter
`Docs\03 KTO Charts` (standardmäßig `C:\Falcon BMS 4.38\Docs\03 KTO Charts`):
- **AGC:** Platzkarte mit grünem Funkblock oben rechts, TACAN und Platzhöhe in der Fußzeile
- **APC:** Parkplätze je Bahn
- **LOC:** Umgebungskarte 50 × 50 NM mit MSA-Rose und einer kompletten Frequenztabelle – die beste
  Funkkarte auf einer Seite
- **EOR:** Flächen zum Scharf- und Entschärfen am Bahnende samt Platzfrequenzen

Dazu kommen echte Anflug- und Abflugkarten für Südkorea und Japan. Verlass dich bei Frequenzen auf die
BMS-eigenen Karten und das Briefing.
:::

---

## Merke

:::example
**Platzkarte:** für den Boden – Funkblock oben, Bahnen, Rollwege. **Anflugkarte:** Kopf mit
Navigationshilfe, Fehlanflug und den Frequenzen in Gebrauchsreihenfolge (Tower fett), darunter
Draufsicht, Profil, Minima. **Widerspruch?** Briefing vor Sim-Karte vor echter Karte.
:::
