/**
 * Baustein ::chart{kind=airport|approach airfield=<id> freqs=sim|real} für Leseseiten.
 * Ohne airfield wird ein Flugplatz gewürfelt (mit Knopf „anderer Platz“).
 */
import { useMemo, useState } from 'react'
import { resolveChartBlock } from '../core/charts/block'
import { useRun } from '../ui/run'
import { Chart } from './Chart'

export function ChartBlock({ kind, airfield, freqs }: { kind: 'airport' | 'approach'; airfield?: string; freqs?: 'sim' | 'real' }) {
  const run = useRun()
  const [roll, setRoll] = useState(0)
  const chart = useMemo(
    () => resolveChartBlock(kind, airfield, freqs ?? 'sim', run.envFor(`chart:${kind}:${airfield ?? ''}:${roll}`)),
    [run, kind, airfield, freqs, roll],
  )
  return (
    <figure className="space-y-2">
      <Chart data={chart} />
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {kind === 'airport' ? 'Platzkarte' : 'Anflugkarte'} {chart.name} – schematisch, Frequenzen {freqs === 'real' ? 'laut echtem AIP' : 'aus Sim und Comm Plan'}.
        </span>
        <button
          onClick={() => setRoll((r) => r + 1)}
          className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-phosphor-dim hover:text-phosphor"
        >
          ⟳ {airfield ? 'Neu würfeln' : 'Anderer Platz'}
        </button>
      </figcaption>
    </figure>
  )
}
