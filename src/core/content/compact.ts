/**
 * Kompaktmodus für Lektionen: Leseseiten eingeklappt, Übungen und Szenarien bleiben.
 */
import type { LessonStep } from './index'

/** Schritt im Lektionsspieler – im Kompaktmodus mit eingeklappten Leseseiten davor bzw. danach. */
export type PlayStep = LessonStep & { theory?: string[]; after?: string[] }

/**
 * Leseseiten hängen an der nächsten Übung (die letzten an der letzten), Hangar-Karten entfallen.
 * Eine Lektion ohne Übungen bleibt, wie sie ist.
 */
export function compactSteps(steps: readonly LessonStep[]): PlayStep[] {
  if (!steps.some((s) => s.kind === 'drill' || s.kind === 'scenario')) return [...steps]
  const out: PlayStep[] = []
  let pending: string[] = []
  for (const s of steps) {
    if (s.kind === 'read') pending.push(s.markdown)
    else if (s.kind !== 'hangar') {
      out.push({ ...s, theory: pending })
      pending = []
    }
  }
  if (pending.length) out[out.length - 1] = { ...out[out.length - 1], after: pending }
  return out
}
