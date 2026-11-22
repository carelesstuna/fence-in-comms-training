/**
 * „Mehr dazu“-Zeile: echter Link, neuer Tab, für Screenreader als solcher angesagt (Server-Rendering, ohne Browser).
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { MoreLinkLine } from './MoreLink'

const render = (link: { to: string; label: string }) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, createElement(MoreLinkLine, { link })))

describe('MoreLinkLine', () => {
  const html = render({
    to: '/glossary?tab=brevity&cat=sicht',
    label: 'Brevity-Gruppe Sicht & Kontakt',
  })

  it('ist ein echter Link auf das Ziel, der in einem neuen Tab öffnet', () => {
    expect(html).toMatch(/<a [^>]*href="\/glossary\?tab=brevity&amp;cat=sicht"/)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener"')
  })

  it('zeigt „Mehr dazu“ und den Linktext, ohne Farbe als einziges Merkmal', () => {
    expect(html).toContain('Mehr dazu:')
    expect(html).toContain('Brevity-Gruppe Sicht &amp; Kontakt')
    expect(html).toMatch(/class="[^"]*\bunderline\b/)
  })

  it('sagt Screenreadern, dass ein neuer Tab aufgeht, und versteckt den Pfeil vor ihnen', () => {
    expect(html).toContain('<span class="sr-only"> (öffnet in neuem Tab)</span>')
    expect(html).toContain('<span aria-hidden="true"> ↗</span>')
  })

  it('eine Themenseite öffnet im selben Fenster: kein neuer Tab, kein Hinweis darauf', () => {
    const topic = render({ to: '/wissen/atis-platzansage', label: 'ATIS – die Platzansage' })
    expect(topic).toMatch(/<a [^>]*href="\/wissen\/atis-platzansage"/)
    expect(topic).not.toContain('target=')
    expect(topic).not.toContain('rel=')
    expect(topic).not.toContain('öffnet in neuem Tab')
    expect(topic).toContain('Mehr dazu:')
    expect(topic).toContain('ATIS – die Platzansage')
    expect(topic).toContain('<span aria-hidden="true"> →</span>')
  })
})
