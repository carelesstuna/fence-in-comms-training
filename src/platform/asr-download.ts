/**
 * Download eines Whisper-Modells (Desktop-App), unabhängig von der Ansicht: Wer die Seite wechselt – etwa im
 * Onboarding weiterklickt –, sieht beim Zurückkommen den Fortschritt statt eines neuen „Laden“. Rust lädt
 * ohnehin immer nur eine Datei-Gruppe auf einmal (Spracherkennung wie Sprachausgabe).
 */
import { useSyncExternalStore } from 'react'
import { downloadModel } from './whisper-recognizer'

export interface AsrDownloadState {
  /** Läuft gerade: welches Modell, wie weit (Bytes über alle Dateien). */
  running: { modelId: string; done: number; total: number; retry?: string } | null
  /** Fehler des letzten Versuchs (bis zum nächsten Start). */
  error: { modelId: string; message: string } | null
  /** Zählt fertige Downloads hoch – wer Modelle anzeigt, prüft dann neu. */
  finished: number
  /** Zuletzt fertig geladenes Modell (für die Bestätigung). */
  lastFinished: string | null
}

let state: AsrDownloadState = { running: null, error: null, finished: 0, lastFinished: null }
const listeners = new Set<() => void>()

function update(patch: Partial<AsrDownloadState>): void {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

function subscribe(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAsrDownload(): AsrDownloadState {
  return useSyncExternalStore(subscribe, () => state)
}

/**
 * Modell von Hugging Face laden (`total`: erwartete Bytes für den Fortschritt). `true`, wenn es geprüft im
 * Modell-Ordner liegt; `false` bei Fehler oder Abbruch – oder wenn schon ein Download läuft.
 */
export async function startAsrDownload(modelId: string, total: number): Promise<boolean> {
  if (state.running) return false
  // Fortschritt über alle Dateien (large-v3-turbo bringt das VAD-Modell mit)
  const doneByFile = new Map<string, number>()
  const done = () => [...doneByFile.values()].reduce((a, b) => a + b, 0)
  update({ running: { modelId, done: 0, total }, error: null })
  try {
    await downloadModel(modelId, (e) => {
      if (e.kind === 'progress') {
        doneByFile.set(e.file, e.done)
        update({ running: { modelId, done: done(), total } })
      } else if (e.kind === 'retry') {
        const retry = `Verbindung abgerissen – geht an derselben Stelle weiter (${e.attempt}/${e.max}) …`
        update({ running: { modelId, done: done(), total, retry } })
      }
    })
    update({ running: null, finished: state.finished + 1, lastFinished: modelId })
    return true
  } catch (e) {
    update({ running: null, error: { modelId, message: e instanceof Error ? e.message : String(e) } })
    return false
  }
}
