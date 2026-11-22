---
id: m3-l4
module: m3
order: 4
title: Am Bahnende (EOR)
summary: Letzter Halt vor dem Start – Intercom oder Sichtzeichen, Hände sichtbar, Waffen scharf, dann erst zum Tower.
minutes: 6
xp: 70
layer: core
sources:
  - title: "AFMAN 11-2F-16 Volume 3 – F-16 Operations Procedures (2020), Abs. 3.2 Ground Visual Signals, 3.4 EOR Inspections and Before Takeoff Checks"
    url: https://static.e-publishing.af.mil/production/1/af_a3/publication/afman11-2f-16v3/afman11-2f-16v3.pdf
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – Quick Check/Arming, Before Takeoff, EOR (last chance)"
  - title: "Eglin AFB: End of runway crew is first, last stop for Eglin's test aircraft"
    url: https://www.eglin.af.mil/News/Article-Display/Article/814203/end-of-runway-crew-is-first-last-stop-for-eglins-test-aircraft/
  - title: "Misawa AB: End-of-runway inspection ensures safe flying"
    url: https://www.misawa.af.mil/News/Article-Display/Article/402840/end-of-runway-inspection-ensures-safe-flying/
  - title: "Falcon BMS 4.38 Training Manual – EOR-Karten, gelbe Arm-/De-Arm-Fläche"
---

## Der letzte Halt vor der Bahn

Bevor du zum Tower wechselst, hältst du am **Bahnende** (EOR, End of Runway). In der F-16-Vorschrift
heißt das „EOR Inspections and Before Takeoff Checks“. Eine Mannschaft prüft dein Flugzeug ein letztes
Mal (Lecks, lose Teile, Reifen) und macht, falls du Waffen trägst, **die Waffen scharf**. Der Platz
dafür liegt meist nahe dem Pistenende oder beim Verlassen der Abstellfläche. Im Korea-BEM, dem
F-16-Handbuch der koreanischen Luftwaffe von 2005, heißt dieser Bereich :term[LAST CHANCE].

Die Inspektion gehört **direkt vor den Start** (AFMAN 11-2F-16 V3, Abs. 3.4). Bei Alarmstarts entfällt
sie. Auf Plätzen, die nicht zur US Air Force gehören, soll der Pilot sie mit der Wartungseinheit vor
Ort abstimmen.

:::warn
Ein **Funkspruch** für den Halt am Bahnende ist in AFMAN und Korea-BEM nicht belegt. Es gibt kein „in the
arming area“ und kein „arming complete“ als Funkformel. Der Ablauf läuft zwischen dir und der Crew.
:::

---

## Intercom oder Sichtzeichen

Normalerweise sprichst du mit der EOR-Crew wie beim Anlassen über **Intercom** (AFMAN 11-2F-16 V3,
Abs. 3.2). Ohne Intercom stellst du **Blickkontakt zum Chief** her, hältst ihn und arbeitest mit
Sichtzeichen (Abs. 3.4). Der Wortlaut des Intercom-Gesprächs ist nicht festgelegt, belegt ist nur der
Ablauf. Das Beispiel ist deshalb verbreitete Praxis in Sim-Staffeln (`community`):

::call{id=m3-eor-intercom}

---

::drill{id=m3-l4-no-intercom}

---

## Hände sichtbar

Die wichtigste Regel am Bahnende: **Du hältst die Hände sichtbar für das Bodenpersonal**, solange
Quick Check und Arming oder De-Arming laufen (AFMAN 11-2F-16 V3, Abs. 3.4, T-1). Das Korea-BEM nennt
dazu: Waffenschalter **safe**, und keine UFC- oder HUD-Eingaben, solange Personal unter dem Flugzeug ist.
Die Crew arbeitet an Waffen, Sicherungsstiften und Schaltern. Was du jetzt bewegst, kann sie gefährden.

::drill{id=m3-l4-hands}

---

::hangar{id=haende-sichtbar}

---

## Die Reihenfolge am EOR

1. Anhalten, alle **Waffenschalter auf safe**.
2. **Hände in Sicht**, keine Eingaben an UFC oder HUD.
3. Die Crew prüft und bewaffnet.
4. Danach die **Before-Takeoff-Checkliste**. Das Korea-BEM nennt als Merkwort SLIPER: Speedbrake (Luftbremse), Landing
   light, :term[IFF] (Freund-Feind-Kennung), Probe heat (Heizung der Messsonden), Ejection seat
   (Schleudersitz), Radar.
5. Erst dann der Wechsel zum **Tower** und die Meldung „ready for departure“.

Zwei weitere belegte Regeln aus AFMAN 11-2F-16 V3 (Abs. 3.4.1 und 3.4.2): Du rollst **nicht vor einem
Flugzeug vorbei, das mit nach vorn feuernden Waffen scharf gemacht wird**, und die Flugteilnehmer
**prüfen sich gegenseitig** auf richtige Konfiguration und Auffälligkeiten.

::drill{id=m3-l4-order}

---

::drill{id=m3-l4-mutual}

---

::drill{id=m3-l4-taxi-past}

---

::drill{id=m3-l4-terms}

---

## Merke

:::example
**EOR = letzter Halt vor dem Start.** Intercom oder Sichtzeichen, Waffenschalter safe, **Hände sichtbar**,
Crew bewaffnet, dann Before-Takeoff-Checkliste, dann Tower. Kein eigener Funkspruch am EOR.
:::

:::tip
Nach der Landung läuft es umgekehrt: Am EOR wird entwaffnet (De-Arm), mit denselben Regeln für die Hände
(Korea-BEM).
:::

:::sim{sim=bms}
Falcon BMS hat seit Version 4.37 EOR-Karten und eine **gelbe Fläche** am Platz, den Arm-/De-Arm-Bereich.
Einen Funkablauf für das Scharfmachen gibt es dort nicht: Du rollst in die Fläche, die Bodencrew
erledigt es, danach geht es zum Tower. Die Regel mit den Händen gilt trotzdem.
:::

:::sim{sim=dcs}
In DCS gibt es **keinen EOR-Dialog** und keine EOR-Crew. Die Waffen kommen über das Bodencrew-Menü
(Rearm) bzw. aus der Missionsausstattung ans Flugzeug. Wer mit Menschen fliegt, kann den Ablauf
nachspielen. Frag dazu im Missionsbriefing nach.
:::

:::era{era=ww2}
Im Warbird gibt es keinen Halt am Bahnende: In Weltkriegsmissionen (DCS, IL-2) rollst du vom Abstellplatz
direkt zum Start. Die Waffen sind beim Rollen schon geladen, scharf schaltest du sie selbst im Cockpit. Die
Regel aus dieser Lektion bleibt trotzdem nützlich: Am Boden kein Waffenschalter, solange jemand am Flugzeug
steht.
:::

:::sim{sim=srs}
Spielt ein Mitspieler die EOR-Crew, läuft das Gespräch über Intercom oder einen eigenen Kanal, nicht über
die Frequenz von Ground oder Tower.
:::
