/**
 * Tests für den Sprach-Kern: Audio (Umrechnen, WAV, Vorlauf), Hinweise ohne Lösung, Transkript,
 * Bewertung gesprochener Funksprüche, Varianten für die Messreihe, Sprechablauf und Sprechtaste.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { scoreCall, type ScoreSegment } from './scoring/score'
import { concat, decodeWav, encodeWav, levelStats, PreRoll, resample } from './speech/pcm'
import { buildHints, DIGIT_PHRASE, estimateTokens, hasNumber, moduleOf, stationNames } from './speech/hints'
import { checkRecording, cleanTranscript } from './speech/transcript'
import { callsignPool, makeVariant, speakableCalls, spokenText } from './speech/variants'
import { initialSpeech, pttKeyAction, speechReducer, type PttKeyEvent, type SpeechEvent, type SpeechState } from './speech/flow'

const index = contentResult.index!

const sine = (freq: number, rate: number, seconds: number, amp = 1) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => amp * Math.sin((2 * Math.PI * freq * i) / rate))
const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length)
const crossings = (x: Float32Array) => x.reduce((n, v, i) => (i > 0 && Math.sign(v) !== Math.sign(x[i - 1]) ? n + 1 : n), 0)

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

describe('Audio: auf 16 kHz umrechnen', () => {
  it('48 kHz → 16 kHz behält Frequenz und Pegel', () => {
    const out = resample(sine(440, 48000, 1), 48000)
    expect(out.length).toBe(16000)
    const mid = out.subarray(1000, 15000)
    expect(rms(mid)).toBeCloseTo(Math.SQRT1_2, 1)
    expect(crossings(mid) / 2 / (mid.length / 16000)).toBeCloseTo(440, -1)
  })

  it('44,1 kHz → 16 kHz', () => {
    const out = resample(sine(1000, 44100, 0.5), 44100)
    expect(out.length).toBe(8000)
    expect(crossings(out.subarray(500, 7500)) / 2 / (7000 / 16000)).toBeCloseTo(1000, -1)
  })

  it('dämpft alles über 8 kHz statt es zurückzuspiegeln', () => {
    const out = resample(sine(11000, 48000, 0.5), 48000)
    expect(rms(out.subarray(500, 7500))).toBeLessThan(0.05)
  })

  it('gleiche Rate: Kopie', () => {
    const x = sine(100, 16000, 0.1)
    const y = resample(x, 16000)
    expect(y).toEqual(x)
    expect(y).not.toBe(x)
  })
})

describe('Audio: WAV, Pegel und Vorlauf', () => {
  it('WAV schreiben und lesen (16 Bit)', () => {
    const x = sine(300, 16000, 0.2, 0.5)
    const back = decodeWav(encodeWav(x, 16000))
    expect(back.rate).toBe(16000)
    expect(back.channels).toBe(1)
    expect(back.samples.length).toBe(x.length)
    expect(Math.max(...back.samples.map((v, i) => Math.abs(v - x[i])))).toBeLessThan(1 / 16000)
  })

  it('WAV mit zwei Kanälen in 32-Bit-Float wird gemittelt', () => {
    const frames = 4
    const bytes = new Uint8Array(44 + frames * 8)
    const v = new DataView(bytes.buffer)
    const ascii = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)))
    ascii(0, 'RIFF')
    v.setUint32(4, bytes.length - 8, true)
    ascii(8, 'WAVE')
    ascii(12, 'fmt ')
    v.setUint32(16, 16, true)
    v.setUint16(20, 3, true)
    v.setUint16(22, 2, true)
    v.setUint32(24, 48000, true)
    v.setUint32(28, 48000 * 8, true)
    v.setUint16(32, 8, true)
    v.setUint16(34, 32, true)
    ascii(36, 'data')
    v.setUint32(40, frames * 8, true)
    for (let f = 0; f < frames; f++) {
      v.setFloat32(44 + f * 8, 0.5, true)
      v.setFloat32(48 + f * 8, -0.1, true)
    }
    const w = decodeWav(bytes)
    expect(w).toMatchObject({ rate: 48000, channels: 2 })
    expect(w.samples[0]).toBeCloseTo(0.2)
  })

  it('keine WAV-Datei', () => {
    expect(() => decodeWav(new Uint8Array(20))).toThrow()
  })

  it('Pegel', () => {
    const s = levelStats(sine(200, 16000, 0.5, 0.25), 16000)
    expect(s.durationMs).toBe(500)
    expect(s.peak).toBeCloseTo(0.25, 2)
    expect(s.rms).toBeCloseTo(0.25 * Math.SQRT1_2, 2)
  })

  it('Vorlauf hält die letzten Samples in der richtigen Reihenfolge', () => {
    const p = new PreRoll(5)
    p.push(Float32Array.from([1, 2, 3]))
    p.push(Float32Array.from([4, 5, 6, 7]))
    expect([...p.drain()]).toEqual([3, 4, 5, 6, 7])
    expect(p.drain().length).toBe(0)
    p.push(Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8]))
    expect([...p.drain()]).toEqual([4, 5, 6, 7, 8])
    p.push(Float32Array.from([9]))
    expect([...concat([p.drain(), Float32Array.from([10])])]).toEqual([9, 10])
  })
})

// ---------------------------------------------------------------------------
// Hinweise
// ---------------------------------------------------------------------------

const calls = Array.from({ length: 6 }, (_, k) => speakableCalls(index, createRng(`speech-${k}`))).flat()
/** Rollen, die als Begriff oder Station im Vokabular stehen dürfen. */
const VOCAB_ROLES = new Set(['addressee', 'brevity', 'proword'])
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
/** Glossarbegriffe sind allgemeines Vokabular des Moduls – auch wenn einer davon im Funkspruch vorkommt. */
const GLOSSARY = new Set(
  [...index.brevity.flatMap((b) => [b.word, ...b.aliases]), ...index.prowords.map((p) => p.word), ...index.basics.flatMap((b) => [b.word, ...b.aliases])].map(norm),
)

describe('Hinweise für die Erkennung: nie die Lösung', () => {
  it('es gibt genug Funksprüche zum Prüfen', () => {
    expect(calls.length).toBeGreaterThan(100)
    expect(calls.filter((c) => c.moduleId).length).toBeGreaterThan(50)
  })

  it.each([false, true])('keine Zahlen und keine Segmente des erwarteten Funkspruchs (ausgeschriebene Ziffern: %s)', (spellDigits) => {
    const leaks: string[] = []
    for (const c of calls) {
      const h = buildHints(index, { moduleId: c.moduleId, stations: c.stations }, { spellDigits })
      const rest = h.prompt.replace(DIGIT_PHRASE, '')
      if (hasNumber(rest)) leaks.push(`${c.source}: Zahl im Prompt „${h.prompt}“`)
      if (spellDigits !== h.prompt.includes(DIGIT_PHRASE)) leaks.push(`${c.source}: Ziffernreihe falsch`)
      if (estimateTokens(h.prompt) > 180) leaks.push(`${c.source}: Prompt zu lang (${estimateTokens(h.prompt)})`)
      const vocab = h.vocabulary.map(norm)
      const stations = stationNames(c.stations).map(norm)
      for (const s of c.segments) {
        const text = norm(s.text)
        // Erlaubt: Glossarbegriffe und was im Namen einer Station steckt („Al Dhafra“ in „Al Dhafra Traffic“)
        if (VOCAB_ROLES.has(s.role) || GLOSSARY.has(text) || !text.includes(' ') || stations.some((st) => ` ${st} `.includes(` ${text} `))) continue
        if (vocab.some((v) => ` ${v} `.includes(` ${text} `))) leaks.push(`${c.source}: Segment „${s.text}“ im Vokabular`)
      }
    }
    expect(leaks.slice(0, 8), `${leaks.length} Verstöße`).toEqual([])
    // Läuft über alle Funksprüche und braucht allein rund 3 s; bei Last wären die Standard-5 s zu knapp.
  }, 30_000)

  it('die Hinweise hängen nur von Modul und Stationen ab', () => {
    // buildHints bekommt den Funkspruch gar nicht – gleicher Kontext, gleicher Prompt
    const c = calls.find((x) => x.moduleId === 'm3' && stationNames(x.stations).length > 0)!
    const a = buildHints(index, { moduleId: 'm3', stations: c.stations })
    const b = buildHints(index, { moduleId: 'm3', stations: [...c.stations] })
    expect(a).toEqual(b)
    expect(a.prompt).toMatch(/\.$/)
    // Begriffe des Moduls stehen drin, Stationen zuerst (am Ende ließe Whisper sie weg)
    expect(a.vocabulary.length).toBeGreaterThan(5)
    expect(a.prompt.startsWith(`${stationNames(c.stations).join(', ')}.`)).toBe(true)
  })

  it('Modul eines Funkspruchs und Stationsnamen ohne Zahlen', () => {
    expect(moduleOf(index, { exchangeId: 'm3-ready-departure' })).toBe('m3')
    expect(moduleOf(index, { exchangeId: 'gibt-es-nicht' })).toBeUndefined()
    expect(stationNames(['Viper 1-1', 'Batumi Ground', 'Viper 1-2', 'Darkstar', 'Uzi two one'])).toEqual(['Viper', 'Batumi Ground', 'Darkstar', 'Uzi'])
  })

  it('ohne Modul: allgemeines Vokabular', () => {
    const h = buildHints(index)
    expect(h.vocabulary).toContain('roger')
    expect(hasNumber(h.prompt)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Transkript
// ---------------------------------------------------------------------------

describe('Transkript aufbereiten', () => {
  it.each([
    ['[BLANK_AUDIO]', ''],
    [' Thank you.', ''],
    ['(wind blowing)', ''],
    ['...', ''],
    [' you', ''],
  ])('Füllsel bei Stille: „%s“', (raw) => {
    expect(cleanTranscript(raw)).toMatchObject({ text: '', discarded: 'empty' })
  })

  it.each([
    [' Darkstar, Viper 1-1, bogey dope.', 'Darkstar, Viper 1-1, bogey dope.'],
    ['Group bull\'s eye 090, 25', 'Group bullseye 090, 25'],
    ['(static) Viper one one, angles two five', 'Viper one one, angels two five'],
    ['Hog one one, wilko', 'hawg one one, wilco'],
    // echte Transkripte aus dem Probelauf (whisper base.en)
    ['Chevy, push, a wax.', 'Chevy, push, AWACS.'],
    ['Chevy, push, awax.', 'Chevy, push, AWACS.'],
    ['Thank you. Viper one one, ready', 'Thank you. Viper one one, ready'],
  ])('„%s“', (raw, text) => {
    expect(cleanTranscript(raw).text).toBe(text)
  })

  it.each([
    // echte Transkripte aus der Messreihe (whisper.cpp small.en / base.en)
    ['runway 06R via Foxtrot', 'runway 06 right via Foxtrot'],
    ['runway 31L, right on Bravo', 'runway 31 left, right on Bravo'],
    ['Darkstar. Raven61. Checking in.', 'Darkstar. Raven 61. Checking in.'],
    ['Darkstar 4.7.1 chain in Angels 2.3', 'Darkstar 4 7 1 chain in Angels 2.3'],
    ['Focus, Chevy II, pushing.', 'Focus, Chevy two, pushing.'],
    ['Ghost 81 passing 3000 for 6000.', 'Ghost 81 passing 3 thousand for 6 thousand.'],
    ['angels 25,000', 'angels 25 thousand'],
    ['passing one niner thousand, 3,500', 'passing one niner thousand, 3 thousand 5 hundred'],
    ['Departure 255.0, Colt 31.', 'Departure 255.0, Colt 31.'],
  ])('Zahlen in Whisper-Schreibweise: „%s“', (raw, text) => {
    expect(cleanTranscript(raw).text).toBe(text)
  })

  it('zu kurz oder zu leise wird gar nicht erst erkannt', () => {
    expect(checkRecording({ durationMs: 300, peak: 0.5, rms: 0.1 })).toBe('too-short')
    expect(checkRecording({ durationMs: 2000, peak: 0.005, rms: 0.001 })).toBe('too-quiet')
    expect(checkRecording({ durationMs: 2000, peak: 0.4, rms: 0.05 })).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Bewertung gesprochener Funksprüche
// ---------------------------------------------------------------------------

const seg = (text: string, role = 'info', extra: Partial<ScoreSegment> = {}): ScoreSegment => ({ text, role, ...extra })
const spoken = (input: string, segs: ScoreSegment[]) => scoreCall(input, segs, undefined, { source: 'spoken' })

describe('Bewertung: gesprochen', () => {
  const checkIn = [seg('Darkstar', 'addressee'), seg('Viper one one', 'callsign', { critical: true }), seg('checking in', 'request')]

  it('getrennt oder zusammen geschrieben gilt gleich', () => {
    expect(spoken('Dark Star Viper 11 checking in', checkIn).correct).toBe(true)
    expect(scoreCall('Dark Star Viper 11 checking in', checkIn).correct).toBe(false)
    expect(spoken('Viper 11 standby', [seg('Viper one one', 'callsign'), seg('stand by', 'proword')]).correct).toBe(true)
  })

  it('Verzögerungslaute zählen nicht als überflüssig, „roger“ schon', () => {
    const r = spoken('uh Darkstar um Viper 1-1 checking in', checkIn)
    expect(r.correct).toBe(true)
    expect(r.fillers).toEqual([])
    expect(spoken('Darkstar Viper 1-1 checking in roger', checkIn).fillers).toEqual(['roger'])
  })

  it('Abweichungen heißen „erkannt als“, Brevity bleibt streng', () => {
    const call = [seg('Viper one one', 'callsign'), seg('requesting taxi', 'request')]
    expect(spoken('Viper 11 requestng taxi', call).issues.join(' ')).toMatch(/Erkannt als „requestng“/)
    expect(spoken('group bullseye 090 25 locked', [seg('group', 'brevity'), seg('bullseye', 'brevity'), seg('zero niner zero', 'value'), seg('two five', 'value'), seg('blocked', 'brevity')]).correct).toBe(false)
  })

  it('ordnet jedes erkannte Wort einem Segment zu (oder keinem)', () => {
    // echtes Transkript aus dem Probelauf (transformers.js, whisper-base.en)
    const call = [seg('Kobuleti Ground', 'addressee'), seg('Ghost eight one', 'callsign'), seg('information Victor', 'info'), seg('request startup', 'request')]
    const r = spoken('CoVility Ground, Ghost 8-1, Information Victor, Requests start up.', call)
    expect(r.correct).toBe(false)
    expect(r.heard.map((w) => `${w.text}:${w.slot ?? '-'}`)).toEqual(['covility:0', 'ground:0', 'ghost:1', '81:1', 'information:2', 'victor:2', 'requests:3', 'startup:3'])
    expect(r.slots[0]).toMatchObject({ status: 'wrong', near: true })
    const extra = spoken('Kobuleti Ground Ghost 81 information Victor request startup please', call)
    expect(extra.heard.at(-1)).toEqual({ text: 'please', slot: undefined })
  })

  // echte Transkripte aus der Messreihe, so wie sie aus cleanTranscript kommen
  const heard = (raw: string, segs: ScoreSegment[]) => spoken(cleanTranscript(raw).text, segs)

  it('Kommas der Erkennung trennen keine Zahlen', () => {
    const taxi = [seg('runway three one right', 'value'), seg('right on Bravo', 'instruction'), seg('Viper niner one', 'callsign')]
    expect(heard('Runway, three, one, right, right on bravo, viper, niner, one.', taxi).correct).toBe(true)
    expect(heard('runway 31R, right on Bravo, Viper 91', taxi).correct).toBe(true)
    expect(heard('Runway, three, one, right, right on bravo, viper, niner, two.', taxi).correct).toBe(false)
    const fuel = [seg('Two', 'callsign'), seg('four point eight', 'value', { alt: ['4.8'] }), seg('tiger', 'brevity')]
    expect(heard('Two, four point eight, tiger.', fuel).correct).toBe(true)
    expect(heard('Two, four point five, tiger.', fuel).correct).toBe(false)
  })

  it('„for“, „to“ neben Zahlen zählen als Ziffer – aber nur, wenn die erwartete Zahl herauskommt', () => {
    const dope = [seg('Overlord', 'addressee'), seg('Rage four one', 'callsign'), seg('bogey dope', 'brevity')]
    expect(heard('Overlord, rage for one boogie dope.', dope).correct).toBe(true)
    expect(heard('Overlord, rage for two, boogie dope.', dope).correct).toBe(false)
    const fuel = [seg('Two', 'callsign'), seg('four point eight', 'value', { alt: ['4.8'] }), seg('tiger', 'brevity')]
    expect(heard('Two for point eight, tiger.', fuel).correct).toBe(true)
    // „for“ als echtes Wort bleibt eins, Tausender laufen nicht zusammen
    const climb = [seg('Senaki-Kolkhi Departure', 'addressee'), seg('Ghost eight one', 'callsign'), seg('passing three thousand', 'value'), seg('for six thousand', 'value')]
    expect(heard('Senaki Kolkhi Departure Ghost 8-1 passing 3000 for 6000', climb).correct).toBe(true)
    expect(heard('Senaki Kolkhi Departure Ghost 8-1 passing 3000 for 7000', climb).correct).toBe(false)
    const taxi = [seg('Chevy two', 'callsign'), seg('taxi to runway zero six', 'instruction')]
    expect(heard('Chevy 2, taxi to runway 06', taxi).correct).toBe(true)
  })

  it('„niner“ als „90“ oder „9 R“, „nine a thousand“ – nur wenn die erwartete Zahl herauskommt', () => {
    const pic = [seg('Darkstar', 'addressee'), seg('Ghost niner one', 'callsign'), seg('picture', 'brevity')]
    expect(heard('Darkstar Ghost 901 picture.', pic).correct).toBe(true)
    expect(heard('Darkstar Ghost 902 picture.', pic).correct).toBe(false)
    const taxi = [seg('runway three one right', 'value'), seg('right on Bravo', 'instruction'), seg('Viper niner one', 'callsign')]
    expect(heard('runway 31R, right on Bravo, Viper 9R1.', taxi).correct).toBe(true)
    const lineUp = [seg('runway zero niner', 'value'), seg('line up and wait', 'instruction'), seg('Springfield six one', 'callsign')]
    expect(heard('runway 090, line up and wait, Springfield 61.', lineUp).correct).toBe(true)
    const mayday = [seg('Ghost five one', 'callsign'), seg('passing one niner thousand', 'value')]
    expect(heard('ghost, five-one, passing one, nine, a thousand.', mayday).correct).toBe(true)
    expect(heard('ghost, five-one, passing one, eight, a thousand.', mayday).correct).toBe(false)
  })

  it('weitere Verhörer bei Zahlen: Ford wie „four“, „forward“, „for 0.8“, „a point“', () => {
    const checkIn = [seg('Darkstar', 'addressee'), seg('Ford seven one', 'callsign'), seg('checking in', 'intent'), seg('angels two three', 'value')]
    expect(heard('darkstar, 471, checking in, angels 23.', checkIn).correct).toBe(true)
    expect(heard('darkstar, 472, checking in, angels 23.', checkIn).correct).toBe(false)
    const hold = [seg('holding position', 'readback'), seg('Raven four one', 'callsign')]
    expect(heard('holding, position, raven, forward.', hold).correct).toBe(true)
    const fuel = [seg('Two', 'callsign'), seg('four point eight', 'value', { alt: ['4.8'] }), seg('tiger', 'brevity')]
    expect(heard('2 for 0.8, tiger.', fuel).correct).toBe(true)
    expect(heard('2 for 0.5, tiger.', fuel).correct).toBe(false)
    const freq = [seg('departure three six niner point two five', 'value'), seg('Rage two one', 'callsign')]
    expect(heard('departure, three, six, nine, a point, two, five, rage, two, one,', freq).correct).toBe(true)
    expect(heard('departure, three, six, nine, a point, two, six, rage, two, one,', freq).correct).toBe(false)
  })

  it('Rufzeichen mit Punkt („Enfield 1.1“) – die Erkennung setzt den Punkt, gesprochen wurde „one one“', () => {
    const startup = [seg('Batumi Ground', 'addressee'), seg('Enfield one one', 'callsign'), seg('request startup', 'request')]
    expect(heard('Batumi Ground, Enfield 1.1, request startup.', startup).correct).toBe(true)
    expect(heard('Batumi Ground, Enfield 1.1. Request startup.', startup).correct).toBe(true)
    expect(heard('Batumi Ground, Enfield 1.2, request startup.', startup).correct).toBe(false)
    // Mit Frequenz: die echte Dezimalzahl bleibt eine, der Punkt im Rufzeichen trennt
    const tune = [seg('Enfield one one', 'callsign'), seg('switching to two six one point eight', 'value')]
    expect(heard('Enfield 1.1, switching to 261.8.', tune).correct).toBe(true)
    expect(heard('Enfield 1.1, switching to 261.9.', tune).correct).toBe(false)
    // Getippt bleibt „1.1“ eine Dezimalzahl
    expect(scoreCall('Batumi Ground, Enfield 1.1, request startup', startup).correct).toBe(false)
  })

  it('„of“ darf fehlen, Buchstabierwörter dürfen etwas daneben liegen', () => {
    const taxi = [seg('Chevy five one', 'callsign'), seg('flight of four', 'info'), seg('information Golf', 'info')]
    expect(heard('Chevy 5-1, flight 04, information gulf', taxi).correct).toBe(true)
    expect(heard('Chevy 5-1, flight 02, information gulf', taxi).correct).toBe(false)
    expect(scoreCall('Chevy 5-1, flight 04, information gulf', taxi).correct).toBe(false)
  })

  it('Namen dürfen beim Sprechen etwas daneben liegen, Brevity und fremde Rufzeichen nicht', () => {
    const call = [seg('Colt one one', 'callsign'), seg('ready', 'brevity')]
    expect(heard('cold 1-1, ready', call).correct).toBe(true)
    expect(scoreCall('cold 1-1, ready', call).correct).toBe(false)
    expect(heard('Cobra 1-1, ready', call).correct).toBe(false)
    expect(heard('Colt 1-1, steady', call).correct).toBe(false)
    expect(heard('Magic, range 6-1, angels 2-1', [seg('Magic', 'addressee'), seg('Rage six one', 'callsign'), seg('angels two one', 'value')]).correct).toBe(true)
    // ein verschluckter Teil ist kein Verhörer
    expect(heard('hold short of runway 07, and field 7 1', [seg('hold short of runway zero seven', 'instruction'), seg('Enfield seven one', 'callsign')]).correct).toBe(false)
  })

  it('Artikel dürfen beim Sprechen fehlen', () => {
    const call = [seg('Ghost five one', 'callsign'), seg('diverting to the nearest airfield', 'intent')]
    expect(heard('Ghost 5-1, diverting to nearest airfield', call).correct).toBe(true)
    expect(scoreCall('Ghost 5-1, diverting to nearest airfield', call).correct).toBe(false)
  })

  it('Round-Trip: jede Musterlösung, gesprochen ohne Kommas, ist richtig', () => {
    const failed = calls
      .map((c) => ({ c, r: spoken(c.segments.map((s) => s.text).join(' '), c.segments) }))
      .filter(({ r }) => !r.correct)
      .map(({ c, r }) => `${c.source}: ${r.issues.join(' | ')}`)
    expect(failed.slice(0, 8), `${failed.length} von ${calls.length}`).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Varianten für die Messreihe
// ---------------------------------------------------------------------------

describe('Varianten für die Messreihe', () => {
  const pool = callsignPool(index)
  const rng = createRng('varianten')

  it('richtige Varianten werden angenommen, falsche abgelehnt – mit und ohne Kommas', () => {
    const bad: string[] = []
    let wrongNumber = 0
    let wrongCallsign = 0
    for (const c of calls) {
      const ok = makeVariant(c.segments, 'correct', rng, pool)!
      if (!scoreCall(ok.text, c.segments).correct) bad.push(`${c.source}: richtige Variante abgelehnt`)
      for (const kind of ['wrong-number', 'wrong-callsign'] as const) {
        const v = makeVariant(c.segments, kind, rng, pool)
        if (!v) continue
        if (kind === 'wrong-number') wrongNumber++
        else wrongCallsign++
        expect(v.shouldAccept).toBe(false)
        expect(v.text).not.toBe(spokenText(c.segments))
        if (scoreCall(v.text, c.segments).correct || spoken(v.text.replace(/,/g, ''), c.segments).correct) bad.push(`${c.source}: „${v.text}“ angenommen`)
        if (kind === 'wrong-callsign') expect(c.segments[v.change!.segment].role).toBe('callsign')
      }
    }
    expect(bad.slice(0, 8)).toEqual([])
    expect(wrongNumber).toBeGreaterThan(calls.length / 3)
    expect(wrongCallsign).toBeGreaterThan(calls.length / 3)
  })

  it('Stille: nichts zu sagen', () => {
    expect(makeVariant(calls[0].segments, 'silence', rng)).toEqual({ kind: 'silence', text: '', shouldAccept: false })
  })

  it('ohne passendes Segment gibt es keine Variante', () => {
    expect(makeVariant([seg('Darkstar', 'addressee'), seg('picture', 'brevity')], 'wrong-number', rng)).toBeNull()
    expect(makeVariant([seg('Darkstar', 'addressee'), seg('picture', 'brevity')], 'wrong-callsign', rng)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Sprechablauf und Sprechtaste
// ---------------------------------------------------------------------------

const run = (events: SpeechEvent[], from: SpeechState = initialSpeech) => events.reduce(speechReducer, from)
const loud = { type: 'recorded', stats: { durationMs: 1800, peak: 0.4, rms: 0.08 } } as const

describe('Sprechablauf', () => {
  it('bereit → sendet → erkennt → erkannt → gewertet', () => {
    let s = run([{ type: 'press', at: 1000 }])
    expect(s.phase).toBe('sending')
    s = run([{ type: 'release', at: 2800 }], s)
    expect(s).toMatchObject({ phase: 'recognizing', heldMs: 1800 })
    s = run([loud, { type: 'recognized', raw: ' Darkstar, Viper 1-1, checking in.' }], s)
    expect(s.phase).toBe('review')
    expect(s.transcript?.text).toBe('Darkstar, Viper 1-1, checking in.')
    expect(run([{ type: 'accept' }], s).phase).toBe('done')
  })

  it('zu kurz: verworfen, erneutes Drücken startet neu', () => {
    const s = run([{ type: 'press', at: 0 }, { type: 'release', at: 200 }, { type: 'recorded', stats: { durationMs: 500 - 300, peak: 0.3, rms: 0.05 } }])
    expect(s).toMatchObject({ phase: 'discarded', discard: 'too-short' })
    expect(run([{ type: 'press', at: 900 }], s).phase).toBe('sending')
    expect(run([{ type: 'again' }], s).phase).toBe('ready')
  })

  it('Stille erkannt: verworfen', () => {
    const s = run([{ type: 'press', at: 0 }, { type: 'release', at: 1500 }, loud, { type: 'recognized', raw: '[BLANK_AUDIO]' }])
    expect(s).toMatchObject({ phase: 'discarded', discard: 'empty' })
  })

  it('„Nicht richtig erkannt?“ zählt als Verwurf – auch erneutes Drücken', () => {
    const review = run([{ type: 'press', at: 0 }, { type: 'release', at: 1500 }, loud, { type: 'recognized', raw: 'Viper one one' }])
    expect(run([{ type: 'reject' }], review)).toEqual({ phase: 'ready', rejected: 1 })
    expect(run([{ type: 'press', at: 5000 }], review)).toMatchObject({ phase: 'sending', rejected: 1 })
  })

  it('Ereignisse zur falschen Zeit ändern nichts', () => {
    expect(run([{ type: 'release', at: 5 }])).toBe(initialSpeech)
    expect(run([{ type: 'accept' }, { type: 'reject' }, { type: 'recognized', raw: 'x' }])).toBe(initialSpeech)
    const sending = run([{ type: 'press', at: 0 }])
    expect(run([{ type: 'press', at: 10 }], sending)).toBe(sending)
    expect(run([{ type: 'failed', error: 'Mikrofon weg' }], sending)).toMatchObject({ phase: 'error', error: 'Mikrofon weg' })
  })
})

describe('Sprechtaste', () => {
  const key = (type: 'keydown' | 'keyup', extra: Partial<PttKeyEvent> = {}): PttKeyEvent => ({ type, code: 'Space', repeat: false, inTextField: false, ...extra })

  it('halten: drücken sendet, loslassen beendet, Wiederholung wird geschluckt', () => {
    expect(pttKeyAction(key('keydown'), 'Space', 'hold', false)).toBe('press')
    expect(pttKeyAction(key('keydown', { repeat: true }), 'Space', 'hold', true)).toBe('swallow')
    expect(pttKeyAction(key('keyup'), 'Space', 'hold', true)).toBe('release')
    // keyup ohne Sendung: trotzdem schlucken, sonst löst die Leertaste einen fokussierten Knopf aus
    expect(pttKeyAction(key('keyup'), 'Space', 'hold', false)).toBe('swallow')
  })

  it('umschalten: erster Druck sendet, zweiter beendet', () => {
    expect(pttKeyAction(key('keydown'), 'Space', 'toggle', false)).toBe('press')
    expect(pttKeyAction(key('keyup'), 'Space', 'toggle', true)).toBe('swallow')
    expect(pttKeyAction(key('keydown'), 'Space', 'toggle', true)).toBe('release')
  })

  it('andere Tasten, Textfelder und Tastenkürzel bleiben unberührt', () => {
    expect(pttKeyAction(key('keydown', { code: 'KeyA' }), 'Space', 'hold', false)).toBe('pass')
    expect(pttKeyAction(key('keydown', { inTextField: true }), 'Space', 'hold', false)).toBe('pass')
    expect(pttKeyAction(key('keydown', { ctrlKey: true }), 'Space', 'hold', false)).toBe('pass')
    // Läuft die Sendung schon, beendet das Loslassen sie auch im Textfeld
    expect(pttKeyAction(key('keyup', { inTextField: true }), 'Space', 'hold', true)).toBe('release')
  })

  it('eine Modifikatortaste als Sprechtaste', () => {
    expect(pttKeyAction(key('keydown', { code: 'ControlRight', ctrlKey: true }), 'ControlRight', 'hold', false)).toBe('press')
  })
})
