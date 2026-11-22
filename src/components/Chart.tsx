/**
 * Schematische Platzkarte (Airport Diagram) und Anflugkarte (Approach Chart) als SVG im Papier-Look.
 * Elemente sind antippbar (chart-tap): Frequenzen, Platzhöhe, TACAN, Runway-Enden, FAF, DA, MSA …
 */
import type { ReactNode } from 'react'
import type { ChartData, ChartFreq } from '../core/charts/chart'
import { formatAltitude, formatFrequency, formatHeading } from '../core/phraseology/spoken'

export type ChartMark = 'right' | 'wrong' | 'sel'

const PAPER = '#f3efe4'
const INK = '#1d1d1b'
const FAINT = '#8a8577'
const MAGENTA = '#a3195b'

interface TapProps {
  id: string
  x: number
  y: number
  w: number
  h: number
  onTap?: (id: string) => void
  marks?: Record<string, ChartMark>
  children: ReactNode
}

function Tap({ id, x, y, w, h, onTap, marks, children }: TapProps) {
  const mark = marks?.[id]
  const stroke = mark === 'right' ? '#15803d' : mark === 'wrong' ? '#dc2626' : mark === 'sel' ? '#2563eb' : 'transparent'
  return (
    <g
      onClick={onTap ? () => onTap(id) : undefined}
      className={onTap ? 'cursor-pointer [&>rect]:hover:fill-[#2563eb22]' : undefined}
      data-id={id}
    >
      <rect x={x} y={y} width={w} height={h} rx={2} fill="transparent" stroke={stroke} strokeWidth={mark ? 1.6 : 0} />
      {children}
    </g>
  )
}

const freqText = (f: ChartFreq) => (f.mhz !== undefined ? formatFrequency(f.mhz) : '—')

function runwayGeometry(pairs: string[], cx: number, cy: number, half: number) {
  return pairs.map((pair) => {
    const ends = pair.split('/') as [string, string]
    const heading = Number(ends[0].replace(/[LRC]/, '')) * 10
    const r = (heading * Math.PI) / 180
    const d = { x: Math.sin(r), y: -Math.cos(r) }
    const left = { x: d.y, y: -d.x }
    const side = ends[0].match(/[LRC]$/)?.[0]
    // "left" zeigt in Blickrichtung des ersten Bahnendes nach links: L liegt dort, R gegenüber
    const off = side === 'L' ? 14 : side === 'R' ? -14 : 0
    const c = { x: cx + left.x * off, y: cy + left.y * off }
    return {
      ends,
      d,
      left,
      off,
      a: { x: c.x - d.x * half, y: c.y - d.y * half },
      b: { x: c.x + d.x * half, y: c.y + d.y * half },
    }
  })
}

function Footer({ data, y }: { data: ChartData; y: number }) {
  return (
    <text x={210} y={y} fontSize={6.5} fill={FAINT} textAnchor="middle" fontFamily="monospace">
      SCHEMATISCH · NICHT ZUR NAVIGATION · Frequenzen: {data.freqSource === 'real' ? 'echtes AIP' : 'Sim / Comm Plan'}
    </text>
  )
}

// ---------------------------------------------------------------------------
// Platzkarte
// ---------------------------------------------------------------------------

function AirportDiagram({ data, onTap, marks }: { data: ChartData; onTap?: (id: string) => void; marks?: Record<string, ChartMark> }) {
  const rw = runwayGeometry(data.runways, 140, 175, 92)
  const main = rw.find((r) => r.ends.includes(data.activeEnd ?? '')) ?? rw[0]
  // Rollweg und Vorfeld rechts neben der äußersten parallelen Bahn (nicht unter einer anderen Bahn)
  const outer = Math.min(...rw.filter((r) => r.d.x === main.d.x && r.d.y === main.d.y).map((r) => r.off))
  const taxiOffset = 26 + (main.off - outer)
  const t1 = { x: main.a.x + main.left.x * -taxiOffset, y: main.a.y + main.left.y * -taxiOffset }
  const t2 = { x: main.b.x + main.left.x * -taxiOffset, y: main.b.y + main.left.y * -taxiOffset }
  const apronOff = outer - 66
  const apron = { x: 140 + main.left.x * apronOff, y: 175 + main.left.y * apronOff }
  const shown = data.freqs.filter((f) => f.id !== 'departure' || f.mhz !== undefined)
  return (
    <svg viewBox="0 0 420 320" className="w-full rounded-lg" style={{ background: PAPER }} role="img" aria-label={`Platzkarte ${data.name}`}>
      <rect x={4} y={4} width={412} height={312} fill="none" stroke={INK} strokeWidth={1} />
      <text x={12} y={20} fontSize={11} fontWeight={700} fill={INK} fontFamily="monospace">
        {data.icao ?? ''} {data.name.toUpperCase()}
      </text>
      <text x={408} y={20} fontSize={8} fill={INK} textAnchor="end" fontFamily="monospace">
        AIRPORT DIAGRAM
      </text>
      <line x1={4} y1={28} x2={416} y2={28} stroke={INK} strokeWidth={0.8} />

      {/* Funkblock */}
      <rect x={292} y={36} width={118} height={14 + shown.length * 13} fill="none" stroke={INK} strokeWidth={0.8} />
      <text x={351} y={46} fontSize={7} fill={INK} textAnchor="middle" fontFamily="monospace" fontWeight={700}>
        COMMUNICATIONS
      </text>
      {shown.map((f, i) => (
        <Tap key={f.id} id={f.id} x={294} y={50 + i * 13} w={114} h={12} onTap={onTap} marks={marks}>
          <text x={298} y={59 + i * 13} fontSize={7.5} fill={INK} fontFamily="monospace">
            {f.label}
          </text>
          <text x={404} y={59 + i * 13} fontSize={7.5} fill={INK} textAnchor="end" fontFamily="monospace" fontWeight={f.id === 'tower' ? 700 : 400}>
            {freqText(f)}
          </text>
        </Tap>
      ))}

      {/* Platzhöhe und TACAN */}
      <Tap id="elevation" x={292} y={60 + shown.length * 13} w={118} h={13} onTap={onTap} marks={marks}>
        <text x={298} y={70 + shown.length * 13} fontSize={7.5} fill={INK} fontFamily="monospace">
          ELEV {data.elevationFt !== undefined ? formatAltitude(data.elevationFt) : '—'}
        </text>
      </Tap>
      {data.tacan && (
        <Tap id="tacan" x={292} y={75 + shown.length * 13} w={118} h={13} onTap={onTap} marks={marks}>
          <text x={298} y={85 + shown.length * 13} fontSize={7.5} fill={INK} fontFamily="monospace">
            TACAN {data.tacan}
          </text>
        </Tap>
      )}

      {/* Nordpfeil */}
      <g transform="translate(260 52)">
        <path d="M0,-12 L5,4 L0,0 L-5,4 Z" fill={INK} />
        <text x={0} y={14} fontSize={7} fill={INK} textAnchor="middle" fontFamily="monospace">
          N
        </text>
      </g>

      {/* Vorfeld und Rollweg */}
      <rect x={apron.x - 24} y={apron.y - 12} width={48} height={24} fill="#d9d3c3" stroke={INK} strokeWidth={0.6} />
      <text x={apron.x} y={apron.y + 3} fontSize={6.5} fill={INK} textAnchor="middle" fontFamily="monospace">
        APRON
      </text>
      <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke="#b9b19b" strokeWidth={5} strokeLinecap="round" />
      {[t1, t2].map((t, i) => (
        <line key={i} x1={t.x} y1={t.y} x2={t.x + main.left.x * (taxiOffset - 4)} y2={t.y + main.left.y * (taxiOffset - 4)} stroke="#b9b19b" strokeWidth={4} />
      ))}
      <line x1={apron.x} y1={apron.y} x2={(t1.x + t2.x) / 2} y2={(t1.y + t2.y) / 2} stroke="#b9b19b" strokeWidth={4} />
      {data.taxi?.map((name, i) => {
        const f = (i + 1) / ((data.taxi?.length ?? 1) + 1)
        const p = { x: t1.x + (t2.x - t1.x) * f, y: t1.y + (t2.y - t1.y) * f }
        return (
          <g key={name + i}>
            <rect x={p.x - 6} y={p.y - 6} width={12} height={10} fill={INK} />
            <text x={p.x} y={p.y + 1.5} fontSize={6.5} fill={PAPER} textAnchor="middle" fontFamily="monospace">
              {name.charAt(0)}
            </text>
          </g>
        )
      })}

      {/* Bahnen */}
      {rw.map((r, i) => (
        <g key={i}>
          <line x1={r.a.x} y1={r.a.y} x2={r.b.x} y2={r.b.y} stroke={INK} strokeWidth={9} />
          <line x1={r.a.x} y1={r.a.y} x2={r.b.x} y2={r.b.y} stroke={PAPER} strokeWidth={0.8} strokeDasharray="5 4" />
          {[
            { end: r.ends[0], p: r.a, dir: -1 },
            { end: r.ends[1], p: r.b, dir: 1 },
          ].map(({ end, p, dir }) => (
            <Tap key={end} id={`rwy:${end}`} x={p.x + r.d.x * dir * 12 - 11} y={p.y + r.d.y * dir * 12 - 8} w={22} h={12} onTap={onTap} marks={marks}>
              <text x={p.x + r.d.x * dir * 12} y={p.y + r.d.y * dir * 12 + 1.5} fontSize={8} fill={INK} textAnchor="middle" fontFamily="monospace" fontWeight={700}>
                {end}
              </text>
            </Tap>
          ))}
          <text
            x={(r.a.x + r.b.x) / 2 + r.left.x * 12}
            y={(r.a.y + r.b.y) / 2 + r.left.y * 12}
            fontSize={6}
            fill={FAINT}
            textAnchor="middle"
            fontFamily="monospace"
          >
            {formatHeading(Number(r.ends[0].replace(/[LRC]/, '')) * 10)}°
          </text>
        </g>
      ))}
      <Footer data={data} y={308} />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Anflugkarte
// ---------------------------------------------------------------------------

function wrap(text: string, max: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur.trim())
      cur = w
    } else cur += ' ' + w
  }
  if (cur.trim()) lines.push(cur.trim())
  return lines
}

function ApproachChart({ data, onTap, marks }: { data: ChartData; onTap?: (id: string) => void; marks?: Record<string, ChartMark> }) {
  const ap = data.approach!
  const elev = data.elevationFt
  const order: ChartFreq['id'][] = ['atis', 'approach', 'tower', 'ground']
  const freqs = order.map((id) => data.freqs.find((f) => f.id === id)).filter((f): f is ChartFreq => !!f)

  // Draufsicht: Schwelle unten rechts der Mitte, Anflug kommt aus Richtung course+180
  const crs = (ap.course * Math.PI) / 180
  const dir = { x: Math.sin(crs), y: -Math.cos(crs) } // Flugrichtung im Endanflug
  const box = { x: 8, y: 116, w: 404, h: 200 }
  const thr = { x: 210 + dir.x * 40, y: 216 + dir.y * 40 }
  const reach = ap.iafNm + 1.5
  // Maßstab so, dass der IAF in die Box passt
  const maxPx = Math.min(
    ...[
      dir.x < 0 ? (box.x + box.w - 14 - thr.x) / -dir.x : dir.x > 0 ? (thr.x - box.x - 14) / dir.x : Infinity,
      dir.y < 0 ? (box.y + box.h - 14 - thr.y) / -dir.y : dir.y > 0 ? (thr.y - box.y - 14) / dir.y : Infinity,
    ],
  )
  const scale = Math.min(9, maxPx / reach)
  const at = (nm: number) => ({ x: thr.x - dir.x * nm * scale, y: thr.y - dir.y * nm * scale })
  const faf = at(ap.fafNm)
  const iaf = at(ap.iafNm)
  const rwyEnd = { x: thr.x + dir.x * 16, y: thr.y + dir.y * 16 }
  const missedEnd = { x: rwyEnd.x + dir.x * 34, y: rwyEnd.y + dir.y * 34 }

  // Profil
  const px = (nm: number) => 380 - nm * (300 / (ap.fafNm + 2))
  const py = (ftAgl: number) => 404 - ftAgl * (46 / Math.max(1, ap.fafAlt - (elev ?? 0)))

  return (
    <svg viewBox="0 0 420 470" className="w-full rounded-lg" style={{ background: PAPER }} role="img" aria-label={`Anflugkarte ${data.name}`}>
      <rect x={4} y={4} width={412} height={462} fill="none" stroke={INK} strokeWidth={1} />
      <text x={12} y={20} fontSize={11} fontWeight={700} fill={INK} fontFamily="monospace">
        {data.icao ?? ''} {data.name.toUpperCase()}
      </text>
      <text x={408} y={20} fontSize={11} fontWeight={700} fill={INK} textAnchor="end" fontFamily="monospace">
        {ap.type} RWY {ap.runway}
      </text>
      <line x1={4} y1={28} x2={416} y2={28} stroke={INK} strokeWidth={0.8} />

      {/* Briefing Strip */}
      <line x1={140} y1={28} x2={140} y2={110} stroke={INK} strokeWidth={0.6} />
      <line x1={280} y1={28} x2={280} y2={110} stroke={INK} strokeWidth={0.6} />
      <line x1={4} y1={110} x2={416} y2={110} stroke={INK} strokeWidth={0.8} />
      <Tap id="navaid" x={8} y={32} w={128} h={13} onTap={onTap} marks={marks}>
        <text x={12} y={42} fontSize={8} fill={INK} fontFamily="monospace" fontWeight={700}>
          {ap.navaid}
        </text>
      </Tap>
      <Tap id="course" x={8} y={47} w={128} h={13} onTap={onTap} marks={marks}>
        <text x={12} y={57} fontSize={7.5} fill={INK} fontFamily="monospace">
          Final Apch Crs {formatHeading(ap.course)}°
        </text>
      </Tap>
      <Tap id="faf" x={8} y={62} w={128} h={13} onTap={onTap} marks={marks}>
        <text x={12} y={72} fontSize={7.5} fill={INK} fontFamily="monospace">
          FAF {ap.fafNm} NM · {formatAltitude(ap.fafAlt)}
        </text>
      </Tap>
      <Tap id="da" x={8} y={77} w={128} h={13} onTap={onTap} marks={marks}>
        <text x={12} y={87} fontSize={7.5} fill={INK} fontFamily="monospace">
          {ap.minimumLabel} {formatAltitude(ap.minimumFt)}
        </text>
      </Tap>
      <Tap id="elevation" x={8} y={92} w={128} h={13} onTap={onTap} marks={marks}>
        <text x={12} y={102} fontSize={7.5} fill={INK} fontFamily="monospace">
          Apt Elev {elev !== undefined ? formatAltitude(elev) : '—'}
        </text>
      </Tap>
      <Tap id="missed" x={144} y={32} w={132} h={74} onTap={onTap} marks={marks}>
        <text x={148} y={42} fontSize={7} fill={INK} fontFamily="monospace" fontWeight={700}>
          MISSED APPROACH:
        </text>
        {wrap(ap.missedText.toUpperCase(), 26).map((l, i) => (
          <text key={i} x={148} y={53 + i * 9} fontSize={6.8} fill={INK} fontFamily="monospace">
            {l}
          </text>
        ))}
      </Tap>
      {freqs.map((f, i) => (
        <Tap key={f.id} id={f.id} x={284} y={32 + i * 18} w={128} h={17} onTap={onTap} marks={marks}>
          <text x={288} y={40 + i * 18} fontSize={6.5} fill={FAINT} fontFamily="monospace">
            {f.label}
          </text>
          <text x={288} y={47.5 + i * 18} fontSize={8} fill={INK} fontFamily="monospace" fontWeight={f.id === 'tower' ? 700 : 400}>
            {freqText(f)}
          </text>
        </Tap>
      ))}

      {/* Draufsicht */}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke={INK} strokeWidth={0.6} />
      <line x1={iaf.x} y1={iaf.y} x2={thr.x} y2={thr.y} stroke={INK} strokeWidth={1.4} />
      <line x1={thr.x} y1={thr.y} x2={rwyEnd.x} y2={rwyEnd.y} stroke={INK} strokeWidth={6} />
      <Tap id="missed" x={Math.min(rwyEnd.x, missedEnd.x) - 6} y={Math.min(rwyEnd.y, missedEnd.y) - 6} w={Math.abs(missedEnd.x - rwyEnd.x) + 12} h={Math.abs(missedEnd.y - rwyEnd.y) + 12} onTap={onTap} marks={marks}>
        <line x1={rwyEnd.x} y1={rwyEnd.y} x2={missedEnd.x} y2={missedEnd.y} stroke={INK} strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#chartArrow)" />
      </Tap>
      <Tap id="faf" x={faf.x - 8} y={faf.y - 8} w={16} h={16} onTap={onTap} marks={marks}>
        <path d={`M${faf.x - 4},${faf.y - 4} L${faf.x + 4},${faf.y + 4} M${faf.x + 4},${faf.y - 4} L${faf.x - 4},${faf.y + 4}`} stroke={MAGENTA} strokeWidth={2} />
      </Tap>
      <text x={faf.x + 8} y={faf.y - 6} fontSize={6.5} fill={INK} fontFamily="monospace">
        FAF {ap.fafNm} NM
      </text>
      <Tap id="iaf" x={iaf.x - 8} y={iaf.y - 8} w={16} h={16} onTap={onTap} marks={marks}>
        <path d={`M${iaf.x},${iaf.y - 5} L${iaf.x + 5},${iaf.y + 4} L${iaf.x - 5},${iaf.y + 4} Z`} fill="none" stroke={INK} strokeWidth={1.2} />
      </Tap>
      <text x={iaf.x + 8} y={iaf.y + 3} fontSize={6.5} fill={INK} fontFamily="monospace">
        IAF {formatAltitude(ap.iafAlt)}
      </text>
      <text x={(faf.x + thr.x) / 2 + dir.y * 10} y={(faf.y + thr.y) / 2 - dir.x * 10} fontSize={7} fill={INK} fontFamily="monospace" textAnchor="middle">
        {formatHeading(ap.course)}°
      </text>
      <Tap id="msa" x={16} y={124} w={64} h={64} onTap={onTap} marks={marks}>
        <circle cx={48} cy={156} r={28} fill="none" stroke={INK} strokeWidth={0.8} />
        <text x={48} y={150} fontSize={6} fill={INK} textAnchor="middle" fontFamily="monospace">
          MSA 25 NM
        </text>
        <text x={48} y={162} fontSize={8} fill={INK} textAnchor="middle" fontFamily="monospace" fontWeight={700}>
          {formatAltitude(ap.msa)}
        </text>
      </Tap>
      <g transform="translate(392 138)">
        <path d="M0,-10 L4,3 L0,0 L-4,3 Z" fill={INK} />
        <text x={0} y={12} fontSize={6} fill={INK} textAnchor="middle" fontFamily="monospace">
          N
        </text>
      </g>

      {/* Profil */}
      <line x1={8} y1={322} x2={412} y2={322} stroke={INK} strokeWidth={0.6} />
      <line x1={20} y1={404} x2={400} y2={404} stroke={INK} strokeWidth={1} />
      <line x1={20} y1={py(ap.fafAlt - (elev ?? 0))} x2={px(ap.fafNm)} y2={py(ap.fafAlt - (elev ?? 0))} stroke={INK} strokeWidth={1.2} />
      <line x1={px(ap.fafNm)} y1={py(ap.fafAlt - (elev ?? 0))} x2={px(0)} y2={py(50)} stroke={INK} strokeWidth={1.4} />
      <Tap id="faf" x={px(ap.fafNm) - 30} y={py(ap.fafAlt - (elev ?? 0)) - 22} w={60} h={30} onTap={onTap} marks={marks}>
        <path
          d={`M${px(ap.fafNm) - 4},${py(ap.fafAlt - (elev ?? 0)) - 4} L${px(ap.fafNm) + 4},${py(ap.fafAlt - (elev ?? 0)) + 4} M${px(ap.fafNm) + 4},${py(ap.fafAlt - (elev ?? 0)) - 4} L${px(ap.fafNm) - 4},${py(ap.fafAlt - (elev ?? 0)) + 4}`}
          stroke={MAGENTA}
          strokeWidth={2}
        />
        <text x={px(ap.fafNm)} y={py(ap.fafAlt - (elev ?? 0)) - 9} fontSize={7} fill={INK} textAnchor="middle" fontFamily="monospace" fontWeight={700}>
          {formatAltitude(ap.fafAlt)}
        </text>
      </Tap>
      <text x={(px(ap.fafNm) + px(0)) / 2 + 6} y={(py(ap.fafAlt - (elev ?? 0)) + py(50)) / 2 - 4} fontSize={6.5} fill={INK} fontFamily="monospace">
        {ap.type === 'ILS' ? 'GS' : 'VDA'} 3.00°
      </text>
      <text x={px(0)} y={416} fontSize={6.5} fill={INK} textAnchor="middle" fontFamily="monospace">
        RWY {ap.runway} · TCH 50
      </text>
      <text x={px(ap.fafNm)} y={416} fontSize={6.5} fill={INK} textAnchor="middle" fontFamily="monospace">
        {ap.fafNm} NM
      </text>

      {/* Minima */}
      <line x1={8} y1={424} x2={412} y2={424} stroke={INK} strokeWidth={0.6} />
      <Tap id="minima" x={10} y={428} w={400} h={16} onTap={onTap} marks={marks}>
        <text x={14} y={439} fontSize={8} fill={INK} fontFamily="monospace">
          CATEGORY D · {ap.type === 'ILS' ? 'S-ILS' : 'S-TACAN'} {ap.runway} · {ap.minimumLabel} {formatAltitude(ap.minimumFt)}
          {elev !== undefined ? ` (${formatAltitude(ap.minimumFt - elev)} AGL)` : ''} · VIS {ap.visibility}
        </text>
      </Tap>
      <defs>
        <marker id="chartArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 Z" fill={INK} />
        </marker>
      </defs>
      <Footer data={data} y={458} />
    </svg>
  )
}

export function Chart({ data, onTap, marks }: { data: ChartData; onTap?: (id: string) => void; marks?: Record<string, ChartMark> }) {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      {data.kind === 'approach' && data.approach ? (
        <ApproachChart data={data} onTap={onTap} marks={marks} />
      ) : (
        <AirportDiagram data={data} onTap={onTap} marks={marks} />
      )}
      {data.elevationFt === undefined && (
        <p className="mt-1 text-xs text-muted">Platzhöhe fehlt in den Flugplatzdaten – Höhen sind als Höhe über Platz zu lesen.</p>
      )}
    </div>
  )
}
