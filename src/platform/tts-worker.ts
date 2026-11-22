/**
 * Web Worker: Sprachausgabe mit Kokoro-82M über onnxruntime-web – auf der Grafikkarte (WebGPU) oder
 * der CPU (WASM mit Threads). Text → Phoneme (misaki-Lexika) → Modell → 24-kHz-Audio.
 * Lädt nichts selbst: Modell, Stimmen und Lexika kommen als Bytes vom Hauptthread.
 */
import * as ort from 'onnxruntime-web/webgpu'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import { phonemize, splitPhonemes, tokenIds, type Dialect, type Lookup } from '../core/audio/g2p'
import { flattenLexicon, makeLookup, type RawLexicon } from '../core/audio/lexicon'
import { TTS_RATE } from './tts-config'

// Nur Fehler melden (sonst schreibt onnxruntime Hinweise zur Knotenverteilung als Fehler in die Konsole)
ort.env.logLevel = 'error'
// Ohne Frist wartet onnxruntime ewig, wenn seine Threads nicht starten. Normal dauert der Start unter 2 s.
ort.env.wasm.initTimeout = 30_000

/**
 * onnxruntime startet seine Threads als weitere Worker aus derselben `.mjs` (`new Worker(import.meta.url)`).
 * In der installierten Desktop-App bricht WebView2 die Anfragen solcher verschachtelten Worker an
 * `tauri.localhost` ab (`net::ERR_ABORTED`), ohne Fehler im Worker – die Sprachausgabe blieb bei „startet …
 * 60 %“ stehen. Als Blob-URL brauchen die Threads keine Anfrage mehr. Im Browser und auf dem Dev-Server ging es
 * auch ohne, schadet dort aber nicht.
 */
async function wasmPaths(): Promise<{ mjs: string; wasm: string }> {
  const res = await fetch(ortMjs)
  if (!res.ok) throw new Error(`onnxruntime nicht gefunden (${res.status}).`)
  const mjs = URL.createObjectURL(new Blob([await res.text()], { type: 'text/javascript' }))
  // Absolut, weil die Blob-URL keine Basis für relative Pfade ist
  return { mjs, wasm: new URL(ortWasm, self.location.href).href }
}

const STYLE_DIM = 256

export type TtsDevice = 'webgpu' | 'wasm'

export type TtsRequest =
  | {
      type: 'init'
      model: ArrayBuffer
      lexicons: Record<Dialect, ArrayBuffer[]>
      device: TtsDevice
    }
  | { type: 'voice'; id: string; data: ArrayBuffer }
  | { type: 'synth'; id: number; text: string; voice: string; speed: number }

export type TtsResponse =
  | { type: 'ready'; device: TtsDevice; ms: number }
  | { type: 'audio'; id: number; samples: Float32Array; ms: number }
  | { type: 'error'; id?: number; message: string }

let session: ort.InferenceSession | null = null
const lookups: Partial<Record<Dialect, Lookup>> = {}
const voices = new Map<string, Float32Array>()
let queue: Promise<void> = Promise.resolve()

const post = (m: TtsResponse, transfer: Transferable[] = []) => self.postMessage(m, { transfer })
const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Eine Stimme sitzt auf a… (US) oder b… (GB). */
const dialectOf = (voice: string): Dialect => (voice.startsWith('b') ? 'gb' : 'us')

async function run(ids: number[], voice: Float32Array, speed: number): Promise<Float32Array> {
  // Die Stimme hat einen Stil-Vektor pro Textlänge
  const n = Math.min(Math.max(ids.length - 2, 0), voice.length / STYLE_DIM - 1)
  const out = await session!.run({
    input_ids: new ort.Tensor(
      'int64',
      BigInt64Array.from(ids, (x) => BigInt(x)),
      [1, ids.length],
    ),
    style: new ort.Tensor('float32', voice.slice(n * STYLE_DIM, (n + 1) * STYLE_DIM), [
      1,
      STYLE_DIM,
    ]),
    speed: new ort.Tensor('float32', new Float32Array([speed]), [1]),
  })
  return out.waveform.data as Float32Array
}

async function synthesize(text: string, voiceId: string, speed: number): Promise<Float32Array> {
  const voice = voices.get(voiceId)
  const lookup = lookups[dialectOf(voiceId)]
  if (!session || !voice || !lookup) throw new Error('Sprachausgabe nicht geladen.')
  const chunks = splitPhonemes(phonemize(text, lookup, dialectOf(voiceId)))
  const pieces: Float32Array[] = []
  for (const ph of chunks) if (ph) pieces.push(await run(tokenIds(ph), voice, speed))
  // Zwischen Stücken eine kurze Atempause
  const gap = Math.round(TTS_RATE * 0.12)
  const total = pieces.reduce((s, p) => s + p.length, 0) + gap * Math.max(0, pieces.length - 1)
  const all = new Float32Array(total)
  let at = 0
  for (const p of pieces) {
    all.set(p, at)
    at += p.length + gap
  }
  return all
}

async function init(m: Extract<TtsRequest, { type: 'init' }>): Promise<void> {
  const t0 = performance.now()
  ort.env.wasm.wasmPaths = await wasmPaths()
  for (const d of ['us', 'gb'] as const) {
    const lex = m.lexicons[d].map((b) =>
      flattenLexicon(JSON.parse(new TextDecoder().decode(b)) as RawLexicon),
    )
    lookups[d] = makeLookup(d, lex)
  }
  const make = (device: TtsDevice) =>
    ort.InferenceSession.create(new Uint8Array(m.model), {
      executionProviders: [device],
      graphOptimizationLevel: 'all',
    })
  let device = m.device
  try {
    session = await make(device)
  } catch (e) {
    if (device !== 'webgpu') throw e
    // Keine Grafikkarte (Treiber, WebView2): dann rechnet die CPU
    device = 'wasm'
    session = await make(device)
  }
  post({ type: 'ready', device, ms: performance.now() - t0 })
}

self.onmessage = (e: MessageEvent<TtsRequest>) => {
  const m = e.data
  if (m.type === 'voice') {
    voices.set(m.id, new Float32Array(m.data))
    return
  }
  // Alles nacheinander: Eine Sitzung rechnet nie zwei Aufrufe gleichzeitig
  queue = queue.then(async () => {
    if (m.type === 'init') {
      await init(m).catch((err: unknown) => post({ type: 'error', message: message(err) }))
      return
    }
    const t0 = performance.now()
    try {
      const samples = await synthesize(m.text, m.voice, m.speed)
      post({ type: 'audio', id: m.id, samples, ms: performance.now() - t0 }, [samples.buffer])
    } catch (err) {
      post({ type: 'error', id: m.id, message: message(err) })
    }
  })
}
