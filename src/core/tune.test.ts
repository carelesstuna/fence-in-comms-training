/**
 * Tests für SZ4: Funkgerät einstellen, Kneeboard und Fundort im Szenario.
 */
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { createRng } from './random/rng'
import { resolveScenario } from './drills/resolve'
import { checkTune, parseTuneInput, type RadioStation } from './scoring/tune'

const index = contentResult.index!
const env = (seed: string) => ({ rng: createRng(seed), content: index, self: { name: 'Dodge', flight: 2, position: 1 } })
const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const stations: RadioStation[] = [
  { name: 'Ground', channel: '4', freq: '251.25' },
  { name: 'Tower', channel: '7', freq: '263.0' },
  { name: 'Strike', channel: '12', freq: '305.5' },
]

describe('Funkgerät einstellen', () => {
  it('liest Kanäle und Frequenzen in allen üblichen Schreibweisen', () => {
    for (const s of ['4', 'ch 4', 'Kanal 4', 'channel 4', 'button four', 'preset 4']) expect(parseTuneInput(s), s).toEqual({ channel: 4 })
    for (const s of ['251.25', '251,25', 'two five one point two five', '251.250 MHz']) expect(parseTuneInput(s), s).toEqual({ freq: 251.25 })
    expect(parseTuneInput('hallo')).toEqual({})
  })

  it('erkennt richtig, falsch und wen man stattdessen erwischt', () => {
    const ground = stations[0]
    expect(checkTune('Kanal 4', ground, stations).correct).toBe(true)
    expect(checkTune('251.25', ground, stations).correct).toBe(true)
    const tower = checkTune('7', ground, stations)
    expect(tower.correct).toBe(false)
    expect(tower.reached?.name).toBe('Tower')
    const byFreq = checkTune('305.5', ground, stations)
    expect(byFreq.reached?.name).toBe('Strike')
    const nobody = checkTune('312.0', ground, stations)
    expect(nobody.correct).toBe(false)
    expect(nobody.reached).toBeUndefined()
    expect(checkTune('312', ground, stations).tuned).toBe('312.0')
    expect(checkTune('???', ground, stations).unreadable).toBe(true)
    // Frequenz ohne Kanal (z. B. Platzfrequenz ohne Comm Plan)
    expect(checkTune('260', { name: 'Batumi Traffic', freq: '260.0' }).correct).toBe(true)
  })
})

describe('Warbird-Kanäle A–D (P3-02)', () => {
  const warbird: RadioStation[] = [
    { name: 'Lantern (GCI)', channel: 'A', freq: '124.5' },
    { name: 'Tower', channel: 'B', freq: '131.0' },
  ]

  it('liest Buchstaben-Kanäle in allen üblichen Schreibweisen', () => {
    for (const s of ['A', 'a', 'Kanal A', 'channel a', 'ch A', 'chA', 'KanalA', 'button A', 'Knopf A', 'Kanal Alpha', 'alpha', 'button able'])
      expect(parseTuneInput(s), s).toEqual({ channel: 'A' })
    expect(parseTuneInput('channel baker')).toEqual({ channel: 'B' })
    expect(parseTuneInput('Kanal Charlie')).toEqual({ channel: 'C' })
    expect(parseTuneInput('D')).toEqual({ channel: 'D' })
    // Kein Kanal-Buchstabe: E gibt es nicht, ganze Wörter auch nicht, Ziffern gehen vor
    expect(parseTuneInput('Kanal E')).toEqual({})
    expect(parseTuneInput('Kanal A 4')).toEqual({ channel: 4 })
    expect(parseTuneInput('button four')).toEqual({ channel: 4 })
  })

  it('stellt Buchstaben-Kanäle richtig ein und meldet, wen man stattdessen erwischt', () => {
    const gci = warbird[0]
    expect(checkTune('Kanal A', gci, warbird).correct).toBe(true)
    expect(checkTune('a', gci, warbird).tuned).toBe('Kanal A · 124.5')
    expect(checkTune('124.5', gci, warbird).correct).toBe(true)
    const tower = checkTune('B', gci, warbird)
    expect(tower.correct).toBe(false)
    expect(tower.reached?.name).toBe('Tower')
    const nobody = checkTune('Kanal D', gci, warbird)
    expect(nobody.correct).toBe(false)
    expect(nobody.reached).toBeUndefined()
    expect(nobody.tuned).toBe('Kanal D')
    // Ein Buchstabe trifft keinen Ziffern-Kanal und umgekehrt
    expect(checkTune('A', stations[0], stations).correct).toBe(false)
    expect(checkTune('4', gci, warbird).correct).toBe(false)
  })
})

describe('Szenarien mit Kneeboard', () => {
  it('jeder tune-Schritt ist im Kneeboard nachschlagbar und mit dem eigenen Wert einstellbar', () => {
    for (const sc of index.scenarios.values()) {
      for (let i = 0; i < 15; i++) {
        const r = resolveScenario(sc, env(`${sc.id}${i}`))
        for (const st of r.steps.filter((s) => s.tune)) {
          const kb = r.kneeboard!
          expect(kb, sc.id).toBeDefined()
          const listed = [...kb.stations.map((s) => s.freq), ...kb.rows.map((x) => x.value)]
          expect(listed, `${sc.id}: ${st.tune!.name}`).toContain(st.tune!.freq)
          expect(checkTune(st.tune!.freq, st.tune!, r.stations).correct).toBe(true)
          if (st.tune!.channel) expect(checkTune(`Kanal ${st.tune!.channel}`, st.tune!, r.stations).correct).toBe(true)
          expect(st.tune!.where, `${sc.id}: Fundort fehlt`).toBeDefined()
        }
      }
    }
  })

  it('kein Szenario sagt mehr Kanal oder Frequenz im Situationstext vor', () => {
    for (const sc of index.scenarios.values()) {
      const r = resolveScenario(sc, env(`txt-${sc.id}`))
      for (const st of r.steps) {
        if (!st.situation) continue
        for (const s of r.stations) expect(st.situation, `${sc.id}: ${st.stage}`).not.toContain(s.freq)
        expect(st.situation, `${sc.id}: ${st.stage}`).not.toMatch(/Kanal \d/)
      }
    }
  })

  it('Validator: tune braucht ein Kneeboard, Stationen müssen existieren', () => {
    const files = { ...raw }
    files['content/scenarios/zz.yaml'] = stringify({
      id: 'zz-s',
      title: 'T',
      summary: 'S',
      vars: { af: { pool: 'airfields' } },
      steps: [{ stage: 'A', tune: { name: 'Tower', freq: '{af.uhf}' } }],
    })
    files['content/scenarios/zz2.yaml'] = stringify({
      id: 'zz-s2',
      title: 'T',
      summary: 'S',
      vars: { af: { pool: 'airfields' }, cp: { commplan: true, airfield: 'af' } },
      kneeboard: { commplan: 'cp', stations: ['tower', 'kantine'], airfield: 'cp' },
      steps: [{ stage: 'A' }],
    })
    const msgs = buildContentIndex(files).errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('Schritte mit tune brauchen ein kneeboard')
    expect(msgs).toContain('unbekannte Comm-Plan-Station "kantine"')
    expect(msgs).toContain('kneeboard.airfield "cp" ist keine Flugplatz-Variable')
  })
})
