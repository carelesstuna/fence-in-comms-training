/**
 * Tests für Abzeichen: Zähler, Regeln, Vergabe und Validator.
 */
import { describe, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { applyEvent, awardAchievements, EMPTY_STATS, MATURE_DAYS, ruleProgress } from './progress/achievements'
import { applyCheckrideResult, applyExamResult, applyPlacementResult, EMPTY_PROGRESS, type ProgressState } from './progress/progress'
import { markDailyDone, type ReviewCard } from './progress/review'

const index = contentResult.index!
const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('Zähler', () => {
  it('zählt nur Richtiges – sauber heißt richtig und ohne überflüssiges Wort', () => {
    let s = applyEvent(undefined, { kind: 'call', correct: true, clean: true })
    s = applyEvent(s, { kind: 'call', correct: true, clean: false })
    s = applyEvent(s, { kind: 'call', correct: false, clean: false })
    s = applyEvent(s, { kind: 'silence', correct: true })
    s = applyEvent(s, { kind: 'silence', correct: false })
    s = applyEvent(s, { kind: 'tune', correct: true })
    s = applyEvent(s, { kind: 'scenario', score: 1 })
    s = applyEvent(s, { kind: 'scenario', score: 0.9 })
    expect(s).toEqual({ correctCalls: 2, cleanCalls: 1, silences: 1, tunes: 1, perfectScenarios: 1 })
    expect(EMPTY_STATS.correctCalls).toBe(0) // unverändert
  })

  it('der Funk-Drill zählt Tage insgesamt', () => {
    let d = markDailyDone(undefined, new Date(2026, 10, 1))
    d = markDailyDone(d, new Date(2026, 10, 1, 20))
    d = markDailyDone(d, new Date(2026, 10, 5))
    expect(d).toMatchObject({ days: 2, streak: 1, best: 1 })
  })
})

describe('Regeln und Vergabe', () => {
  it('Inhalte: Abzeichen vorhanden, IDs eindeutig', () => {
    expect(index.achievements.length).toBeGreaterThan(10)
    expect(new Set(index.achievements.map((a) => a.id)).size).toBe(index.achievements.length)
  })

  it('Zähl-Regeln zeigen den Stand, auch über dem Ziel nur bis zum Ziel', () => {
    const p: ProgressState = { ...EMPTY_PROGRESS, stats: { ...EMPTY_STATS, cleanCalls: 7 } }
    expect(ruleProgress(index, p, { cleanCalls: 10 })).toEqual({ done: false, current: 7, target: 10 })
    expect(ruleProgress(index, { ...p, stats: { ...EMPTY_STATS, cleanCalls: 12 } }, { cleanCalls: 10 })).toEqual({ done: true, current: 10, target: 10 })
  })

  it('Module, Einstufung, Rang, Serie, Langzeitgedächtnis', () => {
    const placed = applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1).progress
    expect(ruleProgress(index, placed, { module: 'm1' }).done).toBe(true)
    expect(ruleProgress(index, placed, { placement: true }).done).toBe(true)
    expect(ruleProgress(index, EMPTY_PROGRESS, { placement: true }).done).toBe(false)

    expect(ruleProgress(index, EMPTY_PROGRESS, { rank: 'cadet' }).done).toBe(true)
    const wingman = index.curriculum.ranks[1]
    const enough = { ...EMPTY_PROGRESS, xp: wingman.xp }
    const promoted = wingman.checkride ? applyCheckrideResult(enough, wingman.id, 1, true) : enough
    expect(ruleProgress(index, promoted, { rank: wingman.id }).done).toBe(true)

    expect(ruleProgress(index, { ...EMPTY_PROGRESS, daily: { streak: 0, best: 7 } }, { streak: 7 }).done).toBe(true)

    const card = (days: number) => ({ scheduled_days: days }) as ReviewCard
    const reviews = { a: card(MATURE_DAYS), b: card(MATURE_DAYS - 1), c: card(40) }
    expect(ruleProgress(index, { ...EMPTY_PROGRESS, reviews }, { matureCards: 3 })).toEqual({ done: false, current: 2, target: 3 })
  })

  it('Modulprüfungen zählen nur bestandene, je Modul einmal', () => {
    expect(ruleProgress(index, EMPTY_PROGRESS, { exams: 2 })).toEqual({ done: false, current: 0, target: 2 })
    const failed = applyExamResult(index, EMPTY_PROGRESS, 'm1', 0.5)
    expect(failed.passed).toBe(false)
    expect(ruleProgress(index, failed.progress, { exams: 1 })).toEqual({ done: false, current: 0, target: 1 })
    const once = applyExamResult(index, failed.progress, 'm1', 1)
    const twice = applyExamResult(index, once.progress, 'm1', 1) // dieselbe Prüfung noch einmal bestanden
    expect(ruleProgress(index, twice.progress, { exams: 2 })).toEqual({ done: false, current: 1, target: 2 })
    const both = applyExamResult(index, twice.progress, 'm2', 1)
    expect(ruleProgress(index, both.progress, { exams: 2 })).toEqual({ done: true, current: 2, target: 2 })
  })

  it('Abzeichen für die Modulprüfung: Geprüft nach der ersten, die zweite erst nach allen', () => {
    const first = applyExamResult(index, EMPTY_PROGRESS, 'm1', 1).progress
    const got = awardAchievements(index, first).newly.map((a) => a.id)
    expect(got).toContain('geprueft')
    expect(got).not.toContain('alle-pruefungen')
    const modules = index.curriculum.modules.filter((m) => m.exam).map((m) => m.id)
    const all = modules.reduce((p, id) => applyExamResult(index, p, id, 1).progress, EMPTY_PROGRESS)
    expect(awardAchievements(index, all).newly.map((a) => a.id)).toContain('alle-pruefungen')
    // Das Ziel im Abzeichen entspricht der Zahl der Module mit Prüfung
    const rule = index.achievements.find((a) => a.id === 'alle-pruefungen')!.rule
    expect(rule.exams).toBe(modules.length)
  })

  it('vergibt jedes Abzeichen genau einmal und meldet nur die neuen', () => {
    const lessonId = index.modules.get('m1')!.lessons[0]
    const p: ProgressState = { ...EMPTY_PROGRESS, lessons: { [lessonId]: { completedAt: '', bestScore: 1, attempts: 1 } } }
    const first = awardAchievements(index, p, new Date('2026-11-20T10:00:00Z'))
    expect(first.newly.map((a) => a.id)).toContain('erste-lektion')
    expect(first.progress.achievements['erste-lektion']).toEqual({ at: '2026-11-20T10:00:00.000Z' })
    const again = awardAchievements(index, first.progress)
    expect(again.newly).toEqual([])
    expect(again.progress).toBe(first.progress)
    expect(awardAchievements(index, EMPTY_PROGRESS).newly).toEqual([])
  })

  it('alter Fortschritt ohne stats/achievements bricht nichts', () => {
    const old = { xp: 0, lessons: {}, placements: {}, checkrides: {}, reviews: {}, daily: { streak: 0, best: 0 }, hangarSeen: [] } as unknown as ProgressState
    expect(() => awardAchievements(index, old)).not.toThrow()
    expect(ruleProgress(index, old, { correctCalls: 1 })).toEqual({ done: false, current: 0, target: 1 })
  })
})

describe('Validator', () => {
  it('genau eine Bedingung, Modul und Rang müssen existieren, IDs eindeutig', () => {
    const files: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) files[k.replace(/^\//, '')] = v
    const list = parse(files['content/achievements.yaml'])
    list.push(
      { id: 'zz-zwei', title: 'T', description: 'D', icon: '⭐', rule: { lessons: 1, xp: 5 } },
      { id: 'zz-modul', title: 'T', description: 'D', icon: '⭐', rule: { module: 'm99' } },
      { id: 'zz-rang', title: 'T', description: 'D', icon: '⭐', rule: { rank: 'admiral' } },
      { id: 'erste-lektion', title: 'T', description: 'D', icon: '⭐', rule: { lessons: 2 } },
    )
    files['content/achievements.yaml'] = stringify(list)
    const msgs = buildContentIndex(files).errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('rule braucht genau eine Bedingung')
    // Ein Schemafehler bricht die ganze Datei ab – die Querverweise prüfen wir ohne ihn
    list.splice(list.findIndex((a: { id: string }) => a.id === 'zz-zwei'), 1)
    files['content/achievements.yaml'] = stringify(list)
    const msgs2 = buildContentIndex(files).errors.map((e) => e.message).join('\n')
    expect(msgs2).toContain('zz-modul: Modul "m99" existiert nicht')
    expect(msgs2).toContain('zz-rang: Rang "admiral" existiert nicht')
    expect(msgs2).toContain('Abzeichen "erste-lektion" kommt doppelt vor')
  })
})
