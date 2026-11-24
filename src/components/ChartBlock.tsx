/**
 * Baustein ::chart{kind=airport|approach airfield=<id> freqs=sim|real annotate} für Leseseiten.
 * Ohne airfield wird ein Flugplatz gewürfelt (mit Knopf „anderer Platz“).
 * Mit annotate lässt sich die Karte erkunden: Fährt man über einen Bereich, wird er hervorgehoben, und ein
 * Kärtchen erklärt ihn mit den Werten genau dieser Karte. Antippen heftet die Erklärung an (Touch), die Knöpfe
 * unter der Karte machen dasselbe per Tastatur.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { resolveChartBlock } from '../core/charts/block'
import { FREQ_LABELS, type ChartData, type FreqId } from '../core/charts/chart'
import { formatAltitude, formatFrequency, formatHeading } from '../core/phraseology/spoken'
import { useRun } from '../ui/run'
import { Chart, HOTSPOT, type ChartExplore, type ChartNote } from './Chart'
import { chartZones } from './chart-geometry'

export function ChartBlock({
  kind,
  airfield,
  freqs,
  annotate,
}: {
  kind: 'airport' | 'approach'
  airfield?: string
  freqs?: 'sim' | 'real'
  annotate?: boolean
}) {
  const run = useRun()
  const [roll, setRoll] = useState(0)
  const chart = useMemo(
    () => resolveChartBlock(kind, airfield, freqs ?? 'sim', run.envFor(`chart:${kind}:${airfield ?? ''}:${roll}`)),
    [run, kind, airfield, freqs, roll],
  )
  return (
    <figure className="space-y-2">
      {annotate ? <ExploreChart data={chart} /> : <Chart data={chart} />}
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {kind === 'airport' ? 'Platzkarte' : 'Anflugkarte'} {chart.name} – schematisch, Frequenzen {freqs === 'real' ? 'laut echtem AIP' : 'aus Sim und Comm Plan'}.
        </span>
        <button
          onClick={() => setRoll((r) => r + 1)}
          className="rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:border-phosphor-dim hover:text-phosphor"
        >
          ⟳ {airfield ? 'Neu würfeln' : 'Anderer Platz'}
        </button>
      </figcaption>
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Erkunden
// ---------------------------------------------------------------------------

function ExploreChart({ data }: { data: ChartData }) {
  const [active, setActive] = useState<string>()
  const [pinned, setPinned] = useState(false)
  const notes = useMemo(() => (data.kind === 'approach' && data.approach ? approachNotes(data) : airportNotes(data)), [data])
  const order = useMemo(() => chartZones(data).map((z) => z.id).filter((id) => notes[id]), [data, notes])
  const explore: ChartExplore = {
    notes,
    active,
    pinned,
    hover: (id) => {
      if (!pinned) setActive(id)
    },
    leave: () => {
      if (!pinned) setActive(undefined)
    },
    pick: (id) => {
      if (pinned && active === id) {
        setPinned(false)
        setActive(undefined)
      } else {
        setPinned(true)
        setActive(id)
      }
    },
  }
  return (
    <div className="space-y-2.5">
      <Chart data={data} explore={explore} />
      <div className="mx-auto flex max-w-[560px] flex-wrap items-center gap-1.5 text-xs">
        <span className="mr-1 text-muted">Fahr über die blauen Punkte oder tippe:</span>
        {order.map((id) => {
          const on = active === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on && pinned}
              onMouseEnter={() => explore.hover(id)}
              onMouseLeave={explore.leave}
              onFocus={() => explore.hover(id)}
              onBlur={explore.leave}
              onClick={() => explore.pick(id)}
              className={`rounded-full border px-2.5 py-0.5 transition-colors ${
                on ? 'border-transparent text-white' : 'border-line text-muted hover:border-phosphor-dim hover:text-text'
              }`}
              style={on ? { background: HOTSPOT } : undefined}
            >
              {notes[id].title}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Erklärungen: lesen die Karte am konkreten Beispiel vor
// ---------------------------------------------------------------------------

/** Wert, wie er auf der Karte steht. */
const V = ({ children, bold }: { children: ReactNode; bold?: boolean }) => (
  <span className={`font-mono text-text ${bold ? 'font-bold' : ''}`}>{children}</span>
)

function freq(data: ChartData, id: FreqId): string {
  const f = data.freqs.find((x) => x.id === id)
  return f?.mhz !== undefined ? formatFrequency(f.mhz) : '—'
}

const ft = (n: number) => `${formatAltitude(n)} ft`

function airportNotes(data: ChartData): Record<string, ChartNote> {
  const shown = data.freqs.filter((f) => f.id !== 'departure' || f.mhz !== undefined)
  const [a, b] = data.runways[0].split('/')
  const course = (end: string) => formatHeading(Number(end.replace(/[LRC]/, '')) * 10)
  const parallel = data.runways.some((r) => /[LRC]/.test(r))
  return {
    radio: {
      title: 'Funkblock',
      body: (
        <>
          <span className="mb-1.5 grid grid-cols-[auto_auto] justify-start gap-x-4 gap-y-0.5">
            {shown.map((f) => (
              <span key={f.id} className="contents">
                <span>{f.label}</span>
                <V bold={f.id === 'tower'}>{f.mhz !== undefined ? formatFrequency(f.mhz) : '—'}</V>
              </span>
            ))}
          </span>
          Ground für alles am Boden, der Tower (fett) für Start und Landung, ATIS für Wetter und aktive Bahn.
        </>
      ),
    },
    runways: {
      title: data.runways.length > 1 ? 'Bahnen' : 'Bahn',
      body: (
        <>
          <V>{data.runways.join(', ')}</V> – jedes Bahnende trägt seinen magnetischen Kurs in Zehnergrad: <V>{a}</V> heißt
          etwa {course(a)}°, das Gegenende <V>{b}</V> etwa {course(b)}°.
          {parallel && ' L und R unterscheiden parallele Bahnen – links und rechts, in Landerichtung gesehen.'}
        </>
      ),
    },
    taxi: {
      title: 'Rollweg und Vorfeld',
      body: data.taxi?.length ? (
        <>
          <V>{data.taxi.join(', ')}</V> zwischen Vorfeld (APRON) und Bahn <V>{data.activeEnd}</V> – genau diese Buchstaben
          nennt Ground in der Rollfreigabe.
        </>
      ) : (
        <>
          Vom Vorfeld (APRON) zur Bahn. Echte Platzkarten schreiben an jeden Rollweg einen Buchstaben, und genau die nennt
          Ground in der Rollfreigabe („taxi via Alfa …“). Diese Lernkarte zeigt nur den Hauptrollweg.
        </>
      ),
    },
    elevation: {
      title: data.tacan ? 'Platzhöhe und TACAN' : 'Platzhöhe',
      body: (
        <>
          ELEV <V>{data.elevationFt !== undefined ? formatAltitude(data.elevationFt) : '—'}</V>: die Höhe des Platzes in Fuß
          über dem Meer.
          {data.tacan && (
            <>
              {' '}
              TACAN <V>{data.tacan}</V>: der Kanal, über den du Peilung und Entfernung zum Platz bekommst.
            </>
          )}
        </>
      ),
    },
  }
}

function approachNotes(data: ChartData): Record<string, ChartNote> {
  const ap = data.approach!
  const elev = data.elevationFt
  return {
    'head-nav': {
      title: 'Kopf: Navigationshilfe',
      body: (
        <>
          Womit du anfliegst: <V>{ap.navaid}</V>. Darunter der Endanflugkurs <V>{formatHeading(ap.course)}°</V>, der FAF,
          die {ap.minimumLabel === 'DA' ? 'Entscheidungshöhe' : 'Sinkflugmindesthöhe'} und die Platzhöhe – alles, was du vor
          dem Anflug einmal durchgehst.
        </>
      ),
    },
    'head-missed': {
      title: 'Kopf: Fehlanflug',
      body: (
        <>
          Was du tust, wenn die Landung nicht klappt – als Text, damit du es vorher liest: geradeaus steigen auf{' '}
          <V>{ft(ap.missedAlt)}</V>, dann direkt {data.tacan ? 'zum TACAN' : 'zum IAF'} und dort in die Warteschleife.
        </>
      ),
    },
    'head-freqs': {
      title: 'Kopf: Frequenzen',
      body: (
        <>
          <span className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            {(['atis', 'approach', 'tower', 'ground'] as const).map((id, i) => (
              <span key={id} className="whitespace-nowrap">
                {i > 0 && '→ '}
                {FREQ_LABELS[id]} <V bold={id === 'tower'}>{freq(data, id)}</V>
              </span>
            ))}
          </span>
          In der Reihenfolge, in der du sie im Anflug brauchst. Der Tower ist fett: Er gibt dir die Landefreigabe.
        </>
      ),
    },
    plan: {
      title: 'Draufsicht',
      body: (
        <>
          Der Weg von oben: Einflugpunkt IAF (Dreieck) in <V>{ft(ap.iafAlt)}</V>, {ap.iafNm} NM vor der Bahn, dann der FAF
          (Malteserkreuz) bei <V>{ap.fafNm} NM</V> auf Kurs <V>{formatHeading(ap.course)}°</V>. Gestrichelt der Fehlanflug.
        </>
      ),
    },
    msa: {
      title: 'MSA-Kreis',
      body: (
        <>
          Mindesthöhe für Notfälle: Mit <V>{ft(ap.msa)}</V> bist du im Umkreis von 25 NM mindestens 1.000 ft über allen
          Hindernissen.
        </>
      ),
    },
    profile: {
      title: 'Profil',
      body: (
        <>
          Der Anflug von der Seite: in <V>{ft(ap.fafAlt)}</V> bis zum FAF, dann auf dem 3°-Gleitpfad hinunter zur Bahn{' '}
          {ap.runway}. Ungefähr am FAF wechselst du von Approach (<V>{freq(data, 'approach')}</V>) zum Tower (
          <V bold>{freq(data, 'tower')}</V>).
        </>
      ),
    },
    minima: {
      title: 'Minima',
      body: (
        <>
          Kategorie D (Kampfjets): {ap.minimumLabel} <V>{ft(ap.minimumFt)}</V>
          {elev !== undefined && <> ({formatAltitude(ap.minimumFt - elev)} ft über dem Platz)</>}, Sicht{' '}
          <V>{ap.visibility} SM</V>.{' '}
          {ap.minimumLabel === 'DA'
            ? 'Hast du an der DA die nötigen Sichtmerkmale der Bahn nicht, fliegst du den Fehlanflug.'
            : 'Tiefer als die MDA geht es nur mit Sicht auf die Bahn – sonst fliegst du den Fehlanflug.'}
        </>
      ),
    },
  }
}
