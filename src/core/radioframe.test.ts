/**
 * Rahmen, Lage und Auftrag: Übungen, in denen du funkst (call, build, cloze), und Szenario-Schritte zeigen oben immer
 * Rufzeichen, Ort und Funk, darunter Lage und Auftrag.
 */
import { describe, expect, it } from 'vitest'
import { stringify } from 'yaml'
import { contentResult } from '../content'
import { buildContentIndex } from './content/index'
import { scenarioSchema } from './content/schema'
import { resolveDrill, resolveScenario } from './drills/resolve'
import { createRng } from './random/rng'
import { findPlaceholders } from './random/template'

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>
const files = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.replace(/^\//, ''), v]))

const index = contentResult.index!
const run = (seed: string) => ({
  rng: createRng(seed),
  content: index,
  self: { name: 'Colt', flight: 3, position: 1, size: 4 },
})

describe('Rahmen, Lage und Auftrag', () => {
  it('jede Funkspruch-Übung hat Rufzeichen, Ort, Funk, Lage und Auftrag – ohne offene Platzhalter', () => {
    for (const d of index.drills.values()) {
      if (d.type !== 'call' && d.type !== 'build' && d.type !== 'cloze') continue
      for (let i = 0; i < 5; i++) {
        const r = resolveDrill(d, run(`${d.id}${i}`))
        if (r.kind !== 'call' && r.kind !== 'build' && r.kind !== 'cloze')
          throw new Error(`${d.id}: falscher Typ`)
        const parts = {
          self: r.self,
          place: r.place,
          freq: r.freq,
          situation: r.situation,
          prompt: r.prompt,
        }
        for (const [name, text] of Object.entries(parts)) {
          expect(text, `${d.id}: ${name}`).toBeTruthy()
          expect(findPlaceholders(text ?? ''), `${d.id}: ${name}`).toEqual([])
        }
      }
    }
  })

  it('Szenarien: Ort an jedem Schritt, Auftrag bei jedem eigenen Zug', () => {
    for (const sc of index.scenarios.values()) {
      const r = resolveScenario(sc, run(sc.id))
      r.steps.forEach((st, i) => {
        expect(st.place, `${sc.id}, Schritt ${i + 1}`).toBeTruthy()
        expect(
          findPlaceholders(`${st.place} ${st.task ?? ''}`),
          `${sc.id}, Schritt ${i + 1}`,
        ).toEqual([])
        if (st.you) expect(st.task, `${sc.id}, Schritt ${i + 1}`).toBeTruthy()
      })
    }
  })

  it('der Ort gilt weiter, bis ein Schritt einen neuen nennt', () => {
    const sc = scenarioSchema.parse({
      id: 'zz-ort',
      title: 'T',
      summary: 'S',
      place: 'Platz',
      steps: [
        { stage: 'A', situation: 'a' },
        { stage: 'B', place: 'In der Luft', situation: 'b' },
        { stage: 'C', situation: 'c' },
      ],
    })
    expect(resolveScenario(sc, run('ort')).steps.map((s) => s.place)).toEqual([
      'Platz',
      'In der Luft',
      'In der Luft',
    ])
  })

  it('der Validator meldet Doppelungen zum Rufzeichen, fehlende Lage, Ort, Funk und Auftrag', () => {
    const you = { speaker: '{callsign}', you: true, segments: [{ text: 'hello', role: 'info' }] }
    const test = {
      ...files,
      'content/calls/zz-frame.yaml': stringify([{ id: 'zz-x', title: 'T', transmissions: [you] }]),
      'content/drills/zz-frame.yaml': stringify([
        {
          id: 'zz-f1',
          type: 'call',
          call: 'zz-x',
          prompt: 'Du bist **{callsign}**. Was funkst du?',
        },
        { id: 'zz-f2', type: 'build', call: 'zz-x', situation: 'Lage', prompt: 'Auftrag' },
        {
          id: 'zz-f3',
          type: 'cloze',
          call: 'zz-x',
          blanks: [0],
          situation: 'Du fliegst als **Two** auf 10.000 Fuß.',
        },
        {
          id: 'zz-f4',
          type: 'call',
          call: 'zz-x',
          situation: 'Du führst den Flight.',
          prompt: 'Funk.',
        },
      ]),
      'content/scenarios/zz-frame.yaml': stringify({
        id: 'zz-sc',
        title: 'T',
        summary: 'S',
        steps: [
          { stage: 'A', you: { transmission: you } },
          {
            stage: 'B',
            situation: 'Du fliegst als Wingman.',
            task: 'Funk.',
            you: { transmission: you },
          },
        ],
      }),
    }
    const msgs = buildContentIndex(test).errors.map((e) => e.message)
    const about = (id: string) => msgs.filter((m) => m.includes(id)).join('\n')
    expect(about('"zz-f1"')).toContain('Lage fehlt')
    expect(about('"zz-f1"')).toContain('„Du bist {callsign}“ ist doppelt')
    expect(about('"zz-f2"')).toContain('Ort fehlt')
    expect(about('"zz-f2"')).toContain('Funk fehlt')
    expect(about('"zz-sc"')).toContain('Ort fehlt')
    expect(about('"zz-sc"')).toContain('Auftrag fehlt')
    // Die Position im Flight ergibt sich aus dem Rufzeichen
    const position = '„Du fliegst als …“ bzw. „Du führst den Flight“ ist doppelt'
    expect(about('"zz-f3"')).toContain(position)
    expect(about('"zz-f4"')).toContain(position)
    expect(about('"zz-sc", Schritt 2')).toContain(position)
  })
})
