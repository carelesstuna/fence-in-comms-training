/**
 * Tests für die Bewertung getippter Funksprüche – vor allem die Fälle aus dem Persona-Feedback
 * (docs/reviews/2026-11-20-persona-feedback.md, Abschnitt 1) und ein Round-Trip über alle Inhalte.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { resolveExchange, resolveScenario } from './drills/resolve'
import type { ResolvedSegment } from './drills/types'
import { matchesAny, sameCall } from './phraseology/normalize'
import { scoreCall, type ScoreSegment } from './scoring/score'
import { parseTuneInput } from './scoring/tune'

const seg = (text: string, role = 'info', extra: Partial<ScoreSegment> = {}): ScoreSegment => ({ text, role, ...extra })
const ok = (input: string, segs: ScoreSegment[]) => scoreCall(input, segs).correct

describe('Zahlen so, wie man sie tippt oder spricht', () => {
  const state = [seg('two', 'callsign', { critical: true }), seg('seven point two', 'value', { critical: true })]

  it('zusammengelaufene Zahlen werden anhand der erwarteten Werte getrennt', () => {
    expect(ok('Two seven point two', state)).toBe(true)
    expect(ok('Two 7.2', state)).toBe(true)
    expect(ok('2 7.2', state)).toBe(true)
    // falscher Wert bleibt falsch – und wird als falscher Wert gemeldet, nicht als „fehlt“
    const wrong = scoreCall('Two 7.5', state)
    expect(wrong.correct).toBe(false)
    expect(wrong.slots[1]).toMatchObject({ status: 'wrong', heard: '7.5' })
  })

  it('Rufzeichen und Frequenz ohne Komma', () => {
    const call = [seg('Viper one one', 'callsign'), seg('two five one point two five', 'value')]
    expect(ok('viper one one two five one point two five', call)).toBe(true)
    expect(ok('Viper 11 251.25', call)).toBe(true)
    expect(ok('Viper 1-1 251.25', call)).toBe(true)
  })

  it('Schrägstrich trennt Peilung und Entfernung', () => {
    const bull = [seg('group', 'brevity'), seg('bullseye', 'brevity'), seg('zero niner zero', 'value'), seg('two five', 'value')]
    expect(ok('group bullseye 090/25', bull)).toBe(true)
    // Wind in Kneeboard-Schreibweise: „320/11“ = „320 at 11“
    expect(ok('wind 320/11', [seg('wind three two zero at one one', 'value')])).toBe(true)
    expect(ok('wind three two zero at one one', [seg('wind three two zero at one one', 'value')])).toBe(true)
  })

  it('Tausender und Dezimalkomma', () => {
    const alt = [seg('two five thousand', 'value')]
    for (const s of ['25000', '25,000', '25 thousand', 'two five thousand']) expect(ok(s, alt), s).toBe(true)
    expect(ok('19,500', [seg('one niner thousand five hundred', 'value')])).toBe(true)
    expect(ok('Viper 1-1, 251,25', [seg('Viper one one', 'callsign'), seg('two five one point two five', 'value')])).toBe(true)
    expect(ok('state 5,8', [seg('state', 'brevity'), seg('five point eight', 'value')])).toBe(true)
  })

  it('Flight Level in Kurzschrift', () => {
    const fl = [seg('climb', 'instruction'), seg('flight level two two zero', 'value')]
    expect(ok('climb FL220', fl)).toBe(true)
    expect(ok('climb FL 220', fl)).toBe(true)
  })

  it('keine Fantasiezahlen: „9 point 9 point 9“ ist nicht 251.25', () => {
    expect(ok('9 point 9 point 9', [seg('two five one point two five', 'value', { tolerance: 0.5 })])).toBe(false)
  })

  it('„for“ zwischen Ziffern ist ein vertipptes „four“', () => {
    expect(ok('heading three for zero', [seg('heading', 'instruction'), seg('three four zero', 'value')])).toBe(true)
  })
})

describe('Wörter: Tippfehler, Brevity, Rückmeldung', () => {
  it('Tippfehler zählen, werden aber benannt', () => {
    const r = scoreCall('Victor India Pappa Echo Romeo', [seg('Victor India Papa Echo Romeo', 'info')])
    expect(r.correct).toBe(true)
    expect(r.issues.join(' ')).toContain('Tippfehler: „pappa“ statt „papa“')
    expect(ok('angles three one', [seg('angels three one', 'value')])).toBe(true)
  })

  it('Brevity und Standardwörter verlangen die genaue Schreibung', () => {
    expect(ok('blocked', [seg('locked', 'brevity')])).toBe(false)
    expect(ok('skate', [seg('state', 'brevity')])).toBe(false)
    expect(ok('clear', [seg('clean', 'brevity')])).toBe(false)
    expect(ok('locked', [seg('locked', 'brevity')])).toBe(true)
  })

  it('fast richtig statt „fehlt“ plus „zusätzlich gesagt“', () => {
    const taxi = [seg('Viper one one', 'callsign'), seg('runway two seven', 'value'), seg('via Hotel Charlie', 'instruction', { critical: true })]
    const r = scoreCall('Viper 1-1, runway 27, Hotel Charlie', taxi)
    expect(r.slots[2]).toMatchObject({ status: 'wrong', near: true, heard: 'hotel charlie' })
    expect(r.issues.join(' ')).toContain('Fast: „hotel charlie“')
    expect(r.issues.join(' ')).not.toContain('Zusätzlich gesagt')
    expect(r.score).toBeGreaterThan(0.8)
    expect(r.correct).toBe(false)
  })

  it('Reihenfolge: Pflicht nur für Adresse und Rufzeichen, sonst ein Hinweis', () => {
    const lineUp = [seg('Viper one one', 'callsign'), seg('line up and wait', 'instruction'), seg('runway zero seven', 'value')]
    const r = scoreCall('Viper 1-1, runway 07, line up and wait', lineUp)
    expect(r.correct).toBe(true)
    expect(r.issues.join(' ')).toContain('anderen Stelle als üblich')
    expect(r.score).toBeGreaterThan(0.9)
  })

  it('widersprüchliche Zusätze sind ein Fehler, harmlose nicht', () => {
    const hdg = [seg('heading', 'instruction'), seg('zero niner zero', 'value')]
    expect(ok('heading 090, heading 180', hdg)).toBe(false)
    expect(ok('heading 090 Viper', hdg)).toBe(true) // ein Wort zu viel ist nur ein Hinweis
  })

  it('„oh“ statt „zero“ geht durch, aber mit Hinweis', () => {
    const r = scoreCall('three three five point oh', [seg('three three five point zero', 'value')])
    expect(r.correct).toBe(true)
    expect(r.issues.join(' ')).toContain('„oh“ statt „zero“')
  })
})

describe('Freitext und Funkgerät', () => {
  it('Nullen am Ende der Nachkommastellen zählen nicht', () => {
    expect(sameCall('41.50', '41.5')).toBe(true)
    expect(sameCall('305.50', '305.5')).toBe(true)
    expect(matchesAny('260.0', ['260'])).toBe(true)
    expect(sameCall('heading 090', 'heading 90')).toBe(false) // führende Null bleibt ein Unterschied
  })

  it('Kanäle ohne Leerzeichen, FM-Frequenzen, kaputte Eingaben', () => {
    expect(parseTuneInput('ch4')).toEqual({ channel: 4 })
    expect(parseTuneInput('Kanal4')).toEqual({ channel: 4 })
    expect(parseTuneInput('35')).toEqual({ freq: 35 })
    expect(parseTuneInput('29')).toEqual({ channel: 29 })
    expect(parseTuneInput('251.25.1')).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Round-Trip: Jede Musterlösung ist richtig – mit Kommas, mit Leerzeichen, in Ziffern
// ---------------------------------------------------------------------------

const index = contentResult.index!
const env = (seed: string) => ({ rng: createRng(seed), content: index, self: { name: 'Dodge', flight: 2, position: 1 } })
const DIGIT_WORDS: Record<string, string> = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', niner: '9', nine: '9' }
/** „two five one point two five“ → „251.25“ – so, wie man es aufschreibt. */
function written(text: string): string {
  return text
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|niner|nine)\b/gi, (w) => DIGIT_WORDS[w.toLowerCase()])
    .replace(/(\d) (?=\d)/g, '$1')
    .replace(/(\d) point (\d)/g, '$1.$2')
    .replace(/(\d) decimal (\d)/g, '$1.$2')
}

describe('Round-Trip über alle Inhalte', () => {
  const cases: { where: string; segments: ResolvedSegment[] }[] = []
  for (let i = 0; i < 8; i++) {
    for (const x of index.exchanges.values()) {
      const r = resolveExchange(x, env(`rt-${x.id}-${i}`))
      for (const t of r.transmissions) if (!t.skip && t.segments.length > 1) cases.push({ where: x.id, segments: t.segments })
    }
    for (const sc of index.scenarios.values()) {
      const r = resolveScenario(sc, env(`rt-${sc.id}-${i}`))
      for (const st of r.steps) if (st.you) cases.push({ where: sc.id, segments: st.you.transmission.segments })
    }
  }

  it.each([
    ['mit Kommas', (s: ResolvedSegment[]) => s.map((x) => x.text).join(', ')],
    ['mit Leerzeichen (wie ein Sprach-Transkript)', (s: ResolvedSegment[]) => s.map((x) => x.text).join(' ')],
    ['in Ziffern geschrieben', (s: ResolvedSegment[]) => s.map((x) => written(x.text)).join(', ')],
  ])('%s', (_, join) => {
    const failed: string[] = []
    for (const c of cases) {
      const text = join(c.segments)
      const r = scoreCall(text, c.segments)
      if (!r.correct || r.score < 0.999) failed.push(`${c.where}: „${text}“ → ${r.issues.join(' | ')}`)
    }
    expect(failed.slice(0, 8), `${failed.length} von ${cases.length} Fällen`).toEqual([])
  })

  it('Gegenprobe: eine falsche Ziffer in einem Pflichtteil ist falsch – auch ohne Kommas', () => {
    const NEXT: Record<string, string> = { zero: 'one', one: 'two', two: 'three', three: 'four', four: 'five', five: 'six', six: 'seven', seven: 'eight', eight: 'niner', niner: 'zero', nine: 'zero' }
    const tolerated: string[] = []
    let tested = 0
    for (const c of cases) {
      const k = c.segments.findIndex((s) => s.critical && !s.tolerance && /\b(zero|one|two|three|four|five|six|seven|eight|niner|nine)\b/i.test(s.text))
      if (k < 0) continue
      const bad = c.segments.map((s, x) => (x === k ? s.text.replace(/\b(zero|one|two|three|four|five|six|seven|eight|niner|nine)\b/i, (w) => NEXT[w.toLowerCase()]) : s.text))
      // Varianten (alt), die den verfälschten Wert zufällig erlauben, zählen nicht
      if ((c.segments[k].alt ?? []).some((a) => sameCall(a, bad[k]))) continue
      tested++
      for (const join of [', ', ' ']) {
        const text = bad.join(join)
        if (scoreCall(text, c.segments).correct) tolerated.push(`${c.where}: „${text}“`)
      }
    }
    expect(tested).toBeGreaterThan(50)
    expect(tolerated.slice(0, 8), `${tolerated.length} verfälschte Funksprüche als richtig gewertet`).toEqual([])
  })
})
