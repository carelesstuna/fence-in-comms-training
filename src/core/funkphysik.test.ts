/**
 * Modul 1, „Funk und Physik“ (S-16): Die Merkwerte zum Funkhorizont passen zur Faustformel (ATIS Telecom Glossary, RHR):
 * Reichweite in NM = 1,23 · (√Höhe₁ + √Höhe₂), Höhen in Fuß. Gerechnet wird in den Übungen nicht mehr – die Werte
 * sind gerundet zum Merken, dürfen aber nicht mehr als 15 % von der Formel abweichen.
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

const horizon = (feet: number) => 1.23 * Math.sqrt(feet)
const num = (text: string) => Number(/([\d.]+)/.exec(text)?.[1].replace(/\./g, ''))
const close = (memo: number, exact: number) => Math.abs(memo - exact) / exact <= 0.15

describe('Funk und Physik: Funkhorizont zum Merken', () => {
  it('liegt in Modul 1 an Position 5, nach Zahlen und Rufzeichen', () => {
    const m1 = index.modules.get('m1')!
    expect(m1.lessons.indexOf('m1-l7')).toBe(4)
    expect(m1.lessons.indexOf('m1-l4')).toBe(3)
    expect(index.lessons.get('m1-l7')!.title).toBe('Funk und Physik')
  })

  it('m1-l7-horizon-match: jeder Merkwert liegt nahe an 1,23 · √Höhe', () => {
    const d = index.drills.get('m1-l7-horizon-match')!
    if (d.type !== 'match') throw new Error('falscher Typ')
    expect(d.pairs.length).toBeLessThanOrEqual(5)
    for (const [h, r] of d.pairs) {
      // „gut 10 NM“ bei 100 ft: 12,3 NM
      const memo = num(r)
      expect(close(memo, horizon(num(h))) || (memo === 10 && r.startsWith('gut')), `${h} → ${r}`).toBe(true)
    }
  })

  it('m1-l7-horizon-order: die Reihenfolge stimmt mit der Faustformel', () => {
    const d = index.drills.get('m1-l7-horizon-order')!
    if (d.type !== 'sequence') throw new Error('falscher Typ')
    // Reichweite je Eintrag in derselben Reihenfolge wie in der Übung
    const ranges = [2 * horizon(10000), horizon(30000), horizon(10000), horizon(5000), horizon(1000)]
    expect(d.items).toHaveLength(ranges.length)
    for (let i = 1; i < ranges.length; i++) expect(ranges[i - 1]).toBeGreaterThan(ranges[i])
  })

  it('m2-l5-horizon: die richtige Option ist der Merkwert, die falschen liegen weit daneben', () => {
    const heights = new Set<number>()
    for (let i = 0; i < 60; i++) {
      const d = resolveDrill(index.drills.get('m2-l5-horizon')!, env(`horizon${i}`))
      if (d.kind !== 'choice') throw new Error('falscher Typ')
      const h = Number(/auf ([\d.]+) ft/.exec(d.prompt)?.[1].replace(/\./g, ''))
      heights.add(h)
      const right = num(d.options[d.correct[0]])
      expect(close(right, horizon(h)), d.prompt).toBe(true)
      for (const [j, o] of d.options.entries()) {
        if (j === d.correct[0] || !/\d/.test(o)) continue
        // Falsche Zahlen um mindestens den Faktor 3 daneben
        const r = num(o) / right
        expect(r < 1 / 3 || r > 3, `${o} gegen ${right}`).toBe(true)
      }
      expect(new Set(d.options).size, d.options.join(' | ')).toBe(d.options.length)
    }
    expect(heights.size).toBeGreaterThan(2)
  })

  it('in den Übungen zum Funkhorizont steht keine Wurzel mehr', () => {
    for (const id of ['m1-l7-horizon-match', 'm1-l7-horizon-order', 'm1-l7-x-two-aircraft', 'm1-l7-x-quad', 'm2-l5-horizon', 'm2-l5-horizon-low']) {
      const d = index.drills.get(id)
      expect(d, id).toBeDefined()
      expect(JSON.stringify({ ...d, explain: undefined }), id).not.toMatch(/√|1,23/)
    }
  })
})
