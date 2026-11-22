/**
 * Stellt die Spracherkennung bereit (React-Context). Erkennt die Laufzeit: In der Desktop-App
 * rechnet whisper.cpp (`whisper-cli` über Tauri, Grafikkarte oder CPU), im Browser transformers.js
 * im Worker.
 *
 * Wer lieber spricht (Einstellung „sprechen“), bekommt die Erkennung schon beim Start im Hintergrund
 * vorbereitet – sonst beim ersten Umschalten auf Sprechen.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../state/store'
import { RecognizerError, type Recognizer } from './recognizer'
import { TransformersRecognizer } from './transformers-recognizer'
import { WhisperCliRecognizer } from './whisper-recognizer'
import { modelInfo } from './transformers-config'
import { whisperModel } from './whisper-config'
import { isTauri, SpeechContext, type SpeechContextValue, type SpeechStatus } from './speech-context'

interface LoadState {
  key: string
  status: SpeechStatus
  progress: number
  error: string | null
  missingModel: boolean
  device: string
}

type AnyRecognizer = TransformersRecognizer | WhisperCliRecognizer

const DEVICE_LABEL: Record<string, string> = { webgpu: 'Grafikkarte', gpu: 'Grafikkarte', wasm: 'CPU', cpu: 'CPU' }

export function SpeechProvider({ children }: { children: ReactNode }) {
  const desktop = isTauri()
  const model = useApp((s) => (desktop ? s.profile.speech.desktopModel : s.profile.speech.model))
  const gpu = useApp((s) => (desktop ? s.profile.speech.desktopGpu : s.profile.speech.gpu))
  const prefersSpeech = useApp((s) => s.profile.speech.input === 'speak')
  const key = `${desktop ? 'whisper' : 'tf'}|${model}|${gpu ? 'gpu' : 'cpu'}`
  const [state, setState] = useState<LoadState | null>(null)
  const current = useRef<{ key: string; rec: AnyRecognizer; loading: Promise<Recognizer> | null } | null>(null)

  // Beim Verlassen der App den Worker beenden
  useEffect(() => () => current.current?.rec.dispose(), [])

  const ensureLoaded = useCallback((): Promise<Recognizer> => {
    if (!current.current || current.current.key !== key) {
      // Andere Einstellung: alten Erkenner beenden
      current.current?.rec.dispose()
      const rec = desktop ? new WhisperCliRecognizer(model, gpu) : new TransformersRecognizer(model, gpu ? 'webgpu' : 'wasm')
      current.current = { key, rec, loading: null }
    }
    const entry = current.current
    if (entry.loading) return entry.loading
    const update = (patch: Partial<LoadState>) =>
      setState((s) => (current.current === entry ? { ...(s?.key === key ? s : { key, status: 'idle', progress: 0, error: null, missingModel: false, device: entry.rec.device }), ...patch } : s))
    update({ status: 'loading', error: null, missingModel: false })
    entry.loading = entry.rec
      .load((progress) => update({ progress }))
      .then(() => {
        update({ status: 'ready', progress: 1, device: entry.rec.device })
        return entry.rec as Recognizer
      })
      .catch((e: unknown) => {
        entry.loading = null
        update({ status: 'error', error: e instanceof Error ? e.message : String(e), missingModel: e instanceof RecognizerError && e.missingModel })
        throw e
      })
    return entry.loading
  }, [key, model, gpu, desktop])

  // Wer sprechen will, bekommt die Erkennung schon jetzt im Hintergrund
  useEffect(() => {
    if (prefersSpeech) ensureLoaded().catch(() => undefined)
  }, [prefersSpeech, ensureLoaded])

  const value = useMemo<SpeechContextValue>(() => {
    const s = state?.key === key ? state : null
    const device = s?.device ?? (gpu ? 'gpu' : 'cpu')
    const label = desktop ? `whisper.cpp ${whisperModel(model)?.label.replace(/^Whisper /, '') ?? model}` : (modelInfo(model)?.label ?? model)
    return {
      status: s?.status ?? 'idle',
      progress: s?.progress ?? 0,
      error: s?.error ?? null,
      missingModel: s?.missingModel ?? false,
      engineLabel: `${label} · ${DEVICE_LABEL[device] ?? device}`,
      ensureLoaded,
    }
  }, [state, key, gpu, model, desktop, ensureLoaded])

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>
}
