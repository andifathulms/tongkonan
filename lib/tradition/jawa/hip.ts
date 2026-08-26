/**
 * A stepped hipped roof, as a stack of rectangles.
 *
 * The other two houses both sweep a transverse section along a ridge that runs
 * the whole length of the building. That is not a general way to make a roof;
 * it is a way to make *their* roof. A hip has a ridge shorter than its
 * building and four planes falling away to a closed rectangular eave, and no
 * amount of sweeping produces one.
 *
 * So this is a second roof primitive standing beside `sweepSurface` rather
 * than a generalisation of it — which is itself the answer to a question the
 * code had been holding open. `minang/roof.ts` asks whether a third house
 * turning the sweep means the axis belongs in `SweepOptions`. The third house
 * declined the ballot: it does not sweep at all.
 *
 * It lives here rather than in the core for the usual reason. One house hips.
 * When a second one does, this moves.
 *
 * Levels run outermost first and ridge last. The ridge is simply the level
 * whose half-extent across the short axis is zero, which is what turns the two
 * end faces of the top band from trapezoids into triangles.
 */

import { computeNormals, emptyMesh, lerp } from '@/lib/core/geometry'
import type { MeshData } from '@/lib/core/geometry'
import type { RoofLevel } from './types'

/** Below this a triangle is a seam rather than a surface, and is not emitted. */
const DEGENERATE = 1e-9

/**
 * The four faces of one band, wound so every normal points out and up.
 *
 * Each face is given its two lower corners in the order they run left to right
 * *as seen from outside that face*, and its two upper corners to match. Get
 * that order wrong on one face of four and the roof has a hole in it that only
 * shows up from one side, which is the kind of fault a render finds and a mesh
 * check does not.
 */
function band(mesh: MeshData, a: RoofLevel, b: RoofLevel, uvScale: number, v0: number, v1: number): void {
  type Corner = readonly [number, number, number]
  const faces: readonly (readonly [Corner, Corner, Corner, Corner])[] = [
    // +X: seen from +X, +Z runs to the left, so the lower edge runs +Z to −Z.
    [
      [a.halfX, a.y, a.halfZ],
      [a.halfX, a.y, -a.halfZ],
      [b.halfX, b.y, -b.halfZ],
      [b.halfX, b.y, b.halfZ],
    ],
    // −X: seen from −X, +Z runs to the right.
    [
      [-a.halfX, a.y, -a.halfZ],
      [-a.halfX, a.y, a.halfZ],
      [-b.halfX, b.y, b.halfZ],
      [-b.halfX, b.y, -b.halfZ],
    ],
    // +Z: seen from +Z, +X runs to the right.
    [
      [-a.halfX, a.y, a.halfZ],
      [a.halfX, a.y, a.halfZ],
      [b.halfX, b.y, b.halfZ],
      [-b.halfX, b.y, b.halfZ],
    ],
    // −Z: seen from −Z, +X runs to the left.
    [
      [a.halfX, a.y, -a.halfZ],
      [-a.halfX, a.y, -a.halfZ],
      [-b.halfX, b.y, -b.halfZ],
      [b.halfX, b.y, -b.halfZ],
    ],
  ]

  for (const [p0, p1, q1, q0] of faces) {
    const base = mesh.positions.length / 3
    const width = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) / uvScale
    for (const [corner, u, v] of [
      [p0, 0, v0],
      [p1, width, v0],
      [q1, width, v1],
      [q0, 0, v1],
    ] as const) {
      mesh.positions.push(corner[0], corner[1], corner[2])
      mesh.normals.push(0, 0, 0) // filled in by computeNormals
      mesh.uvs.push(u, v / uvScale)
    }
    // At the ridge the upper edge has no length, so one of the two triangles
    // collapses. Emitting it would leave a zero-area face and the mesh check
    // is right to refuse those.
    for (const [i, j, k] of [
      [0, 1, 2],
      [0, 2, 3],
    ] as const) {
      if (area(mesh, base + i, base + j, base + k) > DEGENERATE) {
        mesh.indices.push(base + i, base + j, base + k)
      }
    }
  }
}

function area(mesh: MeshData, ia: number, ib: number, ic: number): number {
  const p = (i: number) => [mesh.positions[i * 3] ?? 0, mesh.positions[i * 3 + 1] ?? 0, mesh.positions[i * 3 + 2] ?? 0]
  const [ax, ay, az] = p(ia)
  const [bx, by, bz] = p(ib)
  const [cx, cy, cz] = p(ic)
  const e1 = [(bx ?? 0) - (ax ?? 0), (by ?? 0) - (ay ?? 0), (bz ?? 0) - (az ?? 0)]
  const e2 = [(cx ?? 0) - (ax ?? 0), (cy ?? 0) - (ay ?? 0), (cz ?? 0) - (az ?? 0)]
  return (
    Math.hypot(
      (e1[1] ?? 0) * (e2[2] ?? 0) - (e1[2] ?? 0) * (e2[1] ?? 0),
      (e1[2] ?? 0) * (e2[0] ?? 0) - (e1[0] ?? 0) * (e2[2] ?? 0),
      (e1[0] ?? 0) * (e2[1] ?? 0) - (e1[1] ?? 0) * (e2[0] ?? 0),
    ) * 0.5
  )
}

/** Distance up the slope of one band, measured on the long face. */
export function bandRun(a: RoofLevel, b: RoofLevel): number {
  return Math.hypot(a.halfX - b.halfX, a.y - b.y)
}

/** Total run from the eave to the ridge, for course counts and course bands. */
export function hipRun(levels: readonly RoofLevel[]): number {
  let total = 0
  for (let i = 1; i < levels.length; i++) {
    const a = levels[i - 1]
    const b = levels[i]
    if (a && b) total += bandRun(a, b)
  }
  return total
}

/**
 * The level at a fraction of the way up the slope, 0 at the eave and 1 at the
 * ridge, measured by run rather than by index so the tiers do not have to be
 * equal for a course to sit straight.
 */
export function hipLevelAt(levels: readonly RoofLevel[], f: number): RoofLevel {
  const total = hipRun(levels)
  const first = levels[0]
  const last = levels[levels.length - 1]
  if (!first || !last) throw new Error('a hipped roof needs at least one level')
  let want = Math.max(0, Math.min(1, f)) * total
  for (let i = 1; i < levels.length; i++) {
    const a = levels[i - 1]
    const b = levels[i]
    if (!a || !b) continue
    const run = bandRun(a, b)
    if (want <= run || i === levels.length - 1) {
      const t = run === 0 ? 0 : Math.max(0, Math.min(1, want / run))
      return {
        key: `${a.key}~${b.key}`,
        halfX: lerp(a.halfX, b.halfX, t),
        halfZ: lerp(a.halfZ, b.halfZ, t),
        y: lerp(a.y, b.y, t),
      }
    }
    want -= run
  }
  return last
}

/**
 * Push a level outward along its own surface.
 *
 * Each family of faces has its own pitch — the long faces and the hip ends
 * narrow at different rates whenever the roof is not square — so the plan is
 * offset per axis against the pitch of the faces that own that axis, and the
 * height takes the mean of the two. That last part is an approximation, and
 * it is the right one to make: a course of tiles standing forty-five
 * millimetres proud does not need the two families to agree to a millimetre,
 * and forcing them to would mean two surfaces where the building has one.
 */
function pushed(a: RoofLevel, b: RoofLevel, at: RoofLevel, push: number): RoofLevel {
  if (push === 0) return at
  const dy = b.y - a.y
  const outX = Math.hypot(a.halfX - b.halfX, dy) || 1
  const outZ = Math.hypot(a.halfZ - b.halfZ, dy) || 1
  const riseX = (a.halfX - b.halfX) / outX
  const riseZ = (a.halfZ - b.halfZ) / outZ
  return {
    key: at.key,
    halfX: at.halfX + (push * dy) / outX,
    halfZ: at.halfZ + (push * dy) / outZ,
    y: at.y + push * ((riseX + riseZ) / 2),
  }
}

export interface HipOptions {
  readonly uvScale: number
  /** how far the surface stands off the frame, as a function of f */
  readonly offsetAt?: (f: number) => number
  /** the slice of the slope to build, 0 at the eave and 1 at the ridge */
  readonly fFrom?: number
  readonly fTo?: number
}

/**
 * The skin over a stack of levels, or a band of it.
 *
 * A band is cut by run rather than by tier, so a course of tiles crosses a
 * step in the roof without noticing — which is what a course of tiles does.
 */
export function steppedHip(levels: readonly RoofLevel[], o: HipOptions): MeshData {
  const mesh = emptyMesh()
  if (levels.length < 2) return mesh
  const from = o.fFrom ?? 0
  const to = o.fTo ?? 1
  if (to <= from) return mesh

  // Every real level inside the slice, plus the two cut ends, in order.
  const total = hipRun(levels)
  const marks: number[] = [from]
  let walked = 0
  for (let i = 1; i < levels.length - 1; i++) {
    const a = levels[i - 1]
    const b = levels[i]
    if (!a || !b) continue
    walked += bandRun(a, b)
    const f = total === 0 ? 0 : walked / total
    if (f > from && f < to) marks.push(f)
  }
  marks.push(to)

  for (let i = 1; i < marks.length; i++) {
    const f0 = marks[i - 1] ?? 0
    const f1 = marks[i] ?? 0
    const raw0 = hipLevelAt(levels, f0)
    const raw1 = hipLevelAt(levels, f1)
    const push0 = o.offsetAt ? o.offsetAt(f0) : 0
    const push1 = o.offsetAt ? o.offsetAt(f1) : 0
    band(
      mesh,
      pushed(raw0, raw1, raw0, push0),
      pushed(raw0, raw1, raw1, push1),
      o.uvScale,
      f0 * total,
      f1 * total,
    )
  }

  computeNormals(mesh)
  return mesh
}
