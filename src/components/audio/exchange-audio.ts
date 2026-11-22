/**
 * Wiedergabe innerhalb eines Funkspruchs: Context für `ExchangeAudio` und die Hooks der Zeilen.
 *
 * Eine Zeile (`TransmissionLine`) bekommt ▶ nur, wenn ihre Übertragung zum Funkspruch des umgebenden
 * `ExchangeAudio` gehört (gleiches Objekt) – so spielt nie etwas, das nicht ohnehin sichtbar ist (etwa
 * die Lösung einer Übung). Im Hörmodus (`listen`) steht der Text erst nach dem Hören da.
 */
import { createContext, useCallback, useContext, useEffect } from 'react'
import type { ResolvedTransmission } from '../../core/drills/types'
import { useRadioAudio, type PlayRequest } from '../../platform/audio-context'

export interface ExchangeAudioValue {
  id: string
  transmissions: readonly ResolvedTransmission[]
  cast: string
  /** Hörmodus aktiv (eingeschaltet, Ton verfügbar, „Text immer zeigen“ aus). */
  listening: boolean
  revealed: ReadonlySet<number>
  register: (index: number) => () => void
  reveal: (index: number) => void
  /** Eine Zeile abspielen; danach erscheint ihr Text. */
  /** `tempo`: Faktor aufs Tempo aus dem Profil (z. B. 0,8 zum Mitschreiben). */
  playLine: (index: number, tempo?: number) => Promise<boolean>
  request: (index: number, tempo?: number) => PlayRequest
  /** Angemeldete (sichtbare) Zeilen. */
  registered: ReadonlySet<number>
  /** Hinweis zum Laden der Sprachausgabe zeigen. */
  askSetup: () => void
}

export const ExchangeAudioContext = createContext<ExchangeAudioValue | null>(null)

export interface LineAudio {
  index: number
  key: string
  /** Text noch verborgen (Hörübung). */
  hidden: boolean
  state: 'idle' | 'preparing' | 'playing'
  play: () => void
  stop: () => void
  reveal: () => void
  /** Vorab rechnen (geschieht ohnehin, sobald die Zeile zu sehen ist); beim Zeigen auf ▶ noch einmal. */
  warm: () => void
  /** Ton grundsätzlich möglich (sonst führt ▶ zum Laden). */
  available: boolean
  speaker: string
}

/** Abspielen und Hörmodus für eine Zeile – null, wenn sie zu keinem Funkspruch mit Ton gehört. */
export function useLineAudio(t: ResolvedTransmission): LineAudio | null {
  const ctx = useContext(ExchangeAudioContext)
  const audio = useRadioAudio()
  const index = ctx ? ctx.transmissions.indexOf(t) : -1
  const register = ctx?.register
  useEffect(() => (register && index >= 0 ? register(index) : undefined), [register, index])
  const play = useCallback(() => void ctx?.playLine(index), [ctx, index])
  if (!ctx || index < 0 || t.skip || !audio.enabled) return null
  const key = `${ctx.id}:${index}`
  const cur = audio.current?.key === key ? audio.current.phase : 'idle'
  return {
    index,
    key,
    hidden: ctx.listening && !t.you && !ctx.revealed.has(index),
    state: cur,
    play,
    stop: audio.stop,
    reveal: () => ctx.reveal(index),
    warm: () => audio.prefetch([ctx.request(index)], ctx.id),
    available: audio.available,
    speaker: t.you ? 'dich' : t.speaker,
  }
}

/**
 * Abspielen über den umgebenden Funkspruch (`RadioPanel`/`ExchangeAudio`): spielt eine seiner Übertragungen und
 * wartet bis zum Ende. Ohne Ton eingeschaltet: undefined. Fehlt die Sprachausgabe noch, erscheint der Hinweis zum
 * Laden, und das Promise löst sich sofort auf (der Text kommt dann ohne Ton).
 */
export function useExchangePlay():
  ((t: ResolvedTransmission, tempo?: number) => Promise<void>) | undefined {
  const ctx = useContext(ExchangeAudioContext)
  const { enabled } = useRadioAudio()
  const play = useCallback(
    async (t: ResolvedTransmission, tempo?: number) => {
      const i = ctx ? ctx.transmissions.indexOf(t) : -1
      if (ctx && i >= 0) await ctx.playLine(i, tempo)
    },
    [ctx],
  )
  return ctx && enabled ? play : undefined
}

/**
 * Für eigene Ansichten (z. B. den 9-Line-Decoder): spielt eine Übertragung ihres Funkspruchs ab und
 * wartet, bis sie zu Ende ist. Ohne Ton löst sich das Promise sofort auf.
 */
export function usePlayTransmission(
  transmissions: readonly ResolvedTransmission[],
  cast: string,
): (t: ResolvedTransmission) => Promise<void> {
  const audio = useRadioAudio()
  return useCallback(
    async (t: ResolvedTransmission) => {
      const index = transmissions.indexOf(t)
      if (index < 0 || !audio.available) return
      await audio.play({ key: `${cast}:${index}`, transmissions, index, cast })
    },
    [audio, transmissions, cast],
  )
}

const casts = new WeakMap<object, string>()
let nextCast = 1

/** Eigene Besetzung je aufgelöstem Funkspruch: neu gewürfelt heißt neue Stimmen. */
export function castKeyFor(x: object): string {
  let k = casts.get(x)
  if (!k) {
    k = `x${nextCast++}-${Math.random().toString(36).slice(2, 8)}`
    casts.set(x, k)
  }
  return k
}
