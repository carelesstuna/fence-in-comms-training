/**
 * Tests für die erweiterten Formate (Wünsche der Inhalts-Session):
 * Variablen (distinctFrom, range, oneOf mit Sprechform, neue Zahlenarten, Wetter, Comm Plan, Pools),
 * neue Übungstypen (Mehrfachauswahl, Lückentext, Reihenfolge, Formular), Profil-Filter, Validator.
 */
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { buildContentIndex } from './content/index'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { resolveVars, runwayForWind } from './random/vars'
import { findPlaceholders } from './random/template'
import { matchesProfile, resolveDrill } from './drills/resolve'
import { NUMBER_KINDS, type Airfield, type Drill, type Sim, type VarSpec } from './content/schema'
import { matchesAny } from './phraseology/normalize'

const index = contentResult.index!
const self = { name: 'Colt', flight: 4, position: 1 }
const env = (seed: string) => ({ rng: createRng(seed), content: index, self })

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Baut den Index mit zusätzlichen Test-Dateien. */
function buildWith(extra: Record<string, unknown>) {
  const files = { ...raw }
  for (const [path, data] of Object.entries(extra)) files[path] = stringify(data)
  return buildContentIndex(files)
}

describe('Variablen', () => {
  it('distinctFrom erzwingt verschiedene Werte', () => {
    for (let i = 0; i < 100; i++) {
      const v = resolveVars(
        {
          a: { oneOf: ['Alpha', 'Bravo'] },
          b: { oneOf: ['Alpha', 'Bravo'], distinctFrom: ['a'] },
        },
        env(`d${i}`),
      )
      expect(v.a.text).not.toBe(v.b.text)
    }
  })

  it('range und step gelten für Zahlenarten', () => {
    for (let i = 0; i < 100; i++) {
      const v = resolveVars({ alt: { number: 'altitude', range: [3000, 9000], step: 500 } }, env(`r${i}`))
      const ft = Number(v.alt.text.replace(/,/g, ''))
      expect(ft).toBeGreaterThanOrEqual(3000)
      expect(ft).toBeLessThanOrEqual(9000)
      expect(ft % 500).toBe(0)
    }
  })

  it('oneOf kennt getrennte Schreib- und Sprechform', () => {
    const v = resolveVars({ p: { oneOf: [{ text: '1+30', spoken: 'one plus three zero' }] } }, env('o'))
    expect(v.p.text).toBe('1+30')
    expect(v.p.spoken).toBe('one plus three zero')
  })

  it('alle Zahlenarten liefern Text und Sprechform', () => {
    for (const kind of NUMBER_KINDS) {
      for (let i = 0; i < 20; i++) {
        const v = resolveVars({ n: { number: kind } as VarSpec }, env(`${kind}${i}`))
        expect(v.n.text, kind).toBeTruthy()
        expect(v.n.spoken, kind).toBeTruthy()
        expect(v.n.spoken, kind).not.toMatch(/\d/)
      }
    }
  })

  it('Squawk nutzt nur Ziffern 0–7 und keine Notfallcodes', () => {
    for (let i = 0; i < 200; i++) {
      const v = resolveVars({ sq: { number: 'squawk' } }, env(`sq${i}`))
      expect(v.sq.text).toMatch(/^[0-7]{4}$/)
      expect(['7500', '7600', '7700']).not.toContain(v.sq.text)
    }
  })

  it('Spezielle Sprechformen: Playtime, Mach, VHF-FM', () => {
    expect(resolveVars({ p: { number: 'playtime', range: [90, 90] } }, env('p')).p.spoken).toBe('one plus three zero')
    expect(resolveVars({ m: { number: 'mach', range: [0.85, 0.85] } }, env('m')).m.spoken).toBe('point eight five')
    expect(resolveVars({ f: { number: 'vhf-fm', range: [42.5, 42.5] } }, env('f')).f.text).toBe('42.5')
  })

  it('Höhe mit Hunderterstelle (blind): 16.9, angels und Fuß als Felder', () => {
    const v = resolveVars({ a: { number: 'thousands', range: [16.9, 16.9] } }, env('t')).a
    expect(v.text).toBe('16.9')
    expect(v.spoken).toBe('one six point niner')
    expect(v.fields!.angels.text).toBe('17')
    expect(v.fields!.angels.spoken).toBe('one seven')
    expect(v.fields!.feet.text).toBe('16.900')
    expect(matchesAny('blind one six point nine', [`blind ${v.spoken}`])).toBe(true)
    for (let i = 0; i < 50; i++) {
      const r = resolveVars({ a: { number: 'thousands', range: [12, 30] } }, env(`t${i}`)).a
      expect(r.text).toMatch(/^\d{2}\.\d$/)
      expect(Number(r.text)).toBeGreaterThanOrEqual(12)
      expect(Number(r.text)).toBeLessThanOrEqual(30)
    }
  })
})

describe('Wetter und Runway', () => {
  it('wählt die Bahn mit dem meisten Gegenwind', () => {
    const rng = createRng('w')
    expect(runwayForWind(['13', '31'], 310, 10, rng)).toBe('31')
    expect(runwayForWind(['13', '31'], 150, 10, rng)).toBe('13')
    expect(['03L', '03R']).toContain(runwayForWind(['03L', '21R', '03R', '21L'], 40, 8, rng))
  })

  it('gleicht die Runway des Flugplatzes an den Wind an', () => {
    for (let i = 0; i < 60; i++) {
      const v = resolveVars(
        { af: { pool: 'airfields' }, wx: { weather: true, airfield: 'af', wind: 'any', sky: 'any' } },
        env(`wx${i}`),
      )
      const wx = v.wx.fields!
      expect(v.af.fields!.runway.text).toBe(wx.runway.text)
      if (wx.windSpeed.text !== '0') {
        const rwyHeading = Number(wx.runway.text.replace(/[LRC]/, '')) * 10
        const diff = Math.abs(((rwyHeading - Number(wx.windDir.text)) % 360 + 540) % 360 - 180)
        expect(diff, `${wx.runway.text} bei Wind ${wx.wind.text}`).toBeLessThanOrEqual(90)
      }
    }
  })

  it('leitet den Träger-Case aus dem Wetter ab', () => {
    const vmc = resolveVars({ wx: { weather: true, wind: 'any', sky: 'vmc' } }, env('vmc')).wx.fields!
    const imc = resolveVars({ wx: { weather: true, wind: 'any', sky: 'imc' } }, env('imc')).wx.fields!
    expect(vmc.case.text).toBe('Case I')
    expect(imc.case.text).toBe('Case III')
  })
})

describe('Comm Plan und Pools', () => {
  it('Comm Plan ist in sich stimmig: verschiedene Kanäle und Frequenzen, Tower = Platzfrequenz', () => {
    for (let i = 0; i < 40; i++) {
      // Plätze außerhalb von BMS: Mission-Comm-Card mit lauter verschiedenen Kanälen (BMS-Plan: platzdaten.test.ts)
      const v = resolveVars({ af: { pool: 'airfields', where: { map: 'caucasus' } }, cp: { commplan: true, airfield: 'af' } }, env(`cp${i}`))
      const cp = v.cp.fields!
      const keys = Object.keys(cp).filter((k) => k !== 'guard')
      expect(new Set(keys.map((k) => cp[k].fields!.channel.text)).size).toBe(keys.length)
      expect(new Set(keys.map((k) => cp[k].fields!.freq.text)).size).toBe(keys.length)
      expect(cp.tower.fields!.freq.text).toBe(v.af.fields!.twr.text)
      expect(cp.guard.fields!.freq.text).toBe('243.0')
    }
  })

  it('Träger- und Flugzeugpools liefern ihre Felder', () => {
    const v = resolveVars({ cv: { pool: 'carriers' }, ac: { pool: 'aircraft', where: { service: 'usn' } } }, env('cv'))
    expect(v.cv.fields!.tacan.text).toMatch(/^\d{1,3}X$/)
    expect(v.cv.fields!.brc.text).toMatch(/^\d{3}$/)
    expect(['Hornet', 'Tomcat']).toContain(v.ac.fields!.radio.text)
  })

  it('Flugplätze nach Sim-Profil: BMS → nur Korea, DCS → nur DCS-Karten, Filter gelten weiter', () => {
    const maps = (sims: Sim[], spec: VarSpec = { pool: 'airfields' }) => {
      const count = { kto: 0, other: 0 }
      for (let i = 0; i < 300; i++) {
        const a = resolveVars({ af: spec }, { ...env(`af${i}`), sims }).af.data as Airfield
        if (a.map === 'kto') count.kto++
        else count.other++
      }
      return count
    }
    // Nur Plätze, die es in der eigenen Sim gibt
    const bms = maps(['bms'])
    expect(bms).toEqual({ kto: 300, other: 0 })
    const dcs = maps(['dcs', 'srs'])
    expect(dcs).toEqual({ kto: 0, other: 300 })
    // where/require gelten vor der Auswahl; passt dann kein Platz der eigenen Sim, bleibt es beim Filter
    expect(maps(['bms'], { pool: 'airfields', where: { map: 'caucasus' } }).kto).toBe(0)
    for (let i = 0; i < 50; i++) {
      const a = resolveVars({ af: { pool: 'airfields', require: ['realFreqs'] } }, { ...env(`rf${i}`), sims: ['bms'] }).af.data as Airfield
      expect(a.realFreqs).toBeDefined()
    }
    // Ohne Profil: alle Plätze gleich wahrscheinlich
    const none = maps([])
    expect(none.kto).toBeGreaterThan(0)
    expect(none.other).toBeGreaterThan(none.kto)
  })
})

function fixtureDrill(d: Record<string, unknown>): Drill {
  const r = buildWith({ 'content/drills/zz-test.yaml': [d] })
  expect(r.errors).toEqual([])
  return r.index!.drills.get(d.id as string)!
}

describe('Neue Übungstypen', () => {
  it('Mehrfachauswahl kennt mehrere richtige Antworten', () => {
    const drill = fixtureDrill({ id: 'zz-multi', type: 'choice', prompt: 'Was?', options: ['a', 'b', 'c', 'd'], answer: [0, 2] })
    const d = resolveDrill(drill, env('m'))
    if (d.kind !== 'choice') throw new Error('falscher Typ')
    expect(d.multi).toBe(true)
    expect(d.correct.map((i) => d.options[i]).sort()).toEqual(['a', 'c'])
  })

  it('Lückentext nutzt Segmente eines Funkspruchs', () => {
    const drill = fixtureDrill({ id: 'zz-cloze', type: 'cloze', call: 'm1-radio-check', transmission: 0, blanks: [0, 3] })
    const d = resolveDrill(drill, env('c'))
    if (d.kind !== 'cloze') throw new Error('falscher Typ')
    expect(d.exchange.transmissions[0].segments[d.blanks[0]].role).toBe('addressee')
  })

  it('Reihenfolge aus Einträgen und aus Übertragungen', () => {
    const a = resolveDrill(fixtureDrill({ id: 'zz-seq', type: 'sequence', prompt: 'Ordne', items: ['ATIS', 'Ground', 'Tower'] }), env('s'))
    if (a.kind !== 'sequence') throw new Error('falscher Typ')
    expect(a.solution.map((k) => a.items.find((i) => i.key === k)!.label)).toEqual(['ATIS', 'Ground', 'Tower'])
    const b = resolveDrill(fixtureDrill({ id: 'zz-seq2', type: 'sequence', prompt: 'Ordne', call: 'm1-radio-check' }), env('s2'))
    if (b.kind !== 'sequence') throw new Error('falscher Typ')
    expect(b.items).toHaveLength(2)
    expect(b.items.find((i) => i.key === b.solution[0])!.speaker).toBe('Du')
  })

  it('Formular mit Wetter-Variablen (ATIS-Decoder)', () => {
    const drill = fixtureDrill({
      id: 'zz-form',
      type: 'form',
      prompt: 'Schreib mit',
      vars: { af: { pool: 'airfields' }, wx: { weather: true, airfield: 'af' }, info: { letter: true } },
      context: '{af.name} information {info}, runway {wx.runway}, wind {wx.wind}, altimeter {wx.altimeter}',
      fields: [
        { label: 'Runway', accept: ['{wx.runway}'] },
        { label: 'Altimeter', accept: ['{wx.altimeter}', '{wx.altimeter|spoken}'] },
      ],
    })
    const d = resolveDrill(drill, env('f'))
    if (d.kind !== 'form') throw new Error('falscher Typ')
    expect(findPlaceholders(d.context!)).toEqual([])
    // Eingaben als Zahl mit Punkt, als Ziffernfolge und gesprochen werden alle akzeptiert
    const alt = d.fields[1].accept
    expect(matchesAny(alt[0], alt)).toBe(true)
    expect(matchesAny(alt[0].replace('.', ''), alt)).toBe(true)
    expect(matchesAny(alt[1].replace(/niner/g, 'nine'), alt)).toBe(true)
  })
})

describe('Profil-Filter', () => {
  it('blendet unpassende Übungen aus, zeigt bei leerem Profil alles', () => {
    expect(matchesProfile({ aircraft: ['f14'] }, { sims: ['dcs'], aircraft: ['f16'] })).toBe(false)
    expect(matchesProfile({ aircraft: ['f14'] }, { sims: ['dcs'], aircraft: [] })).toBe(true)
    expect(matchesProfile({ sims: ['bms'] }, { sims: ['dcs', 'srs'], aircraft: [] })).toBe(false)
    expect(matchesProfile({}, { sims: [], aircraft: [] })).toBe(true)
  })
})

describe('Validator', () => {
  it('V1: Störbausteine dürfen Variablen des Funkspruchs nutzen', () => {
    const r = buildWith({
      'content/drills/zz-test.yaml': [
        { id: 'zz-v1', type: 'build', call: 'm1-radio-check', distractors: ['{airfield.name} Ground', '{airfield.vhf|spoken}'] },
      ],
    })
    expect(r.errors).toEqual([])
  })

  it('meldet Fehler in den neuen Formaten', () => {
    const r = buildWith({
      'content/drills/zz-test.yaml': [
        { id: 'zz-e1', type: 'choice', prompt: 'x', options: ['a', 'b'], answer: [0, 5] },
        { id: 'zz-e2', type: 'cloze', call: 'm1-radio-check', transmission: 0, blanks: [9] },
        { id: 'zz-e3', type: 'sequence', prompt: 'x' },
        { id: 'zz-e4', type: 'input', prompt: 'x', accept: ['{b}'], vars: { b: { oneOf: ['x'], distinctFrom: ['a'] } } },
        { id: 'zz-e5', type: 'input', prompt: 'x', accept: ['{wx.runway}'], vars: { wx: { weather: true, airfield: 'nope' } } },
        { id: 'zz-e6', type: 'input', prompt: 'x', accept: ['y'], vars: { c: { pool: 'ships' } } },
      ],
    })
    const msgs = r.errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('answer 5')
    expect(msgs).toContain('Lücke 9')
    expect(msgs).toContain('items oder call')
    expect(msgs).toContain('distinctFrom "a"')
    expect(msgs).toContain('airfield "nope"')
    expect(msgs).toContain('unbekannter Pool "ships"')
  })
})
