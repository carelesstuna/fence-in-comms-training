/**
 * Aus einer Übertragung wird hörbarer Funk: Stimme(n) rechnen lassen, Funklöcher einfügen, durch die
 * Funkkette schicken. Verbindet Sprachausgabe (`tts-engine.ts`) und Funkklang (`radio-fx.ts`).
 */
import { interferenceFor, radioProfile, soundFor, strengthOf, type Interference, type RadioSound } from '../core/audio/radio'
import { transmissionAudio, type TransmissionAudio } from '../core/audio/speech-text'
import { castFor } from '../core/audio/voices'
import type { AudioSettings } from '../state/store'
import type { PlayRequest } from './audio-context'
import { renderRadio } from './radio-fx'
import { TTS_RATE, VOICES, voiceInfo } from './tts-config'
import type { Priority, TtsEngine } from './tts-engine'

export interface VoiceRequest {
  audio: TransmissionAudio
  voice: string
  /** Zweite Stimme bei „blocked“. */
  other: string
  speed: number
  sound: RadioSound
  /** Lesbarkeit beim Empfänger, 1–5 (ICAO-Skala). */
  readability: number
  /** Empfang: 1 = fünf auf fünf, 0 = kaum lesbar (aus der Lesbarkeit). */
  strength: number
  interference: Interference
}

/** So lange rauscht ein Funkloch („[Rauschen]“). */
const STATIC_SECONDS = 1.1

/** Alle Texte, die gesprochen werden müssen (zum Vorab-Rechnen). */
export function textsOf(r: VoiceRequest): { text: string; voice: string }[] {
  if (r.audio.kind === 'blocked')
    return [
      { text: r.audio.texts[0], voice: r.voice },
      { text: r.audio.texts[1], voice: r.other },
    ]
  if (r.audio.kind === 'speech')
    return r.audio.parts.flatMap((p) =>
      p.kind === 'speech' ? [{ text: p.text, voice: r.voice }] : [],
    )
  return []
}

/** Nur die Stimmen rechnen lassen, ohne abzuspielen (`owner`: siehe `TtsEngine.synth`). */
export async function prepareVoice(
  engine: TtsEngine,
  r: VoiceRequest,
  priority: Priority = 'later',
  owner?: string,
): Promise<void> {
  await Promise.all(textsOf(r).map((t) => engine.synth(t.text, t.voice, r.speed, priority, owner)))
}

/** Fertige Übertragung als Puffer – oder null, wenn es nichts zu hören gibt. */
export async function renderVoice(
  engine: TtsEngine,
  r: VoiceRequest,
  priority: Priority = 'now',
): Promise<AudioBuffer | null> {
  const profile = radioProfile(r.sound, r.strength)
  if (r.audio.kind === 'none') return null
  if (r.audio.kind === 'blocked') {
    const [a, b] = await Promise.all([
      engine.synth(r.audio.texts[0], r.voice, r.speed, priority),
      engine.synth(r.audio.texts[1], r.other, r.speed * 1.05, priority),
    ])
    const strong = r.audio.strong === true
    return renderRadio(a, TTS_RATE, radioProfile('am', Math.min(r.strength, 0.6)), {
      overlay: b,
      overlayAt: strong ? 0.2 : 0.25,
      interference: r.interference,
      // Teneriffa: Im KLM-Cockpit war fast nur der Pfeifton zu hören
      ...(strong ? { heterodyneDb: -5, voiceGain: 0.45 } : {}),
    })
  }
  const pieces: Float32Array[] = []
  const statics: [number, number][] = []
  let at = 0
  const voices = await Promise.all(
    r.audio.parts.map((p) =>
      p.kind === 'speech' ? engine.synth(p.text, r.voice, r.speed, priority) : null,
    ),
  )
  r.audio.parts.forEach((p, i) => {
    if (p.kind === 'static') {
      const n = Math.round(STATIC_SECONDS * TTS_RATE)
      statics.push([at / TTS_RATE, (at + n) / TTS_RATE])
      pieces.push(new Float32Array(n))
      at += n
    } else if (p.kind === 'pause') {
      // Sprechpause: Taste bleibt gedrückt, man hört nur das Trägerrauschen
      const n = Math.round(p.seconds * TTS_RATE)
      pieces.push(new Float32Array(n))
      at += n
    } else {
      pieces.push(voices[i]!)
      at += voices[i]!.length
    }
  })
  const all = new Float32Array(at)
  let k = 0
  for (const p of pieces) {
    all.set(p, k)
    k += p.length
  }
  return renderRadio(all, TTS_RATE, profile, { statics, interference: r.interference })
}

const VOICE_IDS = VOICES.map((v) => v.id)

/** Fester Zufallswert 0–1 aus einem Text (gleiche Übertragung im selben Durchlauf → gleicher Empfang). */
function hashRoll(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

/**
 * Empfang einer Übertragung: Steht die Lesbarkeit im Inhalt (Radio Check, Hörübung), gilt sie immer. Sonst würfelt
 * die Wiedergabe 4 oder 5 – außer im Profil steht „immer klar“, dann 5 ohne Störungen.
 */
export function receptionOf(
  t: { readability?: number; interference?: Interference },
  key: string,
  noise: AudioSettings['noise'],
): { readability: number; interference: Interference } {
  const fixed = t.readability
  const readability = fixed ?? (noise === 'clear' ? 5 : hashRoll(`${key}:r`) < 0.5 ? 5 : 4)
  const interference = t.interference ?? (fixed === undefined && noise === 'clear' ? 'none' : interferenceFor(readability, hashRoll(`${key}:i`)))
  return { readability, interference }
}

/** Wer spricht wie: Stimme aus der Besetzung des Durchlaufs, Klang aus Gerät bzw. Sprecher. */
export function voiceRequest(r: PlayRequest, settings: AudioSettings): VoiceRequest {
  const t = r.transmissions[r.index]
  const cast = castFor(r.cast, VOICE_IDS)
  const audio = transmissionAudio(r.transmissions, r.index)
  // Überlagerung bestimmter Übertragungen: jede Stimme wie in ihrer eigenen Zeile
  const mixed = audio.kind === 'blocked' && audio.speakers ? audio.speakers : null
  const voice = cast.voiceFor(mixed ? mixed[0] : t.speaker)
  const second = mixed ? cast.voiceFor(mixed[1]) : undefined
  const reception = receptionOf(t, `${r.cast}:${r.index}`, settings.noise)
  return {
    audio,
    voice,
    other: second && second !== voice ? second : cast.otherThan(voice),
    speed: Math.round(settings.tempo * (r.tempo ?? 1) * (voiceInfo(voice)?.speed ?? 1) * 100) / 100,
    sound: soundFor(t),
    ...reception,
    strength: strengthOf(reception.readability),
  }
}
