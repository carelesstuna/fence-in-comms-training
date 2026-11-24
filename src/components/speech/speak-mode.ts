/**
 * Tippen oder Sprechen: die gewählte Eingabe (Profil: `speech.input`, gilt für alle Übungen) und was im
 * Sprechmodus mit dem Textfeld passiert. Der Umschalter selbst ist `SpeakToggle`.
 */
import { useEffect, type RefObject } from 'react'
import { useApp } from '../../state/store'
import { isTextField } from '../../platform/usePushToTalk'

/** Gewählte Eingabe: `true` = sprechen. */
export const useSpeakMode = () => useApp((s) => s.profile.speech.input === 'speak')

export function setSpeakMode(on: boolean) {
  // Steht der Cursor noch im Textfeld, würde die Leertaste dort tippen statt zu senden
  if (on && document.activeElement instanceof HTMLInputElement) document.activeElement.blur()
  const speech = useApp.getState().profile.speech
  useApp.getState().setProfile({ speech: { ...speech, input: on ? 'speak' : 'type' } })
}

/**
 * Im Sprechmodus hat das Textfeld nicht den Fokus (die Leertaste ist Sprechtaste). Wer trotzdem einfach lostippt,
 * landet darin – die Sprechtaste selbst ausgenommen. `active`: Sprechmodus und noch nicht gewertet.
 */
export function useTypeToFocus(input: RefObject<HTMLInputElement | null>, active: boolean) {
  const pttKey = useApp((s) => s.profile.speech.pttKey)
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key.length !== 1 ||
        e.code === pttKey ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        isTextField(e.target)
      )
        return
      input.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, pttKey, input])
}
