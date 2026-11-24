---
id: comm-card-bauen
title: So baust du deine Comm Card
category: praxis
teaser: Eine Seite auf dem Knie, und du suchst nie wieder eine Frequenz. So sieht eine brauchbare Comm Card aus.
sources:
  - title: "Falcon BMS 4.38 Comms & Nav Book (liegt BMS bei, im Installationsordner unter Docs), S. 9, 31 – fester Comm Plan"
  - title: "DCS Kneeboard-Seiten der mitgelieferten Kampagnen"
---

Eine Comm Card ist nichts anderes als eine Tabelle – aber sie muss **in der Reihenfolge des Flugs**
gebaut sein, nicht alphabetisch.

**Spalten, die sich bewährt haben:**

| Kanal | Netz / Stelle | Frequenz | Gerät | Wann |
|---|---|---|---|---|
| 2 | Platz Ground | 2xx.xx | UHF | Anlassen, Rollen |
| 3 | Platz Tower | 2xx.xx | UHF | Rollhalt bis Abflug |
| … | … | … | … | … |

**Tipps:**

- **Reihenfolge = Flugablauf.** Von oben nach unten liest du deinen Flug. Wo du gerade bist, siehst du
  sofort, was als Nächstes kommt.
- **Kanal zuerst.** Im Flug denkst du in Kanälen, nicht in Frequenzen.
- **Gerät dazuschreiben**, wenn du zwei oder drei Funkgeräte hast.
- **Flight-Frequenz hervorheben** – sie brauchst du immer.
- **Guard** (243.0 / 121.5) und die **Ausweichplatz-Frequenzen** gehören ans Ende. Du brauchst sie
  selten, aber dann schnell.
- **Platz für Notizen** lassen: ATIS-Buchstabe, Bahn, Altimeter, :term[Joker] und :term[Bingo].

In DCS legst du die fertige Karte als Bild in den Kneeboard-Ordner deiner Saved Games, in BMS kommt sie
auf das Kneeboard der Mission. Bei Multiplayer-Abenden lohnt es sich, **eine** Comm Card für alle
zu verteilen – dann haben alle dieselben Kanäle im Kopf.
