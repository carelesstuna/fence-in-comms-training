/**
 * Sprechtaste auf der Tastatur (nur in der App, keine globale Taste).
 *
 * - Halten (Standard) oder Umschalten; die Tastenwiederholung wird ignoriert.
 * - Die Taste wird abgefangen: kein Scrollen, kein Auslösen eines fokussierten Knopfs.
 *   Steht der Cursor in einem Textfeld, tippt sie dort ganz normal.
 * - Fensterwechsel (Alt-Tab) oder ein verstecktes Fenster während der Sendung zählt als Loslassen.
 * - Sind mehrere Stellen gleichzeitig bereit, gehört die Taste der zuletzt bereit gewordenen.
 */
import { useEffect, useEffectEvent } from 'react'
import { pttKeyAction, type PttMode } from '../core/speech/flow'

const owners: object[] = []

const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'])

export function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target.tagName === 'INPUT' && !NON_TEXT_INPUTS.has((target as HTMLInputElement).type)
}

export function usePushToTalk({
  enabled,
  keyCode,
  mode,
  sending,
  onPress,
  onRelease,
}: {
  enabled: boolean
  /** `KeyboardEvent.code`, z. B. „Space“. */
  keyCode: string
  mode: PttMode
  sending: boolean
  onPress: () => void
  onRelease: () => void
}): void {
  const press = useEffectEvent(onPress)
  const release = useEffectEvent(onRelease)
  const isSending = useEffectEvent(() => sending)

  useEffect(() => {
    if (!enabled) return
    const token = {}
    owners.push(token)
    const mine = () => owners[owners.length - 1] === token
    const onKey = (e: KeyboardEvent) => {
      if (!mine()) return
      const action = pttKeyAction(
        { type: e.type as 'keydown' | 'keyup', code: e.code, repeat: e.repeat, inTextField: isTextField(e.target), ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey },
        keyCode,
        mode,
        isSending(),
      )
      if (action === 'pass') return
      e.preventDefault()
      e.stopPropagation()
      if (action === 'press') press()
      else if (action === 'release') release()
    }
    const onLeave = () => {
      if (mine() && isSending()) release()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onLeave()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKey, true)
    window.addEventListener('blur', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKey, true)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      owners.splice(owners.indexOf(token), 1)
    }
  }, [enabled, keyCode, mode])
}
