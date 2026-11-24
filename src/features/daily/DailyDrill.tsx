/**
 * Funk-Drill des Tages (#/daily): fällige Übungen wiederholen, dazu ein paar neue aus erledigten
 * Lektionen. Falsche Antworten kommen am Ende noch einmal dran (zählen aber nur beim ersten Mal).
 * Mit ?frei: freies Training mit zufälligen bekannten Übungen – ohne Einfluss auf den Plan.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { newSeed } from '../../core/random/rng'
import { resolveDrill } from '../../core/drills/resolve'
import {
  applyReviews,
  currentStreak,
  dailyPlan,
  formatDue,
  fromUnplayedLesson,
  lessonOfDrill,
  markDailyDone,
  XP_PER_CORRECT,
  XP_PER_FREE,
} from '../../core/progress/review'
import { useApp } from '../../state/store'
import { content, makeRun, RunContext } from '../../ui/run'
import { DrillView } from '../../components/Drills'
import { RefTag } from '../../components/RefTag'
import { RankBar } from '../../components/Layout'
import { ScoreRing, StepFooter, StepHeader } from '../lesson/Stepper'

const FREE_SIZE = 10

interface Item {
  id: string
  /** neu (noch nie wiederholt), fällig oder „nochmal“ (falsch beantwortet, am Ende wiederholt) */
  kind: 'new' | 'due' | 'again' | 'free'
  /** Würfel-Schlüssel: „nochmal“ übernimmt ihn, damit genau dieselbe Aufgabe wiederkommt. */
  seed: string
}

export function DailyDrillPage() {
  const [params] = useSearchParams()
  const free = params.has('frei')
  return <DailyRun key={free ? 'free' : 'daily'} free={free} />
}

function DailyRun({ free }: { free: boolean }) {
  const navigate = useNavigate()
  const profile = useApp((s) => s.profile)
  const progress = useApp((s) => s.progress)
  const setProgress = useApp((s) => s.setProgress)

  const [seed] = useState(newSeed)
  // Profil und Plan nur beim Start lesen
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useMemo(() => makeRun(profile, seed), [seed])
  const [plan] = useState(() => dailyPlan(content, progress, profile, new Date()))
  const streakCounts = !free || plan.queue.length === 0
  const [queue, setQueue] = useState<Item[]>(() =>
    free
      ? run
          .envFor('free')
          .rng.sample(plan.learned, FREE_SIZE)
          .map((id, i) => ({ id, kind: 'free' as const, seed: `${id}/${i}` }))
      : plan.queue.map((id, i) => ({ id, kind: progress.reviews?.[id] ? ('due' as const) : ('new' as const), seed: `${id}/${i}` })),
  )
  const drills = useMemo(
    () =>
      queue.map((q) => {
        const d = content.drills.get(q.id)
        return d ? resolveDrill(d, run.envFor(q.seed)) : null
      }),
    [queue, run],
  )
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [outcome, setOutcome] = useState<{ correct: number; total: number; xp: number; streak: number; best: number; nextDue?: string } | null>(null)

  if (queue.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Funk-Drill des Tages</div>
          {plan.learned.length === 0 ? (
            <>
              <h1 className="mt-1 text-xl font-semibold text-white">Noch nichts zu wiederholen</h1>
              <p className="mt-2 text-muted">Erledige zuerst eine Lektion – ihre Übungen landen dann hier und kommen in klugen Abständen wieder.</p>
            </>
          ) : (
            <>
              <h1 className="mt-1 text-xl font-semibold text-white">Für heute ist nichts fällig</h1>
              <p className="mt-2 text-muted">
                {plan.nextDue ? `Die nächste Übung ist ${formatDue(plan.nextDue)} dran.` : 'Alles wiederholt.'} Wer trotzdem üben will: freies
                Training mit {FREE_SIZE} zufälligen Übungen, die du schon kennst – ohne Einfluss auf den Plan.
              </p>
              <Link to="/daily?frei" className="mt-3 inline-block rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink">
                Freies Training
              </Link>
            </>
          )}
        </div>
        <Link to="/" className="inline-block text-phosphor hover:underline">
          ← Zur Ausbildung
        </Link>
      </div>
    )
  }

  if (outcome) {
    const score = outcome.total ? outcome.correct / outcome.total : 1
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            {free ? 'Freies Training' : 'Funk-Drill des Tages'} · erledigt
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <ScoreRing score={score} />
            <div className="space-y-1">
              <div className="text-lg">
                {outcome.correct} von {outcome.total} Übungen beim ersten Versuch richtig
              </div>
              {outcome.xp > 0 && <div className="font-mono text-amber-hud">+{outcome.xp} XP</div>}
              <div className="text-amber-hud">
                🔥 {outcome.streak} {outcome.streak === 1 ? 'Tag' : 'Tage'} in Folge
                {outcome.streak > 1 && outcome.streak >= outcome.best && <span className="text-sm text-muted"> – Rekord</span>}
              </div>
              {!free && (
                <p className="text-sm text-muted">
                  {outcome.nextDue
                    ? `Was du richtig hattest, kommt in ein paar Tagen wieder, Fehler schon früher. Nächste Übung: ${formatDue(outcome.nextDue)}.`
                    : 'Was du richtig hattest, kommt in ein paar Tagen wieder, Fehler schon früher.'}
                </p>
              )}
              {free && (
                <p className="text-sm text-muted">
                  Freies Training ändert den Wiederholungsplan nicht.
                  {!streakCounts && ' Für die Serie zählt heute der Funk-Drill des Tages – dort ist noch etwas fällig.'}
                </p>
              )}
            </div>
          </div>
        </div>
        <RankBar />
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="rounded-lg bg-phosphor px-4 py-2 font-semibold text-ink">
            Zum Ausbildungsweg
          </Link>
          {!free && (
            <Link to="/daily?frei" className="rounded-lg border border-line px-4 py-2 hover:border-phosphor-dim">
              Freies Training
            </Link>
          )}
        </div>
      </div>
    )
  }

  const item = queue[step]
  const drill = drills[step]
  const firstCount = queue.filter((q) => q.kind !== 'again').length
  const answered = answers[step] !== undefined
  const lesson = lessonOfDrill(content, item.id)
  // Modul per Einstufung oder Prüfung erledigt: Die Lektion dazu hat man vielleicht nie gesehen (U2-07)
  const unplayed = lesson && fromUnplayedLesson(content, progress, item.id)

  const onAnswered = (correct: boolean) => {
    setAnswers((a) => ({ ...a, [step]: correct }))
    // Falsch beantwortet: am Ende noch einmal (nur einmal, und nur beim ersten Versuch)
    if (!correct && item.kind !== 'again') setQueue((q) => [...q, { id: item.id, kind: 'again', seed: item.seed }])
  }

  const finish = () => {
    const now = new Date()
    const first = queue.map((q, i) => ({ q, i })).filter(({ q }) => q.kind !== 'again')
    const correct = first.filter(({ i }) => answers[i]).length
    const xp = correct * (free ? XP_PER_FREE : XP_PER_CORRECT)
    const p = useApp.getState().progress
    const reviewed = free ? p : applyReviews(p, first.map(({ q, i }) => ({ drillId: q.id, correct: !!answers[i] })), now)
    // Freies Training hält die Serie nur an Tagen, an denen nichts fällig war
    const daily = streakCounts ? markDailyDone(p.daily, now) : p.daily
    const next = { ...reviewed, xp: reviewed.xp + xp, daily }
    setProgress(next)
    const nextDue = Object.values(next.reviews ?? {})
      .map((c) => c.due)
      .filter((d) => new Date(d) > now)
      .sort()[0]
    setOutcome({ correct, total: first.length, xp, streak: currentStreak(daily, now), best: daily.best, nextDue })
    window.scrollTo({ top: 0 })
  }

  const tag = { new: 'neu', due: 'Wiederholung', again: 'nochmal – war eben falsch', free: 'freies Training' }[item.kind]
  return (
    <RunContext.Provider value={run}>
      <StepHeader
        title={free ? 'Freies Training' : 'Funk-Drill des Tages'}
        sub={`${firstCount} Übungen${queue.length > firstCount ? ` + ${queue.length - firstCount} nochmal` : ''} · 🔥 Serie ${currentStreak(progress.daily, new Date())}`}
        step={step}
        total={queue.length}
        onExit={() => navigate('/')}
      />
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className={`rounded border px-1.5 py-0.5 ${item.kind === 'again' ? 'border-amber-hud/50 text-amber-hud' : 'border-line'}`}>{tag}</span>
        {lesson && <span>aus „{lesson}“</span>}
        {unplayed && (
          <span
            className="rounded border border-amber-hud/40 px-1.5 py-0.5 text-amber-hud/90"
            title="Das Modul hast du per Einstufung oder Prüfung erledigt, diese Lektion aber noch nicht gespielt. Erklärt wird es dort – du findest sie im Ausbildungsweg."
          >
            Lektion noch nicht gespielt
          </span>
        )}
      </div>
      <div key={`${seed}-${step}`} className="rounded-xl border border-line bg-panel p-5">
        {drill ? <DrillView drill={drill} onAnswered={onAnswered} /> : <p className="text-muted">Übung „{item.id}“ gibt es nicht mehr.</p>}
      </div>
      <RefTag parts={[free ? 'Freies Training' : 'Funk-Drill', `${step + 1}/${queue.length}`, item.id]} seed={seed} />
      <StepFooter
        canBack={false}
        canNext={answered || !drill}
        last={step === queue.length - 1}
        onBack={() => undefined}
        onNext={() => {
          if (step === queue.length - 1) finish()
          else {
            setStep(step + 1)
            window.scrollTo({ top: 0 })
          }
        }}
        hint={!answered && drill ? 'Erst die Übung lösen' : undefined}
      />
    </RunContext.Provider>
  )
}
