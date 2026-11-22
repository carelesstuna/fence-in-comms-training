/**
 * Lädt alle Inhaltsdateien zur Build-Zeit (Vite) und baut den Inhaltsindex.
 */
import { buildContentIndex, type BuildResult } from './core/content/index'

const raw = import.meta.glob(['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Ein unerwarteter Fehler beim Aufbau landet in der Fehlerliste statt in einer weißen Seite. */
function build(): BuildResult {
  try {
    return buildContentIndex(raw)
  } catch (e) {
    return { index: null, errors: [{ file: '(Inhaltsindex)', message: e instanceof Error ? e.message : String(e) }] }
  }
}

export const contentResult = build()
