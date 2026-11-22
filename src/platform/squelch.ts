/**
 * Squelch-Klick beim Drücken und Loslassen der Sprechtaste: ein kurzes, gefiltertes Rauschen wie
 * am Funkgerät. Rein akustische Rückmeldung, ohne Dateien. Klingt wie der Squelch der Gegenstellen
 * (AM-Profil aus `core/audio/radio.ts`) und folgt der Lautstärke aus den Einstellungen.
 */
import { radioProfile } from '../core/audio/radio'
import { audioContext, output } from './radio-player'

export function squelch(kind: 'open' | 'close'): void {
  try {
    const ctx = audioContext()
    const p = radioProfile('am')
    const len = kind === 'open' ? p.squelchOpen * 0.75 : p.squelchTail
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      // Kurzer Anschlag, dann abklingendes Rauschen
      data[i] = (Math.random() * 2 - 1) * (kind === 'open' ? 1 - t : Math.exp(-4 * t))
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = Math.sqrt(p.highpass * p.lowpass)
    band.Q.value = 0.9
    const gain = ctx.createGain()
    gain.gain.value = kind === 'open' ? 0.12 : 0.18
    src.connect(band).connect(gain).connect(output())
    src.start()
  } catch {
    // Kein Audio – dann eben ohne Klick
  }
}
