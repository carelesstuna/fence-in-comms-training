/**
 * Querverweise in den Inhalten (S-22):
 * - „Modul N, Lektion M“ führt zu einer Lektion, die es gibt. Gezählt wird wie in der App nach der Position im
 *   Modul (`curriculum.yaml`), nicht nach der ID (`m4-l7` steht an Position 6).
 * - Verweise auf geplante Spuren (ohne Lektionen) stehen als „später geplant“, damit niemand dort nachliest.
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'

const index = contentResult.index!

const raw = import.meta.glob(
  ['/content/**/*.yaml', '/content/**/*.md', '!/content/README.md', '!/content/curriculum.yaml'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>

const lessonCount = new Map([...index.modules.values()].map((m) => [m.code, m.lessons.length]))

/** Geplante Spuren: Kennbuchstabe und Titel, so wie ein Text sie nennen kann („Spur B“, „Spur Luftkampf“). */
const plannedTracks = [...index.modules.values()].filter(
  (m) => m.group === 'track' && m.status === 'planned',
)

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const trackName = new RegExp(
  `Spur\\s+(?:${plannedTracks
    .flatMap((m) => [m.code, m.title])
    .map(escape)
    .join('|')})(?![\\p{L}\\p{N}])`,
  'gu',
)

/** „Modul N, Lektion M“, wo es Modul N nicht gibt oder es weniger als M Lektionen hat. */
function kaputteLektionsverweise(text: string): string[] {
  const treffer: string[] = []
  for (const m of text.matchAll(/Modul (\w+), Lektion (\d+)/g)) {
    const n = lessonCount.get(m[1])
    if (n === undefined) treffer.push(`${m[0]}: kein Modul ${m[1]}`)
    else if (Number(m[2]) < 1 || Number(m[2]) > n)
      treffer.push(`${m[0]}: Modul ${m[1]} hat ${n} Lektionen`)
  }
  return treffer
}

/** Namen geplanter Spuren ohne „später geplant“ unmittelbar davor. */
function ungekennzeichneteSpuren(text: string): string[] {
  const treffer: string[] = []
  for (const m of text.matchAll(trackName)) {
    if (!/später geplante[nrms]?\s+$/.test(text.slice(0, m.index)))
      treffer.push(m[0].replace(/\s+/g, ' '))
  }
  return treffer
}

describe('Querverweise in den Inhalten', () => {
  it('kennt die Inhaltsdateien und die geplanten Spuren', () => {
    expect(Object.keys(raw).length).toBeGreaterThan(50)
    expect(plannedTracks.map((m) => m.code)).toEqual(expect.arrayContaining(['A', 'B', 'D', 'E']))
    expect(plannedTracks.every((m) => m.lessons.length === 0)).toBe(true)
  })

  it('„Modul N, Lektion M“ nennt eine Lektion, die es gibt', () => {
    const verstoesse: string[] = []
    for (const [pfad, text] of Object.entries(raw)) {
      for (const t of kaputteLektionsverweise(text)) verstoesse.push(`${pfad} – ${t}`)
    }
    expect(verstoesse).toEqual([])
  })

  it('Verweise auf geplante Spuren sind als „später geplant“ gekennzeichnet', () => {
    const verstoesse: string[] = []
    for (const [pfad, text] of Object.entries(raw)) {
      for (const t of ungekennzeichneteSpuren(text)) verstoesse.push(`${pfad} – ${t}`)
    }
    expect(verstoesse).toEqual([])
  })

  it('erkennt falsche Lektionsverweise', () => {
    expect(kaputteLektionsverweise('siehe Modul 2, Lektion 5.')).toEqual([])
    expect(kaputteLektionsverweise('siehe Modul 4, Lektion 7.')).toEqual([])
    expect(kaputteLektionsverweise('siehe Modul 4, Lektion 8.')).toHaveLength(1)
    expect(kaputteLektionsverweise('siehe Modul 9, Lektion 1.')).toHaveLength(1)
    expect(kaputteLektionsverweise('siehe Modul 1, Lektion 0.')).toHaveLength(1)
  })

  it('erkennt Spuren ohne Kennzeichnung und lässt gekennzeichnete durch', () => {
    expect(ungekennzeichneteSpuren('Mehr dazu in Spur B.')).toEqual(['Spur B'])
    expect(ungekennzeichneteSpuren('Stoff der Spur Luftkampf.')).toHaveLength(1)
    expect(ungekennzeichneteSpuren('in der später geplanten Spur\n      Air Force Ops.')).toEqual(
      [],
    )
    expect(ungekennzeichneteSpuren('(später geplante Spur D)')).toEqual([])
    expect(ungekennzeichneteSpuren('Spur W, Lektion 3 und Spur Bravo')).toEqual([])
  })
})
