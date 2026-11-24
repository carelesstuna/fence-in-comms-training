/**
 * Tippen oder Sprechen – der Umschalter über jeder Eingabe eines eigenen Funkspruchs (Funkspruch- und
 * Freitext-Übungen). Die Wahl gilt für alle Übungen (`speak-mode.ts`).
 */
import { setSpeakMode, useSpeakMode } from './speak-mode'

export function SpeakToggle({ className = '' }: { className?: string }) {
  const speak = useSpeakMode()
  return (
    <div
      className={`flex items-center gap-1 text-xs ${className}`}
      role="group"
      aria-label="Eingabe"
    >
      <button
        type="button"
        aria-pressed={!speak}
        onClick={() => setSpeakMode(false)}
        className={`rounded-md px-2.5 py-1 ${!speak ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}`}
      >
        ⌨ Tippen
      </button>
      <button
        type="button"
        aria-pressed={speak}
        onClick={() => setSpeakMode(true)}
        className={`rounded-md px-2.5 py-1 ${speak ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}`}
      >
        🎙 Sprechen
      </button>
    </div>
  )
}
