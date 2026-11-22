/**
 * Prüft alle Inhaltsdateien unter content/ gegen die Schemas und Querverweise.
 * Aufruf: npm run validate
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildContentIndex } from '../src/core/content/index.ts'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const contentDir = join(root, 'content')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

export function readContentFiles(): Record<string, string> {
  const files: Record<string, string> = {}
  for (const file of walk(contentDir)) {
    if (!/\.(ya?ml|md)$/.test(file) || file.endsWith('README.md')) continue
    files[relative(root, file).replace(/\\/g, '/')] = readFileSync(file, 'utf8')
  }
  return files
}

const files = readContentFiles()
const { index, errors } = buildContentIndex(files)

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} Fehler in den Inhalten:\n`)
  for (const e of errors) console.error(`  ${e.file}\n    → ${e.message}`)
  process.exit(1)
}

const available = [...index!.modules.values()].filter((m) => m.status === 'available')
console.log(
  `✓ Inhalte gültig: ${index!.lessons.size} Lektionen, ${index!.drills.size} Übungen, ` +
    `${index!.exchanges.size} Funksprüche, ${index!.scenarios.size} Szenarien, ${index!.hangar.size} Hangar-Karten, ` +
    `${index!.airfields.length} Flugplätze, ${index!.brevity.length} Brevity-Codes, ${index!.prowords.length} Standardwörter, ` +
    `${index!.basics.length} Grundbegriffe, ${index!.topics.size} Themenseiten, ` +
    `${available.length} spielbare Module`,
)
