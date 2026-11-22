import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MODEL_FILE,
  TTS_DOWNLOAD_MB,
  TTS_FILES,
  VOICES,
  lexiconFiles,
  voiceFile,
} from './tts-config'

describe('Dateien der Sprachausgabe', () => {
  it('stehen in der Desktop-App genauso (src-tauri/src/tts.rs)', () => {
    const rust = readFileSync(new URL('../../src-tauri/src/tts.rs', import.meta.url), 'utf8')
    const entries = [
      ...rust.matchAll(/file!\("([^"]+)", ([\d_]+), "([0-9a-f]{64})", "([^"]+)"\)/g),
    ].map((m) => ({
      name: m[1],
      size: Number(m[2].replace(/_/g, '')),
      sha256: m[3],
      url: m[4],
    }))
    expect(entries).toEqual(
      TTS_FILES.map(({ name, size, sha256, url }) => ({ name, size, sha256, url })),
    )
  })

  it('enthalten Modell, jede Stimme und beide Lexika', () => {
    const names = TTS_FILES.map((f) => f.name)
    expect(names).toContain(MODEL_FILE)
    for (const v of VOICES) expect(names).toContain(voiceFile(v.id))
    for (const f of [...lexiconFiles('us'), ...lexiconFiles('gb')]) expect(names).toContain(f)
    expect(new Set(names).size).toBe(names.length)
    // Stimmen: US und GB, Frauen und Männer
    expect(new Set(VOICES.map((v) => `${v.accent}-${v.female}`)).size).toBe(4)
    for (const v of VOICES) expect(v.id[0]).toBe(v.accent === 'us' ? 'a' : 'b')
  })

  it('kommen nur von festen Ständen der Originalquellen', () => {
    for (const f of TTS_FILES) {
      expect(f.url).toMatch(
        /^https:\/\/(huggingface\.co\/onnx-community\/Kokoro-82M-v1\.0-ONNX\/resolve|raw\.githubusercontent\.com\/hexgrad\/misaki)\/[0-9a-f]{40}\//,
      )
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/)
    }
    expect(TTS_DOWNLOAD_MB).toBeGreaterThan(300)
    expect(TTS_DOWNLOAD_MB).toBeLessThan(400)
  })
})
