/**
 * Wer spricht mit welcher Stimme: innerhalb eines Durchlaufs (Szenario, Funkspruch, Übung) hat jede
 * Station eine feste Stimme, und verschiedene Stationen klingen verschieden – Tower ≠ AWACS ≠ JTAC ≠
 * Wingman. Die Reihenfolge der Stimmen ist pro Durchlauf gewürfelt, also klingt der nächste anders.
 */
import { createRng } from '../random/rng'

/** Schlüssel einer Station: der Sprecher, ohne Groß/klein und Bindestriche („Viper 1-2“ = „viper 1 2“). */
export function speakerKey(speaker: string): string {
  return speaker.toLowerCase().replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim()
}

export class VoiceCast {
  private readonly order: string[]
  private readonly cast = new Map<string, string>()

  constructor(seed: string, voices: readonly string[]) {
    this.order = createRng(`stimmen/${seed}`).shuffle([...voices])
  }

  /** Stimme einer Station; neue Stationen bekommen die nächste freie. */
  voiceFor(speaker: string): string {
    const key = speakerKey(speaker)
    let v = this.cast.get(key)
    if (!v) {
      // Erst alle Stimmen einmal vergeben, dann wieder von vorn
      v = this.order[this.cast.size % this.order.length]
      this.cast.set(key, v)
    }
    return v
  }

  /** Eine andere Stimme als `voice` (der zweite Sender bei „blocked“). */
  otherThan(voice: string): string {
    const i = this.order.indexOf(voice)
    return this.order[(i + 1) % this.order.length]
  }
}

const casts = new Map<string, VoiceCast>()

/** Die Besetzung eines Durchlaufs – alle Stellen mit demselben Schlüssel teilen sie sich. */
export function castFor(seed: string, voices: readonly string[]): VoiceCast {
  const key = `${seed}|${voices.join(',')}`
  let c = casts.get(key)
  if (!c) {
    if (casts.size > 50) casts.clear()
    c = new VoiceCast(seed, voices)
    casts.set(key, c)
  }
  return c
}
