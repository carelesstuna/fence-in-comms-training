/**
 * Platzhalter in Inhaltstexten:
 *   {name}          → geschriebene Form (z. B. "Viper 1-1", "260.0")
 *   {name.feld}     → Unterfeld (z. B. {airfield.name}, {airfield.uhf})
 *   {name|spoken}   → gesprochene Form (z. B. "Viper one one", "two six zero point zero")
 */

/** Variablen, die immer zur Verfügung stehen (aus Profil oder gewürfelt). */
export const BUILTIN_VARS = [
  'callsign', // eigenes Rufzeichen, z. B. "Viper 1-1"
  'flight', // Flight, z. B. "Viper 1"
  'flightName', // nur der Name, z. B. "Viper"
  'flightNum', // Flight-Nummer, z. B. "1"
  'wingman', // eigener Wingman, z. B. "Viper 1-2"
  'element', // Element Lead, z. B. "Viper 1-3"
  'element2', // Nummer 4, z. B. "Viper 1-4"
  'lead', // Nummer 1 des eigenen Flights (folgt nicht der Perspektive)
  'two',
  'three',
  'four',
  'selfNum', // eigene Position als Wort, z. B. "Two" (für "Viper check" – "Two")
  'flightSize', // Anzahl Flugzeuge im Flight, z. B. "4"
] as const
export type BuiltinVar = (typeof BUILTIN_VARS)[number]

export interface Placeholder {
  raw: string
  root: string
  path: string[]
  form: 'text' | 'spoken'
}

const PLACEHOLDER_RE = /\{([a-zA-Z][a-zA-Z0-9]*)((?:\.[a-zA-Z][a-zA-Z0-9]*)*)(?:\|(spoken|text))?\}/g

export function findPlaceholders(text: string): Placeholder[] {
  const result: Placeholder[] = []
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    result.push({
      raw: m[0].slice(1, -1),
      root: m[1],
      path: m[2] ? m[2].slice(1).split('.') : [],
      form: (m[3] as 'spoken' | 'text' | undefined) ?? 'text',
    })
  }
  return result
}

/** Ein aufgelöster Wert: geschriebene und gesprochene Form, optional mit Unterfeldern. */
export interface Value {
  text: string
  spoken: string
  fields?: Record<string, Value>
  /** Zahlenwert (für derive, Toleranzen), falls es eine Zahl ist. */
  num?: number
  /** Zahlenart (heading, fuel …), falls bekannt. */
  kind?: string
  /** Strukturierte Daten, z. B. die Lagegeometrie für den Lagebild-Decoder. */
  data?: unknown
}

export function value(text: string, spoken = text, fields?: Record<string, Value>): Value {
  return fields ? { text, spoken, fields } : { text, spoken }
}

/** Ersetzt alle Platzhalter. Unbekannte Platzhalter bleiben sichtbar stehen (fällt beim Testen auf). */
export function fillTemplate(text: string, vars: Record<string, Value>): string {
  return text.replace(PLACEHOLDER_RE, (whole, root: string, path: string, form: string | undefined) => {
    let v: Value | undefined = vars[root]
    for (const key of path ? path.slice(1).split('.') : []) v = v?.fields?.[key]
    if (!v) return whole
    return form === 'spoken' ? v.spoken : v.text
  })
}

/**
 * Platzhalter ohne Angabe in die gesprochene Form setzen („{callsign}“ → „{callsign|spoken}“), für die
 * Sprachausgabe. Ausdrücklich „|text“ bleibt stehen.
 */
export function spokenPlaceholders(text: string): string {
  return text.replace(PLACEHOLDER_RE, (whole, root: string, path: string, form: string | undefined) => (form ? whole : `{${root}${path}|spoken}`))
}
