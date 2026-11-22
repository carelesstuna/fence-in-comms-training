---
id: w-l1
module: track-w
order: 1
title: Vier Knöpfe – Funk im Warbird
summary: Feste Kanäle statt Presets, Senden nur mit der Sprechtaste, Tower und Heimweg über das Funkmenü – und der Notruf über dem Wasser.
minutes: 10
xp: 80
layer: sim
sources:
  - title: "DCS P-51D und P-47D Flight Manuals – SCR-522A, Kanäle A–D, Moduswähler und Mode Lock, Notverfahren über Wasser, ATC-Menü „I'm lost“ (P-51D S. 94–95, 147, 174–175; P-47D S. 43–44, 97–98, 158)"
  - title: "DCS Spitfire LF Mk IX Flight Manual – Funkgerät (dort „TR 1196A“ genannt), Bediengerät Type 4, Reichweite nach Höhe, Request Azimuth (S. 88, 185)"
  - title: "DCS World: ATC-Menü der Warbirds (Scripts/UI/RadioCommandDialogPanel/Config/Common/ATC.lua, Eintrag „I'm lost“)"
  - title: "DCS Mosquito FB VI Flight Manual – Kanalbelegung, Fernbedienung, Peilung (S. 75–76, 130)"
  - title: "DCS Bf 109 K-4, Fw 190 A-8 und D-9 Flight Manuals – FuG 16ZY, ATC-Ablauf, „I'm lost“"
  - title: "DCS World 2.9.31: Funkdateien SCR_522A und FuG_16_ZY unter Config/DynamicRadios"
---

## Kein Frequenzrad

Wer aus der F-16 in eine P-51D umsteigt, sucht zuerst das Frequenzrad – und findet keins. Die amerikanischen
und britischen Jäger flogen ab etwa 1941 mit Funkgeräten mit **festen Kanälen**: vier Knöpfe, beschriftet **A bis
D**. Hinter jedem Knopf lag eine Frequenz, die vor dem Flug eingestellt wurde. (1940 hatte die RAF noch
Kurzwellengeräte mit zwei Kanälen, die deutschen Jäger haben vier Stellungen – siehe unten.)

In DCS übernimmt das die **Mission**: Der Missionsbauer legt fest, welche Frequenz hinter welchem Kanal
liegt. Im Flug wählst du nur noch den Kanal. SRS liest aus, welcher Kanal gewählt ist, und funkt auf dessen
Frequenz – du merkst von der Frequenz also gar nichts.

Was auf welchem Kanal liegt, steht im **Briefing** oder auf der Comm Card im Kneeboard. Die Handbücher von
P-51D und P-47D nennen eine übliche Belegung:

| Kanal | Wofür |
|---|---|
| **A** | Flugzeuge untereinander und die Leitstelle |
| **B** | Tower – Start und Landung |
| **C** | Funkfeuer zum Anpeilen (Homing) |
| **D** | Peilstationen am Boden |

:::aircraft{aircraft=bf109,fw190}
Die deutschen Jäger haben statt Buchstaben **vier Stellungen** am FuG 16ZY: **I** Y-Führung, **II**
Gruppenbefehl, **Δ** Nah-Flugsicherung (der Lotse am Platz), **□** Reichsjäger. Gesprochen wird auf II, Δ
und □. Auch hier legt die Mission die Frequenzen fest.
:::

:::aircraft{aircraft=mosquito}
In der Mosquito gilt dieselbe Belegung A–D. Der Pilot bedient das Funkgerät über eine Fernbedienung, mit dem
Beobachter spricht er über die Bordsprechanlage.
:::

---

::hangar{id=scr-522}

---

::drill{id=w-l1-channels}

---

## REM, R und T

Am Bediengerät gibt es neben den Kanaltasten einen **Moduswähler**:

- **REM** – du empfängst, und gesendet wird nur, solange du die **Sprechtaste** drückst. Das ist der
  Normalbetrieb.
- **R** – nur empfangen.
- **T** – dauernd senden.

**T** ist gefährlich: Wer den Wähler dort stehen lässt, sendet ununterbrochen und blockiert den Kanal für
alle. Die Handbücher von P-51D und Mosquito beschreiben deshalb eine Sperre am Schalter (Mode Lock). Das
P-51D-Handbuch kennt T für zwei Fälle:

- **Sprechtaste ausgefallen:** Mit gesperrtem Wähler steht er auf R; zum Senden drückst du ihn gegen eine Feder
  auf T, beim Loslassen springt er zurück.
- **Kurz vor dem Aussteigen über Wasser:** Sicherungsdraht am Schalter brechen und auf T stellen. Dann sendet das
  Gerät weiter, und die Peilstellen können dich anpeilen (so die übliche Lesart – das Handbuch nennt nur den
  Handgriff ⚠).

:::tip
In SRS gilt dasselbe wie überall: Eine hängende Sprechtaste blockiert die Frequenz. Wer plötzlich nichts
mehr hört, prüft zuerst, ob er selbst sendet.
:::

---

::drill{id=w-l1-mode-t}

---

## Tower und Peilung über das Funkmenü

Der Tower läuft in den DCS-Warbirds über dasselbe **Funkmenü (F5 – ATC)** wie in den Jets: Anlassen,
Rollen und Start anfragen. Das Funkgerät muss an sein und auf dem Kanal stehen, auf dem laut Briefing der
Tower liegt. Dein Flight (Rotte oder Schwarm) folgt dem Führungsflugzeug.

Was fehlt, sind die modernen Navigationshilfen: kein TACAN, kein ILS. Wer die Orientierung verliert, fragt den
Platz nach dem Weg: Im ATC-Menü der DCS-Warbirds heißt der Menüpunkt **„I'm lost“** – der Tower gibt dir einen
Kurs zum Platz. So steht es im P-51D-Handbuch, und auch Fw 190 und die übrigen Warbirds laden dasselbe Menü ⚠.
Ältere Handbücher wie das der Spitfire nennen den Punkt **„Request Azimuth“** – intern heißt die Meldung in DCS
noch so.

:::sim{sim=il2}
IL-2 hat keine Funkfrequenzen. Den Heimatplatz rufst du über das **Befehlsmenü** (Rollen, Start, Landung
anfragen) – eine KI-Platzkontrolle, die nur Menübefehle versteht. Mitspieler hören davon nichts; wie du dich im
Multiplayer zusätzlich auf SRS ansagst, zeigt Lektion 2 dieser Spur.
:::

---

::drill{id=w-l1-azimuth}

---

## Mayday über dem Wasser

Die Handbücher von P-51D und P-47D beschreiben genau, wie der Notruf vor dem Aussteigen über dem Wasser
klingt:

1. Den Flügelmann informieren; das IFF (falls eingebaut) auf EMERGENCY.
2. Auf der **zugewiesenen Frequenz** rufen: **„Mayday“ dreimal, dann das Rufzeichen dreimal**.
3. Wenn Zeit bleibt: **Position (und Uhrzeit), Kurs (und Fahrt), Höhe und Absicht** – aussteigen oder notwassern.
4. Antwortet niemand, auf einer anderen Frequenz eine Bodenstelle suchen.
5. Kurz vor dem Aussteigen den Wähler auf T (siehe oben). Ist die Not vorbei, den Notruf auf derselben Frequenz
   widerrufen.

Vorher Höhe gewinnen, wenn es geht: Höhe bringt Reichweite, und die Peilstellen hören dich besser.

::call{id=w-mayday-warbird}

Das Muster kennst du aus Modul 2: Der heutige Notruf auf Guard folgt derselben Idee – erst „mayday“,
dann wer, wo und was.

---

::drill{id=w-l1-build-mayday}

---

::hangar{id=fug-16zy}

---

## Merke

:::example
Im Warbird wählst du **Kanäle**, keine Frequenzen – was wo liegt, steht im Briefing. Normalbetrieb ist
**REM**, nie **T** stehen lassen – außer kurz vor dem Aussteigen über Wasser. Tower und Heimweg laufen über das
Funkmenü: **I'm lost** (in alten Handbüchern Request Azimuth). Notruf: dreimal **mayday**, dreimal das Rufzeichen,
dann Position, Kurs, Höhe, Absicht.
:::
