/** Das Glossar der geladenen Inhalte (Brevity + Standardwörter), einmal aufgebaut. */
import { buildGlossary, topicForEntry, type GlossaryEntry } from '../core/glossary/glossary'
import { content } from './run'

// content fehlt nur, wenn die Inhalte Fehler haben – dann zeigt die App ohnehin die Fehlerliste
export const glossary = content ? buildGlossary(content.brevity, content.prowords, content.basics) : []

/** Link auf den Eintrag in der Glossar-Seite. */
export const glossaryLink = (e: GlossaryEntry) => `/glossary?q=${encodeURIComponent(e.word.toLowerCase())}`

/** Themenseite zu einem Eintrag („Ausführlich lesen“) – oder null, wenn es keine gibt. */
export function topicOf(e: GlossaryEntry): { id: string; title: string; to: string } | null {
  if (!content) return null
  const id = topicForEntry(e, content.topics.values())
  const topic = id ? content.topics.get(id) : undefined
  return topic ? { id: topic.id, title: topic.title, to: `/wissen/${topic.id}` } : null
}
