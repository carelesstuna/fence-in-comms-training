/**
 * Flugzeuge und Epochen: Liste in content/pools/aircraft.yaml, Profilauswahl, Epochen-Kästen,
 * Würfelpool und Validator.
 */
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { buildContentIndex } from './content/index'
import { contentResult } from '../content'
import { aircraftByEra, eraRelevant, erasOf, knownAircraft, ERA_ORDER } from './content/aircraft'
import { ERAS } from './content/schema'
import { createRng } from './random/rng'
import { resolveVars } from './random/vars'

const index = contentResult.index!
const types = index.aircraftTypes
const self = { name: 'Colt', flight: 4, position: 1 }

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function buildWith(extra: Record<string, unknown>) {
  const files = { ...raw }
  for (const [path, data] of Object.entries(extra)) files[path] = typeof data === 'string' ? data : stringify(data)
  return buildContentIndex(files)
}

describe('Flugzeugliste', () => {
  it('enthält weiter alle IDs, die gespeicherte Profile schon kennen', () => {
    const ids = types.map((t) => t.id)
    for (const id of ['fa18', 'f16', 'f14', 'f4', 'a10', 'f15e', 'ah64', 'f86', 'mig15']) expect(ids).toContain(id)
  })

  it('hat je Epoche eigene Muster und genau einen Sammel-Eintrag', () => {
    for (const era of ERAS) {
      const inEra = types.filter((t) => t.era === era)
      expect(inEra.filter((t) => !t.group).length).toBeGreaterThan(0)
      expect(inEra.filter((t) => t.group)).toHaveLength(1)
    }
  })

  it('jedes eigene Muster hat einen Rufnamen für den Funk', () => {
    for (const t of types.filter((t) => !t.group)) expect(t.radio, t.id).toBeTruthy()
  })
})

describe('Profilauswahl nach Epoche', () => {
  it('ordnet Moderne, Kalter Krieg, 2. Weltkrieg', () => {
    const groups = aircraftByEra(types, { sims: [], selected: [] })
    expect(groups.map((g) => g.era)).toEqual([...ERA_ORDER])
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(types.length)
  })

  it('zeigt nur Muster der gewählten Sims – und immer die schon gewählten', () => {
    const groups = aircraftByEra(types, { sims: ['il2', 'srs'], selected: ['f16'] })
    const shown = groups.flatMap((g) => g.items)
    expect(shown.some((t) => t.id === 'f16')).toBe(true)
    expect(shown.some((t) => t.id === 'fa18')).toBe(false)
    for (const t of shown.filter((t) => t.id !== 'f16')) expect(t.sims).toContain('il2')
  })

  it('ohne fliegende Sim (nur SRS) oder mit „alle zeigen“ kommt die ganze Liste', () => {
    const count = (o: Parameters<typeof aircraftByEra>[1]) => aircraftByEra(types, o).reduce((n, g) => n + g.items.length, 0)
    expect(count({ sims: ['srs'], selected: [] })).toBe(types.length)
    expect(count({ sims: ['bms'], selected: [], showAll: true })).toBe(types.length)
  })
})

describe('Epochen-Kästen', () => {
  it('sind ohne gewählte Flugzeuge alle relevant', () => {
    for (const era of ERAS) expect(eraRelevant(era, [], types)).toBe(true)
  })

  it('folgen den Epochen der gewählten Flugzeuge', () => {
    expect(erasOf(['p51', 'f16'], types)).toEqual(new Set(['ww2', 'modern']))
    expect(eraRelevant('ww2', ['p51'], types)).toBe(true)
    expect(eraRelevant('modern', ['p51'], types)).toBe(false)
    expect(eraRelevant('cold-war', ['mig15'], types)).toBe(true)
  })

  it('ignorieren unbekannte IDs aus alten Profilen', () => {
    expect(knownAircraft(['gibtsnicht', 'f16'], types)).toEqual(['f16'])
    expect(eraRelevant('ww2', ['gibtsnicht'], types)).toBe(true)
  })
})

describe('Würfelpool', () => {
  it('würfelt nie einen Sammel-Eintrag', () => {
    const groupIds = types.filter((t) => t.group).map((t) => t.id)
    for (let i = 0; i < 300; i++) {
      const v = resolveVars({ ac: { pool: 'aircraft' } }, { rng: createRng(`ac-${i}`), content: index, self })
      expect(groupIds).not.toContain(v.ac.fields?.id?.text)
    }
  })

  it('hält sich an where mit Epoche', () => {
    for (let i = 0; i < 100; i++) {
      const v = resolveVars({ ac: { pool: 'aircraft', where: { role: 'multirole', era: 'modern' } } }, { rng: createRng(`m-${i}`), content: index, self })
      const t = types.find((x) => x.id === v.ac.fields?.id?.text)!
      expect(t.era).toBe('modern')
      expect(t.role).toBe('multirole')
    }
  })
})

describe('Validator', () => {
  it('meldet unbekannte Flugzeuge und Epochen', () => {
    const r = buildWith({
      'content/hangar/zz-test.md': '---\nid: zz-test\ntitle: T\ncategory: technik\nteaser: T\n---\n\n:::aircraft{aircraft=p51,zz-flieger}\nx\n:::\n\n:::era{era=korea}\ny\n:::\n',
      'content/drills/zz-ac.yaml': [{ id: 'zz-ac1', type: 'choice', prompt: 'x', options: ['a', 'b'], answer: 0, aircraft: ['zz-jet'] }],
    })
    const msgs = r.errors.map((e) => e.message).join('\n')
    expect(msgs).toContain('unbekanntes Flugzeug "zz-flieger"')
    expect(msgs).not.toContain('unbekanntes Flugzeug "p51"')
    expect(msgs).toContain('unbekannte Epoche "korea"')
    expect(msgs).toContain('unbekanntes Flugzeug "zz-jet"')
  })

  it('akzeptiert Listen und gültige Epochen', () => {
    const r = buildWith({
      'content/hangar/zz-ok.md': '---\nid: zz-ok\ntitle: T\ncategory: technik\nera: ww2\nteaser: T\n---\n\n:::aircraft{aircraft=p51,p47}\nx\n:::\n\n:::era{era=cold-war}\ny\n:::\n\n:::era{era=ww2,cold-war}\nz\n:::\n',
    })
    expect(r.errors).toEqual([])
  })

  it('prüft jede Epoche einer Liste', () => {
    const r = buildWith({
      'content/hangar/zz-list.md': '---\nid: zz-list\ntitle: T\ncategory: technik\nteaser: T\n---\n\n:::era{era=ww2,korea}\nx\n:::\n',
    })
    expect(r.errors.map((e) => e.message)).toContain(':::era: unbekannte Epoche "korea" (erlaubt: ww2, cold-war, modern)')
  })
})
