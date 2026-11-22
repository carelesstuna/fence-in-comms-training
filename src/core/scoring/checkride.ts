/**
 * Checkride-Auswertung: Ergebnis gegen Bestehensgrenze und kritische Fehler.
 *
 * Kritisch ist
 *  - ein fehlender oder falscher Pflichtteil (Segment mit `critical: true`) in einem eigenen Funkspruch,
 *  - jeder Fehler in einem Schritt mit `critical: true` (Frequenz, Funkspruch oder Schweigen).
 */
import type { CheckrideRule } from '../content/schema'
import type { ResolvedScenario, ResolvedSegment } from '../drills/types'
import type { CallScore } from './score'

/** Was der Nutzer in einem Schritt getan hat. */
export interface StepOutcome {
  /** Funkgerät richtig eingestellt? (nur bei tune-Schritten) */
  tune?: boolean
  /** Funkspruch oder Schweigen (nur bei Schritten mit you oder silence). */
  call?: { correct: boolean; score: number; silent: boolean; detail?: CallScore }
}

export interface CriticalError {
  step: number
  stage: string
  reason: string
}

export interface CheckrideResult {
  passed: boolean
  score: number
  passScore: number
  critical: CriticalError[]
}

/** Pflichtteile, die im Funkspruch fehlen oder falsch sind. */
export function criticalMisses(segments: readonly ResolvedSegment[], detail: CallScore): string[] {
  return detail.slots
    .filter((s) => (s.status === 'missing' || s.status === 'wrong') && segments[s.index]?.critical)
    .map((s) => segments[s.index].text)
}

export function evaluateCheckride(
  scenario: ResolvedScenario,
  score: number,
  outcomes: Record<number, StepOutcome>,
  rule: Pick<CheckrideRule, 'passScore' | 'noCritical'>,
): CheckrideResult {
  const critical: CriticalError[] = []
  scenario.steps.forEach((st, i) => {
    const o = outcomes[i] ?? {}
    const add = (reason: string) => critical.push({ step: i, stage: st.stage, reason })
    if (st.critical && st.tune && o.tune === false) add(`Falsche Frequenz statt ${st.tune.name}`)
    const call = o.call
    if (st.you && call?.detail) {
      for (const text of criticalMisses(st.you.transmission.segments, call.detail))
        add(`Pflichtteil fehlt oder falsch: „${text}“`)
    }
    if (!st.critical || (!st.you && !st.silence)) return
    if (!call) add('Keine Antwort')
    else if (st.silence && !call.silent) add('Funkdisziplin: Hier wäre Schweigen richtig gewesen')
    else if (st.you && call.silent) add('Pflichtmeldung fehlt – du hast geschwiegen')
    else if (
      st.you &&
      !call.correct &&
      !(call.detail && criticalMisses(st.you.transmission.segments, call.detail).length)
    ) {
      add('Funkspruch fehlerhaft')
    }
  })
  const passScore = rule.passScore
  const passed = score >= passScore - 1e-9 && (!rule.noCritical || critical.length === 0)
  return { passed, score, passScore, critical }
}
