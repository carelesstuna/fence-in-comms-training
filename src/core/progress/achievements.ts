/**
 * Abzeichen: Zähler für Funkpraxis, Auswertung der Regeln aus content/achievements.yaml, Vergabe.
 * Reine Funktionen ohne React.
 */
import type { ContentIndex } from '../content/index'
import type { Achievement, AchievementRule } from '../content/schema'
import { isModuleDone, rankFor, type ProgressState } from './progress'

/** Zähler, die nicht schon anders im Fortschritt stehen. */
export interface Stats {
  correctCalls: number
  cleanCalls: number
  silences: number
  tunes: number
  perfectScenarios: number
}

export const EMPTY_STATS: Stats = { correctCalls: 0, cleanCalls: 0, silences: 0, tunes: 0, perfectScenarios: 0 }

/** Was beim Üben passiert und gezählt wird. */
export type TrackEvent =
  | { kind: 'call'; correct: boolean; clean: boolean }
  | { kind: 'silence'; correct: boolean }
  | { kind: 'tune'; correct: boolean }
  | { kind: 'scenario'; score: number }

export function applyEvent(stats: Stats | undefined, ev: TrackEvent): Stats {
  const s = { ...EMPTY_STATS, ...stats }
  switch (ev.kind) {
    case 'call':
      if (ev.correct) s.correctCalls++
      if (ev.correct && ev.clean) s.cleanCalls++
      break
    case 'silence':
      if (ev.correct) s.silences++
      break
    case 'tune':
      if (ev.correct) s.tunes++
      break
    case 'scenario':
      if (ev.score >= 0.999) s.perfectScenarios++
      break
  }
  return s
}

/** Wiederholungsabstand, ab dem eine Übung als „im Langzeitgedächtnis“ zählt. */
export const MATURE_DAYS = 21

export interface RuleProgress {
  done: boolean
  /** Für Zähl-Regeln: aktueller Stand und Ziel (z. B. 7 von 10). */
  current?: number
  target?: number
}

/** Stand einer Regel – erfüllt oder wie weit. */
export function ruleProgress(index: ContentIndex, p: ProgressState, rule: AchievementRule): RuleProgress {
  const stats = { ...EMPTY_STATS, ...p.stats }
  const counted = (current: number, target: number): RuleProgress => ({ done: current >= target, current: Math.min(current, target), target })
  if (rule.lessons) return counted(Object.keys(p.lessons).length, rule.lessons)
  if (rule.module) {
    const m = index.modules.get(rule.module)
    return { done: !!m && isModuleDone(m, p) }
  }
  if (rule.placement) return { done: Object.values(p.placements ?? {}).some((x) => x.passed) }
  if (rule.exams) return counted(Object.values(p.exams ?? {}).filter((x) => x.passed).length, rule.exams)
  if (rule.rank) {
    const ranks = index.curriculum.ranks
    const want = ranks.findIndex((r) => r.id === rule.rank)
    const have = ranks.indexOf(rankFor(index, p).current)
    return { done: want >= 0 && have >= want }
  }
  if (rule.xp) return counted(p.xp, rule.xp)
  if (rule.streak) return counted(p.daily?.best ?? 0, rule.streak)
  if (rule.dailyDays) return counted(p.daily?.days ?? 0, rule.dailyDays)
  if (rule.matureCards) return counted(Object.values(p.reviews ?? {}).filter((c) => c.scheduled_days >= MATURE_DAYS).length, rule.matureCards)
  if (rule.hangar) return counted(p.hangarSeen.length, rule.hangar)
  if (rule.correctCalls) return counted(stats.correctCalls, rule.correctCalls)
  if (rule.cleanCalls) return counted(stats.cleanCalls, rule.cleanCalls)
  if (rule.silences) return counted(stats.silences, rule.silences)
  if (rule.tunes) return counted(stats.tunes, rule.tunes)
  if (rule.perfectScenarios) return counted(stats.perfectScenarios, rule.perfectScenarios)
  return { done: false }
}

/** Neu erreichte Abzeichen eintragen. Einmal erreicht bleibt erreicht. */
export function awardAchievements(index: ContentIndex, p: ProgressState, now = new Date()): { progress: ProgressState; newly: Achievement[] } {
  const have = p.achievements ?? {}
  const newly = index.achievements.filter((a) => !have[a.id] && ruleProgress(index, p, a.rule).done)
  if (newly.length === 0) return { progress: p, newly }
  const at = now.toISOString()
  return { progress: { ...p, achievements: { ...have, ...Object.fromEntries(newly.map((a) => [a.id, { at }])) } }, newly }
}
