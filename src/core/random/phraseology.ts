/**
 * Phraseologie je Karte (Persona-Review E3-12): An Plätzen mit US-Form (FAA) sagt der Lotse „altimeter two niner niner
 * two“, „descend and maintain …“ und die Sicht in Meilen, an ICAO-Plätzen „QNH one zero one three“, „descend to …“ und
 * die Sicht in Kilometern. Welche Form ein Platz real hat, steht an der Karte (`phraseology` in content/pools/maps.yaml).
 *
 * Ob die Übungen ihr folgen, entscheidet die Profil-Einstellung (`ResolveEnv.phraseology`): Standard ist „Immer US“
 * (`us`), weil in den meisten Sim-Staffeln durchgehend die US-Form gefunkt wird; „Kartenabhängig“ (`map`) spricht an
 * jedem Platz die Form seiner Karte. Mindesthöhen hängen davon nicht ab, sie richten sich immer nach dem Platz.
 *
 * Hier entstehen die Bausteine, mit denen ein Funkspruch beide Formen spricht, ohne doppelt geschrieben zu werden:
 * Felder am Flugplatz ({af.descend}, {af.climb} …), der Luftdruck (`number: pressure`) und die Sicht im Wetter.
 */
import type { ContentIndex } from '../content/index'
import type { Airfield, Phraseology } from '../content/schema'
import { spellDigits, spokenAltimeter } from '../phraseology/spoken'
import { value, type Value } from './template'

/**
 * Profil-Einstellung zur Phraseologie: `us` = an jedem Platz die US-Form (FAA), wie in den meisten Sim-Staffeln
 * (Standard); `map` = die Form der Karte (ICAO in Georgien und am Golf, US-Form in Nevada, auf Guam und in Korea).
 */
export const PHRASEOLOGY_SETTINGS = ['us', 'map'] as const
export type PhraseologySetting = (typeof PHRASEOLOGY_SETTINGS)[number]

/** Phraseologie eines Platzes laut Karte. Ohne Platz bleibt es bei der US-Form (so war es vor E3-12 überall). */
export function phraseologyOf(
  a: Airfield | undefined,
  content: Pick<ContentIndex, 'maps'>,
): Phraseology {
  return (a && content.maps.get(a.map)?.phraseology) || 'faa'
}

/**
 * Die Form, die in der Übung gesprochen wird: Mit `phraseology: 'map'` die der Karte, sonst (Standard „Immer US“,
 * auch ohne Angabe) überall die US-Form.
 */
export function spokenPhraseology(
  a: Airfield | undefined,
  env: { content: Pick<ContentIndex, 'maps'>; phraseology?: PhraseologySetting },
): Phraseology {
  return env.phraseology === 'map' ? phraseologyOf(a, env.content) : 'faa'
}

/**
 * Steig- und Sinkfreigaben: FAA „climb/descend and maintain“ (JO 7110.65, 4-5-7), ICAO „climb/descend to“
 * (docs/research/08-vatsim-ivao.md, Abschnitt 3; Doc 4444 12.3.1.2 dort nicht selbst gelesen).
 * Je Form: Anweisung und Readback-Form auf „-ing“.
 */
const VERBS = {
  climb: {
    faa: ['climb and maintain', 'climbing and maintaining'],
    icao: ['climb to', 'climbing to'],
  },
  descend: {
    faa: ['descend and maintain', 'descending and maintaining'],
    icao: ['descend to', 'descending to'],
  },
} as const

function verb(kind: keyof typeof VERBS, p: Phraseology): Value {
  const [main, ing] = VERBS[kind][p]
  const [other, otherIng] = VERBS[kind][p === 'faa' ? 'icao' : 'faa']
  return value(main, main, { ing: value(ing), other: value(other), otherIng: value(otherIng) })
}

const FORM: Record<Phraseology, string> = { faa: 'US-Form (FAA)', icao: 'ICAO-Form' }

/**
 * Die gesprochene Form für Sätze über den Platz („in Kutaisi gilt die …“). Weicht sie von der Karte ab (nur bei „Immer
 * US“), sagt sie das: „US-Form (FAA; laut Profil-Einstellung, real wäre an diesem Platz ICAO üblich)“.
 */
function formHere(p: Phraseology, map: Phraseology): string {
  if (p === map) return FORM[p]
  const real = map === 'icao' ? 'ICAO' : 'die US-Form'
  return `${p === 'faa' ? 'US-Form (FAA; ' : 'ICAO-Form ('}laut Profil-Einstellung, real wäre an diesem Platz ${real} üblich)`
}

/**
 * Felder eines gewürfelten Flugplatzes. `p` ist die gesprochene Form (nach der Profil-Einstellung), `map` die der Karte.
 * - `phraseology`: „FAA“ oder „ICAO“, die gesprochene Form. Unterfelder:
 *   - `form`: „US-Form (FAA)“ bzw. „ICAO-Form“ (für „In der {af.phraseology.form} heißt es …“)
 *   - `here`: wie `form`, bei „Immer US“ an einem ICAO-Platz aber mit Hinweis: „US-Form (FAA; laut
 *     Profil-Einstellung, real wäre an diesem Platz ICAO üblich)“ – für Sätze über den Platz („in {af.name} gilt die …“)
 *   - `map`: die Form der Karte, „FAA“ oder „ICAO“, Unterfeld `form`
 * - `faa`, `icao`: „yes“ bzw. leer (gesprochene Form) – für `when: af.icao` an Segmenten
 * - `climb`, `descend`: „climb and maintain“ / „climb to“; Unterfelder `ing` („climbing to“), `other` und `otherIng`
 *   (die Form der jeweils anderen Phraseologie, gedacht für `weak`)
 */
export function phraseologyFields(p: Phraseology, map: Phraseology = p): Record<string, Value> {
  return {
    phraseology: value(p.toUpperCase(), p.toUpperCase(), {
      form: value(FORM[p]),
      here: value(formHere(p, map)),
      map: value(map.toUpperCase(), map.toUpperCase(), { form: value(FORM[map]) }),
    }),
    faa: value(p === 'faa' ? 'yes' : ''),
    icao: value(p === 'icao' ? 'yes' : ''),
    climb: verb('climb', p),
    descend: verb('descend', p),
  }
}

/** Luftdruck-Würfel je Form: inHg wie `number: altimeter`, hPa wie `number: qnh`. */
export const PRESSURE_RANGE: Record<Phraseology, { range: [number, number]; step: number }> = {
  faa: { range: [29.7, 30.3], step: 0.01 },
  icao: { range: [995, 1030], step: 1 },
}

/** QNH in hPa zum Altimeter in inHg (1 inHg = 33,8639 hPa), gerundet. */
export function inHgToHpa(inHg: number): number {
  return Math.round(inHg * 33.8639)
}

/**
 * Luftdruck in der Form des Platzes. Die Form folgt dem Wert: unter 100 ist es inHg (US-Form), sonst hPa (ICAO) – so
 * bleibt auch ein abgeleiteter Wert (`derive`) in seiner Form.
 * - FAA: 29.92 → „two niner niner two“, Felder `word` „altimeter“, `other` „QNH“, `unit` „inHg“
 * - ICAO: 1013 → „one zero one three“, Felder `word` „QNH“, `other` „altimeter“, `unit` „hPa“
 */
export function pressureValue(n: number): Value {
  const faa = n < 100
  const num = faa ? Number(n.toFixed(2)) : Math.round(n)
  const text = faa ? num.toFixed(2) : String(num)
  return {
    ...value(text, faa ? spokenAltimeter(num) : spellDigits(text), {
      word: value(faa ? 'altimeter' : 'QNH'),
      other: value(faa ? 'QNH' : 'altimeter'),
      unit: value(faa ? 'inHg' : 'hPa'),
    }),
    num,
    kind: 'pressure',
  }
}

/**
 * Sicht in der Einheit des Platzes. Gewürfelt wird in Meilen (daran hängen IMC/VMC und der Case beim Träger); an
 * ICAO-Plätzen in ganze Kilometer umgerechnet, höchstens 10. Die ATIS-Lektion nennt Kilometer für Europa
 * (Modul 3, Lektion 1). Die Form „10 kilometres or more“ ist lokal nicht belegt und wird deshalb nicht gesprochen.
 * - `vis`: die Zahl („10“ / „one zero“), Unterfeld `unit` („Meilen“ / „km“) für Erklärtexte
 * - `visibility`: der ganze ATIS-Teil – „visibility one zero“ (FAA) bzw. „visibility one zero kilometers“ (ICAO)
 */
export function visibilityValues(miles: number, p: Phraseology): { vis: Value; visibility: Value } {
  const n = p === 'faa' ? miles : Math.min(10, Math.round(miles * 1.609344))
  const spoken = spellDigits(String(n))
  const vis = {
    ...value(String(n), spoken, { unit: value(p === 'faa' ? 'Meilen' : 'km') }),
    num: n,
  }
  const visibility =
    p === 'faa'
      ? value(`visibility ${n}`, `visibility ${spoken}`)
      : value(`visibility ${n} km`, `visibility ${spoken} kilometers`)
  return { vis, visibility }
}
