---
id: m4-l4
module: m4
order: 4
title: Treibstoff im Verband – ops check, state, joker, bingo
summary: Treibstoff melden, den niedrigsten Stand weitergeben und joker und bingo zur rechten Zeit rufen.
minutes: 10
xp: 90
sources:
  - title: "AFMAN 11-2F-16 Vol. 3 (2020), Abs. 3.30.4 – Ops Checks (PDF-S. 27–28)"
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), PDF-S. 17 (BINGO), 40 (JOKER), 66 (TIGER), 25 (COMMIT)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "AFMAN 11-2F-16 Vol. 3 (2020), Abs. 3.33.1–3.33.3 – Joker, Bingo, Normal Recovery Fuel (PDF-S. 28)"
  - title: "ATP 3-52.4 (2021) – Einsatzbereitschaft YELLOW/RED (S. 19–20)"
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – JOKER, BINGO, TIGER, WHAT STATE"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (JOKER, BINGO, WHAT STATE)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "Wikipedia: Bingo fuel"
    url: https://en.wikipedia.org/wiki/Bingo_fuel
  - title: "Heatblur F-4E Manual (DCS), S. 88–89 – Richtwerte Bingo/Joker"
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 43 – Say Fuel State"
  - title: "Falcon BMS 4.38 User Manual, Abschnitt 10.3.4, S. 220 – Joker der KI (Bingo + 500 lbs)"
  - title: "ATP 1-02.1 (Mai 2020, Change 1 April 2021), PDF-S. 70 – WHAT STATE (Antwortformat mit „minus“ und „by“)"
  - title: "DCS Supercarrier Operations Guide – Marshal-Check-in mit „low state“"
---

## Ops Check

Beim **Ops Check** fragt der Lead, und jeder meldet seinen Treibstoff in Tausend Pfund:

::call{id=m1-ops-check}

Je nach Briefing gehört mehr dazu – zum Beispiel **TIGER**.

**TIGER** heißt laut ATP 1-02.1: genug Treibstoff und Waffen, um einen Commit anzunehmen, also die
genannte Gruppe abzufangen (:term[commit]).

::call{id=m4-ops-check-tiger as=two}

:::layer{layer=community}
**OPS CHECK** ist kein Brevity-Wort der ATP 1-02.1, aber ein **offizieller Verfahrensbegriff** der
USAF-F-16 (AFMAN 11-2F-16 V3, Abs. 3.30.4). Die Vorschrift legt nicht fest, was genau geantwortet wird.
Das Format unterscheidet sich je nach Verband: nur Treibstoff, mit TIGER oder mit einer Waffenliste. Was
gilt, sagt das Missionsbriefing.

Bei Navy und Marines heißt der Treibstoff im Funk meist **state** („low state“, „state five point six“ – so
auch beim Marshal in DCS Supercarrier). Wie der Check im Flight heißt und was dazugehört, regelt dort ebenfalls
die SOP.
:::

---

::drill{id=m4-l4-ops-two}

---

## Wann ist ein Ops Check Pflicht?

Ops Checks sind kein Zufall: Laut AFMAN 11-2F-16 V3, Abs. 3.30.4 gehören sie zu festen Momenten des
Fluges:

- im **Steigflug** oder beim **Level-off** (Übergang vom Steigen in den Horizontalflug) nach dem Start
- wenn die **Außentanks leer** sind
- **vor jedem Abfangen** (Annäherung an ein anderes Flugzeug) bzw. Luftkampfmanöver („engagement“)
- **vor** dem Einflug in eine **Bombenrange** (Übungsgelände für Luft-Boden-Waffen), einmal auf der Range
  (bei mehreren Anflügen) und **danach**

Der Lead löst den Check per Funk oder **Sichtzeichen** aus, die Flugteilnehmer antworten genauso.
Geprüft werden neben dem Treibstoff (Menge und Balance) Triebwerksanzeigen, G-Anzug, Sauerstoff, die
Reserve-Fluglageanzeige (das Ersatzinstrument für den künstlichen Horizont) und die Kabinenhöhe. Mit **Außentanks** ergänzt jeder „tank(s) feeding“ (die Tanks speisen noch) bzw.
„dry“ (leer), bis sie leer gemeldet sind. Daten vom Datalink (dem digitalen Datenaustausch zwischen Flugzeugen, z. B. Link 16) ersetzen den Check nicht.

---

::drill{id=m4-l4-ops-triggers}

---

::drill{id=m4-l4-tanks}

---

## Der niedrigste Stand zählt

Der Flight bleibt zusammen. Also kann er nur so lange bleiben, wie das Flugzeug mit dem **wenigsten**
Treibstoff es erlaubt. Darum merkt sich der Lead beim Ops Check den **niedrigsten Stand** – den
„lowest state“.

Fragt der AWACS mit **:term[WHAT STATE]** nach dem Stand, kommt die Antwort in einem festen Format. Laut
ATP 1-02.1 nennst du erst drei **Raketenzahlen** in fester Reihenfolge, dann **„by“** und den **Treibstoff**
in Tausend Pfund mit einer Nachkommastelle:

:::example
**„{callsign|spoken}, 2-1-4 by 5.4“** (gesprochen „two, one, four by five point four“) heißt:

- **2** – zwei **aktive** Radarraketen (z. B. AMRAAM) mit eigenem Suchradar
- **1** – eine **halbaktive** Radarrakete (z. B. Sparrow), die bis zum Treffer das Radar des Jägers braucht
- **4** – vier **Infrarotraketen** (z. B. Sidewinder), die der Wärme des Ziels folgen
- **by 5.4** – 5.400 lbs Treibstoff

Hat das Flugzeug eine Sorte nicht, heißt die Zahl „zero“. Fehlt Munition für die Kanone, folgt hinter den
Raketen noch **„minus“** („2-1-4 minus by 5.4“). Munition und Sauerstoff nennt man nur auf Nachfrage oder
wenn sie knapp werden.
:::

::call{id=m4-what-state}

:::layer{layer=community}
Die ATP beschreibt die Meldung **eines** Flugzeugs. Wenn der AWACS den Lead fragt, antwortet er laut
Missionsbriefing oft für den ganzen Flight – mit dem **niedrigsten** Treibstoff, weil der Flight zusammenbleibt.
Wie man dabei die Raketen eines ganzen Flights zusammenfasst, regelt ebenfalls das Briefing. ⚠
:::

---

::drill{id=m4-l4-lowest}

---

::drill{id=m4-l4-what-state}

---

## Joker und Bingo

Beide Werte stehen im Missionsbriefing:

- **Bingo** – der Stand, den du für Heimflug und Landung samt Reserve brauchst. Spätestens jetzt geht es
  zurück. Am Träger ist damit meist der Weg zum Ausweichflugplatz gemeint (mehr in der später geplanten
  Spur B).
- **Joker** – eine Schwelle **über** Bingo. Ab hier beendest du das laufende Ereignis – du löst dich vom
  Gefecht oder brichst ab – und fängst kein neues an. Der Rest reicht für den übrigen Flug, ohne dass Bingo
  mitten im Einsatz kommt. Es kann auch mehrere Joker-Stände geben.

Wer eine Schwelle erreicht, meldet sie **ungefragt** – das ist einer der Fälle, in denen ein Wingman
von sich aus funkt:

::call{id=m4-joker}

Erreicht einer Bingo, schickt der Lead den **ganzen Flight** nach Hause:

::call{id=m4-bingo-rtb}

:::tip
Als Wingman verbrauchst du meist **mehr** Treibstoff als der Lead: Du regelst ständig nach, um deine
Position zu halten. Rechne also damit, dass du zuerst bei Joker bist.
:::

---

::drill{id=m4-l4-match}

---

::drill{id=m4-l4-decide-joker}

---

::drill{id=m4-l4-decide-bingo}

---

::drill{id=m4-l4-decide-none}

---

::drill{id=m4-l4-bingo-lead}

---

## Mit der Leitstelle: YELLOW und RED

Joker und Bingo gelten innerhalb deines Flights. Der **AWACS** will dagegen wissen, wie viel Einsatz
dein Flight noch leisten kann. Dafür gibt es drei Stufen für Treibstoff, Waffen oder Sensoren:

- **GREEN** – alles normal
- **YELLOW** – noch genau **eine** Einsatzoption. Das muss der Flight der Leitstelle melden.
- **RED** – **keine** Einsatzoption mehr. Bevor ein Flugzeug RED auf dem Hauptnetz (dem primären Funknetz des Einsatzes)
  meldet, regelt die Leitstelle die Ablösung: Ein anderes Flugzeug übernimmt dann seine Station.

Die Meldung kann kombinieren, z. B. „fuel red, weapons green“. Welche Option „eine“ bedeutet, hängt vom
Flugzeugtyp ab (ATP 3-52.4 (2021), S. 19–20).

---

::drill{id=m4-l4-yellow}

---

::hangar{id=joker-und-bingo-rechnen}

---

## Merke

:::example
**Ops Check: Nummer – Treibstoff – (tiger). WHAT STATE: Raketen – „by“ – Treibstoff.**

Für den ganzen Flight meldet der Lead laut Briefing meist den niedrigsten Treibstoff. Joker liegt über Bingo,
beide stehen im Briefing. Wer sie erreicht, meldet sie ungefragt. Bei Joker endet das laufende Ereignis, bei
Bingo fliegt der ganze Flight nach Hause – der niedrigste Stand bestimmt.
:::

:::sim{sim=bms}
In Falcon BMS gibt es keinen „Ops Check“. Am nächsten kommt der Befehl **„Say Fuel State“** – die
KI-Wingmen antworten in **Hunderten** Pfund: „83“ heißt 8.300 lbs (Comms & Nav Book). Ihren Joker rechnen sie
als Bingo + 500 lbs (BMS User Manual, Abschnitt 10.3.4).
:::
