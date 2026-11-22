/**
 * Modul 1, „Funk und Physik“ (S-16): Die Rechenübungen zum Funkhorizont stimmen für jede Würfelung.
 * Faustformel (ATIS Telecom Glossary, RHR): Reichweite in NM = 1,23 · (√Höhe₁ + √Höhe₂), Höhen in Fuß.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { resolveDrill } from './drills/resolve'
import { createRng } from './random/rng'

const index = contentResult.index!
const env = (seed: string) => ({
  rng: createRng(seed),
  content: index,
  self: { name: 'Colt', flight: 3, position: 1 },
})

// Höhe im deutschen Text („3.600 ft“), ältere Form mit Komma bleibt lesbar
const feet = (prompt: string) => Number(/\*\*([\d.,]+) ft\*\*/.exec(prompt)?.[1].replace(/[.,]/g, ''))

describe('Funk und Physik: Funkhorizont rechnen', () => {
  it('liegt in Modul 1 an Position 5, nach Zahlen und Rufzeichen', () => {
    const m1 = index.modules.get('m1')!
    expect(m1.lessons.indexOf('m1-l7')).toBe(4)
    expect(m1.lessons.indexOf('m1-l4')).toBe(3)
    expect(index.lessons.get('m1-l7')!.title).toBe('Funk und Physik')
  })

  it('m1-l7-calc-one: die richtige Option ist 1,23 · √Höhe, gerundet, für jede Würfelung', () => {
    const heights = new Set<number>()
    for (let i = 0; i < 80; i++) {
      const d = resolveDrill(index.drills.get('m1-l7-calc-one')!, env(`one${i}`))
      if (d.kind !== 'choice') throw new Error('falscher Typ')
      const h = feet(d.prompt)
      heights.add(h)
      const right = Math.round(1.23 * Math.sqrt(h))
      expect(d.options[d.correct[0]], d.prompt).toBe(`${right} NM`)
      // Keine zweite Option mit demselben Wert
      expect(new Set(d.options).size, d.options.join(' | ')).toBe(d.options.length)
    }
    expect(heights.size).toBeGreaterThan(5)
  })

  it('m1-l7-calc-two: die Antwort ist 2 · 1,23 · √Höhe, gerundet, für jede Würfelung', () => {
    for (let i = 0; i < 80; i++) {
      const d = resolveDrill(index.drills.get('m1-l7-calc-two')!, env(`two${i}`))
      if (d.kind !== 'input') throw new Error('falscher Typ')
      const h = feet(d.prompt)
      const right = Math.round(1.23 * (Math.sqrt(h) + Math.sqrt(h)))
      expect(d.accept, d.prompt).toContain(String(right))
      expect(d.accept, d.prompt).toContain(`${right} NM`)
      // Faustformel: ±1 NM gilt (E4-17), ±2 nicht
      expect(d.accept, d.prompt).toContain(String(right - 1))
      expect(d.accept, d.prompt).toContain(String(right + 1))
      expect(d.accept, d.prompt).not.toContain(String(right + 2))
    }
  })

  it('m1-l7-x-calc-tower (Prüfungsfrage): Antwort ist 1,23 · (√Höhe + √100 ft), gerundet', () => {
    for (let i = 0; i < 60; i++) {
      const d = resolveDrill(index.drills.get('m1-l7-x-calc-tower')!, env(`tower${i}`))
      if (d.kind !== 'input') throw new Error('falscher Typ')
      const right = Math.round(1.23 * (Math.sqrt(feet(d.prompt)) + Math.sqrt(100)))
      expect(d.accept, d.prompt).toContain(String(right))
    }
  })

  it('m2-l5-horizon: die richtige Option ist 1,23 · √Höhe, gerundet, für jede Würfelung', () => {
    const heights = new Set<number>()
    for (let i = 0; i < 80; i++) {
      const d = resolveDrill(index.drills.get('m2-l5-horizon')!, env(`horizon${i}`))
      if (d.kind !== 'choice') throw new Error('falscher Typ')
      const h = Number(/auf ([\d.,]+) ft/.exec(d.prompt)?.[1].replace(/[.,]/g, ''))
      heights.add(h)
      expect(d.options[d.correct[0]], d.prompt).toBe(`Rund ${Math.round(1.23 * Math.sqrt(h))} NM`)
      expect(new Set(d.options).size, d.options.join(' | ')).toBe(d.options.length)
    }
    expect(heights.size).toBeGreaterThan(3)
  })

  it('der Test rechnet wie die Lektion: 10.000 ft und eine Antenne auf 100 ft ergeben rund 135 NM', () => {
    expect(Math.round(1.23 * (Math.sqrt(10000) + Math.sqrt(100)))).toBe(135)
  })
})
