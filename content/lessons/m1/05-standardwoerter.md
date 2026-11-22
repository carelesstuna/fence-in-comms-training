---
id: m1-l5
module: m1
order: 6
title: Roger ist nicht Wilco
summary: Die festen Standardwörter – was roger, wilco, affirm, say again & Co. genau bedeuten.
minutes: 8
xp: 80
sources:
  - title: "ICAO Annex 10, Volume II (7. Ausgabe 2016), 5.2.1.5.8 – Standard words and phrases (BREAK, BREAK BREAK, CONFIRM)"
  - title: "ICAO Doc 9432 – Manual of Radiotelephony"
  - title: "FAA Pilot/Controller Glossary (Roger, Wilco, Affirmative, Say Again, Unable, Verify)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/
  - title: "Merriam-Webster: roger (Herkunft)"
    url: https://www.merriam-webster.com/dictionary/roger
---

## Wörter mit genau einer Bedeutung

Im Funk gibt es eine Handvoll fester Wörter, sogenannte **:term[Prowords]** (procedure words). Jedes hat
genau **eine** Bedeutung. Das ist ihr ganzer Zweck: Niemand soll raten müssen, was gemeint ist. Wie sie sich von
den Brevity-Codes unterscheiden, steht auf der Seite [Brevity-Codes und Standardwörter](/wissen/brevity-und-prowords).

Das berühmteste Paar wird ständig verwechselt:

| Wort | Bedeutung | Heißt NICHT |
|---|---|---|
| **roger** | Ich habe deine Übertragung empfangen. | … dass ich es mache. |
| **wilco** | Verstanden, ich führe es aus (*will comply*). | – |

„roger“ ist eine reine Empfangsbestätigung. Wenn der Tower dir einen Auftrag gibt, sagt „roger“ nur:
„Ist angekommen.“ Erst **wilco** sagt: „Mach ich.“

Ein typischer Auftrag ist „report …“: Melde dich, wenn du an einem bestimmten Punkt bist. Die Punkte liegen auf
dem Weg zur Landung, der :term[Platzrunde]. **base** ist der Queranflug, das Stück quer vor der Bahn. **final** ist
der Endanflug in Bahnrichtung, „five mile final“ also fünf Meilen vor der Bahn. **initial** ist die gerade Strecke
auf die Bahn zu, mit der das militärische Einflugverfahren :term[Overhead] beginnt.

::call{id=m1-report-wilco}

:::warn
**„roger wilco“** ist doppelt – wilco schließt roger schon ein. Und **„over and out“** widerspricht
sich: „over“ heißt „ich erwarte eine Antwort“, „out“ heißt „Gespräch beendet“. Im Flugfunk hört
man beide Wörter ohnehin selten.
:::

---

::drill{id=m1-l5-roger-vs-wilco}

---

## Ja, nein, nochmal

- **affirm**: Ja. ICAO schreibt „affirm“ vor. Im US-Militär hörst du meist **„affirmative“**. Ein oft
  genannter Grund für „affirm“: „affirmative“ und „negative“ klingen am Ende gleich. Wenn die erste
  Silbe verloren geht, bleibt nur „-ative“ übrig.
- **negative**: Nein, nicht erteilt oder nicht richtig.
- **:term[confirm]**: Stimmt das? Damit fragt jemand nach, ob er etwas richtig verstanden hat: „confirm
  runway two seven“. Du antwortest mit „affirm“ oder „negative“. Die US-Flugsicherung (FAA) sagt dafür oft
  **verify**.
- **say again**: Bitte wiederholen. Am besten mit dem fehlenden Teil: „say again frequency“, „say
  again altitude“.

:::warn
Sag **niemals „repeat“**. In der Feuerunterstützung von Artillerie und Marine ist „repeat“ das
Kommando, dieselbe Salve **noch einmal abzufeuern**. Wer mit Artillerie und Flugzeugen zugleich
arbeitet, darf da nichts verwechseln.
:::

::call{id=m1-say-again}

---

::drill{id=m1-l5-affirm}

---

::drill{id=m1-l5-input-say-again}

---

## Warten, ablehnen, korrigieren

- **standby**: Warte, ich melde mich gleich. Das ist weder ja noch nein – und du schuldest danach eine
  Antwort.
- **unable**: Ich kann die Anweisung nicht ausführen. Gib kurz den Grund an, z. B. „unable, weather“.
- **correction**: Ich habe mich versprochen, richtig ist … – direkt gefolgt vom richtigen Wert.
- **disregard**: Vergiss meine letzte Übertragung. Sie gilt nicht mehr.

::call{id=m1-correction}

:::layer{layer=community}
**copy** heißt „verstanden“. Im Militär und auf Multiplayer-Servern hörst du es ständig. Ein Standardwort ist es
aber nicht. Gegenüber der Flugsicherung sagst du lieber „roger“.
:::

---

::drill{id=m1-l5-match-situations}

---

::drill{id=m1-l5-build-correction}

---

::hangar{id=roger-herkunft}

---

## Break und break break

**break** trennt Teile einer längeren Nachricht. **break break** trennt nach ICAO auf einer sehr
vollen Frequenz die Nachrichten an **verschiedene** Empfänger. Der Lotse sagt damit: „Ab jetzt
spreche ich mit jemand anderem.“

:::layer{layer=community}
In Sim-Missionen hört man „break break“ oft als Ankündigung einer dringenden Meldung, die Vorrang hat,
z. B. eine Bedrohungswarnung mitten in einen Routine-Funkspruch hinein. Das ist verbreitete Praxis,
in den offiziellen Verfahren ist es so aber nicht festgeschrieben. Nutze es sparsam und nur, wenn es
wirklich eilt.
:::

:::warn
**BREAK mit Richtung** („{wingman|spoken}, break right“) ist im Luftkampf etwas völlig anderes: das
Kommando zur sofortigen Maximalkurve, meist weil eine Rakete kommt. Deshalb: „break“ als
Trennwort im Formationsfunk sparsam verwenden.
:::

---

::drill{id=m1-l5-break-break}

---

## Merke

:::example
**roger** = empfangen. **wilco** = empfangen und wird gemacht. **affirm / negative** = ja / nein.
**confirm** = stimmt das? **say again** (nie „repeat“) plus das, was fehlt. **standby** = gleich. **unable** = geht nicht.
**correction** = richtig ist … **disregard** = vergiss es.
:::

:::sim{sim=dcs}
Die fest aufgenommenen KI-Stimmen in DCS (Lotsen, AWACS, Wingmen) sprechen nicht immer saubere
Phraseologie. Lass dich davon nicht verunsichern. Mit Menschen über SRS solltest du es trotzdem
richtig machen – genau da fällt es auf.
:::
