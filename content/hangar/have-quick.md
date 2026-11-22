---
id: have-quick
title: HAVE QUICK – springen statt verschlüsseln
category: technik
era: cold-war
teaser: Gegen Störsender hilft kein Codewort. Also wechselt das Funkgerät viele Male pro Sekunde die Frequenz.
sources:
  - title: "Wikipedia: Have Quick"
    url: https://en.wikipedia.org/wiki/Have_Quick
  - title: "Crypto Museum: HAVE QUICK"
    url: https://www.cryptomuseum.com/radio/havequick
  - title: "European Security & Defence (10/2025): SATURN rising"
    url: https://euro-sd.com/2025/10/articles/technology/46934/saturn-rising/
---

Ein Gegner, der deine Frequenz kennt, braucht nur einen starken Sender, um sie mit Rauschen
zuzudecken. Dann hilft dir die beste Phraseologie nichts mehr.

**HAVE QUICK** ist die Antwort der US-Luftwaffe aus den frühen 1980ern: ein **Frequenzsprungverfahren**
für das UHF-Band. Das Funkgerät bleibt nicht auf einer Frequenz, sondern springt nach einem festen
Muster sehr schnell zwischen vielen Frequenzen hin und her. Ein Störsender trifft immer nur einen
kleinen Teil davon.

Damit alle Funkgeräte eines Netzes **im selben Takt** springen, brauchen sie drei Dinge:

- **Word of Day (WOD):** ein Schlüssel, der das Sprungmuster festlegt. Er wird vor dem Flug geladen.
- **Time of Day (TOD):** eine gemeinsame, sehr genaue Uhrzeit, heute meist von GPS.
- **Netznummer:** Mehrere Netze können denselben Schlüssel nutzen und springen trotzdem getrennt.

Wichtig: HAVE QUICK **verschlüsselt nicht**. Wer im richtigen Takt mitspringt, hört alles. Es schützt
gegen Störung, nicht gegen Abhören. Dafür gibt es eigene Verschlüsselungsgeräte.

Die verbesserte Version **HAVE QUICK II** steckt etwa im ARC-164. Die NATO hat darauf aufbauend
**SATURN** entwickelt (STANAG 4372), das HAVE QUICK nach und nach ablöst.

:::sim{sim=dcs}
Einige DCS-Module zeigen HAVE-QUICK-Bedienelemente, simulieren das Verfahren aber nur teilweise oder
gar nicht – in der F-14 etwa ist es nicht umgesetzt. SRS kennt HAVE QUICK als eigene „Modulation“.
:::
