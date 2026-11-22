/**
 * Tests für die Themenseiten (content/topics): Schema, Loader, Validator, Verlinkung aus Lektionen und Glossar.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { findInternalLinks } from './content/parse'
import { topicMetaSchema } from './content/schema'
import { buildGlossary, lookupTerm, topicForEntry } from './glossary/glossary'
import { readSavedRun } from '../features/lesson/savedRun'

const index = contentResult.index!
const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function files(extra: Record<string, string> = {}): Record<string, string> {
  const f: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) f[k.replace(/^\//, '')] = v
  return { ...f, ...extra }
}

function topicFile(
  id: string,
  over: Partial<Record<string, string>> = {},
  body = 'Text.\n',
): string {
  const meta: Record<string, string | undefined> = {
    id,
    title: 'T',
    summary: 'S',
    sources: '\nsources:\n  - title: Quelle',
    ...over,
  }
  return `---\nid: ${meta.id}\ntitle: ${meta.title}\nsummary: ${meta.summary}${meta.terms ? `\nterms: ${meta.terms}` : ''}${meta.sources}\n---\n${body}`
}

function errorsOf(extra: Record<string, string>): string {
  return buildContentIndex(files(extra))
    .errors.map((e) => `${e.file}: ${e.message}`)
    .join('\n')
}

describe('Themenseiten im Inhalt', () => {
  it('die ersten Seiten sind da, geprüft und eindeutig', () => {
    expect(contentResult.errors).toEqual([])
    expect([...index.topics.keys()]).toEqual(
      expect.arrayContaining([
        'atc-oder-awacs',
        'atc-stellen',
        'atis-platzansage',
        'hoehen-und-hoehenmesser',
        'navigationshilfen',
        'brevity-und-prowords',
        'comm-plan-und-missionsunterlagen',
        'frequenzbaender-und-reichweite',
        'funkgeraet-bedienen',
        'guard-und-notfunk',
        'jtac-und-luftnahunterstuetzung',
        'regelwerke-icao-faa-atp',
        'nato-alphabet',
        'zahlen-im-funk',
        'squawk-transponder-iff',
      ]),
    )
    for (const t of index.topics.values()) {
      expect(t.file).toBe(`content/topics/${t.id}.md`)
      expect(t.sources.length, t.id).toBeGreaterThan(0)
      expect(t.markdown.length, t.id).toBeGreaterThan(500)
    }
  })

  it('jeder Begriff einer Seite steht im Glossar und führt zurück auf diese Seite', () => {
    const g = buildGlossary(index.brevity, index.prowords, index.basics)
    for (const t of index.topics.values()) {
      for (const term of t.terms) {
        const entry = lookupTerm(g, term)
        expect(entry, `${t.id}: ${term}`).toBeDefined()
        expect(topicForEntry(entry!, index.topics.values()), `${t.id}: ${term}`).toBe(t.id)
      }
    }
  })

  it('die neuen Grundbegriffe verweisen ausdrücklich auf ihre Seite', () => {
    const topicOfWord = (w: string) => index.basics.find((b) => b.word === w)?.topic
    for (const w of ['Tower', 'Ground', 'Approach', 'Departure', 'Center', 'Clearance Delivery'])
      expect(topicOfWord(w), w).toBe('atc-stellen')
    expect(topicOfWord('Transponder')).toBe('squawk-transponder-iff')
  })

  it('das Standardwort „standby“ führt nicht auf die Transponder-Seite', () => {
    const g = buildGlossary(index.brevity, index.prowords, index.basics)
    expect(topicForEntry(lookupTerm(g, 'standby')!, index.topics.values())).toBeUndefined()
  })

  it('die Lektionen verlinken an den Erstnennungen auf die Seiten', () => {
    const text = (id: string) =>
      index.lessons
        .get(id)!
        .steps.flatMap((s) => (s.kind === 'read' ? [s.markdown] : []))
        .join('\n')
    expect(text('m1-l3')).toContain('(/wissen/atc-oder-awacs)')
    expect(text('m1-l3')).toContain('(/wissen/atc-stellen)')
    expect(text('m1-l3')).toContain(':term[ATC]')
    expect(text('m1-l6')).toContain('(/wissen/squawk-transponder-iff)')
    expect(text('m2-l6')).toContain('(/wissen/atc-stellen)')
    expect(text('m3-l3')).toContain('(/wissen/squawk-transponder-iff)')
    expect(text('m3-l6')).toContain('(/wissen/squawk-transponder-iff)')
  })

  it('„Wo dir das begegnet“ nennt nur Lektionen, die es gibt (Validator), und mindestens drei', () => {
    for (const t of index.topics.values()) {
      const lessons = findInternalLinks(t.markdown).filter((l) => l.startsWith('/lesson/'))
      expect(lessons.length, t.id).toBeGreaterThanOrEqual(3)
      for (const l of lessons)
        expect(index.lessons.has(l.slice('/lesson/'.length)), `${t.id}: ${l}`).toBe(true)
    }
  })
})

describe('Schema', () => {
  const ok = { id: 'x-y', title: 'T', summary: 'S', sources: [{ title: 'Q' }] }

  it('nimmt eine minimale Seite an und setzt Standardwerte', () => {
    const t = topicMetaSchema.parse(ok)
    expect(t.layer).toBe('core')
    expect(t.terms).toEqual([])
  })

  it('verlangt Quelle, gültige ID, bekannte Epoche und Ebene und keine fremden Felder', () => {
    expect(topicMetaSchema.safeParse({ ...ok, sources: [] }).success).toBe(false)
    expect(topicMetaSchema.safeParse({ ...ok, id: 'Groß Klein' }).success).toBe(false)
    expect(topicMetaSchema.safeParse({ ...ok, era: 'korea' }).success).toBe(false)
    expect(topicMetaSchema.safeParse({ ...ok, layer: 'geheim' }).success).toBe(false)
    expect(
      topicMetaSchema.safeParse({ ...ok, sources: [{ title: 'Q', url: 'kein-link' }] }).success,
    ).toBe(false)
    expect(topicMetaSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false)
    expect(
      topicMetaSchema.safeParse({ ...ok, era: 'cold-war', layer: 'community', terms: ['IFF'] })
        .success,
    ).toBe(true)
  })
})

/**
 * Ein einziger Aufbau des Inhaltsindex mit allen fehlerhaften Beispieldateien: Der Aufbau kostet jedes Mal
 * ein bis zwei Sekunden und würde sonst andere Tests ausbremsen, wenn die Testdateien parallel laufen.
 */
const BAD_LINKS =
  '[a](/wissen/gibts-nicht) [b](/lesson/zz) [c](/foo) [d](/wissen/atc-stellen/x) [e](/hangar/x)'
const GOOD_LINKS =
  '[a](/wissen) [b](/lesson/m1-l1) [c](/hangar) [d](/glossary?tab=brevity&cat=kontrolle) [e](/wissen/atc-stellen?x=1) [f](/wissen/squawk-transponder-iff)'
const LESSON_PATH = 'content/lessons/m1/03-zahlen.md'

let combined: string | null = null
function allErrors(): string {
  combined ??= errorsOf({
    'content/topics/zz-ohne.md': topicFile('zz-ohne', { sources: '\nsources: []' }),
    'content/topics/zz-name.md': topicFile('zz-anders'),
    'content/topics/zz-doppelt.md': topicFile('atc-stellen'),
    'content/topics/zz-a.md': topicFile('zz-a', { terms: '[Kantine, Tower]' }),
    'content/topics/zz-b.md': topicFile('zz-b', { terms: '[SPADES]' }),
    'content/topics/zz-drill.md': topicFile('zz-drill', {}, '::drill{id=m1-l1-order}\n'),
    'content/topics/zz-term.md': topicFile(
      'zz-term',
      {},
      'Siehe :term[kantine] und ::call{id=gibts-nicht}.\n',
    ),
    'content/topics/zz-bad.md': topicFile('zz-bad', {}, BAD_LINKS + '\n'),
    'content/topics/zz-ok.md': topicFile('zz-ok', {}, 'Siehe ' + GOOD_LINKS + '\n'),
    'content/hangar/zz-link.md':
      '---\nid: zz-link\ntitle: T\ncategory: praxis\nteaser: T\n---\n' + BAD_LINKS + '\n',
    [LESSON_PATH]: raw['/' + LESSON_PATH] + '\n\n[kaputt](/wissen/gibts-nicht)\n',
  })
  return combined
}

describe('Validator: Themenseiten', { timeout: 60_000 }, () => {
  it('meldet fehlende Quellen und einen Dateinamen, der nicht zur ID passt', () => {
    expect(allErrors()).toContain('Eine Themenseite braucht mindestens eine Quelle')
    expect(allErrors()).toContain(
      'Dateiname und id passen nicht zusammen (erwartet: content/topics/zz-anders.md)',
    )
  })

  it('meldet doppelte IDs', () => {
    expect(allErrors()).toContain('Themenseite "atc-stellen" ist doppelt')
  })

  it('meldet unbekannte und doppelt vergebene Begriffe', () => {
    expect(allErrors()).toContain('terms: "Kantine" steht nicht im Glossar')
    expect(allErrors()).toContain(
      'terms: "Tower" verweist im Glossar auf die Themenseite "atc-stellen", nicht auf diese',
    )
    expect(allErrors()).toContain('terms: "SPADES" gehört schon zur Themenseite')
  })

  it('meldet ein Glossar-topic, das es nicht gibt', () => {
    const basics =
      raw['/content/glossary/basics.yaml'] +
      '\n- { word: Kantine, meaning: Essen, topic: gibts-nicht }\n'
    expect(errorsOf({ 'content/glossary/basics.yaml': basics })).toContain(
      'Kantine: Themenseite "gibts-nicht" gibt es nicht',
    )
  })

  it('erlaubt in Themenseiten keine ganzseitigen Lektions-Bausteine', () => {
    expect(allErrors()).toContain('::drill gibt es nur auf Lektionsseiten')
  })

  it('prüft :term[…] und Bausteine im Text wie überall', () => {
    expect(allErrors()).toContain(':term[kantine]: Begriff steht nicht im Glossar')
    expect(allErrors()).toContain('::call: Funkspruch "gibts-nicht" existiert nicht')
  })

  it('akzeptiert eine gültige neue Seite', () => {
    expect(allErrors()).not.toContain('zz-ok.md')
  })
})

describe('Verweise im Markdown ([Text](/wissen/…))', { timeout: 60_000 }, () => {
  it('findInternalLinks findet nur Verweise in der App', () => {
    expect(
      findInternalLinks(
        'A [x](/wissen/atc-stellen), [y](/lesson/m1-l1?a=1), [z](https://example.org/a), [w](//example.org), [v](#anker), ![i](/bild.png)',
      ),
    ).toEqual(['/wissen/atc-stellen', '/lesson/m1-l1?a=1', '/bild.png'])
  })

  it('Hangar-Karten, Themenseiten und Lektionen: kaputte Ziele werden gemeldet', () => {
    const errors = allErrors()
    const lines = errors.split('\n')
    for (const m of [
      'Link (/wissen/gibts-nicht): Themenseite "gibts-nicht" gibt es nicht',
      'Link (/lesson/zz): Lektion "zz" gibt es nicht',
      'Link (/foo): unbekanntes Ziel',
      'Link (/wissen/atc-stellen/x): unbekanntes Ziel',
      'Link (/hangar/x): unbekanntes Ziel',
    ]) {
      // in der Hangar-Karte, in der Themenseite und (nur der erste) in der Lektion
      expect(
        lines.filter((l) => l.startsWith('content/hangar/zz-link.md') && l.includes(m)),
        m,
      ).toHaveLength(1)
      expect(
        lines.filter((l) => l.startsWith('content/topics/zz-bad.md') && l.includes(m)),
        m,
      ).toHaveLength(1)
    }
    expect(errors).toContain(
      `${LESSON_PATH}: Link (/wissen/gibts-nicht): Themenseite "gibts-nicht" gibt es nicht`,
    )
  })

  it('erlaubt die Übersicht, Lektionen, Hangar und Glossar mit Parametern', () => {
    expect(allErrors()).not.toContain('zz-ok.md')
  })
})

describe('topicForEntry', () => {
  const g = buildGlossary(index.brevity, index.prowords, index.basics)
  const topics = [
    { id: 'eins', terms: ['SQUAWK', 'Delivery'] },
    { id: 'zwei', terms: ['squawk'] },
  ]

  it('das topic des Eintrags geht vor', () => {
    expect(topicForEntry({ ...lookupTerm(g, 'SQUAWK')!, topic: 'x' }, topics)).toBe('x')
  })

  it('sonst gilt die erste Seite, die den Begriff oder eine Schreibweise nennt', () => {
    expect(topicForEntry(lookupTerm(g, 'SQUAWK')!, topics)).toBe('eins')
    // „Delivery“ ist eine Schreibweise von „Clearance Delivery“ (ohne dessen eigenes topic)
    expect(
      topicForEntry({ ...lookupTerm(g, 'Clearance Delivery')!, topic: undefined }, topics),
    ).toBe('eins')
  })

  it('ohne Treffer: undefined', () => {
    expect(topicForEntry(lookupTerm(g, 'roger')!, topics)).toBeUndefined()
    expect(topicForEntry(lookupTerm(g, 'roger')!, [])).toBeUndefined()
  })
})

describe('Zwei Bedeutungen im Glossar', () => {
  const g = buildGlossary(index.brevity, index.prowords, index.basics)

  it('„monitor“ ist das Brevity-Wort, der Frequenzwechsel hat einen eigenen Eintrag', () => {
    expect(lookupTerm(g, 'monitor')).toMatchObject({ kind: 'brevity', word: 'MONITOR' })
    expect(lookupTerm(g, 'monitoring')).toMatchObject({ kind: 'brevity', word: 'MONITOR' })
    const atc = lookupTerm(g, 'monitor (Flugsicherung)')
    expect(atc).toMatchObject({ kind: 'basic' })
    expect(topicForEntry(atc!, index.topics.values())).toBe('atc-stellen')
    // Das Brevity-Wort gehört nicht zur ATC-Seite
    expect(topicForEntry(lookupTerm(g, 'MONITOR')!, index.topics.values())).toBeUndefined()
  })

  it('PACKAGE nennt auch das Force Package', () => {
    expect(lookupTerm(g, 'PACKAGE')?.note).toContain('Force Package')
  })
})

describe('Stand der Lektion beim Zurückkommen', () => {
  it('liest einen gültigen Stand aus dem Router-State', () => {
    expect(
      readSavedRun({ lessonRun: { seed: '4242', step: 3, results: { 1: 1, 2: 0.5 } } }),
    ).toEqual({ seed: '4242', step: 3, results: { 1: 1, 2: 0.5 } })
    expect(readSavedRun({ lessonRun: { seed: 'a', step: 0 } })).toEqual({
      seed: 'a',
      step: 0,
      results: {},
    })
  })

  it('verwirft alles, was nicht passt', () => {
    expect(readSavedRun(null)).toBeNull()
    expect(readSavedRun(undefined)).toBeNull()
    expect(readSavedRun({})).toBeNull()
    expect(readSavedRun({ lessonRun: { seed: 7, step: 1 } })).toBeNull()
    expect(readSavedRun({ lessonRun: { seed: 'a', step: -1 } })).toBeNull()
    expect(readSavedRun({ lessonRun: { seed: 'a', step: 1.5 } })).toBeNull()
    expect(readSavedRun({ lessonRun: { seed: 'a', step: 1, results: { x: 1, 2: 'ja' } } })).toEqual(
      { seed: 'a', step: 1, results: {} },
    )
  })
})
