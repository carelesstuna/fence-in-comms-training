/**
 * Tests für schematische Karten (KA1) und die erweiterten Flugplatzdaten (KA2).
 */
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { createRng } from './random/rng'
import { resolveVars } from './random/vars'
import { buildChart, parseIls, type ChartData } from './charts/chart'
import { resolveDrill } from './drills/resolve'
import { resolveChartBlock } from './charts/block'
import { formatFrequency } from './phraseology/spoken'

const index = contentResult.index!
const env = (seed: string) => ({ rng: createRng(seed), content: index, self: { name: 'Pontiac', flight: 5, position: 1 } })
const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('Karten', () => {
  it('liest ILS-Angaben', () => {
    expect(parseIls('ILS 13: 110.30')).toEqual({ runway: '13', mhz: 110.3 })
    expect(parseIls('ILS 06R: 110.1 (06L ohne Gleitpfad)')).toEqual({ runway: '06R', mhz: 110.1 })
    expect(parseIls('ILS 109.75 (IKS)')).toEqual({ mhz: 109.75 })
    expect(parseIls(undefined)).toEqual({})
  })

  it('baut für jeden Flugplatz stimmige Platz- und Anflugkarten', () => {
    for (const a of index.airfields) {
      for (let i = 0; i < 10; i++) {
        const rng = createRng(`${a.id}${i}`)
        const airport = buildChart('airport', a, { rng })
        // Plätze, die in der Sim nur auf VHF erreichbar sind (Khasab, Al Dhafra), zeigen die VHF-Frequenz
        expect(airport.freqs.find((f) => f.id === 'tower')?.mhz).toBe(a.atc.uhf ?? a.atc.vhf)
        const ap = buildChart('approach', a, { rng }).approach!
        const e = a.elevationFt ?? 0
        expect(ap.fafAlt).toBeGreaterThan(e)
        expect(ap.minimumFt).toBeGreaterThan(e)
        expect(ap.minimumFt).toBeLessThan(ap.fafAlt)
        expect(ap.iafAlt).toBeGreaterThanOrEqual(ap.fafAlt)
        expect(ap.msa).toBeGreaterThanOrEqual(e + 2000)
        expect(a.runways.join('/')).toContain(ap.runway)
        // ILS-Bahn aus den Daten wird bevorzugt
        const ils = parseIls(a.ils)
        if (ils.runway) expect(ap.runway).toBe(ils.runway)
      }
    }
  })

  it('übernimmt die aktive Bahn aus dem Wetter und den Comm Plan', () => {
    for (let i = 0; i < 30; i++) {
      const v = resolveVars(
        {
          af: { pool: 'airfields' },
          wx: { weather: true, airfield: 'af', wind: 'any', sky: 'any' },
          cp: { commplan: true, airfield: 'af' },
          apd: { chart: 'airport', airfield: 'af', commplan: 'cp', weather: 'wx', freqs: 'sim' },
        },
        env(`c${i}`),
      )
      const chart = v.apd.data as ChartData
      expect(chart.activeEnd).toBe(v.wx.fields!.runway.text)
      expect(v.apd.fields!.ground.text).toBe(v.cp.fields!.ground.fields!.freq.text)
      expect(v.apd.fields!.atis.text).toBe(v.cp.fields!.atis.fields!.freq.text)
    }
  })

  it('stellt Kartenwerte als Platzhalter bereit', () => {
    const v = resolveVars(
      { af: { pool: 'airfields' }, apc: { chart: 'approach', airfield: 'af', freqs: 'sim' } },
      env('ph'),
    )
    const f = v.apc.fields!
    expect(f.faf.fields!.alt.text).toMatch(/^\d{1,2},?\d{3}$/)
    expect(f.da.num).toBeGreaterThan(0)
    expect(f.navaid.text).toMatch(/^(ILS|TACAN|RNAV)/)
    expect(f.tower.text).toMatch(/^\d{3}\.\d+$/)
  })

  it('echte Frequenzen (KA2) und Pool-Filter require', () => {
    for (let i = 0; i < 20; i++) {
      const v = resolveVars(
        { af: { pool: 'airfields', require: ['realFreqs'] }, apc: { chart: 'approach', airfield: 'af', freqs: 'real' } },
        env(`r${i}`),
      )
      // require filtert auf Plätze mit echten Frequenzen – egal, wie viele es inzwischen gibt
      const a = index.airfields.find((x) => x.name === v.af.text)!
      expect(a.realFreqs).toBeDefined()
      const tower = a.realFreqs!.tower
      if (tower !== undefined) {
        expect(v.af.fields!.real.fields!.tower.text).toBe(formatFrequency(tower))
        expect(v.apc.fields!.tower.text).toBe(formatFrequency(tower))
      }
      expect((v.apc.data as ChartData).freqSource).toBe('real')
    }
  })

  it('Pool-Filter sameMap: Zielplatz auf derselben Karte', () => {
    for (let i = 0; i < 40; i++) {
      const v = resolveVars(
        { af: { pool: 'airfields' }, dest: { pool: 'airfields', sameMap: 'af', distinctFrom: ['af'] } },
        env(`sm${i}`),
      )
      const a = index.airfields.find((x) => x.name === v.af.text)!
      const d = index.airfields.find((x) => x.name === v.dest.text)!
      expect(d.map).toBe(a.map)
      // Mehrere Plätze auf der Karte → ein anderer; nur einer → derselbe
      const onMap = index.airfields.filter((x) => x.map === a.map).length
      if (onMap > 1) expect(d.name).not.toBe(a.name)
    }
    const files = { ...raw }
    files['content/drills/zz-same.yaml'] = stringify([
      { id: 'zz-s1', type: 'choice', prompt: 'x', options: ['a', 'b'], answer: 0, vars: { dest: { pool: 'airfields', sameMap: 'af' } } },
    ])
    const msgs = buildContentIndex(files).errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('sameMap "af" braucht pool: airfields')
  })

  it('chart-tap löst rwy:active zur konkreten Bahn auf', () => {
    const d = resolveDrill(index.drills.get('beispiel-karte-startbahn')!, env('tap'))
    if (d.kind !== 'chart-tap') throw new Error('falscher Typ')
    expect(d.targets).toEqual([`rwy:${d.chart.activeEnd}`])
  })

  it('::chart-Baustein löst festen und gewürfelten Platz auf', () => {
    const fixed = resolveChartBlock('approach', 'batumi', 'sim', env('blk'))
    expect(fixed.name).toBe('Batumi')
    expect(fixed.approach?.runway).toBe('13')
    const real = resolveChartBlock('airport', 'kutaisi', 'real', env('blk2'))
    expect(real.freqs.find((f) => f.id === 'tower')?.mhz).toBe(125.5)
    expect(resolveChartBlock('airport', undefined, 'sim', env('blk3')).name).toBeTruthy()
  })

  it('Validator prüft Karten-Variablen, Ziele und ::chart', () => {
    const files = { ...raw }
    files['content/drills/zz-test.yaml'] = stringify([
      { id: 'zz-c1', type: 'chart-tap', prompt: 'x', vars: { af: { pool: 'airfields' }, apd: { chart: 'airport', airfield: 'af' } }, chart: 'apd', target: 'faf' },
      { id: 'zz-c2', type: 'chart-tap', prompt: 'x', vars: { apd: { chart: 'airport', airfield: 'nope' } }, chart: 'apd', target: 'tower' },
      { id: 'zz-c3', type: 'chart-tap', prompt: 'x', vars: { af: { pool: 'airfields' } }, chart: 'af', target: 'tower' },
      { id: 'zz-c4', type: 'chart-tap', prompt: 'x', vars: { af: { pool: 'airfields' }, apc: { chart: 'approach', airfield: 'af' } }, chart: 'apc', target: 'banana' },
    ])
    files['content/hangar/zz.md'] = '---\nid: zz\ntitle: T\ncategory: technik\nteaser: T\n---\n\n::chart{kind=plan}\n\n::chart{kind=airport airfield=atlantis}\n'
    const msgs = buildContentIndex(files).errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('"faf" gibt es nur auf der Anflugkarte')
    expect(msgs).toContain('chart braucht airfield')
    expect(msgs).toContain('"af" ist keine Karten-Variable')
    expect(msgs).toContain('unbekanntes Kartenelement "banana"')
    expect(msgs).toContain('kind muss airport oder approach sein')
    expect(msgs).toContain('Flugplatz "atlantis" existiert nicht')
  })
})
