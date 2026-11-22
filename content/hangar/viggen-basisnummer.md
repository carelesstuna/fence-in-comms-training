---
id: viggen-basisnummer
title: Platznummer und Buchstabe – der Funk der Viggen
category: technik
era: cold-war
teaser: In der schwedischen AJS-37 wählst du keinen Preset, sondern einen Flugplatz – und dann mit einer Buchstabentaste einen Kanal dieses Platzes.
sources:
  - title: "DCS AJS37 Viggen Flight Manual (Abschnitte FR22 und FR24)"
---

Die **AJS-37 Viggen** ist ein schwedisches Muster, und ihr Funk ist anders aufgebaut als in
amerikanischen Jets.

Das Hauptgerät **FR22** deckt **VHF und UHF** ab und kennt **844 vorgespeicherte Kanäle**. Statt
einer Liste von Presets hat es zwei Wege, einen Kanal zu wählen:

- **Gruppenwähler:** Ein Drehwähler und die Zifferntasten 0–9 setzen einen Kanal.
- **Basiswähler:** Ein Drehknopf stellt die **Nummer des Flugplatzes** ein. Dann wählen
  **Buchstabentasten** den Kanal dieses Platzes.

Die Idee: Der Comm Plan ist schon im Gerät. Wer einen Platz anfliegt, dreht dessen Nummer ein und
drückt den passenden Buchstaben. Welche Nummer zu welchem Platz gehört, steht in DCS im Anhang des
Handbuchs, im Kneeboard und im F10-Menü.

Dazu kommen ein paar Sonderfälle:

- **H** ist die Notfrequenz **121,5 MHz**.
- Ein zweites, kleines Gerät, das **FR24**, hat drei Festkanäle (E, F, G) und ebenfalls die
  Notfrequenz – als Rückfall, wenn das Hauptgerät ausfällt.
- Mit der Minus-Taste lässt sich die Kanalwahl umgehen und eine **Frequenz direkt** einstellen.

⚠ Laut Handbuch sind in der Simulation nur ein Teil der 844 Kanäle angelegt. Was eine Mission
braucht, steht im Briefing.

Das Prinzip „vorher planen, im Flug nur noch umschalten“ ist dasselbe wie überall. Die Viggen
ordnet den Plan nur nach Flugplätzen statt nach Nummern.
