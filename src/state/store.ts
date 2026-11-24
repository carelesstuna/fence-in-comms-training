/**
 * Globaler Zustand (Profil + Fortschritt), im Browser-Speicher persistiert.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Aircraft, Sim } from '../core/content/schema'
import { EMPTY_PROGRESS, recordModulesDone, type ProgressState } from '../core/progress/progress'
import { applyEvent, awardAchievements, type TrackEvent } from '../core/progress/achievements'
import type { PhraseologySetting } from '../core/random/phraseology'
import { contentResult } from '../content'
import { DEFAULT_TRANSFORMERS_MODEL } from '../platform/transformers-config'
import { DEFAULT_WHISPER_MODEL } from '../platform/whisper-config'
import { createSafeStorage, migratePersisted, restorePersisted, STORE_KEY, STORE_VERSION, type PersistedState } from './persisted'

export interface Profile {
  sims: Sim[]
  aircraft: Aircraft[]
  /** Bei jeder Übung ein neues Rufzeichen würfeln. */
  randomCallsign: boolean
  callsignName: string
  flightNum: number
  /** Kompaktmodus: Leseseiten in Lektionen eingeklappt, Übungen und Szenarien bleiben. */
  compact: boolean
  /**
   * Phraseologie der Lotsen: `us` = immer die US-Form (FAA), wie in den meisten Sim-Staffeln (Standard); `map` = je
   * nach Karte (ICAO in Georgien und am Golf). Mindesthöhen richten sich immer nach dem Platz.
   */
  phraseology: PhraseologySetting
  /** Eigene Funksprüche sprechen statt tippen. */
  speech: SpeechSettings
  /** Gegenstellen hörbar machen (Sprachausgabe mit Funkklang). */
  audio: AudioSettings
}

export interface AudioSettings {
  /** Funksprüche der Gegenstellen abspielen (sobald die Sprachausgabe geladen ist). */
  enabled: boolean
  /** Lautstärke 0–1. */
  volume: number
  /** Sprechtempo der Gegenstellen, 1 = normal. */
  tempo: number
  /** Text immer gleich zeigen – sonst erscheint er in Hörübungen erst nach dem Hören. */
  alwaysText: boolean
  /**
   * Empfang der Funksprüche: 'realistic' = gewürfelt vier oder fünf auf fünf, mal mit Störungen; 'clear' = immer fünf
   * auf fünf ohne Störungen. Übungen, in denen es um schlechten Empfang geht, klingen in beiden Fällen so schlecht wie nötig.
   */
  noise: 'realistic' | 'clear'
  /** Funksprüche im Szenario abspielen, sobald sie kommen. */
  autoplay: boolean
}

export const DEFAULT_AUDIO: AudioSettings = {
  enabled: true,
  volume: 0.8,
  tempo: 1,
  alwaysText: false,
  noise: 'realistic',
  autoplay: true,
}

export interface SpeechSettings {
  /** Eingabe eigener Funksprüche: tippen oder sprechen (Tippen bleibt immer möglich). */
  input: 'type' | 'speak'
  /** Sprechtaste (`KeyboardEvent.code`). */
  pttKey: string
  /** Halten (Standard) oder Umschalten. */
  pttMode: 'hold' | 'toggle'
  /** Mikrofon (`deviceId`); leer = Standardmikrofon. */
  micId: string
  /** Echo-/Rauschunterdrückung und automatische Lautstärke des Browsers. */
  micFilters: boolean
  /** Modell der Erkennung im Browser (transformers.js). */
  model: string
  /** Grafikkarte nutzen (WebGPU), sonst CPU. */
  gpu: boolean
  /** Modell der Erkennung in der Desktop-App (whisper.cpp), z. B. „small.en“. */
  desktopModel: string
  /** Desktop-App: Grafikkarte nutzen (Vulkan), sonst CPU. */
  desktopGpu: boolean
  /** Squelch-Klick beim Drücken und Loslassen der Sprechtaste. */
  squelch: boolean
}

export const DEFAULT_SPEECH: SpeechSettings = {
  input: 'type',
  pttKey: 'Space',
  pttMode: 'hold',
  micId: '',
  micFilters: false,
  model: DEFAULT_TRANSFORMERS_MODEL,
  gpu: false,
  desktopModel: DEFAULT_WHISPER_MODEL,
  desktopGpu: true,
  squelch: true,
}

export const DEFAULT_PROFILE: Profile = {
  sims: ['dcs', 'srs'],
  aircraft: [],
  randomCallsign: true,
  callsignName: 'Viper',
  flightNum: 1,
  compact: false,
  phraseology: 'us',
  speech: DEFAULT_SPEECH,
  audio: DEFAULT_AUDIO,
}

/**
 * Standardwerte für alles Gespeicherte. Das Speicher-Schema leitet sich daraus ab –
 * neue Felder in DEFAULT_PROFILE oder EMPTY_PROGRESS sind damit automatisch abgedeckt.
 */
export const STORE_DEFAULTS: PersistedState = { onboarded: false, profile: DEFAULT_PROFILE, progress: EMPTY_PROGRESS }

interface AppState {
  onboarded: boolean
  profile: Profile
  progress: ProgressState
  setProfile: (patch: Partial<Profile>) => void
  finishOnboarding: () => void
  setProgress: (progress: ProgressState) => void
  markHangarSeen: (id: string) => void
  /** Merk-Übung: Stufe geschafft (merkt sich die höchste). */
  passMemoryLevel: (drillId: string, level: number) => void
  /** Etwas beim Üben ist passiert (Funkspruch, Schweigen, Einstellen, Szenario) – für Abzeichen. */
  track: (ev: TrackEvent) => void
  /** Abzeichen neu prüfen (z. B. beim Start für Fortschritt von vor den Abzeichen). */
  refreshAchievements: () => void
  /** Frisch erreichte Abzeichen, die noch gemeldet werden (nicht gespeichert). */
  toasts: string[]
  dismissToast: (id: string) => void
  resetAll: () => void
  /** Gesicherten Stand übernehmen (Import); muss vorher mit dem Schema geprüft sein. */
  importState: (state: PersistedState) => void
}

/**
 * Fortschritt übernehmen: erledigte Module festhalten (bleiben erledigt, wenn Lektionen dazukommen), neu erreichte
 * Abzeichen eintragen und melden.
 */
function withAwards(s: AppState, progress: ProgressState): Partial<AppState> {
  const index = contentResult.index
  if (!index) return { progress }
  const r = awardAchievements(index, recordModulesDone(index, progress))
  return r.newly.length ? { progress: r.progress, toasts: [...s.toasts, ...r.newly.map((a) => a.id)] } : { progress: r.progress }
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      ...STORE_DEFAULTS,
      toasts: [],
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      finishOnboarding: () => set({ onboarded: true }),
      setProgress: (progress) => set((s) => withAwards(s, progress)),
      markHangarSeen: (id) =>
        set((s) =>
          s.progress.hangarSeen.includes(id)
            ? s
            : withAwards(s, { ...s.progress, hangarSeen: [...s.progress.hangarSeen, id] }),
        ),
      passMemoryLevel: (drillId, level) =>
        set((s) =>
          (s.progress.memory?.[drillId] ?? 0) >= level
            ? s
            : { progress: { ...s.progress, memory: { ...s.progress.memory, [drillId]: level } } },
        ),
      track: (ev) => set((s) => withAwards(s, { ...s.progress, stats: applyEvent(s.progress.stats, ev) })),
      refreshAchievements: () => set((s) => withAwards(s, s.progress)),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t !== id) })),
      resetAll: () => set({ ...STORE_DEFAULTS, toasts: [] }),
      importState: (state) =>
        set((s) => ({
          onboarded: state.onboarded,
          profile: state.profile,
          toasts: [],
          ...withAwards({ ...s, toasts: [] }, state.progress),
        })),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      // Ältere Stände ergänzen (v2: checkrides, v3: reviews und daily, v4: stats und achievements,
      // v5: memory und modulesDone) …
      migrate: (persisted, version) => migratePersisted(persisted, version, STORE_DEFAULTS) as PersistedState,
      // … und jeden geladenen Stand prüfen: Standardwerte ergänzen, Ungültiges ersetzen (vorher sichern).
      // Nur die gespeicherten Felder übernehmen – gespeicherte Daten dürfen keine Aktionen überschreiben.
      merge: (persisted, current) => ({ ...current, ...restorePersisted(persisted, STORE_DEFAULTS) }),
      // Meldungen sind flüchtig – gespeichert werden nur Profil und Fortschritt
      partialize: (s): PersistedState => ({ onboarded: s.onboarded, profile: s.profile, progress: s.progress }),
      // Übersteht ungültiges JSON (wird gesichert), vollen und gesperrten Speicher
      storage: createSafeStorage(),
    },
  ),
)
