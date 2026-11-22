---
id: skyeye
title: SkyEye – ein Roboter als GCI
category: praxis
era: modern
teaser: Kein Mitspieler will AWACS spielen? Ein Programm hört über SRS zu und antwortet im Brevity-Format.
sources:
  - title: "SkyEye (GitHub-Repository)"
    url: https://github.com/dharmab/skyeye
  - title: "SkyEye Player Guide"
    url: https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md
---

**SkyEye** ist ein KI-Controller für DCS, der über **SRS** funkt. Er hört mit, versteht gesprochene
Anfragen und antwortet mit synthetischer Stimme – im Format, das du in diesem Modul lernst. Dahinter
stecken eine Spracherkennung, eine Sprachausgabe und ein fester Regelsatz für die Brevity-Formate.
Das Projekt ist Open Source.

Was SkyEye kann (laut Player Guide):

- **Radio Check, Alpha Check, Vector** – Alpha Check nennt deine Position im Bullseye-Format
- **Bogey Dope** und **Declare** – Declare braucht eine Position im Bullseye- oder BRAA-Format
- **Picture** – der Kopf nennt alle Gruppen, ausgesprochen werden aber nur die wichtigsten drei
- **ungefragt**: Threat (Standard 25 Meilen), Merged (3 Meilen) und Faded

Damit er dich erkennt, muss dein Name in SRS dem Muster **„Rufzeichen Nummer | Name“** folgen. Wenn er
startet, meldet er sich mit **„sunrise“**.

Was er nicht kann: zwischen den Zeilen lesen. Er versteht nur, was im Format gesagt wird – genau das,
was du hier übst. Für einen menschlichen Controller, der mitdenkt, eine Lage einschätzt und Prioritäten
setzt, ist er kein Ersatz. Zum Üben auf dem eigenen Server ist er aber ein guter Gegenpart.
