/**
 * Baustein ::sketch{kind=…} für Leseseiten: feste Skizzen zum Bullseye (Modul 2).
 * - bullseye:  ein Kontakt, zwei Jäger – eine Bullseye-Meldung gilt für alle, BRAA wäre für jeden anders
 * - from-to:   eigene Position vom Bullseye und der Gegenkurs zum Bullseye
 * - variation: rechtweisend und magnetisch Nord bei Missweisung Ost und West (east is least, west is best)
 * Koordinaten in NM wie in Scope.tsx: x = Osten, y = Norden; Peilungen im Uhrzeigersinn ab Nord.
 */
import type { ReactNode } from 'react'
import type { SketchKind } from '../core/content/schema'
import { bearingDeg, distNm, polar, type Point } from '../core/random/geo'

const C = {
  bg: '#06120c',
  ring: '#1f3a2b',
  ringText: '#4f7d63',
  phosphor: '#7dd87d',
  muted: '#8fa69a',
  text: '#d9e5dd',
  amber: '#f2c14e',
  contact: '#c0504d',
  contactText: '#ffb3b3',
  own: '#7ec8ff',
}

const fmt = (b: number) => String(Math.round(b) === 0 ? 360 : Math.round(b)).padStart(3, '0')

/** Punkt in SVG-Koordinaten (y nach unten) bei Maßstab s Pixel je NM um den Ursprung o. */
function at(o: { x: number; y: number }, s: number, p: Point) {
  return { x: o.x + p.x * s, y: o.y - p.y * s }
}

/** Bogen im Uhrzeigersinn von Peilung a nach Peilung b mit Radius r (Pixel) um c. */
function arc(c: { x: number; y: number }, r: number, a: number, b: number) {
  const p = (deg: number) => ({ x: c.x + Math.sin((deg * Math.PI) / 180) * r, y: c.y - Math.cos((deg * Math.PI) / 180) * r })
  const sweep = (((b - a) % 360) + 360) % 360
  const s = p(a)
  const e = p(b)
  return `M${s.x.toFixed(1)},${s.y.toFixed(1)} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x.toFixed(1)},${e.y.toFixed(1)}`
}

/** Pfeilspitze am Ende einer Linie von a nach b. */
function Arrow({ a, b, color, width = 1.4 }: { a: { x: number; y: number }; b: { x: number; y: number }; color: string; width?: number }) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x)
  const h = 7
  const p1 = { x: b.x - h * Math.cos(ang - 0.4), y: b.y - h * Math.sin(ang - 0.4) }
  const p2 = { x: b.x - h * Math.cos(ang + 0.4), y: b.y - h * Math.sin(ang + 0.4) }
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={width} />
      <path d={`M${b.x},${b.y} L${p1.x},${p1.y} L${p2.x},${p2.y} Z`} fill={color} />
    </g>
  )
}

function Bullseye({ c }: { c: { x: number; y: number } }) {
  return (
    <g>
      <circle cx={c.x} cy={c.y} r={5} fill="none" stroke={C.phosphor} strokeWidth={1.4} />
      <circle cx={c.x} cy={c.y} r={1.8} fill={C.phosphor} />
    </g>
  )
}

function Contact({ c, label }: { c: { x: number; y: number }; label?: string }) {
  return (
    <g>
      <rect x={c.x - 5} y={c.y - 5} width={10} height={10} transform={`rotate(45 ${c.x} ${c.y})`} fill={C.contact} />
      {label && (
        <text x={c.x + 9} y={c.y - 6} fontSize={11} fill={C.contactText} fontFamily="monospace">
          {label}
        </text>
      )}
    </g>
  )
}

function Fighter({ c, heading, label, dx = 9, dy = 14 }: { c: { x: number; y: number }; heading: number; label: string; dx?: number; dy?: number }) {
  return (
    <g>
      <g transform={`translate(${c.x} ${c.y}) rotate(${heading})`}>
        <path d="M0,-8 L5.5,6 L0,3.5 L-5.5,6 Z" fill={C.own} />
      </g>
      <text x={c.x + dx} y={c.y + dy} fontSize={11} fill={C.own} fontFamily="monospace">
        {label}
      </text>
    </g>
  )
}

function Frame({ viewBox, label, children, maxW = 'max-w-[460px]' }: { viewBox: string; label: string; children: ReactNode; maxW?: string }) {
  return (
    <svg viewBox={viewBox} className={`w-full ${maxW} rounded-xl border border-line`} style={{ background: C.bg }} role="img" aria-label={label}>
      {children}
    </svg>
  )
}

function NorthMark({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <Arrow a={{ x, y: y + 22 }} b={{ x, y }} color={C.muted} width={1.2} />
      <text x={x} y={y - 5} fontSize={10} fill={C.muted} textAnchor="middle" fontFamily="monospace">
        {text}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------- bullseye

function SketchBullseye() {
  const o = { x: 190, y: 150 }
  const s = 2.6
  const contact: Point = polar({ x: 0, y: 0 }, 45, 40)
  const a: Point = polar({ x: 0, y: 0 }, 250, 34)
  const b: Point = polar({ x: 0, y: 0 }, 160, 30)
  const C0 = at(o, s, contact)
  const A = at(o, s, a)
  const B = at(o, s, b)
  const mid = (p: { x: number; y: number }, q: { x: number; y: number }) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 })
  const braa = (p: Point) => `${fmt(bearingDeg(p, contact))}/${Math.round(distNm(p, contact))}`
  const mA = mid(A, C0)
  const mB = mid(B, C0)
  return (
    <Frame viewBox="0 0 380 290" label="Skizze: ein Kontakt bei bullseye 045/40 und zwei Jäger an verschiedenen Orten">
      {[20, 40].map((r) => (
        <g key={r}>
          <circle cx={o.x} cy={o.y} r={r * s} fill="none" stroke={C.ring} strokeWidth={1} />
          <text x={o.x + 3} y={o.y - r * s - 3} fontSize={9} fill={C.ringText} fontFamily="monospace">
            {r} NM
          </text>
        </g>
      ))}
      <line x1={o.x} y1={o.y} x2={o.x} y2={o.y - 125} stroke={C.ring} strokeWidth={1} strokeDasharray="3 3" />
      <NorthMark x={28} y={30} text="N" />
      {/* BRAA von A und B aus – für jeden anders */}
      <line x1={A.x} y1={A.y} x2={C0.x} y2={C0.y} stroke={C.muted} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={B.x} y1={B.y} x2={C0.x} y2={C0.y} stroke={C.muted} strokeWidth={1} strokeDasharray="4 3" />
      <text x={mA.x - 6} y={mA.y - 8} fontSize={10} fill={C.muted} textAnchor="end" fontFamily="monospace">
        von A: {braa(a)}
      </text>
      <text x={mB.x + 8} y={mB.y + 14} fontSize={10} fill={C.muted} fontFamily="monospace">
        von B: {braa(b)}
      </text>
      {/* Bullseye-Strahl */}
      <path d={arc(o, 30, 0, 45)} fill="none" stroke={C.amber} strokeWidth={1.4} />
      <text x={o.x + 15} y={o.y - 36} fontSize={11} fill={C.amber} fontFamily="monospace">
        045°
      </text>
      <Arrow a={o} b={{ x: C0.x - 5, y: C0.y + 5 }} color={C.amber} width={1.8} />
      <text x={(o.x + C0.x) / 2 + 10} y={(o.y + C0.y) / 2 + 12} fontSize={11} fill={C.amber} fontFamily="monospace">
        40 NM
      </text>
      <Bullseye c={o} />
      <text x={o.x - 8} y={o.y + 18} fontSize={10} fill={C.phosphor} textAnchor="end" fontFamily="monospace">
        BULLSEYE
      </text>
      <Contact c={C0} label="Kontakt" />
      <Fighter c={A} heading={60} label="A" dx={-16} dy={4} />
      <Fighter c={B} heading={20} label="B" />
      <text x={190} y={280} fontSize={12} fill={C.amber} textAnchor="middle" fontFamily="monospace">
        „bullseye 045/40“ – gilt für A und B
      </text>
    </Frame>
  )
}

// ---------------------------------------------------------------------------- from-to

function SketchFromTo() {
  const o = { x: 230, y: 160 }
  const s = 2.6
  const ownP: Point = polar({ x: 0, y: 0 }, 300, 40)
  const own = at(o, s, ownP)
  const ang = (300 * Math.PI) / 180
  const near = { x: o.x + Math.sin(ang) * 9, y: o.y - Math.cos(ang) * 9 }
  const nearOwn = { x: own.x - Math.sin(ang) * 11, y: own.y + Math.cos(ang) * 11 }
  // Rückweg leicht versetzt neben dem Strahl, damit beide Pfeile sichtbar bleiben
  const off = { x: Math.cos(ang) * 7, y: Math.sin(ang) * 7 }
  const back = { a: { x: nearOwn.x + off.x, y: nearOwn.y + off.y }, b: { x: near.x + off.x, y: near.y + off.y } }
  return (
    <Frame viewBox="0 0 380 270" label="Skizze: eigene Position bullseye 300/40, Kurs zum Bullseye 120">
      <circle cx={o.x} cy={o.y} r={40 * s} fill="none" stroke={C.ring} strokeWidth={1} />
      <text x={o.x + 3} y={o.y - 40 * s - 3} fontSize={9} fill={C.ringText} fontFamily="monospace">
        40 NM
      </text>
      {/* Nordlinien am Bullseye und am eigenen Flugzeug */}
      <line x1={o.x} y1={o.y} x2={o.x} y2={o.y - 125} stroke={C.ring} strokeWidth={1} strokeDasharray="3 3" />
      <line x1={own.x} y1={own.y} x2={own.x} y2={own.y - 60} stroke={C.ring} strokeWidth={1} strokeDasharray="3 3" />
      <NorthMark x={352} y={30} text="N" />
      {/* vom Bullseye zu dir: 300 */}
      <path d={arc(o, 22, 0, 300)} fill="none" stroke={C.amber} strokeWidth={1.2} />
      <text x={o.x + 28} y={o.y + 6} fontSize={11} fill={C.amber} fontFamily="monospace">
        300°
      </text>
      <Arrow a={near} b={nearOwn} color={C.amber} width={1.6} />
      {/* von dir zum Bullseye: 120 */}
      <Arrow a={back.a} b={back.b} color={C.own} width={1.2} />
      <path d={arc(own, 34, 0, 120)} fill="none" stroke={C.own} strokeWidth={1.2} />
      <text x={own.x + 30} y={own.y - 30} fontSize={11} fill={C.own} fontFamily="monospace">
        120°
      </text>
      <Bullseye c={o} />
      <text x={o.x + 9} y={o.y + 20} fontSize={10} fill={C.phosphor} fontFamily="monospace">
        BULLSEYE
      </text>
      <Fighter c={own} heading={120} label="du" dx={-26} dy={4} />
      <text x={20} y={236} fontSize={11} fill={C.amber} fontFamily="monospace">
        deine Position: bullseye 300/40
      </text>
      <text x={20} y={254} fontSize={11} fill={C.own} fontFamily="monospace">
        zum Bullseye: Gegenkurs 120
      </text>
    </Frame>
  )
}

// ---------------------------------------------------------------------------- variation

function VariationPanel({ east }: { east: boolean }) {
  const o = { x: 140, y: 205 }
  const v = east ? 10 : -10
  const tru = 50
  const mag = tru - v
  const len = 150
  const tip = (deg: number, r = len) => ({ x: o.x + Math.sin((deg * Math.PI) / 180) * r, y: o.y - Math.cos((deg * Math.PI) / 180) * r })
  const tn = tip(0)
  const mn = tip(v)
  const ray = tip(tru, 140)
  const rayEnd = tip(tru, 134)
  // Beschriftung der Nordpfeile: der weiter links liegende nach links, der andere nach rechts
  const tnLeft = east
  return (
    <Frame viewBox="0 0 280 290" label={`Skizze: Missweisung 10° ${east ? 'Ost' : 'West'}`} maxW="max-w-[300px]">
      <text x={140} y={20} fontSize={13} fill={C.text} textAnchor="middle" fontFamily="monospace">
        Missweisung 10° {east ? 'Ost' : 'West'}
      </text>
      <Arrow a={o} b={tn} color={C.muted} />
      <Arrow a={o} b={mn} color={C.phosphor} />
      <text x={tn.x + (tnLeft ? -6 : 6)} y={tn.y + 4} fontSize={10} fill={C.muted} textAnchor={tnLeft ? 'end' : 'start'} fontFamily="monospace">
        rechtweisend
      </text>
      <text x={tn.x + (tnLeft ? -6 : 6)} y={tn.y + 16} fontSize={9} fill={C.muted} textAnchor={tnLeft ? 'end' : 'start'} fontFamily="monospace">
        Karte, Lineal
      </text>
      <text x={mn.x + (tnLeft ? 6 : -6)} y={mn.y + 4} fontSize={10} fill={C.phosphor} textAnchor={tnLeft ? 'start' : 'end'} fontFamily="monospace">
        magnetisch
      </text>
      <text x={mn.x + (tnLeft ? 6 : -6)} y={mn.y + 16} fontSize={9} fill={C.phosphor} textAnchor={tnLeft ? 'start' : 'end'} fontFamily="monospace">
        Kompass, Funk
      </text>
      {/* Strahl zum Kontakt */}
      <line x1={o.x} y1={o.y} x2={rayEnd.x} y2={rayEnd.y} stroke={C.amber} strokeWidth={1.6} />
      <Contact c={ray} />
      {/* Winkel ab rechtweisend Nord (innen) und ab magnetisch Nord (außen) */}
      <path d={arc(o, 46, 0, tru)} fill="none" stroke={C.muted} strokeWidth={1.3} />
      <path d={arc(o, 74, v, tru)} fill="none" stroke={C.phosphor} strokeWidth={1.3} />
      <text x={o.x + 36} y={o.y - 12} fontSize={11} fill={C.muted} fontFamily="monospace">
        {fmt(tru)}
      </text>
      <text x={o.x + 60} y={o.y - 50} fontSize={11} fill={C.phosphor} fontFamily="monospace">
        {fmt(mag)}
      </text>
      <Bullseye c={o} />
      <text x={140} y={250} fontSize={11} fill={C.text} textAnchor="middle" fontFamily="monospace">
        Lineal {fmt(tru)} {east ? '−' : '+'} 10 = Funk {fmt(mag)}
      </text>
      <text x={140} y={270} fontSize={11} fill={C.amber} textAnchor="middle" fontFamily="monospace">
        {east ? 'east is least' : 'west is best'}
      </text>
    </Frame>
  )
}

function SketchVariation() {
  return (
    <div className="flex flex-wrap gap-3">
      <VariationPanel east />
      <VariationPanel east={false} />
    </div>
  )
}

const CAPTIONS: Record<SketchKind, string> = {
  bullseye:
    'Eine Meldung für alle: Peilung und Entfernung vom Bullseye. Von A und B aus (gestrichelt) hätte der Kontakt für jeden andere Zahlen.',
  'from-to': 'Die Bullseye-Peilung zeigt vom Bullseye weg. Zum Bullseye hin fliegst du den Gegenkurs: 300 − 180 = 120.',
  variation:
    'Derselbe Strahl, zwei Bezugsrichtungen. Grau misst das Lineal der Karte, grün meint der Funk. Die Entfernung ändert sich nicht.',
}

export function BullseyeSketch({ kind }: { kind: SketchKind }) {
  return (
    <figure className="my-4 space-y-2">
      {kind === 'bullseye' && <SketchBullseye />}
      {kind === 'from-to' && <SketchFromTo />}
      {kind === 'variation' && <SketchVariation />}
      <figcaption className="text-xs text-muted">{CAPTIONS[kind]}</figcaption>
    </figure>
  )
}
