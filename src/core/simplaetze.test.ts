/**
 * Flugplätze nur aus den Sims im Profil: Wer BMS fliegt, bekommt Korea, wer DCS fliegt, DCS-Karten – nie einen
 * Platz, den es in der eigenen Sim nicht gibt. Ohne passenden Platz (nur IL-2) bleiben alle im Spiel.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import type { Sim } from './content/schema'
import { createRng } from './random/rng'
import { preferBySim, randomSelf, resolveVars } from './random/vars'

const index = contentResult.index!
const simsOf = (map: string) => index.maps.get(map)?.sims ?? []

function roll(sims: Sim[], n = 200): Set<string> {
  const maps = new Set<string>()
  for (let i = 0; i < n; i++) {
    const rng = createRng(`sim-${sims.join('+')}-${i}`)
    const vars = resolveVars({ af: { pool: 'airfields' } }, { rng, content: index, self: randomSelf(rng, index), sims })
    maps.add((vars.af.data as { map: string }).map)
  }
  return maps
}

describe('Flugplätze nur aus den eigenen Sims', () => {
  it('BMS: nur Plätze in Korea', () => {
    const maps = roll(['bms'])
    expect([...maps]).toEqual(['kto'])
  })

  it('DCS: nur Plätze auf DCS-Karten, und mehrere davon', () => {
    const maps = roll(['dcs'])
    expect([...maps].every((m) => simsOf(m).includes('dcs'))).toBe(true)
    expect(maps.size).toBeGreaterThan(1)
  })

  it('DCS und BMS: beide Welten', () => {
    const maps = roll(['dcs', 'bms'])
    expect(maps.has('kto')).toBe(true)
    expect([...maps].some((m) => simsOf(m).includes('dcs'))).toBe(true)
  })

  it('nur IL-2 (keine Plätze im Pool): alle Plätze bleiben möglich', () => {
    expect(preferBySim(index.airfields, { content: index, sims: ['il2'] })).toEqual(index.airfields)
  })

  it('ohne Profil: alle Plätze', () => {
    expect(preferBySim(index.airfields, { content: index, sims: [] })).toEqual(index.airfields)
  })

  it('verlangt eine Übung eine Karte der anderen Sim, bleibt sie bei dieser Karte', () => {
    const caucasus = index.airfields.filter((a) => a.map === 'caucasus')
    expect(preferBySim(caucasus, { content: index, sims: ['bms'] })).toEqual(caucasus)
  })
})
