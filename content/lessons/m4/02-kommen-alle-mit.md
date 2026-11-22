---
id: m4-l2
module: m4
order: 2
title: Kommen alle mit? – push, check, pushing, ROLEX
summary: Den Flight über Frequenzwechsel führen, ohne jemanden zu verlieren – und push nicht mit pushing verwechseln.
minutes: 9
xp: 80
sources:
  - title: "Wikipedia: Multiservice tactical brevity code (ATP 1-02.1, Stand 25.04.2025) – PUSH, PUSHING, ROLEX"
    url: https://en.wikipedia.org/wiki/Multiservice_tactical_brevity_code
  - title: "USAF TPS: Flight Test Brevity, Appendix B (PUSH, PUSHING, ROLEX)"
    url: https://usaftps.github.io/flight-test-brevity/multiservice-codes-applicable-to-flight-test.html
  - title: "ALSSA: Multi-Service Brevity Codes"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "AFMAN 11-2F-16 Vol. 3 (2020), Abs. 3.30.1 – Radio Checks werden der Reihe nach quittiert (PDF-S. 27)"
  - title: "ATP 3-52.4 „Air Control Communication“ (2. Sept. 2021), S. 17 – ROLEX (Fünf-Minuten-Schritte, nicht additiv, „plus“ gilt ohne Vorzeichen, Genehmigung über TAC C2)"
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 31 – VHF-Presets 15–19 für Intra-Flight"
---

## Wechseln, dann zählen

Aus Modul 2 kennst du den Frequenzwechsel: Der Lead sagt „push“ und den Netznamen, alle wechseln, auf
der neuen Frequenz kommt der Check. Mit einem Flight aus vier Flugzeugen und einem Comm Plan voller
Netze passiert das in einer Mission ein Dutzend Mal – Departure, AWACS, Strike, Tanker, zurück.

Der Check ist die einzige Stelle, an der der Lead merkt, dass **jemand fehlt**. Darum zählt er mit:
Two, Three, Four – sind alle da? Es ist eine Funkprobe (die Vorschrift sagt „radio check“): Jeder quittiert der
Reihe nach mit seiner Nummer. „check“ als Aufruf ist dafür Praxis, in der Brevity-Liste bedeutet das Wort etwas
anderes (Lektion 5).

---

::drill{id=m4-l2-commcard}

---

## Wenn einer fehlt

Irgendwann passiert es: Four hat sich verdreht, war gerade abgelenkt oder hat den push überhört. Auf
dem neuen Netz meldet er sich nicht. Und weil er nicht da ist, hört er auch keinen Rückruf.

Die Lösung ist das **zweite Funkgerät**. Viele Flights hören neben dem Arbeitsnetz dauernd auf einer
eigenen **Intraflight-Frequenz** mit. Dort erreicht der Lead jeden, egal wo er sich verdreht hat.

::call{id=m4-push-missing}

:::layer{layer=community}
Dass der Flight intern auf einem zweiten Gerät (oft VHF) spricht und extern auf UHF, ist verbreitete
Praxis in Sim-Staffeln. In Falcon BMS sind dafür die **VHF-Presets 15–19** als Intra-Flight-Frequenzen
der Flights eines Packages vorgesehen. Wie lange der Lead wartet, bevor er nachfragt, regelt keine
Quelle. Ein, zwei Sekunden Geduld schaden nie. ⚠
:::

---

::drill{id=m4-l2-four-missing}

---

::hangar{id=brevity-kein-geheimcode}

---

## push oder pushing?

Ein Buchstabe Unterschied, eine ganz andere Bedeutung:

| Wort | Bedeutung | Antwort |
|---|---|---|
| **push** | Frequenz wechseln | keine |
| **pushing** | „Wir verlassen jetzt den festgelegten Punkt“ | je nach Lage keine bzw. Rufzeichen |

Vor dem Einsatz sammelt sich ein Package oft an einem **Push Point** und wartet dort auf die gebriefte
**Push-Zeit**. Dann bricht jeder Flight auf – und meldet das:

::call{id=m4-pushing}

:::layer{layer=community}
Wem du „pushing“ meldest, steht im Briefing: dem AWACS, dem Package Commander auf dem Strike-Netz
oder beiden. ⚠ Die ATP 1-02.1 regelt nur das Wort.
:::

---

::drill{id=m4-l2-call-pushing}

---

## ROLEX – alles verschiebt sich

Ein Package hängt an einer **Zeitlinie**: Push-Zeit, Zeit über dem Ziel, Tankerzeiten. Kommt etwas
dazwischen, verschiebt sich der Zeitplan der **ganzen Mission** auf einmal – mit **ROLEX** und einer
Minutenzahl. Wer es ansagt, regelt das Briefing. In der ATP 3-52.4 holt bei Bedarf die Leitstelle (TAC C2)
die Genehmigung für längere Zeitfenster ein und gibt sie an die Flights weiter.

- **rolex plus 5** = alle Zeiten fünf Minuten **später**
- **rolex minus 5** = alle Zeiten fünf Minuten **früher**

Fehlt das Vorzeichen, gilt **plus**: „rolex 10“ heißt zehn Minuten später. So steht es auch im Beispiel der
ATP 3-52.4 (2021), S. 17. Nur „minus“ muss man ausdrücklich sagen.

Gerechnet wird immer von der **ursprünglich geplanten** Zeit aus. Die ATP 3-52.4 (2021) beschreibt ROLEX in
Schritten von fünf Minuten, die sich nicht addieren: „rolex 10“ und danach „rolex 15“ heißt 15 Minuten nach
der ursprünglichen Zeit, nicht 25. Die ATP 1-02.1 nennt nur „Minuten“. Die Übungen hier rechnen deshalb mit
fünf, zehn und fünfzehn Minuten.

::call{id=m4-rolex}

---

::drill{id=m4-l2-rolex-plus}

---

::drill{id=m4-l2-rolex-minus}

---

::drill{id=m4-l2-rolex-noplus}

---

::drill{id=m4-l2-push-pushing}

---

## Merke

:::example
**push = wechseln, keiner antwortet. check = alle melden sich, 2-3-4. pushing = Aufbruch vom Punkt.**

Fehlt beim Check einer, holst du ihn über das Intraflight-Funkgerät. ROLEX verschiebt alle Zeiten:
plus (oder ohne Vorzeichen) = später, minus = früher.
:::

:::sim{sim=srs}
In SRS kannst du zwei Funkgeräte gleichzeitig hören. Richte dir das Overlay so ein, dass du siehst,
auf welchem Gerät du gerade sendest – sonst landet der Rückruf an Four auf dem falschen Netz.
:::
