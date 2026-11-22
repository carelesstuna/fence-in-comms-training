/**
 * Context der Funk-Wiedergabe (bereitgestellt von `AudioProvider`).
 */
import { createContext, useContext } from 'react'
import type { ResolvedTransmission } from '../core/drills/types'
import type { DownloadProgress } from './tts-files'

/** Was abgespielt werden soll: eine Übertragung in ihrem Funkspruch (für „blocked“ und die Stimmen). */
export interface PlayRequest {
  /** Eindeutig je Zeile (zeigt an, was gerade läuft). */
  key: string
  transmissions: readonly ResolvedTransmission[]
  index: number
  /** Durchlauf: gleiche Besetzung der Stimmen innerhalb eines Durchlaufs. */
  cast: string
  /** Faktor aufs Tempo aus dem Profil, z. B. 0,8 für den 9-Line zum Mitschreiben. */
  tempo?: number
}

export type FilesState = 'checking' | 'missing' | 'present'
export type EngineState = 'idle' | 'loading' | 'ready' | 'error'

export interface RadioAudioValue {
  /** Im Profil eingeschaltet. */
  enabled: boolean
  files: FilesState
  engine: EngineState
  /** Ladefortschritt der Sprachausgabe 0–1. */
  progress: number
  error: string | null
  /** Rechnet die CPU – Anzeige „Rechenzeit pro Sekunde Sprache“. */
  rtf: number
  /** Kann abspielen (eingeschaltet und Dateien da – geladen wird bei Bedarf). */
  available: boolean
  /** Hörübungen blenden den Text erst nach dem Hören ein. */
  listening: boolean
  autoplay: boolean
  /** Woher die Dateien kommen: Desktop-App, Browser oder Dev-Server. */
  storeKind: 'desktop' | 'browser' | 'dev' | null
  download: DownloadProgress | null
  startDownload: () => Promise<void>
  cancelDownload: () => void
  /** Gespeicherte Dateien im Browser löschen. */
  removeFiles: () => Promise<void>
  ensureLoaded: () => Promise<void>
  /** Spielt ab; `true`, wenn bis zum Ende gehört, `false` bei Stopp, Abbruch oder ohne Ton. */
  play: (r: PlayRequest) => Promise<boolean>
  /**
   * Stimmen vorab rechnen, in dieser Reihenfolge: alles, was eine Seite zum Abspielen anbietet, im Szenario
   * auch der nächste Schritt. `owner` (z. B. der Funkspruch auf der Seite) gibt die Aufträge mit `release`
   * wieder frei.
   */
  prefetch: (r: readonly PlayRequest[], owner?: string) => void
  /** Noch wartende Vorab-Aufträge eines Auftraggebers verwerfen (z. B. beim Verlassen der Seite). */
  release: (owner: string) => void
  stop: () => void
  /** Läuft gerade (oder wird gerechnet): Schlüssel und Phase. */
  current: { key: string; phase: 'preparing' | 'playing' } | null
}

export const RadioAudioContext = createContext<RadioAudioValue | null>(null)

/** Ohne Provider (Tests, Vorschau): kein Ton, alles bleibt Text. */
const SILENT: RadioAudioValue = {
  enabled: false,
  files: 'missing',
  engine: 'idle',
  progress: 0,
  error: null,
  rtf: 0,
  available: false,
  listening: false,
  autoplay: false,
  storeKind: null,
  download: null,
  startDownload: () => Promise.resolve(),
  cancelDownload: () => undefined,
  removeFiles: () => Promise.resolve(),
  ensureLoaded: () => Promise.resolve(),
  play: () => Promise.resolve(false),
  prefetch: () => undefined,
  release: () => undefined,
  stop: () => undefined,
  current: null,
}

export function useRadioAudio(): RadioAudioValue {
  return useContext(RadioAudioContext) ?? SILENT
}
