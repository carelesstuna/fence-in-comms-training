---
id: track-c-l4
module: track-c
order: 4
title: "Talk-on: Contact, Tally, Captured"
summary: Einer Zielbeschreibung vom Großen zum Kleinen folgen, mit dem richtigen Wort antworten und eine Markierung nutzen.
minutes: 11
xp: 90
layer: core
sources:
  - title: "Wikipedia: Multiservice tactical brevity code (Zusammenfassung der ATP 1-02.1, April 2025): CONTACT, TALLY, CAPTURED, LOOKING, NO JOY, VISUAL"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "DCS A-10C Flight Manual, S. 786–788: „mark is on the deck“, „Contact the Mark“"
  - title: "DCS JFO/JTAC Pilot Guide (Community, 562nd Tactical School): Big to Small, Korrekturen in Himmelsrichtung und Metern"
  - title: "Hoggit-Wiki: JTAC"
    url: https://wiki.hoggitworld.com/view/JTAC
---

## Die Augen zum Ziel führen

Nach dem Readback weißt du, **wo** das Ziel liegt. Ob du es auch **siehst**, ist eine andere Frage. Der Talk-on bringt
deine Augen dorthin: Der JTAC beschreibt Schritt für Schritt, du meldest jedes Mal, was du siehst.

Dafür gibt es feste Wörter:

| Wort | heißt |
|---|---|
| :term[CONTACT] | Bezugspunkt gesehen – noch nicht das Ziel |
| :term[LOOKING] | noch nicht gesehen, beschreib weiter |
| :term[TALLY] | Ziel gesehen |
| :term[CAPTURED] | Ziel im Zielbehälter erfasst und verfolgt |
| :term[NO JOY] | Ziel nicht in Sicht |
| :term[VISUAL] | Eigenes gesehen – ein Flugzeug oder die Stellung der Freunde |

::call{id=track-c-talkon}

---

::drill{id=track-c-l4-match}

---

::drill{id=track-c-l4-bridge}

---

::hangar{id=vom-grossen-zum-kleinen}

---

::drill{id=track-c-l4-contact}

---

::drill{id=track-c-l4-tally}

---

::drill{id=track-c-l4-build-jtac}

---

## Mit Markierung

Findet man das Ziel nicht, hilft eine Markierung: Rauch, :term[Willie Pete] (weißer Phosphor), ein Laser oder bei Nacht
ein IR-Pointer. Die Markierung liegt fast nie genau auf dem Ziel – die Korrektur kommt **von der Markierung aus**.

::call{id=track-c-mark-smoke}

:::sim{sim=dcs}
Der KI-JTAC markiert mit Rauch und meldet „mark is on the deck“; du antwortest im Funkmenü mit „Contact the Mark“
(A-10C-Handbuch). Mit Combined Arms kann ein Spieler-JTAC Rauch in mehreren Farben setzen – welche Farbe was bedeutet,
legt das Missionsbriefing fest.
:::

---

::drill{id=track-c-l4-smoke}

---

::drill{id=track-c-l4-correction}

---

## Von den Einschlägen des Leads

Ist der Lead schon durch, sind seine Einschläge der beste Bezugspunkt für Two. Der JTAC spricht dann Two an – Lead
schweigt.

::call{id=track-c-lead-hits}

:::aircraft{aircraft=a10}
Mit dem Zielbehälter der A-10C meldest du :term[CAPTURED], sobald du das Ziel darin verfolgst. Das ist mehr als TALLY:
Du hast es nicht nur gesehen, sondern im Sensor festgehalten.
:::

---

## Merke

:::example
**CONTACT** = Bezugspunkt, **TALLY** = Ziel, **CAPTURED** = Ziel im Sensor, **LOOKING** = beschreib weiter, **NO JOY**
= Ziel nicht in Sicht. Korrekturen kommen in **Himmelsrichtung und Metern**, von der Markierung aus.
:::
