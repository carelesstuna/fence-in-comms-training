/**
 * Normalisierer für getippte (und später gesprochene) Funksprüche.
 * Ziel: "two-five-zero", "250" und "too fife zero" sollen gleich sein.
 *
 * Regeln:
 * - Kleinschreibung, Satzzeichen weg, Bindestriche trennen
 * - Ziffernwörter (auch ICAO: wun, too, tree, fower, fife, ait, niner, nine) → Ziffer. „nine“ gilt in Antworten
 *   absichtlich mit: Die Aussprache wird nicht bewertet, und die Spracherkennung schreibt „niner“ als „nine“.
 * - Ziffernfolgen ("250", "260.0") → einzelne Ziffern-Token
 * - "point"/"decimal" → "."
 * - Varianten im Alphabet (alpha/alfa, juliet/juliett, charley/charly, whisky, viktor, oskar, "x ray", "fox trot")
 *   werden vereinheitlicht
 * - Beim Vergleich (`sameCall`) gilt für Buchstabierwörter zusätzlich eine Tippfehler-Toleranz, siehe unten
 *
 * Zusammengesetzte Zahlwörter wie "fifty" oder "fifteen" werden bewusst NICHT umgewandelt:
 * Im Funk spricht man Ziffern einzeln, "two fifty" ist also wirklich anders als "two five zero".
 */

const WORD_MAP: Record<string, string> = {
  zero: '0',
  oh: '0',
  one: '1',
  wun: '1',
  two: '2',
  too: '2',
  three: '3',
  tree: '3',
  four: '4',
  fower: '4',
  five: '5',
  fife: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ait: '8',
  nine: '9',
  niner: '9',
  point: '.',
  decimal: '.',
  alpha: 'alfa',
  charley: 'charlie',
  charly: 'charlie',
  juliet: 'juliett',
  oskar: 'oscar',
  viktor: 'victor',
  whisky: 'whiskey',
  xray: 'x-ray',
  affirmative: 'affirm',
}

export function normalizeTokens(text: string): string[] {
  return normalizeTokensWithDigits(text).tokens
}

/** Tokens wie `normalizeTokens`; `digits[i]`: Das Token stammt aus Ziffern („3“), nicht aus einem Zahlwort („three“). */
export function normalizeTokensWithDigits(text: string): { tokens: string[]; digits: boolean[] } {
  const cleaned = text
    .toLowerCase()
    // Alphabet-Wörter, die man auseinander oder mit Bindestrich schreibt: "x ray", "x-ray", "fox trot"
    .replace(/\bx[\s\-–—_]*ray\b/g, 'xray')
    .replace(/\bfox[\s\-–—_]+trot\b/g, 'foxtrot')
    // „QNH“ buchstabiert oder mit Punkten („Q N H“, „Q.N.H.“) ist dasselbe Wort (E3-12, ICAO-Plätze)
    .replace(/\bq[\s.-]*n[\s.-]*h\b\.?/g, 'qnh')
    .replace(/[„“"'’`´]/g, '')
    // Gradzeichen und „deg“ sind Schreibweise, kein gesprochenes Wort: "270°" = "270 deg" = "270"
    .replace(/(\d)\s*deg\b/g, '$1 ')
    .replace(/[°º]/g, ' ')
    // Kurzschrift: "FL220" = "flight level 220"
    .replace(/\bfl\s?(\d{2,3})\b/g, 'flight level $1')
    // Kurzschrift der Bahn: "21R" = "21 right", "03L" = "03 left", "31C" = "31 center" (wie „two one right“ gesprochen)
    .replace(/\b(\d{1,2})([lrc])\b/g, (_m, num: string, side: string) => `${num} ${{ l: 'left', r: 'right', c: 'center' }[side as 'l' | 'r' | 'c']}`)
    .replace(/(\d)\.(\d)/g, '$1 point $2')
    .replace(/[,;:!?()[\]{}/\\\-–—_]+/g, ' ')
    .replace(/\.(?=\s|$)/g, ' ')
  const tokens: string[] = []
  // Ziffern, die einzeln dastanden („3“, „three“) – nicht aus einer mehrstelligen Zahl wie „3000“ zerlegt
  const single: boolean[] = []
  const digits: boolean[] = []
  for (const raw of cleaned.split(/\s+/)) {
    if (!raw) continue
    if (/^\d+$/.test(raw)) {
      tokens.push(...raw.split(''))
      single.push(...raw.split('').map(() => raw.length === 1))
      digits.push(...raw.split('').map(() => true))
      continue
    }
    tokens.push(WORD_MAP[raw] ?? raw)
    single.push(true)
    digits.push(false)
  }
  // "three for zero" – zwischen zwei einzelnen Ziffern ist "for" ein vertipptes "four".
  // Nicht zwischen Zahlen: "passing 3000 for 6000" heißt „von 3000 auf 6000“.
  for (let i = 1; i < tokens.length - 1; i++) {
    if (tokens[i] === 'for' && /^\d$/.test(tokens[i - 1]) && /^\d$/.test(tokens[i + 1]) && single[i - 1] && single[i + 1]) tokens[i] = '4'
  }
  return { tokens, digits }
}

const TENS_DIGIT: Record<string, string> = { twenty: '2', thirty: '3', forty: '4', fifty: '5', sixty: '6', seventy: '7', eighty: '8', ninety: '9' }
const TEENS_DIGITS: Record<string, string> = {
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
}

/**
 * Ausnahme von der Regel oben: Vor „thousand“ sind Zahlwörter eindeutig eine Höhe. AWACS spricht
 * Kontakthöhen als ganze Zahl („twenty-five thousand“), der Pilot oft ziffernweise („two five thousand“) –
 * beides ist dieselbe Höhe. "twenty five thousand" → "2 5 thousand", "fifteen thousand" → "1 5 thousand".
 */
function compoundThousands(tokens: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const tens = TENS_DIGIT[t]
    if (tens && /^[1-9]$/.test(tokens[i + 1] ?? '') && tokens[i + 2] === 'thousand') {
      out.push(tens, tokens[++i])
    } else if (tens && tokens[i + 1] === 'thousand') {
      out.push(tens, '0')
    } else if (TEENS_DIGITS[t] && tokens[i + 1] === 'thousand') {
      out.push(...TEENS_DIGITS[t].split(''))
    } else {
      out.push(t)
    }
  }
  return out
}

/**
 * Ziffernfolgen zusammenfassen; Nullen am Ende der Nachkommastellen zählen nicht ("41.50" = "41.5").
 * Die führende Null einer Bahnnummer ist optional: "runway 09" (ICAO) = "runway 9" (FAA, US-Plätze).
 */
function canonical(tokens: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < tokens.length; ) {
    if (!/^\d$/.test(tokens[i])) {
      out.push(tokens[i++])
      continue
    }
    let s = ''
    while (i < tokens.length && (/^\d$/.test(tokens[i]) || (tokens[i] === '.' && !s.includes('.') && /^\d$/.test(tokens[i + 1] ?? '')))) s += tokens[i++]
    if (out[out.length - 1] === 'runway' && /^0\d$/.test(s)) s = s.slice(1)
    out.push(s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)
  }
  return out
}

// ---------------------------------------------------------------------------
// Buchstabierwörter: Tippfehler-Toleranz
// ---------------------------------------------------------------------------

/**
 * Die 26 Wörter des ICAO/NATO-Alphabets in der Schreibweise des Normalisierers (klein, "x-ray" mit Bindestrich).
 * Maßgeblich ist `content/glossary/phonetic.yaml`; ein Test hält beide Listen gleich.
 */
export const ALPHABET_WORDS: readonly string[] = [
  'alfa', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliett', 'kilo', 'lima', 'mike',
  'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'x-ray', 'yankee', 'zulu',
]

/** Vergleichsform: ohne Bindestrich, doppelte Buchstaben zusammengezogen ("sierra" und "siera" sind dasselbe). */
const fold = (w: string) => w.replace(/-/g, '').replace(/(.)\1+/g, '$1')

const ALPHABET_FORMS = ALPHABET_WORDS.map((word) => ({ word, plain: word.replace(/-/g, ''), form: fold(word) }))

/** Damerau-Levenshtein-Abstand (Einfügen, Löschen, Ersetzen, Vertauschen zweier Nachbarn je ein Fehler). */
function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

const nearestCache = new Map<string, string | undefined>()

/**
 * Das Alphabet-Wort, das gemeint sein muss: höchstens ein Fehler (Vertipper, doppelte Buchstaben egal) **und**
 * unter allen 26 Wörtern eindeutig das nächste. Sonst `undefined`. Nur für Alphabet-Wörter – bei Zahlen, Brevity-
 * und Standardwörtern ("locked"/"blocked", "state"/"skate") bleibt der Vergleich streng.
 */
export function nearestAlphabetWord(token: string): string | undefined {
  if (nearestCache.has(token)) return nearestCache.get(token)
  let found: string | undefined
  if (/^[a-z-]{3,}$/.test(token)) {
    const plain = token.replace(/-/g, '')
    const form = fold(token)
    let best = 2
    let tie = false
    for (const c of ALPHABET_FORMS) {
      // je Wort der kleinere Abstand: mit Zusammenziehen doppelter Buchstaben oder ohne
      const d = Math.min(editDistance(form, c.form), editDistance(plain, c.plain))
      if (d < best) {
        best = d
        found = c.word
        tie = false
      } else if (d === best && d < 2) tie = true
    }
    if (tie) found = undefined
  }
  nearestCache.set(token, found)
  return found
}

export interface SpellingFix {
  /** Was getippt wurde (normalisiert, klein). */
  got: string
  /** Die richtige Schreibung des Alphabet-Wortes (klein). */
  want: string
}

const isAlphabetWord = (t: string) => ALPHABET_WORDS.includes(t)

/** Ist `got` ein verziehener Tippfehler von `want`? Nur wenn eines der beiden ein Alphabet-Wort ist. */
function spellingFix(got: string, want: string): SpellingFix | null {
  if (isAlphabetWord(want) && nearestAlphabetWord(got) === want) return { got, want }
  if (isAlphabetWord(got) && nearestAlphabetWord(want) === got) return { got: want, want: got }
  return null
}

/** Gleich, oder bei Alphabet-Wörtern bis auf einen verziehenen Tippfehler gleich. */
export function sameToken(a: string, b: string): boolean {
  return a === b || spellingFix(a, b) !== null
}

function compareTokens(ta: string[], tb: string[]): SpellingFix[] | null {
  if (ta.length !== tb.length) return null
  const fixes: SpellingFix[] = []
  for (let i = 0; i < ta.length; i++) {
    if (ta[i] === tb[i]) continue
    const fix = spellingFix(ta[i], tb[i])
    if (!fix) return null
    fixes.push(fix)
  }
  return fixes
}

const prepared = (text: string) => canonical(compoundThousands(normalizeTokens(text)))

/**
 * Vergleicht zwei Funksprüche. `null`, wenn sie nicht übereinstimmen; sonst die verziehenen Tippfehler
 * bei Buchstabierwörtern (leer bei exakter Übereinstimmung).
 */
export function compareCalls(a: string, b: string): SpellingFix[] | null {
  return compareTokens(prepared(a), prepared(b))
}

export function sameCall(a: string, b: string): boolean {
  return compareCalls(a, b) !== null
}

const isNumberToken = (t: string) => /^\d+(\.\d+)?$/.test(t)

/**
 * Komma zwischen Ziffern, wie man auf Deutsch mitschreibt: Dezimalkomma ("121,5", "251,250", "4,3") oder
 * Tausender ("25,000") – je nachdem, welche Zahl die Antwort enthält. Passt keine Lesart, bleibt das Komma ein
 * Trenner ("090,25" = "090/25").
 */
function resolveDigitCommas(input: string, answerTokens: readonly string[]): string {
  if (!/\d,\d/.test(input)) return input
  const nums = new Set(answerTokens.filter(isNumberToken).map(Number))
  return input.replace(/(\d+),(\d+)(?![\d.])/g, (whole, a: string, b: string) => {
    if (nums.has(Number(`${a}.${b}`))) return `${a}.${b}`
    // Tausendertrenner nur vor genau drei Ziffern: „25,000“, nicht „2,5000“
    if (b.length === 3 && nums.has(Number(`${a}${b}`))) return `${a}${b}`
    return whole
  })
}

/** Wörter vor einer Kanalnummer, die nur sagen, dass es ein Kanal ist: „Kanal 13“, „ch4“, „UHF 3“, „button 3“. */
const CHANNEL_PREFIX = /^\s*(?:kanal|channel|chan|ch|button|btn|preset|uhf|uniform)(?:\s*\.\s*|\s+|(?=\d))/i

/**
 * Ist die Antwort nur ein Kanal: eine höchstens zweistellige Zahl, ein Buchstabe oder ein Buchstabierwort („13“, „B“,
 * „bravo“)? Frequenzen („121.5“, „243“) nicht – „uniform 121.5“ wäre das falsche Gerät.
 */
const isBareChannel = (tokens: readonly string[]) =>
  tokens.length === 1 && (/^\d{1,2}$/.test(tokens[0]) || /^[a-z]$/.test(tokens[0]) || ALPHABET_WORDS.includes(tokens[0]))

/** „the“ lässt man im Funk weg; in einer Eingabe stört es nicht („say again the frequency“). */
const withoutThe = (tokens: readonly string[]) => tokens.filter((t) => t !== 'the')

/** Lesarten der Eingabe für eine akzeptierte Antwort: wie getippt, ohne Kanal-Vorwort, ohne „the“. */
function compareInput(input: string, answer: string): SpellingFix[] | null {
  const want = prepared(answer)
  const resolved = resolveDigitCommas(input, want)
  const readings = [resolved]
  if (isBareChannel(want)) {
    // höchstens zwei Vorwörter: „UHF Kanal 3“
    const once = resolved.replace(CHANNEL_PREFIX, '')
    readings.push(once, once.replace(CHANNEL_PREFIX, ''))
  }
  for (const r of readings) {
    const got = prepared(r)
    const fixes = compareTokens(got, want) ?? compareTokens(withoutThe(got), withoutThe(want))
    if (fixes) return fixes
  }
  return null
}

/**
 * Stimmt die Eingabe mit einer der akzeptierten Antworten überein? Liefert die verziehenen Tippfehler der besten.
 * Wie man mitschreibt, gilt auch: Dezimalkomma („121,5“), Kanal mit Vorwort („Kanal 13“, „UHF 3“), „the“ zu viel
 * oder zu wenig, Bahnnummer ohne führende Null.
 */
export function matchAny(input: string, accepted: readonly string[]): SpellingFix[] | null {
  let best: SpellingFix[] | null = null
  for (const a of accepted) {
    const fixes = compareInput(input, a)
    if (fixes && (!best || fixes.length < best.length)) best = fixes
  }
  return best
}

/**
 * Die Zahlen eines Textes der Reihe nach (Ziffernfolgen wie beim Vergleich, Dezimalpunkt eingeschlossen): jeweils `true`,
 * wenn sie mit Ziffern geschrieben ist („261.8“, „13R“), `false` in Worten („two six one point eight“).
 */
function numberForms(text: string): boolean[] {
  const { tokens, digits } = normalizeTokensWithDigits(text)
  const forms: boolean[] = []
  for (let i = 0; i < tokens.length; ) {
    if (!/^\d$/.test(tokens[i])) {
      i++
      continue
    }
    let written = false
    while (i < tokens.length && (/^\d$/.test(tokens[i]) || (tokens[i] === '.' && /^\d$/.test(tokens[i + 1] ?? '')))) {
      if (digits[i]) written = true
      i++
    }
    forms.push(written)
  }
  return forms
}

/** Erlaubt die Antwort getippte Ziffern für jede Zahl der Eingabe? Wo sie in Worten steht, müssen auch Worte stehen. */
function digitsAllowed(input: string, answer: string): boolean {
  const got = numberForms(input)
  const want = numberForms(answer)
  // Lassen sich die Zahlen nicht eins zu eins zuordnen, gilt: Ziffern nur, wenn die Antwort überhaupt welche hat
  if (got.length !== want.length) return !got.some(Boolean) || want.some(Boolean)
  return got.every((typed, k) => !typed || want[k])
}

/**
 * Getippte Antwort einer Freitext-Übung: wie `matchAny`, aber Ziffern zählen nur, wo die akzeptierte Antwort an dieser
 * Stelle selbst Ziffern hat. Steht eine Zahl dort in Worten, ist die Funk-Form gefragt – „301.25“ aus der Aufgabe
 * abzutippen reicht nicht, „Colt 3-1“ statt „Colt three one“ auch nicht. Gesprochen gilt das nicht: Die Erkennung
 * schreibt Zahlen immer als Ziffern, gesagt wurden die Wörter (`matchSpoken`).
 */
export function matchTyped(input: string, accepted: readonly string[]): SpellingFix[] | null {
  return matchAny(input, accepted.filter((a) => digitsAllowed(input, a)))
}

/** Steht im Text eine Zahl – in Ziffern oder in Worten? */
export function containsNumber(text: string): boolean {
  return numberForms(text).length > 0
}

/** Steht im Text mindestens eine Zahl in Worten („Enfield one one“)? */
export function hasNumberInWords(text: string): boolean {
  return numberForms(text).some((written) => !written)
}

/** Verlangt die Übung beim Tippen Zahlen in Worten? (Jede akzeptierte Antwort hat mindestens eine Zahl in Worten.) */
export function typedNeedsWords(accepted: readonly string[]): boolean {
  return accepted.length > 0 && accepted.every(hasNumberInWords)
}

export function matchesAny(input: string, accepted: readonly string[]): boolean {
  return matchAny(input, accepted) !== null
}

/** Alle Formulierungen, die für ein Segment gelten: der Text und seine gleichwertigen Varianten (`alt`). */
export function segmentAnswers(seg: { text: string; alt?: readonly string[] }): string[] {
  return [seg.text, ...(seg.alt ?? [])]
}
