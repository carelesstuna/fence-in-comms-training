import type { ResolvedScenario, ResolvedTransmission } from '../core/drills/types'
import { scoreCall, type CallScore, type ScoreOptions } from '../core/scoring/score'
import { roleInfo } from './roles'

/** Bewertet einen getippten oder gesprochenen Funkspruch gegen eine Übertragung (Rollen-Labels auf Deutsch). */
export function scoreTransmission(text: string, t: ResolvedTransmission, options: ScoreOptions = {}): CallScore {
  return capWrongScore(scoreCall(text, t.segments, (r) => roleInfo(r).label, options), t.segments)
}

/**
 * Nicht richtig, aber volle Punkte – das gibt es bei einem falschen Wert in einem optionalen Teil („flight of two“ statt
 * „flight of four“) oder einem widersprüchlichen Zusatzwert. Dann zählt der Fehler wie ein halber Pflichtteil, damit nie
 * „✗ Nicht ganz (100 %)“ erscheint und das Szenario-Ergebnis zum Urteil passt (E3-13).
 */
export function capWrongScore(r: CallScore, segments: readonly { optional?: boolean }[]): CallScore {
  if (r.correct || r.score < 0.995) return r
  const required = Math.max(1, segments.filter((s) => !s.optional).length)
  return { ...r, score: Math.min(0.99, 1 - 0.5 / required) }
}

/**
 * Gesamtergebnis eines Szenarios: Durchschnitt über alles, was man tun musste –
 * Funksprüche bzw. Schweigen (results) und Funkgerät einstellen (tunes).
 */
export function scenarioScore(s: ResolvedScenario, results: Record<number, number>, tunes: Record<number, number> = {}): number {
  const parts: number[] = []
  s.steps.forEach((st, i) => {
    if (st.tune) parts.push(tunes[i] ?? 0)
    if (st.you || st.silence || st.decode) parts.push(results[i] ?? 0)
  })
  if (parts.length === 0) return 1
  return parts.reduce((a, b) => a + b, 0) / parts.length
}
