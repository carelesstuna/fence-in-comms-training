/**
 * Aussprache in den Inhalten: Gesprochene Wortlaute stehen in der US-Form (three, five, niner).
 * „nine“ als eigenes Wort kommt nirgends vor, außer in der Ausnahmeliste unten.
 * Hintergrund und Konvention: `content/README.md`, Abschnitt „Grundsätze“.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { resolveDrill, resolveExchange } from './drills/resolve'
import { spokenContactAltitude, spokenWholeNumber } from './phraseology/spoken'
import { createRng } from './random/rng'

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Erlaubte Stellen, an denen „nine“ stehen bleibt. Jede Ausnahme braucht einen Grund.
 * Die Muster werden aus der Zeile entfernt, bevor nach „nine“ gesucht wird.
 */
const AUSNAHMEN: { muster: RegExp; grund: string }[] = [
  {
    muster: /thirty-nine thousand/g,
    grund: 'zusammengesetztes Zahlwort einer ganzen Zahl, keine Ziffernfolge (ATP 3-52.4)',
  },
  {
    muster: /nine o'clock/g,
    grund: 'Uhrzeigerposition, wird nicht Ziffer für Ziffer gesprochen',
  },
  {
    muster: /zero-nine-zero/g,
    grund: 'historisches Zitat (Hangar-Karte „Ein Kanal für ein Geschwader“)',
  },
  {
    muster: /nine-line/gi,
    grund: 'Name des CAS-Briefings (9-Line), kein Zahlenwert – „advise when ready for nine-line“',
  },
]

function trefferMitNine(text: string): string[] {
  const treffer: string[] = []
  text.split('\n').forEach((zeile, i) => {
    let rest = zeile
    for (const a of AUSNAHMEN) rest = rest.replace(a.muster, '')
    if (/\bnine\b/i.test(rest)) treffer.push(`Zeile ${i + 1}: ${zeile.trim()}`)
  })
  return treffer
}

describe('Aussprache in den Inhalten', () => {
  it('kennt die Inhaltsdateien', () => {
    expect(Object.keys(raw).length).toBeGreaterThan(50)
  })

  it('schreibt „niner“ statt „nine“ (Ausnahmen siehe Liste)', () => {
    const verstoesse: string[] = []
    for (const [pfad, text] of Object.entries(raw)) {
      for (const t of trefferMitNine(text)) verstoesse.push(`${pfad} – ${t}`)
    }
    expect(verstoesse).toEqual([])
  })

  it('erkennt „nine“ und lässt die Ausnahmen durch', () => {
    expect(trefferMitNine('blind, one six point nine.')).toHaveLength(1)
    expect(trefferMitNine('three nine thousand')).toHaveLength(1)
    expect(trefferMitNine('NINE')).toHaveLength(1)
    expect(trefferMitNine('blind, one six point niner.')).toEqual([])
    expect(trefferMitNine('thirty-nine thousand')).toEqual([])
    expect(trefferMitNine("left nine o'clock")).toEqual([])
    expect(trefferMitNine('vector zero-nine-zero')).toEqual([])
    expect(trefferMitNine('ninety, nineteen')).toEqual([])
  })

  it('jede Ausnahme kommt noch in den Inhalten vor', () => {
    const alles = Object.values(raw).join('\n')
    for (const a of AUSNAHMEN) {
      a.muster.lastIndex = 0
      expect(a.muster.test(alles), `Ausnahme nicht mehr nötig: ${a.grund}`).toBe(true)
    }
  })
})

describe('Aussprache in erzeugten Texten', () => {
  const index = contentResult.index!
  const self = { name: 'Colt', flight: 3, position: 1 }
  const TENS_NINE = /(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]nine/gi

  it('eine einzelne 9 heißt „niner“, in zusammengesetzten Zahlwörtern bleibt „nine“', () => {
    expect(spokenWholeNumber(9)).toBe('niner')
    expect(spokenWholeNumber(109)).toBe('one hundred niner')
    expect(spokenWholeNumber(900)).toBe('niner hundred')
    expect(spokenWholeNumber(9000)).toBe('niner thousand')
    expect(spokenWholeNumber(1009)).toBe('one thousand niner')
    expect(spokenContactAltitude(9000)).toBe('niner thousand')
    // zusammengesetzte Zahlwörter ändern sich nicht
    expect(spokenWholeNumber(19)).toBe('nineteen')
    expect(spokenWholeNumber(29)).toBe('twenty-nine')
    expect(spokenWholeNumber(90)).toBe('ninety')
    expect(spokenWholeNumber(39000)).toBe('thirty-nine thousand')
    expect(spokenWholeNumber(25)).toBe('twenty-five')
  })

  /** „nine“ als eigenes Wort in gezeigtem Text, außer in zusammengesetzten Zahlwörtern und den Ausnahmen der Liste oben. */
  function nineIn(obj: unknown): string | null {
    // Antwortlisten dürfen „nine“ enthalten (die Spracherkennung schreibt „niner“ so)
    const text = JSON.stringify(obj, (k, v) => (['accept', 'alt', 'rx'].includes(k) ? undefined : v))
    let rest = text.replace(TENS_NINE, '')
    for (const a of AUSNAHMEN) rest = rest.replace(a.muster, '')
    return /.{0,40}\bnine\b.{0,30}/i.exec(rest)?.[0] ?? null
  }

  it('erkennt „nine“ in erzeugtem Text und lässt zusammengesetzte Zahlwörter durch', () => {
    expect(nineIn({ text: 'bullseye one eight two, nine' })).not.toBeNull()
    expect(nineIn({ text: 'nine thousand' })).not.toBeNull()
    expect(nineIn({ text: 'altimeter thirty nine' })).toBeNull()
    expect(nineIn({ text: 'twenty-nine thousand' })).toBeNull()
    expect(nineIn({ accept: ['heading nine'] })).toBeNull()
  })

  it('kein erzeugter Funkspruch und keine erzeugte Übung zeigt „nine“ als eigenes Wort', () => {
    const verstoesse: string[] = []
    for (const [id, d] of index.drills) {
      for (let i = 0; i < 8; i++) {
        const t = nineIn(resolveDrill(d, { rng: createRng(`n${id}${i}`), content: index, self }))
        if (t) {
          verstoesse.push(`Übung ${id}: …${t}…`)
          break
        }
      }
    }
    for (const [id, x] of index.exchanges) {
      for (let i = 0; i < 8; i++) {
        const t = nineIn(resolveExchange(x, { rng: createRng(`n${id}${i}`), content: index, self }))
        if (t) {
          verstoesse.push(`Funkspruch ${id}: …${t}…`)
          break
        }
      }
    }
    expect(verstoesse).toEqual([])
  }, 60_000)
})
