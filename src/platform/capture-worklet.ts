/**
 * AudioWorklet: reicht die Mikrofon-Samples in Blöcken an den Hauptthread weiter.
 * Läuft im AudioWorkletGlobalScope (eigener Thread, kein DOM).
 */
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, ctor: typeof AudioWorkletProcessor): void

/** Etwa 43 ms bei 48 kHz – genug für eine flüssige Pegelanzeige, wenig Nachrichten. */
const BLOCK = 2048

class CaptureProcessor extends AudioWorkletProcessor {
  private buf = new Float32Array(BLOCK)
  private n = 0

  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0]
    if (!channel) return true
    for (let i = 0; i < channel.length; i++) {
      this.buf[this.n++] = channel[i]
      if (this.n === BLOCK) {
        this.port.postMessage(this.buf, [this.buf.buffer])
        this.buf = new Float32Array(BLOCK)
        this.n = 0
      }
    }
    return true
  }
}

registerProcessor('rt-capture', CaptureProcessor)
