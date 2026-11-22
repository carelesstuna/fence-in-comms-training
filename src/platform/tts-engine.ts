/**
 * Sprachausgabe im Hauptthread: startet den Worker, reicht ihm Modell, Lexika und Stimmen und ordnet
 * die Aufträge. Was gleich gespielt werden soll, geht vor; Vorab-Rechnen (alles, was eine Seite zum Abspielen
 * anbietet, und der nächste Schritt im Szenario) läuft, wenn nichts anderes ansteht. Fertige Stimmen bleiben
 * eine Weile im Arbeitsspeicher – nie auf der Platte; nach dem Beenden der App sind sie weg.
 */
import { lexiconFiles, MODEL_FILE, TTS_RATE, VOICES, voiceFile } from './tts-config'
import type { TtsStore } from './tts-files'
import type { TtsDevice, TtsRequest, TtsResponse } from './tts-worker'

export type Priority = 'now' | 'later'

interface Job {
  key: string
  text: string
  voice: string
  speed: number
  priority: Priority
  /** Wer das Vorab-Rechnen angefordert hat (z. B. ein Funkspruch auf der Seite); leer bei „jetzt“. */
  owners: Set<string>
  waiters: { resolve: (s: Float32Array) => void; reject: (e: Error) => void }[]
}

/** Obergrenze des Zwischenspeichers im Arbeitsspeicher: rund 8 Minuten Sprache (Float32, etwa 46 MB). */
const CACHE_SAMPLES = 8 * 60 * TTS_RATE

export class TtsEngine {
  device: TtsDevice | null = null
  /** Rechenzeit im Verhältnis zur Sprechdauer (gleitend), für die Anzeige. */
  rtf = 0
  private worker: Worker | null = null
  private loading: Promise<void> | null = null
  private readonly queue: Job[] = []
  private busy: Job | null = null
  private readonly cache = new Map<string, Float32Array>()
  private cached = 0
  private nextId = 1
  private readonly inflight = new Map<number, Job>()
  /** Bricht den Start ab, solange der Worker noch nicht bereit ist. */
  private failStart: ((e: Error) => void) | null = null
  private disposed = false

  constructor(
    private readonly store: TtsStore,
    private readonly wantGpu: boolean,
  ) {}

  get ready(): boolean {
    return this.device !== null
  }

  /** Modell, Lexika und Stimmen laden und einmal aufwärmen (die Grafikkarte übersetzt dabei ihre Shader). */
  load(onProgress?: (fraction: number) => void): Promise<void> {
    this.loading ??= this.start(onProgress).catch((e: unknown) => {
      this.loading = null
      this.worker?.terminate()
      this.worker = null
      throw e
    })
    return this.loading
  }

  private async start(onProgress?: (fraction: number) => void): Promise<void> {
    const names = [
      MODEL_FILE,
      ...lexiconFiles('us'),
      ...lexiconFiles('gb'),
      ...VOICES.map((v) => voiceFile(v.id)),
    ]
    const files: Record<string, ArrayBuffer> = {}
    let n = 0
    for (const name of names) {
      files[name] = await this.store.read(name)
      if (this.disposed) throw new Error('beendet')
      onProgress?.((++n / names.length) * 0.6)
    }
    const w = new Worker(new URL('./tts-worker.ts', import.meta.url), {
      type: 'module',
      name: 'fence-in-comms-training-tts',
    })
    this.worker = w
    const ready = new Promise<TtsDevice>((resolve, reject) => {
      this.failStart = reject
      w.onmessage = (e: MessageEvent<TtsResponse>) => {
        const m = e.data
        if (m.type === 'ready') resolve(m.device)
        else if (m.type === 'error' && m.id === undefined) reject(new Error(m.message))
        else this.onMessage(m)
      }
      w.onerror = (e) => reject(new Error(`Sprachausgabe abgestürzt: ${e.message}`))
    })
    const send = (m: TtsRequest, transfer: Transferable[] = []) => w.postMessage(m, transfer)
    for (const v of VOICES)
      send({ type: 'voice', id: v.id, data: files[voiceFile(v.id)] }, [files[voiceFile(v.id)]])
    const lexicons = {
      us: lexiconFiles('us').map((f) => files[f]),
      gb: lexiconFiles('gb').map((f) => files[f]),
    }
    send(
      {
        type: 'init',
        model: files[MODEL_FILE],
        lexicons,
        device: this.wantGpu ? 'webgpu' : 'wasm',
      },
      [files[MODEL_FILE], ...lexicons.us, ...lexicons.gb],
    )
    const device = await ready.finally(() => (this.failStart = null))
    w.onmessage = (e: MessageEvent<TtsResponse>) => this.onMessage(e.data)
    onProgress?.(0.8)
    // Aufwärmen: Der erste Lauf auf der Grafikkarte dauert mehrere Sekunden
    this.device = device
    await this.run({
      key: '',
      text: 'radio check',
      voice: VOICES[0].id,
      speed: 1,
      priority: 'now',
      owners: new Set(),
      waiters: [],
    })
    onProgress?.(1)
  }

  private onMessage(m: TtsResponse): void {
    if (m.type === 'ready') return
    const job = m.id !== undefined ? this.inflight.get(m.id) : undefined
    if (!job) return
    this.inflight.delete(m.id!)
    this.busy = null
    if (m.type === 'audio') {
      const secs = m.samples.length / TTS_RATE
      if (secs > 0.3)
        this.rtf = this.rtf ? this.rtf * 0.7 + 0.3 * (m.ms / 1000 / secs) : m.ms / 1000 / secs
      if (job.key) this.remember(job.key, m.samples)
      for (const w of job.waiters) w.resolve(m.samples)
    } else {
      for (const w of job.waiters) w.reject(new Error(m.message))
    }
    this.pump()
  }

  private remember(key: string, s: Float32Array): void {
    this.cache.set(key, s)
    this.cached += s.length
    for (const [k, v] of this.cache) {
      if (this.cached <= CACHE_SAMPLES) break
      this.cache.delete(k)
      this.cached -= v.length
    }
  }

  private run(job: Job): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      job.waiters.push({ resolve, reject })
      this.queue.unshift(job)
      this.pump()
    })
  }

  private pump(): void {
    if (this.busy || !this.worker || !this.queue.length) return
    // Was gleich gespielt wird, zuerst
    const i = Math.max(
      0,
      this.queue.findIndex((j) => j.priority === 'now'),
    )
    const job = this.queue.splice(i, 1)[0]
    this.busy = job
    const id = this.nextId++
    this.inflight.set(id, job)
    this.worker.postMessage({
      type: 'synth',
      id,
      text: job.text,
      voice: job.voice,
      speed: job.speed,
    } satisfies TtsRequest)
  }

  /**
   * Trockene Stimme (24 kHz) für einen Text. `owner`: wer vorab rechnen lässt – `dropLater(owner)` verwirft
   * dessen Aufträge wieder, solange niemand sonst sie braucht.
   */
  async synth(
    text: string,
    voice: string,
    speed: number,
    priority: Priority = 'now',
    owner?: string,
  ): Promise<Float32Array> {
    const key = `${voice}|${speed.toFixed(2)}|${text}`
    const hit = this.cache.get(key)
    if (hit) {
      // Zuletzt benutzt nach hinten
      this.cache.delete(key)
      this.cache.set(key, hit)
      return hit
    }
    await this.load()
    const pending = this.busy?.key === key ? this.busy : this.queue.find((j) => j.key === key)
    if (pending) {
      if (priority === 'now') pending.priority = 'now'
      else if (owner) pending.owners.add(owner)
      return new Promise((resolve, reject) => pending.waiters.push({ resolve, reject }))
    }
    return new Promise((resolve, reject) => {
      const owners = new Set<string>(priority === 'later' && owner ? [owner] : [])
      this.queue.push({ key, text, voice, speed, priority, owners, waiters: [{ resolve, reject }] })
      this.pump()
    })
  }

  /** Steht ein Text schon fertig im Speicher? */
  has(text: string, voice: string, speed: number): boolean {
    return this.cache.has(`${voice}|${speed.toFixed(2)}|${text}`)
  }

  /**
   * Vorab-Aufträge verwerfen, die noch warten: alle – oder nur die eines Auftraggebers (z. B. beim Verlassen
   * einer Seite), sofern sie kein anderer mehr braucht. Was gerade rechnet, läuft zu Ende.
   */
  dropLater(owner?: string): void {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const j = this.queue[i]
      if (j.priority !== 'later') continue
      if (owner !== undefined) {
        if (!j.owners.delete(owner) || j.owners.size) continue
      }
      this.queue.splice(i, 1)
      for (const w of j.waiters) w.reject(new Error('verworfen'))
    }
  }

  dispose(): void {
    this.disposed = true
    // Ein beendeter Worker meldet sich nie mehr: Wer auf den Start wartet, bekommt sonst nie eine Antwort
    this.failStart?.(new Error('beendet'))
    this.failStart = null
    this.worker?.terminate()
    this.worker = null
    this.device = null
    this.loading = null
    for (const j of [...this.queue, ...this.inflight.values()])
      for (const w of j.waiters) w.reject(new Error('beendet'))
    this.queue.length = 0
    this.inflight.clear()
  }
}
