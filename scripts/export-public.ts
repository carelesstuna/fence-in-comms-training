/**
 * Öffentlicher Stand für GitHub: schreibt den committeten Stand (HEAD) ohne Git-Historie in ein
 * eigenes Repo – nur die freigegebenen Pfade – und sucht vorher nach privaten Spuren.
 *
 *   npm run export-public -- <Zielordner>
 *
 * Der Zielordner ist ein eigenes Git-Repo (`git init -b main`), leer oder ein früherer Export.
 * Alles darin außer `.git` wird ersetzt. Committen und pushen bleibt Handarbeit.
 *
 * Jede Datei im Repo muss unter PUBLIC oder PRIVATE fallen. Eine neue Datei außerhalb beider Listen
 * bricht den Export ab, bis sie eingeordnet ist – so rutscht nichts versehentlich mit.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mainRepoRoot } from './local-dirs'

/** Wird veröffentlicht. Ein Eintrag gilt für die Datei bzw. den Ordner mit allem darunter. */
export const PUBLIC: readonly string[] = [
  '.github',
  '.gitattributes',
  '.gitignore',
  '.prettierignore',
  '.prettierrc',
  'CONTRIBUTING.md',
  'LEGAL.md',
  'LICENSE',
  'LICENSE-CONTENT.md',
  'README.de.md',
  'README.md',
  'content',
  'docs/audio.md',
  'docs/desktop-app.md',
  'docs/konzept-auslieferung-und-sprache.md',
  'docs/screenshots',
  'docs/spracherkennung.md',
  'eslint.config.js',
  'index.html',
  'package-lock.json',
  'package.json',
  'public',
  'scripts',
  'src',
  'src-tauri',
  'third-party-licenses',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
]

/** Bleibt privat: Planung, Arbeitsnotizen, Reviews, lokale Einstellungen. Geht vor PUBLIC. */
export const PRIVATE: readonly string[] = [
  '.claude',
  'docs/PLAN.md',
  'docs/content-plan',
  'docs/parkplatz-msfs.md',
  'docs/research',
  'docs/reviews',
  'docs/todo-spieltest.md',
]

const under = (path: string, list: readonly string[]) =>
  list.some((p) => path === p || path.startsWith(`${p}/`))

export function classify(path: string): 'public' | 'private' | 'unknown' {
  if (under(path, PRIVATE)) return 'private'
  if (under(path, PUBLIC)) return 'public'
  return 'unknown'
}

export interface Finding {
  file: string
  line: number
  text: string
  reason: string
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Spuren, die nie öffentlich werden dürfen: Benutzerordner, andere Laufwerke und die lokalen Ordner neben
 * dem Repo („<Repo> …“, z. B. für Aufnahmen). Name und Mailadresse kommen aus `git config`.
 */
export function genericPatterns(repoFolder: string): { re: RegExp; reason: string }[] {
  return [
    { re: new RegExp(`${escape(repoFolder)} [A-ZÄÖÜ]`), reason: 'lokaler Ordner neben dem Repo' },
    { re: /[A-Za-z]:[\\/]Users[\\/]/i, reason: 'Benutzerordner' },
    { re: /\b[D-Z]:\\/, reason: 'Pfad auf einem lokalen Laufwerk' },
    { re: /<(GITHUB-KONTO|REPO-URL)>/, reason: 'Platzhalter nicht ausgefüllt' },
  ]
}

/** Suchmuster für Name und Mailadresse: ganze Adresse, ihr lokaler Teil, voller Name, Nachname. */
export function personalPatterns(name: string, email: string): { re: RegExp; reason: string }[] {
  const out: { re: RegExp; reason: string }[] = []
  const add = (s: string, reason: string) => {
    if (s.trim().length >= 4) out.push({ re: new RegExp(escape(s.trim()), 'i'), reason })
  }
  add(email, 'eigene Mailadresse')
  add(email.split('@')[0] ?? '', 'eigene Mailadresse (Name)')
  add(name, 'eigener Name')
  const last = name.trim().split(/\s+/).at(-1) ?? ''
  if (last !== name.trim()) add(last, 'eigener Nachname')
  return out
}

const isBinary = (buf: Buffer) => buf.subarray(0, 8000).includes(0)

/** Zeilen, die auf ein Muster passen (je Zeile nur der erste Grund). */
export function scan(
  files: ReadonlyMap<string, Buffer>,
  patterns: readonly { re: RegExp; reason: string }[],
): Finding[] {
  const found: Finding[] = []
  for (const [file, buf] of files) {
    if (isBinary(buf)) continue
    buf
      .toString('utf8')
      .split('\n')
      .forEach((text, i) => {
        const hit = patterns.find(({ re }) => re.test(text))
        if (hit)
          found.push({ file, line: i + 1, text: text.trim().slice(0, 140), reason: hit.reason })
      })
  }
  return found
}

/** Verweise auf private Dateien (z. B. docs/research) – im öffentlichen Stand laufen sie ins Leere. */
export function privateRefPatterns(): { re: RegExp; reason: string }[] {
  return PRIVATE.filter((p) => p.includes('/')).map((p) => ({
    re: new RegExp(escape(p)),
    reason: `Verweis auf ${p} (nicht öffentlich)`,
  }))
}

// ---------------------------------------------------------------------------------------------------

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function git(args: string[], input?: string): Buffer {
  return execFileSync('git', args, { cwd: root, input, maxBuffer: 512 << 20 })
}

/** Inhalte aller Dateien aus HEAD in einem Rutsch (`git cat-file --batch`). */
function readBlobs(paths: readonly string[]): Map<string, Buffer> {
  const out = git(['cat-file', '--batch'], paths.map((p) => `HEAD:${p}`).join('\n') + '\n')
  const blobs = new Map<string, Buffer>()
  let pos = 0
  for (const p of paths) {
    const nl = out.indexOf(0x0a, pos)
    const header = out.subarray(pos, nl).toString('utf8').split(' ')
    if (header[1] !== 'blob') throw new Error(`Kein Dateiinhalt für ${p}: ${header.join(' ')}`)
    const size = Number(header[2])
    blobs.set(p, out.subarray(nl + 1, nl + 1 + size))
    pos = nl + 1 + size + 1
  }
  return blobs
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

function print(title: string, list: readonly Finding[], max = 40) {
  console.log(`\n${title} (${list.length}):`)
  for (const f of list.slice(0, max)) console.log(`  ${f.file}:${f.line}  [${f.reason}]  ${f.text}`)
  if (list.length > max) console.log(`  … und ${list.length - max} weitere`)
}

function main() {
  const arg = process.argv[2]
  if (!arg) fail('Zielordner fehlt: npm run export-public -- <Zielordner>')
  const target = resolve(arg)
  const rel = relative(root, target)
  if (!rel || (!rel.startsWith('..') && !isAbsolute(rel)))
    fail('Der Zielordner darf nicht im Repo selbst liegen.')
  if (!existsSync(join(target, '.git')))
    fail(`${target} ist kein Git-Repo – dort erst „git init -b main“.`)
  const existing = readdirSync(target).filter((f) => f !== '.git')
  if (existing.length && !existsSync(join(target, 'LICENSE-CONTENT.md')))
    fail(`${target} ist weder leer noch ein früherer Export – zur Sicherheit Abbruch.`)

  if (git(['status', '--porcelain']).toString().trim())
    console.warn('Hinweis: Nicht committete Änderungen gehen nicht mit, exportiert wird HEAD.')

  const all = git(['ls-tree', '-r', '-z', '--name-only', 'HEAD'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
  const unknown = all.filter((f) => classify(f) === 'unknown')
  if (unknown.length)
    fail(
      `Nicht eingeordnet – in PUBLIC oder PRIVATE (scripts/export-public.ts) eintragen:\n  ${unknown.join('\n  ')}`,
    )
  const pub = all.filter((f) => classify(f) === 'public')
  const blobs = readBlobs(pub)

  const name = git(['config', 'user.name']).toString().trim()
  const email = git(['config', 'user.email']).toString().trim()
  const leaks = scan(blobs, [
    ...genericPatterns(basename(mainRepoRoot(root))),
    ...personalPatterns(name, email),
  ])
  if (leaks.length) {
    print('Private Spuren im öffentlichen Stand', leaks)
    fail('Nichts geschrieben. Erst die Fundstellen bereinigen und committen.')
  }

  for (const f of existing) rmSync(join(target, f), { recursive: true, force: true })
  for (const [file, buf] of blobs) {
    mkdirSync(dirname(join(target, file)), { recursive: true })
    writeFileSync(join(target, file), buf)
  }

  const refs = scan(
    new Map([...blobs].filter(([f]) => !f.startsWith('scripts/export-public'))),
    privateRefPatterns(),
  )
  if (refs.length) print('Hinweis: Verweise auf nicht veröffentlichte Dateien', refs, 15)

  const head = git(['rev-parse', '--short', 'HEAD']).toString().trim()
  console.log(
    `\n✓ ${pub.length} Dateien (Stand ${head}) nach ${target}; ${all.length - pub.length} bleiben privat.`,
  )
  console.log(`  Weiter: git -C "${target}" add -A  und  git -C "${target}" commit`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
