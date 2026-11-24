import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_PROGRESS } from '../core/progress/progress'
import {
  BACKUP_KEY,
  changedPaths,
  createSafeStorage,
  migratePersisted,
  MIRROR_FORMAT,
  mirroredStore,
  mirrorSnapshot,
  readBackup,
  restoreFromMirror,
  setStorageBackend,
  restorePersisted,
  sanitizePersisted,
  STORE_KEY,
  STORE_VERSION,
  type KeyValueStore,
  type PersistedState,
} from './persisted'
import { DEFAULT_PROFILE, STORE_DEFAULTS, useApp } from './store'

/** localStorage-Ersatz für Tests. */
function fakeStore(
  initial: Record<string, string> = {},
): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

const card = {
  due: '2026-11-25T08:00:00.000Z',
  stability: 3.2,
  difficulty: 5.1,
  elapsed_days: 0,
  scheduled_days: 4,
  learning_steps: 0,
  reps: 1,
  lapses: 0,
  state: 2,
  last_review: '2026-11-21T08:00:00.000Z',
}

// Gespeicherte Stände, wie die jeweilige Version sie geschrieben hat
const v1 = {
  onboarded: true,
  profile: {
    sims: ['dcs', 'srs'],
    aircraft: ['f16'],
    randomCallsign: false,
    callsignName: 'Uzi',
    flightNum: 3,
  },
  progress: {
    xp: 120,
    lessons: { 'm1-l1': { completedAt: '2026-10-01T10:00:00.000Z', bestScore: 0.9, attempts: 2 } },
    placements: { m2: { at: '2026-10-02T10:00:00.000Z', score: 0.8, passed: true } },
    hangarSeen: ['comms-ladder'],
  },
}
const v2 = {
  ...v1,
  progress: {
    ...v1.progress,
    checkrides: {
      wingman: {
        at: '2026-10-03T10:00:00.000Z',
        score: 0.9,
        bestScore: 0.9,
        attempts: 1,
        passed: true,
        passedAt: '2026-10-03T10:00:00.000Z',
      },
    },
  },
}
const v3 = {
  ...v2,
  progress: {
    ...v2.progress,
    reviews: { 'd-radio-check': card },
    daily: { last: '2026-11-20', streak: 3, best: 5 },
  },
}
const v4 = {
  ...v3,
  progress: {
    ...v3.progress,
    daily: { ...v3.progress.daily, days: 9 },
    stats: { correctCalls: 40, cleanCalls: 30, silences: 4, tunes: 7, perfectScenarios: 2 },
    achievements: { 'first-call': { at: '2026-10-01T10:00:00.000Z' } },
  },
}

const load = (state: unknown, version: number) =>
  sanitizePersisted(migratePersisted(state, version, STORE_DEFAULTS), STORE_DEFAULTS)

describe('Migration v1 → v4', () => {
  it.each([
    [1, v1],
    [2, v2],
    [3, v3],
    [4, v4],
  ])('v%i: übernimmt alle Daten und ergänzt fehlende Felder', (version, stored) => {
    const { state, repaired } = load(stored, version)
    expect(repaired).toEqual([])
    expect(state).toMatchObject(stored)
    // Alle Felder der aktuellen Version sind da
    expect(Object.keys(state.progress).sort()).toEqual(Object.keys(EMPTY_PROGRESS).sort())
    expect(Object.keys(state.profile).sort()).toEqual(Object.keys(DEFAULT_PROFILE).sort())
  })

  it('füllt Felder aus späteren Versionen mit Standardwerten', () => {
    const { state } = load(v1, 1)
    expect(state.progress.checkrides).toEqual({})
    expect(state.progress.reviews).toEqual({})
    expect(state.progress.daily).toEqual(EMPTY_PROGRESS.daily)
    expect(state.progress.stats).toEqual(EMPTY_PROGRESS.stats)
    expect(state.progress.achievements).toEqual({})
    expect(load(v3, 3).state.progress.daily).toEqual({
      last: '2026-11-20',
      streak: 3,
      best: 5,
      days: 0,
    })
  })

  it('ist rein und lässt neuere Versionen und Nicht-Objekte unverändert', () => {
    const copy = structuredClone(v1)
    migratePersisted(copy, 1, STORE_DEFAULTS)
    expect(copy).toEqual(v1)
    expect(migratePersisted(v4, STORE_VERSION + 3, STORE_DEFAULTS)).toBe(v4)
    expect(migratePersisted(null, 1, STORE_DEFAULTS)).toBeNull()
    expect(migratePersisted('kaputt', 1, STORE_DEFAULTS)).toBe('kaputt')
  })

  it('überschreibt vorhandene Felder nicht', () => {
    const migrated = migratePersisted(v4, 1, STORE_DEFAULTS) as typeof v4
    expect(migrated.progress.checkrides).toEqual(v4.progress.checkrides)
    expect(migrated.progress.stats).toEqual(v4.progress.stats)
  })
})

describe('Kaputte oder manipulierte Daten', () => {
  it.each([undefined, null, 42, 'text', [], [1, 2]])('%j ergibt die Standardwerte', (input) => {
    expect(sanitizePersisted(input, STORE_DEFAULTS).state).toEqual(STORE_DEFAULTS)
  })

  it('ersetzt falsche Typen und verwirft ungültige Einträge', () => {
    const broken = {
      onboarded: 'ja',
      profile: {
        sims: ['dcs', 'xplane', 7],
        aircraft: 'f16',
        randomCallsign: 1,
        callsignName: null,
        flightNum: 42,
      },
      progress: {
        ...v4.progress,
        xp: 'viel',
        hangarSeen: 'comms-ladder',
        lessons: {
          ok: v4.progress.lessons['m1-l1'],
          kaputt: true,
          halb: { completedAt: 5, bestScore: 'x', attempts: -1 },
        },
        reviews: {
          gut: card,
          datum: { ...card, due: 'gestern' },
          leer: {},
          letzte: { ...card, last_review: 'nie' },
        },
        daily: { last: 'heute', streak: -2, best: 5, days: 'neun' },
        stats: { ...v4.progress.stats, tunes: 'sieben' },
        achievements: [],
      },
    }
    const { state, repaired } = sanitizePersisted(broken, STORE_DEFAULTS)
    expect(state.onboarded).toBe(false)
    expect(state.profile).toEqual({ ...DEFAULT_PROFILE, sims: ['dcs'] })
    expect(state.progress.xp).toBe(0)
    expect(state.progress.hangarSeen).toEqual([])
    expect(Object.keys(state.progress.lessons)).toEqual(['ok', 'halb'])
    expect(state.progress.lessons.halb).toEqual({ completedAt: '', bestScore: 0, attempts: 1 })
    expect(Object.keys(state.progress.reviews)).toEqual(['gut'])
    expect(state.progress.daily).toEqual({ streak: 0, best: 5, days: 0 })
    expect(state.progress.stats.tunes).toBe(0)
    expect(state.progress.achievements).toEqual({})
    expect(repaired).toEqual(
      expect.arrayContaining([
        'onboarded',
        'profile.sims',
        'profile.flightNum',
        'progress.xp',
        'progress.lessons.kaputt',
        'progress.reviews.datum',
      ]),
    )
  })

  it('verliert den früheren Sim „msfs“ im Profil still und behält die übrigen Sims', () => {
    const stored = { ...v4, profile: { ...v4.profile, sims: ['dcs', 'msfs'] } }
    const store = fakeStore()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let restored: PersistedState | undefined
    expect(() => {
      restored = restorePersisted(stored, STORE_DEFAULTS, store)
    }).not.toThrow()
    expect(restored?.profile.sims).toEqual(['dcs'])
    // alles andere im Profil und im Fortschritt bleibt, wie es war
    expect(restored?.profile).toMatchObject({ ...v4.profile, sims: ['dcs'] })
    expect(restored?.progress).toMatchObject(v4.progress)
    // still: keine Sicherung und keine Warnung, es sind ja keine beschädigten Daten
    expect(readBackup(store)).toBeNull()
    expect(warn).not.toHaveBeenCalled()
    expect(sanitizePersisted(stored, STORE_DEFAULTS).repaired).toEqual([])
    warn.mockRestore()
  })

  it('„msfs“ als einziger Sim ergibt eine leere Liste; ein wirklich ungültiger Sim wird weiter gemeldet', () => {
    const only = { ...v4, profile: { ...v4.profile, sims: ['msfs'] } }
    const a = sanitizePersisted(only, STORE_DEFAULTS)
    expect(a.state.profile.sims).toEqual([])
    expect(a.repaired).toEqual([])
    const mixed = { ...v4, profile: { ...v4.profile, sims: ['dcs', 'msfs', 'xplane'] } }
    const b = sanitizePersisted(mixed, STORE_DEFAULTS)
    expect(b.state.profile.sims).toEqual(['dcs'])
    expect(b.repaired).toEqual(['profile.sims'])
  })

  it('behält unbekannte Felder in Profil und Fortschritt, nicht aber auf oberster Ebene', () => {
    const stored = {
      ...v4,
      setProfile: 5,
      profile: { ...v4.profile, theme: 'dunkel' },
      progress: { ...v4.progress, notizen: { a: 1 } },
    }
    const { state, repaired } = sanitizePersisted(stored, STORE_DEFAULTS)
    expect(repaired).toEqual([])
    expect(state.profile).toMatchObject({ theme: 'dunkel' })
    expect(state.progress).toMatchObject({ notizen: { a: 1 } })
    expect(state).not.toHaveProperty('setProfile')
  })

  it('übernimmt neue Felder aus den Standardwerten ohne eigenes Schema', () => {
    // Wie im Branch „Weg für Erfahrene“: compact im Profil, unlocked im Fortschritt;
    // dazu eine Sammlung, wie sie später dazukommen könnte
    const defaults = {
      ...STORE_DEFAULTS,
      profile: { ...DEFAULT_PROFILE, compact: false },
      progress: {
        ...EMPTY_PROGRESS,
        unlocked: [] as string[],
        notes: {} as Record<string, unknown>,
      },
    } as PersistedState
    // Ältere Stände ohne die Felder (v1 und v4) bekommen die Standardwerte
    for (const [stored, version] of [
      [v1, 1],
      [v4, 4],
    ] as const) {
      const r = sanitizePersisted(migratePersisted(stored, version, defaults), defaults)
      expect(r.repaired).toEqual([])
      expect(r.state.profile).toMatchObject({ compact: false })
      expect(r.state.progress).toMatchObject({ unlocked: [], notes: {} })
    }
    const stored = {
      ...v4,
      profile: { ...v4.profile, compact: true },
      progress: { ...v4.progress, unlocked: ['m3'], notes: { m3: { at: 'x' } } },
    }
    expect(sanitizePersisted(stored, defaults).state).toMatchObject(stored)
    const wrong = {
      ...v4,
      profile: { ...v4.profile, compact: 'ja' },
      progress: { ...v4.progress, unlocked: 'm3', notes: 'a' },
    }
    const fixed = sanitizePersisted(wrong, defaults)
    expect(fixed.state.profile).toMatchObject({ compact: false })
    expect(fixed.state.progress).toMatchObject({ unlocked: [], notes: {} })
    expect(fixed.repaired).toEqual(['profile.compact', 'progress.unlocked', 'progress.notes'])
  })

  it('nimmt die neuen Felder von Einstufungen an und prüft sie', () => {
    const at = '2026-11-21T10:00:00.000Z'
    const placements = {
      neu: { at, score: 0.9, passed: true, bestScore: 0.9, attempts: 2, passedAt: at },
      alt: { at, score: 0.8, passed: true },
      kaputt: { at, score: 0.5, passed: false, bestScore: 'gut', attempts: -1, passedAt: 3 },
    }
    const { state, repaired } = sanitizePersisted(
      { ...v4, progress: { ...v4.progress, placements } },
      STORE_DEFAULTS,
    )
    expect(state.progress.placements.neu).toEqual(placements.neu)
    expect(state.progress.placements.alt).toEqual(placements.alt)
    expect(state.progress.placements.kaputt).toMatchObject({ at, score: 0.5, passed: false })
    const kaputt: Record<string, unknown> = { ...state.progress.placements.kaputt }
    expect([kaputt.bestScore, kaputt.attempts, kaputt.passedAt]).toEqual([
      undefined,
      undefined,
      undefined,
    ])
    expect(repaired).toEqual([
      'progress.placements.kaputt.bestScore',
      'progress.placements.kaputt.attempts',
      'progress.placements.kaputt.passedAt',
    ])
  })

  it('Spracheinstellungen: ergänzt fehlende, ersetzt ungültige Werte', () => {
    const older = sanitizePersisted(v4, STORE_DEFAULTS)
    expect(older.state.profile.speech).toEqual(DEFAULT_PROFILE.speech)
    const { state, repaired } = sanitizePersisted(
      { ...v4, profile: { ...v4.profile, speech: { input: 'speak', pttKey: 'KeyT', pttMode: 'fliegen', micId: 'abc', micFilters: 'ja', gpu: true } } },
      STORE_DEFAULTS,
    )
    expect(state.profile.speech).toMatchObject({ input: 'speak', pttKey: 'KeyT', pttMode: 'hold', micId: 'abc', micFilters: false, gpu: true, squelch: true })
    expect(repaired).toEqual(['profile.speech.pttMode', 'profile.speech.micFilters'])
  })

  it('Phraseologie: ältere Profile bekommen „Immer US“, ungültige Werte werden ersetzt', () => {
    expect(DEFAULT_PROFILE.phraseology).toBe('us')
    for (const [version, stored] of [[1, v1], [4, v4]] as const) {
      const { state, repaired } = load(stored, version)
      expect(state.profile.phraseology).toBe('us')
      expect(repaired).toEqual([])
    }
    const map = sanitizePersisted({ ...v4, profile: { ...v4.profile, phraseology: 'map' } }, STORE_DEFAULTS)
    expect(map.state.profile.phraseology).toBe('map')
    expect(map.repaired).toEqual([])
    const bad = sanitizePersisted({ ...v4, profile: { ...v4.profile, phraseology: 'icao' } }, STORE_DEFAULTS)
    expect(bad.state.profile.phraseology).toBe('us')
    expect(bad.repaired).toEqual(['profile.phraseology'])
  })

  it('lässt __proto__-Schlüssel nicht durch', () => {
    const stored = JSON.parse(
      '{"progress":{"lessons":{"__proto__":{"completedAt":"","bestScore":1,"attempts":1}}}}',
    )
    const { state } = sanitizePersisted(stored, STORE_DEFAULTS)
    expect(Object.getPrototypeOf(state.progress.lessons)).toBe(Object.prototype)
    expect(Object.keys(state.progress.lessons)).toEqual([])
  })
})

describe('Datei-Spiegel (Desktop-App)', () => {
  const state = JSON.stringify({ state: { onboarded: true }, version: STORE_VERSION })

  it('spiegelt Stand und Sicherung unverändert als Text', () => {
    const s = fakeStore({ [STORE_KEY]: state, [BACKUP_KEY]: 'alt', anderes: 'x' })
    const file = JSON.parse(mirrorSnapshot(s, new Date('2026-11-21T12:00:00Z')))
    expect(file).toEqual({ format: MIRROR_FORMAT, version: 1, savedAt: '2026-11-21T12:00:00.000Z', data: { [STORE_KEY]: state, [BACKUP_KEY]: 'alt' } })
  })

  it('holt den Stand zurück, wenn der Browser-Speicher leer ist', () => {
    const file = mirrorSnapshot(fakeStore({ [STORE_KEY]: state, [BACKUP_KEY]: 'alt' }))
    const empty = fakeStore()
    expect(restoreFromMirror(empty, file)).toBe(true)
    expect(empty.data.get(STORE_KEY)).toBe(state)
    expect(empty.data.get(BACKUP_KEY)).toBe('alt')
  })

  it('überschreibt nie einen vorhandenen Stand und ignoriert kaputte Dateien', () => {
    const file = mirrorSnapshot(fakeStore({ [STORE_KEY]: state }))
    const filled = fakeStore({ [STORE_KEY]: 'neuer' })
    expect(restoreFromMirror(filled, file)).toBe(false)
    expect(filled.data.get(STORE_KEY)).toBe('neuer')
    for (const bad of [null, '', '{kaputt', '{"format":"anders","data":{}}', `{"format":"${MIRROR_FORMAT}","data":{"${STORE_KEY}":3}}`]) {
      const s = fakeStore()
      expect(restoreFromMirror(s, bad)).toBe(false)
      expect(s.data.size).toBe(0)
    }
  })

  it('meldet nur Änderungen an gespiegelten Schlüsseln', () => {
    const base = fakeStore()
    let changes = 0
    const s = mirroredStore(base, () => changes++)
    s.setItem(STORE_KEY, state)
    s.setItem('etwas-anderes', '1')
    s.removeItem(BACKUP_KEY)
    expect(changes).toBe(2)
    expect(s.getItem(STORE_KEY)).toBe(state)
  })

  it('der Store schreibt über den eingesetzten Speicher', () => {
    const base = fakeStore()
    let changes = 0
    setStorageBackend(mirroredStore(base, () => changes++))
    try {
      createSafeStorage().setItem(STORE_KEY, { state: STORE_DEFAULTS, version: STORE_VERSION })
      expect(base.data.has(STORE_KEY)).toBe(true)
      expect(changes).toBe(1)
    } finally {
      setStorageBackend(null)
    }
  })
})

describe('changedPaths', () => {
  it('meldet ersetzte und entfernte Werte, aber keine ergänzten', () => {
    expect(changedPaths({ a: 1 }, { a: 1, b: 2 })).toEqual([])
    expect(changedPaths({ a: 1, b: { c: 'x' } }, { a: 2, b: {} })).toEqual(['a', 'b.c'])
    expect(changedPaths({ l: [1, 2] }, { l: [1] })).toEqual(['l'])
    expect(changedPaths(5, {})).toEqual(['(alles)'])
  })
})

describe('Speicher und Sicherung', () => {
  it('sichert ungültiges JSON und startet frisch', () => {
    const store = fakeStore({ [STORE_KEY]: '{"state": {kaputt' })
    expect(createSafeStorage(() => store).getItem(STORE_KEY)).toBeNull()
    const backup = readBackup(store)
    expect(backup?.raw).toBe('{"state": {kaputt')
    expect(backup?.reason).toMatch(/kein gültiges JSON/)
  })

  it('sichert ein unbekanntes Format', () => {
    const store = fakeStore({ [STORE_KEY]: '[1,2,3]' })
    expect(createSafeStorage(() => store).getItem(STORE_KEY)).toBeNull()
    expect(readBackup(store)?.raw).toBe('[1,2,3]')
  })

  it('liest gültige Daten ohne Sicherung', () => {
    const store = fakeStore({ [STORE_KEY]: JSON.stringify({ state: v4, version: 4 }) })
    expect(createSafeStorage(() => store).getItem(STORE_KEY)).toEqual({ state: v4, version: 4 })
    expect(store.data.has(BACKUP_KEY)).toBe(false)
  })

  it('übersteht einen vollen oder gesperrten Speicher', () => {
    const full: KeyValueStore = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {
        throw new DOMException('voll', 'QuotaExceededError')
      },
      removeItem: () => {},
    }
    const storage = createSafeStorage(() => full)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(storage.getItem(STORE_KEY)).toBeNull()
    expect(() => storage.setItem(STORE_KEY, { state: STORE_DEFAULTS, version: 4 })).not.toThrow()
    warn.mockRestore()
  })

  it('sichert vor einer Reparatur, aber nicht bei sauberen Daten und nicht doppelt', () => {
    const store = fakeStore()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    restorePersisted(v4, STORE_DEFAULTS, store)
    expect(readBackup(store)).toBeNull()
    const broken = { ...v4, progress: { ...v4.progress, hangarSeen: 'x' } }
    restorePersisted(broken, STORE_DEFAULTS, store)
    const first = readBackup(store)
    expect(JSON.parse(first!.raw)).toEqual({ state: broken, version: STORE_VERSION })
    expect(first!.reason).toMatch(/progress\.hangarSeen/)
    restorePersisted(broken, STORE_DEFAULTS, store)
    expect(readBackup(store)).toEqual(first)
    warn.mockRestore()
  })
})

describe('Store lädt gespeicherte Stände', () => {
  let store: ReturnType<typeof fakeStore>
  beforeEach(() => {
    store = fakeStore()
    vi.stubGlobal('localStorage', store)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    useApp.getState().resetAll()
  })

  const rehydrate = async (raw: string) => {
    store.data.set(STORE_KEY, raw)
    await useApp.persist.rehydrate()
    return useApp.getState()
  }

  it('startet bei ungültigem JSON frisch und behält eine Sicherung', async () => {
    const s = await rehydrate('{kaputt')
    expect(s.onboarded).toBe(false)
    expect(s.progress).toEqual(EMPTY_PROGRESS)
    expect(readBackup(store)?.raw).toBe('{kaputt')
    // Der nächste Speichervorgang schreibt wieder gültige Daten
    s.setProfile({ flightNum: 2 })
    expect(JSON.parse(store.data.get(STORE_KEY)!).state.profile.flightNum).toBe(2)
  })

  it.each([
    [1, v1],
    [3, v3],
  ])(
    'migriert einen Stand von v%i und speichert ihn als aktuelle Version',
    async (version, stored) => {
      const s = await rehydrate(JSON.stringify({ state: stored, version }))
      expect(s.onboarded).toBe(true)
      // Neue Felder kommen aus den Standardwerten dazu, alles Gespeicherte bleibt
      expect(s.profile).toEqual({ ...DEFAULT_PROFILE, ...stored.profile })
      expect(s.progress).toMatchObject(stored.progress)
      expect(Object.keys(s.progress).sort()).toEqual(Object.keys(EMPTY_PROGRESS).sort())
      expect(s.progress.stats).toEqual(EMPTY_PROGRESS.stats)
      expect(JSON.parse(store.data.get(STORE_KEY)!).version).toBe(STORE_VERSION)
      expect(store.data.has(BACKUP_KEY)).toBe(false)
    },
  )

  it('repariert kaputte Daten derselben Version und sichert das Original', async () => {
    const broken = {
      ...v4,
      progress: { ...v4.progress, hangarSeen: 7, reviews: { a: { ...card, due: 'bald' } } },
    }
    const s = await rehydrate(JSON.stringify({ state: broken, version: STORE_VERSION }))
    expect(s.progress.hangarSeen).toEqual([])
    expect(s.progress.reviews).toEqual({})
    expect(s.progress.lessons).toEqual(v4.progress.lessons)
    expect(JSON.parse(readBackup(store)!.raw).state).toEqual(broken)
  })

  it('lässt gespeicherte Daten keine Aktionen überschreiben', async () => {
    const s = await rehydrate(
      JSON.stringify({ state: { ...v4, setProfile: 5, resetAll: null }, version: 4 }),
    )
    expect(typeof s.setProfile).toBe('function')
    expect(typeof s.resetAll).toBe('function')
  })

  it('übernimmt einen Import samt Profil', () => {
    useApp.getState().importState({
      onboarded: true,
      profile: v4.profile as PersistedState['profile'],
      progress: load(v4, 4).state.progress,
    })
    const s = useApp.getState()
    expect(s.onboarded).toBe(true)
    expect(s.profile.callsignName).toBe('Uzi')
    expect(s.progress.xp).toBe(120)
    expect(JSON.parse(store.data.get(STORE_KEY)!).state.progress.lessons).toEqual(
      v4.progress.lessons,
    )
  })
})
