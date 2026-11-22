---
id: m3-l2
module: m3
order: 2
title: Kaltstart mit dem Crew Chief
summary: Kabel-Intercom, Brandwache, Bremsklötze – wie Pilot und Crew Chief das Flugzeug gemeinsam zum Leben erwecken.
minutes: 8
xp: 80
layer: community
sources:
  - title: "Shaw AFB: Crew chiefs bring jets to life at Red Flag"
    url: https://www.shaw.af.mil/News/Article-Display/Article/214514/shaw-crew-chiefs-bring-jets-to-life-at-red-flag/
  - title: "Naval Safety Center: Hand Signals Chart"
    url: https://navalsafetycommand.navy.mil/Portals/29/Hand_signals-Chart1.pdf
  - title: "AFMAN 11-2F-16 Volume 3 – F-16 Operations Procedures (2020), Abs. 3.2 Ground Visual Signals, 3.3.4 EPU Check"
    url: https://static.e-publishing.af.mil/production/1/af_a3/publication/afman11-2f-16v3/afman11-2f-16v3.pdf
  - title: "Korea-BEM (Einsatzhandbuch F-16 der koreanischen Luftwaffe, 2005; liegt Falcon BMS bei) – Vorbereitung am Boden, Ground vor dem Anlassen"
  - title: "Falcon BMS F-16 Checklists Blk 52 (T.O. BMS1F-16CJ-1CL-1), Before Taxi – Ground Intercom, Chocks"
  - title: "Heatblur F-4E Manual, S. 812–817, 833, 836 – Crew Chief und Startcheckliste"
  - title: "DCS F-16C Early Access Guide, S. 66, 135, 158 – Bodencrew und Checkliste"
  - title: "DCS A-10C II Flight Manual, S. 182–183, 790 – Intercom und Ground Crew; Kommunikationsmenü, F6 Ground Crew"
  - title: "DCS Ka-50 Black Shark 3 Manual, Kap. 14 – Bodenpersonal: Befehle werden mit „Copy“ quittiert"
  - title: "Heatblur F-14 Manual, S. 25, 307 – externe Interphone-Buchse"
  - title: "Falcon BMS 4.38 Training Manual, S. 28–29, 47 – Ground-Menü, Chocks"
  - title: "DCS P-51D Mustang Flight Manual, S. 174–176 – Funkmenü: ATC (Anlassen, Rollen, Start), Ground Crew"
---

## Dein erster Gesprächspartner ist kein Lotse

Bevor du mit irgendeiner Funkstelle sprichst, sprichst du mit dem **Crew Chief**. Er (oder sie) ist für
dein Flugzeug am Boden verantwortlich, hat es vorbereitet und schickt es los.

Ihr sprecht nicht über Funk, sondern über ein **Kabel-Intercom**: Der Crew Chief steckt sein Headset
außen am Flugzeug ein. So hört nur ihr beide mit, und die Funkfrequenzen bleiben frei. Über dieses
Kabel laufen auch die Funktionschecks, bei denen er von außen sieht, ob sich Ruder, Klappen und
Bremsen richtig bewegen.

:::warn
Der genaue Wortlaut zwischen Pilot und Crew Chief ist nicht standardisiert wie der Funk mit dem Tower.
Belegt ist der **Ablauf**: Verbindung prüfen, Bereich frei, Brandwache, Bremsklötze, Anlassen. Die
Begriffe stehen so auch in Checklisten – etwa „Fore and Aft Area – CLEAR“ und „Fire Guard – POSTED“
in der F-4E oder „Ground crew – clear of intake“ in der F-16. Die Sätze drumherum sind verbreitete Praxis in Sim-Staffeln.
Im Missionsbriefing bzw. in der SOP kann es anders geregelt sein.
:::

---

## Der Ablauf beim Anlassen

1. **Intercom-Check:** Hört ihr euch?
2. **Sicherheit:** Der Crew Chief prüft, dass vor dem Einlauf und hinter der Düse niemand steht,
   dass eine **Brandwache** mit Feuerlöscher bereitsteht und dass die **Bremsklötze** (chocks) liegen.
3. **Startfreigabe** durch den Crew Chief – dann lässt du an.
4. **Checks** mit laufendem Triebwerk, bei denen der Crew Chief von außen zusieht.

::call{id=m3-crew-chief-start}

:::tip
Das Korea-BEM (Basic Employment Manual, ein Einsatzhandbuch der koreanischen Luftwaffe für die F-16 von 2005) rät, zum Anlassen **Ground** einzustellen und keine
Zwischenfrequenz. Passiert beim Anlassen etwas und braucht es Crash/Rescue, kannst du sofort Hilfe anfordern. Eine Minute vor
dem Rollen hört der Pilot außerdem das Backup-UHF auf der Staffelfrequenz mit. Beides ist ein
Verfahrenstipp aus dem Korea-BEM, kein Funkspruch.
:::

---

## Checks mit laufendem Triebwerk

Zum Ablauf gehören auch Checks, die nur mit dem Crew Chief gehen: Beim **EPU-Check** (Notstromaggregat
der F-16) schaltest du erst den EPU-Schalter aus, prüfst die Lampen und gibst dem Chief die Freigabe,
den EPU-Pin zu ziehen. Danach folgen Steuerflächen, Speedbrake (Luftbremse) und Bremsen, wieder mit dem Chief
abgestimmt. Zwei belegte Regeln aus AFMAN 11-2F-16 V3 (Abs. 3.2 und 3.3.4):

- Wartungspersonal tritt **erst nach dem EPU-Check** ans Flugzeug. Dass es sicher ist, sagst du per
  Intercom oder mit „Daumen hoch“.
- Du bedienst **kein System, das die Bodencrew gefährdet, bevor du eine Quittung hast**. Das gilt auch
  für den Stick, solange jemand an den Steuerflächen arbeitet (so steht es auch in der BMS-Checkliste).

::call{id=m3-crew-chief-checks}

:::warn
Belegt ist die **Reihenfolge**, nicht der Wortlaut. Der Dialog oben ist verbreitete Praxis in Sim-Staffeln (`community`).
:::

---

::drill{id=m3-l2-match-cc}

---

::drill{id=m3-l2-build-ready}

---

::hangar{id=crew-chief}

---

## Bremsklötze weg – Kabel ab

Sind alle Checks durch, kommen die Bremsklötze weg. Danach zieht der Crew Chief das Kabel ab. Ab jetzt
läuft die Verständigung **nur noch per Handzeichen** – bis er dich aus der Parkposition winkt.

:::tip
Die Reihenfolge von Kabel und Klötzen hängt vom Muster ab. Die BMS-F-16-Checkliste führt „Intercom
(ground crew) – Disconnect“ **vor** „Chocks – Remove“, und die F-4E in DCS hat Kabel-Intercom nur bei
gesetzten Klötzen. „pull chocks“ gibst du deshalb zusätzlich per Handzeichen. Halte dich an die
Checkliste deines Musters.
:::

::call{id=m3-crew-chief-chocks}

Wichtige Handzeichen, die du kennen solltest:

- **Feuer:** mit einem Arm eine schnelle liegende Acht, mit dem anderen auf die Brandstelle zeigen
- **Halt:** Arme über dem Kopf gekreuzt (beim Rollen: sofort bremsen)
- **Rollen:** Winken in die Richtung, in die du fahren sollst

Normalerweise laufen Anlassen, :term[Pre-Taxi] (Checks nach dem Anlassen, vor dem Rollen) und EOR-Checks über Intercom. Fällt es aus oder ist es bei
Alarmstarts verzichtbar, gelten Sichtzeichen nach AFMAN 11-218 (die Basiszeichen wie Halt und Chocks
stehen dort) und sechs **Zusatzzeichen der F-16** (AFMAN 11-2F-16 V3, Abs. 3.2.1–3.2.6). Sie ergänzen,
was der Funk nicht kann:

- **EPU-Funktionscheck:** zwei Finger hoch, Hand drehen
- **Flugsteuerung frei:** Arm heben, Faust, Rührbewegung
- **Bremsencheck:** Arm waagerecht, offene Hand nach vorn, am Handgelenk abknicken (wie das Treten der Pedale)
- **Bremsenverlust beim Rollen:** Haken senken (der Fanghaken am Heck, der ein :term[Fangseil] fängt)
- **Bordkanonencheck:** Pistole mit Zeigefinger und Daumen, dazu Kopfschütteln (ja oder nein)
- **EPU-Aktivierung:** flache Hand wie „Bleib weg“, dann beide Hände vor die Sauerstoffmaske (Hydrazin-Dämpfe möglich)

Wer welches Zeichen gibt, steht im Text nicht. Und auch hier gilt: erst die Quittung, dann der Schalter.

:::warn
Rollfreigabe gibt **Ground**, nicht der Crew Chief. Sein Zeichen heißt nur: Der Weg aus der
Parkposition ist frei. Beides brauchst du.
:::

---

::drill{id=m3-l2-order}

---

::drill{id=m3-l2-fire}

---

::drill{id=m3-l2-sign-epu}

---

::drill{id=m3-l2-ack-first}

---

::hangar{id=hot-pit}

---

## Jetzt am Stück

Im folgenden Szenario spielst du den ganzen Kaltstart durch: Intercom-Check, ATIS, Anlassfreigabe bei
Ground, Anlassen mit dem Crew Chief, Bremsklötze – bis zur Rollfreigabe. Achte darauf, **auf welchem
Kanal** du gerade sprichst: Intercom oder Funk.

---

::scenario{id=m3-s1-kaltstart}

---

## Merke

:::example
**Kabel-Intercom statt Funk.** Check der Verbindung → frei, Brandwache, Chocks → Startfreigabe →
Anlassen → Checks → Chocks weg → Kabel ab → Handzeichen. Rollen erst mit Zeichen des Crew Chiefs UND
Freigabe von Ground.
:::

:::sim{sim=dcs}
In DCS sprichst du mit der Bodencrew über das Kommunikationsmenü (**Ground Crew**): Bodenstrom,
Druckluft, Beladen, Betanken, Reparatur. Die Taste im Menü hängt vom Flugzeug ab (in der A-10C F6, in
anderen Mustern F8). Der Weg dorthin:
- **F-16C:** über das Intercom-Menü (Taste `\`). Die Startcheckliste verlangt „Communications –
  established with ground crew“, „Chocks – in place“ und „Ground crew – clear of intake“.
- **A-10C:** am Intercom-Panel INT wählen und **Hot Mic** einschalten, dann das Ground-Crew-Menü (F6).

Einen gesprochenen Crew-Chief-Dialog wie in dieser Lektion gibt es in DCS nicht. Ihn übst du hier für
Staffeln, die ihn mit Menschen nachspielen. Die KI-Bodencrew **quittiert** aber jeden Befehl mit „Copy“
und meldet die Fertigstellung („Rearming complete“, bei der Ka-50 „Commander, weapons reloaded“). Bleibt
die Quittung aus, ist der Befehl nicht angekommen: Intercom, Triebwerk und Haube prüfen.
:::

:::aircraft{aircraft=f4}
Die **F-4E** in DCS hat einen echten Crew Chief („Chief“), erreichbar über das Jester-Rad. Ihr sprecht
per **Kabel-Intercom**, aber nur bei gesetzten Bremsklötzen und wenn der **WSO auf HOT MIC** steht –
sonst bleiben Handzeichen. Der Chief kümmert sich um Fremdstrom und -luft, Startpatronen, Chocks und
Leiter und meldet manches von sich aus, etwa die Speedbrakes.
:::

:::aircraft{aircraft=f14}
In der **F-14** steckt das Bodenpersonal (Plane Captain) an einer Buchse im Bugradschacht ein. Damit
es dich hört, muss das Intercom des **Piloten auf HOT MIC** stehen. Starterluft und Bodenstrom kommen
auf Anforderung über das Bodencrew-Menü.
:::

:::era{era=ww2}
Im Warbird gibt es kein Kabel-Intercom zum Crew Chief. In der DCS-P-51D fragst du das Anlassen über das
Funkmenü beim Tower an („Request Engine Start“), die Bodencrew („Ground Crew“ im Funkmenü) brauchst du erst
nach der Landung zum Betanken und Aufmunitionieren (P-51D-Handbuch, S. 175–176). IL-2 hat keinen Dialog mit
der Bodencrew. Im Multiplayer bleiben Handzeichen und das, was der Lead im Flight ansagt.
:::

:::sim{sim=bms}
Falcon BMS hat keinen Crew-Chief-Dialog. Die Bodencrew erreichst du über die **Ground-Seite des
ATC-Menüs** (auf der Ground-Frequenz): EPU-Sicherungsstift ziehen, Bremsklötze entfernen, JFS
(Jet Fuel Starter, den Anlasser des Triebwerks) nachladen. Nach dem Entfernen der Bremsklötze salutiert der Crew Chief.
:::

:::sim{sim=srs}
Spielt ein Mitspieler den Crew Chief (manche Staffeln machen das), läuft das Gespräch über einen
eigenen Kanal oder das Intercom – nicht über die Ground-Frequenz.
:::
