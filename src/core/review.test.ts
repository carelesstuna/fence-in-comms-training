/**
 * Tests für den Funk-Drill des Tages: FSRS-Planung, bekannte Übungen, Tagesplan und Serie.
 */
import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { contentResult } from '../content'
import { applyPlacementResult, EMPTY_PROGRESS, type ProgressState } from './progress/progress'
import {
  applyExamMistakes,
  applyReviews,
  currentStreak,
  dailyPlan,
  doneToday,
  formatDue,
  fromUnplayedLesson,
  gradeFor,
  learnedDrills,
  lessonOfDrill,
  markDailyDone,
  NEW_PER_DAY,
  reviewCard,
  SESSION_SIZE,
} from './progress/review'
import { drillLessonId } from './progress/progress'

const index = contentResult.index!
const allProfiles = { sims: [], aircraft: [] }
const DAY = 86_400_000
const t0 = new Date(2026, 10, 20, 18, 0, 0)
const at = (days: number) => new Date(t0.getTime() + days * DAY)

const done = (p: ProgressState, ...lessonIds: string[]): ProgressState => ({
  ...p,
  lessons: { ...p.lessons, ...Object.fromEntries(lessonIds.map((id) => [id, { completedAt: t0.toISOString(), bestScore: 1, attempts: 1 }])) },
})
const m1 = index.modules.get('m1')!

describe('Wiederholungsplanung (FSRS)', () => {
  it('bewertet aus dem Anteil richtiger Antworten', () => {
    expect(gradeFor(1)).toBe(Rating.Good)
    expect(gradeFor(0.5)).toBe(Rating.Hard)
    expect(gradeFor(0)).toBe(Rating.Again)
  })

  it('richtig wird später fällig als falsch, und die Abstände wachsen', () => {
    const good = reviewCard(undefined, Rating.Good, t0)
    const again = reviewCard(undefined, Rating.Again, t0)
    expect(new Date(again.due) > t0).toBe(true)
    expect(new Date(good.due) > new Date(again.due)).toBe(true)
    // übersteht JSON (localStorage) und plant weiter
    const stored = JSON.parse(JSON.stringify(good))
    const second = reviewCard(stored, Rating.Good, new Date(good.due))
    expect(second.scheduled_days).toBeGreaterThan(good.scheduled_days)
    expect(second.reps).toBe(2)
    // Fehler nach einer guten Phase: Abstand schrumpft wieder
    const lapse = reviewCard(second, Rating.Again, new Date(second.due))
    expect(lapse.scheduled_days).toBeLessThan(second.scheduled_days)
    expect(lapse.lapses).toBe(1)
  })

  it('wiederholte Übungen einer Lektion werden zusammengefasst', () => {
    const p = applyReviews(EMPTY_PROGRESS, [
      { drillId: 'a', correct: true },
      { drillId: 'a', correct: false },
      { drillId: 'b', correct: true },
    ], t0)
    expect(Object.keys(p.reviews).sort()).toEqual(['a', 'b'])
    // a: halb richtig → Hard → früher fällig als b (Good)
    expect(new Date(p.reviews.a.due) < new Date(p.reviews.b.due)).toBe(true)
    expect(applyReviews(EMPTY_PROGRESS, [], t0)).toBe(EMPTY_PROGRESS)
  })
})

describe('Bekannte Übungen und Tagesplan', () => {
  it('nur Übungen aus erledigten Lektionen – oder aus Modulen per Einstufung', () => {
    expect(learnedDrills(index, EMPTY_PROGRESS, allProfiles)).toEqual([])
    const first = index.lessons.get(m1.lessons[0])!
    const ids = first.steps.flatMap((s) => (s.kind === 'drill' ? [s.drillId] : []))
    const learned = learnedDrills(index, done(EMPTY_PROGRESS, first.id), allProfiles)
    expect(learned.length).toBeGreaterThan(0)
    expect(learned.every((id) => ids.includes(id))).toBe(true)
    expect(new Set(learned).size).toBe(learned.length)

    const placed = applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1).progress
    const viaPlacement = learnedDrills(index, placed, allProfiles)
    for (const id of ids) expect(viaPlacement).toContain(id)
    for (const id of m1.placement!.drills) expect(viaPlacement).toContain(id)
  })

  it('Prüfungsfragen: nur die falschen kommen in den Drill, mit ihrer Lektion', () => {
    const exam = [...index.drills.values()].filter((d) => d.exam && d.id.startsWith('m1-l1-'))
    expect(exam.length).toBeGreaterThanOrEqual(2)
    const [wrong, right] = exam
    // Ohne Prüfung nichts, richtige Antworten bleiben unsichtbar
    expect(learnedDrills(index, EMPTY_PROGRESS, allProfiles)).not.toContain(wrong.id)
    const p = applyExamMistakes(EMPTY_PROGRESS, [{ drillId: wrong.id, correct: false }, { drillId: right.id, correct: true }], t0)
    expect(Object.keys(p.reviews)).toEqual([wrong.id])
    // Falsch beantwortet: auch ohne erledigte Lektion im Drill, bald fällig
    expect(learnedDrills(index, p, allProfiles)).toEqual([wrong.id])
    const plan = dailyPlan(index, p, allProfiles, at(2))
    expect(plan.queue).toEqual([wrong.id])
    expect(plan.due).toBe(1)
    // Der Drill nennt die Lektion, obwohl die Frage in keiner Lektion steht
    expect(lessonOfDrill(index, wrong.id)).toBe(index.lessons.get('m1-l1')!.title)
    // Richtig beantwortet: keine Karte, die Frage bleibt dem Drill fern
    expect(learnedDrills(index, applyExamMistakes(EMPTY_PROGRESS, [{ drillId: right.id, correct: true }], t0), allProfiles)).toEqual([])
    // Übungen aus Lektionen bleiben bei der alten Zuordnung
    const lessonDrill = index.lessons.get('m1-l1')!.steps.find((s) => s.kind === 'drill')!
    expect(lessonOfDrill(index, (lessonDrill as { drillId: string }).drillId)).toBe(index.lessons.get('m1-l1')!.title)
    // Unbekannte Übungen bekommen keine Lektion
    expect(lessonOfDrill(index, 'gibt-es-nicht')).toBeUndefined()
  })

  it('Profilfilter: Sim-spezifische Übungen nur für passende Profile', () => {
    const special = [...index.drills.values()].find((d) => d.sims?.length && !d.sims.includes('dcs'))
    if (!special) return
    const lesson = [...index.lessons.values()].find((l) => l.steps.some((s) => s.kind === 'drill' && s.drillId === special.id))
    if (!lesson) return
    const p = done(EMPTY_PROGRESS, lesson.id)
    expect(learnedDrills(index, p, { sims: ['dcs'], aircraft: [] })).not.toContain(special.id)
    expect(learnedDrills(index, p, { sims: special.sims!, aircraft: [] })).toContain(special.id)
  })

  it('ohne Wiederholungen: begrenzt viele neue Übungen am Tag', () => {
    const p = done(EMPTY_PROGRESS, ...m1.lessons)
    const plan = dailyPlan(index, p, allProfiles, t0)
    expect(plan.queue.length).toBe(Math.min(NEW_PER_DAY, plan.learned.length))
    expect(plan.due).toBe(0)
    expect(plan.fresh).toBe(plan.queue.length)
  })

  it('Fälliges zuerst – am längsten überfällig vorn – dann Neues bis zur Sitzungsgröße', () => {
    let p = done(EMPTY_PROGRESS, ...m1.lessons, ...index.modules.get('m2')!.lessons)
    const learned = learnedDrills(index, p, allProfiles)
    // drei Karten: zwei überfällig (verschieden lange), eine erst in der Zukunft
    p = applyReviews(p, [{ drillId: learned[0], correct: false }], at(-10))
    p = applyReviews(p, [{ drillId: learned[1], correct: false }], at(-3))
    p = applyReviews(p, [{ drillId: learned[2], correct: true }], t0)
    const plan = dailyPlan(index, p, allProfiles, t0)
    expect(plan.queue.slice(0, 2)).toEqual([learned[0], learned[1]])
    expect(plan.queue).not.toContain(learned[2])
    expect(plan.due).toBe(2)
    expect(plan.queue.length).toBeLessThanOrEqual(SESSION_SIZE)
    expect(plan.nextDue).toBe(p.reviews[learned[2]].due)

    // Alles wiederholt und nichts fällig: leere Sitzung, aber ein nächster Termin
    let all = p
    for (const id of learned) all = applyReviews(all, [{ drillId: id, correct: true }], t0)
    const empty = dailyPlan(index, all, allProfiles, t0)
    expect(empty.queue).toEqual([])
    expect(empty.nextDue).toBeDefined()
  })
})

describe('Neue Karten: gemischt über Module, gespielte Lektionen zuerst (P1-09, U2-07)', () => {
  const moduleOf = (id: string) => index.lessons.get(drillLessonId(index, id) ?? '')?.module
  const core = index.curriculum.modules.filter((m) => m.group === 'core' && m.status === 'available').map((m) => m.id)
  const placeAll = () => core.reduce((p, id) => applyPlacementResult(index, p, id, 1).progress, EMPTY_PROGRESS)

  it('nach der Einstufung in alle Kernmodule: reihum aus allen Modulen, das letzte zuerst', () => {
    const p = placeAll()
    const plan = dailyPlan(index, p, allProfiles, t0)
    expect(plan.due).toBe(0)
    expect(plan.queue.length).toBe(NEW_PER_DAY)
    const modules = plan.queue.map(moduleOf)
    // Die ersten Karten kommen aus verschiedenen Modulen, angefangen beim zuletzt erreichten
    const withCards = core.filter((m) => plan.learned.some((id) => !p.reviews[id] && moduleOf(id) === m))
    expect(withCards.length).toBeGreaterThanOrEqual(Math.min(4, core.length))
    const n = Math.min(withCards.length, NEW_PER_DAY)
    expect(modules[0]).toBe(withCards[withCards.length - 1])
    expect(new Set(modules.slice(0, n)).size).toBe(n)
    // Keine Lektion gespielt: alle neuen Karten sind als „noch nicht gespielt“ erkennbar
    for (const id of plan.queue) expect(fromUnplayedLesson(index, p, id), id).toBe(true)
    // In einem Modul reihum über die Lektionen: zwei Karten aus M1 stammen aus verschiedenen Lektionen
    const m1Cards = plan.queue.filter((id) => moduleOf(id) === 'm1')
    if (m1Cards.length > 1) expect(new Set(m1Cards.map((id) => drillLessonId(index, id))).size).toBe(m1Cards.length)
  })

  it('Karten aus gespielten Lektionen kommen vor denen aus ungespielten', () => {
    const m2 = index.modules.get('m2')!
    const played = index.lessons.get(m2.lessons[2])!
    // M1 per Einstufung, dazu eine M2-Lektion gespielt (ohne dass ihre Antworten schon Karten wären)
    const p = done(applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1).progress, played.id)
    const plan = dailyPlan(index, p, allProfiles, t0)
    const fromPlayed = played.steps.flatMap((s) => (s.kind === 'drill' ? [s.drillId] : [])).filter((id) => plan.learned.includes(id) && !p.reviews[id])
    expect(fromPlayed.length).toBeGreaterThan(0)
    const n = Math.min(fromPlayed.length, plan.queue.length)
    for (const id of plan.queue.slice(0, n)) {
      expect(fromPlayed).toContain(id)
      expect(fromUnplayedLesson(index, p, id), id).toBe(false)
    }
    // Danach die aus M1 (per Einstufung erledigt, keine Lektion gespielt)
    const m1Drills = new Set(learnedDrills(index, applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1).progress, allProfiles))
    for (const id of plan.queue.slice(n)) {
      expect(m1Drills.has(id), id).toBe(true)
      expect(fromUnplayedLesson(index, p, id), id).toBe(true)
    }
  })

  it('erkennt ungespielte Lektionen – auch bei Prüfungsfragen, die in keiner Lektion stehen', () => {
    const lesson = index.lessons.get(m1.lessons[0])!
    const drillId = lesson.steps.flatMap((s) => (s.kind === 'drill' ? [s.drillId] : []))[0]
    expect(fromUnplayedLesson(index, EMPTY_PROGRESS, drillId)).toBe(true)
    expect(fromUnplayedLesson(index, done(EMPTY_PROGRESS, lesson.id), drillId)).toBe(false)
    const exam = [...index.drills.values()].find((d) => d.exam && d.id.startsWith(`${lesson.id}-`))!
    expect(fromUnplayedLesson(index, EMPTY_PROGRESS, exam.id)).toBe(true)
    expect(fromUnplayedLesson(index, done(EMPTY_PROGRESS, lesson.id), exam.id)).toBe(false)
    expect(fromUnplayedLesson(index, EMPTY_PROGRESS, 'gibt-es-nicht')).toBe(false)
  })
})

describe('Serie', () => {
  it('zählt Tage in Folge, reißt bei einer Lücke und merkt sich den Rekord', () => {
    let d = markDailyDone(undefined, t0)
    expect(d).toMatchObject({ streak: 1, best: 1 })
    expect(markDailyDone(d, at(0.1))).toBe(d) // gleicher Tag: unverändert
    d = markDailyDone(d, at(1))
    d = markDailyDone(d, at(2))
    expect(d).toMatchObject({ streak: 3, best: 3 })
    expect(doneToday(d, at(2))).toBe(true)
    expect(currentStreak(d, at(3))).toBe(3) // gestern erledigt – Serie hält noch
    expect(currentStreak(d, at(4))).toBe(0) // Lücke – gerissen
    d = markDailyDone(d, at(5))
    expect(d).toMatchObject({ streak: 1, best: 3 })
  })

  it('formatiert Termine', () => {
    expect(formatDue(t0.toISOString(), t0)).toBe('heute')
    expect(formatDue(at(1).toISOString(), t0)).toBe('morgen')
    expect(formatDue(at(5).toISOString(), t0)).toMatch(/\d+\.\d+\./)
  })
})
