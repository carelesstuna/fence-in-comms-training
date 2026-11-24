/**
 * Gespeicherter Zustand (Profil + Fortschritt): Schema, Migrationen und abgesicherter Browser-Speicher.
 *
 * Beim Laden läuft der Zustand immer durch `restorePersisted` – nicht nur bei einem Versionswechsel:
 * - Fehlende Felder bekommen ihre Standardwerte.
 * - Ungültige Werte werden ersetzt, ungültige Einträge in Listen und Sammlungen verworfen.
 * - Unbekannte Felder in Profil und Fortschritt bleiben erhalten.
 * - Ausgemusterte Sims (RETIRED_SIMS) fallen still aus dem Profil.
 * Wurde dabei etwas ersetzt oder verworfen, landen die Originaldaten vorher unter BACKUP_KEY.
 *
 * Die Standardwerte kommen aus DEFAULT_PROFILE und EMPTY_PROGRESS (über `STORE_DEFAULTS` im Store).
 * Neue Felder dort sind automatisch abgedeckt: geprüft wird dann der Grundtyp des Standardwerts.
 * Felder mit Struktur (Sammlungen, Listen mit bestimmten Werten) bekommen unten ein eigenes Schema.
 */
import { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { aircraftSchema, simSchema } from '../core/content/schema'
import { PHRASEOLOGY_SETTINGS } from '../core/random/phraseology'
import type {
  CheckrideRecord,
  LessonRecord,
  PlacementRecord,
  ExamRecord,
  ProgressState,
} from '../core/progress/progress'
import type { DailyRecord, ReviewCard } from '../core/progress/review'
import type { Profile } from './store'

export const STORE_KEY = 'fence-in-comms-training'
/** Hier landen gespeicherte Daten, bevor sie beim Laden ersetzt oder repariert werden. */
export const BACKUP_KEY = 'fence-in-comms-training-backup'
/** Version des gespeicherten Formats (zustand persist). */
export const STORE_VERSION = 5

/** Was im Browser gespeichert wird. */
export interface PersistedState {
  onboarded: boolean
  profile: Profile
  progress: ProgressState
}

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// --- Schema-Bausteine --------------------------------------------------------------------------

/** Objekt mit den Feldern aus `defaults` (und `known`); unbekannte Felder bleiben erhalten. */
function shaped<T extends object>(
  defaults: T,
  known: { [K in keyof T]?: z.ZodType<T[K]> } = {},
): z.ZodType<T> {
  const schemas = known as Record<string, z.ZodType | undefined>
  const shape: Record<string, z.ZodType> = {}
  for (const key of new Set([...Object.keys(defaults), ...Object.keys(known)])) {
    shape[key] = schemas[key] ?? like((defaults as Record<string, unknown>)[key])
  }
  return z
    .looseObject(shape)
    .catch(() => defaults as Record<string, unknown>) as unknown as z.ZodType<T>
}

/** Wert vom selben Grundtyp wie der Standardwert – sonst gilt der Standardwert. */
function like(def: unknown): z.ZodType {
  if (typeof def === 'boolean') return z.boolean().catch(def)
  // z.number() lehnt NaN und Infinity ab
  if (typeof def === 'number') return z.number().catch(def)
  if (typeof def === 'string') return z.string().catch(def)
  if (Array.isArray(def)) {
    const type = def.length > 0 ? typeof def[0] : null
    return listOf(type ? z.custom((x) => typeof x === type) : z.unknown(), def)
  }
  if (isRecord(def)) return Object.keys(def).length > 0 ? shaped(def) : recordOf(z.unknown())
  return z.unknown()
}

/** Liste ohne ungültige Einträge; ist es gar keine Liste, gilt der Standardwert. */
function listOf<T>(item: z.ZodType<T>, def: T[]): z.ZodType<T[]> {
  return z
    .array(z.unknown())
    .catch(() => def)
    .transform((list) =>
      list.flatMap((x) => {
        const r = item.safeParse(x)
        return r.success ? [r.data] : []
      }),
    )
}

/** Sammlung mit beliebigen Schlüsseln (z. B. je Lektions-ID) ohne ungültige Einträge. */
function recordOf<T>(entry: z.ZodType<T>): z.ZodType<Record<string, T>> {
  return z
    .record(z.string(), z.unknown())
    .catch(() => ({}))
    .transform((obj) => {
      const out: Record<string, T> = {}
      for (const [key, value] of Object.entries(obj)) {
        if (key === '__proto__') continue
        const r = entry.safeParse(value)
        if (r.success) out[key] = r.data
      }
      return out
    })
}

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)))
const count = z.number().int().min(0)

// Einträge mit kaputten Einzelwerten bleiben erhalten (eine erledigte Lektion bleibt erledigt) …
const lessonRecord: z.ZodType<LessonRecord> = z.looseObject({
  completedAt: z.string().catch(''),
  bestScore: z.number().catch(0),
  attempts: count.catch(1),
})
const placementRecord: z.ZodType<PlacementRecord> = z.looseObject({
  at: z.string().catch(''),
  score: z.number().catch(0),
  passed: z.boolean().catch(false),
  // Seit „Weg für Erfahrene“ (wiederholbare Einstufung); ältere Stände haben sie nicht
  bestScore: z.number().optional().catch(undefined),
  attempts: count.optional().catch(undefined),
  passedAt: z.string().optional().catch(undefined),
})
// Seit der Modulprüfung (S-15); ältere Stände haben sie nicht
const examRecord: z.ZodType<ExamRecord> = z.looseObject({
  at: z.string().catch(''),
  score: z.number().catch(0),
  bestScore: z.number().catch(0),
  attempts: count.catch(1),
  passed: z.boolean().catch(false),
  passedAt: z.string().optional().catch(undefined),
})
const checkrideRecord: z.ZodType<CheckrideRecord> = z.looseObject({
  at: z.string().catch(''),
  score: z.number().catch(0),
  bestScore: z.number().catch(0),
  attempts: count.catch(1),
  passed: z.boolean().catch(false),
  passedAt: z.string().optional().catch(undefined),
})
// … Wiederholungskarten dagegen nur vollständig: mit kaputtem Datum rechnet FSRS falsch.
// Eine verworfene Karte wird beim nächsten Üben neu angelegt.
const reviewCard: z.ZodType<ReviewCard> = z.looseObject({
  due: isoDate,
  stability: z.number(),
  difficulty: z.number(),
  elapsed_days: z.number().catch(0),
  scheduled_days: z.number(),
  learning_steps: z.number().catch(0),
  reps: count,
  lapses: count,
  state: z.number().int().min(0).max(3),
  last_review: isoDate.optional(),
})
const achievementRecord = z.looseObject({ at: z.string().catch('') })

function profileSchema(def: Profile): z.ZodType<Profile> {
  return shaped(def, {
    sims: listOf(simSchema, def.sims),
    aircraft: listOf(aircraftSchema, def.aircraft),
    flightNum: z.number().int().min(1).max(9).catch(def.flightNum),
    // Seit der Profil-Einstellung zur Phraseologie; ältere Stände bekommen den Standard „Immer US“
    phraseology: z.enum(PHRASEOLOGY_SETTINGS).catch(def.phraseology),
    speech: shaped(def.speech, {
      input: z.enum(['type', 'speak']).catch(def.speech.input),
      pttMode: z.enum(['hold', 'toggle']).catch(def.speech.pttMode),
      pttKey: z.string().min(1).max(40).catch(def.speech.pttKey),
      model: z.string().min(1).max(120).catch(def.speech.model),
      desktopModel: z.string().min(1).max(60).catch(def.speech.desktopModel),
    }),
    audio: shaped(def.audio, {
      noise: z.enum(['realistic', 'clear']).catch(def.audio.noise),
    }),
  })
}

function dailySchema(def: DailyRecord): z.ZodType<DailyRecord> {
  return shaped(def, {
    last: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .catch(undefined),
    streak: count.catch(def.streak),
    best: count.catch(def.best),
    days: count.catch(def.days ?? 0),
  })
}

function progressSchema(def: ProgressState): z.ZodType<ProgressState> {
  return shaped(def, {
    xp: z.number().min(0).catch(def.xp),
    lessons: recordOf(lessonRecord),
    placements: recordOf(placementRecord),
    exams: recordOf(examRecord),
    checkrides: recordOf(checkrideRecord),
    reviews: recordOf(reviewCard),
    daily: dailySchema(def.daily),
    hangarSeen: listOf(z.string(), def.hangarSeen),
    achievements: recordOf(achievementRecord),
    memory: recordOf(z.number().int().min(1).max(8)),
    modulesDone: listOf(z.string(), def.modulesDone),
    // stats und alle neuen Felder: nach dem Grundtyp des Standardwerts
  })
}

/** Schema für den gespeicherten Zustand; Standardwerte aus `defaults`. Scheitert nie. */
export function persistedSchema(defaults: PersistedState): z.ZodType<PersistedState> {
  return shaped(defaults, {
    profile: profileSchema(defaults.profile),
    progress: progressSchema(defaults.progress),
  })
}

// --- Prüfen und Migrieren ----------------------------------------------------------------------

/**
 * Pfade, an denen ein vorhandener Wert ersetzt oder verworfen wurde.
 * Fehlende Felder, die einen Standardwert bekommen, zählen nicht.
 */
export function changedPaths(before: unknown, after: unknown, path: string[] = []): string[] {
  if (before === undefined || Object.is(before, after)) return []
  const here = path.join('.') || '(alles)'
  if (Array.isArray(before) && Array.isArray(after)) {
    if (before.length !== after.length) return [here]
    return before.flatMap((b, i) => changedPaths(b, after[i], [...path, String(i)]))
  }
  if (isRecord(before) && isRecord(after)) {
    return Object.keys(before).flatMap((k) =>
      Object.hasOwn(after, k)
        ? changedPaths(before[k], after[k], [...path, k])
        : before[k] === undefined
          ? []
          : [[...path, k].join('.')],
    )
  }
  return [here]
}

/**
 * Sims, die es nicht mehr gibt. Sie fallen beim Laden aus `profile.sims`, ohne dass das als
 * beschädigte Daten gilt (keine Sicherung, kein Hinweis). Kommt ein Sim zurück, hier austragen.
 */
const RETIRED_SIMS: readonly unknown[] = ['msfs']

function dropRetiredSims(input: unknown): unknown {
  if (!isRecord(input) || !isRecord(input.profile) || !Array.isArray(input.profile.sims)) return input
  const sims: unknown[] = input.profile.sims
  if (!sims.some((x) => RETIRED_SIMS.includes(x))) return input
  const kept = sims.filter((x) => !RETIRED_SIMS.includes(x))
  return { ...input, profile: { ...input.profile, sims: kept } }
}

/** Gespeicherten Zustand prüfen und vervollständigen. Nur die drei gespeicherten Felder kommen zurück. */
export function sanitizePersisted(
  input: unknown,
  defaults: PersistedState,
): { state: PersistedState; repaired: string[] } {
  const stored = dropRetiredSims(input)
  const r = persistedSchema(defaults).safeParse(stored)
  const s = r.success ? r.data : defaults
  const state = { onboarded: s.onboarded, profile: s.profile, progress: s.progress }
  return { state, repaired: changedPaths(stored, r.success ? r.data : undefined) }
}

/** Felder im Fortschritt, die mit einer Version dazukamen (Standardwerte aus den Defaults). */
const ADDED_IN_VERSION: Record<number, readonly (keyof ProgressState)[]> = {
  2: ['checkrides'],
  3: ['reviews', 'daily'],
  4: ['stats', 'achievements'],
  5: ['memory', 'modulesDone'],
}

/**
 * Lektionslisten bis v4 (0.2.0) von Modulen, die seither Lektionen dazubekommen haben. Wer so ein Modul damals
 * über alle Lektionen erledigt hatte, behält es erledigt: v5 trägt es in `modulesDone` ein. Module ohne neue
 * Lektionen trägt der Store beim Start selbst ein (`recordModulesDone`).
 * - m2: m2-l10 (Bullseye) kam mit 0.3.0 dazu.
 */
const LESSONS_UNTIL_V4: Readonly<Record<string, readonly string[]>> = {
  m2: ['m2-l1', 'm2-l2', 'm2-l3', 'm2-l4', 'm2-l5', 'm2-l6', 'm2-l7', 'm2-l8', 'm2-l9'],
}

/** v5: Module, die mit den Lektionen von v4 erledigt waren, zu `modulesDone` hinzufügen. */
function keepModulesDone(progress: Record<string, unknown>): Record<string, unknown> {
  const lessons = isRecord(progress.lessons) ? progress.lessons : {}
  const have = Array.isArray(progress.modulesDone) ? progress.modulesDone : []
  const done = Object.entries(LESSONS_UNTIL_V4)
    .filter(([id, ids]) => !have.includes(id) && ids.every((l) => isRecord(lessons[l])))
    .map(([id]) => id)
  return done.length > 0 ? { ...progress, modulesDone: [...have, ...done] } : progress
}

/**
 * Gespeicherten Zustand einer älteren Version auf STORE_VERSION bringen. Rein und ohne Prüfung –
 * die übernimmt danach `sanitizePersisted`. Neuere Versionen bleiben unverändert.
 *
 * - v1: onboarded, profile, progress mit xp, lessons, placements, hangarSeen
 * - v2: + progress.checkrides
 * - v3: + progress.reviews, progress.daily (Funk-Drill)
 * - v4: + progress.stats, progress.achievements, daily.days
 * - v5: + progress.memory (Merk-Übungen), progress.modulesDone; Module, die mit den Lektionen von v4 erledigt
 *   waren, bleiben erledigt (`LESSONS_UNTIL_V4`)
 */
export function migratePersisted(
  state: unknown,
  fromVersion: number,
  defaults: PersistedState,
): unknown {
  if (!isRecord(state)) return state
  let s = state
  for (let v = fromVersion + 1; v <= STORE_VERSION; v++) {
    if (!isRecord(s.progress)) continue
    const added = ADDED_IN_VERSION[v] ?? []
    let progress: Record<string, unknown> = {
      ...Object.fromEntries(added.map((k) => [k, defaults.progress[k]])),
      ...s.progress,
    }
    if (v === 5) progress = keepModulesDone(progress)
    s = { ...s, progress }
  }
  return s
}

// --- Browser-Speicher und Sicherung ------------------------------------------------------------

/** Schlüssel-Wert-Speicher wie localStorage (in Tests austauschbar). */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const memory = new Map<string, string>()
const memoryStore: KeyValueStore = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
}

let backend: KeyValueStore | null = null

/**
 * Speicher ersetzen – in der Desktop-App localStorage mit Datei-Spiegel. Muss vor dem Laden des
 * Stores passieren (siehe main.tsx).
 */
export function setStorageBackend(store: KeyValueStore | null): void {
  backend = store
}

/** localStorage, falls nutzbar – sonst (z. B. blockierter Speicher im privaten Modus) nur im Arbeitsspeicher. */
export function browserStore(): KeyValueStore {
  if (backend) return backend
  try {
    if (globalThis.localStorage) return globalThis.localStorage
  } catch {
    // Zugriff verweigert
  }
  return memoryStore
}

/** JSON lesen; `__proto__`-Schlüssel fallen weg, damit manipulierte Daten keine Prototypen setzen. */
export function parseJson(text: string): unknown {
  return JSON.parse(text, (key, value: unknown) => (key === '__proto__' ? undefined : value))
}

export interface Backup {
  /** Zeitpunkt der Sicherung (ISO). */
  at: string
  /** Warum gesichert wurde. */
  reason: string
  /** Die gespeicherten Daten, unverändert als Text. */
  raw: string
}

export function readBackup(store: KeyValueStore = browserStore()): Backup | null {
  try {
    const text = store.getItem(BACKUP_KEY)
    if (text === null) return null
    try {
      const b = parseJson(text)
      if (isRecord(b) && typeof b.raw === 'string') {
        return {
          at: typeof b.at === 'string' ? b.at : '',
          reason: typeof b.reason === 'string' ? b.reason : '',
          raw: b.raw,
        }
      }
    } catch {
      // kein JSON – dann ist der Text selbst die Sicherung
    }
    return { at: '', reason: '', raw: text }
  } catch {
    return null
  }
}

/** Daten sichern, bevor sie überschrieben werden. Dieselben Daten werden nicht doppelt gesichert. */
export function writeBackup(
  raw: string,
  reason: string,
  store: KeyValueStore = browserStore(),
  now = new Date(),
): void {
  try {
    if (readBackup(store)?.raw === raw) return
    store.setItem(
      BACKUP_KEY,
      JSON.stringify({ at: now.toISOString(), reason, raw } satisfies Backup),
    )
    console.warn(`Fence In Comms Training: ${reason}. Die Originaldaten liegen unter „${BACKUP_KEY}“.`)
  } catch (e) {
    console.warn('Fence In Comms Training: Sicherung konnte nicht gespeichert werden.', e)
  }
}

export function clearBackup(store: KeyValueStore = browserStore()): void {
  try {
    store.removeItem(BACKUP_KEY)
  } catch {
    // nichts zu tun
  }
}

/** Kurze Beschreibung der reparierten Stellen für die Sicherung. */
export function describeRepairs(paths: string[], max = 8): string {
  const shown = paths.slice(0, max).join(', ')
  return paths.length > max ? `${shown} und ${paths.length - max} weitere` : shown
}

/**
 * Geladenen (und ggf. migrierten) Zustand prüfen. Musste dabei etwas ersetzt oder verworfen werden,
 * werden die Daten vorher gesichert.
 */
export function restorePersisted(
  input: unknown,
  defaults: PersistedState,
  store: KeyValueStore = browserStore(),
): PersistedState {
  const { state, repaired } = sanitizePersisted(input, defaults)
  if (repaired.length > 0) {
    writeBackup(
      JSON.stringify({ state: input, version: STORE_VERSION }),
      `Ungültige gespeicherte Werte ersetzt: ${describeRepairs(repaired)}`,
      store,
    )
  }
  return state
}

/**
 * Speicher für zustand persist. Ungültiges JSON oder ein unbekanntes Format wird gesichert und
 * führt zu einem frischen Start statt zum Absturz; ein voller oder gesperrter Speicher ebenso.
 */
export function createSafeStorage(
  store: () => KeyValueStore = browserStore,
): PersistStorage<PersistedState> {
  return {
    getItem: (name) => {
      const s = store()
      let raw: string | null
      try {
        raw = s.getItem(name)
      } catch {
        return null
      }
      if (raw === null) return null
      try {
        const value = parseJson(raw)
        if (isRecord(value) && isRecord(value.state)) return value as StorageValue<PersistedState>
        writeBackup(raw, 'Gespeicherte Daten hatten ein unbekanntes Format', s)
      } catch {
        writeBackup(raw, 'Gespeicherte Daten waren kein gültiges JSON', s)
      }
      return null
    },
    setItem: (name, value) => {
      try {
        store().setItem(name, JSON.stringify(value))
      } catch (e) {
        // Speicher voll oder gesperrt: weiterüben geht, nur gespeichert wird nicht
        console.warn('Fence In Comms Training: Fortschritt konnte nicht gespeichert werden.', e)
      }
    },
    removeItem: (name) => {
      try {
        store().removeItem(name)
      } catch {
        // nichts zu tun
      }
    },
  }
}

// --- Datei-Spiegel (Desktop-App) ---------------------------------------------------------------

/** Diese Schlüssel werden zusätzlich als Datei gespiegelt. */
export const MIRROR_KEYS: readonly string[] = [STORE_KEY, BACKUP_KEY]
export const MIRROR_FORMAT = 'fence-in-comms-training-spiegel'

export interface MirrorFile {
  format: typeof MIRROR_FORMAT
  version: 1
  savedAt: string
  /** Schlüssel → gespeicherter Text, genau wie im Browser-Speicher. */
  data: Record<string, string>
}

function tryGet(store: KeyValueStore, key: string): string | null {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

/** Inhalt der Spiegel-Datei: die gespiegelten Schlüssel, unverändert als Text. */
export function mirrorSnapshot(store: KeyValueStore, now = new Date()): string {
  const data: Record<string, string> = {}
  for (const key of MIRROR_KEYS) {
    const value = tryGet(store, key)
    if (value !== null) data[key] = value
  }
  return JSON.stringify({ format: MIRROR_FORMAT, version: 1, savedAt: now.toISOString(), data } satisfies MirrorFile)
}

/**
 * Beim Start: Ist der Browser-Speicher leer (neue App-Kennung, zurückgesetztes WebView2-Profil,
 * Neuinstallation), kommt der Stand aus der Spiegel-Datei zurück. Geprüft wird er danach wie jeder
 * gespeicherte Stand (`restorePersisted`). Gibt zurück, ob etwas übernommen wurde.
 */
export function restoreFromMirror(store: KeyValueStore, text: string | null): boolean {
  if (!text || tryGet(store, STORE_KEY) !== null) return false
  let file: unknown
  try {
    file = parseJson(text)
  } catch {
    return false
  }
  if (!isRecord(file) || file.format !== MIRROR_FORMAT || !isRecord(file.data)) return false
  const state = file.data[STORE_KEY]
  if (typeof state !== 'string') return false
  try {
    store.setItem(STORE_KEY, state)
    const backup = file.data[BACKUP_KEY]
    if (typeof backup === 'string' && tryGet(store, BACKUP_KEY) === null) store.setItem(BACKUP_KEY, backup)
    return true
  } catch {
    return false
  }
}

/** Speicher, der jede Änderung an gespiegelten Schlüsseln meldet – das Schreiben bündelt der Aufrufer. */
export function mirroredStore(base: KeyValueStore, onChange: () => void): KeyValueStore {
  const keys = new Set(MIRROR_KEYS)
  return {
    getItem: (key) => base.getItem(key),
    setItem: (key, value) => {
      base.setItem(key, value)
      if (keys.has(key)) onChange()
    },
    removeItem: (key) => {
      base.removeItem(key)
      if (keys.has(key)) onChange()
    },
  }
}
