/**
 * Schematische Platz- und Anflugkarten aus Flugplatzdaten.
 *
 * Wichtig: Das sind Lernkarten, keine Navigationskarten. Echte Platzdaten (Bahnen, TACAN, ILS,
 * Frequenzen, Platzhöhe) kommen aus content/airfields. Was es dort nicht gibt, wird nach festen,
 * typischen Regeln abgeleitet (3°-Gleitpfad, DA = Platzhöhe + 200 ft …) und ist als „schematisch“
 * gekennzeichnet. Fehlende Platzhöhe wird nicht erfunden, sondern als unbekannt angezeigt.
 */
import type { Airfield } from '../content/schema'
import type { Rng } from '../random/rng'
import { value, type Value } from '../random/template'
import { formatAltitude, formatFrequency, formatHeading, spellDigits, spokenAltitude, spokenFrequency, spokenHeading, spokenRunway } from '../phraseology/spoken'

export type ChartKind = 'airport' | 'approach'
export const FREQ_IDS = ['atis', 'clearance', 'ground', 'tower', 'approach', 'departure'] as const
export type FreqId = (typeof FREQ_IDS)[number]

export const FREQ_LABELS: Record<FreqId, string> = {
  atis: 'ATIS',
  clearance: 'CLNC DEL',
  ground: 'GND CON',
  tower: 'TWR',
  approach: 'APP CON',
  departure: 'DEP CON',
}

/** Antippbare Elemente (Ziele für chart-tap). Dazu kommen rwy:<Bahn> und rwy:active. */
export const CHART_ELEMENTS = [...FREQ_IDS, 'elevation', 'tacan', 'navaid', 'course', 'faf', 'da', 'msa', 'missed', 'minima', 'iaf'] as const

export interface ChartFreq {
  id: FreqId
  label: string
  /** MHz oder undefined, wenn unbekannt. */
  mhz?: number
}

export interface ApproachInfo {
  type: 'ILS' | 'TACAN'
  navaid: string
  runway: string
  course: number
  iafNm: number
  iafAlt: number
  fafNm: number
  fafAlt: number
  /** Entscheidungshöhe (ILS) bzw. Sinkflugmindesthöhe (TACAN), MSL. */
  minimumFt: number
  minimumLabel: 'DA' | 'MDA'
  visibility: string
  msa: number
  missedAlt: number
  missedText: string
}

export interface ChartData {
  kind: ChartKind
  name: string
  icao?: string
  /** Platzhöhe in ft MSL, undefined = unbekannt. */
  elevationFt?: number
  runways: string[]
  activeEnd?: string
  taxi?: string[]
  tacan?: string
  freqs: ChartFreq[]
  freqSource: 'sim' | 'real'
  approach?: ApproachInfo
}

const r100 = (n: number) => Math.round(n / 100) * 100
/** Mindesthöhen werden aufgerundet, nie abgerundet (sonst liegt die MSA unter Platzhöhe + 2.000 ft). */
const up100 = (n: number) => Math.ceil(n / 100) * 100
const r10 = (n: number) => Math.round(n / 10) * 10

/** Liest "ILS 13: 110.30" oder "ILS 06R: 110.1 (…)" → { runway, freq }. */
export function parseIls(ils: string | undefined): { runway?: string; mhz?: number } {
  if (!ils) return {}
  const m = /ILS\s+(\d{2}[LRC]?)\s*:?\s*(\d{3}\.\d+)/.exec(ils)
  if (m) return { runway: m[1], mhz: Number(m[2]) }
  const f = /(\d{3}\.\d+)/.exec(ils)
  return f ? { mhz: Number(f[1]) } : {}
}

function freqOf(cp: Value | undefined, key: string): number | undefined {
  const t = cp?.fields?.[key]?.fields?.freq?.text
  return t && t !== '—' ? Number(t) : undefined
}

export interface ChartOptions {
  rng: Rng
  commplan?: Value
  /** Aktive Bahn, z. B. aus dem Wetter – hat Vorrang. */
  runway?: string
  /** Bahn, falls weder Wetter noch (bei Anflugkarten) eine ILS-Bahn bekannt ist. */
  fallbackRunway?: string
  freqSource?: 'sim' | 'real'
}

export function buildChart(kind: ChartKind, a: Airfield, opts: ChartOptions): ChartData {
  const { rng } = opts
  const source = opts.freqSource ?? 'sim'
  const ends = a.runways.flatMap((r) => r.split('/'))
  const ils = parseIls(a.ils)

  const simFreq: Record<FreqId, number | undefined> = {
    atis: freqOf(opts.commplan, 'atis') ?? a.freqs?.atis,
    clearance: undefined,
    ground: freqOf(opts.commplan, 'ground') ?? a.freqs?.ground,
    tower: a.atc.uhf ?? a.atc.vhf ?? freqOf(opts.commplan, 'tower'),
    approach: freqOf(opts.commplan, 'approach') ?? a.freqs?.approach,
    departure: freqOf(opts.commplan, 'departure') ?? a.freqs?.departure,
  }
  const pick = (id: FreqId) => (source === 'real' ? a.realFreqs?.[id] : simFreq[id])
  const freqs: ChartFreq[] = FREQ_IDS.filter((id) => id !== 'clearance' || pick(id) !== undefined).map((id) => ({
    id,
    label: FREQ_LABELS[id],
    mhz: pick(id),
  }))

  const valid = (r: string | undefined): r is string => !!r && ends.includes(r)
  const runway = valid(opts.runway)
    ? opts.runway
    : kind === 'approach' && valid(ils.runway)
      ? ils.runway
      : valid(opts.fallbackRunway)
        ? opts.fallbackRunway
        : rng.pick(ends)
  const data: ChartData = {
    kind,
    name: a.name,
    icao: a.icao,
    elevationFt: a.elevationFt,
    runways: a.runways,
    activeEnd: runway,
    taxi: a.taxiways?.[runway],
    tacan: a.tacan,
    freqs,
    freqSource: source,
  }
  if (kind === 'approach') {
    const e = a.elevationFt ?? 0
    const isIls = ils.mhz !== undefined && (!ils.runway || ils.runway === runway)
    const type: ApproachInfo['type'] = isIls ? 'ILS' : 'TACAN'
    const fafNm = rng.pick([5, 5.5, 6, 6.5, 7])
    const iafNm = rng.int(12, 16)
    const minimumFt = isIls ? r10(e + 200) : r10(e + rng.int(40, 55) * 10)
    const missedAlt = r100(e + 2000)
    const fix = a.tacan ? `${a.icao ?? a.name} TACAN` : 'the IAF'
    data.approach = {
      type,
      navaid: isIls ? `ILS ${runway} ${formatFrequency(ils.mhz!)}` : a.tacan ? `TACAN ${a.tacan}` : 'RNAV (GPS)',
      runway,
      course: (Number(runway.replace(/[LRC]/, '')) * 10) % 360 || 360,
      iafNm,
      iafAlt: r100(e + 3000 + rng.int(0, 10) * 100),
      fafNm,
      fafAlt: r100(e + fafNm * 318),
      minimumFt,
      minimumLabel: isIls ? 'DA' : 'MDA',
      visibility: isIls ? '3/4' : '1',
      msa: up100(e + 2000 + rng.int(0, 30) * 100),
      missedAlt,
      missedText: `Climb to ${formatAltitude(missedAlt)} on runway heading, then direct ${fix} and hold.`,
    }
  }
  return data
}

// ---------------------------------------------------------------------------
// Als Platzhalter-Wert
// ---------------------------------------------------------------------------

function ft(n: number): Value {
  return { ...value(formatAltitude(n), spokenAltitude(n)), num: n }
}

export function chartValue(c: ChartData): Value {
  const fields: Record<string, Value> = {
    name: value(c.name),
    icao: value(c.icao ?? '—'),
    elevation: c.elevationFt !== undefined ? { ...value(`${formatAltitude(c.elevationFt)} ft`, `${spellDigits(String(c.elevationFt))} feet`), num: c.elevationFt } : value('—', 'unknown'),
    tacan: value(c.tacan ?? '—'),
    runway: c.activeEnd ? value(c.activeEnd, spokenRunway(c.activeEnd)) : value('—'),
  }
  for (const f of c.freqs) {
    fields[f.id] = f.mhz !== undefined ? { ...value(formatFrequency(f.mhz), spokenFrequency(f.mhz)), num: f.mhz } : value('—', 'not available')
  }
  const ap = c.approach
  if (ap) {
    Object.assign(fields, {
      navaid: value(ap.navaid),
      type: value(ap.type),
      course: { ...value(formatHeading(ap.course), spokenHeading(ap.course)), num: ap.course },
      faf: value(`${ap.fafNm} NM / ${formatAltitude(ap.fafAlt)} ft`, `${ap.fafNm} miles, ${spokenAltitude(ap.fafAlt)}`, {
        nm: { ...value(String(ap.fafNm)), num: ap.fafNm },
        alt: ft(ap.fafAlt),
      }),
      iaf: value(`${ap.iafNm} NM / ${formatAltitude(ap.iafAlt)} ft`, `${ap.iafNm} miles, ${spokenAltitude(ap.iafAlt)}`, {
        nm: { ...value(String(ap.iafNm)), num: ap.iafNm },
        alt: ft(ap.iafAlt),
      }),
      minimum: { ...value(`${ap.minimumLabel} ${formatAltitude(ap.minimumFt)}`, `${ap.minimumLabel} ${spellDigits(String(ap.minimumFt))}`), num: ap.minimumFt },
      da: ft(ap.minimumFt),
      msa: ft(ap.msa),
      missedAlt: ft(ap.missedAlt),
      missed: value(ap.missedText),
      visibility: value(ap.visibility),
    })
  }
  return { ...value(`${c.name} ${c.kind === 'airport' ? 'airport diagram' : 'approach chart'}`, c.name, fields), data: c }
}
