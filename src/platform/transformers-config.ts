/**
 * Modelle und Einstellungen für transformers.js – gemeinsam für den Web Worker der App und das
 * Messskript unter Node. Ohne Browser-APIs.
 */

export type TransformersDevice = 'wasm' | 'webgpu' | 'cpu'

export interface TransformersModel {
  /** Ordner unter `/models/` bzw. `.asr/transformers/`. */
  id: string
  label: string
  /** Download-Größe für die CPU-Variante (q8), MB. */
  sizeMb: number
  note: string
  /** Für WebGPU gibt es eigene Dateien (fp32-Encoder, q4-Decoder). */
  webgpu: boolean
}

export const TRANSFORMERS_MODELS: readonly TransformersModel[] = [
  { id: 'onnx-community/whisper-base.en', label: 'Whisper base.en', sizeMb: 77, note: 'Standard', webgpu: true },
  { id: 'onnx-community/whisper-tiny.en', label: 'Whisper tiny.en', sizeMb: 41, note: 'schneller, ungenauer', webgpu: false },
  { id: 'onnx-community/moonshine-base-ONNX', label: 'Moonshine base', sizeMb: 63, note: 'zum Vergleich', webgpu: false },
]

export const DEFAULT_TRANSFORMERS_MODEL = TRANSFORMERS_MODELS[0].id

export const modelInfo = (id: string): TransformersModel | undefined => TRANSFORMERS_MODELS.find((m) => m.id === id)

/** Welche Gewichte geladen werden: q8 auf der CPU, auf der Grafikkarte fp32-Encoder und q4-Decoder. */
export function dtypeFor(id: string, device: TransformersDevice): Record<string, string> {
  if (device === 'webgpu' && modelInfo(id)?.webgpu) return { encoder_model: 'fp32', decoder_model_merged: 'q4' }
  return { encoder_model: 'q8', decoder_model_merged: 'q8' }
}

/**
 * Optionen für die Erkennung. Funksprüche sind kurz: Die Obergrenze an Tokens verhindert, dass ein
 * Modell bei Rauschen endlos wiederholt.
 */
export function generateOptions(id: string): Record<string, unknown> {
  return id.includes('whisper') ? { return_timestamps: false, max_new_tokens: 96 } : { max_new_tokens: 96 }
}
