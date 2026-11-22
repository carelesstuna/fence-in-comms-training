---
id: m3-l7
module: m3
order: 7
title: Ohne Tower – sich selbst ansagen
summary: Wenn niemand im Tower sitzt, sagt jeder selbst an, was er tut – kurz, mit Platzname vorn und hinten.
minutes: 8
xp: 80
layer: community
sources:
  - title: "FAA AIM 4-1-9 – Traffic Advisory Practices at Airports Without Operating Control Towers"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap4_section_1.html
  - title: "IL-2-Forum: Best practices and comm/radio discipline (Combat Box)"
    url: https://forum.il2sturmovik.com/topic/63447-best-practices-and-comm-radio-discipline
---

## Wenn niemand antwortet

Bisher hattest du immer einen Gesprächspartner: Ground, Tower, Departure. Es gibt aber Flüge, bei
denen **niemand im Tower sitzt** – an kleinen Plätzen im echten Leben, und in Multiplayer-Missionen,
wenn kein Mitspieler die Flugsicherung übernimmt.

Dann gilt eine einfache Regel: **Jeder sagt selbst an, was er tut.** Alle sprechen auf derselben
Platzfrequenz. Niemand erteilt Freigaben, niemand antwortet – aber jeder weiß, wo die anderen sind.

So klingt eine Selbstansage vor dem Rollen. Tippe auf die Teile:

::call{id=m3-traffic-taxi}

:::sim{sim=srs}
Über SRS hören dich nur Mitspieler, die dieselbe Frequenz und Modulation eingestellt haben. Die
KI-Flugsicherung der Sim hört dort nicht mit – ohne Mitspieler im Tower bist du also wirklich auf
Selbstansagen angewiesen.
:::

:::sim{sim=il2}
**IL-2** hat keine Funkfrequenzen. Den Heimatplatz rufst du über das **Befehlsmenü** (Rollen, Start,
Landung anfragen) – das ist eine KI-Platzkontrolle, die nur Menübefehle versteht und mit Rollfreigabe,
Start- oder Landefreigabe antwortet. Mitspieler hören davon nichts. Auf Servern mit SRS sagst du dich
deshalb zusätzlich selbst an, auf dem Kanal, den der Server für den Platzverkehr vorsieht. Ein Beispiel
aus einem Funkdisziplin-Thread zu Combat Box: „P-51 joining runway 01 at Krymskaya“ – Muster, Absicht,
Bahn, Platz.
:::

---

::drill{id=m3-l7-why-name-twice}

---

## Aufbau einer Selbstansage

Das FAA AIM beschreibt den Aufbau so:

1. **Platzname + „Traffic“** – Adressat sind alle auf der Frequenz
2. **Rufzeichen** – damit man dich später wiedererkennt
3. **Position und Absicht** – „taxiing to runway …“, „departing runway …“, „ten miles north, inbound …“
4. **Platzname** noch einmal am Ende

Zwei Unterschiede zum Funk mit dem Tower:

- Du **bittest um nichts**. Statt „request taxi“ sagst du „taxiing“ – du tust es einfach, nachdem du
  geschaut und gehört hast, dass nichts im Weg ist.
- **Niemand antwortet.** Eine Selbstansage ist eine Information, keine Frage.

:::tip
Die Platzfrequenz steht im **Missionsbriefing** bzw. auf deiner **Comm Card** im Kneeboard. In DCS
findest du die Frequenzen des Platzes zusätzlich im Flugplatzfenster der F10-Karte.
:::

---

::drill{id=m3-l7-build-taxi}

---

::hangar{id=ein-platz-eine-frequenz}

---

## Wann du dich ansagst

Angesagt wird an den Punkten, an denen du anderen in die Quere kommen kannst:

- **bevor du losrollst**
- **bevor du auf die Bahn rollst** bzw. startest
- wenn du den Platzbereich **verlässt**
- etwa **zehn Meilen vor dem Platz** bei der Rückkehr
- in der **Platzrunde** bzw. beim :term[Overhead] (Initial: gerader Anflug auf die Bahn, Break: erste 180-Grad-Kurve in die Platzrunde)
- wenn du die **Bahn verlassen** hast

Dazwischen ist Ruhe auf der Frequenz. Und weil sich alle ansagen, musst du nie fragen, wer gerade
unterwegs ist.

:::warn
„Any traffic in the area, please advise“ hört man immer wieder – das FAA AIM verbietet die Formulierung
ausdrücklich. Sie fordert alle zum Antworten auf und blockiert die Frequenz.
:::

---

::drill{id=m3-l7-when}

---

::drill{id=m3-l7-silence-inbound}

---

::drill{id=m3-l7-call-departure}

---

## Jetzt am Stück

Ein kompletter Flug ohne Tower: rollen, starten, abfliegen, zurückkommen, landen. Zwischendurch meldet
sich ein anderer Flight – hör genau hin, ob du etwas sagen musst.

---

::scenario{id=m3-s3-ohne-atc}

---

## Merke

:::example
**„[Platz] Traffic – Rufzeichen – Position und Absicht – [Platz]“**

Ohne Tower sagst du an, statt zu fragen. Platzname vorn und hinten, keine Antwort erwartet, nie
„please advise“. Angesagt wird beim Rollen, vor dem Start, beim Verlassen, im Anflug und wenn die
Bahn frei ist.
:::
