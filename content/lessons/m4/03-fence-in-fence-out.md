---
id: m4-l3
module: m4
order: 3
title: Fence in, fence out
summary: Ein Wort, eine ganze Schalter-Checkliste – dazu feet wet und feet dry und der Battle Damage Check nach dem Einsatz.
minutes: 9
xp: 80
sources:
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – FENCE IN/OUT, FEET WET/DRY, CLEAN"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (FENCE IN/OUT, CLEAN)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 39, 43 – Fence In/Out als KI-Befehl"
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – FENCE-Checks"
  - title: "Wikipedia: Identification friend or foe"
    url: https://en.wikipedia.org/wiki/Identification_friend_or_foe
---

## Ein Wort, eine Checkliste

Kurz bevor der Flight ins Einsatzgebiet einfliegt, funkt der Lead zwei Wörter: **fence in**. Laut
ATP 1-02.1 heißt das: Cockpit-Schalter für den Einflug in den Einsatzraum setzen. Welche Schalter
genau, steht im Briefing bzw. in der :term[SOP] (den Hausregeln des Verbands) und hängt vom Flugzeug ab.

In der Ausbildung lernt man die Liste oft am Merkwort **FENCE** entlang. Ein **Beispiel**, angelehnt an das
Korea-BEM (2005) – keine Norm, die Einzelheiten hängen von Flugzeug und Auftrag ab:

- **F – Firepower, Fuel:** Ist die passende Waffe gewählt? Reicht der Treibstoff, ist er gleichmäßig
  verteilt, wie stehen die Tanks?
- **E – Emitters:** Was sendet, kann dich verraten. TACAN, Radar, Funk, Radarwarner (:term[RWR]) und
  Störsender kommen auf den gebrieften Stand. Das **IFF** stellst du so ein, dass dich die eigenen Leute als
  Freund erkennen, und die **Außenlichter** gehen aus, damit dich keiner sieht.
- **N – Navigation:** Navigationssystem und Steuerpunkte sind auf den Einsatz eingestellt.
- **C – Chaff/Flare:** Das Selbstschutzprogramm gegen Raketen ist scharf.
- **E – Employment:** Die Störsender arbeiten, **Master Arm** steht auf ARM – ab hier sind die Waffen scharf.

**fence out** ist dieselbe Liste rückwärts, wenn der Flight das Gebiet verlässt.

::call{id=m4-fence-in}

---

::drill{id=m4-l3-fence-match}

---

::drill{id=m4-l3-answer-fence}

---

## Feet wet, feet dry

Der AWACS führt Buch, wer wo ist. Überquert der Flight die Küste, meldet der Lead das mit zwei
Brevity-Wörtern:

- **feet dry** – jetzt über Land
- **feet wet** – jetzt über Wasser

Auf dem Weg zu einem Ziel an Land fällt **feet dry** oft mit **fence in** zusammen, auf dem Rückweg
zum Träger **feet wet** mit **fence out**.

::call{id=m4-feet-dry}

:::layer{layer=community}
Die Wörter stehen in der ATP 1-02.1. Dass der Lead sie dem AWACS meldet und wie genau, ist Praxis und
steht im Briefing. ⚠
:::

---

::drill{id=m4-l3-call-feet}

---

## Fence out und Battle Damage Check

Nach dem Einsatz, sobald der Flight das Gebiet verlassen hat: erst **fence out**, dann der **Battle
Damage Check** (BD-Check). Jeder schaut sich seinen Element-Partner von außen an – etwa indem der
Wingman einmal unter dem Lead durchkreuzt. Gesucht wird alles, was der Pilot selbst nicht sieht:
Löcher, austretender Kraftstoff, hängende Lasten.

::call{id=m4-fence-out-bd as=two}

**„You're clean“** heißt hier: kein sichtbarer Schaden.

:::layer{layer=community}
Ablauf und Wortlaut des BD-Checks regelt die SOP: wer zuerst schaut, wer wo kreuzt, ob man den
Partner mit „One“, „Lead“ oder dem vollen Rufzeichen anspricht. Das volle Rufzeichen ist am nächsten an der
USAF-Regel, jede Meldung mit dem kompletten Flight-Rufzeichen zu beginnen (AFMAN 11-2F-16 V3, Abs. 3.30). ⚠ Eine
öffentliche Primärquelle für den BD-Check selbst gibt es nicht.
:::

---

::drill{id=m4-l3-clean-match}

---

::drill{id=m4-l3-fenceout-order}

---

::drill{id=m4-l3-bd-call}

---

::hangar{id=iff-die-stumme-antwort}

---

## Merke

:::example
**fence in = Schalter für das Einsatzgebiet setzen. fence out = zurück. Bestätigt wird mit der Nummer.**

feet dry = über Land, feet wet = über Wasser. Nach dem fence out kommt der Battle Damage Check –
„you're clean“ heißt: kein sichtbarer Schaden.
:::

:::sim{sim=dcs}
Welche Schalter in deinem Flugzeug zum Fence-Check gehören, steht im Handbuch des Moduls. Was du
KI-Wingmen befehlen kannst, zeigt das Funkmenü (F1 Wingman, F2 Flight). Brevity wie „fence in“
verstehen sie nicht – mit Menschen über SRS funkst du es so wie hier.
:::

:::sim{sim=bms}
In Falcon BMS sind **Fence In** und **Fence Out** Befehle an die KI-Wingmen im Funkmenü: Sie schalten
damit Lichter und Master Arm.
:::
