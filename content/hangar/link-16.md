---
id: link-16
title: Link 16 – das Lagebild ohne Stimme
category: technik
era: modern
teaser: Moderne Jets teilen ihr Radarbild über Funk – ganz ohne Worte. Warum wird trotzdem noch gesprochen?
sources:
  - title: "Wikipedia: Link 16"
    url: https://en.wikipedia.org/wiki/Link_16
  - title: "Wikipedia: Multiservice tactical brevity code (TIMBER)"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
---

**Link 16** ist ein **Datenlink**: Flugzeuge, Schiffe und Bodenstationen senden sich darüber Daten
statt Worte. Jeder Teilnehmer meldet automatisch seine eigene Position und Kennung – die **PPLI**
(*Precise Participant Location and Identification*). Radarspuren des AWACS oder eines Jägers
erscheinen bei allen anderen auf dem Bildschirm.

Technisch arbeitet Link 16 im Band **960 bis 1.215 MHz**. Die Teilnehmer senden nacheinander in
festen Zeitschlitzen (**TDMA**) und springen dabei ständig die Frequenz (**Frequenzsprung**), was das
Stören und Abhören erschwert. Die Geräte heißen **JTIDS** bzw. **MIDS**, die Nachrichten sind in
**MIL-STD-6016** bzw. **STANAG 5516** genormt. Im Brevity-Funk heißt ein Link-16-Netz **TIMBER**.

Warum also noch reden?

- **Nicht jeder hat den Link.** Ältere Flugzeuge, Partner anderer Nationen oder Hubschrauber fehlen
  oft im Netz.
- **Daten zeigen, wo – aber nicht, was gemeint ist.** „Ich nehme die nördliche Gruppe“ oder „declare“
  braucht Worte.
- **Ein Blick auf den Bildschirm kostet Zeit**, ein kurzer Funkspruch kommt im Kopfhörer an, während
  die Augen draußen bleiben.

Darum ergänzen sich beide: Der Link liefert das Bild, der Funk die Absicht.

:::sim{sim=dcs}
In DCS haben z. B. die F/A-18C und die F-16C einen Datenlink: Spuren von Flight-Mitgliedern und vom
AWACS erscheinen auf den Displays. ⚠ Umfang und Bedienung unterscheiden sich je Modul.
:::
