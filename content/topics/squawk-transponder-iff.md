---
id: squawk-transponder-iff
title: Squawk, Transponder und IFF
summary: Das Gerät, das einem Radar automatisch mit einem Code antwortet – und was „squawk“, „ident“, „standby“, „paints“ und „spades“ damit zu tun haben.
terms: [Transponder, SQUAWK, STRANGLE, SPADES, PAINTS, SQUAWKING, IFF]
sources:
  - title: "FAA Aeronautical Information Manual, 4-1-20 Transponder and ADS-B Out Operation (Codes 7500/7600/7700, 1200, IDENT, Mode A = Mode 3, Formationsflug)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html
  - title: "FAA JO 7110.65, 5-2 Beacon System (5-2-3 bis 5-2-5, 5-2-10 SQUAWK STANDBY, 5-2-20 STOP SQUAWK) und 2-1-13 Formation Flights"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap5_section_2.html
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (SQUAWK, STRANGLE, SPADES, PAINTS, SQUAWKING)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "Wikipedia: Identification friend or foe (Modes 1, 2, 3/A, 4, 5; Mode 5 löst Mode 4 ab)"
    url: https://en.wikipedia.org/wiki/Identification_friend_or_foe
  - title: "SERA.13005 SSR transponder Mode A code setting (Verordnung (EU) Nr. 923/2012; Wortlaut bei der UK CAA): Codes 7700, 7600, 7500, 2000 und 7000"
    url: https://regulatorylibrary.caa.co.uk/923-2012/Content/Regs/03000_SERA13005_SSR_transponder_Mode_A_code_setting.htm
  - title: "Euro-SD (Withington, 11. Januar 2022): Identification friend or foe (Mode 5 löst Mode 4 ab, Mode 4 und 5 verschlüsselt)"
    url: https://euro-sd.com/2022/01/articles/exclusive/24434/identification-friend-or-foe
  - title: "Falcon BMS 4.38 Technical Manual, Abs. 11.4 (IFF: Mode 1, 2, 3 und 4 mit Schlüssel A/B in der Sim)"
---

Ein Radar sieht zunächst nur Punkte. Der **Transponder** macht aus dem Punkt ein bestimmtes Flugzeug: Er
antwortet automatisch auf die Abfrage eines Radars mit einem **vierstelligen Code** und meist auch mit der
Höhe. Der Lotse sieht beides neben dem Punkt. Du sagst dafür kein Wort. Woher der Name „squawk“ (Krächzen)
kommt, steht in der [Hangar](/hangar)-Karte „Warum ein Transponder krächzt“.

## Squawk: den Code einstellen

**„Squawk“** heißt: Stell diesen Code am Transponder ein. Er besteht aus vier Ziffern, jede nur von 0 bis 7,
das gibt 4.096 Codes. Du sprichst ihn Ziffer für Ziffer und liest ihn zurück. Meistens steckt er in der
Freigabe:

::call{id=m3-ifr-clearance}

Weitere Anweisungen für das Gerät:

| Der Lotse sagt | Du machst |
|---|---|
| squawk ident | Ident-Taste drücken: Dein Punkt leuchtet kurz auf dem Schirm auf. Nur auf Anweisung. |
| squawk standby | Transponder auf STBY: Er bleibt an, antwortet aber nicht. |
| squawk normal | zurück in den Normalbetrieb |
| stop squawk | Transponder ausschalten |

:::warn
**„standby“ ist nicht „standby“.** Am Transponder heißt es: Gerät schweigt. Das Standardwort :term[standby] aus
Modul 1 heißt dagegen „Warte, ich melde mich“. Wer „squawk standby“ hört, wartet also nicht auf den Lotsen,
sondern stellt das Gerät um.
:::

## Die drei Notfallcodes

| Code | Bedeutung |
|---|---|
| **7700** | Notfall |
| **7600** | Funkausfall |
| **7500** | Entführung (unrechtmäßiger Eingriff) |

Beim Umstellen drehst du nie über diese Codes: Von 2700 auf 7200 geht es erst auf 2200, nicht über 7700 – sonst
löst du kurz einen falschen Alarm aus (AIM). Wer im Sichtflug keinen Code zugewiesen bekommen hat, stellt den
Standardcode ein: **1200** in den USA (AIM), in Europa **7000** (SERA.13005, solange du keinen Flugverkehrsdienst
bekommst und die Behörde nichts anderes vorschreibt).

## Formation: nur der Lead squawkt

Für die Flugsicherung ist ein Flight in **Standard-Formation** (höchstens 1 NM seitlich oder längs, 100 ft in
der Höhe) ein einziges Flugzeug. Dann squawkt nur der Lead den zugewiesenen Code, alle anderen stehen auf
**standby**. Dazu sagt der Lotse „squawk standby“ oder „stop squawk“. In einer „nonstandard formation“ bekommt
dagegen jedes Flugzeug einen eigenen Code. Wie das im Alltag klingt, zeigt Modul 3 bei Departure.

## IFF: dasselbe Gerät, mehr Modes

**IFF** (Identification Friend or Foe) ist die militärische Freund-Feind-Kennung. Technisch ist es dieselbe
Abfrage mit zusätzlichen **Modes**. Für den Anfang reichen zwei Dinge:

- **Mode 3/A ist der Squawk.** Der zivile Mode A und der militärische Mode 3 sind dasselbe.
- **Mode 1, 2, 4 und 5 gibt es nur beim Militär.** Mode 4 und Mode 5 sind verschlüsselt, Mode 5 löst das ältere
  Mode 4 ab. Welche Modes und Codes du einstellst, steht im Briefing. In Falcon BMS kommen sie mit der Mission
  automatisch in den DTC, Mode 4 mit Schlüssel A und B, der zu festen Uhrzeiten wechselt.

Die Tabelle aller Modes steht in der Hangar-Karte „IFF – die Antwort, die keiner hört“.

## Im AWACS-Funk

Hier sind die Wörter Brevity (ATP 1-02.1):

- **SQUAWK** mit Mode und Code: IFF so einstellen. **STRANGLE**: das genannte Gerät ausschalten. „Strangle
  parrot“ heißt Transponder aus.
- Der AWACS fragt Kontakte ab und hängt das Ergebnis an **BOGEY**. **PAINTS**: alle verlangten Modes und Codes
  stimmen. **SQUAWKING**: Ein Mode oder Code weicht ab, das Wort nennt den Mode. **SPADES**: keine der verlangten
  Antworten kommt.

:::warn
SPADES heißt nicht „Feind“. Vielleicht hat nur jemand den Transponder falsch eingestellt. Und nicht verwechseln:
**SQUAWK** ist dein Befehl, **SQUAWKING** die Meldung des AWACS über einen anderen Kontakt.
:::

## Wo dir das begegnet

- [Readback und Radio Check](/lesson/m1-l6) (Modul 1): Der Squawk gehört zu den Dingen, die du zurückliest.
- [Guard](/lesson/m2-l3) (Modul 2): Wer abgefangen wird, stellt 7700 ein.
- [Ground](/lesson/m3-l3) (Modul 3): Der Squawk steht in der IFR-Freigabe.
- [Am Bahnende](/lesson/m3-l4) (Modul 3): IFF ist Teil der Checkliste vor dem Start.
- [Departure](/lesson/m3-l6) (Modul 3): ein Squawk für den ganzen Flight.
- [Fence in, fence out](/lesson/m4-l3) (Modul 4): IFF auf die Einstellung aus dem Briefing.
- [Wenn etwas schiefgeht](/lesson/m4-l7) (Modul 4): 7600 bei Funkausfall.
- [Declare](/lesson/m5-l5) (Modul 5): PAINTS, SPADES und SQUAWKING.

Die KI-Lotsen von DCS und BMS achten laut Modul 3 nicht auf den Transponder. Bei menschlichen Lotsen und beim
AWACS zählt er.
