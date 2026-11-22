/**
 * Kneeboard / Comm Card eines Szenarios und Fundort-Hinweise je Sim.
 */
import { useState } from 'react'
import type { ResolvedKneeboard, WhereMap } from '../core/drills/types'
import type { Sim } from '../core/content/schema'
import { useApp } from '../state/store'
import { SIM_LABELS } from '../ui/labels'
import { Chart } from './Chart'

/** Wo steht das? – gefiltert auf die Sims im Profil (ohne Treffer: alle). */
export function WhereHint({ where, title = 'Wo steht das?' }: { where?: WhereMap; title?: string }) {
  const sims = useApp((s) => s.profile.sims)
  if (!where) return null
  const entries = Object.entries(where) as [Sim, string][]
  const mine = entries.filter(([k]) => sims.includes(k))
  const shown = mine.length ? mine : entries
  return (
    <div className="mt-2 rounded-lg border border-sky-400/30 bg-sky-500/5 px-3 py-2 text-sm text-sky-100">
      <div className="mb-1 text-xs font-semibold tracking-wider text-sky-300 uppercase">{title}</div>
      <ul className="space-y-1">
        {shown.map(([sim, text]) => (
          <li key={sim}>
            <span className="font-semibold">{SIM_LABELS[sim] ?? sim}:</span> {text}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Kneeboard({ kb, compact = false }: { kb: ResolvedKneeboard; compact?: boolean }) {
  const [showChart, setShowChart] = useState(false)
  return (
    <div className="rounded-xl border border-[#c9c2ae] bg-[#f3efe4] p-4 font-mono text-[13px] text-[#1d1d1b] shadow-inner">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#1d1d1b]/30 pb-1">
        <span className="font-bold tracking-wide uppercase">{kb.title}</span>
        <span className="text-[10px] text-[#6b6657]">KNEEBOARD</span>
      </div>
      {kb.stations.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-[#6b6657]">
              <th className="py-0.5 font-normal">Stelle</th>
              <th className="py-0.5 font-normal">Kanal</th>
              <th className="py-0.5 text-right font-normal">Frequenz</th>
            </tr>
          </thead>
          <tbody>
            {kb.stations.map((s) => (
              <tr key={s.name} className="border-t border-[#1d1d1b]/10">
                <td className="py-0.5">{s.name}</td>
                <td className="py-0.5">{s.channel}</td>
                <td className="py-0.5 text-right font-semibold">{s.freq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {kb.rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {kb.rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-[#6b6657]">{r.label}</dt>
              <dd className="text-right font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {kb.airfieldRows.length > 0 && !compact && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-[#1d1d1b]/20 pt-2">
          {kb.airfieldRows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-[#6b6657]">{r.label}</dt>
              <dd className="text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {kb.chart && (
        <div className="mt-2">
          <button onClick={() => setShowChart(!showChart)} className="text-[12px] text-[#2563eb] underline underline-offset-2">
            {showChart ? 'Karte ausblenden' : 'Karte anzeigen'}
          </button>
          {showChart && (
            <div className="mt-2">
              <Chart data={kb.chart} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
