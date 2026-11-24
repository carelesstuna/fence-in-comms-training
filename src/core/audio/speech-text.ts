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
  role?: string
}

interface AudioTransmission {
  speaker?: string
  segments: readonly SpokenSegment[]
  you?: boolean
  skip?: boolean
  pace?: 'lines'
  mix?: readonly [number, number]
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

/** Ein Teil der Wiedergabe: gesprochener Text, ein Rauschstoß (Funkloch) oder eine Sprechpause. */
export type SpeechPart = { kind: 'speech'; text: string } | { kind: 'static' } | { kind: 'pause'; seconds: number }

/**
 * Sprechpausen zwischen zwei Teilen eines Funkspruchs, in Sekunden. Ein Komma allein gibt der Sprachausgabe kaum
 * eine Pause – an diesen Stellen setzt ein Sprecher im Funk aber deutlich ab:
 * - vor „correction“: Man merkt den Fehler und überlegt kurz, was richtig ist; danach kurz bis zum richtigen Wert
 * - nach „mayday, mayday, mayday“ bzw. „pan pan“, nach „break“, „I say again“ und „stand by“
 * - nach der Anrufgruppe am Anfang (Adressat, Rufzeichen), bevor der Inhalt kommt
 * - bei `pace: lines` (9-Line, Readback dazu) zwischen allen Teilen: Zeit zum Mitschreiben
 */
export const PAUSES = {
  beforeCorrection: 0.7,
  afterCorrection: 0.3,
  afterProword: 0.4,
  afterStandby: 0.6,
  afterCallup: 0.2,
  lines: 0.5,
} as const

/** Unter dieser Länge reicht das Komma. */
const MIN_PAUSE = 0.15

export function pauseBefore(segs: readonly SpokenSegment[], i: number, pace?: 'lines'): number {
  if (i <= 0 || i >= segs.length) return 0
  const cur = (segs[i].spoken ?? segs[i].text).trim()
  const prev = (segs[i - 1].spoken ?? segs[i - 1].text).trim()
  const p: number[] = [0]
  if (pace === 'lines') p.push(PAUSES.lines)
  if (/^correction\b/i.test(cur)) p.push(PAUSES.beforeCorrection)
  if (/^correction[,.]?$/i.test(prev)) p.push(PAUSES.afterCorrection)
  if (/^(mayday|pan[ -]?pan)\b/i.test(prev) || /^break(,? break)?$/i.test(prev) || /^i say again$/i.test(prev)) {
    p.push(PAUSES.afterProword)
  }
  if (/^stand ?by$/i.test(prev)) p.push(PAUSES.afterStandby)
  if (/ready to copy\??$/i.test(prev)) p.push(PAUSES.afterProword)
  if (i === 2 && segs[0].role === 'addressee' && segs[1].role === 'callsign') p.push(PAUSES.afterCallup)
  return Math.max(...p)
}

export type TransmissionAudio =
  | { kind: 'speech'; parts: SpeechPart[] }
  /** Zwei Sender gleichzeitig: beide Stimmen verstümmelt, dazu der Überlagerungston. */
  | {
      kind: 'blocked'
      texts: [string, string]
      /** Sprecher der beiden Texte (bei `mix`: deren Stimmen); ohne Angabe eine beliebige zweite Stimme. */
      speakers?: [string, string]
      /** Pfeifton im Vordergrund, die Stimmen gehen darunter fast unter (wie im KLM-Cockpit auf Teneriffa). */
      strong?: boolean
    }
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

/** Was eine Übertragung hörbar macht: Sprache mit Rauschstößen an den „[…]“-Stellen und Sprechpausen. */
export function speechParts(t: { segments: readonly SpokenSegment[]; pace?: 'lines' }): SpeechPart[] {
  const parts: SpeechPart[] = []
  let text = ''
  // Vor einer Pause endet der Text mit Komma: Die Stimme hebt sich wie mitten im Satz, statt abzuschließen
  const flush = (pause: boolean) => {
    if (text) parts.push({ kind: 'speech', text: pause && !/[,.;:!?]$/.test(text) ? `${text},` : text })
    text = ''
  }
  t.segments.forEach((seg, i) => {
    if (NOISE.test(seg.text)) {
      flush(false)
      parts.push({ kind: 'static' })
      return
    }
    const part = speakable(seg.spoken ?? seg.text)
    if (!part) return
    const pause = pauseBefore(t.segments, i, t.pace)
    if (pause >= MIN_PAUSE && text) {
      flush(true)
      parts.push({ kind: 'pause', seconds: pause })
    }
    text = join(text, part)
  })
  flush(false)
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
  // Überlagerung zweier bestimmter Übertragungen: so, wie sie bei Dritten ankommt
  if (t.mix) {
    const [a, b] = t.mix.map((i) => transmissions[i])
    if (a && b) {
      return {
        kind: 'blocked',
        texts: [spokenText(a), spokenText(b)],
        speakers: [a.speaker ?? '', b.speaker ?? ''],
        strong: true,
      }
    }
  }
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
