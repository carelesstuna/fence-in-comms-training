import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { createRng } from './random/rng'
import { fillTemplate, findPlaceholders } from './random/template'
import { randomSelf, resolveVars } from './random/vars'
import {
  spellDigits,
  spokenAltimeter,
  spokenAltitude,
  spokenCallsign,
  spokenFrequency,
  spokenFuel,
  spokenHeading,
  spokenRunway,
} from './phraseology/spoken'
import { matchesAny, normalizeTokens, sameCall } from './phraseology/normalize'
import { checkBuild, resolveDrill, resolveExchange } from './drills/resolve'
import { ALL_GENERATORS, NUMBER_KINDS, runGenerator, numberWords } from './drills/generators'
import {
  EMPTY_PROGRESS,
  applyLessonResult,
  applyPlacementResult,
  lessonState,
  lessonXp,
  moduleState,
  rankFor,
} from './progress/progress'
import type { ResolvedDrill } from './drills/types'

const index = contentResult.index!

describe('Inhalte', () => {
  it('sind ohne Fehler ladbar', () => {
    expect(contentResult.errors).toEqual([])
    expect(index.lessons.size).toBeGreaterThan(0)
  })
  it('meldet Steuerzeichen im Text (P2-14)', () => {
    const { errors } = buildContentIndex({ '/content/lessons/m2/x.md': 'Ordner Docs\u0003 KTO Charts\n' })
    expect(errors).toContainEqual({ file: 'content/lessons/m2/x.md', message: 'Zeile 1: Steuerzeichen (Byte 0x03) im Text' })
  })
})

describe('Funksprache', () => {
  it('spricht Ziffern einzeln', () => {
    expect(spellDigits('260.0')).toBe('two six zero point zero')
    expect(spokenHeading(90)).toBe('zero niner zero')
    expect(spokenHeading(360)).toBe('three six zero')
  })
  it('spricht Höhen, Frequenzen und Co.', () => {
    expect(spokenAltitude(15500)).toBe('one five thousand five hundred')
    expect(spokenAltitude(9000)).toBe('niner thousand')
    expect(spokenAltitude(500)).toBe('five hundred')
    expect(spokenFrequency(251.25)).toBe('two five one point two five')
    expect(spokenFrequency(132.55)).toBe('one three two point five five')
    expect(spokenFrequency(260)).toBe('two six zero point zero')
    expect(spokenAltimeter(29.92)).toBe('two niner niner two')
    expect(spokenFuel(5.8)).toBe('five point eight')
    expect(spokenRunway('03L')).toBe('zero three left')
    expect(spokenCallsign('Viper', 1, 2)).toBe('Viper one two')
  })
  it('kennt Alltags-Zahlwörter für Falschoptionen', () => {
    expect(numberWords(251)).toBe('two hundred fifty-one')
    expect(numberWords(90)).toBe('ninety')
  })
})

describe('Normalisierer', () => {
  it('behandelt Ziffern, ICAO-Aussprache und Schreibweisen gleich', () => {
    expect(sameCall('heading zero niner zero', 'Heading 090')).toBe(true)
    expect(sameCall('two-five-one point two five', '251.25')).toBe(true)
    expect(sameCall('too fife wun decimal too fife', '251.25')).toBe(true)
    expect(sameCall('alpha juliet x-ray', 'Alfa Juliett Xray')).toBe(true)
    expect(sameCall('Viper 1-1, radio check.', 'viper one one radio check')).toBe(true)
  })
  it('unterscheidet echte Fehler', () => {
    expect(sameCall('heading ninety', 'heading zero niner zero')).toBe(false)
    expect(sameCall('two fifty one', '251')).toBe(false)
    expect(matchesAny('roger', ['wilco', 'copy'])).toBe(false)
    expect(normalizeTokens('Angels 2-5')).toEqual(['angels', '2', '5'])
  })
  it('Kontakthöhen: Zahlwort vor „thousand“ gleich ziffernweise', () => {
    expect(sameCall('twenty-five thousand', 'two five thousand')).toBe(true)
    expect(sameCall('twenty five thousand', '25 thousand')).toBe(true)
    expect(sameCall('twenty thousand', 'two zero thousand')).toBe(true)
    expect(sameCall('fifteen thousand', 'one five thousand')).toBe(true)
    expect(sameCall('trail group thirty-two thousand, hostile', 'trail group three two thousand hostile')).toBe(true)
    expect(sameCall('twenty-five thousand', 'two four thousand')).toBe(false)
    // ohne „thousand“ bleibt es bei der Regel: Zahlwörter sind etwas anderes als Ziffern
    expect(sameCall('two fifty', 'two five zero')).toBe(false)
  })
})

describe('Zufall', () => {
  it('ist mit gleichem Seed reproduzierbar', () => {
    const a = createRng('K7Q2')
    const b = createRng('K7Q2')
    expect([a.next(), a.int(1, 100), a.pick(['x', 'y', 'z'])]).toEqual([b.next(), b.int(1, 100), b.pick(['x', 'y', 'z'])])
    expect(createRng('AAAA').next()).not.toBe(createRng('BBBB').next())
  })
  it('würfelt Rufzeichen und Flugplätze durch', () => {
    const seen = new Set<string>()
    const fields = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const rng = createRng(`s${i}`)
      const self = randomSelf(rng, index)
      const vars = resolveVars({ a: { pool: 'airfields' } }, { rng, content: index, self })
      seen.add(vars.callsign.text)
      fields.add(vars.a.text)
    }
    expect(seen.size).toBeGreaterThan(20)
    expect(fields.size).toBeGreaterThan(4)
  })
  it('füllt Platzhalter inkl. Unterfeldern und gesprochener Form', () => {
    const rng = createRng('T1')
    const vars = resolveVars({ af: { pool: 'airfields', where: { id: 'batumi' } } }, { rng, content: index, self: { name: 'Colt', flight: 3, position: 1 } })
    expect(fillTemplate('{af.name} Tower, {callsign|spoken}, {af.uhf}', vars)).toBe('Batumi Tower, Colt three one, 260.0')
    expect(fillTemplate('{af.uhf|spoken}', vars)).toBe('two six zero point zero')
  })
})

function allText(d: ResolvedDrill): string[] {
  const t = [d.prompt, d.explain ?? '']
  if (d.kind === 'choice') t.push(...d.options)
  if (d.kind === 'match') t.push(...d.left, ...d.right)
  if (d.kind === 'input') t.push(...d.accept)
  if (d.kind === 'build' || d.kind === 'anatomy') {
    for (const tr of d.exchange.transmissions) t.push(tr.speaker, ...tr.segments.map((s) => s.text + (s.note ?? '')))
  }
  if (d.kind === 'build') t.push(...d.tiles.map((x) => x.text))
  if (d.kind === 'cloze') for (const tr of d.exchange.transmissions) t.push(...tr.segments.map((s) => s.text))
  if (d.kind === 'sequence') t.push(...d.items.map((i) => i.label))
  if (d.kind === 'form') {
    t.push(d.context ?? '', ...d.fields.flatMap((f) => [f.label, ...f.accept]))
    if (d.exchange) for (const tr of d.exchange.transmissions) t.push(...tr.segments.map((s) => s.text))
  }
  return t
}

describe('Übungen', () => {
  it('lassen sich alle für viele Seeds auflösen – ohne übrig gebliebene Platzhalter', () => {
    for (const drill of index.drills.values()) {
      for (let i = 0; i < 25; i++) {
        const rng = createRng(`${drill.id}/${i}`)
        const env = { rng, content: index, self: randomSelf(rng, index) }
        const d = resolveDrill(drill, env)
        for (const text of allText(d)) expect(findPlaceholders(text), `${drill.id}: ${text}`).toEqual([])
        if (d.kind === 'choice') for (const c of d.correct) expect(d.options[c]).toBeDefined()
        if (d.kind === 'build') {
          expect(checkBuild(d.solution, d.solution)).toBe(true)
          for (const s of d.solution) expect(d.tiles.some((t) => t.text === s)).toBe(true)
        }
        if (d.kind === 'anatomy') expect(d.exchange.transmissions[d.transmission].segments.some((s) => s.role === d.target)).toBe(true)
      }
    }
    // Läuft über alle Übungen mit je 25 Seeds und braucht allein rund 1,5 s; bei Last wären die Standard-5 s zu knapp.
  }, 30_000)
  it('Funksprüche lösen sich vollständig auf', () => {
    for (const x of index.exchanges.values()) {
      const rng = createRng(x.id)
      const r = resolveExchange(x, { rng, content: index, self: randomSelf(rng, index) })
      for (const t of r.transmissions) for (const s of t.segments) expect(findPlaceholders(s.text)).toEqual([])
    }
  })
  it('Generatoren liefern eindeutige, lösbare Aufgaben', () => {
    for (const gen of ALL_GENERATORS) {
      for (let i = 0; i < 60; i++) {
        const rng = createRng(`${gen}/${i}`)
        const d = runGenerator(gen, {}, { rng, content: index, self: randomSelf(rng, index) })
        if (d.kind === 'choice') {
          expect(new Set(d.options).size, `${gen}: ${d.options.join(' | ')}`).toBe(d.options.length)
          expect(d.options.length).toBeGreaterThanOrEqual(3)
          expect(d.correct).toHaveLength(1)
          expect(d.correct[0]).toBeGreaterThanOrEqual(0)
        }
        if (d.kind === 'input') expect(matchesAny(d.accept[0], d.accept)).toBe(true)
      }
    }
  })
  it('number-to-spoken respektiert den gewünschten Zahlentyp', () => {
    for (const kind of NUMBER_KINDS) {
      const d = runGenerator('number-to-spoken', { kind }, { rng: createRng(kind), content: index, self: { name: 'Uzi', flight: 1, position: 1 } })
      expect(d.kind).toBe('choice')
    }
  })
})

describe('Fortschritt', () => {
  const m1 = index.modules.get('m1')!
  it('schaltet die erste Lektion frei und den Rest nacheinander', () => {
    expect(moduleState(index, EMPTY_PROGRESS, 'm1')).toBe('available')
    expect(lessonState(index, EMPTY_PROGRESS, m1.lessons[0])).toBe('available')
  })
  it('vergibt XP und merkt sich Ergebnisse', () => {
    const { progress, xpGained } = applyLessonResult(index, EMPTY_PROGRESS, m1.lessons[0], 1)
    expect(xpGained).toBe(index.lessons.get(m1.lessons[0])!.xp)
    expect(lessonState(index, progress, m1.lessons[0])).toBe('done')
    const again = applyLessonResult(index, progress, m1.lessons[0], 0.5)
    expect(again.xpGained).toBe(lessonXp(index.lessons.get(m1.lessons[0])!.xp, 0.5, false))
    expect(again.progress.lessons[m1.lessons[0]].bestScore).toBe(1)
  })
  it('Einstufungstest erledigt ein Modul', () => {
    const fail = applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 0.5)
    expect(fail.passed).toBe(false)
    expect(moduleState(index, fail.progress, 'm1')).toBe('available')
    const pass = applyPlacementResult(index, EMPTY_PROGRESS, 'm1', 1)
    expect(pass.passed).toBe(true)
    expect(moduleState(index, pass.progress, 'm1')).toBe('done')
  })
  it('berechnet Ränge', () => {
    expect(rankFor(index, EMPTY_PROGRESS).current.id).toBe('cadet')
    // Ränge ohne Checkride gibt es allein über XP (mit Checkride: siehe checkride.test.ts)
    const wingman = index.curriculum.ranks[1]
    if (!wingman.checkride) expect(rankFor(index, { ...EMPTY_PROGRESS, xp: wingman.xp + 50 }).current.id).toBe(wingman.id)
  })
})
