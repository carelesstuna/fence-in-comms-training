/**
 * Bewertung nach dem Persona-Review vom 22.11.2026 (docs/reviews/2026-11-22-personas/), Arbeitspaket A1:
 * Dezimalkomma und Kanal-Vorwörter in Eingaben, „for“ zwischen Höhen, Bahnnummern ohne führende Null,
 * Rufzeichen vorn beim Zurücklesen, längste Variante, Baukasten nach den Regeln der Funkspruch-Bewertung.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import {
  evaluateBuild,
  explainForBuild,
  resolveDrill,
  resolveExchange,
  resolveScenario,
  tileMatches,
  type BuildSegment,
} from './drills/resolve'
import type { BuildDrill, ResolvedDrill } from './drills/types'
import { matchAny, matchesAny, normalizeTokens, sameCall } from './phraseology/normalize'
import { scoreCall, toItems, type ScoreSegment } from './scoring/score'

const index = contentResult.index!
const env = (seed: string) => {
  const rng = createRng(seed)
  return { rng, content: index, self: randomSelf(rng, index) }
}
const seg = (text: string, role = 'info', extra: Partial<ScoreSegment> = {}): ScoreSegment => ({
  text,
  role,
  ...extra,
})
const drill = (id: string, seed: string): ResolvedDrill =>
  resolveDrill(index.drills.get(id)!, env(seed))

// ---------------------------------------------------------------------------
// Eingaben (Freitext, Mitschreiben, Lückentext)
// ---------------------------------------------------------------------------

describe('Dezimalkomma in Eingaben (E4-01, U1-02, P1-03)', () => {
  it('Komma als Dezimalzeichen, wenn die Antwort diese Zahl enthält', () => {
    expect(matchesAny('121,5', ['121.5'])).toBe(true)
    expect(matchesAny('251,250', ['251.25'])).toBe(true)
    expect(matchesAny('251,250', ['two five one point two five'])).toBe(true)
    expect(matchesAny('78,85', ['78.85'])).toBe(true)
    expect(matchesAny('390,0', ['390.0'])).toBe(true)
    expect(matchesAny('4,3', ['4.3'])).toBe(true)
    expect(matchesAny('4,3', ['four point three'])).toBe(true)
    expect(matchesAny('244,75', ['two four four point seven five'])).toBe(true)
  })

  it('Komma als Tausender, wenn die Antwort die ganze Zahl enthält', () => {
    expect(matchesAny('25,000', ['25000'])).toBe(true)
    expect(matchesAny('angels 25,000', ['angels 25000'])).toBe(true)
  })

  it('sonst bleibt das Komma ein Trenner – zwei Zahlen bleiben zwei Zahlen', () => {
    expect(matchesAny('090, 25', ['090/25'])).toBe(true)
    expect(matchesAny('090,25', ['090/25'])).toBe(true)
    expect(matchesAny('Viper 1-1, 251.25', ['Viper one one 251.25'])).toBe(true)
  })

  it('ein falscher Wert bleibt falsch', () => {
    expect(matchesAny('121,6', ['121.5'])).toBe(false)
    expect(matchesAny('12,15', ['121.5'])).toBe(false)
    expect(matchesAny('4,8', ['4.3'])).toBe(false)
    expect(matchesAny('25,000', ['250'])).toBe(false)
  })

  it('in den Inhalten: jede Antwort mit Dezimalpunkt gilt auch mit Komma (auch in der Modulprüfung)', () => {
    const failed: string[] = []
    let tested = 0
    for (const d of index.drills.values()) {
      if (d.type !== 'input' && d.type !== 'form') continue
      for (let i = 0; i < 4; i++) {
        const r = resolveDrill(d, env(`komma-${d.id}-${i}`))
        const lists =
          r.kind === 'input' ? [r.accept] : r.kind === 'form' ? r.fields.map((f) => f.accept) : []
        for (const accept of lists) {
          const first = accept.find((a) => /\d\.\d/.test(a))
          if (!first) continue
          tested++
          const comma = first.replace(/(\d)\.(\d)/g, '$1,$2')
          if (!matchesAny(comma, accept)) failed.push(`${d.id}: „${comma}“`)
        }
      }
    }
    expect(tested).toBeGreaterThan(20)
    expect(failed).toEqual([])
  })
})

describe('Kanal mit Vorwort (U1-03, P2-12)', () => {
  it('„Kanal 13“, „ch4“, „UHF 3“, „button 3“ gelten, wenn nur die Kanalnummer gefragt ist', () => {
    for (const s of [
      'Kanal 13',
      'kanal13',
      'channel 13',
      'Ch 13',
      'ch13',
      'ch. 13',
      'button 13',
      'Preset 13',
      'UHF 13',
      'uniform 13',
      'UHF Kanal 13',
      'Kanal one three',
    ]) {
      expect(matchesAny(s, ['13']), s).toBe(true)
    }
    expect(matchesAny('Kanal B', ['B'])).toBe(true)
  })

  it('falsche Nummer, anderes Vorwort und Frequenzen bleiben falsch', () => {
    expect(matchesAny('Kanal 14', ['13'])).toBe(false)
    expect(matchesAny('heading 13', ['13'])).toBe(false)
    // Eine Frequenz ist kein Kanal: „uniform 121.5“ wäre das falsche Gerät
    expect(matchesAny('uniform 121.5', ['121.5'])).toBe(false)
  })

  it('BMS-Tower-Preset (m2-l9-bms-tower) und Comm Card (m2-l6-lookup)', () => {
    const tower = drill('m2-l9-bms-tower', 'uhf')
    expect(tower.kind).toBe('input')
    if (tower.kind === 'input')
      for (const s of ['UHF 3', 'uniform 3', 'Kanal 3'])
        expect(matchesAny(s, tower.accept), s).toBe(true)
    const lookup = drill('m2-l6-lookup', 'kanal')
    expect(lookup.kind).toBe('form')
    if (lookup.kind === 'form') {
      const field = lookup.fields.find((f) => f.label === 'Kanal')!
      expect(matchesAny(`Kanal ${field.accept[0]}`, field.accept)).toBe(true)
    }
  })
})

describe('Gradzeichen (E1-10)', () => {
  it('„270°“ und „270 deg“ sind „270“', () => {
    for (const s of ['270°', '270 °', '270deg', '270 deg', 'heading 270°'])
      expect(matchesAny(s, ['270', 'heading 270']), s).toBe(true)
    expect(normalizeTokens('270°')).toEqual(['2', '7', '0'])
    expect(matchesAny('280°', ['270'])).toBe(false)
  })

  it('in der Einstufung M4: check right', () => {
    const d = drill('m4-l5-check-right', 'grad')
    expect(d.kind).toBe('input')
    if (d.kind === 'input') expect(matchesAny(`${d.accept[0]}°`, d.accept)).toBe(true)
  })
})

describe('„for“ zwischen Höhen (E3-06, P2-04)', () => {
  it('zwischen einzelnen Ziffern ein vertipptes „four“, zwischen Zahlen „auf“', () => {
    expect(normalizeTokens('three for zero')).toEqual(['3', '4', '0'])
    expect(normalizeTokens('3 for 0')).toEqual(['3', '4', '0'])
    expect(normalizeTokens('passing 3000 for 6000')).toContain('for')
    expect(normalizeTokens('leaving 3000 for 8000')).toContain('for')
    expect(sameCall('heading three for zero', 'heading 340')).toBe(true)
  })

  it('„passing 3000 for 6000“ ist ein richtiger Erstanruf bei Departure', () => {
    const dep = [
      seg('Gunsan Departure', 'addressee'),
      seg('Viper four one', 'callsign'),
      seg('leaving three thousand', 'value', {
        alt: ['passing three thousand', 'leaving 3000', 'passing 3000'],
      }),
      seg('climbing to six thousand', 'value', {
        alt: ['for six thousand', 'for 6000', 'climbing 6000'],
      }),
    ]
    const r = scoreCall('Gunsan Departure, Viper 41, passing 3000 for 6000', dep)
    expect(r.correct, r.issues.join(' | ')).toBe(true)
    expect(r.score).toBe(1)
  })

  it('mit dem Funkspruch aus Modul 3: „passing … for …“ getippt in Worten, gesprochen auch in Ziffern', () => {
    for (let i = 0; i < 10; i++) {
      const x = resolveExchange(index.exchanges.get('m3-departure-checkin')!, env(`for-${i}`))
      const segs = x.transmissions[0].segments
      const passing = segs.flatMap((s) => s.alt ?? []).find((a) => /^passing /.test(a))
      const forAlt = segs.flatMap((s) => s.alt ?? []).find((a) => /^for /.test(a))
      expect(passing && forAlt).toBeTruthy()
      const input = `${segs[0].text}, ${segs[1].text}, ${passing} ${forAlt}`
      const r = scoreCall(input, segs, undefined, { source: 'typed', numbersInWords: true })
      expect(r.correct, `${input} → ${r.issues.join(' | ')}`).toBe(true)
      // Ziffern (wie die Erkennung schreibt): gesprochen richtig, getippt nicht (24.11.2026: Zahlen in Worten)
      const [from, to] = segs.filter((s) => s.role === 'value').map((s) => toItems(s.text).flatMap((it) => (it.kind === 'num' ? [it.n] : []))[0])
      const digits = `${segs[0].text}, ${segs[1].text}, passing ${from} for ${to}`
      expect(scoreCall(digits, segs, undefined, { source: 'spoken' }).correct, digits).toBe(true)
      expect(scoreCall(digits, segs, undefined, { source: 'typed', numbersInWords: true }).correct, digits).toBe(false)
    }
  })
})

describe('Bahnnummer (E3-09, P2-11)', () => {
  it('Eingabe: führende Null optional – FAA-Form und ICAO-Form gelten beide', () => {
    const accept = ['runway zero niner left cleared for takeoff Dodge six one']
    expect(matchesAny('runway niner left, cleared for takeoff, Dodge 6-1', accept)).toBe(true)
    expect(matchesAny('runway 9L, cleared for takeoff, Dodge 61', accept)).toBe(true)
    expect(matchesAny('runway zero three left', ['runway three left'])).toBe(true)
    expect(matchesAny('runway 19 left, cleared for takeoff, Dodge 6-1', accept)).toBe(false)
    // nur nach „runway“: ein Kurs behält seine Null
    expect(sameCall('heading 090', 'heading 90')).toBe(false)
  })

  it('Eingabe in Modul 3: Startfreigabe zurücklesen ohne führende Null', () => {
    for (let i = 0; i < 20; i++) {
      const d = drill('m3-l5-input-takeoff', `bahn-${i}`)
      if (d.kind !== 'input') throw new Error('m3-l5-input-takeoff ist keine Eingabe')
      const faa = d.accept[0].replace(/^runway zero /, 'runway ')
      expect(matchesAny(faa, d.accept), faa).toBe(true)
    }
  })

  const takeoff = [
    seg('runway zero three right', 'value', { critical: true }),
    seg('cleared for takeoff', 'instruction', { critical: true }),
    seg('Mako seven one', 'callsign', { critical: true }),
  ]

  it('Funkspruch: „runway“ vor der richtigen Bahnnummer darf fehlen – mit Hinweis', () => {
    const r = scoreCall('03R, cleared for takeoff, Mako 71', takeoff)
    expect(r.correct, r.issues.join(' | ')).toBe(true)
    expect(r.issues.join(' ')).toContain('„runway“ weggelassen')
    const swapped = scoreCall('cleared for takeoff 03R, Mako 71', takeoff)
    expect(swapped.correct, swapped.issues.join(' | ')).toBe(true)
  })

  it('falsche Bahn bleibt falsch, eine fehlende Bahn stiehlt keine Zahl vom Rufzeichen', () => {
    expect(scoreCall('cleared for takeoff 03L, Mako 71', takeoff).correct).toBe(false)
    expect(scoreCall('cleared for takeoff 21R, Mako 71', takeoff).correct).toBe(false)
    const none = scoreCall('cleared for takeoff, Mako 71', takeoff)
    expect(none.correct).toBe(false)
    expect(none.slots[2].status).toBe('ok')
    expect(none.issues.join(' ')).toContain('Pflichtteil fehlt: „runway zero three right“')
  })
})

describe('Rufzeichen vorn beim Zurücklesen (E3-07)', () => {
  const readback = [
    seg('departure three two three point five', 'value'),
    seg('Viper three one', 'callsign'),
  ]

  it('ohne Adressat gilt das Rufzeichen auch vorn – mit Hinweis statt „erst wen du rufst“', () => {
    const r = scoreCall('Viper 3-1, departure 323.5', readback)
    expect(r.correct, r.issues.join(' | ')).toBe(true)
    expect(r.issues.join(' ')).toContain('meist am Ende')
    expect(r.issues.join(' ')).not.toContain('erst wen du rufst')
    expect(
      scoreCall('Viper 41, holding position', [
        seg('holding position', 'instruction'),
        seg('Viper four one', 'callsign'),
      ]).correct,
    ).toBe(true)
  })

  it('mit Adressat bleibt die Reihenfolge Pflicht', () => {
    const radioCheck = [
      seg('Batumi Tower', 'addressee'),
      seg('Viper one one', 'callsign'),
      seg('radio check', 'request'),
    ]
    const r = scoreCall('Viper 1-1, Batumi Tower, radio check', radioCheck)
    expect(r.correct).toBe(false)
    expect(r.issues.join(' ')).toContain('erst wen du rufst')
  })
})

describe('Füllwörter und Varianten (U2-08, P1-18)', () => {
  it('„the“ zu viel oder zu wenig stört in Eingaben nicht', () => {
    expect(matchesAny('say again the frequency', ['say again frequency'])).toBe(true)
    expect(matchesAny('giving way to F-16', ['giving way to the F-16'])).toBe(true)
    expect(matchesAny('say again the altitude', ['say again frequency'])).toBe(false)
    expect(matchAny('say again the frequency', ['say again frequency'])).toEqual([])
  })

  it('die längste passende Variante gilt („request pigeons home plate“)', () => {
    const rtb = [
      seg('Darkstar', 'addressee'),
      seg('Cobra four one', 'callsign'),
      seg('RTB', 'intent'),
      seg('request pigeons', 'request', {
        alt: ['pigeons', 'say pigeons', 'request pigeons home plate'],
      }),
    ]
    const r = scoreCall('Darkstar Cobra 41 bingo RTB request pigeons home plate', rtb)
    expect(r.correct).toBe(true)
    expect(r.extras).toEqual(['bingo'])
  })
})

// ---------------------------------------------------------------------------
// Baukasten
// ---------------------------------------------------------------------------

/** Alle Baukästen aus Übungen und Szenarien, aufgelöst. */
function builds(seeds = 6): { where: string; segments: BuildSegment[]; distractors: string[] }[] {
  const out: { where: string; segments: BuildSegment[]; distractors: string[] }[] = []
  for (let i = 0; i < seeds; i++) {
    for (const d of index.drills.values()) {
      if (d.type !== 'build') continue
      const r = resolveDrill(d, env(`bau-${d.id}-${i}`)) as BuildDrill
      const segments = r.exchange.transmissions[r.transmission].segments
      out.push({
        where: d.id,
        segments,
        distractors: r.tiles
          .map((t) => t.text)
          .filter((t) => !segments.some((s) => tileMatches(t, s))),
      })
    }
    for (const sc of index.scenarios.values()) {
      const r = resolveScenario(sc, env(`bau-${sc.id}-${i}`))
      r.steps.forEach((st, k) => {
        if (st.you?.mode !== 'build') return
        const segments = st.you.transmission.segments
        out.push({
          where: `${sc.id}#${k}`,
          segments,
          distractors: st.you.tiles
            .map((t) => t.text)
            .filter((t) => !segments.some((s) => tileMatches(t, s))),
        })
      })
    }
  }
  return out
}

const texts = (segments: readonly BuildSegment[]) => segments.map((s) => s.text)
const buildDrill = (id: string, seed = 'x') => {
  const r = drill(id, seed) as BuildDrill
  return { r, segments: r.exchange.transmissions[r.transmission].segments }
}

describe('Baukasten nach den Regeln der Funkspruch-Bewertung (U2-03, P1-01, P2-13)', () => {
  it('jede Musterlösung ist sauber richtig, jeder Störbaustein macht sie falsch', () => {
    const failed: string[] = []
    for (const b of builds()) {
      const clean = evaluateBuild(texts(b.segments), b.segments)
      if (!clean.correct || clean.issues.length)
        failed.push(`${b.where}: ${clean.issues.join(' | ')}`)
      for (const d of b.distractors) {
        if (evaluateBuild([...texts(b.segments), d], b.segments).correct)
          failed.push(`${b.where}: „${d}“ gilt als richtig`)
      }
    }
    expect(failed).toEqual([])
  })

  it('Rufzeichen vor dem Adressaten ist überall falsch', () => {
    for (const b of builds(2)) {
      const a = b.segments.findIndex((s) => s.role === 'addressee')
      const c = b.segments.findIndex((s) => s.role === 'callsign')
      if (a < 0 || c < 0) continue
      const order = texts(b.segments)
      ;[order[a], order[c]] = [order[c], order[a]]
      const r = evaluateBuild(order, b.segments)
      expect(r.correct, b.where).toBe(false)
      expect(r.issues.join(' '), b.where).toContain('erst wen du rufst')
    }
  })

  it('ATIS-Kennung (free) darf vor oder nach der Anfrage stehen (m1-l1-build-startup, m1-l2-build-taxi)', () => {
    for (const id of ['m1-l1-build-startup', 'm1-l2-build-taxi', 'm3-l1-build-initial']) {
      const { segments } = buildDrill(id)
      const info = segments.findIndex((s) => s.free)
      expect(info, id).toBeGreaterThan(0)
      const order = texts(segments).filter((_, i) => i !== info)
      order.push(segments[info].text)
      const r = evaluateBuild(order, segments)
      expect(r.correct, `${id}: ${r.issues.join(' | ')}`).toBe(true)
      expect(r.reordered).toBe(false)
      expect(r.issues).toEqual([])
    }
  })

  it('Startfreigabe „cleared for takeoff, runway …“ ist auch richtig – mit Hinweis auf die übliche Reihenfolge', () => {
    const { segments } = buildDrill('m3-l5-build-takeoff-readback')
    const [rwy, cleared, cs] = texts(segments)
    const r = evaluateBuild([cleared, rwy, cs], segments, () => 'Rolle')
    expect(r.correct, r.issues.join(' | ')).toBe(true)
    expect(r.reordered).toBe(true)
    expect(r.tiles.map((t) => t.status)).toContain('moved')
    expect(r.issues.join(' ')).toContain('anderen Stelle als üblich')
  })

  it('Readback mit Rufzeichen vorn (U1-07): richtig, mit Hinweis', () => {
    const { segments } = buildDrill('m1-l6-build-approach-readback')
    const order = texts(segments)
    const r = evaluateBuild([order[order.length - 1], ...order.slice(0, -1)], segments)
    expect(r.correct, r.issues.join(' | ')).toBe(true)
    expect(r.issues.join(' ')).toContain('meist am Ende')
  })

  it('eine Variante (alt) gilt wie der Text, doppelt gewählt ist überzählig', () => {
    const segments: BuildSegment[] = [
      { text: 'Nellis Ground', role: 'addressee' },
      { text: 'Viper one one', role: 'callsign' },
      { text: 'request startup', role: 'request', alt: ['request start up'] },
    ]
    expect(
      evaluateBuild(['Nellis Ground', 'Viper one one', 'request start up'], segments).correct,
    ).toBe(true)
    const twice = evaluateBuild(
      ['Nellis Ground', 'Viper one one', 'request startup', 'request start up'],
      segments,
    )
    expect(twice.correct).toBe(false)
    expect(twice.tiles[3].status).toBe('duplicate')
  })

  it('optionale Teile dürfen fehlen', () => {
    const segments: BuildSegment[] = [
      { text: 'Nellis Tower', role: 'addressee' },
      { text: 'Viper one one', role: 'callsign' },
      { text: 'flight of two', role: 'info', optional: true },
      { text: 'ready for departure', role: 'request' },
    ]
    const r = evaluateBuild(['Nellis Tower', 'Viper one one', 'ready for departure'], segments)
    expect(r.correct).toBe(true)
    expect(r.skipped).toEqual([2])
  })
})

describe('Baukasten: Rückmeldung zum tatsächlichen Fehler (U2-04, U1-07)', () => {
  it('überzähliges „over“ wird benannt und markiert', () => {
    const { segments } = buildDrill('m1-l1-build-radio-check')
    const r = evaluateBuild([...texts(segments), 'over'], segments, () => 'Rolle')
    expect(r.correct).toBe(false)
    expect(r.tiles[r.tiles.length - 1]).toEqual({ segment: null, status: 'extra' })
    expect(r.issues).toEqual(['Überflüssig: „over“ – im Funk gilt: so kurz wie möglich.'])
  })

  it('Störbaustein statt Pflichtteil: überzählig und fehlend getrennt („sorry“ statt „correction“)', () => {
    const { segments } = buildDrill('m1-l5-build-correction')
    const order = texts(segments).map((t) => (t === 'correction' ? 'sorry' : t))
    const r = evaluateBuild(order, segments, () => 'Standardwort')
    expect(r.correct).toBe(false)
    expect(r.missing).toEqual([segments.findIndex((s) => s.text === 'correction')])
    expect(r.issues.join(' ')).toContain('Überflüssig: „sorry“')
    expect(r.issues.join(' ')).toContain('fehlt: „correction“ (Standardwort)')
  })

  it('fehlendes „fox mike“ wird benannt', () => {
    const { segments } = buildDrill('m2-l1-build-fm-readback')
    const r = evaluateBuild(
      texts(segments).filter((t) => t !== 'fox mike'),
      segments,
    )
    expect(r.correct).toBe(false)
    expect(r.issues.join(' ')).toContain('„fox mike“')
  })

  it('kein Satz der Erklärung zu Störbausteinen, die man gar nicht gewählt hat', () => {
    const { r } = buildDrill('m1-l5-build-correction')
    const shorter = explainForBuild(r.explain, ['disregard'])!
    expect(shorter).not.toContain('disregard')
    expect(shorter).toContain('„correction“')
    // gewählt: Der Satz bleibt
    expect(explainForBuild(r.explain, [])).toBe(r.explain)
  })

  it('Sätze werden nicht an Abkürzungen getrennt; bleibt nichts übrig, gibt es keine Erklärung', () => {
    const text = 'Kurz halten, z. B. „over“ weglassen. Rufzeichen am Ende. „roger“ zeigt nichts.'
    expect(explainForBuild(text, ['over'])).toBe('Rufzeichen am Ende. „roger“ zeigt nichts.')
    expect(explainForBuild(text, ['over', 'roger'])).toBe('Rufzeichen am Ende.')
    expect(explainForBuild('„over“ braucht es nicht.', ['over'])).toBeUndefined()
  })

  it('ein Satz, der auch die Lösung zitiert, bleibt; ein „Und“ ohne Vorsatz fällt weg', () => {
    const ready =
      '„ready for departure“, nicht „ready for takeoff“ – „takeoff“ bleibt der Freigabe vorbehalten. Und am Rollhalt sprichst du mit dem Tower.'
    expect(explainForBuild(ready, ['ready for takeoff'], [{ text: 'ready for departure' }])).toBe(
      ready,
    )
    const startup =
      '„request taxi“ wäre der nächste Schritt. Und das Rufzeichen deines Wingman hat hier nichts zu suchen.'
    expect(explainForBuild(startup, ['request taxi'], [{ text: 'request startup' }])).toBe(
      'Das Rufzeichen deines Wingman hat hier nichts zu suchen.',
    )
  })
})
