import { describe, expect, it } from 'vitest'
import { dbToGain, heterodyne, radioProfile, softClipCurve, soundFor, timeline } from './radio'
import { speakable, speechParts, spokenText, transmissionAudio } from './speech-text'
import { castFor, speakerKey, VoiceCast } from './voices'
import { spokenPlaceholders } from '../random/template'

describe('Klangwahl (soundFor)', () => {
  it('nimmt das Gerät, wenn es angegeben ist', () => {
    expect(soundFor({ speaker: 'Kutaisi Tower', radio: 'fm' })).toBe('fm')
    expect(soundFor({ speaker: 'Axeman', radio: 'uhf' })).toBe('am')
    expect(soundFor({ speaker: 'Darkstar', radio: 'vhf' })).toBe('am')
    expect(soundFor({ speaker: 'Pilot', radio: 'intercom' })).toBe('intercom')
  })

  it('leitet den Klang sonst aus Leitung und Sprecher ab', () => {
    expect(soundFor({ speaker: 'Kutaisi Tower', channel: 'radio' })).toBe('am')
    expect(soundFor({ speaker: 'Darkstar' })).toBe('am')
    expect(soundFor({ speaker: 'Crew Chief', channel: 'intercom' })).toBe('intercom')
    expect(soundFor({ speaker: 'Crew Chief' })).toBe('intercom')
    expect(soundFor({ speaker: 'Pilot', channel: 'intercom' })).toBe('intercom')
    expect(soundFor({ speaker: 'JTAC' })).toBe('fm')
    expect(soundFor({ speaker: 'Viper 1-2', station: 'two' })).toBe('am')
  })
})

describe('Funkkette (reine Teile)', () => {
  it('AM rauscht, FM ist bei gutem Signal leiser, Intercom ist trocken', () => {
    const am = radioProfile('am', 1)
    const fm = radioProfile('fm', 1)
    const ics = radioProfile('intercom')
    expect(am.noiseDb).not.toBeNull()
    expect(fm.noiseDb!).toBeLessThan(am.noiseDb!)
    // FM: der laute, lange Rauschstoß beim Loslassen
    expect(fm.squelchTail).toBeGreaterThan(am.squelchTail)
    expect(fm.tailDb).toBeGreaterThan(am.tailDb)
    expect(ics.noiseDb).toBeNull()
    expect(ics.squelchTail).toBe(0)
    expect(ics.lowpass).toBeGreaterThan(am.lowpass * 2)
  })

  it('schwaches Signal heißt mehr Rauschen und Verzerrung', () => {
    const good = radioProfile('am', 1)
    const weak = radioProfile('am', 0.2)
    expect(weak.noiseDb!).toBeGreaterThan(good.noiseDb! + 10)
    expect(weak.drive).toBeGreaterThan(good.drive)
  })

  it('legt Squelch, Stimme und Squelch Tail zeitlich hintereinander', () => {
    const p = radioProfile('fm')
    const tl = timeline(p, 3)
    expect(tl.voiceStart).toBeCloseTo(p.squelchOpen + p.leadIn)
    expect(tl.voiceEnd - tl.voiceStart).toBeCloseTo(3)
    expect(tl.unkey).toBeGreaterThan(tl.voiceEnd)
    expect(tl.end).toBeGreaterThan(tl.unkey + p.squelchTail)
  })

  it('Kennlinie: punktsymmetrisch, ±1 an den Rändern, stärker gekrümmt mit mehr Drive', () => {
    const soft = softClipCurve(1, 101)
    const hard = softClipCurve(5, 101)
    expect(soft[0]).toBeCloseTo(-1)
    expect(soft[100]).toBeCloseTo(1)
    expect(soft[50]).toBeCloseTo(0)
    expect(hard[75]).toBeGreaterThan(soft[75])
  })

  it('Überlagerungston: Länge, Pegel und wandernde Frequenz', () => {
    const t = heterodyne(8000, 0.5)
    expect(t.length).toBe(4000)
    expect(Math.max(...t)).toBeLessThanOrEqual(1)
    expect(Math.max(...t)).toBeGreaterThan(0.99)
    expect(dbToGain(-20)).toBeCloseTo(0.1)
  })
})

describe('Sprechtext', () => {
  it('nimmt die Sprechform und trennt Segmente mit Kommas', () => {
    const t = {
      segments: [
        { text: 'Kutaisi Tower' },
        { text: 'Viper 1-1', spoken: 'Viper one one' },
        { text: 'cleared for takeoff' },
      ],
    }
    expect(spokenText(t)).toBe('Kutaisi Tower, Viper one one, cleared for takeoff')
  })

  it('spricht Flugzeugmuster und Kürzel aus', () => {
    expect(speakable('F-15E')).toBe('F fifteen E')
    expect(speakable('F/A-18C')).toBe('F A eighteen C')
    expect(speakable('give way to the C-130')).toBe('give way to the C one thirty')
    expect(speakable('KC-135')).toBe('K C one thirty five')
    expect(speakable('twenty miles north of Osan AB')).toBe('twenty miles north of Osan')
    expect(speakable('FL250')).toBe('flight level 250')
    expect(speakable('four Mk-82, two GBU-12')).toBe('four mark eighty two, two G B U twelve')
    expect(speakable('ZSU-23, BMP-2')).toBe('Z S U twenty three, B M P two')
  })

  it('macht aus „[Rauschen]“ ein Funkloch und aus dem Pfeifton „blocked“', () => {
    const say = {
      segments: [
        { text: 'Viper 1-1', spoken: 'Viper one one' },
        { text: 'contact departure' },
        { text: '[Rauschen]' },
      ],
    }
    expect(speechParts(say)).toEqual([
      { kind: 'speech', text: 'Viper one one, contact departure' },
      { kind: 'static' },
    ])
    expect(spokenText(say)).toBe('Viper one one, contact departure')

    const blocked = [
      { segments: [{ text: '[Pfeifton und Wortfetzen]' }] },
      { segments: [{ text: 'blocked' }, { text: 'say again' }] },
      {
        you: true,
        segments: [
          { text: 'Kutaisi Tower' },
          { text: 'Viper 1-1', spoken: 'Viper one one' },
          { text: 'request taxi' },
        ],
      },
    ]
    const a = transmissionAudio(blocked, 0)
    expect(a.kind).toBe('blocked')
    if (a.kind === 'blocked') {
      expect(a.texts[0]).toBe('Kutaisi Tower, Viper one one, request taxi')
      expect(a.texts[1]).not.toBe(a.texts[0])
    }
    expect(transmissionAudio(blocked, 1)).toEqual({
      kind: 'speech',
      parts: [{ kind: 'speech', text: 'blocked, say again' }],
    })
    expect(transmissionAudio([{ skip: true, segments: [{ text: 'two' }] }], 0)).toEqual({
      kind: 'none',
    })
  })

  it('setzt Platzhalter für die Sprachausgabe in die gesprochene Form', () => {
    expect(spokenPlaceholders('{callsign}, {airfield.name} Tower, {x|text} {y|spoken}')).toBe(
      '{callsign|spoken}, {airfield.name|spoken} Tower, {x|text} {y|spoken}',
    )
  })
})

describe('Stimmen', () => {
  const VOICES = ['a', 'b', 'c', 'd']

  it('gibt jeder Station eine feste, eigene Stimme', () => {
    const cast = new VoiceCast('seed-1', VOICES)
    const tower = cast.voiceFor('Kutaisi Tower')
    const awacs = cast.voiceFor('Darkstar')
    const wing = cast.voiceFor('Viper 1-2')
    expect(new Set([tower, awacs, wing]).size).toBe(3)
    expect(cast.voiceFor('kutaisi tower')).toBe(tower)
    expect(cast.voiceFor('Viper 1 2')).toBe(wing)
    expect(cast.otherThan(tower)).not.toBe(tower)
  })

  it('besetzt pro Durchlauf neu, aber gleich bei gleichem Schlüssel', () => {
    const order = (seed: string) => {
      const c = new VoiceCast(seed, VOICES)
      return VOICES.map((_, i) => c.voiceFor(`station ${i}`)).join('')
    }
    expect(order('x')).toBe(order('x'))
    const seeds = ['1', '2', '3', '4', '5', '6'].map(order)
    expect(new Set(seeds).size).toBeGreaterThan(1)
    expect(castFor('lauf', VOICES)).toBe(castFor('lauf', VOICES))
    expect(speakerKey(' Viper  1-2 ')).toBe('viper 1 2')
  })
})
