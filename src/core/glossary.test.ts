/**
 * Tests für das Glossar: Inhalte, Suche, Nachschlagen, Erkennung in Funksprüchen, Validator.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { findTerms } from './content/parse'
import { buildGlossary, lookupTerm, norm, searchGlossary, termsForSegment, termsInText } from './glossary/glossary'

const index = contentResult.index!
const g = buildGlossary(index.brevity, index.prowords, index.basics)
const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('Glossar-Inhalte', () => {
  it('enthält Brevity und Standardwörter, Schlüssel sind eindeutig', () => {
    expect(index.brevity.length).toBeGreaterThan(100)
    expect(g.filter((e) => e.kind === 'proword').length).toBe(index.prowords.length)
    expect(new Set(g.map((e) => e.key)).size).toBe(g.length)
  })

  it('jeder Verweis führt zu einem Eintrag', () => {
    for (const e of g) for (const s of e.see) expect(lookupTerm(g, s), `${e.word} → ${s}`).toBeDefined()
  })

  it('jeder Funkspruch-Teil mit Rolle brevity oder proword steht im Glossar', () => {
    const missing: string[] = []
    const visit = (segs: readonly { text: string; role: string }[] | undefined, where: string) => {
      for (const s of segs ?? []) {
        if (s.role !== 'brevity' && s.role !== 'proword') continue
        const text = s.text.replace(/\{[^}]+\}/g, ' ').trim() // Platzhalter werden erst beim Würfeln zu Wörtern
        if (!text) continue
        const pool = g.filter((e) => e.kind === (s.role === 'brevity' ? 'brevity' : 'proword'))
        if (termsInText(pool, text).length === 0) missing.push(`${where}: ${s.role} „${s.text}“`)
      }
    }
    for (const x of index.exchanges.values()) for (const t of x.transmissions) visit(t.segments, x.id)
    for (const sc of index.scenarios.values()) {
      for (const st of sc.steps) {
        for (const t of [...st.hear, ...st.reply]) visit(t.segments, sc.id)
        visit(st.you?.transmission.segments, sc.id)
      }
    }
    expect(missing, 'Bitte in content/glossary/brevity.yaml bzw. prowords.yaml ergänzen').toEqual([])
  })
})

describe('Nachschlagen und Suche', () => {
  it('findet Begriffe unabhängig von Schreibweise, Brevity vor Standardwort', () => {
    expect(lookupTerm(g, 'bogey dope')?.word).toBe('BOGEY DOPE')
    expect(lookupTerm(g, 'Fox 3')?.word).toBe('FOX THREE')
    expect(lookupTerm(g, 'spike')?.word).toBe('SPIKED')
    // BREAK gibt es zweimal: als Brevity (Kurve) und als Standardwort (Trennung)
    expect(lookupTerm(g, 'break')?.kind).toBe('brevity')
    expect(lookupTerm(g, 'break', 'proword')?.kind).toBe('proword')
    expect(lookupTerm(g, 'gibt es nicht')).toBeUndefined()
  })

  it('Treffer im Begriff stehen vor Treffern in der Erklärung', () => {
    const hits = searchGlossary(g, 'bogey')
    expect(hits[0].word).toBe('BOGEY')
    expect(hits.map((e) => e.word)).toContain('BOGEY DOPE')
    expect(hits.map((e) => e.word)).toContain('DECLARE') // nur in der Erklärung
    expect(hits.findIndex((e) => e.word === 'DECLARE')).toBeGreaterThan(hits.findIndex((e) => e.word === 'BOGEY DOPE'))
  })

  it('sucht auch auf Deutsch, ohne Umlaute und mit mehreren Wörtern', () => {
    expect(searchGlossary(g, 'Treibstoff').map((e) => e.word)).toEqual(expect.arrayContaining(['JOKER', 'BINGO']))
    expect(searchGlossary(g, 'ruckflug').map((e) => e.word)).toContain('BINGO') // „Rückflug“
    expect(searchGlossary(g, 'rakete infrarot').map((e) => e.word)).toEqual(['FOX TWO'])
    expect(searchGlossary(g, '').length).toBe(g.length)
    expect(searchGlossary(g, 'xyzzy')).toEqual([])
  })

  it('normalisiert Satzzeichen und Akzente', () => {
    expect(norm('  POP-UP! ')).toBe('pop up')
    expect(norm('Rückflug')).toBe('ruckflug')
  })
})

describe('Mehrdeutige Wörter (Begriffs-Audit S-23)', () => {
  it('„break“ trennt Teile einer Nachricht, „break break“ Nachrichten an verschiedene Flugzeuge (ICAO), keine dringende Meldung', () => {
    const brk = lookupTerm(g, 'break', 'proword')!
    const brkbrk = lookupTerm(g, 'break break', 'proword')!
    expect(brk.meaning).toContain('Teile einer Nachricht')
    expect(brkbrk.meaning).toContain('verschiedene Flugzeuge')
    expect(`${brk.meaning} ${brkbrk.meaning}`).not.toMatch(/dringende/)
    expect(brkbrk.note).toContain('Praxis')
  })

  it('„check“ führt die Funkprobe und den Ops Check neben der Kursänderung', () => {
    const check = lookupTerm(g, 'CHECK')!
    expect(check.kind).toBe('brevity')
    expect(check.meaning).toContain('Gradzahl')
    expect(check.note).toContain('Funkprobe')
    expect(check.see).toEqual(expect.arrayContaining(['radio check', 'Ops Check']))
    expect(lookupTerm(g, 'radio check')).toMatchObject({ kind: 'proword' })
  })

  it('„contact“: Brevity-Wort (Sensorkontakt) und Flugsicherung (Frequenzwechsel) sind getrennte Einträge', () => {
    expect(lookupTerm(g, 'contact')).toMatchObject({ kind: 'brevity', word: 'CONTACT' })
    const atc = lookupTerm(g, 'contact (Flugsicherung)')
    expect(atc).toMatchObject({ kind: 'proword' })
    expect(atc!.meaning).toContain('Frequenz')
    expect(lookupTerm(g, 'CONTACT')!.see).toContain('contact (Flugsicherung)')
  })

  it('BINGO schließt die Landereserve ein, JOKER meint das Lösen vom Gefecht (SEPARATE), nicht Abstand', () => {
    expect(lookupTerm(g, 'BINGO')!.meaning).toContain('Landung')
    expect(lookupTerm(g, 'BINGO')!.meaning).not.toMatch(/gerade noch/)
    const joker = lookupTerm(g, 'JOKER')!
    expect(joker.meaning).toContain('SEPARATE')
    expect(joker.see).toEqual(expect.arrayContaining(['SEPARATE', 'BUGOUT']))
    expect(lookupTerm(g, 'SEPARATE')!.note).toContain('SEPARATION')
    expect(lookupTerm(g, 'TIGER')!.meaning).toContain('Commit')
  })
})

describe('Erkennung in Funksprüchen', () => {
  it('längster Treffer zuerst, ohne Überlappung, in Reihenfolge', () => {
    const brev = g.filter((e) => e.kind === 'brevity')
    expect(termsInText(brev, 'Darkstar, Viper 1-1, bogey dope').map((e) => e.word)).toEqual(['BOGEY DOPE'])
    expect(termsInText(brev, 'group BRAA 270/25, hot, hostile').map((e) => e.word)).toEqual(['GROUP', 'BRAA', 'HOT', 'HOSTILE'])
    expect(termsInText(brev, 'fox 3 fox three').map((e) => e.word)).toEqual(['FOX THREE'])
  })

  it('je nach Rolle: Brevity-Teile vollständig, andere nur als ganzer Begriff', () => {
    expect(termsForSegment(g, 'tally two', 'brevity').map((e) => e.word)).toEqual(['TALLY'])
    expect(termsForSegment(g, 'say again', 'proword').map((e) => e.word)).toEqual(['say again'])
    expect(termsForSegment(g, 'fence in', 'instruction').map((e) => e.word)).toEqual(['FENCE IN'])
    // „in“ in einem normalen Satz ist kein Brevity-Code
    expect(termsForSegment(g, 'runway one three in use', 'info')).toEqual([])
  })
})

describe('Validator', () => {
  it(':term[…] im Text wird gefunden und geprüft', () => {
    expect(findTerms('Melde :term[tally] oder :term[no joy]. Uhrzeit 14:30, a:term[x]')).toEqual(['tally', 'no joy'])
    const files: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) files[k.replace(/^\//, '')] = v
    files['content/hangar/zz-test.md'] = '---\nid: zz-test\ntitle: T\ncategory: praxis\nteaser: T\n---\nDu meldest :term[tally]. Und :term[kantine].\n'
    files['content/glossary/brevity.yaml'] += '\n- { word: TALLY, meaning: doppelt, category: sicht, see: [GIBTSNICHT] }\n'
    const msgs = buildContentIndex(files).errors.map((e) => e.message).join('\n')
    expect(msgs).toContain(':term[kantine]: Begriff steht nicht im Glossar')
    expect(msgs).not.toContain(':term[tally]')
    expect(msgs).toContain('"TALLY" kommt doppelt vor')
    expect(msgs).toContain('Verweis "GIBTSNICHT" gibt es im Glossar nicht')
  })
})
