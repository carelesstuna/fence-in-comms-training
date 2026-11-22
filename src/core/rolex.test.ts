/**
 * ROLEX in Modul 4: Die Übungen und der Funkspruch rechnen in Fünf-Minuten-Schritten (ATP 3-52.4, S. 17),
 * und die Zeit, die als Antwort zählt, stimmt für jede Würfelung.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { resolveDrill, resolveExchange } from './drills/resolve'
import { createRng } from './random/rng'

const index = contentResult.index!
const env = (seed: string) => ({
  rng: createRng(seed),
  content: index,
  self: { name: 'Colt', flight: 3, position: 1 },
})

/** Gesprochene Minuten (Ziffer für Ziffer) → Zahl. */
const MINUTES: Record<string, number> = { five: 5, 'one zero': 10, 'one five': 15 }

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2))
const toHhmm = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`
}

describe('ROLEX in Fünf-Minuten-Schritten', () => {
  for (const [id, sign] of [
    ['m4-l2-rolex-plus', 1],
    ['m4-l2-rolex-minus', -1],
  ] as const) {
    it(`${id}: Minutenzahl 5, 10 oder 15, Antwort = Push-Zeit ${sign > 0 ? '+' : '−'} Minuten`, () => {
      const seen = new Set<number>()
      for (let i = 0; i < 60; i++) {
        const d = resolveDrill(index.drills.get(id)!, env(`${id}${i}`))
        if (d.kind !== 'input') throw new Error('falscher Typ')
        const push = /\*\*(\d{4})Z\*\*/.exec(d.prompt)?.[1]
        const spoken = /rolex (?:plus|minus) ([a-z ]+?)[“.]/.exec(d.prompt)?.[1]
        expect(push, d.prompt).toBeDefined()
        expect(Object.keys(MINUTES), d.prompt).toContain(spoken)
        const rx = MINUTES[spoken!]
        seen.add(rx)
        expect(d.accept, d.prompt).toContain(toHhmm(toMin(push!) + sign * rx))
      }
      // Alle drei Werte kommen vor
      expect([...seen].sort((a, b) => a - b)).toEqual([5, 10, 15])
    })
  }

  it('der Funkspruch nennt eine Verschiebung von 5, 10 oder 15 Minuten', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const x = resolveExchange(index.exchanges.get('m4-rolex')!, env(`rolex${i}`))
      const text = x.transmissions[0].segments.map((s) => s.text).join(' ')
      const spoken = /rolex plus ([a-z ]+)$/.exec(text)?.[1]
      expect(Object.keys(MINUTES), text).toContain(spoken)
      seen.add(spoken!)
    }
    expect(seen.size).toBe(3)
  })
})
