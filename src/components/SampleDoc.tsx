/**
 * Baustein ::muster{doc=frag|commcard|spins|sop} für Leseseiten: ein gewürfeltes Beispiel einer Unterlage, passend zum
 * Durchlauf (Rufzeichen, Platz, Comm Plan). Mit „Neu würfeln“ und einer Erklärung je Zeile zum Aufklappen.
 */
import { useMemo, useState } from 'react'
import { buildSampleDoc, type SampleDocKind } from '../core/docs/sample'
import { useRun } from '../ui/run'
import { Kneeboard } from './Kneeboard'

export function SampleDocBlock({ doc }: { doc: SampleDocKind }) {
  const run = useRun()
  const [roll, setRoll] = useState(0)
  const [explain, setExplain] = useState(true)
  const d = useMemo(() => buildSampleDoc(doc, run.envFor(`muster:${doc}:${roll}`)), [run, doc, roll])
  return (
    <figure className="my-4 space-y-2">
      {d.stations ? (
        <Kneeboard kb={{ title: d.header, stations: d.stations, airfieldRows: [], rows: [] }} />
      ) : (
        <div className="rounded-xl border border-[#c9c2ae] bg-[#f3efe4] p-4 font-mono text-[13px] text-[#1d1d1b] shadow-inner">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#1d1d1b]/30 pb-1">
            <span className="font-bold tracking-wide uppercase">{d.header}</span>
            <span className="text-[10px] text-[#6b6657] uppercase">{d.title.split(' – ')[0]}</span>
          </div>
          <dl className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-1">
            {d.rows.map((r) => (
              <div key={r.label} className="contents">
                <dt className="text-[#6b6657]">{r.label}</dt>
                <dd className="min-w-0">
                  <span className="font-semibold break-words">{r.value}</span>
                  {explain && r.hint && <span className="block font-sans text-[12px] text-[#4b4639]">{r.hint}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{d.title} – gewürfeltes Beispiel, kein echtes Dokument.</span>
        <span className="flex gap-2">
          {!d.stations && (
            <button
              onClick={() => setExplain(!explain)}
              className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-phosphor-dim hover:text-phosphor"
            >
              {explain ? 'Erklärungen aus' : 'Erklärungen an'}
            </button>
          )}
          <button
            onClick={() => setRoll((r) => r + 1)}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-phosphor-dim hover:text-phosphor"
          >
            ⟳ Neu würfeln
          </button>
        </span>
      </figcaption>
    </figure>
  )
}
