import { Link } from 'react-router'
import type { Module } from '../../core/content/schema'
import {
  checkridesRequiring,
  checkrideStatus,
  isModuleSkipped,
  isOpenedBySkip,
  lessonState,
  moduleState,
  nextLesson,
  rankFor,
  trackPrerequisites,
  type ModuleState,
} from '../../core/progress/progress'
import { hasExam } from '../../core/progress/exam'
import { currentStreak, dailyPlan, doneToday, formatDue } from '../../core/progress/review'
import { useApp } from '../../state/store'
import { content } from '../../ui/run'
import { aircraftLabel } from '../../core/content/aircraft'
import { RankBar } from '../../components/Layout'
import { SkipToModule } from './SkipToModule'

const STATE_BADGE: Record<string, [string, string]> = {
  planned: ['in Vorbereitung', 'text-muted border-line'],
  locked: ['gesperrt', 'text-muted border-line'],
  available: ['offen', 'text-phosphor border-phosphor/50'],
  done: ['erledigt', 'text-amber-hud border-amber-hud/50'],
}

const TAG = 'rounded border px-1.5 py-0.5 text-[11px]'

/** Wann eine gesperrte Spur aufgeht: nach dem ganzen Kern oder (Spur W) schon nach einem bestimmten Modul. */
function trackLockedText(m: Module): string {
  const req = trackPrerequisites(content, m.id)
  const all = content.curriculum.modules.filter((x) => x.group === 'core' && x.status === 'available')
  if (req.length >= all.length) return 'Öffnet sich, wenn alle Kernmodule erledigt sind.'
  const codes = req.map((x) => x.code)
  const list = codes.length > 1 ? `${codes.slice(0, -1).join(', ')} und ${codes[codes.length - 1]}` : codes[0]
  return `Öffnet sich, wenn Modul ${list} erledigt ${codes.length > 1 ? 'sind' : 'ist'} – per Lektionen, Einstufung oder Modulprüfung.`
}

/** Knopf zum Einstufungstest – Beschriftung je nach bisherigen Versuchen. */
function PlacementButton({ m, state }: { m: Module; state: ModuleState }) {
  const record = useApp((s) => s.progress.placements?.[m.id])
  if (!m.placement) return null
  if (state === 'done') {
    // Wer per Lektionen fertig ist, braucht keine Einstufung mehr – nachgeholt werden kann sie unter Fortschritt
    if (!record) return null
    return (
      <Link to={`/placement/${m.id}`} className="self-center px-1 text-sm text-muted underline-offset-2 hover:text-text hover:underline">
        Einstufung wiederholen
      </Link>
    )
  }
  const last = record && !record.passed ? ` (zuletzt ${Math.round(record.score * 100)} %)` : ''
  return (
    <Link
      to={`/placement/${m.id}`}
      className={`rounded-lg border px-3 py-1.5 text-sm ${state === 'locked' ? 'border-phosphor/50 text-phosphor hover:bg-phosphor/10' : 'border-line text-muted hover:text-text'}`}
    >
      {record ? `Einstufung nochmal${last}` : 'Kenne ich schon – Einstufungstest'}
    </Link>
  )
}

/** Knopf zur Modulprüfung: neue Fragen zu allen Lektionen, die Prüfung setzt das Modul auf „erledigt“. */
function ExamButton({ m, state, lessonsDone }: { m: Module; state: ModuleState; lessonsDone: boolean }) {
  const record = useApp((s) => s.progress.exams?.[m.id])
  if (!hasExam(content, m.id) || (state !== 'available' && state !== 'done')) return null
  if (record?.passed) {
    return (
      <Link to={`/exam/${m.id}`} className="self-center px-1 text-sm text-muted underline-offset-2 hover:text-text hover:underline">
        Modulprüfung wiederholen
      </Link>
    )
  }
  const last = record ? ` (zuletzt ${Math.round(record.score * 100)} %)` : ''
  return (
    <Link
      to={`/exam/${m.id}`}
      title="Neue Fragen zu allen Lektionen des Moduls. Wer besteht, hat das Modul abgeschlossen."
      className={`rounded-lg border px-3 py-1.5 text-sm ${lessonsDone ? 'border-phosphor/50 text-phosphor hover:bg-phosphor/10' : 'border-line text-muted hover:text-text'}`}
    >
      {record ? `Modulprüfung nochmal${last}` : 'Modulprüfung ablegen'}
    </Link>
  )
}

function ModuleCard({ m }: { m: Module }) {
  const progress = useApp((s) => s.progress)
  const profileAircraft = useApp((s) => s.profile.aircraft)
  // Spur passt zu den Flugzeugen im Profil (z. B. Warbirds) – damit man sie findet (P3-01)
  const matchesProfile = m.group === 'track' && profileAircraft.some((a) => m.aircraft.includes(a))
  const state = moduleState(content, progress, m.id)
  const [badge, badgeCls] = STATE_BADGE[state]
  const doneCount = m.lessons.filter((id) => progress.lessons[id]).length
  const placed = progress.placements?.[m.id]?.passed
  const examined = progress.exams?.[m.id]?.passed
  const skipped = isModuleSkipped(content, progress, m.id)
  const unlocked = !skipped && isOpenedBySkip(content, progress, m.id)
  const next = nextLesson(content, progress, m.id)
  const active = state === 'available' || state === 'done'
  const core = content.curriculum.modules.filter((x) => x.group === 'core' && x.status === 'available')
  const before = core[core.findIndex((x) => x.id === m.id) - 1]
  // Für welchen noch offenen Checkride dieses Modul erledigt sein muss – passend zur Checkride-Karte
  const checkrides = state === 'done' || state === 'planned' ? [] : checkridesRequiring(content, m.id).filter((r) => !progress.checkrides?.[r.id]?.passed)
  return (
    <section className={`rounded-xl border bg-panel ${active ? 'border-line' : 'border-line/60'}`}>
      <div className="flex items-start gap-4 p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border font-mono text-lg font-semibold ${state === 'done' ? 'border-amber-hud/60 text-amber-hud' : active ? 'border-phosphor/60 text-phosphor' : 'border-line text-muted'}`}
        >
          {m.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-lg font-semibold ${active ? 'text-white' : 'text-white/70'}`}>{m.title}</h3>
            <span className={`${TAG} ${badgeCls}`}>{badge}</span>
            {placed && <span className={`${TAG} border-amber-hud/40 text-amber-hud`}>eingestuft</span>}
            {examined && <span className={`${TAG} border-amber-hud/40 text-amber-hud`}>geprüft</span>}
            {skipped && (
              <span
                className={`${TAG} border-line text-muted`}
                title="Ein späteres Modul ist schon erreicht. Dieses zählt erst als erledigt, wenn alle Lektionen gespielt sind oder die Einstufung bestanden ist."
              >
                übersprungen
              </span>
            )}
            {unlocked && <span className={`${TAG} border-line text-muted`}>direkt freigeschaltet</span>}
            {matchesProfile && <span className={`${TAG} border-violet-400/40 text-violet-200`}>passt zu deinen Flugzeugen</span>}
          </div>
          <p className="text-sm text-muted">{m.subtitle}</p>
          {state === 'locked' && m.group === 'track' && <p className="mt-1 text-sm text-muted">{trackLockedText(m)}</p>}
          {state === 'locked' && before && (
            <p className="mt-1 text-sm text-muted">
              Öffnet sich, wenn Modul {before.code} erledigt ist – oder sofort mit bestandenem Einstufungstest.
            </p>
          )}
          {checkrides.length > 0 && (
            <p className="mt-1 text-sm text-amber-hud/90">
              Voraussetzung für den Checkride zum {checkrides.map((r) => r.name).join(' und ')}: alle Lektionen spielen oder Einstufung bzw. Modulprüfung bestehen.
            </p>
          )}
          {m.lessons.length > 0 && active && (
            <>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-phosphor" style={{ width: `${(doneCount / m.lessons.length) * 100}%` }} />
              </div>
              <ol className="mt-3 space-y-1">
                {m.lessons.map((id, i) => {
                  const l = content.lessons.get(id)
                  const ls = lessonState(content, progress, id)
                  const recommended = state !== 'done' && id === next
                  const icon = ls === 'done' ? '✓' : recommended ? '▸' : '○'
                  return (
                    <li key={id}>
                      {ls === 'locked' ? (
                        <span className="flex items-center gap-2 py-1 text-sm text-muted">
                          <span className="w-4 text-center font-mono">·</span>
                          {i + 1}. {l?.title}
                        </span>
                      ) : (
                        <Link
                          to={`/lesson/${id}`}
                          className={`group flex items-center gap-2 rounded-md py-1 text-sm hover:text-phosphor ${recommended ? 'font-semibold text-phosphor' : ''}`}
                        >
                          <span className={`w-4 text-center font-mono ${ls === 'done' ? 'text-amber-hud' : recommended ? 'text-phosphor' : 'text-muted'}`}>{icon}</span>
                          <span>
                            {i + 1}. {l?.title}
                          </span>
                          {recommended && <span className={`${TAG} border-phosphor/50 font-normal text-phosphor`}>empfohlen</span>}
                          <span className="hidden text-xs font-normal text-muted group-hover:inline">· {l?.minutes} min</span>
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ol>
              {state === 'available' && doneCount < m.lessons.length && m.lessons.length > 1 && (
                <p className="mt-1 text-xs text-muted">Jede Lektion ist frei wählbar – die empfohlene folgt der Reihenfolge.</p>
              )}
            </>
          )}
          {state !== 'planned' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {active && next && (
                <Link
                  to={`/lesson/${next}`}
                  className={state === 'done' ? 'rounded-lg border border-line px-3 py-1.5 text-sm text-text hover:border-phosphor-dim' : 'rounded-lg bg-phosphor px-3 py-1.5 text-sm font-semibold text-ink'}
                >
                  {state === 'done' ? 'Auffrischen' : doneCount === 0 ? 'Starten' : 'Weiter'}: {content.lessons.get(next)?.title}
                </Link>
              )}
              <PlacementButton m={m} state={state} />
              <ExamButton m={m} state={state} lessonsDone={m.lessons.length > 0 && doneCount === m.lessons.length} />
              <SkipToModule moduleId={m.id} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Funk-Drill des Tages – sobald es Übungen aus erledigten Lektionen gibt. */
function DailyCard() {
  const progress = useApp((s) => s.progress)
  const profile = useApp((s) => s.profile)
  const now = new Date()
  const plan = dailyPlan(content, progress, profile, now)
  if (plan.learned.length === 0) return null
  const streak = currentStreak(progress.daily, now)
  const done = doneToday(progress.daily, now)
  const open = plan.queue.length
  return (
    <section className={`rounded-xl border p-4 ${open && !done ? 'border-phosphor/50 bg-phosphor/5' : 'border-line bg-panel'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] tracking-[0.2em] text-phosphor uppercase">Täglich</span>
        <h3 className="font-semibold text-white">Funk-Drill des Tages</h3>
        {streak > 0 && <span className="text-sm text-amber-hud">🔥 {streak} {streak === 1 ? 'Tag' : 'Tage'} in Folge</span>}
        {done && <span className="rounded border border-amber-hud/50 px-1.5 py-0.5 text-[11px] text-amber-hud">heute erledigt</span>}
      </div>
      <p className="mt-1 text-sm text-muted">
        {open > 0
          ? `${[plan.due && `${plan.due} fällig`, plan.fresh && `${plan.fresh} neu`].filter(Boolean).join(', ')} – etwa ${Math.max(2, Math.round(open / 2))} Minuten. Was sitzt, kommt seltener; Fehler kommen bald wieder.`
          : `Heute ist nichts fällig.${plan.nextDue ? ` Nächste Übung: ${formatDue(plan.nextDue, now)}.` : ''}`}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {open > 0 && (
          <Link to="/daily" className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${done ? 'border border-line text-text' : 'bg-phosphor text-ink'}`}>
            {done ? `Weiter üben (${open})` : 'Drill starten'}
          </Link>
        )}
        <Link to="/daily?frei" className="rounded-lg border border-line px-3 py-1.5 text-sm text-text hover:border-phosphor-dim">
          Freies Training
        </Link>
      </div>
    </section>
  )
}

/** Der Checkride zum nächsten Rang – sobald es einen gibt. */
function CheckrideCard() {
  const progress = useApp((s) => s.progress)
  const { next } = rankFor(content, progress)
  if (!next?.checkride) return null
  const status = checkrideStatus(content, progress, next.id)
  if (!status || status.state === 'passed') return null
  const ready = status.state === 'available'
  const last = progress.checkrides?.[next.id]
  return (
    <section className={`rounded-xl border p-4 ${ready ? 'border-amber-hud/60 bg-amber-hud/5' : 'border-line bg-panel opacity-80'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] tracking-[0.2em] text-amber-hud uppercase">Checkride</span>
        <h3 className="font-semibold text-white">Prüfungsflug zum {next.name}</h3>
      </div>
      {/* Den ganzen Einsatz erst beschreiben, wenn er offen ist – vorher schreckt die Liste eher ab */}
      {ready && (
        <p className="mt-1 text-sm text-muted">
          {content.scenarios.get(next.checkride.scenario)?.summary} Ohne Hinweise, bewertet erst im Debriefing. Bestanden ab{' '}
          {Math.round(next.checkride.passScore * 100)} %{next.checkride.noCritical ? ' und ohne kritischen Fehler' : ''}.
        </p>
      )}
      {ready ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link to={`/checkride/${next.id}`} className="rounded-lg bg-amber-hud px-3 py-1.5 text-sm font-semibold text-ink">
            {last ? 'Checkride wiederholen' : 'Checkride fliegen'}
          </Link>
          {last && (
            <span className="text-xs text-muted">
              {last.attempts} Versuch{last.attempts === 1 ? '' : 'e'}, bestes Ergebnis {Math.round(last.bestScore * 100)} %
            </span>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm">
          <span className="text-muted">Zulassung fehlt noch: </span>
          {status.missing.join(' · ')}
        </p>
      )}
    </section>
  )
}

function TrackCard({ m }: { m: Module }) {
  return (
    <div className="rounded-xl border border-line/70 bg-panel p-4 opacity-80">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line font-mono font-semibold text-muted">{m.code}</span>
        <h3 className="font-semibold text-white">{m.title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted">{m.subtitle}</p>
      {m.aircraft.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {m.aircraft.map((a) => (
            <span key={a} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-muted">
              {aircraftLabel(a, content.aircraftTypes)}
            </span>
          ))}
        </div>
      )}
      {/* plannedFor ist Projektplanung („Iteration 6+“) und bleibt intern (E5-11, U1-15, U2-18) */}
      <p className="mt-2 text-xs text-muted">In Vorbereitung</p>
    </div>
  )
}

export function PathPage() {
  const modules = content.curriculum.modules
  const core = modules.filter((m) => m.group === 'core')
  const tracks = modules.filter((m) => m.group === 'track')
  // Spuren mit Lektionen bekommen die volle Modulkarte, geplante bleiben kleine Kacheln.
  const playableTracks = tracks.filter((m) => m.status === 'available')
  const plannedTracks = tracks.filter((m) => m.status !== 'available')
  const later = modules.filter((m) => m.group === 'later')
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <RankBar />
        <DailyCard />
        <CheckrideCard />
      </div>
      <div>
        <h2 className="mb-1 text-lg font-semibold">Gemeinsamer Kern</h2>
        <p className="mb-3 text-sm text-muted">
          Die Grundlagen für jeden Piloten – Modul für Modul, die Lektionen darin in freier Wahl. Was du schon kannst, überspringst du per
          Einstufungstest (jederzeit und beliebig oft) oder bewusst mit „Direkt zu Modul …“.
        </p>
        <div className="space-y-3">
          {core.map((m) => (
            <ModuleCard key={m.id} m={m} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-1 text-lg font-semibold">Spuren</h2>
        <p className="mb-3 text-sm text-muted">
          Spezialisierungen für bestimmte Einsätze und Muster – du wählst frei, in welche Richtung es geht. Jede Spur sagt, ab wann sie offen ist.
        </p>
        {playableTracks.length > 0 && (
          <div className="mb-3 space-y-3">
            {playableTracks.map((m) => (
              <ModuleCard key={m.id} m={m} />
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {plannedTracks.map((m) => (
            <TrackCard key={m.id} m={m} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Später</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {later.map((m) => (
            <TrackCard key={m.id} m={m} />
          ))}
        </div>
      </div>
    </div>
  )
}
