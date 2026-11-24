/**
 * Geometrie der schematischen Karten (Chart.tsx): Lage von Bahnen, Rollweg und Vorfeld sowie die erklärbaren
 * Bereiche für Leseseiten (::chart{… annotate}). Koordinaten im viewBox-System der jeweiligen Karte.
 */
import type { ChartData } from '../core/charts/chart'

export interface Pt {
  x: number
  y: number
}
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Ein erklärbarer Bereich der Karte: Umriss (SVG-Pfad), umgebendes Rechteck für das Erklärkärtchen, Hotspot-Punkt. */
export interface ChartZone {
  id: string
  d: string
  box: Box
  dot: Pt
}

const rectPath = (b: Box) => `M${b.x},${b.y}h${b.w}v${b.h}h${-b.w}Z`
const polyPath = (pts: Pt[]) =>
  `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`
function boxOf(pts: Pt[]): Box {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}
/** Rechteck um die Strecke a–b mit halber Breite `half`. */
function strip(a: Pt, b: Pt, half: number): Pt[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const n = { x: (-(b.y - a.y) / len) * half, y: ((b.x - a.x) / len) * half }
  return [
    { x: a.x + n.x, y: a.y + n.y },
    { x: b.x + n.x, y: b.y + n.y },
    { x: b.x - n.x, y: b.y - n.y },
    { x: a.x - n.x, y: a.y - n.y },
  ]
}

export function runwayGeometry(pairs: string[], cx: number, cy: number, half: number) {
  return pairs.map((pair) => {
    const ends = pair.split('/') as [string, string]
    const heading = Number(ends[0].replace(/[LRC]/, '')) * 10
    const r = (heading * Math.PI) / 180
    const d = { x: Math.sin(r), y: -Math.cos(r) }
    const left = { x: d.y, y: -d.x }
    const side = ends[0].match(/[LRC]$/)?.[0]
    // "left" zeigt in Blickrichtung des ersten Bahnendes nach links: L liegt dort, R gegenüber
    const off = side === 'L' ? 14 : side === 'R' ? -14 : 0
    const c = { x: cx + left.x * off, y: cy + left.y * off }
    return {
      ends,
      d,
      left,
      off,
      a: { x: c.x - d.x * half, y: c.y - d.y * half },
      b: { x: c.x + d.x * half, y: c.y + d.y * half },
    }
  })
}

export const AIRPORT_VIEW: Box = { x: 0, y: 0, w: 420, h: 320 }

export function airportLayout(data: ChartData) {
  const rw = runwayGeometry(data.runways, 140, 175, 92)
  const main = rw.find((r) => r.ends.includes(data.activeEnd ?? '')) ?? rw[0]
  // Rollweg und Vorfeld rechts neben der äußersten parallelen Bahn (nicht unter einer anderen Bahn)
  const outer = Math.min(
    ...rw.filter((r) => r.d.x === main.d.x && r.d.y === main.d.y).map((r) => r.off),
  )
  const taxiOffset = 26 + (main.off - outer)
  const t1 = { x: main.a.x + main.left.x * -taxiOffset, y: main.a.y + main.left.y * -taxiOffset }
  const t2 = { x: main.b.x + main.left.x * -taxiOffset, y: main.b.y + main.left.y * -taxiOffset }
  const apronOff = outer - 66
  const apron = { x: 140 + main.left.x * apronOff, y: 175 + main.left.y * apronOff }
  const shown = data.freqs.filter((f) => f.id !== 'departure' || f.mhz !== undefined)
  return { rw, main, taxiOffset, t1, t2, apron, shown }
}

/** Erklärbare Bereiche der Platzkarte: Funkblock, Bahnen, Rollweg mit Vorfeld, Platzhöhe/TACAN. */
export function airportZones(data: ChartData): ChartZone[] {
  const { rw, main, t1, t2, apron, shown } = airportLayout(data)
  const n = shown.length
  const radio: Box = { x: 292, y: 36, w: 118, h: 14 + n * 13 }
  const elev: Box = { x: 292, y: 60 + n * 13, w: 118, h: data.tacan ? 28 : 13 }
  // Bahnen samt der Schilder an beiden Enden
  const rwyPolys = rw.map((r) =>
    strip(
      { x: r.a.x - r.d.x * 22, y: r.a.y - r.d.y * 22 },
      { x: r.b.x + r.d.x * 22, y: r.b.y + r.d.y * 22 },
      9,
    ),
  )
  const apronPts = [
    { x: apron.x - 24, y: apron.y - 12 },
    { x: apron.x + 24, y: apron.y + 12 },
  ]
  const taxiPoly = strip(t1, t2, 6)
  const mid = { x: (t1.x + t2.x) / 2, y: (t1.y + t2.y) / 2 }
  const link = strip(apron, mid, 4)
  return [
    { id: 'radio', d: rectPath(radio), box: radio, dot: { x: 284, y: 43 } },
    {
      id: 'runways',
      d: rwyPolys.map(polyPath).join(''),
      box: boxOf(rwyPolys.flat()),
      dot: { x: main.b.x + main.d.x * 27, y: main.b.y + main.d.y * 27 },
    },
    {
      id: 'taxi',
      d:
        polyPath(taxiPoly) +
        polyPath(link) +
        rectPath({ x: apron.x - 24, y: apron.y - 12, w: 48, h: 24 }),
      box: boxOf([...taxiPoly, ...link, ...apronPts]),
      dot: {
        x: t1.x + (t2.x - t1.x) * 0.12 - main.left.x * 11,
        y: t1.y + (t2.y - t1.y) * 0.12 - main.left.y * 11,
      },
    },
    { id: 'elevation', d: rectPath(elev), box: elev, dot: { x: 284, y: 66.5 + n * 13 } },
  ]
}

export const APPROACH_VIEW: Box = { x: 0, y: 0, w: 420, h: 470 }

/**
 * Erklärbare Bereiche der Anflugkarte: die drei Spalten des Kopfs, Draufsicht, MSA-Kreis, Profil, Minima.
 * Der MSA-Kreis liegt in der Draufsicht und kommt deshalb danach (obenauf für die Maus). Hotspots oben rechts im Bereich.
 */
export function approachZones(): ChartZone[] {
  const zone = (id: string, box: Box, dot: Pt): ChartZone => ({ id, d: rectPath(box), box, dot })
  return [
    zone('head-nav', { x: 4, y: 28, w: 136, h: 82 }, { x: 133, y: 35 }),
    zone('head-missed', { x: 140, y: 28, w: 140, h: 82 }, { x: 273, y: 35 }),
    zone('head-freqs', { x: 280, y: 28, w: 136, h: 82 }, { x: 409, y: 35 }),
    zone('plan', { x: 8, y: 116, w: 404, h: 200 }, { x: 404, y: 123 }),
    {
      id: 'msa',
      d: 'M16,156a32,32 0 1,0 64,0a32,32 0 1,0 -64,0Z',
      box: { x: 16, y: 124, w: 64, h: 64 },
      dot: { x: 72, y: 133 },
    },
    zone('profile', { x: 8, y: 322, w: 404, h: 102 }, { x: 404, y: 330 }),
    zone('minima', { x: 8, y: 424, w: 404, h: 30 }, { x: 404, y: 432 }),
  ]
}

/** Erklärbare Bereiche dieser Karte, in Lesereihenfolge. */
export function chartZones(data: ChartData): ChartZone[] {
  return data.kind === 'approach' && data.approach ? approachZones() : airportZones(data)
}
