/**
 * Schnittstelle der Spracherkennung. Umsetzungen: transformers.js im Web Worker (Browser, jetzt)
 * und whisper-cli über Tauri (Desktop, Phase 3). Aufnahme und Bewertung sind für beide gleich.
 */
import type { RecognitionHints } from '../core/speech/hints'

export type RecognizerId = 'whisper-cli' | 'transformers-js'

export interface RawTranscript {
  /** Was die Erkennung geliefert hat (noch nicht aufbereitet). */
  text: string
  /** Rechenzeit in ms. */
  ms: number
}

export interface Recognizer {
  readonly id: RecognizerId
  readonly model: string
  /** Modell laden (beim ersten Aufruf; danach sofort fertig). */
  load(onProgress?: (fraction: number) => void): Promise<void>
  transcribe(pcm16k: Float32Array, hints: RecognitionHints): Promise<RawTranscript>
  dispose(): void
}

export class RecognizerError extends Error {
  constructor(
    message: string,
    /** Modelldateien fehlen (dann hilft `npm run fetch-asr`). */
    readonly missingModel = false,
  ) {
    super(message)
  }
}
