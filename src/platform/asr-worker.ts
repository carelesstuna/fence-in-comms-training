/**
 * Web Worker: Spracherkennung mit transformers.js. Lädt Modelle nur lokal (`/models/…`) und die
 * WASM-Dateien von onnxruntime aus dem eigenen Paket – nichts aus dem Internet.
 */
import { env, pipeline } from '@huggingface/transformers'
import ortMjs from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import ortWasm from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import { dtypeFor, generateOptions, type TransformersDevice } from './transformers-config'

env.allowRemoteModels = false
env.allowLocalModels = true
env.localModelPath = '/models/'
// Die Modelle kommen ohnehin vom eigenen Server; keine zweite Kopie im Browser-Cache
env.useBrowserCache = false
if (env.backends.onnx.wasm) env.backends.onnx.wasm.wasmPaths = { mjs: ortMjs, wasm: ortWasm }

export type WorkerRequest =
  | { type: 'load'; model: string; device: TransformersDevice }
  | { type: 'transcribe'; id: number; pcm: Float32Array }

export type WorkerResponse =
  | { type: 'progress'; fraction: number }
  | { type: 'loaded'; device: TransformersDevice }
  | { type: 'result'; id: number; text: string; ms: number }
  | { type: 'error'; id?: number; message: string; missingModel?: boolean }

type Asr = (audio: Float32Array, options?: Record<string, unknown>) => Promise<{ text: string } | { text: string }[]>

let asr: Asr | null = null
let model = ''

const post = (m: WorkerResponse) => self.postMessage(m)

async function load(id: string, device: TransformersDevice): Promise<void> {
  const make = (d: TransformersDevice) =>
    pipeline('automatic-speech-recognition', id, {
      device: d,
      dtype: dtypeFor(id, d) as never,
      progress_callback: (p: { status: string; progress?: number }) => {
        if (p.status === 'progress_total' && typeof p.progress === 'number') post({ type: 'progress', fraction: p.progress / 100 })
      },
    }) as unknown as Promise<Asr>
  let used = device
  try {
    asr = await make(device)
  } catch (e) {
    if (device !== 'webgpu') throw e
    // WebGPU geht nicht (Treiber, WebView2): dann auf der CPU
    used = 'wasm'
    asr = await make('wasm')
  }
  model = id
  post({ type: 'loaded', device: used })
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'load') {
    if (asr && model === msg.model) return post({ type: 'loaded', device: msg.device })
    load(msg.model, msg.device).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      post({ type: 'error', message, missingModel: /local|not found|404|could not locate|fetch/i.test(message) })
    })
    return
  }
  if (msg.type === 'transcribe') {
    if (!asr) return post({ type: 'error', id: msg.id, message: 'Das Modell ist noch nicht geladen.' })
    const t0 = performance.now()
    asr(msg.pcm, generateOptions(model))
      .then((out) => {
        const text = Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text
        post({ type: 'result', id: msg.id, text, ms: performance.now() - t0 })
      })
      .catch((err: unknown) => post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) }))
  }
}
