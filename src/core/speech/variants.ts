/**
 * Funksprüche für die Messreihe: gewürfelt aus den Inhalten, richtig oder absichtlich falsch.
 *
 * Eine falsche Variante wird nur genommen, wenn die Bewertung sie getippt auch ablehnt. Dann misst die
 * Messreihe allein die Spracherkennung: Akzeptiert die Bewertung das Transkript einer falschen Variante,
 * hat die Erkennung den Fehler „weggehört“.
 */
import type { ContentIndex } from '../content/index'
import type { ResolvedSegment, ResolvedTransmission } from '../drills/types'
import { resolveExchange, resolveScenario } from '../drills/resolve'
import type { Rng } from '../random/rng'
import { randomSelf, type ResolveEnv } from '../random/vars'
import { scoreCall, type ScoreSegment } from '../scoring/score'
import { moduleOf, stationNames } from './hints'
import type { VariantKind } from './recording'

export { VARIANT_KINDS, VARIANT_LABEL, type VariantKind } from './recording'

export interface CallVariant {
  kind: VariantKind
  /** Was gesprochen wird (leer bei Stille). */
  text: string
  /** Soll die Bewertung den Funkspruch annehmen? Bei Stille darf gar nichts erkannt werden. */
  shouldAccept: boolean
  /** Bei falschen Varianten: welches Segment wie verändert wurde. */
  change?: { segment: number; from: string; to: string }
}

const DIGIT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'] as const
const DIGIT_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|niner)\b/gi

/** Der Funkspruch so, wie man ihn vorliest: Segmente mit Komma getrennt. */
export const spokenText = (segments: readonly ScoreSegment[]): string => segments.map((s) => s.text).join(', ')

function withSegment(segments: readonly ScoreSegment[], index: number, text: string): string {
  return segments.map((s, i) => (i === index ? text : s.text)).join(', ')
}

/** Alle Stellen, an denen ein Ziffernwort steht. */
function digitSpots(text: string): { at: number; word: string }[] {
  return [...text.matchAll(DIGIT_RE)].map((m) => ({ at: m.index, word: m[0] }))
}

/** Ein Ziffernwort durch ein anderes ersetzen – Kandidaten in zufälliger Reihenfolge. */
function digitChanges(text: string, rng: Rng): string[] {
  const out: string[] = []
  for (const spot of rng.shuffle(digitSpots(text))) {
    const current = spot.word.toLowerCase() === 'nine' ? 'niner' : spot.word.toLowerCase()
    for (const d of rng.shuffle(DIGIT_WORDS.filter((w) => w !== current)).slice(0, 3)) {
      out.push(text.slice(0, spot.at) + d + text.slice(spot.at + spot.word.length))
    }
  }
  return out
}

function nameChanges(text: string, names: readonly string[], rng: Rng): string[] {
  const out: string[] = []
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\b`, 'i')
    if (!re.test(text)) continue
    for (const other of rng.shuffle(names.filter((n) => n.toLowerCase() !== name.toLowerCase())).slice(0, 3)) out.push(text.replace(re, other))
  }
  return out
}

/**
 * Variante eines Funkspruchs. Null, wenn es die gewünschte Art hier nicht gibt (kein Rufzeichen,
 * keine Zahl) oder jede Änderung im Toleranzbereich bliebe.
 */
export function makeVariant(segments: readonly ScoreSegment[], kind: VariantKind, rng: Rng, callsigns: readonly string[] = []): CallVariant | null {
  if (kind === 'silence') return { kind, text: '', shouldAccept: false }
  if (kind === 'correct') return { kind, text: spokenText(segments), shouldAccept: true }
  const candidates = segments
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !s.optional && (kind === 'wrong-callsign' ? s.role === 'callsign' : s.role !== 'callsign' && s.role !== 'addressee'))
  for (const { s, i } of rng.shuffle(candidates)) {
    const changes =
      kind === 'wrong-callsign'
        ? rng.chance(0.5)
          ? [...nameChanges(s.text, callsigns, rng), ...digitChanges(s.text, rng)]
          : [...digitChanges(s.text, rng), ...nameChanges(s.text, callsigns, rng)]
        : digitChanges(s.text, rng)
    for (const to of changes) {
      const text = withSegment(segments, i, to)
      // Abgelehnt werden muss sie getippt (mit Kommas) und wie ein Transkript (ohne Kommas)
      const rejected = !scoreCall(text, segments).correct && !scoreCall(text.replace(/,/g, ''), segments, undefined, { source: 'spoken' }).correct
      if (rejected) return { kind, text, shouldAccept: false, change: { segment: i, from: s.text, to } }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Funksprüche aus den Inhalten würfeln
// ---------------------------------------------------------------------------

export interface SpeakableCall {
  /** Herkunft, z. B. „exchange:m3-ready-departure#1“ oder „scenario:m3-taxi@4“. */
  source: string
  segments: ResolvedSegment[]
  /** Kontext für die Hinweise (nie die Lösung). */
  moduleId?: string
  stations: string[]
}

/** Alle eigenen Funksprüche (mindestens zwei Segmente) eines Durchlaufs mit gewürfeltem Rufzeichen. */
export function speakableCalls(index: ContentIndex, rng: Rng): SpeakableCall[] {
  const self = randomSelf(rng.fork('self'), index)
  // Kartenabhängig, damit beide Formen vorkommen („altimeter“ und „QNH“, „descend and maintain“ und „descend to“)
  const env = (label: string): ResolveEnv => ({ rng: rng.fork(label), content: index, self, phraseology: 'map' })
  const out: SpeakableCall[] = []
  const speakers = (ts: readonly ResolvedTransmission[]) => stationNames(ts.filter((t) => !t.you && !t.skip).map((t) => t.speaker))
  for (const x of index.exchanges.values()) {
    if (x.id.startsWith('beispiel')) continue
    const r = resolveExchange(x, env(x.id))
    r.transmissions.forEach((t, i) => {
      if (t.you && !t.skip && t.segments.length > 1) {
        out.push({ source: `exchange:${x.id}#${i}`, segments: t.segments, moduleId: moduleOf(index, { exchangeId: x.id }), stations: speakers(r.transmissions) })
      }
    })
  }
  for (const sc of index.scenarios.values()) {
    const r = resolveScenario(sc, env(sc.id))
    const heard = r.steps.flatMap((st) => [...st.hear, ...st.reply])
    const tuned = r.steps.flatMap((st) => (st.tune ? [st.tune.name] : []))
    r.steps.forEach((st, i) => {
      if (st.you && st.you.transmission.segments.length > 1) {
        out.push({
          source: `scenario:${sc.id}@${i}`,
          segments: st.you.transmission.segments,
          moduleId: moduleOf(index, { scenarioId: sc.id }),
          stations: stationNames([...tuned, ...heard.filter((t) => !t.you).map((t) => t.speaker)]),
        })
      }
    })
  }
  return out
}

/** Alle Rufzeichen-Namen aus den Pools (für falsche Rufzeichen). */
export function callsignPool(index: ContentIndex): string[] {
  return [...new Set(Object.values(index.callsigns).flat())]
}
