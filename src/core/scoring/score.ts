/**
 * Bewertung eines getippten (später gesprochenen) Funkspruchs gegen die erwartete Übertragung.
 *
 * Jedes Segment der Übertragung ist ein Slot. Pro Slot wird geprüft, ob er vorkommt, an der richtigen
 * Stelle steht und – bei Zahlen – im Toleranzbereich liegt. Übrige Wörter werden als Füllwörter oder
 * Zusätze gemeldet. Ergebnis: richtig/falsch, Teilpunkte und konkrete Hinweise auf Deutsch.
 *
 * Zahlen dürfen so getippt werden, wie man sie aufschreibt oder spricht: „Two 7.2“, „090/25“,
 * „25,000“, „251,25“, „FL220“, „two five thousand“. Laufen zwei Zahlen ohne Trenner zusammen
 * („Two seven point two“ → 27.2), werden sie anhand der erwarteten Werte wieder getrennt –
 * so funktioniert die Bewertung auch für Sprach-Transkripte ohne Kommas.
 */
import { normalizeTokens } from '../phraseology/normalize'

export interface ScoreSegment {
  text: string
  role: string
  /** Fehlt es, ist das nur ein Hinweis. */
  optional?: boolean
  /** Pflichtteil, dessen Fehlen besonders hervorgehoben wird (hold short, Rufzeichen …). */
  critical?: boolean
  /** Gleichwertige Formulierungen, z. B. "five by five" für "loud and clear". */
  alt?: string[]
  /**
   * Formulierungen, die gelten, aber nicht nach Vorschrift sind („Two“ statt „Wolf eight two“, „angels 23“ statt
   * „22.6“): Der Teil zählt als richtig, bringt aber nur halbe Punkte und einen Hinweis (`weakNote`).
   */
  weak?: string[]
  weakNote?: string
  /** Erlaubte Abweichung bei Zahlen (z. B. 3 für ±3°). */
  tolerance?: number
  /** Darf an beliebiger Stelle stehen. */
  free?: boolean
}

export type SlotStatus = 'ok' | 'wrong' | 'misplaced' | 'missing' | 'skipped'

export interface SlotResult {
  index: number
  status: SlotStatus
  /** Was der Nutzer an dieser Stelle gesagt hat (bei wrong). */
  heard?: string
  /** Fast richtig (z. B. ein Wort fehlt) – gibt halbe Punkte. */
  near?: boolean
  /** Gilt, aber nicht nach Vorschrift (eine `weak`-Formulierung) – halbe Punkte, bleibt richtig. */
  weak?: boolean
}

export interface CallScore {
  correct: boolean
  score: number
  slots: SlotResult[]
  /** Zusätzliche, nicht erwartete Wörter. */
  extras: string[]
  /** Davon typische Füllwörter (roger, please, äh …). */
  fillers: string[]
  /** Hinweise auf Deutsch. */
  issues: string[]
  /** Das Gesagte Wort für Wort (aufbereitet), jeweils mit dem Segment, dem es zugeordnet wurde. */
  heard: { text: string; slot?: number }[]
  /** Mindestens ein Teil in einer Form, die gilt, aber nicht der Vorschrift entspricht. */
  weak: boolean
}

// ---------------------------------------------------------------------------
// Tokens mit Zahlengruppen
// ---------------------------------------------------------------------------

type Num = { n: number; text: string }
/**
 * `readings`: Lesarten gesprochener Zahlen, die mehrdeutig sind – „forty seven two zero thousand“ ist
 * 47 und 20000 oder 40 und 720000, „twenty five thousand“ ist 25000 oder 20 und 5000. Die erste Lesart
 * gilt, wenn nichts anderes besser zu den erwarteten Werten passt.
 */
type Item = { kind: 'word'; w: string; i: number } | { kind: 'num'; n: number; text: string; i: number; readings?: Num[][] }

const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
}
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }

/**
 * Fasst Ziffernfolgen ("2 6 0 . 0") und Zahlwörter ("twenty five") zu Zahlen zusammen.
 * Kommas, Semikolons und Schrägstriche trennen Zahlengruppen: "Viper 1-1, 260.0" ergibt 11 und 260.0,
 * "090/25" ergibt 090 und 25.
 */
export function toItems(text: string): Item[] {
  const items: Item[] = []
  for (const chunk of text.split(/[,;/]/)) items.push(...chunkItems(chunk))
  return items.map((it, i) => ({ ...it, i }))
}

function chunkItems(text: string): Item[] {
  const t = normalizeTokens(text)
  const items: Item[] = []
  for (let i = 0; i < t.length; ) {
    if (/^\d$/.test(t[i])) {
      let s = ''
      const start = i
      // höchstens ein Dezimalpunkt – "9.9.9" ist keine Zahl
      while (i < t.length && (/^\d$/.test(t[i]) || (t[i] === '.' && !s.includes('.') && /^\d$/.test(t[i + 1] ?? '')))) s += t[i++]
      let n = Number(s)
      // "two five thousand" = 25000, "one niner thousand five hundred" = 19500, "five hundred" = 500
      let scaled = false
      if (!s.includes('.') && t[i] === 'thousand') {
        n *= 1000
        i++
        if (/^\d$/.test(t[i] ?? '') && t[i + 1] === 'hundred') {
          n += Number(t[i]) * 100
          i += 2
        }
        s = String(n)
        scaled = true
      } else if (!s.includes('.') && t[i] === 'hundred') {
        n *= 100
        i++
        s = String(n)
        scaled = true
      }
      // "two hundred fifty" = 250, "one thousand two hundred fifty" = 1250 (Meter und Höhen als Zahlwort)
      if (scaled && n % 100 === 0 && (TENS[t[i]] !== undefined || TEENS[t[i]] !== undefined)) {
        const tens = TENS[t[i]]
        n += tens ?? TEENS[t[i]]
        i++
        if (tens !== undefined && /^[1-9]$/.test(t[i] ?? '')) n += Number(t[i++])
        s = String(n)
      }
      items.push({ kind: 'num', n, text: s, i: start })
      continue
    }
    if (TENS[t[i]] !== undefined) {
      const tens = TENS[t[i]]
      const start = i++
      if (!/^[1-9]$/.test(t[i] ?? '')) {
        // „twenty thousand“ = 20000 (Kontakthöhe, wie AWACS sie spricht)
        if (t[i] === 'thousand') {
          i++
          items.push({ kind: 'num', n: tens * 1000, text: String(tens * 1000), i: start })
        } else {
          items.push({ kind: 'num', n: tens, text: String(tens), i: start })
        }
        continue
      }
      const unit = t[i++]
      // Folgt direkt eine weitere Zahl, ist das Gesprochene mehrdeutig: zwei Lesarten
      let run = ''
      while (i < t.length && (/^\d$/.test(t[i]) || (t[i] === '.' && run !== '' && !run.includes('.') && /^\d$/.test(t[i + 1] ?? '')))) run += t[i++]
      let mult = 1
      if (!run.includes('.') && t[i] === 'thousand') {
        mult = 1000
        i++
      }
      const make = (s: string): Num => (mult === 1 ? { n: Number(s), text: s } : { n: Number(s) * mult, text: String(Number(s) * mult) })
      const plain = (n: number): Num => ({ n, text: String(n) })
      const both = tens + Number(unit)
      let readings: Num[][]
      if (!run && mult === 1) readings = [[plain(both)]] // „forty one“
      else if (!run) readings = [[make(String(both))], [plain(tens), make(unit)]] // „twenty five thousand“
      else readings = [[plain(both), make(run)], [plain(tens), make(unit + run)]] // „forty one one thousand“
      const first = readings[0][0]
      items.push({ kind: 'num', n: first.n, text: first.text, i: start, readings: readings.length > 1 || readings[0].length > 1 ? readings : undefined })
      continue
    }
    if (TEENS[t[i]] !== undefined) {
      // „fifteen thousand“ = 15000 (Kontakthöhe)
      const n = t[i + 1] === 'thousand' ? TEENS[t[i]] * 1000 : TEENS[t[i]]
      items.push({ kind: 'num', n, text: String(n), i })
      i += n >= 1000 ? 2 : 1
      continue
    }
    items.push({ kind: 'word', w: t[i], i })
    i++
  }
  return items
}

/** Komma zwischen Ziffern: Dezimalkomma ("251,25") oder Tausender ("25,000") – je nachdem, was erwartet wird. */
function resolveDigitCommas(input: string, expected: Set<number>): string {
  return input.replace(/(\d+),(\d+)(?![\d.])/g, (whole, a: string, b: string) => {
    const asDecimal = `${a}.${b}`
    const asThousands = `${a}${b}`
    if (expected.has(Number(asDecimal))) return asDecimal
    // Tausendertrenner nur vor genau drei Ziffern: „25,000“, nicht „2,5000“
    if (b.length === 3 && expected.has(Number(asThousands))) return asThousands
    if (b.length === 3 && b.endsWith('00')) return asThousands
    if (b.length <= 2) return asDecimal
    return whole
  })
}

const shapeOf = (s: string) => `${s.length}:${s.indexOf('.')}`
const isNumberText = (s: string) => /^\d+(\.\d+)?$/.test(s)

/** Passt eine getippte Zahl zu einer erwarteten? Genau = 1, nur die Form (Stellen, Komma) = 0.5. */
function fit(piece: Num, e: Num): number {
  if (piece.text === e.text || piece.n === e.n) return 1
  return isNumberText(piece.text) && shapeOf(piece.text) === shapeOf(e.text) ? 0.5 : 0
}

/** Alle Möglichkeiten, eine Ziffernfolge in aufeinanderfolgende erwartete Zahlen ab `j` zu zerlegen. */
function cuts(u: Num, expected: Num[], j: number): { parts: Num[]; value: number }[] {
  const out: { parts: Num[]; value: number }[] = []
  const walk = (pos: number, k: number, parts: Num[], value: number) => {
    if (pos === u.text.length) {
      if (parts.length >= 2 && parts.some((p, x) => fit(p, expected[j + x]) === 1)) out.push({ parts, value })
      return
    }
    if (k >= expected.length || parts.length >= 8) return
    const e = expected[k]
    const text = u.text.slice(pos, pos + e.text.length)
    if (text.length < e.text.length) return
    const piece = { n: Number(text), text }
    const f = fit(piece, e)
    if (f > 0) walk(pos + e.text.length, k + 1, [...parts, piece], value + f)
  }
  walk(0, j, [], 0)
  return out
}

/**
 * Zusammengelaufene Zahlen anhand der erwarteten Reihenfolge trennen: „27.2“ bei erwartetem
 * „2“ (Rufzeichen) und „7.2“ (Treibstoff) wird zu 2 und 7.2. Alle Zahlen des Funkspruchs werden
 * gemeinsam der erwarteten Reihenfolge zugeordnet, so dass möglichst viele genau passen.
 * Ein Teil darf die richtige Form, aber einen anderen Wert haben („2“ + „7.5“) – dann meldet die
 * Bewertung den falschen Wert statt „fehlt“.
 */
function splitMergedNumbers(user: Item[], expected: Num[]): Item[] {
  const nums = user.filter((u): u is Extract<Item, { kind: 'num' }> => u.kind === 'num')
  if (nums.length === 0) return user
  type Best = { value: number; choice: Num[] | null; next: [number, number] | null }
  const memo = new Map<string, Best>()
  const best = (a: number, j: number): Best => {
    if (a === nums.length) return { value: 0, choice: null, next: null }
    const key = `${a}:${j}`
    const hit = memo.get(key)
    if (hit) return hit
    const u = nums[a]
    // ohne Zuordnung weiter
    let result: Best = { value: best(a + 1, j).value, choice: null, next: [a + 1, j] }
    const consider = (value: number, choice: Num[] | null, next: [number, number]) => {
      // kleiner Abzug pro Trennung: im Zweifel bleibt die Zahl ganz
      const v = value + best(next[0], next[1]).value - (choice ? 0.01 * (choice.length - 1) : 0)
      if (v > result.value + 1e-9) result = { value: v, choice, next }
    }
    // Entspricht die Zahl genau dem nächsten erwarteten Wert, bleibt sie ganz – „230“ wird nicht zu „23“ + „0“, nur weil
    // weiter hinten zufällig eine 23 erwartet wird (z. B. aus „ZU-23“).
    const exactWhole = !u.readings && j < expected.length && fit(u, expected[j]) === 1
    for (let k = j; k < expected.length; k++) {
      if (u.readings) {
        // mehrdeutig gesprochen: die Lesart, die am besten zu den erwarteten Werten ab k passt
        for (const r of u.readings) {
          if (k + r.length > expected.length) continue
          const value = r.reduce((s, p, x) => s + fit(p, expected[k + x]), 0)
          if (value > 0) consider(value, r, [a + 1, k + r.length])
        }
        continue
      }
      // ganze Zahl passt zu einer erwarteten (übersprungene erwartete Zahlen fehlen eben)
      const f = fit(u, expected[k])
      if (f > 0) consider(f, null, [a + 1, k + 1])
      // zerlegt in mehrere aufeinanderfolgende erwartete Zahlen
      if (!exactWhole) for (const c of cuts(u, expected, k)) consider(c.value, c.parts, [a + 1, k + c.parts.length])
    }
    memo.set(key, result)
    return result
  }
  const replace = new Map<Item, Num[]>()
  let state: [number, number] | null = [0, 0]
  while (state && state[0] < nums.length) {
    const b = best(state[0], state[1])
    if (b.choice) replace.set(nums[state[0]], b.choice)
    state = b.next
  }
  return user
    .flatMap((u): Item[] => {
      const parts = replace.get(u) ?? (u.kind === 'num' ? u.readings?.[0] : undefined)
      return parts ? parts.map((p) => ({ kind: 'num', n: p.n, text: p.text, i: u.i })) : [u]
    })
    .map((it, i) => ({ ...it, i }))
}

/** Levenshtein mit Buchstabendrehern (Damerau): „angles“ statt „angels“ ist ein Fehler, nicht zwei. */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

const collapseDoubles = (w: string) => w.replace(/(.)\1+/g, '$1')

/**
 * Wie genau ein Wort passen muss.
 * - `strict`: Brevity und Standardwörter – nur die genaue Schreibung, locked ≠ blocked, state ≠ skate.
 * - `name`: Rufzeichen und Stationen beim Sprechen – die Erkennung verhört sich bei Namen leichter, als man
 *   sich vertippt („cold“ für Colt, „range“ für Rage). Unter den Rufzeichen-Namen der Inhalte liegen keine
 *   zwei so nah beieinander, ein falsches Rufzeichen bleibt also falsch.
 * - sonst Tippfehler-tolerant.
 */
type Leniency = 'strict' | 'typo' | 'name'

/**
 * Doppelte Buchstaben egal („Pappa“); ab 5 Buchstaben 1 Fehler (Namen: ab 4), ab 9 Buchstaben 2.
 * Mehr nicht: „field“ für Enfield ist kein Verhörer des Namens, sondern ein verschluckter Teil.
 */
function wordMatch(expected: string, got: string, leniency: Leniency): 'exact' | 'typo' | null {
  if (expected === got) return 'exact'
  if (leniency === 'strict') return null
  if (collapseDoubles(expected) === collapseDoubles(got)) return 'typo'
  const allowed = expected.length >= 9 ? 2 : expected.length >= (leniency === 'name' ? 4 : 5) ? 1 : 0
  return allowed > 0 && editDistance(expected, got) <= allowed ? 'typo' : null
}

function numDiff(a: number, b: number, tolerance: number | undefined): number {
  const d = Math.abs(a - b)
  // Peilungen/Kurse: 359 und 001 liegen nah beieinander
  if (tolerance !== undefined && a <= 360 && b <= 360 && a >= 0 && b >= 0) return Math.min(d, 360 - d)
  return d
}

interface Match {
  start: number
  end: number
  /** Zahlen passen nicht (aber die Wörter). */
  wrongNumber: boolean
  heard: string
  typos: [string, string][]
  /** Weggelassene, entbehrliche Wörter („runway“ vor der richtigen Bahnnummer). */
  dropped?: string[]
  /** Index der Formulierung, die gepasst hat (0 = Text, dann `alt`, dann `weak`). */
  alt?: number
}

/** Verbindungswörter zwischen zwei Zahlen, die man in Kurzschrift weglässt: „320 at 11“ = „320/11“. */
const JOINERS = new Set(['at'])
/**
 * Wörter vor einer Zahl, die man weglassen darf, wenn die Zahl stimmt: „cleared for takeoff 03R“ ist eindeutig
 * die Bahn. Das gilt als richtig, mit Hinweis auf den vollständigen Wortlaut.
 */
const DROPPABLE_BEFORE_NUMBER = new Set(['runway'])
/** Kleine Wörter verschluckt die Spracherkennung gern – beim Sprechen dürfen sie fehlen („flight four“). */
const ARTICLES = new Set(['the', 'a', 'an', 'of'])
/**
 * Buchstabieralphabet: Unter den 26 Wörtern liegen keine zwei nah beieinander, beim Sprechen darf
 * die Erkennung also etwas daneben liegen („information gulf“).
 */
const ALPHABET = new Set(['alfa', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliett', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu'])

interface MatchRules {
  tol: number | undefined
  leniency: Leniency
  /** Gesprochen: Artikel dürfen fehlen. */
  spoken: boolean
}

function matchAt(seg: Item[], user: Item[], start: number, used: boolean[], rules: MatchRules): Match | null {
  const { tol, leniency } = rules
  let wrong = false
  const heard: string[] = []
  const typos: [string, string][] = []
  const dropped: string[] = []
  let j = start
  for (let k = 0; k < seg.length; k++) {
    const s = seg[k]
    const u = user[j]
    if (s.kind === 'word' && JOINERS.has(s.w) && seg[k - 1]?.kind === 'num' && seg[k + 1]?.kind === 'num' && (!u || u.kind === 'num')) continue
    if (rules.spoken && s.kind === 'word' && ARTICLES.has(s.w) && k > 0 && (!u || used[j] || u.kind !== 'word' || u.w !== s.w)) continue
    // „runway“ fehlt, die Bahnnummer folgt direkt und stimmt
    const next = seg[k + 1]
    if (s.kind === 'word' && DROPPABLE_BEFORE_NUMBER.has(s.w) && next?.kind === 'num' && u?.kind === 'num' && !used[j] && numDiff(next.n, u.n, tol) <= (tol ?? 0)) {
      dropped.push(s.w)
      continue
    }
    if (!u || used[j]) return null
    if (s.kind === 'word') {
      if (u.kind !== 'word') return null
      const w = wordMatch(s.w, u.w, rules.spoken && leniency === 'typo' && ALPHABET.has(s.w) ? 'name' : leniency)
      if (!w) return null
      if (w === 'typo') typos.push([u.w, s.w])
      heard.push(u.w)
    } else {
      if (u.kind !== 'num') return null
      if (Number.isNaN(u.n) || numDiff(s.n, u.n, tol) > (tol ?? 0)) wrong = true
      heard.push(u.text)
    }
    j++
  }
  if (j === start) return null
  return { start, end: j, wrongNumber: wrong, heard: heard.join(' '), typos, dropped }
}

/**
 * Erste Stelle ab `from`, an der eine Formulierung passt. Passen dort mehrere, gilt die längste: Bei „request
 * pigeons home plate“ soll die Variante „request pigeons home plate“ greifen, nicht „request pigeons“ mit „home
 * plate“ als Zusatz. Bei gleicher Länge die vollständigere (ohne weggelassene Wörter), dann die erste.
 */
function findMatch(alts: Item[][], user: Item[], from: number, used: boolean[], rules: MatchRules, allowWrong: boolean): Match | null {
  for (let start = from; start < user.length; start++) {
    let best: Match | null = null
    for (const [a, seg] of alts.entries()) {
      if (seg.length === 0) continue
      const m = matchAt(seg, user, start, used, rules)
      if (!m || (!allowWrong && m.wrongNumber)) continue
      // Bei gleicher Länge gewinnt die frühere Formulierung – Text und `alt` vor `weak`
      const longer = !best || m.end > best.end || (m.end === best.end && (m.dropped?.length ?? 0) < (best.dropped?.length ?? 0))
      if (longer) best = { ...m, alt: a }
    }
    if (best) return best
  }
  return null
}

/** Längste gemeinsame Teilfolge (tolerant) – für „fast richtig“. */
function overlap(seg: Item[], window: Item[]): number {
  const dp = Array.from({ length: seg.length + 1 }, () => new Array<number>(window.length + 1).fill(0))
  for (let a = 1; a <= seg.length; a++) {
    for (let b = 1; b <= window.length; b++) {
      const s = seg[a - 1]
      const u = window[b - 1]
      const same = s.kind === 'word' ? u.kind === 'word' && !!wordMatch(s.w, u.w, 'typo') : u.kind === 'num' && u.n === s.n
      dp[a][b] = same ? dp[a - 1][b - 1] + 1 : Math.max(dp[a - 1][b], dp[a][b - 1])
    }
  }
  return dp[seg.length][window.length]
}

/** Übrig gebliebene Wörter, die einem fehlenden Segment ähneln („hotel charlie“ für „via Hotel, Charlie“). */
function nearMiss(alts: Item[][], user: Item[], used: boolean[]): Match | null {
  let best: { m: Match; score: number } | null = null
  for (const seg of alts) {
    if (seg.length === 0) continue
    for (let start = 0; start < user.length; start++) {
      for (let len = 1; len <= seg.length + 1 && start + len <= user.length; len++) {
        const window = user.slice(start, start + len)
        if (window.some((_, k) => used[start + k])) break
        let hit = overlap(seg, window)
        // einzelnes Wort mit gröberem Tippfehler („angls“)
        if (hit === 0 && seg.length === 1 && len === 1 && seg[0].kind === 'word' && window[0].kind === 'word' && seg[0].w.length >= 5 && editDistance(seg[0].w, window[0].w) <= 2) hit = 0.6
        const score = hit / Math.max(seg.length, len)
        if (hit > 0 && score >= 0.5 && (!best || score > best.score)) {
          best = { m: { start, end: start + len, wrongNumber: true, heard: window.map((x) => (x.kind === 'word' ? x.w : x.text)).join(' '), typos: [] }, score }
        }
      }
    }
  }
  return best?.m ?? null
}

const FILLERS = new Set(['roger', 'wilco', 'please', 'sorry', 'uh', 'um', 'äh', 'ähm', 'over', 'out', 'okay', 'ok', 'hello', 'hi', 'thanks', 'thank', 'you', 'this', 'is', 'and'])

/** Besteht ein Text nur aus Füllwörtern („over“, „roger wilco“)? */
export function isFillerText(text: string): boolean {
  const words = normalizeTokens(text)
  return words.length > 0 && words.every((w) => FILLERS.has(w))
}
/** Verzögerungslaute: beim Sprechen menschlich und kein Stilfehler, die Erkennung glättet sie ohnehin meist weg. */
const HESITATIONS = new Set(['uh', 'um', 'äh', 'ähm', 'er', 'erm', 'eh', 'hmm', 'hm', 'mm', 'ah'])

type RoleOnly = { role: string }

/**
 * Reihenfolge ist Pflicht nur für den Aufbau: erst wen ich rufe, dann wer ich bin. Der Adressat steht also fest,
 * das eigene Rufzeichen nur, wenn jemand gerufen wird. Ohne Adressat – beim Zurücklesen („runway two seven,
 * cleared for takeoff, Viper one one“) – ist die Stelle des Rufzeichens Gewohnheit: Vorn versteht es jeder Lotse.
 */
export function orderMatters(seg: RoleOnly, segments: readonly RoleOnly[]): boolean {
  if (seg.role === 'addressee') return true
  return seg.role === 'callsign' && segments.some((s) => s.role === 'addressee')
}

/** Hinweis für einen Teil, der woanders steht als in der Musterlösung. */
export function misplacedIssue(index: number, segments: readonly (RoleOnly & { text: string })[], roleLabel: (role: string) => string): string {
  const seg = segments[index]
  const what = `„${seg.text}“ (${roleLabel(seg.role)})`
  if (orderMatters(seg, segments)) return `${what} steht an der falschen Stelle – erst wen du rufst, dann wer du bist.`
  if (seg.role === 'callsign' && index === segments.length - 1) {
    return `${what} gilt auch an dieser Stelle – beim Zurücklesen steht das eigene Rufzeichen aber meist am Ende.`
  }
  if (seg.role === 'callsign' && index === 0) return `${what} gilt auch an dieser Stelle – meist steht es hier vorn.`
  return `${what} steht an einer anderen Stelle als üblich.`
}
/** Bei Brevity und Standardwörtern zählt die genaue Schreibung. */
const STRICT_ROLES = new Set(['brevity', 'proword'])
/** Namen: Rufzeichen und gerufene Stationen. */
const NAME_ROLES = new Set(['addressee', 'callsign'])

/**
 * Beim Sprechen schreibt die Erkennung Wörter mal getrennt, mal zusammen („dark star“ / „darkstar“,
 * „stand by“ / „standby“). Passt die andere Schreibweise zu einem erwarteten Wort, gilt sie.
 */
function joinCompounds(user: Item[], segItems: Item[][][]): Item[] {
  const words = new Set<string>()
  const pairs = new Map<string, [string, string]>()
  for (const alts of segItems) {
    for (const seg of alts) {
      seg.forEach((it, k) => {
        if (it.kind !== 'word') return
        words.add(it.w)
        const next = seg[k + 1]
        if (next?.kind === 'word') pairs.set(it.w + next.w, [it.w, next.w])
      })
    }
  }
  const out: Item[] = []
  for (let i = 0; i < user.length; i++) {
    const a = user[i]
    const b = user[i + 1]
    if (a.kind === 'word' && b?.kind === 'word' && words.has(a.w + b.w) && !(words.has(a.w) && words.has(b.w))) {
      out.push({ kind: 'word', w: a.w + b.w, i: a.i })
      i++
      continue
    }
    const split = a.kind === 'word' && !words.has(a.w) ? pairs.get(a.w) : undefined
    if (split) {
      out.push({ kind: 'word', w: split[0], i: a.i }, { kind: 'word', w: split[1], i: a.i })
      continue
    }
    out.push(a)
  }
  return out.map((it, i) => ({ ...it, i }))
}

/** Wörter, die beim Sprechen wie Ziffern klingen: „Rage for one“ ist meist „Rage four one“. */
const DIGIT_HOMOPHONES: Record<string, string> = { for: 'four', fore: 'four', to: 'two', won: 'one', ate: 'eight', forward: 'four one', forewarn: 'four one' }
/** Rufzeichen, die wie eine Ziffer klingen – die Erkennung schreibt „Ford one one“ gern als „411“. */
const NAME_DIGITS: Record<string, string> = { ford: '4' }
const DIGIT_WORD = /^(\d+([.,]\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|niner|thousand|hundred|point|decimal)$/i

/**
 * Transkript der Spracherkennung für die Bewertung vorbereiten:
 * - Kommas setzt die Erkennung nach Sprechpausen, sie trennen keine Teile des Funkspruchs. Nur
 *   zwischen Ziffern bleiben sie („6,000“); zusammengelaufene Zahlen trennt `splitMergedNumbers`.
 * - Typische Verhörer bei Zahlen werden versuchsweise umgeschrieben: ein Wort, das wie eine Ziffer
 *   klingt („Rage for one“, „Raven forward“), „niner“ als „90“ oder „9 R“ („Ghost 901“),
 *   „nine a thousand“, „for 0.8“ (four point eight), „411“ für „Ford one one“.
 *   Eine Umschreibung gilt nur, wenn danach mehr Zahlen zu den erwarteten passen. Ein falsch
 *   gesprochener Wert wird so nie richtig – die erwartete Zahl muss dabei herauskommen.
 */
function prepareSpoken(input: string, expected: Set<number>, expectedNums: Num[], expectedWords: Set<string>): string {
  let words = input.replace(/(?<!\d)[,;]|[,;](?!\d)/g, ' ').split(/\s+/).filter(Boolean)
  const fits = (ws: string[]) =>
    splitMergedNumbers(toItems(resolveDigitCommas(ws.join(' '), expected)), expectedNums).reduce((s, it) => s + (it.kind === 'num' ? (expected.has(it.n) ? 1 : -1) : 0), 0)
  let current = fits(words)
  const attempt = (next: string[]) => {
    const value = fits(next)
    if (value <= current) return false
    words = next
    current = value
    return true
  }
  const bare = (w: string | undefined) => (w ?? '').toLowerCase().replace(/[.!?]+$/, '')
  const near = (w: string | undefined) => DIGIT_WORD.test(bare(w))
  const rewritePass = () => {
    for (let k = 0; k < words.length; k++) rewriteAt(k)
  }
  const rewriteAt = (k: number) => {
    const w = words[k]
    const b = bare(w)
    const replaced = (to: string) => words.map((x, i) => (i === k ? to + w.slice(b.length) : x))
    const removed = () => words.filter((_, i) => i !== k)
    // „Rage for one“, „To your clean“ (am Anfang steht oft eine einzelne Zahl als Rufzeichen)
    const digit = DIGIT_HOMOPHONES[b]
    // Einzelne Ziffern nur neben Zahlen („taxi to runway“ bleibt „to“), ganze Zahlen („forward“) überall
    if (digit && (digit.includes(' ') || k === 0 || near(words[k - 1]) || near(words[k + 1]))) attempt(replaced(digit))
    // „passing one nine a thousand“, „three six nine a point two five“
    else if (b === 'a' && near(words[k - 1]) && /^(thousand|point)$/.test(bare(words[k + 1]))) attempt(removed())
    // „niner“ als „9 R“ …
    else if (b === 'r' && /9$/.test(bare(words[k - 1]))) attempt(removed())
    else if (/^\d+$/.test(b)) {
      // … oder als „90“: „Ghost 901“, „runway 090“
      for (let at = b.indexOf('90'); at >= 0; at = b.indexOf('90', at + 1)) if (attempt(replaced(b.slice(0, at + 1) + b.slice(at + 2)))) break
      // „411“ für „Ford one one“
      for (const [name, d] of Object.entries(NAME_DIGITS)) if (expectedWords.has(name) && b.length > 1 && b.startsWith(d) && attempt(replaced(`${name} ${b.slice(1)}`))) break
    }
    // „point eight“ schreibt die Erkennung als „0.8“ – „Two, for 0.8“ ist „Two, four point eight“
    else if (/^0\.\d+$/.test(b)) {
      const tail = `point ${b.slice(2)}`
      const prev = DIGIT_HOMOPHONES[bare(words[k - 1])]
      if (!attempt(replaced(tail)) && prev) attempt(words.map((x, i) => (i === k ? tail + w.slice(b.length) : i === k - 1 ? prev : x)))
    }
  }
  // Mehrere Durchgänge: Eine Umschreibung kann die nächste erst möglich machen
  // („for 0.8“ → „for point 8“ → „four point 8“)
  for (let pass = 0, before = NaN; pass < 3 && before !== current; pass++) {
    before = current
    rewritePass()
  }
  return words.join(' ')
}

// ---------------------------------------------------------------------------
// Bewertung
// ---------------------------------------------------------------------------

export interface ScoreOptions {
  /**
   * Getippt oder gesprochen (Transkript der Spracherkennung). Beim Sprechen gelten getrennte und
   * zusammengeschriebene Wörter gleich, Verzögerungslaute („äh“) zählen nicht als überflüssig, und
   * Abweichungen heißen „erkannt als“ statt „Tippfehler“. Kommas trennen nichts, und Wörter wie
   * „for“ zählen neben Zahlen als Ziffer, wenn die erwartete Zahl herauskommt (`prepareSpoken`).
   * Brevity und Standardwörter bleiben streng.
   */
  source?: 'typed' | 'spoken'
}

export function scoreCall(input: string, segments: readonly ScoreSegment[], roleLabel: (role: string) => string = (r) => r, options: ScoreOptions = {}): CallScore {
  const spoken = options.source === 'spoken'
  // Je Teil: Text, gleichwertige `alt`, dann die nur geduldeten `weak`-Formen (ab Index weakFrom)
  const segItems = segments.map((seg) => [seg.text, ...(seg.alt ?? []), ...(seg.weak ?? [])].map(toItems))
  const weakFrom = segments.map((seg) => 1 + (seg.alt?.length ?? 0))
  const isWeak = (m: Match, slot: number) => m.alt !== undefined && m.alt >= weakFrom[slot]
  const weakIssue = (m: Match, slot: number) => {
    const seg = segments[slot]
    // Der Wortlaut der geduldeten Form aus dem Inhalt („Two“), nicht die normalisierte Eingabe („2“)
    const form = seg.weak?.[(m.alt ?? 0) - weakFrom[slot]] ?? m.heard
    issues.push(`Gilt, aber nicht nach Vorschrift: „${form}“ – ${seg.weakNote ?? `vollständig heißt es „${seg.text}“`}.`)
  }
  const expectedNums = segItems.flatMap((alts) => alts[0].filter((x) => x.kind === 'num')) as { n: number; text: string }[]
  const allExpected = new Set(segItems.flatMap((alts) => alts.flat()).flatMap((x) => (x.kind === 'num' ? [x.n] : [])))
  const expectedWords = new Set(segItems.flatMap((alts) => alts.flat()).flatMap((x) => (x.kind === 'word' ? [x.w] : [])))
  const text = spoken ? prepareSpoken(input, allExpected, expectedNums, expectedWords) : input
  const typed = splitMergedNumbers(toItems(resolveDigitCommas(text, allExpected)), expectedNums)
  const user = spoken ? joinCompounds(typed, segItems).filter((it) => !(it.kind === 'word' && HESITATIONS.has(it.w))) : typed
  const used = user.map(() => false)
  const slots: SlotResult[] = []
  const issues: string[] = []
  const typos = new Map<string, string>()
  let cursor = 0
  const owner: (number | undefined)[] = user.map(() => undefined)
  const mark = (m: Match, slot: number) => {
    for (let k = m.start; k < m.end; k++) {
      used[k] = true
      owner[k] = slot
    }
    for (const [got, want] of m.typos) typos.set(got, want)
    if (m.dropped?.length && !m.wrongNumber) {
      issues.push(`${m.dropped.map((w) => `„${w}“`).join(', ')} weggelassen – gilt, vollständig heißt es „${segments[slot].text}“.`)
    }
  }

  segments.forEach((seg, index) => {
    const alts = segItems[index]
    const leniency: Leniency = STRICT_ROLES.has(seg.role) ? 'strict' : spoken && NAME_ROLES.has(seg.role) ? 'name' : 'typo'
    const rules: MatchRules = { tol: seg.tolerance, leniency, spoken }
    // 1. an der erwarteten Stelle (ab cursor), Zahlen korrekt
    let m = findMatch(alts, user, seg.free ? 0 : cursor, used, rules, false)
    if (m) {
      mark(m, index)
      if (!seg.free) cursor = m.end
      slots[index] = { index, status: 'ok', ...(isWeak(m, index) && { weak: true }) }
      if (isWeak(m, index)) weakIssue(m, index)
      return
    }
    // 2. irgendwo davor → andere Reihenfolge
    m = findMatch(alts, user, 0, used, rules, false)
    if (m) {
      mark(m, index)
      slots[index] = { index, status: 'misplaced', ...(isWeak(m, index) && { weak: true }) }
      issues.push(misplacedIssue(index, segments, roleLabel))
      if (isWeak(m, index)) weakIssue(m, index)
      return
    }
    // 3. Wörter passen, Zahl falsch – nicht bei erlaubten Zusätzen (optional und frei): Die zählen nur, wenn sie genau
    // passen, sonst schnappt sich z. B. „eight point four“ (Line 3) die 124 der Laser-Target-Line als falschen Wert.
    m = seg.optional && seg.free ? null : findMatch(alts, user, 0, used, rules, true)
    if (m) {
      mark(m, index)
      if (!seg.free && m.start >= cursor) cursor = m.end
      slots[index] = { index, status: 'wrong', heard: m.heard }
      issues.push(`Falscher Wert: „${m.heard}“ statt „${seg.text}“${seg.tolerance ? ` (Toleranz ±${seg.tolerance})` : ''}.`)
      return
    }
    // 4. noch nicht gefunden – „fast richtig“ prüfen wir, wenn alle anderen ihre Wörter haben
    slots[index] = { index, status: seg.optional ? 'skipped' : 'missing' }
  })

  // 5. Fehlende Pflichtteile: Gibt es übrig gebliebene Wörter, die fast passen?
  segments.forEach((seg, index) => {
    if (slots[index].status !== 'missing') return
    const m = nearMiss(segItems[index], user, used)
    if (m) {
      for (let k = m.start; k < m.end; k++) {
        used[k] = true
        owner[k] = index
      }
      slots[index] = { index, status: 'wrong', heard: m.heard, near: true }
      issues.push(`Fast: „${m.heard}“ – richtig ist „${seg.text}“ (${roleLabel(seg.role)}).`)
      return
    }
    issues.push(`${seg.critical ? 'Pflichtteil fehlt' : 'Es fehlt'}: „${seg.text}“ (${roleLabel(seg.role)}).`)
  })

  for (const [got, want] of typos) {
    issues.push(spoken ? `Erkannt als „${got}“ – gemeint ist „${want}“, zählt trotzdem.` : `Tippfehler: „${got}“ statt „${want}“ – zählt trotzdem.`)
  }
  if (/\boh\b/i.test(input)) issues.push('„oh“ statt „zero“ – im Funk spricht man die Null „zero“.')

  const extraItems = user.filter((_, i) => !used[i])
  const extras = extraItems.map((it) => (it.kind === 'word' ? it.w : it.text))
  const fillers = extras.filter((w) => FILLERS.has(w))
  if (fillers.length) issues.push(`Überflüssig: ${[...new Set(fillers)].map((f) => `„${f}“`).join(', ')} – im Funk gilt: so kurz wie möglich.`)
  const otherExtras = extras.filter((w) => !FILLERS.has(w))
  if (otherExtras.length) issues.push(`Zusätzlich gesagt: „${otherExtras.join(' ')}“.`)
  // Eine zusätzliche Zahl in derselben Form wie ein erwarteter Wert widerspricht ihm („heading 090, heading 180“)
  const shapes = new Set(expectedNums.map((e) => shapeOf(e.text)))
  const conflicting = extraItems.filter((x) => x.kind === 'num' && shapes.has(shapeOf(x.text)) && !expectedNums.some((e) => e.n === x.n))
  if (conflicting.length) {
    issues.push(`Widersprüchlicher Wert: „${conflicting.map((x) => (x.kind === 'num' ? x.text : '')).join(', ')}“ – im Funk muss jeder Wert eindeutig sein.`)
  }

  const required = segments.filter((s) => !s.optional).length || 1
  const points = slots.reduce((sum, s) => {
    if (segments[s.index].optional) return sum
    const base = s.status === 'ok' ? 1 : s.status === 'misplaced' ? 0.75 : s.near ? 0.5 : 0
    // Geduldete Form (`weak`): halbe Punkte für diesen Teil, der Funkspruch bleibt richtig
    return sum + (s.weak ? base / 2 : base)
  }, 0)
  const correct =
    conflicting.length === 0 &&
    slots.every((s) => s.status === 'ok' || s.status === 'skipped' || (s.status === 'misplaced' && !orderMatters(segments[s.index], segments)))
  const heard = user.map((it, i) => ({ text: it.kind === 'word' ? it.w : it.text, slot: owner[i] }))
  const weak = slots.some((s) => s.weak)
  return { correct, score: Math.max(0, Math.min(1, points / required)), slots, extras, fillers, issues, heard, weak }
}
