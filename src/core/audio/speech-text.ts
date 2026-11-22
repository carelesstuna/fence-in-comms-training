/**
 * Was die Sprachausgabe von einer Übertragung spricht: die Sprechform jedes Segments, getrennt durch
 * kurze Pausen (Kommas). So klingt ein Funkspruch wie gesprochen – Adressat, Rufzeichen, Inhalt.
 *
 * Segmente in eckigen Klammern sind Geräusche, keine Sprache: „[Rauschen]“ wird zu einem Rauschstoß an
 * dieser Stelle, „[Pfeifton und Wortfetzen]“ zu zwei Sendern gleichzeitig („blocked“).
 */
import { spokenWholeNumber } from '../phraseology/spoken'

interface SpokenSegment {
  text: string
  spoken?: string
}

interface AudioTransmission {
  segments: readonly SpokenSegment[]
  you?: boolean
  skip?: boolean
}

/**
 * Muster und Waffen: „F-15E“ → „F fifteen E“, „C-130“ → „C one thirty“, „F/A-18C“ → „F A eighteen C“,
 * „GBU-12“ → „G B U twelve“, „ZSU-23“ → „Z S U twenty three“.
 */
function aircraftType(_m: string, prefix: string, num: string, suffix: string): string {
  const letters = prefix.replace('/', '').split('').join(' ')
  const n = Number(num)
  const spokenNum =
    num.length === 3
      ? `${spokenWholeNumber(Math.floor(n / 100))} ${n % 100 < 10 ? `oh ${spokenWholeNumber(n % 10)}` : spokenWholeNumber(n % 100)}`
      : spokenWholeNumber(n)
  return [letters, spokenNum.replace(/-/g, ' '), suffix].filter(Boolean).join(' ')
}

/** Schreibweisen, die anders gesprochen werden, als sie dastehen. */
const WRITTEN: [RegExp, string | ((...a: string[]) => string)][] = [
  [/\b([A-Z]{1,3}(?:\/[A-Z])?)-(\d{1,3})([A-Z]?)\b/g, aircraftType],
  // Bomben: „Mk-82“ → „mark eighty two“
  [/\bMk\s?-?(\d{1,3})\b/g, (_m: string, n: string) => `mark ${spokenWholeNumber(Number(n)).replace(/-/g, ' ')}`],
  [/\bFL\s?(\d)/g, 'flight level $1'],
  [/(\d)\s?(?:kts?|KTS?)\b/g, '$1 knots'],
  [/(\d)\s?NM\b/g, '$1 miles'],
  // „Osan AB“ – im Funk nur der Name
  [/\s+AB\b/g, ''],
  [/°/g, ''],
]

export function speakable(text: string): string {
  let s = text
  for (const [re, to] of WRITTEN) s = s.replace(re, to as string)
  return s.replace(/\s+/g, ' ').trim()
}

const NOISE = /^\s*\[.*\]\s*$/
const BLOCKED = /pfeif|wortfetzen|blocked|gleichzeitig|überlager/i

/** Ein Teil der Wiedergabe: gesprochener Text oder ein Rauschstoß (Funkloch). */
export type SpeechPart = { kind: 'speech'; text: string } | { kind: 'static' }

export type TransmissionAudio =
  | { kind: 'speech'; parts: SpeechPart[] }
  /** Zwei Sender gleichzeitig: beide Stimmen verstümmelt, dazu der Überlagerungston. */
  | { kind: 'blocked'; texts: [string, string] }
  | { kind: 'none' }

function join(a: string, b: string): string {
  return a ? `${a}${/[,.;:!?]$/.test(a) ? ' ' : ', '}${b}` : b
}

/** Gesprochener Text einer Übertragung (Geräusch-Segmente fallen weg). */
export function spokenText(t: { segments: readonly SpokenSegment[] }): string {
  let out = ''
  for (const seg of t.segments) {
    if (NOISE.test(seg.text)) continue
    const part = speakable(seg.spoken ?? seg.text)
    if (part) out = join(out, part)
  }
  return out
}

/** Was eine Übertragung hörbar macht: Sprache mit Rauschstößen an den „[…]“-Stellen. */
export function speechParts(t: { segments: readonly SpokenSegment[] }): SpeechPart[] {
  const parts: SpeechPart[] = []
  let text = ''
  for (const seg of t.segments) {
    if (NOISE.test(seg.text)) {
      if (text) parts.push({ kind: 'speech', text })
      parts.push({ kind: 'static' })
      text = ''
      continue
    }
    const part = speakable(seg.spoken ?? seg.text)
    if (part) text = join(text, part)
  }
  if (text) parts.push({ kind: 'speech', text })
  return parts
}

/** Was „blocked“ überdeckt: ein zweiter, typischer Anruf auf derselben Frequenz. */
const OTHER_CALLS = [
  'Tower, Enfield one two, ready for departure',
  'Ground, Colt three one, request taxi',
  'Approach, Uzi two one, with you, angels five',
  'Tower, Dodge four one, five miles, full stop',
]

/**
 * Wiedergabe der Übertragung `index` innerhalb ihres Funkspruchs. Für „blocked“ braucht es die
 * Nachbarn: Überdeckt wird der eigene Anruf, der danach wiederholt wird.
 */
export function transmissionAudio(
  transmissions: readonly AudioTransmission[],
  index: number,
): TransmissionAudio {
  const t = transmissions[index]
  if (!t || t.skip) return { kind: 'none' }
  const noise = t.segments.filter((s) => NOISE.test(s.text))
  if (
    noise.length &&
    noise.length === t.segments.length &&
    noise.some((s) => BLOCKED.test(s.text))
  ) {
    const own =
      transmissions.slice(index + 1).find((x) => x.you && !x.skip) ??
      transmissions.find((x) => x.you && !x.skip)
    const other = OTHER_CALLS[index % OTHER_CALLS.length]
    return {
      kind: 'blocked',
      texts: [own ? spokenText(own) : OTHER_CALLS[(index + 1) % OTHER_CALLS.length], other],
    }
  }
  const parts = speechParts(t)
  return parts.length ? { kind: 'speech', parts } : { kind: 'none' }
}
