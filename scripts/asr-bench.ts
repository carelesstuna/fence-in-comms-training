/**
 * Messreihe: Spracherkennungen gegen die eigenen Aufnahmen laufen lassen und mit der vorhandenen
 * Bewertung messen.
 *
 * - **Falsch angenommen:** absichtlich falscher Funkspruch, die Bewertung sagt „richtig“.
 *   Das ist der wichtigste Wert – ein Trainer darf Fehler nicht durchgehen lassen.
 * - **Falsch abgelehnt:** richtiger Funkspruch, die Bewertung sagt „falsch“ (oder nichts erkannt).
 * - **Stille erfunden:** nichts gesagt, aber ein Transkript.
 * - **Dauer:** pro Funkspruch, bei whisper-cli samt Laden des Modells (so wie in der App).
 *
 * Aufruf:
 *   npm run asr-bench                                  alle Engines (siehe DEFAULT_RUNS)
 *   npm run asr-bench -- --run whisper-cli:small.en+prompt --run tf:whisper-base.en
 *   npm run asr-bench -- --rescore [Datei]              gespeicherte Transkripte neu bewerten (ohne Erkennung)
 *   Optionen: --dir <Ordner> (Aufnahmen), --limit <n>, --threads <n>, --verbose (bei --rescore: Fehler zeigen)
 *
 * Engines: typed (Text der Vorlage als perfektes Transkript – Gegenprobe der Bewertung),
 * whisper-cli:<base.en|small.en|large-v3-turbo-q5_0>[+prompt][+digits][+ac][+greedy][+vad][+gpu],
 * tf:<whisper-base.en|whisper-tiny.en|moonshine-base>
 *   prompt  Vokabular aus Modul und Stationen (nie die Lösung)
 *   gpu     selbst gebautes whisper.cpp mit Vulkan (.asr/whisper.cpp/v1.9.5-vulkan) statt des CPU-Release
 *   digits  Ziffern ausgeschrieben: Ziffernreihe im Prompt, Ziffern-Tokens unterdrückt
 *   ac      Audio-Kontext auf die Länge der Aufnahme kürzen (schneller)
 *   greedy  ohne Beam-Search (schneller)
 *   vad     Silero-VAD vor der Erkennung
 */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { join, sep } from 'node:path'
import { promisify } from 'node:util'
import { loadContentIndex } from './content-files.ts'
import { asrDir, messreiheDir } from './local-dirs.ts'
import { normalizeTokens } from '../src/core/phraseology/normalize.ts'
import { scoreCall } from '../src/core/scoring/score.ts'
import { buildHints } from '../src/core/speech/hints.ts'
import { decodeWav } from '../src/core/speech/pcm.ts'
import { recordingMetaSchema, type RecordingMeta } from '../src/core/speech/recording.ts'
import { checkRecording, cleanTranscript, type DiscardReason } from '../src/core/speech/transcript.ts'
import { dtypeFor, generateOptions } from '../src/platform/transformers-config.ts'

const run = promisify(execFile)

const DEFAULT_RUNS = [
  'typed',
  'whisper-cli:base.en',
  'whisper-cli:base.en+prompt',
  'whisper-cli:base.en+prompt+ac',
  'whisper-cli:small.en+prompt',
  'whisper-cli:small.en+prompt+ac',
  'whisper-cli:small.en+prompt+digits+ac',
  'tf:whisper-base.en',
  'tf:whisper-tiny.en',
  'tf:moonshine-base',
]

/**
 * Audio-Kontext für `-ac`: Whisper rechnet sonst immer ein 30-s-Fenster (1500 Frames, 50 pro Sekunde).
 * Für kurze Funksprüche reicht die Länge der Aufnahme plus etwas Reserve – das spart Rechenzeit.
 */
function audioContextFrames(seconds: number): number {
  return Math.min(1500, Math.max(256, Math.ceil(((seconds + 0.5) * 50) / 64) * 64))
}

const TF_MODELS: Record<string, string> = {
  'whisper-base.en': 'onnx-community/whisper-base.en',
  'whisper-tiny.en': 'onnx-community/whisper-tiny.en',
  'moonshine-base': 'onnx-community/moonshine-base-ONNX',
}

interface Recording {
  meta: RecordingMeta
  wavPath: string
}

interface Engine {
  name: string
  transcribe(r: Recording): Promise<string>
  close?(): Promise<void>
}

// ---------------------------------------------------------------------------
// Aufnahmen
// ---------------------------------------------------------------------------

function loadRecordings(dir: string): Recording[] {
  if (!existsSync(dir)) throw new Error(`Ordner fehlt: ${dir}`)
  const out: Recording[] = []
  for (const f of readdirSync(dir).filter((f) => /^\d{4}-[a-z-]+\.json$/.test(f)).sort()) {
    const r = recordingMetaSchema.safeParse(JSON.parse(readFileSync(join(dir, f), 'utf8')))
    if (!r.success) {
      console.warn(`  übersprungen (ungültig): ${f}`)
      continue
    }
    const wavPath = join(dir, r.data.audio.file)
    if (!existsSync(wavPath)) {
      console.warn(`  übersprungen (WAV fehlt): ${f}`)
      continue
    }
    out.push({ meta: r.data, wavPath })
  }
  return out
}

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------

function findFile(dir: string, name: string): string | null {
  if (!existsSync(dir)) return null
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) {
      const hit = findFile(p, name)
      if (hit) return hit
    } else if (f.toLowerCase() === name.toLowerCase()) return p
  }
  return null
}

function whisperCli(spec: string, threads: number): Engine {
  const [model, ...flags] = spec.split('+')
  // CPU: das offizielle Release; GPU: selbst gebaut mit Vulkan (siehe docs/spracherkennung.md)
  const gpu = flags.includes('gpu')
  const binDir = join(asrDir(), 'whisper.cpp', gpu ? 'v1.9.5-vulkan' : 'v1.9.5')
  const bin = findFile(binDir, process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli')
  // „small.en“ = q5_1 wie bisher, sonst mit Quantisierung: „large-v3-turbo-q5_0“
  const modelPath = join(asrDir(), 'ggml', /-q\d/.test(model) ? `ggml-${model}.bin` : `ggml-${model}-q5_1.bin`)
  const vadPath = join(asrDir(), 'ggml', 'ggml-silero-v6.2.0.bin')
  if (!bin) throw new Error(gpu ? `whisper-cli mit Vulkan fehlt in ${binDir}.` : 'whisper-cli fehlt – bitte „npm run fetch-asr -- whisper-cpp“ ausführen.')
  if (!existsSync(modelPath)) throw new Error(`Modell fehlt: ${modelPath} – bitte „npm run fetch-asr“ ausführen.`)
  const content = loadContentIndex()
  return {
    name: `whisper-cli:${spec}`,
    async transcribe(r) {
      const args = ['-m', modelPath, '-f', r.wavPath, '-l', 'en', '-t', String(threads), '-nt', '-np']
      if (!gpu) args.push('-ng')
      if (flags.includes('prompt') || flags.includes('digits')) {
        // Nie die Lösung: nur Modul und Stationen (wie in der App)
        const hints = buildHints(content, r.meta.hintContext, { spellDigits: flags.includes('digits') })
        args.push('--prompt', hints.prompt)
      }
      // Der Ausdruck muss das ganze Token treffen (z. B. „ 11“), daher .* davor und danach
      if (flags.includes('digits')) args.push('--suppress-regex', '.*[0-9].*')
      if (flags.includes('vad')) args.push('--vad', '-vm', vadPath)
      if (flags.includes('ac')) args.push('-ac', String(audioContextFrames((statSync(r.wavPath).size - 44) / 32000)))
      if (flags.includes('greedy')) args.push('-bs', '1', '-bo', '1')
      const { stdout } = await run(bin, args, { windowsHide: true, maxBuffer: 1 << 20 })
      return stdout.replace(/\s+/g, ' ').trim()
    },
  }
}

async function transformersEngine(spec: string): Promise<Engine> {
  const id = TF_MODELS[spec]
  if (!id) throw new Error(`Unbekanntes Modell: ${spec} (${Object.keys(TF_MODELS).join(', ')})`)
  const { env, pipeline } = await import('@huggingface/transformers')
  env.allowRemoteModels = false
  env.localModelPath = join(asrDir(), 'transformers') + sep
  const asr = await pipeline('automatic-speech-recognition', id, { device: 'cpu', dtype: dtypeFor(id, 'cpu') as never })
  return {
    name: `tf:${spec}`,
    async transcribe(r) {
      const pcm = decodeWav(readFileSync(r.wavPath)).samples
      const out = (await asr(pcm, generateOptions(id))) as { text: string } | { text: string }[]
      return (Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text).trim()
    },
    close: () => asr.dispose(),
  }
}

const typedEngine: Engine = { name: 'typed', transcribe: async (r) => r.meta.text }

async function makeEngine(spec: string, threads: number): Promise<Engine> {
  if (spec === 'typed') return typedEngine
  const [kind, rest] = spec.split(/:(.*)/s)
  if (kind === 'whisper-cli') return whisperCli(rest, threads)
  if (kind === 'tf') return transformersEngine(rest)
  throw new Error(`Unbekannte Engine: ${spec}`)
}

// ---------------------------------------------------------------------------
// Auswertung
// ---------------------------------------------------------------------------

interface Row {
  id: string
  kind: RecordingMeta['kind']
  expected: string
  raw: string
  text: string
  discarded?: DiscardReason
  accepted: boolean
  ok: boolean
  ms: number
  wer: number
  /** Bei Stille: Hätte die Erkennung ohne Pegelprüfung etwas erfunden? */
  inventedRaw: boolean
  issues: string[]
}

function editDistance<T>(a: readonly T[], b: readonly T[]): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

function evaluate(r: Recording, raw: string, ms: number): Row {
  const m = r.meta
  // Wie in der App: zu kurz oder zu leise wird gar nicht erst erkannt
  const precheck = checkRecording({ durationMs: m.audio.heldMs, peak: m.audio.peak, rms: m.audio.rms })
  const t = precheck ? { text: '', raw, discarded: precheck } : cleanTranscript(raw)
  const score = t.discarded ? null : scoreCall(t.text, m.segments, undefined, { source: 'spoken' })
  const accepted = !!score?.correct
  const ok = m.kind === 'silence' ? !!t.discarded : accepted === m.shouldAccept
  const ref = normalizeTokens(m.text)
  const hyp = normalizeTokens(t.text)
  return {
    id: m.id,
    kind: m.kind,
    expected: m.text,
    raw,
    text: t.text,
    discarded: t.discarded,
    accepted,
    ok,
    ms,
    wer: ref.length ? editDistance(ref, hyp) / ref.length : hyp.length ? 1 : 0,
    inventedRaw: m.kind === 'silence' && !cleanTranscript(raw).discarded,
    issues: score?.issues ?? [],
  }
}

const pct = (a: number, b: number) => (b ? `${a}/${b} (${Math.round((a / b) * 100)} %)` : '–')
const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}

function summarize(name: string, rows: Row[]) {
  const wrong = rows.filter((r) => r.kind === 'wrong-number' || r.kind === 'wrong-callsign')
  const right = rows.filter((r) => r.kind === 'correct')
  const silence = rows.filter((r) => r.kind === 'silence')
  const speech = rows.filter((r) => r.kind !== 'silence')
  const ms = rows.map((r) => r.ms)
  return {
    engine: name,
    n: rows.length,
    falseAccept: pct(wrong.filter((r) => r.accepted).length, wrong.length),
    falseReject: pct(right.filter((r) => !r.accepted).length, right.length),
    silenceInvented: pct(silence.filter((r) => !r.discarded).length, silence.length),
    silenceInventedRaw: pct(silence.filter((r) => r.inventedRaw).length, silence.length),
    wer: speech.length ? `${Math.round((speech.reduce((s, r) => s + r.wer, 0) / speech.length) * 100)} %` : '–',
    meanMs: Math.round(ms.reduce((a, b) => a + b, 0) / (ms.length || 1)),
    p90Ms: Math.round(quantile(ms, 0.9)),
  }
}

function table(rows: ReturnType<typeof summarize>[]): string {
  const head = '| Engine | n | falsch angenommen | falsch abgelehnt | Stille erfunden | … ohne Pegelprüfung | WER | Ø ms | p90 ms |'
  const sepLine = '|---|---|---|---|---|---|---|---|---|'
  return [
    head,
    sepLine,
    ...rows.map((s) => `| ${s.engine} | ${s.n} | ${s.falseAccept} | ${s.falseReject} | ${s.silenceInvented} | ${s.silenceInventedRaw} | ${s.wer} | ${s.meanMs} | ${s.p90Ms} |`),
  ].join('\n')
}

// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main(): Promise<void> {
  const dir = arg('--dir') ?? messreiheDir()
  const limit = Number(arg('--limit') ?? Infinity)
  const threads = Number(arg('--threads') ?? Math.max(1, Math.min(8, cpus().length - 1)))
  const verbose = process.argv.includes('--verbose')
  const runs = process.argv.flatMap((a, i) => (process.argv[i - 1] === '--run' ? [a] : []))
  // Fehlaufnahmen (Sprechtaste nur angetippt): Sprache erwartet, aber schon die Pegelprüfung verwirft sie
  const all = loadRecordings(dir)
  const broken = all.filter((r) => r.meta.kind !== 'silence' && checkRecording({ durationMs: r.meta.audio.heldMs, peak: r.meta.audio.peak, rms: r.meta.audio.rms }))
  if (broken.length) console.log(`Fehlaufnahmen übersprungen (zu kurz oder zu leise): ${broken.map((r) => r.meta.id).join(', ')}`)
  const recordings = all.filter((r) => !broken.includes(r)).slice(0, limit)
  if (!recordings.length) throw new Error(`Keine Aufnahmen in ${dir}`)
  const kinds = recordings.reduce<Record<string, number>>((c, r) => ({ ...c, [r.meta.kind]: (c[r.meta.kind] ?? 0) + 1 }), {})
  console.log(`${recordings.length} Aufnahmen aus ${dir}: ${Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(', ')}\n`)

  const summaries: ReturnType<typeof summarize>[] = []
  const details: Record<string, Row[]> = {}

  // Gespeicherte Transkripte mit der aktuellen Bewertung neu auswerten (ohne neue Erkennung)
  const rescore = process.argv.includes('--rescore')
  if (rescore) {
    const out = join(dir, 'ergebnisse')
    const named = arg('--rescore')
    const file = named && !named.startsWith('--') ? named : readdirSync(out).filter((f) => /^\d{4}-.*\d\.json$/.test(f)).sort().at(-1)
    if (!file) throw new Error(`Keine Ergebnisse in ${out}`)
    const old = JSON.parse(readFileSync(join(out, file), 'utf8')) as { details: Record<string, Row[]> }
    console.log(`Neu bewertet: ${file}\n`)
    const byId = new Map(recordings.map((r) => [r.meta.id, r]))
    for (const [name, rows] of Object.entries(old.details)) {
      if (runs.length && !runs.includes(name)) continue
      const fresh = rows.flatMap((row) => {
        const r = byId.get(row.id)
        return r ? [evaluate(r, name === 'typed' ? r.meta.text : row.raw, row.ms)] : []
      })
      report(name, fresh, verbose, summaries, details)
    }
    save(dir, recordings.length, threads, summaries, details, '-neu')
    return
  }

  for (const spec of runs.length ? runs : DEFAULT_RUNS) {
    let engine: Engine
    try {
      engine = await makeEngine(spec, threads)
    } catch (e) {
      console.warn(`✗ ${spec}: ${e instanceof Error ? e.message : String(e)}\n`)
      continue
    }
    console.log(`▶ ${engine.name}`)
    const rows: Row[] = []
    for (const r of recordings) {
      const t0 = performance.now()
      let raw = ''
      try {
        raw = await engine.transcribe(r)
      } catch (e) {
        console.warn(`  ${r.meta.id}: Fehler ${e instanceof Error ? e.message : String(e)}`)
      }
      const row = evaluate(r, raw, performance.now() - t0)
      rows.push(row)
      if (verbose || !row.ok) printRow(row)
    }
    await engine.close?.()
    report(engine.name, rows, false, summaries, details)
  }
  save(dir, recordings.length, threads, summaries, details, '')
}

function printRow(row: Row) {
  const mark = row.ok ? '✓' : '✗'
  console.log(`  ${mark} ${row.id} ${row.kind.padEnd(14)} ${Math.round(row.ms)} ms  „${row.raw}“${row.ok ? '' : `  (erwartet: „${row.expected}“)`}`)
}

function report(name: string, rows: Row[], printAll: boolean, summaries: ReturnType<typeof summarize>[], details: Record<string, Row[]>) {
  if (printAll) {
    console.log(`▶ ${name}`)
    for (const row of rows) if (!row.ok) printRow(row)
  }
  const s = summarize(name, rows)
  summaries.push(s)
  details[name] = rows
  console.log(`  → ${name}: falsch angenommen ${s.falseAccept}, falsch abgelehnt ${s.falseReject}, Stille erfunden ${s.silenceInvented}, WER ${s.wer}, Ø ${s.meanMs} ms\n`)
}

function save(dir: string, count: number, threads: number, summaries: ReturnType<typeof summarize>[], details: Record<string, Row[]>, suffix: string) {
  const out = join(dir, 'ergebnisse')
  mkdirSync(out, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + suffix
  writeFileSync(join(out, `${stamp}.json`), JSON.stringify({ at: new Date().toISOString(), threads, summaries, details }, null, 2))
  const md = `# Messreihe ${new Date().toLocaleString('de-DE')}${suffix ? ' (neu bewertet)' : ''}\n\n${count} Aufnahmen, ${threads} Threads.\n\n${table(summaries)}\n`
  writeFileSync(join(out, `${stamp}.md`), md)
  console.log(table(summaries))
  console.log(`\nGespeichert: ${join(out, stamp)}.{md,json}`)
}

main().catch((e: unknown) => {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
