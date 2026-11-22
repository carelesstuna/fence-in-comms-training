/**
 * Szenario einzeln spielen (#/scenario/<id>) – zum Üben und zum Prüfen beim Schreiben.
 * Mit ?checkride als Checkride-Vorschau (ohne Hilfen, zählt nicht für den Rang).
 */
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { newSeed } from '../../core/random/rng'
import { resolveScenario } from '../../core/drills/resolve'
import { useApp } from '../../state/store'
import { content, makeRun, RunContext } from '../../ui/run'
import { ScenarioPlayer } from '../../components/ScenarioPlayer'

export function ScenarioPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const checkride = params.has('checkride')
  return <ScenarioRun key={`${id}-${checkride}`} id={id} checkride={checkride} />
}

function ScenarioRun({ id, checkride }: { id: string; checkride: boolean }) {
  const sc = content.scenarios.get(id)
  // Regeln des Rangs, der dieses Szenario als Checkride nutzt – sonst die Standardwerte
  const rank = content.curriculum.ranks.find((r) => r.checkride?.scenario === id)
  const mode = checkride
    ? { label: rank ? `${rank.name} (Vorschau)` : 'Vorschau', rule: rank?.checkride ?? { passScore: 0.8, noCritical: true } }
    : undefined
  const profile = useApp((s) => s.profile)
  const [seed, setSeed] = useState(newSeed)
  // Profil nur beim Start eines Durchlaufs lesen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useMemo(() => makeRun(profile, seed), [seed])
  const resolved = useMemo(() => (sc ? resolveScenario(sc, run.envFor('scenario')) : null), [sc, run])

  if (!sc || !resolved) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-white">Szenario „{id}“ nicht gefunden</h1>
        <ul className="mt-3 space-y-1 font-mono text-sm">
          {[...content.scenarios.keys()].map((k) => (
            <li key={k}>
              <Link to={`/scenario/${k}`} className="hover:text-phosphor">
                {k}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    <RunContext.Provider value={run}>
      <div className="mb-4">
        <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
          {mode ? 'Checkride-Vorschau' : 'Szenario'} · Mission #{seed}
        </div>
        <h1 className="text-xl font-semibold text-white">{resolved.title}</h1>
        <p className="text-sm text-muted">{resolved.summary}</p>
        <Link to={mode ? `/scenario/${id}` : `/scenario/${id}?checkride`} className="text-xs text-muted hover:text-text">
          {mode ? '→ Als Training spielen' : '→ Als Checkride spielen (Vorschau, zählt nicht)'}
        </Link>
      </div>
      <ScenarioPlayer key={seed} scenario={resolved} seed={seed} checkride={mode} onRestart={() => setSeed(newSeed())} />
    </RunContext.Provider>
  )
}
