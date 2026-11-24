---
id: srs-hinter-den-kulissen
title: Funk ohne Funkwellen
category: technik
teaser: SRS simuliert Funkgeräte – aber eigentlich ist es ein Sprachchat mit sehr genauen Regeln, wer wen hören darf.
sources:
  - title: "DCS-SimpleRadioStandalone (GitHub, ciribob)"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone
  - title: "DCS-SRS Wiki: SRS Server"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone/wiki/SRS-Server-(WIP)
---

**DCS-SimpleRadio Standalone** ist ein Open-Source-Projekt (GPL-3.0), das ein Entwickler mit dem
Namen *ciribob* ins Leben gerufen hat. Technisch ist es ein **Sprachchat** – wie Discord oder
Teamspeak – mit einem entscheidenden Unterschied: Wer wen hört, entscheidet nicht ein Kanal, den du
anklickst, sondern dein **Funkgerät im Cockpit**.

So läuft das ab:

1. Ein kleines Skript in DCS liest ständig aus deinem Flugzeug aus: welche Funkgeräte, welche
   Frequenzen, welche Modulation, welches Gerät gewählt ist – und wo du gerade fliegst.
2. Der **SRS-Client** auf deinem Rechner schickt diese Daten an den **SRS-Server**.
3. Drückst du PTT, geht deine Stimme an den Server. Der leitet sie an alle weiter, deren Gerät auf
   derselben Frequenz (auf etwa 1 kHz genau) **und** derselben Modulation steht.
4. Beim Empfänger mischt der Client die Stimme dazu – auf Wunsch mit Funkeffekten wie Rauschen und
   Verzerrung.

Weil der Server die Positionen aller Spieler kennt, kann er auch **Entfernung** und **Sichtlinie**
prüfen. Er kann simulieren, dass du während des Sendens nichts hörst, und dass sich FM-Sendungen
gegenseitig verdrängen. Und er kennt Sonderfälle: das **Intercom** für Besatzungen, Verschlüsselung
oder einen **externen AWACS-Modus**, mit dem ein Controller ohne Flugzeug mitfunkt.
