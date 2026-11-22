import { describe, expect, it } from 'vitest'
import { decodeWav } from '../core/speech/pcm'
import { transcribeBody } from './whisper-recognizer'

describe('Desktop-Erkennung: Anfrage an Rust', () => {
  it('4 Byte Länge, JSON mit den Optionen, dann die WAV-Datei (wie split_body in asr.rs)', () => {
    const pcm = Float32Array.from({ length: 1600 }, (_, i) => Math.sin(i / 10) * 0.5)
    const body = transcribeBody(pcm, {
      model: 'small.en',
      prompt: 'Darkstar, Kutaisi Ground.',
      gpu: true,
    })
    const len = new DataView(body.buffer).getUint32(0, true)
    const json = JSON.parse(new TextDecoder().decode(body.subarray(4, 4 + len))) as unknown
    expect(json).toEqual({ model: 'small.en', prompt: 'Darkstar, Kutaisi Ground.', gpu: true })
    const wav = body.subarray(4 + len)
    expect(new TextDecoder().decode(wav.subarray(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(wav.subarray(8, 12))).toBe('WAVE')
    const back = decodeWav(wav)
    expect(back.rate).toBe(16000)
    expect(back.samples.length).toBe(1600)
  })
})
