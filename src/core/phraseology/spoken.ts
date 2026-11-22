/**
 * Zahlen in Funksprache (englisch, US-Militärpraxis: "niner", sonst normale Ziffernwörter).
 * Die ICAO-Varianten (tree, fife, fower …) erkennt der Normalisierer trotzdem.
 */

export const DIGIT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'niner'] as const

/** Jede Ziffer einzeln, "." wird zu "point": "260.0" → "two six zero point zero". */
export function spellDigits(text: string): string {
  return [...text]
    .filter((c) => /[0-9.]/.test(c))
    .map((c) => (c === '.' ? 'point' : DIGIT_WORDS[Number(c)]))
    .join(' ')
}

export function formatHeading(deg: number): string {
  const d = ((Math.round(deg) % 360) + 360) % 360 || 360
  return String(d).padStart(3, '0')
}

/** Kurs immer dreistellig: 90 → "zero niner zero". */
export function spokenHeading(deg: number): string {
  return spellDigits(formatHeading(deg))
}

export function formatAltitude(ft: number): string {
  return ft.toLocaleString('en-US')
}

/** Höhe: Tausender Ziffer für Ziffer + "thousand", Hunderter als "hundred": 15500 → "one five thousand five hundred". */
export function spokenAltitude(ft: number): string {
  const thousands = Math.floor(ft / 1000)
  const hundreds = Math.round((ft % 1000) / 100)
  const parts: string[] = []
  if (thousands > 0) parts.push(`${spellDigits(String(thousands))} thousand`)
  if (hundreds > 0) parts.push(`${DIGIT_WORDS[hundreds]} hundred`)
  return parts.join(' ') || 'zero'
}

/**
 * Höhe eines Kontakts, wie AWACS und GCI sie sprechen (ATP 3-52.4): auf Tausend gerundet, als ganzes
 * Zahlwort – 25000 → "twenty-five thousand". Die ziffernweise Form ("two five thousand") ist gleichwertig
 * und wird beim Prüfen akzeptiert.
 */
export function spokenContactAltitude(ft: number): string {
  return `${spokenWholeNumber(Math.round(ft / 1000))} thousand`
}

/** Angels = Tausend Fuß: 25 → "two five". */
export function spokenAngels(thousands: number): string {
  return spellDigits(String(thousands))
}

/**
 * Höhe in Tausend Fuß mit Hunderterstelle, wie im blind-Ruf (AFMAN 11-2F-16 V3, Abs. 3.12.2.1):
 * 16.9 → "16.9" / "one six point niner".
 */
export function formatThousands(thousands: number): string {
  return thousands.toFixed(1)
}

export function spokenThousands(thousands: number): string {
  return spellDigits(formatThousands(thousands))
}

/** Frequenz mit mindestens einer Nachkommastelle: 260 → "260.0", 251.25 → "251.25". */
export function formatFrequency(mhz: number): string {
  const fixed = mhz.toFixed(3).replace(/0+$/, '')
  return fixed.endsWith('.') ? `${fixed}0` : fixed
}

export function spokenFrequency(mhz: number): string {
  return spellDigits(formatFrequency(mhz))
}

/** Höhenmesser in inHg ohne Punkt: 29.92 → "two niner niner two". */
export function spokenAltimeter(inHg: number): string {
  return spellDigits(inHg.toFixed(2).replace('.', ''))
}

/** Fuel State in Tausend Pfund: 5.8 → "five point eight". */
export function spokenFuel(thousandsLbs: number): string {
  return spellDigits(thousandsLbs.toFixed(1))
}

export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`
}

/** Bahnbezeichnung: "03L" → "zero three left". */
export function spokenRunway(runway: string): string {
  const m = /^(\d{1,2})([LRC]?)$/.exec(runway)
  if (!m) return runway
  const side = { L: ' left', R: ' right', C: ' center', '': '' }[m[2] as 'L' | 'R' | 'C' | '']
  return `${spellDigits(m[1].padStart(2, '0'))}${side}`
}

/** Taktisches Rufzeichen: ("Viper", 1, 2) → "Viper one two". */
export function spokenCallsign(name: string, flight: number, position?: number): string {
  return position === undefined
    ? `${name} ${spellDigits(String(flight))}`
    : `${name} ${spellDigits(String(flight))} ${spellDigits(String(position))}`
}

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/**
 * Ganze Zahl als Wort, wie AWACS Entfernungen spricht: 60 → "sixty", 25 → "twenty-five".
 * Eine einzelne 9 heißt wie überall im Funk „niner“ (9 → "niner", 9000 → "niner thousand", 109 → "one hundred niner");
 * in zusammengesetzten Zahlwörtern bleibt die Alltagsform („twenty-nine“, „nineteen“, „ninety“).
 */
export function spokenWholeNumber(n: number): string {
  const v = Math.round(n)
  if (v === 9) return 'niner'
  if (v < 20) return ONES[v]
  if (v < 100) return TENS[Math.floor(v / 10)] + (v % 10 ? `-${ONES[v % 10]}` : '')
  if (v < 1000) {
    const hundreds = Math.floor(v / 100)
    return `${hundreds === 9 ? 'niner' : ONES[hundreds]} hundred${v % 100 ? ` ${spokenWholeNumber(v % 100)}` : ''}`
  }
  return `${spokenWholeNumber(Math.floor(v / 1000))} thousand${v % 1000 ? ` ${spokenWholeNumber(v % 1000)}` : ''}`
}

export const CARDINAL8 = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] as const
const CARDINAL4 = ['north', 'east', 'south', 'west']

/** Himmelsrichtung eines Kurses: 8 Richtungen (Track) oder 4 (Flank/Beam). */
export function cardinal(deg: number, points: 4 | 8 = 8): string {
  const list = points === 8 ? CARDINAL8 : CARDINAL4
  const sector = 360 / points
  return list[Math.round((((deg % 360) + 360) % 360) / sector) % points]
}

/** Kurs (0–315) zu einer Himmelsrichtung der 8er-Rose, z. B. "southwest" → 225. */
export function cardinalDeg(name: string): number | undefined {
  const i = CARDINAL8.indexOf(name as (typeof CARDINAL8)[number])
  return i >= 0 ? i * 45 : undefined
}

/** ICAO/NATO-Buchstabierwörter in der Schreibweise von content/glossary/phonetic.yaml. */
export const PHONETIC_WORDS = [
  'Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike',
  'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu',
] as const

/** Buchstaben einzeln im Alphabet: "NK" → "November Kilo". */
export function spellLetters(letters: string): string {
  return [...letters.toUpperCase()]
    .filter((c) => /[A-Z]/.test(c))
    .map((c) => PHONETIC_WORDS[c.charCodeAt(0) - 65])
    .join(' ')
}

/**
 * MGRS-Koordinate (ohne Zonenfeld), wie sie im 9-Line steht: "NK 1234 5678" (8 Stellen = 10 m genau),
 * gesprochen Buchstaben im Alphabet und Ziffern einzeln: "November Kilo one two three four five six seven eight".
 */
export function formatMgrs(square: string, digits: string): string {
  const half = digits.length / 2
  return `${square} ${digits.slice(0, half)} ${digits.slice(half)}`
}

export function spokenMgrs(square: string, digits: string): string {
  return `${spellLetters(square)} ${spellDigits(digits)}`
}

const POSITION_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']

/** Position im Flight als Wort: 2 → "Two". */
export function positionWord(pos: number): string {
  return POSITION_WORDS[pos] ?? String(pos)
}

export function writtenCallsign(name: string, flight: number, position?: number): string {
  return position === undefined ? `${name} ${flight}` : `${name} ${flight}-${position}`
}
