/**
 * Funk-Drill des Tages: Wiederholung mit Spaced Repetition (FSRS über ts-fsrs).
 *
 * Jede Übung aus einer erledigten Lektion wird zur Karte. Die erste Antwort in der Lektion (oder im
 * Einstufungstest) zählt als erste Wiederholung; danach plant FSRS, wann die Übung wieder fällig ist.
 * Die Bewertung ergibt sich aus dem Ergebnis: alles richtig = Good, teilweise = Hard, falsch = Again.
 *
 * Reine Funktionen ohne React. Datumswerte werden als ISO-Text gespeichert (JSON-tauglich).
 */
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import type { ContentIndex } from '../content/index'
import { matchesProfile, type ProfileFilter } from '../drills/resolve'
import { drillLessonId, isModuleDone, type ProgressState } from './progress'

/** Gespeicherte Karte: wie die FSRS-Karte, aber mit Datum als ISO-Text. */
export interface ReviewCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  state: number
  last_review?: string
}

/** Serie: an wie vielen Tagen hintereinander der Funk-Drill erledigt wurde. */
export interface DailyRecord {
  /** Letzter Tag mit erledigtem Drill, lokal als JJJJ-MM-TT. */
  last?: string
  streak: number
  best: number
  /** An wie vielen Tagen insgesamt erledigt. */
  days?: number
}

// Tagesweise Planung ohne Minuten-Lernschritte, ohne Zufallsstreuung (nachvollziehbar und testbar)
const scheduler = fsrs({ enable_fuzz: false, enable_short_term: false })

export const SESSION_SIZE = 15
export const NEW_PER_DAY = 8
/** XP pro richtig gelöster Übung im Funk-Drill. */
export const XP_PER_CORRECT = 2
/** XP pro richtig gelöster Übung im freien Training. */
export const XP_PER_FREE = 1

const toCard = (c: ReviewCard): Card => ({
  ...c,
  state: c.state,
  due: new Date(c.due),
  last_review: c.last_review ? new Date(c.last_review) : undefined,
})
const fromCard = (c: Card): ReviewCard => ({
  due: c.due.toISOString(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsed_days: c.elapsed_days,
  scheduled_days: c.scheduled_days,
  learning_steps: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  state: c.state,
  last_review: c.last_review?.toISOString(),
})

/** Bewertung aus dem Anteil richtiger Antworten (bei wiederholten Übungen in einer Lektion). */
export function gradeFor(fraction: number): Grade {
  if (fraction >= 0.999) return Rating.Good
  if (fraction >= 0.5) return Rating.Hard
  return Rating.Again
}

/** Eine Wiederholung einer Karte (neu, wenn es noch keine gibt). */
export function reviewCard(card: ReviewCard | undefined, grade: Grade, now: Date): ReviewCard {
  const c = card ? toCard(card) : createEmptyCard(now)
  // Wurde die Uhr zurückgestellt, liegt die letzte Wiederholung „in der Zukunft“ – dann ab dort rechnen
  const when = c.last_review && c.last_review > now ? c.last_review : now
  return fromCard(scheduler.next(c, when, grade).card)
}

/**
 * Antworten in den Fortschritt übernehmen. `answers` darf eine Übung mehrfach enthalten
 * (z. B. gewürfelte Übungen mit repeat) – bewertet wird der Anteil richtiger Antworten.
 */
export function applyReviews(p: ProgressState, answers: readonly { drillId: string; correct: boolean }[], now: Date): ProgressState {
  if (answers.length === 0) return p
  const byDrill = new Map<string, boolean[]>()
  for (const a of answers) byDrill.set(a.drillId, [...(byDrill.get(a.drillId) ?? []), a.correct])
  const reviews = { ...p.reviews }
  for (const [id, list] of byDrill) {
    const fraction = list.filter(Boolean).length / list.length
    reviews[id] = reviewCard(reviews[id], gradeFor(fraction), now)
  }
  return { ...p, reviews }
}

/** Übungen, die man schon kennt: aus erledigten Lektionen und aus Modulen, die per Einstufung erledigt sind. */
export function learnedDrills(index: ContentIndex, p: ProgressState, profile: ProfileFilter): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const add = (id: string) => {
    if (seen.has(id)) return
    seen.add(id)
    const d = index.drills.get(id)
    if (d && matchesProfile(d, profile)) out.push(id)
  }
  for (const m of index.curriculum.modules) {
    const viaPlacement = isModuleDone(m, p)
    for (const lid of m.lessons) {
      if (!p.lessons[lid] && !viaPlacement) continue
      for (const s of index.lessons.get(lid)?.steps ?? []) if (s.kind === 'drill') add(s.drillId)
    }
    if (p.placements[m.id]?.passed) for (const id of m.placement?.drills ?? []) add(id)
  }
  // Prüfungsfragen, die in einer Modulprüfung falsch waren (applyExamMistakes): kommen im Drill wieder, egal welche Lektion erledigt ist
  for (const id of Object.keys(p.reviews ?? {})) if (index.drills.get(id)?.exam) add(id)
  return out
}

/**
 * Wo eine Übung herkommt (für die Anzeige im Drill): die Lektion, in der sie vorkommt. Prüfungsfragen stehen in keiner
 * Lektion, ihre Lektion steht am Anfang der ID (`m3-l5-x-ready` → `m3-l5`).
 */
export function lessonOfDrill(index: ContentIndex, drillId: string): string | undefined {
  for (const l of index.lessons.values()) if (l.steps.some((s) => s.kind === 'drill' && s.drillId === drillId)) return l.title
  if (!index.drills.get(drillId)?.exam) return undefined
  for (const l of index.lessons.values()) if (drillId.startsWith(`${l.id}-`)) return l.title
  return undefined
}

/**
 * Aus einer Lektion, die noch nicht gespielt ist (U2-07)? Das passiert, wenn das Modul per Einstufung oder Prüfung
 * erledigt ist: Dann kommen alle seine Übungen in den Drill, auch die aus Lektionen, die man nie gesehen hat. Steht die
 * Übung in mehreren Lektionen, reicht eine gespielte. Ohne bekannte Lektion: nein.
 */
export function fromUnplayedLesson(index: ContentIndex, p: ProgressState, drillId: string): boolean {
  const lessons = lessonsOfDrill(index, drillId)
  return lessons.length > 0 && !lessons.some((id) => p.lessons[id])
}

const drillLessonCache = new WeakMap<ContentIndex, Map<string, string[]>>()

/** Lektionen, in denen eine Übung vorkommt; Prüfungs- und Einstufungsfragen gehören nach ihrem Namen zu einer Lektion. */
function lessonsOfDrill(index: ContentIndex, drillId: string): string[] {
  let map = drillLessonCache.get(index)
  if (!map) {
    map = new Map()
    for (const l of index.lessons.values()) for (const s of l.steps) if (s.kind === 'drill') map.set(s.drillId, [...(map.get(s.drillId) ?? []), l.id])
    drillLessonCache.set(index, map)
  }
  const found = map.get(drillId)
  if (found) return found
  const lid = drillLessonId(index, drillId)
  return lid ? [lid] : []
}

/** Listen reihum zusammenführen: erst je das erste Element, dann je das zweite … */
function interleave<T>(groups: readonly T[][]): T[] {
  const out: T[] = []
  for (let i = 0; groups.some((g) => i < g.length); i++) for (const g of groups) if (i < g.length) out.push(g[i])
  return out
}

/**
 * Reihenfolge neuer Karten (P1-09, U2-07): zuerst aus gespielten Lektionen, dann aus ungespielten. Innerhalb davon reihum
 * über die Module – das zuletzt im Lehrplan erreichte zuerst – und in jedem Modul reihum über die Lektionen. So bekommt
 * jemand, der M1–M5 per Einstufung erledigt hat, nicht wochenlang nur Alphabet und Adressat aus M1.
 */
export function orderFresh(index: ContentIndex, p: ProgressState, ids: readonly string[]): string[] {
  const moduleOrder = new Map(index.curriculum.modules.map((m, i) => [m.id, i]))
  const tier = (played: boolean) => {
    const byModule = new Map<string, Map<string, string[]>>()
    for (const id of ids) {
      if (fromUnplayedLesson(index, p, id) === played) continue
      const lid = lessonsOfDrill(index, id)[0] ?? ''
      const mid = index.lessons.get(lid)?.module ?? ''
      const lessons = byModule.get(mid) ?? new Map<string, string[]>()
      lessons.set(lid, [...(lessons.get(lid) ?? []), id])
      byModule.set(mid, lessons)
    }
    const modules = [...byModule.keys()].sort((a, b) => (moduleOrder.get(b) ?? -1) - (moduleOrder.get(a) ?? -1))
    return interleave(modules.map((mid) => interleave([...byModule.get(mid)!.values()])))
  }
  return [...tier(true), ...tier(false)]
}

/**
 * Falsch beantwortete Fragen einer Modulprüfung als Wiederholung für den Funk-Drill eintragen. Richtige Antworten
 * bleiben unberücksichtigt: Prüfungsfragen sind nur für die Prüfung da und sollen nicht schon vorher bekannt sein; was
 * nicht saß, kommt dagegen bald wieder (wie eine falsche Antwort in einer Lektion).
 */
export function applyExamMistakes(p: ProgressState, answers: readonly { drillId: string; correct: boolean }[], now: Date): ProgressState {
  return applyReviews(p, answers.filter((a) => !a.correct), now)
}

export interface DailyPlan {
  /** Übungs-IDs in der Reihenfolge des Drills. */
  queue: string[]
  due: number
  fresh: number
  /** Nächster Termin, falls heute nichts (mehr) fällig ist. */
  nextDue?: string
  /** Alles, was man schon kennt (für freies Training). */
  learned: string[]
}

/**
 * Tagesplan: zuerst Fälliges (am längsten überfällig zuerst), dann neue Karten bis zur Sitzungsgröße – gemischt über die
 * Module (`orderFresh`). Fällig ist alles, was bis Ende des heutigen Tages dran ist – nicht erst zur genauen Uhrzeit.
 */
export function dailyPlan(index: ContentIndex, p: ProgressState, profile: ProfileFilter, now: Date): DailyPlan {
  const learned = learnedDrills(index, p, profile)
  const reviews = p.reviews ?? {}
  const today = dayKey(now)
  const isDue = (id: string) => dayKey(new Date(reviews[id].due)) <= today
  const due = learned.filter((id) => reviews[id] && isDue(id)).sort((a, b) => reviews[a].due.localeCompare(reviews[b].due))
  const fresh = orderFresh(
    index,
    p,
    learned.filter((id) => !reviews[id]),
  )
  const queue = [...due.slice(0, SESSION_SIZE), ...fresh.slice(0, Math.max(0, Math.min(NEW_PER_DAY, SESSION_SIZE - due.length)))]
  const upcoming = learned
    .filter((id) => reviews[id] && !isDue(id))
    .map((id) => reviews[id].due)
    .sort()
  return { queue, due: Math.min(due.length, SESSION_SIZE), fresh: queue.length - Math.min(due.length, SESSION_SIZE), nextDue: upcoming[0], learned }
}

// ---------------------------------------------------------------------------
// Serie
// ---------------------------------------------------------------------------

/** Termin für Menschen: „heute“, „morgen“ oder z. B. „Mi., 25.11.“ */
export function formatDue(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(d) - day(now)) / 86_400_000)
  if (diff <= 0) return 'heute'
  if (diff === 1) return 'morgen'
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

/** Lokales Datum als JJJJ-MM-TT. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function previousDay(d: Date): string {
  const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  return dayKey(y)
}

/** Aktuelle Serie: zählt nur, wenn heute oder gestern erledigt – sonst ist sie gerissen. */
export function currentStreak(daily: DailyRecord | undefined, now: Date): number {
  if (!daily?.last) return 0
  return daily.last === dayKey(now) || daily.last === previousDay(now) ? daily.streak : 0
}

export function doneToday(daily: DailyRecord | undefined, now: Date): boolean {
  return daily?.last === dayKey(now)
}

/** Erledigten Drill eintragen: Serie fortsetzen, neu beginnen oder (heute schon erledigt) unverändert lassen. */
export function markDailyDone(daily: DailyRecord | undefined, now: Date): DailyRecord {
  const today = dayKey(now)
  const d = daily ?? { streak: 0, best: 0 }
  if (d.last === today) return d
  const streak = d.last === previousDay(now) ? d.streak + 1 : 1
  return { last: today, streak, best: Math.max(d.best, streak), days: (d.days ?? 0) + 1 }
}
