/**
 * Context der Spracherkennung (bereitgestellt von `SpeechProvider`).
 */
import { createContext, useContext } from 'react'
import type { Recognizer } from './recognizer'

export type SpeechStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface SpeechContextValue {
  status: SpeechStatus
  /** Ladefortschritt 0–1. */
  progress: number
  error: string | null
  /** Modelldateien fehlen (Hinweis auf `npm run fetch-asr`). */
  missingModel: boolean
  /** Beschreibung für die Anzeige, z. B. „Whisper base.en · CPU“. */
  engineLabel: string
  /** Erkenner holen und laden (wartet, bis er bereit ist). */
  ensureLoaded: () => Promise<Recognizer>
}

export const SpeechContext = createContext<SpeechContextValue | null>(null)

export function useSpeech(): SpeechContextValue {
  const v = useContext(SpeechContext)
  if (!v) throw new Error('useSpeech() außerhalb des SpeechProvider')
  return v
}

/** Läuft die App in Tauri? (`@tauri-apps/api` wird erst bei Bedarf geladen.) */
export const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
