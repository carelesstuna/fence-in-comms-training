/**
 * Funkkette mit Web Audio: Aus einer trockenen Stimme wird eine Übertragung mit Funkklang.
 *
 * Gerechnet wird vorab in einem `OfflineAudioContext` (ein Funkspruch braucht dafür wenige
 * Millisekunden). Das Ergebnis ist ein fertiger `AudioBuffer`: Squelch, Rauschen und Stimme liegen
 * zeitlich genau, Abspielen und Stoppen bleiben einfach, und dieselbe Kette erzeugt Klangproben als WAV.
 *
 *   Stimme → Hochpass ×2 → Präsenz → Tiefpass ×2 → WaveShaper (sanftes Clipping) → Kompressor ─┐
 *   Rauschen (Träger) → Bandpass → Hüllkurve ─────────────────────────────────────────────────┼→ Ausgang
 *   Rauschstoß (Squelch auf/zu) → Bandpass → Hüllkurve ───────────────────────────────────────┘
 */
import {
  dbToGain,
  heterodyne,
  softClipCurve,
  timeline,
  type Interference,
  type RadioProfile,
} from '../core/audio/radio'

export interface RenderOptions {
  /** Zweiter Sender gleichzeitig („blocked“): seine Stimme, ab `overlayAt` Sekunden nach der ersten. */
  overlay?: Float32Array
  overlayAt?: number
  /** Funklöcher: hier rauscht es laut statt der Stimme (Sekunden ab Beginn der Stimme). */
  statics?: readonly [number, number][]
  /** Ausgangspegel vor der Lautstärke (Spitze). */
  level?: number
  /** Störungen: Knacken, kurze Aussetzer, Schwund – unruhiger als das gleichmäßige Grundrauschen. */
  interference?: Interference
  /** Bei zwei Sendern: Pegel des Pfeiftons (Standard −16 dB) und Faktor für beide Stimmen (Standard 1). */
  heterodyneDb?: number
  voiceGain?: number
}

/** Stärke der Störungen je Stufe. */
const INTERFERENCE = {
  light: { cracklesPerSec: 3, crackleDb: -20, fadeDepth: 0.3, dropoutsPerSec: 0.25, whineDb: null },
  heavy: { cracklesPerSec: 9, crackleDb: -13, fadeDepth: 0.7, dropoutsPerSec: 0.7, whineDb: -30 },
} as const

/** Knacken und Prasseln: kurze, abklingende Rauschimpulse an zufälligen Stellen zwischen `from` und `to`. */
function crackleBuffer(ctx: BaseAudioContext, from: number, to: number, perSec: number): AudioBuffer {
  const rate = ctx.sampleRate
  const buf = ctx.createBuffer(1, Math.max(1, Math.ceil(rate * to)), rate)
  const d = buf.getChannelData(0)
  const count = Math.round((to - from) * perSec)
  for (let k = 0; k < count; k++) {
    const at = Math.floor((from + Math.random() * (to - from)) * rate)
    const len = Math.floor(rate * (0.002 + Math.random() * 0.016))
    const amp = 0.3 + Math.random() * 0.7
    // Manchmal ein ganzes Büschel kurz hintereinander („Prasseln“)
    const burst = Math.random() < 0.3 ? 3 + Math.floor(Math.random() * 4) : 1
    for (let b = 0; b < burst; b++) {
      const start = at + Math.floor(b * rate * (0.008 + Math.random() * 0.02))
      for (let i = 0; i < len && start + i < d.length; i++) {
        d[start + i] += amp * (Math.random() * 2 - 1) * Math.exp(-i / (len / 4))
      }
    }
  }
  return buf
}

/** Spitze auf `peak` bringen (Kokoro liefert je nach Stimme sehr unterschiedliche Pegel). */
export function normalizePeak(samples: Float32Array, peak = 0.95): Float32Array<ArrayBuffer> {
  let max = 0
  for (const s of samples) max = Math.max(max, Math.abs(s))
  const out = new Float32Array(samples.length)
  const k = max > 1e-6 ? peak / max : 0
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * k
  return out
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.max(1, Math.ceil(ctx.sampleRate * seconds)), ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

function filter(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  freq: number,
  q = Math.SQRT1_2,
  gain = 0,
): BiquadFilterNode {
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  f.gain.value = gain
  return f
}

/** Kette der Bandbegrenzung; gibt Ein- und Ausgang zurück. */
function band(ctx: BaseAudioContext, p: RadioProfile): { input: AudioNode; output: AudioNode } {
  const hp1 = filter(ctx, 'highpass', p.highpass)
  const hp2 = filter(ctx, 'highpass', p.highpass)
  const pres = filter(ctx, 'peaking', p.presence.freq, 0.9, p.presence.gain)
  const lp1 = filter(ctx, 'lowpass', p.lowpass)
  const lp2 = filter(ctx, 'lowpass', p.lowpass)
  hp1.connect(hp2).connect(pres).connect(lp1).connect(lp2)
  return { input: hp1, output: lp2 }
}

/** Rechnet eine Übertragung. `voice` ist die trockene Stimme mit `rate` Hz. */
export async function renderRadio(
  voice: Float32Array,
  rate: number,
  p: RadioProfile,
  opts: RenderOptions = {},
): Promise<AudioBuffer> {
  const overlayEnd = opts.overlay ? (opts.overlayAt ?? 0.2) + opts.overlay.length / rate : 0
  const voiceSeconds = Math.max(voice.length / rate, overlayEnd)
  const tl = timeline(p, voiceSeconds)
  const ctx = new OfflineAudioContext(1, Math.ceil(tl.end * rate), rate)
  const out = ctx.createGain()
  out.gain.value = opts.level ?? 0.75
  out.connect(ctx.destination)

  // Stimme(n) durch Band, Clipping und Kompressor
  const chain = band(ctx, p)
  const shaper = ctx.createWaveShaper()
  shaper.curve = softClipCurve(p.drive)
  shaper.oversample = '2x'
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = p.sound === 'intercom' ? -18 : -26
  comp.ratio.value = p.sound === 'intercom' ? 3 : 8
  comp.attack.value = 0.003
  comp.release.value = 0.15
  comp.knee.value = 6
  const makeup = ctx.createGain()
  makeup.gain.value = p.sound === 'intercom' ? 1.2 : 1.6
  // Pegel der Stimme nach dem Kompressor: schwaches Signal, Schwund und Aussetzer
  const voiceLevel = ctx.createGain()
  const base = dbToGain(p.voiceDb)
  voiceLevel.gain.value = base
  chain.output.connect(shaper).connect(comp).connect(makeup).connect(voiceLevel).connect(out)
  const inter = p.sound !== 'intercom' && opts.interference && opts.interference !== 'none' ? INTERFERENCE[opts.interference] : null
  /** Aussetzer: Stimme kurz weg, dafür lautes Rauschen (Zeiten ab Tastendruck). */
  const dropouts: [number, number][] = []
  if (inter) {
    const from = tl.voiceStart
    const to = tl.voiceEnd
    // Schwund: alle 0,2–0,45 s ein neuer Pegel zwischen voll und (1 − Tiefe)
    for (let t = from; t < to; t += 0.2 + Math.random() * 0.25) {
      voiceLevel.gain.setTargetAtTime(base * (1 - inter.fadeDepth * Math.random()), t, 0.06)
    }
    const n = Math.round((to - from) * inter.dropoutsPerSec)
    for (let k = 0; k < n; k++) {
      const a = from + Math.random() * Math.max(0, to - from - 0.2)
      const len = 0.06 + Math.random() * (opts.interference === 'heavy' ? 0.18 : 0.08)
      dropouts.push([a, a + len])
    }
    for (const [a, b] of dropouts.sort((x, y) => x[0] - y[0])) {
      voiceLevel.gain.setTargetAtTime(base * 0.04, a, 0.008)
      voiceLevel.gain.setTargetAtTime(base, b, 0.02)
    }
  }

  const addVoice = (samples: Float32Array, at: number, gain = 1) => {
    const buf = ctx.createBuffer(1, Math.max(1, samples.length), rate)
    buf.copyToChannel(normalizePeak(samples), 0)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = gain
    src.connect(g).connect(chain.input)
    src.start(at)
  }
  addVoice(voice, tl.voiceStart, opts.voiceGain ?? 1)
  if (opts.overlay) {
    const at = tl.voiceStart + (opts.overlayAt ?? 0.2)
    addVoice(opts.overlay, at, 0.85 * (opts.voiceGain ?? 1))
    // Pfeifton, solange beide Träger stehen
    const start = at
    const end = Math.min(tl.voiceStart + voice.length / rate, at + opts.overlay.length / rate)
    if (end > start) {
      const tone = ctx.createBuffer(1, Math.ceil((end - start) * rate) + 1, rate)
      tone.copyToChannel(heterodyne(rate, end - start), 0)
      const src = ctx.createBufferSource()
      src.buffer = tone
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, start)
      const hetDb = opts.heterodyneDb ?? -16
      g.gain.linearRampToValueAtTime(dbToGain(hetDb), start + 0.03)
      g.gain.setValueAtTime(dbToGain(hetDb), end - 0.03)
      g.gain.linearRampToValueAtTime(0, end)
      src.connect(g).connect(out)
      src.start(start)
    }
  }

  if (p.noiseDb !== null) {
    // Rauschen, solange der Träger steht – mit kurzem Stoß beim Auftasten
    const carrier = band(ctx, p)
    const n = ctx.createBufferSource()
    n.buffer = noiseBuffer(ctx, tl.end)
    const env = ctx.createGain()
    const floorDb = p.noiseDb + (opts.overlay ? 6 : 0)
    const floor = dbToGain(floorDb)
    // Stöße (Auftasten, Funkloch, Aussetzer) liegen immer über dem Grundrauschen, auch bei sehr schlechtem Empfang
    const burstDb = Math.max(p.tailDb, floorDb + 4)
    env.gain.setValueAtTime(0, 0)
    env.gain.linearRampToValueAtTime(dbToGain(burstDb - 4), 0.004)
    env.gain.setTargetAtTime(floor, 0.004, Math.max(0.01, p.squelchOpen / 3))
    // Funklöcher und Aussetzer: hier rauscht es laut (Aussetzer etwas leiser als ein ganzes Funkloch)
    const holes = [
      ...(opts.statics ?? []).map(([a, b]) => [tl.voiceStart + a, tl.voiceStart + b, burstDb - 2] as const),
      ...dropouts.map(([a, b]) => [a, b, Math.max(burstDb - 6, floorDb + 2)] as const),
    ].sort((x, y) => x[0] - y[0])
    for (const [from, to, db] of holes) {
      const ramp = Math.min(0.04, (to - from) / 3)
      env.gain.setValueAtTime(floor, from)
      env.gain.linearRampToValueAtTime(dbToGain(db), from + ramp)
      env.gain.setValueAtTime(dbToGain(db), to - ramp)
      env.gain.linearRampToValueAtTime(floor, to)
    }
    env.gain.setValueAtTime(floor, tl.unkey)
    env.gain.linearRampToValueAtTime(0, tl.unkey + 0.01)
    n.connect(carrier.input)
    carrier.output.connect(env).connect(out)
    n.start(0)

    if (inter) {
      // Knacken und Prasseln, solange der Träger steht – im Band des Empfängers
      const cr = ctx.createBufferSource()
      cr.buffer = crackleBuffer(ctx, 0.05, tl.unkey, inter.cracklesPerSec)
      const crBand = band(ctx, { ...p, presence: { freq: 2400, gain: 3 } })
      const crGain = ctx.createGain()
      crGain.gain.value = dbToGain(inter.crackleDb)
      cr.connect(crBand.input)
      crBand.output.connect(crGain).connect(out)
      cr.start(0)
      // Bei starken Störungen ein leises, wanderndes Pfeifen (ein Fremdträger in der Nähe)
      if (inter.whineDb !== null) {
        const a = tl.voiceStart * Math.random()
        const len = Math.max(0.3, (tl.unkey - a) * (0.4 + 0.5 * Math.random()))
        const tone = ctx.createBuffer(1, Math.ceil(len * rate) + 1, rate)
        tone.copyToChannel(heterodyne(rate, len, 1500 + Math.random() * 900, 180), 0)
        const src = ctx.createBufferSource()
        src.buffer = tone
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, a)
        g.gain.linearRampToValueAtTime(dbToGain(inter.whineDb), a + 0.15)
        g.gain.setValueAtTime(dbToGain(inter.whineDb), a + len - 0.15)
        g.gain.linearRampToValueAtTime(0, a + len)
        src.connect(g).connect(out)
        src.start(a)
      }
    }

    // Squelch Tail: Träger weg, der Empfänger rauscht kurz voll auf, bis die Sperre schließt
    const tailBand =
      p.sound === 'fm'
        ? { highpass: 500, lowpass: 5500 }
        : { highpass: p.highpass, lowpass: p.lowpass }
    const tail = band(ctx, { ...p, ...tailBand, presence: { freq: 2000, gain: 0 } })
    const t = ctx.createBufferSource()
    t.buffer = noiseBuffer(ctx, p.squelchTail + 0.05)
    const tenv = ctx.createGain()
    tenv.gain.setValueAtTime(0, 0)
    tenv.gain.setValueAtTime(0, tl.unkey)
    tenv.gain.linearRampToValueAtTime(dbToGain(burstDb), tl.unkey + 0.006)
    tenv.gain.setValueAtTime(dbToGain(burstDb), tl.unkey + p.squelchTail * 0.7)
    tenv.gain.linearRampToValueAtTime(0, tl.unkey + p.squelchTail)
    t.connect(tail.input)
    tail.output.connect(tenv).connect(out)
    t.start(tl.unkey)
  }

  return ctx.startRendering()
}

/** Mono-Daten eines gerechneten Puffers (z. B. für WAV-Proben). */
export function bufferSamples(buf: AudioBuffer): Float32Array {
  return buf.getChannelData(0)
}
