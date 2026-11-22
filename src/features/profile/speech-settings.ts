/**
 * Gemeinsam für Profil und Onboarding: Sprech-Einstellungen ändern und die Liste der Mikrofone.
 */
import { useCallback, useEffect, useState } from 'react'
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
 */
export function useMicList(): MicListState {
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
  return { mics, revealing, error, refresh, reveal }
}
