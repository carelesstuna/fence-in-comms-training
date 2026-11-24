---
id: hoehen-und-hoehenmesser
title: Höhen und Höhenmesser – angels, Flight Level, QNH
summary: Wer welche Höhenwörter benutzt, worauf sich die Zahl bezieht und welcher Luftdruck am Höhenmesser steht.
terms: [ANGELS, CHERUBS, Flight Level, QNH, QFE, Übergangshöhe]
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), S. 15 (ANGELS) und S. 23 (CHERUBS)"
  - title: "FAA Aeronautical Information Manual, 7-2-3 Altimeter Errors (1 Zoll Fehler = 1.000 ft, „high to low, look out below“)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap7_section_2.html
  - title: "14 CFR 91.121 Altimeter settings (unter 18.000 ft Einstellung einer Station innerhalb 100 NM, ab 18.000 ft 29.92, niedrigstes nutzbares Flight Level)"
    url: https://www.law.cornell.edu/cfr/text/14/91.121
  - title: "FAA Pilot/Controller Glossary: Flight Level (FAA und ICAO), Altimeter Setting, QFE, QNE, QNH, MSL Altitude, AGL Altitude"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/glossary-f.html
  - title: "DCS MiG-29 Flight Manual (Höhenmesser in Metern, Anflugruf mit QFE)"
  - title: "Boldmethod: Transition Altitudes (Übergangshöhen in Europa – Sekundärquelle, ICAO-Dokumente nicht gelesen)"
    url: https://www.boldmethod.com/learn-to-fly/airspace/transition-altitudes/
---

Eine Höhenzahl allein sagt wenig. Du musst wissen, **wer** sie sagt, **wovon** sie gemessen ist und **welcher Luftdruck**
am Höhenmesser steht.

## Wer sagt was

| Wer | Wie er Höhen nennt | Beispiel |
|---|---|---|
| **ATC** unter der Übergangshöhe | Fuß, mit „thousand“ und „hundred“ | „six thousand five hundred“ |
| **ATC** darüber | **Flight Level**, dreistellig in Hunderten Fuß | „flight level two five zero“ |
| **Taktisch**, Höhe eines Freundes | **angels**: tausend Fuß über dem Meer | „angels two five“ |
| **Taktisch**, Höhe eines Freundes ganz tief | **cherubs**: hundert Fuß über Grund | „cherubs five“ |
| **Taktisch**, Höhe eines Kontakts | „thousand“, nie „angels“ | „two five thousand“ |

„angels“ und „cherubs“ gehören laut ATP 1-02.1 nur zu **eigenen** Flugzeugen. So hört jeder sofort, ob von Freund oder
Gegner die Rede ist. Der Ursprung der Wörter steht in der Hangar-Karte „Engel über Südengland“.

::call{id=m1-awacs-checkin-angels}

## Der Höhenmesser misst Luftdruck

Er rechnet Luftdruck in Höhe um. Ändert sich der Druck durch das Wetter, zeigt er falsch. Darum stellst du den
aktuellen Druck ein. Zwei Merkpunkte aus der AIM: Ein Zoll Quecksilber Fehler sind **1.000 ft**, und „going from a
high to a low, look out below“: Wer ins Tief fliegt und nicht nachstellt, ist tiefer, als der Höhenmesser sagt.
Mehr zur Physik steht in der Hangar-Karte „Dein Höhenmesser ist ein Barometer“.

## Welcher Druck: QNH, QFE, Standard

| Einstellung | Der Höhenmesser zeigt | Wo du sie hörst |
|---|---|---|
| **QNH** (Europa, in hPa) bzw. **altimeter** (USA, in inHg) | Höhe über dem Meer | ATIS und Lotse, unter der Übergangshöhe |
| **QFE** | Höhe über dem Platz, am Boden also 0 | manche Plätze und Muster, vor allem russische |
| **Standard**: 1013 hPa bzw. 29.92 inHg | Flight Level | über der Übergangshöhe, für alle gleich |

Gesprochen wird jede Ziffer einzeln: „QNH one zero one three“, „altimeter two niner niner two“. Du liest die
Einstellung zurück. In der App hörst du standardmäßig überall die US-Form („altimeter“, „descend and maintain …“).
Mit der Einstellung „Kartenabhängig“ in den [Einstellungen](/einstellungen/flugprofil) gilt in Georgien und am Golf die ICAO-Form („QNH“,
„descend to …“), in Nevada, auf Guam und in Korea bleibt es bei der US-Form. Mehr dazu in Modul 1, Lektion 3.

## Flight Level und Übergangshöhe

Ein **Flight Level** ist die Anzeige des Höhenmessers bei Standarddruck, in Hunderten Fuß: FL 250 heißt 25.000 ft
Anzeige. Die echte Höhe weicht ab, aber **alle** fliegen mit derselben Einstellung. Darauf kommt es bei der Staffelung an.

- **USA:** Ab **18.000 ft** über dem Meer gilt 29.92. Darunter stellst du den Wert einer Station innerhalb von 100 NM
  ein (14 CFR 91.121). Fällt der Druck unter 29.92, ist FL 180 nicht mehr nutzbar: Das niedrigste Flight Level steigt
  auf FL 185, 190 und so weiter, damit die Staffelung zu den Flügen darunter erhalten bleibt.
- **Europa:** Die **Übergangshöhe** (transition altitude) ist von Platz zu Platz verschieden. Darüber fliegst du Flight
  Levels, darunter QNH. Das **Transition Level** ist das niedrigste Flight Level über der Übergangshöhe. In Europa
  gehört es zu dem, was du zurückliest (Modul 1, Readback). Die Angaben zu Europa stammen aus einer Sekundärquelle.
- **Beim Sinkflug** stellst du wieder den Platzwert ein (QNH bzw. altimeter). Den Wert nennt dir der Lotse oder die ATIS.

## Meter und russische Muster

Westliche Muster zeigen Fuß. Russische Muster wie die MiG-29 in DCS haben einen Höhenmesser in **Metern** (laut
Handbuch bis 30.000 m), und der Anflugruf des DCS-Lotsen nennt **QFE**. Im gemischten Multiplayer lohnt ein Satz im
Briefing, welches System gilt.

## Wo dir das begegnet

- [Zahlen im Funk](/lesson/m1-l3) (Modul 1): Höhen bei ATC und taktisch, Luftdruck.
- [Readback und Radio Check](/lesson/m1-l6) (Modul 1): Höhen, Flight Levels und das Altimeter liest du zurück.
- [ATIS – das Wetter vorweg](/lesson/m3-l1) (Modul 3): das Altimeter aus der Ansage.
- [Departure](/lesson/m3-l6) (Modul 3): Flight Levels und Übergangshöhe.
- [Anmelden beim AWACS](/lesson/m5-l1) (Modul 5): angels für Freunde, thousand für Kontakte.
