/**
 * Musterdokumente (::muster{doc=…}): Jede Art lässt sich für viele Würfe bauen, ohne leere oder kaputte Einträge.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { buildSampleDoc, SAMPLE_DOCS } from './docs/sample'
import { createRng } from './random/rng'

const index = contentResult.index!
const env = (seed: string) => ({
  rng: createRng(seed),
  content: index,
  self: { name: 'Colt', flight: 3, position: 1 },
  sims: [],
  aircraft: [],
})

describe('Musterdokumente', () => {
  for (const kind of SAMPLE_DOCS) {
    it(`${kind}: gewürfelt ohne leere Einträge`, () => {
      for (let i = 0; i < 40; i++) {
        const d = buildSampleDoc(kind, env(`${kind}${i}`))
        expect(d.header).not.toMatch(/undefined|NaN/)
        for (const r of d.rows) {
          expect(r.value, `${kind} ${r.label}`).not.toMatch(/undefined|NaN|^\s*$/)
          expect(r.value, `${kind} ${r.label}`).not.toContain('{')
        }
        for (const s of d.stations ?? []) expect(`${s.name} ${s.channel} ${s.freq}`).not.toMatch(/undefined|NaN/)
        expect(d.rows.length + (d.stations?.length ?? 0)).toBeGreaterThan(3)
      }
    })
  }

  it('frag trägt das eigene Flight-Rufzeichen', () => {
    const d = buildSampleDoc('frag', env('x'))
    expect(d.rows.find((r) => r.label === 'Rufzeichen')?.value).toBe('COLT 3')
  })
})
