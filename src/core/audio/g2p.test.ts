import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  KOKORO_VOCAB,
  phonemize,
  speakDigits,
  splitPhonemes,
  tokenIds,
  tokenize,
  wordPhonemes,
  type Lookup,
} from './g2p'
import { asrDir } from '../../../scripts/local-dirs'

const LEX: Record<string, string> = {
  viper: 'vˈIpəɹ',
  one: 'wˈʌn',
  two: 'tˈu',
  five: 'fˈIv',
  clear: 'klˈɪɹ',
  group: 'ɡɹˈup',
  push: 'pˈʊʃ',
  dark: 'dˈɑɹk',
  star: 'stˈɑɹ',
  box: 'bˈɑks',
  want: 'wˈɑnt',
  stop: 'stˈɑp',
  close: 'klˈOz',
  tower: 'tˈWəɹ',
  Kutaisi: 'kˌutɑˈisi',
  runway: 'ɹˈʌnwˌA',
  point: 'pˈYnt',
  zero: 'zˈɪɹO',
}
const lookup: Lookup = (w) => LEX[w]

describe('Aussprache (G2P)', () => {
  it('spricht Ziffern, die noch im Text stehen', () => {
    expect(speakDigits('Viper 1-1')).toBe('Viper one one')
    expect(speakDigits('260.0')).toBe('two six zero point zero')
  })

  it('zerlegt Text in Wörter und Satzzeichen', () => {
    expect(tokenize('Viper one-one, Kutaisi Tower.')).toEqual([
      'Viper',
      'one',
      'one',
      ',',
      'Kutaisi',
      'Tower',
      '.',
    ])
    expect(tokenize('„Senaki-Kolkhi“ (ATIS)')).toEqual(['Senaki', 'Kolkhi', 'ATIS'])
  })

  it('findet Wörter in jeder Schreibweise und bildet Wortformen', () => {
    expect(wordPhonemes('VIPER', lookup, 'us').phonemes).toBe('vˈIpəɹ')
    expect(wordPhonemes('cleared', lookup, 'us')).toEqual({
      word: 'cleared',
      phonemes: 'klˈɪɹd',
      via: 'morph',
    })
    expect(wordPhonemes('groups', lookup, 'us').phonemes).toBe('ɡɹˈups')
    expect(wordPhonemes('stars', lookup, 'us').phonemes).toBe('stˈɑɹz')
    expect(wordPhonemes('boxes', lookup, 'us').phonemes).toBe('bˈɑksᵻz')
    expect(wordPhonemes('pushing', lookup, 'us').phonemes).toBe('pˈʊʃɪŋ')
    expect(wordPhonemes('wanted', lookup, 'us').phonemes).toBe('wˈɑntᵻd')
    expect(wordPhonemes('wanted', lookup, 'gb').phonemes).toBe('wˈɑntɪd')
    expect(wordPhonemes('stopped', lookup, 'us').phonemes).toBe('stˈɑpt')
    expect(wordPhonemes('closing', lookup, 'us').phonemes).toBe('klˈOzɪŋ')
  })

  it('setzt zusammengesetzte Namen zusammen und buchstabiert Unbekanntes', () => {
    expect(wordPhonemes('Darkstar', lookup, 'us')).toEqual({
      word: 'Darkstar',
      phonemes: 'dˈɑɹkstˌɑɹ',
      via: 'compound',
    })
    expect(wordPhonemes('IP', lookup, 'us')).toEqual({
      word: 'IP',
      phonemes: 'ˈI pˈi',
      via: 'spelled',
    })
    expect(wordPhonemes('Z', lookup, 'gb').phonemes).toBe('zˈɛd')
  })

  it('hängt Satzzeichen ohne Leerzeichen an', () => {
    expect(phonemize('Viper 1-1, Kutaisi Tower, runway 25.', lookup, 'us')).toBe(
      'vˈIpəɹ wˈʌn wˈʌn, kˌutɑˈisi tˈWəɹ, ɹˈʌnwˌA tˈu fˈIv.',
    )
  })

  it('macht Token-IDs mit Rand und teilt lange Texte an Satzzeichen', () => {
    expect(tokenIds('ab,')).toEqual([0, 43, 44, 3, 0])
    const long = Array.from({ length: 40 }, () => 'wˈʌn tˈu θɹˈi,').join(' ')
    const parts = splitPhonemes(long, 120)
    expect(parts.length).toBeGreaterThan(3)
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(120)
    expect(parts.join(' ')).toBe(long)
  })

  // Nur, wenn das Vokabular lokal liegt (npm run fetch-asr -- tts)
  const tokenizer = join(asrDir(), 'tts', 'kokoro-tokenizer.json')
  it.skipIf(!existsSync(tokenizer))('stimmt mit dem Vokabular des Modells überein', () => {
    const vocab = (
      JSON.parse(readFileSync(tokenizer, 'utf8')) as { model: { vocab: Record<string, number> } }
    ).model.vocab
    const { $: pad, ...rest } = vocab
    expect(pad).toBe(0)
    expect(KOKORO_VOCAB).toEqual(rest)
  })
})
