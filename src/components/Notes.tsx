import { useState, type ReactNode } from 'react'
import { useApp } from '../state/store'
import { ERA_NOTE_TITLES, SIM_LABELS } from '../ui/labels'
import { content } from '../ui/run'
import { aircraftLabel, eraRelevant, knownAircraft } from '../core/content/aircraft'
import { ERAS, type Era, type Sim } from '../core/content/schema'

function Box({ tone, title, children }: { tone: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${tone}`}>
      <div className="mb-1 text-xs font-semibold tracking-wider uppercase">{title}</div>
      <div className="md text-[0.95rem]">{children}</div>
    </div>
  )
}

/** Kasten, der nur aufgeklappt ist, wenn er zum Profil passt – sonst als Einzeiler einklappbar. */
function Filtered({ relevant, label, tone, children }: { relevant: boolean; label: string; tone: string; children: ReactNode }) {
  const [open, setOpen] = useState(relevant)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-line px-4 py-2 text-left text-sm text-muted hover:text-text"
      >
        ▸ {label} – nicht in deinem Profil, zum Anzeigen klicken
      </button>
    )
  }
  return (
    <Box tone={tone} title={label}>
      {children}
    </Box>
  )
}

export function SimNote({ sim, children }: { sim: string; children: ReactNode }) {
  const sims = useApp((s) => s.profile.sims)
  const label = `In ${SIM_LABELS[sim as Sim] ?? sim}`
  return (
    <Filtered relevant={sims.includes(sim as Sim)} label={label} tone="border-sky-400/30 bg-sky-500/5 text-sky-200">
      {children}
    </Filtered>
  )
}

/** Flugzeug-Kasten; `aircraft` darf eine Liste sein ("p51,p47"), dann gilt er für jedes dieser Muster. */
export function AircraftNote({ aircraft, children }: { aircraft: string; children: ReactNode }) {
  const profileAircraft = useApp((s) => s.profile.aircraft)
  const mine = knownAircraft(profileAircraft, content.aircraftTypes)
  const ids = aircraft.split(',').map((s) => s.trim()).filter(Boolean)
  const label = ids.map((id) => aircraftLabel(id, content.aircraftTypes)).join(' / ')
  return (
    <Filtered relevant={mine.length === 0 || ids.some((id) => mine.includes(id))} label={label} tone="border-violet-400/30 bg-violet-500/5 text-violet-200">
      {children}
    </Filtered>
  )
}

/**
 * Epochen-Kasten: aufgeklappt, wenn eins der gewählten Flugzeuge aus dieser Epoche stammt (oder keins
 * gewählt ist). `era` darf eine Liste sein ("ww2,cold-war").
 */
export function EraNote({ era, children }: { era: string; children: ReactNode }) {
  const profileAircraft = useApp((s) => s.profile.aircraft)
  const eras = era
    .split(',')
    .map((s) => s.trim())
    .filter((e): e is Era => (ERAS as readonly string[]).includes(e))
  const relevant = eras.some((e) => eraRelevant(e, profileAircraft, content.aircraftTypes))
  const label = eras.length ? eras.map((e) => ERA_NOTE_TITLES[e]).join(' / ') : era
  return (
    <Filtered relevant={relevant} label={label} tone="border-amber-400/30 bg-amber-500/5 text-amber-100">
      {children}
    </Filtered>
  )
}

export function LayerNote({ layer, children }: { layer: string; children: ReactNode }) {
  // community: echte Verbands-SOP (AFMAN, Einheitsvorschriften) und Gewohnheiten der Sim-Community – beides steht nicht in
  // den Brevity-Listen und ist je nach Verband bzw. Server verschieden (E1-08)
  const title = layer === 'community' ? 'Praxis: Verbands-SOP und Sim-Staffeln' : layer === 'sim' ? 'Sim-Detail' : 'Offizielles Verfahren'
  return (
    <Box tone="border-emerald-400/30 bg-emerald-500/5 text-emerald-200" title={title}>
      {children}
    </Box>
  )
}

export function Callout({ kind, children }: { kind: string; children: ReactNode }) {
  const map: Record<string, [string, string]> = {
    tip: ['Tipp', 'border-phosphor/30 bg-phosphor/5 text-phosphor'],
    warn: ['Typischer Fehler', 'border-orange-400/40 bg-orange-500/5 text-orange-200'],
    example: ['Merke', 'border-amber-hud/40 bg-amber-hud/5 text-amber-hud'],
  }
  const [title, tone] = map[kind] ?? ['Hinweis', 'border-line bg-panel-2 text-muted']
  return (
    <Box tone={tone} title={title}>
      {children}
    </Box>
  )
}
