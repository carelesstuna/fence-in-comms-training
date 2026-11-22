---
id: atc-oder-awacs
title: ATC oder AWACS? Wer im Funk wofür zuständig ist
summary: ATC erlaubt und staffelt, der AWACS beschreibt die Lage und führt Jäger – zwei Sorten Stellen, zwei Sprachen, zwei Arten zu antworten.
terms: [ATC, AWACS, GCI]
sources:
  - title: "FAA JO 7110.65, 2-1-1 ATC Service und 2-1-2 Duty Priority (Zweck der Flugsicherung: Kollisionen verhindern, Verkehr ordnen)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_1.html
  - title: "ATP 3-52.4 / MCRP 3-20F.10 / NTTP 6-02.9 / AFTTP 3-2.8 „Air Control Communication“ (2. Sept. 2021), S. 5–9 (Check-in, Bestätigung nur mit Rufzeichen), S. 15 (Force Package, Roll Call), S. 44 (PACKAGE-Label)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), S. 46 (PACKAGE)"
  - title: "DCS A-10C Flight Manual, Kap. Radio Communications (S. 653: übliche Aufteilung der Frequenzen) und DCS User Manual (Frequenz und Modulation je Gruppe)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (ANGELS, BOGEY DOPE, PICTURE)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 12 und 46–48 – KI-ATC ohne Readback-Zwang, AWACS-Rufschema; UHF-Presets (Preset 6 = Tactical mit AWACS-Controller)"
  - title: "SkyEye Player Guide (Server-AWACS als Programm)"
    url: https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md
---

Im militärischen Funk sprechen zwei ganz verschiedene Sorten von Stellen mit dir. Sie wollen Verschiedenes von
dir, und du antwortest ihnen verschieden.

## ATC: „Darf ich?“

**ATC** (Air Traffic Control, die Flugsicherung) soll vor allem verhindern, dass Flugzeuge zusammenstoßen, und
den Verkehr in Fluss halten. Dafür **gibt ATC Freigaben und Anweisungen** und **staffelt**, hält die Flugzeuge
also auseinander. Tower, Ground, Approach und Center sind alle ATC. Sie stehen in
[Die ATC-Stellen von Clearance bis Center](/wissen/atc-stellen).

Du fragst, bekommst eine Freigabe und liest sie zurück. Höhen kommen in Fuß, oben in Flight Levels.

::call{id=m3-takeoff-clearance}

## AWACS, GCI, EWR: „Was ist da draußen?“

Der **AWACS** ist ein Radarflugzeug mit dem großen Lagebild. **GCI** (Ground Controlled Interception) ist die
Jägerleitstelle am Boden, die dasselbe mit **EWR** tut, den Frühwarnradaren. Sie **beschreiben die Lage und
führen Jäger**. Verkehrsfreigaben geben sie nicht. Du hörst Brevity wie :term[BOGEY DOPE] und :term[PICTURE], und
Höhen nennen sie taktisch: **angels** für Freunde, „thousand“ für Kontakte.

::call{id=m5-bogey-dope}

**Du liest nichts zurück.** Lageinformationen bestätigst du nur mit deinem Rufzeichen. Der AWACS spricht mit vielen
Flights auf einer Frequenz, jedes überflüssige Wort stört. In älteren Epochen führt statt des AWACS ein
Bodenradar. Die Wörter bleiben dieselben (Hangar-Karte „EWR statt AWACS“).

## Die Merkregel

| | ATC | AWACS / GCI |
|---|---|---|
| Die Frage dahinter | Darf ich? | Was ist da draußen? |
| Das bekommst du | Freigaben, Anweisungen, Staffelung | Lagebild, Führung |
| Die Sprache | Phraseologie nach ICAO bzw. FAA, Fuß und Flight Level | Brevity, angels |
| Deine Antwort | Readback | nur dein Rufzeichen |

## Weitere Stellen im Einsatz

- **Tanker**: ein Luftbetankungsflugzeug. Er hat eigene Rufzeichen und ein eigenes Netz. Er ist weder
  Flugsicherung noch AWACS, sondern sagt dir, wo und wann du ansetzt.
- **:term[JTAC]**: der Fliegerleitoffizier am Boden. Er weist Ziele zu und gibt den Angriff frei (mehr auf der Seite
  [JTAC und Luftnahunterstützung](/wissen/jtac-und-luftnahunterstuetzung)).
- **Strike**: das Einsatznetz des Verbands. Das Wort „Package“ hat in der ATP 3-52.4 zwei Bedeutungen: der
  Verband (Force Package) aus mehreren Flights mit gemeinsamer Mission, den der Mission Commander führt und bei
  dem sich die Flights oder Package Commander zum Roll Call melden, und die Lagebild-Brevity PACKAGE für
  räumlich abgesetzte Gruppen („north package“). Welche gemeint ist, zeigt der Zusammenhang.
- **Dein eigener Flight**: Auch der Lead gibt Anweisungen („fence in“, „push“). Dort antwortest du nur mit
  deiner Nummer.

## In der Sim

- **Mitspieler als Controller**: Über SRS übernimmt oft ein Mensch Tower oder AWACS. Er funkt nach denselben
  Regeln wie oben.
- **KI-Flugsicherung**: In DCS und BMS läuft sie über Funkmenüs, spricht nur mit dem Lead und verlangt laut
  BMS-Handbuch keinen Readback. Den KI-AWACS von DCS erreichst du über F7.
- **Server-AWACS**: Auf manchen Servern antwortet **SkyEye** über SRS, ein Programm, das nur Brevity im
  richtigen Format versteht (Hangar-Karte „SkyEye“).
- **Auf welchem Funkgerät?** Das hängt von der Sim ab. In BMS liegt der AWACS-Controller auf dem Tactical-Netz,
  UHF-Preset 6. In DCS legt die Mission Frequenz und AM oder FM jeder Gruppe fest. Das A-10C-Handbuch beschreibt
  als übliche Aufteilung eine eigene VHF-AM-Frequenz für den AWACS. Die Comm Card sagt dir, was in deiner Mission
  gilt.

## Wo dir das begegnet

- [Zahlen im Funk](/lesson/m1-l3) (Modul 1): Höhen bei ATC und taktisch.
- [Rufzeichen und Flights](/lesson/m1-l4) (Modul 1): Wer nach außen spricht.
- [Funkgeräte im Cockpit](/lesson/m2-l1) (Modul 2): Welche Stelle du auf welchem Gerät hörst.
- [Welche Frequenz wann?](/lesson/m2-l6) (Modul 2): der Fahrplan von ATIS bis Tower.
- [Lead und Wingman](/lesson/m4-l1) (Modul 4): Der Lead spricht für den Flight.
- [Anmelden beim AWACS](/lesson/m5-l1) (Modul 5): Check-in ohne Readback.
- [Leitstelle statt AWACS](/lesson/w-l3) (Warbirds): GCI am Boden.
