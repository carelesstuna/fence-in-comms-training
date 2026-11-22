---
id: iff-die-stumme-antwort
title: IFF – die Antwort, die keiner hört
category: technik
teaser: Dein Flugzeug funkt ständig, ohne dass du ein Wort sagst. Beim Fence in stellst du ein, was es antwortet.
sources:
  - title: "Wikipedia: Identification friend or foe"
    url: https://en.wikipedia.org/wiki/Identification_friend_or_foe
  - title: "Wikipedia: Luftwaffe radio equipment of World War II (FuG 25a Erstling)"
    url: https://en.wikipedia.org/wiki/Luftwaffe_radio_equipment_of_World_War_II
  - title: "DCS P-51D, P-47D und Spitfire IX Flight Manuals (Abschnitte IFF: SCR-695, ARI 5025)"
  - title: "Wikipedia: Multiservice tactical brevity code (SPADES)"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
---

**IFF** steht für *Identification Friend or Foe*. Ein Radar am Boden, auf einem Schiff oder im AWACS
schickt eine Abfrage, und der **Transponder** in deinem Flugzeug antwortet automatisch mit einem
Code. Gesprochen wird dabei kein Wort.

Es gibt mehrere **Modes**, also Arten der Abfrage:

| Mode | Wofür |
|---|---|
| 1 | nur militärisch, zweistelliger Code für Auftrag oder Flugzeugtyp |
| 2 | nur militärisch, vierstelliger Code für das einzelne Flugzeug bzw. die Einheit |
| 3/A | militärisch und zivil – der vierstellige **Squawk** der Flugsicherung |
| C | Höhenmeldung, vor allem zivil |
| 4 | nur militärisch, **verschlüsselt** |
| 5 | nur militärisch, verschlüsselt, mit mehr Daten (z. B. GPS-Position) |
| S | zivil, viele Daten, Grundlage für Kollisionswarner |

Den Squawk für Mode 3/A kennst du schon vom Funk mit der Flugsicherung. Die militärischen Modes
stellt man nach Briefing ein – und das gehört zu den Schaltern beim **fence in**: Im Einsatzgebiet
soll dich der eigene AWACS als Freund erkennen.

**Die Vorläufer** gab es schon im Zweiten Weltkrieg. Das deutsche **FuG 25a „Erstling“** antwortete
auf die Abfrage von Radarstellen wie Freya und Würzburg, sobald es eingeschaltet und auf den
Tagescode gestellt war. Die amerikanischen Jäger P-51D und P-47D trugen das **SCR-695**, das
automatisch auf Abfragen antwortete, mehrere Codes kannte und einen Notschalter hatte. Die Spitfire
hatte ein ähnliches Gerät, das **ARI 5025**. DCS bildet diese Geräte nicht überall nach.

Fehlt die erwartete Antwort, meldet der AWACS **SPADES**: Der Kontakt antwortet nicht mit den
geforderten Modes und Codes. Das heißt nicht automatisch „Feind“ – vielleicht hat nur jemand seinen
Transponder falsch eingestellt. Mehr dazu in Modul 5.
