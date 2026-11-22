---
id: wellenzahl-mig15
title: Wellenzahl statt Megahertz – das Funkgerät der MiG-15
category: technik
era: cold-war
teaser: In der MiG-15 stellst du keine Frequenz ein, sondern eine Wellenzahl – und während du sprichst, hörst du gar nichts.
sources:
  - title: "DCS MiG-15bis Flight Manual (Abschnitt Funkgerät RSI-6)"
---

Die **MiG-15bis** flog im Koreakrieg gegen die F-86 Sabre. Ihr Funkgerät, das **RSI-6**, arbeitet
ganz anders als alles, was du aus modernen Cockpits kennst:

- **Kurzwelle statt UHF:** Es sendet zwischen **3,75 und 5 MHz**. Die F-86F der späteren Kriegsjahre
  auf der anderen Seite der „MiG Alley“ funkte schon auf UHF, die frühe F-86A noch auf VHF ⚠.
- **Wellenzahl statt Frequenz:** Am Bediengerät steht keine Frequenz, sondern eine **Wellenzahl** – gemeint
  ist eine Kanalnummer, nicht die Wellenzahl der Physik (1/λ).
  Laut DCS-Handbuch entspricht Wellenzahl 150 genau 3.750 kHz, Wellenzahl 200 genau 5.000 kHz.
  Rechnerisch ist eine Wellenzahl damit ein Schritt von 25 kHz: **Wellenzahl = Frequenz in kHz ÷ 25**.
- **Nur dieses eine Gerät:** Sender (RSI-6K) und Empfänger (RSI-6M1) teilen sich eine Antenne. Wie jedes
  Flugfunkgerät sendet oder empfängt es – weil die MiG aber kein zweites Gerät hat, hörst du beim Senden
  überhaupt nichts, auch keinen Wingman, der dir gerade „break“ zuruft.

Die Frequenz steht im **Briefing** in Kilohertz. Du musst sie auf **±5 kHz** genau treffen. Das
Kneeboard der MiG-15 hilft dabei: Es führt die Kanäle mit Wellenzahl (CH) und Frequenz (FR)
nebeneinander.

:::tip
Briefing: 4.150 kHz. 4.150 ÷ 25 = **166** – das ist die Wellenzahl, die du am Gerät suchst.
:::

Was das für den Funk heißt, kennst du schon aus Modul 2: Wer sendet, blockiert den Kanal. Beim RSI-6
kommt dazu, dass dir in dieser Zeit auch kein zweites Gerät Warnungen zuträgt. Kurze Funksprüche sind hier
keine Höflichkeit, sondern Überlebensfrage.
