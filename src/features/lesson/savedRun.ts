/**
 * Stand eines Durchlaufs im History-Eintrag (nicht in der URL): Wer aus der Lektion eine Themenseite, das Glossar
 * o. Ä. öffnet und mit der Zurück-Taste zurückkommt, steht wieder auf derselben Seite mit demselben Würfelstand.
 * Reine Funktionen ohne React, damit sie sich testen lassen.
 */
export interface SavedRun {
  seed: string
  step: number
  results: Record<number, number>
}

/** Liest den Stand aus dem Router-State. Alles, was nicht passt, ergibt null (dann beginnt die Lektion neu). */
export function readSavedRun(state: unknown): SavedRun | null {
  const r = (state as { lessonRun?: Partial<SavedRun> } | null)?.lessonRun
  if (!r || typeof r.seed !== 'string' || !Number.isInteger(r.step) || (r.step as number) < 0)
    return null
  const results: Record<number, number> = {}
  for (const [k, v] of Object.entries(r.results ?? {}))
    if (typeof v === 'number' && Number.isInteger(Number(k))) results[Number(k)] = v
  return { seed: r.seed, step: r.step as number, results }
}
