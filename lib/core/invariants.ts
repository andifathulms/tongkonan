/**
 * The checks that hold of any house, whatever tradition built it.
 *
 * There is no measured drawing yet, so correctness cannot rest on comparing
 * the model to a survey. It rests on structural truth instead — and the
 * structural truths split cleanly in two. Some of them are claims about one
 * building ("the ridge sags, the front prow is highest"); those belong to the
 * tradition that makes them. The rest are claims about building at all: that
 * the thing is symmetric, that every tenon is inside its mortise, that
 * nothing was placed before what carries it, that the meshes are sound, and
 * that every part says where its numbers came from. Those are here, and they
 * are generic because they were never Toraja in the first place.
 *
 * A failing invariant fails the build. `checkAgainstSurvey` reports skipped
 * and stays skipped — it is the only check here that cannot be satisfied by
 * writing better code, and that is exactly why it is kept.
 */

import type { Kinds, RulePack } from './kinds'
import type { Bounds, House, Part, Vec3 } from './types'
import { rotatedHalfExtents } from './geometry'
import { partClass } from './provenance'
export type CheckStatus = 'pass' | 'fail' | 'skip'

export interface CheckResult {
  readonly key: string
  readonly titleId: string
  readonly titleEn: string
  readonly status: CheckStatus
  /**
   * What was measured, in words and numbers. Shown as-is in the UI.
   *
   * Both locales, like the title above it. The numbers are identical; only
   * the words around them differ. A check whose verdict a reader cannot read
   * is not evidence to that reader, and /sumber exists to be checked.
   */
  readonly detail: string
  readonly detailEn: string
}

const TOL = 1e-4

/* ── AABB helpers ─────────────────────────────────────────────────────── */

export function partBounds<K extends Kinds>(part: Part<K>): Bounds {
  if (part.kind === 'box') {
    const h = rotatedHalfExtents(part.size, part.rotation)
    return {
      min: [part.center[0] - h[0], part.center[1] - h[1], part.center[2] - h[2]],
      max: [part.center[0] + h[0], part.center[1] + h[1], part.center[2] + h[2]],
    }
  }
  const mn: number[] = [Infinity, Infinity, Infinity]
  const mx: number[] = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < part.positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = part.positions[i + a] ?? 0
      if (v < (mn[a] ?? Infinity)) mn[a] = v
      if (v > (mx[a] ?? -Infinity)) mx[a] = v
    }
  }
  return {
    min: [mn[0] ?? 0, mn[1] ?? 0, mn[2] ?? 0],
    max: [mx[0] ?? 0, mx[1] ?? 0, mx[2] ?? 0],
  }
}

function overlaps(a: Bounds, b: Bounds, pad: number): boolean {
  for (let i = 0; i < 3; i++) {
    const amin = a.min[i] ?? 0
    const amax = a.max[i] ?? 0
    const bmin = b.min[i] ?? 0
    const bmax = b.max[i] ?? 0
    if (amax + pad < bmin || bmax + pad < amin) return false
  }
  return true
}

function contains(outer: Bounds, at: Vec3, half: Vec3, pad: number): boolean {
  for (let i = 0; i < 3; i++) {
    const lo = (at[i] ?? 0) - (half[i] ?? 0)
    const hi = (at[i] ?? 0) + (half[i] ?? 0)
    if (lo < (outer.min[i] ?? 0) - pad) return false
    if (hi > (outer.max[i] ?? 0) + pad) return false
  }
  return true
}

/** Every vertex of a part in world space — box corners included. */
function partVertices<K extends Kinds>(part: Part<K>): number[] {
  if (part.kind === 'mesh') return part.positions.slice()
  const out: number[] = []
  const [hx, hy, hz] = [part.size[0] / 2, part.size[1] / 2, part.size[2] / 2]
  const r = part.rotation
  const c = r ? [Math.cos(r[0]), Math.cos(r[1]), Math.cos(r[2])] : [1, 1, 1]
  const s = r ? [Math.sin(r[0]), Math.sin(r[1]), Math.sin(r[2])] : [0, 0, 0]
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        let [x, y, z] = [sx * hx, sy * hy, sz * hz]
        if (r) {
          // XYZ order, matching the renderer and rotatedHalfExtents.
          const y1 = y * (c[0] ?? 1) - z * (s[0] ?? 0)
          const z1 = y * (s[0] ?? 0) + z * (c[0] ?? 1)
          const x2 = x * (c[1] ?? 1) + z1 * (s[1] ?? 0)
          const z2 = -x * (s[1] ?? 0) + z1 * (c[1] ?? 1)
          const x3 = x2 * (c[2] ?? 1) - y1 * (s[2] ?? 0)
          const y3 = x2 * (s[2] ?? 0) + y1 * (c[2] ?? 1)
          x = x3
          y = y3
          z = z2
        }
        out.push(part.center[0] + x, part.center[1] + y, part.center[2] + z)
      }
    }
  }
  return out
}

/* ── The checks ───────────────────────────────────────────────────────── */

/**
 * What a symmetry check has to be told.
 *
 * The plane was hardcoded at z = 0 while there was one house, and the label
 * said "the ridge plane" because for that house the mirror plane and the
 * ridge plane are the same thing. The second house says otherwise: its ridge
 * runs along Z and the mirror plane cuts across it, so the plane is right and
 * the words are wrong. Hence the label.
 *
 * `include` is the harder one, and it is not a way of excusing parts that
 * fail. Some houses are symmetric in the frame and deliberately asymmetric in
 * something the frame carries — a tally that grows from one end is a fact
 * about the household, not a defect in the building — and a check that
 * swallowed both would either be false or have to be softened until it said
 * nothing. Scoping it says the true thing instead, and the count of what was
 * left out is printed in the verdict so the narrowing is never silent.
 */
export interface SymmetryOptions<K extends Kinds> {
  /** which axis the mirror negates. 0 = X, 1 = Y, 2 = Z. Defaults to Z. */
  readonly axis?: 0 | 1 | 2
  /** which parts the claim is made over. Defaults to all of them. */
  readonly include?: (part: Part<K>) => boolean
  /** what to call the plane, in each locale. */
  readonly labelId?: string
  readonly labelEn?: string
}

/**
 * Bilateral symmetry about a plane through the origin.
 *
 * Checked over the aggregate vertex set rather than by pairing parts, because
 * a mirrored box and its twin have different Euler angles while occupying
 * mirrored volumes. What must be symmetric is the building, not the bookkeeping.
 */
export function checkSymmetry<K extends Kinds>(
  house: House<K>,
  opts: SymmetryOptions<K> = {},
): CheckResult {
  const axis = opts.axis ?? 2
  const labelId = opts.labelId ?? 'bidang cermin'
  const labelEn = opts.labelEn ?? 'the mirror plane'
  const scoped = house.parts.filter((p) => (opts.include ? opts.include(p) : true))

  const cell = 0.002
  const buckets = new Map<string, number[]>()
  const all: number[] = []
  for (const part of scoped) all.push(...partVertices(part))

  /** The bucket key of a point, with `flip` negating the mirrored axis. */
  const key = (i: number, d: readonly [number, number, number], flip: boolean) => {
    const c = [0, 0, 0]
    for (let a = 0; a < 3; a++) {
      const v = (all[i + a] ?? 0) * (flip && a === axis ? -1 : 1)
      c[a] = Math.round(v / cell) + (d[a] ?? 0)
    }
    return `${c[0]}|${c[1]}|${c[2]}`
  }
  const ZERO = [0, 0, 0] as const

  for (let i = 0; i < all.length; i += 3) {
    const k = key(i, ZERO, false)
    const list = buckets.get(k)
    if (list) list.push(i)
    else buckets.set(k, [i])
  }

  let worst = 0
  let orphan = 0
  for (let i = 0; i < all.length; i += 3) {
    if (Math.abs(all[i + axis] ?? 0) < cell) continue // on the plane; its own mirror
    let best = Infinity
    // Search the bucket the mirror should land in and its neighbours, so a
    // vertex sitting on a cell boundary is not reported as asymmetric.
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = buckets.get(key(i, [dx, dy, dz], true))
          if (!list) continue
          for (const j of list) {
            let sum = 0
            for (let a = 0; a < 3; a++) {
              const mirrored = (all[i + a] ?? 0) * (a === axis ? -1 : 1)
              sum += ((all[j + a] ?? 0) - mirrored) ** 2
            }
            const d = Math.sqrt(sum)
            if (d < best) best = d
          }
        }
      }
    }
    if (best > 0.005) orphan++
    if (best < Infinity && best > worst) worst = best
  }

  // Named when it is not everything, so a narrowed claim never reads as a
  // whole-building one.
  const scopeId =
    scoped.length === house.parts.length ? '' : ` (${scoped.length} dari ${house.parts.length} bagian)`
  const scopeEn =
    scoped.length === house.parts.length ? '' : ` (${scoped.length} of ${house.parts.length} parts)`

  return {
    key: 'symmetry',
    titleId: `Simetri terhadap ${labelId}`,
    titleEn: `Bilateral symmetry about ${labelEn}`,
    status: orphan === 0 ? 'pass' : 'fail',
    detail:
      orphan === 0
        ? `${all.length / 3} titik${scopeId}; simpangan cermin terbesar ${(worst * 1000).toFixed(2)} mm.`
        : `${orphan} titik tanpa pasangan cermin dalam 5 mm${scopeId}.`,
    detailEn:
      orphan === 0
        ? `${all.length / 3} points${scopeEn}; largest mirror deviation ${(worst * 1000).toFixed(2)} mm.`
        : `${orphan} points with no mirror partner within 5 mm${scopeEn}.`,
  }
}

/**
 * Every tenon inside its mortise, both parts present.
 *
 * The house is built without nails, so a joint that does not engage is not a
 * detail that looks slightly wrong — it is a house that falls down.
 */
export function checkJoints<K extends Kinds>(house: House<K>): CheckResult {
  const byId = new Map(house.parts.map((p) => [p.id, p]))
  const bounds = new Map(house.parts.map((p) => [p.id, partBounds(p)]))
  const missing: string[] = []
  const loose: string[] = []

  for (const joint of house.joints) {
    const m = byId.get(joint.mortise)
    const t = byId.get(joint.tenon)
    if (!m || !t) {
      missing.push(joint.id)
      continue
    }
    const mb = bounds.get(joint.mortise)
    const tb = bounds.get(joint.tenon)
    if (!mb || !tb) {
      missing.push(joint.id)
      continue
    }
    if (!contains(mb, joint.at, joint.halfExtents, TOL)) loose.push(`${joint.id}→mortise`)
    else if (!contains(tb, joint.at, joint.halfExtents, TOL)) loose.push(`${joint.id}→tenon`)
  }

  const ok = missing.length === 0 && loose.length === 0
  return {
    key: 'joints',
    titleId: 'Setiap pen berada di dalam lubangnya',
    titleEn: 'Every tenon contained in its mortise',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.joints.length} sambungan pasak, takik, dan tumpu; semuanya bertaut.`
      : `hilang: ${missing.join(', ') || '—'}; tidak bertaut: ${loose.join(', ') || '—'}.`,
    detailEn: ok
      ? `${house.joints.length} pasak, takik and tumpu joints; every one engaged.`
      : `missing: ${missing.join(', ') || '—'}; not engaged: ${loose.join(', ') || '—'}.`,
  }
}

/**
 * Nothing placed before the thing that carries it, and nothing below ground.
 *
 * A part is validly placed if it touches something already standing, or if it
 * rests on the ground itself. Walking the build order and checking that is
 * the closest a static model gets to watching the crew work.
 */
export function checkBuildOrder<K extends Kinds>(
  pack: RulePack<K>,
  house: House<K>,
): CheckResult {
  const belowGround = house.parts.filter((p) => (partBounds(p).min[1] ?? 0) < -TOL)
  const bounds = house.parts.map((p) => partBounds(p))

  // Ordering must already be monotone: assembly.ts sorts, and if something
  // re-ordered the array afterwards the timeline would be a fiction.
  const rank = new Map<K['stage'], number>(pack.stageOrder.map((s, i) => [s, i]))
  let monotone = true
  for (let i = 1; i < house.parts.length; i++) {
    const prev = house.parts[i - 1]
    const cur = house.parts[i]
    if (!prev || !cur) continue
    const a = rank.get(prev.stage) ?? 0
    const b = rank.get(cur.stage) ?? 0
    if (b < a || (a === b && cur.order < prev.order)) monotone = false
  }

  const unsupported: string[] = []
  const placed: number[] = []
  for (let i = 0; i < house.parts.length; i++) {
    const part = house.parts[i]
    const b = bounds[i]
    if (!part || !b) continue
    const onGround = (b.min[1] ?? 0) <= 0.02
    if (!onGround) {
      // 2 cm of slack: timber is fitted, not floated, but the generator works
      // to millimetres and a hard zero would fail on rounding alone.
      const touching = placed.some((j) => {
        const other = bounds[j]
        return other ? overlaps(b, other, 0.02) : false
      })
      if (!touching) unsupported.push(part.id)
    }
    placed.push(i)
  }

  const ok = belowGround.length === 0 && unsupported.length === 0 && monotone
  return {
    key: 'build-order',
    titleId: 'Urutan pendirian dan tidak ada bagian di bawah tanah',
    titleEn: 'Stage ordering, and nothing below ground',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.parts.length} bagian, semuanya bertumpu pada yang sudah berdiri atau pada tanah.`
      : [
          belowGround.length ? `di bawah tanah: ${belowGround.map((p) => p.id).join(', ')}` : '',
          unsupported.length ? `tanpa tumpuan: ${unsupported.join(', ')}` : '',
          monotone ? '' : 'urutan tidak monoton',
        ]
          .filter(Boolean)
          .join('; '),
    detailEn: ok
      ? `${house.parts.length} parts, every one bearing on something already standing or on the ground.`
      : [
          belowGround.length ? `below ground: ${belowGround.map((p) => p.id).join(', ')}` : '',
          unsupported.length ? `unsupported: ${unsupported.join(', ')}` : '',
          monotone ? '' : 'order is not monotonic',
        ]
          .filter(Boolean)
          .join('; '),
  }
}

/**
 * A joint may not span stages.
 *
 * You cannot peg into something that is not up yet, and you do not go back
 * three stages to peg something you left loose.
 */
export function checkJointStages<K extends Kinds>(
  pack: RulePack<K>,
  house: House<K>,
): CheckResult {
  const byId = new Map(house.parts.map((p) => [p.id, p]))
  const rank = new Map<K['stage'], number>(pack.stageOrder.map((s, i) => [s, i]))
  const bad: string[] = []
  for (const joint of house.joints) {
    const m = byId.get(joint.mortise)
    const t = byId.get(joint.tenon)
    if (!m || !t) continue
    const gap = Math.abs((rank.get(m.stage) ?? 0) - (rank.get(t.stage) ?? 0))
    if (gap > 1) bad.push(joint.id)
  }
  return {
    key: 'joint-stages',
    titleId: 'Sambungan tidak melompati tahap',
    titleEn: 'No joint spans more than one stage',
    status: bad.length === 0 ? 'pass' : 'fail',
    detail:
      bad.length === 0
        ? 'Setiap sambungan menaut dua bagian pada tahap yang sama atau berurutan.'
        : `melompat tahap: ${bad.join(', ')}.`,
    detailEn:
      bad.length === 0
        ? 'Every joint engages two parts from the same stage or from consecutive ones.'
        : `skips a stage: ${bad.join(', ')}.`,
  }
}

/** Indices in range, no degenerate triangles, unit normals. */
export function checkMeshes<K extends Kinds>(house: House<K>): CheckResult {
  let tris = 0
  const problems: string[] = []
  for (const part of house.parts) {
    if (part.kind !== 'mesh') continue
    const count = part.positions.length / 3
    if (part.normals.length !== part.positions.length) problems.push(`${part.id}: normal count`)
    if (part.uvs.length / 2 !== count) problems.push(`${part.id}: uv count`)
    if (part.indices.length % 3 !== 0) problems.push(`${part.id}: indices not triples`)
    for (const idx of part.indices) {
      if (idx < 0 || idx >= count) {
        problems.push(`${part.id}: index out of range`)
        break
      }
    }
    for (let i = 0; i < part.normals.length; i += 3) {
      const l = Math.hypot(
        part.normals[i] ?? 0,
        part.normals[i + 1] ?? 0,
        part.normals[i + 2] ?? 0,
      )
      if (Math.abs(l - 1) > 1e-3) {
        problems.push(`${part.id}: normal not unit (${l.toFixed(4)})`)
        break
      }
    }
    let degenerate = 0
    for (let i = 0; i < part.indices.length; i += 3) {
      const a = (part.indices[i] ?? 0) * 3
      const b = (part.indices[i + 1] ?? 0) * 3
      const c = (part.indices[i + 2] ?? 0) * 3
      const e1 = [
        (part.positions[b] ?? 0) - (part.positions[a] ?? 0),
        (part.positions[b + 1] ?? 0) - (part.positions[a + 1] ?? 0),
        (part.positions[b + 2] ?? 0) - (part.positions[a + 2] ?? 0),
      ]
      const e2 = [
        (part.positions[c] ?? 0) - (part.positions[a] ?? 0),
        (part.positions[c + 1] ?? 0) - (part.positions[a + 1] ?? 0),
        (part.positions[c + 2] ?? 0) - (part.positions[a + 2] ?? 0),
      ]
      const cx = (e1[1] ?? 0) * (e2[2] ?? 0) - (e1[2] ?? 0) * (e2[1] ?? 0)
      const cy = (e1[2] ?? 0) * (e2[0] ?? 0) - (e1[0] ?? 0) * (e2[2] ?? 0)
      const cz = (e1[0] ?? 0) * (e2[1] ?? 0) - (e1[1] ?? 0) * (e2[0] ?? 0)
      if (Math.hypot(cx, cy, cz) * 0.5 < 1e-9) degenerate++
      tris++
    }
    if (degenerate > 0) problems.push(`${part.id}: ${degenerate} segitiga merosot`)
  }
  return {
    key: 'meshes',
    titleId: 'Keutuhan jala: indeks, segitiga, dan normal',
    titleEn: 'Mesh integrity: indices, triangles, normals',
    status: problems.length === 0 ? 'pass' : 'fail',
    detail:
      problems.length === 0
        ? `${tris} segitiga; indeks dalam jangkauan, tidak ada yang merosot, semua normal bersatuan.`
        : problems.slice(0, 6).join('; '),
    detailEn:
      problems.length === 0
        ? `${tris} triangles; indices in range, none degenerate, every normal unit length.`
        : problems.slice(0, 6).join('; '),
  }
}

/**
 * Every part declares what it was derived from.
 *
 * The model can be marked up by provenance only because each part names the
 * dimensions that decided it. That tagging is the kind of thing that rots
 * silently — a new member gets added during a geometry change and nobody
 * notices it is claiming to come from nowhere, and it renders in whatever
 * colour an empty list happens to produce. So the tagging is not a
 * convention, it is a check: no part may be untagged, and no part may cite a
 * dimension that does not exist.
 */
export function checkPartProvenance<K extends Kinds>(
  pack: RulePack<K>,
  house: House<K>,
): CheckResult {
  const known = new Set<string>(pack.dimKeys)
  const untagged: string[] = []
  const unknown: string[] = []

  for (const part of house.parts) {
    if (part.dims.length === 0) untagged.push(part.id)
    for (const key of part.dims) {
      if (!known.has(key)) unknown.push(`${part.id}:${key}`)
    }
  }

  const split = { measured: 0, canon: 0, interpolated: 0 }
  for (const part of house.parts) split[partClass(pack, part)]++

  const ok = untagged.length === 0 && unknown.length === 0
  return {
    key: 'part-provenance',
    titleId: 'Tiap bagian menyebut ukuran asalnya',
    titleEn: 'Every part declares the dimensions it came from',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.parts.length} bagian, semuanya bertanda. Menurut kelas terlemah: ` +
        `${split.measured} terukur, ${split.canon} kanon, ${split.interpolated} perkiraan penulis.`
      : `Tanpa tanda: ${untagged.slice(0, 6).join(', ') || 'tidak ada'}. ` +
        `Ukuran tak dikenal: ${unknown.slice(0, 6).join(', ') || 'tidak ada'}.`,
    detailEn: ok
      ? `${house.parts.length} parts, every one tagged. By least-sourced input: ` +
        `${split.measured} measured, ${split.canon} canon, ${split.interpolated} interpolated.`
      : `Untagged: ${untagged.slice(0, 6).join(', ') || 'none'}. ` +
        `Unknown dimensions: ${unknown.slice(0, 6).join(', ') || 'none'}.`,
  }
}

/**
 * The generator against a real measured drawing.
 *
 * Reports skipped, and will keep reporting skipped until a survey is wired
 * in. It is never softened to green. Every other check here can be satisfied
 * by writing better code; this one can only be satisfied by going and
 * measuring a house, and the gap between the two is the honest description of
 * what this project currently knows.
 */
export function checkAgainstSurvey(): CheckResult {
  return {
    key: 'survey',
    titleId: 'Uji terhadap gambar ukur rumah nyata',
    titleEn: 'Checked against a measured drawing of a real house',
    status: 'skip',
    detail:
      'Dilewati. Belum ada gambar ukur yang dimasukkan, jadi tidak ada yang bisa dibandingkan. Pemeriksaan ini tidak akan diluluskan dengan cara melonggarkannya.',
    detailEn:
      'Skipped. No measured drawing has been wired in, so there is nothing to compare against. This check will not be made to pass by weakening it.',
  }
}

export function summarise(results: readonly CheckResult[]): {
  passed: number
  failed: number
  skipped: number
} {
  return {
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    skipped: results.filter((r) => r.status === 'skip').length,
  }
}
