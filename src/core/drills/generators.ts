/**
 * Generatoren für gewürfelte Übungen (type: generated in drills/*.yaml).
 */
import type { GeneratorId } from '../content/schema'
import type { ResolveEnv } from '../random/vars'
import type { Rng } from '../random/rng'
import type { ResolvedDrill } from './types'
import {
  formatAltitude,
  formatFrequency,
  formatHeading,
  formatTime,
  spellDigits,
  spokenAltimeter,
  spokenAltitude,
  spokenAngels,
  spokenCallsign,
  spokenFrequency,
  spokenFuel,
  spokenHeading,
  spokenRunway,
  writtenCallsign,
  formatMgrs,
  spokenMgrs,
  spellLetters,
  spokenWholeNumber,
} from '../phraseology/spoken'
import { isValidLaserCode, rollLaserCode, rollSquare } from '../random/cas'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type Generated = DistributiveOmit<ResolvedDrill, 'id'>

// ---------------------------------------------------------------------------
// Hilfen
// ---------------------------------------------------------------------------

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** Englische Zahlwörter wie im Alltag (das, was man im Funk NICHT sagt): 251 → "two hundred fifty-one". */
export function numberWords(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ''}`
  return `${numberWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${numberWords(n % 1000)}` : ''}`
}

/** Erzeugt plausible Falschwerte durch Ziffernverdreher. */
function mutateWritten(written: string, rng: Rng, count: number): string[] {
  const result = new Set<string>()
  const digitIdx = [...written].map((c, i) => (/\d/.test(c) ? i : -1)).filter((i) => i >= 0)
  for (let attempt = 0; attempt < 60 && result.size < count; attempt++) {
    const chars = [...written]
    const mode = rng.int(0, 1)
    if (mode === 0 && digitIdx.length > 1) {
      const k = rng.int(0, digitIdx.length - 2)
      const [a, b] = [digitIdx[k], digitIdx[k + 1]]
      ;[chars[a], chars[b]] = [chars[b], chars[a]]
    } else {
      const i = rng.pick(digitIdx)
      chars[i] = String((Number(chars[i]) + rng.int(1, 9)) % 10)
    }
    const v = chars.join('')
    if (v !== written && !(digitIdx[0] === 0 && v.startsWith('0') && !written.startsWith('0'))) result.add(v)
  }
  return [...result]
}

function choice(
  rng: Rng,
  prompt: string,
  correct: string,
  wrong: string[],
  explain: string,
  mono = true,
): Generated {
  const unique = [...new Set(wrong.filter((w) => w !== correct))].slice(0, 3)
  const options = rng.shuffle([correct, ...unique])
  return { kind: 'choice', prompt, options, correct: [options.indexOf(correct)], multi: false, explain, mono }
}

// ---------------------------------------------------------------------------
// Zahlen
// ---------------------------------------------------------------------------

/** Zahlenarten, die ohne Angabe gewürfelt werden (Modul 1). */
const BASIC_KINDS = ['heading', 'altitude', 'angels', 'uhf', 'altimeter', 'fuel', 'time', 'runway'] as const
/** Zahlenarten der Spur CAS – nur auf ausdrücklichen Wunsch (`params: { kind: lasercode }`). */
const CAS_KINDS = ['lasercode', 'elevation', 'nm', 'mgrs'] as const
export const NUMBER_KINDS = [...BASIC_KINDS, ...CAS_KINDS] as const
type NumberKind = (typeof NUMBER_KINDS)[number]

interface NumberCase {
  /** Wie die Aufgabe den Wert zeigt (deutsch), z. B. "Kurs 090°". */
  label: string
  /** Geschriebener Wert, z. B. "090". */
  written: string
  /** Richtige Funkform. */
  spoken: string
  /** Falsche, aber plausible Funkformen. */
  wrongSpoken: string[]
  /** Funkform eines geschriebenen Werts (für Falschoptionen beim Hören). */
  toSpoken: (written: string) => string
  rule: string
}

function numberCase(kind: NumberKind, rng: Rng): NumberCase {
  switch (kind) {
    case 'heading': {
      const h = rng.int(1, 35) * 10
      const w = formatHeading(h)
      return {
        label: `Kurs ${w}°`,
        written: w,
        spoken: `heading ${spokenHeading(h)}`,
        wrongSpoken: [
          `heading ${numberWords(h)}`,
          `heading ${h >= 100 ? spellDigits(w.slice(0, 2)) : spellDigits(String(h))}`,
          `heading ${spellDigits(w.split('').reverse().join(''))}`,
          `heading ${spokenHeading(h + 10)}`,
        ],
        toSpoken: (x) => `heading ${spellDigits(x)}`,
        rule: 'Kurse immer dreistellig und Ziffer für Ziffer – auch mit führender Null.',
      }
    }
    case 'altitude': {
      const ft = rng.int(2, 35) * 1000 + (rng.chance(0.4) ? 500 : 0)
      const th = Math.floor(ft / 1000)
      return {
        label: `Höhe ${formatAltitude(ft)} ft (an ATC)`,
        written: formatAltitude(ft),
        spoken: spokenAltitude(ft),
        wrongSpoken: [
          `${numberWords(th)} thousand${ft % 1000 ? ' five hundred' : ''}`,
          spellDigits(String(ft)),
          spokenAltitude(ft + 1000),
        ],
        toSpoken: (x) => spokenAltitude(Number(x.replace(/,/g, ''))),
        rule:
          'Bei ATC: Tausender Ziffer für Ziffer plus „thousand“, Hunderter als „hundred“: one five thousand five hundred. ' +
          '(Höhen von Kontakten nennt der AWACS dagegen als ganze Zahl – Modul 5.)',
      }
    }
    case 'angels': {
      const a = rng.int(10, 35)
      return {
        label: `Höhe ${a}.000 ft als Angels`,
        written: String(a),
        spoken: `angels ${spokenAngels(a)}`,
        wrongSpoken: [`angels ${spokenAngels(a)} thousand`, `angels ${numberWords(a)}`, `angels ${spokenAngels(a)} zero zero zero`],
        toSpoken: (x) => `angels ${spellDigits(x)}`,
        rule: '„Angels“ heißt schon „Tausend Fuß“ – danach nur noch die Ziffern.',
      }
    }
    case 'uhf': {
      const base = rng.int(225, 399)
      const dec = rng.pick([0, 0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8])
      const f = base + dec
      const w = formatFrequency(f)
      const decPart = w.split('.')[1]
      return {
        label: `Frequenz ${w}`,
        written: w,
        spoken: spokenFrequency(f),
        wrongSpoken: [
          `${numberWords(base)} point ${numberWords(Number(decPart))}`,
          spellDigits(w.replace('.', '')),
          `${spellDigits(String(base))} and ${spellDigits(decPart)}`,
        ],
        toSpoken: (x) => spellDigits(x),
        rule: 'Frequenzen Ziffer für Ziffer, das Komma als „point“ (ICAO: „decimal“).',
      }
    }
    case 'altimeter': {
      const inHg = rng.int(2970, 3030) / 100
      const w = inHg.toFixed(2)
      const [a, b] = w.split('.')
      return {
        label: `Höhenmesser ${w} inHg`,
        written: w,
        spoken: `altimeter ${spokenAltimeter(inHg)}`,
        wrongSpoken: [`altimeter ${numberWords(Number(a))} ${numberWords(Number(b))}`, `altimeter ${spellDigits(w)}`, `altimeter ${spellDigits(a)}`],
        toSpoken: (x) => `altimeter ${spellDigits(x.replace('.', ''))}`,
        rule: 'Den Höhenmesser (inHg) sagt man als vier Ziffern ohne „point“.',
      }
    }
    case 'fuel': {
      const x = rng.int(20, 99) / 10
      const w = x.toFixed(1)
      const [a, b] = w.split('.')
      return {
        label: `Treibstoff ${w} (Tausend Pfund) als Fuel State`,
        written: w,
        spoken: `state ${spokenFuel(x)}`,
        wrongSpoken: [`state ${numberWords(Number(a + b))}`, a !== b ? `state ${spellDigits(`${b}.${a}`)}` : `state ${spellDigits(a + b)}`, `state ${spellDigits(String(Math.round(x * 1000)))}`],
        toSpoken: (y) => `state ${spellDigits(y)}`,
        rule: 'Fuel State in Tausend Pfund mit einer Nachkommastelle: state five point eight = 5.800 lbs.',
      }
    }
    case 'time': {
      const hh = rng.int(1, 23)
      const mm = rng.int(1, 11) * 5
      const t = formatTime(hh, mm)
      return {
        label: `Uhrzeit ${t.slice(0, 2)}:${t.slice(2)} (UTC)`,
        written: t,
        spoken: `${spellDigits(t)} zulu`,
        wrongSpoken: [`${numberWords(hh)} ${numberWords(mm)} zulu`, `${spellDigits(t.slice(0, 3))} zulu`, `${spellDigits(t)} hours`],
        toSpoken: (x) => `${spellDigits(x)} zulu`,
        rule: 'Uhrzeiten vierstellig, Ziffer für Ziffer; „Zulu“ heißt UTC.',
      }
    }
    case 'runway': {
      const r = String(rng.int(1, 36)).padStart(2, '0')
      const side = rng.pick(['', '', 'L', 'R'])
      const w = r + side
      const reversed = r.split('').reverse().join('') + side
      return {
        label: `Piste ${w}`,
        written: w,
        spoken: `runway ${spokenRunway(w)}`,
        wrongSpoken: [
          `runway ${numberWords(Number(r))}${side ? ` ${side === 'L' ? 'left' : 'right'}` : ''}`,
          reversed !== w ? `runway ${spokenRunway(reversed)}` : `runway ${spellDigits(r)} zero`,
          `runway ${spellDigits(r)} zero${side ? ` ${side === 'L' ? 'left' : 'right'}` : ''}`,
        ],
        toSpoken: (x) => `runway ${spokenRunway(x)}`,
        rule: 'Pistenbezeichnungen Ziffer für Ziffer, dann left/right/center.',
      }
    }
    case 'lasercode': {
      const code = rollLaserCode(rng)
      return {
        label: `Laser-Code ${code}`,
        written: code,
        spoken: `laser ${spellDigits(code)}`,
        wrongSpoken: [`laser ${numberWords(Number(code.slice(0, 2)))} ${numberWords(Number(code.slice(2)))}`, `laser ${numberWords(Number(code))}`, `laser ${spellDigits(code.slice(0, 2))} ${numberWords(Number(code.slice(2)))}`],
        toSpoken: (x) => `laser ${spellDigits(x)}`,
        rule: 'Laser-Codes Ziffer für Ziffer: erste Ziffer 1, zweite 1–7, dritte und vierte 1–8.',
      }
    }
    case 'elevation': {
      const ft = rng.int(1, 160) * 50 + rng.pick([0, 0, 5, 10, 25])
      const w = String(ft)
      return {
        label: `Zielhöhe ${w} ft (Line 4)`,
        written: w,
        spoken: `${spellDigits(w)} feet`,
        wrongSpoken: [`${spokenWholeNumber(ft)} feet`, `${spokenAltitude(ft)} feet`, `${spellDigits(w)} meters`],
        toSpoken: (x) => `${spellDigits(x)} feet`,
        rule: 'Die Zielhöhe in Line 4 Ziffer für Ziffer und in Fuß – ein Zahlendreher landet direkt in der Waffe (⚠ Sprechform nicht aus der JP 3-09.3 belegt).',
      }
    }
    case 'nm': {
      const nm = rng.int(50, 150) / 10
      const w = nm.toFixed(1)
      const [a, b] = w.split('.')
      return {
        label: `Distanz ${w} NM (Line 3)`,
        written: w,
        spoken: spellDigits(w),
        wrongSpoken: [`${spokenWholeNumber(Number(a))} point ${spokenWholeNumber(Number(b))}`, spellDigits(w.replace('.', '')), `${spellDigits(w)} kilometers`],
        toSpoken: (x) => spellDigits(x),
        rule: 'Distanzen in NM Ziffer für Ziffer, mit „point“ vor der Nachkommastelle.',
      }
    }
    case 'mgrs': {
      const square = rollSquare(rng)
      const digits = Array.from({ length: 8 }, () => String(rng.int(0, 9))).join('')
      const w = formatMgrs(square, digits)
      return {
        label: `Koordinate ${w} (Line 6)`,
        written: w,
        spoken: spokenMgrs(square, digits),
        wrongSpoken: [
          `${square} ${spellDigits(digits)}`,
          `${spellLetters(square)} ${spokenWholeNumber(Number(digits.slice(0, 4)))}, ${spokenWholeNumber(Number(digits.slice(4)))}`,
          `${spellLetters(square[1] + square[0])} ${spellDigits(digits)}`,
        ],
        toSpoken: (x) => spokenMgrs(x.slice(0, 2), x.slice(2).replace(/\s/g, '')),
        rule: 'MGRS: das Quadrat im Buchstabieralphabet, dann jede Ziffer einzeln – ohne Pause dazwischen.',
      }
    }
  }
}

function pickKind(params: Record<string, unknown>, rng: Rng): NumberKind {
  const k = params.kind
  if (typeof k === 'string' && (NUMBER_KINDS as readonly string[]).includes(k)) return k as NumberKind
  if (Array.isArray(k)) {
    const allowed = k.filter((x): x is NumberKind => (NUMBER_KINDS as readonly string[]).includes(x as string))
    if (allowed.length) return rng.pick(allowed)
  }
  return rng.pick(BASIC_KINDS)
}

/** Ungültiger Laser-Code, der wie ein gültiger aussieht (eine 0 oder 9, zweite Ziffer 8, erste Ziffer nicht 1). */
function invalidLaserCode(rng: Rng): string {
  const c = [...rollLaserCode(rng)]
  const how = rng.int(0, 3)
  if (how === 0) c[rng.int(1, 3)] = rng.pick(['0', '9'])
  else if (how === 1) c[1] = rng.pick(['8', '9'])
  else if (how === 2) c[0] = rng.pick(['2', '3'])
  else c[rng.int(2, 3)] = '9'
  const code = c.join('')
  return isValidLaserCode(code) ? `${code.slice(0, 3)}9` : code
}

// ---------------------------------------------------------------------------
// Generatoren
// ---------------------------------------------------------------------------

/**
 * Ablenker für Alphabet-Fragen: Wörter mit demselben Anfangsbuchstaben aus älteren bzw. anderen
 * Buchstabiertafeln (Alphabet der Alliierten im Zweiten Weltkrieg, deutsche Tafel, Städte-Alphabet von 1932).
 */
const SAME_LETTER: Record<string, string[]> = {
  A: ['Able', 'Anton', 'Amsterdam'],
  B: ['Baker', 'Berta', 'Baltimore'],
  C: ['Caesar', 'Casablanca', 'Coca'],
  D: ['Dog', 'Dora', 'Denmark'],
  E: ['Easy', 'Emil', 'Edison'],
  F: ['Fox', 'Friedrich', 'Florida'],
  G: ['George', 'Gustav', 'Gallipoli'],
  H: ['How', 'Heinrich', 'Havana'],
  I: ['Item', 'Ida', 'Italia'],
  J: ['Jig', 'Julius', 'Jerusalem'],
  K: ['King', 'Kaufmann', 'Kilogramme'],
  L: ['Love', 'Ludwig', 'Liverpool'],
  M: ['Martha', 'Madagascar', 'Metro'],
  N: ['Nan', 'Nordpol', 'New York'],
  O: ['Oboe', 'Otto', 'Oslo'],
  P: ['Peter', 'Paula', 'Paris'],
  Q: ['Queen', 'Quelle', 'Quintal'],
  R: ['Roger', 'Richard', 'Roma'],
  S: ['Sugar', 'Samuel', 'Santiago'],
  T: ['Tare', 'Theodor', 'Tripoli'],
  U: ['Uncle', 'Ulrich', 'Upsala'],
  V: ['Valencia', 'Venus', 'Vienna'],
  W: ['William', 'Wilhelm', 'Washington'],
  X: ['Xanthippe', 'Xylophone', 'Xerxes'],
  Y: ['Yoke', 'Ypsilon', 'Yokohama'],
  Z: ['Zebra', 'Zacharias', 'Zurich'],
}

export function runGenerator(id: GeneratorId, params: Record<string, unknown>, env: ResolveEnv): Generated {
  const { rng, content } = env
  const letters = content.phonetic.letters

  switch (id) {
    case 'phonetic-letter-to-word': {
      const t = rng.pick(letters)
      // Ablenker mit demselben Anfangsbuchstaben – sonst verrät der Buchstabe die Antwort
      const similar = (SAME_LETTER[t.letter] ?? []).filter((w) => w.toLowerCase() !== t.word.toLowerCase())
      const wrong = similar.length >= 3 ? rng.sample(similar, 3) : rng.sample(letters.filter((l) => l !== t), 3).map((l) => l.word)
      return choice(
        rng,
        `Wie heißt **${t.letter}** im Buchstabieralphabet (ICAO/NATO)?`,
        t.word,
        wrong,
        `${t.letter} = **${t.word}** – gesprochen etwa „${t.say}“. Die anderen Wörter stammen aus älteren oder anderen Buchstabiertafeln.`,
      )
    }
    case 'phonetic-word-to-letter': {
      const t = rng.pick(letters)
      const wrong = rng.sample(letters.filter((l) => l !== t), 3).map((l) => l.letter)
      return choice(rng, `Welcher Buchstabe ist **${t.word}**?`, t.letter, wrong, `**${t.word}** steht für ${t.letter}.`)
    }
    case 'phonetic-spell': {
      const sources: { word: string; label: string }[] = [
        ...content.airfields.filter((a) => a.icao).map((a) => ({ word: a.icao!, label: `den ICAO-Code von ${a.name}` })),
        ...Object.values(content.callsigns)
          .flat()
          .filter((c) => c.length <= 6)
          .map((c) => ({ word: c.toUpperCase(), label: `das Rufzeichen ${c}` })),
      ]
      const s = rng.pick(sources)
      const words = [...s.word].map((ch) => letters.find((l) => l.letter === ch)?.word ?? ch)
      const answer = words.join(' ')
      return {
        kind: 'input',
        prompt: `Buchstabiere **${s.word}** – ${s.label}.`,
        accept: [answer],
        placeholder: 'z. B. alfa bravo …',
        hint: `${s.word.length} Wörter, mit Leerzeichen getrennt.`,
        explain: `Richtig ist: **${answer}**`,
      }
    }
    case 'number-to-spoken': {
      const c = numberCase(pickKind(params, rng), rng)
      return choice(rng, `Wie sagst du **${c.label}** im Funk?`, c.spoken, c.wrongSpoken, c.rule)
    }
    case 'spoken-to-number': {
      const c = numberCase(pickKind(params, rng), rng)
      const wrong = mutateWritten(c.written, rng, 3)
      return choice(rng, `Du hörst: „${c.spoken}“. Welcher Wert ist gemeint?`, c.written, wrong, `${c.rule} Gemeint ist **${c.written}**.`)
    }
    case 'lasercode-valid': {
      const correct = rollLaserCode(rng)
      const wrong = new Set<string>()
      while (wrong.size < 3) {
        const c = invalidLaserCode(rng)
        if (c !== correct) wrong.add(c)
      }
      return choice(
        rng,
        'Welcher Laser-Code ist **gültig**?',
        correct,
        [...wrong],
        `Gültig sind vierstellige Codes mit 1 vorn, 1–7 an zweiter und 1–8 an dritter und vierter Stelle (1111–1788). Eine 0 oder 9 gibt es nicht. **${correct}** passt.`,
      )
    }
    case 'mgrs-spoken-to-text': {
      const square = rollSquare(rng)
      const digits = Array.from({ length: 8 }, () => String(rng.int(0, 9))).join('')
      const answer = formatMgrs(square, digits)
      return {
        kind: 'input',
        prompt: `Line 6 kommt: „${spokenMgrs(square, digits)}“. Schreib die Koordinate auf.`,
        accept: [answer, `${square}${digits}`, `${spellLetters(square)} ${digits}`],
        placeholder: 'Quadrat und Ziffern',
        hint: 'Zwei Buchstaben, dann acht Ziffern.',
        explain: `Richtig ist: **${answer}** – zwei Buchstaben für das 100-km-Quadrat, dann vier Ziffern Rechtswert und vier Ziffern Hochwert (10 m genau).`,
      }
    }
    case 'flight-position': {
      const name = rng.pick(content.callsigns.fighter ?? Object.values(content.callsigns)[0])
      const flight = rng.int(1, 9)
      const pos = rng.int(1, 4)
      const roles = [
        'Flight Lead (Nummer 1)',
        'Wingman des Flight Leads (Nummer 2)',
        'Element Lead (Nummer 3)',
        'Wingman des Element Leads (Nummer 4)',
      ]
      const why = [
        'Nummer 1 führt den ganzen Flight und spricht in der Regel für ihn.',
        'Nummer 2 fliegt beim Flight Lead – im Briefing „Dash 2“ genannt.',
        'Nummer 3 führt das zweite Element (3 und 4) und ist Stellvertreter des Leads.',
        'Nummer 4 fliegt beim Element Lead.',
      ]
      return {
        kind: 'choice',
        prompt: `Im Funk meldet sich **${writtenCallsign(name, flight, pos)}** („${spokenCallsign(name, flight, pos)}“). Welche Rolle hat dieser Pilot?`,
        options: roles,
        correct: [pos - 1],
        multi: false,
        explain: `Die erste Zahl ist der Flight (${name} ${flight}), die zweite die Position darin. ${why[pos - 1]}`,
      }
    }
  }
}

/** Für Tests: alle Generatoren. */
export const ALL_GENERATORS: GeneratorId[] = [
  'phonetic-letter-to-word',
  'phonetic-word-to-letter',
  'phonetic-spell',
  'number-to-spoken',
  'spoken-to-number',
  'flight-position',
  'lasercode-valid',
  'mgrs-spoken-to-text',
]
