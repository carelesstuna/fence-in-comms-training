/**
 * Tests für Checkrides: Rangfolge, Zulassung, Auswertung und Validator.
 */
import { describe, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'
import { buildContentIndex } from './content/index'
import type { ResolvedScenario, ResolvedScenarioStep, ResolvedSegment } from './drills/types'
import { applyCheckrideResult, checkrideStatus, EMPTY_PROGRESS, rankFor, type ProgressState } from './progress/progress'
import { criticalMisses, evaluateCheckride, type StepOutcome } from './scoring/checkride'
import { scoreCall } from './scoring/score'

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Inhalte mit geändertem Lehrplan bauen (Pfade ohne führenden Schrägstrich wie im Loader). */
function withCurriculum(edit: (cur: { ranks: Record<string, unknown>[] }) => void) {
  const files: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) files[k.replace(/^\//, '')] = v
  const cur = parse(files['content/curriculum.yaml'])
  edit(cur)
  files['content/curriculum.yaml'] = stringify(cur)
  return buildContentIndex(files)
}

const CHECKRIDE = { scenario: 'm3-s2-taxi-departure', requires: ['m3'], passScore: 0.8 }

describe('Ränge mit Checkride', () => {
  const { index, errors } = withCurriculum((cur) => (cur.ranks[1].checkride = CHECKRIDE))
  const idx = index!

  it('Inhalte mit Checkride sind gültig', () => {
    expect(errors).toEqual([])
    expect(idx.curriculum.ranks[1].checkride?.noCritical).toBe(true)
  })

  it('ohne bestandenen Checkride bleibt man Kadett – auch mit viel XP', () => {
    const p: ProgressState = { ...EMPTY_PROGRESS, xp: 5000 }
    const r = rankFor(idx, p)
    expect(r.current.id).toBe('cadet')
    expect(r.next?.id).toBe('wingman')
    expect(r.checkrideDue).toBe(true)
  })

  it('Zulassung: XP und Voraussetzungen, danach bestanden', () => {
    let p: ProgressState = { ...EMPTY_PROGRESS, xp: 100 }
    let s = checkrideStatus(idx, p, 'wingman')!
    expect(s.state).toBe('locked')
    expect(s.missing.join(' ')).toContain('XP')
    expect(s.missing.join(' ')).toContain('Modul 3')

    const lessons: ProgressState['lessons'] = {}
    for (const id of idx.modules.get('m3')!.lessons) lessons[id] = { completedAt: '', bestScore: 1, attempts: 1 }
    p = { ...p, xp: 1500, lessons }
    s = checkrideStatus(idx, p, 'wingman')!
    expect(s).toEqual({ state: 'available', missing: [] })

    p = applyCheckrideResult(p, 'wingman', 0.6, false)
    expect(rankFor(idx, p).current.id).toBe('cadet')
    expect(p.checkrides.wingman).toMatchObject({ attempts: 1, passed: false, bestScore: 0.6 })

    p = applyCheckrideResult(p, 'wingman', 0.9, true)
    // Wingman per Checkride, Element Lead (1200 XP, ohne Checkride) gleich mit
    expect(rankFor(idx, p).current.id).toBe('element-lead')
    expect(checkrideStatus(idx, p, 'wingman')!.state).toBe('passed')

    // Ein späterer schlechter Versuch nimmt den Rang nicht weg
    p = applyCheckrideResult(p, 'wingman', 0.2, false)
    expect(p.checkrides.wingman).toMatchObject({ attempts: 3, passed: true, bestScore: 0.9, score: 0.2 })
    expect(rankFor(idx, p).current.id).toBe('element-lead')
  })

  it('alter Fortschritt ohne checkrides-Feld bricht nichts', () => {
    const old = { xp: 50, lessons: {}, placements: {}, hangarSeen: [] } as unknown as ProgressState
    expect(rankFor(idx, old).current.id).toBe('cadet')
    expect(checkrideStatus(idx, old, 'wingman')!.state).toBe('locked')
  })

  it('Validator prüft Szenario, Voraussetzungen, ersten Rang und XP-Reihenfolge', () => {
    const msgs = withCurriculum((cur) => {
      cur.ranks[0].checkride = CHECKRIDE
      cur.ranks[1].checkride = { scenario: 'gibt-es-nicht', requires: ['m3', 'kantine'] }
      cur.ranks[2].xp = 10
    }).errors.map((e) => e.message)
    const all = msgs.join('\n')
    expect(all).toContain('Der erste Rang kann keinen Checkride haben')
    expect(all).toContain('Checkride-Szenario "gibt-es-nicht" existiert nicht')
    expect(all).toContain('Voraussetzung "kantine" ist weder Modul noch Lektion')
    expect(all).toContain('XP (10) kleiner als beim Rang davor')
  })
})

// ---------------------------------------------------------------------------
// Auswertung
// ---------------------------------------------------------------------------

const seg = (text: string, role: ResolvedSegment['role'], extra: Partial<ResolvedSegment> = {}): ResolvedSegment => ({ text, role, ...extra })
const tx = (segments: ResolvedSegment[]) => ({ speaker: 'Viper 1-1', you: true, channel: 'radio' as const, segments })
const step = (s: Partial<ResolvedScenarioStep>): ResolvedScenarioStep => ({ stage: 'X', hear: [], silence: false, reply: [], ...s })

const readback = [seg('Viper one one', 'callsign', { critical: true }), seg('hold short', 'instruction', { critical: true }), seg('runway one six', 'value')]
const scenario: ResolvedScenario = {
  id: 't',
  title: 'T',
  summary: 'S',
  self: { name: 'Viper', flight: 1, position: 1 },
  stations: [],
  steps: [
    step({ stage: 'Funkgerät', tune: { name: 'Tower', freq: '251.0' }, critical: true }),
    step({ stage: 'Readback', you: { mode: 'build', transmission: tx(readback), tiles: [], options: [], correct: 0 } }),
    step({ stage: 'Push', silence: true, critical: true }),
  ],
}
const call = (text: string) => {
  const detail = scoreCall(text, readback)
  return { correct: detail.correct, score: detail.score, silent: false, detail }
}
const silent = { correct: true, score: 1, silent: true }
const rule = { passScore: 0.8, noCritical: true }

describe('Checkride-Auswertung', () => {
  it('erkennt fehlende Pflichtteile', () => {
    expect(criticalMisses(readback, scoreCall('Viper one one, runway one six', readback))).toEqual(['hold short'])
    expect(criticalMisses(readback, scoreCall('Viper one one, hold short, runway one six', readback))).toEqual([])
  })

  it('fehlerfrei bestanden', () => {
    const o: Record<number, StepOutcome> = { 0: { tune: true }, 1: { call: call('Viper one one, hold short runway one six') }, 2: { call: silent } }
    const r = evaluateCheckride(scenario, 1, o, rule)
    expect(r.critical).toEqual([])
    expect(r.passed).toBe(true)
  })

  it('ein fehlender Pflichtteil lässt durchfallen – trotz gutem Ergebnis', () => {
    const o: Record<number, StepOutcome> = { 0: { tune: true }, 1: { call: call('Viper one one, runway one six') }, 2: { call: silent } }
    const r = evaluateCheckride(scenario, 0.9, o, rule)
    expect(r.passed).toBe(false)
    expect(r.critical.map((c) => c.reason)).toEqual(['Pflichtteil fehlt oder falsch: „hold short“'])
    // ohne noCritical zählt nur das Ergebnis
    expect(evaluateCheckride(scenario, 0.9, o, { ...rule, noCritical: false }).passed).toBe(true)
  })

  it('kritische Schritte: falsche Frequenz und gebrochenes Schweigen', () => {
    const o: Record<number, StepOutcome> = {
      0: { tune: false },
      1: { call: call('Viper one one, hold short runway one six') },
      2: { call: { correct: false, score: 0, silent: false } },
    }
    const r = evaluateCheckride(scenario, 0.85, o, rule)
    expect(r.passed).toBe(false)
    expect(r.critical.map((c) => c.stage)).toEqual(['Funkgerät', 'Push'])
    expect(r.critical[1].reason).toContain('Schweigen')
  })

  it('unter der Grenze nicht bestanden, auch ohne kritischen Fehler', () => {
    const o: Record<number, StepOutcome> = { 0: { tune: true }, 1: { call: call('Viper one one, hold short runway one six') }, 2: { call: silent } }
    const r = evaluateCheckride(scenario, 0.7, o, rule)
    expect(r.critical).toEqual([])
    expect(r.passed).toBe(false)
  })
})
