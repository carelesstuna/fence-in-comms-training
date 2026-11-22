---
id: comm-plan-und-missionsunterlagen
title: Comm Plan, Comm Card und Missionsunterlagen
summary: Wer auf welcher Frequenz spricht, wo das steht und welche Unterlagen von der Einsatzplanung bis zur Hausregel dazugehören.
terms: [Comm Plan, Comm Card, Kneeboard, ATO, SPINS, SOP, Netz, DTC]
sources:
  - title: "Falcon BMS 4.38 Comms & Nav Book (4.38.2), Abschnitt 2 (Comm Plan, Presets, Tactical Net) und BMS User Manual, Briefing (Comm Ladder)"
  - title: "Falcon BMS 4.38 Technical Manual, Abs. 11.4 (IFF-Modes und -Codes kommen mit der Mission in den DTC)"
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 7 bis 8 (Check-in, SPINS für die Verfahren), S. 15 („communication contracts“), Glossar „contract“"
  - title: "Wikipedia: Air tasking order (ATO nach JP 1-02, SPINS als Ergänzung zum formatierten Teil)"
    url: https://en.wikipedia.org/wiki/Air_tasking_order
  - title: "132nd Virtual Wing – Standing SPINS (Beispiel aus der Sim-Praxis)"
    url: https://132nd-vwing.github.io/OPAC-Brief/MISSION%20INFORMATION/OPAC%20STANDING%20SPINS.pdf
---

Ohne Plan weißt du nicht, wer wo spricht. Der **Comm Plan** legt fest, welche Stelle auf welcher Frequenz oder
welchem Preset arbeitet. Er steht im Briefing der Mission und ist die wichtigste Quelle für Frequenzen.

## Comm Plan, Comm Card, Kneeboard

- Die **Comm Card** ist der Comm Plan als Karte: Kanal, Netz, Frequenz. Wie man eine brauchbare baut, steht in der
  Hangar-Karte „So baust du deine Comm Card“.
- Das **Kneeboard** ist in der Sim der Notizblock am Oberschenkel, auf dem Comm Card, Karten und Notizen liegen.
- **Falcon BMS** nennt die Comm Card **Comm Ladder**. Sie steht im Briefing, und der **DTC** lädt die Presets
  automatisch ins Cockpit. Welche Preset-Nummer welche Stelle hat, ist in BMS fest: 2 Ground, 3 Tower, 6 Tactical
  und so weiter.
- **Warbirds** haben eine kurze Karte mit vier Zeilen, je eine pro Kanal.

## Netze

Ein **Netz** ist eine Gruppe von Funkgeräten auf derselben Frequenz. Netze haben oft Namen statt Stellen: **Strike**
ist das Einsatznetz, dazu kommen Tanker, AWACS (in BMS „Tactical“) und das Netz deines **Flights**. So reicht „push
Strike“, und jeder weiß, welcher Kanal gemeint ist.

Die ATP 3-52.4 nennt den Plan, wer was wie meldet, einen **communication contract**. Der Ausdruck gilt laut ATP nur
dort. Gemeint ist dasselbe wie hier: Alle haben vorher abgesprochen, wer auf welchem Netz was sagt.

Ein **Package** ist ein Verband aus mehreren Flights mit gemeinsamer Mission. Das Wort hat noch eine zweite Bedeutung
im Lagebild, siehe [ATC oder AWACS?](/wissen/atc-oder-awacs).

## Wo steht was

| Unterlage | Das steht darin |
|---|---|
| **ATO** (Air Tasking Order) | der Einsatzbefehl für alle Flüge eines Tages. Dein Teil heißt „Frag“. |
| **SPINS** (Special Instructions) | Zusatzanweisungen, die nicht ins feste Raster der ATO passen. Die ATP 3-52.4 verweist dafür ständig auf sie, etwa für Meldungen im Flug, den Codenamen des Bullseye und den Ablauf des Check-ins. |
| **SOP** (Standard Operating Procedures) | die Hausregeln einer Einheit, eines Platzes oder eines Servers: Routen, Einflugpunkte, wer wann spricht |
| **Briefing und Comm Card** | alles für genau diesen Flug |
| **DTC** (Falcon BMS) | der Datenträger, der Presets, Steuerpunkte sowie IFF-Modes und -Codes der Mission ins Cockpit lädt |

Die ATO und die SPINS stammen aus der echten Einsatzplanung. In der Sim gibt es meist nur das Briefing, manchmal
SPINS in Form eines Dokuments oder einer Discord-Seite des Servers. Die SOP der Einheit oder des Servers nennt dann
die Netznamen und die übliche Form der Meldungen.

## Welche Quelle gilt

Widersprechen sich zwei Quellen, gilt von oben nach unten: **Der Lotse, der gerade mit dir spricht**, dann die **Comm
Card der Mission**, dann die **Karte der Sim**, dann die **echte Karte**. Missionsplaner ändern Frequenzen, deshalb
schlägt die Comm Card die allgemeine Platzkarte.

:::layer{layer=community}
Auf Multiplayer-Servern steht der Comm Plan meist im Missionsbriefing, auf dem Discord des Servers oder in der SOP.
Fehlt die Karte, frag im Text-Chat nach, nicht auf Guard.
:::

## Wo dir das begegnet

- [Funkgeräte im Cockpit](/lesson/m2-l1) (Modul 2): die Netze auf den Geräten, Übungen zum Comm Plan.
- [Kanäle, Comm Card und „push“](/lesson/m2-l2) (Modul 2): Presets und die Karte selbst.
- [Welche Frequenz wann?](/lesson/m2-l6) (Modul 2): Frequenzfahrplan und Rangfolge der Quellen.
- [Platzinfos und Verfahren in deiner Sim](/lesson/m2-l9) (Modul 2): SPINS, SOP, Briefing.
- [Lead und Wingman](/lesson/m4-l1) (Modul 4): Wer auf welchem Netz spricht.
- [Kommen alle mit?](/lesson/m4-l2) (Modul 4): push, Netznamen und Zeitlinie.
- [Checkride: Ein Flug im Verband](/lesson/m4-l6) (Modul 4): der Plan, den du im Kneeboard nachschlägst.
