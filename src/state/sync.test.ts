/**
 * Abgleich zwischen mehreren Fenstern: Ein anderes Fenster schreibt den Stand, dieses lädt neu –
 * und überschreibt ihn beim nächsten Speichern nicht mit seinem alten.
 */
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { STORE_KEY, STORE_VERSION } from './persisted'
import { useApp } from './store'
import { onStateWrittenElsewhere } from './sync'

/** Löst aus, was der Browser den anderen Fenstern bei einer Änderung schickt. */
function storageEvent(init: {
  key: string | null
  newValue: string | null
  storageArea: unknown
}): Event {
  return Object.assign(new Event('storage'), init)
}

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

describe('onStateWrittenElsewhere', () => {
  const area = {}
  let target: EventTarget
  let reload: Mock<() => void>
  beforeEach(() => {
    target = new EventTarget()
    reload = vi.fn<() => void>()
  })

  it('lädt neu, wenn ein anderes Fenster den Stand geschrieben hat', () => {
    onStateWrittenElsewhere(target, area, reload)
    target.dispatchEvent(
      storageEvent({ key: STORE_KEY, newValue: '{"state":{}}', storageArea: area }),
    )
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('ignoriert andere Schlüssel, anderen Speicher, Löschen und Leeren', () => {
    onStateWrittenElsewhere(target, area, reload)
    target.dispatchEvent(
      storageEvent({ key: 'fence-in-comms-training-backup', newValue: 'x', storageArea: area }),
    )
    target.dispatchEvent(storageEvent({ key: STORE_KEY, newValue: 'x', storageArea: {} }))
    target.dispatchEvent(storageEvent({ key: STORE_KEY, newValue: null, storageArea: area }))
    target.dispatchEvent(storageEvent({ key: null, newValue: null, storageArea: area }))
    expect(reload).not.toHaveBeenCalled()
  })

  it('hört nach dem Beenden nicht mehr zu', () => {
    const stop = onStateWrittenElsewhere(target, area, reload)
    stop()
    target.dispatchEvent(storageEvent({ key: STORE_KEY, newValue: 'x', storageArea: area }))
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('zwei Fenster mit demselben Speicher', () => {
  let storage: ReturnType<typeof memoryStorage>
  let stop: () => void
  const target = new EventTarget()

  beforeEach(() => {
    storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    stop = onStateWrittenElsewhere(target, storage, () => void useApp.persist.rehydrate())
  })
  afterEach(() => {
    stop()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    useApp.getState().resetAll()
  })

  /** Das andere Fenster speichert einen Stand und meldet es. */
  const otherWindowSaves = async (patch: { xp?: number; flightNum?: number }) => {
    const s = useApp.getState()
    const state = {
      onboarded: true,
      profile: { ...s.profile, flightNum: patch.flightNum ?? s.profile.flightNum },
      progress: { ...s.progress, xp: patch.xp ?? s.progress.xp },
    }
    const newValue = JSON.stringify({ state, version: STORE_VERSION })
    storage.setItem(STORE_KEY, newValue)
    target.dispatchEvent(storageEvent({ key: STORE_KEY, newValue, storageArea: storage }))
    // rehydrate läuft asynchron
    await new Promise((r) => setTimeout(r, 0))
  }

  it('übernimmt den Stand des anderen Fensters', async () => {
    await otherWindowSaves({ xp: 120, flightNum: 7 })
    expect(useApp.getState().progress.xp).toBe(120)
    expect(useApp.getState().profile.flightNum).toBe(7)
    expect(useApp.getState().onboarded).toBe(true)
  })

  it('überschreibt beim nächsten Speichern nicht, was das andere Fenster gespeichert hat', async () => {
    await otherWindowSaves({ xp: 120 })
    useApp.getState().setProfile({ flightNum: 3 })
    const saved = JSON.parse(storage.data.get(STORE_KEY)!).state
    expect(saved.progress.xp).toBe(120)
    expect(saved.profile.flightNum).toBe(3)
  })

  it('verändert den Speicher nicht, wenn es nur neu lädt', async () => {
    await otherWindowSaves({ xp: 50 })
    const before = storage.data.get(STORE_KEY)
    target.dispatchEvent(storageEvent({ key: STORE_KEY, newValue: before!, storageArea: storage }))
    await new Promise((r) => setTimeout(r, 0))
    expect(storage.data.get(STORE_KEY)).toBe(before)
  })

  it('behält die flüchtigen Meldungen dieses Fensters', async () => {
    useApp.setState({ toasts: ['erster-flug'] })
    await otherWindowSaves({ xp: 10 })
    expect(useApp.getState().toasts).toEqual(['erster-flug'])
  })
})
