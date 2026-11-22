/**
 * „Mehr dazu“ unter der Erklärung eines Funkspruch-Teils: Welches Ziel passt, und ist ein Ziel gültig?
 * Reine Funktionen ohne React.
 *
 * Ziele sind Pfade in der App (der Router ist ein Hash-Router, die Adresse baut `<Link>`): das Glossar mit
 * Parametern (TARGETS) und die Themenseiten `/wissen/<id>`. Eine neue Seite trägt sich in TARGETS ein und hängt dann an
 * denselben Stellen (Rolle in roles.yaml oder `more` am Segment).
 */
import { BREVITY_CATEGORIES, type More, type RoleMore } from '../content/schema'
import { CATEGORY_LABELS, termsInText, type GlossaryEntry } from './glossary'

export type MoreLink = More

/** Reiter der Glossar-Seite, die per ?tab= aufrufbar sind (ohne „Alle“, das ist der Standard). */
export const GLOSSARY_TABS = ['basics', 'brevity', 'prowords', 'alphabet'] as const

/** Seiten, auf die ein „Mehr dazu“ zeigen darf: erlaubte Parameter und ihre Werte (null = beliebiger Text). */
const TARGETS: Record<string, Record<string, readonly string[] | null>> = {
  '/glossary': { q: null, tab: GLOSSARY_TABS, cat: BREVITY_CATEGORIES },
}

/** Themenseite als Ziel: `/wissen/<id>`. Sie ist eine normale Seite der App; der Rückweg ist die Zurück-Taste. */
const TOPIC_PATH = /^\/wissen\/([a-z0-9][a-z0-9-]*)$/

/** Zeigt das Ziel auf eine Themenseite (öffnet im selben Fenster) und nicht auf das Glossar (neuer Tab)? */
export function isTopicTarget(to: string): boolean {
  return TOPIC_PATH.test(splitTarget(to).path)
}

function splitTarget(to: string): { path: string; params: URLSearchParams } {
  const i = to.indexOf('?')
  return i < 0
    ? { path: to, params: new URLSearchParams() }
    : { path: to.slice(0, i), params: new URLSearchParams(to.slice(i + 1)) }
}

/**
 * Prüft ein Ziel. Ergibt eine Fehlermeldung oder null, wenn es gültig ist. `topicIds` sind die IDs der Themenseiten
 * (`content/topics/`), auf die `/wissen/<id>` zeigen darf.
 */
export function checkMoreTarget(to: string, topicIds: ReadonlySet<string> = new Set()): string | null {
  const pre = `Ziel „${to}“`
  if (!to.startsWith('/') || to.startsWith('//'))
    return `${pre}: muss ein Pfad in der App sein und mit „/“ beginnen (z. B. /glossary?tab=brevity)`
  if (/\s/.test(to)) return `${pre}: enthält ein Leerzeichen (als + oder %20 schreiben)`
  if (to.includes('#')) return `${pre}: Anker (#) sind nicht vorgesehen`
  const { path, params } = splitTarget(to)
  const topic = TOPIC_PATH.exec(path)
  if (topic) {
    if ([...params].length > 0) return `${pre}: Themenseiten nehmen keine Parameter (nur /wissen/<id>)`
    return topicIds.has(topic[1]) ? null : `${pre}: Themenseite „${topic[1]}“ gibt es nicht (content/topics/${topic[1]}.md)`
  }
  const allowed = TARGETS[path]
  if (!allowed)
    return `${pre}: unbekannte Seite „${path}“ (erlaubt: ${[...Object.keys(TARGETS), '/wissen/<id>'].join(', ')})`
  const seen = new Set<string>()
  for (const [key, value] of params) {
    if (!Object.hasOwn(allowed, key))
      return `${pre}: unbekannter Parameter „${key}“ (erlaubt für ${path}: ${Object.keys(allowed).join(', ')})`
    if (seen.has(key)) return `${pre}: Parameter „${key}“ kommt doppelt vor`
    seen.add(key)
    const values = allowed[key]
    if (values === null && !value.trim()) return `${pre}: Parameter „${key}“ ist leer`
    if (values && !values.includes(value))
      return `${pre}: „${value}“ ist kein gültiger Wert für ${key} (erlaubt: ${values.join(', ')})`
  }
  // Die Gruppen-Filter stehen nur im Brevity-Reiter; anderswo ließe sich der Filter nicht mehr abschalten
  if (params.has('cat') && params.get('tab') !== 'brevity')
    return `${pre}: cat gibt es nur zusammen mit tab=brevity`
  return null
}

function whenMatches(when: string | undefined, text: string): boolean {
  if (!when) return true
  try {
    return new RegExp(when, 'i').test(text)
  } catch {
    return false
  }
}

/**
 * Verweist die Rolle auf die Brevity-Liste, wird daraus – wenn alle erkannten Brevity-Codes des Teils in
 * einer Gruppe stehen – die Liste dieser Gruppe. Gehören sie zu mehreren Gruppen („picture clean“) oder
 * erkennt man keinen, bleibt es bei der ganzen Liste.
 */
function refineToBrevityGroup(
  link: MoreLink,
  text: string,
  entries: readonly GlossaryEntry[],
): MoreLink {
  const { path, params } = splitTarget(link.to)
  if (
    path !== '/glossary' ||
    params.get('tab') !== 'brevity' ||
    params.has('cat') ||
    params.has('q')
  )
    return link
  const groups = new Set(
    termsInText(
      entries.filter((e) => e.kind === 'brevity'),
      text,
    ).map((e) => e.category),
  )
  const [group] = groups
  if (groups.size !== 1 || !group) return link
  params.set('cat', group)
  return { to: `${path}?${params}`, label: `Brevity-Gruppe ${CATEGORY_LABELS[group]}` }
}

/**
 * Der „Mehr dazu“-Link zu einem Teil eines Funkspruchs – oder null, wenn es kein gutes Ziel gibt.
 * Ein `more` am Segment geht vor; sonst gilt das Standardziel der Rolle (roles.yaml).
 */
export function moreForSegment(
  seg: { text: string; role: string; more?: MoreLink },
  roles: ReadonlyMap<string, { more?: RoleMore }>,
  entries: readonly GlossaryEntry[],
): MoreLink | null {
  if (seg.more) return seg.more
  const standard = roles.get(seg.role)?.more?.find((m) => whenMatches(m.when, seg.text))
  if (!standard) return null
  return refineToBrevityGroup({ to: standard.to, label: standard.label }, seg.text, entries)
}
