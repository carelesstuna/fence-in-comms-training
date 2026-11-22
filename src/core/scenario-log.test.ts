/**
 * Funk-Log im Szenario (U2-05, E1-20): Dort steht, was du gesagt hast, die Musterlösung gekennzeichnet daneben.
 * Bewertung: nie „Nicht ganz“ mit 100 % (E3-13).
 */
import { describe, expect, it } from 'vitest'
import type { CallResult } from '../components/CallInput'
import type { ResolvedScenario, ResolvedScenarioStep, ResolvedTransmission } from './drills/types'
import { scoreCall } from './scoring/score'
import { MODEL_LABEL, scenarioLog, type LogState } from '../ui/scenarioLog'
import { capWrongScore } from '../ui/scoring'

const tx = (speaker: string, you: boolean, ...texts: string[]): ResolvedTransmission => ({
  speaker,
  you,
  channel: 'radio',
  segments: texts.map((text) => ({ text, role: 'info' })),
})

const startup: ResolvedTransmission = {
  speaker: 'Viper 1-1',
  you: true,
  channel: 'radio',
  segments: [
    { text: 'Batumi Ground', role: 'addressee' },
    { text: 'Viper one one', role: 'callsign' },
    { text: 'flight of four', role: 'info', optional: true },
    { text: 'request startup', role: 'request' },
  ],
}

const step = (mode: 'type' | 'build' | 'choice', you: ResolvedTransmission, extra: Partial<ResolvedScenarioStep> = {}): ResolvedScenarioStep => ({
  stage: 'Anlassen',
  hear: [],
  you: { mode, transmission: you, tiles: [], options: [], correct: 0 },
  silence: false,
  reply: [tx('Batumi Ground', false, 'startup approved')],
  ...extra,
})

const scenario: ResolvedScenario = {
  id: 's',
  title: 'Test',
  summary: '',
  self: { name: 'Viper', flight: 1, position: 1 },
  stations: [],
  steps: [step('type', startup, { hear: [tx('ATIS', false, 'information Papa')] }), step('build', tx('Viper 1-1', true, 'Batumi Ground', 'request taxi'))],
}

const typed = (text: string, extra: Partial<CallResult> = {}): CallResult => ({ correct: true, score: 1, silent: false, text, ...extra })
const state = (s: Partial<LogState>): LogState => ({ step: 0, tuned: true, answered: true, blind: false, calls: {}, results: {}, ...s })

describe('Funk-Log', () => {
  it('zeigt das Getippte als Text und darunter die gekennzeichnete Musterlösung', () => {
    const text = 'Batumi Ground, Viper 1-1, request startup'
    const log = scenarioLog(scenario, state({ calls: { 0: typed(text) }, results: { 0: 1 } }))
    expect(log.map((e) => e.key)).toEqual(['0h0', '0y', '0m', '0r0'])
    const [, mine, model] = log
    expect(mine.t.segments.map((s) => s.text)).toEqual([text])
    expect(mine.neutral).toBe(true)
    expect(mine.label).toBeUndefined()
    // Musterlösung mit Anatomie, aber als solche gekennzeichnet – „flight of four“ wurde nie gesagt
    expect(model.label).toBe(MODEL_LABEL)
    expect(model.model).toBe(true)
    expect(model.t).toBe(startup)
  })

  it('wer schweigt, obwohl er funken sollte, hat nichts gesagt – nur die Musterlösung steht da', () => {
    const log = scenarioLog(scenario, state({ calls: { 0: typed('', { silent: true, correct: false, score: 0 }) }, results: { 0: 0 } }))
    expect(log.filter((e) => e.t.you).map((e) => e.label)).toEqual([MODEL_LABEL])
  })

  it('Baukasten: richtig gebaut steht als „Du“ da, falsch gebaut nur als Musterlösung', () => {
    const right = scenarioLog(scenario, state({ step: 1, calls: { 0: typed('x') }, results: { 0: 1, 1: 1 } })).find((e) => e.key === '1y')
    expect(right?.label).toBeUndefined()
    expect(right?.t.segments.map((s) => s.text)).toEqual(['Batumi Ground', 'request taxi'])
    const wrong = scenarioLog(scenario, state({ step: 1, calls: { 0: typed('x') }, results: { 0: 1, 1: 0 } }))
    expect(wrong.find((e) => e.key === '1y')).toBeUndefined()
    expect(wrong.find((e) => e.key === '1m')?.label).toBe(MODEL_LABEL)
  })

  it('Checkride: nur das Gesagte, keine Musterlösung', () => {
    const log = scenarioLog(scenario, state({ blind: true, calls: { 0: typed('Batumi Ground, Viper 1-1, request startup') } }))
    expect(log.map((e) => e.key)).toEqual(['0h0', '0y', '0r0'])
    expect(scenarioLog(scenario, state({ blind: true, calls: { 0: typed('', { silent: true }) } })).map((e) => e.key)).toEqual(['0h0', '0r0'])
  })

  it('vor dem Einstellen und vor der Antwort ist es still', () => {
    expect(scenarioLog(scenario, state({ tuned: false, answered: false }))).toEqual([])
    expect(scenarioLog(scenario, state({ answered: false })).map((e) => e.key)).toEqual(['0h0'])
  })
})

describe('Bewertung: nie „Nicht ganz“ mit 100 % (E3-13)', () => {
  it('falscher Wert in einem optionalen Teil kostet einen halben Pflichtteil', () => {
    const raw = scoreCall('Batumi Ground, Viper one one, flight of two, request startup', startup.segments)
    expect(raw.correct).toBe(false)
    const capped = capWrongScore(raw, startup.segments)
    expect(capped.correct).toBe(false)
    expect(capped.score).toBeCloseTo(1 - 0.5 / 3)
    expect(Math.round(capped.score * 100)).toBeLessThan(100)
    expect(capped.issues).toEqual(raw.issues)
  })

  it('richtige und schon abgewertete Antworten bleiben unverändert', () => {
    const right = scoreCall('Batumi Ground, Viper one one, request startup', startup.segments)
    expect(right.correct).toBe(true)
    expect(capWrongScore(right, startup.segments)).toBe(right)
    const partial = scoreCall('Batumi Ground, request startup', startup.segments)
    expect(capWrongScore(partial, startup.segments)).toBe(partial)
  })

  it('auch bei nur einem Pflichtteil höchstens 99 %', () => {
    const one = [{ text: 'x', role: 'info', optional: false }]
    const r = capWrongScore({ correct: false, score: 1, slots: [], extras: [], fillers: [], issues: [], heard: [], weak: false }, one)
    expect(r.score).toBeLessThanOrEqual(0.99)
  })
})
