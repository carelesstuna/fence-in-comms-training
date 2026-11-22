/**
 * Desktop-App (Tauri): Fortschritt zusätzlich als Datei spiegeln. `@tauri-apps/api` wird nur hier
 * und nur bei Bedarf geladen – die Browser-Version bleibt davon unberührt.
 */
import { mirroredStore, mirrorSnapshot, restoreFromMirror, setStorageBackend, STORE_KEY, type KeyValueStore } from '../state/persisted'
import { isTauri } from './speech-context'

/** So lange nach der letzten Änderung wird geschrieben. */
const WRITE_DELAY_MS = 400

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const core = await import('@tauri-apps/api/core')
  return core.invoke<T>(cmd, args)
}

/**
 * Vor dem Laden des Stores aufrufen: Stand aus der Datei zurückholen, falls localStorage leer ist,
 * und danach jede Änderung gebündelt in die Datei schreiben.
 */
export async function setupDesktopStorage(): Promise<void> {
  if (!isTauri()) return
  const base: KeyValueStore = globalThis.localStorage
  const restored = restoreFromMirror(base, await invoke<string | null>('read_progress'))
  if (restored) console.info('Fence In Comms Training: Fortschritt aus der Spiegel-Datei wiederhergestellt.')

  let timer: ReturnType<typeof setTimeout> | undefined
  let queue = Promise.resolve()
  const flush = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    const data = mirrorSnapshot(base)
    queue = queue.then(() => invoke<void>('write_progress', { data })).catch((e: unknown) => console.warn('Fence In Comms Training: Spiegel-Datei nicht geschrieben.', e))
  }
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, WRITE_DELAY_MS)
  }
  setStorageBackend(mirroredStore(base, schedule))
  // Beim Verstecken oder Schließen nichts liegen lassen
  window.addEventListener('pagehide', () => timer && flush())
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && timer && flush())
  // Erster Start mit Spiegel, aber schon vorhandenem Stand: Datei gleich anlegen
  if (!restored && base.getItem(STORE_KEY) !== null) flush()
}

/** Der Teil eines Klickereignisses, den `blankLinkHref` braucht (damit der Test ohne Browser auskommt). */
export interface ClickLike {
  defaultPrevented: boolean
  button: number
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  target: unknown
}

/**
 * Die Adresse, die ein Klick auf einen Link mit `target="_blank"` öffnen soll, sonst `null`.
 * Nur normale Klicks (linke Taste, ohne Umschalttasten) auf `http`/`https`-Links, die noch niemand abgefangen hat.
 */
export function blankLinkHref(ev: ClickLike): string | null {
  if (ev.defaultPrevented || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return null
  const el = ev.target as { closest?: (selector: string) => unknown } | null
  const link = typeof el?.closest === 'function' ? (el.closest('a[target="_blank"]') as { href?: string } | null) : null
  const href = link?.href
  return href && /^https?:/i.test(href) ? href : null
}

/**
 * Desktop-App (Tauri): Ein Link mit `target="_blank"` erreicht den Handler für neue Fenster (`on_new_window` in
 * `src-tauri/src/lib.rs`) nicht, `window.open` aus einer Nutzergeste dagegen schon (in der laufenden App geprüft, mit
 * echten Mausklicks). Deshalb übernimmt dieser Handler den Klick und ruft `window.open` auf: App-eigene Adressen
 * öffnen so ein zweites Fenster, externe den Systembrowser. Im Browser bleibt alles beim Standard.
 */
export function setupBlankLinks(): void {
  if (!isTauri()) return
  // Am Dokument, nach React: Was ein Klick-Handler der Seite schon abgefangen hat (`defaultPrevented`), bleibt unberührt
  document.addEventListener('click', (ev) => {
    const href = blankLinkHref(ev)
    if (!href) return
    ev.preventDefault()
    window.open(href, '_blank')
  })
}

/** Wo die Spiegel-Datei liegt (nur in der Desktop-App). */
export async function mirrorLocation(): Promise<string | null> {
  if (!isTauri()) return null
  try {
    return await invoke<string>('progress_location')
  } catch {
    return null
  }
}
