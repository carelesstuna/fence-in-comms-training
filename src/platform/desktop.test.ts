import { describe, expect, it } from 'vitest'
import { blankLinkHref, setupBlankLinks, type ClickLike } from './desktop'

/** Ein Klick auf `target`, wie ihn der Handler am Dokument sieht. */
function click(target: unknown, over: Partial<ClickLike> = {}): ClickLike {
  return { defaultPrevented: false, button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, target, ...over }
}

/** Ein Element, dessen `closest('a[target="_blank"]')` den Link liefert (oder nichts). */
function inside(link: { href: string } | null) {
  return { closest: (selector: string) => (selector === 'a[target="_blank"]' ? link : null) }
}

describe('Desktop-App: Links mit target="_blank"', () => {
  it('ein normaler Klick auf einen http- oder https-Link liefert dessen Adresse', () => {
    expect(blankLinkHref(click(inside({ href: 'https://www.faa.gov/air_traffic/' })))).toBe('https://www.faa.gov/air_traffic/')
    expect(blankLinkHref(click(inside({ href: 'http://localhost:5185/#/glossary?tab=prowords' })))).toBe(
      'http://localhost:5185/#/glossary?tab=prowords',
    )
  })

  it('andere Protokolle bleiben beim Standard (kein window.open)', () => {
    for (const href of ['mailto:a@b.de', 'javascript:alert(1)', 'file:///C:/x.txt', 'tauri://localhost/x', 'ftp://example.org/']) {
      expect(blankLinkHref(click(inside({ href }))), href).toBeNull()
    }
  })

  it('kein Link unter dem Klick, kein Element oder ein Ziel ohne closest: nichts', () => {
    expect(blankLinkHref(click(inside(null)))).toBeNull()
    expect(blankLinkHref(click(null))).toBeNull()
    expect(blankLinkHref(click({}))).toBeNull()
    expect(blankLinkHref(click(inside({ href: '' })))).toBeNull()
  })

  it('schon abgefangene Klicks, andere Maustasten und Umschalttasten bleiben unberührt', () => {
    const link = inside({ href: 'https://example.org/' })
    expect(blankLinkHref(click(link, { defaultPrevented: true }))).toBeNull()
    expect(blankLinkHref(click(link, { button: 1 }))).toBeNull()
    expect(blankLinkHref(click(link, { button: 2 }))).toBeNull()
    for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
      expect(blankLinkHref(click(link, { [key]: true })), key).toBeNull()
    }
  })

  it('im Browser (ohne Tauri) richtet setupBlankLinks nichts ein', () => {
    expect(() => setupBlankLinks()).not.toThrow()
  })
})
