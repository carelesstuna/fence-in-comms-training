/**
 * Vor `tauri build`: Spracherkennung fürs Paket zusammenstellen in `src-tauri/asr-bundle/`
 * (nicht in Git). Von dort nimmt `tauri.release.json` sie als Ressourcen mit:
 *
 * - `whisper/`: whisper-cli.exe mit seinen DLLs (die DLLs müssen neben der exe liegen). Bevorzugt die
 *   selbst gebaute Vulkan-Version aus `.asr/whisper.cpp/v1.9.5-vulkan` (Grafikkarte, sonst CPU; statisch
 *   gegen die C-Laufzeit gelinkt), sonst das CPU-Release – das braucht die Visual-C++-Laufzeit.
 * - `licenses.json`: Einträge für die Seite „Lizenzen“ und LICENSES.txt (liest scripts/license-plugin.ts).
 *
 * Modelle kommen nicht ins Paket: Die App lädt sie auf Klick von der Originalquelle nach
 * (src-tauri/src/asr.rs), so bleiben Installer und Updates klein.
 *
 * Aufruf: npx tsx scripts/stage-asr.ts   (macht `npm run desktop:build` von selbst)
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { asrDir } from './local-dirs.ts'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const out = join(root, 'src-tauri', 'asr-bundle')
const asr = asrDir()

const MIT = (holder: string) => `MIT License

Copyright (c) ${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

interface Entry {
  name: string
  version: string
  license: string
  url: string
  text: string
}

function main(): void {
  rmSync(out, { recursive: true, force: true })
  mkdirSync(join(out, 'whisper'), { recursive: true })

  // whisper-cli und DLLs
  const vulkan = join(asr, 'whisper.cpp', 'v1.9.5-vulkan')
  const cpu = join(asr, 'whisper.cpp', 'v1.9.5', 'Release')
  const useVulkan =
    existsSync(join(vulkan, 'whisper-cli.exe')) && existsSync(join(vulkan, 'ggml-vulkan.dll'))
  const src = useVulkan ? vulkan : cpu
  if (!existsSync(join(src, 'whisper-cli.exe')))
    throw new Error(
      `whisper-cli.exe fehlt in ${src} – erst „npm run fetch-asr“ (oder die Vulkan-Version bauen, docs/spracherkennung.md).`,
    )
  if (!useVulkan)
    console.warn(
      '! Keine Vulkan-Version gefunden: Es kommt das CPU-Release ins Paket. Das braucht die Visual-C++-Laufzeit auf dem Zielrechner.',
    )
  const wanted = (f: string) =>
    f === 'whisper-cli.exe' ||
    /^(whisper|ggml|ggml-base|ggml-vulkan|ggml-cpu-[\w-]+)\.dll$/i.test(f)
  const files = readdirSync(src).filter(wanted)
  for (const f of files) copyFileSync(join(src, f), join(out, 'whisper', f))
  console.log(`• whisper.cpp (${useVulkan ? 'Vulkan + CPU' : 'nur CPU'}): ${files.length} Dateien`)

  // Lizenzen
  const entries: Entry[] = [
    {
      name: 'whisper.cpp (whisper-cli, ggml)',
      version: '1.9.5',
      license: 'MIT',
      url: 'https://github.com/ggml-org/whisper.cpp',
      text: MIT('2023-2026 The ggml authors'),
    },
    {
      name: 'Whisper-Modelle small.en, base.en, large-v3-turbo (Gewichte, ggml-Format)',
      version: 'q5_1 / q5_0',
      license: 'MIT',
      url: 'https://github.com/openai/whisper',
      text: MIT('2022 OpenAI'),
    },
    {
      name: 'Silero VAD (nachladbar, für large-v3-turbo)',
      version: '6.2.0',
      license: 'MIT',
      url: 'https://github.com/snakers4/silero-vad',
      text: MIT('2020-present Silero Team'),
    },
  ]
  if (useVulkan) {
    // Header von Vulkan und Vulkan-Hpp stecken in ggml-vulkan.dll; „Apache-2.0 OR MIT“ – hier unter MIT
    entries.push({
      name: 'Vulkan-Headers und Vulkan-Hpp (in ggml-vulkan.dll)',
      version: '1.4.363',
      license: 'Apache-2.0 OR MIT (genutzt: MIT)',
      url: 'https://github.com/KhronosGroup/Vulkan-Headers',
      text: MIT('2015-2026 The Khronos Group Inc.'),
    })
  }
  writeFileSync(join(out, 'licenses.json'), JSON.stringify(entries, null, 2))
  console.log(`✓ ${out}`)
}

try {
  main()
} catch (e) {
  console.error(`✗ ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
}
