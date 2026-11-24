---
id: m3-l6
module: m3
order: 6
title: Departure – raus aus der Platzzone
summary: Wechsel zu Departure, Erstanruf mit Höhen, contact oder monitor, ein Squawk für den Flight und Flight Levels.
minutes: 9
xp: 90
sources:
  - title: "FAA Aeronautical Information Manual – 5-2 Departure Procedures"
  - title: "FAA Aeronautical Information Manual – 5-3-1 ARTCC Communications (Erstanruf: leaving … climbing to …)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap5_section_3.html
  - title: "FAA JO 7110.65 – Kapitel 5 (Radar)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap5_section_1.html
  - title: "FAA JO 7110.65 – 2-1-13 Formation Flights, 2-1-17 Radio Communications (contact, monitor)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_1.html
  - title: "FAA Pilot/Controller Glossary (Radar Contact, Flight Level, Formation Flight)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/
  - title: "UK CAA CAP 413 Radiotelephony Manual (ICAO-Phraseologie: passing, monitor)"
  - title: "IVAO Deutschland – Military Phraseology (Community-Dokument: squawk in sequence)"
    url: https://de.ivao.aero/en/special-operations-en/military-aviation/military-phraseology/
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 8, 16 – Report airborne"
  - title: "DCS P-51D Mustang Flight Manual, S. 174–176 – Funkmenü: ATC (Anlassen, Rollen, Start, Inbound)"
---

## Vom Tower zu Departure

Kurz nach dem Start gibt dich der Tower an **:term[Departure]** ab, die Radarstelle für den Abflug. An
USAF-Plätzen heißt sie oft **RAPCON** (Radar Approach Control). Den Wechsel kennst du aus Modul 1:

::call{id=m1-frequency-change}

Beim **Erstanruf** auf der neuen Frequenz nennst du zwei Höhen: die, die du gerade verlässt
(„leaving …“, in Europa „passing …“), und die, auf die du steigst („climbing to …“). Damit kann der
Lotse prüfen, ob sein Radar dich richtig anzeigt. Im Horizontalflug sagst du stattdessen „level …“.

::call{id=m3-departure-checkin}

---

::drill{id=m3-l6-build-checkin}

---

::drill{id=m3-l6-radar-contact}

---

## Contact oder monitor?

Bei jedem Frequenzwechsel sagt dir das Verb, was du auf der neuen Frequenz tun sollst:

- **contact** (Stelle, Frequenz): wechseln **und melden**. Der neue Lotse wartet auf deinen Erstanruf.
- **monitor** (Stelle, Frequenz): wechseln und **nur zuhören**, bis du gerufen wirst. Die US-Flugsicherung
  nutzt das nur am Boden („monitor tower“), in Europa hörst du es auch in der Luft.
- **remain this frequency**: bleib, wo du bist, auch wenn du einen Wechsel erwartet hast.
- **change to my frequency** (Frequenz): derselbe Lotse, nur eine andere Frequenz (FAA).

Nicht verwechseln mit **push** aus Modul 2: Das ist die Brevity im eigenen Flight. Der Flight wechselt
ohne Antwort, und der Lead prüft auf der neuen Frequenz mit „check“, ob alle da sind.

---

::drill{id=m3-l6-contact-monitor}

---

::drill{id=m3-l6-match-frequency}

---

## Ein Squawk für den ganzen Flight

Was ein Transponder und ein Squawk sind, steht auf der Seite [Squawk, Transponder und IFF](/wissen/squawk-transponder-iff).

Für die Flugsicherung ist eine Formation **ein** Verkehr. In einer Standard-Formation bleibt jeder
Wingman höchstens 1 NM seitlich oder hinter dem Lead und höchstens 100 ft darüber oder darunter. Dann
gilt:

- **Nur der Lead** squawkt den zugewiesenen Code und spricht mit dem Lotsen.
- Alle anderen schalten den Transponder auf **standby** („squawk standby“): Das Gerät bleibt an, antwortet
  aber nicht. Sonst zeigt das Radar mehrere Punkte, wo nur einer sein soll. (Mit dem Standardwort
  „standby“ für „warten“ hat das nichts zu tun.)
- Erst wenn der Flight sich aufteilt, bekommt jedes Flugzeug einen eigenen Code und eigene Freigaben.

:::layer{layer=community}
In deutscher Militärpraxis hört man auch „squawk 2431 in sequence“: Jeder stellt den Code plus seine
Position im Flight ein, also 2431, 2432 und so weiter. Das steht so in Community-Unterlagen (IVAO
Deutschland, VATSIM Germany), eine offizielle Quelle dafür fehlt. Was gilt, sagt das Briefing.
:::

:::sim{sim=dcs}
Die KI-Lotsen in DCS werten den Transponder nicht aus. Mit menschlichen Lotsen (z. B. LotATC) zeigt ein
Flight mit nur einem Code ein ruhigeres Radarbild – wie es gemacht wird, legt das Briefing fest.
:::

:::sim{sim=bms}
Auch die BMS-KI achtet nicht darauf, wer squawkt. Im Verband mit Menschen gilt das Briefing.
:::

---

## Flight Levels

Unterhalb der **Übergangshöhe** fliegst du mit dem Luftdruck vom Platz (Altimeter bzw. QNH aus der ATIS) und
sprichst Höhen in Fuß: „six thousand“. Darüber stellen alle den **Standard-Luftdruck** ein (29.92 inHg
bzw. 1013 hPa) und sprechen in **Flight Levels**: Hunderte Fuß, dreistellig. Flight Level 250 sind
rund 25.000 ft.

In den USA liegt die Übergangshöhe einheitlich bei 18.000 ft. In Europa ist sie von Platz zu Platz
verschieden. Mehr dazu auf der Seite [Höhen und Höhenmesser](/wissen/hoehen-und-hoehenmesser).

Die Steigfreigabe klingt je nach Dialekt anders: in der US-Form „climb and maintain flight level …“, nach ICAO „climb
to flight level …“. Die App spricht standardmäßig überall die US-Form, mit der Einstellung „Kartenabhängig“ in den
[Einstellungen](/einstellungen/flugprofil) in Georgien und am Golf die ICAO-Form. Du liest die Form des Lotsen zurück.

---

::drill{id=m3-l6-input-fl repeat=2}

---

::hangar{id=squawk-parrot}

---

## Abschluss: einmal komplett

Zum Abschluss des Moduls fliegst du den ganzen Weg vom Rollantrag bis zum Erstanruf bei Departure.
Diesmal mit Störungen: Ground lässt dich warten, und auf der Tower-Frequenz bekommt jemand anderes
eine Startfreigabe. Hör genau hin, **wen** der Lotse meint.

---

::scenario{id=m3-s2-taxi-departure}

---

## Merke

:::example
Tower → Departure: Frequenz zurücklesen, umschalten, Erstanruf mit „leaving … climbing to …“.
**radar contact** = du wirst geführt. **contact** = wechseln und melden, **monitor** = wechseln und
zuhören. In der Formation squawkt nur der Lead, die anderen stehen auf standby. Flight Levels gelten
über der Übergangshöhe, mit Standard-Luftdruck.
:::

:::era{era=ww2}
Ein Departure-Radar gibt es im Weltkriegsszenario nicht. In der DCS-P-51D endet der Funk mit dem Platz mit
der Startfreigabe (P-51D-Handbuch, S. 175); danach wechselt der Flight auf die Frequenz bzw. den Kanal aus dem
Briefing. In IL-2 gibt es keine Funkfrequenzen – dort läuft das über den SRS-Kanal, den der Server vorgibt.
:::

:::sim{sim=bms}
In BMS ruft der Lead Departure erst, wenn **der ganze Flight in der Luft** ist (Menüeintrag „Report
airborne“). Departure antwortet mit einem Kurs und „resume own navigation“. Danach wechselt der Flight
auf Tactical (UHF 6). Approach und Departure teilen sich in BMS eine Frequenz (UHF 4).
:::

Damit bist du in der Luft. Was im Verband passiert – Check-in, :term[Fence in], Ops Check –, kommt in Modul 4.
