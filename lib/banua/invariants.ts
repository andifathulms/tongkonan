/**
 * The checks that gate the build.
 *
 * There is no measured drawing yet, so correctness cannot rest on comparing
 * the model to a survey. It rests on structural truth instead: things that
 * must hold of any tongkonan, stated precisely enough to fail.
 *
 * A failing invariant fails the build. `checkAgainstSurvey` reports skipped
 * and stays skipped — it is the only check here that cannot be satisfied by
 * writing better code, and that is exactly why it is kept.
 */

import type { Bounds, House, Layout, Part, Vec3 } from './types'
import { STAGE_ORDER } from './types'
import { rotatedHalfExtents, slopeDrop } from './geometry'
import { ridgeOf } from './frame'
import { RIDGE_CAP_BAND, ijukBands } from './roof'
import { DIMS, DIM_KEYS, partClass, rankInfo } from './rules'

export type CheckStatus = 'pass' | 'fail' | 'skip'

export interface CheckResult {
  readonly key: string
  readonly titleId: string
  readonly titleEn: string
  readonly status: CheckStatus
  /** What was measured, in words and numbers. Shown as-is in the UI. */
  readonly detail: string
}

const TOL = 1e-4

/* ── AABB helpers ─────────────────────────────────────────────────────── */

export function partBounds(part: Part): Bounds {
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
function partVertices(part: Part): number[] {
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
 * Bilateral symmetry about the ridge plane, z = 0.
 *
 * Checked over the aggregate vertex set rather than by pairing parts, because
 * a mirrored box and its twin have different Euler angles while occupying
 * mirrored volumes. What must be symmetric is the building, not the bookkeeping.
 */
export function checkSymmetry(house: House): CheckResult {
  const cell = 0.002
  const buckets = new Map<string, number[]>()
  const all: number[] = []
  for (const part of house.parts) all.push(...partVertices(part))

  const key = (x: number, y: number, z: number) =>
    `${Math.round(x / cell)}|${Math.round(y / cell)}|${Math.round(z / cell)}`

  for (let i = 0; i < all.length; i += 3) {
    const k = key(all[i] ?? 0, all[i + 1] ?? 0, all[i + 2] ?? 0)
    const list = buckets.get(k)
    if (list) list.push(i)
    else buckets.set(k, [i])
  }

  let worst = 0
  let orphan = 0
  for (let i = 0; i < all.length; i += 3) {
    const x = all[i] ?? 0
    const y = all[i + 1] ?? 0
    const z = all[i + 2] ?? 0
    if (Math.abs(z) < cell) continue // on the plane; its own mirror
    let best = Infinity
    // Search the bucket the mirror should land in and its neighbours, so a
    // vertex sitting on a cell boundary is not reported as asymmetric.
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = buckets.get(
            `${Math.round(x / cell) + dx}|${Math.round(y / cell) + dy}|${Math.round(-z / cell) + dz}`,
          )
          if (!list) continue
          for (const j of list) {
            const d = Math.hypot(
              (all[j] ?? 0) - x,
              (all[j + 1] ?? 0) - y,
              (all[j + 2] ?? 0) + z,
            )
            if (d < best) best = d
          }
        }
      }
    }
    if (best > 0.005) orphan++
    if (best < Infinity && best > worst) worst = best
  }

  return {
    key: 'symmetry',
    titleId: 'Simetri terhadap bidang punggung',
    titleEn: 'Bilateral symmetry about the ridge plane',
    status: orphan === 0 ? 'pass' : 'fail',
    detail:
      orphan === 0
        ? `${all.length / 3} titik; simpangan cermin terbesar ${(worst * 1000).toFixed(2)} mm.`
        : `${orphan} titik tanpa pasangan cermin dalam 5 mm.`,
  }
}

/**
 * Every tenon inside its mortise, both parts present.
 *
 * The house is built without nails, so a joint that does not engage is not a
 * detail that looks slightly wrong — it is a house that falls down.
 */
export function checkJoints(house: House): CheckResult {
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
  }
}

/**
 * Nothing placed before the thing that carries it, and nothing below ground.
 *
 * A part is validly placed if it touches something already standing, or if it
 * rests on the ground itself. Walking the build order and checking that is
 * the closest a static model gets to watching the crew work.
 */
export function checkBuildOrder(house: House): CheckResult {
  const belowGround = house.parts.filter((p) => (partBounds(p).min[1] ?? 0) < -TOL)
  const bounds = house.parts.map((p) => partBounds(p))

  // Ordering must already be monotone: assembly.ts sorts, and if something
  // re-ordered the array afterwards the timeline would be a fiction.
  const rank = new Map(STAGE_ORDER.map((s, i) => [s, i]))
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
  }
}

/**
 * A joint may not span stages.
 *
 * You cannot peg into something that is not up yet, and you do not go back
 * three stages to peg something you left loose.
 */
export function checkJointStages(house: House): CheckResult {
  const byId = new Map(house.parts.map((p) => [p.id, p]))
  const rank = new Map(STAGE_ORDER.map((s, i) => [s, i]))
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
  }
}

/** Indices in range, no degenerate triangles, unit normals. */
export function checkMeshes(house: House): CheckResult {
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
  }
}

/**
 * The ridge sags in the interior, both prows rise, and the front prow is the
 * higher of the two. This ordering is canon; it has to fall out of the curve.
 */
export function checkRidgeProfile(layout: Layout): CheckResult {
  const ridge = ridgeOf(layout)
  let lowest = Infinity
  let lowestS = 0
  for (let i = 0; i <= 200; i++) {
    const s = i / 200
    const y = ridge(s).y
    if (y < lowest) {
      lowest = y
      lowestS = s
    }
  }
  const front = ridge(0).y
  const rear = ridge(1).y
  const interior = lowestS > 0.15 && lowestS < 0.85
  const sags = lowest < front - TOL && lowest < rear - TOL
  const frontHigher = front > rear + TOL
  const ok = interior && sags && frontHigher
  return {
    key: 'ridge-profile',
    titleId: 'Punggung melengkung turun, kedua haluan naik, haluan depan tertinggi',
    titleEn: 'Ridge sags in the interior; both prows rise; the front prow is highest',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `titik terendah pada s=${lowestS.toFixed(2)} (${lowest.toFixed(2)} m); haluan depan ${front.toFixed(2)} m, belakang ${rear.toFixed(2)} m.`
      : `s terendah ${lowestS.toFixed(2)}, depan ${front.toFixed(2)}, belakang ${rear.toFixed(2)}.`,
  }
}

/**
 * Ijuk courses lap with no bare strip, and the ridge is covered.
 *
 * The bands are read from the same function the geometry was cut from, so a
 * lap that is claimed and a lap that is built cannot drift apart.
 */
export function checkIjukCoverage(house: House, layout: Layout): CheckResult {
  const bands = ijukBands(layout)
  const gaps: string[] = []
  // Eave course must reach the eave; each course must reach past the head of
  // the one below it, or a strip of frame shows through.
  const first = bands[0]
  if (!first || first.foot < 1 - TOL) gaps.push('lapis terbawah tidak mencapai tepi atap')
  for (let k = 1; k < bands.length; k++) {
    const below = bands[k - 1]
    const cur = bands[k]
    if (!below || !cur) continue
    const lap = cur.foot - below.head
    if (lap <= TOL) gaps.push(`lapis ${k + 1} tidak menindih lapis ${k}`)
  }
  const top = bands[bands.length - 1]
  if (!top || top.head > TOL) gaps.push('lapis teratas tidak mencapai punggung')
  const cap = house.parts.find((p) => p.id === 'ijuk-bubungan')
  if (!cap) gaps.push('tidak ada penutup punggung')
  if (RIDGE_CAP_BAND.head > TOL) gaps.push('penutup punggung tidak menutup garis punggung')

  const minLap =
    bands.length > 1
      ? Math.min(
          ...bands.slice(1).map((b, i) => b.foot - (bands[i]?.head ?? 0)),
        )
      : 1
  return {
    key: 'ijuk-coverage',
    titleId: 'Lapis ijuk saling menindih tanpa celah; punggung tertutup',
    titleEn: 'Ijuk courses lap with no bare strip; the ridge is covered',
    status: gaps.length === 0 ? 'pass' : 'fail',
    detail:
      gaps.length === 0
        ? `${bands.length} lapis; tindihan terkecil ${(minLap * 100).toFixed(1)}% dari bentang lereng.`
        : gaps.join('; '),
  }
}

/**
 * The eave oversails the outer post line.
 *
 * Rain shed off a pitch this steep has to land clear of the post feet. That
 * is why the overhang is as deep as it is, so it is an invariant rather than
 * a coincidence of the numbers.
 */
export function checkEaveOversail(layout: Layout): CheckResult {
  const outerPostFace = Math.max(...layout.postZ.map(Math.abs)) + layout.postSection / 2
  const clear = layout.eaveHalfWidth - outerPostFace
  const ok = clear > TOL
  return {
    key: 'eave-oversail',
    titleId: 'Tepi atap melewati garis tiang terluar',
    titleEn: 'The eave oversails the outer post line',
    status: ok ? 'pass' : 'fail',
    detail: `tepi atap ${layout.eaveHalfWidth.toFixed(2)} m dari sumbu; muka tiang terluar ${outerPostFace.toFixed(2)} m; julur ${clear.toFixed(2)} m.`,
  }
}

/**
 * The eave clears the wall plate: the roof passes over the plate on its way
 * out, rather than through it, and the eave edge lands outboard of it.
 */
export function checkEaveClearsPlate(layout: Layout): CheckResult {
  const s = rankInfo(layout.rules.rank).scale.value
  const plateZ = Math.max(...layout.postZ.map(Math.abs))
  const plateTop = layout.plateY + (DIMS.plateDepth.value * s) / 2
  const f = plateZ / layout.eaveHalfWidth
  // Height of the flared roof where it crosses the plate. Read from the same
  // curve the surface was swept along, not from a straight chord.
  const roofY =
    layout.ridgeY -
    (layout.ridgeY - layout.eaveY) *
      slopeDrop(f, { at: layout.breakFraction, drop: layout.kneeDrop })
  const clearsAbove = roofY > layout.plateY - (DIMS.plateDepth.value * s) / 2 - TOL
  const outboard = layout.eaveHalfWidth > plateZ + TOL
  const ok = clearsAbove && outboard
  return {
    key: 'eave-plate',
    titleId: 'Atap melewati balok tumpuan lalu turun di luarnya',
    titleEn: 'The eave clears the wall plate',
    status: ok ? 'pass' : 'fail',
    detail: `atap pada z=${plateZ.toFixed(2)} m berada di ${roofY.toFixed(2)} m; puncak balok tumpuan ${plateTop.toFixed(2)} m; tepi atap ${layout.eaveHalfWidth.toFixed(2)} m.`,
  }
}

/** Post count follows the declared bay count. */
export function checkPostCount(house: House, layout: Layout): CheckResult {
  const expectedRows = layout.rules.bays + 1
  const expected = expectedRows * layout.postZ.length
  const posts = house.parts.filter((p) => p.id.startsWith('ariri-')).length
  const stones = house.parts.filter((p) => p.id.startsWith('batu-') && p.id !== 'batu-tulak-somba')
    .length
  const ok = posts === expected && stones === expected && layout.postX.length === expectedRows
  return {
    key: 'post-count',
    titleId: 'Jumlah tiang mengikuti jumlah ruang',
    titleEn: 'Post count follows the declared bay count',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.bays} ruang → ${expectedRows} baris × ${layout.postZ.length} tiang = ${expected} a'riri, ${stones} batu umpak.`
      : `diharapkan ${expected}, ditemukan ${posts} tiang dan ${stones} batu.`,
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
export function checkPartProvenance(house: House): CheckResult {
  const known = new Set<string>(DIM_KEYS)
  const untagged: string[] = []
  const unknown: string[] = []

  for (const part of house.parts) {
    if (part.dims.length === 0) untagged.push(part.id)
    for (const key of part.dims) {
      if (!known.has(key)) unknown.push(`${part.id}:${key}`)
    }
  }

  const split = { measured: 0, canon: 0, interpolated: 0 }
  for (const part of house.parts) split[partClass(part)]++

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
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkSymmetry(house),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkRidgeProfile(layout),
    checkIjukCoverage(house, layout),
    checkEaveOversail(layout),
    checkEaveClearsPlate(layout),
    checkPostCount(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
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
