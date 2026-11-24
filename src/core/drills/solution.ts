/**
 * Musterlösung einer aufgelösten Übung als Text – für Fehlerlisten (z. B. nach der Einstufung) – und Titel, die sie verraten.
 */
import { bearingDeg, distNm } from '../random/geo'
import type { ResolvedDrill, ResolvedSegment, ResolvedTransmission } from './types'

const spoken = (t: ResolvedTransmission | undefined) =>
  (t?.segments ?? [])
    .filter((s) => !s.optional)
    .map((s) => s.text)
    .join(', ')

const fmt = (bearing: number, range: number) =>
  `${String(Math.round(bearing) % 360).padStart(3, '0')}/${Math.round(range)}`

/**
 * Richtige Antwort(en) als Zeilen. null, wenn sie sich nicht als Text zeigen lässt (Kartenelement)
 * – dann bleibt die Erklärung der Übung.
 */
export function drillSolution(d: ResolvedDrill): string[] | null {
  switch (d.kind) {
    case 'choice':
      return d.correct.map((i) => d.options[i])
    case 'match':
      return d.left.map((l, i) => `${l} → ${d.right[d.solution[i]]}`)
    case 'build':
      return [d.solution.join(', ')]
    case 'anatomy':
      return (d.exchange.transmissions[d.transmission]?.segments ?? [])
        .filter((s) => s.role === d.target)
        .map((s) => s.text)
    case 'input':
      return d.accept.length ? [d.accept[0]] : null
    case 'cloze':
      return [spoken(d.exchange.transmissions[d.transmission])]
    case 'memory':
      // Die Stufe wählt man erst in der Übung; gezeigt wird der Readback mit wenig Angaben
      return d.few.answer >= 0 ? [spoken(d.few.answerExchange.transmissions[d.few.answer])] : null
    case 'sequence':
      return [d.solution.map((k) => d.items.find((i) => i.key === k)?.label ?? k).join(' → ')]
    case 'form':
      return d.fields.map((f) => `${f.label}: ${f.accept[0] ?? '–'}`)
    case 'call':
      if (d.expect === 'silence' || d.transmission === null) return ['Nichts sagen.']
      return [spoken(d.exchange.transmissions[d.transmission])]
    case 'plot': {
      const g = d.picture.groups[d.group]
      if (!g) return null
      const origin = d.mode === 'braa' ? d.picture.own : { x: 0, y: 0 }
      return [
        `${d.mode === 'braa' ? 'BRAA' : 'bullseye'} ${fmt(bearingDeg(origin, g), distNm(origin, g))}`,
      ]
    }
    case 'chart-tap':
      return null
    case 'nineline': {
      const lines = d.fields.map((f) => `${f.label}: ${f.expected}`)
      const rb = d.readback?.exchange.transmissions[d.readback.transmission]
      return rb ? [...lines, `Readback: ${spoken(rb)}`] : lines
    }
  }
}

const plain = (s: string) =>
  s
    .replace(/[*_`]/g, '')
    .replace(/^\s*Richtig(?: ist)?:\s*/i, '')
    .replace(/[.\s]+$/, '')
    .trim()

/**
 * Sagt die Erklärung nur noch einmal die Lösung („Richtig ist: **Romeo Kilo Tango November**“)? Dann braucht eine
 * Fehlerliste, die die Lösung schon zeigt, sie nicht noch einmal.
 */
export function restatesSolution(explain: string | undefined, solution: string[] | null): boolean {
  if (!explain || !solution || solution.length !== 1) return false
  return plain(explain).length > 0 && plain(explain) === plain(solution[0])
}

// ---------------------------------------------------------------------------
// Prüfung und Einstufung: Titel, die die Lösung verraten
// ---------------------------------------------------------------------------

/** Ohne Hinweis-Text (Einstufung, Prüfung): Hinweise nennen oft den Aufbau der Antwort. */
export function withoutHint(d: ResolvedDrill): ResolvedDrill {
  return 'hint' in d && d.hint !== undefined ? { ...d, hint: undefined } : d
}

/** Titel statt eines verräterischen Funkspruch-Titels. */
export const NEUTRAL_TITLE = 'Auf der Frequenz'

/** Häufige englische Wörter und Zahlwörter, die nichts verraten („Two“ im Titel ist ein Rufzeichen, kein Wert). */
const COMMON = new Set(
  'the and for you your with from this that are was not all one two three four five six seven eight nine niner zero hundred thousand point decimal'.split(' '),
)

/** Gesuchte Teile einer Übung mit Funkspruch: was man tippt, baut oder in die Lücken schreibt. */
function answerSegments(d: ResolvedDrill): ResolvedSegment[] {
  switch (d.kind) {
    case 'call':
      return d.expect === 'call' && d.transmission !== null ? (d.exchange.transmissions[d.transmission]?.segments ?? []) : []
    case 'build':
      return d.exchange.transmissions[d.transmission]?.segments ?? []
    case 'cloze':
      return d.blanks.flatMap((i) => d.exchange.transmissions[d.transmission]?.segments[i] ?? [])
    default:
      return []
  }
}

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-zäöüß]+/)
    .filter((w) => w.length >= 3 && !COMMON.has(w))

/**
 * Prüfung, Einstufung (P1-08): Steht im Titel oder in der Kontextzeile des Funkspruchs ein Wort der gesuchten Antwort
 * („Two meldet joker“ über „Was funkst du?“, „pushing – …“ über dem Lückentext), wird der Titel neutral und die
 * Kontextzeile entfällt. Rufzeichen und Adressat zählen nicht – die nennt die Aufgabe ohnehin –, ebenso Wörter, die schon
 * in der Aufgabe stehen. In Lektionen bleibt der Titel: Dort soll er beim Lernen helfen.
 */
export function hideRevealingContext(d: ResolvedDrill): ResolvedDrill {
  if (d.kind !== 'call' && d.kind !== 'build' && d.kind !== 'cloze') return d
  // Was die Aufgabe selbst schon sagt („Dein Flight steht am Rollhalt“), verrät der Titel nicht zusätzlich
  const inPrompt = new Set(words(d.prompt))
  const answer = new Set(
    answerSegments(d)
      .filter((s) => s.role !== 'callsign' && s.role !== 'addressee')
      .flatMap((s) => [s.text, ...(s.alt ?? [])])
      .flatMap(words)
      .filter((w) => !inPrompt.has(w)),
  )
  const reveals = (text: string | undefined) => !!text && words(text).some((w) => answer.has(w))
  const title = reveals(d.exchange.title)
  const context = reveals(d.exchange.context)
  if (!title && !context) return d
  return {
    ...d,
    exchange: { ...d.exchange, title: title ? NEUTRAL_TITLE : d.exchange.title, context: context ? undefined : d.exchange.context },
  }
}
