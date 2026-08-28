/**
 * A house's elevation silhouette, as closed loops in metres.
 *
 * The landing and the front doors need a picture of a house that makes no
 * claim the generator has not already made. A silhouette is that picture: the
 * union of the built parts, projected onto a vertical plane and traced. Every
 * point of it comes from the same part list the invariants run over — nothing
 * is drawn by hand, so nothing here can disagree with the model.
 *
 * The method is a rasterisation: parts are filled into an occupancy grid, the
 * boundary between filled and empty is walked into loops, and the loops are
 * simplified. Exact 2D boolean union of tens of thousands of projected
 * triangles would need a clipping library, and generation stays hand-written;
 * a grid at centimetre resolution is indistinguishable at page scale and is
 * a page of arithmetic instead.
 *
 * Pure, like the rest of the core: no DOM, no SVG strings, no tradition
 * words. The renderer decides what a loop looks like.
 */

import type { AnyHouse, BoxPart, Vec3 } from './types'
import type { Kinds } from './kinds'

export interface Silhouette {
  /** the horizontal world axis the drawing runs along: 0 = X, 2 = Z */
  readonly axis: 0 | 2
  /**
   * Closed loops, metres, y up. Outer boundaries and holes are mixed — the
   * kolong between two posts is a hole and it matters that it reads as one —
   * so a renderer must fill them together with the even-odd rule.
   */
  readonly loops: readonly (readonly (readonly [number, number])[])[]
  readonly min: readonly [number, number]
  readonly max: readonly [number, number]
}

/*
 * The grid resolution, as cells across the house's horizontal extent. This is
 * a tessellation count, not a dimension: it decides how finely the same shape
 * is traced, never what shape it is.
 */
const CELLS_ACROSS = 400

/** XYZ-order Euler rotation applied to a point, matching the box contract. */
function rotate(p: Vec3, r: Vec3): Vec3 {
  let [x, y, z] = p
  const [rx, ry, rz] = r
  // X
  let c = Math.cos(rx)
  let s = Math.sin(rx)
  ;[y, z] = [y * c - z * s, y * s + z * c]
  // Y
  c = Math.cos(ry)
  s = Math.sin(ry)
  ;[x, z] = [x * c + z * s, -x * s + z * c]
  // Z
  c = Math.cos(rz)
  s = Math.sin(rz)
  ;[x, y] = [x * c - y * s, x * s + y * c]
  return [x, y, z]
}

/** The eight world-space corners of a box part. */
function boxCorners(part: BoxPart<Kinds>): Vec3[] {
  const [cx, cy, cz] = part.center
  const [sx, sy, sz] = part.size
  const corners: Vec3[] = []
  for (const dx of [-0.5, 0.5])
    for (const dy of [-0.5, 0.5])
      for (const dz of [-0.5, 0.5]) {
        let p: Vec3 = [dx * sx, dy * sy, dz * sz]
        if (part.rotation) p = rotate(p, part.rotation)
        corners.push([p[0] + cx, p[1] + cy, p[2] + cz])
      }
  return corners
}

/** Convex hull of 2D points, Andrew's monotone chain. */
function hull(points: readonly (readonly [number, number])[]): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length <= 2) return pts.map((p) => [p[0], p[1]])
  const cross = (
    o: readonly [number, number],
    a: readonly [number, number],
    b: readonly [number, number],
  ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: (readonly [number, number])[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop()
    lower.push(p)
  }
  const upper: (readonly [number, number])[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return [...lower, ...upper].map((p) => [p[0], p[1]])
}

interface Grid {
  readonly cols: number
  readonly rows: number
  readonly cell: number
  readonly h0: number
  readonly v0: number
  readonly filled: Uint8Array
}

/**
 * Fill a convex polygon into the grid: a scanline pass over cell centres,
 * plus samples along every edge so a member thinner than a cell still leaves
 * an unbroken mark. Rafters are 50 mm timbers and the grid is coarser than
 * that; without the edge pass they rasterise as dashes.
 */
function fillConvex(grid: Grid, poly: readonly (readonly [number, number])[]): void {
  if (poly.length < 2) return
  const { cols, rows, cell, h0, v0, filled } = grid
  const mark = (x: number, y: number) => {
    const i = Math.floor((x - h0) / cell)
    const j = Math.floor((y - v0) / cell)
    if (i >= 0 && i < cols && j >= 0 && j < rows) filled[j * cols + i] = 1
  }
  let vMin = Infinity
  let vMax = -Infinity
  for (const p of poly) {
    vMin = Math.min(vMin, p[1])
    vMax = Math.max(vMax, p[1])
  }
  const jMin = Math.max(0, Math.floor((vMin - v0) / cell))
  const jMax = Math.min(rows - 1, Math.floor((vMax - v0) / cell))
  for (let j = jMin; j <= jMax; j++) {
    const vy = v0 + (j + 0.5) * cell
    let xMin = Infinity
    let xMax = -Infinity
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k]!
      const q = poly[(k + 1) % poly.length]!
      if (p[1] <= vy !== q[1] <= vy) {
        const x = p[0] + ((vy - p[1]) / (q[1] - p[1])) * (q[0] - p[0])
        xMin = Math.min(xMin, x)
        xMax = Math.max(xMax, x)
      }
    }
    if (xMin > xMax) continue
    const iMin = Math.max(0, Math.round((xMin - h0) / cell - 0.5))
    const iMax = Math.min(cols - 1, Math.round((xMax - h0) / cell - 0.5))
    for (let i = iMin; i <= iMax; i++) filled[j * cols + i] = 1
  }
  for (let k = 0; k < poly.length; k++) {
    const p = poly[k]!
    const q = poly[(k + 1) % poly.length]!
    const steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / (cell * 0.5)))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      mark(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
    }
  }
}

/**
 * Trace the filled/empty boundary into closed loops.
 *
 * Each filled cell contributes its exposed sides as directed segments,
 * counter-clockwise around the cell, so the filled region is always on the
 * left of travel and shared sides cancel. Where two regions touch only at a
 * corner, four segments meet at one vertex; taking the sharpest left turn
 * keeps the regions separate instead of pinching them into one crossing loop.
 */
function traceLoops(grid: Grid): number[][][] {
  const { cols, rows, filled } = grid
  const vcols = cols + 1
  const key = (i: number, j: number) => j * vcols + i
  // outgoing segments per start vertex: packed end-vertex keys
  const out = new Map<number, number[]>()
  const push = (a: number, b: number) => {
    const list = out.get(a)
    if (list) list.push(b)
    else out.set(a, [b])
  }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      if (!filled[j * cols + i]) continue
      if (j === 0 || !filled[(j - 1) * cols + i]) push(key(i, j), key(i + 1, j)) // bottom, +x
      if (i === cols - 1 || !filled[j * cols + i + 1]) push(key(i + 1, j), key(i + 1, j + 1)) // right, +y
      if (j === rows - 1 || !filled[(j + 1) * cols + i]) push(key(i + 1, j + 1), key(i, j + 1)) // top, -x
      if (i === 0 || !filled[j * cols + i - 1]) push(key(i, j + 1), key(i, j)) // left, -y
    }
  const loops: number[][][] = []
  for (const [start] of out) {
    let list = out.get(start)
    while (list && list.length > 0) {
      const loop: number[][] = []
      let prev = start
      let curr = list.pop()!
      loop.push([start % vcols, Math.floor(start / vcols)])
      while (curr !== start) {
        loop.push([curr % vcols, Math.floor(curr / vcols)])
        const candidates = out.get(curr)
        if (!candidates || candidates.length === 0) break // should not happen; degrees balance
        let pick = 0
        if (candidates.length > 1) {
          // sharpest left turn relative to the incoming direction
          const di = (curr % vcols) - (prev % vcols)
          const dj = Math.floor(curr / vcols) - Math.floor(prev / vcols)
          let best = -Infinity
          for (let c = 0; c < candidates.length; c++) {
            const n = candidates[c]!
            const ei = (n % vcols) - (curr % vcols)
            const ej = Math.floor(n / vcols) - Math.floor(curr / vcols)
            // left turn scores above straight scores above right turn
            const score = di * ej - dj * ei - 0.5 * (di * ei + dj * ej)
            if (score > best) {
              best = score
              pick = c
            }
          }
        }
        prev = curr
        curr = candidates.splice(pick, 1)[0]!
      }
      loops.push(loop)
      list = out.get(start)
    }
  }
  return loops
}

/** Drop points that are collinear with their neighbours, then Douglas-Peucker. */
function simplify(loop: number[][], epsilon: number): number[][] {
  // collapse axis-aligned runs first so the recursion sees short input
  const runs: number[][] = []
  for (let i = 0; i < loop.length; i++) {
    const a = loop[(i + loop.length - 1) % loop.length]!
    const b = loop[i]!
    const c = loop[(i + 1) % loop.length]!
    const cross = (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!)
    if (cross !== 0) runs.push(b)
  }
  if (runs.length < 4) return runs
  const dist = (p: number[], a: number[], b: number[]) => {
    const dx = b[0]! - a[0]!
    const dy = b[1]! - a[1]!
    const len = Math.hypot(dx, dy)
    if (len === 0) return Math.hypot(p[0]! - a[0]!, p[1]! - a[1]!)
    return Math.abs((p[0]! - a[0]!) * dy - (p[1]! - a[1]!) * dx) / len
  }
  const rdp = (pts: number[][], from: number, to: number, keep: boolean[]) => {
    let worst = -1
    let worstD = epsilon
    for (let i = from + 1; i < to; i++) {
      const d = dist(pts[i]!, pts[from]!, pts[to]!)
      if (d > worstD) {
        worstD = d
        worst = i
      }
    }
    if (worst >= 0) {
      keep[worst] = true
      rdp(pts, from, worst, keep)
      rdp(pts, worst, to, keep)
    }
  }
  const keep = runs.map(() => false)
  keep[0] = true
  keep[Math.floor(runs.length / 2)] = true
  rdp(runs, 0, Math.floor(runs.length / 2), keep)
  rdp(runs, Math.floor(runs.length / 2), runs.length - 1, keep)
  keep[runs.length - 1] = true
  return runs.filter((_, i) => keep[i])
}

/**
 * The silhouette of a built house on a vertical plane.
 *
 * `axis` is the horizontal axis the drawing runs along — pass the scene
 * model's ridge axis so the ridge profile faces the reader, or 0 for a house
 * with none, where every vertical cut is the same cut.
 */
export function silhouette(house: AnyHouse, axis: 0 | 2): Silhouette {
  const h0 = house.bounds.min[axis]
  const h1 = house.bounds.max[axis]
  const v0 = house.bounds.min[1]
  const v1 = house.bounds.max[1]
  const cell = (h1 - h0) / CELLS_ACROSS
  const cols = CELLS_ACROSS + 2
  const rows = Math.ceil((v1 - v0) / cell) + 2
  const grid: Grid = { cols, rows, cell, h0, v0, filled: new Uint8Array(cols * rows) }

  for (const part of house.parts) {
    if (part.kind === 'box') {
      fillConvex(
        grid,
        hull(boxCorners(part).map((c) => [c[axis], c[1]] as const)),
      )
    } else {
      const pos = part.positions
      const idx = part.indices
      for (let t = 0; t < idx.length; t += 3) {
        const tri: [number, number][] = []
        for (let v = 0; v < 3; v++) {
          const base = idx[t + v]! * 3
          tri.push([pos[base + axis]!, pos[base + 1]!])
        }
        fillConvex(grid, tri)
      }
    }
  }

  const raw = traceLoops(grid)
  const loops: [number, number][][] = []
  let min: [number, number] = [Infinity, Infinity]
  let max: [number, number] = [-Infinity, -Infinity]
  for (const loop of raw) {
    const slim = simplify(loop, 1.2)
    if (slim.length < 3) continue
    const metres = slim.map(
      (p) => [h0 + p[0]! * cell, v0 + p[1]! * cell] as [number, number],
    )
    for (const [x, y] of metres) {
      min = [Math.min(min[0], x), Math.min(min[1], y)]
      max = [Math.max(max[0], x), Math.max(max[1], y)]
    }
    loops.push(metres)
  }
  return { axis, loops, min, max }
}
