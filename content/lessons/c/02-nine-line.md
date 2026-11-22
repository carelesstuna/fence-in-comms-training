---
id: track-c-l2
module: track-c
order: 2
title: "Der 9-Line: hören und mitschreiben"
summary: Die neun Zeilen und die Remarks in der richtigen Reihenfolge – und einen ganzen 9-Line mitschreiben, Zeile für Zeile.
minutes: 15
xp: 110
layer: core
sources:
  - title: "Sekundärquellen zur Joint Publication 3-09.3, Close Air Support (2019): Zeilen 1–9 und Remarks"
  - title: "DCS JFO/JTAC Pilot Guide (Community, 562nd Tactical School), S. 15–17, 20–22: Lines, Readback, PTL/LTL"
  - title: "DCS-Handbücher P-51D (S. 174), A-10C (S. 784–788), F-5E: Remarks, „ready to copy remarks“"
  - title: "BMS 4.38 CAS-Kneeboard-Blätter: 9-Line, Remarks, Restrictions"
  - title: "Hoggit-Wiki: JTAC"
    url: https://wiki.hoggitworld.com/view/JTAC
---

## Neun Zeilen, ein Ziel

Der :term[9-Line] ist das Briefing für deinen Angriff. Der JTAC gibt es am Stück durch, du schreibst mit. Jede Zeile hat
ihren festen Platz – deshalb reicht im Funk die Zahl, ohne dass er „Line 4“ dazusagen muss.

| Zeile | Inhalt | Beispiel |
|---|---|---|
| 1 | :term[IP] – wo dein Anflug beginnt | IP Granite |
| 2 | Kurs vom IP zum Ziel, Offset | two seven zero offset left |
| 3 | Distanz vom IP in NM | eight point five |
| 4 | Zielhöhe in Fuß | one two five zero feet |
| 5 | Zielbeschreibung | two BMP-2 in the open |
| 6 | Zielkoordinate (:term[MGRS]) | November Kilo one two three four five six seven eight |
| 7 | Markierung | laser one six eight eight |
| 8 | Freunde: Richtung und Meter vom Ziel | south one thousand two hundred |
| 9 | Egress | egress west to Timber |

Danach fragt der JTAC, ob du bereit bist für die :term[Remarks]. Dort stehen die Restriktionen (vor allem das
:term[Final Attack Heading]), bei Laser die :term[Laser-Target Line], die Bedrohung und die Time on Target.

---

::drill{id=track-c-l2-match-a}

---

::drill{id=track-c-l2-match-b}

---

## So klingt er

Hier ein ganzer 9-Line mit Remarks. Tipp die Teile an – jede Zeile hat eine Erklärung. Mit „neu würfeln“ bekommst du
eine andere Lage: Alle Werte passen immer zueinander, weil sie aus einem gemeinsamen Einsatzraum berechnet werden.

::call{id=track-c-nineline}

Zwei Dinge fallen auf:

- **Line 2** ist der Kurs **vom IP zum Ziel**, nicht umgekehrt. Der Offset sagt, zu welcher Seite du den Anflug
  versetzt – weg von den eigenen Leuten.
- **Line 8** zeigt **vom Ziel zu den Freunden**. „South one thousand two hundred“ heißt: Die eigenen Leute stehen
  1.200 m südlich des Ziels.

:::warn
Line 3 kommt vom IP in **Seemeilen**. Nur wenn ein Hubschrauber von einer Battle Position startet, kommt sie in
**Metern**. Ältere Community-Leitfäden mit „Metern vom IP“ sind überholt.
:::

---

::drill{id=track-c-l2-sequence}

---

::drill{id=track-c-l2-line8}

---

::hangar{id=mgrs-zehn-meter}

---

::drill{id=track-c-l2-mgrs}

---

::drill{id=track-c-l2-lasercode}

---

## Das Kneeboard

Mitschreiben heißt nicht schön schreiben. Auf dem Kneeboard stehen die Zeilennummern schon vorgedruckt, du trägst nur
noch die Werte ein – Kurzformen sind ausdrücklich erlaubt:

- Richtungen als **N, NE, S, SW** …
- Zahlen als Ziffern, die Koordinate mit einer Lücke: **NK 1234 5678**
- Markierung kurz: **L 1688**, **WP**, **none**

Im nächsten Schritt kommt der Brief Übertragung für Übertragung. Schreib mit, während er läuft – erst danach prüfst du.

:::sim{sim=dcs}
In der A-10C kann der 9-Line auch **digital** kommen: als Nachricht über den Datenlink, mit dem Ziel auf der Karte. Du
nimmst ihn mit WILCO an (A-10C-Handbuch). Den Funk dazu solltest du trotzdem beherrschen – menschliche JTACs auf SRS
funken ihn.
:::

---

::drill{id=track-c-l2-decoder}

---

::drill{id=track-c-l2-bp}

---

::drill{id=track-c-l2-quick}

---

## Merke

:::example
**IP – Kurs und Offset – Distanz – Höhe – Ziel – Koordinate – Markierung – Freunde – Egress**, danach die **Remarks**.
Kurs vom IP zum Ziel, Distanz in NM, Höhe in Fuß, Freunde vom Ziel aus in Metern. Die Koordinate hat zwei Buchstaben und
meist acht Ziffern.
:::
