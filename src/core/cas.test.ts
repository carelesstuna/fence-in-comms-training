/**
 * Einsatzraum-Generator (C-F1), neue Zahlenarten (C-F2) und Bewertung des 9-Line-Decoders (C-F3).
 */
import { describe, expect, it } from 'vitest'
import { contentResult } from '../content'
import { createRng } from './random/rng'
import { numberValue, randomSelf, resolveVars } from './random/vars'
import {
  angleDiff,
  bearing,
  buildCasArea,
  distance,
  inSector,
  isValidLaserCode,
  mutateDigits,
  NM,
  sectorHeadings,
  type CasArea,
  type CasOptions,
} from './random/cas'
import { checkNineLineField, compactGrid, nineLineFields, parseDir } from './scoring/nineline'
import { resolveDrill, resolveScenario, whenHolds } from './drills/resolve'
import { cardinalDeg } from './phraseology/spoken'
import { fillTemplate } from './random/template'
import { scoreCall } from './scoring/score'

const index = contentResult.index!
const pools = index.cas

function areas(n: number, opts: CasOptions = {}): CasArea[] {
  return Array.from({ length: n }, (_, i) => buildCasArea(createRng(`cas/${i}`), opts, pools))
}

describe('Einsatzraum-Generator', () => {
  it('gleicher Seed, gleiche Lage – anderer Seed, andere Lage', () => {
    const a = buildCasArea(createRng('K7Q2'), {}, pools)
    const b = buildCasArea(createRng('K7Q2'), {}, pools)
    expect(a).toEqual(b)
    expect(buildCasArea(createRng('K7Q3'), {}, pools)).not.toEqual(a)
  })

  const all = areas(400, { dangerClose: 'any' })

  it('Line 2 und 3 passen genau zur Lage', () => {
    for (const a of all) {
      const mag = ((Math.round(bearing(a.ip, a.target) - a.magVar) % 360) + 360) % 360 || 360
      expect(a.hdgMag).toBe(mag)
      expect(Math.abs(distance(a.ip, a.target) / NM - a.ip.distNm)).toBeLessThan(0.01)
      expect(a.ip.distNm).toBeGreaterThanOrEqual(5)
      expect(a.ip.distNm).toBeLessThanOrEqual(15)
    }
  })

  it('Line 2 liegt im Final-Attack-Heading-Sektor, der Sektor ist 60° breit', () => {
    for (const a of all) {
      expect(inSector(a.hdgMag, a.fah.fromMag, a.fah.toMag)).toBe(true)
      expect(sectorHeadings(a.fah.fromMag, a.fah.toMag)).toHaveLength(61)
    }
  })

  it('der Angriff zeigt nie auf die Freunde zu oder von ihnen weg', () => {
    for (const a of all) {
      for (const mag of sectorHeadings(a.fah.fromMag, a.fah.toMag)) {
        const hdg = mag + a.magVar
        expect(angleDiff(hdg, a.friend.brgTrue)).toBeGreaterThanOrEqual(45) // nicht über das Ziel hinweg auf die Freunde
        expect(angleDiff(hdg, a.friend.brgTrue + 180)).toBeGreaterThanOrEqual(45) // nicht über die Freunde aufs Ziel
      }
    }
  })

  it('Offset und Egress führen von den Freunden weg, Egress auch von der Bedrohung', () => {
    for (const a of all) {
      // Offset zur Seite ohne Freunde: Querablage der Freunde links (+) bzw. rechts (−) vom Anflug
      const h = (a.hdgTrue * Math.PI) / 180
      const cross = Math.sin(h) * (a.friend.y - a.target.y) - Math.cos(h) * (a.friend.x - a.target.x)
      expect(a.offset).toBe(cross < 0 ? 'left' : 'right')
      expect(angleDiff(a.egress.brgTrue, a.friend.brgTrue)).toBeGreaterThan(60)
      expect(angleDiff(a.egress.brgTrue, a.threat.brgTrue)).toBeGreaterThan(60)
      expect(cardinalDeg(a.egress.dir)).toBe(a.egress.brgTrue)
      expect(a.offDir).toBe(a.egress.dir)
      expect(a.egress.to).not.toBe(a.ip.name)
    }
  })

  it('bei Laser liegt der Sektor außerhalb ±20° um die Laser-Target-Line', () => {
    const lasers = areas(200, { mark: 'laser' })
    for (const a of lasers) {
      for (const h of sectorHeadings(a.fah.fromMag, a.fah.toMag)) {
        expect(angleDiff(h, a.ltlMag)).toBeGreaterThan(20)
        expect(angleDiff(h, a.ltlMag + 180)).toBeGreaterThan(20)
      }
      expect(Math.abs(angleDiff(bearing(a.friend, a.target) - a.magVar, a.ltlMag))).toBeLessThan(1)
    }
  })

  it('Line 8 nennt Richtung und Abstand vom Ziel zu den Freunden', () => {
    for (const a of all) {
      expect(Math.round(distance(a.target, a.friend))).toBe(a.friend.distM)
      expect(a.friend.distM % 100).toBe(0)
      expect(angleDiff(cardinalDeg(a.friend.dir)!, bearing(a.target, a.friend))).toBeLessThanOrEqual(22.5 + 1e-6)
    }
  })

  it('Danger Close genau dann, wenn die Freunde unter der Schwelle der Waffe sind', () => {
    for (const a of all) expect(a.dangerClose).toBe(a.friend.distM < pools.dangerClose[a.weapon.class])
    expect(areas(60, { dangerClose: 'yes' }).every((a) => a.dangerClose)).toBe(true)
    expect(areas(60, { dangerClose: 'no' }).some((a) => a.dangerClose)).toBe(false)
    expect(areas(60).some((a) => a.dangerClose)).toBe(false) // Standard: kein Danger Close
  })

  it('Waffen passen zum Flugzeug, Laser-Codes sind gültig, Mindesthöhe liegt über der Bedrohung', () => {
    for (const a of areas(80, { aircraft: 'ah64' })) expect(a.weapon.aircraft).toContain('ah64')
    for (const a of all) {
      expect(a.weapon.aircraft).toContain('a10')
      expect(isValidLaserCode(a.laserCode)).toBe(true)
      expect(a.minAlt * 1000).toBeGreaterThanOrEqual(a.target.elevFt + a.threat.type.agl)
      expect(a.target.elevFt % 5).toBe(0)
      expect(a.night ? ['laser', 'ir', 'none'] : ['laser', 'wp', 'none']).toContain(a.mark)
      expect(a.gridWrong).not.toBe(a.target.grid)
      expect(a.gridWrong).toHaveLength(a.target.grid.length)
    }
  })

  it('Optionen werden eingehalten', () => {
    expect(areas(20, { terrain: 'mountains' }).every((a) => a.target.elevFt >= 2500)).toBe(true)
    expect(areas(20, { time: 'night' }).every((a) => a.night)).toBe(true)
    expect(areas(20, { control: 3 }).every((a) => a.control === 3)).toBe(true)
    expect(areas(20, { gridDigits: 10 }).every((a) => a.target.grid.length === 10)).toBe(true)
    expect(new Set(areas(60).map((a) => a.control)).size).toBe(3)
  })

  it('mutateDigits ändert genau eine Stelle oder vertauscht zwei Nachbarn', () => {
    for (let i = 0; i < 100; i++) {
      const g = '12345678'
      const m = mutateDigits(g, createRng(`m${i}`))
      const diff = [...m].filter((c, k) => c !== g[k]).length
      expect(diff === 1 || diff === 2).toBe(true)
    }
  })
})

describe('Einsatzraum als Variable', () => {
  const self = { name: 'Hawg', flight: 2, position: 1 }
  it('liefert alle 9-Line-Werte mit Schreib- und Sprechform', () => {
    const vars = resolveVars({ cas: { casArea: true, control: 'any', terrain: 'any', time: 'any', mark: 'laser', dangerClose: 'no', aircraft: 'a10', gridDigits: 8 } }, { rng: createRng('V1'), content: index, self })
    const a = vars.cas.data as CasArea
    const f = (t: string) => fillTemplate(t, vars)
    expect(f('{cas.ip}')).toBe(a.ip.name)
    expect(f('{cas.hdg}')).toBe(String(a.hdgMag).padStart(3, '0'))
    expect(f('{cas.grid}')).toMatch(/^[A-Z]{2} \d{4} \d{4}$/)
    expect(f('{cas.grid|spoken}')).toMatch(/^[A-Z][a-z-]+ [A-Z][a-z-]+ (zero|one|two|three|four|five|six|seven|eight|niner)( |$)/)
    expect(f('{cas.mark}')).toBe(`laser ${a.laserCode}`)
    expect(f('{cas.friend|spoken}')).toMatch(/^(north|northeast|east|southeast|south|southwest|west|northwest) /)
    expect(f('{cas.fah.from}-{cas.fah.to}')).toBe(f('{cas.fah}'))
    expect(f('{cas.laser}')).toBe('yes')
    expect(f('{cas.wp}')).toBe('')
    expect(whenHolds('cas.laser', f)).toBe(true)
    expect(whenHolds('!cas.laser', f)).toBe(false)
    expect(whenHolds('cas.dc', f)).toBe(false)
    expect(whenHolds('cas.unbekannt', f)).toBe(false)
  })
})

describe('Neue Zahlenarten', () => {
  it('lasercode, elevation, nm, meters, cardinal, mgrs, initials', () => {
    for (let i = 0; i < 50; i++) {
      const rng = createRng(`z${i}`)
      expect(isValidLaserCode(numberValue('lasercode', rng).text)).toBe(true)
      const e = numberValue('elevation', rng)
      expect(e.spoken.split(' ')).toHaveLength(e.text.length)
      expect(numberValue('nm', rng).text).toMatch(/^\d{1,2}\.\d$/)
      expect(numberValue('mgrs', rng).text).toMatch(/^[A-Z]{2} \d{4} \d{4}$/)
      expect(numberValue('mgrs', rng, undefined, undefined, 6).text).toMatch(/^[A-Z]{2} \d{3} \d{3}$/)
      expect(numberValue('initials', rng).text).toMatch(/^[A-Z]{2}$/)
    }
    expect(numberValue('meters', createRng('a'), [1200, 1200]).spoken).toBe('one thousand two hundred')
    const c = numberValue('cardinal', createRng('b'), [180, 180])
    expect(c.text).toBe('south')
    expect(c.fields?.opposite.text).toBe('north')
    expect(numberValue('elevation', createRng('c'), [1250, 1250]).spoken).toBe('one two five zero')
    expect(numberValue('initials', createRng('d'), [26 * 0 + 10, 10]).spoken).toBe('Alfa Kilo')
  })

  it('erlaubte Zusätze (optional, frei) zählen nur, wenn sie genau passen', () => {
    const segs = [
      { text: 'Hawg one one', role: 'callsign' },
      { text: 'final attack heading three six zero to zero six zero', role: 'instruction' },
      { text: 'eight point four', role: 'value', optional: true, free: true },
      { text: 'laser-target line one two four', role: 'value', optional: true, free: true },
    ]
    const r = scoreCall('Hawg 1-1, final attack heading 360 to 060, laser-target line 124', segs)
    expect(r.correct, r.issues.join(' | ')).toBe(true)
    expect(r.slots[3].status).toBe('ok')
    expect(r.slots[2].status).toBe('skipped')
  })

  it('Zahlwörter mit hundred und Zehnern zählen als eine Zahl', () => {
    const seg = [{ text: 'south 250', role: 'position' }]
    expect(scoreCall('south two hundred fifty', seg).correct).toBe(true)
    expect(scoreCall('one thousand two hundred fifty feet', [{ text: '1250 feet', role: 'value' }]).correct).toBe(true)
    expect(scoreCall('one two five zero feet', [{ text: '1250 feet', role: 'value' }]).correct).toBe(true)
  })
})

describe('9-Line-Decoder: Bewertung je Zeile', () => {
  const a = buildCasArea(createRng('NL1'), { mark: 'laser', dangerClose: 'no' }, pools)
  const fields = nineLineFields(a, 'nineline')
  const field = (key: string) => fields.find((f) => f.key === key)!
  const check = (key: string, input: string) => checkNineLineField(field(key), input)

  it('hat neun Zeilen plus Final Attack Heading und (bei Laser) Laser-Target-Line', () => {
    expect(fields.map((f) => f.key)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'fah', 'ltl'])
    const noLaser = buildCasArea(createRng('NL2'), { mark: 'wp' }, pools)
    expect(nineLineFields(noLaser, 'nineline').map((f) => f.key)).not.toContain('ltl')
    expect(nineLineFields(a, 'fiveline', undefined, 'Axeman').map((f) => f.key)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('Line 1 und 2', () => {
    expect(check('1', `IP ${a.ip.name}`).ok).toBe(true)
    expect(check('1', a.ip.name.slice(0, -1)).ok).toBe(a.ip.name.length >= 5)
    const h = String(a.hdgMag).padStart(3, '0')
    expect(check('2', `${h} offset ${a.offset}`).ok).toBe(true)
    expect(check('2', `${h}${a.offset === 'left' ? 'L' : 'R'}`).ok).toBe(true)
    expect(check('2', h)).toMatchObject({ ok: false, near: true })
    expect(check('2', `${(a.hdgMag + 5) % 360} ${a.offset}`).ok).toBe(false)
  })

  it('Line 3 mit ±0,1 NM, Komma oder Punkt', () => {
    expect(check('3', a.ip.distNm.toFixed(1)).ok).toBe(true)
    expect(check('3', a.ip.distNm.toFixed(1).replace('.', ',')).ok).toBe(true)
    expect(check('3', (a.ip.distNm + 0.1).toFixed(1)).ok).toBe(true)
    expect(check('3', (a.ip.distNm + 0.3).toFixed(1)).ok).toBe(false)
  })

  it('Line 4 genau, mit oder ohne Tausendertrenner', () => {
    const e = a.target.elevFt
    expect(check('4', `${e} ft`).ok).toBe(true)
    if (e >= 1000) expect(check('4', `${Math.floor(e / 1000)},${String(e % 1000).padStart(3, '0')}`).ok).toBe(true)
    expect(check('4', String(e + 10)).ok).toBe(false)
  })

  it('Line 5 über das Stichwort', () => {
    expect(check('5', a.target.desc.text).ok).toBe(true)
    expect(check('5', a.target.desc.keyword).ok).toBe(true)
    expect(check('5', 'helicopter').ok).toBe(false)
  })

  it('Line 6 genau; ein Zahlendreher gibt halbe Punkte', () => {
    const g = `${a.square} ${a.target.grid.slice(0, 4)} ${a.target.grid.slice(4)}`
    expect(check('6', g).ok).toBe(true)
    expect(check('6', `${a.square}${a.target.grid}`).ok).toBe(true)
    expect(check('6', `37T ${g}`).ok).toBe(true)
    expect(compactGrid('November Kilo 1234 5678')).toBe('NK12345678')
    expect(compactGrid('x-ray whiskey one two three four five six seven eight')).toBe('XW12345678')
    const wrong = `${a.square} ${a.gridWrong.slice(0, 4)} ${a.gridWrong.slice(4)}`
    expect(check('6', wrong)).toMatchObject({ ok: false, near: true })
  })

  it('Line 7 mit Code', () => {
    expect(check('7', `laser ${a.laserCode}`).ok).toBe(true)
    expect(check('7', a.laserCode).ok).toBe(true)
    expect(check('7', 'laser')).toMatchObject({ ok: false, near: true })
    expect(check('7', 'WP').ok).toBe(false)
    // Leer heißt „nichts eingetragen“, nicht „keine Markierung“, wenn eine gesagt war
    expect(check('7', '')).toMatchObject({ ok: false, note: 'Nichts eingetragen.' })
    const none = buildCasArea(createRng('NL3'), { mark: 'none' }, pools)
    const noneMark = nineLineFields(none, 'nineline').find((f) => f.key === '7')!
    expect(checkNineLineField(noneMark, '').ok).toBe(true)
    expect(checkNineLineField(noneMark, 'none').ok).toBe(true)
  })

  it('Line 8 und 9 mit Richtung als Wort oder Abkürzung', () => {
    const abbr = (d: string) => d.replace('north', 'N').replace('south', 'S').replace('east', 'E').replace('west', 'W')
    expect(check('8', `${a.friend.dir} ${a.friend.distM}`).ok).toBe(true)
    expect(check('8', `${abbr(a.friend.dir)} ${a.friend.distM}`).ok).toBe(true)
    expect(check('8', `${a.friend.dir}`)).toMatchObject({ near: true })
    expect(check('9', abbr(a.egress.dir)).ok).toBe(true)
    expect(check('9', `${a.egress.dir} to ${a.egress.to}`).ok).toBe(true)
    expect(parseDir('north east')).toBe('northeast')
    expect(parseDir('SW 1200')).toBe('southwest')
  })

  it('Final Attack Heading als Sektor von – bis, Laser-Target-Line als Kurs', () => {
    const f3 = (n: number) => String(n).padStart(3, '0')
    expect(check('fah', `${f3(a.fah.fromMag)}-${f3(a.fah.toMag)}`).ok).toBe(true)
    expect(check('fah', `${f3(a.fah.fromMag)} to ${f3(a.fah.toMag)}`).ok).toBe(true)
    expect(check('fah', `${f3(a.fah.fromMag)} ${f3(a.fah.toMag)}`).ok).toBe(true)
    expect(check('fah', `${f3(a.fah.toMag)}-${f3(a.fah.fromMag)}`)).toMatchObject({ ok: false, near: true })
    expect(check('ltl', f3(a.ltlMag)).ok).toBe(true)
  })

  it('jede Musterlösung besteht ihre eigene Prüfung', () => {
    for (const x of areas(150, { dangerClose: 'any' })) {
      for (const fmt of ['nineline', 'fiveline'] as const) {
        for (const fl of nineLineFields(x, fmt, fmt === 'nineline' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 'fah', 'ltl', 'tot'] : undefined, 'Axeman')) {
          expect(checkNineLineField(fl, fl.expected).ok, `${fl.label}: ${fl.expected}`).toBe(true)
        }
      }
    }
  })
})

describe('Spur C in den Inhalten', () => {
  it('nineline-Übungen und Szenarien mit decode lösen sich auf', () => {
    for (const d of index.drills.values()) {
      if (d.type !== 'nineline') continue
      for (let i = 0; i < 20; i++) {
        const rng = createRng(`${d.id}/${i}`)
        const r = resolveDrill(d, { rng, content: index, self: randomSelf(rng, index) })
        if (r.kind !== 'nineline') throw new Error('falscher Typ')
        for (const f of r.fields) expect(checkNineLineField(f, f.expected).ok, `${d.id} ${f.label}`).toBe(true)
        if (r.readback) {
          const t = r.readback.exchange.transmissions[r.readback.transmission]
          const solution = t.segments.filter((s) => !s.optional).map((s) => s.text).join(', ')
          expect(scoreCall(solution, t.segments).correct, `${d.id}: ${solution}`).toBe(true)
        }
      }
    }
    for (const sc of index.scenarios.values()) {
      if (!sc.steps.some((s) => s.decode)) continue
      const rng = createRng(sc.id)
      const r = resolveScenario(sc, { rng, content: index, self: randomSelf(rng, index) })
      for (const st of r.steps) for (const f of st.decode?.fields ?? []) expect(checkNineLineField(f, f.expected).ok).toBe(true)
    }
  })
})
