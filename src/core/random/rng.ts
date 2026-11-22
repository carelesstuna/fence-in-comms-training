/**
 * Deterministischer Zufallsgenerator mit Seed (mulberry32).
 * Gleicher Seed → gleiche Würfe → ein Szenario lässt sich exakt wiederholen.
 */

export interface Rng {
  readonly seed: string
  /** Gleichverteilt in [0, 1). */
  next(): number
  /** Ganzzahl in [min, max] (inklusive). */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  shuffle<T>(items: readonly T[]): T[]
  sample<T>(items: readonly T[], count: number): T[]
  chance(probability: number): boolean
  /** Unabhängiger Teil-Generator, z. B. pro Lektionsschritt. */
  fork(label: string | number): Rng
}

function hashSeed(seed: string): number {
  // xmur3-ähnliches Hashing eines Strings auf 32 Bit
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

export function createRng(seed: string): Rng {
  let state = hashSeed(seed)
  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    seed,
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() auf leerer Liste')
      return items[Math.floor(next() * items.length)]
    },
    shuffle: (items) => {
      const a = [...items]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    sample: (items, count) => rng.shuffle(items).slice(0, count),
    chance: (p) => next() < p,
    fork: (label) => createRng(`${seed}/${label}`),
  }
  return rng
}

const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Neuer, gut lesbarer Missions-Code wie "K7Q2". */
export function newSeed(length = 4): string {
  const bytes = new Uint32Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => SEED_ALPHABET[b % SEED_ALPHABET.length]).join('')
}
