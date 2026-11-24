/**
 * Funkklang: welcher Klang zu welcher Übertragung gehört und wie er klingt. Reines TypeScript ohne
 * Web Audio – die Kette selbst baut `src/platform/radio-fx.ts` aus diesen Werten.
 *
 * - **AM** (UHF/VHF-AM der Flugzeugfunkgeräte): schmales Band, Rauschen solange der Träger steht,
 *   kurzer Squelch-Stoß beim Auf- und Zutasten.
 * - **FM** (VHF-FM, JTAC und Bodentruppen): ebenso schmal, aber bei gutem Signal fast rauschfrei
 *   („Quieting“), härter begrenzt, dafür der typische laute Rauschstoß beim Loslassen (Squelch Tail).
 * - **Intercom** (Crew Chief am Kabel, Mehrsitzer): trocken, nur das Headset-Mikrofon, kein Funkfilter.
 */

export type RadioSound = 'am' | 'fm' | 'intercom'

/** Gerät einer Übertragung, wie es die Inhalte angeben (Format-Wunsch C-F6). */
export type RadioKind = 'uhf' | 'vhf' | 'fm' | 'intercom'

/** Was `soundFor` von einer Übertragung braucht – eine `ResolvedTransmission` passt direkt. */
export interface SoundSource {
  speaker?: string
  station?: string
  channel?: 'radio' | 'intercom'
  radio?: RadioKind
}

const INTERCOM_SPEAKERS = /\b(crew chief|plane captain|intercom|backseat|wso|rio|gib)\b/i
const FM_SPEAKERS = /\b(jtac|fac|tacp|joint terminal)\b/i

/**
 * Klang einer Übertragung. Steht das Gerät dabei (`radio`), entscheidet es; sonst die Leitung
 * (`channel: intercom`) und zuletzt der Sprecher: JTAC → FM, Crew Chief → Intercom, alles andere AM.
 */
export function soundFor(t: SoundSource): RadioSound {
  if (t.radio === 'fm') return 'fm'
  if (t.radio === 'intercom') return 'intercom'
  if (t.radio === 'uhf' || t.radio === 'vhf') return 'am'
  if (t.channel === 'intercom') return 'intercom'
  const who = `${t.speaker ?? ''} ${t.station ?? ''}`
  if (FM_SPEAKERS.test(who)) return 'fm'
  if (INTERCOM_SPEAKERS.test(t.speaker ?? '')) return 'intercom'
  return 'am'
}

/** Klangwerte einer Kette. Frequenzen in Hz, Pegel in dB, Zeiten in Sekunden. */
export interface RadioProfile {
  sound: RadioSound
  /** Untere und obere Grenzfrequenz (je zweimal 12 dB/Oktave). */
  highpass: number
  lowpass: number
  /** Anhebung in der Mitte (Präsenz), Frequenz und Gewinn. */
  presence: { freq: number; gain: number }
  /** Sanftes Clipping: 1 = kaum, 6 = deutlich übersteuert. */
  drive: number
  /** Rauschen, solange gesendet wird (relativ zur Sprache); null = keins. */
  noiseDb: number | null
  /** Pegel der Stimme nach dem Kompressor: Bei schwachem Signal versinkt sie im Rauschen. */
  voiceDb: number
  /** Rauschstoß beim Auftasten, bevor die Stimme kommt. */
  squelchOpen: number
  /** Rauschstoß beim Loslassen (Squelch Tail). */
  squelchTail: number
  /** Lautstärke des Rauschstoßes beim Loslassen. */
  tailDb: number
  /** Pause vor der Stimme (Taste gedrückt, dann sprechen) und danach. */
  leadIn: number
  leadOut: number
}

/** Störungen auf dem Kanal: Knacken, kurze Aussetzer, Schwund (Fading). */
export type Interference = 'none' | 'light' | 'heavy'

/**
 * Lesbarkeit (ICAO-Skala 1–5) in Signalstärke 0–1. 5 = einwandfrei, 4 = gut lesbar, 3 = nur mit Mühe,
 * 2 = zeitweise lesbar, 1 = unlesbar.
 */
export const READABILITY_STRENGTH: Record<number, number> = { 5: 1, 4: 0.75, 3: 0.5, 2: 0.28, 1: 0.1 }

export function strengthOf(readability: number): number {
  return READABILITY_STRENGTH[Math.min(5, Math.max(1, Math.round(readability)))]
}

/** Störungen, wenn der Inhalt keine nennt: schlechter Empfang ist meist auch gestört, guter selten. */
export function interferenceFor(readability: number, roll: number): Interference {
  if (readability <= 2) return 'heavy'
  if (readability === 3) return roll < 0.7 ? 'light' : 'heavy'
  if (readability === 4) return roll < 0.3 ? 'light' : 'none'
  return 'none'
}

/**
 * Klangwerte für einen Klang und eine Signalstärke (0 = kaum lesbar, 1 = fünf auf fünf). Schwaches
 * Signal heißt: mehr Rauschen, mehr Verzerrung, leisere Stimme.
 *
 * Vor der Stimme vergeht rund eine halbe Sekunde mit Trägerrauschen – so wie man die Sprechtaste drückt und kurz
 * wartet, damit das erste Wort nicht verschluckt wird.
 */
export function radioProfile(sound: RadioSound, strength = 0.8): RadioProfile {
  const s = Math.min(1, Math.max(0, strength))
  const weak = 1 - s
  switch (sound) {
    case 'am':
      return {
        sound,
        highpass: 320,
        lowpass: 2800,
        presence: { freq: 1700, gain: 4 },
        drive: 2.2 + 3 * weak,
        // Rauschabstand grob: Stufe 5 rund 25 dB, 4 rund 19, 3 rund 12, 2 rund 5, 1 um 0 dB (Stimme im Rauschen)
        noiseDb: -26 + 20 * weak,
        voiceDb: -10 * weak * weak,
        squelchOpen: 0.06,
        squelchTail: 0.11,
        tailDb: -14,
        leadIn: 0.44,
        leadOut: 0.1,
      }
    case 'fm':
      return {
        sound,
        highpass: 300,
        lowpass: 3200,
        presence: { freq: 2200, gain: 5 },
        drive: 3 + 2 * weak,
        // FM rauscht bei gutem Signal kaum; erst schwach wird es laut
        noiseDb: -40 + 32 * weak,
        voiceDb: -10 * weak * weak,
        squelchOpen: 0.03,
        squelchTail: 0.22,
        tailDb: -8,
        leadIn: 0.42,
        leadOut: 0.06,
      }
    case 'intercom':
      return {
        sound,
        highpass: 120,
        lowpass: 7000,
        presence: { freq: 2500, gain: 1.5 },
        drive: 1,
        noiseDb: null,
        voiceDb: 0,
        squelchOpen: 0,
        squelchTail: 0,
        tailDb: -60,
        leadIn: 0.05,
        leadOut: 0.05,
      }
  }
}

/** Kennlinie für den WaveShaper: tanh, auf ±1 normiert. `drive` 1 ist fast linear. */
export function softClipCurve(drive: number, n = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(n)
  const norm = Math.tanh(drive)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = Math.tanh(drive * x) / norm
  }
  return curve
}

/** Zeitplan einer Übertragung in Sekunden, ab Tastendruck. */
export interface TransmissionTimeline {
  /** Stimme beginnt bzw. endet. */
  voiceStart: number
  voiceEnd: number
  /** Taste losgelassen: hier beginnt der Squelch Tail. */
  unkey: number
  /** Ende von allem. */
  end: number
}

export function timeline(profile: RadioProfile, voiceSeconds: number): TransmissionTimeline {
  const voiceStart = profile.squelchOpen + profile.leadIn
  const voiceEnd = voiceStart + voiceSeconds
  const unkey = voiceEnd + profile.leadOut
  return { voiceStart, voiceEnd, unkey, end: unkey + profile.squelchTail + 0.03 }
}

export const dbToGain = (db: number): number => Math.pow(10, db / 20)

/**
 * Überlagerungston, wenn zwei Sender gleichzeitig senden („blocked“): Die Träger schlagen gegeneinander,
 * der Empfänger pfeift mit der Differenzfrequenz. Sie wandert leicht, weil kein Sender exakt sitzt.
 */
export function heterodyne(
  sampleRate: number,
  seconds: number,
  baseHz = 1150,
  wobbleHz = 60,
): Float32Array<ArrayBuffer> {
  const n = Math.max(0, Math.round(sampleRate * seconds))
  const out = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const f =
      baseHz +
      wobbleHz * Math.sin(2 * Math.PI * 0.7 * t) +
      0.4 * wobbleHz * Math.sin(2 * Math.PI * 2.3 * t)
    phase += (2 * Math.PI * f) / sampleRate
    out[i] = Math.sin(phase)
  }
  return out
}
