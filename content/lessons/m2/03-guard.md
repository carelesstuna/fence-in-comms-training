---
id: m2-l3
module: m2
order: 3
title: Guard – die Frequenz, die alle hören
summary: 243.0 und 121.5, der Guard-Empfänger, wann man dort sendet – und wie ein Notruf klingt.
minutes: 7
xp: 70
sources:
  - title: "Wikipedia: Aircraft emergency frequency"
    url: https://en.wikipedia.org/wiki/Aircraft_emergency_frequency
  - title: "FAA Air Traffic Bulletin Feb 2023 (Nutzung von 121.5 und 243.0)"
    url: https://www.faa.gov/Air_traffic/publications/media/atpb_feb_2023.pdf
  - title: "ICAO Annex 10, Volume II, 5.3 – Distress and urgency radiotelephony procedures"
  - title: "FAS: AN/ARC-164 (Guard-Empfänger)"
    url: https://man.fas.org/dod-101/sys/ac/equip/an-arc-164.htm
  - title: "Falcon BMS 4.38 Comms & Nav Book (im BMS-Ordner Docs), S. 31 – VHF-Guard über GD"
  - title: "Falcon BMS Technical Manual 4.38.1 (TO 1F-16CM/AM-34-1-1 BMS), Abs. 2.2 – COM-1-/COM-2-Modusknopf, UFC BOTH/MAIN, Backup-Panel"
  - title: "DCS A-10C II Flight Manual – UHF-Modus GRD, VHF EMER AM/FM; DCS UH-1H Flight Manual – UHF GD XMIT, T/R + G"
  - title: "F-14-SAR-Checkliste, inoffizielle Aufbereitung aus der Sim-Community – Mayday-Muster auf Guard, SAR-Primärfrequenz 282.8"
  - title: "VATSIM Code of Conduct (Rev. 2026.2), A16 und B6 – Guard 121.5, Notfälle nur mit Lotse"
    url: https://vatsim.net/docs/policy/code-of-conduct
---

## Zwei Frequenzen, weltweit gleich

**Guard** ist der Name für die beiden internationalen **Notfrequenzen** der Luftfahrt (mehr auf der Seite
[Guard und Notfunk](/wissen/guard-und-notfunk)):

- **243.0 MHz** im UHF-Band: militärisch
- **121.5 MHz** im VHF-Band: zivil

Sie sind überall auf der Welt dieselben und werden von vielen Stellen ständig abgehört:
Flugsicherung, Radarstationen, AWACS, andere Flugzeuge.

Viele Militärfunkgeräte haben dafür einen **zweiten Empfänger**, der nur Guard hört. Während du die
Tower-Frequenz abhörst, hört dieser Empfänger parallel 243.0 mit. Deshalb erreicht dich ein Ruf
auf Guard fast immer – auch wenn du dich auf der eigentlichen Frequenz verschaltet hast. Nur während du
selbst sendest, ist auch er stumm: Wer sendet, empfängt nicht (Lektion 4).

---

::drill{id=m2-l3-guard-freqs}

---

## Wann man auf Guard sendet

Guard ist **keine Plauderfrequenz**. Gesendet wird dort nur,

1. **im Notfall**, wenn du deine zuständige Stelle nicht erreichst oder keine Zeit zum Suchen hast, und
2. wenn jemand **auf keinem anderen Weg erreichbar** ist, etwa ein Flugzeug, das sich verschaltet hat
   oder in einen Sperrraum (einen gesperrten Luftraum) fliegt.

Wer dich auf Guard ruft, sagt meist dazu, auf welche Frequenz du wechseln sollst. Antworte dann
**dort**, nicht auf Guard:

::call{id=m2-guard-contact}

:::warn
Jeder Funkspruch auf Guard landet bei Dutzenden Empfängern. Ein Radio Check, ein Witz oder eine
Absprache unter Freunden kann dort einen echten Notruf überdecken.
:::

---

::drill{id=m2-l3-what-for}

---

::drill{id=m2-l3-reply}

---

::hangar{id=guard-243}

---

## Mayday und Pan Pan

Für Notfälle gibt es zwei Stufen, beide immer **dreimal** gesprochen:

- **mayday, mayday, mayday**: Notlage. Unmittelbare Gefahr für Flugzeug oder Besatzung, du brauchst
  sofort Hilfe.
- **pan pan, pan pan, pan pan**: Dringlichkeit. Ein ernstes Problem, aber keine unmittelbare Gefahr.

Ein Notruf hat nach ICAO eine feste Reihenfolge: wer (Rufzeichen), was ist los, was hast du vor, wo
bist du (Position, Höhe, Kurs). Wenn Zeit ist, steht davor die gerufene Stelle.

::call{id=m2-mayday}

:::tip
Im US-Militärfunk hörst du für Treibstoff-Notlagen auch „emergency fuel“ (ein Notfall) und „minimum
fuel“ (nur ein Hinweis, dass kaum Verzögerung möglich ist). Notfälle bekommen in der später geplanten Spur A eine eigene
Lektion.
:::

:::tip
Sieht jemand einen Kameraden aussteigen, meldet der Pilot, der die Stelle überfliegt, auf Guard. Die
F-14-:term[SAR]-Checkliste (Suche und Rettung; inoffizielle Aufbereitung aus der Sim-Community) nennt dafür das Muster
„Mayday, Mayday, Mayday. This is … on guard“ mit Absturzstelle und Lage zum TACAN. Nach Kontakt mit dem
Rettungshubschrauber wechselt man auf die SAR-Primärfrequenz **282.8**. Die US Air Force beschreibt in
AFMAN 11-2F-16 V3 (Abs. 7.12) nur das Verfahren, einen Wortlaut gibt sie nicht vor.
:::

---

::drill{id=m2-l3-mayday-or-pan}

---

::drill{id=m2-l3-build-mayday}

---

::hangar{id=abfangen-icao}

---

## Merke

:::example
**Guard = 243.0 (UHF) und 121.5 (VHF).** Hört fast jeder mit, oft über einen eigenen Empfänger.
Senden nur im Notfall oder wenn jemand anders nicht erreichbar ist. Auf einen Guard-Ruf antwortest du
auf der genannten Frequenz.
:::

:::layer{layer=community}
Auf Multiplayer-Servern ist Guard oft überraschend belebt: Begrüßungen, Fragen nach dem Weg,
versehentliche Funksprüche. Lass dich davon nicht anstecken. Wenn auf Guard jemand „mayday“ ruft,
hat das Vorrang – auch in der Sim.
:::

:::sim{sim=srs}
SRS hat eine eigene Tastenbelegung **„Toggle Guard“**, mit der du den Guard-Empfänger des gewählten
Funkgeräts ein- und ausschaltest. Ob Guard im Cockpit oder im Overlay aktiv ist, hängt vom Flugzeug
ab.
:::

:::sim{sim=bms}
In BMS stellt der **COM-1-Modusknopf** am Audio-Panel auf **GD** das Hauptfunkgerät auf UHF-Guard 243.0
ein, du kannst darauf senden. Zum Mithören neben deinem Preset wählst du auf der UFC-Seite COM 1 **BOTH**
(nur Empfang), „MAIN“ hört Guard nicht mit. Steht C&I auf BACKUP, geht GD nicht: Dann wählst du Guard am
Backup-UHF-Bedienteil (Stellung GRD). VHF-Guard (121.5) stellst du mit **GD** am COM-2-Knopf ein. Auf
einem VHF-Preset hörst du Guard nicht parallel mit, deshalb gibt es für VHF-Guard auch kein eigenes
Preset.
:::

:::sim{sim=dcs}
Wie du Guard einstellst, hängt vom Muster ab:
- **A-10C:** Am UHF-Gerät wählst du im Modusschalter **GRD**. Beim VHF-Gerät stellt der Frequenzwähler auf
  **EMER AM** bzw. **EMER FM** automatisch die Guard-Frequenz ein.
- **UH-1H:** UHF-Modusschalter auf **GD XMIT**, dazu den Funktionsschalter auf **T/R + G**, damit der
  Guard-Empfänger mithört.

Die F/A-18 und die F-16 kennst du aus Lektion 1. Die Details stehen im jeweiligen Handbuch.
:::
