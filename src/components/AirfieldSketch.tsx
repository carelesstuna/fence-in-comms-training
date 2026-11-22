/**
 * Schematische Platzskizze aus den Flugplatzdaten: Bahnen nach Kurs, aktive Bahn, Wind, eigene Position.
 * Ausdrücklich keine Navigationskarte.
 */
import type { ScenarioSketch } from '../core/drills/types'

const C = 100
const HALF = 62

function vec(headingDeg: number) {
  const r = (headingDeg * Math.PI) / 180
  return { x: Math.sin(r), y: -Math.cos(r) }
}

interface Rwy {
  ends: [string, string]
  heading: number
  offset: number
}

function runwaysOf(pairs: string[]): Rwy[] {
  return pairs.map((pair) => {
    const ends = pair.split('/') as [string, string]
    const side = ends[0].match(/[LRC]$/)?.[0]
    // "left" zeigt in Blickrichtung des ersten Bahnendes nach links: L liegt dort, R gegenüber
    return { ends, heading: Number(ends[0].replace(/[LRC]/, '')) * 10, offset: side === 'L' ? 9 : side === 'R' ? -9 : 0 }
  })
}

export function AirfieldSketch({ sketch, pos }: { sketch: ScenarioSketch; pos?: string }) {
  const rwys = runwaysOf(sketch.airfield.runways)
  const active = rwys.find((r) => r.ends.includes(sketch.runway ?? '')) ?? rwys[0]
  const activeEnd = sketch.runway && active.ends.includes(sketch.runway) ? sketch.runway : active.ends[0]
  const activeHeading = Number(activeEnd.replace(/[LRC]/, '')) * 10
  const d = vec(activeHeading)
  const left = { x: d.y, y: -d.x }
  const center = { x: C + left.x * active.offset, y: C + left.y * active.offset }
  const threshold = { x: center.x - d.x * HALF, y: center.y - d.y * HALF }
  const depEnd = { x: center.x + d.x * HALF, y: center.y + d.y * HALF }
  const apron = { x: C - left.x * 38, y: C - left.y * 38 }
  const hold = { x: threshold.x - left.x * 13 + d.x * 4, y: threshold.y - left.y * 13 + d.y * 4 }
  const positions: Record<string, { x: number; y: number; heading?: number }> = {
    parking: { ...apron },
    taxi: { x: (apron.x + hold.x) / 2, y: (apron.y + hold.y) / 2 },
    holdshort: hold,
    runway: { x: threshold.x + d.x * 8, y: threshold.y + d.y * 8, heading: activeHeading },
    airborne: { x: depEnd.x + d.x * 16, y: depEnd.y + d.y * 16, heading: activeHeading },
    pattern: { x: center.x + left.x * 34, y: center.y + left.y * 34, heading: (activeHeading + 180) % 360 },
    final: { x: threshold.x - d.x * 22, y: threshold.y - d.y * 22, heading: activeHeading },
    landed: { x: center.x + d.x * 10, y: center.y + d.y * 10, heading: activeHeading },
  }
  const me = pos ? positions[pos] : undefined

  return (
    <figure className="rounded-xl border border-line bg-[#07100c] p-2">
      <svg viewBox="0 0 200 200" className="w-full" role="img" aria-label={`Schematische Skizze ${sketch.airfield.name}`}>
        <text x={6} y={11} fontSize={7} fill="#9fb8a9" fontFamily="monospace">
          {sketch.airfield.name.toUpperCase()}
        </text>
        {/* Vorfeld */}
        <rect x={apron.x - 14} y={apron.y - 8} width={28} height={16} rx={2} fill="#14231c" stroke="#24382e" strokeWidth={0.6} />
        <text x={apron.x} y={apron.y + 13} fontSize={4.5} fill="#5d7a69" textAnchor="middle" fontFamily="monospace">
          APRON
        </text>
        {/* Rollweg Vorfeld → Haltepunkt */}
        <line x1={apron.x} y1={apron.y} x2={hold.x} y2={hold.y} stroke="#3a4f43" strokeWidth={2.2} strokeLinecap="round" />
        {/* Bahnen */}
        {rwys.map((r, i) => {
          const v = vec(r.heading)
          const l = { x: v.y, y: -v.x }
          const c = { x: C + l.x * r.offset, y: C + l.y * r.offset }
          const a = { x: c.x - v.x * HALF, y: c.y - v.y * HALF }
          const b = { x: c.x + v.x * HALF, y: c.y + v.y * HALF }
          const isActive = r === active
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isActive ? '#2f4a3a' : '#25332c'} strokeWidth={7} />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isActive ? '#7dd87d' : '#4b5d53'} strokeWidth={0.6} strokeDasharray="3 2" />
              <text x={a.x - v.x * 8} y={a.y - v.y * 8 + 2} fontSize={6} fill={isActive && r.ends[0] === activeEnd ? '#7dd87d' : '#8aa595'} textAnchor="middle" fontFamily="monospace">
                {r.ends[0]}
              </text>
              <text x={b.x + v.x * 8} y={b.y + v.y * 8 + 2} fontSize={6} fill={isActive && r.ends[1] === activeEnd ? '#7dd87d' : '#8aa595'} textAnchor="middle" fontFamily="monospace">
                {r.ends[1]}
              </text>
            </g>
          )
        })}
        {/* Richtungspfeil der aktiven Bahn */}
        <path
          d={`M${center.x - d.x * 18},${center.y - d.y * 18} L${center.x + d.x * 18},${center.y + d.y * 18}`}
          stroke="#7dd87d"
          strokeWidth={1}
          markerEnd="url(#arrow)"
        />
        {/* Haltepunkt */}
        <line x1={hold.x - left.x * 4} y1={hold.y - left.y * 4} x2={hold.x + left.x * 4} y2={hold.y + left.y * 4} stroke="#f2c14e" strokeWidth={1.2} />
        {/* Wind */}
        {sketch.wind && sketch.wind.speed > 0 && (
          <g transform={`translate(176 26) rotate(${sketch.wind.dir + 180})`}>
            <line x1={0} y1={9} x2={0} y2={-9} stroke="#9fd0ff" strokeWidth={1.2} markerEnd="url(#arrowBlue)" />
          </g>
        )}
        {sketch.wind && (
          <text x={176} y={46} fontSize={5} fill="#9fd0ff" textAnchor="middle" fontFamily="monospace">
            {sketch.wind.speed > 0 ? sketch.wind.text.replace(' at ', '/').replace(/ gusting /, 'G') : 'calm'}
          </text>
        )}
        {/* Eigenes Flugzeug */}
        {me && (
          <g transform={`translate(${me.x} ${me.y}) rotate(${me.heading ?? 0})`}>
            {me.heading === undefined ? <circle r={3.2} fill="#f2c14e" /> : <path d="M0,-5 L3.5,4 L0,2.2 L-3.5,4 Z" fill="#f2c14e" />}
          </g>
        )}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="#7dd87d" />
          </marker>
          <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill="#9fd0ff" />
          </marker>
        </defs>
      </svg>
      <figcaption className="px-1 pb-1 text-[10px] tracking-wider text-muted uppercase">Schematisch · keine Navigationskarte</figcaption>
    </figure>
  )
}
