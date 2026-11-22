---
id: m5-l5
module: m5
order: 5
title: Declare – Freund oder Feind?
summary: Du nennst die Position, der AWACS die Identität – und bandit ist nicht hostile.
minutes: 9
xp: 90
sources:
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 50–51 (Declare, Declaration-Liste), S. 62–63 (ID-Kette)"
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – Declare, SPADES, PAINTS, SQUAWKING (ältere Bestätigung)"
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – DECLARE, BOGEY, BANDIT, HOSTILE, FRIENDLY, SPADES, FURBALL"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (DECLARE, ID-Wörter)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "Hoggit-Wiki: Getting started with GCI/AWACS (Declare)"
    url: https://wiki.hoggitworld.com/view/Gci
  - title: "SkyEye Player Guide (Declare per Bullseye oder BRAA)"
    url: https://github.com/dharmab/skyeye/blob/main/docs/PLAYER.md
  - title: "Wikipedia: Link 16"
    url: https://en.wikipedia.org/wiki/Link_16
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 48–49 – Declare (Furball), JUDY"
---

## Wer ist das?

Dein Radar zeigt eine Gruppe. Ob das Freund oder Feind ist, siehst du ihr nicht an. Der AWACS weiß
mehr: Er hat IFF-Antworten, Datenlinks und den Überblick, wer wo fliegen sollte. Also fragst du ihn
mit **DECLARE**.

Damit er weiß, welche Gruppe du meinst, nennst du ihre **Position** – im Bullseye-Format, abgelesen
von deinem Radar – und ihre **Höhe**. Den Track nennst du nur, wenn er zur Unterscheidung nötig ist:

::call{id=m5-declare}

Die ATP 3-52.4 stellt „**declare**“ nach vorn: Rufzeichen der Stelle, dann deins, dann „declare bullseye …“. Das
Hoggit-Wiki stellt es ans Ende – die App akzeptiert beides. Bei einer BRAA-Position erlaubt nur SkyEye die
Anfrage; die ATP kennt dafür nur Bullseye (oder den Gruppennamen).

Hast du vorher ein **Picture mit Labels** gehört, genügt der **Gruppenname**:

::call{id=m5-declare-group}

:::tip
Beim Tippen schreibst du die Position wie auf dem Kneeboard: „bullseye 045/60“ oder „bullseye 045, 60“ – beides geht.
:::

Sinnvoll ist ein Declare, wenn du einen Kontakt keiner gemeldeten Gruppe sicher zuordnen kannst oder die Identität
noch offen ist („bogey“). Hat der AWACS eine Gruppe gerade erst als hostile gemeldet, bringt die Frage nichts Neues.

---

::drill{id=m5-l5-call-declare}

---

::drill{id=m5-l5-build-declare}

---

::drill{id=m5-l5-call-declare-group}

---

## Die Antworten

Die Antwort beginnt mit dem Namen der Stelle, die antwortet, und enthält **immer** Bullseye, Höhe, Track,
Declaration und ggf. Zusätze:

| Antwort | Bedeutung |
|---|---|
| **hostile** | feindlich – und nach den Einsatzregeln (ROE) zum Bekämpfen freigegeben |
| **bandit** | als feindlich identifiziert, aber **nicht** automatisch freigegeben |
| **bogey** | Identität unbekannt – auch für den AWACS |
| **friendly** | eigene Leute |
| **neutral** | weder Freund noch Feind |
| **furball** | Freund und Feind gemischt, innerhalb von etwa 5 Meilen |
| **clean** | an dieser Stelle hat der AWACS keine Radardaten |
| **unable** | er kann die Frage nicht beantworten |

Der wichtigste Unterschied: **bandit ist nicht hostile.** Bandit sagt nur, wer es ist. Ob du schießen
darfst, entscheiden die Einsatzregeln – und die gelten erst bei hostile.

:::example
**Bogey, aber …** Bei teilweise erfüllter Identifizierung hängt der AWACS ein genaueres Wort an „bogey“ – es
beschreibt nur die IFF-Lage und ist **keine** eigene Declaration:

- **PAINTS** – alle geforderten IFF-Modes und -Codes stimmen
- **SPADES** – die geforderten IFF-Modes fehlen ganz (kennst du aus Modul 4)
- **SQUAWKING** – ein Mode oder Code antwortet, ist aber falsch

Zum **bandit** wird ein Kontakt erst mit einem **positiven** Feindmerkmal, das ihn als Gegner ausweist und nicht nur als „nicht Freund“. „Keine IFF-Antwort“ allein erfüllt nur
den IFF-Teil von „kein Freund-Merkmal“. Ein Beispiel der ATP 3-52.4: „… track east, bogey spades.“
:::

Eine Gruppe, die als **bandit/hostile** erklärt wurde und sich teilt, bleibt in allen Teilen so erklärt, wenn
sie durchgehend getrackt wurde.

:::layer{layer=community}
Die Liste der Antworten steht so in der ATP 3-52.4. Ob ein AWACS in der Praxis alle davon nutzt, hängt von
Mission und Controller ab. In Sim-Staffeln hört man vor allem hostile, bandit, bogey, friendly, furball und clean.
„Vanished“ gilt nur im Training.
:::

---

::drill{id=m5-l5-answer-content}

---

::drill{id=m5-l5-id-match}

---

::drill{id=m5-l5-bandit}

---

::drill{id=m5-l5-furball}

---

::drill{id=m5-l5-clean}

---

::drill{id=m5-l5-spades}

---

::drill{id=m5-l5-bogey-plus}

---

::hangar{id=link-16}

---

## Merke

:::example
**declare bullseye … – Höhe (nach einem Label: declare + Gruppenname). Antwort: Bullseye, Höhe, Track,
hostile/bandit/bogey/friendly/furball/clean …**

bandit = feindlich, aber nicht automatisch freigegeben. hostile = freigegeben nach ROE. furball = Freund
und Feind gemischt. paints, spades, squawking = nur die IFF-Lage eines Bogeys.
:::

:::sim{sim=dcs}
Beim KI-AWACS in DCS fragt „Declare“ (Menü **F7**) nach der Gruppe, die du auf dem Radar aufgeschaltet
hast. ⚠ Nicht jedes Modul bietet den Menüpunkt – prüf es im Spiel. SkyEye braucht für declare eine Position im Bullseye- oder BRAA-Format (die ATP
3-52.4 kennt nur Bullseye oder den Gruppennamen).
:::

:::sim{sim=bms}
In Falcon BMS fragt „Declare“ im AWACS-Menü nach dem Ziel, das du auf dem Radar markiert hast. Liegen Freunde und
Gegner dicht beieinander (etwa 4 NM seitlich, 10.000 ft in der Höhe), antwortet die KI mit **furball** und zählt
beide Seiten: „Furball, 2 friendly, 3 bandit“. Seit 4.38 quittierst du eine Bedrohungswarnung von AWACS oder GCI
mit **JUDY** im AWACS-Menü (du hast das Ziel auf dem Radar und übernimmst); sonst wiederholt er sie alle 10 NM.
:::
