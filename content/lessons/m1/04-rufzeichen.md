---
id: m1-l4
module: m1
order: 4
title: Rufzeichen und Flights
summary: 1-1 bis 1-4, Lead und Wingman, „Two“ statt Vollname – und wann die Side Number zählt.
minutes: 8
xp: 70
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (2025) – DASH: Position im Flight, wenn das Rufzeichen unbekannt ist"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021) – „FA-18 section lead“ (Navy/USMC: section, division)"
  - title: "DCS Supercarrier Manual – „a section of two aircraft“ (Case II)"
  - title: "UOAF Codex – Communications and Brevity"
    url: https://codex.uoaf.net/index.php/Communications_and_brevity
  - title: "Navy CNATRA P-1211 / LSO NATOPS – Ball Call"
  - title: "Wikipedia: Finger-four"
    url: https://en.wikipedia.org/wiki/Finger-four
---

## Ein Flight, vier Rufzeichen

Militärjets fliegen selten allein. Zwei bis vier Flugzeuge bilden einen **Flight** mit einem
gemeinsamen Namen und einer Nummer. Deiner heißt **{flight}**. Auf Deutsch heißt ein Flight aus zwei Flugzeugen
Rotte, aus vier Schwarm. Mehrere Flights mit demselben Auftrag bilden einen Verband, englisch
:term[Force Package]. Die Staffel (englisch *squadron*) ist etwas anderes: die Einheit am Boden, aus der die Flights
kommen.

Hinter den Flight-Namen hängt jedes Mitglied seine **Position**: seine Nummer innerhalb des Flights, 1 bis 4.
Gemeint ist der Platz in der Formation, nicht der Ort, an dem du gerade fliegst.

| Rufzeichen | Rolle |
|---|---|
| {flightName} {flightNum}-1 | **Flight Lead**: führt den Flight, spricht nach außen (Rotten- bzw. Schwarmführer) |
| {flightName} {flightNum}-2 | **Wingman** des Leads (Rottenflieger) |
| {flightName} {flightNum}-3 | **Element Lead**: führt das zweite Paar, die zweite Rotte |
| {flightName} {flightNum}-4 | Wingman des Element Leads |

Ein Flight aus vier Flugzeugen besteht also aus zwei **Elementen** (Paaren): 1 und 2 sowie 3 und 4.
Die ungeraden Nummern führen, die geraden folgen.

:::tip
**Navy und Marines** sagen es anders: Zwei Flugzeuge sind eine **section** (geführt vom Section Lead), vier eine
**division** (Division Lead). Die USAF sagt element und flight. Die Funkregeln sind dieselben.
:::

Auch hier gilt: **Ziffer für Ziffer.** {flightName} {flightNum}-2 spricht man „{flight|spoken} two“.
Aus 1-1 wird also „one one“, nicht „eleven“.

---

::drill{id=m1-l4-position repeat=2}

---

## Im Flight reicht die Nummer

Innerhalb des eigenen Flights wissen alle, wer gemeint ist. Deshalb antwortet man dort nur mit der
**Positionsnummer**. Das ist das Kürzeste, was es im Funk gibt:

::call{id=m1-flight-check}

Auf der Kneeboard-Karte steht Nummer 2 als **„#2“**, im Briefing heißt sie **„Dash 2“**. Im Funk des eigenen
Flights antwortet sie einfach mit „Two“. „Dash 2“ hörst du im Funk vor allem, wenn jemand das genaue Rufzeichen
nicht kennt, etwa der AWACS (:term[DASH], ATP 1-02.1).

:::warn
„Two“ funktioniert nur im eigenen Flight. Sobald du eine andere Stelle rufst (Tower, :term[AWACS], :term[Tanker] für die Luftbetankung),
brauchst du dein **vollständiges Rufzeichen**. Ein Tower kennt kein „Two“.
:::

---

::drill{id=m1-l4-check-answer}

---

## Der Lead spricht für alle

Gegenüber Ground, Tower oder AWACS spricht normalerweise nur der Lead. Er nutzt sein **eigenes
Rufzeichen** und sagt dazu, wie viele Flugzeuge er dabeihat: „flight of two“, „flight of four“. Die
Wingmen hören mit und schweigen – außer jemand spricht sie direkt an.

::call{id=m1-taxi-request}

---

::drill{id=m1-l2-build-taxi}

---

::drill{id=m1-l4-outside}

---

::hangar{id=schwarm-und-rotte}

---

## Taktisches Rufzeichen, ATC-Rufzeichen, Side Number

Ein Flugzeug kann mehrere „Namen“ haben – je nachdem, mit wem es gerade spricht:

- **Taktisches Rufzeichen:** kommt aus dem Einsatzbefehl (Frag), z. B. {flight}. Damit sprichst du mit
  Flight, AWACS und Tanker.
- **ATC-Rufzeichen:** steht im Flugplan. Oft ist es dasselbe wie das taktische. Wenn nicht, wechselt
  der Flight beim Übergang zwischen ATC und taktischer Phase das Rufzeichen.
- **:term[Side Number] (Modex):** die dreistellige Nummer, die bei der Navy groß auf jedem Flugzeug steht. In
  der Landephase am Flugzeugträger meldet sich jedes Flugzeug **einzeln** mit dieser Nummer. Dann hört der
  :term[LSO] zu (Landing Signal Officer): der Landeoffizier am Heck des Trägers, der dich im Endanflug führt. Sein
  Rufname ist „Paddles“.

::call{id=m1-ball-call}

:::layer{layer=community}
In Sim-Missionen sind taktisches und ATC-Rufzeichen fast immer gleich. Auf öffentlichen Servern steht
dein Rufzeichen meist im Slot-Namen oder im Missionsbriefing. Nimm genau das und nicht deinen
Spielernamen – sonst weiß niemand, welches Flugzeug du bist.
:::

:::sim{sim=dcs}
DCS vergibt westlichen Flugzeugen feste Standardrufzeichen aus einer Liste, z. B. **Enfield,
Springfield, Uzi, Colt, Dodge, Ford, Chevy, Pontiac**. A-10 bekommen eigene (u. a. **Hawg, Boar,
Pig, Tusk**), AWACS etwa **Overlord, Magic, Wizard, Focus, Darkstar**, Tanker **Texaco, Arco,
Shell**. Im Missionseditor lässt sich das pro Gruppe ändern. Flight-Nummer und Position setzt DCS
automatisch.
:::

---

::drill{id=m1-l4-modex}

---

## Merke

:::example
**{flightName} {flightNum}-1 bis -4:** Lead, Wingman, Element Lead, Wingman. Die zweite Zahl ist deine
Position im Flight. Gesprochen Ziffer für Ziffer.

Im eigenen Flight genügt die Nummer („Two“), nach außen immer das volle Rufzeichen. Der Lead spricht
für den Flight („flight of four“). Am Träger zählt in der Landephase die Side Number.
:::
