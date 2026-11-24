import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { newSeed } from '../../core/random/rng'
import { matchesProfile, resolveDrill, resolveScenario } from '../../core/drills/resolve'
import type { ResolvedDrill, ResolvedScenario } from '../../core/drills/types'
import { ScenarioPlayer } from '../../components/ScenarioPlayer'
import { compactSteps, type PlayStep } from '../../core/content/compact'
import { applyLessonResult, lessonAfter, lessonState } from '../../core/progress/progress'
import { applyReviews } from '../../core/progress/review'
import { useApp } from '../../state/store'
import { content, makeRun, RunContext } from '../../ui/run'
import { Markdown, InlineMarkdown } from '../../components/Markdown'
import { DrillView } from '../../components/Drills'
import { HangarCardView } from '../../components/HangarCard'
import { RankBar } from '../../components/Layout'
import { RefTag } from '../../components/RefTag'
import { TaskLine } from '../../components/RadioFrame'
import { ScoreRing, StepFooter, StepHeader } from './Stepper'
import { readSavedRun, type SavedRun } from './savedRun'

/** Eingeklappte Leseseiten im Kompaktmodus. */
function Folded({ pages, label }: { pages?: string[]; label: string }) {
  if (!pages?.length) return null
  return (
    <details className="my-3 rounded-lg border border-line bg-panel px-4 py-2">
      <summary className="cursor-pointer text-sm text-muted select-none hover:text-text">
        {label} ({pages.length} {pages.length === 1 ? 'Seite' : 'Seiten'})
      </summary>
      <div className="mt-3 space-y-6 border-t border-line/60 pt-3">
        {pages.map((md, i) => (
          <Markdown key={i} text={md} />
        ))}
      </div>
    </details>
  )
}

/** Neu aufbauen, wenn sich die ID in der URL ändert (sonst bliebe der alte Zustand stehen). */
export function LessonPlayer() {
  const { id = '' } = useParams()
  return <LessonRun key={id} id={id} />
}

function LessonRun({ id }: { id: string }) {
  const lesson = content.lessons.get(id)
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useApp((s) => s.profile)
  const progress = useApp((s) => s.progress)
  const setProgress = useApp((s) => s.setProgress)
  const markHangarSeen = useApp((s) => s.markHangarSeen)

  // Beim Zurückkommen (Zurück-Taste) stellt der History-Eintrag den Stand wieder her
  const [saved] = useState(() => readSavedRun(location.state))
  const [seed, setSeed] = useState(() => saved?.seed ?? newSeed())
  /** Ergebnis pro Schritt: 0–1 (Übung richtig = 1, Szenario = Anteil). */
  const [results, setResults] = useState<Record<number, number>>(() => saved?.results ?? {})
  const [outcome, setOutcome] = useState<{ score: number; xp: number } | null>(null)

  // Profil bewusst nur beim Start eines Durchlaufs lesen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useMemo(() => makeRun(profile, seed), [seed])
  const compact = !!run.profile.compact
  // Übungen, die nicht zu Sims/Flugzeugen im Profil passen, werden übersprungen
  const steps = useMemo<PlayStep[]>(() => {
    const all =
      lesson?.steps.filter((s) => {
        if (s.kind === 'drill') return matchesProfile(content.drills.get(s.drillId) ?? {}, run.profile)
        if (s.kind === 'scenario') return matchesProfile(content.scenarios.get(s.scenarioId) ?? {}, run.profile)
        return true
      }) ?? []
    return compact ? compactSteps(all) : all
  }, [lesson, run, compact])
  const drills = useMemo<(ResolvedDrill | null)[]>(
    () =>
      steps.map((s, i) => {
        if (s.kind !== 'drill') return null
        const d = content.drills.get(s.drillId)
        return d ? resolveDrill(d, run.envFor(i)) : null
      }),
    [steps, run],
  )
  const scenarios = useMemo<(ResolvedScenario | null)[]>(
    () =>
      steps.map((s, i) => {
        if (s.kind !== 'scenario') return null
        const sc = content.scenarios.get(s.scenarioId)
        return sc ? resolveScenario(sc, run.envFor(i)) : null
      }),
    [steps, run],
  )

  const [step, setStep] = useState(() => Math.min(saved?.step ?? 0, Math.max(0, steps.length - 1)))
  const current = steps[step]
  // Stand im History-Eintrag mitführen (ersetzt den Eintrag, legt keinen neuen an)
  useEffect(() => {
    if (outcome) return
    const lessonRun: SavedRun = { seed, step, results }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: { lessonRun } })
    // location wird bewusst nicht beobachtet: Der Eintrag soll nur bei Änderungen des Stands neu geschrieben werden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, step, results, outcome])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])
  useEffect(() => {
    if (current?.kind === 'hangar') markHangarSeen(current.cardId)
  }, [current, markHangarSeen])

  if (!lesson) {
    return (
      <p>
        Lektion nicht gefunden. <Link to="/">Zurück</Link>
      </p>
    )
  }
  const module = content.modules.get(lesson.module)
  const total = steps.length
  const drillSteps = steps.map((s, i) => (s.kind === 'drill' || s.kind === 'scenario' ? i : -1)).filter((i) => i >= 0)

  const finish = () => {
    const score = drillSteps.length ? drillSteps.reduce((sum, i) => sum + (results[i] ?? 0), 0) / drillSteps.length : 1
    const { progress: next, xpGained } = applyLessonResult(content, progress, lesson.id, score)
    // Jede beantwortete Übung zählt als Wiederholung für den Funk-Drill des Tages
    const answers = steps.flatMap((s, i) => (s.kind === 'drill' && results[i] !== undefined ? [{ drillId: s.drillId, correct: results[i] >= 0.999 }] : []))
    setProgress(applyReviews(next, answers, new Date()))
    setOutcome({ score, xp: xpGained })
    window.scrollTo({ top: 0 })
  }

  const restart = () => {
    setSeed(newSeed())
    setStep(0)
    setResults({})
    setOutcome(null)
  }

  if (outcome) {
    // Empfohlen: die nächste noch offene Lektion – nach dem letzten Modul-Schritt die des nächsten Moduls
    const after = lessonAfter(content, progress, lesson.id)
    const nextId = after && lessonState(content, progress, after) !== 'locked' ? after : null
    const nextLesson = nextId ? content.lessons.get(nextId) : undefined
    const mistakes = drillSteps
      .filter((i) => (results[i] ?? 0) < 0.999)
      .map((i) => ({
        i,
        d: drills[i] ?? { prompt: `Szenario „${scenarios[i]?.title}“: ${Math.round((results[i] ?? 0) * 100)} %`, explain: 'Spiel es nochmal – jeder Durchlauf wird neu gewürfelt.' },
      }))
    return (
      <RunContext.Provider value={run}>
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Debriefing · Mission #{seed}</div>
            <h1 className="mt-1 text-2xl font-semibold text-white">{lesson.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <ScoreRing score={outcome.score} />
              <div className="space-y-1">
                <div className="text-lg">
                  {drillSteps.filter((i) => (results[i] ?? 0) >= 0.999).length} von {drillSteps.length} Übungen richtig
                </div>
                <div className="font-mono text-amber-hud">+{outcome.xp} XP</div>
                <div className="text-sm text-muted">
                  Dein Rufzeichen in diesem Durchlauf: <span className="font-mono text-text">{run.self.name} {run.self.flight}-{run.self.position}</span>
                </div>
              </div>
            </div>
          </div>
          <RankBar />
          {mistakes.length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-5">
              <h2 className="mb-3 font-semibold">Das solltest du dir nochmal ansehen</h2>
              <ul className="space-y-3">
                {mistakes.map(({ i, d }) => {
                  const s = steps[i]
                  return (
                    <li key={i} className="rounded-lg bg-black/20 px-3 py-2">
                      <TaskLine drill={d} />
                      {d.explain && (
                        <div className="mt-1 text-sm text-muted">
                          <InlineMarkdown text={d.explain} />
                        </div>
                      )}
                      <RefTag
                        parts={[lesson.id, `${i + 1}/${steps.length}`, s?.kind === 'drill' && s.drillId, s?.kind === 'scenario' && s.scenarioId]}
                        seed={seed}
                        className="mt-1"
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {nextLesson && (
              <button onClick={() => navigate(`/lesson/${nextLesson.id}`)} className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink">
                Weiter: {nextLesson.module !== lesson.module ? `Modul ${content.modules.get(nextLesson.module)?.code} · ` : ''}
                {nextLesson.title} →
              </button>
            )}
            <button onClick={restart} className="rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim">
              ⟳ Nochmal (neu gewürfelt)
            </button>
            <Link to="/" className="rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim">
              Zum Ausbildungsweg
            </Link>
          </div>
        </div>
      </RunContext.Provider>
    )
  }

  const answered = (current?.kind !== 'drill' && current?.kind !== 'scenario') || results[step] !== undefined
  const stepRef = [lesson.id, `${step + 1}/${total}`]
  const prevIsDrill = step > 0 && (steps[step - 1].kind === 'drill' || steps[step - 1].kind === 'scenario')

  return (
    <RunContext.Provider value={run}>
      <StepHeader
        title={lesson.title}
        sub={`Modul ${module?.code ?? '?'} · ${module?.title ?? ''} · Mission #${seed}${compact ? ' · kompakt' : ''}`}
        step={step}
        total={total}
        onExit={() => navigate('/')}
      />
      <div key={`${seed}-${step}`}>
        <Folded pages={current?.theory} label="Theorie dazu aufklappen" />
        {current?.kind === 'read' && <Markdown text={current.markdown} />}
        {current?.kind === 'hangar' && content.hangar.get(current.cardId) && <HangarCardView card={content.hangar.get(current.cardId)!} />}
        {current?.kind === 'drill' && drills[step] && (
          <div className="rounded-xl border border-line bg-panel p-5">
            <DrillView drill={drills[step]!} onAnswered={(c) => setResults((r) => ({ ...r, [step]: c ? 1 : 0 }))} />
          </div>
        )}
        {current?.kind === 'scenario' && scenarios[step] && (
          <ScenarioPlayer
            scenario={scenarios[step]!}
            seed={seed}
            refParts={stepRef}
            onComplete={(sc) => setResults((r) => ({ ...r, [step]: sc }))}
          />
        )}
        <Folded pages={current?.after} label="Zum Abschluss nachlesen" />
        {/* Szenarien zeigen die Referenz selbst – samt ihrem eigenen Schritt */}
        {current?.kind !== 'scenario' && (
          <RefTag parts={[...stepRef, current?.kind === 'drill' && current.drillId, current?.kind === 'hangar' && current.cardId]} seed={seed} />
        )}
      </div>
      <StepFooter
        canBack={step > 0 && !prevIsDrill}
        canNext={answered}
        last={step === total - 1}
        onBack={() => setStep(step - 1)}
        onNext={() => {
          if (step === total - 1) finish()
          else {
            setStep(step + 1)
            window.scrollTo({ top: 0 })
          }
        }}
        hint={!answered ? 'Erst die Übung lösen' : undefined}
      />
    </RunContext.Provider>
  )
}
