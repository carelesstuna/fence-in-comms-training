---
id: m1-l6
module: m1
order: 7
title: Readback und Radio Check
summary: Was du zurücklesen musst, warum – und wie man sagt, wie gut man jemanden hört.
minutes: 8
xp: 90
sources:
  - title: "ICAO Doc 4444 (PANS-ATM), 4.5.7.5 – Read-back requirements"
  - title: "SKYbrary: Read-back or Hear-back"
  - title: "UK CAA CAP 413 Radiotelephony Manual, Abs. 2.69 – Readback-Liste (ICAO-Umsetzung)"
  - title: "ICAO Doc 9432 – Manual of Radiotelephony (Readability Scale)"
  - title: "ICAO Annex 10, Volume II, 5.2.1.8.4 – Lesbarkeitsskala 1 bis 5"
  - title: "ACP 125 – Communication Instructions, Radiotelephone Procedures (LOUD, CLEAR; über Wikipedia)"
  - title: "Wikipedia: Signal strength and readability report"
    url: https://en.wikipedia.org/wiki/Signal_strength_and_readability_report
  - title: "SKYbrary: B742 / B741, Tenerife Canary Islands Spain, 1977"
    url: https://skybrary.aero/accidents-and-incidents/b742-b741-tenerife-canary-islands-spain-1977
  - title: "FAA Lessons Learned: KLM 4805 / Pan Am 1736 (Tenerife)"
    url: https://www.faa.gov/lessons_learned/transport_airplane/accidents/PH-BUF
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 12 – kein Readback-Zwang bei KI-ATC"
---

## Zurücklesen statt „roger“

Ein **Readback** heißt: Du wiederholst die wichtigen Teile einer Anweisung und hängst dein Rufzeichen
an. Der Lotse hört deinen Readback an und prüft ihn. Das nennt man **:term[Hearback]**. Hast du dich verhört, fällt
es ihm auf, **bevor** du danach fliegst.

Zurückgelesen wird alles, was bei einem Missverständnis gefährlich wird:

- **Runway**-Freigaben: auf die Bahn rollen, starten, landen, kreuzen – und **hold short**
- **Rollanweisungen** (der Weg über die Rollwege)
- **Streckenfreigaben**, also die :term[IFR]-Freigabe (Flug nach Instrumenten) für die Route
- **Höhen** und Flight Levels
- **Kurse** und Geschwindigkeiten
- **Frequenzen**
- **Höhenmesser**-Einstellung (altimeter)
- **Transpondercodes** (:term[squawk]): Der Transponder ist das Gerät, das einem Radar automatisch mit einem Code
  antwortet (mehr auf der Seite [Squawk, Transponder und IFF](/wissen/squawk-transponder-iff))

Nur bestätigt („roger“) werden dagegen Wetter und Verkehrshinweise. Die :term[ICAO]-Liste ist dabei etwas
länger als die der US-Flugsicherung (:term[FAA]). In Europa gehört z. B. auch der :term[Transition Level] dazu: das
unterste Flight Level über der Übergangshöhe (Modul 1, Lektion 3).

::call{id=m1-taxi-request}

---

::drill{id=m1-l6-what-readback}

---

::drill{id=m1-l6-cloze-taxi}

---

## So klingt ein guter Readback

- **Inhalt zuerst, Rufzeichen zum Schluss.** Der Lotse weiß, wen er angesprochen hat. Das
  Rufzeichen am Ende zeigt, wer gerade zurückliest.
- **Wörtlich bei Schlüsselwörtern:** „hold short“, Runway-Nummern, Zahlen.
- **Mit Richtung bei Kursen:** „left heading …“ – so fällt auch eine falsche Drehrichtung auf.
- **Nicht raten:** Wenn du etwas nicht verstanden hast, liest du es nicht „ungefähr“ zurück, sondern
  sagst „say again …“.

::call{id=m1-approach-numbers}

:::tip
Nicht jede Stelle will einen Readback. Im eigenen Flight quittierst du eine Anweisung des Leads nur mit
deiner Nummer: „Two“ heißt „verstanden, mache ich“. Für Bodenziele und den Flugzeugträger gibt es
eigene Regeln – mehr dazu in den später geplanten Spuren.
:::

---

::drill{id=m1-l6-build-approach-readback}

---

::hangar{id=hoehenmesser}

---

::drill{id=m1-l6-input-freq-readback}

---

::hangar{id=tenerife-1977}

---

::drill{id=m1-l6-takeoff-word}

---

## Radio Check: Wie hörst du mich?

Mit einem **Radio Check** prüfst du, ob dein Funkgerät sendet und empfängt. Die Antwort ist eine
Zahl auf der **Lesbarkeitsskala** von 1 bis 5:

| Stufe | Bedeutung |
|---|---|
| 1 | unlesbar |
| 2 | zeitweise lesbar |
| 3 | lesbar, aber nur mit Mühe |
| 4 | gut lesbar |
| 5 | einwandfrei lesbar |

Woher die Antworten kommen:

- **ICAO:** Du nennst die Stufe, z. B. **„read you five“** (Annex 10 Bd. II, 5.2.1.8.4).
- **Militär:** Üblich ist **„loud and clear“**. Es stammt aus dem militärischen Funkverfahren ACP 125. „loud“ steht
  dort für die Signalstärke, „clear“ für die Lesbarkeit. Weit verbreitet ist es auch außerhalb des Militärs.
- **Slang:** **„five by five“** heißt Lesbarkeit 5 *mal* Signalstärke 5, zwei Skalen in einem Ausdruck.
  :term[Lima Charlie] sind die Anfangsbuchstaben von *loud and clear* im Alphabet.

::call{id=m1-radio-check-readability}

---

::drill{id=m1-l6-radio-check-answer}

---

## Merke – und Abschluss der Grundausbildung

:::example
**Readback:** Runways und hold short, Höhen, Kurse, Frequenzen, Altimeter, Squawk – Inhalt zuerst,
Rufzeichen zum Schluss. Wetter und Verkehr nur bestätigen.

**Radio Check:** Lesbarkeit 1–5. ICAO: „read you five“. Militär: „loud and clear“. Slang: „five by five“,
„Lima Charlie“.
:::

:::layer{layer=community}
In vielen Multiplayer-Missionen gehört ein Radio Check vor dem Anlassen dazu. Beim Check im eigenen
Flight („{flightName}, check“) zeigt jede Antwort zugleich, dass Funkgerät, Frequenz und PTT-Taste
stimmen. Wer nicht antwortet, hat meist das falsche Funkgerät gewählt. Das schauen wir uns in Modul 2
an.
:::

:::sim{sim=bms}
Die KI-Lotsen in Falcon BMS erwarten **keinen** Readback – das Comms & Nav Book rät sogar davon ab,
weil die KI keine Pause dafür lässt und Readbacks dort nur Überlagerungen erzeugen. Mit Menschen über
SRS oder im BMS-Sprachfunk liest du trotzdem zurück. Dort zählt es.
:::

Damit hast du das Handwerkszeug: den Aufbau eines Funkspruchs, das Alphabet, Zahlen, Rufzeichen,
Standardwörter und den Readback. In **Modul 2** geht es um die Geräte, mit denen du funkst – vom
UHF-Funkgerät im Cockpit bis zur SRS-Oberfläche.
