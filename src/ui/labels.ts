/** Anzeigenamen und Farbklassen (statisch, damit Tailwind sie findet). */
import type { Era, Sim } from '../core/content/schema'

export const SIM_LABELS: Record<Sim, string> = {
  dcs: 'DCS World',
  bms: 'Falcon BMS',
  il2: 'IL-2 Sturmovik',
  srs: 'SRS (SimpleRadio)',
}

/** Kurzform für Plaketten an Flugzeug-Chips. */
export const SIM_SHORT: Record<Sim, string> = {
  dcs: 'DCS',
  bms: 'BMS',
  il2: 'IL-2',
  srs: 'SRS',
}

/** Flugzeugnamen kommen aus content/pools/aircraft.yaml (Feld label), siehe aircraftLabel(). */
export const ERA_LABELS: Record<Era, string> = {
  ww2: '2. Weltkrieg',
  'cold-war': 'Kalter Krieg (inkl. Korea)',
  modern: 'Moderne',
}

/** Kurzform für Hangar-Filter und Plaketten. */
export const ERA_SHORT: Record<Era, string> = {
  ww2: '2. Weltkrieg',
  'cold-war': 'Kalter Krieg',
  modern: 'Moderne',
}

/** Titel der Epochen-Kästen (:::era). */
export const ERA_NOTE_TITLES: Record<Era, string> = {
  ww2: 'Im Warbird (2. Weltkrieg)',
  'cold-war': 'Im Kalten Krieg',
  modern: 'In modernen Mustern',
}

export const ROLE_CLASSES: Record<string, { chip: string; dot: string; text: string; ring: string }> = {
  sky: { chip: 'bg-sky-500/15 text-sky-100 hover:bg-sky-500/25', dot: 'bg-sky-400', text: 'text-sky-300', ring: 'ring-sky-400/60' },
  amber: { chip: 'bg-amber-500/15 text-amber-100 hover:bg-amber-500/25', dot: 'bg-amber-400', text: 'text-amber-300', ring: 'ring-amber-400/60' },
  violet: { chip: 'bg-violet-500/15 text-violet-100 hover:bg-violet-500/25', dot: 'bg-violet-400', text: 'text-violet-300', ring: 'ring-violet-400/60' },
  teal: { chip: 'bg-teal-500/15 text-teal-100 hover:bg-teal-500/25', dot: 'bg-teal-400', text: 'text-teal-300', ring: 'ring-teal-400/60' },
  slate: { chip: 'bg-slate-400/15 text-slate-100 hover:bg-slate-400/25', dot: 'bg-slate-300', text: 'text-slate-300', ring: 'ring-slate-300/60' },
  green: { chip: 'bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/60' },
  orange: { chip: 'bg-orange-500/15 text-orange-100 hover:bg-orange-500/25', dot: 'bg-orange-400', text: 'text-orange-300', ring: 'ring-orange-400/60' },
  pink: { chip: 'bg-pink-500/15 text-pink-100 hover:bg-pink-500/25', dot: 'bg-pink-400', text: 'text-pink-300', ring: 'ring-pink-400/60' },
  lime: { chip: 'bg-lime-500/15 text-lime-100 hover:bg-lime-500/25', dot: 'bg-lime-400', text: 'text-lime-300', ring: 'ring-lime-400/60' },
  red: { chip: 'bg-red-500/15 text-red-100 hover:bg-red-500/25', dot: 'bg-red-400', text: 'text-red-300', ring: 'ring-red-400/60' },
}

export const HANGAR_CATEGORY: Record<string, { label: string; cls: string }> = {
  technik: { label: 'Technik', cls: 'text-sky-300 border-sky-400/40' },
  physik: { label: 'Physik', cls: 'text-violet-300 border-violet-400/40' },
  geschichte: { label: 'Geschichte', cls: 'text-amber-300 border-amber-400/40' },
  hintergrund: { label: 'Hintergrund', cls: 'text-teal-300 border-teal-400/40' },
  praxis: { label: 'Praxis', cls: 'text-emerald-300 border-emerald-400/40' },
}
