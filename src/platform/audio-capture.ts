/**
 * Mikrofon-Aufnahme im Browser (und im WebView2 von Tauri):
 * getUserMedia → AudioWorklet → Ringpuffer mit Vorlauf → beim Loslassen auf 16 kHz mono.
 *
 * Das Mikrofon ist nur offen, solange ein Funkspruch erwartet wird: `acquireMicrophone()` öffnet es
 * (oder nutzt das offene mit), `release()` gibt es frei. Nach dem letzten Freigeben bleibt es noch
 * kurz offen, damit zwischen zwei Übungsschritten nicht jedes Mal die Mikrofon-Anzeige flackert.
 */
import workletUrl from './capture-worklet.ts?worker&url'
import { ASR_RATE, concat, levelStats, PreRoll, resample, type LevelStats } from '../core/speech/pcm'
import { micList, type MicList } from '../core/speech/mics'

export type { MicList } from '../core/speech/mics'

export interface CaptureOptions {
  /** Gerät (`MediaDeviceInfo.deviceId`); leer = Standardmikrofon. */
  deviceId?: string
  /** Echo- und Rauschunterdrückung sowie automatische Lautstärke des Browsers. */
  filters?: boolean
}

export interface Recording {
  /** 16 kHz mono, -1 bis 1, mit Vor- und Nachlauf. */
  pcm: Float32Array
  /** Pegel der Aufnahme; `durationMs` ist die Zeit, in der die Sprechtaste gedrückt war. */
  stats: LevelStats
  /** Abtastrate des Mikrofons. */
  nativeRate: number
}

/** Vorlauf: so viel vor dem Drücken der Sprechtaste ist in der Aufnahme. */
export const PRE_ROLL_MS = 300
/** Nachlauf: so lange läuft die Aufnahme nach dem Loslassen weiter (das letzte Wort klingt aus). */
export const TAIL_MS = 200

export type MicErrorKind = 'denied' | 'not-found' | 'busy' | 'unsupported' | 'other'

export class MicError extends Error {
  constructor(
    readonly kind: MicErrorKind,
    message: string,
  ) {
    super(message)
  }
}

function micError(e: unknown): MicError {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return new MicError('denied', 'Der Zugriff aufs Mikrofon wurde verweigert. Bitte im Browser erlauben.')
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return new MicError('not-found', 'Kein Mikrofon gefunden. Ist eines angeschlossen und eingeschaltet?')
  if (name === 'NotReadableError') return new MicError('busy', 'Das Mikrofon ist belegt oder lässt sich nicht öffnen.')
  return new MicError('other', `Mikrofon-Fehler: ${e instanceof Error ? e.message : String(e)}`)
}

export class AudioCapture {
  /** Aktueller Pegel (Effektivwert und Spitze des letzten Blocks, 0–1). */
  level = { rms: 0, peak: 0 }
  private readonly listeners = new Set<(level: { rms: number; peak: number }) => void>()
  private readonly preRoll: PreRoll
  private chunks: Float32Array[] | null = null
  private startedAt = 0
  private stopping: Promise<Recording> | null = null

  private constructor(
    private readonly ctx: AudioContext,
    private readonly stream: MediaStream,
    private readonly nodes: AudioNode[],
    readonly options: CaptureOptions,
  ) {
    this.preRoll = new PreRoll((ctx.sampleRate * PRE_ROLL_MS) / 1000)
  }

  static async open(options: CaptureOptions = {}): Promise<AudioCapture> {
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === 'undefined') {
      throw new MicError('unsupported', 'Dieser Browser kann nicht aufnehmen (getUserMedia/AudioWorklet fehlt).')
    }
    const filters = options.filters ?? false
    const audio: MediaTrackConstraints = { channelCount: 1, echoCancellation: filters, noiseSuppression: filters, autoGainControl: filters }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: options.deviceId ? { ...audio, deviceId: { exact: options.deviceId } } : audio })
    } catch (e) {
      // Gewähltes Gerät nicht mehr da: dann das Standardmikrofon
      if (options.deviceId && e instanceof DOMException && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        return AudioCapture.open({ ...options, deviceId: undefined })
      }
      throw micError(e)
    }
    const ctx = new AudioContext({ latencyHint: 'interactive' })
    try {
      await ctx.audioWorklet.addModule(workletUrl)
      const source = ctx.createMediaStreamSource(stream)
      const node = new AudioWorkletNode(ctx, 'rt-capture', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1, channelCountMode: 'explicit' })
      // Stumm an den Ausgang hängen, damit der Graph sicher verarbeitet wird
      const mute = ctx.createGain()
      mute.gain.value = 0
      source.connect(node).connect(mute).connect(ctx.destination)
      const cap = new AudioCapture(ctx, stream, [source, node, mute], options)
      node.port.onmessage = (e: MessageEvent<Float32Array>) => cap.onChunk(e.data)
      if (ctx.state === 'suspended') await ctx.resume()
      return cap
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop())
      void ctx.close()
      throw micError(e)
    }
  }

  /** Name des Mikrofons (nach der Freigabe bekannt). */
  get deviceLabel(): string {
    return this.stream.getAudioTracks()[0]?.label ?? ''
  }

  get recording(): boolean {
    return this.chunks !== null && !this.stopping
  }

  onLevel(fn: (level: { rms: number; peak: number }) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private onChunk(chunk: Float32Array): void {
    let peak = 0
    let sq = 0
    for (const s of chunk) {
      const a = Math.abs(s)
      if (a > peak) peak = a
      sq += s * s
    }
    this.level = { rms: Math.sqrt(sq / chunk.length), peak }
    for (const fn of this.listeners) fn(this.level)
    if (this.chunks) this.chunks.push(chunk)
    else this.preRoll.push(chunk)
  }

  /** Sendung beginnen: der Vorlauf ist schon dabei. */
  start(): void {
    if (this.chunks) return
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.startedAt = performance.now()
    this.chunks = [this.preRoll.drain()]
  }

  /** Sendung beenden: nach dem Nachlauf die Aufnahme auf 16 kHz umgerechnet. */
  stop(): Promise<Recording> {
    if (this.stopping) return this.stopping
    if (!this.chunks) return Promise.reject(new Error('Es läuft keine Aufnahme.'))
    const heldMs = performance.now() - this.startedAt
    this.stopping = new Promise<Recording>((resolve) => {
      setTimeout(() => {
        const raw = concat(this.chunks ?? [])
        this.chunks = null
        this.stopping = null
        const pcm = resample(raw, this.ctx.sampleRate, ASR_RATE)
        resolve({ pcm, stats: { ...levelStats(pcm, ASR_RATE), durationMs: heldMs }, nativeRate: this.ctx.sampleRate })
      }, TAIL_MS)
    })
    return this.stopping
  }

  /** Sendung abbrechen, ohne etwas zu liefern. */
  cancel(): void {
    this.chunks = null
  }

  async close(): Promise<void> {
    this.cancel()
    this.listeners.clear()
    for (const n of this.nodes) n.disconnect()
    this.stream.getTracks().forEach((t) => t.stop())
    await this.ctx.close().catch(() => undefined)
  }
}

// ---------------------------------------------------------------------------
// Gemeinsames Mikrofon
// ---------------------------------------------------------------------------

/** So lange bleibt das Mikrofon nach dem letzten Freigeben offen. */
const LINGER_MS = 2500

let shared: { key: string; capture: Promise<AudioCapture>; users: number; timer?: ReturnType<typeof setTimeout> } | null = null

const keyOf = (o: CaptureOptions) => `${o.deviceId ?? ''}|${o.filters ? 1 : 0}`

/** Mikrofon öffnen oder das offene mitnutzen. `release` gibt es wieder frei. */
export async function acquireMicrophone(options: CaptureOptions): Promise<{ capture: AudioCapture; release: () => void }> {
  const key = keyOf(options)
  if (shared && shared.key !== key) {
    const old = shared
    shared = null
    if (old.timer) clearTimeout(old.timer)
    void old.capture.then((c) => c.close()).catch(() => undefined)
  }
  if (!shared) {
    const capture = AudioCapture.open(options)
    shared = { key, capture, users: 0 }
    capture.catch(() => {
      if (shared?.capture === capture) shared = null
    })
  }
  const entry = shared
  entry.users++
  if (entry.timer) {
    clearTimeout(entry.timer)
    entry.timer = undefined
  }
  let released = false
  const release = () => {
    if (released) return
    released = true
    entry.users--
    if (entry.users > 0) return
    entry.timer = setTimeout(() => {
      if (shared === entry && entry.users === 0) {
        shared = null
        void entry.capture.then((c) => c.close()).catch(() => undefined)
      }
    }, LINGER_MS)
  }
  try {
    return { capture: await entry.capture, release }
  } catch (e) {
    release()
    throw e
  }
}

/**
 * Mikrofone zur Auswahl. Vor der ersten Freigabe ist die Liste gesperrt (`named: false`);
 * `revealMicrophones()` holt die Freigabe.
 */
export async function listMicrophones(): Promise<MicList> {
  if (!navigator.mediaDevices?.enumerateDevices) return micList([])
  return micList(await navigator.mediaDevices.enumerateDevices())
}

/**
 * Freigabe holen, damit die Liste Namen bekommt: Mikrofon kurz öffnen und gleich wieder schließen.
 * Im Browser fragt er nach; die Desktop-App gibt ihr eigenes Fenster ohne Rückfrage frei (`lib.rs`).
 */
export async function revealMicrophones(): Promise<MicList> {
  if (!navigator.mediaDevices?.getUserMedia) throw new MicError('unsupported', 'Dieser Browser kann nicht aufnehmen (getUserMedia fehlt).')
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
  } catch (e) {
    throw micError(e)
  }
  return listMicrophones()
}

/** Bei angesteckten oder abgezogenen Mikrofonen melden. Gibt die Abmeldung zurück. */
export function onMicrophonesChanged(fn: () => void): () => void {
  const md = navigator.mediaDevices
  if (!md?.addEventListener) return () => undefined
  md.addEventListener('devicechange', fn)
  return () => md.removeEventListener('devicechange', fn)
}
