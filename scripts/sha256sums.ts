/**
 * Nach `tauri build`: SHA-256-Prüfsumme des Installers nach
 * src-tauri/target/release/bundle/SHA256SUMS.txt schreiben (für die Release-Seite).
 */
import { createHash } from 'node:crypto'
import { createReadStream, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const bundle = join(root, 'src-tauri', 'target', 'release', 'bundle')
const nsis = join(bundle, 'nsis')

async function sha256(file: string): Promise<string> {
  const h = createHash('sha256')
  await pipeline(createReadStream(file), h)
  return h.digest('hex')
}

const installers = existsSync(nsis) ? readdirSync(nsis).filter((f) => f.endsWith('-setup.exe')) : []
if (!installers.length) throw new Error(`Kein Installer in ${nsis} – erst „tauri build“.`)
const lines = await Promise.all(installers.map(async (f) => `${await sha256(join(nsis, f))}  ${f}`))
const sums = lines.join('\n') + '\n'
writeFileSync(join(bundle, 'SHA256SUMS.txt'), sums, 'utf8')
console.log(`✓ ${join(bundle, 'SHA256SUMS.txt')}\n${sums}`)
