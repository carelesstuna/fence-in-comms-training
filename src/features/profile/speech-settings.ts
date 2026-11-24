/**
 * Gemeinsam für Profil und Onboarding: Sprech-Einstellungen ändern und die Liste der Mikrofone.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp, type SpeechSettings } from '../../state/store'
import { listMicrophones, onMicrophonesChanged, revealMicrophones, type MicList } from '../../platform/audio-capture'

/** Sprech-Einstellungen im Profil ändern. */
export const setSpeech = (patch: Partial<SpeechSettings>) => useApp.getState().setProfile({ speech: { ...useApp.getState().profile.speech, ...patch } })

export interface MicListState {
  mics: MicList | null
  revealing: boolean
  error: string | null
  refresh: () => void
  reveal: () => void
}

/**
 * Liste der Mikrofone: beim Öffnen, wenn Geräte dazukommen oder wegfallen und sobald das Mikrofon offen
 * ist (vor der ersten Freigabe verrät WebView2 bzw. der Browser keine Namen).
 *
 * `auto` (Selbst funken ist an): Fehlen die Namen noch, holt die Liste sie beim Öffnen der Seite selbst – dafür geht das
 * Mikrofon einmal kurz an (im Browser mit Freigabe-Abfrage). Ein eigener Knopf dafür ist nicht nötig.
 */
export function useMicList(auto = false): MicListState {
  const [mics, setMics] = useState<MicList | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(() => void listMicrophones().then(setMics).catch(() => undefined), [])
  useEffect(() => {
    refresh()
    return onMicrophonesChanged(refresh)
  }, [refresh])
  const reveal = useCallback(() => {
    setRevealing(true)
    setError(null)
    revealMicrophones()
      .then(setMics)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setRevealing(false))
  }, [])
  const tried = useRef(false)
  useEffect(() => {
    if (!auto || tried.current || !mics || mics.named) return
    tried.current = true
    reveal()
  }, [auto, mics, reveal])
  return { mics, revealing, error, refresh, reveal }
}
