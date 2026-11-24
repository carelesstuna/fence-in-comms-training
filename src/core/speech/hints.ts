/**
 * Hinweise für die Spracherkennung: Vokabular und Prompt (Whisper `--prompt` bzw. `initial_prompt`).
 *
 * **Nie die Lösung.** Die Hinweise hängen nur vom Modul und von den Stationen auf der Frequenz ab,
 * nie vom erwarteten Funkspruch – die Funktionen bekommen ihn gar nicht erst. Stünde er im Prompt,
 * „hörte“ Whisper die richtige Antwort, auch wenn man etwas anderes sagt. Deshalb enthält der Prompt
 * auch keine Zahlen (außer der festen Ziffernreihe, wenn ausgeschriebene Ziffern gewünscht sind).
 *
 * Whisper verträgt etwa 224 Tokens Prompt. Ausgewählt wird nach Vorrang: Ziffern (falls gewünscht),
 * Stationen, Begriffe des Moduls, Standardwörter, Rufzeichen, Alphabet. Gruppen, in denen eine Auswahl einzelne
 * Möglichkeiten bevorzugen würde (Rufzeichen, Alphabet), kommen ganz oder gar nicht hinein.
 */
import type { ContentIndex } from '../content/index'
import type { Transmission } from '../content/schema'

export interface RecognitionHints {
  /** Prompt für Whisper (Liste von Begriffen, ohne Lösung und ohne Zahlen). */
  prompt: string
  /** Alle Begriffe im Prompt, z. B. für Engines mit Wortlisten. */
  vocabulary: string[]
  /** Ziffern ausgeschrieben erzwingen („one one“ statt „11“): Engines unterdrücken dann Ziffern in der Ausgabe. */
  spellDigits: boolean
}

export interface HintContext {
  /** Modul, aus dem der Funkspruch stammt (bestimmt die Auswahl der Begriffe). */
  moduleId?: string
  /** Stationen auf der Frequenz, z. B. „Batumi Ground“, „Darkstar“ (Zahlen werden entfernt). */
  stations?: readonly string[]
}

export interface HintOptions {
  spellDigits?: boolean
  /** Obergrenze in (geschätzten) Tokens. */
  maxTokens?: number
}

/** Die feste Ziffernreihe im Prompt, wenn ausgeschriebene Ziffern gewünscht sind. */
export const DIGIT_PHRASE = 'zero, one, two, three, four, five, six, seven, eight, niner'

const NUMBER_WORDS =
  /\b(zero|one|two|three|four|five|six|seven|eight|nine|niner|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|tree|fife|fower)\b/i
/** Enthält der Text eine Zahl (Ziffern oder Zahlwort)? */
export const hasNumber = (s: string): boolean => /\d/.test(s) || NUMBER_WORDS.test(s)

/**
 * Grobe Schätzung der Whisper-Tokens (GPT-2-BPE): kurze, häufige Wörter sind ein Token,
 * lange oder seltene mehrere, jedes Satzzeichen eins. Lieber etwas zu hoch als zu niedrig.
 */
export function estimateTokens(text: string): number {
  let n = 0
  for (const w of text.split(/\s+/)) {
    if (!w) continue
    const core = w.replace(/[^\p{L}\p{N}']/gu, '')
    n += core ? Math.max(1, Math.ceil(core.length / 4)) : 0
    n += w.length - core.length
  }
  return n
}

// ---------------------------------------------------------------------------
// Module und Stationen
// ---------------------------------------------------------------------------

interface ModuleMap {
  exchange: Map<string, string>
  scenario: Map<string, string>
  texts: Map<string, string>
}
const moduleMaps = new WeakMap<ContentIndex, ModuleMap>()

function transmissionText(ts: readonly Transmission[]): string[] {
  return ts.flatMap((t) => t.segments.flatMap((s) => [s.text, ...(s.alt ?? [])]))
}

/** Welche Funksprüche und Szenarien gehören zu welchem Modul (über die Lektionen)? Mit Cache. */
function moduleMap(index: ContentIndex): ModuleMap {
  const hit = moduleMaps.get(index)
  if (hit) return hit
  const exchange = new Map<string, string>()
  const scenario = new Map<string, string>()
  for (const lesson of index.lessons.values()) {
    for (const step of lesson.steps) {
      if (step.kind === 'drill') {
        const call = (index.drills.get(step.drillId) as { call?: string } | undefined)?.call
        if (call && !exchange.has(call)) exchange.set(call, lesson.module)
      } else if (step.kind === 'scenario' && !scenario.has(step.scenarioId)) {
        scenario.set(step.scenarioId, lesson.module)
      }
    }
  }
  // Texte je Modul (klein geschrieben): Segmente samt Varianten und Würfelwerte (oneOf in vars)
  const parts = new Map<string, string[]>()
  const add = (m: string, texts: string[]) => parts.set(m, [...(parts.get(m) ?? []), ...texts])
  for (const [id, m] of exchange) {
    const x = index.exchanges.get(id)
    if (x) add(m, [...transmissionText(x.transmissions), JSON.stringify(x.vars ?? {})])
  }
  for (const [id, m] of scenario) {
    const sc = index.scenarios.get(id)
    if (!sc) continue
    const ts = sc.steps.flatMap((st) => [...st.hear, ...(st.you ? [st.you.transmission] : []), ...st.reply])
    add(m, [...transmissionText(ts), JSON.stringify(sc.vars ?? {})])
  }
  const texts = new Map([...parts].map(([m, list]) => [m, ` ${list.join(' \n ').toLowerCase()} `]))
  const map = { exchange, scenario, texts }
  moduleMaps.set(index, map)
  return map
}

/** Modul eines Funkspruchs oder Szenarios; undefined, wenn es in keiner Lektion vorkommt. */
export function moduleOf(index: ContentIndex, ref: { exchangeId?: string; scenarioId?: string; drillId?: string }): string | undefined {
  const m = moduleMap(index)
  return (ref.exchangeId && m.exchange.get(ref.exchangeId)) || (ref.scenarioId && m.scenario.get(ref.scenarioId)) || (ref.drillId && drillModule(index, ref.drillId)) || undefined
}

/**
 * Modul einer Übung: die Lektion, in der sie steht – sonst die Lektion, mit deren ID ihre ID beginnt (so heißen
 * die Fragen der Modulprüfung, z. B. „m1-l7-x-calc-tower“).
 */
function drillModule(index: ContentIndex, drillId: string): string | undefined {
  let prefix: { len: number; module: string } | undefined
  for (const lesson of index.lessons.values()) {
    if (lesson.steps.some((s) => s.kind === 'drill' && s.drillId === drillId)) return lesson.module
    if (drillId.startsWith(`${lesson.id}-`) && lesson.id.length > (prefix?.len ?? 0)) prefix = { len: lesson.id.length, module: lesson.module }
  }
  return prefix?.module
}

/** Stationsnamen ohne Zahlen: „Viper 1-1“ → „Viper“, „Batumi Ground“ bleibt. Doppelte fallen weg. */
export function stationNames(speakers: readonly string[]): string[] {
  const out: string[] = []
  for (const s of speakers) {
    const name = s
      .replace(/[\d-]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w && !NUMBER_WORDS.test(w))
      .join(' ')
      .trim()
    if (name && !out.some((o) => o.toLowerCase() === name.toLowerCase())) out.push(name)
  }
  return out
}

// ---------------------------------------------------------------------------
// Vokabular
// ---------------------------------------------------------------------------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Wie oft kommt der Begriff (als ganzes Wort) im Text vor? */
function occurrences(text: string, term: string): number {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(term.toLowerCase())}(?![\\p{L}\\p{N}])`, 'gu')
  return text.match(re)?.length ?? 0
}

/** Brevity (samt Schreibvarianten), Standardwörter und Grundbegriffe – ohne Zahlen, klein geschrieben. */
function glossaryTerms(index: ContentIndex): string[] {
  const all = [
    ...index.brevity.flatMap((b) => [b.word, ...b.aliases]),
    ...index.prowords.map((p) => p.word),
    ...index.basics.flatMap((b) => [b.word, ...b.aliases]),
  ]
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of all) {
    const w = t.toLowerCase().trim()
    // Kurze Allerweltswörter („in“, „up“) helfen der Erkennung nicht und kosten Platz
    if (w.length < 4 || hasNumber(w) || seen.has(w)) continue
    seen.add(w)
    out.push(w)
  }
  return out
}

/** Begriffe, die in den Funksprüchen des Moduls vorkommen – häufige zuerst. */
function moduleTerms(index: ContentIndex, moduleId: string | undefined): string[] {
  const text = moduleId ? moduleMap(index).texts.get(moduleId) : undefined
  if (!text) return []
  return glossaryTerms(index)
    .map((term) => ({ term, n: occurrences(text, term) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.term.localeCompare(b.term))
    .map((x) => x.term)
}

function callsignNames(index: ContentIndex): string[] {
  return [...new Set(Object.values(index.callsigns).flat())].filter((n) => !hasNumber(n))
}

/**
 * Prompt und Vokabular für einen Funkspruch – nur aus Modul und Stationen, nie aus der Lösung.
 */
export function buildHints(index: ContentIndex, ctx: HintContext = {}, opts: HintOptions = {}): RecognitionHints {
  const spellDigits = opts.spellDigits ?? false
  // Etwas Abstand zu den 224 Tokens, weil die Schätzung bei seltenen Namen zu niedrig liegen kann
  const budget = opts.maxTokens ?? 180
  let used = 0
  const fits = (items: readonly string[]) => estimateTokens(items.join(', ')) + 2 <= budget - used
  const take = (items: readonly string[]): string[] => {
    const out: string[] = []
    for (const it of items) {
      if (!fits([...out, it])) break
      out.push(it)
    }
    if (out.length) used += estimateTokens(out.join(', ')) + 2
    return out
  }
  const all = (items: readonly string[]): string[] => {
    if (!items.length || !fits(items)) return []
    used += estimateTokens(items.join(', ')) + 2
    return [...items]
  }

  // Die Ziffernreihe zuerst: Ohne sie schreibt Whisper Ziffern, auch wenn sie unterdrückt werden
  const digits = spellDigits ? all([DIGIT_PHRASE]) : []
  const stations = take(stationNames(ctx.stations ?? []))
  const taken = new Set(stations.map((s) => s.toLowerCase()))
  const fresh = (list: string[]) => {
    const out = list.filter((t) => !taken.has(t.toLowerCase()))
    for (const t of out) taken.add(t.toLowerCase())
    return out
  }
  const terms = take(fresh(moduleTerms(index, ctx.moduleId)))
  const prowords = take(fresh(index.prowords.filter((p) => p.layer === 'core').map((p) => p.word.toLowerCase()).filter((w) => !hasNumber(w))))
  const callsigns = all(fresh(callsignNames(index)))
  const alphabet = all(index.phonetic.letters.map((l) => l.word))

  // Stationen zuerst: Stehen sie am Ende (direkt vor der Aufnahme), hält Whisper den Namen für schon
  // gesagt und lässt ihn am Anfang des Funkspruchs weg („Darkstar, Ford seven one …“ → „471 …“)
  const groups = [stations, alphabet, callsigns, digits, prowords, terms].filter((g) => g.length)
  const prompt = groups.map((g) => g.join(', ')).join('. ') + (groups.length ? '.' : '')
  return {
    prompt,
    vocabulary: [...stations, ...terms, ...prowords, ...callsigns, ...alphabet],
    spellDigits,
  }
}
