---
id: track-c-l6
module: track-c
order: 6
title: "Der Angriff: IN, Cleared Hot, OFF"
summary: IP inbound, IN mit Richtung, die richtige Reaktion auf cleared hot, continue dry und abort, OFF – dazu die Control Types und der Check-out.
minutes: 13
xp: 110
layer: core
sources:
  - title: "Wikipedia: Multiservice tactical brevity code (Zusammenfassung der ATP 1-02.1, April 2025): IN, OFF, CLEARED HOT, CLEARED TO ENGAGE, CONTINUE, CONTINUE DRY, ABORT, RIFLE, GUNS, WINCHESTER"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "DCS-Handbücher P-51D, F-5E, A-10C: Control Types, „In“, cleared hot, abort, „Off“"
  - title: "ATP 1-02.1 (Mai 2020), Tabelle 2: ENGAGEMENT COMPLETE, CONTINUE DRY („Type 3, continue dry“)"
  - title: "Hoggit-Wiki: JTAC"
    url: https://wiki.hoggitworld.com/view/JTAC
---

## Vom IP ins Ziel

Jetzt wird es ernst. Du meldest, wann du am IP losfliegst, und dann, aus welcher Richtung du angreifst. Erst danach
gibt der JTAC frei.

::call{id=track-c-attack}

- **IP inbound** – du verlässt den IP Richtung Ziel. Der JTAC weiß jetzt, wann du kommst.
- :term[IN] **from the …** – die Endphase beginnt, die Richtung zeigt dem JTAC, wo er hinschauen muss. Mit Kurs 090
  kommst du aus Westen: „IN from the west“.
- :term[CLEARED HOT] – Freigabe. Beim Auslösen meldest du die Waffe: :term[RIFLE] für eine Luft-Boden-Rakete,
  :term[GUNS] für die Kanone, bei Bomben ist „bombs away“ verbreitet (⚠ nicht als Brevity belegt).
- :term[OFF] – Angriff beendet, du drehst ab, Richtung laut Line 9.

---

::drill{id=track-c-l6-in}

---

::drill{id=track-c-l6-off}

---

## Wenn nicht „cleared hot“ kommt

Der JTAC kann anders antworten – und jedes Wort heißt etwas anderes für deinen Finger am Auslöser.

::call{id=track-c-abort}

---

::drill{id=track-c-l6-reaction}

---

::drill{id=track-c-l6-dry}

---

::hangar{id=cleared-hot-kein-befehl}

---

::drill{id=track-c-l6-abort}

---

## Die Control Types

| Type | Bedingung | Freigabe |
|---|---|---|
| 1 | JTAC sieht Angreifer **und** Ziel | jeder Angriff einzeln, CLEARED HOT |
| 2 | Angreifer **oder** Ziel beim Abwurf nicht sichtbar | jeder Angriff einzeln, CLEARED HOT |
| 3 | geringes Risiko für die eigenen Leute | mehrere Angriffe in einem Rahmen, CLEARED TO ENGAGE |

So stehen sie in den DCS-Handbüchern; die DCS-Handbücher nennen Type 1 die häufigste und am stärksten eingeschränkte
Form. Gegen die JP 3-09.3 ist das nicht geprüft ⚠. Unter Type 3 meldest du nach jedem Ausklinken
:term[ENGAGEMENT COMPLETE] (ATP 1-02.1, 2020). In älteren Quellen, in DCS und auf vielen Kneeboards heißt diese Meldung
noch „attack complete“. Will der JTAC unter Type 3 einen Anflug ohne Waffeneinsatz, sagt er ausdrücklich **„Type 3,
continue dry“**.

::call{id=track-c-type3}

---

::drill{id=track-c-l6-types}

---

::drill{id=track-c-l6-type3}

---

## BDA und Check-out

Nach dem Angriff meldet der JTAC das Ergebnis, das **BDA** (Battle Damage Assessment). Ist deine Munition verbraucht,
meldest du dich mit :term[WINCHESTER] ab.

::call{id=track-c-bda}

:::sim{sim=bms}
Beim BMS-JTAC laufen „IP Inbound“, „Cleared Hot“ und der Check-out mit BDA über das Funkmenü.
:::

---

::drill{id=track-c-l6-checkout}

---

## Merke

:::example
**IP inbound → IN from the … → cleared hot → Waffe (rifle, guns …) → OFF …** Ausgelöst wird nur nach **cleared hot**
(Type 1/2) bzw. innerhalb von **cleared to engage** (Type 3, danach **engagement complete**). **Continue** ist keine
Freigabe, **continue dry** heißt nicht auslösen, **abort** heißt sofort abbrechen.
:::
