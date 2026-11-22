/**
 * NATO-Alphabet in Eingaben (S-02): übliche Schreibvarianten und ein Tippfehler gelten als richtig.
 * Zahlen, Brevity- und Standardwörter bleiben streng.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../../content'
import {
  ALPHABET_WORDS,
  compareCalls,
  matchAny,
  matchesAny,
  nearestAlphabetWord,
  sameCall,
} from './normalize'

const index = contentResult.index!

/** Je Wort ein realistischer Tippfehler (vertauscht, Buchstabe fehlt, falscher Buchstabe, doppelt/einfach). */
const TIPPFEHLER: Record<string, string> = {
  alfa: 'afla',
  bravo: 'barvo',
  charlie: 'charlei',
  delta: 'delat',
  echo: 'ecko',
  foxtrot: 'foxtrt',
  golf: 'glof',
  hotel: 'hotle',
  india: 'indai',
  juliett: 'juilett',
  kilo: 'kiol',
  lima: 'lmia',
  mike: 'mkie',
  november: 'novembr',
  oscar: 'oscra',
  papa: 'pap',
  quebec: 'quebeck',
  romeo: 'romoe',
  sierra: 'siera',
  tango: 'tnago',
  uniform: 'unifrom',
  victor: 'victer',
  whiskey: 'wiskey',
  'x-ray': 'xrey',
  yankee: 'yanke',
  zulu: 'zuli',
}

/** Übliche Schreibweisen, die ohne Hinweis gelten. */
const VARIANTEN: [string, string][] = [
  ['alpha', 'alfa'],
  ['Charley', 'charlie'],
  ['Charly', 'charlie'],
  ['Juliet', 'juliett'],
  ['Oskar', 'oscar'],
  ['Viktor', 'victor'],
  ['Whisky', 'whiskey'],
  ['xray', 'x-ray'],
  ['x ray', 'x-ray'],
  ['X-Ray', 'x-ray'],
  ['fox trot', 'foxtrot'],
]

describe('Alphabet-Liste', () => {
  it('entspricht content/glossary/phonetic.yaml', () => {
    const words = index.phonetic.letters.map((l) => l.word.toLowerCase())
    expect([...ALPHABET_WORDS]).toEqual(words)
    expect(words).toHaveLength(26)
  })

  it('keine zwei Wörter liegen so nah beieinander, dass ein Tippfehler uneindeutig wäre', () => {
    for (const w of ALPHABET_WORDS) expect(nearestAlphabetWord(w), w).toBe(w)
  })
})

describe('Buchstabierwörter: Schreibung und Groß/Klein', () => {
  it.each(ALPHABET_WORDS.map((w) => [w]))('%s: Groß- und Kleinschreibung ist egal', (w) => {
    expect(sameCall(w, w)).toBe(true)
    expect(sameCall(w.toUpperCase(), w)).toBe(true)
    expect(sameCall(w, w.toUpperCase())).toBe(true)
    expect(compareCalls(w.toUpperCase(), w)).toEqual([])
    const mixed = [...w].map((c, i) => (i % 2 ? c : c.toUpperCase())).join('')
    expect(compareCalls(mixed, w)).toEqual([])
  })

  it.each(VARIANTEN)('„%s“ gilt als %s', (variante, wort) => {
    expect(compareCalls(variante, wort)).toEqual([])
    expect(sameCall(`Uniform ${variante} Kilo`, `Uniform ${wort} Kilo`)).toBe(true)
  })

  it('der Fall aus dem Spieltest: „uNiFoRm GOLF kilo Siera“', () => {
    const fixes = compareCalls('uNiFoRm GOLF kilo Siera', 'Uniform Golf Kilo Sierra')
    expect(fixes).toEqual([{ got: 'siera', want: 'sierra' }])
    expect(
      compareCalls('cHaRlIe HOTEL echo VICTOR yankee', 'Charlie Hotel Echo Victor Yankee'),
    ).toEqual([])
  })

  it('die ganze Liste mit allen Varianten auf einmal', () => {
    const erwartet = 'Uniform Golf Kilo Sierra Juliett X-ray Whiskey Charlie Alfa Quebec'
    const getippt = 'uniform golf kilo siera juliet x ray whisky charly alpha quebeck'
    const fixes = compareCalls(getippt, erwartet)
    expect(fixes).toEqual([
      { got: 'siera', want: 'sierra' },
      { got: 'quebeck', want: 'quebec' },
    ])
  })
})

describe('Buchstabierwörter: Tippfehler', () => {
  it('jedes der 26 Wörter hat einen Tippfehler in der Liste', () => {
    expect(Object.keys(TIPPFEHLER).sort()).toEqual([...ALPHABET_WORDS].sort())
  })

  it.each(Object.entries(TIPPFEHLER))(
    '%s: „%s“ wird verziehen und die Schreibung gezeigt',
    (wort, typo) => {
      expect(nearestAlphabetWord(typo)).toBe(wort)
      expect(compareCalls(typo, wort)).toEqual([{ got: typo, want: wort }])
      expect(compareCalls(typo.toUpperCase(), wort)).toEqual([{ got: typo, want: wort }])
      // in Reihenfolge im Satz und gegen mehrere erlaubte Antworten
      expect(sameCall(`taxi via ${typo}`, `taxi via ${wort}`)).toBe(true)
      expect(matchAny(typo, ['bravo bravo', wort])).toEqual([{ got: typo, want: wort }])
    },
  )

  it('alle Einzelfehler aller 26 Wörter (Buchstabe fehlt, vertauscht) werden dem richtigen Wort zugeordnet', () => {
    const fehler: string[] = []
    for (const w of ALPHABET_WORDS) {
      const s = w.replace('-', '')
      for (let i = 0; i < s.length; i++) {
        const variants = [s.slice(0, i) + s.slice(i + 1)]
        if (i < s.length - 1) variants.push(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2))
        for (const v of variants) {
          // Nach dem Zusammenziehen doppelter Buchstaben ändert sich nichts: gilt ohnehin als gleich
          if (v.length < 3) continue
          if (nearestAlphabetWord(v) !== w) fehler.push(`${w} → ${v} → ${nearestAlphabetWord(v)}`)
        }
      }
    }
    expect(fehler).toEqual([])
  })

  it('zwei Fehler in einem Wort sind zu viel', () => {
    for (const [w, typo] of [
      ['sierra', 'sreia'],
      ['bravo', 'barov'],
      ['victor', 'vitcro'],
      ['golf', 'glfo'],
    ]) {
      expect(sameCall(typo, w), `${typo} ≠ ${w}`).toBe(false)
    }
  })
})

describe('Buchstabierwörter: Verwechslungen bleiben falsch', () => {
  it('kein Alphabet-Wort gilt für ein anderes', () => {
    const verwechselt: string[] = []
    for (const a of ALPHABET_WORDS)
      for (const b of ALPHABET_WORDS) if (a !== b && sameCall(a, b)) verwechselt.push(`${a} = ${b}`)
    expect(verwechselt).toEqual([])
  })

  it('falsche Reihenfolge, fehlende und überzählige Wörter sind falsch', () => {
    expect(sameCall('golf kilo', 'kilo golf')).toBe(false)
    expect(sameCall('uniform golf', 'uniform golf kilo')).toBe(false)
    expect(sameCall('uniform golf kilo sierra', 'uniform golf kilo')).toBe(false)
  })

  it('ein einzelner Buchstabe oder ein Kürzel ist kein Alphabet-Wort', () => {
    expect(sameCall('u g k s', 'uniform golf kilo sierra')).toBe(false)
    expect(sameCall('ko', 'kilo')).toBe(false)
  })
})

describe('Streng bleiben: Zahlen, Brevity- und Standardwörter', () => {
  it('Brevity- und Standardwörter werden nicht verziehen', () => {
    expect(sameCall('locked', 'blocked')).toBe(false)
    expect(sameCall('blocked', 'locked')).toBe(false)
    expect(sameCall('state', 'skate')).toBe(false)
    expect(sameCall('skate', 'state')).toBe(false)
    expect(sameCall('wilco', 'wilko')).toBe(false)
    expect(sameCall('tally', 'tall')).toBe(false)
    expect(sameCall('bandit', 'bandits')).toBe(false)
    expect(sameCall('negative', 'negativ')).toBe(false)
    expect(matchesAny('say again', ['say again'])).toBe(true)
    expect(matchesAny('say agin', ['say again'])).toBe(false)
  })

  it('Zahlen bleiben streng', () => {
    expect(sameCall('heading zero niner zero', 'heading zero niner one')).toBe(false)
    expect(sameCall('heading 090', 'heading 091')).toBe(false)
    expect(sameCall('angels two five', 'angels two six')).toBe(false)
    expect(sameCall('two fifty one', '251')).toBe(false)
  })

  it('Buchstabierwörter in einem Funkspruch: Tippfehler ja, Zahl daneben weiterhin streng', () => {
    expect(sameCall('information Romio', 'information Romeo')).toBe(true)
    expect(sameCall('information Romio, runway 31', 'information Romeo, runway 13')).toBe(false)
    expect(sameCall('taxi via Foxtrot, Alpha', 'taxi via Foxtrot, Alfa')).toBe(true)
  })
})
