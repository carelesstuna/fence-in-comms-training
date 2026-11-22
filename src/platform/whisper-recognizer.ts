/**
 * Spracherkennung in der Desktop-App: whisper.cpp über die Tauri-Befehle aus `src-tauri/src/asr.rs`.
 * Die Aufnahme geht als WAV (16 kHz mono) an Rust, `whisper-cli` rechnet auf der Grafikkarte
 * (Vulkan) oder der CPU. `@tauri-apps/api` wird erst hier geladen, die Browser-Version bleibt frei davon.
 */
import { ASR_RATE, encodeWav } from '../core/speech/pcm'
import type { RecognitionHints } from '../core/speech/hints'
import { RecognizerError, type RawTranscript, type Recognizer } from './recognizer'
import { whisperModel } from './whisper-config'

export interface AsrModelStatus {
  id: string
  file: string
  size: number
  /** Fundort; `null`, wenn das Modell (oder sein VAD-Modell) fehlt. */
  path: string | null
  /** Fehlende Dateien, die in den Modell-Ordner gehören. */
  missing: string[]
  /** So viele Bytes lädt „Laden“ (die fehlenden Dateien). */
  download: number
}

/** Fortschritt beim Nachladen (aus `download_model` in asr.rs). */
export type DownloadEvent =
  | { kind: 'progress'; file: string; done: number; total: number }
  /** Verbindung abgerissen, Rust setzt gleich an derselben Stelle fort. */
  | { kind: 'retry'; file: string; attempt: number; max: number }
  | { kind: 'verified'; file: string }

export interface AsrStatus {
  /** whisper-cli ist dabei. */
  available: boolean
  /** Die Vulkan-Version ist dabei. */
  gpu: boolean
  /** Hierhin gehören weitere Modelle. */
  modelDir: string
  models: AsrModelStatus[]
}

interface TauriTranscript {
  text: string
  ms: number
  gpu: boolean
  fallback: boolean
}

const core = () => import('@tauri-apps/api/core')

export async function asrStatus(): Promise<AsrStatus> {
  return (await core()).invoke<AsrStatus>('asr_status')
}

export async function openModelDir(): Promise<void> {
  await (await core()).invoke('open_model_dir')
}

/**
 * Modell von der Originalquelle (Hugging Face, fester Stand) in den eigenen Modell-Ordner laden.
 * Rust prüft Größe und SHA-256; erst dann liegt die Datei dort.
 */
export async function downloadModel(id: string, onEvent: (e: DownloadEvent) => void): Promise<void> {
  const { Channel, invoke } = await core()
  const channel = new Channel<DownloadEvent>()
  channel.onmessage = onEvent
  try {
    await invoke('download_model', { id, onEvent: channel })
  } catch (e) {
    // Rust liefert die Meldung als Text
    throw new Error(typeof e === 'string' ? e : e instanceof Error ? e.message : String(e), {
      cause: e,
    })
  }
}

export async function cancelDownload(): Promise<void> {
  await (await core()).invoke('cancel_download')
}

/** Rohdaten für `transcribe`: 4 Byte Länge, JSON mit den Optionen, dann die WAV-Datei. */
export function transcribeBody(
  pcm16k: Float32Array,
  options: { model: string; prompt: string; gpu: boolean },
): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify(options))
  const wav = encodeWav(pcm16k, ASR_RATE)
  const body = new Uint8Array(4 + json.length + wav.length)
  new DataView(body.buffer).setUint32(0, json.length, true)
  body.set(json, 4)
  body.set(wav, 4 + json.length)
  return body
}

/** Eine halbe Sekunde Stille – zum Aufwärmen (der allererste Lauf übersetzt die Shader der Grafikkarte). */
const WARMUP = new Float32Array(ASR_RATE / 2)

export class WhisperCliRecognizer implements Recognizer {
  readonly id = 'whisper-cli'
  /** Rechnet gerade die Grafikkarte? Nach einem Rückfall auf die CPU bleibt es dabei. */
  device: 'gpu' | 'cpu'
  private loading: Promise<void> | null = null

  constructor(
    readonly model: string,
    private readonly wantGpu: boolean,
  ) {
    this.device = wantGpu ? 'gpu' : 'cpu'
  }

  load(): Promise<void> {
    this.loading ??= this.prepare().catch((e: unknown) => {
      this.loading = null
      throw e
    })
    return this.loading
  }

  private async prepare(): Promise<void> {
    const status = await asrStatus()
    if (!status.available)
      throw new RecognizerError('Die Spracherkennung ist in dieser Version nicht enthalten.')
    const m = status.models.find((x) => x.id === this.model)
    const label = whisperModel(this.model)?.label ?? this.model
    if (!m?.path) {
      throw new RecognizerError(`Das Modell „${label}“ fehlt noch.`, true)
    }
    this.device = this.wantGpu && status.gpu ? 'gpu' : 'cpu'
    // Aufwärmen: prüft, dass alles läuft, und erledigt das Übersetzen der Shader vor dem ersten Funkspruch
    await this.run(WARMUP, '')
  }

  async transcribe(pcm16k: Float32Array, hints: RecognitionHints): Promise<RawTranscript> {
    await this.load()
    return this.run(pcm16k, hints.prompt)
  }

  private async run(pcm16k: Float32Array, prompt: string): Promise<RawTranscript> {
    const { invoke } = await core()
    try {
      const r = await invoke<TauriTranscript>(
        'transcribe',
        transcribeBody(pcm16k, { model: this.model, prompt, gpu: this.device === 'gpu' }),
      )
      if (r.fallback) this.device = 'cpu'
      return { text: r.text, ms: r.ms }
    } catch (e) {
      throw new RecognizerError(
        typeof e === 'string' ? e : e instanceof Error ? e.message : String(e),
      )
    }
  }

  dispose(): void {}
}
