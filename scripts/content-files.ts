/**
 * Inhaltsindex für Node-Skripte (ohne die Ausgaben von validate-content.ts).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildContentIndex, type ContentIndex } from '../src/core/content/index.ts'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

export function loadContentIndex(): ContentIndex {
  const files: Record<string, string> = {}
  for (const file of walk(join(root, 'content'))) {
    if (!/\.(ya?ml|md)$/.test(file) || file.endsWith('README.md')) continue
    files[relative(root, file).replace(/\\/g, '/')] = readFileSync(file, 'utf8')
  }
  const { index, errors } = buildContentIndex(files)
  if (!index || errors.length) throw new Error(`Inhalte fehlerhaft (${errors.length} Fehler) – bitte npm run validate ausführen.`)
  return index
}
