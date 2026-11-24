/**
 * Löst Variablen-Definitionen (vars) und eingebaute Variablen zu konkreten Werten auf.
 */
import type { ContentIndex } from '../content/index'
import type { AircraftType, Airfield, Carrier, NumberKind, Phraseology, Sim, VarSpec } from '../content/schema'
import type { Rng } from './rng'
import { value, type Value } from './template'
import {
  formatAltitude,
  formatFrequency,
  formatHeading,
  formatThousands,
  formatTime,
  spellDigits,
  spokenAltimeter,
  spokenAltitude,
  spokenAngels,
  spokenCallsign,
  spokenFrequency,
  spokenFuel,
  spokenHeading,
  spokenRunway,
  spokenThousands,
  positionWord,
  writtenCallsign,
  cardinal,
  formatMgrs,
  spellLetters,
  spokenMgrs,
  spokenWholeNumber,
  PHONETIC_WORDS,
} from '../phraseology/spoken'
import { buildPicture, pictureValue } from './geo'
import { buildChart, chartValue } from '../charts/chart'
import { buildCasArea, casAreaValue, rollLaserCode, rollSquare } from './cas'
import {
  inHgToHpa,
  phraseologyFields,
  phraseologyOf,
  PRESSURE_RANGE,
  pressureValue,
  spokenPhraseology,
  visibilityValues,
  type PhraseologySetting,
} from './phraseology'

/** Das eigene Rufzeichen des Nutzers in einer Übung. */
export interface SelfCallsign {
  name: string
  flight: number
  position: number
  /** Anzahl Flugzeuge im Flight (2 oder 4). Standard 4. */
  size?: number
}

export interface ResolveEnv {
  rng: Rng
  content: ContentIndex
  self: SelfCallsign
  /** Sims aus dem Profil: Es kommen nur Flugplätze auf Karten dieser Sims dran (wenn es dort passende gibt). */
  sims?: readonly Sim[]
  /** Flugzeuge aus dem Profil (IDs): Im Pool `aircraft` kommen sie bevorzugt dran. */
  aircraft?: readonly string[]
  /**
   * Phraseologie aus dem Profil: `us` (Standard, auch ohne Angabe) spricht an jedem Platz die US-Form (FAA), `map` die
   * Form der Karte (ICAO in Georgien und am Golf). Mindesthöhen über dem Platz hängen nicht davon ab.
   */
  phraseology?: PhraseologySetting
}

/** Würfelt ein eigenes Rufzeichen aus dem Jäger-Pool (Flight 1–9, man selbst ist Lead). */
export function randomSelf(rng: Rng, content: ContentIndex): SelfCallsign {
  const pool = content.callsigns.fighter ?? Object.values(content.callsigns)[0]
  return { name: rng.pick(pool), flight: rng.int(1, 9), position: 1, size: rng.chance(0.4) ? 2 : 4 }
}

export function builtinVars(self: SelfCallsign): Record<string, Value> {
  const member = (pos: number) => value(writtenCallsign(self.name, self.flight, pos), spokenCallsign(self.name, self.flight, pos))
  const wingPos = self.position === 2 ? 1 : 2
  const size = self.size ?? 4
  return {
    callsign: member(self.position),
    flight: value(writtenCallsign(self.name, self.flight), spokenCallsign(self.name, self.flight)),
    flightName: value(self.name),
    flightNum: value(String(self.flight), spellDigits(String(self.flight))),
    wingman: member(wingPos),
    element: member(3),
    element2: member(4),
    lead: member(1),
    two: member(2),
    three: member(3),
    four: member(4),
    selfNum: { ...value(positionWord(self.position), positionWord(self.position).toLowerCase()), num: self.position },
    flightSize: { ...value(String(size), spellDigits(String(size))), num: size },
  }
}

// ---------------------------------------------------------------------------
// Zahlen
// ---------------------------------------------------------------------------

function decimals(step: number): number {
  const s = String(step)
  return s.includes('.') ? s.split('.')[1].length : 0
}

/** Gleichverteilter Wert im Raster [min, max] mit Schrittweite step. */
export function rollInRange(rng: Rng, range: readonly [number, number], step: number): number {
  const [min, max] = range
  const n = Math.max(0, Math.floor((max - min) / step + 1e-9))
  const v = min + rng.int(0, n) * step
  return Number(v.toFixed(decimals(step)))
}

const NUMBER_DEFAULTS: Record<NumberKind, { range: [number, number]; step: number }> = {
  heading: { range: [10, 360], step: 10 },
  bearing: { range: [1, 360], step: 1 },
  altitude: { range: [2000, 35000], step: 500 },
  angels: { range: [5, 35], step: 1 },
  thousands: { range: [5, 35], step: 0.1 },
  uhf: { range: [225, 399.75], step: 0.25 },
  vhf: { range: [118, 136.95], step: 0.05 },
  'vhf-fm': { range: [30, 87.95], step: 0.05 },
  altimeter: { range: [29.7, 30.3], step: 0.01 },
  qnh: { range: [995, 1030], step: 1 },
  // Ohne Platz die US-Form; mit `airfield` wählt resolveSpec den Bereich nach der Phraseologie (PRESSURE_RANGE)
  pressure: PRESSURE_RANGE.faa,
  fuel: { range: [2, 9.9], step: 0.1 },
  time: { range: [0, 1439], step: 5 },
  runway: { range: [1, 36], step: 1 },
  channel: { range: [1, 20], step: 1 },
  squawk: { range: [0, 7777], step: 1 },
  speed: { range: [250, 450], step: 10 },
  mach: { range: [0.7, 1.4], step: 0.05 },
  playtime: { range: [15, 120], step: 5 },
  modex: { range: [100, 415], step: 1 },
  elevation: { range: [0, 9000], step: 5 },
  lasercode: { range: [1111, 1788], step: 1 },
  nm: { range: [5, 15], step: 0.1 },
  distance: { range: [5, 80], step: 1 },
  meters: { range: [300, 3000], step: 100 },
  cardinal: { range: [0, 315], step: 45 },
  mgrs: { range: [0, 0], step: 1 },
  initials: { range: [0, 675], step: 1 },
}

function freqVal(mhz: number): Value {
  return value(formatFrequency(mhz), spokenFrequency(mhz))
}

/** Formatiert einen Zahlenwert in der Funkform seiner Art (auch für derive). */
export function formatNumber(kind: NumberKind, n: number): Value {
  const v = ((): Value => {
    switch (kind) {
      case 'heading':
      case 'bearing': {
        const h = ((Math.round(n) % 360) + 360) % 360 || 360
        return value(formatHeading(h), spokenHeading(h))
      }
      case 'altitude':
        return value(formatAltitude(n), spokenAltitude(n))
      case 'angels':
        return value(String(n), spokenAngels(n))
      case 'thousands': {
        // 16.9 → "16.9" / "one six point niner"; Felder: dieselbe Höhe als angels (gerundet) und in Fuß
        const t = Number(n.toFixed(1))
        const angels = Math.round(t)
        const ft = Math.round(t * 10) * 100
        return value(formatThousands(t), spokenThousands(t), {
          angels: { ...value(String(angels), spokenAngels(angels)), num: angels },
          feet: { ...value(ft.toLocaleString('de-DE'), spokenAltitude(ft)), num: ft },
        })
      }
      case 'uhf':
      case 'vhf':
      case 'vhf-fm':
        return freqVal(n)
      case 'altimeter':
        return value(n.toFixed(2), spokenAltimeter(n))
      case 'pressure':
        return pressureValue(n)
      case 'qnh':
      case 'channel':
      case 'speed':
      case 'modex':
        return value(String(Math.round(n)), spellDigits(String(Math.round(n))))
      case 'fuel':
        return value(n.toFixed(1), spokenFuel(n))
      case 'time': {
        const m = ((Math.round(n) % 1440) + 1440) % 1440
        const t = formatTime(Math.floor(m / 60), m % 60)
        return value(t, spellDigits(t))
      }
      case 'runway': {
        const r = String(((Math.round(n) - 1 + 36) % 36) + 1).padStart(2, '0')
        return value(r, spokenRunway(r))
      }
      case 'squawk': {
        const code = String(Math.round(n)).padStart(4, '0')
        return value(code, spellDigits(code))
      }
      case 'mach': {
        const text = n.toFixed(2).replace(/0$/, '')
        return value(text, spellDigits(text.startsWith('0') ? text.slice(1) : text))
      }
      case 'playtime': {
        const total = Math.max(0, Math.round(n))
        const h = Math.floor(total / 60)
        const m = String(total % 60).padStart(2, '0')
        return value(`${h}+${m}`, `${spellDigits(String(h))} plus ${spellDigits(m)}`)
      }
      case 'elevation':
      case 'lasercode': {
        const t = String(Math.max(0, Math.round(n)))
        return value(t, spellDigits(t))
      }
      case 'nm':
        return value(n.toFixed(1), spellDigits(n.toFixed(1)))
      case 'meters':
        return value(String(Math.round(n)), spokenWholeNumber(Math.round(n)))
      case 'distance': {
        const d = String(Math.max(0, Math.round(n)))
        return value(d, spokenWholeNumber(Number(d)), { digits: value(d, spellDigits(d)) })
      }
      case 'cardinal': {
        const dir = cardinal(n)
        return value(dir, dir, { opposite: value(cardinal(n + 180)) })
      }
      case 'initials': {
        // n = erster Buchstabe · 26 + zweiter
        const i = ((Math.round(n) % 676) + 676) % 676
        const letters = String.fromCharCode(65 + Math.floor(i / 26), 65 + (i % 26))
        return value(letters, spellLetters(letters))
      }
      case 'mgrs':
        // Ohne Quadrat nicht darstellbar – MGRS würfelt numberValue als Ganzes
        return value(String(Math.round(n)), spellDigits(String(Math.round(n))))
    }
  })()
  return { ...v, num: kind === 'heading' || kind === 'bearing' ? ((Math.round(n) % 360) + 360) % 360 || 360 : n, kind }
}

export function numberValue(kind: NumberKind, rng: Rng, range?: readonly [number, number], step?: number, digits?: 6 | 8 | 10): Value {
  const d = NUMBER_DEFAULTS[kind]
  const roll = () => rollInRange(rng, range ?? d.range, step ?? d.step)
  if (kind === 'lasercode') {
    const code = rollLaserCode(rng)
    return { ...value(code, spellDigits(code)), num: Number(code), kind }
  }
  if (kind === 'cardinal' && !range) return formatNumber(kind, rng.int(0, 7) * 45)
  if (kind === 'initials' && !range) {
    const a = rng.pick(PHONETIC_WORDS.map((_, i) => i))
    const b = rng.pick(PHONETIC_WORDS.map((_, i) => i))
    return formatNumber(kind, a * 26 + b)
  }
  if (kind === 'mgrs') {
    const square = rollSquare(rng)
    const n = digits ?? 8
    const grid = Array.from({ length: n }, () => String(rng.int(0, 9))).join('')
    return {
      ...value(formatMgrs(square, grid), spokenMgrs(square, grid), {
        square: value(square, spellLetters(square)),
        digits: value(grid, spellDigits(grid)),
      }),
      kind,
    }
  }
  if (kind === 'squawk') {
    let code: string
    do {
      code = Array.from({ length: 4 }, () => String(rng.int(0, 7))).join('')
    } while (['7500', '7600', '7700', '0000'].includes(code))
    return { ...value(code, spellDigits(code)), num: Number(code), kind }
  }
  if (kind === 'modex' && !range) return formatNumber(kind, rng.int(1, 4) * 100 + rng.int(0, 15))
  return formatNumber(kind, roll())
}

// ---------------------------------------------------------------------------
// Pools
// ---------------------------------------------------------------------------

function optFreq(mhz: number | undefined): Value {
  return mhz === undefined ? value('—', 'not available') : freqVal(mhz)
}

/** Band einer Frequenz in MHz: UHF ab 225, VHF-AM ab 108, darunter VHF-FM (30–88) bzw. HF. */
export function bandOf(mhz: number): 'UHF' | 'VHF' | 'VHF-FM' | 'HF' {
  return mhz >= 225 ? 'UHF' : mhz >= 108 ? 'VHF' : mhz >= 30 ? 'VHF-FM' : 'HF'
}

/** Frequenz mit Zahlenwert und Band als Unterfeld ({af.gnd.band} → "UHF"). */
function bandFreq(mhz: number): Value {
  return { ...freqVal(mhz), num: mhz, fields: { band: value(bandOf(mhz)) } }
}

/** Tower-Frequenz in der Sim: UHF, sonst VHF (manche DCS-Plätze haben nur VHF). */
export function towerMhz(a: Airfield): number | undefined {
  return a.atc.uhf ?? a.atc.vhf
}

/** Ground-Frequenz: eigene Ground-Frequenz (BMS), sonst die eine ATC-Frequenz des Platzes (DCS). */
export function groundMhz(a: Airfield): number | undefined {
  return a.freqs?.ground ?? towerMhz(a)
}

/**
 * Approach und Departure: aus den Platzdaten, sonst gewürfelt (UHF, verschieden von den anderen Platzfrequenzen).
 * Der Wurf hängt nur am Seed und am Platz – derselbe Platz bekommt in einem Durchlauf dieselben Werte.
 */
export function approachDeparture(a: Airfield, rng: Rng): { app: number; dep: number } {
  const r = rng.fork(`freqs/${a.id}`)
  const used = new Set(
    [towerMhz(a), groundMhz(a), a.atc.vhf, a.freqs?.atis, a.freqs?.approach, a.freqs?.departure]
      .filter((f): f is number => f !== undefined)
      .map(formatFrequency),
  )
  const roll = () => {
    for (;;) {
      const f = rollInRange(r, [225, 399.75], 0.25)
      if (!used.has(formatFrequency(f))) {
        used.add(formatFrequency(f))
        return f
      }
    }
  }
  const dep = a.freqs?.departure ?? a.freqs?.approach ?? roll()
  const app = a.freqs?.approach ?? (a.freqs?.departure !== undefined ? dep : roll())
  return { app, dep }
}

/** Alle Bahnrichtungen eines Platzes, z. B. ["13", "31"] oder ["03L", "21R", "03R", "21L"]. */
export function runwayEnds(a: Airfield): string[] {
  return a.runways.flatMap((r) => r.split('/'))
}

/** Flugplatz mit allen Feldern. `phraseology` ist die Profil-Einstellung (ohne Angabe „Immer US“). */
export function airfieldValue(a: Airfield, rng: Rng, content: ContentIndex, phraseology?: PhraseologySetting): Value {
  const runway = rng.pick(runwayEnds(a))
  const taxi = a.taxiways?.[runway]
  return { ...airfieldFields(a, rng, content, runway, taxi, phraseology), data: a }
}

function airfieldFields(
  a: Airfield,
  rng: Rng,
  content: ContentIndex,
  runway: string,
  taxi: string[] | undefined,
  phraseology: PhraseologySetting | undefined,
): Value {
  const map = content.maps.get(a.map)
  const twr = towerMhz(a)
  const gnd = groundMhz(a)
  const { app, dep } = approachDeparture(a, rng)
  return value(a.name, a.name, {
    name: value(a.name),
    /** Zweiter gebräuchlicher Name (Kunsan zu Gunsan), sonst der Funkname. */
    alias: value(a.aliases[0] ?? a.name),
    // ICAO-Kennung („UGKO“). Nicht „icao“: Das Feld ist der Phraseologie-Schalter für `when: af.icao` (siehe unten).
    code: value(a.icao ?? '—', a.icao ? a.icao.split('').join(' ') : '—'),
    map: value(map?.name ?? a.map),
    uhf: optFreq(a.atc.uhf),
    vhf: optFreq(a.atc.vhf),
    // Kurzwelle und tiefes VHF wie im DCS-Flugplatzfenster (MHz mit drei Nachkommastellen: "4.400", "41.000")
    hf: a.atc.hf === undefined ? value('—', 'not available') : value(a.atc.hf.toFixed(3), spokenFrequency(a.atc.hf)),
    vhfLow: a.atc.vhfLow === undefined ? value('—', 'not available') : value(a.atc.vhfLow.toFixed(3), spokenFrequency(a.atc.vhfLow)),
    // Platzfrequenzen mit Band ({af.twr.band}): Tower (UHF, sonst VHF), Ground, Approach, Departure
    twr: twr === undefined ? value('—', 'not available') : bandFreq(twr),
    gnd: gnd === undefined ? value('—', 'not available') : bandFreq(gnd),
    app: bandFreq(app),
    dep: bandFreq(dep),
    runway: value(runway, spokenRunway(runway)),
    tacan: value(a.tacan ?? '—'),
    parking: value(a.parking?.length ? rng.pick(a.parking) : 'the ramp'),
    taxi: taxi ? value(taxi.join(', '), taxi.join(' ')) : value('—'),
    arming: value(a.arming ?? 'the arming area'),
    atis: optFreq(a.freqs?.atis),
    ground: optFreq(a.freqs?.ground),
    departure: optFreq(a.freqs?.departure),
    approach: optFreq(a.freqs?.approach),
    elevation:
      a.elevationFt !== undefined
        ? { ...value(`${formatAltitude(a.elevationFt)} ft`, `${spellDigits(String(a.elevationFt))} feet`), num: a.elevationFt }
        : value('—', 'unknown'),
    real: value('real', 'real', {
      atis: optFreq(a.realFreqs?.atis),
      clearance: optFreq(a.realFreqs?.clearance),
      ground: optFreq(a.realFreqs?.ground),
      tower: optFreq(a.realFreqs?.tower),
      approach: optFreq(a.realFreqs?.approach),
      departure: optFreq(a.realFreqs?.departure),
      source: value(a.realSource ?? '—'),
    }),
    charts: value(a.charts?.length ? a.charts.map((c) => c.name).join(', ') : '—'),
    // Phraseologie (E3-12): gesprochen nach der Profil-Einstellung, die Form der Karte bleibt abrufbar
    // ({af.phraseology}, {af.phraseology.here}, {af.phraseology.map}, {af.faa}/{af.icao}, {af.climb}, {af.descend})
    ...phraseologyFields(spokenPhraseology(a, { content, phraseology }), phraseologyOf(a, content)),
  })
}

function tacanValue(rng: Rng, band: 'X' | 'Y' = 'X'): Value {
  const ch = rng.int(1, 126)
  return value(`${ch}${band}`, `${spellDigits(String(ch))} ${band === 'X' ? 'x-ray' : 'yankee'}`)
}

function carrierValue(c: Carrier, rng: Rng): Value {
  const brc = rng.int(0, 71) * 5 || 360
  const icls = rng.int(1, 20)
  return value(c.name, c.name, {
    name: value(c.name),
    short: value(c.short),
    hull: value(c.hull),
    class: value(c.class),
    tacan: tacanValue(rng),
    icls: value(String(icls), spellDigits(String(icls))),
    brc: value(formatHeading(brc), spokenHeading(brc)),
  })
}

function aircraftValue(a: AircraftType): Value {
  return value(a.type, a.type, {
    type: value(a.type),
    radio: value(a.radio ?? a.type),
    id: value(a.id),
  })
}

// ---------------------------------------------------------------------------
// Wetter mit abgeleiteter Runway
// ---------------------------------------------------------------------------

const CLOUD_WORDS = { FEW: 'few', SCT: 'scattered', BKN: 'broken', OVC: 'overcast' } as const

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Bahnrichtung mit dem stärksten Gegenwind; bei Windstille zufällig. */
export function runwayForWind(ends: string[], windDir: number, windSpeed: number, rng: Rng): string {
  if (windSpeed === 0) return rng.pick(ends)
  const heading = (end: string) => Number(end.replace(/[LRC]/, '')) * 10
  const best = Math.min(...ends.map((e) => angleDiff(heading(e), windDir)))
  return rng.pick(ends.filter((e) => angleDiff(heading(e), windDir) === best))
}

/**
 * Wetter. `phraseology` (die gesprochene Form am Platz, siehe `spokenPhraseology`) bestimmt die Form von `pressure`,
 * `vis` und `visibility`; gewürfelt wird in beiden Formen gleich, damit ein Seed an jedem Platz dasselbe Wetter ergibt.
 */
export function weatherValue(
  spec: Extract<VarSpec, { weather: true }>,
  rng: Rng,
  airfield?: Airfield,
  phraseology: Phraseology = 'faa',
): { value: Value; runway?: string } {
  // Wind
  const mode = spec.wind ?? 'any'
  const speed =
    mode === 'calm' ? 0 : mode === 'light' ? rng.int(2, 8) : mode === 'strong' ? rng.int(15, 30) : rng.chance(0.12) ? 0 : rng.int(3, 20)
  const dir = rng.int(1, 36) * 10
  const gust = speed >= 12 && rng.chance(0.35) ? speed + rng.int(6, 12) : 0
  const sp = (n: number) => spellDigits(String(n))
  const wind =
    speed === 0
      ? value('calm', 'calm')
      : value(
          `${formatHeading(dir)} at ${speed}${gust ? ` gusting ${gust}` : ''}`,
          `${spokenHeading(dir)} at ${sp(speed)}${gust ? ` gusting ${sp(gust)}` : ''}`,
        )

  // Sicht und Wolken
  const imc = spec.sky === 'imc' || (spec.sky === 'any' && rng.chance(0.3))
  const vis = imc ? rng.int(1, 4) : rng.int(7, 10)
  type Layer = { cover: keyof typeof CLOUD_WORDS; base: number }
  const layers: Layer[] = imc
    ? [{ cover: rng.pick(['BKN', 'OVC'] as const), base: rollInRange(rng, [400, 2500], 100) }]
    : rng.chance(0.3)
      ? []
      : [{ cover: rng.pick(['FEW', 'SCT', 'SCT'] as const), base: rollInRange(rng, [3000, 9000], 500) }]
  if (!imc && layers.length && rng.chance(0.3)) layers.push({ cover: 'BKN', base: layers[0].base + rollInRange(rng, [2000, 6000], 500) })
  const ceilingLayer = layers.find((l) => l.cover === 'BKN' || l.cover === 'OVC')
  // US-Form wie in der ATIS (FAA JO 7110.65, AIM 4-1-13): erst die Höhe, dann die Menge; die erste Schicht
  // broken/overcast ist die Wolkenuntergrenze und heißt „ceiling“ – „ceiling four thousand five hundred broken“.
  const layerText = (l: Layer, alt: string) => `${l === ceilingLayer ? 'ceiling ' : ''}${alt} ${CLOUD_WORDS[l.cover]}`
  const clouds = layers.length
    ? value(
        layers.map((l) => layerText(l, formatAltitude(l.base))).join(', '),
        layers.map((l) => layerText(l, spokenAltitude(l.base))).join(', '),
      )
    : value('sky clear', 'sky clear')
  const ceiling = ceilingLayer?.base ?? Infinity
  const carrierCase = ceiling >= 3000 && vis >= 5 ? 1 : ceiling >= 1000 && vis >= 5 ? 2 : 3

  // Temperatur und Luftdruck
  const temp = rng.int(2, 34)
  const dew = Math.max(-5, temp - rng.int(1, 12))
  const inHg = rollInRange(rng, [29.7, 30.3], 0.01)
  const qnh = inHgToHpa(inHg)
  const signed = (n: number) => (n < 0 ? value(`M${-n}`, `minus ${sp(-n)}`) : value(String(n), sp(n)))

  // Runway gegen den Wind
  const runway = airfield ? runwayForWind(runwayEnds(airfield), dir, speed, rng) : undefined
  const taxi = runway ? airfield?.taxiways?.[runway] : undefined
  const roman = ['I', 'II', 'III'][carrierCase - 1]
  const icao = phraseology === 'icao'
  // Sicht und Luftdruck in der Form des Platzes (E3-12): Meilen und inHg bzw. Kilometer und hPa
  const { vis: visLocal, visibility } = visibilityValues(vis, phraseology)

  const fields: Record<string, Value> = {
    wind,
    windDir: { ...(speed === 0 ? value('—', 'calm') : value(formatHeading(dir), spokenHeading(dir))), num: dir },
    windSpeed: { ...value(String(speed), sp(speed)), num: speed },
    // Kneeboard-Kurzschrift: "310/6", "310/15G22", bei Windstille "calm" (P1-04)
    windShort: speed === 0 ? value('calm') : value(`${formatHeading(dir)}/${speed}${gust ? `G${gust}` : ''}`),
    vis: visLocal,
    visibility,
    clouds,
    ceiling: value(ceilingLayer ? formatAltitude(ceiling) : 'none', ceilingLayer ? spokenAltitude(ceiling) : 'none'),
    temp: signed(temp),
    dew: signed(dew),
    altimeter: value(inHg.toFixed(2), spokenAltimeter(inHg)),
    qnh: value(String(qnh), sp(qnh)),
    pressure: pressureValue(icao ? qnh : inHg),
    case: value(`Case ${roman}`, `case ${['one', 'two', 'three'][carrierCase - 1]}`),
    imc: value(imc ? 'IMC' : 'VMC'),
  }
  if (runway) fields.runway = value(runway, spokenRunway(runway))
  if (taxi) fields.taxi = value(taxi.join(', '), taxi.join(' '))
  const summary = icao
    ? `${wind.text}, vis ${visLocal.text} km, ${clouds.text}, ${temp}/${dew}, Q${qnh}`
    : `${wind.text}, vis ${vis}, ${clouds.text}, ${temp}/${dew}, A${inHg.toFixed(2)}`
  return { value: value(summary, summary, fields), runway }
}

// ---------------------------------------------------------------------------
// Comm Plan
// ---------------------------------------------------------------------------

const COMM_STATIONS = [
  ['atis', 'ATIS'],
  ['ground', 'Ground'],
  ['tower', 'Tower'],
  ['departure', 'Departure'],
  ['approach', 'Approach'],
  ['awacs', 'AWACS'],
  ['tanker', 'Tanker'],
  ['strike', 'Strike'],
  ['flight', 'Flight'],
  ['jtac', 'JTAC'],
] as const

/** Schlüssel der Comm-Plan-Stationen (für Kneeboard und Validator). */
export const COMMPLAN_KEYS: readonly string[] = [...COMM_STATIONS.map(([k]) => k), 'guard']

type CommKey = (typeof COMM_STATIONS)[number][0]

/**
 * Fester Comm Plan von Falcon BMS am Startplatz (Comms & Nav Book 4.38.2, Kap. 1 und 2.1.1, UHF-Presets
 * im DTC): UHF 2 Ground, 3 Tower, 4 Departure und Approach (eine Frequenz), 6 Tactical (AWACS) und JTAC,
 * 13 Tanker; auf VHF 2 die ATIS des Startplatzes und 15 die Flight-Frequenz. Strike hat in BMS kein festes
 * Preset – es liegt hier auf einem freien UHF-Preset (16–19).
 */
const BMS_PRESETS: Partial<Record<CommKey, number>> = {
  atis: 2,
  ground: 2,
  tower: 3,
  departure: 4,
  approach: 4,
  awacs: 6,
  jtac: 6,
  tanker: 13,
  flight: 15,
}

/** Plätze, an denen der feste BMS-Comm-Plan gilt (Karten, die es nur in BMS gibt). */
function usesBmsCommPlan(airfield: Airfield | undefined): boolean {
  return airfield?.map === 'kto'
}

/**
 * Comm Plan zur Mission. Feste Frequenzen des Platzes (Tower, Ground, ATIS, Approach, Departure) werden immer
 * übernommen – auch wenn sich zwei davon eine Frequenz teilen (Approach = Departure in BMS). Gewürfelte
 * Frequenzen weichen allen anderen aus. An BMS-Plätzen (`map: kto`) gelten die festen BMS-Presets.
 *
 * `airfieldVar` ist der aufgelöste Platz: Seine Approach-/Departure-Frequenz ({af.app}/{af.dep}) gilt auch hier.
 */
export function commplanValue(rng: Rng, airfield?: Airfield, airfieldVar?: Value): Value {
  const bms = usesBmsCommPlan(airfield)
  const channels = rng.sample(Array.from({ length: 20 }, (_, i) => i + 1), COMM_STATIONS.length)
  const fixedFor = (key: CommKey): number | undefined => {
    if (!airfield) return undefined
    switch (key) {
      case 'tower':
        return towerMhz(airfield)
      case 'atis':
        return airfield.freqs?.atis
      case 'ground':
        return airfield.freqs?.ground ?? (bms ? towerMhz(airfield) : undefined)
      case 'departure':
        return numOf(airfieldVar?.fields?.dep) ?? airfield.freqs?.departure
      case 'approach':
        return numOf(airfieldVar?.fields?.app) ?? airfield.freqs?.approach
      default:
        return undefined
    }
  }
  const fixed = new Map(COMM_STATIONS.map(([key]) => [key, fixedFor(key)] as const))
  const used = new Set([...fixed.values()].filter((f): f is number => f !== undefined).map(formatFrequency))
  const roll = (range: readonly [number, number], step: number) => {
    for (;;) {
      const f = rollInRange(rng, range, step)
      if (!used.has(formatFrequency(f))) {
        used.add(formatFrequency(f))
        return f
      }
    }
  }
  const strikeChannel = bms ? rng.int(16, 19) : 0
  const fields: Record<string, Value> = {}
  COMM_STATIONS.forEach(([key, label], i) => {
    let f = fixed.get(key)
    if (f === undefined) {
      if (bms && key === 'jtac') f = numOf(fields.awacs?.fields?.freq)
      else if (bms && (key === 'atis' || key === 'flight')) f = roll([118, 136.95], 0.05)
      else if (key === 'jtac') f = roll([30, 87.95], 0.05)
      else f = roll([225, 399.75], 0.25)
    }
    const mhz = f ?? roll([225, 399.75], 0.25)
    const ch = bms ? (BMS_PRESETS[key] ?? strikeChannel) : channels[i]
    const fv = { ...freqVal(mhz), num: mhz }
    const band = bandOf(mhz)
    // An BMS-Plätzen liegen ATIS und Flight auf VHF – der Name sagt es (Kneeboard und „wen erwischt“).
    const name = bms && band === 'VHF' ? `${label} (VHF)` : label
    fields[key] = value(`Ch ${ch} · ${fv.text}`, `channel ${spellDigits(String(ch))}`, {
      name: value(name),
      channel: value(String(ch), spellDigits(String(ch))),
      freq: fv,
      band: value(band),
    })
  })
  fields.guard = value('Guard · 243.0', 'guard', {
    name: value('Guard'),
    channel: value('G', 'guard'),
    freq: freqVal(243),
    band: value('UHF'),
  })
  return value('Comm Plan', 'comm plan', fields)
}

// ---------------------------------------------------------------------------
// Auflösung
// ---------------------------------------------------------------------------

function matchesWhere(item: Record<string, unknown>, where: Record<string, unknown> | undefined): boolean {
  if (!where) return true
  return Object.entries(where).every(([k, v]) => item[k] === v)
}

interface Resolved {
  value: Value
  airfield?: Airfield
}

/** Anteil der Würfe, die nur unter den Flugzeugen aus dem Profil wählen (der Rest aus allen passenden Mustern). */
export const OWN_AIRCRAFT_SHARE = 0.85

/**
 * Beschränkt Flugplätze auf das Sim-Profil: Es kommen nur Plätze auf Karten, die es in einer der eigenen Sims
 * gibt (BMS → Korea, DCS → DCS-Karten) – sonst müsste man in der Sim einen Platz suchen, den es dort nicht gibt.
 * Gibt es unter den Kandidaten keinen Platz der eigenen Sims (z. B. nur IL-2 im Profil, oder eine Übung, die eine
 * bestimmte Karte verlangt) oder ist kein Profil gesetzt, bleibt die Liste unverändert.
 */
export function preferBySim(candidates: Airfield[], env: Pick<ResolveEnv, 'content' | 'sims'>): Airfield[] {
  const sims = env.sims ?? []
  if (!sims.length) return candidates
  const own = candidates.filter((a) => env.content.maps.get(a.map)?.sims?.some((s) => sims.includes(s)))
  return own.length ? own : candidates
}

/**
 * Gewichtet Flugzeuge nach dem Profil (P2-08): Meist kommt ein Muster aus dem Profil dran, sofern es unter den
 * Kandidaten ist (also auch `where` erfüllt), gelegentlich ein anderes. Ohne Treffer bleibt die Liste unverändert.
 */
export function preferByProfile(candidates: AircraftType[], env: Pick<ResolveEnv, 'rng' | 'aircraft'>): AircraftType[] {
  const mine = env.aircraft ?? []
  if (!mine.length) return candidates
  const own = candidates.filter((a) => mine.includes(a.id))
  if (!own.length || own.length === candidates.length) return candidates
  return env.rng.chance(OWN_AIRCRAFT_SHARE) ? own : candidates
}

/** Feld eines Pool-Eintrags, auch verschachtelt ("atc.uhf"). */
function fieldAt(item: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), item)
}

/**
 * Wertebereich über der Platzhöhe (E3-01): Liegt der kleinste Wert unter Platzhöhe + `add` (in Fuß), wird der
 * ganze Bereich um volle Schritte nach oben geschoben – die Spanne bleibt gleich. `unit` rechnet Bereichswerte
 * in Fuß um (1000, wenn der Bereich in Tausend Fuß zählt). Ohne bekannte Platzhöhe bleibt der Bereich.
 */
export function rangeAbove(
  range: readonly [number, number],
  step: number,
  above: { airfield: string; add?: number; unit?: number } | undefined,
  raws: Record<string, Airfield>,
): [number, number] {
  const elev = above ? raws[above.airfield]?.elevationFt : undefined
  if (!above || elev === undefined) return [range[0], range[1]]
  const need = (elev + (above.add ?? 0)) / (above.unit ?? 1)
  const shift = Math.max(0, Math.ceil((need - range[0]) / step - 1e-9)) * step
  return [range[0] + shift, range[1] + shift]
}

/** Zahlenwert einer Variablen (num oder aus dem Text gelesen). */
export function numOf(v: Value | undefined): number | undefined {
  if (!v) return undefined
  if (v.num !== undefined) return v.num
  const n = Number(v.text.replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function deriveValue(spec: Extract<VarSpec, { derive: string }>, vars: Record<string, Value>): Value {
  const from = spec.from ? vars[spec.from] : undefined
  const kind = (spec.kind ?? from?.kind ?? (spec.of ? vars[spec.of[0]]?.kind : undefined)) as NumberKind | undefined
  const fmt = (n: number) => (kind ? formatNumber(kind, n) : { ...value(String(n), spellDigits(String(n))), num: n })
  const nums = (spec.of ?? []).map((k) => numOf(vars[k])).filter((n): n is number => n !== undefined)
  switch (spec.derive) {
    case 'offset':
      return fmt((numOf(from) ?? 0) + (spec.add ?? 0))
    case 'reciprocal':
      return fmt((numOf(from) ?? 0) + (kind === 'runway' ? 18 : 180))
    case 'min':
      return fmt(Math.min(...nums))
    case 'max':
      return fmt(Math.max(...nums))
    case 'sum':
      return fmt(Number(nums.reduce((a, b) => a + b, 0).toFixed(3)))
  }
}

export function resolveSpec(
  spec: VarSpec,
  env: ResolveEnv,
  raws: Record<string, Airfield> = {},
  vars: Record<string, Value> = {},
): Resolved {
  const { rng, content } = env
  if ('derive' in spec) return { value: deriveValue(spec, vars) }
  if ('chart' in spec) {
    const a = raws[spec.airfield]
    if (!a) return { value: value('—') }
    const runway = spec.weather ? vars[spec.weather]?.fields?.runway?.text : undefined
    const fallbackRunway = vars[spec.airfield]?.fields?.runway?.text
    const commplan = spec.commplan ? vars[spec.commplan] : undefined
    return { value: chartValue(buildChart(spec.chart, a, { rng, commplan, runway, fallbackRunway, freqSource: spec.freqs })) }
  }
  if ('geo' in spec) {
    return { value: pictureValue(buildPicture(rng, { groups: spec.groups, label: spec.label, id: spec.id, labelled: spec.labelled })) }
  }
  if ('casArea' in spec) return { value: casAreaValue(buildCasArea(rng, spec, content.cas)) }
  if ('pool' in spec) {
    const filter = <T,>(items: T[]) => {
      const c = items.filter(
        (a) =>
          matchesWhere(a as Record<string, unknown>, spec.where) &&
          (spec.require ?? []).every((k) => fieldAt(a, k) !== undefined) &&
          (!spec.sameMap || !raws[spec.sameMap] || (a as Record<string, unknown>).map === raws[spec.sameMap].map),
      )
      return c.length ? c : items
    }
    if (spec.pool === 'airfields') {
      const a = rng.pick(preferBySim(filter(content.airfields), env))
      return { value: airfieldValue(a, rng, content, env.phraseology), airfield: a }
    }
    if (spec.pool === 'carriers') return { value: carrierValue(rng.pick(filter(content.carriers)), rng) }
    // Sammel-Einträge („andere Muster“) gibt es nur im Profil, nie im Würfelpool.
    if (spec.pool === 'aircraft') {
      return { value: aircraftValue(rng.pick(preferByProfile(filter(content.aircraftTypes.filter((a) => !a.group)), env))) }
    }
    if (spec.pool === 'maps') return { value: value(rng.pick([...content.maps.values()]).name) }
    const pool = content.callsigns[spec.pool.replace(/^callsigns\./, '')] ?? []
    return { value: value(pool.length ? rng.pick(pool) : '?') }
  }
  if ('int' in spec) {
    const step = spec.step ?? 1
    const n = rollInRange(rng, rangeAbove(spec.int, step, spec.above, raws), step)
    return { value: value(String(n), spellDigits(String(n))) }
  }
  if ('letter' in spec) {
    const l = rng.pick(content.phonetic.letters)
    return { value: value(l.word, l.word, { letter: value(l.letter) }) }
  }
  if ('oneOf' in spec) {
    const item = rng.pick(spec.oneOf)
    return { value: typeof item === 'string' ? value(item) : value(item.text, item.spoken) }
  }
  if ('number' in spec) {
    if (spec.number === 'pressure') {
      // Luftdruck in der gesprochenen Form: inHg in der US-Form, hPa nach ICAO (E3-12, Profil-Einstellung)
      const p = PRESSURE_RANGE[spokenPhraseology(spec.airfield ? raws[spec.airfield] : undefined, env)]
      return { value: numberValue('pressure', rng, p.range, p.step) }
    }
    if (!spec.above) return { value: numberValue(spec.number, rng, spec.range, spec.step, spec.digits) }
    const d = NUMBER_DEFAULTS[spec.number]
    const step = spec.step ?? d.step
    return { value: numberValue(spec.number, rng, rangeAbove(spec.range ?? d.range, step, spec.above, raws), step, spec.digits) }
  }
  if ('weather' in spec) {
    const a = spec.airfield ? raws[spec.airfield] : undefined
    return { value: weatherValue(spec, rng, a, spokenPhraseology(a, env)).value }
  }
  return {
    value: commplanValue(rng, spec.airfield ? raws[spec.airfield] : undefined, spec.airfield ? vars[spec.airfield] : undefined),
  }
}

export function resolveVars(specs: Record<string, VarSpec> | undefined, env: ResolveEnv): Record<string, Value> {
  const vars: Record<string, Value> = builtinVars(env.self)
  const raws: Record<string, Airfield> = {}
  for (const [name, spec] of Object.entries(specs ?? {})) {
    const others = ('distinctFrom' in spec ? spec.distinctFrom : undefined) ?? []
    let r = resolveSpec(spec, env, raws, vars)
    for (let attempt = 0; attempt < 40 && others.some((o) => vars[o]?.text === r.value.text); attempt++) {
      r = resolveSpec(spec, env, raws, vars)
    }
    vars[name] = r.value
    if (r.airfield) raws[name] = r.airfield
    // Wetter mit Flugplatz: dessen Runway (und Rollweg) an den Wind angleichen
    if ('weather' in spec && spec.airfield && vars[spec.airfield]?.fields && r.value.fields?.runway) {
      const af = vars[spec.airfield]
      af.fields = { ...af.fields, runway: r.value.fields.runway }
      if (r.value.fields.taxi) af.fields.taxi = r.value.fields.taxi
    }
  }
  return vars
}
