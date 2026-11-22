/**
 * Platzdaten im Würfel (Persona-Review 22.11.2026, WP C1):
 * - Platzfelder {af.twr}/{af.gnd}/{af.app}/{af.dep} mit Band (E3-10, P2-03, E3-19/P1-05: Plätze ohne UHF)
 * - fester BMS-Comm-Plan an KTO-Plätzen, Approach = Departure (E3-03, P2-01, P2-02)
 * - Höhen über der Platzhöhe (E3-01) – geprüft über alle Plätze und alle Variablen mit `above`
 * - Flugzeug aus dem Profil bevorzugt (P2-08, P1-17)
 * - Funknamen ohne „AB“ (E3-02, P2-05)
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import type { ContentIndex } from './content/index'
import { airfieldSchema, type Airfield, type VarSpec } from './content/schema'
import { createRng } from './random/rng'
import { findPlaceholders, fillTemplate } from './random/template'
import { bandOf, numOf, rangeAbove, resolveVars, type ResolveEnv } from './random/vars'
import { resolveScenario } from './drills/resolve'

const index = contentResult.index!
const self = { name: 'Colt', flight: 4, position: 1 }
const only = (a: Airfield): ContentIndex => ({ ...index, airfields: [a] })
const env = (seed: string, content: ContentIndex = index, extra: Partial<ResolveEnv> = {}): ResolveEnv => ({
  rng: createRng(seed),
  content,
  self,
  ...extra,
})
const kto = index.airfields.filter((a) => a.map === 'kto')
const notKto = index.airfields.filter((a) => a.map !== 'kto')

describe('Platzfelder twr, gnd, app, dep', () => {
  it('kommen aus den Platzdaten, sonst gewürfelt – mit Band und für jeden Platz', () => {
    for (const a of index.airfields) {
      for (let i = 0; i < 10; i++) {
        const f = resolveVars({ af: { pool: 'airfields' } }, env(`pf${a.id}${i}`, only(a))).af.fields!
        const twr = a.atc.uhf ?? a.atc.vhf!
        expect(f.twr.num, a.id).toBe(twr)
        expect(f.twr.fields!.band.text).toBe(a.atc.uhf !== undefined ? 'UHF' : 'VHF')
        expect(f.gnd.num, a.id).toBe(a.freqs?.ground ?? twr)
        expect(f.gnd.fields!.band.text).toBe(bandOf(f.gnd.num!))
        if (a.freqs?.departure !== undefined) {
          expect(f.dep.num).toBe(a.freqs.departure)
          expect(f.app.num).toBe(a.freqs.approach ?? a.freqs.departure)
        } else {
          // gewürfelt: UHF, verschieden voneinander und von den festen Platzfrequenzen
          const fixed = [a.atc.uhf, a.atc.vhf].filter((x) => x !== undefined)
          expect(f.app.fields!.band.text).toBe('UHF')
          expect(f.dep.fields!.band.text).toBe('UHF')
          expect(f.app.num).not.toBe(f.dep.num)
          expect(fixed).not.toContain(f.app.num)
          expect(fixed).not.toContain(f.dep.num)
        }
        for (const k of ['twr', 'gnd', 'app', 'dep']) expect(f[k].text).toMatch(/^\d{3}\.\d+$/)
      }
    }
  })

  it('derselbe Platz bekommt im selben Durchlauf dieselben gewürfelten Frequenzen', () => {
    const nellis = index.airfields.find((a) => a.id === 'nellis')!
    const v = resolveVars({ a: { pool: 'airfields' }, b: { pool: 'airfields' } }, env('gleich', only(nellis)))
    expect(v.a.fields!.app.text).toBe(v.b.fields!.app.text)
    expect(v.a.fields!.dep.text).toBe(v.b.fields!.dep.text)
  })

  it('Plätze ohne UHF (Khasab, Al Dhafra) funken auf VHF', () => {
    for (const id of ['khasab', 'al-dhafra']) {
      const a = index.airfields.find((x) => x.id === id)!
      expect(a.atc.uhf).toBeUndefined()
      const f = resolveVars({ af: { pool: 'airfields' } }, env(id, only(a))).af.fields!
      expect(f.twr.num).toBe(a.atc.vhf)
      expect(f.twr.fields!.band.text).toBe('VHF')
      expect(f.gnd.fields!.band.text).toBe('VHF')
    }
  })

  it('Funknamen ohne „AB“, Gunsan mit dem Alias Kunsan', () => {
    for (const a of index.airfields) expect(a.name, a.id).not.toMatch(/\b(AB|AFB)\b/)
    const gunsan = index.airfields.find((a) => a.id === 'kunsan')!
    expect(gunsan.name).toBe('Gunsan')
    const f = resolveVars({ af: { pool: 'airfields' } }, env('alias', only(gunsan))).af.fields!
    expect(f.alias.text).toBe('Kunsan')
    const osan = index.airfields.find((a) => a.id === 'osan')!
    expect(resolveVars({ af: { pool: 'airfields' } }, env('alias', only(osan))).af.fields!.alias.text).toBe('Osan')
  })

  it('Schema lehnt „AB“ im Funknamen und Plätze ohne ATC-Frequenz ab', () => {
    const base = { id: 'x', map: 'kto', runways: ['18/36'], verified: 'community' }
    expect(airfieldSchema.safeParse({ ...base, name: 'Osan AB', atc: { uhf: 300 } }).success).toBe(false)
    expect(airfieldSchema.safeParse({ ...base, name: 'Osan', atc: {} }).success).toBe(false)
    expect(airfieldSchema.safeParse({ ...base, name: 'Osan', atc: { vhf: 126.2 } }).success).toBe(true)
  })

  it('Kurzwelle und tiefes VHF der Kaukasus-Plätze wie im DCS-Flugplatzfenster (P1-07)', () => {
    const kutaisi = index.airfields.find((a) => a.id === 'kutaisi')!
    const f = resolveVars({ af: { pool: 'airfields' } }, env('hf', only(kutaisi))).af.fields!
    expect(f.hf.text).toBe('4.400')
    expect(f.vhfLow.text).toBe('41.000')
    for (const a of index.airfields.filter((x) => x.map === 'caucasus')) {
      expect(a.atc.hf, a.id).toBeDefined()
      expect(a.atc.vhfLow, a.id).toBeDefined()
    }
  })
})

describe('Comm Plan', () => {
  const cpOf = (a: Airfield, seed: string) =>
    resolveVars({ af: { pool: 'airfields' }, cp: { commplan: true, airfield: 'af' } }, env(seed, only(a)))

  it('BMS-Plätze: feste Presets UHF 2/3/4, Approach = Departure, ATIS und Flight auf VHF', () => {
    expect(kto.length).toBeGreaterThan(0)
    for (const a of kto) {
      for (let i = 0; i < 15; i++) {
        const v = cpOf(a, `bms${a.id}${i}`)
        const cp = v.cp.fields!
        const st = (k: string) => cp[k].fields!
        expect(st('ground').channel.text).toBe('2')
        expect(st('ground').freq.num).toBe(a.freqs!.ground)
        expect(st('tower').channel.text).toBe('3')
        expect(st('tower').freq.num).toBe(a.atc.uhf)
        expect(st('departure').channel.text).toBe('4')
        expect(st('approach').channel.text).toBe('4')
        expect(st('departure').freq.num).toBe(a.freqs!.departure)
        expect(st('approach').freq.text).toBe(st('departure').freq.text)
        expect(st('departure').freq.text).toBe(v.af.fields!.dep.text)
        expect(st('atis').channel.text).toBe('2')
        expect(st('atis').band.text).toBe('VHF')
        expect(st('atis').freq.num).toBe(a.freqs!.atis)
        expect(st('atis').name.text).toBe('ATIS (VHF)')
        expect(st('awacs').channel.text).toBe('6')
        expect(st('tanker').channel.text).toBe('13')
        expect(st('flight').channel.text).toBe('15')
        expect(st('flight').band.text).toBe('VHF')
        expect(Number(st('strike').channel.text)).toBeGreaterThanOrEqual(16)
        expect(Number(st('strike').channel.text)).toBeLessThanOrEqual(19)
        for (const k of ['ground', 'tower', 'departure', 'approach', 'awacs', 'tanker', 'strike']) expect(st(k).band.text).toBe('UHF')
        // Gewürfelte Frequenzen weichen den festen aus; geteilt sind nur Approach/Departure und AWACS/JTAC
        const keys = Object.keys(cp).filter((k) => !['guard', 'approach', 'jtac'].includes(k))
        expect(new Set(keys.map((k) => cp[k].fields!.freq.text)).size).toBe(keys.length)
        expect(st('jtac').freq.text).toBe(st('awacs').freq.text)
      }
    }
  })

  it('DCS-Plätze: Approach/Departure wie die Platzfelder, sonst alles verschieden, Tower = Platzfrequenz', () => {
    for (const a of notKto) {
      for (let i = 0; i < 10; i++) {
        const v = cpOf(a, `dcs${a.id}${i}`)
        const cp = v.cp.fields!
        expect(cp.approach.fields!.freq.text).toBe(v.af.fields!.app.text)
        expect(cp.departure.fields!.freq.text).toBe(v.af.fields!.dep.text)
        expect(cp.tower.fields!.freq.text).toBe(v.af.fields!.twr.text)
        expect(cp.tower.fields!.band.text).toBe(v.af.fields!.twr.fields!.band.text)
        const keys = Object.keys(cp).filter((k) => k !== 'guard')
        expect(new Set(keys.map((k) => cp[k].fields!.freq.text)).size, a.id).toBe(keys.length)
        expect(new Set(keys.map((k) => cp[k].fields!.channel.text)).size, a.id).toBe(keys.length)
      }
    }
  })
})

describe('Höhen über der Platzhöhe (E3-01)', () => {
  it('rangeAbove schiebt den Bereich um volle Schritte, die Spanne bleibt', () => {
    const raws = { af: { elevationFt: 3126 } as Airfield, low: { elevationFt: 33 } as Airfield }
    expect(rangeAbove([3000, 9000], 1000, { airfield: 'af', add: 2000 }, raws)).toEqual([6000, 12000])
    expect(rangeAbove([3000, 9000], 1000, { airfield: 'low', add: 2000 }, raws)).toEqual([3000, 9000])
    expect(rangeAbove([2, 4], 1, { airfield: 'af', add: 1000, unit: 1000 }, raws)).toEqual([5, 7])
    expect(rangeAbove([6, 9], 1, { airfield: 'af', add: 4000, unit: 1000 }, raws)).toEqual([8, 11])
    expect(rangeAbove([2, 4], 1, undefined, raws)).toEqual([2, 4])
    expect(rangeAbove([2, 4], 1, { airfield: 'fehlt', add: 1000, unit: 1000 }, raws)).toEqual([2, 4])
  })

  /** Alle Variablen-Sätze mit `above` aus Funksprüchen, Übungen und Szenarien. */
  const withAbove: { where: string; vars: Record<string, VarSpec> }[] = []
  for (const x of index.exchanges.values()) if (x.vars) withAbove.push({ where: x.id, vars: x.vars })
  for (const d of index.drills.values()) if (d.vars) withAbove.push({ where: d.id, vars: d.vars })
  for (const sc of index.scenarios.values()) if (sc.vars) withAbove.push({ where: sc.id, vars: sc.vars })
  const aboveVars = withAbove.flatMap(({ where, vars }) =>
    Object.entries(vars)
      .filter(([, s]) => ('int' in s || 'number' in s) && s.above)
      .map(([name, s]) => ({ where, vars, name, above: (s as { above: { airfield: string; add: number; unit: number } }).above })),
  )

  it('die bekannten Höhen-Würfe haben eine Untergrenze über dem Platz', () => {
    const names = aboveVars.map((v) => `${v.where}.${v.name}`)
    for (const n of [
      'm1-approach-numbers.alt',
      'm3-ifr-clearance.alt',
      'm3-departure-checkin.altA',
      'm3-departure-checkin.altB',
      'm3-s2-taxi-departure.altA',
      'm3-s2-taxi-departure.altB',
    ])
      expect(names).toContain(n)
  })

  it('kein Wurf liegt unter Platzhöhe + Abstand – über alle Plätze', () => {
    for (const a of index.airfields.filter((x) => x.elevationFt !== undefined)) {
      for (const v of aboveVars) {
        for (let i = 0; i < 8; i++) {
          const r = resolveVars(v.vars, env(`hoehe${a.id}${v.where}${i}`, only(a)))
          const ft = numOf(r[v.name])! * v.above.unit
          expect(ft, `${v.where}.${v.name} an ${a.id}`).toBeGreaterThanOrEqual(a.elevationFt! + v.above.add)
        }
      }
    }
  })

  it('Departure: freigegebene Höhe liegt immer über der verlassenen, Creech nie „leaving two thousand“', () => {
    for (const a of index.airfields) {
      for (const id of ['m3-departure-checkin', 'm3-s2-taxi-departure']) {
        const vars = (index.exchanges.get(id) ?? index.scenarios.get(id))!.vars!
        for (let i = 0; i < 10; i++) {
          const r = resolveVars(vars, env(`dep${a.id}${id}${i}`, only(a)))
          expect(numOf(r.altB)!, `${id} an ${a.id}`).toBeGreaterThan(numOf(r.altA)!)
        }
      }
    }
    const creech = index.airfields.find((a) => a.id === 'creech')!
    const r = resolveVars(index.exchanges.get('m1-approach-numbers')!.vars!, env('creech', only(creech)))
    expect(numOf(r.alt)).toBeGreaterThanOrEqual(6000)
  })
})

describe('Funksprüche nutzen die richtige Platzfrequenz (E3-10, P2-03)', () => {
  it('Ground-Funksprüche zeigen die Ground-Frequenz, nicht die Tower-Frequenz', () => {
    const falsch: string[] = []
    for (const x of index.exchanges.values()) {
      if (!x.freq) continue
      const ground = x.transmissions.some(
        (t) => /\.name\} Ground$/.test(t.speaker) || t.segments.some((s) => s.role === 'addressee' && /\.name\} Ground$/.test(s.text)),
      )
      const tower = x.transmissions.some((t) => /\.name\} Tower$/.test(t.speaker))
      if (ground && !tower && /\.(uhf|vhf|twr)\}/.test(x.freq)) falsch.push(`${x.id}: ${x.freq}`)
    }
    expect(falsch).toEqual([])
  })

  it('an Plätzen ohne UHF steht keine leere Frequenz und kein falsches Band', () => {
    const leer: string[] = []
    for (const id of ['khasab', 'al-dhafra']) {
      const a = index.airfields.find((x) => x.id === id)!
      for (const x of index.exchanges.values()) {
        if (!x.freq || !x.vars || !Object.values(x.vars).some((s) => 'pool' in s && s.pool === 'airfields')) continue
        const vars = resolveVars(x.vars, env(`leer${x.id}`, only(a)))
        const freq = fillTemplate(x.freq, vars)
        if (/—|not available/.test(freq) || findPlaceholders(freq).length) leer.push(`${x.id} an ${id}: ${freq}`)
        // Band passt zur Zahl: keine VHF-Frequenz mit dem Etikett „UHF“
        for (const m of freq.matchAll(/(\d+(?:\.\d+)?) (UHF|VHF)\b/g)) {
          if (bandOf(Number(m[1])) !== m[2]) leer.push(`${x.id} an ${id}: ${freq} (falsches Band)`)
        }
      }
      for (const sc of index.scenarios.values()) {
        const r = resolveScenario(sc, env(`leer${sc.id}`, only(a)))
        for (const st of r.steps) {
          const f = [st.freq ?? '', st.tune?.freq ?? ''].join(' ')
          if (/—|not available/.test(f)) leer.push(`${sc.id} an ${id}: ${f}`)
        }
      }
    }
    expect(leer).toEqual([])
  })
})

describe('Flugzeug aus dem Profil (P2-08, P1-17)', () => {
  it('kommt meist dran, wenn es zum Filter passt – sonst wie bisher', () => {
    const spec: Record<string, VarSpec> = { ac: { pool: 'aircraft', where: { role: 'multirole', era: 'modern' } } }
    let f16 = 0
    for (let i = 0; i < 200; i++) {
      const v = resolveVars(spec, env(`ac${i}`, index, { aircraft: ['f16'] }))
      if (v.ac.fields!.id.text === 'f16') f16++
    }
    expect(f16).toBeGreaterThan(150)
    // A-10 passt nicht zu „multirole“: dann bleibt der Pool unverändert
    const ids = new Set<string>()
    for (let i = 0; i < 60; i++) ids.add(resolveVars(spec, env(`ac10${i}`, index, { aircraft: ['a10'] })).ac.fields!.id.text)
    expect(ids.has('a10')).toBe(false)
    expect(ids.size).toBeGreaterThan(1)
  })
})
