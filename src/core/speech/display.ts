/**
 * Erkannte Zahlen zum Anzeigen in Worte fassen. Die Erkennung (Whisper) schreibt Zahlen immer als Ziffern – „Pontiac 5.1“,
 * „350.5“ –, gesprochen war „five one“, „three five zero decimal five“. Bewertet wird weiter auf dem Transkript; die
 * Anzeige zeigt die Zahl so, wie man sie im Funk spricht: im Wortlaut der Musterlösung, wenn der Wert darin vorkommt,
 * sonst Ziffer für Ziffer.
 *
 * Bekannte Grenze: Ob wirklich Ziffer für Ziffer gesprochen wurde, schreibt die Erkennung nicht mit – „three hundred
 * fifty point five“ wird ebenfalls „350.5“ (siehe docs/spracherkennung.md, „Bekannte Grenzen“).
 */
import { DIGIT_WORDS } from '../phraseology/spoken'
import { toItems } from '../scoring/score'

const NUMBER_WORD =
  /^(zero|one|two|three|four|five|six|seven|eight|nine|niner|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|point|decimal)$/i

export interface NumberPhrase {
  /** Wert, wie ihn die Bewertung liest. */
  n: number
  /** Die Wörter aus dem Text, z. B. „five one“, „thirty-nine thousand“. */
  words: string
}

/**
 * Zahlen in Worten aus einem erwarteten Text, mit ihrem Wert: „Pontiac five one“ → five one = 51. Ziffern im Text
 * zählen nicht (die Anzeige soll Worte zeigen); ein Komma trennt zwei Zahlen.
 */
export function numberPhrases(text: string): NumberPhrase[] {
  const out: NumberPhrase[] = []
  let run: string[] = []
  const flush = () => {
    while (run.length && /^(point|decimal|hundred|thousand)$/i.test(run[0])) run.shift()
    while (run.length && /^(point|decimal)$/i.test(run[run.length - 1])) run.pop()
    if (run.length) {
      const nums = toItems(run.join(' ')).filter((it) => it.kind === 'num')
      if (nums.length === 1 && nums[0].kind === 'num')
        out.push({ n: nums[0].n, words: run.join(' ') })
    }
    run = []
  }
  for (const raw of text.split(/\s+/)) {
    const word = raw.replace(/^[„“"'(]+|[,.;:!?“”"')]+$/g, '')
    const isNumber = word !== '' && word.split('-').every((p) => NUMBER_WORD.test(p))
    if (isNumber) run.push(word)
    else flush()
    if (isNumber && /[,;:!?]["“”')]*$/.test(raw)) flush()
  }
  flush()
  return out
}

const phraseCache = new Map<string, NumberPhrase[]>()
const phrasesOf = (text: string) => {
  let hit = phraseCache.get(text)
  if (!hit) phraseCache.set(text, (hit = numberPhrases(text)))
  return hit
}

/** Wortlaut für einen Wert aus den erwarteten Texten (in dieser Reihenfolge gesucht). */
function findWords(value: number, texts: readonly string[]): string | undefined {
  if (!Number.isFinite(value)) return undefined
  for (const t of texts) for (const p of phrasesOf(t)) if (p.n === value) return p.words
  return undefined
}

/** „decimal“, wenn die erwarteten Texte so sprechen, sonst „point“. */
const pointWord = (texts: readonly string[]) =>
  texts.some((t) => /\bdecimal\b/i.test(t)) ? 'decimal' : 'point'

/** Ziffer für Ziffer: „350.5“ → „three five zero point five“. */
function spell(digits: string, point: string): string {
  return [...digits]
    .map((c) => (c === '.' ? point : /\d/.test(c) ? DIGIT_WORDS[Number(c)] : ''))
    .filter(Boolean)
    .join(' ')
}

/**
 * „5.2“ für gesprochenes „five two“: Hat die Musterlösung hier eine ganze Zahl mit so vielen Ziffern und keine
 * Dezimalzahl dieser Form, trennt der Punkt nur Ziffern – so schreibt die Erkennung Rufzeichen.
 */
function pointOnlySeparates(numText: string, texts: readonly string[]): boolean {
  const [whole, frac = ''] = numText.split('.')
  const phrases = texts.flatMap(phrasesOf)
  const sameDecimal = phrases.some((p) => {
    const [w, f = ''] = String(p.n).split('.')
    return f !== '' && w.length === whole.length && f.length === frac.length
  })
  return (
    !sameDecimal &&
    phrases.some((p) => Number.isInteger(p.n) && String(p.n).length === whole.length + frac.length)
  )
}

/**
 * Eine erkannte Zahl („51“, „350.5“) in Worten: im Wortlaut der erwarteten Texte, wenn der Wert darin vorkommt (die
 * Texte in Vorrang-Reihenfolge, z. B. erst der zugeordnete Teil, dann der ganze Funkspruch), sonst Ziffer für Ziffer.
 * `focus`: die Texte an dieser Stelle (z. B. der zugeordnete Teil) – danach richtet sich, ob ein Punkt nur trennt.
 */
export function numberInWords(
  numText: string,
  texts: readonly string[],
  focus: readonly string[] = texts,
): string {
  const known = findWords(Number(numText), texts)
  if (known) return known
  if (/^\d+\.\d+$/.test(numText) && pointOnlySeparates(numText, focus))
    return spell(numText.replace('.', ''), 'point')
  return spell(numText, pointWord(texts))
}

/** Eine Ziffernfolge aus dem Transkript, auch mit Trennzeichen der Erkennung („5.1“, „1-1“, „6,000“, „5/1“). */
function tokenInWords(token: string, texts: readonly string[]): string {
  const seps = token.match(/[.,:/\-–]/g) ?? []
  if (seps.length === 0) return numberInWords(token, texts)
  const parts = token.split(/[.,:/\-–]/)
  // Dezimalzahl („350.5“, „121,5“), Tausender („6,000“) oder Trenner nur zwischen Ziffern („5.1“ für „five one“)
  const decimal =
    seps.length === 1 && /[.,]/.test(seps[0])
      ? findWords(Number(parts.join('.')), texts)
      : undefined
  const thousands =
    seps.every((s) => s === ',') && parts.slice(1).every((p) => p.length === 3)
      ? findWords(Number(parts.join('')), texts)
      : undefined
  const joined = findWords(Number(parts.join('')), texts)
  const known = decimal ?? thousands ?? joined
  if (known) return known
  if (seps.length === 1 && /[.,]/.test(seps[0])) return numberInWords(parts.join('.'), texts)
  return parts.map((p) => numberInWords(p, texts)).join(' ')
}

/**
 * Transkript zum Anzeigen: Zahlen in Worten, im Wortlaut der erwarteten Texte, wo der Wert passt. Ohne erwartete Texte
 * (z. B. im Checkride) Ziffer für Ziffer – die Schreibweise soll dort nicht verraten, ob eine Zahl stimmt.
 */
export function transcriptInWords(transcript: string, texts: readonly string[] = []): string {
  return transcript
    .replace(/(\p{L})(\d)/gu, '$1 $2')
    .replace(/(\d)(\p{L})/gu, '$1 $2')
    .replace(/\d+(?:[.,:/\-–]\d+)*/g, (token) => tokenInWords(token, texts))
}

/**
 * Hinweise der Bewertung zu einem gesprochenen Funkspruch zum Anzeigen: Zahlen in Anführungszeichen („pontiac 5.2“) in
 * Worten, wie im Transkript. Werte außerhalb der Anführungszeichen (Prozent, Toleranz) bleiben.
 */
export function issueInWords(issue: string, texts: readonly string[]): string {
  return issue.replace(
    /„([^“]*\d[^“]*)“/g,
    (_, quoted: string) => `„${transcriptInWords(quoted, texts)}“`,
  )
}
