/**
 * Tests für den Weg für Erfahrene: Einstufung jederzeit, Module überspringen, freie Lektionswahl,
 * Checkride-Voraussetzungen und Fehlerliste nach der Einstufung.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { compactSteps } from './content/compact'
import type { LessonStep } from './content/index'
import { resolveDrill } from './drills/resolve'
import { drillSolution } from './drills/solution'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import {
  EMPTY_PROGRESS,
  applyLessonResult,
  applyPlacementResult,
  checkrideStatus,
  checkridesRequiring,
  drillLessonId,
  isModuleDone,
  isModuleSkipped,
  isOpenedBySkip,
  lessonAfter,
  lessonState,
  moduleState,
  modulesSkippedBy,
  nextLesson,
  placeableModules,
  relockModule,
  trackPrerequisites,
  unlockModule,
  type ProgressState,
} from './progress/progress'

const index = contentResult.index!
const mod = (id: string) => index.modules.get(id)!
const CORE = ['m1', 'm2', 'm3', 'm4', 'm5']

/** Alle Lektionen der Module als gespielt eintragen. */
function withLessons(p: ProgressState, ...moduleIds: string[]): ProgressState {
  const lessons = { ...p.lessons }
  for (const id of moduleIds)
    for (const l of mod(id).lessons) lessons[l] = { completedAt: '', bestScore: 1, attempts: 1 }
  return { ...p, lessons }
}

const states = (p: ProgressState) => CORE.map((id) => moduleState(index, p, id))

describe('Freie Lektionswahl', () => {
  it('in offenen Modulen ist jede Lektion wählbar, in gesperrten keine', () => {
    for (const l of mod('m1').lessons)
      expect(lessonState(index, EMPTY_PROGRESS, l)).toBe('available')
    for (const l of mod('m2').lessons) expect(lessonState(index, EMPTY_PROGRESS, l)).toBe('locked')
  })

  it('die empfohlene Lektion bleibt die erste offene – auch wenn man vorspringt', () => {
    const [l1, l2, l3] = mod('m1').lessons
    const { progress } = applyLessonResult(index, EMPTY_PROGRESS, l3, 1)
    expect(lessonState(index, progress, l3)).toBe('done')
    expect(nextLesson(index, progress, 'm1')).toBe(l1)
    // Nach Lektion 3 geht es mit der nächsten offenen danach weiter
    expect(lessonAfter(index, progress, l3)).toBe(mod('m1').lessons[3])
    // Nach Lektion 1 mit Lektion 2
    expect(lessonAfter(index, applyLessonResult(index, progress, l1, 1).progress, l1)).toBe(l2)
  })

  it('nach der letzten Lektion eines fertigen Moduls geht es im nächsten Modul weiter', () => {
    const p = withLessons(EMPTY_PROGRESS, 'm1')
    const lessons = mod('m1').lessons
    expect(lessonAfter(index, p, lessons[lessons.length - 1])).toBe(mod('m2').lessons[0])
    // Mitten im fertigen Modul: die nächste Lektion zum Auffrischen
    expect(lessonAfter(index, p, lessons[1])).toBe(lessons[2])
  })
})

describe('Module überspringen', () => {
  it('„Direkt zu Modul 4“ öffnet Modul 2–4, ohne etwas zu erledigen', () => {
    expect(states(EMPTY_PROGRESS)).toEqual(['available', 'locked', 'locked', 'locked', 'locked'])
    expect(modulesSkippedBy(index, EMPTY_PROGRESS, 'm4').map((m) => m.id)).toEqual([
      'm1',
      'm2',
      'm3',
    ])
    const p = unlockModule(index, EMPTY_PROGRESS, 'm4')
    expect(p.unlocked).toEqual(['m4'])
    expect(states(p)).toEqual(['available', 'available', 'available', 'available', 'locked'])
    for (const id of CORE) expect(isModuleDone(mod(id), p)).toBe(false)
    expect(CORE.map((id) => isModuleSkipped(index, p, id))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
    for (const l of mod('m4').lessons) expect(lessonState(index, p, l)).toBe('available')
    expect(nextLesson(index, p, 'm4')).toBe(mod('m4').lessons[0])
  })

  it('nur gesperrte Kernmodule lassen sich freischalten', () => {
    expect(unlockModule(index, EMPTY_PROGRESS, 'm1')).toBe(EMPTY_PROGRESS)
    expect(unlockModule(index, EMPTY_PROGRESS, 'track-a')).toBe(EMPTY_PROGRESS)
    expect(unlockModule(index, EMPTY_PROGRESS, 'gibt-es-nicht')).toBe(EMPTY_PROGRESS)
    const p = unlockModule(index, EMPTY_PROGRESS, 'm3')
    // m2 ist jetzt offen – nochmal freischalten ändert nichts
    expect(unlockModule(index, p, 'm2')).toBe(p)
  })

  it('Spuren bleiben zu, solange übersprungene Module offen sind', () => {
    let p = unlockModule(index, EMPTY_PROGRESS, 'm5')
    expect(states(p).every((s) => s === 'available')).toBe(true)
    p = withLessons(p, 'm5')
    const tracks = index.curriculum.modules.filter(
      (m) => m.group === 'track' && m.status === 'available',
    )
    for (const t of tracks) expect(moduleState(index, p, t.id)).toBe('locked')
  })

  // P3-01: Wer nur Warbirds fliegt, soll nicht erst Fence-in, Joker/Bingo und AWACS lernen müssen. W-L1 und W-L2 bauen
  // auf M1 (Funkspruch, Rufzeichen) und M2 (Funkgerät, Kanäle) auf; darum geht Spur W nach Modul 2 auf, die übrigen
  // Spuren weiterhin erst nach dem ganzen Kern.
  it('Spur W öffnet nach Modul 2 – erledigt, nicht nur freigeschaltet', () => {
    expect(trackPrerequisites(index, 'track-w').map((m) => m.id)).toEqual(['m1', 'm2'])
    expect(trackPrerequisites(index, 'track-a').map((m) => m.id)).toEqual(CORE)
    expect(moduleState(index, EMPTY_PROGRESS, 'track-w')).toBe('locked')
    expect(moduleState(index, withLessons(EMPTY_PROGRESS, 'm1'), 'track-w')).toBe('locked')
    // „Direkt zu Modul 3“ öffnet M2, erledigt es aber nicht
    expect(moduleState(index, unlockModule(index, withLessons(EMPTY_PROGRESS, 'm1'), 'm3'), 'track-w')).toBe('locked')
    expect(moduleState(index, withLessons(EMPTY_PROGRESS, 'm1', 'm2'), 'track-w')).toBe('available')
    // Per Einstufung erledigt zählt wie gespielt
    let p = applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1).progress
    p = applyPlacementResult(index, p, 'm2', 1).progress
    expect(moduleState(index, p, 'track-w')).toBe('available')
    for (const l of mod('track-w').lessons) expect(lessonState(index, p, l)).toBe('available')
  })

  it('„direkt freigeschaltet“ nur, solange das Modul allein dadurch offen ist', () => {
    let p = unlockModule(index, EMPTY_PROGRESS, 'm4')
    expect(isOpenedBySkip(index, p, 'm4')).toBe(true)
    expect(isOpenedBySkip(index, p, 'm3')).toBe(false)
    p = withLessons(p, 'm1', 'm2', 'm3')
    expect(moduleState(index, p, 'm4')).toBe('available')
    expect(isOpenedBySkip(index, p, 'm4')).toBe(false)
  })

  it('Freischaltung lässt sich zurücknehmen, gespielte Lektionen bleiben', () => {
    let p = unlockModule(index, EMPTY_PROGRESS, 'm4')
    p = applyLessonResult(index, p, mod('m4').lessons[0], 1).progress
    p = relockModule(p, 'm4')
    expect(p.unlocked).toEqual([])
    expect(moduleState(index, p, 'm4')).toBe('locked')
    expect(lessonState(index, p, mod('m4').lessons[0])).toBe('done')
  })

  it('alter Fortschritt ohne unlocked-Feld bricht nichts', () => {
    const old = { ...EMPTY_PROGRESS, unlocked: undefined } as unknown as ProgressState
    expect(states(old)).toEqual(['available', 'locked', 'locked', 'locked', 'locked'])
    expect(unlockModule(index, old, 'm2').unlocked).toEqual(['m2'])
    expect(relockModule(old, 'm2')).toBe(old)
  })
})

describe('Checkride-Voraussetzungen', () => {
  const wingman = index.curriculum.ranks.find((r) => r.checkride)!

  it('ein übersprungenes Modul zählt nicht als erledigt', () => {
    expect(checkridesRequiring(index, 'm4').map((r) => r.id)).toContain(wingman.id)
    const req = wingman.checkride!.requires.filter((id) => index.modules.has(id))
    let p: ProgressState = { ...EMPTY_PROGRESS, xp: wingman.xp + 100 }
    for (const id of req) p = unlockModule(index, p, id)
    const locked = checkrideStatus(index, p, wingman.id)!
    expect(locked.state).toBe('locked')
    for (const id of req) expect(locked.missing.join(' ')).toContain(`Modul ${mod(id).code}`)
    p = withLessons(p, ...req)
    expect(checkrideStatus(index, p, wingman.id)).toEqual({ state: 'available', missing: [] })
  })

  it('eine bestandene Einstufung zählt wie alle Lektionen', () => {
    let p: ProgressState = { ...EMPTY_PROGRESS, xp: wingman.xp + 100 }
    for (const id of wingman.checkride!.requires.filter((x) => index.modules.has(x)))
      p = applyPlacementResult(index, p, id, 1).progress
    expect(checkrideStatus(index, p, wingman.id)!.state).toBe('available')
  })
})

describe('Einstufung jederzeit und wiederholbar', () => {
  it('jedes spielbare Kernmodul hat eine Einstufung', () => {
    const core = index.curriculum.modules.filter(
      (m) => m.group === 'core' && m.status === 'available',
    )
    expect(placeableModules(index).map((m) => m.id)).toEqual(core.map((m) => m.id))
  })

  it('Einstufung für ein gesperrtes Modul: bestanden öffnet alles bis dahin und das nächste', () => {
    const r = applyPlacementResult(index, EMPTY_PROGRESS, 'm4', 1)
    expect(r.passed).toBe(true)
    expect(r.xpGained).toBeGreaterThan(0)
    expect(states(r.progress)).toEqual(['available', 'available', 'available', 'done', 'available'])
    expect(CORE.map((id) => isModuleSkipped(index, r.progress, id))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ])
  })

  it('durchgefallen öffnet nichts', () => {
    const r = applyPlacementResult(index, EMPTY_PROGRESS, 'm4', 0.5)
    expect(r.passed).toBe(false)
    expect(states(r.progress)).toEqual(states(EMPTY_PROGRESS))
    expect(r.progress.placements.m4).toMatchObject({ passed: false, attempts: 1, bestScore: 0.5 })
  })

  it('mehrfach möglich – bestanden bleibt bestanden, XP gibt es nur einmal', () => {
    const now = new Date('2026-11-21T10:00:00Z')
    let r = applyPlacementResult(index, EMPTY_PROGRESS, 'm2', 0.5, now)
    expect(r.xpGained).toBe(0)
    r = applyPlacementResult(index, r.progress, 'm2', 0.9, now)
    expect(r.xpGained).toBeGreaterThan(0)
    const xp = r.progress.xp
    r = applyPlacementResult(index, r.progress, 'm2', 0.3, new Date('2026-11-22T10:00:00Z'))
    expect(r.passed).toBe(false)
    expect(r.xpGained).toBe(0)
    expect(r.progress.xp).toBe(xp)
    expect(r.progress.placements.m2).toEqual({
      at: '2026-11-22T10:00:00.000Z',
      score: 0.3,
      passed: true,
      bestScore: 0.9,
      attempts: 3,
      passedAt: now.toISOString(),
    })
    expect(moduleState(index, r.progress, 'm2')).toBe('done')
    r = applyPlacementResult(index, r.progress, 'm2', 1)
    expect(r.xpGained).toBe(0)
  })

  it('keine Einstufungs-XP, wenn das Modul schon per Lektionen erledigt ist', () => {
    const p = withLessons(EMPTY_PROGRESS, 'm1')
    expect(applyPlacementResult(index, p, 'm1', 1).xpGained).toBe(0)
  })

  it('alte Einstufung ohne neue Felder wird weitergezählt', () => {
    const old: ProgressState = {
      ...EMPTY_PROGRESS,
      placements: { m1: { at: '2026-11-01T00:00:00.000Z', score: 0.9, passed: true } },
    }
    const r = applyPlacementResult(index, old, 'm1', 0.4)
    expect(r.progress.placements.m1).toMatchObject({
      passed: true,
      attempts: 2,
      bestScore: 0.9,
      passedAt: '2026-11-01T00:00:00.000Z',
    })
  })
})

describe('Kompaktmodus', () => {
  const read = (markdown: string): LessonStep => ({ kind: 'read', markdown })
  const drill = (drillId: string): LessonStep => ({ kind: 'drill', drillId })

  it('Leseseiten hängen eingeklappt an der nächsten Übung, Hangar-Karten entfallen', () => {
    const steps: LessonStep[] = [
      read('A'),
      read('B'),
      drill('d1'),
      { kind: 'hangar', cardId: 'h' },
      drill('d2'),
      { kind: 'scenario', scenarioId: 's' },
      read('Z'),
    ]
    expect(compactSteps(steps)).toEqual([
      { kind: 'drill', drillId: 'd1', theory: ['A', 'B'] },
      { kind: 'drill', drillId: 'd2', theory: [] },
      { kind: 'scenario', scenarioId: 's', theory: [], after: ['Z'] },
    ])
  })

  it('ohne Übungen bleibt die Lektion unverändert', () => {
    const steps = [read('A'), read('B')]
    expect(compactSteps(steps)).toEqual(steps)
  })

  it('jede Lektion behält alle Übungen und Szenarien', () => {
    for (const l of index.lessons.values()) {
      const practice = l.steps.filter((s) => s.kind === 'drill' || s.kind === 'scenario')
      const compact = compactSteps(l.steps)
      expect(compact.filter((s) => s.kind === 'drill' || s.kind === 'scenario').length, l.id).toBe(
        practice.length,
      )
      if (practice.length) expect(compact.length, l.id).toBe(practice.length)
    }
  })
})

describe('Fehlerliste nach der Einstufung', () => {
  it('jede Einstufungs-Übung führt zu einer Lektion ihres Moduls', () => {
    for (const m of placeableModules(index)) {
      for (const id of m.placement!.drills) {
        const lid = drillLessonId(index, id, m.id)
        expect(lid, `${m.id}: ${id}`).toBeDefined()
        expect(index.lessons.get(lid!)?.module).toBe(m.id)
      }
    }
  })

  it('jede Einstufungs-Übung hat eine Musterlösung oder Erklärung', () => {
    for (const m of placeableModules(index)) {
      for (const id of m.placement!.drills) {
        for (let i = 0; i < 10; i++) {
          const rng = createRng(`${id}/${i}`)
          const d = resolveDrill(index.drills.get(id)!, {
            rng,
            content: index,
            self: randomSelf(rng, index),
          })
          const solution = drillSolution(d)
          if (solution) for (const line of solution) expect(line.trim(), `${id}`).not.toBe('')
          expect(!!solution?.length || !!d.explain, `${id}: weder Lösung noch Erklärung`).toBe(true)
        }
      }
    }
  })
})
