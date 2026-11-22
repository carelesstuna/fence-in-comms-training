/**
 * Modelle der Spracherkennung in der Desktop-App (whisper.cpp). Die Dateien und Größen stehen in
 * `src-tauri/src/asr.rs` und `scripts/fetch-asr.ts`; Messwerte in `docs/spracherkennung.md`.
 */
export interface WhisperModel {
  id: string
  label: string
  sizeMb: number
  note: string
}

export const WHISPER_MODELS: readonly WhisperModel[] = [
  { id: 'small.en', label: 'Whisper small.en', sizeMb: 190, note: 'empfohlen' },
  { id: 'base.en', label: 'Whisper base.en', sizeMb: 60, note: 'schneller, lehnt öfter ab' },
  {
    id: 'large-v3-turbo',
    label: 'Whisper large-v3-turbo',
    sizeMb: 574,
    note: 'etwas genauer, nur mit Grafikkarte',
  },
]

export const DEFAULT_WHISPER_MODEL = 'small.en'

export const whisperModel = (id: string): WhisperModel | undefined =>
  WHISPER_MODELS.find((m) => m.id === id)
