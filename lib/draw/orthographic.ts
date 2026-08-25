/**
 * Orthographic line drawings: plan, elevation, long section.
 *
 * Pure, like the rest of `lib/` — it emits an SVG string and never touches
 * the DOM. This is the register the whole app is drawn in, so being able to
 * take the drawing away as lines rather than as a screenshot of a render is
 * the point: a measured drawing is checkable, and a shaded image is not.
 *
 * Hidden-line removal is not attempted. Drafting convention does the work
 * instead: what the cut plane passes through is drawn heavy, what lies beyond
 * it is drawn light. That is how a section is read on paper, and it is honest
 * about being a line drawing rather than pretending to be a photograph.
 */

import type { House, Layout, Part } from '../banua/types'
import { roofStations } from '../banua/roof'
import { slopeDrop } from '../banua/geometry'
import { provenanceSplit } from '../banua/rules'

export type Projection = 'denah' | 'tampak' | 'potongan'

type Point = readonly [number, number]
type Polyline = readonly Point[]

interface Line {
  readonly points: Polyline
  readonly weight: 'cut' | 'beyond' | 'annotation'
}

const PIGMENT = { ink: '#17150F', film: '#D8D7CD', muted: '#6B675C', rara: '#8E3B25' }

/* ── Projection ───────────────────────────────────────────────────────── */

/**
 * Metres to page millimetres at 1:50, so the numbers in the file are the
 * numbers a ruler would give on a printed sheet.
 */
const SCALE = 1000 / 50
const MARGIN = 18

function project(p: readonly [number, number, number], view: Projection): Point {
  const [x, y, z] = p
  switch (view) {
    // Plan: north at the top. North is −X, so page-down is +X.
    case 'denah':
      return [z * SCALE, x * SCALE]
    // North elevation: looking south at the front face.
    case 'tampak':
      return [z * SCALE, -y * SCALE]
    // Long section on the ridge plane, north to the left.
    default:
      return [x * SCALE, -y * SCALE]
  }
}

/* ── Parts ────────────────────────────────────────────────────────────── */

function boxCorners(part: Extract<Part, { kind: 'box' }>): [number, number, number][] {
  const [hx, hy, hz] = [part.size[0] / 2, part.size[1] / 2, part.size[2] / 2]
  const r = part.rotation
  const out: [number, number, number][] = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        let [x, y, z] = [sx * hx, sy * hy, sz * hz]
        if (r) {
          const y1 = y * Math.cos(r[0]) - z * Math.sin(r[0])
          const z1 = y * Math.sin(r[0]) + z * Math.cos(r[0])
          const x2 = x * Math.cos(r[1]) + z1 * Math.sin(r[1])
          const z2 = -x * Math.sin(r[1]) + z1 * Math.cos(r[1])
          x = x2 * Math.cos(r[2]) - y1 * Math.sin(r[2])
          y = x2 * Math.sin(r[2]) + y1 * Math.cos(r[2])
          z = z2
        }
        out.push([part.center[0] + x, part.center[1] + y, part.center[2] + z])
      }
    }
  }
  return out
}

/** The twelve edges of a box, by corner index in the order boxCorners emits. */
const BOX_EDGES: [number, number][] = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [4, 5], [5, 7], [7, 6], [6, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

/**
 * Whether a part belongs in this drawing.
 *
 * An elevation shows what can be seen from in front, not everything that
 * exists behind. There is no hidden-line removal here, so without this the
 * sixteen ranks of rafters project onto one another and the sheet becomes
 * hatching. A published elevation draws the outline and the front face; that
 * is the convention being followed rather than a shortcut around one.
 */
function visibleIn(part: Part, layout: Layout, view: Projection): boolean {
  if (view !== 'tampak') return true
  if (part.id.startsWith('kasau') || part.id.startsWith('gording')) return false
  if (part.kind !== 'box') return true
  const [hx] = [Math.abs(part.size[0] / 2)]
  // Anything reaching the front face of the body, plus the tulak somba, which
  // stands out in front of everything.
  return part.center[0] - hx <= -layout.bodyLength / 2 + 0.25
}

/**
 * Where the cut plane is, for each projection. Plan cuts through the living
 * floor, so the drawing shows the bays and the posts that divide them;
 * elevation has no cut; the long section cuts on the ridge plane.
 */
function cutPlane(view: Projection, layout: Layout): { axis: 0 | 1 | 2; at: number } | null {
  if (view === 'denah') return { axis: 1, at: layout.deckY + layout.wallHeight * 0.4 }
  if (view === 'potongan') return { axis: 2, at: 0 }
  return null
}

function linesForParts(house: House, layout: Layout, view: Projection): Line[] {
  const plane = cutPlane(view, layout)
  const lines: Line[] = []

  for (const part of house.parts) {
    // Mesh parts are the roof and the horns. Drawing their triangle edges
    // would bury the drawing in hatching, so they are represented by their
    // generating curves further down instead.
    if (part.kind !== 'box') {
      // The horns are the one mesh that has to appear in an elevation: the
      // tally is what a person reads off the façade, and a drawing that
      // leaves it out has dropped the point of the façade.
      if (view === 'tampak' && part.stage === 'tanduk') {
        const hull = convexHull(
          chunk(part.positions).map((v) => project(v, view)),
        )
        if (hull.length > 2) lines.push({ points: [...hull, hull[0] as Point], weight: 'cut' })
      }
      continue
    }
    if (!visibleIn(part, layout, view)) continue

    const corners = boxCorners(part)
    let weight: Line['weight'] = 'beyond'
    if (plane) {
      let lo = Infinity
      let hi = -Infinity
      for (const c of corners) {
        const v = c[plane.axis]
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
      // Beyond the far side of the cut: not in this drawing at all.
      if (view === 'potongan' && lo > plane.at) continue
      if (view === 'denah' && lo > plane.at) continue
      weight = lo <= plane.at && hi >= plane.at ? 'cut' : 'beyond'
    } else if (view === 'tampak') {
      // Everything that survived the visibility filter is the front face.
      weight = 'cut'
    }

    for (const [a, b] of BOX_EDGES) {
      const ca = corners[a]
      const cb = corners[b]
      if (!ca || !cb) continue
      lines.push({ points: [project(ca, view), project(cb, view)], weight })
    }
  }
  return lines
}

/**
 * The roof, as the curves that generated it: the ridge, the knee where the
 * pitch breaks, and the eave. Three lines say more about this roof than a
 * thousand projected triangles would.
 */
function linesForRoof(layout: Layout, view: Projection): Line[] {
  const stations = roofStations(layout)
  const knee = { at: layout.breakFraction, drop: layout.kneeDrop }
  const lines: Line[] = []

  const curve = (
    f: number | 'ridge',
    side: 1 | -1,
    weight: Line['weight'],
  ): Line => ({
    weight,
    points: stations.map((st) => {
      const frac = f === 'ridge' ? 0 : f
      const y = st.ridgeY - (st.ridgeY - st.eaveY) * slopeDrop(frac, knee)
      const z = side * st.halfWidth * frac
      return project([st.x, y, z], view)
    }),
  })

  if (view === 'tampak') {
    /*
     * The silhouette of a tongkonan seen from the north is not a gable. It is
     * the eave sweeping back and outward from the prow tip: the wing. So the
     * outline is the eave line over the front overhang, projected, and the
     * ridge running down the middle behind it.
     */
    const front = stations.filter((st) => st.x <= -layout.bodyLength / 2)
    const wing = (f: number, side: 1 | -1, weight: Line['weight']): Line => ({
      weight,
      points: front.map((st) => {
        const y = st.ridgeY - (st.ridgeY - st.eaveY) * slopeDrop(f, knee)
        return project([st.x, y, side * st.halfWidth * f], view)
      }),
    })
    for (const side of [1, -1] as const) {
      lines.push(wing(1, side, 'cut'))
      lines.push(wing(layout.breakFraction, side, 'beyond'))
    }
    // The ridge, seen end-on: a vertical from the prow tip down to the body.
    lines.push({
      weight: 'cut',
      points: front.map((st) => project([st.x, st.ridgeY, 0], view)),
    })
    // The transverse profile where the roof meets the body, behind it all.
    const atBody = stations.find((st) => st.x >= -layout.bodyLength / 2)
    if (atBody) {
      const profile: Point[] = []
      for (let i = 0; i <= 24; i++) {
        const f = i / 24
        const y = atBody.ridgeY - (atBody.ridgeY - atBody.eaveY) * slopeDrop(f, knee)
        profile.unshift(project([atBody.x, y, -atBody.halfWidth * f], view))
        profile.push(project([atBody.x, y, atBody.halfWidth * f], view))
      }
      lines.push({ points: profile, weight: 'beyond' })
    }
    return lines
  }

  lines.push(curve('ridge', 1, view === 'potongan' ? 'cut' : 'cut'))
  if (view === 'denah') {
    for (const side of [1, -1] as const) {
      lines.push(curve(1, side, 'cut'))
      lines.push(curve(layout.breakFraction, side, 'beyond'))
    }
  } else {
    // In the long section the eave is behind the cut, so it draws light.
    lines.push(curve(1, -1, 'beyond'))
  }
  return lines
}

/* ── Annotation ───────────────────────────────────────────────────────── */

function annotations(house: House, layout: Layout, view: Projection): Line[] {
  const lines: Line[] = []
  if (view !== 'potongan') return lines
  // The three vertical zones, as extension lines running past the building.
  const over = 1.4
  const x0 = layout.frontProwX - over
  const x1 = layout.rearProwX + over
  const maxY = house.bounds.max[1]
  for (const y of [0, layout.floorFrameY, layout.deckY, layout.plateY, maxY]) {
    lines.push({
      weight: 'annotation',
      points: [project([x0, y, 0], view), project([x1, y, 0], view)],
    })
  }
  return lines
}

/* ── SVG ──────────────────────────────────────────────────────────────── */

const STROKE: Record<Line['weight'], { width: number; colour: string; dash?: string }> = {
  cut: { width: 1.1, colour: PIGMENT.ink },
  beyond: { width: 0.35, colour: PIGMENT.muted },
  annotation: { width: 0.3, colour: PIGMENT.muted, dash: '4 3' },
}

export interface DrawingOptions {
  readonly locale: 'id' | 'en'
}

export function drawOrthographic(
  house: House,
  layout: Layout,
  view: Projection,
  options: DrawingOptions,
): string {
  const lines = [
    ...linesForParts(house, layout, view),
    ...linesForRoof(layout, view),
    ...annotations(house, layout, view),
  ]

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const line of lines) {
    for (const [x, y] of line.points) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (!Number.isFinite(minX)) return ''

  const titleHeight = 30
  // The title block sets a floor on the sheet width: a narrow elevation would
  // otherwise squeeze the provenance note under the scale bar, and that note
  // is the one thing on the sheet that must not be hard to read.
  const drawn = maxX - minX + MARGIN * 2
  const width = Math.max(205, drawn)
  const height = maxY - minY + MARGIN * 2 + titleHeight
  const ox = MARGIN - minX + (width - drawn) / 2
  const oy = MARGIN - minY

  const paths = lines
    .map((line) => {
      const s = STROKE[line.weight]
      const d = line.points
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${(x + ox).toFixed(2)} ${(y + oy).toFixed(2)}`)
        .join(' ')
      return `<path d="${d}" fill="none" stroke="${s.colour}" stroke-width="${s.width}"${
        s.dash ? ` stroke-dasharray="${s.dash}"` : ''
      } stroke-linecap="round" stroke-linejoin="round"/>`
    })
    .join('\n')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(1)}mm" height="${height.toFixed(1)}mm" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}">`,
    `<rect width="100%" height="100%" fill="${PIGMENT.film}"/>`,
    paths,
    titleBlock(house, layout, view, options, width, height, titleHeight),
    '</svg>',
  ].join('\n')
}

/**
 * The title block, bottom of the sheet.
 *
 * It carries the provenance split, because a drawing that leaves the room
 * without saying how much of it is the author's own guess is the failure mode
 * this whole project exists to avoid.
 */
function titleBlock(
  house: House,
  layout: Layout,
  view: Projection,
  options: DrawingOptions,
  width: number,
  height: number,
  titleHeight: number,
): string {
  const id = options.locale === 'id'
  const top = height - titleHeight
  const split = provenanceSplit(layout.dims)
  const pct = Math.round((split.interpolated / Math.max(1, split.total)) * 100)

  const names: Record<Projection, [string, string]> = {
    denah: ['Denah', 'Plan'],
    tampak: ['Tampak muka (utara)', 'Front elevation (north)'],
    potongan: ['Potongan memanjang', 'Long section'],
  }
  const label = names[view][id ? 0 : 1]

  const rules = `${house.rules.rank} · ${house.rules.bays} ${id ? 'ruang' : 'bays'} · ${house.rules.horns} ${id ? 'tanduk' : 'horns'}`
  const note = id
    ? `${pct}% dari ukuran pada gambar ini adalah perkiraan penulis, bukan hasil ukur.`
    : `${pct}% of the dimensions in this drawing are the author's own, not measured.`

  // A 5 m bar, drawn at the same scale as the drawing.
  const barLength = 5 * SCALE
  const barX = width - MARGIN - barLength

  const t = (x: number, y: number, size: number, colour: string, text: string, anchor = 'start') =>
    `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${size}" fill="${colour}" text-anchor="${anchor}">${escapeXml(text)}</text>`

  return [
    `<line x1="${MARGIN}" y1="${top.toFixed(2)}" x2="${(width - MARGIN).toFixed(2)}" y2="${top.toFixed(2)}" stroke="${PIGMENT.ink}" stroke-width="0.5"/>`,
    t(MARGIN, top + 7, 4.4, PIGMENT.ink, `TONGKONAN — ${label.toUpperCase()}`),
    t(width - MARGIN, top + 7, 3.4, PIGMENT.muted, '1:50', 'end'),
    t(MARGIN, top + 14, 3.4, PIGMENT.muted, rules),
    `<path d="M${barX.toFixed(2)} ${(top + 10).toFixed(2)} v3 M${barX.toFixed(2)} ${(top + 11.5).toFixed(2)} h${barLength.toFixed(2)} M${(barX + barLength).toFixed(2)} ${(top + 10).toFixed(2)} v3" stroke="${PIGMENT.ink}" stroke-width="0.4" fill="none"/>`,
    t(width - MARGIN, top + 16.5, 3.2, PIGMENT.muted, '5 m', 'end'),
    t(MARGIN, top + 23, 3.4, PIGMENT.rara, note),
  ].join('\n')
}

function chunk(flat: readonly number[]): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let i = 0; i + 2 < flat.length; i += 3) {
    out.push([flat[i] ?? 0, flat[i + 1] ?? 0, flat[i + 2] ?? 0])
  }
  return out
}

/** Monotone chain. Used only for mesh silhouettes in elevation. */
function convexHull(points: readonly Point[]): Point[] {
  if (points.length < 3) return [...points]
  const sorted = [...points].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]))
  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const build = (src: readonly Point[]): Point[] => {
    const stack: Point[] = []
    for (const p of src) {
      while (stack.length >= 2) {
        const a = stack[stack.length - 2]
        const b = stack[stack.length - 1]
        if (a && b && cross(a, b, p) <= 0) stack.pop()
        else break
      }
      stack.push(p)
    }
    stack.pop()
    return stack
  }
  return [...build(sorted), ...build([...sorted].reverse())]
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Suggested file name. No timestamp: the drawing is a function of the rules. */
export function drawingFileName(house: House, view: Projection): string {
  return `tongkonan-${view}-${house.rules.rank}-${house.rules.bays}ruang-${house.rules.horns}tanduk.svg`
}
