---
id: track-c-l3
module: track-c
order: 3
title: "Readback: Line 4, Line 6 und Restriktionen"
summary: Genau das Pflicht-Set zurücklesen, Korrekturen des JTAC erkennen und Danger Close mitlesen – dann der erste ganze Check-in.
minutes: 16
xp: 120
layer: core
sources:
  - title: "Sekundärquellen zur Joint Publication 3-09.3, Close Air Support (2019): Readback Line 4, 6 und Restriktionen"
  - title: "DCS-Handbücher P-51D (S. 174), A-10C (S. 784–786), F-5E: Readback von Zielort, Höhe und Angriffskurs, „readback correct“"
  - title: "DCS JFO/JTAC Pilot Guide (Community, 562nd Tactical School), S. 16, 21: Readback, „Correction“, Remarks"
  - title: "DTIC ADA429336 (nur Auszug geprüft): Readback-Pflicht in der JP 3-09.3 von 2003"
    url: https://apps.dtic.mil/sti/tr/pdf/ADA429336.pdf
---

## Was zurückgelesen wird

Nach dem 9-Line liest du zurück – aber nicht alles. Pflicht sind:

- **Line 4**, die Zielhöhe
- **Line 6**, die Zielkoordinate
- **jede Restriktion** aus den Remarks, vor allem das :term[Final Attack Heading] und :term[Danger Close]

::call{id=track-c-readback}

Erst nach **„readback correct“** geht es weiter. Wer mehr zurückliest, macht nichts falsch – kostet aber Zeit, und jede
zusätzliche Zahl ist eine Gelegenheit für einen Dreher.

:::layer{layer=community}
Die **Reihenfolge** ist in den Quellen nicht einheitlich. Die DCS-Handbücher kennen einen Readback nach den Remarks:
Zielort, Zielhöhe und – falls genannt – Angriffskurs. Der JTAC-Leitfaden der Community lässt nach dem 9-Line erst Line 4
und 6 zurücklesen, gibt dann die Remarks und lässt die Restriktionen noch einmal zurücklesen. Der Pflichtumfang ist in
beiden derselbe. Diese Spur übt die erste Form.
:::

---

::drill{id=track-c-l3-what}

---

::hangar{id=warum-line-4-und-6}

---

::drill{id=track-c-l3-build}

---

::drill{id=track-c-l3-readback-type}

---

## Wenn der JTAC korrigiert

Hast du dich verhört oder verschrieben, kommt kein „readback correct“, sondern :term[correction] mit dem richtigen Wert.
Du liest dann genau diesen Wert noch einmal zurück.

::call{id=track-c-readback-correction}

:::tip
Lies aus dem, was du **gehört** hast, nicht aus deiner Mitschrift ab, wenn du unsicher bist – und frag mit „say again“
nach, bevor du etwas Falsches zurückliest.
:::

---

::drill{id=track-c-l3-correction}

---

::drill{id=track-c-l3-correction-call}

---

## Danger Close

Stehen die eigenen Leute sehr nah am Ziel, sagt der JTAC in den Remarks **„danger close“**. Angegriffen wird trotzdem –
aber mit besonderer Sorgfalt, und du liest es mit zurück, weil es eine Restriktion ist.

::call{id=track-c-danger-close}

Wie nah „sehr nah“ ist, hängt von der Waffe ab. Die Grenzwerte und das Verfahren mit den Initialen des Bodenkommandeurs
ließen sich nicht an der Vorschrift prüfen ⚠.

---

::drill{id=track-c-l3-dc}

---

::drill{id=track-c-l3-dc-call}

---

## Alles zusammen

Jetzt der ganze Ablauf in einer Übung: 9-Line mitschreiben, dann zurücklesen.

---

::drill{id=track-c-l3-decoder}

---

## Dein erster Einsatz auf Station

Ein ganzer Check-in, von der Übergabe durch den AWACS bis zur Halteposition. Die Frequenz des JTAC steht auf deiner
Line-up-Card – stell sie selbst ein.

---

::scenario{id=track-c-s1-auf-station}

---

## Merke

:::example
Zurücklesen: **Line 4, Line 6 und jede Restriktion** (Final Attack Heading, Danger Close). Erst nach **„readback
correct“** geht es weiter. Bei **„correction“** liest du genau den korrigierten Wert noch einmal.
:::
