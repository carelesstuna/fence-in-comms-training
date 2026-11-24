---
id: m5-l1
module: m5
order: 1
title: Anmelden beim AWACS
summary: Missionsnummer, „as fragged“ oder „with exceptions“ – und Informationen vom AWACS bestätigst du nur mit deinem Rufzeichen.
minutes: 12
xp: 80
sources:
  - title: "ATP 3-52.4 / MCRP 3-20F.10 / NTTP 6-02.9 / AFTTP 3-2.8 „Air Control Communication“ (2. Sept. 2021), S. 5–9 (Prioritäten, Rufzeichen, Relay, Check-in)"
  - title: "Hoggit-Wiki: Getting started with GCI/AWACS (Sim-Kurzform des Check-ins)"
    url: https://wiki.hoggitworld.com/view/Gci
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – ANGELS, PIGEONS, HOME PLATE"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 46–48 – AWACS-Rufschema"
  - title: "Wikipedia: Lockheed EC-121 Warning Star"
    url: https://en.wikipedia.org/wiki/Lockheed_EC-121_Warning_Star
  - title: "Tempest's Blue Flash: Serverbriefing (GCI je Seite, EWR)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021) – VECTOR, SCRAMBLE, PANCAKE"
---

## Der AWACS sieht alles – aber nicht, wer du bist

Der **AWACS** (bzw. ein Controller am Boden, der **GCI**) hat das große Lagebild: Freunde, Feinde,
Unbekannte auf hunderte Meilen. Auf seinem Schirm bist du aber zunächst nur ein Echo unter vielen.
Darum meldest du dich an, sobald du in sein Gebiet kommst – als Lead, für den ganzen Flight. Wie er dir sein
Lagebild ansagt, kommt in den nächsten Lektionen: Gruppen (Lektion 2; das sind Kontakte, also einzelne Radarechos,
die höchstens 3 Meilen auseinander liegen), *bogey dope* (Lektion 3, die Anfrage nach der nächsten Gruppe) und
*picture* (Lektion 4, das ganze Lagebild auf einmal). Ein :term[bogey] ist dabei ein Luftkontakt, dessen Identität noch unbekannt ist; ob er Freund oder Feind ist, klärt Lektion 5 (*declare*, die Anfrage nach der Identität).

Die **ATP 3-52.4** („Air Control Communication“, 2021) legt fest, was der **vollständige** Check-in enthält.
Als Merkwort dient **MNPOPCA**:

1. **M**ission number – die Missionsnummer
2. **N**umber and type – Anzahl und Typ der Flugzeuge
3. **P**osition and altitude – Position und Höhe
4. **O**rdnance – Bewaffnung (falls zutreffend)
5. **P**laytime – wie lange du bleiben kannst
6. **C**apabilities – Fähigkeiten, z. B. Laser, Infrarot-Pod, Datalink
7. **A**bort code – der Abbruchcode, ein vorab vereinbartes Codewort, mit dem ein Angriff abgebrochen wird

Das ist die lange Fassung. In der Praxis gilt: Fliegt dein Flight **wie geplant**, kennt der AWACS das meiste
aus dem Einsatzbefehl. Deine Zeile darin, dein :term[Frag], sieht etwa so aus (gewürfelt):

::muster{doc=frag}

Dann meldest du dich mit Missionsnummer und **:term[as fragged]** an und bittest gleich
um einen **Alpha Check** vom Bullseye (siehe Lektion 2):

::call{id=m5-awacs-checkin-fragged}

Die Antwort beginnt mit **„contact“** („ich habe dich“) – nicht mit „radar contact“. Dann folgt der Alpha Check. Das ist das Brevity-Wort CONTACT (Sensorkontakt), nicht der Frequenzwechsel „contact Departure“ aus Modul 3, Lektion 6.

:::tip
Die genaue Form ist Sache von SPINS bzw. Missionsbriefing. Steht dort etwas anderes, gilt das.
:::

:::era{era=ww2,cold-war}
**Ohne AWACS.** Auf Servern mit Weltkriegs- oder Kalter-Krieg-Szenario führt oft kein AWACS, sondern
eine **Leitstelle am Boden** (GCI) mit Frühwarnradaren (EWR) – mal ein Mitspieler, mal ein Bot. Du
meldest dich genauso an, und die Wörter bleiben dieselben: BOGEY DOPE, PICTURE, :term[VECTOR], ANGELS, :term[BUSTER]
stehen alle im heutigen Brevity-Katalog. Der Unterschied liegt im Bild: Ein Radar am Boden sieht nur
bis zum Horizont und tief fliegende Ziele schlecht. Ein CLEAN vom GCI heißt nur, dass er nichts sieht.
In **IL-2 Korea** gibt es Bodenradar-Posten auch in der Sim selbst (siehe Modul 2, Lektion 10).
:::

---

::drill{id=m5-l1-mnpopca}

---

::drill{id=m5-l1-build-checkin}

---

::drill{id=m5-l1-anatomy-intent}

---

::drill{id=m5-l1-call-checkin}

---

## Mit Abweichungen: „with exceptions“

Ist etwas **nicht wie geplant**, sagst du statt „as fragged“ **„with exceptions“**. Erst kommt der Alpha Check,
dann nennst du die Abweichung. Der AWACS sagt dir, wann du fortfahren sollst:

::call{id=m5-awacs-checkin-exceptions}

Immer melden musst du laut ATP 3-52.4:

- eine **andere Flugzeugzahl** als geplant (z. B. drei statt vier)
- **WEAPONS** oder **FUEL** yellow bzw. red, oder eine **geänderte Beladung**
- **eingeschränkte Fähigkeiten** (z. B. Datalink)
- sonstige Besonderheiten, die im Briefing als meldepflichtig festgelegt sind

Auch der AWACS kann Hinweise zum Check-in geben. Dann bestätigst du wie immer **nur mit deinem Rufzeichen**.

---

::drill{id=m5-l1-exceptions}

---

::drill{id=m5-l1-call-exceptions}

---

## Die Sim-Kurzform

Wer in Sim-Staffeln über SRS fliegt, hört oft eine andere Form: Typ, Position über einen Bezugspunkt, Höhe in
angels und Auftrag, aber **keine Missionsnummer**. Sie ist verbreitet und funktioniert gut, steht aber so nicht
in der ATP 3-52.4:

::call{id=m5-awacs-checkin}

:::layer{layer=community}
Die Kurzform folgt dem Hoggit-Wiki. „Picture clean“ als Antwort auf einen Check-in kennt die ATP 3-52.4 nicht.
Im Missionsbriefing kann ein anderes Muster vereinbart sein – zum Beispiel mit Waffen oder Playtime
(:term[PLAYTIME]).
:::

---

::drill{id=m5-l1-call-checkin-short}

---

## Nicht zurücklesen

Mit der Flugsicherung liest du Anweisungen zurück. Mit dem AWACS ist das anders: **Lageinformationen
bestätigst du nur mit deinem Rufzeichen.** Auch die Beispiele der ATP 3-52.4 zeigen es so: Nach dem Alpha
Check oder einem Hinweis des Controllers antwortet der Flug nur mit „[Rufzeichen]“. Der AWACS spricht mit
vielen Flights auf derselben Frequenz, und jedes überflüssige Wort fehlt jemand anderem.

Und noch einmal zur Höhe: **angels** ist die Höhe eines **Freundes** – deine eigene. Höhen von
Kontakten heißen **thousand**. Daran hört jeder sofort, ob von Freund oder Gegner die Rede ist.

---

::drill{id=m5-l1-ack}

---

::drill{id=m5-l1-angels}

---

## Wer wird angerufen? Rufzeichen auf dem Netz

Jeder Funkspruch trägt ein Rufzeichen. Die ATP 3-52.4 unterscheidet drei Arten:

- **Anweisung:** das Rufzeichen dessen, der etwas tun soll – „Hornet 2, target north group“
- **Anfrage und Meldung:** erst der Angesprochene, dann du – „Mike, Showtime 11, declare additional group“ (additional group = eine neu entdeckte Gruppe, die nicht zum
  bisherigen Lagebild passt)
- **Weiterleiten (relay):** Adressat, „relay“, Rufzeichen des **ursprünglichen** Senders. Dein eigenes
  Rufzeichen lässt du weg.

Was in diesen Beispielen noch fremd klingt – *target* (Lektion 3: eine Gruppe aufschalten und als Ziel übernehmen), *declare* und *hostile* (Lektion 5) –, kommt später.

::call{id=m5-relay}

---

::drill{id=m5-l1-relay}

---

## Abmelden mit Pigeons

Wenn du die Station (den dir zugewiesenen Patrouillenpunkt) verlässt – zum Beispiel bei Bingo –, meldest du dich ab. Praktisch: Der AWACS gibt
dir gleich den Weg nach Hause. **PIGEONS** heißt Peilung und Entfernung zur **HOME PLATE**, deinem
Heimatplatz.

::call{id=m5-awacs-checkout}

Die Peilung geht **von dir** zum Heimatplatz – das ist direkt dein Kurs.

---

::drill{id=m5-l1-call-checkout}

---

::drill{id=m5-l1-pigeons}

---

::hangar{id=big-eye-ueber-tonkin}

---

## Merke

:::example
**Check-in: Wen – wer – Missionsnummer – as fragged (oder with exceptions) – Alpha Check. Antwort auf Lageinfos: nur dein Rufzeichen.**

Vollständig (MNPOPCA): Mission – Number/Type – Position/Altitude – Ordnance – Playtime – Capabilities – Abort
code. angels für Freunde, thousand für Kontakte. Weiterleiten: „[Adressat], relay, [Original-Rufzeichen]“. Beim
Abmelden RTB und pigeons – die Antwort ist dein Kurs nach Hause.
:::

:::sim{sim=dcs}
Den KI-AWACS in DCS erreichst du über das Funkmenü (**F7**). Einen Check-in im eigentlichen Sinn gibt
es dort nicht – du fragst direkt nach Bogey Dope, Picture oder Vektoren (u. a. „Vector to home
plate“ – der Kurs zum Heimatplatz). Mit Menschen über SRS oder mit SkyEye (einem KI-Controller für DCS, der über SRS funkt) funkst du so wie hier.
:::

:::sim{sim=bms}
In Falcon BMS ist der Check-in beim AWACS nicht umgesetzt. Die Anfragen laufen über das AWACS-Menü,
nach dem Schema „AWACS-Rufzeichen, eigenes Rufzeichen, Anfrage“.
:::
