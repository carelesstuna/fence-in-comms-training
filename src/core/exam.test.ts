/**
 * Modulprüfung (S-15): Pool, Auswahl, Auswertung und Fortschritt.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import type { ContentIndex } from './content/index'
import { createRng } from './random/rng'
import { examLessonId, examPool, hasExam, isProductionDrill, MAX_PER_LESSON, MIN_PRODUCTION, pickExam } from './progress/exam'
import type { Drill } from './content/schema'
import { applyExamResult, applyPlacementResult, doneVia, EMPTY_PROGRESS, examXp, isModuleDone, moduleState, type ProgressState } from './progress/progress'
import { migratePersisted, sanitizePersisted } from '../state/persisted'
import { STORE_DEFAULTS } from '../state/store'

const index = contentResult.index!
const examModules = [...index.modules.values()].filter((m) => m.exam)

/** Kleiner Inhaltsindex für Randfälle: ein Modul mit drei Lektionen und frei wählbarem Pool. */
function fake(opts: { size: number; pool: Record<string, { sims?: string[]; type?: string }[]> }): ContentIndex {
  const lessons = Object.keys(opts.pool)
  const drills = new Map<string, unknown>()
  for (const [lid, list] of Object.entries(opts.pool)) {
    list.forEach((d, i) => drills.set(`${lid}-x-${i}`, { id: `${lid}-x-${i}`, type: 'choice', exam: true, ...d }))
  }
  const m = { id: 'mx', code: 'X', title: 'Test', status: 'available', group: 'core', lessons, exam: { size: opts.size, passScore: 0.8 } }
  return { modules: new Map([['mx', m]]), drills } as unknown as ContentIndex
}

describe('Modulprüfung: Pool', () => {
  it('Modul 1 und 2 haben eine Prüfung', () => {
    expect(hasExam(index, 'm1')).toBe(true)
    expect(hasExam(index, 'm2')).toBe(true)
    expect(hasExam(index, 'track-a')).toBe(false)
  })

  for (const m of examModules) {
    it(`${m.id}: jede Lektion mit Übungen hat mindestens zwei Fragen, der Pool reicht für die Prüfung`, () => {
      const pool = examPool(index, m.id)
      let total = 0
      for (const lid of m.lessons) {
        const teaches = index.lessons.get(lid)!.steps.some((s) => s.kind === 'drill')
        const n = pool.get(lid)?.length ?? 0
        total += n
        if (teaches) expect(n, `Lektion ${lid}`).toBeGreaterThanOrEqual(2)
      }
      expect(total).toBeGreaterThanOrEqual(m.exam!.size)
    })

    // Wiedererkennen (Auswahl, Zuordnen …) wäre nach der Lektion auswendig gelernt; darum stehen solche Prüfungsfragen in
    // keiner Lektion und keiner Einstufung. Einen Funkspruch selbst tippen, bauen oder zurücklesen (U2-01) lernt man nicht
    // auswendig – jeder Durchlauf würfelt Rufzeichen, Plätze und Werte neu. Solche Übungen dürfen auch aus Lektionen kommen.
    it(`${m.id}: Prüfungsfragen zum Wiedererkennen stehen in keiner Lektion und keiner Einstufung`, () => {
      const used = new Set<string>(m.placement?.drills ?? [])
      for (const lid of m.lessons) for (const s of index.lessons.get(lid)!.steps) if (s.kind === 'drill') used.add(s.drillId)
      for (const ids of examPool(index, m.id).values()) {
        for (const id of ids) {
          if (!isProductionDrill(index.drills.get(id)!)) expect(used.has(id), id).toBe(false)
          expect(examLessonId(m, id), id).toBeDefined()
        }
      }
    })

    it(`${m.id}: jede Frage löst für viele Würfelungen ohne Fehler auf`, async () => {
      const { resolveDrill } = await import('./drills/resolve')
      for (const ids of examPool(index, m.id).values()) {
        for (const id of ids) {
          for (let i = 0; i < 5; i++) {
            const d = resolveDrill(index.drills.get(id)!, { rng: createRng(`${id}${i}`), content: index, self: { name: 'Colt', flight: 3, position: 1 } })
            expect(d.prompt ?? '', id).not.toMatch(/\{[^}]*\}/)
          }
        }
      }
    })
  }
})

describe('Modulprüfung: Auswahl', () => {
  it.each(examModules.map((m) => m.id))('%s: höchstens Sollgröße, höchstens zwei je Lektion, keine Doppelten', (moduleId) => {
    const m = index.modules.get(moduleId)!
    for (let i = 0; i < 40; i++) {
      const picked = pickExam(index, moduleId, createRng(`pick${i}`))
      expect(picked.length).toBeLessThanOrEqual(m.exam!.size)
      expect(picked.length).toBeGreaterThanOrEqual(Math.min(m.exam!.size, examPool(index, moduleId).size))
      expect(new Set(picked.map((q) => q.id)).size).toBe(picked.length)
      const perLesson = new Map<string, number>()
      for (const q of picked) {
        expect(q.lessonId).toBe(examLessonId(m, q.id))
        perLesson.set(q.lessonId, (perLesson.get(q.lessonId) ?? 0) + 1)
      }
      for (const n of perLesson.values()) expect(n).toBeLessThanOrEqual(MAX_PER_LESSON)
      // Jede Lektion mit Fragen ist vertreten
      expect(perLesson.size).toBe(examPool(index, moduleId).size)
    }
  })

  it('gleicher Seed, gleiche Prüfung; andere Seeds, andere Zusammenstellung', () => {
    const a = pickExam(index, 'm1', createRng('abc')).map((q) => q.id)
    expect(pickExam(index, 'm1', createRng('abc')).map((q) => q.id)).toEqual(a)
    const sets = new Set(Array.from({ length: 12 }, (_, i) => pickExam(index, 'm1', createRng(`s${i}`)).map((q) => q.id).sort().join(',')))
    expect(sets.size).toBeGreaterThan(6)
  })

  it('ohne Prüfungseintrag im Lehrplan gibt es keine Fragen', () => {
    expect(pickExam(index, 'track-a', createRng('x'))).toEqual([])
    expect(pickExam(index, 'gibt-es-nicht', createRng('x'))).toEqual([])
  })

  it('Randfälle: weniger Fragen als Soll, Soll kleiner als die Zahl der Lektionen, Profil-Filter', () => {
    const small = fake({ size: 10, pool: { 'mx-l1': [{}, {}, {}], 'mx-l2': [{}] } })
    // Pool: 3 + 1, aber höchstens zwei je Lektion → 3 Fragen
    expect(pickExam(small, 'mx', createRng('a')).length).toBe(3)
    const few = fake({ size: 4, pool: { 'mx-l1': [{}, {}], 'mx-l2': [{}, {}], 'mx-l3': [{}, {}], 'mx-l4': [{}, {}], 'mx-l5': [{}, {}] } })
    expect(pickExam(few, 'mx', createRng('a')).length).toBe(4)
    const filtered = fake({ size: 6, pool: { 'mx-l1': [{ sims: ['dcs'] }, { sims: ['bms'] }, {}], 'mx-l2': [{ sims: ['dcs'] }, {}] } })
    for (let i = 0; i < 30; i++) {
      const ids = pickExam(filtered, 'mx', createRng(`f${i}`), { sims: ['bms'], aircraft: [] }).map((q) => q.id)
      expect(ids).not.toContain('mx-l1-x-0')
      expect(ids).not.toContain('mx-l2-x-0')
    }
  })
})

describe('Modulprüfung: Produktionsaufgaben (U2-01, P1-10)', () => {
  const drill = (d: Record<string, unknown>) => ({ id: 'x', layer: 'core', ...d }) as unknown as Drill

  it('erkennt Funksprüche: tippen, bauen, zurücklesen – nicht Schweigen, Zahl oder Buchstabe', () => {
    expect(isProductionDrill(drill({ type: 'call', expect: 'call' }))).toBe(true)
    expect(isProductionDrill(drill({ type: 'call', expect: 'silence' }))).toBe(false)
    expect(isProductionDrill(drill({ type: 'build' }))).toBe(true)
    expect(isProductionDrill(drill({ type: 'cloze' }))).toBe(false)
    expect(isProductionDrill(drill({ type: 'choice' }))).toBe(false)
    // Readback mit eigenem Rufzeichen, Rückfrage aus Wörtern
    expect(isProductionDrill(drill({ type: 'input', accept: ['departure {f|spoken} {callsign|spoken}'] }))).toBe(true)
    expect(isProductionDrill(drill({ type: 'input', accept: ['{flightName} push {ch|spoken}'] }))).toBe(true)
    expect(isProductionDrill(drill({ type: 'input', accept: ['say again frequency'] }))).toBe(true)
    // Werte, Zahlwörter, Kürzel
    expect(isProductionDrill(drill({ type: 'input', accept: ['7600', 'squawk 7600', 'seven six zero zero'] }))).toBe(false)
    expect(isProductionDrill(drill({ type: 'input', accept: ['angels {ang}', 'heading {gb}'] }))).toBe(false)
    expect(isProductionDrill(drill({ type: 'input', accept: ['{h|spoken} NM', '{pushNew}z', 'two groups', 'zwei Gruppen', 'with information {atis}'] }))).toBe(false)
    expect(isProductionDrill(drill({ type: 'input', accept: ['{flightSize}'] }))).toBe(false)
  })

  it.each(examModules.map((m) => m.id))('%s: mindestens drei Produktionsaufgaben, soweit der Pool sie hat', (moduleId) => {
    // Höchstens zwei je Lektion: mehr als das kann die Prüfung aus einer Lektion nicht ziehen
    let capacity = 0
    for (const ids of examPool(index, moduleId).values()) capacity += Math.min(MAX_PER_LESSON, ids.filter((id) => isProductionDrill(index.drills.get(id)!)).length)
    const want = Math.min(MIN_PRODUCTION, capacity)
    for (let i = 0; i < 40; i++) {
      const picked = pickExam(index, moduleId, createRng(`prod${i}`))
      const n = picked.filter((q) => isProductionDrill(index.drills.get(q.id)!)).length
      expect(n, `${moduleId}, Seed prod${i}`).toBeGreaterThanOrEqual(want)
    }
  })

  it('verteilt Produktionsaufgaben auf Lektionen und lässt keine Lektion aus', () => {
    const spread = fake({
      size: 6,
      pool: {
        'mx-l1': [{}, {}, { type: 'call' }],
        'mx-l2': [{}, {}],
        'mx-l3': [{}, { type: 'build' }],
        'mx-l4': [{}, { type: 'call' }],
      },
    })
    for (let i = 0; i < 30; i++) {
      const picked = pickExam(spread, 'mx', createRng(`p${i}`))
      const ids = picked.map((q) => q.id)
      expect(ids).toEqual(expect.arrayContaining(['mx-l1-x-2', 'mx-l3-x-1', 'mx-l4-x-1']))
      expect(new Set(picked.map((q) => q.lessonId)).size).toBe(4)
    }
    // Nur eine Lektion mit Produktion: höchstens zwei daraus – und nur, wenn die anderen Lektionen trotzdem drankommen
    const pool = { 'mx-l1': [{ type: 'call' }, { type: 'call' }, { type: 'call' }], 'mx-l2': [{}], 'mx-l3': [{}] }
    for (let i = 0; i < 20; i++) {
      const roomy = pickExam(fake({ size: 4, pool }), 'mx', createRng(`r${i}`))
      expect(roomy.filter((q) => q.lessonId === 'mx-l1').length).toBe(2)
      expect(new Set(roomy.map((q) => q.lessonId)).size).toBe(3)
      const tight = pickExam(fake({ size: 3, pool }), 'mx', createRng(`t${i}`))
      expect(tight.filter((q) => q.lessonId === 'mx-l1').length).toBe(1)
      expect(new Set(tight.map((q) => q.lessonId)).size).toBe(3)
    }
  })
})

describe('Modulprüfung: Fortschritt', () => {
  const m1 = index.modules.get('m1')!

  it('bestanden: Modul erledigt, XP nur beim ersten Bestehen, Ergebnis bleibt', () => {
    const first = applyExamResult(index, EMPTY_PROGRESS, 'm1', 0.9)
    expect(first.passed).toBe(true)
    expect(first.xpGained).toBe(examXp(index, 'm1'))
    expect(first.xpGained).toBeGreaterThan(0)
    expect(isModuleDone(m1, first.progress)).toBe(true)
    expect(first.progress.exams.m1).toMatchObject({ score: 0.9, bestScore: 0.9, attempts: 1, passed: true })
    expect(first.progress.exams.m1.passedAt).toBeDefined()
    // Noch ein Mal bestanden: keine XP mehr; diesmal durchgefallen: bleibt bestanden
    const again = applyExamResult(index, first.progress, 'm1', 0.95)
    expect(again.xpGained).toBe(0)
    const failed = applyExamResult(index, again.progress, 'm1', 0.4)
    expect(failed.passed).toBe(false)
    expect(failed.progress.exams.m1).toMatchObject({ score: 0.4, bestScore: 0.95, attempts: 3, passed: true })
    expect(isModuleDone(m1, failed.progress)).toBe(true)
  })

  it('nicht bestanden: Modul bleibt offen, keine XP; Grenze ist die Mindestpunktzahl', () => {
    const fail = applyExamResult(index, EMPTY_PROGRESS, 'm1', 0.79)
    expect(fail.passed).toBe(false)
    expect(fail.xpGained).toBe(0)
    expect(isModuleDone(m1, fail.progress)).toBe(false)
    expect(applyExamResult(index, EMPTY_PROGRESS, 'm1', 0.8).passed).toBe(true)
  })

  it('Module ohne Prüfung: nie bestanden', () => {
    expect(applyExamResult(index, EMPTY_PROGRESS, 'track-a', 1).passed).toBe(false)
  })

  it('weiß, womit ein Modul erledigt ist (P1-19: Einstufung ist nicht „per Lektionen“)', () => {
    expect(doneVia(m1, EMPTY_PROGRESS)).toBeNull()
    expect(doneVia(m1, applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1).progress)).toBe('placement')
    expect(doneVia(m1, applyExamResult(index, EMPTY_PROGRESS, 'm1', 1).progress)).toBe('exam')
    const lessons = Object.fromEntries(m1.lessons.map((id) => [id, { completedAt: '', bestScore: 1, attempts: 1 }]))
    expect(doneVia(m1, { ...EMPTY_PROGRESS, lessons })).toBe('lessons')
    // Nicht bestanden zählt nicht
    expect(doneVia(m1, applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 0.2).progress)).toBeNull()
  })

  it('eine bestandene Prüfung öffnet das nächste Kernmodul', () => {
    expect(moduleState(index, EMPTY_PROGRESS, 'm2')).toBe('locked')
    const p = applyExamResult(index, EMPTY_PROGRESS, 'm1', 1).progress
    expect(moduleState(index, p, 'm1')).toBe('done')
    expect(moduleState(index, p, 'm2')).toBe('available')
  })

  it('gespeicherte Prüfungen überstehen das Laden, kaputte Einträge werden repariert', () => {
    const good: ProgressState = applyExamResult(index, EMPTY_PROGRESS, 'm1', 0.9).progress
    const stored = { onboarded: true, profile: STORE_DEFAULTS.profile, progress: { ...good, exams: { ...good.exams, m2: { at: 5, score: 'x', passed: 'ja', attempts: -1 } } } }
    const { state } = sanitizePersisted(migratePersisted(stored, 4, STORE_DEFAULTS), STORE_DEFAULTS)
    expect(state.progress.exams.m1).toMatchObject({ score: 0.9, passed: true })
    expect(state.progress.exams.m2.passed).toBe(false)
    // Alter Stand ohne Prüfungen: leere Liste
    const { state: old } = sanitizePersisted({ onboarded: true, profile: STORE_DEFAULTS.profile, progress: { xp: 5, lessons: {}, placements: {} } }, STORE_DEFAULTS)
    expect(old.progress.exams).toEqual({})
  })
})
