import { describe, expect, it } from 'vitest'
import { EMPTY_PROGRESS } from '../core/progress/progress'
import { STORE_VERSION, type PersistedState } from './persisted'
import { DEFAULT_PROFILE, STORE_DEFAULTS } from './store'
import { buildExport, exportFilename, parseImport } from './transfer'

const state: PersistedState = {
  onboarded: true,
  profile: { ...DEFAULT_PROFILE, callsignName: 'Hawg', flightNum: 7, randomCallsign: false },
  progress: {
    ...EMPTY_PROGRESS,
    xp: 340,
    lessons: { 'm1-l1': { completedAt: '2026-11-01T09:00:00.000Z', bestScore: 1, attempts: 1 } },
    hangarSeen: ['comms-ladder'],
  },
}

describe('Export und Import', () => {
  it('kommt im Kreis unverändert zurück', () => {
    const now = new Date('2026-11-21T12:00:00.000Z')
    const file = buildExport(state, now)
    expect(file).toMatchObject({
      app: 'fence-in-comms-training',
      version: STORE_VERSION,
      exportedAt: now.toISOString(),
    })
    const r = parseImport(JSON.stringify(file))
    expect(r).toEqual({
      ok: true,
      state,
      repaired: [],
      version: STORE_VERSION,
      exportedAt: now.toISOString(),
    })
  })

  it('nimmt auch die Rohdaten aus dem Browserspeicher an und migriert alte Versionen', () => {
    const v1 = {
      onboarded: true,
      profile: state.profile,
      progress: { xp: 50, lessons: {}, placements: {}, hangarSeen: [] },
    }
    const r = parseImport(JSON.stringify({ state: v1, version: 1 }))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.version).toBe(1)
    expect(r.state.progress).toEqual({ ...EMPTY_PROGRESS, xp: 50 })
    expect(r.state.profile).toEqual(state.profile)
  })

  it('Phraseologie: kommt mit, ältere Sicherungen ohne das Feld bekommen „Immer US“', () => {
    const file = buildExport({ ...state, profile: { ...state.profile, phraseology: 'map' } })
    const r = parseImport(JSON.stringify(file))
    expect(r.ok && r.state.profile.phraseology).toBe('map')
    const older: Record<string, unknown> = { ...state.profile }
    delete older.phraseology
    const old = parseImport(JSON.stringify({ ...file, state: { ...file.state, profile: older } }))
    expect(old.ok && old.state.profile.phraseology).toBe('us')
    expect(old.ok && old.repaired).toEqual([])
  })

  it('ersetzt ungültige Werte und meldet sie', () => {
    const file = buildExport(state)
    const broken = {
      ...file,
      state: { ...file.state, progress: { ...file.state.progress, xp: -5, hangarSeen: 'x' } },
    }
    const r = parseImport(JSON.stringify(broken))
    expect(r.ok && r.repaired).toEqual(['progress.xp', 'progress.hangarSeen'])
    expect(r.ok && r.state.progress.xp).toBe(0)
  })

  it.each([
    ['kein JSON', 'das ist keine Sicherung', /kein.* gültige JSON/],
    [
      'fremde App',
      JSON.stringify({ app: 'andere-app', state: {} }),
      /keine Sicherung von Fence In Comms Training/,
    ],
    ['Liste', '[1,2]', /keine Sicherung von Fence In Comms Training/],
    ['ohne Fortschritt', JSON.stringify({ foo: 1 }), /kein Fortschritt/],
    ['leerer Zustand', JSON.stringify({ state: { x: 1 } }), /kein Fortschritt/],
  ])('lehnt ab: %s', (_, text, error) => {
    const r = parseImport(text, STORE_DEFAULTS)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toMatch(error)
  })

  it('benennt die Datei nach dem lokalen Datum', () => {
    expect(exportFilename(new Date(2026, 0, 5, 23, 30))).toBe(
      'fence-in-comms-training-fortschritt-2026-01-05.json',
    )
  })
})
