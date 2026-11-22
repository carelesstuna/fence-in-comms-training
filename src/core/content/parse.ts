/**
 * Hilfsfunktionen zum Zerlegen von Markdown-Inhalten (Frontmatter, Seiten, Direktiven).
 * Bewusst ohne Abhängigkeit von React oder Vite, damit sie auch im Node-Validator laufen.
 */
import { parse as parseYaml } from 'yaml'

export interface Frontmatter {
  data: unknown
  body: string
}

/** Trennt YAML-Frontmatter (zwischen `---`-Zeilen am Dateianfang) vom Markdown-Text. */
export function splitFrontmatter(raw: string): Frontmatter {
  const text = (raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!match) return { data: {}, body: text }
  return { data: parseYaml(match[1]) ?? {}, body: text.slice(match[0].length) }
}

/** Zerlegt einen Markdown-Text an `---`-Zeilen (außerhalb von Codeblöcken) in Seiten. */
export function splitPages(body: string): string[] {
  const pages: string[] = []
  let current: string[] = []
  let inFence = false
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    if (!inFence && /^---\s*$/.test(line)) {
      pages.push(current.join('\n').trim())
      current = []
      continue
    }
    current.push(line)
  }
  pages.push(current.join('\n').trim())
  return pages.filter((p) => p.length > 0)
}

/** Parst Direktiven-Attribute wie `id=foo repeat=3 label="Text mit Leerzeichen"`. */
export function parseAttributes(attrs: string): Record<string, string> {
  const result: Record<string, string> = {}
  const re = /([a-zA-Z][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(attrs)) !== null) {
    result[m[1]] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return result
}

export interface LeafDirective {
  name: string
  attributes: Record<string, string>
}

/** Prüft, ob eine Seite ausschließlich aus einer Blatt-Direktive `::name{...}` besteht. */
export function soleLeafDirective(page: string): LeafDirective | null {
  const m = /^::([a-z][a-z0-9-]*)\{([^}]*)\}$/.exec(page.trim())
  if (!m) return null
  return { name: m[1], attributes: parseAttributes(m[2]) }
}

/** Findet alle Direktiven (`::name{…}` und `:::name{…}`) in einem Markdown-Text. */
/** Inline-Glossarverweise `:term[tally]` im Text. */
export function findTerms(markdown: string): string[] {
  return [...markdown.matchAll(/(?<![:\w]):term\[([^\]]+)\]/g)].map((m) => m[1].trim())
}

/**
 * Verweise innerhalb der App im Markdown-Link-Format, z. B. `[Squawk](/wissen/squawk-transponder-iff)` oder
 * `[Lektion](/lesson/m3-l6)`. Nur Ziele, die mit einem einzelnen „/“ beginnen.
 */
export function findInternalLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\((\/(?!\/)[^)\s]*)\)/g)].map((m) => m[1])
}

export function findDirectives(markdown: string): LeafDirective[] {
  const found: LeafDirective[] = []
  const re = /:{2,3}([a-z][a-z0-9-]*)\{([^}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    found.push({ name: m[1], attributes: parseAttributes(m[2]) })
  }
  return found
}
