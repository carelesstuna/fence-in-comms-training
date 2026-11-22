/**
 * Typische Hörfehler der Spracherkennung und ihre Korrektur. Bewusst getrennt von den `aliases`
 * im Glossar: Die zeigt das Glossar als „auch: …“ an, Hörfehler gehören nicht dorthin.
 *
 * Jede Regel ersetzt ein ganzes Wort bzw. eine ganze Wortfolge (ohne Groß-/Kleinschreibung).
 * Neue Einträge am besten mit einem echten Transkript als Testfall in `speech.test.ts`.
 */
export const MISHEARINGS: readonly (readonly [RegExp, string])[] = [
  // Brevity
  [/\bbull'?s[\s-]?eye\b/gi, 'bullseye'],
  [/\b(bra|brah|bra a|b r a a)\b/gi, 'braa'],
  [/\bbog(ie|y|gy)\b/gi, 'bogey'],
  [/\bboogie\b/gi, 'bogey'],
  [/\bangles\b/gi, 'angels'],
  [/\b(op|opps)\s+check\b/gi, 'ops check'],
  [/\b(a\s?wax|a\s?wacks|a w a c s)\b/gi, 'AWACS'],
  // Standardwörter
  [/\b(wilko|will co|wil co|will coe)\b/gi, 'wilco'],
  // Ziffern in Funk-Aussprache, die Whisper als Wort schreibt
  [/\b(nina|ninah|nineer)\b/gi, 'niner'],
  [/\bfiver\b/gi, 'five'],
  // Rufzeichen
  [/\bhog\b/gi, 'hawg'],
  [/\bhogs\b/gi, 'hawgs'],
]

export function fixMishearings(text: string): string {
  return MISHEARINGS.reduce((t, [re, to]) => t.replace(re, to), text)
}
