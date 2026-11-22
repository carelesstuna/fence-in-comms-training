/**
 * Der Sprechablauf als Zustandsautomat – rein und ohne Browser:
 * bereit → sendet → erkennt → prüfen → gewertet.
 *
 * - **sendet:** Sprechtaste gedrückt, die Aufnahme läuft.
 * - **erkennt:** Taste losgelassen. Erst kommt die Aufnahme (zu kurz/zu leise → verworfen),
 *   dann das Transkript.
 * - **prüfen:** Das Transkript ist da. Die Oberfläche wertet sofort, wenn es richtig ist; sonst kann
 *   man es werten lassen oder als „nicht richtig erkannt“ verwerfen (zählt als Verwurf).
 * - **verworfen / Fehler:** Erneutes Drücken startet einen neuen Versuch.
 */
import type { LevelStats } from './pcm'
import { checkRecording, cleanTranscript, type DiscardReason, type Transcript } from './transcript'

export type SpeechPhase = 'ready' | 'sending' | 'recognizing' | 'review' | 'done' | 'discarded' | 'error'

export const PHASE_LABEL: Record<SpeechPhase, string> = {
  ready: 'bereit',
  sending: 'sendet',
  recognizing: 'erkennt',
  review: 'erkannt',
  done: 'gewertet',
  discarded: 'verworfen',
  error: 'Fehler',
}

export interface SpeechState {
  phase: SpeechPhase
  /** Zeitpunkt des Drückens (ms). */
  pressedAt?: number
  /** Dauer der letzten Sendung (ms, Drücken bis Loslassen). */
  heldMs?: number
  /** Die Aufnahme liegt vor (die Erkennung kann noch laufen). */
  recorded?: boolean
  transcript?: Transcript
  discard?: DiscardReason
  error?: string
  /** Versuche, die als „nicht richtig erkannt“ verworfen wurden. */
  rejected: number
}

export type SpeechEvent =
  | { type: 'press'; at: number }
  | { type: 'release'; at: number }
  /** Aufnahme beendet: Pegel und Länge. */
  | { type: 'recorded'; stats: LevelStats }
  /** Ergebnis der Erkennung (roh). */
  | { type: 'recognized'; raw: string }
  | { type: 'failed'; error: string }
  /** Transkript werten. */
  | { type: 'accept' }
  /** „Nicht richtig erkannt?“ – Versuch verwerfen. */
  | { type: 'reject' }
  /** Nach Verwerfen oder Fehler wieder bereit. */
  | { type: 'again' }

export const initialSpeech: SpeechState = { phase: 'ready', rejected: 0 }

/** Aus diesen Zuständen startet die Sprechtaste eine Sendung. */
const CAN_PRESS: readonly SpeechPhase[] = ['ready', 'review', 'discarded', 'error']

export function speechReducer(s: SpeechState, e: SpeechEvent): SpeechState {
  switch (e.type) {
    case 'press':
      if (!CAN_PRESS.includes(s.phase)) return s
      // Erneut drücken, während ein Transkript zur Prüfung steht, heißt: nicht richtig erkannt
      return { phase: 'sending', pressedAt: e.at, rejected: s.rejected + (s.phase === 'review' ? 1 : 0) }
    case 'release':
      if (s.phase !== 'sending') return s
      return { ...s, phase: 'recognizing', heldMs: Math.max(0, e.at - (s.pressedAt ?? e.at)) }
    case 'recorded': {
      if (s.phase !== 'recognizing') return s
      const discard = checkRecording(e.stats)
      return discard ? { ...s, phase: 'discarded', discard, recorded: true } : { ...s, recorded: true }
    }
    case 'recognized': {
      if (s.phase !== 'recognizing') return s
      const transcript = cleanTranscript(e.raw)
      return transcript.discarded
        ? { ...s, phase: 'discarded', discard: transcript.discarded, transcript }
        : { ...s, phase: 'review', transcript }
    }
    case 'failed':
      return s.phase === 'recognizing' || s.phase === 'sending' ? { ...s, phase: 'error', error: e.error } : s
    case 'accept':
      return s.phase === 'review' ? { ...s, phase: 'done' } : s
    case 'reject':
      return s.phase === 'review' ? { phase: 'ready', rejected: s.rejected + 1 } : s
    case 'again':
      return s.phase === 'discarded' || s.phase === 'error' ? { phase: 'ready', rejected: s.rejected } : s
  }
}

// ---------------------------------------------------------------------------
// Sprechtaste (Tastatur)
// ---------------------------------------------------------------------------

export type PttMode = 'hold' | 'toggle'

export interface PttKeyEvent {
  type: 'keydown' | 'keyup'
  /** `KeyboardEvent.code`, z. B. „Space“. */
  code: string
  repeat: boolean
  /** Der Fokus steht in einem Textfeld – dort tippt die Taste ganz normal. */
  inTextField: boolean
  ctrlKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

/**
 * - `press` / `release`: Sendung beginnen bzw. beenden (Standardverhalten unterdrücken)
 * - `swallow`: nichts tun, aber Standardverhalten unterdrücken (kein Scrollen, kein Knopf-Auslösen)
 * - `pass`: Taste gehört nicht der Sprechtaste
 */
export type PttAction = 'press' | 'release' | 'swallow' | 'pass'

/** Was ein Tastendruck für die Sprechtaste bedeutet. `sending`: Gerade läuft eine Sendung. */
export function pttKeyAction(e: PttKeyEvent, key: string, mode: PttMode, sending: boolean): PttAction {
  if (e.code !== key) return 'pass'
  const isModifierKey = /^(Control|Alt|Meta|Shift)/.test(key)
  if (!isModifierKey && (e.ctrlKey || e.altKey || e.metaKey)) return 'pass'
  // Im Textfeld tippt die Taste – es sei denn, die Sendung läuft schon (dann beendet Loslassen sie)
  if (e.inTextField && !sending) return 'pass'
  if (e.type === 'keydown') {
    if (e.repeat) return 'swallow'
    if (mode === 'toggle') return sending ? 'release' : 'press'
    return sending ? 'swallow' : 'press'
  }
  if (mode === 'toggle') return 'swallow'
  return sending ? 'release' : 'swallow'
}

/** Anzeigename einer Taste (`KeyboardEvent.code`). */
export function keyLabel(code: string): string {
  const named: Record<string, string> = {
    Space: 'Leertaste',
    ControlLeft: 'Strg links',
    ControlRight: 'Strg rechts',
    AltLeft: 'Alt',
    AltRight: 'Alt Gr',
    ShiftLeft: 'Umschalt links',
    ShiftRight: 'Umschalt rechts',
    CapsLock: 'Feststelltaste',
    Tab: 'Tab',
    Enter: 'Eingabe',
    Backquote: 'Zirkumflex (^)',
  }
  if (named[code]) return named[code]
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit\d$/.test(code)) return code.slice(5)
  if (/^Numpad/.test(code)) return `Ziffernblock ${code.slice(6)}`
  return code
}
