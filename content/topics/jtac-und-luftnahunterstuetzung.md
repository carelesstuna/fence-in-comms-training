---
id: jtac-und-luftnahunterstuetzung
title: JTAC und Luftnahunterstützung
summary: Wer am Boden die Flugzeuge führt, wie die Angriffsfreigabe lautet und warum der JTAC meist auf FM funkt.
terms: [CAS, JTAC, FAC(A), ASOC, DASC, CLEARED HOT, CLEARED TO ENGAGE, CONTINUE, CONTINUE DRY]
sources:
  - title: "ATP 1-02.1 Multi-Service Brevity Codes (Mai 2020, Change 1 April 2021), CLEARED HOT S. 23, CLEARED TO ENGAGE S. 24 (JTAC/FAC(A)), CONTINUE S. 25, CONTINUE DRY S. 26"
    url: https://www.alssa.mil/MTTPs/Brevity/
  - title: "ATP 3-52.4 Air Control Communication (2. Sept. 2021), Kap. I, Abs. 3.e (S. 3) – ASOC bzw. DASC als Luftraumkontrolle unterhalb der FSCL"
  - title: "DCS A-10C Flight Manual (liegt DCS bei): Close Air Support und JTAC, Funk (Radio 2 für JTAC, VHF-FM 30 bis 76 MHz, „most often“ über VHF-FM), Readback von Zielort und Zielhöhe, 9-Line per Datalink, F4 JTAC im Funkmenü"
  - title: "Wikipedia: Joint terminal attack controller (Begriff nach JP 3-09.3, 2003 – JP 3-09.3 selbst nicht gelesen)"
    url: https://en.wikipedia.org/wiki/Joint_terminal_attack_controller
  - title: "Falcon BMS 4.38 Comms & Nav Book, Abs. 2.2.1 Tactical Net – UHF-Preset 6 (AWACS-Controller und JTAC)"
---

Die **Luftnahunterstützung** (Close Air Support, **CAS**) heißt: Flugzeuge greifen Ziele **nahe an den eigenen
Truppen** an. Weil dabei jeder Fehler die eigenen Leute trifft, führt ein Mensch am Boden, der die Lage sieht.

## Der JTAC

Der **JTAC** (Joint Terminal Attack Controller) ist der ausgebildete Fliegerleitoffizier, der bei den Bodentruppen
steht. Er stimmt sich mit dem Piloten ab, damit die Waffen genau auf das gewollte Ziel fallen, und gibt den Angriff
frei. Das A-10C-Handbuch beschreibt es so: Er lotst die Augen des Piloten per Funk auf das Ziel. Dieselbe Rolle vom
Flugzeug aus heißt **FAC(A)** (Forward Air Controller (Airborne)); das DCS-A-10C-Handbuch und manche NATO-Texte schreiben
AFAC.

## Die Freigabe

Die Wörter der Freigabe stehen in der ATP 1-02.1:

- **CLEARED HOT**: die Waffenfreigabe für ein bestimmtes Ziel bei Type-1- und Type-2-Kontrolle.
- **CLEARED TO ENGAGE**: die Freigabe bei Type-3-Kontrolle, innerhalb der Grenzen, die der JTAC vorgibt.
- **CONTINUE DRY**: Du fliegst den Anflug zu Ende, aber **nichts** wird ausgelöst. Ein simulierter Angriff ist erlaubt.
  Bei Type-3-Kontrolle heißt es „Type 3, continue dry“.
- **CONTINUE**: Du fliegst weiter wie bisher – das ist **keine** Freigabe. Wer „continue“ mit „cleared“ verwechselt, wirft
  ohne Erlaubnis – eine der gefährlichsten Verwechslungen im CAS-Funk.
- **ABORT**: Abbruch des Angriffs.

Ohne diese Freigabe wirfst du nichts. Den vollständigen Ablauf mit den Zeilen des Briefings lernst du in der Spur
[Mud Moving / CAS](/lesson/track-c-l1). Hier nur der Überblick.

## Der Ablauf im Überblick

:::layer{layer=community}
So läuft eine CAS-Station nach den Sim-Handbüchern und Community-Leitfäden ab. Die Vorschrift JP 3-09.3 selbst ließ sich
nicht einsehen, deshalb ist die Reihenfolge hier nicht aus dem Original belegt.
:::

1. **Übergabe** auf das Netz des JTAC, meist FM („fox mike“). Sie kommt vom AWACS oder von der Leitstelle für den
   Luftraum nahe der Front: dem **ASOC** (Air Support Operations Center, bei Heer und Luftwaffe der USA) bzw. dem
   **DASC** (Direct Air Support Center, bei den Marines).
2. **Check-in** beim JTAC: wer du bist, was du an Bord hast und wie lange du bleiben kannst.
3. **Situation Update** und **Game Plan**: Lage am Boden, dann der Plan des JTAC mit Kontrollart (Type 1, 2 oder 3) und
   Angriffsart.
4. **9-Line**: das Lagebriefing des JTAC in neun Zeilen. Zurückgelesen werden nur **Zielhöhe (Line 4), Zielort
   (Line 6) und alle Restriktionen** – ein Readback aller neun Zeilen blockiert das Netz.
5. **Talk-on**: Der JTAC beschreibt das Ziel, bis du es siehst.
6. **Freigabe** oder Abbruch, danach die Meldung über das Ergebnis.

In der A-10C kommt die 9-Line auf Wunsch auch **digital** per Datalink auf die Karte und als Textnachricht. Du nimmst sie
mit WILCO an oder lehnst sie ab.

## Funk

Der JTAC arbeitet mit den Bodentruppen und funkt deshalb **meist** auf **VHF-FM** (30 bis 88 MHz, „fox mike“), dem Netz
der Bodentruppen. Seine Geräte können aber mehrere Bänder: Welches Gerät und welche Frequenz gelten, sagen Comm Plan und
Übergabe. Wer auf der falschen Modulation ruft, wird nicht gehört, siehe
[Frequenzbänder, Modulation und Reichweite](/wissen/frequenzbaender-und-reichweite).

In der A-10C ist **Radio 2** (VHF-FM) dafür gedacht; laut DCS-Handbuch läuft der JTAC-Funk „meist“ über VHF-FM. In BMS
liegt der JTAC dagegen auf **UHF**: auf dem Tactical-Preset 6, zusammen mit dem AWACS-Controller des Packages. In DCS gibt
es einen KI-JTAC im Funkmenü unter F4 und auf Servern oft einen menschlichen.

## Wo dir das begegnet

- [Funkgeräte im Cockpit](/lesson/m2-l1) (Modul 2): JTAC im Bänderkasten, der A-10C mit drei Geräten.
- [Kanäle, Comm Card und „push“](/lesson/m2-l2) (Modul 2): der JTAC auf dem Tactical-Preset.
- [Welche Frequenz wann?](/lesson/m2-l6) (Modul 2): JTAC im Frequenzfahrplan.
- [Check-in beim JTAC](/lesson/track-c-l1) (Spur C): Check-in auf fox mike, Situation Update, Game Plan.
- [Der 9-Line: hören und mitschreiben](/lesson/track-c-l2) (Spur C): die neun Zeilen und die Remarks.
- [Readback: Line 4, Line 6 und Restriktionen](/lesson/track-c-l3) (Spur C): was zurückgelesen wird.
