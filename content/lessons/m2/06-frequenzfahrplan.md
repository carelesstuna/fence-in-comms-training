---
id: m2-l6
module: m2
order: 6
title: Welche Frequenz wann?
summary: Woher die Frequenzen kommen, welche Quelle bei Widerspruch gilt, in welcher Reihenfolge du sie brauchst – und wie du nie wieder suchst.
minutes: 8
xp: 80
sources:
  - title: "Falcon BMS 4.38 Comms & Nav Book (liegt BMS bei, im Installationsordner unter Docs), S. 8–16 – Ablauf und Comm Plan, Antwort auf falscher Frequenz"
  - title: "Falcon BMS 4.38 Technical Manual (liegt BMS bei, im Installationsordner unter Docs), S. 51, 56–57 – falsche Frequenz, zwei Funkgeräte"
  - title: "DCS A-10C II Flight Manual (liegt DCS bei), S. 791–792 – Aufteilung der Funkgeräte"
  - title: "FAA Aeronautical Information Manual – Kapitel 4-2 (Radio Communications Phraseology and Techniques)"
---

## Zu viele Frequenzen?

Ein ganz normaler Flug berührt schnell acht oder zehn Frequenzen: ATIS, Ground, Tower, Departure,
AWACS, Tanker, die Frequenz des eigenen Flights, dann Approach, Tower und Ground am Zielplatz. Wer die
erst sucht, wenn er sie braucht, ist im entscheidenden Moment mit Blättern beschäftigt statt mit
Fliegen. Der Trick: **vor dem Flug einen Frequenzfahrplan machen.**

## Woher die Frequenzen kommen

Es gibt vier Quellen. Von oben nach unten werden sie **aktueller und genauer auf deinen Flug
zugeschnitten**:

1. **Platzkarte** eines Flugplatzes: die festen Frequenzen von ATIS, Ground, Tower, Approach, dazu
   TACAN, :term[ILS] und Bahnen. Sie gilt für jeden Flug – wie man sie liest, kommt in der nächsten Lektion.
2. **Briefing und Comm Card** der Mission: alle Netze mit Kanal und Frequenz, gemacht für genau
   diesen Flug. Deine wichtigste Quelle.
3. **Die Übergabe eines Lotsen**: „contact departure …“ nennt dir die nächste Frequenz genau in diesem
   Moment.
4. **Nachfragen**: „say again frequency“. Guard nur als letztes Mittel.

:::tip
Widersprechen sich zwei Quellen, gilt die **weiter unten**: Die Anweisung des Lotsen schlägt die Comm
Card, und die Comm Card der Mission schlägt die allgemeine Platzkarte – Missionsplaner ändern
Frequenzen.
:::

---

::drill{id=m2-l6-conflict-handoff}

---

## Der Frequenzfahrplan

| Phase | Stelle | Was du dort tust |
|---|---|---|
| Vor dem Anlassen | ATIS | Wetter, Bahn, Luftdruck notieren |
| Anlassen, Rollen | Ground | Anlass- und Rollfreigabe |
| Am Rollhalt, Start | Tower | Startfreigabe |
| Nach dem Start | Departure | Steigflug, Übergabe ins Einsatzgebiet |
| Einsatz | AWACS, Strike, Tanker, JTAC | Lagebild, Auftrag, Betankung |
| Rückflug | ATIS des Zielplatzes | Bahn und Luftdruck vorher kennen |
| Anflug | Approach | Sinkflug, Anflug |
| Landung | Tower | Landefreigabe |
| Nach der Landung | Ground | Rollen zum Abstellplatz |

Die Grundregel dahinter: **Am Boden spricht Ground, auf und über der Bahn der Tower, im Umfeld des
Platzes Departure bzw. Approach.** Dazwischen liegen die taktischen Netze.

Wer diese Stellen sind und wie die Übergabe klingt, steht auf der Seite [Die ATC-Stellen](/wissen/atc-stellen).
Welche davon ATC sind und welche nicht, zeigt die Seite [ATC oder AWACS?](/wissen/atc-oder-awacs).

---

::drill{id=m2-l6-sequence-plan}

---

## Zwei Geräte, zwei Aufgaben

Mit zwei Funkgeräten teilst du die Arbeit:

- **Gerät 1 folgt dem Fahrplan:** Ground, Tower, Departure, AWACS … Hier wechselst du ständig.
- **Gerät 2 bleibt beim Flight:** Auf der internen Frequenz ist der Flight immer erreichbar, egal wer
  gerade mit wem spricht.

Welches Gerät welche Rolle hat, steht im Briefing. In der F-16 (auch in BMS) ist meist UHF das
Hauptgerät und VHF das Flight-Gerät. Das DCS-Handbuch der A-10C legt den Flight dagegen auf UHF und
nimmt FM für den JTAC.

:::tip
**Vorwählen:** Schau schon vor jeder Übergabe nach, welcher Kanal als Nächstes kommt. Bei Geräten mit
zweitem Empfänger oder bei einem freien dritten Gerät kannst du die nächste Frequenz sogar schon
einstellen und mithören.
:::

---

::drill{id=m2-l6-two-radios}

---

## Die Übergabe: zurücklesen, umschalten, melden

Jeder Wechsel läuft gleich ab:

1. Der Lotse nennt Stelle und Frequenz.
2. Du **liest zurück**.
3. Du **schaltest um** – am schnellsten, indem du die Frequenz auf der Comm Card wiederfindest und
   den Kanal wählst.
4. Du **meldest dich** auf der neuen Frequenz.

::call{id=m2-handoff-lookup}

---

::drill{id=m2-l6-lookup}

---

## Wenn es schiefgeht

Der Klassiker: Du sprichst auf der falschen Frequenz. Meist merkst du es daran, dass die falsche Stelle
antwortet – oder gar keine.

::call{id=m2-wrong-frequency}

:::warn
Niemand leitet deinen Funkspruch weiter. Erst wenn er auf der Frequenz der zuständigen Stelle
angekommen ist, zählt er. Also: umschalten und vollständig wiederholen.
:::

:::sim{sim=bms}
BMS bildet beides nach: Funkst du auf einer Frequenz, auf der niemand ist, geht dein Funkspruch
verloren. Rufst du Ground, während du noch auf der Tower-Frequenz bist, sagt dir der Lotse meist die
richtige Frequenz – den Funkspruch wiederholst du dann dort.
:::

---

::drill{id=m2-l6-build-wrong-freq}

---

::drill{id=m2-l6-lost}

---

::hangar{id=comm-card-bauen}

---

## Merke

:::example
**Vor dem Flug:** Frequenzfahrplan aus Briefing, Comm Card und Platzkarte. **Bei Widerspruch:** Lotse
vor Comm Card vor Platzkarte. **Im Flug:** zurücklesen, umschalten, melden. Gerät 1 folgt dem
Fahrplan, Gerät 2 bleibt beim Flight. **Wenn niemand antwortet:** Comm Card prüfen, zurück zur
letzten Frequenz, nachfragen.
:::

Wo genau du die Frequenzen in DCS, BMS und IL-2 findest, zeigen die Lektionen 8 und 9. Vorher
lernst du, eine Platzkarte zu lesen.
