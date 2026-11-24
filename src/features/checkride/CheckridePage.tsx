/**
 * Checkride (#/checkride/<rangId>): die Rangprüfung – ein Szenario ohne Hilfen.
 * Bestanden heißt: Ergebnis über der Grenze und (falls verlangt) kein kritischer Fehler.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { newSeed } from '../../core/random/rng'
import { resolveScenario } from '../../core/drills/resolve'
import { applyCheckrideResult, checkrideStatus, rankFor } from '../../core/progress/progress'
import type { CheckrideResult } from '../../core/scoring/checkride'
import { useApp } from '../../state/store'
import { content, makeRun, RunContext } from '../../ui/run'
import { ScenarioPlayer } from '../../components/ScenarioPlayer'

export function CheckridePage() {
  const { rankId = '' } = useParams()
  return <CheckrideRun key={rankId} rankId={rankId} />
}

function CheckrideRun({ rankId }: { rankId: string }) {
  const rank = content.curriculum.ranks.find((r) => r.id === rankId)
  const progress = useApp((s) => s.progress)
  const setProgress = useApp((s) => s.setProgress)
  const profile = useApp((s) => s.profile)
  const [seed, setSeed] = useState(newSeed)
  const [promoted, setPromoted] = useState<string | null>(null)
  // Status beim Öffnen festhalten – sonst springt die Seite nach dem Bestehen auf „bestanden“ um
  const [status] = useState(() => checkrideStatus(content, progress, rankId))
  const sc = rank?.checkride ? content.scenarios.get(rank.checkride.scenario) : undefined
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useMemo(() => makeRun(profile, seed), [seed])
  const resolved = useMemo(
    () => (sc ? resolveScenario(sc, run.envFor('checkride')) : null),
    [sc, run],
  )

  if (!rank?.checkride || !status || !resolved) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-white">Kein Checkride „{rankId}“</h1>
        <Link to="/" className="mt-3 inline-block text-phosphor hover:underline">
          ← Zur Ausbildung
        </Link>
      </div>
    )
  }

  if (status.state === 'locked') {
    return (
      <div className="space-y-4">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            Checkride · {rank.name}
          </div>
          <h1 className="text-xl font-semibold text-white">Noch nicht zugelassen</h1>
        </div>
        <div className="rounded-xl border border-line bg-panel p-4">
          <p>Für den Checkride zum {rank.name} fehlt noch:</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-muted">
            {status.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <Link to="/" className="inline-block text-phosphor hover:underline">
          ← Zur Ausbildung
        </Link>
      </div>
    )
  }

  const onCheckride = (v: CheckrideResult) => {
    const before = rankFor(content, progress).current.id
    const next = applyCheckrideResult(progress, rank.id, v.score, v.passed)
    setProgress(next)
    const after = rankFor(content, next).current
    if (after.id !== before) setPromoted(after.name)
  }

  return (
    <RunContext.Provider value={run}>
      <div className="mb-4">
        <div className="font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">
          Checkride · {rank.name}
        </div>
        <h1 className="text-xl font-semibold text-white">{resolved.title}</h1>
        <p className="text-sm text-muted">{rank.description}</p>
        {status.state === 'passed' && (
          <p className="mt-1 text-sm text-emerald-300">
            Schon bestanden – dieser Flug zählt nur zur Übung.
          </p>
        )}
      </div>
      {promoted && (
        <div className="mb-4 rounded-xl border border-amber-hud/60 bg-amber-hud/10 px-5 py-4">
          <div className="font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">
            Beförderung
          </div>
          <div className="text-2xl font-semibold text-amber-hud">Neuer Dienstgrad: {promoted}</div>
          <Link to="/" className="mt-2 inline-block text-sm text-phosphor hover:underline">
            ← Zur Ausbildung
          </Link>
        </div>
      )}
      <ScenarioPlayer
        key={seed}
        scenario={resolved}
        seed={seed}
        checkride={{ label: rank.name, rule: rank.checkride }}
        refParts={[`Checkride ${rank.id}`]}
        onCheckride={onCheckride}
        onRestart={() => {
          setPromoted(null)
          setSeed(newSeed())
        }}
      />
    </RunContext.Provider>
  )
}
