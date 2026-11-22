/**
 * Transkript der Spracherkennung aufbereiten, bevor es bewertet wird.
 *
 * - Zu kurze oder zu leise Aufnahmen gar nicht erst erkennen lassen: Whisper erfindet bei Stille Sätze.
 * - Whisper-Füllsel entfernen: Markierungen wie `[BLANK_AUDIO]` und typische erfundene Sätze
 *   („Thank you.“), wenn sonst nichts erkannt wurde.
 * - Schreibweisen vereinheitlichen und typische Hörfehler korrigieren (siehe `mishearings.ts`).
 * - Zahlen in Whisper-Schreibweise lesbar machen (`spokenNumbers`).
 */
import type { LevelStats } from './pcm'
import { fixMishearings } from './mishearings'

/** Kürzer als das ist kein Funkspruch – höchstens ein Antippen der Sprechtaste. */
export const MIN_DURATION_MS = 400
/** Leiser als das (Spitzenpegel, etwa -36 dBFS) ist es Rauschen, kein Sprechen. */
export const MIN_PEAK = 0.016

export type DiscardReason = 'too-short' | 'too-quiet' | 'empty'

export const DISCARD_TEXT: Record<DiscardReason, string> = {
  'too-short': 'Zu kurz – halte die Sprechtaste, bis das letzte Wort gesprochen ist.',
  'too-quiet': 'Nichts zu hören – ist das richtige Mikrofon gewählt und nicht stummgeschaltet?',
  empty: 'Nichts erkannt – bitte noch einmal deutlich sprechen.',
}

/** Vor der Erkennung: Lohnt sich die Aufnahme überhaupt? */
export function checkRecording(stats: LevelStats): DiscardReason | undefined {
  if (stats.durationMs < MIN_DURATION_MS) return 'too-short'
  if (stats.peak < MIN_PEAK) return 'too-quiet'
  return undefined
}

/** Sätze, die Whisper bei Stille oder Rauschen erfindet (aus Untertitel-Trainingsdaten). */
const HALLUCINATIONS = [
  'thank you',
  'thank you very much',
  'thanks for watching',
  'thank you for watching',
  'thanks for listening',
  'please subscribe',
  'subscribe',
  'you',
  'bye',
  'okay',
  'so',
  'the end',
]

export interface Transcript {
  /** Aufbereiteter Text für die Bewertung (leer, wenn verworfen). */
  text: string
  /** Was die Erkennung geliefert hat. */
  raw: string
  discarded?: DiscardReason
}

const normalizeSpace = (s: string) => s.replace(/\s+/g, ' ').trim()

const RUNWAY_SIDE: Record<string, string> = { L: 'left', R: 'right', C: 'center' }

/**
 * Zahlen so schreiben, wie die Bewertung sie liest. Whisper schreibt Zahlen mal als Wort, mal als
 * Ziffern – und dann oft so, wie man sie nie tippen würde: „06R“, „Raven61“, „4.7.1“, „Chevy II“.
 * Tausender werden zum Wort („3000 for 6000“ → „3 thousand for 6 thousand“), sonst liefen beide
 * Zahlen samt „for“ zu einer zusammen.
 */
export function spokenNumbers(text: string): string {
  return (
    text
      .replace(/\bII\b/g, 'two')
      .replace(/\bIII\b/g, 'three')
      // Pistenbezeichnung: „06R“ = zero six right
      .replace(/\b(\d{1,2})([LRC])\b/g, (_, n: string, side: string) => `${n} ${RUNWAY_SIDE[side]}`)
      // mehrere Punkte („4.7.1“): keine Dezimalzahl, sondern einzelne Ziffern
      .replace(/\d+(?:\.\d+){2,}/g, (m) => m.replace(/\./g, ' '))
      // Wort und Ziffern zusammengeschrieben: „Raven61“, „1-1Information“
      .replace(/(\p{L})(\d)/gu, '$1 $2')
      .replace(/(\d)(\p{L})/gu, '$1 $2')
      .replace(/(?<![\d.,])(\d{1,3}),?000(?![.,]?\d)/g, '$1 thousand')
      .replace(/(?<![\d.,])(\d{1,3}),?([1-9])00(?![.,]?\d)/g, '$1 thousand $2 hundred')
  )
}

export function cleanTranscript(raw: string): Transcript {
  let text = raw
    // Markierungen der Erkennung: [BLANK_AUDIO], [ Silence ], (wind blowing), *cough*, ♪
    .replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*|[♪♫]/g, ' ')
    // Auslassungspunkte und Gedankenstriche am Rand
    .replace(/^[\s.…\-–—]+|[\s…\-–—]+$/g, '')
  text = normalizeSpace(text)
  const bare = text.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!bare || HALLUCINATIONS.includes(bare)) return { text: '', raw, discarded: 'empty' }
  text = normalizeSpace(spokenNumbers(fixMishearings(text)))
  return { text, raw }
}
