/**
 * Ein "Durchlauf" (Lektion, Einstufung …) hat einen Seed und ein eigenes Rufzeichen.
 * Alle Funksprüche und Übungen darin werden daraus deterministisch gewürfelt.
 */
import { createContext, useContext } from 'react'
import type { ContentIndex } from '../core/content/index'
import { createRng, newSeed } from '../core/random/rng'
import { randomSelf, type ResolveEnv, type SelfCallsign } from '../core/random/vars'
import type { Profile } from '../state/store'
import { contentResult } from '../content'

/**
 * Der Inhaltsindex. Enthalten die Inhalte Fehler, ist er null – dann zeigt App nur die Fehlerliste
 * und rendert nichts, was ihn braucht. Code, der schon beim Laden eines Moduls läuft, muss das prüfen.
 */
export const content: ContentIndex = contentResult.index as ContentIndex

/** Seed des zuletzt gebauten Durchlaufs – für die Fehlerseite, um einen Fehler nachzustellen. */
let lastSeed: string | null = null
export const lastRunSeed = (): string | null => lastSeed

export interface Run {
  seed: string
  self: SelfCallsign
  /** Profil zum Start des Durchlaufs (Änderungen mittendrin wirken erst beim nächsten Durchlauf). */
  profile: Profile
  envFor: (label: string | number) => ResolveEnv
}

export function makeRun(profile: Profile, seed = newSeed()): Run {
  lastSeed = seed
  const base = createRng(seed)
  // Ohne Inhalte gibt es keine Rufzeichen zum Würfeln – dann das feste aus dem Profil
  const self: SelfCallsign =
    profile.randomCallsign && contentResult.index
      ? randomSelf(base.fork('self'), contentResult.index)
      : { name: profile.callsignName || 'Viper', flight: profile.flightNum || 1, position: 1 }
  return {
    seed,
    self,
    profile,
    envFor: (label) => ({ rng: base.fork(label), content, self, sims: profile.sims, aircraft: profile.aircraft, phraseology: profile.phraseology }),
  }
}

export const RunContext = createContext<Run | null>(null)

export function useRun(): Run {
  const run = useContext(RunContext)
  if (!run) throw new Error('useRun() außerhalb eines RunContext')
  return run
}
