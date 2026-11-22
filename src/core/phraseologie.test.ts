/**
 * Phraseologie je Karte (Persona-Review E3-12): An Plätzen mit US-Form (Nevada, Guam, Korea) spricht der Lotse
 * „altimeter“ in inHg, „descend/climb and maintain“ und die Sicht in Meilen, an ICAO-Plätzen (Georgien, Golf) „QNH“ in
 * hPa, „descend/climb to“ und die Sicht in Kilometern. Readbacks: Die gesprochene Form gilt voll, die andere als `weak`.
 *
 * Das gilt mit der Profil-Einstellung „Kartenabhängig“ (`phraseology: 'map'`). Standard ist „Immer US“ (`us`): Dann
 * spricht jeder Platz die US-Form, und Texte über den Platz sagen, dass das an der Einstellung liegt.
 */
import { describe, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'
import { contentResult } from '../content'
import type { ContentIndex } from './content/index'
import { buildContentIndex } from './content/index'
import type { Airfield, Phraseology, VarSpec } from './content/schema'
import { resolveDrill, resolveExchange, resolveScenario, whenHolds } from './drills/resolve'
import { fillTemplate } from './random/template'
import type { ResolvedSegment, ResolvedTransmission } from './drills/types'
import { createRng } from './random/rng'
import { numOf, resolveVars, type ResolveEnv } from './random/vars'
import { phraseologyOf, pressureValue, type PhraseologySetting } from './random/phraseology'
import { scoreCall } from './scoring/score'
import { normalizeTokens } from './phraseology/normalize'
import { makeRun } from '../ui/run'
import { DEFAULT_PROFILE } from '../state/store'

const index = contentResult.index!
const self = { name: 'Colt', flight: 4, position: 1 }
const only = (a: Airfield): ContentIndex => ({ ...index, airfields: [a] })
/** Umgebung mit nur diesem Platz; Standard hier „Kartenabhängig“, weil die meisten Tests der Karte folgen. */
const env = (seed: string, a: Airfield, phraseology: PhraseologySetting = 'map'): ResolveEnv => ({
  rng: createRng(seed),
  content: only(a),
  self,
  phraseology,
})
const SEEDS = ['a', 'b', 'c', 'd', 'e', 'f']
const form = (a: Airfield): Phraseology => phraseologyOf(a, index)
/** Name der Form in Erklärtexten und Hinweisen. */
const FORM_NAME: Record<Phraseology, string> = { faa: 'US-Form (FAA)', icao: 'ICAO-Form' }
const byId = (id: string) => index.airfields.find((a) => a.id === id)!

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Inhalt mit geänderten Dateien neu bauen (Pfade wie im Glob: /content/…). */
function buildWith(change: Record<string, (data: unknown) => unknown>) {
  const files = { ...raw }
  for (const [path, fn] of Object.entries(change)) files[path] = stringify(fn(parse(files[path])))
  return buildContentIndex(files).errors.map((e) => e.message)
}

/** Funksprüche, deren Readback Luftdruck oder Steig-/Sinkfreigabe enthält. */
const READBACKS = [
  'm1-approach-numbers',
  'm3-atis-update',
  'm3-ifr-clearance',
  'm3-departure-checkin',
]

const mine = (ts: ResolvedTransmission[]) => ts.filter((t) => t.you && !t.skip)
const say = (segs: ResolvedSegment[], swap?: { index: number; text: string }) =>
  segs.map((s, i) => (swap?.index === i ? swap.text : s.text)).join(', ')

describe('Karten haben eine Phraseologie', () => {
  it('Nevada, Guam und Korea sprechen die US-Form, Georgien und der Golf ICAO', () => {
    const p = (id: string) => index.maps.get(id)!.phraseology
    for (const id of ['nttr', 'marianas', 'kto']) expect(p(id), id).toBe('faa')
    for (const id of ['caucasus', 'persian-gulf']) expect(p(id), id).toBe('icao')
    for (const m of index.maps.values()) expect(['faa', 'icao'], m.id).toContain(m.phraseology)
  })

  it('jeder Platz im Pool kennt seine Phraseologie ({af.phraseology}, {af.faa}, {af.icao})', () => {
    for (const a of index.airfields) {
      const f = resolveVars({ af: { pool: 'airfields' } }, env(`pf-${a.id}`, a)).af.fields!
      const p = form(a)
      expect(f.phraseology.text, a.id).toBe(p.toUpperCase())
      expect(f.phraseology.fields!.form.text).toBe(FORM_NAME[p])
      // Kartenabhängig: Sätze über den Platz nennen einfach die Form, die Karte stimmt mit ihr überein
      expect(f.phraseology.fields!.here.text).toBe(FORM_NAME[p])
      expect(f.phraseology.fields!.map.text).toBe(p.toUpperCase())
      expect(f.phraseology.fields!.map.fields!.form.text).toBe(FORM_NAME[p])
      expect(f.faa.text).toBe(p === 'faa' ? 'yes' : '')
      expect(f.icao.text).toBe(p === 'icao' ? 'yes' : '')
      // für Segmente, die es nur in einer Form gibt: when: af.icao / when: af.faa
      const fill = (t: string) =>
        fillTemplate(t, { af: { text: a.name, spoken: a.name, fields: f } })
      expect(whenHolds('af.icao', fill), a.id).toBe(p === 'icao')
      expect(whenHolds('af.faa', fill), a.id).toBe(p === 'faa')
      expect(whenHolds('!af.icao', fill), a.id).toBe(p === 'faa')
    }
  })

  it('der Validator verlangt phraseology an jeder Karte', () => {
    const errors = buildWith({
      '/content/pools/maps.yaml': (maps) =>
        (maps as Record<string, unknown>[]).map((m) =>
          m.id === 'kola' ? { ...m, phraseology: undefined } : m,
        ),
    })
    expect(errors.join('\n')).toMatch(/phraseology fehlt oder ist ungültig/)
    const wrong = buildWith({
      '/content/pools/maps.yaml': (maps) =>
        (maps as Record<string, unknown>[]).map((m) =>
          m.id === 'kola' ? { ...m, phraseology: 'nato' } : m,
        ),
    })
    expect(wrong.join('\n')).toMatch(/phraseology fehlt oder ist ungültig/)
  })

  it('der Validator verlangt einen Platz für number: pressure', () => {
    const errors = buildWith({
      '/content/calls/m1.yaml': (calls) =>
        (calls as { id: string; vars?: Record<string, unknown> }[]).map((x) =>
          x.id === 'm1-approach-numbers'
            ? { ...x, vars: { ...x.vars, altim: { number: 'pressure' } } }
            : x,
        ),
    })
    expect(errors.join('\n')).toMatch(/number: pressure "altim" braucht airfield/)
  })
})

describe('Würfel: Luftdruck, Verben und Sicht nach dem Platz', () => {
  it('pressureValue: inHg in US-Form, hPa nach ICAO', () => {
    expect(pressureValue(29.92)).toMatchObject({
      text: '29.92',
      spoken: 'two niner niner two',
      num: 29.92,
    })
    expect(pressureValue(29.92).fields!.word.text).toBe('altimeter')
    expect(pressureValue(29.92).fields!.unit.text).toBe('inHg')
    expect(pressureValue(1013)).toMatchObject({
      text: '1013',
      spoken: 'one zero one three',
      num: 1013,
    })
    expect(pressureValue(1013).fields!.word.text).toBe('QNH')
    expect(pressureValue(998).spoken).toBe('niner niner eight')
    expect(pressureValue(998).fields!.other.text).toBe('altimeter')
  })

  it('number: pressure würfelt 29.70–30.30 an FAA-Plätzen und 995–1030 an ICAO-Plätzen', () => {
    for (const a of index.airfields) {
      for (let i = 0; i < 25; i++) {
        const v = resolveVars(
          { af: { pool: 'airfields' }, p: { number: 'pressure', airfield: 'af' } },
          env(`p-${a.id}-${i}`, a),
        ).p
        if (form(a) === 'faa') {
          expect(v.fields!.word.text, a.id).toBe('altimeter')
          expect(v.text).toMatch(/^(29|30)\.\d\d$/)
          expect(v.num).toBeGreaterThanOrEqual(29.7)
          expect(v.num).toBeLessThanOrEqual(30.3)
        } else {
          expect(v.fields!.word.text, a.id).toBe('QNH')
          expect(v.text).toMatch(/^\d{3,4}$/)
          expect(v.num).toBeGreaterThanOrEqual(995)
          expect(v.num).toBeLessThanOrEqual(1030)
        }
        expect(v.spoken).not.toMatch(/\d|point/)
      }
    }
  })

  it('ohne Platz bleibt number: pressure bei der US-Form', () => {
    for (const phraseology of [undefined, 'us', 'map'] as const) {
      const v = resolveVars(
        { p: { number: 'pressure' } },
        { rng: createRng('ohne'), content: index, self, phraseology },
      ).p
      expect(v.fields!.word.text, phraseology).toBe('altimeter')
    }
  })

  it('Verben: descend/climb and maintain (FAA) bzw. descend/climb to (ICAO), mit -ing- und Gegenform', () => {
    const f = (id: string) =>
      resolveVars({ af: { pool: 'airfields' } }, env('v', byId(id))).af.fields!
    const nellis = f('nellis')
    expect(nellis.descend.text).toBe('descend and maintain')
    expect(nellis.descend.fields!.ing.text).toBe('descending and maintaining')
    expect(nellis.descend.fields!.other.text).toBe('descend to')
    expect(nellis.climb.text).toBe('climb and maintain')
    const kutaisi = f('kutaisi')
    expect(kutaisi.descend.text).toBe('descend to')
    expect(kutaisi.descend.fields!.otherIng.text).toBe('descending and maintaining')
    expect(kutaisi.climb.text).toBe('climb to')
    expect(kutaisi.climb.fields!.ing.text).toBe('climbing to')
  })

  it('Wetter: Sicht in Meilen und altimeter (FAA), in Kilometern und QNH (ICAO) – passend zueinander', () => {
    for (const a of index.airfields) {
      for (const seed of SEEDS) {
        const wx = resolveVars(
          {
            af: { pool: 'airfields' },
            wx: { weather: true, airfield: 'af', wind: 'any', sky: 'any' },
          },
          env(`wx-${a.id}-${seed}`, a),
        ).wx.fields!
        if (form(a) === 'faa') {
          expect(wx.pressure.text, a.id).toBe(wx.altimeter.text)
          expect(wx.pressure.fields!.word.text).toBe('altimeter')
          expect(wx.visibility.spoken).toBe(`visibility ${wx.vis.spoken}`)
          expect(wx.vis.fields!.unit.text).toBe('Meilen')
        } else {
          expect(wx.pressure.text, a.id).toBe(wx.qnh.text)
          expect(wx.pressure.fields!.word.text).toBe('QNH')
          expect(wx.visibility.spoken).toBe(`visibility ${wx.vis.spoken} kilometers`)
          expect(numOf(wx.vis)).toBeLessThanOrEqual(10)
          expect(wx.vis.fields!.unit.text).toBe('km')
        }
      }
    }
  })
})

describe('Funksprüche folgen dem Platz', () => {
  for (const a of index.airfields) {
    it(`m1-approach-numbers an ${a.id} (${form(a)})`, () => {
      for (const seed of SEEDS) {
        const x = resolveExchange(
          index.exchanges.get('m1-approach-numbers')!,
          env(`app-${a.id}-${seed}`, a),
        )
        const atc = x.transmissions[0].segments.map((s) => s.text).join(', ')
        if (form(a) === 'faa') {
          const m = /altimeter ((?:\w+ ){3}\w+)/.exec(atc)
          expect(m, atc).not.toBeNull()
          expect(atc).toMatch(/descend and maintain /)
          expect(atc).not.toMatch(/QNH|descend to /)
        } else {
          expect(atc).toMatch(/QNH /)
          expect(atc).toMatch(/descend to /)
          expect(atc).not.toMatch(/altimeter|descend and maintain/)
        }
        expect(x.context).toContain(`der Lotse spricht die ${FORM_NAME[form(a)]}.`)
      }
    })
  }

  it('m3-atis spricht Sicht und Luftdruck in der Form des Platzes', () => {
    for (const a of index.airfields) {
      for (const seed of SEEDS) {
        const x = resolveExchange(index.exchanges.get('m3-atis')!, env(`atis-${a.id}-${seed}`, a))
        const atis = x.transmissions[0].segments.map((s) => s.text).join(', ')
        if (form(a) === 'faa') {
          expect(atis, a.id).toMatch(/visibility \w+(?: \w+)?, /)
          expect(atis).toMatch(/altimeter (two|three) /)
          expect(atis).not.toMatch(/kilometers|QNH/)
        } else {
          expect(atis, a.id).toMatch(/visibility [a-z ]+ kilometers/)
          expect(atis).toMatch(/QNH (one|niner) /)
          expect(atis).not.toMatch(/altimeter/)
        }
      }
    }
  })

  it('Departure: climb and maintain (FAA) bzw. climb to (ICAO)', () => {
    for (const a of index.airfields) {
      const x = resolveExchange(index.exchanges.get('m3-departure-checkin')!, env(`dep-${a.id}`, a))
      const text = x.transmissions[1].segments.map((s) => s.text).join(', ')
      expect(text, a.id).toMatch(
        form(a) === 'faa' ? /climb and maintain flight level/ : /climb to flight level/,
      )
    }
  })
})

describe('Readbacks: Musterlösung voll richtig, die andere Form gilt mit Abzug', () => {
  for (const id of READBACKS) {
    it(id, () => {
      let weakChecked = 0
      for (const a of index.airfields) {
        for (const seed of SEEDS) {
          const x = resolveExchange(index.exchanges.get(id)!, env(`rb-${id}-${a.id}-${seed}`, a))
          for (const t of mine(x.transmissions)) {
            const own = scoreCall(say(t.segments), t.segments)
            expect(own, `${id} an ${a.id}: ${say(t.segments)}`).toMatchObject({
              correct: true,
              weak: false,
              score: 1,
            })
            t.segments.forEach((s, i) => {
              for (const w of s.weak ?? []) {
                const r = scoreCall(say(t.segments, { index: i, text: w }), t.segments)
                expect(r, `${id} an ${a.id}: „${w}“`).toMatchObject({ correct: true, weak: true })
                expect(r.score).toBeLessThan(1)
                expect(r.issues.join(' ')).toContain(`In der ${FORM_NAME[form(a)]} heißt`)
                weakChecked++
              }
            })
          }
        }
      }
      expect(weakChecked).toBeGreaterThan(0)
    })
  }

  it('„QNH“ zählt auch buchstabiert oder mit Punkten, der Wert auch als Ziffern', () => {
    expect(normalizeTokens('Q N H one zero one three')).toEqual(normalizeTokens('QNH 1013'))
    expect(normalizeTokens('Q.N.H. 1013')).toEqual(normalizeTokens('qnh one zero one three'))
    const x = resolveExchange(index.exchanges.get('m3-atis-update')!, env('qnh', byId('batumi')))
    const t = mine(x.transmissions)[0]
    const r = scoreCall(
      `Q N H ${t.segments[0].text.replace(/^QNH /, '')}, ${t.segments[1].text}`,
      t.segments,
    )
    expect(r).toMatchObject({ correct: true, weak: false })
  })

  it('an ICAO-Plätzen gilt „descend and maintain“ mit Hinweis, an FAA-Plätzen „descend to“', () => {
    for (const [id, other, note] of [
      ['kutaisi', 'descend and maintain', 'In der ICAO-Form heißt es „descend to“'],
      ['nellis', 'descend to', 'In der US-Form (FAA) heißt es „descend and maintain“'],
    ] as const) {
      const x = resolveExchange(
        index.exchanges.get('m1-approach-numbers')!,
        env(`dm-${id}`, byId(id)),
      )
      const t = mine(x.transmissions)[0]
      const i = t.segments.findIndex((s) => /^descend/.test(s.text))
      const alt = t.segments[i].text.replace(/^descend( and maintain| to)/, other)
      const r = scoreCall(say(t.segments, { index: i, text: alt }), t.segments)
      expect(r).toMatchObject({ correct: true, weak: true })
      expect(r.issues.join(' ')).toContain(note)
    }
  })

  it('Szenarien m3-s1 und m3-s2: jede eigene Musterlösung ist voll richtig', () => {
    for (const sid of ['m3-s1-kaltstart', 'm3-s2-taxi-departure', 'beispiel-abflug']) {
      for (const a of index.airfields) {
        const sc = resolveScenario(index.scenarios.get(sid)!, env(`sc-${sid}-${a.id}`, a))
        for (const st of sc.steps) {
          if (!st.you) continue
          const segs = st.you.transmission.segments
          expect(scoreCall(say(segs), segs), `${sid} an ${a.id}: ${say(segs)}`).toMatchObject({
            correct: true,
            weak: false,
          })
        }
        const all = sc.steps
          .flatMap((st) => [...st.hear, ...st.reply])
          .flatMap((t) => t.segments.map((s) => s.text))
          .join(' ')
        if (sid !== 'm3-s2-taxi-departure')
          expect(all, `${sid} an ${a.id}`).toMatch(form(a) === 'faa' ? /altimeter/ : /QNH/)
      }
    }
  })
})

describe('Übungen folgen dem Platz', () => {
  it('ATIS-Mitschrift: das Luftdruck-Feld nimmt den Wert in der Einheit des Platzes', () => {
    for (const a of index.airfields) {
      for (const id of ['m3-l1-atis-form', 'beispiel-atis-decoder']) {
        const d = resolveDrill(index.drills.get(id)!, env(`form-${id}-${a.id}`, a))
        if (d.kind !== 'form') throw new Error(id)
        const field = d.fields.find((f) => /Luftdruck/.test(f.label))!
        expect(field.label, a.id).toContain(form(a) === 'faa' ? 'inHg' : 'hPa')
        expect(field.accept[0]).toMatch(form(a) === 'faa' ? /^(29|30)\.\d\d$/ : /^\d{3,4}$/)
      }
    }
  })

  it('keine Übung und kein Funkspruch mit Luftdruck lässt einen Platzhalter stehen', () => {
    const ids = [
      'm1-l3-match-kinds',
      'm1-l3-anatomy-altimeter',
      'm1-l6-x-call-approach-readback',
      'm3-l1-atis-letter',
      'm3-l1-atis-runway',
      'm3-l1-atis-form',
      'm3-l1-update',
    ]
    for (const a of index.airfields) {
      for (const id of ids) {
        const d = resolveDrill(index.drills.get(id)!, env(`ph-${id}-${a.id}`, a))
        expect(JSON.stringify(d), `${id} an ${a.id}`).not.toMatch(/\{[a-zA-Z][\w.]*(\|spoken)?\}/)
      }
    }
  })
})

describe('Profil-Einstellung „Immer US“ (Standard)', () => {
  const icaoFields = index.airfields.filter((a) => form(a) === 'icao')
  const FORCED = 'US-Form (FAA; laut Profil-Einstellung, real wäre an diesem Platz ICAO üblich)'
  const SETTINGS = [undefined, 'us'] as const
  /** Wie `env`, aber auch ganz ohne Einstellung (`undefined` gilt wie „Immer US“). */
  const envUs = (seed: string, a: Airfield, phraseology: PhraseologySetting | undefined): ResolveEnv => ({
    ...env(seed, a),
    phraseology,
  })

  it('der Durchlauf gibt die Einstellung aus dem Profil an den Würfel', () => {
    expect(DEFAULT_PROFILE.phraseology).toBe('us')
    expect(makeRun(DEFAULT_PROFILE, 'seed').envFor(0).phraseology).toBe('us')
    expect(makeRun({ ...DEFAULT_PROFILE, phraseology: 'map' }, 'seed').envFor('x').phraseology).toBe('map')
  })

  it('es gibt ICAO-Plätze, an denen die Einstellung etwas ändert', () => {
    expect(icaoFields.map((a) => a.map)).toEqual(expect.arrayContaining(['caucasus', 'persian-gulf']))
  })

  it('jeder Platz spricht die US-Form; die Karte bleibt abrufbar, Sätze über den Platz nennen die Einstellung', () => {
    for (const phraseology of SETTINGS) {
      for (const a of index.airfields) {
        const f = resolveVars({ af: { pool: 'airfields' } }, envUs(`us-${a.id}`, a, phraseology)).af.fields!
        expect(f.phraseology.text, a.id).toBe('FAA')
        expect(f.phraseology.fields!.form.text).toBe('US-Form (FAA)')
        expect(f.phraseology.fields!.here.text, a.id).toBe(form(a) === 'faa' ? 'US-Form (FAA)' : FORCED)
        expect(f.phraseology.fields!.map.text, a.id).toBe(form(a).toUpperCase())
        expect(f.phraseology.fields!.map.fields!.form.text).toBe(FORM_NAME[form(a)])
        expect([f.faa.text, f.icao.text]).toEqual(['yes', ''])
        expect(f.descend.text).toBe('descend and maintain')
        expect(f.descend.fields!.other.text).toBe('descend to')
        expect(f.climb.text).toBe('climb and maintain')
      }
    }
  })

  it('Luftdruck und Sicht in der US-Form, auch in Georgien und am Golf', () => {
    for (const phraseology of SETTINGS) {
      for (const a of index.airfields) {
        for (const seed of SEEDS) {
          const v = resolveVars(
            {
              af: { pool: 'airfields' },
              p: { number: 'pressure', airfield: 'af' },
              wx: { weather: true, airfield: 'af', wind: 'any', sky: 'any' },
            },
            envUs(`us-p-${a.id}-${seed}`, a, phraseology),
          )
          expect(v.p.fields!.word.text, a.id).toBe('altimeter')
          expect(v.p.text).toMatch(/^(29|30)\.\d\d$/)
          const wx = v.wx.fields!
          expect(wx.pressure.text, a.id).toBe(wx.altimeter.text)
          expect(wx.visibility.spoken).toBe(`visibility ${wx.vis.spoken}`)
          expect(wx.vis.fields!.unit.text).toBe('Meilen')
        }
      }
    }
  })

  it('Funksprüche sprechen die US-Form; der Kontext sagt an ICAO-Plätzen, dass das an der Einstellung liegt', () => {
    for (const a of icaoFields) {
      for (const seed of SEEDS) {
        const app = resolveExchange(
          index.exchanges.get('m1-approach-numbers')!,
          env(`us-app-${a.id}-${seed}`, a, 'us'),
        )
        const atc = app.transmissions[0].segments.map((s) => s.text).join(', ')
        expect(atc, a.id).toMatch(/altimeter (two|three) /)
        expect(atc).toMatch(/descend and maintain /)
        expect(atc).not.toMatch(/QNH|descend to /)
        expect(app.context).toContain(`der Lotse spricht die ${FORCED}.`)
        const atis = resolveExchange(index.exchanges.get('m3-atis')!, env(`us-atis-${a.id}-${seed}`, a, 'us'))
        const text = atis.transmissions[0].segments.map((s) => s.text).join(', ')
        expect(text, a.id).toMatch(/altimeter (two|three) /)
        expect(text).not.toMatch(/kilometers|QNH/)
        expect(atis.context).toContain(`gilt die ${FORCED}:`)
      }
      const dep = resolveExchange(index.exchanges.get('m3-departure-checkin')!, env(`us-dep-${a.id}`, a, 'us'))
      expect(dep.transmissions[1].segments.map((s) => s.text).join(', ')).toMatch(
        /climb and maintain flight level/,
      )
    }
  })

  it('Readbacks: Musterlösung voll richtig, die ICAO-Form gilt mit Abzug und neutralem Hinweis', () => {
    for (const id of READBACKS) {
      let weakChecked = 0
      for (const a of index.airfields) {
        for (const seed of SEEDS) {
          const x = resolveExchange(index.exchanges.get(id)!, env(`us-rb-${id}-${a.id}-${seed}`, a, 'us'))
          for (const t of mine(x.transmissions)) {
            expect(scoreCall(say(t.segments), t.segments), `${id} an ${a.id}: ${say(t.segments)}`).toMatchObject({
              correct: true,
              weak: false,
              score: 1,
            })
            t.segments.forEach((s, i) => {
              for (const w of s.weak ?? []) {
                const r = scoreCall(say(t.segments, { index: i, text: w }), t.segments)
                expect(r, `${id} an ${a.id}: „${w}“`).toMatchObject({ correct: true, weak: true })
                expect(r.issues.join(' ')).toContain('In der US-Form (FAA) heißt')
                weakChecked++
              }
            })
          }
        }
      }
      expect(weakChecked, id).toBeGreaterThan(0)
    }
  })

  it('Szenarien: jede eigene Musterlösung ist voll richtig, der Luftdruck heißt überall „altimeter“', () => {
    for (const sid of ['m3-s1-kaltstart', 'm3-s2-taxi-departure', 'beispiel-abflug']) {
      for (const a of index.airfields) {
        const sc = resolveScenario(index.scenarios.get(sid)!, env(`us-sc-${sid}-${a.id}`, a, 'us'))
        for (const st of sc.steps) {
          if (!st.you) continue
          const segs = st.you.transmission.segments
          expect(scoreCall(say(segs), segs), `${sid} an ${a.id}: ${say(segs)}`).toMatchObject({
            correct: true,
            weak: false,
          })
        }
        const all = sc.steps
          .flatMap((st) => [...st.hear, ...st.reply])
          .flatMap((t) => t.segments.map((s) => s.text))
          .join(' ')
        expect(all, `${sid} an ${a.id}`).not.toMatch(/QNH|kilometers|climb to |descend to /)
      }
    }
  })

  it('ATIS-Mitschrift: das Luftdruck-Feld will inHg', () => {
    for (const a of icaoFields) {
      const d = resolveDrill(index.drills.get('m3-l1-atis-form')!, env(`us-form-${a.id}`, a, 'us'))
      if (d.kind !== 'form') throw new Error('m3-l1-atis-form')
      const field = d.fields.find((f) => /Luftdruck/.test(f.label))!
      expect(field.label, a.id).toContain('inHg')
      expect(field.accept[0]).toMatch(/^(29|30)\.\d\d$/)
    }
  })

  it('Höhen über dem Platz (above) hängen nicht von der Einstellung ab', () => {
    const all: { id: string; vars?: Record<string, VarSpec> }[] = [
      ...index.exchanges.values(),
      ...index.drills.values(),
      ...index.scenarios.values(),
    ]
    const hasAbove = (v: VarSpec) => 'above' in v && !!v.above
    const withAbove = all.filter((x) => Object.values(x.vars ?? {}).some(hasAbove))
    expect(withAbove.length).toBeGreaterThan(2)
    let checked = 0
    for (const x of withAbove) {
      const names = Object.entries(x.vars!).filter(([, v]) => hasAbove(v))
      for (const a of index.airfields) {
        for (const seed of SEEDS.slice(0, 3)) {
          const [us, map] = (['us', 'map'] as const).map((p) =>
            resolveVars(x.vars, env(`above-${x.id}-${a.id}-${seed}`, a, p)),
          )
          for (const [name, spec] of names) {
            expect(us[name].text, `${x.id}.${name} an ${a.id}`).toBe(map[name].text)
            const above = (spec as { above: { add?: number; unit?: number } }).above
            if (a.elevationFt !== undefined) {
              expect(numOf(us[name])! * (above.unit ?? 1), `${x.id}.${name} an ${a.id}`).toBeGreaterThanOrEqual(
                a.elevationFt + (above.add ?? 0),
              )
            }
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('Inhalte: Sätze über den Platz nehmen {….phraseology.here}, Hinweise nennen die Form statt „An …-Plätzen“', () => {
    for (const [path, text] of Object.entries(raw)) {
      expect(text, path).not.toMatch(/\b(gilt|spricht)\s+(der Lotse\s+)?die\s+\{[\w.]+\.phraseology\.form\}/)
      expect(text, path).not.toMatch(/\{[\w.]+\.phraseology\}-Plätzen/)
    }
  })
})
