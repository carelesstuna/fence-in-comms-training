/**
 * Profil-Einstellung „Phraseologie der Lotsen“ (Server-Rendering, ohne Browser): zwei Optionen, „Immer US“ ist Standard.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PhraseologyField } from './ProfileFields'

describe('PhraseologyField', () => {
  const html = renderToStaticMarkup(createElement(PhraseologyField))
  const radios = [...html.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map((m) => m[0])

  it('bietet „Immer US-Form (FAA)“ und „Kartenabhängig“ an, „Immer US“ ist gewählt', () => {
    expect(html).toContain('Immer US-Form (FAA)')
    expect(html).toContain('Kartenabhängig')
    expect(radios).toHaveLength(2)
    expect(radios[0]).toContain('checked')
    expect(radios[1]).not.toContain('checked')
  })

  it('erklärt beide Formen und dass Mindesthöhen am Platz hängen', () => {
    expect(html).toContain('descend and maintain')
    expect(html).toContain('descend to')
    expect(html).toContain('Mindesthöhen richten sich immer nach dem Platz')
  })
})
