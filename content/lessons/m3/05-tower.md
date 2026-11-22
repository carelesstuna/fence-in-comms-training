---
id: m3-l5
module: m3
order: 5
title: Tower – line up und Start
summary: Abflugbereit melden, „line up and wait“ von der Startfreigabe unterscheiden und richtig zurücklesen.
minutes: 7
xp: 80
sources:
  - title: "FAA JO 7110.65 – 3-9 Departure Procedures"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap3_section_9.html
  - title: "ICAO Doc 4444 (PANS-ATM), 12.3.4 – Phraseologie Abflug (READY FOR DEPARTURE)"
  - title: "SKYbrary: B742 / B741, Tenerife Canary Islands Spain, 1977"
    url: https://skybrary.aero/accidents-and-incidents/b742-b741-tenerife-canary-islands-spain-1977
  - title: "Falcon BMS 4.38 Comms & Nav Book, S. 12, 15–16 – Ready for departure, position and hold"
  - title: "AFMAN 11-2F-16 Volume 3 (2020), Abs. 3.5, 3.6.8, 3.30.2, 7.3.1, 7.4.1 – Lineup, Startintervall, Abbruch, Freigaben im Flight"
    url: https://static.e-publishing.af.mil/production/1/af_a3/publication/afman11-2f-16v3/afman11-2f-16v3.pdf
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – Freigaben im Formationsflug"
  - title: "DCS-Warbird-Handbücher (Bf 109 K-4, Fw 190 A-8/D-9, P-51D, P-47D, Spitfire, Mosquito) – ATC-Ablauf"
---

## Der Tower besitzt die Bahn

Am Rollhalt wechselst du von Ground zum **Tower**. Der Tower ist für alles zuständig, was **auf** der
Bahn passiert: Starts, Landungen, Überqueren. Ohne seine ausdrückliche Freigabe rollst du nicht über
die gelben Linien.

Als Lead meldest du den Flight abflugbereit:

::call{id=m3-ready-departure}

**line up and wait** heißt: auf die Bahn rollen, ausrichten – und **warten**. Es ist keine
Startfreigabe. Der Tower nutzt es, um dich schon in Position zu bringen, während noch jemand landet
oder die Bahn verlässt.

---

::drill{id=m3-l5-match-tower}

---

::drill{id=m3-l5-build-ready}

---

## Die Startfreigabe

Nur drei Wörter erlauben dir zu starten: **cleared for takeoff**. Dazu nennt der Tower die Bahn und
meist den Wind. Du liest Bahn und Freigabe zurück:

::call{id=m3-takeoff-clearance}

:::warn
Hast du eine Startfreigabe nicht sicher **dir** zuordnen können – weil sie verstümmelt war, weil ein
ähnliches Rufzeichen auf der Frequenz ist –, dann ist sie keine. Bleib stehen und frag nach.
:::

---

::drill{id=m3-l5-build-takeoff-readback}

---

::drill{id=m3-l5-input-takeoff}

---

::drill{id=m3-l5-unsure}

---

::hangar{id=line-up-and-wait}

---

## Zahlen für den Start im Flight

Für F-16 der US Air Force nennt AFMAN 11-2F-16 V3 feste Werte (die Vorschrift gilt für diesen Typ, andere
Muster und Einheiten regeln es im Briefing):

- **Lineup:** zwischen getrennten Elementen mindestens 500 ft, im Element Flügelspitzenabstand (Abs. 3.5).
- **Startintervall:** mindestens 10 Sekunden zwischen Maschinen oder Elementen, 15 Sekunden mit
  Nachbrenner. 20 Sekunden bei :term[Join-up on top] (Formation über den Wolken sammeln) und mit scharfen Luft-Boden-Waffen (nicht gemeint: BDU-33,
  Raketen, 20-mm-Munition) (Abs. 3.6.8).
- **Ausfall vor dem Start:** Der Lead nummeriert den Flight neu, nach dem Start behalten alle ihr
  Rufzeichen (Abs. 7.3.1).
- **Abbruch im Startlauf:** Der Pilot nennt sein Rufzeichen und seine Absicht, soweit möglich. Die
  Nachfolgenden ändern ihren Startlauf oder brechen ab. Fängt das Seil am Pistenende, heißt es „Cable,
  Cable, Cable“, beim Netz „Barrier, Barrier, Barrier“ (Abs. 7.4.1).

::drill{id=m3-l5-interval}

---

::drill{id=m3-l5-abort-call}

---

## Wer quittiert die Freigabe?

In USAF-F-16-Verbänden bestätigt **jeder** im Flight die erste ATC-Freigabe (AFMAN 11-2F-16 V3, Abs.
3.30.2). Gemeint ist die Flugfreigabe vor dem Rollen; das Korea-BEM (2005) sagt es genauso:
Alle im Flight quittieren die Flugfreigabe. Hört ein Wingman die Frequenz nicht mit, gibt der Lead alle
Anweisungen weiter. Spätere Anweisungen quittiert der Flügel nur, wenn der Lead es verlangt. Die Quittung auf
einen Ruf ist bei den Wingmen nur die Nummer („Two“, „Three“).

Eine zweite Regel betrifft den Tower: Freigaben auf die Bahn werden **immer** quittiert, etwa „on to hold“
oder „cleared for takeoff“ (Korea-BEM). **On to hold** ist eine ältere, nicht von der FAA
benutzte Form von „line up and wait“: auf die Bahn rollen und warten.

In den Sims ist das anders: **BMS- und DCS-ATC sprechen nur mit dem Lead**, Readbacks der anderen
erwartet niemand. Wer in einem Verband mit Menschen fliegt, richtet sich nach dem Briefing.

::drill{id=m3-l5-ack-clearance}

---

## Merke

:::example
Am Rollhalt zum Tower: „holding short runway …, ready for departure“. **line up and wait** = rauf
und warten. **cleared for takeoff** = starten. Bahn und Freigabe immer zurücklesen.
:::

:::layer{layer=community}
Wie ein Flight startet – einzeln mit Abstand, als Paar nebeneinander oder alle vier im Intervall
(Richtwerte aus der F-16-Vorschrift siehe oben) – legt der Lead im Briefing fest. Auf der Bahn kommt dann oft nur noch ein kurzes
Kommando des Leads oder ein Handzeichen. Das ist Staffelpraxis und unterscheidet sich je nach Einheit.
:::

:::sim{sim=dcs}
Die KI-Lotsen in DCS geben die Startfreigabe über das Funkmenü (F5 – ATC) und kennen kein „line up
and wait“. Sie vergeben Freigaben manchmal trotz belegter Bahn. Schau beim Start immer selbst nach.
:::

:::era{era=ww2}
In den DCS-Warbirds läuft der Tower über dasselbe Funkmenü (F5 – ATC) wie in den Jets: Anlassen,
Rollen und Start anfragen. Dazu muss das Funkgerät an sein und auf dem Kanal stehen, auf dem laut
Briefing der Tower liegt. Dein Flight (Rotte oder Schwarm) folgt dem Führungsflugzeug.
:::

:::sim{sim=bms}
In BMS heißt der Menüeintrag am Rollhalt genau **„Ready for departure“**. Der Tower antwortet mit
„hold short“, „cleared for takeoff“ – oder mit **„position and hold“**, der alten US-Formulierung für
„line up and wait“. Vorsicht: „position and hold“ und „hold position“ klingen ähnlich, bedeuten aber
„auf die Bahn und warten“ bzw. „stehen bleiben“.
:::
