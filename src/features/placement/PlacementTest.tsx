import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { newSeed } from '../../core/random/rng'
import { matchesProfile, resolveDrill } from '../../core/drills/resolve'
import { drillSolution, hideRevealingContext, restatesSolution, withoutHint } from '../../core/drills/solution'
import type { ResolvedDrill } from '../../core/drills/types'
import { applyExamResult, applyPlacementResult, doneVia, drillLessonId, lessonState, moduleState } from '../../core/progress/progress'
import { hasExam, pickExam } from '../../core/progress/exam'
import { createRng } from '../../core/random/rng'
import { applyExamMistakes, applyReviews } from '../../core/progress/review'
import { useApp } from '../../state/store'
import { content, makeRun, RunContext } from '../../ui/run'
import { DrillView } from '../../components/Drills'
import { RefTag } from '../../components/RefTag'
import { TaskLine } from '../../components/RadioFrame'
import { InlineMarkdown } from '../../components/Markdown'
import { SkipToModule } from '../path/SkipToModule'
import { ScoreRing, StepFooter, StepHeader } from '../lesson/Stepper'

/**
 * Einstufungstest (`#/placement/:moduleId`, feste Fragen aus dem Lehrplan, vor dem Modul) und Modulprüfung
 * (`#/exam/:moduleId`, neue Fragen aus dem Prüfungspool, gewichtet nach Lektionen, nach dem Modul). Beide laufen gleich ab
 * und werten gleich aus; die Prüfung setzt bei Bestehen ebenfalls das Modul auf „erledigt“.
 *
 * Neu aufbauen, wenn sich die ID in der URL ändert (sonst bliebe der alte Zustand stehen).
 */
export function PlacementTest({ mode = 'placement' }: { mode?: 'placement' | 'exam' }) {
  const { moduleId = '' } = useParams()
  return <PlacementRun key={`${mode}-${moduleId}`} moduleId={moduleId} mode={mode} />
}

interface Outcome {
  score: number
  xp: number
  passed: boolean
  /** Stand vor diesem Versuch. */
  wasPassed: boolean
  /** Schon erledigt, aber auf anderem Weg (Lektionen, Einstufung oder Prüfung). */
  wasDoneVia: 'placement' | 'exam' | 'lessons' | null
  passedAt?: string
}

const DATE = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' })
const VIA: Record<'placement' | 'exam' | 'lessons', string> = { placement: 'per Einstufung', exam: 'per Modulprüfung', lessons: 'per Lektionen' }

/**
 * Text bei Neuerfolg, wenn ein Modul schon erledigt war (P1-19): Es sagt, wie es erledigt wurde – nicht pauschal „per
 * Lektionen“.
 */
function passedAgainText(isExam: boolean, via: Outcome['wasDoneVia']): string {
  if (!via) return 'Bestanden – das Modul gilt als erledigt.'
  return `Bestanden – das Modul hattest du schon ${VIA[via]} erledigt${isExam ? ', jetzt ist es auch geprüft' : ''}.`
}

/** Eine falsch beantwortete Frage: Aufgabe, richtige Antwort, Erklärung und die passende Lektion. */
function Mistake({ id, drill, moduleId, refParts, seed }: { id: string; drill: ResolvedDrill; moduleId: string; refParts: string[]; seed: string }) {
  const progress = useApp((s) => s.progress)
  const solution = drillSolution(drill)
  const lessonId = drillLessonId(content, id, moduleId)
  const lesson = lessonId ? content.lessons.get(lessonId) : undefined
  const open = !!lessonId && lessonState(content, progress, lessonId) !== 'locked'
  return (
    <li className="rounded-lg bg-black/20 px-3 py-2.5">
      <TaskLine drill={drill} />
      {solution && solution.length > 0 && (
        <div className="mt-1.5 text-sm">
          <span className="text-emerald-300">Richtig: </span>
          {solution.length === 1 ? (
            <span className="font-mono">{solution[0]}</span>
          ) : (
            <ul className="mt-0.5 ml-4 list-disc font-mono">
              {solution.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {drill.explain && !restatesSolution(drill.explain, solution) && (
        <div className="mt-1 text-sm text-muted">
          <InlineMarkdown text={drill.explain} />
        </div>
      )}
      {lesson && (
        <div className="mt-1.5 text-sm">
          {open ? (
            <Link to={`/lesson/${lesson.id}`} className="text-phosphor underline-offset-2 hover:underline">
              Zur Lektion „{lesson.title}“ →
            </Link>
          ) : (
            <span className="text-muted">Erklärt in der Lektion „{lesson.title}“ (öffnet sich mit dem Modul).</span>
          )}
        </div>
      )}
      <RefTag parts={[...refParts, id]} seed={seed} className="mt-1" />
    </li>
  )
}

function PlacementRun({ moduleId, mode }: { moduleId: string; mode: 'placement' | 'exam' }) {
  const isExam = mode === 'exam'
  const [search] = useSearchParams()
  const queue = (search.get('next') ?? '').split(',').filter(Boolean)
  const navigate = useNavigate()
  const module = content.modules.get(moduleId)
  const profile = useApp((s) => s.profile)
  const progress = useApp((s) => s.progress)
  const setProgress = useApp((s) => s.setProgress)

  const [seed, setSeed] = useState(newSeed)
  // Profil bewusst nur beim Start eines Durchlaufs lesen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useMemo(() => makeRun(profile, seed), [seed])
  const items = useMemo(() => {
    const ids = isExam ? pickExam(content, moduleId, createRng(`${seed}/exam`), run.profile).map((q) => q.id) : (module?.placement?.drills ?? [])
    return ids.flatMap((id, i) => {
      const d = content.drills.get(id)
      // Titel und Kontext eines Funkspruchs dürfen die gesuchte Antwort nicht vorsagen (P1-08); Hinweise wie
      // „Nummer – Treibstoff – tiger“ verraten den Aufbau, deshalb gibt es in Einstufung und Prüfung keine
      return d && matchesProfile(d, run.profile) ? [{ id, drill: withoutHint(hideRevealingContext(resolveDrill(d, run.envFor(i)))) }] : []
    })
  }, [module, run, isExam, moduleId, seed])
  const drills = items.map((x) => x.drill)
  const [step, setStep] = useState(0)
  const [results, setResults] = useState<Record<number, boolean>>({})
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const passScoreOf = isExam ? module?.exam?.passScore : module?.placement?.passScore
  if (!module || passScoreOf === undefined || (isExam && !hasExam(content, moduleId))) {
    return (
      <p>
        Für dieses Modul gibt es {isExam ? 'keine Modulprüfung' : 'keinen Einstufungstest'}. <Link to="/">Zurück</Link>
      </p>
    )
  }

  const goOn = () => {
    if (!isExam && queue.length) navigate(`/placement/${queue[0]}?next=${queue.slice(1).join(',')}`)
    else navigate('/')
  }

  const retry = () => {
    setSeed(newSeed())
    setStep(0)
    setResults({})
    setOutcome(null)
    window.scrollTo({ top: 0 })
  }

  if (outcome) {
    const wrong = items.map((x, i) => ({ ...x, i })).filter(({ i }) => !results[i])
    const pass = Math.round(passScoreOf * 100)
    const locked = moduleState(content, progress, module.id) === 'locked'
    return (
      <RunContext.Provider value={run}>
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
              {isExam ? 'Modulprüfung' : 'Einstufung'} · Modul {module.code}
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-white">{module.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <ScoreRing score={outcome.score} />
              <div className="max-w-md space-y-1">
                <div className="text-lg">
                  {drills.length - wrong.length} von {drills.length} Fragen richtig
                </div>
                {outcome.passed && outcome.wasPassed && <div className="text-emerald-300">Wieder bestanden – das Modul bleibt erledigt.</div>}
                {outcome.passed && !outcome.wasPassed && (
                  <>
                    <div className="text-emerald-300">{passedAgainText(isExam, outcome.wasDoneVia)}</div>
                    {outcome.xp > 0 && <div className="font-mono text-amber-hud">+{outcome.xp} XP</div>}
                    <p className="text-sm text-muted">Die Lektionen bleiben offen – du kannst sie jederzeit zum Auffrischen spielen.</p>
                  </>
                )}
                {!outcome.passed && outcome.wasPassed && (
                  <>
                    <div className="text-amber-hud">Diesmal nicht bestanden.</div>
                    <p className="text-sm text-muted">
                      {isExam ? 'Deine Prüfung' : 'Deine Einstufung'}
                      {outcome.passedAt ? ` vom ${DATE.format(new Date(outcome.passedAt))}` : ''} bleibt gültig – das Modul bleibt erledigt.
                    </p>
                  </>
                )}
                {!outcome.passed && !outcome.wasPassed && (
                  <>
                    <div className="text-amber-hud">Noch nicht bestanden – kein Problem.</div>
                    <p className="text-sm text-muted">
                      Zum Bestehen brauchst du {pass} %. Unten steht, was noch nicht saß – mit der passenden Lektion. Du kannst{' '}
                      {isExam ? 'die Prüfung' : 'den Test'} jederzeit wiederholen, jedes Mal neu gewürfelt{isExam ? ' und mit anderen Fragen' : ''}.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {wrong.length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-5">
              <h2 className="mb-3 font-semibold">
                Falsch beantwortet ({wrong.length} von {drills.length})
              </h2>
              {isExam && <p className="mb-3 text-sm text-muted">Diese Fragen kommen in den nächsten Tagen im Funk-Drill wieder.</p>}
              <ul className="space-y-3">
                {wrong.map((x) => (
                  <Mistake
                    key={x.id}
                    id={x.id}
                    drill={x.drill}
                    moduleId={module.id}
                    refParts={[`${isExam ? 'Prüfung' : 'Einstufung'} ${module.id}`, `${x.i + 1}/${drills.length}`]}
                    seed={seed}
                  />
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-start gap-2">
            <button
              onClick={goOn}
              className={outcome.passed ? 'rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink' : 'rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim'}
            >
              {!isExam && queue.length ? 'Nächster Einstufungstest →' : 'Zum Ausbildungsweg →'}
            </button>
            <button
              onClick={retry}
              className={outcome.passed ? 'rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim' : 'rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink'}
            >
              ⟳ Nochmal versuchen (neu gewürfelt)
            </button>
            {!isExam && !outcome.passed && locked && <SkipToModule moduleId={module.id} />}
          </div>
        </div>
      </RunContext.Provider>
    )
  }

  const answered = results[step] !== undefined
  const finish = () => {
    const correct = drills.filter((_, i) => results[i]).length
    const score = drills.length ? correct / drills.length : 0
    const before = isExam ? progress.exams?.[module.id] : progress.placements?.[module.id]
    const r = isExam ? applyExamResult(content, progress, module.id, score) : applyPlacementResult(content, progress, module.id, score)
    // Einstufungsantworten zählen als Wiederholung für den Funk-Drill des Tages; bei der Prüfung nur die falschen
    // (richtige Prüfungsfragen sollen unbekannt bleiben)
    const answers = items.map((x, i) => ({ drillId: x.id, correct: !!results[i] }))
    setProgress(isExam ? applyExamMistakes(r.progress, answers, new Date()) : applyReviews(r.progress, answers, new Date()))
    setOutcome({
      score,
      xp: r.xpGained,
      passed: r.passed,
      wasPassed: !!before?.passed,
      wasDoneVia: before?.passed ? null : doneVia(module, progress),
      passedAt: (isExam ? r.progress.exams : r.progress.placements)[module.id]?.passedAt,
    })
    window.scrollTo({ top: 0 })
  }

  return (
    <RunContext.Provider value={run}>
      <StepHeader title={`${isExam ? 'Modulprüfung' : 'Einstufung'}: ${module.title}`} sub={`Modul ${module.code} · ${drills.length} Fragen`} step={step} total={drills.length} onExit={goOn} />
      <div key={`${seed}-${step}`} className="rounded-xl border border-line bg-panel p-5">
        {drills[step] && <DrillView drill={drills[step]} onAnswered={(c) => setResults((r) => ({ ...r, [step]: c }))} />}
      </div>
      {/* Die Übungs-ID kann die Antwort verraten – sie erscheint erst nach dem Antworten (Modul und Seed reichen zum Nachbauen) */}
      <RefTag parts={[`${isExam ? 'Prüfung' : 'Einstufung'} ${module.id}`, `${step + 1}/${drills.length}`, answered && items[step]?.id]} seed={seed} />
      <StepFooter
        canBack={false}
        canNext={answered}
        last={step === drills.length - 1}
        onBack={() => undefined}
        onNext={() => (step === drills.length - 1 ? finish() : setStep(step + 1))}
      />
    </RunContext.Provider>
  )
}
