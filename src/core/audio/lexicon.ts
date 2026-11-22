/**
 * Wörterbuch für die Aussprache: misaki-Lexika (gold vor silver) plus die Einträge von Hand.
 */
import type { Dialect, Lookup } from './g2p'
import { LEXICON_EXTRA } from './lexicon-extra'

/** Ein misaki-Lexikon: Wort → Phoneme, bei mehrdeutigen Wörtern je Wortart (DEFAULT, VERB …). */
export type RawLexicon = Record<string, string | Record<string, string | null> | null>

/** Mehrdeutige Einträge auf eine Aussprache bringen (DEFAULT, sonst die erste). */
export function flattenLexicon(raw: RawLexicon): Map<string, string> {
  const out = new Map<string, string>()
  for (const [word, v] of Object.entries(raw)) {
    if (typeof v === 'string') out.set(word, v)
    else if (v && typeof v === 'object') {
      const p = v.DEFAULT ?? Object.values(v).find((x): x is string => typeof x === 'string')
      if (p) out.set(word, p)
    }
  }
  return out
}

/** Nachschlagen: erst die Einträge von Hand, dann die Lexika in der angegebenen Reihenfolge. */
export function makeLookup(dialect: Dialect, lexicons: readonly Map<string, string>[]): Lookup {
  return (word) => {
    const extra = LEXICON_EXTRA[word.toLowerCase()]
    if (extra) return dialect === 'gb' ? (extra.gb ?? extra.us) : extra.us
    for (const lex of lexicons) {
      const p = lex.get(word)
      if (p) return p
    }
    return undefined
  }
}
