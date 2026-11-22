/**
 * Lagegeometrie für AWACS-Übungen.
 *
 * Gewürfelt werden nur Primärwerte (eigene Position, Gruppen mit Position, Kurs, Höhe, Größe).
 * Alles andere wird berechnet: Bullseye-Peilung/-Entfernung, BRAA, Aspekt, Track, Picture-Label,
 * nächste Gruppe – damit jede Lage in sich stimmig ist.
 *
 * Koordinaten: Seemeilen (NM), Bullseye im Ursprung, x = Osten, y = Norden.
 */
import type { Rng } from './rng'
import { value, type Value } from './template'
import {
  cardinal,
  formatAltitude,
  formatHeading,
  spokenAngels,
  spokenContactAltitude,
  spokenHeading,
  spokenWholeNumber,
} from '../phraseology/spoken'
import type { PictureLabel } from '../content/schema'

export type { PictureLabel }
export type GroupId = 'hostile' | 'bandit' | 'bogey'

export interface Point {
  x: number
  y: number
}

export interface GeoGroup extends Point {
  name: string
  heading: number
  altFt: number
  size: number
  id: GroupId
}

export interface GeoPicture {
  label: PictureLabel
  /**
   * Erstes gesprochenes Maß in NM: bei azimuth und range der Abstand, bei drei Gruppen das Maß, das im
   * Label zuerst steht (wall wide, ladder deep, vic deep, champagne wide).
   */
  sepNm: number
  /** Breite (Azimut) in NM; 0, wenn das Label keine Breite hat. */
  wideNm: number
  /** Tiefe (Range) in NM, bei wall die tatsächliche Tiefe (höchstens 5 NM); 0 bei single und azimuth. */
  deepNm: number
  /**
   * false = Core Information (ATP 3-52.4: vor dem Commit): nur die Gesamtzahl, alle Gruppen heißen „group“
   * und werden verankert. Die Geometrie folgt trotzdem `label`.
   */
  labelled: boolean
  own: Point & { heading: number }
  groups: GeoGroup[]
  /** Index der Gruppe, die dem eigenen Flugzeug am nächsten ist. */
  nearest: number
  /**
   * Eine zusätzliche, bisher nicht gemeldete Gruppe aus Sicht derselben eigenen Position, die die
   * Threat-Kriterien erfüllt (ATP 3-52.4 V-18: Standard 35 NM): 20–35 NM, hot oder flank, hostile.
   * Nicht Teil des Pictures (kein Label, nicht auf dem Scope).
   */
  threat?: GeoGroup
  /** Wo der Flight beim Check-in war: 15–25 NM vor der Station auf der eigenen Seite (weg von der Bedrohung). */
  ingress?: Point
}

// ---------------------------------------------------------------------------
// Grundrechnungen
// ---------------------------------------------------------------------------

const rad = (deg: number) => (deg * Math.PI) / 180

/** Peilung von a nach b in Grad, 1–360 (Nord = 360). */
export function bearingDeg(a: Point, b: Point): number {
  const deg = (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI
  const r = Math.round((deg + 360) % 360)
  return r === 0 ? 360 : r
}

export function distNm(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function polar(origin: Point, bearing: number, range: number): Point {
  return { x: origin.x + Math.sin(rad(bearing)) * range, y: origin.y + Math.cos(rad(bearing)) * range }
}

export function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Aspektwinkel einer Gruppe in Grad (0–180): Winkel zwischen ihrem Kurs und der Linie von der Gruppe
 * zum eigenen Flugzeug. 0° = sie fliegt direkt auf dich zu.
 */
export function aspectAngle(g: GeoGroup, own: Point): number {
  return angleDiff(g.heading, bearingDeg(g, own))
}

/**
 * Lücken zwischen den Aspektklassen (ATP 1-02.1, 2020/21: hot 0–20°, flank 30–60°, beam 70–110°,
 * drag 120–180°). Dort entscheidet das Urteil des Controllers – der Generator würfelt solche Lagen neu.
 */
export function inAspectGap(deg: number): boolean {
  return (deg > 20 && deg < 30) || (deg > 60 && deg < 70) || (deg > 110 && deg < 120)
}

/**
 * Aspekt einer Gruppe relativ zum eigenen Flugzeug (ATP 1-02.1: hot/flank/beam/drag). flank, beam und
 * drag tragen eine Haupt- oder Nebenhimmelsrichtung (ATP 3-52.4: „drag west“), hot nicht. Liegt der
 * Winkel in einer Lücke, gilt die Mitte der Lücke als Grenze.
 */
export function aspectOf(g: GeoGroup, own: Point): string {
  const diff = aspectAngle(g, own)
  if (diff <= 25) return 'hot'
  const dir = cardinal(g.heading, 8)
  if (diff <= 65) return `flank ${dir}`
  if (diff <= 115) return `beam ${dir}`
  return `drag ${dir}`
}

// ---------------------------------------------------------------------------
// Lage bauen
// ---------------------------------------------------------------------------

function defaultLabel(groups: number, rng: Rng): PictureLabel {
  if (groups <= 1) return 'single'
  if (groups === 2) return rng.pick(['azimuth', 'range'] as const)
  return rng.pick(['wall', 'ladder', 'vic', 'champagne'] as const)
}

export function groupCount(label: PictureLabel): number {
  return label === 'single' ? 1 : label === 'azimuth' || label === 'range' ? 2 : 3
}

/**
 * Maße je Label in NM. Gruppen, die nebeneinander stehen und beide verankert werden (azimuth, wall,
 * die lead groups einer champagne), liegen mehr als 10 NM auseinander (ATP 3-52.4: Verankerung ab 10 NM
 * im Azimut). Tiefe über 5 NM bei vic und champagne, bei wall höchstens 5 NM (5-NM-Regel).
 */
function dimensions(label: PictureLabel, rng: Rng): { wide: number; deep: number; along: number[] } {
  switch (label) {
    case 'single':
      return { wide: 0, deep: 0, along: [0] }
    case 'azimuth':
      return { wide: rng.int(6, 12) * 2, deep: 0, along: [0, 0] }
    case 'range':
      return { wide: 0, deep: rng.int(4, 10) * 2, along: [] }
    case 'wall': {
      // Eine wall darf bis zu 5 NM Tiefe haben – etwas Versatz macht sie realistisch.
      const along = [rng.int(0, 4), rng.int(0, 4), rng.int(0, 4)]
      return { wide: rng.int(6, 10) * 4, deep: Math.max(...along) - Math.min(...along), along }
    }
    case 'ladder':
      return { wide: 0, deep: rng.int(4, 10) * 4, along: [] }
    case 'vic':
      return { wide: rng.int(5, 12) * 2, deep: rng.int(4, 10) * 2, along: [] }
    case 'champagne':
      return { wide: rng.int(6, 12) * 2, deep: rng.int(4, 10) * 2, along: [] }
  }
}

/** Versatz (along = vom Jäger weg, lateral = rechts) pro Gruppe, abhängig vom Label. */
function offsets(label: PictureLabel, d: { wide: number; deep: number; along: number[] }): [number, number][] {
  const { wide, deep, along } = d
  switch (label) {
    case 'single':
      return [[0, 0]]
    case 'azimuth':
      return [[0, -wide / 2], [0, wide / 2]]
    case 'range':
      return [[0, 0], [deep, 0]]
    case 'wall':
      return [[along[0], -wide / 2], [along[1], 0], [along[2], wide / 2]]
    case 'ladder':
      return [[0, 0], [deep / 2, 0], [deep, 0]]
    case 'vic':
      return [[0, 0], [deep, -wide / 2], [deep, wide / 2]]
    case 'champagne':
      return [[0, -wide / 2], [0, wide / 2], [deep, 0]]
  }
}

/** Erstes gesprochenes Maß (Reihenfolge laut ATP 3-52.4: vic erst deep, champagne erst wide). */
function firstDimension(label: PictureLabel, wide: number, deep: number): number {
  return label === 'range' || label === 'ladder' || label === 'vic' ? deep : label === 'single' ? 0 : wide
}

/**
 * Welche Gruppen ein Picture mit Label über den Bullseye verankert (ATP 3-52.4, S. 28 und Beispiele
 * S. 30–36): Gruppen am vorderen Rand bekommen ihn, Gruppen dahinter nur Name, Höhe und Identität.
 */
export function isAnchored(label: PictureLabel, index: number): boolean {
  switch (label) {
    case 'range':
    case 'ladder':
    case 'vic':
      return index === 0
    case 'champagne':
      return index < 2
    default:
      return true
  }
}

function groupNames(label: PictureLabel, axis: number): string[] {
  const left = cardinal(axis - 90, 4)
  const right = cardinal(axis + 90, 4)
  switch (label) {
    case 'single':
      return ['single group']
    case 'azimuth':
      return [`${left} group`, `${right} group`]
    case 'range':
      return ['lead group', 'trail group']
    case 'wall':
      return [`${left} group`, 'middle group', `${right} group`]
    case 'ladder':
      return ['lead group', 'middle group', 'trail group']
    case 'vic':
      return ['lead group', `${left} trail group`, `${right} trail group`]
    case 'champagne':
      return [`${left} lead group`, `${right} lead group`, 'trail group']
  }
}

export interface PictureOptions {
  groups?: number
  label?: PictureLabel
  id?: GroupId | 'mixed'
  /** false = Core Information ohne Label (siehe GeoPicture.labelled). Standard: true. */
  labelled?: boolean
}

export function buildPicture(rng: Rng, opts: PictureOptions = {}): GeoPicture {
  const label = opts.label ?? defaultLabel(opts.groups ?? 1, rng)
  const labelled = opts.labelled ?? true
  for (let attempt = 0; ; attempt++) {
    // Eigene Position und Achse zur Bedrohung
    const own = polar({ x: 0, y: 0 }, rng.int(1, 360), rng.int(15, 45))
    const axis = rng.int(1, 360)
    const range = rng.int(25, 55)
    const center = polar(own, axis, range)
    const dims = dimensions(label, rng)
    // Gemeinsamer Kurs: meist auf den Jäger zu
    const toOwn = (axis + 180) % 360
    const mode = rng.next()
    const baseTrack = mode < 0.6 ? toOwn + rng.int(-15, 15) : mode < 0.8 ? toOwn + rng.pick([-1, 1]) * rng.int(38, 52) : mode < 0.92 ? toOwn + rng.pick([-1, 1]) * rng.int(78, 100) : axis + rng.int(-25, 25)
    const names = labelled ? groupNames(label, axis) : Array.from({ length: groupCount(label) }, () => (label === 'single' ? 'single group' : 'group'))
    const groups: GeoGroup[] = offsets(label, dims).map(([along, lateral], i) => {
      const p = polar(polar(center, axis, along), axis + 90, lateral)
      const id: GroupId = opts.id === 'mixed' ? rng.pick(['hostile', 'bandit', 'bogey'] as const) : (opts.id ?? 'hostile')
      return {
        name: names[i],
        x: p.x,
        y: p.y,
        heading: ((Math.round(baseTrack + rng.int(-8, 8)) % 360) + 360) % 360 || 360,
        altFt: rng.int(5, 35) * 1000,
        size: rng.pick([1, 2, 2, 2, 3, 4]),
        id,
      }
    })
    // Alles muss auf den Schirm (Bullseye-Karte bis 80 NM)
    const fits = [own, ...groups].every((p) => distNm({ x: 0, y: 0 }, p) <= 78)
    // Grenzfälle vermeiden: Gruppen nicht zu nah am Jäger, Bullseye-Entfernungen nicht 0, kein
    // Aspektwinkel in einer Lücke zwischen zwei Klassen
    const sane = groups.every((g) => distNm(own, g) >= 12 && distNm({ x: 0, y: 0 }, g) >= 5 && !inAspectGap(aspectAngle(g, own)))
    if ((fits && sane) || attempt > 400) {
      const dists = groups.map((g) => distNm(own, g))
      // Eigene Teil-Würfel: Threat-Gruppe und Check-in-Punkt ändern nichts an den Würfen danach
      const extra = rng.fork('geo-extra')
      return {
        label,
        sepNm: firstDimension(label, dims.wide, dims.deep),
        wideNm: dims.wide,
        deepNm: dims.deep,
        labelled,
        own: { ...own, heading: axis },
        groups,
        nearest: dists.indexOf(Math.min(...dists)),
        threat: buildThreat(extra, own, axis, groups),
        ingress: buildIngress(extra, own, axis),
      }
    }
  }
}

const BULLS: Point = { x: 0, y: 0 }
const norm360 = (deg: number) => ((Math.round(deg) % 360) + 360) % 360 || 360

/**
 * Threat-Gruppe (ATP 3-52.4 IV-19.c und V-18): neu entdeckt, aus der Richtung der Bedrohung, 20–35 NM vor
 * dem Jäger – also innerhalb der Standard-Threat-Reichweite von 35 NM –, hot oder flank (sie kommt näher).
 */
function buildThreat(rng: Rng, own: Point, axis: number, groups: GeoGroup[]): GeoGroup {
  for (let attempt = 0; ; attempt++) {
    const bearing = axis + rng.int(-60, 60)
    const p = polar(own, bearing, rng.int(20, 35))
    const toOwn = bearing + 180
    const off = rng.chance(0.6) ? rng.int(-15, 15) : rng.pick([-1, 1]) * rng.int(35, 55)
    const g: GeoGroup = {
      name: 'threat group',
      x: p.x,
      y: p.y,
      heading: norm360(toOwn + off),
      altFt: rng.int(5, 35) * 1000,
      size: rng.pick([1, 2, 2, 3, 4]),
      id: 'hostile',
    }
    const asp = aspectAngle(g, own)
    const d = distNm(own, g)
    const ok =
      d >= 20 &&
      d <= 35 &&
      asp <= 60 &&
      !inAspectGap(asp) &&
      distNm(BULLS, g) >= 5 &&
      distNm(BULLS, g) <= 78 &&
      groups.every((o) => distNm(o, g) >= 8)
    if (ok || attempt > 200) return g
  }
}

/** Check-in-Punkt: 15–25 NM vor der Station, auf der eigenen Seite (Gegenrichtung der Bedrohungsachse ± 40°). */
function buildIngress(rng: Rng, own: Point, axis: number): Point {
  for (let attempt = 0; ; attempt++) {
    const p = polar(own, axis + 180 + rng.int(-40, 40), rng.int(15, 25))
    if ((distNm(BULLS, p) >= 5 && distNm(BULLS, p) <= 90) || attempt > 100) return p
  }
}

// ---------------------------------------------------------------------------
// Track im Picture
// ---------------------------------------------------------------------------

/**
 * Wie ein Picture den Track nennt (ATP 3-52.4 IV-6.b und IV-13.d):
 * - `none`: Picture mit Label, alle Gruppen hot – der Track gilt als angenommen und entfällt.
 * - `common`: Picture mit Label, alle Gruppen mit derselben Richtung (8er-Rose), nicht hot – einmal
 *   „track …“ direkt hinter Label und Maßen, bei keiner Gruppe einzeln.
 * - `each`: sonst Track je Gruppe (auch bei Gruppen ohne Bullseye). Core Information und eine einzelne Gruppe
 *   nennen den Track immer je Gruppe (Bullseye-Format: IV-6.a).
 *
 * „hot“ heißt hier: hot zum eigenen Flugzeug (Aspekt wie im BRAA). Das ist strenger als „hot zur Achse“ –
 * im Zweifel nennt die App den Track, statt ihn wegzulassen.
 */
export function pictureTrack(p: GeoPicture): { mode: 'none' | 'common' | 'each'; track?: string } {
  if (!p.labelled || p.groups.length < 2) return { mode: 'each' }
  if (p.groups.every((g) => aspectOf(g, p.own) === 'hot')) return { mode: 'none' }
  const tracks = new Set(p.groups.map((g) => cardinal(g.heading, 8)))
  if (tracks.size === 1) return { mode: 'common', track: [...tracks][0] }
  return { mode: 'each' }
}

/**
 * Abfangkurs (Cut-off) zu einer Gruppe: Der Jäger hält die Sichtlinie konstant (gleichbleibende Peilung,
 * schrumpfende Entfernung). Annahme: Die Gruppe fliegt mit 80 % der eigenen Geschwindigkeit. Dann ist
 * sin(Vorhalt) = 0,8 · sin(Kurs der Gruppe − Peilung).
 */
export function cutoffHeading(own: Point, g: GeoGroup, speedRatio = 0.8): number {
  const b = bearingDeg(own, g)
  const lead = (Math.asin(speedRatio * Math.sin(rad(g.heading - b))) * 180) / Math.PI
  return norm360(b + lead)
}

// ---------------------------------------------------------------------------
// Als Platzhalter-Wert
// ---------------------------------------------------------------------------

const COUNT_WORDS = ['', 'single', 'two', 'three']

function bullsValue(p: Point): Value {
  return bearingRangeValue(bearingDeg(BULLS, p), Math.round(distNm(BULLS, p)))
}

function braaValue(own: Point, g: Point): Value {
  return bearingRangeValue(bearingDeg(own, g), Math.round(distNm(own, g)))
}

function headingValue(h: number): Value {
  return { ...value(formatHeading(h), spokenHeading(h)), num: h }
}

/** Peilung und Entfernung als Wert „270/25“ (gesprochen „two seven zero, twenty-five“). */
function bearingRangeValue(b: number, r: number): Value {
  return {
    ...value(`${formatHeading(b)}/${r}`, `${spokenHeading(b)}, ${spokenWholeNumber(r)}`),
    fields: { bearing: { ...value(formatHeading(b), spokenHeading(b)), num: b }, range: { ...value(String(r), spokenWholeNumber(r)), num: r } },
  }
}

export interface GroupCallOptions {
  /** false: Die Gruppe steht im Picture hinter einer verankerten Gruppe – ohne Bullseye. Standard true. */
  anchored?: boolean
  /** false: Der Track steht nicht bei der Gruppe (alle hot oder einmal hinter dem Label). Standard true. */
  track?: boolean
}

/**
 * Eine Gruppe als Platzhalter-Wert. `anchored` = false: Die Gruppe steht im Picture hinter einer
 * verankerten Gruppe und wird nur mit Name, Höhe, ggf. Track und Identität genannt (ATP 3-52.4, Beispiel
 * „trail group twenty thousand, hostile“). `track` = false: Der Track fehlt im Call der Gruppe, weil er für
 * das ganze Picture gilt (siehe `pictureTrack`). Die Felder (bulls, braa, track …) gibt es trotzdem immer.
 */
export function groupValue(g: GeoGroup, own: Point, opts: GroupCallOptions = {}): Value {
  const anchored = opts.anchored ?? true
  const withTrack = opts.track ?? true
  const bulls = bullsValue(g)
  const braa = braaValue(own, g)
  const thousands = Math.round(g.altFt / 1000)
  // Kontakthöhen als ganze Zahlwörter („twenty-five thousand“), ATP 3-52.4
  const alt = { ...value(`${thousands} thousand`, spokenContactAltitude(g.altFt)), num: thousands * 1000 }
  const track = cardinal(g.heading, 8)
  const aspect = aspectOf(g, own)
  const heavy = g.size >= 3 ? ', heavy' : ''
  const trk = withTrack ? `track ${track}, ` : ''
  const callText = anchored ? `${g.name} bullseye ${bulls.text}, ${alt.text}, ${trk}${g.id}${heavy}` : `${g.name} ${alt.text}, ${trk}${g.id}${heavy}`
  const callSpoken = anchored ? `${g.name} bullseye ${bulls.spoken}, ${alt.spoken}, ${trk}${g.id}${heavy}` : `${g.name} ${alt.spoken}, ${trk}${g.id}${heavy}`
  const braaText = `BRAA ${braa.text}, ${alt.text}, ${aspect}, ${g.id}`
  const braaSpoken = `BRAA ${braa.spoken}, ${alt.spoken}, ${aspect}, ${g.id}`
  // Auf dem Abfangkurs bleibt die Peilung gleich und die Entfernung schrumpft; „braaLater“ = halbe Strecke
  const range = braa.fields!.range.num!
  const braaLater = bearingRangeValue(braa.fields!.bearing.num!, Math.max(5, Math.round(range / 2)))
  return value(callText, callSpoken, {
    name: value(g.name),
    bulls,
    braa,
    alt,
    /** Dieselbe Höhe als angels – nur für Freunde richtig (Distraktoren). */
    angels: { ...value(String(thousands), spokenAngels(thousands)), num: thousands },
    altFt: { ...value(formatAltitude(g.altFt), spokenContactAltitude(g.altFt)), num: g.altFt },
    track: value(track),
    heading: headingValue(g.heading),
    aspect: value(aspect),
    id: value(g.id),
    size: { ...value(String(g.size), spokenWholeNumber(g.size)), num: g.size },
    heavy: value(g.size >= 3 ? 'heavy' : ''),
    anchored: value(anchored ? 'anchored' : ''),
    call: value(callText, callSpoken),
    braaCall: value(braaText, braaSpoken),
    cutoff: headingValue(cutoffHeading(own, g)),
    braaLater,
  })
}

/**
 * Die Maße hinter dem Label (ATP 3-52.4): azimuth/range eine Zahl, ab drei Gruppen „[n] wide“ bzw.
 * „[n] deep“ – wall nur wide, ladder nur deep, vic erst deep dann wide, champagne erst wide dann deep.
 */
function labelMeasures(p: GeoPicture, num: (n: number) => string): string {
  const wide = `${num(p.wideNm)} wide`
  const deep = `${num(p.deepNm)} deep`
  switch (p.label) {
    case 'single':
      return ''
    case 'azimuth':
    case 'range':
      return num(p.sepNm)
    case 'wall':
      return wide
    case 'ladder':
      return deep
    case 'vic':
      return `${deep}, ${wide}`
    case 'champagne':
      return `${wide}, ${deep}`
  }
}

export function pictureValue(p: GeoPicture): Value {
  const n = p.groups.length
  const single = n === 1
  const label = (num: (n: number) => string) =>
    single ? 'single group' : p.labelled ? `${COUNT_WORDS[n]} groups ${p.label} ${labelMeasures(p, num)}` : `${COUNT_WORDS[n]} groups`
  const labelText = label(String)
  const labelSpoken = label(spokenWholeNumber)
  // Track nach ATP 3-52.4 IV-6.b/IV-13.d: entfällt (alle hot), einmal hinter dem Label (gemeinsam) oder je Gruppe
  const trk = pictureTrack(p)
  const trackText = trk.mode === 'common' ? `track ${trk.track}` : ''
  const headText = trackText ? `${labelText}, ${trackText}` : labelText
  const headSpoken = trackText ? `${labelSpoken}, ${trackText}` : labelSpoken
  const groups = p.groups.map((g, i) => groupValue(g, p.own, { anchored: !p.labelled || isAnchored(p.label, i), track: trk.mode === 'each' }))
  const callText = single ? groups[0].text : `${headText}, ${groups.map((g) => g.text).join('; ')}`
  const callSpoken = single ? groups[0].spoken : `${headSpoken}, ${groups.map((g) => g.spoken).join('; ')}`
  const fields: Record<string, Value> = {
    label: value(labelText, labelSpoken),
    /** Label und – bei gemeinsamem Track – „track …“: so beginnt das Picture nach dem Rufzeichen. */
    head: value(headText, headSpoken),
    /** „track south“, wenn der Track einmal für das ganze Picture gilt, sonst leer. */
    track: value(trackText),
    trackMode: value(trk.mode),
    labelKind: value(p.labelled ? p.label : 'core'),
    count: { ...value(String(n), spokenWholeNumber(n)), num: n },
    sep: { ...value(String(p.sepNm), spokenWholeNumber(p.sepNm)), num: p.sepNm },
    wide: { ...value(String(p.wideNm), spokenWholeNumber(p.wideNm)), num: p.wideNm },
    deep: { ...value(String(p.deepNm), spokenWholeNumber(p.deepNm)), num: p.deepNm },
    call: value(callText, callSpoken),
    own: value('own', 'own', {
      bulls: bullsValue(p.own),
      heading: headingValue(p.own.heading),
    }),
    near: groups[p.nearest],
  }
  if (p.threat) fields.threat = groupValue(p.threat, p.own)
  if (p.ingress) fields.ingress = bullsValue(p.ingress)
  groups.forEach((g, i) => (fields[`g${i + 1}`] = g))
  return { ...value(callText, callSpoken, fields), data: p }
}
