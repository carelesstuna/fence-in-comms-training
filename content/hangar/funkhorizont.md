---
id: funkhorizont
title: Warum dich der Tower hinter dem Berg nicht hört
category: physik
teaser: VHF und UHF fliegen geradeaus – und die Erde ist rund. Eine Faustformel sagt dir, wie weit du funken kannst.
sources:
  - title: "Telecom Glossary der Alliance for Telecommunications Industry Solutions (ATIS): Radio horizon range (RHR)"
    url: https://glossary.atis.org/glossary/radio-horizon-range-rhr/
  - title: "DCS Spitfire IX Flight Manual (Funk, Reichweitentabelle)"
---

Funkwellen im **VHF- und UHF-Bereich** breiten sich fast wie Licht aus: geradeaus. Sie werden kaum
gebeugt und nicht von der Atmosphäre zurückgeworfen wie Kurzwelle. Was hinter dem Horizont oder hinter
einem Berg liegt, erreichst du meist nicht. Ein wenig wird über Grate gebeugt, auf FM mehr als auf UHF.

Ein bisschen weiter als die reine Sicht geht es doch, weil die Luft die Wellen leicht zur Erde hin
krümmt. Daraus ergibt sich eine handliche Faustformel für den **Funkhorizont** einer Antenne:

> **Reichweite (NM) ≈ 1,23 · √(Höhe in Fuß)**

Für zwei Stationen addierst du die Reichweiten beider Antennen:

> **1,23 · (√Höhe₁ + √Höhe₂)**

Ein paar Beispiele für ein Flugzeug und eine Bodenantenne nahe am Boden:

| Flughöhe | Reichweite (etwa) |
|---|---|
| 100 ft | 12 NM |
| 1.000 ft | 39 NM |
| 10.000 ft | 123 NM |
| 25.000 ft | 195 NM |

Zwei Flugzeuge auf je 25.000 ft können sich also auf fast 400 NM hören. Ein Hubschrauber im Tiefflug
verliert dagegen schon nach wenigen Meilen den Kontakt. Deshalb fliegen AWACS so hoch – und deshalb
gibt es **Relaisstationen**.

**So sah es 1944 aus.** Das DCS-Handbuch der Spitfire IX nennt Reichweiten zu Bodenstellen: etwa
30 Meilen auf 1.000 ft, 70 auf 3.000 ft, 80 auf 5.000 ft, 120 auf 10.000 ft, 150 auf 15.000 ft und
180 auf 20.000 ft. Die Faustformel liegt mit rund 123 NM auf 10.000 ft und 174 NM auf 20.000 ft in
derselben Größenordnung. Welche Meilen das Handbuch meint, bleibt offen ⚠, und das Handbuch nennt das
Gerät „HF“, obwohl es im VHF-Bereich arbeitet. Nimm die Tabelle deshalb als Größenordnung, nicht als
Messwert.

:::sim{sim=srs}
SRS kann das nachbilden. Ist auf dem Server **Line of Sight** aktiv, prüft SRS, ob zwischen Sender
und Empfänger Gelände liegt. Dann gilt die Faustformel auch für dich. Wer im Tal funkt, wird nicht
gehört.
:::
