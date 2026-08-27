/**
 * A surface of revolution, and the third roof primitive in this project.
 *
 * `sweepSurface` runs a section along a ridge; `steppedHip` skins a stack of
 * rectangles; this turns an outline about a vertical axis. None of the three
 * is a generalisation of the others, and the useful thing that has emerged
 * from four houses is that there is no single primitive underneath them —
 * there are roof *kinds*, and each one wants its own.
 *
 * It lives here rather than in the core because one house is round. If a
 * second one is, this moves.
 *
 * The profile runs from the ground outward-most first to the apex last, as a
 * radius at a height. The apex is simply the point whose radius is zero, which
 * is what collapses each quad in the top band into a single triangle.
 */

import { computeNormals, emptyMesh, lerp } from '@/lib/core/geometry'
import type { MeshData } from '@/lib/core/geometry'
import type { ConePoint } from './types'

const DEGENERATE = 1e-9

/** Distance along the outline between two points on it. */
export function coneRun(profile: readonly ConePoint[]): number {
  let total = 0
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1]
    const b = profile[i]
    if (a && b) total += Math.hypot(a.r - b.r, a.y - b.y)
  }
  return total
}

/**
 * The point a given fraction of the way up the outline, measured by run
 * rather than by index so a course of thatch sits straight whatever the
 * outline is doing.
 */
export function coneAt(profile: readonly ConePoint[], f: number): ConePoint {
  const total = coneRun(profile)
  const last = profile[profile.length - 1]
  if (!last) throw new Error('a cone needs an outline')
  let want = Math.max(0, Math.min(1, f)) * total
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1]
    const b = profile[i]
    if (!a || !b) continue
    const run = Math.hypot(a.r - b.r, a.y - b.y)
    if (want <= run || i === profile.length - 1) {
      const t = run === 0 ? 0 : Math.max(0, Math.min(1, want / run))
      return { r: lerp(a.r, b.r, t), y: lerp(a.y, b.y, t) }
    }
    want -= run
  }
  return last
}

/**
 * Push a point off the surface, along the outward normal of the outline.
 *
 * Simpler than the hip's version of the same thing, and for a good reason: a
 * surface of revolution has one family of faces rather than four, so there is
 * no pair of pitches to average between and the offset is exact.
 */
function pushed(a: ConePoint, b: ConePoint, at: ConePoint, push: number): ConePoint {
  if (push === 0) return at
  const dr = b.r - a.r
  const dy = b.y - a.y
  const len = Math.hypot(dr, dy) || 1
  return { r: at.r + (push * dy) / len, y: at.y - (push * dr) / len }
}

export interface ConeOptions {
  /** facets around the circumference */
  readonly facets: number
  readonly uvScale: number
  /** how far the surface stands off the frame, as a function of f */
  readonly offsetAt?: (f: number) => number
  /** the slice of the outline to build, 0 at the ground and 1 at the apex */
  readonly fFrom?: number
  readonly fTo?: number
}

export function coneSurface(profile: readonly ConePoint[], o: ConeOptions): MeshData {
  const mesh = emptyMesh()
  if (profile.length < 2 || o.facets < 3) return mesh
  const from = o.fFrom ?? 0
  const to = o.fTo ?? 1
  if (to <= from) return mesh

  // Every real point of the outline inside the slice, plus the two cut ends.
  const total = coneRun(profile)
  const marks: number[] = [from]
  let walked = 0
  for (let i = 1; i < profile.length - 1; i++) {
    const a = profile[i - 1]
    const b = profile[i]
    if (!a || !b) continue
    walked += Math.hypot(a.r - b.r, a.y - b.y)
    const f = total === 0 ? 0 : walked / total
    if (f > from && f < to) marks.push(f)
  }
  marks.push(to)

  const rings = marks.map((f, i) => {
    const raw = coneAt(profile, f)
    const other = coneAt(profile, marks[Math.min(i + 1, marks.length - 1)] ?? f)
    const push = o.offsetAt ? o.offsetAt(f) : 0
    return { point: pushed(raw, other, raw, push), f }
  })

  const stride = o.facets + 1
  for (const ring of rings) {
    for (let k = 0; k <= o.facets; k++) {
      const a = (k / o.facets) * Math.PI * 2
      mesh.positions.push(Math.cos(a) * ring.point.r, ring.point.y, Math.sin(a) * ring.point.r)
      mesh.normals.push(0, 0, 0) // filled in by computeNormals
      mesh.uvs.push(((k / o.facets) * Math.PI * 2 * ring.point.r) / o.uvScale, (ring.f * total) / o.uvScale)
    }
  }

  for (let i = 0; i < rings.length - 1; i++) {
    for (let k = 0; k < o.facets; k++) {
      const a = i * stride + k
      const b = a + 1
      const c = a + stride
      const d = c + 1
      // At the apex the upper ring is a single point, so one of the two
      // triangles has no area. Emitting it would leave a zero-area face and
      // the mesh check is right to refuse those.
      if (area(mesh, a, c, d) > DEGENERATE) mesh.indices.push(a, c, d)
      if (area(mesh, a, d, b) > DEGENERATE) mesh.indices.push(a, d, b)
    }
  }

  computeNormals(mesh)
  return mesh
}

function area(mesh: MeshData, ia: number, ib: number, ic: number): number {
  const at = (i: number) => [
    mesh.positions[i * 3] ?? 0,
    mesh.positions[i * 3 + 1] ?? 0,
    mesh.positions[i * 3 + 2] ?? 0,
  ]
  const [ax, ay, az] = at(ia)
  const [bx, by, bz] = at(ib)
  const [cx, cy, cz] = at(ic)
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
