---
id: m3-l3
module: m3
order: 3
title: Ground – Rollen ohne Umwege
summary: IFR-Freigabe, Rollfreigabe für den Flight, progressive taxi auf fremden Plätzen, hold position und give way.
minutes: 11
xp: 100
sources:
  - title: "FAA JO 7110.65 – 4-2-1 Clearance Items, 4-3 Departure Clearances (cleared to … airport as filed)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap4_section_2.html
  - title: "UK CAA CAP 413 Radiotelephony Manual (ICAO: Clearance Delivery, taxi to holding point)"
  - title: "FAA JO 7110.65 – 3-7-2 Taxi and Ground Movement Operations"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap3_section_7.html
  - title: "FAA Pilot/Controller Glossary (Progressive Taxi, Hold Position)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/
  - title: "ICAO Doc 4444 (PANS-ATM), 12.3.4 – Phraseologie am Boden (give way)"
  - title: "FAA Aeronautical Information Manual – 2-3-5 Holding Position Markings"
  - title: "UOAF Codex – Airport Operations"
    url: https://codex.uoaf.net/reference/airport-operations.html
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 9, 14 – Presets, Rollanfrage und Antworten"
  - title: "DCS A-10C II Flight Manual, Kommunikationsmenü F5 ATC – Anfragen am Boden"
  - title: "DCS Ka-50 Black Shark 3 Manual, Kap. 14 – Bodendienste, ATC und FARP"
  - title: "IVAO Deutschland – Military Phraseology (Community-Dokument: Last Chance, IFR-Freigabe)"
    url: https://de.ivao.aero/en/special-operations-en/military-aviation/military-phraseology/
  - title: "DCS P-51D Mustang Flight Manual, S. 174–176 – Funkmenü: ATC (Anlassen, Rollen, Start, Inbound)"
---

## Vor dem Rollen: die IFR-Freigabe

Wer nach Instrumentenflugregeln (IFR) fliegt, braucht vor dem Start eine **Streckenfreigabe**. An großen
Plätzen gibt sie eine eigene Stelle, **:term[Clearance Delivery]**, sonst Ground. Die Freigabe hat eine feste
Reihenfolge:

1. **Freigabegrenze**: bis wohin die Freigabe reicht, meist der Zielplatz („cleared to … airport“)
2. **Route**: wie im Flugplan („as filed“) oder eine Abflugroute (SID)
3. **Höhe**, die du zunächst hältst
4. **Abflugfrequenz** und **Squawk**

Die ganze Freigabe liest du zurück. Erst nach „readback correct“ rufst du Ground zum Rollen. Wer die Stellen
sind, steht auf der Seite [Die ATC-Stellen](/wissen/atc-stellen), was ein Squawk ist, auf der Seite
[Squawk, Transponder und IFF](/wissen/squawk-transponder-iff).

::call{id=m3-ifr-clearance}

---

::drill{id=m3-l3-build-clearance-readback}

---

::drill{id=m3-l3-memory-clearance}

---

:::layer{layer=community}
An deutschen Militärplätzen läuft es oft anders herum: Die Jets rollen erst zum **Last Chance** (der letzten Kontrollstelle) am
Bahnende, und dort holt der Lead die Freigabe beim Tower ab („ready to copy IFR“). So steht es in
Community-Unterlagen (IVAO Deutschland); was an deinem Platz gilt, sagt das Briefing.
:::

:::sim{sim=dcs}
Die KI-Flugsicherung in DCS gibt keine IFR-Freigaben. Mit menschlichen Lotsen gibt es sie manchmal,
meist aber nur auf Servern, die Wert auf Verfahren legen.
:::

:::sim{sim=bms}
Auch die BMS-KI kennt keine Streckenfreigabe: Nach dem Anlassen rufst du direkt Ground zum Rollen.
:::

---

## Die Rollfreigabe – kurz wiederholt

Aus Modul 1 kennst du den Rollantrag für den Flight und den Readback mit „hold short“. Hier noch einmal
zum Auffrischen. Achte darauf, dass du als Lead für alle sprichst:

::call{id=m1-taxi-request}

:::tip
Die Rollfreigabe übt die App an jedem Platz in der US-Form: „runway …, taxi via …, hold short of runway …“. An
Plätzen in Europa (ICAO) hörst du meist „taxi to holding point runway … via …“. Gemeint ist dasselbe: bis vor die
Bahn rollen und dort halten.
:::

---

::drill{id=m1-l6-build-taxi-readback}

---

::hangar{id=icao-und-faa}

---

## Fremder Platz? Frag nach dem Weg

In der Sim fliegst du ständig auf Plätzen, die du nicht kennst. Raten ist keine gute Idee: Wer auf dem
falschen Rollweg steht, blockiert andere – oder steht im schlimmsten Fall auf einer aktiven Bahn.

Die Lösung heißt **:term[progressive taxi]**. Du sagst, dass du dich nicht auskennst, und Ground führt dich
Abschnitt für Abschnitt: Vor jeder Kreuzung kommt die nächste Anweisung.

::call{id=m3-progressive-taxi}

---

::drill{id=m3-l3-build-progressive}

---

## Anhalten und Vorfahrt

Während du rollst, kann Ground dich jederzeit stoppen oder umleiten:

- **hold position**: sofort stehen bleiben, genau da, wo du bist
- **hold short of …**: bis vor eine Bahn oder einen Rollweg rollen und dort halten
- **give way to …**: ein anderes Flugzeug zuerst vorbeilassen

Alle drei liest du zurück, und zwar in der „-ing“-Form: „holding position“, „holding short …“,
„giving way to …“. So hört Ground, dass du es verstanden hast **und** schon tust.

::call{id=m3-hold-position}

::call{id=m3-give-way}

---

::drill{id=m3-l3-match-ground}

---

::drill{id=m3-l3-input-hold}

---

::drill{id=m3-l3-build-giveway}

---

::hangar{id=hold-short-markierung}

---

## Merke

:::example
Als Lead: Rollantrag mit „flight of …“ und ATIS-Buchstabe. Rollweg und „hold short“ zurücklesen.
Fremd am Platz: „request progressive taxi“. „hold position“ = sofort stehen, „give way“ = Vorfahrt
lassen – beides mit „-ing“ zurücklesen.
:::

:::tip
**Welche Frequenz hat Ground?** Das steht im Missionsbriefing bzw. auf der Comm Card. Die
Beispiel-Funksprüche in diesen Lektionen zeigen die Frequenzen aus den Sim-Daten: An DCS-Plätzen ist das
die eine ATC-Frequenz des Platzes, für Ground und Tower dieselbe. An den BMS-Plätzen in Korea hat Ground
eine eigene Frequenz (UHF-Preset 2, Tower 3). In den Szenarien gilt die Comm Card im Kneeboard.
:::

:::era{era=ww2}
Im Warbird rollst du ohne Rollwegbuchstaben: In DCS fragst du über das Funkmenü (F5 – ATC) „Request taxi to
runway“ und rollst dann zum Haltepunkt (P-51D-Handbuch, S. 174–175). In IL-2 läuft das über das Befehlsmenü
(Rollen, Start anfragen) – eine KI-Platzkontrolle ohne Funkfrequenz. Im Multiplayer sagt der Lead für Mitspieler
zusätzlich auf dem Platzkanal an, wohin der Flight rollt.
:::

:::layer{layer=community}
Auf Multiplayer-Servern ohne menschlichen Lotsen rollen viele einfach los. Wer sich im Flight trotzdem
an die Abläufe hält – Rollantrag, Readback, Meldung am Rollhalt –, übt genau das, was an einem
Staffelabend mit Lotsen zählt. Ein Flight-interner „Ground“ (der Lead spricht alles an) ist eine gute
Übung.
:::

:::sim{sim=dcs}
In DCS hat jeder Platz nur **eine** KI-Flugsicherung mit einer Frequenz je Band (z. B. UHF und VHF):
Anlassen, Rollen und Start laufen alle darüber, Ground und Tower teilen sich also eine Frequenz. Comm
Cards in Missionen trennen sie oft, vor allem mit menschlichen Lotsen (z. B. mit LotATC). Dann gilt die
Comm Card.

Die KI-Bodenkontrolle kennt außerdem keine Rollwege und gibt keine Rollanweisungen mit Buchstaben. Für
echte Rollfreigaben braucht es menschliche Lotsen oder Missionsskripte.

**Die Menüeinträge am Boden** heißen etwa „Request Engine Start“, „Request taxi to runway“ und am
Haltepunkt „Request takeoff“. Die Antwort lautet z. B. „Cleared to taxi to runway …“. Die Startfreigabe
kommt nur, wenn gerade niemand startet und kein Flugzeug im Endanflug ist.

**Antwortet DCS-ATC nicht?** Dann prüfe der Reihe nach: Der Tower muss unzerstört sein und zu deiner
Koalition gehören (Anfragen an gegnerische Stellen bleiben unbeantwortet). Auf einem FARP (Forward Arming and Refueling Point, ein vorgeschobener Tank- und Rüstplatz) antwortet ATC
nur, wenn ein Kommandofahrzeug in der Nähe steht (laut Ka-50-Handbuch innerhalb von etwa 150 m um die
FARP-Mitte). Und die Frequenz muss stimmen: sie steht im Kneeboard bzw. im F10-Fenster.
:::

:::sim{sim=bms}
BMS-Ground antwortet auf „Request taxi“ (nur der Lead fragt) mit Rollweg und Haltepunkt, z. B. „taxi
Papa, Alpha and hold short runway …“, oder mit „hold position“ bzw. „give way to …“. Zusätzlich
meldet Ground unaufgefordert die erwartete Rollzeit – das ist nur Information, noch keine Freigabe.
Ground und Tower haben in BMS getrennte Frequenzen: am Startplatz UHF-Preset 2 und 3.
:::
