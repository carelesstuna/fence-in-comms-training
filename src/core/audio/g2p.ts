/**
 * Aussprache für die Sprachausgabe (Kokoro): Text → Phoneme → Token-IDs.
 *
 * Kokoro wurde mit den Phonemen von misaki trainiert (hexgrad/misaki, Apache-2.0). Statt espeak-ng
 * (GPL) zur Laufzeit nutzt die App die misaki-Lexika (auf Klick nachgeladen, `lexicon.ts`) – das
 * Vokabular der Inhalte ist geschlossen, alle gewürfelten Werte stammen aus den Pools. Was in den
 * Lexika fehlt, steht von Hand in `lexicon-extra.ts`.
 * Wortformen (-s, -ed, -ing), zusammengesetzte Wörter und Buchstabieren fangen den Rest auf.
 */
import { DIGIT_WORDS } from '../phraseology/spoken'

export type Dialect = 'us' | 'gb'

/** Nachschlagen eines Worts (genau so geschrieben); undefined = unbekannt. */
export type Lookup = (word: string) => string | undefined

const SIBILANT = /[szʃʒʧʤ]$/
const VOICELESS = /[ptkfθ]$/

/** Buchstaben einzeln, wie misaki sie spricht. */
// prettier-ignore
const LETTERS: Record<Dialect, Record<string, string>> = {
  us: {
    a: 'ˈA', b: 'bˈi', c: 'sˈi', d: 'dˈi', e: 'ˈi', f: 'ˈɛf', g: 'ʤˈi', h: 'ˈAʧ', i: 'ˈI', j: 'ʤˈA', k: 'kˈA', l: 'ˈɛl', m: 'ˈɛm',
    n: 'ˈɛn', o: 'ˈO', p: 'pˈi', q: 'kjˈu', r: 'ˈɑɹ', s: 'ˈɛs', t: 'tˈi', u: 'jˈu', v: 'vˈi', w: 'dˈʌbᵊljˌu', x: 'ˈɛks', y: 'wˈI', z: 'zˈi',
  },
  gb: {
    a: 'ˈA', b: 'bˈiː', c: 'sˈiː', d: 'dˈiː', e: 'ˈiː', f: 'ˈɛf', g: 'ʤˈiː', h: 'ˈAʧ', i: 'ˈI', j: 'ʤˈA', k: 'kˈA', l: 'ˈɛl', m: 'ˈɛm',
    n: 'ˈɛn', o: 'ˈQ', p: 'pˈiː', q: 'kjˈuː', r: 'ˈɑː', s: 'ˈɛs', t: 'tˈiː', u: 'jˈuː', v: 'vˈiː', w: 'dˈʌbᵊljuː', x: 'ˈɛks', y: 'wˈI', z: 'zˈɛd',
  },
}

/** Ziffern, die noch im Text stehen („1-1“, „260.0“), werden Ziffer für Ziffer gesprochen. */
export function speakDigits(text: string): string {
  return text
    .replace(/(\d)\s*-\s*(?=\d)/g, '$1 ')
    .replace(/(\d)(?=[A-Za-z])/g, '$1 ')
    .replace(/([A-Za-z])(?=\d)/g, '$1 ')
    .replace(/\d+(?:\.\d+)?/g, (m) =>
      [...m].map((c) => (c === '.' ? 'point' : DIGIT_WORDS[Number(c)])).join(' '),
    )
}

/** Text in Wörter und Satzzeichen zerlegen. Satzzeichen geben Kokoro die Pausen. */
export function tokenize(text: string): string[] {
  const clean = speakDigits(text)
    .replace(/[’`´]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[/–—]/g, ', ')
    .replace(/["“”„()[\]{}*_#]/g, ' ')
    // Bindestrich zwischen Buchstaben trennt Wörter („twenty-five“, „Senaki-Kolkhi“)
    .replace(/([A-Za-z])-(?=[A-Za-z])/g, '$1 ')
  return clean.match(/[A-Za-z]+(?:'[A-Za-z]+)*|[,.;:!?]/g) ?? []
}

function withSuffix(stem: string, kind: 's' | 'ed', dialect: Dialect): string {
  const schwa = dialect === 'us' ? 'ᵻ' : 'ɪ'
  if (kind === 's')
    return SIBILANT.test(stem) ? `${stem}${schwa}z` : VOICELESS.test(stem) ? `${stem}s` : `${stem}z`
  return /[td]$/.test(stem)
    ? `${stem}${schwa}d`
    : VOICELESS.test(stem) || /[sʃʧ]$/.test(stem)
      ? `${stem}t`
      : `${stem}d`
}

/** Wort in allen Schreibweisen nachschlagen (genau, klein, groß am Anfang). */
function direct(word: string, lookup: Lookup): string | undefined {
  const lower = word.toLowerCase()
  return lookup(word) ?? lookup(lower) ?? lookup(lower[0].toUpperCase() + lower.slice(1))
}

/** Wortformen: Plural, Vergangenheit, -ing – wenn der Stamm bekannt ist. */
function morph(word: string, lookup: Lookup, dialect: Dialect): string | undefined {
  const w = word.toLowerCase()
  const tryStems = (stems: string[]) => {
    for (const s of stems) {
      if (s.length < 2) continue
      const p = direct(s, lookup)
      if (p) return p
    }
    return undefined
  }
  if (w.endsWith("'s")) {
    const p = tryStems([w.slice(0, -2)])
    if (p) return withSuffix(p, 's', dialect)
  }
  if (w.endsWith('ies')) {
    const p = tryStems([`${w.slice(0, -3)}y`])
    if (p) return withSuffix(p, 's', dialect)
  }
  if (w.endsWith('es')) {
    const p = tryStems([w.slice(0, -2)])
    if (p && SIBILANT.test(p)) return withSuffix(p, 's', dialect)
  }
  if (w.endsWith('s') && !w.endsWith('ss')) {
    const p = tryStems([w.slice(0, -1)])
    if (p) return withSuffix(p, 's', dialect)
  }
  if (w.endsWith('ied')) {
    const p = tryStems([`${w.slice(0, -3)}y`])
    if (p) return withSuffix(p, 'ed', dialect)
  }
  if (w.endsWith('ed')) {
    const base = w.slice(0, -2)
    const doubled = base.length > 2 && base.at(-1) === base.at(-2) ? base.slice(0, -1) : base
    const p = tryStems([base, `${base}e`, doubled])
    if (p) return withSuffix(p, 'ed', dialect)
  }
  if (w.endsWith('ing')) {
    const base = w.slice(0, -3)
    const doubled = base.length > 2 && base.at(-1) === base.at(-2) ? base.slice(0, -1) : base
    const p = tryStems([base, `${base}e`, doubled])
    if (p) return `${p}ɪŋ`
  }
  return undefined
}

/** Zusammengesetzt aus zwei bekannten Wörtern („Darkstar“, „Axeman“, „Overlord“). */
function compound(word: string, lookup: Lookup): string | undefined {
  const w = word.toLowerCase()
  for (let i = w.length - 3; i >= 3; i--) {
    const a = direct(w.slice(0, i), lookup)
    const b = a && direct(w.slice(i), lookup)
    // Nebenbetonung für den zweiten Teil
    if (a && b) return `${a}${b.replace('ˈ', 'ˌ')}`
  }
  return undefined
}

export function spellLetters(word: string, dialect: Dialect): string {
  return [...word.toLowerCase()]
    .map((c) => LETTERS[dialect][c])
    .filter(Boolean)
    .join(' ')
}

export interface WordPhonemes {
  word: string
  phonemes: string
  /** Woher die Aussprache kommt – für Tests und die Fehlersuche. */
  via: 'lexicon' | 'morph' | 'compound' | 'spelled'
}

/** Aussprache eines Worts. Abkürzungen in Großbuchstaben ohne Eintrag werden buchstabiert. */
export function wordPhonemes(word: string, lookup: Lookup, dialect: Dialect): WordPhonemes {
  const d = direct(word, lookup)
  if (d) return { word, phonemes: d, via: 'lexicon' }
  const isAcronym = word.length <= 5 && word === word.toUpperCase()
  if (!isAcronym) {
    const m = morph(word, lookup, dialect)
    if (m) return { word, phonemes: m, via: 'morph' }
    const c = compound(word, lookup)
    if (c) return { word, phonemes: c, via: 'compound' }
  }
  return { word, phonemes: spellLetters(word, dialect), via: 'spelled' }
}

/** Ganzer Text als Phonem-Zeichenkette für Kokoro. */
export function phonemize(text: string, lookup: Lookup, dialect: Dialect): string {
  let out = ''
  for (const tok of tokenize(text)) {
    if (/^[,.;:!?]$/.test(tok)) {
      out = out.trimEnd() + tok + ' '
      continue
    }
    out += wordPhonemes(tok, lookup, dialect).phonemes + ' '
  }
  return out.trim()
}

/** Kokoros Zeichen-Vokabular (aus tokenizer.json des Modells, fest für v1.0). */
// prettier-ignore
export const KOKORO_VOCAB: Readonly<Record<string, number>> = {
  ';': 1, ':': 2, ',': 3, '.': 4, '!': 5, '?': 6, '—': 9, '…': 10, '"': 11, '(': 12, ')': 13, '“': 14, '”': 15, ' ': 16,
  '̃': 17, 'ʣ': 18, 'ʥ': 19, 'ʦ': 20, 'ʨ': 21, 'ᵝ': 22, 'ꭧ': 23, A: 24, I: 25, O: 31, Q: 33, S: 35, T: 36, W: 39, Y: 41,
  'ᵊ': 42, a: 43, b: 44, c: 45, d: 46, e: 47, f: 48, h: 50, i: 51, j: 52, k: 53, l: 54, m: 55, n: 56, o: 57, p: 58, q: 59,
  r: 60, s: 61, t: 62, u: 63, v: 64, w: 65, x: 66, y: 67, z: 68, 'ɑ': 69, 'ɐ': 70, 'ɒ': 71, 'æ': 72, 'β': 75, 'ɔ': 76,
  'ɕ': 77, 'ç': 78, 'ɖ': 80, 'ð': 81, 'ʤ': 82, 'ə': 83, 'ɚ': 85, 'ɛ': 86, 'ɜ': 87, 'ɟ': 90, 'ɡ': 92, 'ɥ': 99, 'ɨ': 101,
  'ɪ': 102, 'ʝ': 103, 'ɯ': 110, 'ɰ': 111, 'ŋ': 112, 'ɳ': 113, 'ɲ': 114, 'ɴ': 115, 'ø': 116, 'ɸ': 118, 'θ': 119, 'œ': 120,
  'ɹ': 123, 'ɾ': 125, 'ɻ': 126, 'ʁ': 128, 'ɽ': 129, 'ʂ': 130, 'ʃ': 131, 'ʈ': 132, 'ʧ': 133, 'ʊ': 135, 'ʋ': 136, 'ʌ': 138,
  'ɣ': 139, 'ɤ': 140, 'χ': 142, 'ʎ': 143, 'ʒ': 147, 'ʔ': 148, 'ˈ': 156, 'ˌ': 157, 'ː': 158, 'ʰ': 162, 'ʲ': 164, '↓': 169,
  '→': 171, '↗': 172, '↘': 173, 'ᵻ': 177,
}

/** Höchstens so viele Phonem-Zeichen pro Aufruf (Kokoro: 510 Token samt Rand). */
export const MAX_PHONEMES = 500

/** Phoneme → Token-IDs mit Rand-Token 0 vorn und hinten. Unbekannte Zeichen fallen weg. */
export function tokenIds(phonemes: string): number[] {
  const ids = [0]
  for (const c of phonemes) {
    const id = KOKORO_VOCAB[c]
    if (id !== undefined) ids.push(id)
  }
  ids.push(0)
  return ids
}

/**
 * Lange Texte an Satzzeichen teilen, damit jedes Stück unter `max` Phonem-Zeichen bleibt
 * (ATIS-Ausgaben). Kurze Texte bleiben ein Stück.
 */
export function splitPhonemes(phonemes: string, max = MAX_PHONEMES): string[] {
  if (phonemes.length <= max) return [phonemes]
  const parts: string[] = []
  let rest = phonemes
  while (rest.length > max) {
    const window = rest.slice(0, max)
    const cut = Math.max(
      window.lastIndexOf('. '),
      window.lastIndexOf(', '),
      window.lastIndexOf('; '),
    )
    const at = cut > max / 3 ? cut + 1 : Math.max(window.lastIndexOf(' '), max / 2)
    parts.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) parts.push(rest)
  return parts
}
