/**
 * Audio-Hilfen für die Spracherkennung, rein und ohne Browser-APIs:
 * auf 16 kHz umrechnen, Pegel messen, Vorlauf puffern, WAV schreiben und lesen.
 */

/** Abtastrate, mit der Whisper und Moonshine rechnen. */
export const ASR_RATE = 16000

/**
 * Auf eine andere Abtastrate umrechnen (gefensterter Sinc-Tiefpass). Beim Herunterrechnen
 * wird alles oberhalb der neuen Nyquist-Frequenz gedämpft, damit nichts zurückspiegelt.
 */
export function resample(input: Float32Array, fromRate: number, toRate = ASR_RATE, zeros = 16): Float32Array {
  if (fromRate === toRate) return input.slice()
  const ratio = fromRate / toRate
  // Grenzfrequenz relativ zur Nyquist-Frequenz der Eingabe
  const fc = Math.min(1, 1 / ratio)
  const half = Math.ceil(zeros / fc)
  const out = new Float32Array(Math.floor(input.length / ratio))
  for (let i = 0; i < out.length; i++) {
    const t = i * ratio
    const center = Math.floor(t)
    let sum = 0
    let weight = 0
    for (let k = Math.max(0, center - half + 1); k <= Math.min(input.length - 1, center + half); k++) {
      const d = t - k
      const x = d * fc
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)
      const h = sinc * (0.5 + 0.5 * Math.cos((Math.PI * d) / half))
      sum += input[k] * h
      weight += h
    }
    out[i] = weight !== 0 ? sum / weight : 0
  }
  return out
}

export interface LevelStats {
  durationMs: number
  /** Höchster Ausschlag, 0–1. */
  peak: number
  /** Effektivwert, 0–1. */
  rms: number
}

export function levelStats(samples: Float32Array, rate: number): LevelStats {
  let peak = 0
  let sq = 0
  for (const s of samples) {
    const a = Math.abs(s)
    if (a > peak) peak = a
    sq += s * s
  }
  return { durationMs: (samples.length / rate) * 1000, peak, rms: samples.length ? Math.sqrt(sq / samples.length) : 0 }
}

/** Pegel in dBFS (0 = Vollaussteuerung); Stille ergibt -Infinity. */
export const dbfs = (x: number): number => (x > 0 ? 20 * Math.log10(x) : -Infinity)

/** Mehrere Blöcke zu einem zusammenfügen. */
export function concat(chunks: readonly Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0))
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

/**
 * Ringpuffer für den Vorlauf: hält immer die letzten `size` Samples. So ist auch das erste Wort
 * dabei, wenn man gleichzeitig mit dem Drücken der Sprechtaste zu sprechen beginnt.
 */
export class PreRoll {
  private readonly buf: Float32Array
  private pos = 0
  private filled = 0

  constructor(readonly size: number) {
    this.buf = new Float32Array(Math.max(0, Math.floor(size)))
  }

  push(chunk: Float32Array): void {
    const n = this.buf.length
    if (n === 0) return
    // Nur die letzten n Samples des Blocks zählen
    const src = chunk.length > n ? chunk.subarray(chunk.length - n) : chunk
    for (let i = 0; i < src.length; i++) {
      this.buf[this.pos] = src[i]
      this.pos = (this.pos + 1) % n
    }
    this.filled = Math.min(n, this.filled + src.length)
  }

  /** Inhalt in zeitlicher Reihenfolge; danach ist der Puffer leer. */
  drain(): Float32Array {
    const n = this.buf.length
    const out = new Float32Array(this.filled)
    const start = (this.pos - this.filled + n) % (n || 1)
    for (let i = 0; i < this.filled; i++) out[i] = this.buf[(start + i) % n]
    this.filled = 0
    return out
  }
}

// ---------------------------------------------------------------------------
// WAV
// ---------------------------------------------------------------------------

/** 16-Bit-PCM, mono. */
export function encodeWav(samples: Float32Array, rate: number): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2)
  const v = new DataView(bytes.buffer)
  const ascii = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i))
  }
  ascii(0, 'RIFF')
  v.setUint32(4, 36 + samples.length * 2, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true) // PCM
  v.setUint16(22, 1, true) // mono
  v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  ascii(36, 'data')
  v.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(44 + i * 2, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true)
  }
  return bytes
}

export interface DecodedWav {
  rate: number
  channels: number
  /** Mono (Kanäle gemittelt), -1 bis 1. */
  samples: Float32Array
}

/** Liest WAV mit 16-Bit-PCM oder 32-Bit-Float; mehrere Kanäle werden gemittelt. */
export function decodeWav(bytes: Uint8Array): DecodedWav {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const tag = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4))
  if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Keine WAV-Datei')
  let format = 0
  let channels = 0
  let rate = 0
  let bits = 0
  let data: Uint8Array | null = null
  for (let at = 12; at + 8 <= bytes.length; ) {
    const id = tag(at)
    const size = v.getUint32(at + 4, true)
    const body = at + 8
    if (id === 'fmt ') {
      format = v.getUint16(body, true)
      channels = v.getUint16(body + 2, true)
      rate = v.getUint32(body + 4, true)
      bits = v.getUint16(body + 14, true)
      // WAVE_FORMAT_EXTENSIBLE: das eigentliche Format steht im Untertyp
      if (format === 0xfffe && size >= 26) format = v.getUint16(body + 24, true)
    } else if (id === 'data') {
      data = bytes.subarray(body, Math.min(bytes.length, body + size))
    }
    at = body + size + (size % 2)
  }
  if (!data || !channels || !rate) throw new Error('WAV ohne Format- oder Datenblock')
  const step = bits / 8
  if (!((format === 1 && bits === 16) || (format === 3 && bits === 32))) throw new Error(`WAV-Format ${format}/${bits} Bit wird nicht unterstützt`)
  const frames = Math.floor(data.length / (step * channels))
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const samples = new Float32Array(frames)
  for (let f = 0; f < frames; f++) {
    let sum = 0
    for (let c = 0; c < channels; c++) {
      const at = (f * channels + c) * step
      sum += format === 1 ? dv.getInt16(at, true) / 0x8000 : dv.getFloat32(at, true)
    }
    samples[f] = sum / channels
  }
  return { rate, channels, samples }
}
