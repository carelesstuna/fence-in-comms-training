/**
 * Tests für die Kern-Engine: Lagegeometrie, derive, Bewertung getippter Funksprüche.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { resolveVars } from './random/vars'
import { aspectAngle, aspectOf, bearingDeg, buildPicture, distNm, groupCount, inAspectGap, pictureValue } from './random/geo'
import { PICTURE_LABELS, type PictureLabel } from './content/schema'
import { spokenContactAltitude, spokenWholeNumber } from './phraseology/spoken'
import { scoreCall, toItems, type ScoreSegment } from './scoring/score'
import { resolveDrill, resolveExchange, resolveScenario } from './drills/resolve'
import { findPlaceholders } from './random/template'
import { buildContentIndex } from './content/index'

const rawFiles = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const index = contentResult.index!
const env = (seed: string) => ({ rng: createRng(seed), content: index, self: { name: 'Uzi', flight: 2, position: 1 } })

describe('Lagegeometrie', () => {
  it('Peilungen und Entfernungen', () => {
    const o = { x: 0, y: 0 }
    expect(bearingDeg(o, { x: 0, y: 10 })).toBe(360)
    expect(bearingDeg(o, { x: 10, y: 0 })).toBe(90)
    expect(bearingDeg(o, { x: 0, y: -10 })).toBe(180)
    expect(bearingDeg(o, { x: -10, y: 0 })).toBe(270)
    expect(distNm(o, { x: 3, y: 4 })).toBe(5)
  })

  it('Aspekt: hot, flank, beam, drag – mit Haupt- oder Nebenhimmelsrichtung, hot ohne', () => {
    const own = { x: 0, y: 0 }
    const g = (heading: number) => ({ name: 'g', x: 0, y: 30, heading, altFt: 20000, size: 2, id: 'hostile' as const })
    expect(aspectOf(g(180), own)).toBe('hot')
    expect(aspectOf(g(200), own)).toBe('hot')
    expect(aspectOf(g(225), own)).toBe('flank southwest')
    expect(aspectOf(g(270), own)).toBe('beam west')
    expect(aspectOf(g(90), own)).toBe('beam east')
    expect(aspectOf(g(360), own)).toBe('drag north')
    expect(aspectOf(g(310), own)).toBe('drag northwest')
    // Grenzen laut ATP 1-02.1 (2020/21): 0–20 / 30–60 / 70–110 / 120–180, dazwischen Lücken
    expect(inAspectGap(20)).toBe(false)
    expect(inAspectGap(25)).toBe(true)
    expect(inAspectGap(30)).toBe(false)
    expect(inAspectGap(65)).toBe(true)
    expect(inAspectGap(115)).toBe(true)
    expect(inAspectGap(120)).toBe(false)
  })

  it('baut für jedes Label eine stimmige Lage', () => {
    for (const label of PICTURE_LABELS) {
      for (let i = 0; i < 30; i++) {
        const p = buildPicture(createRng(`${label}${i}`), { label })
        expect(p.groups).toHaveLength(groupCount(label))
        for (const g of [...p.groups, p.own]) expect(distNm({ x: 0, y: 0 }, g)).toBeLessThanOrEqual(80)
        // Kein Aspektwinkel in einer Lücke zwischen zwei Klassen
        for (const g of p.groups) expect(inAspectGap(aspectAngle(g, p.own))).toBe(false)
        const dists = p.groups.map((g) => distNm(p.own, g))
        expect(dists[p.nearest]).toBe(Math.min(...dists))
        if (label === 'range' || label === 'ladder') {
          // Lead ist näher am Jäger als Trail, Abstand = deep
          expect(dists[0]).toBeLessThan(dists[dists.length - 1])
          expect(distNm(p.groups[0], p.groups[p.groups.length - 1])).toBeCloseTo(p.deepNm, 0)
        }
        if (label === 'azimuth') {
          // Beide Gruppen etwa gleich weit weg, aber seitlich mehr als 10 NM getrennt (beide verankert)
          expect(Math.abs(dists[0] - dists[1])).toBeLessThan(2)
          expect(distNm(p.groups[0], p.groups[1])).toBeCloseTo(p.sepNm, 0)
          expect(p.sepNm).toBeGreaterThan(10)
        }
        if (label === 'wall') expect(p.deepNm).toBeLessThanOrEqual(5)
        if (label === 'vic' || label === 'champagne') expect(p.deepNm).toBeGreaterThan(5)
        if (label === 'champagne') expect(distNm(p.groups[0], p.groups[1])).toBeCloseTo(p.wideNm, 0)
        if (label === 'vic') expect(distNm(p.groups[1], p.groups[2])).toBeCloseTo(p.wideNm, 0)
      }
    }
  })

  it('Picture: Maße als wide/deep in der Reihenfolge des Labels, Trail-Gruppen ohne Bullseye', () => {
    const label = (l: PictureLabel) => pictureValue(buildPicture(createRng(`m-${l}`), { label: l }))
    expect(label('azimuth').fields!.label.text).toMatch(/^two groups azimuth \d+$/)
    expect(label('range').fields!.label.text).toMatch(/^two groups range \d+$/)
    expect(label('wall').fields!.label.text).toMatch(/^three groups wall \d+ wide$/)
    expect(label('ladder').fields!.label.text).toMatch(/^three groups ladder \d+ deep$/)
    expect(label('vic').fields!.label.text).toMatch(/^three groups vic \d+ deep, \d+ wide$/)
    expect(label('champagne').fields!.label.text).toMatch(/^three groups champagne \d+ wide, \d+ deep$/)
    expect(label('vic').fields!.label.spoken).toMatch(/^three groups vic [a-z-]+ deep, [a-z-]+ wide$/)

    const range = label('range').fields!
    // Track je Gruppe nur, wenn die Gruppen verschiedene Richtungen haben (ATP 3-52.4 IV-13.d, Tests in random/geo.test.ts)
    expect(range.g1.text).toMatch(/^lead group bullseye \d{3}\/\d+, \d+ thousand, (track [a-z]+, )?hostile/)
    expect(range.g2.text).toMatch(/^trail group \d+ thousand, (track [a-z]+, )?hostile/)
    expect(range.g2.fields!.bulls.text).toMatch(/^\d{3}\/\d+$/) // Felder bleiben verfügbar
    const champagne = label('champagne').fields!
    expect(champagne.g1.text).toContain('bullseye')
    expect(champagne.g2.text).toContain('bullseye')
    expect(champagne.g3.text).not.toContain('bullseye')
    const vic = label('vic').fields!
    expect(vic.g2.text).not.toContain('bullseye')
    expect(vic.g3.text).not.toContain('bullseye')
    for (const g of ['g1', 'g2', 'g3']) expect(label('wall').fields![g].text).toContain('bullseye')
    expect(label('ladder').fields!.g2.text).not.toContain('bullseye')
  })

  it('Picture als Core Information: Gesamtzahl, jede Gruppe „group bullseye …“', () => {
    const v = resolveVars({ pic: { geo: true, groups: 2, id: 'hostile', labelled: false } }, env('core'))
    const p = v.pic.fields!
    expect(p.label.text).toBe('two groups')
    expect(p.labelKind.text).toBe('core')
    expect(p.g1.text).toMatch(/^group bullseye \d{3}\/\d+, \d+ thousand, track [a-z]+, hostile/)
    expect(p.g2.text).toMatch(/^group bullseye /)
    expect(v.pic.text.startsWith('two groups, group bullseye')).toBe(true)
  })

  it('Kontakthöhen als ganze Zahlwörter, angels als Feld', () => {
    for (let i = 0; i < 20; i++) {
      const pic = buildPicture(createRng(`alt${i}`), { groups: 1 })
      const g = pictureValue(pic).fields!.g1.fields!
      const k = Math.round(pic.groups[0].altFt / 1000)
      expect(g.alt.text).toBe(`${k} thousand`)
      expect(g.alt.spoken).toBe(`${spokenWholeNumber(k)} thousand`)
      expect(g.angels.text).toBe(String(k))
    }
    expect(spokenContactAltitude(25000)).toBe('twenty-five thousand')
    expect(spokenContactAltitude(10000)).toBe('ten thousand')
    expect(spokenContactAltitude(39000)).toBe('thirty-nine thousand')
  })

  it('liefert Platzhalter-Felder mit konsistenten Werten', () => {
    const v = resolveVars({ pic: { geo: true, groups: 2, id: 'hostile' } }, env('pic'))
    const p = v.pic.fields!
    expect(p.label.text).toMatch(/^two groups (azimuth|range) \d+$/)
    const g1 = p.g1.fields!
    expect(g1.bulls.text).toMatch(/^\d{3}\/\d+$/)
    expect(g1.braa.text).toMatch(/^\d{3}\/\d+$/)
    expect(p.call.text).toContain(g1.bulls.text)
    expect(p.near.text).toBeTruthy()
    expect(v.pic.data).toBeDefined()
  })
})

describe('derive', () => {
  it('Gegenkurs, Gegenbahn, Zeit, Treibstoff', () => {
    const v = resolveVars(
      {
        hdg: { number: 'heading', range: [90, 90] },
        back: { derive: 'reciprocal', from: 'hdg' },
        rwy: { number: 'runway', range: [13, 13] },
        rwy2: { derive: 'reciprocal', from: 'rwy' },
        t: { number: 'time', range: [1430, 1430], step: 1 },
        later: { derive: 'offset', from: 't', add: 45 },
        joker: { number: 'fuel', range: [5.0, 5.0] },
        bingo: { derive: 'offset', from: 'joker', add: -1.5 },
        low: { derive: 'min', of: ['joker', 'bingo'] },
      },
      env('der'),
    )
    expect(v.back.text).toBe('270')
    expect(v.rwy2.text).toBe('31')
    expect(v.later.text).toBe('0035')
    expect(v.bingo.text).toBe('3.5')
    expect(v.bingo.spoken).toBe('three point five')
    expect(v.low.text).toBe('3.5')
  })

  it('Kurs bricht bei 360 um', () => {
    const v = resolveVars({ h: { number: 'heading', range: [350, 350] }, h2: { derive: 'offset', from: 'h', add: 30 } }, env('wrap'))
    expect(v.h2.text).toBe('020')
  })
})

const seg = (text: string, role = 'info', extra: Partial<ScoreSegment> = {}): ScoreSegment => ({ text, role, ...extra })

describe('Bewertung getippter Funksprüche', () => {
  const radioCheck = [
    seg('Batumi Tower', 'addressee'),
    seg('Viper one one', 'callsign', { critical: true }),
    seg('radio check', 'request'),
    seg('two six zero point zero', 'value', { optional: true }),
  ]

  it('akzeptiert Ziffern, Wörter und Tippfehler', () => {
    expect(scoreCall('Batumi Tower, Viper 1-1, radio check, 260.0', radioCheck).correct).toBe(true)
    expect(scoreCall('batumi tower viper eleven radio check', radioCheck).correct).toBe(true)
    expect(scoreCall('Batumy Tower, Viper 11, radio chek', radioCheck).correct).toBe(true)
  })

  it('meldet fehlende Pflichtteile und falsche Reihenfolge', () => {
    const missing = scoreCall('Batumi Tower, radio check', radioCheck)
    expect(missing.correct).toBe(false)
    expect(missing.issues.join(' ')).toContain('Pflichtteil fehlt')
    const order = scoreCall('Viper 1-1, Batumi Tower, radio check', radioCheck)
    expect(order.correct).toBe(false)
    expect(order.slots.find((s) => s.status === 'misplaced')).toBeDefined()
  })

  it('erkennt falsche Zahlen und Füllwörter', () => {
    const r = scoreCall('Batumi Tower, Viper 1-2, radio check, please', radioCheck)
    expect(r.correct).toBe(false)
    expect(r.slots[1].status).toBe('wrong')
    expect(r.fillers).toContain('please')
  })

  it('Zahlentoleranz bei BRAA', () => {
    const braa = [seg('BRAA', 'brevity'), seg('two seven zero', 'value', { tolerance: 3 }), seg('twenty five', 'value', { tolerance: 2 })]
    expect(scoreCall('BRAA 272, 26', braa).correct).toBe(true)
    expect(scoreCall('BRAA two seven zero, two five', braa).correct).toBe(true)
    expect(scoreCall('BRAA 280, 25', braa).correct).toBe(false)
    // 359 vs 001 liegen nah beieinander
    expect(scoreCall('BRAA 001, 25', [seg('BRAA'), seg('three five niner', 'value', { tolerance: 3 }), seg('25', 'value')]).correct).toBe(true)
  })

  it('Kontakthöhe: ganzes Zahlwort, ziffernweise und als Zahl sind gleich', () => {
    const declare = [seg('declare', 'brevity'), seg('bullseye zero four five, sixty', 'position', { tolerance: 3 }), seg('twenty-five thousand', 'value', { tolerance: 2 })]
    expect(scoreCall('declare bullseye 045/60, twenty-five thousand', declare).correct).toBe(true)
    expect(scoreCall('declare bullseye 045/60, two five thousand', declare).correct).toBe(true)
    expect(scoreCall('declare bullseye 045/60, 25 thousand', declare).correct).toBe(true)
    expect(scoreCall('declare bullseye 045/60, 25,000', declare).correct).toBe(true)
    expect(scoreCall('declare bullseye 045/60, thirty-five thousand', declare).correct).toBe(false)
    // Zehner und Zehn bis Neunzehn vor „thousand“
    for (const [spoken, typed] of [
      ['fifteen thousand', 'one five thousand'],
      ['twenty thousand', 'two zero thousand'],
      ['ten thousand', '10,000'],
      ['thirty thousand', '30 thousand'],
    ]) {
      const segs = [seg('declare', 'brevity'), seg(spoken, 'value')]
      expect(scoreCall(`declare ${typed}`, segs).correct, `${typed} = ${spoken}`).toBe(true)
      expect(scoreCall(`declare ${spoken}`, [seg('declare', 'brevity'), seg(typed, 'value')]).correct, `${spoken} = ${typed}`).toBe(true)
    }
    expect(scoreCall('declare fifteen thousand', [seg('declare', 'brevity'), seg('one six thousand', 'value')]).correct).toBe(false)
  })

  it('blind mit Hunderterstelle oder angels', () => {
    const blind = [seg('Colt one two', 'callsign'), seg('blind', 'brevity'), seg('one six point niner', 'value', { alt: ['angels one seven'] })]
    expect(scoreCall('Colt 1-2, blind, 16.9', blind).correct).toBe(true)
    expect(scoreCall('Colt one two blind one six point nine', blind).correct).toBe(true)
    expect(scoreCall('Colt 1-2, blind, angels 17', blind).correct).toBe(true)
    expect(scoreCall('Colt 1-2, blind, 18.9', blind).correct).toBe(false)
  })

  it('Alternativen und freie Segmente', () => {
    const reply = [seg('Viper one one', 'addressee'), seg('loud and clear', 'info', { alt: ['five by five'] })]
    expect(scoreCall('Viper 1-1, five by five', reply).correct).toBe(true)
    const free = [seg('Darkstar', 'addressee'), seg('Viper one one', 'callsign'), seg('as fragged', 'info', { free: true }), seg('angels two five', 'value')]
    expect(scoreCall('Darkstar, Viper 1-1, angels 25, as fragged', free).correct).toBe(true)
  })

  it('Kommas trennen Zahlengruppen', () => {
    expect(toItems('Viper 1-1, 260.0').filter((i) => i.kind === 'num').map((i) => (i.kind === 'num' ? i.n : 0))).toEqual([11, 260])
  })
})

describe('Perspektive, call, plot und Szenarien', () => {
  const run = (seed: string, size = 4) => ({ rng: createRng(seed), content: index, self: { name: 'Colt', flight: 3, position: 1, size } })

  it('Perspektive macht die gewählte Station zu „du“ und passt die Position an', () => {
    for (let i = 0; i < 40; i++) {
      const d = resolveDrill(index.drills.get('beispiel-checkin-tippen')!, run(`p${i}`, i % 2 ? 2 : 4))
      if (d.kind !== 'call') throw new Error('falscher Typ')
      const you = d.exchange.transmissions[d.transmission!]
      expect(you.you).toBe(true)
      expect(you.skip).toBe(false)
      expect(['two', 'three', 'four']).toContain(you.station)
      // Lead fragt vorher
      expect(d.heard).toBeGreaterThanOrEqual(1)
      expect(d.exchange.transmissions[0].station).toBe('lead')
    }
  })

  it('2-ship lässt Three und Four weg', () => {
    const x = index.exchanges.get('beispiel-flight-checkin')!
    const r = resolveExchange(x, run('two', 2), { as: 'two' })
    expect(r.transmissions.filter((t) => !t.skip).map((t) => t.station)).toEqual(['lead', 'two'])
  })

  it('Schweige-Übung hat keine eigene Übertragung', () => {
    const d = resolveDrill(index.drills.get('beispiel-push-schweigen')!, run('push'))
    if (d.kind !== 'call') throw new Error('falscher Typ')
    expect(d.expect).toBe('silence')
    expect(d.transmission).toBeNull()
  })

  it('Lagebild-Übungen liefern eine Lage mit der gefragten Gruppe', () => {
    for (const id of ['beispiel-lagebild-setzen', 'beispiel-lagebild-bullseye', 'beispiel-lagebild-braa']) {
      const d = resolveDrill(index.drills.get(id)!, run(id))
      if (d.kind !== 'plot') throw new Error('falscher Typ')
      expect(d.picture.groups[d.group]).toBeDefined()
    }
  })

  it('alle Szenarien lösen sich vollständig auf – Runway der Skizze passt zum Wind', () => {
    for (const sc of index.scenarios.values()) {
      for (let i = 0; i < 25; i++) {
        const r = resolveScenario(sc, run(`${sc.id}${i}`))
        const texts = [r.title, r.summary]
        for (const st of r.steps) {
          texts.push(st.stage, st.situation ?? '', st.task ?? '', st.place ?? '', st.freq ?? '', st.explain ?? '', ...st.hear.flatMap((t) => t.segments.map((s) => s.text)))
          if (st.you) texts.push(...st.you.transmission.segments.map((s) => s.text), ...st.you.options, ...st.you.tiles.map((t) => t.text))
        }
        for (const t of texts) expect(findPlaceholders(t), `${sc.id}: ${t}`).toEqual([])
        if (r.sketch) {
          expect(r.sketch.airfield.runways.join('/')).toContain(r.sketch.runway!)
        }
        for (const st of r.steps) if (st.you?.mode === 'choice') expect(st.you.options[st.you.correct]).toBeDefined()
      }
    }
  })

  it('Szenario-Schritt: richtiger Funkspruch wird als korrekt bewertet', () => {
    const sc = resolveScenario(index.scenarios.get('beispiel-abflug')!, run('ok'))
    const taxi = sc.steps.find((s) => s.you?.mode === 'type')!
    const text = taxi.you!.transmission.segments.map((s) => s.text).join(', ')
    expect(scoreCall(text, taxi.you!.transmission.segments).correct).toBe(true)
  })

  it('::scenario in Lektionen wird erkannt und geprüft', () => {
    const files = { ...rawFiles }
    files['content/lessons/zz/zz.md'] = '---\nid: zz-l1\nmodule: m1\norder: 9\ntitle: T\nsummary: S\nminutes: 1\nxp: 1\n---\n\n::scenario{id=beispiel-abflug}\n\n---\n\n::scenario{id=gibt-es-nicht}\n'
    const r = buildContentIndex(files)
    const msgs = r.errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('Szenario "gibt-es-nicht" existiert nicht')
    expect(r.index!.lessons.get('zz-l1')!.steps[0]).toEqual({ kind: 'scenario', scenarioId: 'beispiel-abflug' })
  })
})
