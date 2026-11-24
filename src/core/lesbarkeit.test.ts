/**
 * Lesbarkeit als eigene Dimension der Funksprüche und Sprechpausen in der Sprachausgabe.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { resolveDrill, resolveExchange } from './drills/resolve'
import { createRng } from './random/rng'
import { PAUSES, speechParts } from './audio/speech-text'
import { interferenceFor, strengthOf } from './audio/radio'

const index = contentResult.index!
const env = (seed: string) => ({
  rng: createRng(seed),
  content: index,
  self: { name: 'Colt', flight: 3, position: 1 },
})
const WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5 }

describe('Lesbarkeit aus dem Inhalt', () => {
  it('Hörübung: Die gesendete Stufe ist die richtige Antwort', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 40; i++) {
      const d = resolveDrill(index.drills.get('m1-l6-listen-readability')!, env(`l${i}`))
      if (d.kind !== 'choice' || !d.hear) throw new Error('Hörprobe fehlt')
      const r = d.hear.exchange.transmissions[d.hear.transmission].readability!
      seen.add(r)
      const right = d.options[d.correct[0]]
      expect(WORDS[/read you (\w+)$/.exec(right)![1]], right).toBe(r)
      expect(new Set(d.options).size).toBe(3)
      expect(d.hear.noAudio).toMatch(/^Du verstehst ihn /)
    }
    expect(seen.size).toBeGreaterThan(2)
  })

  it('Radio Check „nur mit Mühe“ klingt wie Stufe 3', () => {
    const d = resolveDrill(index.drills.get('m1-l6-radio-check-answer')!, env('a'))
    if (d.kind !== 'choice' || !d.hear) throw new Error('Hörprobe fehlt')
    expect(d.hear.exchange.transmissions[0].readability).toBe(3)
  })

  it('Prüfungsfrage: Klang und erwartete Stufe passen zusammen', () => {
    for (let i = 0; i < 20; i++) {
      const d = resolveDrill(index.drills.get('m1-l6-x-input-readability')!, env(`x${i}`))
      if (d.kind !== 'input' || !d.hear) throw new Error('Hörprobe fehlt')
      const r = d.hear.exchange.transmissions[0].readability!
      expect(WORDS[/read you (\w+)$/.exec(d.accept[0])![1]]).toBe(r)
      expect(d.hear.exchange.transmissions[0].speaker).toMatch(/Tower$/)
    }
  })

  it('Beispielreihe: 5, 4, 3, 2, 1 und nur Rauschen', () => {
    const x = resolveExchange(index.exchanges.get('m1-readability-samples')!, env('s'))
    expect(x.transmissions.map((t) => t.readability)).toEqual([5, 4, 3, 2, 1, 1])
    expect(x.transmissions.every((t) => t.note)).toBe(true)
  })

  it('schwächere Stufe heißt schwächeres Signal, schlechter Empfang ist gestört', () => {
    for (let r = 2; r <= 5; r++) expect(strengthOf(r)).toBeGreaterThan(strengthOf(r - 1))
    expect(interferenceFor(2, 0.9)).toBe('heavy')
    expect(interferenceFor(5, 0)).toBe('none')
  })
})

describe('Sprechpausen', () => {
  const seg = (text: string, role = 'info') => ({ text, role })

  it('vor „correction“ eine Denkpause, danach eine kurze bis zum richtigen Wert', () => {
    const parts = speechParts({ segments: [seg('Darkstar', 'addressee'), seg('Colt three one', 'callsign'), seg('angels two five', 'value'), seg('correction', 'proword'), seg('angels two seven', 'value')] })
    const pauses = parts.filter((p) => p.kind === 'pause').map((p) => (p.kind === 'pause' ? p.seconds : 0))
    expect(pauses).toContain(PAUSES.beforeCorrection)
    expect(pauses).toContain(PAUSES.afterCorrection)
    // Vor der Pause bleibt die Stimme offen (Komma), statt den Satz abzuschließen
    expect(parts[0]).toMatchObject({ kind: 'speech' })
    const beforeCorrection = parts[parts.findIndex((p) => p.kind === 'pause' && p.seconds === PAUSES.beforeCorrection) - 1]
    expect(beforeCorrection.kind === 'speech' && beforeCorrection.text.endsWith(',')).toBe(true)
  })

  it('nach der Anrufgruppe eine kurze Pause, bei pace: lines zwischen allen Teilen', () => {
    const parts = speechParts({ segments: [seg('Colt three one', 'addressee'), seg('Axeman', 'callsign'), seg('IP Alpha'), seg('one two zero')] })
    expect(parts.some((p) => p.kind === 'pause' && p.seconds === PAUSES.afterCallup)).toBe(true)
    const lines = speechParts({ pace: 'lines', segments: [seg('IP Alpha'), seg('one two zero'), seg('eight point five')] })
    expect(lines.filter((p) => p.kind === 'pause')).toHaveLength(2)
  })

  it('ohne besondere Stelle bleibt es beim Komma', () => {
    const parts = speechParts({ segments: [seg('runway two seven'), seg('cleared to land')] })
    expect(parts).toEqual([{ kind: 'speech', text: 'runway two seven, cleared to land' }])
  })
})
