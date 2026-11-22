/**
 * Spracherkennung mit transformers.js in einem Web Worker – die Oberfläche bleibt flüssig.
 * transformers.js kennt (noch) keinen Prompt; die Hinweise nutzt erst whisper-cli.
 */
import type { RecognitionHints } from '../core/speech/hints'
import { RecognizerError, type RawTranscript, type Recognizer } from './recognizer'
import type { WorkerRequest, WorkerResponse } from './asr-worker'
import type { TransformersDevice } from './transformers-config'

export class TransformersRecognizer implements Recognizer {
  readonly id = 'transformers-js' as const
  private worker: Worker | null = null
  private loading: Promise<void> | null = null
  private nextId = 1
  private readonly pending = new Map<number, { resolve: (t: RawTranscript) => void; reject: (e: Error) => void }>()
  private progress: ((f: number) => void) | undefined
  /** Tatsächlich genutzt (fällt WebGPU aus, ist es wasm). */
  device: TransformersDevice

  constructor(
    readonly model: string,
    device: TransformersDevice = 'wasm',
  ) {
    this.device = device
  }

  private start(): Worker {
    const w = new Worker(new URL('./asr-worker.ts', import.meta.url), { type: 'module', name: 'fence-in-comms-training-asr' })
    w.onmessage = (e: MessageEvent<WorkerResponse>) => this.onMessage(e.data)
    w.onerror = (e) => this.failAll(new RecognizerError(`Spracherkennung abgestürzt: ${e.message}`))
    this.worker = w
    return w
  }

  private failAll(err: Error): void {
    for (const p of this.pending.values()) p.reject(err)
    this.pending.clear()
  }

  private onMessage(m: WorkerResponse): void {
    if (m.type === 'progress') this.progress?.(m.fraction)
    else if (m.type === 'result') {
      this.pending.get(m.id)?.resolve({ text: m.text, ms: m.ms })
      this.pending.delete(m.id)
    } else if (m.type === 'error' && m.id !== undefined) {
      this.pending.get(m.id)?.reject(new RecognizerError(m.message))
      this.pending.delete(m.id)
    }
  }

  load(onProgress?: (fraction: number) => void): Promise<void> {
    this.progress = onProgress
    if (this.loading) return this.loading
    const w = this.worker ?? this.start()
    this.loading = new Promise<void>((resolve, reject) => {
      const onLoad = (e: MessageEvent<WorkerResponse>) => {
        const m = e.data
        if (m.type === 'loaded') {
          this.device = m.device
          w.removeEventListener('message', onLoad)
          resolve()
        } else if (m.type === 'error' && m.id === undefined) {
          w.removeEventListener('message', onLoad)
          this.loading = null
          reject(
            new RecognizerError(
              m.missingModel ? `Modell „${this.model}“ fehlt – im Projekt „npm run fetch-asr“ ausführen. (${m.message})` : `Modell lässt sich nicht laden: ${m.message}`,
              !!m.missingModel,
            ),
          )
        }
      }
      w.addEventListener('message', onLoad)
      w.postMessage({ type: 'load', model: this.model, device: this.device } satisfies WorkerRequest)
    })
    return this.loading
  }

  async transcribe(pcm16k: Float32Array, hints: RecognitionHints): Promise<RawTranscript> {
    void hints
    await this.load(this.progress)
    const id = this.nextId++
    const copy = pcm16k.slice()
    return new Promise<RawTranscript>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker!.postMessage({ type: 'transcribe', id, pcm: copy } satisfies WorkerRequest, [copy.buffer])
    })
  }

  dispose(): void {
    this.failAll(new RecognizerError('Spracherkennung beendet.'))
    this.worker?.terminate()
    this.worker = null
    this.loading = null
  }
}
