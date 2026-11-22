/**
 * Einsatzraum-Generator für CAS (Spur C, Wunsch C-F1).
 *
 * Ein 9-Line ist nur glaubwürdig, wenn alle Zeilen aus einer Lage folgen. Deshalb würfelt der Generator eine
 * schematische Lage – Ziel, Freundkräfte mit JTAC, Bedrohung, IP, Gelände, Tageszeit, Waffe – und rechnet daraus
 * alle Funkwerte: Kurs und Distanz vom IP (Line 2/3), Zielhöhe (4), MGRS (6), Markierung (7), Freunde (8),
 * Egress (9), Final Attack Heading, Laser-Target Line, Mindesthöhe, IN- und OFF-Richtung.
 *
 * Koordinaten in Metern in einem fiktiven 100-km-MGRS-Quadrat (x nach Osten, y nach Norden), Kurse in Grad
 * rechtweisend. Gesprochene Kurse (Line 2, Final Attack Heading, Laser-Target Line) sind missweisend: rechtweisend
 * minus Missweisung des Einsatzraums (Ost positiv).
 *
 * Plausibilitätsregeln (geprüft in cas.test.ts):
 * - Heading und Distance passen exakt zur Lage, Line 2 liegt im Final-Attack-Heading-Sektor.
 * - Der Sektor zeigt nie auf die Freunde zu oder von ihnen weg (Anflug etwa parallel zu ihrer Linie).
 * - Offset und Egress führen von den Freunden weg, Egress auch von der Bedrohung.
 * - Bei Laser liegt der Sektor außerhalb von ±20° um die Laser-Target-Line und ihre Gegenrichtung (⚠ Geometrie
 *   vereinfacht: nur die Sicherheitszone, keine optimale Angriffszone).
 * - Gleicher Seed, gleiche Lage.
 */
import type { CasPools, CasTarget, CasThreat, CasWeapon } from '../content/schema'
import type { Rng } from './rng'
import { value, type Value } from './template'
import {
  cardinal,
  formatHeading,
  formatMgrs,
  formatTime,
  spellDigits,
  spellLetters,
  spokenAngels,
  spokenHeading,
  spokenMgrs,
  spokenWholeNumber,
} from '../phraseology/spoken'

export const NM = 1852

export interface Pt {
  x: number
  y: number
}

export type Terrain = 'flat' | 'hills' | 'mountains'
export type MarkKind = 'laser' | 'wp' | 'ir' | 'none'

export interface CasOptions {
  control?: 1 | 2 | 3 | 'any'
  terrain?: Terrain | 'any'
  time?: 'day' | 'night' | 'any'
  mark?: MarkKind | 'any'
  dangerClose?: 'yes' | 'no' | 'any'
  aircraft?: string
  gridDigits?: 6 | 8 | 10
}

export interface CasArea {
  terrain: Terrain
  night: boolean
  control: 1 | 2 | 3
  /** Missweisung des Einsatzraums in Grad, Ost positiv. */
  magVar: number
  /** Fiktives Zonenfeld, z. B. "37T" (steht nicht im 9-Line, nur auf dem Kneeboard). */
  zone: string
  /** 100-km-Quadrat, z. B. "NK". */
  square: string
  gridDigits: 6 | 8 | 10
  target: Pt & { elevFt: number; desc: CasTarget; grid: string }
  /** Freundkräfte, bei ihnen steht der JTAC. brgTrue = Richtung vom Ziel zu den Freunden. */
  friend: Pt & { brgTrue: number; distM: number; dir: string; grid: string }
  threat: Pt & { brgTrue: number; distKm: number; dir: string; type: CasThreat }
  ip: Pt & { name: string; distNm: number }
  /** Kurs vom IP zum Ziel, rechtweisend bzw. missweisend (Line 2). */
  hdgTrue: number
  hdgMag: number
  offset: 'left' | 'right'
  /** Final-Attack-Heading-Sektor, missweisend, im Uhrzeigersinn von `fromMag` bis `toMag`. */
  fah: { centerMag: number; fromMag: number; toMag: number }
  egress: Pt & { brgTrue: number; dir: string; to: string }
  mark: MarkKind
  laserCode: string
  /** Laser-Target-Line: Kurs vom JTAC zum Ziel, missweisend. */
  ltlMag: number
  weapon: CasWeapon
  attack: 'BOT' | 'BOC'
  dangerClose: boolean
  dangerCloseM: number
  /** Mindesthöhe aus der Bedrohung in Tausend Fuß (angels). */
  minAlt: number
  /** Höhe beim Check-in und im Keyhole, 1–3 über der Mindesthöhe (angels). */
  holdAlt: number
  /** Lokalzeit in Minuten seit Mitternacht. */
  now: number
  tot: number
  /** Richtung, aus der du anfliegst („IN from the west“), und Richtung beim Abflug („OFF north“). */
  inDir: string
  offDir: string
  keyhole: { letter: 'Alfa' | 'Bravo' | 'Charlie' | 'Delta'; distNm: number }
  /** Line 6 mit genau einem Zahlendreher (für Readback-Übungen). */
  gridWrong: string
  /** Initialen des Bodenkommandeurs (bei Danger Close), z. B. "AK". */
  initials: string
}

// ---------------------------------------------------------------------------
// Geometrie
// ---------------------------------------------------------------------------

export const norm360 = (deg: number) => ((deg % 360) + 360) % 360

/** Kurs als 1–360 (0 wird 360), wie im Funk. */
export const heading360 = (deg: number) => norm360(Math.round(deg)) || 360

export function angleDiff(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b))
  return d > 180 ? 360 - d : d
}

export function pointAt(p: Pt, brgDeg: number, distM: number): Pt {
  const r = (brgDeg * Math.PI) / 180
  return { x: p.x + distM * Math.sin(r), y: p.y + distM * Math.cos(r) }
}

export function bearing(from: Pt, to: Pt): number {
  return norm360((Math.atan2(to.x - from.x, to.y - from.y) * 180) / Math.PI)
}

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Liegt der Kurs im Sektor von `from` bis `to` (im Uhrzeigersinn)? */
export function inSector(hdg: number, from: number, to: number): boolean {
  const width = norm360(to - from)
  return norm360(hdg - from) <= width + 1e-9
}

/** Kurse eines Sektors in 1°-Schritten (für Prüfungen). */
export function sectorHeadings(from: number, to: number): number[] {
  const width = norm360(to - from)
  return Array.from({ length: Math.round(width) + 1 }, (_, i) => norm360(from + i))
}

// ---------------------------------------------------------------------------
// Würfeln
// ---------------------------------------------------------------------------

function roll(rng: Rng, min: number, max: number, step: number): number {
  const n = Math.max(0, Math.floor((max - min) / step + 1e-9))
  const v = min + rng.int(0, n) * step
  const dec = String(step).includes('.') ? String(step).split('.')[1].length : 0
  return Number(v.toFixed(dec))
}

/** Gültiger Laser-Code: erste Ziffer 1, zweite 1–7, dritte und vierte 1–8 (1111–1788). */
export function rollLaserCode(rng: Rng): string {
  return `1${rng.int(1, 7)}${rng.int(1, 8)}${rng.int(1, 8)}`
}

export function isValidLaserCode(code: string): boolean {
  return /^1[1-7][1-8][1-8]$/.test(code)
}

const SQUARE_COLS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const SQUARE_ROWS = 'ABCDEFGHJKLMNPQRSTUV'
const ZONE_BANDS = 'CDEFGHJKLMNPQRSTUVWX'

export function rollSquare(rng: Rng): string {
  return rng.pick([...SQUARE_COLS]) + rng.pick([...SQUARE_ROWS])
}

/** Ziffern einer MGRS-Koordinate im Quadrat (x, y in Metern 0–99.999), z. B. 8 Stellen = 10 m genau. */
export function gridDigitsOf(p: Pt, digits: 6 | 8 | 10): string {
  const half = digits / 2
  const unit = 10 ** (5 - half)
  const part = (v: number) => String(Math.floor(Math.min(99_999, Math.max(0, v)) / unit)).padStart(half, '0')
  return part(p.x) + part(p.y)
}

/** Genau ein Fehler in einer Ziffernfolge: zwei Nachbarziffern vertauscht oder eine Ziffer um eins daneben. */
export function mutateDigits(digits: string, rng: Rng): string {
  const half = digits.length / 2
  for (let attempt = 0; attempt < 20; attempt++) {
    const chars = [...digits]
    const i = rng.int(0, chars.length - 1)
    const j = i + 1
    if (rng.chance(0.5) && j < chars.length && Math.floor(i / half) === Math.floor(j / half) && chars[i] !== chars[j]) {
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    } else {
      chars[i] = String((Number(chars[i]) + (rng.chance(0.5) ? 1 : 9)) % 10)
    }
    const out = chars.join('')
    if (out !== digits) return out
  }
  return digits.slice(0, -1) + String((Number(digits.at(-1)) + 1) % 10)
}

const ELEVATION: Record<Terrain, [number, number]> = { flat: [0, 800], hills: [600, 3000], mountains: [2500, 7500] }
const KEYHOLE = [
  { letter: 'Alfa', deg: 0 },
  { letter: 'Bravo', deg: 90 },
  { letter: 'Charlie', deg: 180 },
  { letter: 'Delta', deg: 270 },
] as const

export function buildCasArea(rng: Rng, opts: CasOptions, pools: CasPools): CasArea {
  const terrain: Terrain = !opts.terrain || opts.terrain === 'any' ? rng.pick(['flat', 'hills', 'mountains'] as const) : opts.terrain
  const night = !opts.time || opts.time === 'any' ? rng.chance(0.3) : opts.time === 'night'
  const control = !opts.control || opts.control === 'any' ? (rng.int(1, 3) as 1 | 2 | 3) : opts.control
  const magVar = rng.int(-4, 12)
  const zone = `${rng.int(10, 59)}${rng.pick([...ZONE_BANDS])}`
  const square = rollSquare(rng)
  const gridDigits = opts.gridDigits ?? 8
  const dcMode = opts.dangerClose ?? 'no'

  // Ziel
  const T: Pt = { x: rng.int(15_000, 85_000), y: rng.int(15_000, 85_000) }
  const elevFt = roll(rng, ...ELEVATION[terrain], 5)
  const desc = rng.pick(pools.targets)

  // Waffe: passend zum Flugzeug; Danger Close nur mit Waffen, deren Schwelle Platz für Abstände ab 200 m lässt
  const forAircraft = pools.weapons.filter((w) => w.aircraft.includes(opts.aircraft ?? 'a10'))
  let weapons = forAircraft.length ? forAircraft : pools.weapons
  if (dcMode === 'yes') {
    const wide = weapons.filter((w) => pools.dangerClose[w.class] >= 400)
    if (wide.length) weapons = wide
  }
  const weapon = rng.pick(weapons)
  const threshold = pools.dangerClose[weapon.class]

  // Freundkräfte mit JTAC: Richtung frei, Abstand in 100-m-Schritten
  const [dMin, dMax] =
    dcMode === 'yes' ? [Math.min(200, threshold - 100), threshold - 100] : dcMode === 'no' ? [Math.max(600, threshold + 100), 3000] : [300, 3000]
  const friendDist = roll(rng, dMin, Math.max(dMin, dMax), 100)
  const friendBrg = rng.int(0, 359)
  const F = pointAt(T, friendBrg, friendDist)

  // Bedrohung auf der Feindseite
  const threatBrg = norm360(friendBrg + 180 + rng.int(-60, 60))
  const threatKm = rng.int(2, 6)
  const TH = pointAt(T, threatBrg, threatKm * 1000)
  const threatType = rng.pick(pools.threats)

  // Angriffsachse quer zur Linie Ziel–Freunde; der IP liegt auf der Seite, die weiter von der Bedrohung weg ist
  const axes = [norm360(friendBrg + 90), norm360(friendBrg - 90)]
  const away = axes.map((a) => angleDiff(a + 180, threatBrg))
  const axis = Math.abs(away[0] - away[1]) < 10 ? rng.pick(axes) : away[0] > away[1] ? axes[0] : axes[1]
  const hdgTrue = norm360(axis + rng.int(-12, 12))
  const ipDist = roll(rng, 5, 15, 0.1)
  const ipName = rng.pick(pools.ips)
  const IP = pointAt(T, hdgTrue + 180, ipDist * NM)
  const hdgMag = heading360(bearing(IP, T) - magVar)

  // Final Attack Heading: 60° breiter Sektor um die Achse, auf 10° gerundet (missweisend)
  const centerMag = heading360(Math.round((axis - magVar) / 10) * 10)
  const fah = { centerMag, fromMag: heading360(centerMag - 30), toMag: heading360(centerMag + 30) }

  // Offset: zur Seite weg von den Freunden
  const h = { x: Math.sin((hdgTrue * Math.PI) / 180), y: Math.cos((hdgTrue * Math.PI) / 180) }
  const cross = h.x * (F.y - T.y) - h.y * (F.x - T.x)
  const offset: 'left' | 'right' = cross < 0 ? 'left' : 'right'

  // Egress: Himmelsrichtung, die am weitesten von Freunden und Bedrohung wegführt
  const dirs = Array.from({ length: 8 }, (_, i) => i * 45)
  const score = (d: number) => Math.min(angleDiff(d, friendBrg), angleDiff(d, threatBrg))
  const best = Math.max(...dirs.map(score))
  const egressBrg = rng.pick(dirs.filter((d) => score(d) >= Math.min(best, 80)))
  const egressTo = rng.pick(pools.ips.filter((n) => n !== ipName))
  const EG = pointAt(T, egressBrg, rng.int(6, 10) * NM)

  // Markierung: bei Tag Laser, Willie Pete oder keine; bei Nacht Laser, IR-Pointer (sparkle) oder keine
  const mark: MarkKind =
    opts.mark && opts.mark !== 'any'
      ? opts.mark
      : night
        ? rng.pick(['laser', 'laser', 'laser', 'laser', 'laser', 'ir', 'ir', 'ir', 'none', 'none'] as const)
        : rng.pick(['laser', 'laser', 'laser', 'laser', 'wp', 'wp', 'wp', 'none', 'none', 'none'] as const)
  const laserCode = rollLaserCode(rng)
  const ltlMag = heading360(bearing(F, T) - magVar)

  // BOT oder BOC: Entscheidung des JTAC, z. B. BOC gegen Infanterie wegen der Splitterwirkung (JTG)
  const boc = (desc.kind === 'infantry' && weapon.class === 'bomb' && rng.chance(0.7)) || (weapon.guidance === 'gps' && rng.chance(0.5))

  // Zeit: Tag 07–17 Uhr, Nacht 20–04 Uhr; TOT 5–15 Minuten später
  const now = night ? roll(rng, 20 * 60, 28 * 60, 5) % 1440 : roll(rng, 7 * 60, 17 * 60, 5)
  const tot = (now + roll(rng, 5, 15, 5)) % 1440

  // Keyhole: der Haltepunkt, der am weitesten von der Bedrohung weg liegt
  const kh = [...KEYHOLE].sort((a, b) => angleDiff(b.deg, threatBrg) - angleDiff(a.deg, threatBrg))[0]
  const targetGrid = gridDigitsOf(T, gridDigits)
  const letters = 'ABCDEFGHJKLMNPRSTW'

  return {
    terrain,
    night,
    control,
    magVar,
    zone,
    square,
    gridDigits,
    target: { ...T, elevFt, desc, grid: targetGrid },
    friend: { ...F, brgTrue: friendBrg, distM: friendDist, dir: cardinal(friendBrg), grid: gridDigitsOf(F, gridDigits) },
    threat: { ...TH, brgTrue: threatBrg, distKm: threatKm, dir: cardinal(threatBrg), type: threatType },
    ip: { ...IP, name: ipName, distNm: ipDist },
    hdgTrue,
    hdgMag,
    offset,
    fah,
    egress: { ...EG, brgTrue: egressBrg, dir: cardinal(egressBrg), to: egressTo },
    mark,
    laserCode,
    ltlMag,
    weapon,
    attack: boc ? 'BOC' : 'BOT',
    dangerClose: friendDist < threshold,
    dangerCloseM: threshold,
    minAlt: Math.ceil((elevFt + threatType.agl) / 1000),
    now,
    tot,
    // aus dem missweisenden Kurs (Line 2), den der Pilot kennt – nicht aus dem rechtweisenden
    inDir: cardinal(hdgMag + 180),
    offDir: cardinal(egressBrg),
    keyhole: { letter: kh.letter, distNm: rng.int(6, 15) },
    gridWrong: mutateDigits(targetGrid, rng),
    initials: rng.pick([...letters]) + rng.pick([...letters]),
    holdAlt: Math.ceil((elevFt + threatType.agl) / 1000) + rng.int(1, 3),
  }
}

// ---------------------------------------------------------------------------
// Werte für Platzhalter ({cas.hdg}, {cas.grid|spoken} …)
// ---------------------------------------------------------------------------

const yes = (on: boolean) => (on ? value('yes') : value(''))
const num = (v: Value, n: number): Value => ({ ...v, num: n })
const timeValue = (m: number) => {
  const t = formatTime(Math.floor(m / 60), m % 60)
  return num(value(t, spellDigits(t)), m)
}
const headingValue = (h: number) => num(value(formatHeading(h), spokenHeading(h)), h)
const OPPOSITE = (dir: string) => cardinal(['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'].indexOf(dir) * 45 + 180)

const MARK_TEXT: Record<MarkKind, (code: string) => Value> = {
  laser: (code) => value(`laser ${code}`, `laser ${spellDigits(code)}`),
  wp: () => value('Willie Pete'),
  ir: () => value('sparkle'),
  none: () => value('none'),
}
const TERRAIN_DE: Record<Terrain, string> = { flat: 'flaches Gelände', hills: 'Hügelland', mountains: 'Gebirge' }

/** Der Einsatzraum als Platzhalter-Wert. Felder siehe content/README.md, Abschnitt „Einsatzraum“. */
export function casAreaValue(a: CasArea): Value {
  const grid = (digits: string) => value(formatMgrs(a.square, digits), spokenMgrs(a.square, digits), {
    square: value(a.square, spellLetters(a.square)),
    digits: value(digits, spellDigits(digits)),
  })
  const meters = (m: number) => num(value(String(m), spokenWholeNumber(m)), m)
  const dirValue = (d: string) => value(d, d, { opposite: value(OPPOSITE(d)) })
  const tgtFromFriendDir = cardinal(bearing(a.friend, a.target))
  const t = a.target.desc
  const w = a.weapon
  const fields: Record<string, Value> = {
    // 9-Line
    ip: value(a.ip.name),
    hdg: headingValue(a.hdgMag),
    offset: value(a.offset),
    dist: num(value(a.ip.distNm.toFixed(1), spellDigits(a.ip.distNm.toFixed(1))), a.ip.distNm),
    elev: num(value(String(a.target.elevFt), spellDigits(String(a.target.elevFt))), a.target.elevFt),
    target: value(t.text, t.spoken ?? t.text, {
      count: num(value(String(t.count), spokenWholeNumber(t.count)), t.count),
      keyword: value(t.keyword),
      bda: value(t.bda),
    }),
    grid: grid(a.target.grid),
    gridWrong: grid(a.gridWrong),
    zone: value(a.zone, a.zone),
    mark: value(MARK_TEXT[a.mark](a.laserCode).text, MARK_TEXT[a.mark](a.laserCode).spoken, { kind: value(a.mark) }),
    code: num(value(a.laserCode, spellDigits(a.laserCode)), Number(a.laserCode)),
    friend: value(`${a.friend.dir} ${a.friend.distM}`, `${a.friend.dir} ${spokenWholeNumber(a.friend.distM)}`, {
      dir: dirValue(a.friend.dir),
      dist: meters(a.friend.distM),
      grid: grid(a.friend.grid),
    }),
    egress: value(`${a.egress.dir} to ${a.egress.to}`, `${a.egress.dir} to ${a.egress.to}`, {
      dir: dirValue(a.egress.dir),
      to: value(a.egress.to),
    }),
    // Remarks und Restriktionen
    fah: value(`${formatHeading(a.fah.fromMag)}-${formatHeading(a.fah.toMag)}`, `${spokenHeading(a.fah.fromMag)} to ${spokenHeading(a.fah.toMag)}`, {
      from: headingValue(a.fah.fromMag),
      to: headingValue(a.fah.toMag),
    }),
    ltl: headingValue(a.ltlMag),
    threat: value(a.threat.type.name, a.threat.type.spoken ?? a.threat.type.name, {
      dir: dirValue(a.threat.dir),
      dist: num(value(String(a.threat.distKm), spokenWholeNumber(a.threat.distKm)), a.threat.distKm),
    }),
    minAlt: num(value(String(a.minAlt), spokenAngels(a.minAlt)), a.minAlt),
    hold: num(value(String(a.holdAlt), spokenAngels(a.holdAlt)), a.holdAlt),
    tot: timeValue(a.tot),
    now: timeValue(a.now),
    initials: value(a.initials, spellLetters(a.initials)),
    // Game Plan
    ctrl: num(value(String(a.control), spokenWholeNumber(a.control)), a.control),
    attack: value(a.attack === 'BOT' ? 'bomb on target' : 'bomb on coordinate', undefined, { short: value(a.attack) }),
    weapon: value(w.name, w.spoken ?? w.name, { effect: value(w.effect), call: value(w.call) }),
    // Angriff
    inDir: dirValue(a.inDir),
    offDir: dirValue(a.offDir),
    keyhole: value(`${a.keyhole.letter} ${a.keyhole.distNm}`, `${a.keyhole.letter} ${spellDigits(String(a.keyhole.distNm))}`, {
      letter: value(a.keyhole.letter),
      dist: num(value(String(a.keyhole.distNm), spellDigits(String(a.keyhole.distNm))), a.keyhole.distNm),
    }),
    // 5-Line: Ziel von den Freunden aus
    fromFriend: value(`${tgtFromFriendDir} ${a.friend.distM}`, `${tgtFromFriendDir} ${spokenWholeNumber(a.friend.distM)}`, {
      dir: dirValue(tgtFromFriendDir),
      dist: meters(a.friend.distM),
    }),
    // Lage in Worten (für Situationstexte)
    terrain: value(TERRAIN_DE[a.terrain]),
    daytime: value(a.night ? 'Nacht' : 'Tag'),
    magVar: value(`${Math.abs(a.magVar)}° ${a.magVar < 0 ? 'W' : 'E'}`),
    // Schalter für `when:` – „yes“ oder leer
    laser: yes(a.mark === 'laser'),
    wp: yes(a.mark === 'wp'),
    ir: yes(a.mark === 'ir'),
    nomark: yes(a.mark === 'none'),
    dc: yes(a.dangerClose),
    night: yes(a.night),
    day: yes(!a.night),
    type1: yes(a.control === 1),
    type2: yes(a.control === 2),
    type3: yes(a.control === 3),
    bot: yes(a.attack === 'BOT'),
    /** Bomben: nur dann nennt der Game Plan BOT oder BOC. */
    bomb: yes(a.weapon.class === 'bomb'),
    boc: yes(a.attack === 'BOC'),
  }
  return { ...value('Einsatzraum', 'area', fields), data: a }
}
