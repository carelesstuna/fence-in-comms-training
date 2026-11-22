---
id: am-statt-fm
title: Warum Flugfunk immer noch AM ist
category: physik
teaser: UKW-Radio ist längst FM, der Flugfunk funkt weiter in AM. Das Pfeifen bei Doppelsendungen ist ein Grund dafür.
sources:
  - title: "NASA Technical Reports: Simultaneous transmissions on AM radio channels"
    url: https://ntrs.nasa.gov/citations/20090020584
  - title: "RTL-SDR.com: Demonstrating the FM capture effect – why aircraft use AM"
    url: https://www.rtl-sdr.com/demonstrating-the-fm-capture-effect-why-aircraft-use-am/
  - title: "SKYbrary: Frequency Blocking"
    url: https://skybrary.aero/articles/frequency-blocking
---

Bei **AM** (Amplitudenmodulation) steckt die Stimme in der **Stärke** der Funkwelle, bei **FM**
(Frequenzmodulation) in kleinen **Verschiebungen der Frequenz**. FM klingt sauberer und rauscht
weniger. Deshalb hat es sich beim UKW-Radio durchgesetzt. Warum also funkt die Luftfahrt bis heute in
AM?

Ein Teil der Antwort ist schlicht **Geschichte**: Die ganze Welt hat AM-Geräte, und ein Wechsel wäre
nur auf einen Schlag möglich. Der andere Teil ist Physik – und betrifft genau den Fall, in dem zwei
gleichzeitig senden.

**Bei FM** gewinnt der Stärkere. Der Empfänger „rastet“ auf das stärkere Signal ein und unterdrückt
das schwächere fast vollständig. Das nennt man **Capture-Effekt**. Klingt gut – ist aber gefährlich:
Kommt der schwächere Funkspruch von einem Flugzeug in Not, verschwindet er spurlos. Niemand merkt, dass
da noch jemand war.

**Bei AM** addieren sich beide Signale. Man hört beide Stimmen durcheinander und dazu einen
**Pfeifton**: Die beiden Trägerwellen liegen nie exakt auf derselben Frequenz, und ihr kleiner
Unterschied wird als Ton hörbar (eine **Überlagerung**, englisch *heterodyne*). Das klingt hässlich,
hat aber einen Vorteil: **Jeder weiß sofort, dass etwas schiefgegangen ist.** Der Lotse sagt
„blocked“ und ruft meist gezielt einen auf („…, say again“) – dann wiederholt nur der. Ruft niemand auf:
kurz hineinhören, dann den eigenen Funkspruch vollständig wiederholen.

Ganz schützt auch AM nicht. Überlappen sich zwei Sendungen fast vollständig, merken es die Beteiligten
manchmal trotzdem nicht. In der Teneriffa-Katastrophe 1977 war vom Satz „stand by for takeoff“ im
entscheidenden Cockpit nur ein Pfeifen übrig.

:::sim{sim=srs}
SRS mischt standardmäßig alle Stimmen auf einer Frequenz einfach zusammen. Mit der Server-Option
**„IRL Radio Rx Interference“** wird FM realistischer: Dann hört man auf FM-Frequenzen nur noch den
stärksten Sender, wie beim Capture-Effekt. AM-Sendungen werden weiter gemischt.
:::
