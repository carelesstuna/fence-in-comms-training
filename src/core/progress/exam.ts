/**
 * Modulprüfung (S-15): Fragen aus dem Pool der Übungen mit `exam: true`, gewichtet nach Lektionen.
 * Reine Funktionen ohne React. Der Pool liegt in `content/drills/exam-*.yaml`; die Lektion einer Prüfungsfrage steht
 * am Anfang ihrer ID (`m3-l5-x-ready` gehört zu `m3-l5`).
 */
import type { ContentIndex } from '../content/index'
import type { Drill, Module } from '../content/schema'
import { matchesProfile, type ProfileFilter } from '../drills/resolve'
import type { Rng } from '../random/rng'

/** Höchstens so viele Fragen je Lektion in einer Prüfung. */
export const MAX_PER_LESSON = 2
/**
 * Mindestens so viele Produktionsaufgaben je Prüfung (U2-01, P1-10), sofern der Pool sie hergibt: Die Kernkompetenz
 * ist, einen Funkspruch selbst zu sagen – nicht, ihn wiederzuerkennen.
 */
export const MIN_PRODUCTION = 3

/** Platzhalter für das eigene Rufzeichen bzw. das des Flights in einer Antwort. */
const OWN_CALLSIGN = /\{(callsign|flightName|flight|self|lead|two|three|four)\b/
/** Zahlwörter zählen nicht als Funkspruch („seven six zero zero“ ist nur ein Transpondercode, „zwei Gruppen“ eine Zahl). */
const NUMBER_WORDS = new Set(
  'zero one two three four five six seven eight nine niner decimal point thousand hundred null eins ein zwei drei vier fünf sechs sieben acht neun'.split(' '),
)

/**
 * Produktionsaufgabe: Man tippt oder baut einen Funkspruch bzw. liest ihn zurück – `call` (nicht Schweigen), `build`
 * und `input`, deren Antwort ein Funkspruch ist: mit eigenem Rufzeichen oder aus mindestens drei Wörtern, die keine
 * Zahlen sind („say again frequency“). Eine Zahl, ein Buchstabe oder „angels 12“ zählt nicht.
 */
export function isProductionDrill(d: Drill): boolean {
  if (d.type === 'call') return d.expect !== 'silence'
  if (d.type === 'build') return true
  if (d.type !== 'input') return false
  return d.accept.some((a) => {
    if (OWN_CALLSIGN.test(a)) return true
    const words = a
      .replace(/\{[^}]*\}/g, ' ')
      .toLowerCase()
      .split(/[^a-zäöüß]+/)
      .filter((w) => w.length > 1 && !NUMBER_WORDS.has(w))
    return words.length >= 3
  })
}

export interface ExamQuestion {
  /** Übungs-ID. */
  id: string
  /** Lektion, zu der die Frage gehört. */
  lessonId: string
}

/** Lektion einer Prüfungsfrage: die Lektion des Moduls, mit deren ID die Übungs-ID beginnt. */
export function examLessonId(module: Module, drillId: string): string | undefined {
  return module.lessons.find((lid) => drillId.startsWith(`${lid}-`))
}

/** Pool eines Moduls: Prüfungsfragen je Lektion (in Lehrplan-Reihenfolge, nur Lektionen mit Fragen). */
export function examPool(index: ContentIndex, moduleId: string): Map<string, string[]> {
  const pool = new Map<string, string[]>()
  const m = index.modules.get(moduleId)
  if (!m) return pool
  for (const lid of m.lessons) {
    const ids = [...index.drills.values()].filter((d) => d.exam && d.id.startsWith(`${lid}-`)).map((d) => d.id)
    if (ids.length > 0) pool.set(lid, ids)
  }
  return pool
}

/** Hat das Modul eine Prüfung (Eintrag im Lehrplan und mindestens eine Frage)? */
export function hasExam(index: ContentIndex, moduleId: string): boolean {
  const m = index.modules.get(moduleId)
  return !!m?.exam && m.status === 'available' && examPool(index, moduleId).size > 0
}

/**
 * Stellt eine Prüfung zusammen:
 * 1. bis zu `MIN_PRODUCTION` Produktionsaufgaben (`isProductionDrill`), möglichst aus verschiedenen Lektionen – eine
 *    zweite aus derselben Lektion nur, wenn danach noch jede Lektion eine Frage bekommt;
 * 2. eine Frage je Lektion, die noch keine hat;
 * 3. (in zufälliger Lektionsfolge) eine zweite, bis die Sollgröße erreicht ist.
 * Höchstens `MAX_PER_LESSON` je Lektion. Passt eine Frage nicht zum Profil (Sim, Flugzeug), bleibt sie draußen. Am Ende
 * sind die Fragen gemischt, damit man nicht Lektion für Lektion durchgeht.
 */
export function pickExam(index: ContentIndex, moduleId: string, rng: Rng, profile?: ProfileFilter): ExamQuestion[] {
  const m = index.modules.get(moduleId)
  if (!m?.exam) return []
  const size = m.exam.size
  const candidates = new Map<string, string[]>()
  for (const [lid, ids] of examPool(index, moduleId)) {
    const ok = ids.filter((id) => !profile || matchesProfile(index.drills.get(id)!, profile))
    if (ok.length > 0) candidates.set(lid, rng.shuffle(ok))
  }
  const lessons = [...candidates.keys()]
  const picked: ExamQuestion[] = []
  const used = new Set<string>()
  const count = (lid: string) => picked.filter((q) => q.lessonId === lid).length
  const isProduction = (id: string) => isProductionDrill(index.drills.get(id)!)
  const take = (lid: string, ok: (id: string) => boolean = () => true) => {
    const id = candidates.get(lid)?.find((x) => !used.has(x) && ok(x))
    if (!id) return false
    used.add(id)
    picked.push({ id, lessonId: lid })
    return true
  }

  // 1. Produktionsaufgaben
  const productive = rng.shuffle(lessons.filter((lid) => candidates.get(lid)!.some(isProduction)))
  let production = 0
  for (let round = 0; round < MAX_PER_LESSON; round++) {
    for (const lid of productive) {
      if (production >= MIN_PRODUCTION || picked.length >= size) break
      if (count(lid) !== round) continue
      // Eine zweite aus derselben Lektion darf keiner anderen Lektion den Platz nehmen
      const empty = lessons.filter((l) => count(l) === 0).length
      if (round > 0 && picked.length + 1 + empty > size) continue
      if (take(lid, isProduction)) production++
    }
  }
  // 2. Jede Lektion einmal
  for (const lid of lessons) {
    if (picked.length >= size) break
    if (count(lid) === 0) take(lid)
  }
  // 3. Auffüllen
  for (let round = 1; round < MAX_PER_LESSON && picked.length < size; round++) {
    for (const lid of rng.shuffle(lessons)) {
      if (picked.length >= size) break
      if (count(lid) <= round) take(lid)
    }
  }
  return rng.shuffle(picked)
}
