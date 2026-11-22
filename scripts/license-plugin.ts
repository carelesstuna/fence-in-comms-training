/**
 * Lizenzliste beim Build: alle npm-Pakete, die tatsächlich im Bundle landen (App, Web Worker,
 * AudioWorklet), und – beim Bauen über Tauri – die Rust-Crates der Desktop-Hülle.
 *
 * Ergebnis in dist/: `licenses.json` (für die Seite „Lizenzen“) und `LICENSES.txt` mit allen
 * Lizenztexten (gleiche Texte nur einmal, mit der Liste der Pakete, für die sie gelten).
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'

export interface LicenseEntry {
  name: string
  version: string
  license: string
  url?: string
  /** Schlüssel des Lizenztexts in LICENSES.txt (fehlt, wenn das Paket keinen mitbringt). */
  text?: string
}

export interface LicenseList {
  generated: string
  npm: LicenseEntry[]
  cargo: LicenseEntry[]
  /** Spracherkennung der Desktop-App (whisper.cpp, Modell), von scripts/stage-asr.ts. */
  asr: LicenseEntry[]
}

/** Module aus App- und Worker-Bundles (die Worker werden vor dem Haupt-Bundle gebaut). */
const modules = new Set<string>()

function collect(bundle: Record<string, { type: string; modules?: Record<string, unknown> }>) {
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === 'chunk' && chunk.modules) for (const id of Object.keys(chunk.modules)) modules.add(id)
  }
}

/** Für `worker.plugins`: sammelt nur. */
export function licenseCollector(): Plugin {
  return {
    name: 'fence-in-comms-training-license-collector',
    apply: 'build',
    generateBundle(_options, bundle) {
      collect(bundle)
    },
  }
}

const MARKER = '/node_modules/'

/** Paketordner eines Moduls (auch bei Scopes, verschachtelten node_modules und Vite-Präfixen). */
export function packageRoot(id: string): string | null {
  const clean = id.replace(/^\0/, '').split('?')[0].replace(/\\/g, '/')
  const at = clean.lastIndexOf(MARKER)
  if (at < 0) return null
  const rest = clean.slice(at + MARKER.length).split('/')
  const name = rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0]
  return clean.slice(0, at + MARKER.length) + name
}

function licenseTexts(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => /^(licen[cs]e|copying|notice)([.\-_].*)?$/i.test(f) && statSync(join(dir, f)).isFile())
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n').trim())
}

/**
 * Pakete ohne eigenen Lizenztext im npm- bzw. Crate-Paket: Texte aus der Originalquelle, abgelegt in
 * `third-party-licenses/` (Herkunft dort in der README). webview2-com-sys linkt zusätzlich den
 * WebView2-Loader von Microsoft fest in die exe.
 */
export const EXTRA_TEXTS: Readonly<Record<string, readonly string[]>> = {
  'onnxruntime-web': ['onnxruntime-LICENSE.txt', 'onnxruntime-ThirdPartyNotices.txt'],
  'onnxruntime-common': ['onnxruntime-LICENSE.txt'],
  'webview2-com': ['webview2-rs-LICENSE.txt'],
  'webview2-com-macros': ['webview2-rs-LICENSE.txt'],
  'webview2-com-sys': ['webview2-rs-LICENSE.txt', 'webview2-sdk-LICENSE.txt'],
  'alloc-stdlib': ['alloc-no-stdlib-LICENSE.txt'],
  selectors: ['MPL-2.0.txt'],
}

let extraDir = ''

function extraTexts(name: string): string[] {
  return (EXTRA_TEXTS[name] ?? []).map((f) => readFileSync(join(extraDir, f), 'utf8').replace(/\r\n/g, '\n').trim())
}

const hash = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 12)

function repoUrl(r: unknown): string | undefined {
  const raw = typeof r === 'string' ? r : r && typeof r === 'object' && 'url' in r ? String((r as { url: unknown }).url) : undefined
  const url = raw?.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://').replace(/^github:/, '')
  // Kurzform „user/repo“ steht für GitHub
  return url && /^[\w.-]+\/[\w.-]+$/.test(url) ? `https://github.com/${url}` : url
}

interface Collected {
  entries: LicenseEntry[]
  texts: Map<string, { text: string; users: string[] }>
}

function addTexts(c: Collected, entry: LicenseEntry, texts: string[]) {
  if (!texts.length) return
  const text = texts.join('\n\n---\n\n')
  const key = hash(text)
  const t = c.texts.get(key) ?? { text, users: [] }
  t.users.push(`${entry.name} ${entry.version}`)
  c.texts.set(key, t)
  entry.text = key
}

function npmEntries(c: Collected, roots: string[]): LicenseEntry[] {
  const out: LicenseEntry[] = []
  for (const root of roots) {
    const pkgFile = join(root, 'package.json')
    if (!existsSync(pkgFile)) continue
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as { name?: string; version?: string; license?: unknown; repository?: unknown; homepage?: string }
    const entry: LicenseEntry = {
      name: pkg.name ?? root.split(MARKER).pop()!,
      version: pkg.version ?? '?',
      license: typeof pkg.license === 'string' ? pkg.license : 'siehe Lizenztext',
      url: pkg.homepage ?? repoUrl(pkg.repository),
    }
    const own = licenseTexts(root)
    addTexts(c, entry, own.length ? own : extraTexts(entry.name))
    out.push(entry)
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

interface CargoMeta {
  packages: { id: string; name: string; version: string; license?: string | null; repository?: string | null; manifest_path: string }[]
  resolve: { root: string | null; nodes: { id: string; deps: { pkg: string; dep_kinds: { kind: string | null }[] }[] }[] }
}

/** Crates, die in der exe landen: vom Wurzelpaket über normale Abhängigkeiten erreichbar. */
function cargoEntries(c: Collected, manifest: string): LicenseEntry[] {
  const json = execFileSync('cargo', ['metadata', '--format-version', '1', '--locked', '--manifest-path', manifest, '--filter-platform', 'x86_64-pc-windows-msvc'], {
    encoding: 'utf8',
    maxBuffer: 64 << 20,
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  const meta = JSON.parse(json) as CargoMeta
  const nodes = new Map(meta.resolve.nodes.map((n) => [n.id, n]))
  const root = meta.resolve.root
  const seen = new Set<string>()
  const stack = root ? [root] : []
  while (stack.length) {
    const id = stack.pop()!
    for (const d of nodes.get(id)?.deps ?? []) {
      if (seen.has(d.pkg) || !d.dep_kinds.some((k) => k.kind === null)) continue
      seen.add(d.pkg)
      stack.push(d.pkg)
    }
  }
  return meta.packages
    .filter((p) => seen.has(p.id))
    .map((p) => {
      const entry: LicenseEntry = { name: p.name, version: p.version, license: p.license ?? 'siehe Lizenztext', url: p.repository ?? undefined }
      const own = licenseTexts(dirname(p.manifest_path))
      addTexts(c, entry, own.length ? own : extraTexts(entry.name))
      return entry
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Einträge aus `src-tauri/asr-bundle/licenses.json` (whisper.cpp, Modell, Vulkan-Header). */
function asrEntries(c: Collected, file: string): LicenseEntry[] {
  if (!existsSync(file)) return []
  const list = JSON.parse(readFileSync(file, 'utf8')) as (LicenseEntry & { text: string })[]
  return list.map(({ text, ...rest }) => {
    const entry: LicenseEntry = { ...rest }
    addTexts(c, entry, [text])
    return entry
  })
}

function renderText(list: LicenseList, c: Collected, own: string[]): string {
  const line = '='.repeat(100)
  const parts = [
    'Fence In Comms Training: Lizenzen',
    `Erzeugt: ${list.generated}`,
    '',
    line,
    'Fence In Comms Training selbst',
    line,
    ...own,
    '',
    line,
    'Drittbausteine (npm-Pakete im App-Bundle' + (list.cargo.length ? ', Rust-Crates der Desktop-App' : '') + (list.asr.length ? ', Spracherkennung' : '') + ')',
    line,
    ...[...list.npm.map((e) => ({ ...e, kind: 'npm' })), ...list.cargo.map((e) => ({ ...e, kind: 'crate' })), ...list.asr.map((e) => ({ ...e, kind: 'asr' }))].map(
      (e) => `${e.kind.padEnd(5)} ${e.name} ${e.version} – ${e.license}`,
    ),
  ]
  // MPL-2.0 (Abschnitt 3.2): sagen, wo es den Quellcode gibt
  const mpl = list.cargo.filter((e) => /MPL-2\.0/.test(e.license))
  if (mpl.length) {
    parts.push(
      '',
      line,
      'Quellcode der Bausteine unter MPL-2.0 (unverändert verwendet)',
      line,
      ...mpl.map((e) => `${e.name} ${e.version}: https://crates.io/crates/${e.name}/${e.version}${e.url ? ` und ${e.url}` : ''}`),
    )
  }
  for (const t of c.texts.values()) {
    parts.push('', line, `Gilt für: ${t.users.join(', ')}`, line, t.text)
  }
  return parts.join('\n') + '\n'
}

/** Pakete ohne Lizenztext (weder im Paket noch in EXTRA_TEXTS). */
export function missingTexts(list: Pick<LicenseList, 'npm' | 'cargo'>): string[] {
  return [...list.npm, ...list.cargo].filter((e) => !e.text).map((e) => `${e.name} ${e.version} (${e.license})`)
}

/**
 * Text für die Lizenzseite des Installers: LEGAL.md und LICENSE. UTF-8 mit BOM und CRLF, damit das
 * NSIS-Textfeld Sonderzeichen und Zeilen richtig zeigt.
 */
export function installerText(root: string): string {
  const read = (f: string) => readFileSync(join(root, f), 'utf8').replace(/\r\n/g, '\n').trim()
  const body = [
    read('LEGAL.md'),
    'Licenses: code MIT (text below), learning content CC BY-SA 4.0 (LICENSE-CONTENT.md). Third-party components are licensed under their own terms; all license texts are in LICENSES.txt in the program folder after installation.',
    read('LICENSE'),
  ].join('\n\n' + '-'.repeat(72) + '\n\n')
  return '﻿' + body.replace(/\n/g, '\r\n') + '\r\n'
}

/** Haupt-Plugin: sammelt das App-Bundle und schreibt die Lizenzliste nach dist/. */
export function licensePlugin(root: string): Plugin {
  return {
    name: 'fence-in-comms-training-licenses',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      collect(bundle)
      extraDir = join(root, 'third-party-licenses')
      const c: Collected = { entries: [], texts: new Map() }
      const roots = [...new Set([...modules].map(packageRoot).filter((r): r is string => !!r))]
      const manifest = join(root, 'src-tauri', 'Cargo.toml')
      // Die Crates nur, wenn Tauri baut (setzt TAURI_ENV_*); die Browser-Version enthält sie nicht
      const withCargo = !!process.env.TAURI_ENV_PLATFORM && existsSync(manifest)
      const list: LicenseList = {
        generated: new Date().toISOString(),
        npm: npmEntries(c, roots),
        cargo: withCargo ? cargoEntries(c, manifest) : [],
        // whisper.cpp und Modell nur im Desktop-Paket (stage-asr.ts legt die Liste vorher an)
        asr: withCargo ? asrEntries(c, join(root, 'src-tauri', 'asr-bundle', 'licenses.json')) : [],
      }
      // Ohne Lizenztext darf nichts ausgeliefert werden (MIT, BSD, Apache verlangen den Text samt Vermerk)
      const missing = missingTexts(list)
      if (missing.length)
        this.error(`Ohne Lizenztext: ${missing.join(', ')}. Text aus der Originalquelle in third-party-licenses/ ablegen und in EXTRA_TEXTS (scripts/license-plugin.ts) eintragen.`)
      const own = ['LICENSE', 'LICENSE-CONTENT.md', 'LEGAL.md']
        .filter((f) => existsSync(join(root, f)))
        .map((f) => readFileSync(join(root, f), 'utf8').replace(/\r\n/g, '\n').trim())
      this.emitFile({ type: 'asset', fileName: 'licenses.json', source: JSON.stringify(list) })
      this.emitFile({ type: 'asset', fileName: 'LICENSES.txt', source: renderText(list, c, own) })
      // Lizenzseite des Installers (tauri.conf.json → bundle.licenseFile): rechtliche Hinweise und MIT-Lizenz
      if (withCargo) this.emitFile({ type: 'asset', fileName: 'INSTALLER-LIZENZ.txt', source: installerText(root) })
    },
  }
}
