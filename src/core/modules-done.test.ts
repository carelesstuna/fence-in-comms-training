/**
 * Einmal erledigt bleibt erledigt: Kommen zu einem Modul Lektionen dazu (0.3.0: m2-l10 Bullseye), darf ein
 * Modul, das jemand schon über alle Lektionen abgeschlossen hatte, nicht wieder offen sein – sonst sperren
 * Folgemodul und Spur W wieder.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import {
  EMPTY_PROGRESS,
  isModuleDone,
  lessonState,
  moduleState,
  recordModulesDone,
  type LessonRecord,
  type ProgressState,
} from './progress/progress'
import { migratePersisted, sanitizePersisted } from '../state/persisted'
import { STORE_DEFAULTS, useApp } from '../state/store'

const index = contentResult.index!
const mod = (id: string) => index.modules.get(id)!
const rec: LessonRecord = { completedAt: '2026-11-23T10:00:00.000Z', bestScore: 1, attempts: 1 }
const done = (ids: readonly string[]) => Object.fromEntries(ids.map((id) => [id, rec]))

/** Lektionen von Modul 2 bis 0.2.0 – ohne m2-l10 (Bullseye). */
const M2_UNTIL_020 = [
  'm2-l1',
  'm2-l2',
  'm2-l3',
  'm2-l4',
  'm2-l5',
  'm2-l6',
  'm2-l7',
  'm2-l8',
  'm2-l9',
]

/** Stand aus 0.2.0 (STORE_VERSION 4): Modul 1 und 2 über alle Lektionen erledigt, in Modul 3 die erste Lektion. */
function storedV4(m2Lessons: readonly string[]) {
  const progress: Record<string, unknown> = {
    ...EMPTY_PROGRESS,
    lessons: done([...mod('m1').lessons, ...m2Lessons, 'm3-l1']),
  }
  delete progress.memory
  delete progress.modulesDone
  return { onboarded: true, profile: STORE_DEFAULTS.profile, progress }
}

const loadV4 = (state: unknown) =>
  sanitizePersisted(migratePersisted(state, 4, STORE_DEFAULTS), STORE_DEFAULTS).state

describe('Neue Lektion in einem erledigten Modul', () => {
  it('Modul 2 hat seit 0.3.0 die Bullseye-Lektion zusätzlich', () => {
    expect(mod('m2').lessons).toEqual(expect.arrayContaining([...M2_UNTIL_020, 'm2-l10']))
    expect(mod('m2').lessons).toHaveLength(M2_UNTIL_020.length + 1)
  })

  it('ohne Eintrag in modulesDone wäre Modul 2 offen und Modul 3 gesperrt (der Fehler)', () => {
    const p: ProgressState = {
      ...EMPTY_PROGRESS,
      lessons: done([...mod('m1').lessons, ...M2_UNTIL_020, 'm3-l1']),
    }
    expect(isModuleDone(mod('m2'), p)).toBe(false)
    expect(moduleState(index, p, 'm3')).toBe('locked')
  })

  it('Migration v4 → v5 hält Modul 2 erledigt; Modul 3 und Spur W bleiben offen, Bullseye steht offen', () => {
    const { progress } = loadV4(storedV4(M2_UNTIL_020))
    expect(progress.modulesDone).toEqual(['m2'])
    expect(isModuleDone(mod('m2'), progress)).toBe(true)
    expect(moduleState(index, progress, 'm2')).toBe('done')
    expect(moduleState(index, progress, 'm3')).toBe('available')
    expect(lessonState(index, progress, 'm3-l2')).toBe('available')
    expect(moduleState(index, progress, 'track-w')).toBe('available')
    expect(lessonState(index, progress, 'm2-l10')).toBe('available')
  })

  it('Migration trägt nichts ein, wenn in 0.2.0 eine Lektion von Modul 2 fehlte', () => {
    const { progress } = loadV4(storedV4(M2_UNTIL_020.slice(0, -1)))
    expect(progress.modulesDone).toEqual([])
    expect(isModuleDone(mod('m2'), progress)).toBe(false)
  })

  it('recordModulesDone trägt Module mit allen Lektionen ein und lässt einen unveränderten Stand unverändert', () => {
    const p: ProgressState = {
      ...EMPTY_PROGRESS,
      lessons: done([...mod('m1').lessons, ...mod('m2').lessons]),
    }
    const r = recordModulesDone(index, p)
    expect(r.modulesDone).toEqual(['m1', 'm2'])
    expect(recordModulesDone(index, r)).toBe(r)
    expect(recordModulesDone(index, EMPTY_PROGRESS)).toBe(EMPTY_PROGRESS)
  })
})

describe('Store hält erledigte Module fest', () => {
  afterEach(() => useApp.getState().resetAll())

  it('beim Übernehmen von Fortschritt (Lektion, Import, Start)', () => {
    useApp.getState().setProgress({ ...EMPTY_PROGRESS, lessons: done(mod('m1').lessons) })
    expect(useApp.getState().progress.modulesDone).toEqual(['m1'])
  })
})
