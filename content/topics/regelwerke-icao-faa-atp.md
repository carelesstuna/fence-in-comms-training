---
id: regelwerke-icao-faa-atp
title: Wessen Regeln? ICAO, FAA, ATP und die Handbücher
summary: Wer die Funkregeln schreibt, was ein Handbuch von einer Vorschrift unterscheidet und wie die App ihre Quellen zitiert.
terms: [ICAO, FAA, IFR, VFR]
sources:
  - title: "Wikipedia: International Civil Aviation Organization (UN-Sonderorganisation, Standards and Recommended Practices)"
    url: https://en.wikipedia.org/wiki/International_Civil_Aviation_Organization
  - title: "FAA Pilot/Controller Glossary: Visual Flight Rules, VFR Conditions, IFR Aircraft, IFR Conditions"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/glossary-v.html
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), Vorwort S. iv (Zweck, Streitkräfte der USA, Weitergabe an die NATO für APP-7)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "AFMAN 11-2F-16 Volume 3 „F-16 – Operations Procedures“ (4. Februar 2020, Change 3 vom 13. September 2022)"
    url: https://static.e-publishing.af.mil/production/1/af_a3/publication/afman11-2f-16v3/afman11-2f-16v3.pdf
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei)"
  - title: "FAA Aeronautical Information Manual und FAA JO 7110.65 „Air Traffic Control“"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/
---

Hinter jedem Funkspruch steht ein Regelwerk. Wenn die App „richtig“ sagt, meint sie immer: nach welchem?

## Wer schreibt was

| Wer | Was | Wofür es in der App steht |
|---|---|---|
| **ICAO** | UN-Organisation für die zivile Luftfahrt. Ihr Rat beschließt die Standards in den Annexen, darunter Annex 10 (Funk). Dazu kommen Verfahrensvorschriften wie Doc 4444 (PANS-ATM, Verfahren der Flugsicherung) und Handbücher wie Doc 9432 (Manual of Radiotelephony). | die internationale Phraseologie, in Europa der Standard |
| **FAA** | die US-Luftfahrtbehörde. Ihre Bücher: JO 7110.65 (die Regeln der Lotsen), AIM (das Handbuch der Piloten), das Pilot/Controller Glossary. | die Phraseologie der USA, an der sich die Sims orientieren |
| **ATP 1-02.1** | die Brevity-Codes, auf die sich die US-Teilstreitkräfte geeinigt haben. Die NATO hat mit APP-7 eine eng verwandte Sammlung. | die taktischen Kurzwörter |
| **ATP 3-52.4** | „Air Control Communication“: der Funk zwischen Controller und Flugzeugen | das Lagebild in Modul 5 |
| **AFMAN, Korea-BEM** | Vorschriften und Handbücher einzelner Streitkräfte für ein Muster, hier die F-16 | Verfahren von F-16-Staffeln |
| **SOP und SPINS** | Hausregeln und Zusatzanweisungen einer Einheit oder eines Servers | siehe [Comm Plan, Comm Card und Missionsunterlagen](/wissen/comm-plan-und-missionsunterlagen) |

**Vorschrift oder Handbuch?** Die AFMAN 11-2F-16 trägt auf der ersten Seite den Satz „Compliance with this publication is
mandatory“: Sie ist bindend. Das Korea-BEM ist ein Handbuch der koreanischen Luftwaffe von 2005 und damit älter und
für ein anderes Land geschrieben. Wo eine Zahl in der App aus einem dieser Bücher stammt, steht
dabei, aus welchem.

## US-Form gegen ICAO-Form

ICAO und FAA sprechen dieselbe Sprache mit kleinen, festen Unterschieden: „affirm“ und „affirmative“, „decimal“ und
„point“, „QNH“ und „altimeter“. Die Tabelle steht in der Hangar-Karte „Zwei Dialekte der Flugsicherung“. Die App zeigt
die **US-Form**, weil die Sims vor allem US-Militär abbilden. Deshalb stehen dort „three“, „five“ und „niner“. Die
strenge ICAO-Form (tree, fife) nimmt die App in deinen Antworten an. Beim Luftdruck, bei Steig- und Sinkfreigaben und
bei der Sicht in der ATIS bleibt es standardmäßig ebenfalls bei der US-Form. Mit der Einstellung „Kartenabhängig“ in den
[Einstellungen](/einstellungen/flugprofil) richtet sich die App dort nach dem Platz: US-Form in Nevada, auf Guam und in Korea, ICAO-Form in
Georgien und am Golf (Modul 1, Lektion 3).

## IFR und VFR

Das sind die beiden Regelwerke für den Flug selbst.

- **VFR** (Visual Flight Rules, Sichtflugregeln): Flug unter Sichtbedingungen. Das Kürzel bezeichnet auch die
  Wetterlage („VFR conditions“) und die Art des Flugplans (FAA-Glossar).
- **IFR** (Instrument Flight Rules, Instrumentenflugregeln): Flug nach Instrumenten, mit Streckenfreigabe. Wetter unter
  den VFR-Mindestwerten heißt „IFR conditions“ (FAA-Glossar).

Welche Regeln du fliegst, bestimmt, wer dich führt und was du zurücklesen musst. Einen Überblick über die Stellen gibt
[Die ATC-Stellen von Clearance bis Center](/wissen/atc-stellen).

## Wie die App Quellen nennt

- Unter jeder Lektion und jeder Seite steht, woher die Aussagen stammen. Die Nummern sind Absätze (AIM „4-1-20“,
  JO 7110.65 „2-1-13“) oder Seiten. Bei der ATP 1-02.1 zählt die Seite im PDF.
- **Praxis** bedeutet: Das kommt aus der Sim-Community, nicht aus einer Vorschrift. **⚠ nicht eindeutig belegt** heißt:
  Die Quellen weichen ab.
- Was in einem Sim-Handbuch steht, gilt für diese Sim und nicht für die echte Welt. Im Zweifel gilt das Briefing deiner Mission.

## Wo dir das begegnet

- [Wer ruft wen?](/lesson/m1-l1) (Modul 1): Der Maßstab der ersten Beispiele ist ICAO und FAA.
- [Zahlen im Funk](/lesson/m1-l3) (Modul 1): die US-Form der Ziffern und der Unterschied zur ICAO.
- [Readback und Radio Check](/lesson/m1-l6) (Modul 1): Die ICAO-Liste der Readback-Pflichten ist länger als die der FAA.
- [Ground](/lesson/m3-l3) (Modul 3): IFR-Freigabe und die Hangar-Karte „Zwei Dialekte der Flugsicherung“.
