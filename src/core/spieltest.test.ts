/**
 * Inhalte aus dem Spieltest (docs/todo-spieltest.md): S-09 Frequenz und Band, S-10 und S-11 Begriffe in
 * Modul 2, Lektion 1, dazu die korrigierten Verweise zwischen Lektionen.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'
import { resolveDrill } from './drills/resolve'
import { buildGlossary, lookupTerm } from './glossary/glossary'
import { matchesAny } from './phraseology/normalize'

const index = contentResult.index!

/** Alle Lesetexte einer Lektion, Seiten durch eine Trennlinie getrennt. */
const lessonText = (id: string) =>
  index.lessons
    .get(id)!
    .steps.flatMap((s) => (s.kind === 'read' ? [s.markdown] : []))
    .join('\n---\n')

describe('S-09: Frequenz und Gerät beim Übergeben (fox mike, uniform, victor)', () => {
  // Pro Gerät: Übung, Frequenzmuster, richtige und falsche Antworten im Gerätefeld
  const faelle = [
    {
      id: 'm2-l1-input-fm',
      freq: /^\d{2}\.\d{1,2}$/,
      richtig: ['VHF-FM', 'vhf fm', 'FM', 'fox mike'],
      falsch: ['UHF', 'uniform', 'VHF-AM', 'victor', 'AM', ''],
    },
    {
      id: 'm2-l1-input-uniform',
      freq: /^\d{3}\.\d{1,2}$/,
      richtig: ['UHF', 'uhf', 'UHF-AM', 'uniform'],
      falsch: ['VHF', 'VHF-AM', 'victor', 'FM', 'fox mike', 'AM', ''],
    },
    {
      id: 'm2-l1-input-victor',
      freq: /^\d{3}\.\d{1,2}$/,
      richtig: ['VHF', 'VHF-AM', 'vhf am', 'victor'],
      falsch: ['UHF', 'uniform', 'VHF-FM', 'FM', 'fox mike', 'AM', ''],
    },
  ]

  it.each(faelle)(
    '$id fragt Gerät und Frequenz in zwei Feldern ab',
    ({ id, freq, richtig, falsch }) => {
      const drill = index.drills.get(id)!
      for (let i = 0; i < 20; i++) {
        const rng = createRng(`${id}/${i}`)
        const d = resolveDrill(drill, { rng, content: index, self: randomSelf(rng, index) })
        expect(d.kind).toBe('form')
        if (d.kind !== 'form') return
        expect(d.prompt).not.toMatch(/als Zahl/)
        expect(d.fields.map((f) => f.label)).toEqual(['Funkgerät / Band', 'Frequenz (MHz)'])
        const [band, frequenz] = d.fields
        expect(frequenz.accept[0]).toMatch(freq)
        // richtig: Gerät in den üblichen Schreibweisen, Frequenz als Zahl oder gesprochen
        for (const g of richtig) expect(matchesAny(g, band.accept), g).toBe(true)
        for (const f of frequenz.accept) expect(matchesAny(f, frequenz.accept)).toBe(true)
        // falsch: die anderen Geräte und eine fremde Frequenz
        for (const g of falsch) expect(matchesAny(g, band.accept), g).toBe(false)
        expect(matchesAny('999.9', frequenz.accept)).toBe(false)
      }
    },
  )

  it('die Lektion stellt alle drei Übungen', () => {
    const ids = index.lessons
      .get('m2-l1')!
      .steps.flatMap((s) => (s.kind === 'drill' ? [s.drillId] : []))
    for (const { id } of faelle) expect(ids, id).toContain(id)
  })
})

describe('S-10 und S-11: Begriffe in Modul 2, Lektion 1', () => {
  const glossary = buildGlossary(index.brevity, index.prowords, index.basics)
  const text = lessonText('m2-l1')

  it('Preset, Guard und JTAC stehen im Glossar, Preset als eigener Eintrag', () => {
    for (const w of ['Preset', 'Presets', 'Guard', 'JTAC', 'GRCV', 'SQCH', 'AUX'])
      expect(lookupTerm(glossary, w), w).toBeTruthy()
    expect(lookupTerm(glossary, 'Preset')).toMatchObject({ kind: 'basic', word: 'Preset' })
    expect(lookupTerm(glossary, 'Presets')?.word).toBe('Preset')
    expect(lookupTerm(glossary, 'channel')?.word).toBe('Kanal')
  })

  it('JTAC ist beim ersten Vorkommen verlinkt und erklärt', () => {
    const first = text.search(/JTAC/)
    expect(text.slice(first - 6, first)).toBe(':term[')
    expect(text.slice(first, first + 200)).toMatch(
      /Fliegerleitoffizier am Boden, der (?::term\[)?Luftnahunterstützung\]? führt/,
    )
  })

  it('der Absatz zu Presets und Guard steht vor den Flugzeug-Kästen', () => {
    const intro = text.indexOf('**:term[Presets]** sind im Funkgerät gespeicherte Frequenzen')
    expect(intro).toBeGreaterThan(0)
    expect(text.slice(intro, intro + 400)).toMatch(
      /:term\[Guard\]\*\* ist die Notfrequenz, 243\.0 MHz auf UHF und 121\.5 MHz/,
    )
    expect(intro).toBeLessThan(text.indexOf(':::aircraft'))
  })

  it('in den Kästen sind Presets, Guard, GRCV, SQCH und AUX beim ersten Vorkommen antippbar', () => {
    const boxes = [...text.matchAll(/:::(?:aircraft|era)\{[^}]*\}\n([\s\S]*?)\n:::/g)].map(
      (m) => m[1],
    )
    expect(boxes.length).toBeGreaterThan(10)
    let geprueft = 0
    for (const box of boxes) {
      for (const wort of ['Presets?', 'Guard', 'GRCV', 'SQCH', 'AUX']) {
        const first = box.search(new RegExp(`\\b${wort}\\b`))
        if (first < 0) continue
        geprueft++
        expect(box.slice(Math.max(0, first - 6), first), `${wort} in: ${box.slice(0, 30)}`).toBe(
          ':term[',
        )
      }
    }
    expect(geprueft).toBeGreaterThan(14)
    // BMS-Kasten: das zweite UHF-Gerät der Eagle heißt „AUX“
    expect(text).toMatch(/COM 2 \(„:term\[AUX\]“\)/)
  })

  it('MAIN/BOTH, LOAD und AUX sind im Kasten selbst erklärt', () => {
    expect(text).toMatch(
      /\*\*BOTH\*\* \(Hauptempfänger und Guard\) statt \*\*MAIN\*\* \(nur der Hauptempfänger\)/,
    )
    expect(text).toMatch(/die Taste \*\*LOAD\*\* \(Speichern\)/)
    expect(text).toMatch(/:term\[AUX\]-Empfänger\*\* \(Zusatzempfänger\)/)
  })
})

describe('Verweise zwischen Lektionen', () => {
  it('Funkhorizont: Hangar-Karte in Modul 1, Lektion 5 (nicht doppelt in M2-L5)', () => {
    const text = lessonText('m2-l1')
    expect(text).toMatch(/Funkhorizont \(Hangar-Karte in Modul 1, Lektion 5\)/)
    expect(index.lessons.get('m1-l7')!.steps.some((s) => s.kind === 'hangar' && s.cardId === 'funkhorizont')).toBe(true)
    expect(index.lessons.get('m2-l5')!.steps.some((s) => s.kind === 'hangar' && s.cardId === 'funkhorizont')).toBe(false)
  })

  it('ATIS wird in Modul 3, Lektion 1 erklärt (nicht in der nächsten Lektion von Modul 1)', () => {
    const text = lessonText('m1-l1')
    expect(text).not.toMatch(/Mehr dazu in der nächsten Lektion/)
    expect(text).toMatch(/Modul 3, Lektion 1/)
    expect(index.lessons.get('m3-l1')!.title).toMatch(/ATIS/i)
  })
})
