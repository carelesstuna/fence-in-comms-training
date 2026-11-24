---
id: m1-l7
module: m1
order: 5
title: Funk und Physik
summary: Warum dich der Tower manchmal nicht hört – Sichtlinie, Funkhorizont zum Merken, Berge, Bänder, AM und FM, Rauschen.
minutes: 10
xp: 90
sources:
  - title: "Telecom Glossary der Alliance for Telecommunications Industry Solutions: Radio horizon range (RHR) – R = 1,23 · (√h₁ + √h₂) in Seemeilen, Höhen in Fuß, effektiver Erdradius 4/3"
    url: https://glossary.atis.org/glossary/radio-horizon-range-rhr/
  - title: "Wikipedia: Airband (Bänder, AM, Kurzwelle über Ozeanen)"
    url: https://en.wikipedia.org/wiki/Airband
  - title: "Wikipedia: Skywave (Rückwurf von Kurzwellen an der Ionosphäre)"
    url: https://en.wikipedia.org/wiki/Skywave
---

## Funk ist Licht, das du nicht siehst

Bisher ging es darum, **was** du sagst. Hier geht es darum, ob dich überhaupt jemand hört, und das entscheidet die
Physik. Eine Funkwelle ist wie Licht eine elektromagnetische Welle, nur unsichtbar. Ihre Eigenschaften hängen von der
**Frequenz** ab: Je höher die Frequenz, desto **kürzer** die Welle, und desto mehr verhält sie sich wie ein
Lichtstrahl. Die Wellenlänge in Metern ist ungefähr 300 geteilt durch die Frequenz in MHz.

| Band | Wellenlänge (etwa) | Ausbreitung | Im Flugfunk |
|---|---|---|---|
| **HF** (Kurzwelle) | 10 bis 100 m | Die Ionosphäre, eine hohe, elektrisch geladene Luftschicht, wirft sie zur Erde zurück: Sie trägt weit über den Horizont. | Ozeane und abgelegene Gebiete, in den Sims kaum |
| **VHF** (Very High Frequency) | 2 bis 3 m (Flugfunk), 3 bis 10 m (FM-Bereich) | fast **geradeaus**, bis zum Funkhorizont | zivile Luftfahrt und zivile Lotsen; im FM-Bereich (30 bis 88 MHz) das Heer, z. B. der JTAC am Boden |
| **UHF** (Ultra High Frequency) | rund 1 m | fast **geradeaus**, bis zum Funkhorizont | Militär: Plätze, Tanker, in BMS auch der AWACS |

Die MHz-Bereiche, wer wo funkt und welche Brevity-Wörter dazugehören (uniform, victor, fox mike), stehen auf der
Seite [Frequenzbänder, Modulation und Reichweite](/wissen/frequenzbaender-und-reichweite) und in Modul 2. Hier zählt:
**Das, was du im Kampfjet sprichst, läuft geradeaus.** Die Grenze, bis zu der sich zwei Antennen „sehen“, heißt
**Funkhorizont**. Wie weit er reicht, steht gleich in einer kleinen Merktabelle. Dazu kommt die **Modulation**: wie die Stimme auf die Welle
gelegt wird (AM oder FM). Mehr dazu am Ende der Lektion.

---

::drill{id=m1-l7-match-propagation}

---

## Sichtlinie und Funkhorizont

„Geradeaus“ heißt: Die Erde ist rund und biegt sich unter der Sichtlinie weg. Zwei Antennen erreichen sich nur, solange
sie sich „sehen“. Die Grenze ist der **Funkhorizont**. Er liegt etwas weiter als der Horizont fürs Auge, weil die Luft
die Wellen leicht zur Erde hin krümmt.

Wie weit das reicht, hängt fast nur von der **Höhe** ab. Rechnen musst du dafür nicht. Diese fünf Werte für ein Flugzeug
und eine Antenne am Boden reichen, um es abzuschätzen:

| Flughöhe | Funkhorizont etwa |
|---|---|
| 100 ft (Hubschrauber im Tiefflug) | gut 10 NM |
| 1.000 ft | 40 NM |
| 5.000 ft | 90 NM |
| 10.000 ft | 120 NM |
| 30.000 ft | 210 NM |

Dazu zwei Merksätze:

- **Vierfache Höhe, doppelte Reichweite.** Höhe zahlt sich nur langsam aus: Von 1.000 auf 4.000 ft wird aus 40 NM
  nur rund 80 NM. Ein Hubschrauber im Tiefflug verliert deshalb schon nach wenigen Meilen den Kontakt.
- **Zwei Antennen in der Luft: Reichweiten addieren.** Zwei Flugzeuge auf je 10.000 ft hören sich rund 240 NM weit,
  doppelt so weit wie eines von ihnen eine Antenne am Boden.

**Höhe** heißt hier: Höhe der Antenne über dem Gelände dazwischen. Der Höhenmesser zählt dagegen ab Meereshöhe.
Fliegst du über einem Hochplateau, reicht dein Funk deshalb weniger weit, als die Anzeige vermuten lässt. Und mehr
Sendeleistung hilft nicht: Sie verschiebt den Horizont nicht.

:::tip
Für Neugierige: Die Tabelle stammt aus der Faustformel **Reichweite (NM) ≈ 1,23 · √(Höhe in ft)**, für zwei Antennen
1,23 · (√Höhe₁ + √Höhe₂). Die Wurzel erklärt den ersten Merksatz: √4 = 2. Im Funk rechnet damit niemand im Kopf.
:::

---

::drill{id=m1-l7-horizon-match}

---

::drill{id=m1-l7-horizon-order}

---

## Berge schatten ab

Der Funkhorizont gilt nicht nur für die gekrümmte Erde, sondern für **alles**, was zwischen den Antennen liegt.
Ein Bergrücken schattet VHF und UHF weitgehend ab. Dahinter entsteht ein **Funkschatten**, und dort kommt kaum etwas
an, auch wenn die Frequenz stimmt, die Modulation passt und die Station nur 20 NM entfernt ist. Ein wenig wird über
den Grat gebeugt, auf FM mehr als auf UHF. Verlassen kannst du dich darauf nicht. Wer im Tal fliegt, hört den Tower
hinter dem Berg meist nicht, und der Tower hört dich ebenso wenig.

Was dann hilft:

- **Höher steigen**, bis du über dem Berg wieder in der Sichtlinie bist,
- **dich bewegen**, um aus dem Schatten herauszukommen,
- oder jemanden nutzen, der beide Seiten hört: eine **Relaisstation** oder ein Flugzeug, das hoch genug fliegt.

:::sim{sim=srs}
SRS kann den Funkschatten nachbilden: Ist auf dem Server **Line of Sight** aktiv, prüft SRS, ob zwischen Sender und
Empfänger Gelände liegt. Wer im Tal funkt, wird dann nicht gehört. Mehr dazu in Modul 2, Lektion 5.
:::

---

::drill{id=m1-l7-mountain}

---

::hangar{id=funkhorizont}

---

## Rauschen, Lesbarkeit, AM und FM

Jeder Empfänger rauscht ein wenig, und die Luft selbst auch. Mit der Entfernung wird das Signal schwächer, das Rauschen
bleibt gleich. Erst knistert es hinter den Worten, dann gehen Silben verloren, am Ende hörst du nur noch Rauschen.
Dasselbe passiert kurz vor dem Funkhorizont oder am Rand eines Funkschattens. Deshalb gibt es
beim Radio Check die **Lesbarkeitsskala von 1 bis 5** (Modul 1, Lektion 7), und deshalb sagst du Zahlen Ziffer für Ziffer
(Modul 1, Lektion 3): Geht im Rauschen eine Silbe verloren, fehlt nur eine Ziffer. Die **Rauschsperre**
(:term[Squelch]) schaltet den Empfänger stumm, solange kein Signal anliegt. Ohne sie hörst du dauernd Rauschen. Ist sie
zu hoch eingestellt, schneidet sie aber auch schwache Stationen weg. Hörst du eine schwache Station nicht, öffne den
Squelch kurz.

Dazu kommt die **Modulation**, also die Art, wie die Stimme auf die Welle kommt. **AM** legt sie in die Stärke der Welle,
**FM** in kleine Verschiebungen der Frequenz. Ein Empfänger versteht nur seine Art: Gleiche Frequenz mit falscher
Modulation heißt **kein Kontakt**, auch bei bestem Empfang. Der Flugfunk läuft weltweit in AM, der Heeresfunk (zu :term[JTAC], dem Fliegerleitoffizier am Boden) in FM;
warum Flugfunk bei AM geblieben ist, steht auf der Hangar-Karte „Warum Flugfunk immer noch AM ist“ (Modul 2, Lektion 4).

---

::drill{id=m1-l7-noise}

---

## Merke

:::example
**VHF und UHF laufen geradeaus.** 1.000 ft ≈ 40 NM, 10.000 ft ≈ 120 NM; vierfache Höhe, doppelte Reichweite; zwei
Flugzeuge addieren ihre Reichweiten. Gezählt wird die Höhe über dem Gelände. Berge schatten ab, gegen den Funkschatten
hilft Höhe. Rauschen heißt meist: Das Signal ist zu schwach. Prüf erst
Entfernung, Höhe und Gelände, dann das Gerät. Gleiche Frequenz, aber AM gegen FM, heißt kein Kontakt.
:::
