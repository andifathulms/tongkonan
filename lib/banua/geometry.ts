/**
 * Geometry primitives.
 *
 * Everything here is hand-written on purpose. Generation is the subject of
 * this project, so there is no lofting library, no CSG, no subdivision helper.
 * Pure functions over numbers; no three.js, no DOM.
 */

import type { Vec3 } from './types'

export interface MeshData {
  positions: number[]
  normals: number[]
  uvs: number[]
  indices: number[]
}

export function emptyMesh(): MeshData {
  return { positions: [], normals: [], uvs: [], indices: [] }
}

/* ── Small maths ──────────────────────────────────────────────────────── */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const clamp01 = (v: number) => clamp(v, 0, 1)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/**
 * Uniform Catmull–Rom through a sorted control polygon, evaluated at x.
 * The ends are handled by mirroring the first and last segments, which keeps
 * the tangent at a prow tip pointing along the curve instead of flattening.
 */
export function catmullRom(points: readonly (readonly [number, number])[], x: number): number {
  const n = points.length
  if (n === 0) throw new Error('catmullRom needs control points')
  const first = points[0]
  const last = points[n - 1]
  if (!first || !last) throw new Error('catmullRom needs control points')
  if (n === 1 || x <= first[0]) return first[1]
  if (x >= last[0]) return last[1]

  let i = 0
  for (let k = 0; k < n - 1; k++) {
    const a = points[k]
    const b = points[k + 1]
    if (a && b && x >= a[0] && x <= b[0]) {
      i = k
      break
    }
  }
  const p1 = points[i]
  const p2 = points[i + 1]
  if (!p1 || !p2) throw new Error('catmullRom segment lookup failed')
  const p0 = points[i - 1] ?? ([2 * p1[0] - p2[0], 2 * p1[1] - p2[1]] as const)
  const p3 = points[i + 2] ?? ([2 * p2[0] - p1[0], 2 * p2[1] - p1[1]] as const)

  const span = p2[0] - p1[0]
  const t = span === 0 ? 0 : (x - p1[0]) / span
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
  )
}

/* ── The ridge curve ──────────────────────────────────────────────────── */

export interface RidgeParams {
  /** X of the front (north) prow tip; negative */
  readonly frontX: number
  /** X of the rear (south) prow tip; positive */
  readonly rearX: number
  /** the lowest point of the ridge, at mid-span */
  readonly lowY: number
  readonly frontTipY: number
  readonly rearTipY: number
  /**
   * How much of the rise has happened by quarter-span. Low values keep the
   * belly of the ridge long and shallow and put the upsweep near the tips,
   * which is what makes the profile read as a prow rather than an arch.
   */
  readonly upsweep: number
}

/**
 * The ridge, sampled by `s` running 0 at the front tip to 1 at the rear tip.
 *
 * The curve sags in the interior and rises at both ends, with the front
 * always higher — that ordering is canon and the invariant suite checks it,
 * so it must fall out of the curve rather than being asserted afterwards.
 */
export function ridgeCurve(p: RidgeParams): (s: number) => { x: number; y: number } {
  const control: (readonly [number, number])[] = [
    [0, p.frontTipY],
    [0.25, lerp(p.lowY, p.frontTipY, p.upsweep)],
    [0.5, p.lowY],
    [0.75, lerp(p.lowY, p.rearTipY, p.upsweep)],
    [1, p.rearTipY],
  ]
  return (s: number) => ({
    x: lerp(p.frontX, p.rearX, clamp01(s)),
    y: catmullRom(control, clamp01(s)),
  })
}

/**
 * How wide the roof is at station `s`, as a fraction of its full width.
 *
 * Across the body the roof is at full width. Over the two overhangs it closes
 * down toward the tip, so the prow is a blade rather than a truncated box.
 */
export function prowTaper(s: number, bodyStart: number, bodyEnd: number, tip: number): number {
  const t = clamp01(s)
  if (t >= bodyStart && t <= bodyEnd) return 1
  const f = t < bodyStart ? t / Math.max(bodyStart, 1e-6) : (1 - t) / Math.max(1 - bodyEnd, 1e-6)
  return lerp(tip, 1, smoothstep(f))
}

/* ── Section sweep ────────────────────────────────────────────────────── */

export interface Station {
  readonly x: number
  readonly ridgeY: number
  /** half-width of the roof here, measured on Z */
  readonly halfWidth: number
  readonly eaveY: number
}

export interface SweepOptions {
  /** +1 for the z-positive slope, -1 for the mirrored one */
  readonly side: 1 | -1
  /** samples across the slope, ridge to eave */
  readonly across: number
  /**
   * How far the slope bows out from the straight ridge-to-eave chord. The
   * tongkonan roof is not a flat plane; the courses sit on a slightly convex
   * surface and that is what catches the light along the length.
   */
  readonly bow: number
  /** metres of texture per metre of surface, so grain never stretches */
  readonly uvScale: number
  /** shift the whole surface along its own normal — used for ijuk courses */
  readonly offset?: number
}

/**
 * Sweep a transverse section along the ridge to make one slope of the roof.
 *
 * The surface is a grid, not a fan: an explicit quad per (station, step) so
 * the ijuk courses that sit on it can address the same parameter space.
 */
export function sweepSurface(stations: readonly Station[], o: SweepOptions): MeshData {
  const mesh = emptyMesh()
  const cols = stations.length
  const rows = o.across
  if (cols < 2 || rows < 1) return mesh

  const firstStation = stations[0]
  if (!firstStation) return mesh
  const push = o.offset ?? 0

  for (let i = 0; i < cols; i++) {
    const st = stations[i]
    if (!st) continue
    // The outward normal of this slope in the ZY plane. Courses are offset
    // along it so a lap moves the surface off itself rather than straight up.
    const dz = o.side * st.halfWidth
    const dy = st.eaveY - st.ridgeY
    const len = Math.hypot(dz, dy) || 1
    const outY = Math.abs(dz) / len
    const outZ = -dy * o.side / len

    for (let j = 0; j <= rows; j++) {
      const f = j / rows
      const chordY = lerp(st.ridgeY, st.eaveY, f)
      const bowY = o.bow * Math.sin(Math.PI * f)
      mesh.positions.push(
        st.x,
        chordY + bowY + push * outY,
        o.side * st.halfWidth * f + push * outZ,
      )
      mesh.normals.push(0, 0, 0) // filled in by computeNormals below
      mesh.uvs.push((st.x - firstStation.x) / o.uvScale, (f * st.halfWidth) / o.uvScale)
    }
  }

  const stride = rows + 1
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * stride + j
      const b = a + 1
      const c = a + stride
      const d = c + 1
      // Winding depends on which slope this is, so both faces point outward.
      if (o.side > 0) {
        mesh.indices.push(a, c, b, b, c, d)
      } else {
        mesh.indices.push(a, b, c, b, d, c)
      }
    }
  }

  computeNormals(mesh)
  return mesh
}

/* ── Builders ─────────────────────────────────────────────────────────── */

/**
 * A box as an explicit mesh. Used only where a part must be merged into
 * mesh-space — parts that can stay boxes stay boxes, because the joint
 * invariant needs an exact extent to test against.
 */
export function boxMesh(center: Vec3, size: Vec3, uvScale: number): MeshData {
  const mesh = emptyMesh()
  const [cx, cy, cz] = center
  const [sx, sy, sz] = size
  const hx = sx / 2
  const hy = sy / 2
  const hz = sz / 2

  const faces: { n: Vec3; corners: Vec3[]; u: number; v: number }[] = [
    { n: [0, 0, 1], corners: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], u: sx, v: sy },
    { n: [0, 0, -1], corners: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], u: sx, v: sy },
    { n: [1, 0, 0], corners: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], u: sz, v: sy },
    { n: [-1, 0, 0], corners: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], u: sz, v: sy },
    { n: [0, 1, 0], corners: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], u: sx, v: sz },
    { n: [0, -1, 0], corners: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], u: sx, v: sz },
  ]

  for (const face of faces) {
    const base = mesh.positions.length / 3
    const uv: [number, number][] = [
      [0, 0],
      [face.u / uvScale, 0],
      [face.u / uvScale, face.v / uvScale],
      [0, face.v / uvScale],
    ]
    face.corners.forEach((c, k) => {
      mesh.positions.push(cx + c[0], cy + c[1], cz + c[2])
      mesh.normals.push(face.n[0], face.n[1], face.n[2])
      const t = uv[k] ?? [0, 0]
      mesh.uvs.push(t[0], t[1])
    })
    mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  return mesh
}

/**
 * A tapered tube swept along a polyline with a circular section.
 *
 * This exists for the horns and for nothing else: a buffalo horn is a curve
 * with a shrinking radius, and approximating one with stacked boxes would
 * lose the only property that makes it read as a horn.
 */
export function tubeMesh(
  path: readonly Vec3[],
  radiusAt: (t: number) => number,
  radial: number,
  uvScale: number,
): MeshData {
  const mesh = emptyMesh()
  const n = path.length
  if (n < 2) return mesh

  // A stable reference so the section does not spin along the sweep.
  let up: Vec3 = [0, 1, 0]

  for (let i = 0; i < n; i++) {
    const cur = path[i]
    const prev = path[Math.max(0, i - 1)]
    const next = path[Math.min(n - 1, i + 1)]
    if (!cur || !prev || !next) continue
    let tx = next[0] - prev[0]
    let ty = next[1] - prev[1]
    let tz = next[2] - prev[2]
    const tl = Math.hypot(tx, ty, tz) || 1
    tx /= tl
    ty /= tl
    tz /= tl

    // Re-pick the reference if the tangent has become parallel to it.
    if (Math.abs(tx * up[0] + ty * up[1] + tz * up[2]) > 0.98) up = [1, 0, 0]

    let nx = up[1] * tz - up[2] * ty
    let ny = up[2] * tx - up[0] * tz
    let nz = up[0] * ty - up[1] * tx
    const nl = Math.hypot(nx, ny, nz) || 1
    nx /= nl
    ny /= nl
    nz /= nl

    const bx = ty * nz - tz * ny
    const by = tz * nx - tx * nz
    const bz = tx * ny - ty * nx

    const t = i / (n - 1)
    const r = radiusAt(t)
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * Math.PI * 2
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const ox = nx * ca + bx * sa
      const oy = ny * ca + by * sa
      const oz = nz * ca + bz * sa
      mesh.positions.push(cur[0] + ox * r, cur[1] + oy * r, cur[2] + oz * r)
      mesh.normals.push(ox, oy, oz)
      mesh.uvs.push((k / radial) * (Math.PI * 2 * r) / uvScale, (t * tl * n) / uvScale)
    }
  }

  const stride = radial + 1
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * stride + k
      const b = a + 1
      const c = a + stride
      const d = c + 1
      mesh.indices.push(a, c, b, b, c, d)
    }
  }
  return mesh
}

/* ── Mesh operations ──────────────────────────────────────────────────── */

/** Area-weighted vertex normals, normalised. Degenerate triangles contribute nothing. */
export function computeNormals(mesh: MeshData): void {
  const acc = new Float64Array(mesh.positions.length)
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const ia = (mesh.indices[i] ?? 0) * 3
    const ib = (mesh.indices[i + 1] ?? 0) * 3
    const ic = (mesh.indices[i + 2] ?? 0) * 3
    const ax = mesh.positions[ia] ?? 0
    const ay = mesh.positions[ia + 1] ?? 0
    const az = mesh.positions[ia + 2] ?? 0
    const e1x = (mesh.positions[ib] ?? 0) - ax
    const e1y = (mesh.positions[ib + 1] ?? 0) - ay
    const e1z = (mesh.positions[ib + 2] ?? 0) - az
    const e2x = (mesh.positions[ic] ?? 0) - ax
    const e2y = (mesh.positions[ic + 1] ?? 0) - ay
    const e2z = (mesh.positions[ic + 2] ?? 0) - az
    const cx = e1y * e2z - e1z * e2y
    const cy = e1z * e2x - e1x * e2z
    const cz = e1x * e2y - e1y * e2x
    for (const base of [ia, ib, ic]) {
      acc[base] = (acc[base] ?? 0) + cx
      acc[base + 1] = (acc[base + 1] ?? 0) + cy
      acc[base + 2] = (acc[base + 2] ?? 0) + cz
    }
  }
  for (let i = 0; i < acc.length; i += 3) {
    const x = acc[i] ?? 0
    const y = acc[i + 1] ?? 0
    const z = acc[i + 2] ?? 0
    const l = Math.hypot(x, y, z)
    if (l > 1e-9) {
      mesh.normals[i] = x / l
      mesh.normals[i + 1] = y / l
      mesh.normals[i + 2] = z / l
    } else {
      // A vertex only reached by degenerate triangles still needs a unit
      // normal, because the mesh invariant checks every one of them.
      mesh.normals[i] = 0
      mesh.normals[i + 1] = 1
      mesh.normals[i + 2] = 0
    }
  }
}

/**
 * Mirror across the ridge plane, z = 0.
 *
 * The building is bilaterally symmetric and this is how that is guaranteed
 * rather than hoped for: one side is generated, the other is this function.
 */
export function mirrorZ(mesh: MeshData): MeshData {
  const out: MeshData = {
    positions: mesh.positions.slice(),
    normals: mesh.normals.slice(),
    uvs: mesh.uvs.slice(),
    indices: [],
  }
  for (let i = 2; i < out.positions.length; i += 3) {
    out.positions[i] = -(out.positions[i] ?? 0)
    out.normals[i] = -(out.normals[i] ?? 0)
  }
  // Mirroring reverses handedness, so the winding has to flip back.
  for (let i = 0; i < mesh.indices.length; i += 3) {
    out.indices.push(mesh.indices[i] ?? 0, mesh.indices[i + 2] ?? 0, mesh.indices[i + 1] ?? 0)
  }
  return out
}

export function mergeMeshes(meshes: readonly MeshData[]): MeshData {
  const out = emptyMesh()
  for (const m of meshes) {
    const base = out.positions.length / 3
    out.positions.push(...m.positions)
    out.normals.push(...m.normals)
    out.uvs.push(...m.uvs)
    for (const idx of m.indices) out.indices.push(idx + base)
  }
  return out
}

/* ── Bounds ───────────────────────────────────────────────────────────── */

/**
 * Exact world-axis-aligned half-extents of a rotated box: |R| · halfExtents.
 *
 * A diagonal pad would be simpler and wrong — on a long leaning member like a
 * rafter it reports a bound far larger than the timber, which turns into
 * false invariant failures rather than caught mistakes.
 */
export function rotatedHalfExtents(size: Vec3, rotation?: Vec3): Vec3 {
  const h: Vec3 = [size[0] / 2, size[1] / 2, size[2] / 2]
  if (!rotation) return h
  const [rx, ry, rz] = rotation
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)
  // XYZ-order Euler, matching the renderer's default.
  const m = [
    cy * cz,
    -cy * sz,
    sy,
    sx * sy * cz + cx * sz,
    -sx * sy * sz + cx * cz,
    -sx * cy,
    -cx * sy * cz + sx * sz,
    cx * sy * sz + sx * cz,
    cx * cy,
  ]
  return [
    Math.abs(m[0] ?? 0) * h[0] + Math.abs(m[1] ?? 0) * h[1] + Math.abs(m[2] ?? 0) * h[2],
    Math.abs(m[3] ?? 0) * h[0] + Math.abs(m[4] ?? 0) * h[1] + Math.abs(m[5] ?? 0) * h[2],
    Math.abs(m[6] ?? 0) * h[0] + Math.abs(m[7] ?? 0) * h[1] + Math.abs(m[8] ?? 0) * h[2],
  ]
}
