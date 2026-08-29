/**
 * The coastline, generated once and vendored.
 *
 * The landing plots fourteen sites and for a long time plotted them on a bare
 * graticule, with a note saying that inventing a coastline would be drawing
 * something nobody had measured — the same objection this project makes to an
 * invented dimension. A *real* coastline is not that. It is a measurement
 * somebody else made, and the honest thing is to use it and say whose it is.
 *
 * Source: Natural Earth, `ne_10m_land`, via the nvkelso/natural-earth-vector
 * repository. Natural Earth is in the public domain and asks for no
 * permission and no attribution; it is credited here anyway, because a
 * project that prints the provenance of every one of its own numbers cannot
 * take somebody else's without saying so.
 *
 * This runs by hand and its output is committed. Nothing in the app fetches
 * anything: hard rule 4 is that there is no runtime network, so the coastline
 * is arithmetic-in-a-file like everything else here. Re-run with:
 *
 *   curl -sSL -o /tmp/ne10.json \
 *     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson
 *   node scripts/coastline.mjs /tmp/ne10.json
 *
 * What it does: clips the world to the frame the sites need, simplifies each
 * ring by Douglas–Peucker, drops what is too small to read at this size, and
 * writes degrees at two decimals — about a kilometre, which is a tenth of a
 * pixel on the map as drawn. The simplification is written out here rather
 * than pulled in, for the same reason the geometry is: the arithmetic is the
 * subject.
 */

import { readFileSync, writeFileSync } from 'node:fs'

/** The frame: the archipelago, cut where the neighbours begin. */
const BBOX = { west: 94, east: 142, south: -12, north: 7 }
/** Degrees a vertex may be moved before it counts. ~1.1 km at the equator. */
const TOLERANCE = 0.012
/** Square degrees below which an island is a speck, not a place. */
const MIN_AREA = 0.004

const src = process.argv[2] ?? '/tmp/ne10.json'
const geo = JSON.parse(readFileSync(src, 'utf8'))

const rings = []
for (const feature of geo.features) {
  const g = feature.geometry
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
  for (const poly of polys) for (const ring of poly) rings.push(ring)
}

/** Sutherland–Hodgman against one edge of the frame. */
function clipEdge(ring, inside, intersect) {
  const out = []
  for (let i = 0; i < ring.length; i++) {
    const cur = ring[i]
    const prev = ring[(i + ring.length - 1) % ring.length]
    const curIn = inside(cur)
    const prevIn = inside(prev)
    if (curIn) {
      if (!prevIn) out.push(intersect(prev, cur))
      out.push(cur)
    } else if (prevIn) {
      out.push(intersect(prev, cur))
    }
  }
  return out
}

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

function clip(ring) {
  let r = ring
  r = clipEdge(r, (p) => p[0] >= BBOX.west, (a, b) => lerp(a, b, (BBOX.west - a[0]) / (b[0] - a[0])))
  if (!r.length) return r
  r = clipEdge(r, (p) => p[0] <= BBOX.east, (a, b) => lerp(a, b, (BBOX.east - a[0]) / (b[0] - a[0])))
  if (!r.length) return r
  r = clipEdge(r, (p) => p[1] >= BBOX.south, (a, b) => lerp(a, b, (BBOX.south - a[1]) / (b[1] - a[1])))
  if (!r.length) return r
  r = clipEdge(r, (p) => p[1] <= BBOX.north, (a, b) => lerp(a, b, (BBOX.north - a[1]) / (b[1] - a[1])))
  return r
}

/** Douglas–Peucker, on the ring opened at its first point. */
function simplify(points, tol) {
  if (points.length < 3) return points
  const keep = new Array(points.length).fill(false)
  keep[0] = true
  keep[points.length - 1] = true
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [lo, hi] = stack.pop()
    const a = points[lo]
    const b = points[hi]
    let worst = -1
    let worstAt = -1
    for (let i = lo + 1; i < hi; i++) {
      const p = points[i]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const len = Math.hypot(dx, dy)
      const d =
        len === 0
          ? Math.hypot(p[0] - a[0], p[1] - a[1])
          : Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
      if (d > worst) {
        worst = d
        worstAt = i
      }
    }
    if (worst > tol && worstAt > 0) {
      keep[worstAt] = true
      stack.push([lo, worstAt], [worstAt, hi])
    }
  }
  return points.filter((_, i) => keep[i])
}

const area = (ring) => {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return Math.abs(a) / 2
}

const round = (n) => Math.round(n * 100) / 100

const kept = []
for (const ring of rings) {
  const lons = ring.map((p) => p[0])
  const lats = ring.map((p) => p[1])
  if (Math.max(...lons) < BBOX.west || Math.min(...lons) > BBOX.east) continue
  if (Math.max(...lats) < BBOX.south || Math.min(...lats) > BBOX.north) continue
  const clipped = clip(ring)
  if (clipped.length < 4) continue
  if (area(clipped) < MIN_AREA) continue
  const simple = simplify(clipped, TOLERANCE).map((p) => [round(p[0]), round(p[1])])
  // Drop consecutive duplicates the rounding created.
  const dedup = simple.filter((p, i) => i === 0 || p[0] !== simple[i - 1][0] || p[1] !== simple[i - 1][1])
  if (dedup.length < 4) continue
  if (area(dedup) < MIN_AREA) continue
  kept.push(dedup)
}

kept.sort((a, b) => area(b) - area(a))

const body = kept.map((r) => `  [${r.map((p) => `[${p[0]},${p[1]}]`).join(',')}],`).join('\n')
const points = kept.reduce((n, r) => n + r.length, 0)

const out = `/**
 * The coastline of the archipelago, as vertices in degrees.
 *
 * Generated by \`scripts/coastline.mjs\` from Natural Earth's \`ne_10m_land\`,
 * which is in the public domain; the script says how to regenerate it and why
 * it is a file rather than a fetch. Clipped to ${BBOX.west}–${BBOX.east}° E and
 * ${BBOX.south}–${BBOX.north}°, simplified to ${TOLERANCE}° — about a kilometre, a
 * tenth of a pixel at the size this is drawn — and cut off at the frame, so the
 * neighbours end where the map does rather than where they do.
 *
 * ${kept.length} rings, ${points} vertices. Do not hand-edit: the point of a
 * measured coastline is that nobody drew it by eye, which is exactly the
 * argument this project makes about its own dimensions.
 *
 * Every ring is a closed loop of [longitude, latitude], east and north
 * positive — the same convention \`lib/solar/position.ts\` reads its sites in,
 * and \`test/geo.test.ts\` holds the two together.
 */

export const FRAME = {
  west: ${BBOX.west},
  east: ${BBOX.east},
  south: ${BBOX.south},
  north: ${BBOX.north},
} as const

export type Ring = readonly (readonly [number, number])[]

export const COASTLINE: readonly Ring[] = [
${body}
]
`

writeFileSync('lib/geo/nusantara.ts', out)
console.log(`${kept.length} rings, ${points} vertices, ${(out.length / 1024).toFixed(0)} kB`)
