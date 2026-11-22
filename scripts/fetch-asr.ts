/**
 * Lädt whisper.cpp und die Modelle für die Spracherkennung nach `.asr/` (nicht in Git, siehe
 * `local-dirs.ts`). Jede Datei hat eine fest eingetragene SHA-256-Prüfsumme und kommt von einem
 * festen Stand (Release bzw. Commit); passt die Prüfsumme nicht, wird die Datei verworfen.
 *
 * Aufruf:  npm run fetch-asr                 alles
 *          npm run fetch-asr -- whisper-cpp ggml-base.en   nur diese Pakete
 *          npm run fetch-asr -- tts           nur die Sprachausgabe (Kokoro, Stimmen, Lexika)
 *          npm run fetch-asr -- --list        Liste mit Größen
 */
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'
import { pathToFileURL } from 'node:url'
import { asrDir } from './local-dirs.ts'
import { TTS_FILES } from '../src/platform/tts-config.ts'

interface Asset {
  /** Pfad unter `.asr/`. */
  path: string
  url: string
  size: number
  sha256: string
  /** Zip-Archiv: nach dem Laden in diesen Ordner (unter `.asr/`) entpacken. */
  unzipTo?: string
}

interface Pack {
  id: string
  label: string
  license: string
  assets: Asset[]
  /** Nur auf ausdrücklichen Wunsch (`npm run fetch-asr -- <id>`), nicht bei „alles“. */
  optional?: boolean
}

const HF = 'https://huggingface.co'

function hfPack(id: string, label: string, repo: string, rev: string, files: [string, number, string][]): Pack {
  return {
    id,
    label,
    license: 'Apache-2.0 (Konvertierung) / MIT (Gewichte)',
    assets: files.map(([file, size, sha256]) => ({ path: `transformers/${repo}/${file}`, url: `${HF}/${repo}/resolve/${rev}/${file}`, size, sha256 })),
  }
}

export const PACKS: Pack[] = [
  {
    id: 'whisper-cpp',
    label: 'whisper.cpp v1.9.5 (Build b5454), Windows x64, CPU',
    license: 'MIT',
    assets: [
      {
        path: 'whisper.cpp/v1.9.5/whisper-bin-x64.zip',
        url: 'https://github.com/ggml-org/whisper.cpp/releases/download/b5454/whisper-bin-x64.zip',
        size: 8_928_640,
        sha256: '6ba69e3482d7826214f90a6a9c84ca07782aec1e1d0c6a7c30c994fd5d816ccb',
        unzipTo: 'whisper.cpp/v1.9.5',
      },
    ],
  },
  {
    id: 'ggml-base.en',
    label: 'Whisper base.en (ggml, q5_1)',
    license: 'MIT',
    assets: [
      {
        path: 'ggml/ggml-base.en-q5_1.bin',
        url: `${HF}/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-base.en-q5_1.bin`,
        size: 59_721_011,
        sha256: '4baf70dd0d7c4247ba2b81fafd9c01005ac77c2f9ef064e00dcf195d0e2fdd2f',
      },
    ],
  },
  {
    id: 'ggml-small.en',
    label: 'Whisper small.en (ggml, q5_1)',
    license: 'MIT',
    assets: [
      {
        path: 'ggml/ggml-small.en-q5_1.bin',
        url: `${HF}/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-small.en-q5_1.bin`,
        size: 190_098_681,
        sha256: 'bfdff4894dcb76bbf647d56263ea2a96645423f1669176f4844a1bf8e478ad30',
      },
    ],
  },
  {
    id: 'ggml-large-v3-turbo',
    label: 'Whisper large-v3-turbo (ggml, q5_0) – nur mit Grafikkarte sinnvoll',
    license: 'MIT',
    optional: true,
    assets: [
      {
        path: 'ggml/ggml-large-v3-turbo-q5_0.bin',
        url: `${HF}/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-large-v3-turbo-q5_0.bin`,
        size: 574_041_195,
        sha256: '394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2',
      },
    ],
  },
  {
    id: 'vad',
    label: 'Silero VAD v6.2.0 (ggml)',
    license: 'MIT',
    assets: [
      {
        path: 'ggml/ggml-silero-v6.2.0.bin',
        url: `${HF}/ggml-org/whisper-vad/resolve/9ffd54a1e1ee413ddf265af9913beaf518d1639b/ggml-silero-v6.2.0.bin`,
        size: 885_098,
        sha256: '2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987',
      },
    ],
  },
  hfPack('tf-whisper-base.en', 'transformers.js: Whisper base.en (q8 für CPU, fp32/q4 für WebGPU)', 'onnx-community/whisper-base.en', '51eefc0af78b103839eda9e7e4f4186acc6517fe', [
    ['config.json', 2197, 'c8a0de5ed8a083565a4319db29d0c210fda35b4d6076c2d711cae53ae00f3cb1'],
    ['generation_config.json', 1556, '3479b1f44a07e41db799e22599222fee5816738036def94a39841cb9cdbb4120'],
    ['preprocessor_config.json', 339, 'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d'],
    ['tokenizer.json', 2405679, '5eb60cec1e77aeeb6869a2bb5a8e01a84c3fe5d072d75369343021fe6f5310d0'],
    ['tokenizer_config.json', 282662, '93879c3dccdd4b976f709acd85b44778873f30c275e67026f30ca1e4c975230c'],
    ['onnx/encoder_model_quantized.onnx', 23201320, '6e8001198c490bbae018c0044f630c2915efb826bad957006ce36152d0ab2a10'],
    ['onnx/decoder_model_merged_quantized.onnx', 53692803, 'dd4761a3f7add26afda3512abff4706920404c2517e85a9f2ff090b0c0987909'],
    ['onnx/encoder_model.onnx', 82468078, '1cc86302d480b061452d348638064383ab41b6f3333ddd0e423532d14edaf535'],
    ['onnx/decoder_model_merged_q4.onnx', 123600371, '7770ac574b71a704191ec52becac42b4a4126af26f54ed653f31c8f16af31f99'],
  ]),
  hfPack('tf-whisper-tiny.en', 'transformers.js: Whisper tiny.en (q8)', 'onnx-community/whisper-tiny.en', '794207fec2761281fe63a23a94b7e9f53a4efbc1', [
    ['config.json', 2197, '251ea843b5901a99efa58c0b99b8052c6019aa3e7d2baf46693a1128ff606233'],
    ['generation_config.json', 1646, '7b2e8451ed5f118e75fdd991409d72119d21d2fef1eba9723f68fb9c57fe5dc9'],
    ['preprocessor_config.json', 339, 'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d'],
    ['tokenizer.json', 2405679, '5eb60cec1e77aeeb6869a2bb5a8e01a84c3fe5d072d75369343021fe6f5310d0'],
    ['tokenizer_config.json', 282662, '93879c3dccdd4b976f709acd85b44778873f30c275e67026f30ca1e4c975230c'],
    ['onnx/encoder_model_quantized.onnx', 10124993, 'e93ec822f16a8fd264e7de972ad17d615ea7334b75a52d54c50c2e18dd503a25'],
    ['onnx/decoder_model_merged_quantized.onnx', 30718858, 'c0592d0749413c960569e1c7fb806b060d5d18f3ebad4a95cbf9a77dc6e9be52'],
  ]),
  hfPack('tf-moonshine-base', 'transformers.js: Moonshine base (v1, q8)', 'onnx-community/moonshine-base-ONNX', 'b1e9b6aae3c3c7298f10c3798393fdf38e8fbbad', [
    ['config.json', 922, 'fab7241d1e9fc6c2370c4c6dfb5da79bb54d67ed9ab6b507ac51d29d2abe01d1'],
    ['generation_config.json', 147, 'f9b3f711b57be7def2e50a8942f64f36ee0a55fad5b84ff93a687b6c5bcc1d44'],
    ['preprocessor_config.json', 128, 'fa43a7017ef85cd1d0fba0d9aae77c8adb16990ae6f11115631f41ec5d8aa679'],
    ['tokenizer.json', 3761754, '7b913404bdd039af4756783218af4440bc07fb7d6d8258d677e34f95b3ec416f'],
    ['tokenizer_config.json', 135735, 'edaee394565d428ea98a663ae7209cdcfeefc5585c42d7a570ff7c986df2cd15'],
    ['onnx/encoder_model_quantized.onnx', 20513063, '1dd9ab0a7f987113d30affcba5a068d11c8f90fa0223caa3e491ade431ad9751'],
    ['onnx/decoder_model_merged_quantized.onnx', 42498870, 'cc9f3cd6698a369c6008b41aa60aa3fb3322e7f03c9bdf19d8e6b7200afca4f3'],
  ]),
  {
    id: 'tts',
    label: 'Sprachausgabe: Kokoro-82M v1.0 (fp32), 8 Stimmen, misaki-Lexika',
    license: 'Apache-2.0',
    // Dieselben Dateien wie in der App (`src/platform/tts-config.ts`); der Dev-Server liefert sie unter /tts/ aus
    assets: [
      ...TTS_FILES.map((f) => ({ path: `tts/${f.name}`, url: f.url, size: f.size, sha256: f.sha256 })),
      // Nur fürs Entwickeln: Kokoros Vokabular, gegen das g2p.test.ts KOKORO_VOCAB prüft (die App braucht es nicht)
      {
        path: 'tts/kokoro-tokenizer.json',
        url: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231/tokenizer.json',
        size: 3497,
        sha256: '77a02c8e164413299b4b4c403b14f8e0e1c1b727db4d46a09d6327b861060a34',
      },
    ],
  },
]

// ---------------------------------------------------------------------------

const mb = (n: number) => `${(n / 1e6).toFixed(1)} MB`

async function sha256Of(file: string): Promise<string> {
  const h = createHash('sha256')
  await pipeline(createReadStream(file), h)
  return h.digest('hex')
}

async function download(a: Asset, target: string): Promise<void> {
  const part = `${target}.part`
  mkdirSync(dirname(target), { recursive: true })
  const res = await fetch(a.url, { redirect: 'follow' })
  if (!res.ok || !res.body) throw new Error(`${a.url}: HTTP ${res.status}`)
  let done = 0
  let shown = -1
  const h = createHash('sha256')
  const body = Readable.fromWeb(res.body as unknown as WebReadableStream<Uint8Array>)
  body.on('data', (c: Buffer) => {
    done += c.length
    h.update(c)
    const pct = Math.floor((done / a.size) * 10)
    if (a.size > 5e6 && pct !== shown) {
      shown = pct
      process.stdout.write(`\r    ${mb(done)} / ${mb(a.size)}`)
    }
  })
  await pipeline(body, createWriteStream(part))
  if (a.size > 5e6) process.stdout.write('\n')
  const got = h.digest('hex')
  if (got !== a.sha256) {
    rmSync(part, { force: true })
    throw new Error(`Prüfsumme passt nicht für ${a.path}: erwartet ${a.sha256}, erhalten ${got}. Datei verworfen.`)
  }
  renameSync(part, target)
}

/** Zip mit dem tar von Windows (bsdtar) in einen frischen Ordner entpacken. */
function unzip(zip: string, to: string): void {
  if (existsSync(to)) for (const f of readdirSync(to)) if (join(to, f) !== zip) rmSync(join(to, f), { recursive: true, force: true })
  mkdirSync(to, { recursive: true })
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'unzip'
  const args = process.platform === 'win32' ? ['-xf', zip, '-C', to] : ['-o', zip, '-d', to]
  const r = spawnSync(tar, args, { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`Entpacken fehlgeschlagen: ${zip}`)
}

async function fetchPack(p: Pack, root: string): Promise<void> {
  console.log(`• ${p.label} [${p.id}]`)
  for (const a of p.assets) {
    const target = join(root, a.path)
    if (existsSync(target) && statSync(target).size === a.size && (await sha256Of(target)) === a.sha256) {
      console.log(`    vorhanden: ${a.path}`)
    } else {
      console.log(`    lade ${a.path} (${mb(a.size)})`)
      await download(a, target)
    }
    if (a.unzipTo) {
      unzip(target, join(root, a.unzipTo))
      console.log(`    entpackt nach ${a.unzipTo}`)
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const root = asrDir()
  if (args.includes('--list')) {
    for (const p of PACKS) console.log(`${p.id.padEnd(22)} ${mb(p.assets.reduce((n, a) => n + a.size, 0)).padStart(9)}  ${p.label} (${p.license})${p.optional ? ' – nur auf Wunsch' : ''}`)
    console.log(`\nZiel: ${root}`)
    return
  }
  const wanted = args.filter((a) => !a.startsWith('--'))
  const unknown = wanted.filter((w) => !PACKS.some((p) => p.id === w))
  if (unknown.length) throw new Error(`Unbekannt: ${unknown.join(', ')} – siehe --list`)
  const packs = wanted.length ? PACKS.filter((p) => wanted.includes(p.id)) : PACKS.filter((p) => !p.optional)
  console.log(`Ziel: ${root}\n`)
  for (const p of packs) await fetchPack(p, root)
  console.log('\n✓ Fertig.')
}

// Nur als Skript laden, nicht beim Import (stage-asr.ts liest PACKS für die Prüfsummen)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e: unknown) => {
    console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  })
}
