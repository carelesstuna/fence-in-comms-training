---
id: funkgeraet-bedienen
title: Funkgerät bedienen – Preset, Kanal, Squelch, Intercom
summary: Frequenz oder Preset wählen, auf dem richtigen Gerät senden, Rauschen dämpfen und mit der Besatzung sprechen.
terms: [Preset, Kanal, SQCH, PTT, Intercom, VOX, HOTAS, UFC, RIO]
sources:
  - title: "DCS A-10C Flight Manual (liegt DCS bei), Kapitel Funk: Wahlschalter MAN und PRE, Mikrofonschalter am Gashebel"
  - title: "DCS F/A-18C Early Access Guide (liegt DCS bei), UFC-Funkseite: Presets 1 bis 20, Scratchpad, GRCV, SQCH, AM, FM"
  - title: "DCS F-16C Early Access Guide (liegt DCS bei): Hands-On Controls (HOTAS), Upfront Controls (ICP und DED)"
  - title: "DCS F-4E Manual (liegt DCS bei): WSO"
  - title: "Falcon BMS 4.38 Comms & Nav Book, Abschnitt 2 (Presets), und Technical Manual, Abs. 2.2.2 (COM-1- und COM-2-Modusknopf, BOTH und MAIN), S. 56–57 und 61 (zwei Funkgeräte, IVC)"
  - title: "DCS-SimpleRadioStandalone (GitHub, ciribob), Release 2.4.1.0: Sprechtaste, Geräteauswahl, Intercom, VOX"
  - title: "Heatblur F-14 Manual (liegt DCS bei), Intercom: HOT MIC, COLD MIC, RADIO OVERRIDE"
---

Ein Funkgerät in der Sim brauchst du in vier Handgriffen: **Frequenz wählen, Gerät wählen, senden, Rauschen dämpfen**.
Dazu kommt in Zweisitzern das **Intercom**.

## Frequenz, Preset und Kanal

Du kannst die Frequenz **von Hand** eintippen oder ein **Preset** abrufen, eine gespeicherte Frequenz mit einer Nummer,
meist 1 bis 20. Der Wahlschalter der A-10C heißt dafür MAN und PRE, bei der F/A-18C stehen die Presets und die
manuelle Eingabe am UFC. Die Nummer eines Presets heißt im Funk **Kanal** („channel 4“, „button 4“). Welche Frequenz
dahinter liegt, steht im Comm Plan, siehe [Comm Plan, Comm Card und Missionsunterlagen](/wissen/comm-plan-und-missionsunterlagen).
Vor dem Flug programmiert der Flight alle Geräte gleich, im Flug reicht eine Zahl.

## Senden und hören

- Die **Sprechtaste (PTT)** sendet auf dem **gewählten** Gerät. Gehört wird auf **allen** Geräten gleichzeitig. Der
  häufigste Fehler ist, den Flight auf Gerät 2 zu hören und auf Gerät 1 zu senden, also beim Tower.
- Im Cockpit wählst du das Gerät mit dem **Mikrofonschalter am Gashebel**. In der A-10C heißt vorn VHF-AM, hinten
  VHF-FM und unten UHF.
- **SRS** hat eine gemeinsame Sprechtaste und Tasten für die Geräte („Radio 1“ bis „Radio 10“). Mit „Radio Switch works
  as PTT“ wird jede Wahltaste selbst zur Sprechtaste.
- In **BMS** mit dem eigenen Sprechfunk :term[IVC] sendest du wie im echten Jet über den Funkschalter am :term[HOTAS],
  getrennt für COM 1 (UHF) und COM 2 (VHF).
- Die **Rauschsperre (:term[Squelch])** hält den Empfänger still, bis ein Signal anliegt. Ohne sie hörst du dauernd
  Rauschen. Ist sie zu scharf eingestellt, schneidet sie aber auch schwache Stationen weg – hörst du eine Station beim
  Radio Check kaum, öffne den Squelch kurz. An der F/A-18C schaltest du ihn mit SQCH auf dem UFC.
- Den **Guard-Empfänger** (GRCV) schaltest du zu, um die Notfrequenz mitzuhören (mehr in [Guard und Notfunk](/wissen/guard-und-notfunk)).
- In der BMS-F-16 hört der Modus **BOTH** Guard neben deinem Preset mit, **MAIN** nicht. In BOTH kannst du auf Guard nur
  empfangen.

## Intercom

Das **Intercom** ist die Verständigung der Besatzung. Nur sie hört es.

- **Hot Mic**: Das Intercom läuft ohne Taste, alles wird gehört. **Cold Mic**: Das Intercom geht nur mit Taste.
  **Radio Override**: Das Intercom hat Vorrang vor dem Funk.
- **VOX** ist die Sprachaktivierung: Die Stimme schaltet das Mikrofon ein. Sie ist in SRS standardmäßig aus. Läuft sie
  oder hängt die Taste, hören alle dich atmen.
- Im Zweisitzer sitzt hinten der **RIO** (Radar Intercept Officer, F-14) oder der **WSO** (Weapons Systems Officer, F-4E).
  Die klassische Panne: Der Pilot will dem hinteren Sitz etwas sagen und hat noch das Funkgerät gewählt. Dann hört der
  Tower mit. Ein Intercom-Check vor dem Anlassen deckt das auf.

## Wo sitzen die Bedienelemente

- **HOTAS** (Hands On Throttle And Stick): Schalter an Gashebel und Steuerknüppel, damit du die Hände nicht von den
  Hebeln nehmen musst. Dort sitzt auch die Sprechtaste.
- **UFC** (Up Front Controls): das Tastenfeld und die kleine Anzeige vorn im Cockpit, mit denen du Frequenzen eintippst.
  In der F-16 sind es das **ICP** (Tastenfeld) und das **DED** (Anzeige), in der F/A-18C der Up Front Controller mit
  Scratchpad und Optionsfeldern.

## Wo dir das begegnet

- [Funkgeräte im Cockpit](/lesson/m2-l1) (Modul 2): die Geräte und Kästen je Muster.
- [Kanäle, Comm Card und „push“](/lesson/m2-l2) (Modul 2): Presets und Kanäle.
- [Funkdisziplin auf vollen Frequenzen](/lesson/m2-l4) (Modul 2): Senden oder hören, VOX.
- [SRS in der Praxis](/lesson/m2-l5) (Modul 2): Sprechtaste, Geräteauswahl, Intercom.
