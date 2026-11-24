/**
 * Zitierte Funksprüche in Aufgaben lassen sich anhören (`quotedCalls`).
 */
import { describe, expect, it } from 'vitest'
import { quotedCalls } from './audio/quoted'

describe('Zitierte Funksprüche in Aufgaben', () => {
  it('erkennt die Station vor dem Doppelpunkt', () => {
    expect(quotedCalls('Batumi Tower: „Colt three one, contact departure two five four point zero.“ – Lies zurück.')).toEqual([
      { speaker: 'Batumi Tower', text: 'Colt three one, contact departure two five four point zero.' },
    ])
  })

  it('erkennt die Station vor dem Verb, ohne Artikel', () => {
    expect(quotedCalls('Du bist Nummer 2. Dein Lead ruft „Colt, check.“ Was antwortest du?')).toEqual([{ speaker: 'Lead', text: 'Colt, check.' }])
    expect(quotedCalls('Der JTAC sagt „type two in effect“.')[0].speaker).toBe('JTAC')
  })

  it('lässt Begriffe und Fragen nach Begriffen weg', () => {
    expect(quotedCalls('Was heißt „roger“?')).toEqual([])
    expect(quotedCalls('Warum sagt man „two five zero“ und nicht „two fifty“?')).toEqual([])
    expect(quotedCalls('Im Briefing steht „#3 übernimmt den Tanker-Funk“.')).toEqual([])
  })

  it('nimmt „Gegenstelle“, wenn keine Station dasteht', () => {
    expect(quotedCalls('Auf der Frequenz hörst du „blocked, say again“.')[0].speaker).toBe('Gegenstelle')
  })
})
