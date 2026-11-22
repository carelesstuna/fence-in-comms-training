/**
 * Glossar: Brevity-Codes, Standardwörter und Grundbegriffe durchsuchen, nachschlagen und in
 * Funksprüchen erkennen. Reine Funktionen ohne React.
 */
import type { BasicTerm, BrevityCategory, BrevityTerm, Layer, Proword } from '../content/schema'

export type GlossaryKind = 'brevity' | 'proword' | 'basic'

export interface GlossaryEntry {
  /** Eindeutig, z. B. "brevity:bogey-dope" – auch als Anker in der Glossar-Seite. */
  key: string
  word: string
  kind: GlossaryKind
  meaning: string
  note?: string
  example?: string
  category?: BrevityCategory
  see: string[]
  aliases: string[]
  layer: Layer
  /** Quellen weichen ab. */
  check: boolean
  /** Themenseite, auf die der Eintrag ausdrücklich verweist (sonst gilt `terms` der Themenseiten, siehe topicForEntry). */
  topic?: string
}

export const CATEGORY_LABELS: Record<BrevityCategory, string> = {
  identitaet: 'Identität & ROE',
  anfragen: 'Anfragen & Formate',
  sicht: 'Sicht & Kontakt',
  sensoren: 'Sensoren & Störung',
  waffen: 'Waffen',
  treibstoff: 'Treibstoff & Waffenstand',
  manoever: 'Manöver & Tempo',
  aspekt: 'Aspekt',
  ablauf: 'Navigation & Ablauf',
  lagebild: 'Lagebild & Gruppen',
  kontrolle: 'Kontrolle & Systeme',
}

/** Kleinbuchstaben, ohne Akzente und Satzzeichen, einfache Leerzeichen. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ß]+/g, ' ')
    .trim()
}

const slug = (s: string) => norm(s).replace(/ /g, '-')

export function buildGlossary(brevity: readonly BrevityTerm[], prowords: readonly Proword[], basics: readonly BasicTerm[] = []): GlossaryEntry[] {
  const b: GlossaryEntry[] = brevity.map((t) => ({ ...t, key: `brevity:${slug(t.word)}`, kind: 'brevity' }))
  const p: GlossaryEntry[] = prowords.map((t) => ({ ...t, key: `proword:${slug(t.word)}`, kind: 'proword', see: [], aliases: [], check: false }))
  const g: GlossaryEntry[] = basics.map((t) => ({ ...t, key: `basic:${slug(t.word)}`, kind: 'basic', check: false }))
  return [...b, ...p, ...g].sort((x, y) => x.word.localeCompare(y.word, 'de', { sensitivity: 'base' }))
}

const names = (e: GlossaryEntry) => [e.word, ...e.aliases].map(norm)
const PRIORITY: GlossaryKind[] = ['brevity', 'proword', 'basic']

/**
 * Die Themenseite zu einem Glossar-Eintrag („Ausführlich lesen“): das `topic` des Eintrags, sonst die erste
 * Seite, die den Begriff in `terms` nennt. Ohne Treffer undefined.
 */
export function topicForEntry(entry: GlossaryEntry, topics: Iterable<{ id: string; terms: readonly string[] }>): string | undefined {
  if (entry.topic) return entry.topic
  const mine = names(entry)
  for (const t of topics) if (t.terms.some((term) => mine.includes(norm(term)))) return t.id
  return undefined
}

/** Einen Begriff nachschlagen (Wort oder Schreibweise). Brevity vor Standardwort vor Grundbegriff, außer `kind` sagt etwas anderes. */
export function lookupTerm(entries: readonly GlossaryEntry[], text: string, kind?: GlossaryKind): GlossaryEntry | undefined {
  const t = norm(text)
  const hits = entries.filter((e) => (!kind || e.kind === kind) && names(e).includes(t))
  return hits.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind))[0]
}

/**
 * Suche: jedes Suchwort muss irgendwo vorkommen. Treffer im Begriff selbst stehen vorn
 * (genau > Anfang > enthalten), Treffer nur in der Erklärung dahinter.
 */
export function searchGlossary(entries: readonly GlossaryEntry[], query: string): GlossaryEntry[] {
  const q = norm(query)
  if (!q) return [...entries]
  const tokens = q.split(' ')
  const scored: { e: GlossaryEntry; score: number }[] = []
  for (const e of entries) {
    const n = names(e)
    // Suchwörter müssen am Wortanfang stehen – „over“ findet nicht „Manöver“, „treibstoff“ aber „Treibstoffstand“
    const words = norm([e.word, ...e.aliases, e.meaning, e.note ?? '', e.example ?? ''].join(' ')).split(' ')
    if (!tokens.every((tok) => words.some((w) => w.startsWith(tok)))) continue
    let score = 10
    if (n.includes(q)) score = 100
    else if (n.some((x) => x.startsWith(q))) score = 80
    else if (n.some((x) => x.includes(q))) score = 60
    else if (tokens.every((tok) => n.some((x) => x.includes(tok)))) score = 40
    if (e.kind === 'brevity') score += 1
    scored.push({ e, score })
  }
  return scored.sort((a, b) => b.score - a.score || a.e.word.localeCompare(b.e.word, 'de')).map((x) => x.e)
}

/**
 * Begriffe, die in einem Text vorkommen (ganze Wörter, längster Treffer zuerst, ohne Überlappung) –
 * z. B. „bogey dope“ statt „bogey“.
 */
export function termsInText(entries: readonly GlossaryEntry[], text: string): GlossaryEntry[] {
  const words = norm(text).split(' ').filter(Boolean)
  const candidates = entries.flatMap((e) => names(e).map((n) => ({ e, parts: n.split(' ') })))
  candidates.sort((a, b) => b.parts.length - a.parts.length)
  const used = new Array<boolean>(words.length).fill(false)
  const found: { e: GlossaryEntry; at: number }[] = []
  for (const { e, parts } of candidates) {
    for (let i = 0; i + parts.length <= words.length; i++) {
      if (parts.every((p, k) => words[i + k] === p && !used[i + k])) {
        for (let k = 0; k < parts.length; k++) used[i + k] = true
        if (!found.some((f) => f.e === e)) found.push({ e, at: i })
      }
    }
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.e)
}

/** Glossar-Einträge zu einem Segment eines Funkspruchs. */
export function termsForSegment(entries: readonly GlossaryEntry[], text: string, role: string): GlossaryEntry[] {
  if (role === 'brevity') return termsInText(entries.filter((e) => e.kind === 'brevity'), text)
  if (role === 'proword') return termsInText(entries.filter((e) => e.kind === 'proword'), text)
  // Andere Rollen: nur, wenn das ganze Segment ein Begriff ist (z. B. „fence in“ als Anweisung)
  const hit = lookupTerm(entries, text)
  return hit ? [hit] : []
}
