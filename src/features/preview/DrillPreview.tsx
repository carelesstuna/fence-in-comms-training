/**
 * Vorschau einer einzelnen Übung (#/drill/<id>) – zum Prüfen beim Schreiben von Inhalten.
 * Jeder Klick auf „Neu würfeln“ zeigt dieselbe Übung mit anderen Zufallswerten.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { newSeed } from '../../core/random/rng'
import { resolveDrill } from '../../core/drills/resolve'
import { useApp } from '../../state/store'
import { content, makeRun, RunContext } from '../../ui/run'
import { DrillView } from '../../components/Drills'

/** Neu aufbauen, wenn sich die ID in der URL ändert (sonst bliebe der alte Zustand stehen). */
export function DrillPreview() {
  const { id = '' } = useParams()
  return <DrillPreviewInner key={id} id={id} />
}

function DrillPreviewInner({ id }: { id: string }) {
  const drill = content.drills.get(id)
  const profile = useApp((s) => s.profile)
  const [seed, setSeed] = useState(newSeed)
  const run = useMemo(() => makeRun(profile, seed), [profile, seed])
  const [result, setResult] = useState<boolean | null>(null)
  const resolved = useMemo(() => (drill ? resolveDrill(drill, run.envFor(0)) : null), [drill, run])

  if (!drill || !resolved) {
    const ids = [...content.drills.keys()].sort()
    return (
      <div>
        <h1 className="text-xl font-semibold text-white">Übung „{id}“ nicht gefunden</h1>
        <p className="mt-2 text-sm text-muted">Vorhandene Übungen:</p>
        <ul className="mt-2 grid gap-1 font-mono text-sm sm:grid-cols-2">
          {ids.map((d) => (
            <li key={d}>
              <Link to={`/drill/${d}`} className="hover:text-phosphor">
                {d}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <RunContext.Provider value={run}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Vorschau · {drill.type}</div>
          <h1 className="font-mono text-lg text-white">{drill.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          {result !== null && <span className={`text-sm ${result ? 'text-emerald-300' : 'text-red-300'}`}>{result ? 'richtig' : 'falsch'}</span>}
          <span className="font-mono text-xs text-muted">#{seed}</span>
          <button
            onClick={() => {
              setSeed(newSeed())
              setResult(null)
            }}
            className="rounded-md border border-line px-2.5 py-1 text-sm text-muted hover:text-text"
          >
            ⟳ Neu würfeln
          </button>
        </div>
      </div>
      <div key={seed} className="rounded-xl border border-line bg-panel p-5">
        <DrillView drill={resolved} onAnswered={setResult} />
      </div>
    </RunContext.Provider>
  )
}
