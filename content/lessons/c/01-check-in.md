---
id: track-c-l1
module: track-c
order: 1
title: Check-in beim JTAC
summary: Vom AWACS auf fox mike, der vollständige Check-in, Situation Update, Game Plan und die Halteposition im Keyhole.
minutes: 14
xp: 100
layer: core
sources:
  - title: "Sekundärquellen zur Joint Publication 3-09.3, Close Air Support (2019): Check-in-Reihenfolge und Beispiel"
  - title: "DCS A-10C Flight Manual, S. 784–788 (JTAC: Check-in, Control Type, Ready to copy, 9-Line, Readback)"
  - title: "DCS A-10C II Flight Manual (Funkgeräte, Mikrofonschalter)"
  - title: "BMS 4.38 CAS-Kneeboard-Blätter (Check-in, SITREP, Game Plan) und Comms & Nav Book (JTAC, Preset 6)"
  - title: "DCS JFO/JTAC Pilot Guide (Community, 562nd Tactical School)"
  - title: "Hoggit-Wiki: JTAC"
    url: https://wiki.hoggitworld.com/view/JTAC
---

## Auf fox mike

Luftnahunterstützung (:term[CAS]) heißt: Du greifst Ziele nahe an den eigenen Truppen an. Geführt wirst du von einem
:term[JTAC] am Boden, der die Lage sieht. Den Überblick, wer der JTAC ist und warum es die Freigabe braucht, gibt die Seite
[JTAC und Luftnahunterstützung](/wissen/jtac-und-luftnahunterstuetzung).

Der Weg zu ihm beginnt meist beim AWACS. Er schickt dich auf das Netz des JTAC – und das liegt meist auf **VHF-FM**,
kurz :term[fox mike]: Bodentruppen funken mit FM-Geräten, und laut A-10C-Handbuch spricht der JTAC in DCS meist über
VHF-FM. Welches Gerät und welche Frequenz gelten, sagen Comm Plan und Übergabe – in BMS liegt der JTAC zum Beispiel auf
UHF-Preset 6. Wer auf dem falschen Gerät ruft, wird nicht gehört.

::call{id=m2-handoff-fm}

Die Frequenz steht auf deiner Line-up-Card oder im Briefing. Du stellst das Gerät für den JTAC ein – meist das
**FM-Gerät** –, nicht das, auf dem dein Flight spricht.

:::aircraft{aircraft=a10}
Die A-10C hat drei Funkgeräte: **UHF**, **VHF-AM** und **VHF-FM**. Laut Handbuch der A-10C II spricht der Flight meist
auf UHF, AWACS und Flugsicherung auf VHF-AM, der JTAC auf VHF-FM. Am Mikrofonschalter wählst du das Gerät: nach vorn
VHF-AM, nach hinten VHF-FM, nach unten UHF.
:::

:::aircraft{aircraft=ah64}
Im AH-64D sind die beiden FM-Geräte (FM1, FM2) für die Bodentruppen da, UHF für Flugsicherung und andere Flugzeuge.
:::

:::aircraft{aircraft=fa18}
Bei Navy und Marines fliegt die F/A-18 CAS. Ihre beiden ARC-210 (COMM 1 und COMM 2) decken laut DCS-Handbuch auch den
FM-Bereich ab: Den JTAC stellst du auf einem der beiden ein, die Frequenz im Bereich 30–88 MHz ist FM. Welches Gerät,
legt meist der Comm Plan fest.
:::

---

## Der Check-in

Auf dem JTAC-Netz meldest du dich mit allem, was er für seine Planung braucht: wer du bist, was du hast, wo du bist und
wie lange du bleiben kannst.

::call{id=track-c-checkin}

Die Reihenfolge **Position und Höhe → Bewaffnung → :term[Playtime]** nennen die DCS-Handbücher, der JTAC-Leitfaden der
Community und die BMS-Blätter übereinstimmend. Die Fähigkeiten (Zielbehälter, eigener Laser-Code) sind eine freiwillige
Zugabe. Am Ende steht der :term[Abort code].

:::tip
Lies den Check-in vom Kneeboard ab. Wer die Bewaffnung im Kopf zusammensucht, macht Pausen – und auf einem JTAC-Netz
warten oft noch zwei andere Flights.
:::

---

::drill{id=track-c-l1-order}

---

::drill{id=track-c-l1-anatomy-position}

---

::drill{id=track-c-l1-build}

---

::drill{id=track-c-l1-abort-code}

---

## Situation Update

Hat der JTAC deinen Check-in, schildert er die Lage. Die **Bedrohung** kommt zuerst, weil sie Höhe und Anflug bestimmt.

::call{id=track-c-sitrep}

Das BMS-Blatt für die Lagemeldung hat sieben feste Punkte: Bedrohung, Feindlage, eigene Kräfte, Artillerie,
Freigabebefugnis, Gefahren und Bemerkungen. Wie streng diese Gliederung in der Vorschrift ist, ließ sich nicht prüfen ⚠.
Für dich zählt: mitschreiben, vor allem die Mindesthöhe – sie ist eine **Restriktion**.

---

::drill{id=track-c-l1-sitrep-match}

---

## Game Plan

Bevor der eigentliche Brief kommt, sagt der JTAC, wie er den Angriff führen will: die :term[Control Type], ob du das
Ziel selbst bestätigen musst (:term[BOT]) oder auf die Koordinate wirfst (:term[BOC]), und mit welcher Waffe.

::call{id=track-c-gameplan}

„Advise when ready for nine-line“ heißt: Kneeboard raus. Du antwortest erst, wenn du wirklich bereit bist zum
Mitschreiben.

:::sim{sim=dcs}
Der KI-JTAC im Funkmenü (F4) nimmt den Check-in als Menüpunkt: Missionsnummer, Position, Bewaffnung und Playtime trägt
das Spiel selbst ein. Dann nennt er die Control Type, du wählst „Ready to copy“, und der 9-Line kommt mit den Remarks
(A-10C-Handbuch). Den genauen Wortlaut der Menüpunkte prüfst du am besten in deiner Version ⚠.
:::

:::sim{sim=bms}
In BMS gibt es seit Version 4.36 einen JTAC auf dem Tactical-Netz (UHF-Preset 6). Der Ablauf: Check-in, Echo Point,
9-Line, „IP Inbound“, „Cleared Hot“, Check-out mit BDA.
:::

---

::drill{id=track-c-l1-type-control}

---

::drill{id=track-c-l1-ready}

---

## Warten im Keyhole

Oft bist du nicht allein auf Station. Bis du dran bist, schickt dich der JTAC auf eine Halteposition. Auf Servern mit
menschlichen JTACs ist dafür das :term[Keyhole] üblich.

::call{id=track-c-keyhole}

---

::hangar{id=keyhole-und-stack}

---

::drill{id=track-c-l1-keyhole}

---

::drill{id=track-c-l1-holding}

---

## Jetzt du

Ein ganzer Check-in, getippt. Lass dir Zeit – lieber einmal vollständig als dreimal mit Nachfragen.

---

::drill{id=track-c-l1-checkin-type}

---

## Merke

:::example
Der JTAC ist auf **fox mike**. Check-in: **JTAC, Rufzeichen, Anzahl und Typ, Position und Höhe, Bewaffnung, Playtime,
Abort Code**. Danach kommen **Situation Update** (Bedrohung zuerst, Mindesthöhe merken) und **Game Plan** (Control Type,
BOT oder BOC, Waffe). Auf „advise when ready for nine-line“ antwortest du mit **„ready to copy“**, wenn das Kneeboard
bereit ist.
:::

:::sim{sim=srs}
Mit einem menschlichen JTAC über SRS gilt alles aus dieser Lektion wörtlich. Achte auf die Modulation: Der JTAC ist auf
FM, dein Flight auf UHF oder VHF-AM. In der A-10 hast du drei Geräte – leg dir alle drei Sendetasten griffbereit.
:::
