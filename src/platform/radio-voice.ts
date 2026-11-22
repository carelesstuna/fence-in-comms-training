/**
 * Aus einer Übertragung wird hörbarer Funk: Stimme(n) rechnen lassen, Funklöcher einfügen, durch die
 * Funkkette schicken. Verbindet Sprachausgabe (`tts-engine.ts`) und Funkklang (`radio-fx.ts`).
 */
import { radioProfile, soundFor, type RadioSound } from '../core/audio/radio'
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
  /** Empfang: 1 = fünf auf fünf, 0 = kaum lesbar. */
  strength: number
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
    return renderRadio(a, TTS_RATE, radioProfile('am', Math.min(r.strength, 0.6)), {
      overlay: b,
      overlayAt: 0.25,
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
  return renderRadio(all, TTS_RATE, profile, { statics })
}

const STRENGTH: Record<AudioSettings['signal'], number> = { good: 0.95, fair: 0.75, weak: 0.35 }
const VOICE_IDS = VOICES.map((v) => v.id)

/** Wer spricht wie: Stimme aus der Besetzung des Durchlaufs, Klang aus Gerät bzw. Sprecher. */
export function voiceRequest(r: PlayRequest, settings: AudioSettings): VoiceRequest {
  const t = r.transmissions[r.index]
  const cast = castFor(r.cast, VOICE_IDS)
  const voice = cast.voiceFor(t.speaker)
  return {
    audio: transmissionAudio(r.transmissions, r.index),
    voice,
    other: cast.otherThan(voice),
    speed: Math.round(settings.tempo * (r.tempo ?? 1) * (voiceInfo(voice)?.speed ?? 1) * 100) / 100,
    sound: soundFor(t),
    strength: STRENGTH[settings.signal] ?? STRENGTH.fair,
  }
}
