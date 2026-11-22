/**
 * Readback „hold short (of) runway …“ (S-07): Das „of“ darf im Readback fehlen. Wichtig sind „hold short“
 * und die Bahn. Gilt für den Lückentext (Segment-`alt`) und für die Bewertung getippter Funksprüche.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import { resolveExchange } from './drills/resolve'
import { matchesAny, segmentAnswers } from './phraseology/normalize'
import { scoreCall } from './scoring/score'

const index = contentResult.index!

function taxiRequest(seed: string) {
  const rng = createRng(seed)
  return resolveExchange(index.exchanges.get('m1-taxi-request')!, {
    rng,
    content: index,
    self: randomSelf(rng, index),
  })
}

describe('Readback „hold short of runway …“', () => {
  it('beide Segmente kennen die Form ohne „of“', () => {
    const x = taxiRequest('hold-short/alt')
    const ground = x.transmissions[1].segments[3]
    const readback = x.transmissions[2].segments[2]
    expect(ground.text).toMatch(/^hold short of runway /)
    for (const s of [ground, readback]) {
      expect(s.alt).toEqual([s.text.replace('hold short of runway', 'hold short runway')])
    }
  })

  it('Lückentext: mit und ohne „of“ richtig, falsche Bahn und fehlendes „hold short“ falsch', () => {
    for (let i = 0; i < 20; i++) {
      const x = taxiRequest(`hold-short/${i}`)
      const seg = x.transmissions[2].segments[2]
      const rwy = seg.text.replace('hold short of runway ', '')
      const answers = segmentAnswers(seg)
      expect(matchesAny(`hold short of runway ${rwy}`, answers)).toBe(true)
      expect(matchesAny(`Hold short runway ${rwy}`, answers)).toBe(true)
      expect(
        matchesAny(`hold short runway ${rwy === 'one three' ? 'one four' : 'one three'}`, answers),
      ).toBe(false)
      expect(matchesAny(`runway ${rwy}`, answers)).toBe(false)
      expect(matchesAny('hold short', answers)).toBe(false)
    }
  })

  it('getippter Readback ohne „of“ wird als richtig bewertet', () => {
    for (let i = 0; i < 20; i++) {
      const x = taxiRequest(`hold-short-score/${i}`)
      const segs = x.transmissions[2].segments
      const mit = segs.map((s) => s.text).join(', ')
      const ohne = segs.map((s, k) => (k === 2 ? s.alt![0] : s.text)).join(', ')
      expect(scoreCall(mit, segs).correct, mit).toBe(true)
      const r = scoreCall(ohne, segs)
      expect(r.correct, `${ohne} → ${r.issues.join(' | ')}`).toBe(true)
      expect(r.slots[2].status).toBe('ok')
    }
  })

  it('Ohne „hold short“ bleibt der Readback falsch', () => {
    const x = taxiRequest('hold-short/missing')
    const segs = x.transmissions[2].segments
    const text = segs
      .filter((_, k) => k !== 2)
      .map((s) => s.text)
      .join(', ')
    expect(scoreCall(text, segs).correct).toBe(false)
  })

  it('Lückentext-Variante der ATIS-Kennung („with …“) gilt jetzt ebenfalls', () => {
    const rng = createRng('atis-alt')
    const x = resolveExchange(index.exchanges.get('m1-startup-request')!, {
      rng,
      content: index,
      self: randomSelf(rng, index),
    })
    const seg = x.transmissions[0].segments.find(
      (s) => s.role === 'info' && s.text.startsWith('information'),
    )!
    const letter = seg.text.replace('information ', '')
    expect(matchesAny(`with ${letter}`, segmentAnswers(seg))).toBe(true)
  })
})
