/**
 * Formen, die gelten, aber nicht der Vorschrift entsprechen (`weak`, Persona-Review E1-06, E1-07):
 * „Two, joker“ statt des vollen Flight-Rufzeichens, „blind, angels 23“ statt „blind 22.6“.
 * Der Funkspruch bleibt richtig, bringt aber Teilpunkte und einen Hinweis mit der Vorschrift.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { resolveExchange } from './drills/resolve'
import type { ResolvedTransmission } from './drills/types'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import { scoreCall, type ScoreSegment } from './scoring/score'

const index = contentResult.index!
const env = (seed: string) => {
  const rng = createRng(seed)
  return { rng, content: index, self: randomSelf(rng, index) }
}
const mine = (id: string, seed: string, as: string): ResolvedTransmission =>
  resolveExchange(index.exchanges.get(id)!, env(seed), { as }).transmissions.find((t) => t.you)!

describe('scoreCall mit geduldeten Formen (weak)', () => {
  const segs: ScoreSegment[] = [
    { text: 'Wolf eight two', role: 'callsign', critical: true, weak: ['Two'], weakNote: 'Vorschrift: volles Flight-Rufzeichen' },
    { text: 'joker', role: 'brevity', critical: true },
  ]

  it('die Vorschriftsform ist voll richtig', () => {
    const r = scoreCall('Wolf eight two, joker', segs)
    expect(r).toMatchObject({ correct: true, weak: false, score: 1 })
    expect(r.slots[0].weak).toBeUndefined()
  })

  it('die Kurzform gilt, kostet aber Punkte und nennt die Vorschrift', () => {
    const r = scoreCall('Two, joker', segs)
    expect(r.correct).toBe(true)
    expect(r.weak).toBe(true)
    expect(r.slots[0]).toMatchObject({ status: 'ok', weak: true })
    expect(r.score).toBeCloseTo(0.75)
    expect(r.issues).toContain('Gilt, aber nicht nach Vorschrift: „Two“ – Vorschrift: volles Flight-Rufzeichen.')
  })

  it('ohne weakNote nennt der Hinweis die vollständige Form', () => {
    const r = scoreCall('Two, joker', [{ ...segs[0], weakNote: undefined }, segs[1]])
    expect(r.issues).toContain('Gilt, aber nicht nach Vorschrift: „Two“ – vollständig heißt es „Wolf eight two“.')
  })

  it('gleichwertige alt-Formen bleiben voll richtig', () => {
    const r = scoreCall('Two, joker', [{ ...segs[0], alt: ['Two'], weak: undefined }, segs[1]])
    expect(r).toMatchObject({ correct: true, weak: false, score: 1 })
  })

  it('falscher Inhalt bleibt falsch, auch mit geduldeter Form', () => {
    const r = scoreCall('Two, bingo', segs)
    expect(r.correct).toBe(false)
  })
})

describe('Inhalte von Modul 4', () => {
  for (const seed of ['a', 'b', 'c']) {
    it(`joker: „Two, joker“ gilt mit Abzug, das volle Rufzeichen ohne (${seed})`, () => {
      const t = mine('m4-joker', `joker-${seed}`, 'two')
      const full = scoreCall(`${t.segments[0].text}, joker`, t.segments)
      expect(full).toMatchObject({ correct: true, weak: false })
      const short = scoreCall('Two, joker', t.segments)
      expect(short).toMatchObject({ correct: true, weak: true })
      expect(short.score).toBeLessThan(1)
      expect(short.issues.join(' ')).toMatch(/AFMAN 11-2F-16 V3, Abs\. 3\.30/)
    })

    it(`blind: „angels“ gilt mit Abzug, die Höhe auf hundert Fuß ohne (${seed})`, () => {
      const t = mine('m4-blind', `blind-${seed}`, 'two')
      const [cs, , alt] = t.segments
      const exact = scoreCall(`${cs.text}, blind, ${alt.text}`, t.segments)
      expect(exact).toMatchObject({ correct: true, weak: false })
      const angels = scoreCall(`${cs.text}, blind, ${alt.weak![0]}`, t.segments)
      expect(angels).toMatchObject({ correct: true, weak: true })
      expect(angels.issues.join(' ')).toMatch(/hundert Fuß/)
    })
  }

  it('selbst begonnene Meldungen von Two führen „Two“ nur noch als geduldete Form', () => {
    for (const ex of index.exchanges.values()) {
      for (const t of ex.transmissions) {
        for (const s of t.segments) {
          if (s.role === 'callsign' && t.speaker === '{two}') expect(s.alt ?? [], `${ex.id}: ${s.text}`).not.toContain('Two')
        }
      }
    }
  })
})
