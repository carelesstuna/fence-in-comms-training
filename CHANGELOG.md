# Changelog

What changed for users, newest first. The release workflow copies the section of the tagged version into the
GitHub release ("What's new"). Deutsch jeweils darunter.

## 0.3.0 – 2026-11-24

**New**

- Module 2 has its own lesson "Bullseye – Positionen im Funk": reading and saying bullseye positions, magnetic
  variation (east is least, west is best), what a forgotten degree costs, bullseye displays in the cockpit – with
  ten exercises plus exam and placement questions.
- Lesson 2.7 (approach charts) shows a randomized airfield and approach chart right in the text. Hover over or tap a
  highlighted area and a card explains it with the values of exactly this chart.
- New memory drill for readbacks: the call appears in time with the radio voice and fades away again – eight levels
  from "text stays" to "listen only", with a kneeboard (M1-L6, M3-L3 and the 9-line in Track C).
- You can now speak in free-text exercises too ("Say the frequency …", "Spell …"), e.g. in the daily drill and in
  module exams.
- Sample documents (frag, comm card, SPINS, SOP), a topic page with readability 1 to 5 to listen to, and the
  Tenerife 1977 radio traffic re-enacted with overlapping transmissions.
- Every exercise shows a small reference line ("Ref m5-l1 · 2/20 · …"). Click copies it – paste it into an issue
  when you report a problem.

**Changed**

- Your progress carries over: if you finished module 2 in 0.2, it stays finished, and module 3 and Track W stay
  open. The new bullseye lesson waits for you as an extra. Modules you finish from now on stay finished when lessons
  are added later.
- Typed answers: numbers count in words wherever the radio call has words ("Enfield one one", not "Enfield 1-1").
  Digits where words belong cost points and show a hint, and every input field says what is accepted. Track C still
  takes digits for all numbers (grids, altitudes, laser codes). Spoken answers are not affected.
- Speech input shows recognized numbers the way you say them on the radio. Known limitation: the app cannot tell
  "three five zero point five" from "three hundred fifty point five" – the recognizer writes both as digits.
- Radio exercises and scenarios share one layout: a bar with callsign, location and radio ("Ground · 121.800 VHF"),
  then situation and task, then "on frequency" with what was said before your turn. Situation and task no longer give
  away words of the answer.
- Radio sound: readability 1–5 and interference per transmission (otherwise randomly 4 or 5), louder background
  noise and a profile option "reception: realistic / always clear". Natural pauses (before "correction", after the
  call-up, the 9-line line by line), a short burst of noise before the voice and a gap between calls. The radio
  check comes with a sample at the matching readability.
- The profile is split into "Progress" and "Settings" (flight profile, listening, speaking); old links redirect.
- Glossary pop-ups close with ×, Escape or a click outside, and only one is open at a time.

**Fixed**

- Content: AWACS altitude corrected, weather and traffic information is acknowledged instead of read back, radio
  horizon as a lookup table instead of a square-root calculation, guard exercise with a concrete situation, new
  glossary entries (frag, closed traffic, progressive taxi, magnetic variation).
- The ICAO identifier on approach charts was empty ("Kutaisi ()").
- Speech input: callsigns recognized as "Enfield 1,1" or "1/1" count as "Enfield one one".
- Setup no longer overflows, and microphone names load by themselves.

### Deutsch

**Neu**

- Modul 2 hat eine eigene Lektion „Bullseye – Positionen im Funk“: Bullseye-Angaben lesen und sprechen, Missweisung
  (east is least, west is best), was ein vergessenes Grad kostet, Bullseye-Anzeigen im Cockpit – mit zehn Übungen
  sowie Prüfungs- und Einstufungsfragen.
- Lektion 2.7 (Anflugkarten) zeigt eine gewürfelte Platz- und Anflugkarte direkt im Text. Fährst du über einen
  markierten Bereich oder tippst ihn an, erklärt ihn ein Kärtchen mit den Werten genau dieser Karte.
- Neue Merk-Übung zum Readback: Der Funkspruch erscheint im Takt der Funkstimme und verschwindet wieder – acht Stufen
  von „Text bleibt“ bis „nur hören“, mit Kneeboard (M1-L6, M3-L3 und der 9-Line in Spur C).
- Auch in Freitext-Übungen („Sprich die Frequenz …“, „Buchstabiere …“) kannst du jetzt sprechen, etwa im Funk-Drill
  des Tages und in Modulprüfungen.
- Musterdokumente (Frag, Comm Card, SPINS, SOP), eine Themenseite „Lesbarkeit 1 bis 5 zum Anhören“ und der
  Funkverkehr von Teneriffa 1977, nachgestellt mit Überlagerung.
- Unter jeder Übung steht eine kleine Referenzzeile („Ref m5-l1 · 2/20 · …“). Ein Klick kopiert sie – füge sie in
  ein Issue ein, wenn du einen Fehler meldest.

**Geändert**

- Dein Fortschritt kommt mit: Wer Modul 2 in 0.2 abgeschlossen hatte, behält es erledigt, Modul 3 und Spur W bleiben
  offen. Die neue Bullseye-Lektion wartet als Zusatz. Module, die du ab jetzt abschließt, bleiben erledigt, auch wenn
  später Lektionen dazukommen.
- Getippte Antworten: Zahlen zählen in Worten, wo der Funkspruch Worte hat („Enfield one one“, nicht „Enfield 1-1“).
  Ziffern, wo Worte hingehören, kosten Punkte und bringen einen Hinweis; unter jedem Eingabefeld steht, was gilt.
  Spur C nimmt weiter Ziffern für alle Zahlen (Grids, Höhen, Laser-Codes). Gesprochene Antworten betrifft das nicht.
- Die Spracheingabe zeigt erkannte Zahlen so, wie man sie im Funk spricht. Bekannte Grenze: Ob du „three five zero
  point five“ oder „three hundred fifty point five“ gesagt hast, kann die App nicht unterscheiden – die Erkennung
  schreibt beides als Ziffern.
- Funk-Übungen und Szenarien haben einen festen Aufbau: oben eine Leiste mit Rufzeichen, Ort und Funk („Ground ·
  121.800 VHF“), darunter Lage und Auftrag, dann „Auf der Frequenz“ mit dem, was vor deinem Zug gesendet wurde. Lage
  und Auftrag verraten keine Lösungswörter mehr.
- Funkklang: Lesbarkeit 1–5 und Störungen je Übertragung (sonst gewürfelt 4 oder 5), lauteres Grundrauschen und im
  Profil „Empfang: realistisch / immer klar“. Natürliche Sprechpausen (vor „correction“, nach der Anrufgruppe, beim
  9-Line Zeile für Zeile), kurzes Rauschen vor der Stimme und eine Pause zwischen Funksprüchen. Der Radio Check
  kommt mit einer Hörprobe in passender Lesbarkeit.
- Das Profil ist geteilt in „Fortschritt“ und „Einstellungen“ (Flugprofil, Hören, Sprechen); alte Links leiten
  weiter.
- Glossar-Fenster schließen mit ×, Escape oder einem Klick daneben, und es ist immer nur eines offen.

**Behoben**

- Inhalte: AWACS-Höhe richtiggestellt, Wetter und Verkehrsinfos werden quittiert statt zurückgelesen, Funkhorizont als
  Merktabelle statt Wurzelrechnung, Guard-Übung mit konkreter Lage, neue Glossar-Einträge (Frag, closed traffic,
  progressive taxi, Missweisung).
- Die ICAO-Kennung auf Anflugkarten war leer („Kutaisi ()“).
- Spracheingabe: Als „Enfield 1,1“ oder „1/1“ erkannte Rufzeichen zählen als „Enfield one one“.
- Das Setup läuft nicht mehr über, und Mikrofonnamen laden von selbst.

## 0.2.0 – 2026-11-22

- First start: a new step "Hören & Sprechen" sets up radio voices and speech input in one place – download,
  listening sample, model choice, microphone selection and a microphone test. A running download continues when
  you move on.
- Radio calls are synthesized as soon as a page shows them, not only when you press play. Voices stay in memory
  only, nothing is written to disk.
- Speech input: a callsign recognized as "Enfield 1.1" now counts as "Enfield one one" when that yields the expected
  number.

### Deutsch

- Erster Start: Ein neuer Schritt „Hören & Sprechen“ richtet Funkstimmen und Spracheingabe an einer Stelle ein –
  Download, Hörprobe, Modellwahl, Mikrofon und Mikrofontest. Ein laufender Download geht weiter, wenn du weiterklickst.
- Funksprüche werden gerechnet, sobald eine Seite sie zeigt, nicht erst beim Abspielen. Die Stimmen bleiben nur im
  Arbeitsspeicher, auf die Platte kommt nichts.
- Spracheingabe: Ein als „Enfield 1.1“ erkanntes Rufzeichen zählt als „Enfield one one“, wenn so die erwartete Zahl
  herauskommt.

## 0.1.0 – 2026-11-22

First public release: modules 1–5, Track C (CAS/JTAC) and Track W (warbirds), every call dissected into its parts,
randomized missions, scenarios with a kneeboard, placement tests, module exams and checkrides. Optional speech
recognition (whisper.cpp) and radio voices (Kokoro-82M) run entirely on your own PC.

### Deutsch

Erste öffentliche Version: Module 1–5, Spur C (CAS/JTAC) und Spur W (Warbirds), jeder Funkspruch in seine Teile
zerlegt, gewürfelte Missionen, Szenarien mit Kneeboard, Einstufungstests, Modulprüfungen und Checkrides. Spracherkennung
(whisper.cpp) und Funkstimmen (Kokoro-82M) laufen auf Wunsch komplett auf deinem eigenen PC.
