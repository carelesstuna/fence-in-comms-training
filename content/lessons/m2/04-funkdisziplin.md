---
id: m2-l4
module: m2
order: 4
title: Funkdisziplin auf vollen Frequenzen
summary: Stepped on, blocked, stuck mic – warum eine Frequenz nur einem gehört und wie man sie sauber teilt.
minutes: 7
xp: 80
sources:
  - title: "SKYbrary: Frequency Blocking"
    url: https://skybrary.aero/articles/frequency-blocking
  - title: "FAA Pilot/Controller Glossary: BLOCKED"
    url: https://www.faa.gov/air_traffic/publications/atpubs/pcg_html/
  - title: "NASA Technical Reports: Simultaneous transmissions on AM radio channels"
    url: https://ntrs.nasa.gov/citations/20090020584
  - title: "RTL-SDR.com: Demonstrating the FM capture effect – why aircraft use AM"
    url: https://www.rtl-sdr.com/demonstrating-the-fm-capture-effect-why-aircraft-use-am/
  - title: "Falcon BMS 4.38 Technical Manual (liegt BMS bei, im Installationsordner unter Docs), S. 57 – Blockieren und gleichzeitiges Hören von UHF und VHF"
---

## Senden oder hören – nie beides

Ein Flugfunkgerät kann **entweder senden oder empfangen**. Solange du die Taste drückst, hörst du
niemanden. Das hat eine unangenehme Folge:

Drücken zwei Piloten gleichzeitig, merken **beide nichts**. Jeder glaubt, sein Funkspruch sei
durchgegangen. Nur alle anderen hören das Ergebnis: verstümmelte Wortfetzen und einen Pfeifton.
Man sagt dann, jemand wurde **„stepped on“** (überfunkt).

::call{id=m2-blocked}

**blocked** ist die Meldung dafür: „Zwei haben gleichzeitig gesendet, keiner kam durch.“ Wie es weitergeht,
entscheidet der Lotse bzw. die Station:

- Meist ruft sie gezielt einen auf („{callsign|spoken}, say again“). Dann wiederholt **nur der** – alle anderen
  warten.
- Ruft sie niemanden auf (nur „blocked, say again“ wie oben): kurz hineinhören, ob schon jemand wiederholt, dann
  den eigenen Funkspruch **vollständig** wiederholen.

---

::drill{id=m2-l4-what-tower-hears}

---

::drill{id=m2-l4-blocked-reply}

---

::drill{id=m2-l4-build-repeat}

---

## Die Regeln für volle Frequenzen

- **Erst hineinhören.** Läuft gerade ein Gespräch? Wartet jemand noch auf eine Antwort?
- **Erst denken, dann drücken.** Jedes „äh“ blockiert die Frequenz für alle.
- **Nach dem Drücken eine halbe Sekunde warten.** Sonst fehlt beim Empfänger die erste Silbe – oft
  genau der Adressat.
- **Kurz.** Adressat, Rufzeichen, Anliegen. Brevity statt Sätze. Kein „bitte“, kein „danke“, keine
  Begrüßung.
- **Einer spricht für den Flight.** Wingmen antworten mit ihrer Nummer und schweigen sonst nach außen.
- **Nicht in laufende Gespräche fallen.** Ein Controller, der einem anderen gerade eine Freigabe gibt,
  wartet auf dessen Readback.

:::warn
Eine **hängende Sprechtaste** (stuck mic) legt eine Frequenz komplett lahm: Einer sendet dauerhaft,
alle anderen hören Atmen und Triebwerksgeräusche. Ähnlich ist es bei der Sprachaktivierung (:term[VOX]),
bei der deine Stimme das Mikrofon ohne Taste einschaltet: Ist sie zu empfindlich, senden Atmen und
Geräusche mit. Der Betroffene merkt es nicht, denn er empfängt ja nichts. Wer es bemerkt, sagt es ihm
auf einem anderen Weg.
:::

---

::drill{id=m2-l4-best-call}

---

::drill{id=m2-l4-stuck-mic}

---

::hangar{id=am-statt-fm}

---

::drill{id=m2-l4-why-am}

---

## Merke

:::example
**Hören – denken – drücken – kurz warten – sprechen.** Wer gleichzeitig sendet, merkt es selbst nicht.
„blocked“ heißt: Keiner kam durch. Wen der Lotse aufruft, der wiederholt; ruft er niemanden auf, kurz
hineinhören und dann vollständig wiederholen. Kurz bleiben, nur der Lead spricht nach außen.
:::

:::layer{layer=community}
Online ist die Frequenzdisziplin oft schlechter als in echt, weil Mitspieler nebenbei auf dem Funk
plaudern. Ein guter Brauch: Absprachen, Erklärungen und Witze gehören in den Discord- oder
Teamspeak-Kanal, der Funk bleibt für Funksprüche.
:::

:::sim{sim=srs}
Je nach Servereinstellung hörst du in SRS andere auch, **während** du sendest – anders als in echt.
Gewöhn dir das Hineinhören trotzdem an: Auf anderen Servern und im echten Cockpit hörst du beim
Senden niemanden.
:::

:::sim{sim=bms}
BMS bildet das Überfunken nach: Senden zwei Stationen gleichzeitig auf derselben Frequenz, ist sie
blockiert. **UHF und VHF** hörst du dagegen gleichzeitig, wie im echten Jet. Damit du sie
auseinanderhältst, kann der IVC-Client (Integrated Voice Communications, die Sprachübertragung von BMS) die beiden Geräte links und rechts im Kopfhörer verteilen.
:::
