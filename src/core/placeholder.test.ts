/**
 * Platzhalter nie mit Lösungswort (S-08, `content/README.md`): Das Eingabefeld darf das Stichwort der Antwort
 * nicht verraten. Zwei Prüfungen: das erste Wort des Platzhalters gegen das erste Wort jeder akzeptierten
 * Antwort (wie im Inhalt geschrieben), und jedes Wort des Platzhalters gegen die gewürfelten Antworten.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import { resolveDrill } from './drills/resolve'

const index = contentResult.index!

/** Erstes echtes Wort: Klammern, Zahlen und „z. B.“ zählen nicht. */
function firstWord(text: string): string | undefined {
  const cleaned = text.replace(/\{[^}]*\}/g, ' ').replace(/z\.\s*b\./gi, ' ')
  return cleaned.toLowerCase().match(/[a-zäöüß][a-zäöüß-]*/)?.[0]
}

/** Alle Wörter ab drei Buchstaben, ohne „z. B.“ und ohne Zahlen. */
function words(text: string): string[] {
  return (
    text
      .replace(/z\.\s*b\./gi, ' ')
      .toLowerCase()
      .match(/[a-zäöüß][a-zäöüß-]{2,}/g) ?? []
  ).map((w) => w.replace(/-$/, ''))
}

describe('Platzhalter in Eingabefeldern', () => {
  it('verraten kein Stichwort der Lösung', () => {
    const verstoesse: string[] = []
    const pruefe = (where: string, placeholder: string | undefined, accept: readonly string[]) => {
      if (!placeholder) return
      const wort = firstWord(placeholder)
      if (!wort) return
      for (const a of accept) {
        // Ein Wort des Platzhalters steht am Anfang der Antwort („angels …“ bei „angels two five“)
        if (firstWord(a) === wort) verstoesse.push(`${where}: „${placeholder}“ verrät „${a}“`)
      }
    }
    for (const d of index.drills.values()) {
      if (d.type === 'input') pruefe(d.id, d.placeholder, d.accept)
      if (d.type === 'form')
        for (const f of d.fields) pruefe(`${d.id}/${f.label}`, f.placeholder, f.accept)
    }
    expect(verstoesse).toEqual([])
  })

  it('verraten auch gewürfelt kein Wort der Lösung („z. B. Golf“ bei Kennbuchstabe Golf)', () => {
    const verstoesse = new Set<string>()
    for (const d of index.drills.values()) {
      if (d.type !== 'input' && d.type !== 'form') continue
      for (let i = 0; i < 40; i++) {
        const rng = createRng(`placeholder/${d.id}/${i}`)
        const r = resolveDrill(d, { rng, content: index, self: randomSelf(rng, index) })
        const felder =
          r.kind === 'input'
            ? [{ label: '', placeholder: r.placeholder, accept: r.accept }]
            : r.kind === 'form'
              ? r.fields
              : []
        for (const f of felder) {
          if (!f.placeholder) continue
          const verraten = new Set(f.accept.flatMap(words))
          for (const w of words(f.placeholder)) {
            if (verraten.has(w))
              verstoesse.add(`${d.id}/${f.label}: „${f.placeholder}“ enthält „${w}“`)
          }
        }
      }
    }
    expect([...verstoesse]).toEqual([])
  })

  it('erkennt ein verratenes Stichwort', () => {
    expect(firstWord('angels …')).toBe('angels')
    expect(firstWord('{flightName}, push …')).toBe('push')
    expect(firstWord('z. B. 31')).toBeUndefined()
    expect(firstWord('Nummer eintippen …')).toBe('nummer')
    expect(words('z. B. Golf')).toEqual(['golf'])
    expect(words('z. B. 310 at 6')).toEqual([])
  })
})
