/**
 * Funk-Log eines Szenarios: was bisher auf der Frequenz zu hören war – Stationen, deine eigenen Funksprüche und die
 * Antworten darauf.
 *
 * Eigene Funksprüche stehen so im Log, wie du sie gesagt hast (U2-05, E1-20): getippt bzw. gesprochen als Text,
 * darunter die Musterlösung – als solche gekennzeichnet. Gebaut oder ausgewählt steht der Funkspruch selbst da, wenn er
 * richtig war, sonst nur die Musterlösung. Im Checkride gibt es keine Musterlösung, nur das Gesagte.
 */
import type { CallResult } from '../components/CallInput'
import type { ResolvedScenario, ResolvedTransmission } from '../core/drills/types'

export interface LogEntry {
  t: ResolvedTransmission
  key: string
  /** Statt „Du“ bzw. der Station, z. B. „Musterlösung“. */
  label?: string
  /** Ohne Rollenfarben und nicht antippbar: das Gesagte als Text, ohne Anatomie. */
  neutral?: boolean
  /** Musterlösung, nicht gesendet (gedimmt). */
  model?: boolean
}

export const MODEL_LABEL = 'Musterlösung'

export interface LogState {
  /** Aktueller Schritt. */
  step: number
  /** Funkgerät im aktuellen Schritt eingestellt (vorher hörst du nichts). */
  tuned: boolean
  /** Aktueller Schritt beantwortet. */
  answered: boolean
  /** Checkride: ohne Musterlösung. */
  blind: boolean
  /** Getippte bzw. gesprochene Funksprüche je Schritt. */
  calls: Record<number, CallResult>
  /** Ergebnis je Schritt (0–1), auch für Baukasten und Auswahl. */
  results: Record<number, number>
}

/** Das Gesagte als eine Übertragung ohne Anatomie. */
function said(t: ResolvedTransmission, text: string): ResolvedTransmission {
  return { ...t, segments: [{ text, role: 'info' }] }
}

export function scenarioLog(scenario: ResolvedScenario, s: LogState): LogEntry[] {
  const entries: LogEntry[] = []
  scenario.steps.forEach((st, i) => {
    if (i > s.step) return
    // Im aktuellen Schritt hörst du erst etwas, wenn das Funkgerät stimmt
    if (i === s.step && !s.tuned) return
    st.hear.forEach((t, k) => entries.push({ t, key: `${i}h${k}` }))
    const done = i < s.step || s.answered
    if (done && st.you) {
      const own = st.you.transmission
      const call = s.calls[i]
      const model: LogEntry = { t: own, key: `${i}m`, label: MODEL_LABEL, model: true }
      if (s.blind) {
        if (call && !call.silent) entries.push({ t: said(own, call.text), key: `${i}y`, neutral: true })
      } else if (st.you.mode === 'type') {
        // Gesprochen mit Zahlen in Worten (im Checkride-Flug oben bleibt das Transkript roh – die Schreibweise verriete sonst etwas)
        if (call && !call.silent) entries.push({ t: said(own, call.shown ?? call.text), key: `${i}y`, neutral: true })
        entries.push(model)
      } else if ((s.results[i] ?? 0) >= 0.999) entries.push({ t: own, key: `${i}y` })
      else entries.push(model)
    }
    if (done) st.reply.forEach((t, k) => entries.push({ t, key: `${i}r${k}` }))
  })
  return entries
}
