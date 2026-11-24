import { describe, expect, it } from 'vitest'
import type { ResolvedTransmission } from '../core/drills/types'
import { DEFAULT_AUDIO } from '../state/store'
import { textsOf, voiceRequest } from './radio-voice'
import { voiceInfo } from './tts-config'

const t = (
  speaker: string,
  text: string,
  extra: Partial<ResolvedTransmission> = {},
): ResolvedTransmission => ({
  speaker,
  you: false,
  channel: 'radio',
  segments: [{ text, role: 'info' }],
  ...extra,
})

describe('Wer spricht wie (voiceRequest)', () => {
  const list = [
    t('Axeman', 'Hawg one one, type two control', { radio: 'fm' }),
    t('Darkstar', 'Hawg one one, picture clean'),
    t('Crew Chief', 'loud and clear', { channel: 'intercom' }),
    t('Axeman', 'cleared hot', { radio: 'fm' }),
  ]
  const req = (index: number, tempo?: number, settings = DEFAULT_AUDIO) =>
    voiceRequest({ key: 'k', transmissions: list, index, cast: 'test', tempo }, settings)

  it('nimmt den Klang aus Gerät bzw. Leitung', () => {
    expect(req(0).sound).toBe('fm')
    expect(req(1).sound).toBe('am')
    expect(req(2).sound).toBe('intercom')
  })

  it('gibt derselben Station dieselbe Stimme, anderen eine andere', () => {
    expect(req(3).voice).toBe(req(0).voice)
    expect(req(1).voice).not.toBe(req(0).voice)
    expect(req(0).other).not.toBe(req(0).voice)
  })

  it('verrechnet Tempo aus Profil, Übung und Stimme', () => {
    const base = voiceInfo(req(0).voice)!.speed
    expect(req(0).speed).toBeCloseTo(base, 2)
    expect(req(0, 0.8).speed).toBeCloseTo(base * 0.8, 2)
    expect(req(0, 1, { ...DEFAULT_AUDIO, tempo: 1.2 }).speed).toBeCloseTo(base * 1.2, 2)
  })

  it('würfelt ohne Vorgabe vier oder fünf auf fünf, „immer klar“ gibt fünf ohne Störungen', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      voiceRequest({ key: 'k', transmissions: list, index: 1, cast: `c${i}` }, DEFAULT_AUDIO),
    )
    expect(new Set(many.map((r) => r.readability))).toEqual(new Set([4, 5]))
    const clear = req(1, 1, { ...DEFAULT_AUDIO, noise: 'clear' })
    expect(clear.readability).toBe(5)
    expect(clear.interference).toBe('none')
  })

  it('übernimmt die Lesbarkeit aus dem Inhalt, auch bei „immer klar“', () => {
    const weak = [t('Batumi Approach', 'radio check', { readability: 2 })]
    const r = voiceRequest({ key: 'w', transmissions: weak, index: 0, cast: 'x' }, { ...DEFAULT_AUDIO, noise: 'clear' })
    expect(r.readability).toBe(2)
    expect(r.interference).toBe('heavy')
    expect(r.strength).toBeLessThan(req(1).strength)
  })

  it('nennt alle Texte zum Vorab-Rechnen, bei „blocked“ beide Stimmen', () => {
    expect(textsOf(req(1))).toEqual([{ text: 'Hawg one one, picture clean', voice: req(1).voice }])
    const blocked = voiceRequest(
      {
        key: 'b',
        transmissions: [
          t('zwei Stationen gleichzeitig', '[Pfeifton und Wortfetzen]'),
          t('Viper 1-1', 'request taxi', { you: true }),
        ],
        index: 0,
        cast: 'test',
      },
      DEFAULT_AUDIO,
    )
    expect(textsOf(blocked).map((x) => x.text)).toEqual(['request taxi', expect.any(String)])
    expect(new Set(textsOf(blocked).map((x) => x.voice)).size).toBe(2)
  })
})
