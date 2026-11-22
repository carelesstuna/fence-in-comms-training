---
id: guard-und-notfunk
title: Guard und Notfunk
summary: Die beiden Notfrequenzen, wie ein Notruf aufgebaut ist, was „minimum fuel“ nicht heißt und was du bei Funkausfall tust.
terms: [Guard, GRCV, mayday, pan pan, NORDO, SAR, ELT]
sources:
  - title: "FAA Aeronautical Information Manual, 6-3-1 Distress and Urgency Communications und 6-3-2 Obtaining Emergency Assistance (Mayday und Pan-Pan, Reihenfolge der Meldung, 121.5 und 243.0)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap6_section_3.html
  - title: "FAA Aeronautical Information Manual, 6-2-4 Emergency Locator Transmitter (121.5, 243.0 und 406 MHz, Cospas-Sarsat seit 2009 nur noch 406 MHz)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap6_section_2.html
  - title: "FAA Aeronautical Information Manual, 6-4-1 Two-way Radio Communications Failure (14 CFR 91.185)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap6_section_4.html
  - title: "F-14-SAR-Checkliste, inoffizielle Aufbereitung aus der Sim-Community – Meldung auf Guard, wenn ein Kamerad aussteigt"
  - title: "FAA JO 7110.65, 2-1-8 Minimum Fuel"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_1.html
  - title: "AFMAN 11-2F-16 Volume 3 (4. Februar 2020), Abs. 3.33.4 (Minimum Fuel und Emergency Fuel) und 7.6 (NORDO)"
    url: https://static.e-publishing.af.mil/production/1/af_a3/publication/afman11-2f-16v3/afman11-2f-16v3.pdf
  - title: "ICAO Annex 10, Volume II, 5.3 – Distress and urgency radiotelephony procedures; Wikipedia: Aircraft emergency frequency"
    url: https://en.wikipedia.org/wiki/Aircraft_emergency_frequency
---

Wenn etwas schiefgeht, brauchst du drei Dinge: eine Frequenz, auf der jemand zuhört, einen Notruf, den jeder versteht,
und einen Plan, wenn dich niemand hört.

## Guard: 243.0 und 121.5

**Guard** sind die beiden internationalen Notfrequenzen: **243.0 MHz** im UHF-Band (militärisch) und **121.5 MHz** im
VHF-Band (zivil). Sie reichen nur so weit wie die Sichtlinie. Nach der AIM hören 121.5 MHz Peilstationen und manche
zivile und militärische Flugzeuge, 243.0 MHz Militärflugzeuge, und beide hören Militärtürme, die meisten zivilen Türme
und Radarstellen. Antwortet das Center auf Guard nicht, ruf den nächsten Tower.

- Viele Militärgeräte haben dafür einen **zweiten Empfänger** (an der F/A-18C die Taste **GRCV**, in BMS die Stellung
  BOTH; GD stellt dagegen das Hauptgerät selbst auf Guard). Dann hörst du Guard neben deinem Kanal mit. Die Handgriffe stehen in [Funkgerät bedienen](/wissen/funkgeraet-bedienen).
- Auf Guard sendest du nur im **Notfall** oder wenn jemand **auf keinem anderen Weg** erreichbar ist, etwa weil er sich
  verschaltet hat. Antwortet dir jemand und nennt eine Frequenz, wechselst du dorthin und antwortest dort.
- Guard ist **keine Plauderfrequenz**. Ein Radio Check oder ein Witz kann einen echten Notruf überdecken.

## Mayday und Pan Pan

- **MAYDAY** meldet eine Notlage. Der Ruf hat **absoluten Vorrang** und verlangt Funkstille auf der Frequenz.
- **PAN-PAN** meldet Dringlichkeit. Er hat Vorrang vor allem außer einem Mayday und warnt die anderen, nicht zu stören.
- Beide Wörter sagst du **möglichst dreimal** (AIM).

Der Notruf hat eine feste Reihenfolge, von der du so viele Teile nennst, wie nötig sind:

1. Mayday, mayday, mayday (oder pan pan)
2. die angerufene Stelle
3. Rufzeichen und Flugzeugtyp
4. Art des Problems
5. Wetter
6. deine Absicht und dein Wunsch
7. Position und Kurs, oder wenn du dich verflogen hast die letzte bekannte
8. Höhe oder Flight Level
9. **Treibstoff in Minuten**
10. Personen an Bord

Du rufst zuerst die Stelle, die dich gerade führt, und sonst die zuständige. Antwortet niemand, darfst du an alle senden:
„any station, tower, radar“. Wenn möglich, steig auf, denn Höhe bringt Reichweite (im Instrumentenflug nur mit Freigabe). Der Transponder bleibt auf dem
zugeteilten Code, solange du mit der Flugsicherung sprichst. Hast du keinen Kontakt, stellst du **7700** ein (siehe
[Squawk, Transponder und IFF](/wissen/squawk-transponder-iff)).

::call{id=m2-mayday}

## „minimum fuel“ ist kein Notfall

„**minimum fuel**“ sagt dem Lotsen, dass du keine unnötige Verzögerung mehr hinnehmen kannst. Es ist ausdrücklich
**kein Notfall** und verschafft dir **keinen Vorrang** (JO 7110.65 2-1-8). Brauchst du Vorrang, erklärst du einen Notfall
und nennst den Rest in **Minuten**. „emergency fuel“ ist die Sprache der US Air Force. Die F-16-Vorschrift nennt feste
Werte, zu erklären zu Beginn des Instrumentenendanflugs: minimum fuel bei 800 lb (Block 10 bis 32) bzw. 1.000 lb
(Block 40 und höher), emergency fuel bei 600 lb bzw. 800 lb. Für andere Muster gilt das Briefing.

## Wenn dich niemand hört

Fällt das Funkgerät aus, heißt das **NORDO**. Du stellst **7600** ein. In der Formation verständigt ihr euch mit Sicht-
und Lichtzeichen, siehe [Wenn etwas schiefgeht](/lesson/m4-l7). Nach der AIM fliegst du bei Sichtflug weiter und landest
„so bald wie praktikabel“. Im Instrumentenflug hängt es von der letzten Freigabe ab (14 CFR 91.185).

## Nach dem Absturz: SAR und ELT

**SAR** (Search And Rescue) ist die Suche und Rettung. Ein **ELT** (Emergency Locator Transmitter) ist ein Sender, der
nach einem Absturz ein Notsignal funkt. Er sendet auf 121.5, 243.0 oder 406 MHz. Seit 2009 wertet das Satellitensystem
Cospas-Sarsat nur noch 406 MHz aus, die älteren Sender muss ein Flugzeug oder eine Station in der Nähe hören. Wer sieht,
dass ein Kamerad aussteigt, meldet es nach einer inoffiziellen Sim-Aufbereitung der F-14-SAR-Checkliste auf Guard (Modul 2, Guard).

## Wo dir das begegnet

- [Funkgeräte im Cockpit](/lesson/m2-l1) (Modul 2): der Guard-Empfänger im Kasten (GRCV).
- [Guard – die Frequenz, die alle hören](/lesson/m2-l3) (Modul 2): Guard, Mayday und Pan Pan, Abfangen.
- [Wenn etwas schiefgeht](/lesson/m4-l7) (Modul 4): lost wingman, beide blind, NORDO mit 7600.
