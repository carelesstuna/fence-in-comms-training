/**
 * Fortschritt, Freischaltung, XP und Ränge – reine Funktionen ohne React.
 */
import type { ContentIndex } from '../content/index'
import type { Module, Rank } from '../content/schema'
import type { DailyRecord, ReviewCard } from './review'
import type { Stats } from './achievements'

export interface LessonRecord {
  completedAt: string
  bestScore: number
  attempts: number
}

export interface PlacementRecord {
  /** Letzter Versuch. */
  at: string
  score: number
  /** Einmal bestanden bleibt bestanden. */
  passed: boolean
  /** Ältere Stände haben die folgenden Felder noch nicht. */
  bestScore?: number
  attempts?: number
  passedAt?: string
}

export interface ExamRecord {
  /** Letzter Versuch. */
  at: string
  score: number
  bestScore: number
  attempts: number
  /** Einmal bestanden bleibt bestanden. */
  passed: boolean
  passedAt?: string
}

export interface CheckrideRecord {
  /** Letzter Versuch. */
  at: string
  score: number
  bestScore: number
  attempts: number
  /** Einmal bestanden bleibt bestanden. */
  passed: boolean
  passedAt?: string
}

export interface ProgressState {
  xp: number
  lessons: Record<string, LessonRecord>
  placements: Record<string, PlacementRecord>
  /** Modulprüfungen je Modul-ID. */
  exams: Record<string, ExamRecord>
  /** Checkrides je Rang-ID. */
  checkrides: Record<string, CheckrideRecord>
  /** Wiederholungskarten je Übungs-ID (Funk-Drill des Tages). */
  reviews: Record<string, ReviewCard>
  /** Serie des Funk-Drills. */
  daily: DailyRecord
  hangarSeen: string[]
  /** Zähler für Abzeichen (richtige Funksprüche, Schweigen, Einstellen …). */
  stats: Stats
  /** Erreichte Abzeichen je ID. */
  achievements: Record<string, { at: string }>
  /**
   * Kernmodule, die bewusst freigeschaltet wurden („Direkt zu Modul X“). Sie und die Module davor sind
   * offen, gelten aber nicht als erledigt – auch nicht für Checkride-Voraussetzungen.
   */
  unlocked: string[]
}

export const EMPTY_PROGRESS: ProgressState = {
  xp: 0,
  lessons: {},
  placements: {},
  exams: {},
  checkrides: {},
  reviews: {},
  daily: { streak: 0, best: 0, days: 0 },
  hangarSeen: [],
  stats: { correctCalls: 0, cleanCalls: 0, silences: 0, tunes: 0, perfectScenarios: 0 },
  achievements: {},
  unlocked: [],
}

export type ModuleState = 'planned' | 'locked' | 'available' | 'done'
export type LessonState = 'locked' | 'available' | 'done'

export function isModuleDone(m: Module, p: ProgressState): boolean {
  if (m.status !== 'available') return false
  if (p.placements?.[m.id]?.passed) return true
  if (p.exams?.[m.id]?.passed) return true
  return m.lessons.length > 0 && m.lessons.every((id) => p.lessons[id])
}

/**
 * Womit ein Modul erledigt ist – für Meldungen wie „das Modul hattest du schon per Einstufung erledigt“ (P1-19).
 * Mehreres zugleich: Einstufung vor Prüfung vor Lektionen. null, wenn es nicht erledigt ist.
 */
export function doneVia(m: Module, p: ProgressState): 'placement' | 'exam' | 'lessons' | null {
  if (!isModuleDone(m, p)) return null
  if (p.placements?.[m.id]?.passed) return 'placement'
  if (p.exams?.[m.id]?.passed) return 'exam'
  return 'lessons'
}

/** Spielbare Kernmodule in Lehrplan-Reihenfolge. */
function coreModules(index: ContentIndex): Module[] {
  return index.curriculum.modules.filter((x) => x.group === 'core' && x.status === 'available')
}

/** Kernmodule mit Einstufungstest – fürs Onboarding, die Modulkarten und das Profil. */
export function placeableModules(index: ContentIndex): Module[] {
  return coreModules(index).filter((m) => m.placement && m.placement.drills.length > 0)
}

/** Bewusst freigeschaltet („Direkt zu Modul X“)? Ältere Stände haben das Feld nicht. */
export function isUnlocked(p: ProgressState, moduleId: string): boolean {
  return (p.unlocked ?? []).includes(moduleId)
}

/** Erreicht: erledigt oder bewusst freigeschaltet. Alles davor ist dann offen. */
const reached = (m: Module, p: ProgressState) => isModuleDone(m, p) || isUnlocked(p, m.id)

/**
 * Spuren, die schon nach einem bestimmten Kernmodul aufgehen; alle anderen erst nach dem ganzen Kern.
 *
 * Warbirds & Kalter Krieg nach Modul 2 (P3-01): W-L1 (Kanäle statt Presets) und W-L2 (IL-2 ohne Funkgerät) bauen auf
 * Funkspruch, Zahlen, Rufzeichen (M1) und Funkgerät, Kanälen und Comm Card (M2) auf. Platzfunk, Formation und AWACS
 * (M3–M5) setzen sie nicht voraus, sie verweisen nur darauf; W-L3 (Leitstelle) bringt ihre Wörter mit Tabelle selbst mit
 * und darf für die Vertiefung auf Modul 5 verweisen. Wer nur Warbirds fliegt, muss so nicht erst Fence-in, Joker/Bingo
 * und Picture lernen, um an seine Spur zu kommen.
 */
export const TRACK_OPENS_AFTER: Readonly<Record<string, string>> = { 'track-w': 'm2' }

/** Kernmodule, die erledigt sein müssen, bevor eine Spur aufgeht (in Lehrplan-Reihenfolge). */
export function trackPrerequisites(index: ContentIndex, trackId: string): Module[] {
  const core = coreModules(index)
  const after = TRACK_OPENS_AFTER[trackId]
  const k = after ? core.findIndex((x) => x.id === after) : -1
  return k >= 0 ? core.slice(0, k + 1) : core
}

/**
 * Kernmodule schalten nacheinander frei – und alle bis zum am weitesten erreichten Modul (per
 * Einstufung erledigt oder bewusst freigeschaltet). Spuren öffnen sich, wenn die Kernmodule davor
 * erledigt sind (`trackPrerequisites`: meist alle, Spur W schon nach Modul 2); Freischalten zählt dafür nicht.
 */
export function moduleState(index: ContentIndex, p: ProgressState, moduleId: string): ModuleState {
  const m = index.modules.get(moduleId)
  if (!m || m.status !== 'available') return 'planned'
  if (isModuleDone(m, p)) return 'done'
  const core = coreModules(index)
  if (m.group === 'core') {
    const i = core.findIndex((x) => x.id === m.id)
    if (i <= 0 || isModuleDone(core[i - 1], p)) return 'available'
    return core.slice(i).some((x) => reached(x, p)) ? 'available' : 'locked'
  }
  return trackPrerequisites(index, m.id).every((x) => isModuleDone(x, p)) ? 'available' : 'locked'
}

/**
 * Übersprungen: nicht erledigt, aber ein späteres Kernmodul ist schon erreicht. Zählt erst als
 * erledigt, wenn alle Lektionen gespielt oder die Einstufung bestanden ist.
 */
export function isModuleSkipped(index: ContentIndex, p: ProgressState, moduleId: string): boolean {
  const core = coreModules(index)
  const i = core.findIndex((x) => x.id === moduleId)
  if (i < 0 || isModuleDone(core[i], p)) return false
  return core.slice(i + 1).some((x) => reached(x, p))
}

/** Kernmodule, die man mit „Direkt zu Modul X“ überspringt (nicht erledigt, davor). */
export function modulesSkippedBy(index: ContentIndex, p: ProgressState, moduleId: string): Module[] {
  const core = coreModules(index)
  const i = core.findIndex((x) => x.id === moduleId)
  return i < 0 ? [] : core.slice(0, i).filter((x) => !isModuleDone(x, p))
}

/** Ränge, deren Checkride dieses Modul (oder eine seiner Lektionen) voraussetzt. */
export function checkridesRequiring(index: ContentIndex, moduleId: string): Rank[] {
  const m = index.modules.get(moduleId)
  return index.curriculum.ranks.filter((r) => r.checkride?.requires.some((id) => id === moduleId || !!m?.lessons.includes(id)))
}

/**
 * „Direkt zu Modul X“: schaltet ein gesperrtes Kernmodul (und damit alle davor) frei, ohne etwas
 * als erledigt zu werten. Für offene, erledigte oder fremde Module ändert sich nichts.
 */
export function unlockModule(index: ContentIndex, p: ProgressState, moduleId: string): ProgressState {
  const m = index.modules.get(moduleId)
  if (!m || m.group !== 'core' || moduleState(index, p, moduleId) !== 'locked') return p
  return { ...p, unlocked: [...(p.unlocked ?? []), moduleId] }
}

/** Nur dank „Direkt zu Modul X“ offen – ohne die Freischaltung wäre es gesperrt. */
export function isOpenedBySkip(index: ContentIndex, p: ProgressState, moduleId: string): boolean {
  return isUnlocked(p, moduleId) && moduleState(index, relockModule(p, moduleId), moduleId) === 'locked'
}

/** Freischaltung zurücknehmen – erledigte Lektionen und Einstufungen bleiben. */
export function relockModule(p: ProgressState, moduleId: string): ProgressState {
  if (!isUnlocked(p, moduleId)) return p
  return { ...p, unlocked: (p.unlocked ?? []).filter((id) => id !== moduleId) }
}

/** In offenen Modulen ist jede Lektion frei wählbar; gesperrt sind nur Lektionen gesperrter Module. */
export function lessonState(index: ContentIndex, p: ProgressState, lessonId: string): LessonState {
  if (p.lessons[lessonId]) return 'done'
  const lesson = index.lessons.get(lessonId)
  if (!lesson) return 'locked'
  const ms = moduleState(index, p, lesson.module)
  return ms === 'available' || ms === 'done' ? 'available' : 'locked'
}

/** Empfohlene nächste Lektion eines offenen Moduls: die erste noch nicht gespielte (oder null). */
export function nextLesson(index: ContentIndex, p: ProgressState, moduleId: string): string | null {
  const m = index.modules.get(moduleId)
  return m?.lessons.find((id) => lessonState(index, p, id) === 'available') ?? null
}

/**
 * Wie es nach einer Lektion weitergeht: die nächste noch offene Lektion danach, sonst eine offene
 * davor. Ist das Modul fertig, die nächste Lektion zum Auffrischen – nach der letzten die erste
 * offene Lektion des nächsten Kernmoduls.
 */
export function lessonAfter(index: ContentIndex, p: ProgressState, lessonId: string): string | null {
  const lesson = index.lessons.get(lessonId)
  const m = lesson && index.modules.get(lesson.module)
  if (!m) return null
  const i = m.lessons.indexOf(lessonId)
  const open = (id: string) => lessonState(index, p, id) === 'available'
  const after = m.lessons.slice(i + 1).find(open) ?? m.lessons.slice(0, Math.max(0, i)).find(open)
  if (after) return after
  if (i >= 0 && i + 1 < m.lessons.length) return m.lessons[i + 1]
  const core = coreModules(index)
  const k = core.findIndex((x) => x.id === m.id)
  const following = k >= 0 ? core[k + 1] : undefined
  return following ? nextLesson(index, p, following.id) : null
}

/**
 * Lektion, aus der eine Übung stammt – bevorzugt im angegebenen Modul. Übungen, die nur in der
 * Einstufung vorkommen, gehören nach ihrem Namen zur Lektion (m3-l5-line-up → m3-l5).
 */
export function drillLessonId(index: ContentIndex, drillId: string, moduleId?: string): string | undefined {
  const m = moduleId ? index.modules.get(moduleId) : undefined
  const candidates = m ? m.lessons : [...index.lessons.keys()]
  const found = candidates.find((lid) => index.lessons.get(lid)?.steps.some((s) => s.kind === 'drill' && s.drillId === drillId))
  return found ?? candidates.find((lid) => drillId.startsWith(`${lid}-`))
}

/** XP für einen Lektionsdurchgang: beim ersten Mal 50–100 % je nach Ergebnis, danach 20 %. */
export function lessonXp(baseXp: number, score: number, firstTime: boolean): number {
  const s = Math.max(0, Math.min(1, score))
  return Math.round(firstTime ? baseXp * (0.5 + 0.5 * s) : baseXp * 0.2 * s)
}

/** XP für einen bestandenen Einstufungstest: 60 % der Lektions-XP des Moduls. */
export function placementXp(index: ContentIndex, moduleId: string): number {
  const m = index.modules.get(moduleId)
  if (!m) return 0
  const total = m.lessons.reduce((sum, id) => sum + (index.lessons.get(id)?.xp ?? 0), 0)
  return Math.round(total * 0.6)
}

/** XP für eine bestandene Modulprüfung (nur beim ersten Mal): 20 % der Lektions-XP des Moduls. */
export function examXp(index: ContentIndex, moduleId: string): number {
  const m = index.modules.get(moduleId)
  if (!m) return 0
  const total = m.lessons.reduce((sum, id) => sum + (index.lessons.get(id)?.xp ?? 0), 0)
  return Math.round(total * 0.2)
}

/** Ein Rang gilt, wenn die XP reichen und – falls verlangt – der Checkride bestanden ist. */
function rankMet(r: Rank, p: ProgressState): boolean {
  return p.xp >= r.xp && (!r.checkride || !!p.checkrides?.[r.id]?.passed)
}

/**
 * Aktueller Dienstgrad: Ränge gelten der Reihe nach – wer den Checkride für Wingman nicht hat,
 * bleibt Kadett, auch mit genug XP für spätere Ränge.
 */
export function rankFor(index: ContentIndex, p: ProgressState) {
  const ranks = index.curriculum.ranks
  let i = 0
  while (i + 1 < ranks.length && rankMet(ranks[i + 1], p)) i++
  const current = ranks[i]
  const next = ranks[i + 1] ?? null
  const span = next ? next.xp - current.xp : 0
  const progress = next ? (span > 0 ? Math.max(0, Math.min(1, (p.xp - current.xp) / span)) : 1) : 1
  /** XP für den nächsten Rang reichen, es fehlt nur noch der Checkride. */
  const checkrideDue = !!next?.checkride && p.xp >= next.xp
  return { current, next, progress, checkrideDue }
}

export type CheckrideState = 'locked' | 'available' | 'passed'

/** Ist der Checkride für einen Rang offen – und wenn nicht, was fehlt noch? */
export function checkrideStatus(index: ContentIndex, p: ProgressState, rankId: string): { state: CheckrideState; missing: string[] } | null {
  const ranks = index.curriculum.ranks
  const k = ranks.findIndex((r) => r.id === rankId)
  const r = ranks[k]
  if (!r?.checkride) return null
  if (p.checkrides?.[r.id]?.passed) return { state: 'passed', missing: [] }
  const missing: string[] = []
  const current = ranks.indexOf(rankFor(index, p).current)
  if (current < k - 1) missing.push(`Dienstgrad ${ranks[k - 1].name}`)
  if (p.xp < r.xp) missing.push(`${r.xp} XP (du hast ${p.xp})`)
  for (const id of r.checkride.requires) {
    const m = index.modules.get(id)
    if (m) {
      if (!isModuleDone(m, p)) missing.push(`Modul ${m.code}: ${m.title}`)
      continue
    }
    if (!p.lessons[id]) missing.push(`Lektion „${index.lessons.get(id)?.title ?? id}“`)
  }
  return { state: missing.length ? 'locked' : 'available', missing }
}

/** Ergebnis eines Checkride-Versuchs übernehmen. Ein bestandener Checkride bleibt bestanden. */
export function applyCheckrideResult(p: ProgressState, rankId: string, score: number, passed: boolean, now = new Date()): ProgressState {
  const prev = p.checkrides?.[rankId]
  const at = now.toISOString()
  return {
    ...p,
    checkrides: {
      ...p.checkrides,
      [rankId]: {
        at,
        score,
        bestScore: Math.max(prev?.bestScore ?? 0, score),
        attempts: (prev?.attempts ?? 0) + 1,
        passed: passed || !!prev?.passed,
        passedAt: prev?.passedAt ?? (passed ? at : undefined),
      },
    },
  }
}

/** Ergebnis eines Lektionsdurchgangs in den Fortschritt übernehmen. */
export function applyLessonResult(
  index: ContentIndex,
  p: ProgressState,
  lessonId: string,
  score: number,
  now = new Date(),
): { progress: ProgressState; xpGained: number } {
  const lesson = index.lessons.get(lessonId)
  if (!lesson) return { progress: p, xpGained: 0 }
  const prev = p.lessons[lessonId]
  const xpGained = lessonXp(lesson.xp, score, !prev)
  return {
    xpGained,
    progress: {
      ...p,
      xp: p.xp + xpGained,
      lessons: {
        ...p.lessons,
        [lessonId]: {
          completedAt: prev?.completedAt ?? now.toISOString(),
          bestScore: Math.max(prev?.bestScore ?? 0, score),
          attempts: (prev?.attempts ?? 0) + 1,
        },
      },
    },
  }
}

export function applyPlacementResult(
  index: ContentIndex,
  p: ProgressState,
  moduleId: string,
  score: number,
  now = new Date(),
): { progress: ProgressState; xpGained: number; passed: boolean } {
  const m = index.modules.get(moduleId)
  const passed = !!m?.placement && score >= m.placement.passScore
  const prev = p.placements?.[moduleId]
  const already = !!prev?.passed
  // XP nur, wenn die Einstufung das Modul erst erledigt – nicht für Wiederholungen oder nach allen Lektionen
  const xpGained = passed && !already && !!m && !isModuleDone(m, p) ? placementXp(index, moduleId) : 0
  const at = now.toISOString()
  const passedAt = prev?.passedAt ?? (already ? prev?.at : passed ? at : undefined)
  const record: PlacementRecord = {
    at,
    score,
    passed: passed || already,
    bestScore: Math.max(prev?.bestScore ?? prev?.score ?? 0, score),
    attempts: (prev?.attempts ?? (prev ? 1 : 0)) + 1,
    ...(passedAt ? { passedAt } : {}),
  }
  return {
    passed,
    xpGained,
    progress: { ...p, xp: p.xp + xpGained, placements: { ...p.placements, [moduleId]: record } },
  }
}

/** Ergebnis einer Modulprüfung übernehmen. Bestanden heißt: Das Modul ist abgeschlossen; XP gibt es nur beim ersten Bestehen. */
export function applyExamResult(
  index: ContentIndex,
  p: ProgressState,
  moduleId: string,
  score: number,
  now = new Date(),
): { progress: ProgressState; xpGained: number; passed: boolean } {
  const m = index.modules.get(moduleId)
  const passed = !!m?.exam && score >= m.exam.passScore
  const prev = p.exams?.[moduleId]
  const already = !!prev?.passed
  const xpGained = passed && !already ? examXp(index, moduleId) : 0
  const at = now.toISOString()
  const record: ExamRecord = {
    at,
    score,
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    attempts: (prev?.attempts ?? 0) + 1,
    passed: passed || already,
    ...(prev?.passedAt || passed ? { passedAt: prev?.passedAt ?? at } : {}),
  }
  return {
    passed,
    xpGained,
    progress: { ...p, xp: p.xp + xpGained, exams: { ...p.exams, [moduleId]: record } },
  }
}
