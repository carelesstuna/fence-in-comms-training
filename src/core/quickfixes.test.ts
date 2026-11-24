/**
 * Tests für die schnellen Korrekturen nach dem Persona-Feedback: Glossar (Grundbegriffe, Suche),
 * Funk-Drill (Fälligkeit nach Tagen, zurückgestellte Uhr) und Alphabet-Fragen.
 */
import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { runGenerator } from './drills/generators'
import { buildGlossary, lookupTerm, norm, searchGlossary } from './glossary/glossary'
import { EMPTY_PROGRESS, type ProgressState } from './progress/progress'
import { dailyPlan, reviewCard } from './progress/review'

const index = contentResult.index!
const g = buildGlossary(index.brevity, index.prowords, index.basics)

describe('Glossar', () => {
  it('Grundbegriffe und fehlende Begriffe sind da', () => {
    expect(lookupTerm(g, 'Ops Check')?.kind).toBe('basic')
    // AS FRAGGED steht im Original ATP 1-02.1 (2020/21) als Brevity-Code
    expect(lookupTerm(g, 'as fragged')?.kind).toBe('brevity')
    expect(lookupTerm(g, 'wingman')?.kind).toBe('basic')
    expect(lookupTerm(g, 'over')?.kind).toBe('proword')
    expect(lookupTerm(g, 'frag')?.word).toBe('Frag')
    // Brevity geht vor: „push“ ist Brevity, auch wenn ein Grundbegriff es erwähnt
    expect(lookupTerm(g, 'push')?.kind).toBe('brevity')
  })

  it('Suche nur am Wortanfang: „over“ findet nicht „Manöver“', () => {
    const hits = searchGlossary(g, 'over')
    expect(hits[0].word).toBe('over')
    for (const e of hits) {
      const words = norm([e.word, ...e.aliases, e.meaning, e.note ?? '', e.example ?? ''].join(' ')).split(' ')
      expect(words.some((w) => w.startsWith('over')), e.word).toBe(true)
    }
    // Wortanfang reicht: „treibstoff“ findet auch „Treibstoffstand“
    expect(searchGlossary(g, 'treibstoff').map((e) => e.word)).toContain('JOKER')
  })

  it('DECLARE-Beispiel nennt die Höhe des Kontakts in „thousand“, nicht „angels“', () => {
    expect(lookupTerm(g, 'declare')?.example).toMatch(/thousand/)
    expect(lookupTerm(g, 'declare')?.example).not.toMatch(/angels/)
  })

  it('keine internen Prüfnotizen in den Hinweisen', () => {
    for (const e of g) expect(`${e.note ?? ''}`, e.word).not.toMatch(/TPS|Wikipedia|Abgleich|\(lokal\)/)
  })
})

describe('Funk-Drill: Fälligkeit und Uhr', () => {
  const lessonId = index.modules.get('m1')!.lessons[0]
  const drillId = index.lessons.get(lessonId)!.steps.find((s) => s.kind === 'drill')!
  const id = drillId.kind === 'drill' ? drillId.drillId : ''
  const base: ProgressState = { ...EMPTY_PROGRESS, lessons: { [lessonId]: { completedAt: '', bestScore: 1, attempts: 1 } } }

  it('fällig ist, was heute dran ist – auch wenn die Uhrzeit noch nicht erreicht ist', () => {
    const due = new Date(2026, 10, 21, 21, 30)
    const card = { ...reviewCard(undefined, Rating.Good, new Date(2026, 10, 18, 21, 30)), due: due.toISOString() }
    const p = { ...base, reviews: { [id]: card } }
    const morning = dailyPlan(index, p, { sims: [], aircraft: [] }, new Date(2026, 10, 21, 8, 0))
    expect(morning.queue).toContain(id)
    const dayBefore = dailyPlan(index, p, { sims: [], aircraft: [] }, new Date(2026, 10, 20, 23, 59))
    expect(dayBefore.queue).not.toContain(id)
    expect(dayBefore.nextDue).toBe(card.due)
  })

  it('zurückgestellte Uhr lässt die Wiederholung nicht abstürzen', () => {
    const later = reviewCard(undefined, Rating.Good, new Date(2026, 10, 21, 12, 0))
    expect(() => reviewCard(later, Rating.Good, new Date(2026, 10, 20, 12, 0))).not.toThrow()
  })
})

describe('Alphabet-Fragen', () => {
  it('Ablenker beginnen mit demselben Buchstaben wie die Antwort', () => {
    for (let i = 0; i < 40; i++) {
      const d = runGenerator('phonetic-letter-to-word', {}, { rng: createRng(`abc${i}`), content: index, self: { name: 'Viper', flight: 1, position: 1 } })
      if (d.kind !== 'choice') throw new Error('erwartet Auswahl')
      const initials = new Set(d.options.map((o) => o[0].toUpperCase()))
      expect(initials.size, d.options.join(', ')).toBe(1)
      expect(new Set(d.options).size).toBe(d.options.length)
    }
  })
})
