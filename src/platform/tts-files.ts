/**
 * Wo die Dateien der Sprachausgabe liegen und wie sie dorthin kommen – nach demselben Muster wie die
 * Whisper-Modelle: auf Klick von der Originalquelle, mit Größe und SHA-256 geprüft, sonst verworfen.
 *
 * - **Desktop-App:** Rust lädt in den eigenen Modell-Ordner (`%LOCALAPPDATA%\…\modelle`) und liest
 *   von dort (`src-tauri/src/tts.rs`).
 * - **Browser:** im Cache Storage des Browsers (`fence-in-comms-training-tts`), bleibt über Neustarts erhalten.
 * - **Dev-Server:** liegen die Dateien in `.asr/tts` (`npm run fetch-asr -- tts`), kommen sie von dort.
 */
import { TTS_FILES, type TtsFile } from './tts-config'
import { isTauri } from './speech-context'

export interface DownloadProgress {
  file: string
  /** Bytes aller fehlenden Dateien zusammen. */
  done: number
  total: number
  /** Verbindung abgerissen, es geht an derselben Stelle weiter. */
  retry?: string
}

export interface TtsStore {
  readonly kind: 'desktop' | 'browser' | 'dev'
  /** Fehlende Dateien (leer = alles da). */
  missing(): Promise<TtsFile[]>
  download(onProgress: (p: DownloadProgress) => void, signal: AbortSignal): Promise<void>
  read(name: string): Promise<ArrayBuffer>
}

const errorText = (e: unknown) =>
  typeof e === 'string' ? e : e instanceof Error ? e.message : String(e)

export function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Browser: Cache Storage
// ---------------------------------------------------------------------------

const CACHE = 'fence-in-comms-training-tts'
const cacheKey = (name: string) => `/__tts/${name}`

async function fetchChecked(
  f: TtsFile,
  onBytes: (n: number) => void,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const res = await fetch(f.url, { signal, cache: 'no-store' })
  if (!res.ok || !res.body) throw new Error(`${f.name}: Server antwortet mit ${res.status}.`)
  const data = new Uint8Array(f.size)
  let at = 0
  const reader = res.body.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (at + value.length > f.size) throw new Error(`${f.name}: größer als erwartet – verworfen.`)
    data.set(value, at)
    at += value.length
    onBytes(value.length)
  }
  if (at !== f.size) throw new Error(`${f.name}: unvollständig (${at} von ${f.size} Bytes).`)
  const hash = toHex(await crypto.subtle.digest('SHA-256', data))
  if (hash !== f.sha256) throw new Error(`${f.name}: Prüfsumme stimmt nicht – verworfen.`)
  return data.buffer
}

export const browserStore: TtsStore = {
  kind: 'browser',
  async missing() {
    if (typeof caches === 'undefined') return [...TTS_FILES]
    const cache = await caches.open(CACHE)
    const have = await Promise.all(
      TTS_FILES.map(async (f) => (await cache.match(cacheKey(f.name))) !== undefined),
    )
    return TTS_FILES.filter((_, i) => !have[i])
  },
  async download(onProgress, signal) {
    if (typeof caches === 'undefined')
      throw new Error('Dieser Browser kann keine Dateien dauerhaft speichern.')
    const todo = await this.missing()
    const total = todo.reduce((n, f) => n + f.size, 0)
    const cache = await caches.open(CACHE)
    let done = 0
    for (const f of todo) {
      let buf: ArrayBuffer | null = null
      for (let attempt = 1; !buf; attempt++) {
        const before = done
        try {
          buf = await fetchChecked(
            f,
            (n) => onProgress({ file: f.name, done: (done += n), total }),
            signal,
          )
        } catch (e) {
          done = before
          if (signal.aborted || attempt >= 3 || /Prüfsumme|größer/.test(errorText(e))) throw e
          onProgress({
            file: f.name,
            done,
            total,
            retry: `Verbindung abgerissen, Versuch ${attempt + 1} von 3 …`,
          })
        }
      }
      await cache.put(
        cacheKey(f.name),
        new Response(buf, {
          headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(f.size) },
        }),
      )
    }
  },
  async read(name) {
    const hit = await (await caches.open(CACHE)).match(cacheKey(name))
    if (!hit) throw new Error(`${name} fehlt.`)
    return hit.arrayBuffer()
  },
}

/** Gespeicherte Dateien der Sprachausgabe im Browser löschen (Einstellungen → „Entfernen“). */
export async function clearBrowserStore(): Promise<void> {
  if (typeof caches !== 'undefined') await caches.delete(CACHE)
}

// ---------------------------------------------------------------------------
// Dev-Server: .asr/tts
// ---------------------------------------------------------------------------

export const devStore: TtsStore = {
  kind: 'dev',
  async missing() {
    const ok = await Promise.all(
      TTS_FILES.map((f) =>
        fetch(`/tts/${f.name}`, { method: 'HEAD' }).then(
          (r) => r.ok,
          () => false,
        ),
      ),
    )
    return TTS_FILES.filter((_, i) => !ok[i])
  },
  download() {
    return Promise.reject(new Error('Auf dem Dev-Server: npm run fetch-asr -- tts'))
  },
  async read(name) {
    const res = await fetch(`/tts/${name}`)
    if (!res.ok) throw new Error(`${name} fehlt.`)
    return res.arrayBuffer()
  },
}

// ---------------------------------------------------------------------------
// Desktop-App: Rust
// ---------------------------------------------------------------------------

type RustEvent =
  | { kind: 'progress'; file: string; done: number; total: number }
  | { kind: 'retry'; file: string; attempt: number; max: number }
  | { kind: 'verified'; file: string }

const core = () => import('@tauri-apps/api/core')

export const desktopStore: TtsStore = {
  kind: 'desktop',
  async missing() {
    const names = await (await core()).invoke<string[]>('tts_missing')
    return TTS_FILES.filter((f) => names.includes(f.name))
  },
  async download(onProgress, signal) {
    const { Channel, invoke } = await core()
    const todo = await this.missing()
    const total = todo.reduce((n, f) => n + f.size, 0)
    let finished = 0
    const channel = new Channel<RustEvent>()
    channel.onmessage = (e) => {
      if (e.kind === 'progress') onProgress({ file: e.file, done: finished + e.done, total })
      else if (e.kind === 'retry')
        onProgress({
          file: e.file,
          done: finished,
          total,
          retry: `Verbindung abgerissen, Versuch ${e.attempt} von ${e.max} …`,
        })
      else finished += TTS_FILES.find((f) => f.name === e.file)?.size ?? 0
    }
    const cancel = () => void invoke('cancel_download')
    signal.addEventListener('abort', cancel)
    try {
      await invoke('download_tts', { onEvent: channel })
    } catch (e) {
      throw new Error(errorText(e), { cause: e })
    } finally {
      signal.removeEventListener('abort', cancel)
    }
  },
  async read(name) {
    try {
      return await (await core()).invoke<ArrayBuffer>('read_tts_file', { name })
    } catch (e) {
      throw new Error(errorText(e), { cause: e })
    }
  },
}

/** Die passende Ablage: Desktop-App, sonst Dev-Server (falls die Dateien dort liegen), sonst Browser. */
export async function pickStore(): Promise<TtsStore> {
  if (isTauri()) return desktopStore
  if (import.meta.env.DEV && (await devStore.missing()).length === 0) return devStore
  return browserStore
}
