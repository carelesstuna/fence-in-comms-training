---
id: m1-l1
module: m1
order: 1
title: Wer ruft wen?
summary: Der Grundaufbau jedes Funkspruchs – und warum er genau so ist.
minutes: 6
xp: 60
sources:
  - title: "ICAO Doc 9432 – Manual of Radiotelephony (Grundaufbau von Funksprüchen)"
  - title: "FAA Order JO 7110.65 – Kapitel 2, Abschnitt 4 (Funkverfahren)"
    url: https://www.faa.gov/air_traffic/publications/atpubs/atc_html/chap2_section_4.html
---

## Funk ist eine Telefonkonferenz, in der nur einer sprechen darf

Auf einer Funkfrequenz hören **alle** mit: der Tower, die anderen Flugzeuge deines **:term[Flights]** und alle
übrigen. Ein Flight sind zwei bis vier Flugzeuge, die zusammen fliegen. Ihn führt der **Lead** (auf Deutsch Rotten-
oder Schwarmführer). Die anderen sind seine **Wingmen** (Rottenflieger, auch Flügelmann). Mehr dazu in Modul 1,
Lektion 4.

In einer Multiplayer-Mission mit :term[SRS] (SimpleRadio, dem Funkprogramm vieler Server) hört jeder Mitspieler mit,
der dieselbe Frequenz eingestellt hat. Gleichzeitig kann immer nur **einer** senden. Wer zu zweit drückt, übertönt
sich gegenseitig.

Deshalb hat jeder Funkspruch eine feste Reihenfolge, die drei Fragen beantwortet:

1. **Wen rufe ich?** – der Adressat
2. **Wer bin ich?** – dein :term[Rufzeichen], in diesem Durchlauf **{callsign}**
3. **Was will ich?** – die Nachricht

So sieht das aus. Tippe auf die farbigen Teile, um zu sehen, was sie bedeuten:

::call{id=m1-radio-check}

---

## Die Antwort folgt derselben Regel

Achte auf die Antwort des Towers im Beispiel: Jetzt steht **dein** Rufzeichen vorn. Der Tower ruft
nun dich – also bist du der Adressat. Die Regel dreht sich nicht um, sie gilt für beide Seiten.

Nach dem ersten Kontakt kürzen Lotsen oft ab und lassen ihren eigenen Namen weg. Du dagegen nennst
**immer** dein Rufzeichen. Nur so weiß die Gegenstelle, wer gerade spricht.

:::sim{sim=dcs}
Wenn du in DCS über das Funkmenü (`\` bzw. die F-Tasten) eine Anfrage schickst, spricht dein
virtueller Pilot genau diese Struktur. Hör beim nächsten Flug einmal bewusst darauf.
:::

:::layer{layer=community}
In Multiplayer-Missionen über SRS ist diese Disziplin noch wichtiger als im echten Leben: Oft teilen
sich ein Dutzend Spieler eine Frequenz, und der „Tower“ ist ein Mitspieler, der nebenbei selbst
fliegt. Ein sauber aufgebauter Funkspruch spart ihm Rückfragen.
:::

---

::drill{id=m1-l1-anatomy-addressee}

---

::drill{id=m1-l1-who-answers}

---

::hangar{id=erster-sprechfunk}

---

## Erst denken, dann drücken

Der häufigste Anfängerfehler hat nichts mit Vokabeln zu tun: Man drückt die Sprechtaste (:term[PTT], *push
to talk*) und überlegt *dann*, was man sagen will. Die Frequenz ist blockiert, alle hören „ähm …“.

Besser:

1. **Hineinhören** – ist gerade frei? Erwartet jemand noch eine Antwort?
2. **Formulieren** – den ganzen Funkspruch im Kopf zurechtlegen.
3. **Drücken** – und eine halbe Sekunde warten, bis das Funkgerät wirklich sendet.
4. **Sprechen** – ruhig, deutlich, in normalem Tempo.

Füllwörter wie „please“ brauchst du nicht. Auch ein „over“ am Ende ist im Flugfunk überflüssig: Dass du fertig bist,
hört jeder, wenn du die Taste loslässt.

:::tip
Schreib dir für die ersten Flüge die wichtigsten Anfragen auf dein :term[Kneeboard], den Notizblock am
Oberschenkel. Echte Piloten machen das auch.
:::

---

::drill{id=m1-l1-ptt-order}

---

## Ein zweiter Funkspruch

Hier ist die Anlassfreigabe bei Ground, der Bodenkontrolle des Flugplatzes. Achte darauf, dass
dieselbe Struktur wieder auftaucht. Neu ist nur der Teil „information …“: Er sagt, dass du die
aktuelle Platzinformation (:term[ATIS]) gehört hast. Mehr dazu in Modul 3, Lektion 1 und auf der Seite
[ATIS – die Platzansage und ihr Kennbuchstabe](/wissen/atis-platzansage). Der Buchstabe dahinter
ist nur die Kennung der Ausgabe und hat keine eigene Bedeutung: Er läuft von Alfa bis Zulu und beginnt
danach wieder bei Alfa. So weiß Ground, ob du die aktuelle Ausgabe kennst.

::call{id=m1-startup-request}

---

::drill{id=m1-l1-anatomy-request}

---

::drill{id=m1-l1-build-radio-check}

---

::drill{id=m1-l1-build-startup}

---

## Merke

:::example
**Wen rufe ich? → Wer bin ich? → Was will ich?**

Adressat, eigenes Rufzeichen, Nachricht. Gilt für jeden Erstanruf – und in der Antwort ist der
Adressat einfach die Gegenseite.
:::

In den nächsten Lektionen lernst du das Handwerkszeug für die einzelnen Teile: das Buchstabieralphabet,
Zahlen im Funk, Rufzeichen-Systeme und die festen Standardwörter.
