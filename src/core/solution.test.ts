/**
 * Fehlerlisten: Musterlösung und die Frage, ob die Erklärung sie nur wiederholt.
 */
import { describe, expect, it } from 'vitest'
import { hideRevealingContext, NEUTRAL_TITLE, restatesSolution, withoutHint } from './drills/solution'
import { contentResult } from '../content'
import { resolveDrill } from './drills/resolve'
import type { ResolvedDrill } from './drills/types'
import { createRng } from './random/rng'
import { randomSelf } from './random/vars'

describe('restatesSolution', () => {
  it('erkennt eine Erklärung, die nur die Lösung wiederholt', () => {
    expect(restatesSolution('Richtig ist: **Romeo Kilo Tango November**', ['Romeo Kilo Tango November'])).toBe(true)
    expect(restatesSolution('Richtig: Romeo Kilo Tango November.', ['Romeo Kilo Tango November'])).toBe(true)
  })

  it('lässt echte Erklärungen stehen', () => {
    expect(restatesSolution('Erst der Adressat, dann dein Rufzeichen.', ['Andersen Ground, Wolf four one, request taxi'])).toBe(false)
    expect(restatesSolution('Richtig ist: **three**, weil die Zahl so gesprochen wird.', ['three'])).toBe(false)
  })

  it('ohne Erklärung, ohne Lösung oder bei mehreren Zeilen nie', () => {
    expect(restatesSolution(undefined, ['a'])).toBe(false)
    expect(restatesSolution('Richtig ist: a', null)).toBe(false)
    expect(restatesSolution('Richtig ist: a', ['a', 'b'])).toBe(false)
    expect(restatesSolution('', [''])).toBe(false)
  })
})

describe('withoutHint (Einstufung, Prüfung)', () => {
  it('entfernt Hinweise, die den Aufbau verraten („Nummer – Treibstoff – tiger“)', () => {
    const env = { rng: createRng('hint'), content: contentResult.index!, self: randomSelf(createRng('hint-self'), contentResult.index!) }
    const d = resolveDrill(contentResult.index!.drills.get('m4-l4-ops-two')!, env)
    expect('hint' in d && d.hint).toBeTruthy()
    const stripped = withoutHint(d)
    expect('hint' in stripped ? stripped.hint : undefined).toBeUndefined()
    expect(stripped.kind).toBe(d.kind)
  })
})

describe('hideRevealingContext (P1-08)', () => {
  const index = contentResult.index!
  const resolve = (id: string, seed = 'x') => {
    const rng = createRng(`${id}/${seed}`)
    return resolveDrill(index.drills.get(id)!, { rng, content: index, self: randomSelf(rng, index) })
  }
  const exchangeOf = (d: ResolvedDrill) => ('exchange' in d ? d.exchange : undefined)

  it('Titel mit dem gesuchten Wort wird neutral – beim getippten Funkspruch und beim Lückentext', () => {
    for (const id of ['m4-l1-x-joker-call', 'm4-l2-x-pushing-cloze']) {
      const d = resolve(id)
      expect(exchangeOf(d)?.title, id).not.toBe(NEUTRAL_TITLE)
      const hidden = hideRevealingContext(d)
      expect(exchangeOf(hidden)?.title, id).toBe(NEUTRAL_TITLE)
      // Der Rest der Übung bleibt, das Original wird nicht verändert
      expect(hidden.prompt).toBe(d.prompt)
      expect(exchangeOf(d)?.title).not.toBe(NEUTRAL_TITLE)
    }
  })

  it('lässt verräterfreie Titel, Rufzeichen und Adressat sowie andere Übungstypen stehen', () => {
    const d = resolve('m4-l2-x-pushing-cloze')
    if (d.kind !== 'cloze') throw new Error(d.kind)
    const safe = { ...d, exchange: { ...d.exchange, title: 'Meldung an den AWACS', context: `Du bist ${d.exchange.transmissions[d.transmission].segments[1].text}.` } }
    expect(hideRevealingContext(safe)).toBe(safe)
    const choice = { kind: 'choice', id: 'c', prompt: 'p', options: ['joker'], correct: [0], multi: false } as ResolvedDrill
    expect(hideRevealingContext(choice)).toBe(choice)
  })

  it('auch die Kontextzeile verschwindet, wenn sie die Antwort nennt', () => {
    const d = resolve('m4-l1-x-joker-call')
    if (d.kind !== 'call') throw new Error(d.kind)
    const leaky = { ...d, exchange: { ...d.exchange, title: 'Treibstoff', context: 'Two meldet JOKER, ungefragt.' } }
    const hidden = hideRevealingContext(leaky)
    expect(exchangeOf(hidden)?.title).toBe('Treibstoff')
    expect(exchangeOf(hidden)?.context).toBeUndefined()
  })
})
