/**
 * Funkgerät einstellen: Kanal oder Frequenz prüfen – und herausfinden, wen man stattdessen erwischt.
 *
 * Akzeptiert: "4", "ch 4", "channel 4", "button 4", "Kanal 4", "preset 4",
 * "251.25", "251,25" (deutsches Komma), "two five one point two five".
 * Warbird-Kanäle A–D (SCR-522, TR.1143): "A", "Kanal A", "channel B", "button C", "Knopf D", "Kanal Alpha",
 * "button baker".
 */
import { normalizeTokens } from '../phraseology/normalize'
import { toItems } from './score'

export interface RadioStation {
  name: string
  /** Frequenz als Text, z. B. "251.25". */
  freq: string
  /** Kanal (Preset) als Text, z. B. "4" – oder ein Buchstabe der Warbird-Funkgeräte ("A"–"D"). */
  channel?: string
}

export interface TuneInput {
  /** Kanalnummer – oder Buchstabe "A"–"D" (Warbird-Kanäle). */
  channel?: number | string
  freq?: number
}

/** Wörter vor einem Kanal-Buchstaben (englisch und deutsch, auch die Knöpfe des SCR-522). */
const LETTER_PREFIX = new Set(['ch', 'chan', 'channel', 'kanal', 'button', 'btn', 'preset', 'knopf', 'taste', 'push'])
/** Kanal-Buchstaben als Buchstabe, NATO-Alphabet oder Alphabet der 1940er (Able, Baker …). */
const LETTER_WORDS: Record<string, string> = {
  a: 'A', alpha: 'A', alfa: 'A', able: 'A',
  b: 'B', bravo: 'B', baker: 'B',
  c: 'C', charlie: 'C', charley: 'C',
  d: 'D', delta: 'D', dog: 'D',
}

/** „Kanal A“, „button B“, „chC“, „Alpha“ → Buchstabe; sonst undefined. */
function letterChannel(input: string): string | undefined {
  const words = input
    .toLowerCase()
    .replace(/[„“"'’`´.,:;!?()]/g, ' ')
    // "chA", "KanalB" → "ch a"
    .replace(/\b(ch|chan|channel|kanal|button|btn|knopf|taste)([a-d])\b/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
  const rest = words.filter((w) => !LETTER_PREFIX.has(w))
  return rest.length === 1 ? LETTER_WORDS[rest[0]] : undefined
}

export interface TuneResult {
  correct: boolean
  /** Was eingestellt wurde (Anzeige). */
  tuned: string
  /** Station, die man stattdessen erreicht (falsche, aber existierende Frequenz). */
  reached?: RadioStation
  /** Eingabe ließ sich nicht lesen. */
  unreadable?: boolean
}

const CHANNEL_WORDS = new Set(['ch', 'chan', 'channel', 'kanal', 'button', 'btn', 'preset'])

export function parseTuneInput(input: string): TuneInput {
  // Zwei Dezimalpunkte ("251.25.1") sind keine Frequenz
  if (/\d[.,]\d*[.,]\d/.test(input)) return {}
  // Warbird-Kanal als Buchstabe (keine Ziffer in der Eingabe)
  if (!/\d/.test(input)) {
    const letter = letterChannel(input)
    if (letter) return { channel: letter }
  }
  const text = input
    // Deutsches Dezimalkomma zwischen Ziffern zulassen: "251,25" → "251.25"
    .replace(/(\d),(\d)/g, '$1.$2')
    // "ch4", "Kanal4" → "ch 4"
    .replace(/\b(ch|chan|channel|kanal|button|btn|preset)(\d)/gi, '$1 $2')
  const words = normalizeTokens(text)
  const nums = toItems(text).filter((i) => i.kind === 'num')
  if (nums.length === 0) return {}
  const first = nums[0]
  if (first.kind !== 'num' || Number.isNaN(first.n)) return {}
  const isChannelWord = words.some((w) => CHANNEL_WORDS.has(w))
  if (isChannelWord) return { channel: Math.round(first.n) }
  // Ohne Kennwort: Ganzzahlen bis 29 sind Kanäle; ab 30 beginnt das FM-Band, also eine Frequenz
  if (!first.text.includes('.') && first.n >= 1 && first.n <= 29) return { channel: first.n }
  return { freq: first.n }
}

const sameFreq = (a: number, b: number) => Math.abs(a - b) < 0.0005

export function checkTune(input: string, target: RadioStation, stations: readonly RadioStation[] = []): TuneResult {
  const parsed = parseTuneInput(input)
  if (parsed.channel !== undefined) {
    const ch = String(parsed.channel)
    const same = (c: string | undefined) => c !== undefined && c.trim().toUpperCase() === ch
    if (same(target.channel)) return { correct: true, tuned: `Kanal ${ch} · ${target.freq}` }
    const reached = stations.find((s) => same(s.channel))
    return { correct: false, tuned: reached ? `Kanal ${ch} · ${reached.freq}` : `Kanal ${ch}`, reached }
  }
  if (parsed.freq !== undefined) {
    if (sameFreq(parsed.freq, Number(target.freq))) return { correct: true, tuned: target.freq }
    const reached = stations.find((s) => sameFreq(Number(s.freq), parsed.freq!))
    // Anzeige wie auf dem Funkgerät: mindestens eine Nachkommastelle ("312" → "312.0")
    const tuned = reached?.freq ?? (Number.isInteger(parsed.freq) ? parsed.freq.toFixed(1) : String(parsed.freq))
    return { correct: false, tuned, reached }
  }
  return { correct: false, tuned: input.trim(), unreadable: true }
}
