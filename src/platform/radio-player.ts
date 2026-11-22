/**
 * Ausgabe: ein gemeinsamer AudioContext mit Gesamtlautstärke. Spielt fertig gerechnete Übertragungen
 * (siehe `radio-fx.ts`) – immer nur eine auf einmal, eine neue beendet die alte.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let volume = 0.8
let current: { src: AudioBufferSourceNode; done: () => void } | null = null

export function audioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' })
    master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Ausgang mit Gesamtlautstärke (für Squelch-Klicks und Übertragungen). */
export function output(): AudioNode {
  audioContext()
  return master!
}

export function setVolume(v: number): void {
  volume = Math.min(1, Math.max(0, v))
  if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02)
}

/** Laufende Wiedergabe beenden (ihr Promise löst sich auf). */
export function stopPlayback(): void {
  if (!current) return
  const c = current
  current = null
  try {
    c.src.stop()
  } catch {
    // schon zu Ende
  }
  c.done()
}

/** Spielt einen Puffer ab; löst sich auf, wenn er zu Ende ist oder gestoppt wird (dann `false`). */
export function playBuffer(buf: AudioBuffer): Promise<boolean> {
  stopPlayback()
  const c = audioContext()
  const src = c.createBufferSource()
  src.buffer = buf
  src.connect(output())
  return new Promise<boolean>((resolve) => {
    let finished = false
    const entry = {
      src,
      done: () => {
        if (!finished) {
          finished = true
          resolve(false)
        }
      },
    }
    src.onended = () => {
      if (current === entry) current = null
      if (!finished) {
        finished = true
        resolve(true)
      }
    }
    current = entry
    src.start()
  })
}
