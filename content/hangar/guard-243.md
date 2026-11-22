---
id: guard-243
title: Zweimal 121,5
category: technik
teaser: Die militärische Notfrequenz ist exakt das Doppelte der zivilen. Ein Überlebensfunkgerät hat das genutzt.
sources:
  - title: "Wikipedia: Aircraft emergency frequency"
    url: https://en.wikipedia.org/wiki/Aircraft_emergency_frequency
  - title: "DCS F-14 Checklisten/Referenz (inoffizielle Sim-Aufbereitung, SAR-Frequenz 282.8)"
  - title: "PRC68.com: AN/URC-4 Survival Radio"
    url: https://prc68.com/I/URC4.html
  - title: "Wikipedia: Emergency locator beacon (ELT, PLB)"
    url: https://en.wikipedia.org/wiki/Emergency_locator_beacon
---

Rechne nach: **121,5 × 2 = 243,0.** Die militärische Notfrequenz im UHF-Band ist die erste
**Oberwelle** (zweite Harmonische) der zivilen im VHF-Band.

Was ist eine Oberwelle? Jeder Sender strahlt neben seiner eigentlichen Frequenz schwach auch auf
ganzzahligen Vielfachen davon. Normalerweise ist das ein Störeffekt, den Ingenieure wegfiltern.

Bei Notfunk lässt er sich nutzen. Ein Beispiel ist das amerikanische Überlebensfunkgerät **AN/URC-4**
aus der Zeit nach dem Zweiten Weltkrieg. Es erzeugte beide Notfrequenzen aus **einem einzigen
Schwingquarz**, dessen Frequenz vervielfacht wurde: einmal auf 121,5 MHz, einmal auf 243,0 MHz. Ein
Gerät, ein Quarz, zwei Notfrequenzen. Für ein kleines Gerät in der Rettungsweste eines
abgeschossenen Piloten war das ein echter Vorteil.

Ob die Frequenzen ursprünglich **absichtlich** so gewählt wurden oder sich der Zusammenhang
nachträglich als praktisch erwies, ist in den Quellen nicht eindeutig belegt.

Eine weitere Notfrequenz taucht in der Sim-Dokumentation auf: Die inoffizielle Aufbereitung der
F-14-Referenz (DCS) nennt **282,8 MHz** als **Primärfrequenz der US-Rettungsdienste (:term[SAR])**. Das ist
ein Hinweis aus einem Sim-Handbuch, keine Vorschrift ⚠.

Heute senden moderne Notsender (:term[ELT] fürs Flugzeug, :term[PLB] als tragbarer Notsender für eine Person) zusätzlich auf **406 MHz** mit einer digitalen Kennung, die
Satelliten auswerten. 121,5 und 243,0 bleiben aber die Sprechfunk-Notfrequenzen – und die Frequenzen,
auf denen Rettungskräfte den Sender zum Schluss anpeilen.
