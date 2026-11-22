/**
 * Modul 4 und Glossar nach dem Persona-Review vom 22.11.2026 (docs/reviews/2026-11-22-personas/), Arbeitspaket D:
 * WHAT STATE mit „by“, Ops Check mit „tanks dry“, Lost-Wingman-Kurzformen, blind im Checkride nur auf hundert Fuß,
 * push mit Kanalnummer und die neuen Glossar-Einträge.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { resolveExchange, resolveScenario } from './drills/resolve'
import type { ResolvedSegment, ResolvedTransmission } from './drills/types'
import { buildGlossary, lookupTerm, searchGlossary } from './glossary/glossary'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import { scoreCall } from './scoring/score'

const index = contentResult.index!
const glossary = buildGlossary(index.brevity, index.prowords, index.basics)
const env = (seed: string) => {
  const rng = createRng(seed)
  return { rng, content: index, self: randomSelf(rng, index) }
}
const exchange = (id: string, seed: string, as?: string) => resolveExchange(index.exchanges.get(id)!, env(seed), { as })
const mine = (ts: ResolvedTransmission[]) => ts.find((t) => t.you)!
const text = (segs: ResolvedSegment[], i: number) => segs[i].text

describe('WHAT STATE mit „by“ (E1-03, E5-03)', () => {
  for (const seed of ['a', 'b', 'c', 'd']) {
    it(`„by“ und „is“ zählen, ohne „by“ geht es auch (${seed})`, () => {
      const segs = mine(exchange('m4-what-state', `ws-${seed}`).transmissions).segments
      expect(segs.map((s) => s.text)).toContain('by')
      const [cs, ma, ms, mi, low] = [0, 2, 3, 4, 6].map((i) => text(segs, i))
      const withBy = scoreCall(`${cs} is ${ma}, ${ms}, ${mi} by ${low}`, segs)
      expect(withBy.correct).toBe(true)
      expect(withBy.extras).toEqual([])
      const without = scoreCall(`${cs}, ${ma}, ${ms}, ${mi}, ${low}`, segs)
      expect(without.correct).toBe(true)
      expect(without.extras).toEqual([])
    })
  }
})

describe('Ops Check mit Außentanks (E1-03)', () => {
  it('„tanks dry“ bzw. „tanks feeding“ ist kein überflüssiges Wort – an beliebiger Stelle', () => {
    const segs = mine(exchange('m4-ops-check-tiger', 'ops', 'two').transmissions).segments
    const fuel = text(segs, 1)
    for (const input of [`Two, ${fuel}, tiger, tanks dry`, `Two, ${fuel}, tanks feeding, tiger`, `Two, ${fuel}, tiger`]) {
      const r = scoreCall(input, segs)
      expect(r.correct, input).toBe(true)
      expect(r.extras, input).toEqual([])
    }
  })

  it('die Werte eines Flights liegen nah beieinander (E1-12)', () => {
    for (const seed of ['1', '2', '3', '4', '5', '6']) {
      const x = exchange('m4-ops-check-tiger', `spread-${seed}`, 'two')
      const fuels = x.transmissions
        .filter((t) => !t.skip && t.station !== 'lead')
        .map((t) => Number(t.segments.find((s) => s.role === 'value')!.alt![0]))
      expect(Math.max(...fuels) - Math.min(...fuels)).toBeLessThanOrEqual(1.2)
    }
  })
})

describe('Lost Wingman: Kurzformen des Leads (E1-09)', () => {
  it('„right turn“ und Zahlen ohne Einleitungswort zählen, die Höhe steht deutsch geschrieben im Hinweis', () => {
    for (const seed of ['l1', 'l2', 'l3', 'l4', 'l5']) {
      const x = exchange('m4-lost-wingman', `lw-${seed}`, 'lead')
      const segs = x.transmissions[1].segments
      const [att, hdg, alt] = [1, 2, 3].map((i) => segs[i].alt![0])
      const spd = segs[4].alt![1]
      const short = scoreCall(`Two, ${att}, ${hdg}, ${alt}, ${spd} knots`, segs)
      expect(short.correct, `${att} ${hdg} ${alt} ${spd}`).toBe(true)
      expect(short.extras).toEqual([])
      const full = scoreCall(segs.map((s) => s.text).join(', '), segs)
      expect(full.correct).toBe(true)
      expect(segs[3].note).toMatch(/\d{1,2}\.\d00 ft/)
    }
  })
})

describe('Checkride (E1-07, E1-18) und Lead-Szenario (P1-02)', () => {
  const scenario = (id: string, seed: string) => resolveScenario(index.scenarios.get(id)!, env(seed))

  it('blind im Checkride nur mit der Höhe auf hundert Fuß', () => {
    const sc = scenario('m4-s1-checkride-wingman', 'blind')
    const step = sc.steps.find((s) => s.you?.transmission.segments.some((g) => g.text === 'blind'))!
    expect(step.critical).toBe(true)
    const segs = step.you!.transmission.segments
    expect(scoreCall(segs.map((s) => s.text).join(', '), segs).correct).toBe(true)
    expect(segs[2].alt ?? []).not.toContainEqual(expect.stringMatching(/angels/))
  })

  it('Funken nach push ist im Checkride kein K.-o. mehr', () => {
    const sc = scenario('m4-s1-checkride-wingman', 'push')
    const silent = sc.steps.filter((s) => s.silence)
    expect(silent.length).toBeGreaterThan(0)
    for (const s of silent) expect(s.critical ?? false).toBe(false)
  })

  it('der Lead darf mit der Kanalnummer pushen („push 6“)', () => {
    for (const seed of ['p1', 'p2', 'p3']) {
      const sc = scenario('m4-s2-als-lead', seed)
      const segs = sc.steps[0].you!.transmission.segments
      const channel = segs[2].alt!.at(-1)!
      const r = scoreCall(`${segs[0].text}, push ${channel}`, segs)
      expect(r.correct, channel).toBe(true)
    }
  })
})

describe('Neue Glossar-Einträge (U1-04, U1-05, E2-09, E4-18, E5-14, P2-09, U2-10, U2-16)', () => {
  it('jeder Begriff ist nachschlagbar, auch über deutsche oder englische Schreibweisen', () => {
    for (const term of [
      'Rufzeichen', 'callsign', 'call sign', 'LSO', 'Paddles', 'Modex', 'Side Number', 'Squelch', 'Rauschsperre',
      'TRACK', 'WIDE', 'DEEP', 'HIGH (Lagebild)', 'FAST', 'VERY FAST', 'OPENING', 'CLOSING', 'WEIGHTED', 'STRANGER',
      'CAP', 'DASH', 'Dash 2', 'MOTHER', 'CHARLIE', 'DELTA', 'IVC', 'Comm Ladder', 'Advisory', 'confirm', 'verify',
      'Lima Charlie', 'five by five', 'Steuerkurs', 'heading', 'Platzrunde', 'final', 'base', 'SOP',
      'FAC(A)', 'AFAC', 'CONTINUE', 'ASOC', 'DASC',
    ]) {
      expect(lookupTerm(glossary, term), term).toBeDefined()
    }
  })

  it('die Suche nach „callsign“ findet zuerst den Grundbegriff Rufzeichen', () => {
    expect(searchGlossary(glossary, 'callsign')[0].word).toBe('Rufzeichen')
    expect(searchGlossary(glossary, 'rufzeichen')[0].word).toBe('Rufzeichen')
  })

  it('„high“ in einer Positionsansage zeigt nicht den Lagebild-Begriff HIGH', () => {
    expect(lookupTerm(glossary, 'high')).toBeUndefined()
  })
})
