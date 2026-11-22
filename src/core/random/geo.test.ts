/**
 * Tests für die Lagegeometrie aus dem Persona-Review (E2-01, E2-02/E2-03, E2-04, E2-12):
 * Track im gelabelten Picture nach ATP 3-52.4 IV-6.b und IV-13.d, Threat-Gruppe, Check-in-Punkt, Abfangkurs.
 */
import { describe, expect, it } from 'vitest'
import { createRng } from './rng'
import {
  aspectAngle,
  aspectOf,
  bearingDeg,
  buildPicture,
  cutoffHeading,
  distNm,
  inAspectGap,
  pictureTrack,
  pictureValue,
  type GeoGroup,
  type GeoPicture,
} from './geo'

const own = { x: 0, y: 0, heading: 360 }

/** Gruppe nördlich vom eigenen Flugzeug (x seitlich, y voraus). */
const grp = (name: string, x: number, y: number, heading: number, altFt = 20000): GeoGroup => ({ name, x, y, heading, altFt, size: 2, id: 'hostile' })

/** Two groups range 10: lead 30 NM voraus, trail 40 NM voraus. */
function range(headingLead: number, headingTrail: number): GeoPicture {
  return {
    label: 'range',
    sepNm: 10,
    wideNm: 0,
    deepNm: 10,
    labelled: true,
    own,
    groups: [grp('lead group', 0, 30, headingLead), grp('trail group', 0, 40, headingTrail, 30000)],
    nearest: 0,
  }
}

describe('Track im Picture (ATP 3-52.4 IV-6.b, IV-13.d)', () => {
  it('alle Gruppen hot: kein Track – weder hinter dem Label noch bei einer Gruppe', () => {
    const p = range(180, 185)
    expect(pictureTrack(p)).toEqual({ mode: 'none' })
    const v = pictureValue(p)
    expect(v.text).not.toContain('track')
    expect(v.fields!.head.text).toBe('two groups range 10')
    expect(v.fields!.track.text).toBe('')
    expect(v.fields!.g1.text).toMatch(/^lead group bullseye 360\/30, 20 thousand, hostile$/)
    expect(v.fields!.g2.text).toBe('trail group 30 thousand, hostile')
    // Das Feld bleibt für Erklärungen und Declare-Antworten verfügbar
    expect(v.fields!.g1.fields!.track.text).toBe('south')
  })

  it('gemeinsamer Track (nicht hot): einmal hinter Label und Maß, bei keiner Gruppe', () => {
    const p = range(90, 95)
    expect(pictureTrack(p)).toEqual({ mode: 'common', track: 'east' })
    const v = pictureValue(p)
    expect(v.fields!.head.text).toBe('two groups range 10, track east')
    expect(v.fields!.head.spoken).toBe('two groups range ten, track east')
    expect(v.fields!.label.text).toBe('two groups range 10')
    expect(v.fields!.track.text).toBe('track east')
    expect(v.fields!.g1.text).toBe('lead group bullseye 360/30, 20 thousand, hostile')
    expect(v.fields!.g2.text).toBe('trail group 30 thousand, hostile')
    expect(v.text).toBe('two groups range 10, track east, lead group bullseye 360/30, 20 thousand, hostile; trail group 30 thousand, hostile')
    expect(v.text.match(/track/g)).toHaveLength(1)
  })

  it('verschiedene Tracks: Track je Gruppe, auch bei der Gruppe ohne Bullseye', () => {
    const p = range(90, 270)
    expect(pictureTrack(p)).toEqual({ mode: 'each' })
    const v = pictureValue(p)
    expect(v.fields!.head.text).toBe('two groups range 10')
    expect(v.fields!.g1.text).toBe('lead group bullseye 360/30, 20 thousand, track east, hostile')
    expect(v.fields!.g2.text).toBe('trail group 30 thousand, track west, hostile')
  })

  it('eine hot, eine nicht: kein „alle hot“ – Track gemeinsam oder je Gruppe', () => {
    // lead hot (180), trail flank west (≈ 225) → verschiedene 8er-Richtungen
    expect(pictureTrack(range(180, 225)).mode).toBe('each')
  })

  it('Core Information und single group behalten den Track je Gruppe (Bullseye-Format, IV-6.a)', () => {
    const core: GeoPicture = { ...range(180, 185), labelled: false }
    core.groups = core.groups.map((g) => ({ ...g, name: 'group' }))
    expect(pictureTrack(core).mode).toBe('each')
    const v = pictureValue(core)
    expect(v.fields!.g1.text).toBe('group bullseye 360/30, 20 thousand, track south, hostile')
    expect(v.fields!.g2.text).toBe('group bullseye 360/40, 30 thousand, track south, hostile')
    const single: GeoPicture = { ...range(180, 185), label: 'single', groups: [grp('single group', 0, 30, 180)] }
    expect(pictureValue(single).text).toBe('single group bullseye 360/30, 20 thousand, track south, hostile')
  })

  it('gewürfelte Pictures folgen der Regel – und alle drei Fälle kommen vor', () => {
    const seen = { none: 0, common: 0, each: 0 }
    for (let i = 0; i < 300; i++) {
      const p = buildPicture(createRng(`trk${i}`), { groups: 2 + (i % 2) })
      const v = pictureValue(p)
      const t = pictureTrack(p)
      seen[t.mode]++
      const groups = p.groups.map((_, k) => v.fields![`g${k + 1}`].text)
      if (t.mode === 'none') {
        expect(p.groups.every((g) => aspectOf(g, p.own) === 'hot')).toBe(true)
        expect(v.text).not.toContain('track')
      }
      if (t.mode === 'common') {
        expect(v.fields!.head.text.endsWith(`, track ${t.track}`)).toBe(true)
        for (const g of groups) expect(g).not.toContain('track')
      }
      if (t.mode === 'each') for (const g of groups) expect(g).toContain('track')
    }
    expect(seen.none).toBeGreaterThan(20)
    expect(seen.common).toBeGreaterThan(20)
    expect(seen.each).toBeGreaterThan(0)
  })
})

describe('Threat-Gruppe aus derselben eigenen Position (E2-02, E2-03)', () => {
  it('liegt 20–35 NM vor dem Jäger, hot oder flank, hostile, auf der Karte', () => {
    for (let i = 0; i < 200; i++) {
      const p = buildPicture(createRng(`thr${i}`), { groups: 1 + (i % 3) })
      const t = p.threat!
      const d = distNm(p.own, t)
      expect(d).toBeGreaterThanOrEqual(19.5)
      expect(d).toBeLessThanOrEqual(35.5)
      const asp = aspectOf(t, p.own)
      expect(asp === 'hot' || asp.startsWith('flank')).toBe(true)
      expect(inAspectGap(aspectAngle(t, p.own))).toBe(false)
      expect(distNm({ x: 0, y: 0 }, t)).toBeLessThanOrEqual(80)
      const v = pictureValue(p).fields!.threat
      expect(v.fields!.braa.fields!.range.num).toBeLessThanOrEqual(35)
      expect(v.fields!.braa.fields!.range.num).toBeGreaterThanOrEqual(20)
      expect(v.fields!.braaCall.text).toMatch(/^BRAA \d{3}\/\d+, \d+ thousand, (hot|flank [a-z]+), hostile$/)
    }
  })

  it('gleiche Saat, gleiche Lage samt Threat-Gruppe', () => {
    const a = buildPicture(createRng('same'), { groups: 2 })
    const b = buildPicture(createRng('same'), { groups: 2 })
    expect(a).toEqual(b)
  })
})

describe('Check-in-Punkt (E2-04, P1-06)', () => {
  it('liegt 15–25 NM vor der Station, auf der Seite weg von der Bedrohung', () => {
    for (let i = 0; i < 100; i++) {
      const p = buildPicture(createRng(`ing${i}`), { groups: 2, labelled: false })
      const d = distNm(p.own, p.ingress!)
      expect(d).toBeGreaterThanOrEqual(14.5)
      expect(d).toBeLessThanOrEqual(25.5)
      // Vom Check-in-Punkt zur Station fliegt man in Richtung Bedrohung (± 40° um die Achse)
      const toStation = bearingDeg(p.ingress!, p.own)
      const diff = Math.abs(((toStation - p.own.heading + 540) % 360) - 180)
      expect(diff).toBeLessThanOrEqual(41)
      expect(pictureValue(p).fields!.ingress.text).toMatch(/^\d{3}\/\d+$/)
    }
  })
})

describe('Abfangkurs (E2-12)', () => {
  it('hot: direkt auf die Gruppe; quer: mit Vorhalt in Flugrichtung der Gruppe', () => {
    // Gruppe 30 NM nördlich
    expect(cutoffHeading(own, grp('g', 0, 30, 180))).toBe(360)
    // fliegt nach Osten: Vorhalt nach rechts, asin(0.8) ≈ 53°
    expect(cutoffHeading(own, grp('g', 0, 30, 90))).toBe(53)
    // fliegt nach Westen: Vorhalt nach links
    expect(cutoffHeading(own, grp('g', 0, 30, 270))).toBe(307)
    // drag: hinterher
    expect(cutoffHeading(own, grp('g', 0, 30, 360))).toBe(360)
  })

  it('auf dem Abfangkurs bleibt die Peilung gleich, die Entfernung halbiert sich (braaLater)', () => {
    const p = range(90, 95)
    const g1 = pictureValue(p).fields!.g1.fields!
    expect(g1.cutoff.text).toBe('053')
    expect(g1.braa.text).toBe('360/30')
    expect(g1.braaLater.text).toBe('360/15')
    expect(g1.braaLater.fields!.range.num).toBe(15)
  })
})
