---
id: m2-l1
module: m2
order: 1
title: Funkgeräte im Cockpit
summary: UHF, VHF-AM, VHF-FM – welches Band wofür da ist und was in F-16, Hornet, Tomcat, A-10 und deinen weiteren Mustern steckt, vom Warbird bis zum Hubschrauber.
minutes: 8
xp: 80
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (UNIFORM, VICTOR, FOX MIKE)"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "ICAO Annex 10 Band V, Abschnitt 4.1 (Flugfunkband VHF 117,975–137 MHz)"
  - title: "FAS: AN/ARC-164 UHF Radio"
    url: https://man.fas.org/dod-101/sys/ac/equip/an-arc-164.htm
  - title: "FAS: AN/ARC-222 VHF Radio"
    url: https://man.fas.org/dod-101/sys/ac/equip/an-arc-222.htm
  - title: "Wikipedia: AN/ARC-210"
    url: https://en.wikipedia.org/wiki/AN/ARC-210
  - title: "DCS F/A-18C Early Access Guide (Funkgeräte, Kapitel Communications)"
    url: https://www.digitalcombatsimulator.com/en/downloads/documentation/dcs-hornet_early_access_guide_en/
  - title: "Heatblur F-14 Manual: AN/ARC-159 UHF"
    url: https://f14.manuals.heatblur.se/f14ab/systems/nav_com/com/uhf.html
  - title: "Heatblur F-14 Manual: AN/ARC-182 V/UHF"
    url: https://f14.manuals.heatblur.se/f14ab/systems/nav_com/com/vuhf.html
  - title: "DCS F-16C Early Access Guide (liegt DCS bei), S. 86, 251–263"
  - title: "Falcon BMS Technical Manual (TO 1F-16CM/AM-34-1-1 BMS), Abs. 2.2.2 – COMM-1-/COMM-2-Modusknopf, Guard, ARC-186; TO 1F-16CM/AM-1 BMS, Abs. 2 – Guard-Modi"
  - title: "Falcon BMS F-15C Training Manual – Comm Ladder, zwei UHF-Geräte (PRI/AUX)"
  - title: "Falcon BMS 4.38 Comms & Nav Book, Abschnitt UHF-Presets (Preset 6: Tactical mit dem AWACS-Controller des Packages)"
  - title: "DCS User Manual, Abschnitt Mission Editor (Frequenz und Modulation je Gruppe)"
  - title: "DCS F/A-18C Early Access Guide (liegt DCS bei), S. 46, 74, 153–155"
  - title: "DCS A-10C II Flight Manual (liegt DCS bei), S. 16, 64, 167–172, 524–525, 791–792"
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 7, 31–32; Technical Manual, S. 56–57 (UHF für Stellen außen, VHF für den Flight); Training Manual, S. 27, 37"
  - title: "Heatblur F-14 Manual (liegt DCS bei), S. 35, 304–319; Heatblur F-4E Manual, S. 112, 151–153, 406–408"
  - title: "DCS-SRS: Flugzeug-Exportskripte (F16C.lua, A10C.lua, A10C2.lua)"
    url: https://github.com/ciribob/DCS-SimpleRadioStandalone/tree/master/Scripts/DCS-SRS/Scripts/DCS-SRS-Modules
  - title: "DCS Flight Manuals P-51D, P-47D, Spitfire LF Mk IX, Bf 109 K-4, Fw 190 A-8/D-9, Mosquito FB VI, F-86F, MiG-15bis, F-5E-3, AJS37, UH-1H, Mi-8MTV2, Ka-50 Black Shark 3, AH-64D – Abschnitte Funk"
  - title: "DCS World 2.9.31: Funkdateien unter Config/DynamicRadios und Mods/aircraft/*/VOIP_Radios (F-15C, MiG-29, Su-27, Su-25, Mirage F1); Config/DynamicRadios/Presets T_1154.lua und R_1155.lua (Kurz- und Mittelwelle)"
  - title: "DCS World: Scripts/UI/RadioCommandDialogPanel/Config/Common/ATC.lua (Menüpunkt „I'm lost“, geladen über FighterWWII.lua der Warbirds); DCS P-51D Flight Manual S. 174–175"
  - title: "DCS F/A-18C Flight Manual (liegt DCS bei), Gashebel: Funkschalter COMM1 – COMM2 – MIDS A – MIDS B"
  - title: "Science Museum Group Collection, Objekt co202100: TR1196, Kurzwellen-Sender/Empfänger mit vier Quarzkanälen"
---

## Drei Bänder, drei Welten

Ein Kampfjet hat fast immer **mehr als ein Funkgerät**. Das liegt daran, dass verschiedene Partner
auf verschiedenen Frequenzbändern funken. Die Tabelle nennt die Bänder des Flugfunks; die Funkgeräte im
Cockpit können oft mehr (siehe die Kästen unten).

| Band | Bereich des Flugfunkbands | Modulation | Wer funkt dort typischerweise? |
|---|---|---|---|
| **UHF** | 225–400 MHz | AM | Militär: Militärplätze, Tanker, in BMS auch der AWACS |
| **VHF** | 118–137 MHz | AM | zivile Luftfahrt und zivile Lotsen, in DCS oft auch der AWACS |
| **VHF-FM** | 30–88 MHz | FM | Bodentruppen, :term[JTAC] (Fliegerleitoffizier am Boden, der :term[Luftnahunterstützung] führt) |

**UHF** ist das militärische Hauptband. Militärflugplätze haben dort ihre Frequenzen. **VHF-AM**
brauchst du, sobald du mit zivilen Stellen sprichst. **VHF-FM** ist der Bereich der Heeresfunkgeräte.
Wer Luftnahunterstützung fliegt, will die Soldaten am Boden direkt erreichen. Die Seite
[Frequenzbänder, Modulation und Reichweite](/wissen/frequenzbaender-und-reichweite) fasst Bänder, AM gegen FM und die
Reichweite zusammen. Warum VHF und UHF nur bis zum Horizont tragen und Berge abschatten, steht in Modul 1, Lektion 5
(Funk und Physik).

Und der **eigene Flight**? Dafür gibt es keine feste Regel – welches Gerät er nutzt, legt der **:term[Comm Plan]** im Briefing fest – die Liste, wer auf welcher Frequenz funkt. In der F-16 läuft er meist über VHF, das DCS-Handbuch der A-10C nennt UHF.

Beim **AWACS** hängt es von der Sim ab: In BMS liegt der AWACS-Controller auf UHF (:term[Preset] 6, das Tactical-:term[Netz]).
In DCS legt die Mission die Frequenz und die Modulation jeder Gruppe fest, das A-10C-Handbuch beschreibt als übliche
Aufteilung eine eigene VHF-AM-Frequenz für den AWACS. Auch hier gilt der Comm Plan deiner Mission.

Damit niemand lange erklären muss, welches Gerät gemeint ist, gibt es Brevity-Wörter:

- **uniform**: das UHF-Gerät
- **victor**: das VHF-AM-Gerät
- **fox mike**: das VHF-FM-Gerät

---

::drill{id=m2-l1-match-bands}

---

## Frequenz UND Modulation

**AM** (Amplitudenmodulation) und **FM** (Frequenzmodulation) sind zwei verschiedene Arten, die
Stimme auf die Funkwelle zu packen. Ein Empfänger versteht nur die Art, auf die er eingestellt ist.
Gleiche Frequenz mit falscher Modulation heißt: **kein Kontakt.**

So sieht eine Übergabe aus, bei der es darauf ankommt:

::call{id=m2-handoff-fm}

---

::drill{id=m2-l1-modulation}

---

::drill{id=m2-l1-build-fm-readback}

---

::drill{id=m2-l1-input-fm}

---

::drill{id=m2-l1-input-uniform}

---

::drill{id=m2-l1-input-victor}

---

## Was steckt in deinem Cockpit?

Jedes Muster ist anders ausgestattet. Die Kästen unten zeigen die Flugzeuge, die du in deinem Profil
gewählt hast. Bezeichnungen wie AN/ARC-164 sind schlicht die Typnamen der Funkgeräte. Die Handgriffe, die
bei allen gleich sind, fasst die Seite [Funkgerät bedienen](/wissen/funkgeraet-bedienen) zusammen.

Zwei Wörter stehen in fast jedem Kasten und werden erst in den nächsten Lektionen genau erklärt:
**:term[Presets]** sind im Funkgerät gespeicherte Frequenzen, die du über eine Nummer wählst – im Funk
heißt sie „:term[Kanal]“ („channel“ oder „button“; Lektion 2).
**:term[Guard]** ist die Notfrequenz, 243.0 MHz auf UHF und 121.5 MHz auf VHF, die viele Geräte
mithören (Lektion 3). Tippe die Wörter an, wenn du sie im Kasten brauchst.

:::aircraft{aircraft=f16}
**F-16C (DCS)**
- **COM1:** AN/ARC-164, UHF 225–399,975 MHz, 20 :term[Presets]. Ein eigener :term[Guard]-Empfänger hört 243.0 mit,
  wenn auf der UHF-Seite **BOTH** (Hauptempfänger und Guard) statt **MAIN** (nur der Hauptempfänger)
  gewählt ist. Über das Backup-Bedienteil an der linken
  Konsole lässt es sich auch ohne :term[UFC] bedienen.
- **COM2:** AN/ARC-222, VHF, 20 Presets. Senden und Empfangen auf AM 116–151,975 MHz (108–115,975 nur
  Empfang) und FM 30–87,975 MHz. Das ist der Bereich des Geräts, größer als das zivile Flugfunkband
  (118–137 MHz). In Stellung **GD** stimmt es direkt auf 121.5.
- **Senden:** Der Funkschalter am Gashebel wählt das Gerät: **vorn = VHF (COM2), hinten = UHF
  (COM1)**.
- Bedienung über UFC und DED (Tastenfeld und kleine Anzeige vorn im Cockpit; Tasten COM 1 und COM 2).
- **Falcon BMS:** Das BMS-Handbuch nennt für das VHF-Gerät das **AN/ARC-186**, nicht das ARC-222 der DCS-F-16.
  Auch die Schalterrichtung ist nicht einheitlich dokumentiert: Das DCS-Handbuch beschreibt „hinten =
  UHF, vorn = VHF“, der BMS-Cockpit-Interaction-Guide ordnet „oben = UHF, unten = VHF 1“ zu. ⚠ Welche
  Richtung in welcher Sim welches Gerät sendet, solltest du im Cockpit nachsehen.
:::

:::aircraft{aircraft=fa18}
**F/A-18C**
- **COMM 1 und COMM 2:** zwei gleiche AN/ARC-210. In DCS je 20 :term[Presets], Bereich 30–400 MHz, AM und FM.
- Am Wahlknopf gibt es neben den Presets **M** (manuelle Frequenz), **G** (:term[Guard] – je nach zuletzt
  genutztem Band 121.5 oder 243.0), **C** (Cue) und **S** (Seefunk).
- Am :term[UFC] (Tastenfeld vorn im Cockpit): **:term[GRCV]** schaltet den Guard-Empfänger zu, **:term[SQCH]** die Rauschsperre, dazu AM/FM.
- **Senden:** Funkschalter am Gashebel **vorn = COMM 1, hinten = COMM 2**. Der Schalter hat noch zwei
  Stellungen: **unten = MIDS A, oben = MIDS B** – Sprechfunk über das Datenlink-System (Link 16), nur wenn die
  Mission bzw. SRS ihn nutzt.
- Weil beide Geräte gleich sind, musst du dir merken, auf welchem welches :term[Netz] (Gruppe auf einer Frequenz) liegt. Die
  :term[Comm Card] hilft.
:::

:::aircraft{aircraft=f14}
**F-14 Tomcat**
- **AN/ARC-159 („UHF 1“)**: an der linken Konsole des **Piloten**. UHF 225–399,975 MHz, 20 :term[Presets],
  hört :term[Guard] 243.0 mit.
- **AN/ARC-182 („V/UHF 2“)**: an der linken Konsole des **:term[RIO]** (Besatzung im Rücksitz). Bänder 30–88, 108–156, 156–174 und
  225–399,975 MHz, 30 nutzbare Presets. Die Modulation wählt das Gerät meist selbst, nur auf UHF ist
  AM/FM umschaltbar.
- **Senden können beide auf beiden Geräten:** Der Pilot wählt mit dem Funkschalter am Gashebel zwischen
  ICS (:term[Intercom], die Bordsprechanlage), UHF 1 und UHF 2, der RIO mit dem Wahlschalter XMTR SEL und
  drückt die Fußtaste.
- Wer welches Gerät **einstellt**, ist also fest verteilt, wer wann **spricht**, klärt die Besatzung
  (später geplante Spur D).
:::

:::aircraft{aircraft=f4}
**F-4E Phantom II**
- **Ein** UHF-Sendegerät (COMM, 225–399,975 MHz, 18 :term[Presets]) plus ein **:term[AUX]-Empfänger** (Zusatzempfänger), der nur hört
  (20 Presets, im Cockpit nicht änderbar), dazu :term[Guard] 243.0.
- Das Bedienteil gibt es vorn und hinten. Wer es gerade bedient, wird mit der Taste **COMM CMD**
  übergeben.
- **Senden:** Pilot und :term[WSO] (Besatzung im Rücksitz) nutzen den Schalter am Gashebel – **hinten = :term[Intercom]**
  (Bordsprechanlage), **vorn = Funk**.
:::

:::aircraft{aircraft=a10}
**A-10C** hat drei Geräte: UHF (AN/ARC-164, 20 :term[Presets]), VHF-AM (AN/ARC-186) und VHF-FM (AN/ARC-186,
30–76 MHz). Für die **A-10C II** ist ein AN/ARC-210 anstelle des VHF-AM-Geräts vorgesehen. Das
SRS-Exportskript kennt es bereits, das mitgelieferte DCS-Handbuch nennt es noch „coming soon“. Prüf
im Cockpit, welches Gerät deine Version zeigt.

- **Senden:** Mikrofonschalter am Gashebel **vorn = VHF-AM, hinten = VHF-FM, unten = UHF**.
- **Typische Aufteilung laut DCS-Handbuch:** eigener Flight auf UHF, AWACS und ATC auf VHF-AM, JTAC auf
  VHF-FM.

Das FM-Gerät ist kein Zufall: Die A-10 ist für Luftnahunterstützung gebaut und spricht mit Soldaten
am Boden auf deren Frequenzen.
:::

---

## Weitere Muster: vom Warbird bis zum Hubschrauber

Hier stehen die übrigen Muster aus der Flugzeugliste im Profil. Fliegst du keins davon, kannst du die
Seite überspringen – die Kästen sind dann eingeklappt. Was „Presets“ und „Guard“ sind, steht auf der
Seite davor; die Wörter sind auch hier antippbar.

:::era{era=ww2}
**Kanäle statt :term[Presets].** In den westalliierten Jägern ab etwa 1941 (P-51, P-47, Spitfire, Mosquito)
stellst du keine Frequenz ein: Das VHF-Gerät hat **vier feste Kanäle** (A–D). Das FuG 16ZY von Bf 109 und Fw 190
hat vier Stellungen mit einem Feintrieb. Welche Frequenz dahinter liegt, legt in DCS die **Mission** fest; im Flug
lässt sie sich nicht ändern. Was auf welchem Kanal liegt, steht im **Briefing** oder auf dem Kneeboard. Ganz
früh im Krieg sah es noch anders aus: 1940 flogen die RAF-Jäger mit dem TR.9D und nur zwei Kanälen (Hangar-Karte
„Ein Kanal für eine ganze Staffel“ in Modul 4, Lektion 1). In IL-2 gibt es gar kein Funkgerät zum Einstellen – dort
wählst du in SRS einen Kanal (Lektion 5).
:::

:::aircraft{aircraft=p51,p47}
**P-51D und P-47D**
- **SCR-522A**, VHF-AM 100–156 MHz, vier Kanaltasten **A–D**. Die Frequenzen setzt die Mission.
- Belegung laut DCS-Handbuch: **A** Flugzeuge und Leitstelle, **B** Tower, **C** Funkfeuer (Homing: du fliegst die Quelle des Signals an),
  **D** Peilstationen (Bodenstellen, die die Richtung deines Funkspruchs bestimmen). Was in deiner Mission gilt, steht im
  Briefing.
- Moduswahl: **REM** sendet nur bei gedrückter Sprechtaste, **R** empfängt nur, **T** sendet dauernd.
  **T** nie stehen lassen – sonst blockierst du den Kanal für alle.
- In der P-47D gehört ein Funkcheck mit ATC zur Vorflugkontrolle.
- Orientierung verloren? Im ATC-Menü der DCS-Warbirds heißt der Punkt **„I'm lost“** – der Tower peilt dich an
  und gibt dir einen Kurs zum Platz.
:::

:::aircraft{aircraft=spitfire}
**Spitfire Mk IX**
- **VHF** 100–156 MHz, vier feste Kanäle **A–D**, gewählt am Bediengerät „Type 4“ links im Cockpit. Modi T, R
  und REM wie beim SCR-522. Historisch war das der Vierkanal-VHF-Satz TR.1143 bzw. das amerikanische SCR-522.
  ⚠ Das DCS-Handbuch nennt das Gerät „TR 1196A“ – im Original war das TR.1196 ein Kurzwellengerät.
- Die Reichweite wächst mit der Höhe. Laut Handbuch etwa 30 Meilen auf 1.000 ft, 120 Meilen auf
  10.000 ft und 180 Meilen auf 20.000 ft – der Funkhorizont (Hangar-Karte in Modul 1, Lektion 5).
- Orientierung verloren? Im ATC-Menü der DCS-Warbirds heißt der Punkt **„I'm lost“** – der Tower peilt dich an
  und gibt dir einen Kurs zum Platz. Ältere Handbücher nennen ihn noch „Request Azimuth“.
:::

:::aircraft{aircraft=bf109,fw190}
**Bf 109 K-4 und Fw 190 A-8/D-9**
- **FuG 16ZY**, VHF um 40 MHz, **vier feste Stellungen**: **I** Y-Führung, **II** Gruppenbefehl,
  **Δ** Nah-Flugsicherung (der Lotse am Platz), **□** Reichsjäger. Die Frequenzen legt die Mission
  fest; der Feintrieb stimmt nur innerhalb einer Stellung nach.
- Gesprochen wird auf **II, Δ und □**. In der D-9 dient Stellung I nicht dem Sprechfunk.
- Orientierung verloren? Im ATC-Menü heißt der Punkt wie in allen DCS-Warbirds **„I'm lost“**.
:::

:::aircraft{aircraft=mosquito}
**Mosquito FB VI**
- Zwei Mann Besatzung, Pilot und Beobachter, verbunden über eine **Bordsprechanlage**.
- Der Pilot bedient das Funkgerät über eine **Fernbedienung**.
- Belegung laut Handbuch: **A** Leitstelle und andere Flugzeuge, **B** ATC, **C** Homing (ein Funkfeuer anfliegen), **D**
  Peilung (eine Bodenstelle bestimmt die Richtung deines Funkspruchs).
- Das Handbuch nennt als Gerät T.1154/R.1155 im Kurz- und Mittelwellenbereich. Das ist kein Widerspruch zu den
  Kanälen A–D: Wie in den RAF-Mustern üblich gab es **zwei Anlagen** – den VHF-Sprechfunk mit den Kanälen A–D
  für den Piloten und die T.1154/R.1155 (vorwiegend Morsefunk) beim Beobachter. Die Funkdateien von DCS kennen
  beide Gerätearten. ⚠ Im Cockpit noch nicht geprüft.
:::

:::aircraft{aircraft=f86}
**F-86F Sabre**
- **AN/ARC-27**, UHF, **18 :term[Presets]** – die Frequenzen setzt die Mission.
- Netzschalter: **T/R** (Senden und Empfangen) oder **T/R+G REC** (mit zweitem Empfänger). Die
  Stellung :term[ADF] (Funkkompass) ist in DCS nicht umgesetzt.
- Gesendet wird mit der Sprechtaste am Gashebel.
- ⚠ Das Handbuch nennt 255–339,9 MHz, die Funkdatei des Spiels 225–399,9 MHz.
- In IL-2 Korea (F-86A-5) gibt es kein Funkgerät zum Einstellen.
:::

:::aircraft{aircraft=mig15}
**MiG-15bis**
- **RSI-6**, Kurzwelle **3,75–5 MHz**. Eingestellt wird eine **Wellenzahl**, keine Frequenz. Gemeint ist
  eine Kanalnummer (nicht die Wellenzahl 1/λ aus der Physik): Wellenzahl = Frequenz in kHz ÷ 25 (150 = 3.750 kHz,
  200 = 5.000 kHz).
- Die Briefing-Frequenz musst du auf **±5 kHz** genau treffen. Das Kneeboard führt Wellenzahl (CH) und
  Frequenz (FR) nebeneinander.
- **Nur ein Gerät:** Wie jedes Flugfunkgerät sendet oder empfängt es. Weil die MiG kein zweites Gerät hat,
  hörst du beim Senden überhaupt nichts.
- Anfragen aus dem Funkmenü gehen erst raus, wenn das Gerät auf der Briefing-Frequenz steht.
- In IL-2 Korea gibt es kein Funkgerät zum Einstellen.
:::

:::aircraft{aircraft=f5}
**F-5E Tiger II**
- **Ein** Gerät: **AN/ARC-164**, UHF 225–399,975 MHz, **20 :term[Presets]** plus manuelle Frequenz. Kein VHF.
- Frequenzmodus **MANUAL / PRESET / GUARD** (:term[Guard] ist die Notfrequenz). Funktionswähler **OFF / MAIN / BOTH** (BOTH hört Guard
  mit, MAIN nicht) **/ ADF** (Funkkompass).
- Preset speichern: Frequenz von Hand einstellen, Kanal wählen, unter der Abdeckung die Taste **LOAD** (Speichern) drücken.
:::

:::aircraft{aircraft=ajs37}
**AJS-37 Viggen**
- **FR22**, VHF und UHF, mit vorgespeicherten Kanälen. Am **Basiswähler** stellst du die **Nummer des
  Flugplatzes** ein, die **Buchstabentasten** wählen einen Kanal dieses Platzes. Die Platznummern
  stehen im Kneeboard und im F10-Menü.
- **H** ist die Notfrequenz 121,5 MHz. Das kleine Zweitgerät **FR24** hat dazu die Festkanäle E, F und
  G.
- Mit der **Minus-Taste** stellst du eine Frequenz direkt ein.
:::

:::aircraft{aircraft=mirage-f1}
**Mirage F1**
- Zwei Geräte: **TRAP 136** (VHF 118–149,975 und UHF 225–399,975 MHz) und **TRAP 137B** (nur UHF).
- Die Bedienung beschreibt das Handbuch des Moduls.
:::

:::aircraft{aircraft=uh1}
**UH-1H Huey**
- Drei Geräte: **UHF** AN/ARC-51BX (20 :term[Presets], :term[Guard]), **VHF-AM** AN/ARC-134 und **FM** AN/ARC-131
  (Sprechen, Peilen, Relais).
- Jeder Platz hat ein **Intercom-Bedienfeld** (C-1611/AIC). Sein Wahlschalter bestimmt, worauf du
  sendest: **INT** (Besatzung), **1** FM, **2** UHF, **3** VHF.
- Gesendet wird mit dem Schalter am Steuerknüppel oder mit dem Fußschalter.
- **GD XMIT** stimmt das UHF-Gerät direkt auf Guard 243.0.
:::

:::aircraft{aircraft=f15c}
**F-15C**
- **In DCS (Flaming Cliffs):** drei Geräte laut Funkdatei – UHF (ARC-164), VHF-AM und VHF-FM
  (ARC-186). Ein klickbares Bediengerät gibt es in dieser Fassung nicht.
- **In BMS:** zwei UHF-Geräte und kein VHF (siehe den BMS-Kasten unter „Merke“).
:::

:::aircraft{aircraft=mig29,su27,su25}
**MiG-29, Su-27/Su-33 und Su-25 (DCS)**
- **MiG-29:** R-862, VHF und UHF, AM und FM. Das Vollmodul MiG-29A Fulcrum hat dasselbe Gerät.
- **Su-27/Su-33:** R-800 (VHF/UHF) und dazu R-864 auf Kurzwelle.
- **Su-25:** R-862 und dazu das **R-828** (FM 20–60 MHz) für Bodentruppen und Fliegerleitoffiziere.
- Die Flaming-Cliffs-Fassungen haben kein klickbares Bediengerät.
:::

:::aircraft{aircraft=mi8}
**Mi-8MTV2**
- Drei Mann Besatzung, verbunden über die Bordsprechanlage **SPU-7**.
- **R-863** (VHF/UHF, AM/FM, 20 Festkanäle), **YaDRO-1A** (Kurzwelle für große Entfernungen) und
  **R-828** (FM).
- Die Sprechtaste am Steuerknüppel hat **zwei Stufen**: erster Druck Bordsprechanlage, zweiter Druck
  Funk.
- Am SPU wählst du, welches Gerät du hörst und auf welchem du funkst.
:::

:::aircraft{aircraft=ka50}
**Ka-50 Black Shark**
- **R-800L1** (VHF/UHF, AM/FM) für Flight, Tower und Bodenpersonal, **R-828** (FM 20–60 MHz,
  10 Kanäle) für Bodentruppen und Fliegerleitoffiziere.
- Der Drehschalter am **SPU-9** bestimmt, auf welchem Gerät du hörst und sendest – auch die Stellung
  für das Bodenpersonal.
- Nach jedem Kanalwechsel am R-828 die Abstimmtaste drücken und warten, bis die Lampe erlischt.
:::

:::aircraft{aircraft=ah64}
**AH-64D Apache**
- **Fünf Geräte:** VHF-AM (ARC-186), UHF-AM (ARC-164), zwei FM (ARC-201D, FM1 und FM2) und Kurzwelle
  (ARC-220).
- Zwei Mann Besatzung – Pilot hinten, Kopilot/Schütze (CPG) vorn – mit Bordsprechanlage.
- Frequenzsprung (das Funkgerät wechselt viele Male pro Sekunde die Frequenz, gegen Störsender: HAVE QUICK,
  SINCGARS) und Verschlüsselung sind laut DCS-Handbuch nicht umgesetzt.
:::

---

::drill{id=m2-l1-f16}

---

::drill{id=m2-l1-hornet}

---

::drill{id=m2-l1-f14}

---

::drill{id=m2-l1-scr522}

---

::drill{id=m2-l1-fug16}

---

::drill{id=m2-l1-mig15-wave}

---

::hangar{id=arc-164-und-arc-210}

---

::hangar{id=kanalraster}

---

## Merke

:::example
**UHF-AM** = militärisches Hauptband. **VHF-AM** = zivil. **VHF-FM** = Bodentruppen, meist auch der JTAC. Auf
welchem Gerät der eigene Flight liegt, sagt der Comm Plan. Kurzformen: **uniform, victor, fox mike.**
Frequenz und Modulation müssen beide stimmen.
:::

:::sim{sim=dcs}
Mit **Easy Communication** (so heißt die Option in den DCS-Optionen, Reiter „Gameplay“) stellt DCS das
Funkgerät selbst ein, und das Funkmenü zeigt, wen du erreichen kannst. Ohne Easy Communication musst du
die richtige Frequenz einstellen und das passende Gerät tasten – wie in echt. Für das Fliegen mit SRS
solltest du dich daran gewöhnen.
:::

:::sim{sim=bms}
In Falcon BMS heißen die Geräte COM1 (UHF, „Uniform“) und COM2 (VHF, „Victor“). Die ganze ATC läuft
über **UHF** – nur die ATIS sendet auf VHF. Auch der AWACS-Controller deines Packages (des Verbands aus mehreren Flights mit gemeinsamer
Mission) liegt auf UHF (Preset 6, Tactical). **VHF ist der Flight-Funk:** Jeder Flight eines Packages
bekommt ein eigenes VHF-Preset (15 bis 19), und die KI-Wingmen bleiben dort. **Guard:**
- **UHF:** Am Audio-Panel hat der **COM-1-Modusknopf** die Stellungen OFF, SQL und **GD**. GD stimmt
  das Hauptfunkgerät auf 243.0, du kannst darauf auch senden. Zum Mithören neben deinem Preset wählst
  du auf der UFC-Seite COM 1 **BOTH** (nur Empfang), „MAIN“ hört Guard nicht mit.
- **Nur wenn C&I auf BACKUP steht**, geht GD nicht. Dann wählst du Guard am Backup-UHF-Bedienteil
  (Stellung GRD).
- **VHF:** Der COM-2-Modusknopf auf **GD** stellt 121.5 ein. Auf einem VHF-Preset kannst du Guard nicht
  parallel mithören.

**F-15C:** Die BMS-Eagle hat **zwei UHF-Geräte und kein VHF**. COM 1 („PRI“) ist für ATC und die
Paket-Frequenz, COM 2 („:term[AUX]“) für den Flight. Alle Presets sind UHF, der Intra-Flight-Kanal steht im Comm
Ladder des Briefings (im Handbuchbeispiel Preset 15). VHF-Werte im Briefing sind dort nur Referenz.
:::
