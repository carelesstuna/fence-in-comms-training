/**
 * 9-Line- und 5-Line-Decoder (Wunsch C-F3): Felder aus dem Einsatzraum und ihre Prüfung.
 *
 * Jede Zeile hat ihre eigene Prüfart mit Toleranz: Kurse und Höhen genau, Distanz ±0,1 NM, Koordinate genau
 * (ein einzelner Zahlendreher gibt halbe Punkte), Richtungen als Wort oder Abkürzung (N, SW …), Zielbeschreibung
 * über das Stichwort. Geschrieben wird wie auf dem Kneeboard: Ziffern oder Zahlwörter, Komma oder Punkt.
 */
import type { NineLineFieldKey } from '../content/schema'
import type { CasArea, MarkKind } from '../random/cas'
import { angleDiff, bearing } from '../random/cas'
import { normalizeTokens } from '../phraseology/normalize'
import { cardinal, CARDINAL8, formatHeading, formatMgrs, formatTime, PHONETIC_WORDS } from '../phraseology/spoken'
import { toItems, type CallScore } from './score'

export type FieldKind = 'name' | 'heading-offset' | 'nm' | 'elevation' | 'target' | 'mgrs' | 'mark' | 'dir-dist' | 'egress' | 'sector' | 'heading' | 'time'

export interface NineLineWant {
  names?: string[]
  num?: number
  num2?: number
  side?: 'left' | 'right'
  dir?: string
  /** Kompakte Koordinate, z. B. "NK12345678". */
  grid?: string
  keywords?: string[]
  count?: number
  mark?: MarkKind
  code?: string
  /** Name des Egress-Punkts (darf fehlen). */
  to?: string
}

export interface NineLineField {
  /** "1" … "9", "fah", "ltl", "tot" */
  key: string
  /** z. B. "Line 4 · Target Elevation" */
  label: string
  /** Was in die Zeile gehört (deutsch). */
  hint: string
  placeholder: string
  kind: FieldKind
  /** Musterlösung, wie man sie aufschreibt. */
  expected: string
  want: NineLineWant
}

export interface FieldCheck {
  ok: boolean
  /** Halb richtig, z. B. Kurs stimmt, Offset fehlt. */
  near: boolean
  note?: string
}

// ---------------------------------------------------------------------------
// Felder
// ---------------------------------------------------------------------------

const DEFAULT_KEYS: Record<'nineline' | 'fiveline', NineLineFieldKey[]> = {
  nineline: [1, 2, 3, 4, 5, 6, 7, 8, 9, 'fah', 'ltl'],
  fiveline: [1, 2, 3, 4, 5],
}

const markText = (a: CasArea) =>
  a.mark === 'laser' ? `laser ${a.laserCode}` : a.mark === 'wp' ? 'Willie Pete' : a.mark === 'ir' ? 'sparkle' : 'none'

/**
 * Formularfelder für einen Einsatzraum. Ohne `keys` alle des Formats; die Laser-Target-Line nur, wenn mit Laser
 * markiert wird. `observer` ist beim 5-Line das Rufzeichen des JTAC (Line 1).
 */
export function nineLineFields(a: CasArea, format: 'nineline' | 'fiveline', keys?: readonly NineLineFieldKey[], observer = 'JTAC'): NineLineField[] {
  const list = (keys ?? DEFAULT_KEYS[format]).filter((k) => !(k === 'ltl' && a.mark !== 'laser' && !keys))
  return list.map((k) => (format === 'fiveline' ? fiveLineField(a, k, observer) : nineLineField(a, k)))
}

function nineLineField(a: CasArea, key: NineLineFieldKey): NineLineField {
  const grid = a.square + a.target.grid
  switch (key) {
    case 1:
      return { key: '1', label: 'Line 1 · IP', hint: 'Startpunkt des Anflugs', placeholder: 'Name', kind: 'name', expected: a.ip.name, want: { names: [a.ip.name] } }
    case 2:
      return {
        key: '2',
        label: 'Line 2 · Heading / Offset',
        hint: 'Kurs vom IP zum Ziel (missweisend) und Seite des Versatzes',
        placeholder: 'Kurs + Seite',
        kind: 'heading-offset',
        expected: `${formatHeading(a.hdgMag)} offset ${a.offset}`,
        want: { num: a.hdgMag, side: a.offset },
      }
    case 3:
      return { key: '3', label: 'Line 3 · Distance', hint: 'vom IP zum Ziel in NM', placeholder: 'NM', kind: 'nm', expected: a.ip.distNm.toFixed(1), want: { num: a.ip.distNm } }
    case 4:
      return { key: '4', label: 'Line 4 · Target Elevation', hint: 'Zielhöhe in ft MSL', placeholder: 'Fuß', kind: 'elevation', expected: String(a.target.elevFt), want: { num: a.target.elevFt } }
    case 5:
      return {
        key: '5',
        label: 'Line 5 · Target Description',
        hint: 'was und wie viele',
        placeholder: 'Was, wie viele',
        kind: 'target',
        expected: a.target.desc.text,
        want: { keywords: [a.target.desc.keyword, ...a.target.desc.alt], count: a.target.desc.count },
      }
    case 6:
      return {
        key: '6',
        label: 'Line 6 · Target Location',
        hint: 'MGRS: Quadrat und Ziffern',
        placeholder: 'Quadrat + Ziffern',
        kind: 'mgrs',
        expected: formatMgrs(a.square, a.target.grid),
        want: { grid },
      }
    case 7:
      return { key: '7', label: 'Line 7 · Mark', hint: 'Art der Markierung, bei Laser der Code', placeholder: 'Art (+ Code)', kind: 'mark', expected: markText(a), want: { mark: a.mark, code: a.laserCode } }
    case 8:
      return {
        key: '8',
        label: 'Line 8 · Friendlies',
        hint: 'Richtung und Abstand vom Ziel zu den Freunden (m)',
        placeholder: 'Richtung + Meter',
        kind: 'dir-dist',
        expected: `${a.friend.dir} ${a.friend.distM}`,
        want: { dir: a.friend.dir, num: a.friend.distM },
      }
    case 9:
      return {
        key: '9',
        label: 'Line 9 · Egress',
        hint: 'wohin nach dem Angriff',
        placeholder: 'Richtung',
        kind: 'egress',
        expected: `${a.egress.dir} to ${a.egress.to}`,
        want: { dir: a.egress.dir, to: a.egress.to },
      }
    case 'fah':
      return {
        key: 'fah',
        label: 'Remarks · Final Attack Heading',
        hint: 'erlaubter Kurssektor beim Angriff, von – bis',
        placeholder: 'von – bis',
        kind: 'sector',
        expected: `${formatHeading(a.fah.fromMag)}-${formatHeading(a.fah.toMag)}`,
        want: { num: a.fah.fromMag, num2: a.fah.toMag },
      }
    case 'ltl':
      return { key: 'ltl', label: 'Remarks · Laser-Target Line', hint: 'Kurs vom Laser zum Ziel', placeholder: 'Kurs', kind: 'heading', expected: formatHeading(a.ltlMag), want: { num: a.ltlMag } }
    default: {
      const t = formatTime(Math.floor(a.tot / 60), a.tot % 60)
      return { key: 'tot', label: 'Remarks · Time on Target', hint: 'Uhrzeit des Einschlags', placeholder: 'Uhrzeit', kind: 'time', expected: t, want: { num: Number(t) } }
    }
  }
}

function fiveLineField(a: CasArea, key: NineLineFieldKey, observer: string): NineLineField {
  const fromFriend = cardinal(bearing(a.friend, a.target))
  switch (key) {
    case 1:
      return { key: '1', label: 'Line 1 · Observer / Warning Order', hint: 'wer den Brief gibt', placeholder: 'Rufzeichen', kind: 'name', expected: observer, want: { names: [observer] } }
    case 2:
      return {
        key: '2',
        label: 'Line 2 · Friendly Location',
        hint: 'MGRS der eigenen Leute',
        placeholder: 'Quadrat + Ziffern',
        kind: 'mgrs',
        expected: formatMgrs(a.square, a.friend.grid),
        want: { grid: a.square + a.friend.grid },
      }
    case 3:
      return {
        key: '3',
        label: 'Line 3 · Target Location',
        hint: 'Richtung und Abstand von den Freunden zum Ziel (m)',
        placeholder: 'Richtung + Meter',
        kind: 'dir-dist',
        expected: `${fromFriend} ${a.friend.distM}`,
        want: { dir: fromFriend, num: a.friend.distM },
      }
    case 4:
      return {
        key: '4',
        label: 'Line 4 · Target Description / Mark',
        hint: 'was und wie viele',
        placeholder: 'Was, wie viele',
        kind: 'target',
        expected: a.target.desc.text,
        want: { keywords: [a.target.desc.keyword, ...a.target.desc.alt], count: a.target.desc.count },
      }
    default:
      return {
        key: '5',
        label: 'Line 5 · Remarks / Restrictions',
        hint: 'erlaubter Angriffssektor, von – bis',
        placeholder: 'von – bis',
        kind: 'sector',
        expected: `${formatHeading(a.fah.fromMag)}-${formatHeading(a.fah.toMag)}`,
        want: { num: a.fah.fromMag, num2: a.fah.toMag },
      }
  }
}

// ---------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------

/** Zahlen in einer Eingabe; Bindestriche, „to“ und „bis“ trennen wie Kommas. */
function numbers(input: string): number[] {
  const text = input
    .replace(/\s*(?:[-–—]|\bto\b|\bbis\b)\s*/gi, ',')
    // Ziffernblöcke mit Leerzeichen dazwischen sind getrennte Zahlen („360 060“)
    .replace(/(\d)\s+(?=\d)/g, '$1,')
  return toItems(text).flatMap((it) => (it.kind === 'num' ? [it.n] : []))
}

const DIRS: Record<string, string> = {
  n: 'north', north: 'north', nord: 'north', norden: 'north',
  ne: 'northeast', northeast: 'northeast', nordost: 'northeast', nordosten: 'northeast',
  e: 'east', east: 'east', ost: 'east', osten: 'east',
  se: 'southeast', southeast: 'southeast', südost: 'southeast', suedost: 'southeast', südosten: 'southeast',
  s: 'south', south: 'south', süd: 'south', sued: 'south', süden: 'south', sueden: 'south',
  sw: 'southwest', southwest: 'southwest', südwest: 'southwest', suedwest: 'southwest', südwesten: 'southwest',
  w: 'west', west: 'west', westen: 'west',
  nw: 'northwest', northwest: 'northwest', nordwest: 'northwest', nordwesten: 'northwest',
}

/** Erste Himmelsrichtung in der Eingabe („south“, „S“, „north east“, „süd“). */
export function parseDir(input: string): string | undefined {
  const t = normalizeTokens(input)
  for (let i = 0; i < t.length; i++) {
    const two = DIRS[t[i] + (t[i + 1] ?? '')]
    if ((t[i] === 'north' || t[i] === 'south') && (t[i + 1] === 'east' || t[i + 1] === 'west') && two) return two
    if (DIRS[t[i]]) return DIRS[t[i]]
  }
  return undefined
}

const LETTER_OF: Record<string, string> = Object.fromEntries(PHONETIC_WORDS.map((w) => [w.toLowerCase(), w[0]]))

/** Koordinate kompakt: „November Kilo 1234 5678“, „NK12345678“, „37T NK 1234 5678“ → "NK12345678". */
export function compactGrid(input: string): string {
  const joined = normalizeTokens(input)
    .map((t) => LETTER_OF[t] ?? t)
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  // Zonenfeld davor („37T“) gehört nicht zur Prüfung
  return joined.replace(/^\d{1,2}[A-Z](?=[A-Z]{2}\d)/, '')
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  }
  return d[a.length][b.length]
}

/** Ein Name (IP, Rufzeichen) mit kleinem Tippfehler gilt; „IP“ davor und „to“ zählen nicht. */
function nameIn(input: string, names: readonly string[]): boolean {
  const t = normalizeTokens(input).filter((w) => w !== 'ip' && w !== 'to')
  const got = t.join(' ')
  return names.some((n) => {
    const want = normalizeTokens(n).join(' ')
    if (got === want || t.includes(want)) return true
    const allowed = want.length >= 5 ? 1 : 0
    return allowed > 0 && (lev(got, want) <= allowed || t.some((w) => lev(w, want) <= allowed))
  })
}

function sideOf(input: string): 'left' | 'right' | undefined {
  const t = normalizeTokens(input.replace(/(\d)\s*([lr])\b/gi, '$1 $2'))
  if (t.some((w) => w === 'left' || w === 'l' || w === 'links')) return 'left'
  if (t.some((w) => w === 'right' || w === 'r' || w === 'rechts')) return 'right'
  return undefined
}

function markOf(input: string): { kind?: MarkKind; code?: string } {
  if (/^[\s\-–—]*$/.test(input)) return { kind: 'none' }
  const t = normalizeTokens(input)
  const nums = numbers(input)
  const codeHit = nums.find((n) => String(n).length === 4)
  if (t.includes('laser') || codeHit !== undefined) return { kind: 'laser', code: codeHit !== undefined ? String(codeHit) : undefined }
  if (t.some((w) => ['wp', 'willie', 'willy', 'pete', 'white', 'phosphorus', 'smoke', 'rauch'].includes(w))) return { kind: 'wp' }
  if (t.some((w) => ['sparkle', 'ir', 'infrared', 'pointer'].includes(w))) return { kind: 'ir' }
  if (t.some((w) => ['none', 'no', 'keine', 'kein', 'negative', 'nil', 'ohne'].includes(w))) return { kind: 'none' }
  return {}
}

const MARK_LABEL: Record<MarkKind, string> = { laser: 'Laser', wp: 'Willie Pete (weißer Phosphor)', ir: 'IR-Pointer (sparkle)', none: 'keine Markierung' }

// ---------------------------------------------------------------------------
// Prüfen
// ---------------------------------------------------------------------------

const ok = (note?: string): FieldCheck => ({ ok: true, near: false, note })
const near = (note: string): FieldCheck => ({ ok: false, near: true, note })
const wrong = (note?: string): FieldCheck => ({ ok: false, near: false, note })

/** Prüft eine Zeile der Mitschrift. */
export function checkNineLineField(field: NineLineField, input: string): FieldCheck {
  const w = field.want
  // Ein leeres Feld bei Line 7 heißt „keine Markierung“ – richtig nur, wenn auch keine gesagt war
  if (!input.trim() && !(field.kind === 'mark' && w.mark === 'none')) return wrong('Nichts eingetragen.')
  switch (field.kind) {
    case 'name':
      return nameIn(input, w.names ?? []) ? ok() : wrong()
    case 'heading-offset': {
      const n = numbers(input.replace(/(\d)\s*([lr])\b/gi, '$1 $2'))[0]
      const side = sideOf(input)
      const hdgOk = n !== undefined && angleDiff(n, w.num!) < 0.5
      if (hdgOk && side === w.side) return ok()
      if (hdgOk) return near(side ? `Offset ${w.side}, nicht ${side}.` : `Der Offset fehlt (${w.side}).`)
      return wrong(n !== undefined && angleDiff(n, w.num!) <= 10 ? 'Kurse schreibt man genau ab – keine Toleranz.' : undefined)
    }
    case 'nm': {
      const n = numbers(input.replace(/(\d),(\d)/g, '$1.$2'))[0]
      if (n !== undefined && Math.abs(n - w.num!) <= 0.1 + 1e-9) return ok()
      if (n !== undefined && n > 100 && Math.abs(n / 1852 - w.num!) <= 0.2) return near('Line 3 kommt in NM, nicht in Metern.')
      return wrong()
    }
    case 'elevation': {
      const n = numbers(input.replace(/(\d)[.,](\d{3})(?!\d)/g, '$1$2'))[0]
      if (n === w.num) return ok()
      return wrong(n !== undefined && String(n).length === String(w.num).length ? 'Ein Zahlendreher in Line 4 – die Waffe rechnet mit der falschen Höhe.' : undefined)
    }
    case 'target': {
      const t = normalizeTokens(input)
      const hit = (w.keywords ?? []).some((k) => {
        const kt = normalizeTokens(k)
        return t.some((_, i) => kt.every((x, j) => t[i + j] === x))
      })
      if (!hit) return wrong()
      // Ziffern im Typnamen („BMP-2“, „T-72“) sind keine Anzahl
      const rest = (w.keywords ?? []).reduce((s, k) => s.replace(new RegExp(`${k.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}[-–]?\\d*`, 'gi'), ' '), input)
      const nums = numbers(rest.replace(/\b[a-z]+[-–]\d+\b/gi, ' '))
      if ((w.count ?? 1) > 1 && nums.length > 0 && !nums.includes(w.count!)) return near(`Die Anzahl stimmt nicht: ${w.count}.`)
      return ok()
    }
    case 'mgrs': {
      const got = compactGrid(input)
      if (got === w.grid) return ok()
      const want = w.grid!
      if (got.length === want.length && got.slice(0, 2) === want.slice(0, 2)) {
        const diff = [...got].filter((c, i) => c !== want[i]).length
        const swapped = diff === 2 && [...got].some((c, i) => i + 1 < got.length && c === want[i + 1] && got[i + 1] === want[i] && c !== got[i + 1])
        if (diff === 1 || swapped) return near('Ein Zahlendreher in der Koordinate – genau dafür gibt es den Readback.')
      }
      if (got.slice(2) === want.slice(2)) return near('Die Ziffern stimmen, das Quadrat nicht.')
      return wrong()
    }
    case 'mark': {
      const m = markOf(input)
      if (m.kind !== w.mark) return wrong(m.kind ? `Das ist ${MARK_LABEL[m.kind]}, gesagt war ${MARK_LABEL[w.mark!]}.` : undefined)
      if (w.mark !== 'laser') return ok()
      if (m.code === w.code) return ok()
      return near(m.code ? `Der Laser-Code ist ${w.code}, nicht ${m.code}.` : 'Bei Laser gehört der Code dazu.')
    }
    case 'dir-dist': {
      const dir = parseDir(input)
      const t = normalizeTokens(input)
      const km = t.includes('km')
      const n = numbers(input.replace(/(\d),(\d)/g, '$1.$2')).map((x) => (km ? Math.round(x * 1000) : x))
      const distOk = n.includes(w.num!)
      if (dir === w.dir && distOk) return ok()
      // Die Gegenrichtung ist der gefährlichste Fehler: Die Freunde stünden dort, wo du sie nicht erwartest
      if (dir && dir === cardinal(CARDINAL8.indexOf(w.dir as (typeof CARDINAL8)[number]) * 45 + 180)) return wrong('Genau die Gegenrichtung – die Richtung zeigt vom Ziel zu den Freunden.')
      if (dir === w.dir || distOk) return near(dir === w.dir ? `Abstand: ${w.num} m.` : `Richtung: ${w.dir}.`)
      return wrong()
    }
    case 'egress': {
      const dir = parseDir(input)
      if (dir === w.dir) return ok()
      return wrong()
    }
    case 'sector': {
      const [a, b] = numbers(input)
      if (a === undefined || b === undefined) return wrong('Zwei Kurse: von – bis.')
      if (angleDiff(a, w.num!) < 0.5 && angleDiff(b, w.num2!) < 0.5) return ok()
      if (angleDiff(a, w.num2!) < 0.5 && angleDiff(b, w.num!) < 0.5) return near('Verdreht: Der Sektor geht im Uhrzeigersinn von – bis.')
      return wrong()
    }
    case 'heading': {
      const n = numbers(input)[0]
      return n !== undefined && angleDiff(n, w.num!) < 0.5 ? ok() : wrong()
    }
    case 'time': {
      const n = numbers(input.replace(/(\d)[:.h](\d)/g, '$1$2'))[0]
      return n === w.num ? ok() : wrong()
    }
  }
}

/** Anteil richtiger Zeilen (halb richtig zählt halb). */
export function nineLineScore(checks: readonly FieldCheck[]): number {
  if (checks.length === 0) return 1
  return checks.reduce((s, c) => s + (c.ok ? 1 : c.near ? 0.5 : 0), 0) / checks.length
}

export interface NineLineResult {
  values: string[]
  checks: FieldCheck[]
  score: number
  /** Alle Zeilen richtig (halb richtig zählt nicht). */
  correct: boolean
}

/** Prüft die ganze Mitschrift. */
export function checkNineLine(fields: readonly NineLineField[], values: readonly string[]): NineLineResult {
  const checks = fields.map((f, i) => checkNineLineField(f, values[i] ?? ''))
  return { values: [...values], checks, score: nineLineScore(checks), correct: checks.every((c) => c.ok) }
}

/** Zusätzlich zurückgelesene Teile (getroffene optionale Slots): kein Fehler, kostet aber Zeit auf dem Netz. */
export function extraReadback(detail: CallScore | undefined, segments: readonly { text: string; optional?: boolean }[]): string[] {
  if (!detail) return []
  return detail.slots.filter((s) => s.status === 'ok' && segments[s.index]?.optional).map((s) => segments[s.index].text)
}
