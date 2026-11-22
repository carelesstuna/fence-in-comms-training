/**
 * Tests für „Mehr dazu“: Zielauswahl je Rolle und Text, Prüfung der Ziele, Validator.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { ROLES } from './content/schema'
import { resolveExchange } from './drills/resolve'
import { buildGlossary, searchGlossary } from './glossary/glossary'
import { checkMoreTarget, isTopicTarget, moreForSegment } from './glossary/more'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'

const index = contentResult.index!
const g = buildGlossary(index.brevity, index.prowords, index.basics)
const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const contentFiles = () =>
  Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.replace(/^\//, ''), v]))

const more = (role: string, text: string, extra: { more?: { to: string; label: string } } = {}) =>
  moreForSegment({ role, text, ...extra }, index.roles, g)

describe('Ziele prüfen', () => {
  it('akzeptiert die Glossar-Ziele', () => {
    for (const to of [
      '/glossary',
      '/glossary?tab=brevity',
      '/glossary?tab=brevity&cat=sicht',
      '/glossary?tab=prowords',
      '/glossary?tab=alphabet',
      '/glossary?tab=basics&q=ATIS',
      '/glossary?q=angels',
      '/glossary?tab=brevity&q=picture+clean',
    ]) {
      expect(checkMoreTarget(to), to).toBeNull()
    }
  })

  it('lehnt fremde Adressen, unbekannte Seiten und Parameter ab', () => {
    expect(checkMoreTarget('https://example.org/')).toContain('mit „/“ beginnen')
    expect(checkMoreTarget('//example.org/glossary')).toContain('mit „/“ beginnen')
    expect(checkMoreTarget('glossary?tab=brevity')).toContain('mit „/“ beginnen')
    expect(checkMoreTarget('/hangar')).toContain('unbekannte Seite')
    expect(checkMoreTarget('/lesson/m1-l1')).toContain('unbekannte Seite')
    expect(checkMoreTarget('/glossary?sort=az')).toContain('unbekannter Parameter „sort“')
    expect(checkMoreTarget('/glossary?constructor=1')).toContain('unbekannter Parameter')
    expect(checkMoreTarget('/glossary#brevity:bogey-dope')).toContain('Anker')
    expect(checkMoreTarget('/glossary?q=picture clean')).toContain('Leerzeichen')
  })

  it('akzeptiert Themenseiten, wenn es sie gibt', () => {
    const ids = new Set(index.topics.keys())
    expect(ids.size).toBeGreaterThan(10)
    expect(checkMoreTarget('/wissen/atis-platzansage', ids)).toBeNull()
    expect(checkMoreTarget('/wissen/atc-oder-awacs', ids)).toBeNull()
    expect(checkMoreTarget('/wissen/gibt-es-nicht', ids)).toContain('Themenseite „gibt-es-nicht“ gibt es nicht')
    // Ohne Liste der Seiten gibt es keine
    expect(checkMoreTarget('/wissen/atis-platzansage')).toContain('gibt es nicht')
  })

  it('lehnt Themenseiten mit Parametern, Unterpfaden und der Übersicht ab', () => {
    const ids = new Set(index.topics.keys())
    expect(checkMoreTarget('/wissen/atis-platzansage?q=x', ids)).toContain('keine Parameter')
    expect(checkMoreTarget('/wissen/atis-platzansage/mehr', ids)).toContain('unbekannte Seite')
    expect(checkMoreTarget('/wissen/ATIS', ids)).toContain('unbekannte Seite')
    expect(checkMoreTarget('/wissen', ids)).toContain('unbekannte Seite')
    expect(checkMoreTarget('/wissen/atis-platzansage#x', ids)).toContain('Anker')
    expect(checkMoreTarget('/wissen/atis platzansage', ids)).toContain('Leerzeichen')
  })

  it('erkennt Themenseiten als Ziel, die im selben Fenster öffnen', () => {
    expect(isTopicTarget('/wissen/atis-platzansage')).toBe(true)
    expect(isTopicTarget('/glossary?tab=brevity')).toBe(false)
    expect(isTopicTarget('/wissen')).toBe(false)
  })

  it('prüft die Werte von tab und cat', () => {
    expect(checkMoreTarget('/glossary?tab=alle')).toContain('„alle“ ist kein gültiger Wert für tab')
    expect(checkMoreTarget('/glossary?tab=brevity&cat=gibtsnicht')).toContain(
      'kein gültiger Wert für cat',
    )
    expect(checkMoreTarget('/glossary?q=')).toContain('leer')
    expect(checkMoreTarget('/glossary?tab=brevity&tab=prowords')).toContain('doppelt')
    // Der Gruppen-Filter lässt sich nur im Brevity-Reiter wieder abschalten
    expect(checkMoreTarget('/glossary?cat=sicht')).toContain('nur zusammen mit tab=brevity')
    expect(checkMoreTarget('/glossary?tab=prowords&cat=sicht')).toContain(
      'nur zusammen mit tab=brevity',
    )
  })
})

describe('Standardziel je Rolle', () => {
  it('Brevity: Liste der Gruppe, wenn alle erkannten Codes in einer stehen', () => {
    expect(more('brevity', 'bogey dope')).toEqual({
      to: '/glossary?tab=brevity&cat=anfragen',
      label: 'Brevity-Gruppe Anfragen & Formate',
    })
    expect(more('brevity', 'tally two')).toEqual({
      to: '/glossary?tab=brevity&cat=sicht',
      label: 'Brevity-Gruppe Sicht & Kontakt',
    })
    // Zahlen und Rufzeichen im Teil ändern nichts, nur die erkannten Codes zählen
    expect(more('brevity', 'rolex plus 30')?.to).toBe('/glossary?tab=brevity&cat=ablauf')
  })

  it('Brevity: ganze Liste, wenn die Codes in mehreren Gruppen stehen oder keiner erkannt wird', () => {
    // PICTURE (Anfragen & Formate) + CLEAN (Identität & ROE)
    expect(more('brevity', 'picture clean')).toEqual({
      to: '/glossary?tab=brevity',
      label: 'alle Brevity-Codes',
    })
    expect(more('brevity', 'xyzzy')).toEqual({
      to: '/glossary?tab=brevity',
      label: 'alle Brevity-Codes',
    })
  })

  it('Standardwörter und Zahlenwerte', () => {
    expect(more('proword', 'say again')).toEqual({
      to: '/glossary?tab=prowords',
      label: 'alle Standardwörter',
    })
    expect(more('value', 'two six zero point zero')).toEqual({
      to: '/wissen/zahlen-im-funk',
      label: 'Zahlen im Funk',
    })
    expect(more('value', 'one four three zero Zulu')?.to).toBe('/wissen/zahlen-im-funk')
  })

  it('Zahlenwerte: Squawk und Höhen haben eigene Seiten', () => {
    expect(more('value', 'squawk four two one five')?.to).toBe('/wissen/squawk-transponder-iff')
    for (const text of ['altimeter two niner niner two', 'angels two five', 'cherubs five', 'flight level two five zero', 'QNH one zero one three', 'two five thousand']) {
      expect(more('value', text)?.to, text).toBe('/wissen/hoehen-und-hoehenmesser')
    }
    // Ein Wort, das nur so aussieht („thousands“ ist keins davon), und Kurse gehören zu den Zahlen
    expect(more('value', 'heading zero niner zero')?.to).toBe('/wissen/zahlen-im-funk')
  })

  it('Adressat: nur Flugsicherungs-Stellen führen zur Seite der ATC-Stellen', () => {
    for (const text of ['Nellis Ground', 'Creech Tower', 'Batumi Approach', 'Nellis Departure', 'Langen Center', 'Nellis Clearance Delivery']) {
      expect(more('addressee', text)?.to, text).toBe('/wissen/atc-stellen')
    }
    for (const text of ['Darkstar', 'Texaco', 'Viper one two', 'Chief']) expect(more('addressee', text), text).toBeNull()
  })

  it('Information: nur „information Romeo“ führt zur ATIS-Seite', () => {
    expect(more('info', 'information Romeo')?.to).toBe('/wissen/atis-platzansage')
    expect(more('info', 'Nellis information Alpha')?.to).toBe('/wissen/atis-platzansage')
    expect(more('info', 'Information Alpha')?.to).toBe('/wissen/atis-platzansage')
    expect(more('info', 'loud and clear')).toBeNull()
    expect(more('info', 'flight of two')).toBeNull()
  })

  it('Rollen ohne gutes Ziel bleiben ohne Link', () => {
    for (const role of ['addressee', 'callsign', 'position', 'intent', 'request', 'instruction']) {
      expect(more(role, 'radio check'), role).toBeNull()
    }
    for (const role of ['callsign', 'position', 'intent', 'request', 'instruction']) {
      expect(index.roles.get(role)?.more, role).toBeUndefined()
    }
  })

  it('jede Rolle ist entweder ohne Ziel oder hat ein gültiges', () => {
    const ids = new Set(index.topics.keys())
    for (const role of ROLES) {
      for (const standard of index.roles.get(role)?.more ?? []) expect(checkMoreTarget(standard.to, ids), role).toBeNull()
    }
  })

  it('bei einer Liste von Zielen gilt das erste, dessen when passt; eins ohne when steht am Ende', () => {
    for (const role of ROLES) {
      const list = index.roles.get(role)?.more ?? []
      list.slice(0, -1).forEach((m) => expect(m.when, `${role}: nur das letzte Ziel darf ohne when sein`).toBeDefined())
    }
  })
})

describe('Übersteuerung am Segment', () => {
  const own = { to: '/glossary?tab=brevity&q=angels', label: 'ANGELS und CHERUBS' }

  it('geht dem Standardziel der Rolle vor, auch bei Rollen ohne Standardziel', () => {
    expect(more('value', 'angels two five', { more: own })).toEqual(own)
    expect(more('intent', 'checking in', { more: own })).toEqual(own)
    expect(more('info', 'loud and clear', { more: own })).toEqual(own)
  })

  it('Brevity-Gruppe greift nicht in ein eigenes Ziel ein', () => {
    expect(more('brevity', 'bogey dope', { more: own })).toEqual(own)
  })
})

describe('more am Segment im Inhalt', () => {
  it('kommt aus dem Auflöser an und ersetzt das Standardziel', () => {
    const rng = createRng('mehr-dazu/angels')
    const x = resolveExchange(index.exchanges.get('m1-awacs-checkin-angels')!, {
      rng,
      content: index,
      self: randomSelf(rng, index),
    })
    const segs = x.transmissions.flatMap((t) => t.segments)
    const angels = segs.find((s) => s.text.startsWith('angels '))!
    expect(angels.role).toBe('value')
    expect(angels.more).toEqual({
      label: 'ATC oder AWACS – wer im Funk wofür zuständig ist',
      to: '/wissen/atc-oder-awacs',
    })
    expect(moreForSegment(angels, index.roles, g)).toEqual(angels.more)
    // Teile ohne eigenes more behalten das Standardziel ihrer Rolle
    const clean = segs.find((s) => s.role === 'brevity')!
    expect(clean.more).toBeUndefined()
    expect(moreForSegment(clean, index.roles, g)?.to).toMatch(/^\/glossary\?tab=brevity/)
  })

  it('Standardziele und Themenseiten im Inhalt: Rollweg → NATO-Alphabet, ATIS-Teil → ATIS-Seite, Squawk → Squawk-Seite', () => {
    const rng = createRng('mehr-dazu/seiten')
    const resolve = (id: string) =>
      resolveExchange(index.exchanges.get(id)!, { rng, content: index, self: randomSelf(rng, index) }).transmissions.flatMap((t) => t.segments)
    const taxi = resolve('m1-taxi-request').find((s) => s.text.startsWith('taxi via'))!
    expect(moreForSegment(taxi, index.roles, g)?.to).toBe('/wissen/nato-alphabet')
    const atis = resolve('m3-atis').find((s) => /information/.test(s.text))!
    expect(moreForSegment(atis, index.roles, g)?.to).toBe('/wissen/atis-platzansage')
    const addressee = resolve('m1-startup-request').find((s) => s.role === 'addressee' && /Ground/.test(s.text))!
    expect(moreForSegment(addressee, index.roles, g)?.to).toBe('/wissen/atc-stellen')
  })

  it('das Beispiel-Ziel zeigt auf passende Einträge', () => {
    const hits = searchGlossary(
      g.filter((e) => e.kind === 'brevity'),
      'angels',
    ).map((e) => e.word)
    // ANGELS steht vorn; CHERUBS erreicht man über „siehe“ auf der Karte von ANGELS
    expect(hits[0]).toBe('ANGELS')
    expect(index.brevity.find((e) => e.word === 'ANGELS')?.see).toContain('CHERUBS')
  })
})

describe('Validator', () => {
  const errorsOf = (files: Record<string, string>) =>
    buildContentIndex(files)
      .errors.map((e) => `${e.file}: ${e.message}`)
      .join('\n')

  it('die Inhalte sind gültig', () => {
    expect(contentResult.errors).toEqual([])
  })

  const withRole = (more: string) => {
    const files = contentFiles()
    files['content/glossary/roles.yaml'] +=
      `\n- { role: position, label: Position, question: "?", color: violet, more: ${more} }\n`
    return errorsOf(files)
  }

  it('meldet ein ungültiges Ziel in roles.yaml', () => {
    expect(withRole('{ label: Kaputt, to: "/hangar" }')).toContain(
      'Rolle "position": more – Ziel „/hangar“: unbekannte Seite',
    )
    expect(withRole('{ label: Kaputt, to: "/glossary?tab=alle" }')).toContain(
      'kein gültiger Wert für tab',
    )
    expect(withRole('{ label: Gut, to: "/glossary?tab=prowords" }')).toBe('')
  })

  it('prüft Themenseiten als Ziel: die Seite muss es geben', () => {
    expect(withRole('{ label: Gut, to: "/wissen/atis-platzansage" }')).toBe('')
    expect(withRole('{ label: Kaputt, to: "/wissen/gibt-es-nicht" }')).toContain(
      'Rolle "position": more – Ziel „/wissen/gibt-es-nicht“: Themenseite „gibt-es-nicht“ gibt es nicht',
    )
    expect(withRole('{ label: Kaputt, to: "/wissen/atis-platzansage?q=x" }')).toContain('keine Parameter')
  })

  it('nimmt in roles.yaml auch eine Liste von Zielen und prüft jedes', () => {
    expect(withRole('[{ label: A, to: "/wissen/atc-stellen", when: "tower" }, { label: B, to: "/glossary" }]')).toBe('')
    const bad = withRole('[{ label: A, to: "/wissen/atc-stellen", when: "tower" }, { label: B, to: "/wissen/nirgends" }]')
    expect(bad).toContain('Themenseite „nirgends“ gibt es nicht')
    expect(withRole('[]')).toContain('more')
  })

  it('meldet ein ungültiges Ziel an einem Segment (Funkspruch und Szenario)', () => {
    const call = contentFiles()
    call['content/calls/m1.yaml'] = call['content/calls/m1.yaml'].replace(
      'to: /wissen/atc-oder-awacs',
      'to: https://example.org/',
    )
    expect(errorsOf(call)).toContain(
      'Funkspruch "m1-awacs-checkin-angels", „angels {ang|spoken}“: more – Ziel „https://example.org/“',
    )

    const scenario = contentFiles()
    const file = 'content/scenarios/m4-s1-checkride-wingman.yaml'
    scenario[file] = scenario[file].replace(
      '{ text: picture clean, role: brevity }',
      '{ text: picture clean, role: brevity, more: { label: X, to: "/lesson/m1" } }',
    )
    expect(errorsOf(scenario)).toContain(
      '„picture clean“: more – Ziel „/lesson/m1“: unbekannte Seite',
    )

    const unknown = contentFiles()
    unknown['content/calls/m1.yaml'] = unknown['content/calls/m1.yaml'].replace(
      'role: value\n          more:',
      'role: value\n          more:\n            extra: 1',
    )
    expect(errorsOf(unknown)).toContain('more')

    const missing = contentFiles()
    missing['content/calls/m1.yaml'] = missing['content/calls/m1.yaml'].replace('to: /wissen/atc-oder-awacs', 'to: /wissen/gibt-es-nicht')
    expect(errorsOf(missing)).toContain('more – Ziel „/wissen/gibt-es-nicht“: Themenseite „gibt-es-nicht“ gibt es nicht')
  })

  it('meldet fehlende Felder, einen kaputten Ausdruck und unbekannte Schlüssel', () => {
    expect(withRole('{ label: Ohne Ziel }')).toContain('more.0.to')
    expect(withRole('{ to: "/glossary" }')).toContain('more.0.label')
    expect(withRole('{ label: Regex, to: "/glossary", when: "(" }')).toContain(
      'more.0.when: kein gültiger regulärer Ausdruck',
    )
    expect(withRole('{ label: X, to: "/glossary", extra: 1 }')).toContain('more.0: ')
  })
})
