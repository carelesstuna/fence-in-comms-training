/**
 * Flugzeuge und Epochen: reine Hilfsfunktionen über content/pools/aircraft.yaml.
 */
import type { AircraftType, Era, Sim } from './schema'

/** Reihenfolge der Epochen im Profil: Moderne oben, weil die meisten dort anfangen. */
export const ERA_ORDER: readonly Era[] = ['modern', 'cold-war', 'ww2']

/** Sims, in denen man Militärflugzeuge fliegt – nur nach ihnen wird die Flugzeugauswahl gefiltert. */
export const FLYING_SIMS: readonly Sim[] = ['dcs', 'bms', 'il2']

/** Nur Muster aus der Liste – veraltete IDs aus alten Profilen fallen weg. */
export function knownAircraft(ids: readonly string[], types: readonly AircraftType[]): string[] {
  const known = new Set(types.map((t) => t.id))
  return ids.filter((id) => known.has(id))
}

/** Die Epochen der gewählten Flugzeuge. */
export function erasOf(ids: readonly string[], types: readonly AircraftType[]): Set<Era> {
  const byId = new Map(types.map((t) => [t.id, t]))
  const eras = new Set<Era>()
  for (const id of ids) {
    const t = byId.get(id)
    if (t) eras.add(t.era)
  }
  return eras
}

/**
 * Ist ein Epochen-Kasten für dieses Profil relevant? Ja, wenn eins der gewählten Flugzeuge zu der
 * Epoche gehört – oder wenn gar keins gewählt ist (wie bei Flugzeug-Kästen).
 */
export function eraRelevant(era: Era, ids: readonly string[], types: readonly AircraftType[]): boolean {
  const mine = knownAircraft(ids, types)
  return mine.length === 0 || erasOf(mine, types).has(era)
}

/**
 * Flugzeuge für die Profilauswahl, gruppiert nach Epoche. Gezeigt werden Muster der gewählten Sims
 * (alle, wenn keine fliegende Sim gewählt ist oder `showAll`) und immer die schon gewählten.
 */
export function aircraftByEra(
  types: readonly AircraftType[],
  opts: { sims: readonly Sim[]; selected: readonly string[]; showAll?: boolean },
): { era: Era; items: AircraftType[] }[] {
  const flying = opts.sims.filter((s) => FLYING_SIMS.includes(s))
  const visible = (t: AircraftType) =>
    opts.showAll || flying.length === 0 || opts.selected.includes(t.id) || t.sims.some((s) => flying.includes(s))
  return ERA_ORDER.map((era) => ({ era, items: types.filter((t) => t.era === era && visible(t)) })).filter((g) => g.items.length > 0)
}

/** Anzeigename einer Flugzeug-ID; unbekannte IDs bleiben, wie sie sind. */
export function aircraftLabel(id: string, types: readonly AircraftType[]): string {
  return types.find((t) => t.id === id)?.label ?? id
}
