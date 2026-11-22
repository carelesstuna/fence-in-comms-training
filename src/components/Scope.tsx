/**
 * Bullseye-Karte als SVG: Ringe alle 20 NM, Peilungsstrahlen, eigenes Flugzeug, Gruppen mit Kursvektor.
 * Koordinaten in NM, Bullseye im Ursprung, x = Osten, y = Norden.
 */
import type { MouseEvent } from 'react'
import type { GeoPicture, Point } from '../core/random/geo'

const R = 80 // NM bis zum äußersten Ring

export interface ScopeMarker extends Point {
  label?: string
  tone: 'user' | 'truth'
}

function rad(deg: number) {
  return (deg * Math.PI) / 180
}

/** NM → SVG (y nach unten). */
const sx = (p: Point) => p.x
const sy = (p: Point) => -p.y

export function Scope({
  picture,
  showGroups,
  highlight,
  showOwn = true,
  markers = [],
  lines = [],
  onPick,
}: {
  picture: GeoPicture
  /** Welche Gruppen sichtbar sind (Indizes). */
  showGroups: number[]
  highlight?: number
  showOwn?: boolean
  markers?: ScopeMarker[]
  lines?: [Point, Point][]
  onPick?: (p: Point) => void
}) {
  const click = (e: MouseEvent<SVGSVGElement>) => {
    if (!onPick) return
    const svg = e.currentTarget
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const p = pt.matrixTransform(ctm.inverse())
    onPick({ x: p.x, y: -p.y })
  }
  const own = picture.own
  return (
    <svg
      viewBox={`${-R - 14} ${-R - 14} ${2 * R + 28} ${2 * R + 28}`}
      className={`w-full max-w-[460px] rounded-xl border border-line bg-[#06120c] ${onPick ? 'cursor-crosshair' : ''}`}
      onClick={click}
      role="img"
      aria-label="Bullseye-Karte"
    >
      {/* Ringe und Strahlen */}
      {[20, 40, 60, 80].map((r) => (
        <g key={r}>
          <circle cx={0} cy={0} r={r} fill="none" stroke="#1f3a2b" strokeWidth={0.6} />
          <text x={2} y={-r - 1.5} fontSize={4.5} fill="#4f7d63" fontFamily="monospace">
            {r}
          </text>
        </g>
      ))}
      {Array.from({ length: 12 }, (_, i) => i * 30).map((b) => (
        <g key={b}>
          <line x1={0} y1={0} x2={Math.sin(rad(b)) * R} y2={-Math.cos(rad(b)) * R} stroke="#173024" strokeWidth={0.5} />
          <text
            x={Math.sin(rad(b)) * (R + 7)}
            y={-Math.cos(rad(b)) * (R + 7) + 1.6}
            fontSize={4.8}
            fill="#5f9474"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {String(b === 0 ? 360 : b).padStart(3, '0')}
          </text>
        </g>
      ))}
      {/* Bullseye */}
      <circle cx={0} cy={0} r={2.2} fill="none" stroke="#7dd87d" strokeWidth={0.8} />
      <circle cx={0} cy={0} r={0.8} fill="#7dd87d" />
      <text x={3.5} y={6} fontSize={4} fill="#7dd87d" fontFamily="monospace">
        BULLSEYE
      </text>

      {/* Hilfslinien (z. B. Abweichung nach dem Prüfen) */}
      {lines.map(([a, b], i) => (
        <line key={i} x1={sx(a)} y1={sy(a)} x2={sx(b)} y2={sy(b)} stroke="#f2c14e" strokeWidth={0.6} strokeDasharray="2 1.5" />
      ))}

      {/* Gruppen */}
      {picture.groups.map((g, i) =>
        showGroups.includes(i) ? (
          <g key={i}>
            <line
              x1={sx(g)}
              y1={sy(g)}
              x2={sx(g) + Math.sin(rad(g.heading)) * 9}
              y2={sy(g) - Math.cos(rad(g.heading)) * 9}
              stroke={highlight === i ? '#ff6b6b' : '#c0504d'}
              strokeWidth={0.9}
            />
            <rect
              x={sx(g) - 2.4}
              y={sy(g) - 2.4}
              width={4.8}
              height={4.8}
              transform={`rotate(45 ${sx(g)} ${sy(g)})`}
              fill={highlight === i ? '#ff6b6b' : '#c0504d'}
            />
            <text x={sx(g) + 4} y={sy(g) - 3} fontSize={4.2} fill="#ffb3b3" fontFamily="monospace">
              {Math.round(g.altFt / 1000)}
            </text>
          </g>
        ) : null,
      )}

      {/* Eigenes Flugzeug */}
      {showOwn && (
        <g transform={`translate(${sx(own)} ${sy(own)}) rotate(${own.heading})`}>
          <path d="M0,-4.5 L3,3.5 L0,2 L-3,3.5 Z" fill="#7ec8ff" />
        </g>
      )}

      {/* Marker */}
      {markers.map((m, i) => (
        <g key={i}>
          <circle cx={sx(m)} cy={sy(m)} r={3} fill="none" stroke={m.tone === 'user' ? '#f2c14e' : '#7dd87d'} strokeWidth={1} />
          <line x1={sx(m) - 4.5} y1={sy(m)} x2={sx(m) + 4.5} y2={sy(m)} stroke={m.tone === 'user' ? '#f2c14e' : '#7dd87d'} strokeWidth={0.6} />
          <line x1={sx(m)} y1={sy(m) - 4.5} x2={sx(m)} y2={sy(m) + 4.5} stroke={m.tone === 'user' ? '#f2c14e' : '#7dd87d'} strokeWidth={0.6} />
          {m.label && (
            <text x={sx(m) + 5} y={sy(m) + 6} fontSize={4} fill={m.tone === 'user' ? '#f2c14e' : '#7dd87d'} fontFamily="monospace">
              {m.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export function ScopeLegend({ showOwn = true }: { showOwn?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full border border-phosphor" /> Bullseye
      </span>
      {showOwn && (
        <span className="flex items-center gap-1.5">
          <span className="text-[#7ec8ff]">▲</span> Du (Nase = Kurs)
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rotate-45 bg-[#c0504d]" /> Gruppe, Strich = Kurs, Zahl = Höhe in Tausend Fuß
      </span>
      <span>Oben = missweisend Nord (360), wie im Funk</span>
    </div>
  )
}
