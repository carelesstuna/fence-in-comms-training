---
id: w-l2
module: track-w
order: 2
title: IL-2 – Funk ohne Funkgerät
summary: IL-2 simuliert kein Funkgerät. Gefunkt wird über SRS auf Kanälen laut Serverinfo – mit Kontaktmeldungen nach der Uhr, KI-Platzkontrolle über das Menü und Selbstansagen für Mitspieler.
minutes: 9
xp: 80
layer: community
sources:
  - title: "IL-2-Forum: SRS for IL-2 Community Edition – Multiplayer Radio for Korea & Great Battles"
    url: https://forum.il2-series.com/topic/4981-srs-for-il-2-community-edition-%E2%80%93-multiplayer-radio-for-korea-great-battles/
  - title: "IL-2-Forum: CB Radio with SRS on Combat Box"
    url: https://forum.il2sturmovik.com/topic/64823-announcement-cb-radio-with-srs-on-combat-box
  - title: "IL-2-Forum: Best practices and comm/radio discipline (Combat Box)"
    url: https://forum.il2sturmovik.com/topic/63447-best-practices-and-comm-radio-discipline
  - title: "IL-2-Forum: Parallel 38 – persistent coop PvE scenarios for IL-2 Series Korea and Great Battles"
    url: https://forum.il2-series.com/topic/3038-parallel-38-%E2%80%93-persistent-coop-pve-scenarios-for-il-2-series-korea-and-great-battles/
  - title: "Stormbirds: Some suggestions for using SRS in IL-2 and DCS multiplayer (2021)"
    url: https://stormbirds.blog/2021/10/29/some-suggestions-for-using-srs-in-il-2-and-dcs-multiplayer/
  - title: "IL-2 Korea Dev Blog #58 – neues Wingman-System, Bodenradar"
    url: https://media.il2-korea.com/news/dd_58
  - title: "IL-2 Great Battles, Spielordner data/Audio/radio – Sprachbausteine der KI-Funkmeldungen (Entfernungen 1_km bis 10_km) und der Platzkontrolle (req_taxi, req_takeoff, req_land, clrtakeoff, clrtolnd)"
---

## Kein Funkgerät im Cockpit

IL-2 Great Battles und IL-2 Korea bilden Flugzeuge sehr genau nach – das Funkgerät aber nicht. Es gibt
**keine Frequenz** zum Einstellen und keinen Kanalwähler. Den Heimatplatz rufst du über das **Befehlsmenü**
(Rollen, Start, Landung anfragen): Das ist eine KI-Platzkontrolle, die nur Menübefehle versteht und mit
Sprachbausteinen antwortet – Rollfreigabe, Startfreigabe, Landefreigabe oder Landeverbot. Mitspieler hören davon
nichts.

Was die Sim hat, ist ein **Befehlsmenü** für die KI-Flügelmänner: angreifen, decken, Formation, sammeln,
landen. Die KI antwortet mit Sprachbausteinen – und meldet Kontakte nach einem festen Muster:
**Rufzeichen, Uhrzeit-Position, Entfernung in Kilometern, Typ**.

:::sim{sim=il2}
**IL-2 Korea** hat ein neues Befehlsfenster mit deutlich mehr Befehlen. Die ganze Gruppe deiner
KI-Flugzeuge, im IL-2-Sprachgebrauch eine Staffel („squadron“), lässt sich in Sektionen („sections“) teilen. Dazu kommen **Bodenradar-Posten**, die dich zum Ziel, zu einem Wegpunkt oder nach Hause
führen, vor Bedrohungen warnen und deine Position bestätigen (siehe Modul 2, Lektion 9).
:::

---

## SRS für IL-2: Kanäle statt Frequenzen

Für den Sprechfunk mit Menschen gibt es eine eigene **Community-Fassung von SRS**, für Great Battles und
Korea zugleich. Sie bringt **zwei Funkgeräte und ein Intercom** mit. Statt Frequenzen gibt es **Kanäle**,
die der Server benennt.

Welcher Kanal wofür ist, ist eine Absprache des Servers. Zwei Beispiele (Stand 2026):

| Server | Kanalplan |
|---|---|
| Combat Box | SRS verbindet sich beim Beitritt selbst. Kanal 1 ist das Kommando der eigenen Seite, Kanal 2 der Platzverkehr. |
| Parallel 38 | Kanal 1 Platz und Planung, 2 Jäger, 3 Bomber, 4 Boden, 5 Koordination – auf 1 bis 5 nur Englisch. |

Daraus folgt dieselbe Regel wie mit Frequenzen: **vor dem Flug nachschlagen** – in der Serverinfo oder im
Missionsbriefing. Ein Leitfaden zu SRS in IL-2 und DCS rät außerdem: wenige Kanäle, vorher abgesprochen;
Unterhaltung nicht auf den Hauptkanälen; kurz funken.

:::sim{sim=il2}
Auf Combat Box sendet der Server zusätzlich eine KI-Leitstelle über SRS. Sie meldet Angriffe und
Luftkampfgebiete, die Plätze melden Wetter und Verkehr.
:::

---

::drill{id=w-l2-why-srs}

---

::drill{id=w-l2-channel-plan}

---

::hangar{id=ein-kanal-fuer-ein-geschwader}

---

## Kontakt melden: Uhr, Entfernung, Höhe

Ohne Radar und ohne Datenlink sehen nur die Augen. Wer Gegner entdeckt, muss sie seiner Rotte so ansagen,
dass jeder sofort weiß, wohin er schauen soll. Ausführlich steht das Muster in Modul 4. In IL-2 kommt die Entfernung in
**Kilometern** – so melden auch die KI-Flügelmänner, selbst die amerikanischen und britischen. In DCS-Warbirds und
im historischen RAF- und USAAF-Funk sagte man Meilen oder gar keine Entfernung, nur Uhr und high/low:

::call{id=w-contact-report}

:::layer{layer=community}
BANDIT heißt im Brevity-Katalog „als feindlich erkanntes Flugzeug“. Im Warbird erkennst du Gegner an Bauart
und Abzeichen – deshalb ist „bandits“ hier üblich. Ist unklar, wer das ist, sag „bogeys“.
:::

---

::drill{id=w-l2-clock}

---

::drill{id=w-l2-build-contact}

---

## Am Platz: selbst ansagen

Die KI-Platzkontrolle im Befehlsmenü hört nur dich – Mitspieler bekommen davon nichts mit. Im Multiplayer sagst du
dich am Platz deshalb zusätzlich **selbst an**, auf dem SRS-Kanal, den der Server für den Platzverkehr vorsieht. Wie das geht, steht in Modul 3, Lektion 7 („Ohne Tower“). Ein Beispiel aus
dem Funkdisziplin-Thread zu Combat Box: „P-51 joining runway 01 at Krymskaya“ – Muster, Absicht, Bahn,
Platz.

---

## Merke

:::example
IL-2 hat **kein Funkgerät** – gefunkt wird über **SRS auf Kanälen**, und welcher Kanal wofür ist, steht in
der **Serverinfo**. Kontakte meldest du mit **Rufzeichen, was, Uhr, Entfernung, Höhenlage**. Am Platz fragst
du die KI-Platzkontrolle über das **Befehlsmenü** und sagst dich für Mitspieler auf SRS **selbst an**.
:::
