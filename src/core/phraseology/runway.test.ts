/**
 * Bahnbezeichnung in Kurzschrift („21R“) gilt wie „two one right“ und „21 right“: Wer die Bahn so tippt, wie die Lektion
 * sie schreibt (z. B. „taxiing to runway 21R“), wird nicht bestraft.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../../content'
import { resolveExchange } from '../drills/resolve'
import { createRng } from '../random/rng'
import { randomSelf } from '../random/vars'
import { scoreCall } from '../scoring/score'
import { matchesAny, normalizeTokens, sameCall, segmentAnswers } from './normalize'

const index = contentResult.index!

describe('Bahn in Kurzschrift', () => {
  it('„21R“, „21 right“ und „two one right“ sind dasselbe', () => {
    const same = ['taxiing to runway 21R', 'taxiing to runway 21 right', 'taxiing to runway two one right', 'Taxiing to runway 21r', 'taxiing to runway 2-1 right']
    for (const a of same) for (const b of same) expect(sameCall(a, b), `${a} ↔ ${b}`).toBe(true)
  })

  it('führende Null und alle drei Seiten', () => {
    expect(sameCall('runway 03L', 'runway zero three left')).toBe(true)
    expect(sameCall('runway 31C', 'runway three one center')).toBe(true)
    expect(sameCall('runway 9R', 'runway niner right')).toBe(true)
    expect(normalizeTokens('hold short of runway 09L')).toEqual(['hold', 'short', 'of', 'runway', '0', '9', 'left'])
  })

  it('falsche Seite oder fehlende Seite bleiben falsch', () => {
    expect(sameCall('runway 21R', 'runway two one left')).toBe(false)
    expect(sameCall('runway 21R', 'runway two one')).toBe(false)
    expect(sameCall('runway 21', 'runway two one right')).toBe(false)
    expect(sameCall('runway 21R', 'runway two two right')).toBe(false)
  })

  it('andere Zahlen mit Buchstaben dahinter ändern sich nicht', () => {
    // Nur ein bis zwei Ziffern direkt vor l, r oder c sind eine Bahn; Frequenzen und Kurse bleiben, wie sie waren
    expect(normalizeTokens('heading 250r')).not.toContain('right')
    expect(normalizeTokens('4c')).toEqual(['4', 'center'])
    expect(sameCall('squawk 4215', 'squawk four two one five')).toBe(true)
    expect(sameCall('260.0', 'two six zero point zero')).toBe(true)
  })

  it('Funkspruch mit gewürfelter Bahn: „21R“ tippen wird als richtig gewertet', () => {
    for (let i = 0; i < 40; i++) {
      const rng = createRng(`bahn/${i}`)
      const x = resolveExchange(index.exchanges.get('m1-taxi-request')!, { rng, content: index, self: randomSelf(rng, index) })
      const seg = x.transmissions[2].segments[2] // Readback „hold short of runway …“
      const spoken = seg.text.replace('hold short of runway ', '')
      // zurück in die Kurzschrift: „two one right“ → „21R“
      const digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner']
      const words = spoken.split(' ')
      const side = ['left', 'right', 'center'].includes(words[words.length - 1]) ? words.pop()! : ''
      const written = words.map((w) => digits.indexOf(w)).join('') + (side ? side[0].toUpperCase() : '')
      expect(matchesAny(`hold short of runway ${written}`, segmentAnswers(seg)), `${written} ↔ ${spoken}`).toBe(true)
    }
  })

  it('Bewertung eines getippten Funkspruchs: „21R“ in der Mitte stört nicht', () => {
    const digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner']
    let geprueft = 0
    for (let i = 0; i < 40; i++) {
      const rng = createRng(`bahn/score/${i}`)
      const x = resolveExchange(index.exchanges.get('m1-taxi-request')!, { rng, content: index, self: randomSelf(rng, index) })
      const segs = x.transmissions[2].segments
      const spoken = segs.map((s) => s.text).join(', ')
      expect(scoreCall(spoken, segs).correct).toBe(true)
      // dieselbe Antwort mit der Bahn in Kurzschrift: „runway two one right“ → „runway 21R“
      const rwy = /runway ((?:zero|one|two|three|four|five|six|seven|eight|niner)(?: (?:zero|one|two|three|four|five|six|seven|eight|niner))*)(?: (left|right|center))?/.exec(spoken)
      if (!rwy) continue
      const written = rwy[1].split(' ').map((w) => digits.indexOf(w)).join('') + (rwy[2] ? rwy[2][0].toUpperCase() : '')
      const typed = spoken.replace(rwy[0], `runway ${written}`)
      const r = scoreCall(typed, segs)
      expect(r.correct, `${typed} → ${r.issues.join(' | ')}`).toBe(true)
      geprueft++
    }
    expect(geprueft).toBeGreaterThan(20)
  })
})
