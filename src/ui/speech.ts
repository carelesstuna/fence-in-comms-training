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

/** Für ein Szenario: alle Stationen, die darin funken oder eingestellt werden. */
export function hintContextForScenario(s: ResolvedScenario): HintContext {
  const tuned = s.steps.flatMap((st) => (st.tune ? [st.tune.name] : []))
  const heard = s.steps.flatMap((st) => [...st.hear, ...st.reply]).filter((t) => !t.you)
  return { moduleId: moduleOf(content, { scenarioId: s.id }), stations: stationNames([...tuned, ...heard.map((t) => t.speaker)]) }
}
