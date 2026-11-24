/**
 * Kontext für die Hinweise der Spracherkennung: Modul und Stationen auf der Frequenz – nie die Lösung.
 */
import type { ResolvedExchange, ResolvedScenario } from '../core/drills/types'
import { moduleOf, stationNames, type HintContext } from '../core/speech/hints'
import { content } from './run'

/** Für eine Übung mit Funkspruch: die anderen Sprecher des Austauschs. */
export function hintContextForExchange(x: ResolvedExchange): HintContext {
  return {
    moduleId: moduleOf(content, { exchangeId: x.id }),
    stations: stationNames(x.transmissions.filter((t) => !t.you && !t.skip).map((t) => t.speaker)),
  }
}

/** Für eine Freitext-Übung: nur das Modul (die Stationen stehen dort im Aufgabentext, nicht auf der Frequenz). */
export function hintContextForDrill(drillId: string): HintContext {
  return { moduleId: moduleOf(content, { drillId }) }
}

/**
 * Dürfen Zahlen getippt in Ziffern stehen? Nur in Modulen mit `typedDigits` (Spur C); sonst zählen sie getippt nur in
 * Worten, so wie man sie spricht. Unbekannte Übungen (z. B. Checkride-Szenarien außerhalb der Lektionen): in Worten.
 */
export function typedDigitsFor(ref: { drillId?: string; scenarioId?: string }): boolean {
  const moduleId = moduleOf(content, ref)
  return !!moduleId && !!content.modules.get(moduleId)?.typedDigits
}

/** Für ein Szenario: alle Stationen, die darin funken oder eingestellt werden. */
export function hintContextForScenario(s: ResolvedScenario): HintContext {
  const tuned = s.steps.flatMap((st) => (st.tune ? [st.tune.name] : []))
  const heard = s.steps.flatMap((st) => [...st.hear, ...st.reply]).filter((t) => !t.you)
  return { moduleId: moduleOf(content, { scenarioId: s.id }), stations: stationNames([...tuned, ...heard.map((t) => t.speaker)]) }
}
