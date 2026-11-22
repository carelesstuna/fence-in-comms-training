/**
 * Fortschritt als Datei sichern und wieder einlesen, dazu dauerhaften Browserspeicher anfragen.
 */
import { STORE_DEFAULTS, useApp } from './store'
import {
  browserStore,
  isRecord,
  migratePersisted,
  parseJson,
  sanitizePersisted,
  STORE_KEY,
  STORE_VERSION,
  type PersistedState,
} from './persisted'

const APP = 'fence-in-comms-training'
/** Größer wird eine echte Sicherung nicht annähernd. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

/** Inhalt einer Sicherungsdatei. */
export interface ExportFile {
  app: typeof APP
  kind: 'fortschritt'
  /** Version des gespeicherten Formats (wie im Browserspeicher). */
  version: number
  exportedAt: string
  state: PersistedState
}

export function buildExport(state: PersistedState, now = new Date()): ExportFile {
  return {
    app: APP,
    kind: 'fortschritt',
    version: STORE_VERSION,
    exportedAt: now.toISOString(),
    state: { onboarded: state.onboarded, profile: state.profile, progress: state.progress },
  }
}

/** Dateiname mit lokalem Datum, z. B. fence-in-comms-training-fortschritt-2026-11-21.json. */
export function exportFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `fence-in-comms-training-fortschritt-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

export type ImportResult =
  | {
      ok: true
      state: PersistedState
      /** Stellen, an denen ungültige Werte ersetzt oder verworfen wurden. */
      repaired: string[]
      exportedAt?: string
      version: number
    }
  | { ok: false; error: string }

/**
 * Sicherungsdatei prüfen. Angenommen werden eigene Sicherungen und die Rohdaten aus dem
 * Browserspeicher ({ state, version }); ältere Versionen werden migriert.
 */
export function parseImport(text: string, defaults: PersistedState = STORE_DEFAULTS): ImportResult {
  let data: unknown
  try {
    data = parseJson(text)
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige JSON-Datei.' }
  }
  if (!isRecord(data) || (data.app !== undefined && data.app !== APP)) {
    return { ok: false, error: 'Die Datei ist keine Sicherung von Fence In Comms Training.' }
  }
  const raw = data.state
  if (!isRecord(raw) || (!isRecord(raw.progress) && !isRecord(raw.profile))) {
    return { ok: false, error: 'In der Datei steht kein Fortschritt.' }
  }
  const version = typeof data.version === 'number' ? data.version : STORE_VERSION
  const migrated = version < STORE_VERSION ? migratePersisted(raw, version, defaults) : raw
  const { state, repaired } = sanitizePersisted(migrated, defaults)
  return {
    ok: true,
    state,
    repaired,
    version,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : undefined,
  }
}

/** Datei im Browser herunterladen. */
export function downloadFile(name: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Aktuellen Stand als Datei herunterladen. Klappt das nicht (z. B. nach einem Fehler im Zustand),
 * werden die Rohdaten aus dem Browserspeicher gesichert. Gibt zurück, ob etwas gesichert wurde.
 */
export function downloadProgress(now = new Date()): boolean {
  try {
    const s = useApp.getState()
    downloadFile(exportFilename(now), JSON.stringify(buildExport(s, now), null, 2))
    return true
  } catch (e) {
    console.warn('Fence In Comms Training: Export aus dem Zustand fehlgeschlagen, sichere Rohdaten.', e)
  }
  try {
    const raw = browserStore().getItem(STORE_KEY)
    if (raw === null) return false
    downloadFile(exportFilename(now), raw)
    return true
  } catch {
    return false
  }
}

/** Dauerhafter Speicher: true/false, oder null, wenn der Browser das nicht kennt. */
export async function isStoragePersisted(): Promise<boolean | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return null
    return await navigator.storage.persisted()
  } catch {
    return null
  }
}

/**
 * Den Browser bitten, die Daten nicht von selbst zu löschen (Safari tut das sonst nach sieben Tagen
 * ohne Besuch). Chrome und Safari entscheiden still, Firefox fragt einmal nach.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return null
  }
}
