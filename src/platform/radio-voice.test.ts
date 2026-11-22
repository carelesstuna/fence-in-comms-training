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

  it('setzt den Empfang in Signalstärke um', () => {
    expect(req(1, 1, { ...DEFAULT_AUDIO, signal: 'weak' }).strength).toBeLessThan(
      req(1, 1, { ...DEFAULT_AUDIO, signal: 'good' }).strength,
    )
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
