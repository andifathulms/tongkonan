/**
 * The checks that are claims about the mbaru niang.
 *
 * The generic half comes from the core unchanged for the fourth time, which is
 * about as much evidence as this project is going to get that it is generic —
 * and it survived a house with no ridge, no rectangle and no front, which is
 * the hardest test it has had.
 *
 * What is here is what a round house says and the other three cannot. That the
 * plan is a circle. That the building repeats every one household segment,
 * which is a symmetry no earlier house has: they mirror, this one turns. That
 * the thatch reaches the ground, so the whole exterior is roof and there is no
 * wall to check. That there are five floors, named, each smaller than the one
 * below because the cone narrows. And that one post runs from the stone to the
 * apex through every one of them.
 */

import {
  checkAgainstSurvey,
  checkBuildOrder as coreCheckBuildOrder,
  checkJointStages as coreCheckJointStages,
  checkPartProvenance as coreCheckPartProvenance,
  checkJoints,
  checkMeshes,
  checkSymmetry,
  partBounds,
} from '@/lib/core/invariants'
import type { CheckResult } from '@/lib/core/invariants'
import type { House, Layout, Part } from './types'
import { radiusAtHeight } from './frame'
import { coneRun } from './cone'
import { thatchBands } from './roof'
import { DIMS, LEVELS, PACK, peranInfo } from './rules'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/* ── Bound to the Manggarai pack ──────────────────────────────────────── */

export function checkBuildOrder(house: House): CheckResult {
  return coreCheckBuildOrder(PACK, house)
}

export function checkJointStages(house: House): CheckResult {
  return coreCheckJointStages(PACK, house)
}

export function checkPartProvenance(house: House): CheckResult {
  return coreCheckPartProvenance(PACK, house)
}

/**
 * Mirror symmetry still holds, and it is worth checking that it does.
 *
 * A round house is symmetric about every vertical plane through its axis, so
 * one of them is z = 0 and the core's check applies unchanged. Passing it is
 * weaker evidence here than in a rectangular house — a shape can mirror and
 * still be wrong about its own repetition — which is why `checkRadialRepeat`
 * exists beside it.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    labelId: 'bidang tegak lewat sumbu',
    labelEn: 'a vertical plane through the axis',
  })
}

/* ── The Manggarai checks ─────────────────────────────────────────────── */

/**
 * The building repeats every one household segment.
 *
 * The first rotational check in this project. Everything before this mirrors
 * about a plane; this one turns about an axis, and the two are not the same
 * claim — a shape can be a perfect mirror image of itself and still not repeat
 * every sixty degrees.
 *
 * It is also the check that found the tessellation was lying. A cone drawn
 * with forty-eight facets happens to repeat every sixty degrees when there are
 * six households, and does not when there are five or seven, so the model was
 * claiming a symmetry the mesh did not have. The facet count is now a multiple
 * of the household count and the claim is true for every house the rules
 * admit.
 */
export function checkRadialRepeat(house: House, layout: Layout): CheckResult {
  const n = layout.rules.keluarga
  const step = (Math.PI * 2) / n
  const cos = Math.cos(step)
  const sin = Math.sin(step)
  const cell = 0.004

  /*
   * Everything but the drum.
   *
   * There is one drum and it hangs in one place, so it does not repeat and
   * should not — the same shape of exception the rumah gadang's bilik needed,
   * and for the same reason: a building can be regular in its fabric and
   * deliberately singular in one thing it contains. The count of what was left
   * out is printed, so the narrowing is never silent, and `checkDrum` states
   * the drum's own claim.
   */
  const scoped = house.parts.filter((p) => p.id !== 'gendang')
  const all: number[] = []
  for (const part of scoped) all.push(...vertices(part))

  const buckets = new Map<string, number[]>()
  const key = (x: number, y: number, z: number, dx = 0, dy = 0, dz = 0) =>
    `${Math.round(x / cell) + dx}|${Math.round(y / cell) + dy}|${Math.round(z / cell) + dz}`
  for (let i = 0; i < all.length; i += 3) {
    const k = key(all[i] ?? 0, all[i + 1] ?? 0, all[i + 2] ?? 0)
    const list = buckets.get(k)
    if (list) list.push(i)
    else buckets.set(k, [i])
  }

  let orphan = 0
  let worst = 0
  for (let i = 0; i < all.length; i += 3) {
    const x = all[i] ?? 0
    const y = all[i + 1] ?? 0
    const z = all[i + 2] ?? 0
    // A point on the axis is its own image, whatever the rotation.
    if (Math.hypot(x, z) < cell) continue
    const rx = x * cos + z * sin
    const rz = -x * sin + z * cos
    let best = Infinity
    // Twenty-seven buckets, but almost never twenty-seven: a house whose facet
    // count divides by its household count lands its rotated twin on the same
    // vertex to within rounding, so the first bucket answers. The neighbours
    // are there for points sitting on a cell boundary, and searching them for
    // every one of twenty thousand vertices five times over is most of a
    // minute that nothing needs.
    outer: for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = buckets.get(key(rx, y, rz, dx, dy, dz))
          if (!list) continue
          for (const j of list) {
            const d = Math.hypot((all[j] ?? 0) - rx, (all[j + 1] ?? 0) - y, (all[j + 2] ?? 0) - rz)
            if (d < best) best = d
            if (best < 1e-6) break outer
          }
        }
      }
    }
    if (best > 0.008) orphan++
    else if (best > worst) worst = best
  }

  return {
    key: 'radial-repeat',
    titleId: `Rumah berulang setiap satu juring, yaitu setiap ${(360 / n).toFixed(0)}°`,
    titleEn: `The house repeats every one segment, which is every ${(360 / n).toFixed(0)}°`,
    status: orphan === 0 ? 'pass' : 'fail',
    detail:
      orphan === 0
        ? `${all.length / 3} titik (${scoped.length} dari ${house.parts.length} bagian); setelah diputar ${(360 / n).toFixed(0)}° simpangan terbesar ${(worst * 1000).toFixed(2)} mm.`
        : `${orphan} titik tanpa pasangan setelah diputar ${(360 / n).toFixed(0)}°.`,
    detailEn:
      orphan === 0
        ? `${all.length / 3} points (${scoped.length} of ${house.parts.length} parts); turned ${(360 / n).toFixed(0)}° the largest deviation is ${(worst * 1000).toFixed(2)} mm.`
        : `${orphan} points with no partner after a ${(360 / n).toFixed(0)}° turn.`,
  }
}

/** Every vertex of a part in world space, boxes expanded to their corners. */
function vertices(part: Part): number[] {
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

/**
 * The plan is a circle, so the building is as wide one way as the other.
 *
 * Trivial to state and worth stating: `SceneModel.footprint` asks for a width
 * and a depth, which for the other three houses are a plan and for this one
 * are a bounding box round a circle. The check is what keeps that from
 * quietly becoming a rectangle.
 */
export function checkRound(house: House, layout: Layout): CheckResult {
  const [minX, , minZ] = house.bounds.min
  const [maxX, , maxZ] = house.bounds.max
  const spanX = maxX - minX
  const spanZ = maxZ - minZ
  const off = Math.abs(spanX - spanZ)
  /*
   * How square a polygon's bounding box can be.
   *
   * The building is a circle; the mesh is a polygon inscribed in it, and an
   * inscribed polygon is narrower than its circle everywhere except at a
   * vertex. The shortfall is the sagitta of one facet, twice — and only where
   * the facet count is not a multiple of four does it show up as a difference
   * between the two spans. That is arithmetic about drawing, not slack in the
   * claim, so it is computed rather than guessed at.
   */
  // Measured against the widest ring actually built, which is the thatch
  // standing proud of the frame rather than the frame itself.
  const sagitta = spanX * (1 - Math.cos(Math.PI / layout.facets))
  const ok = off <= sagitta + 1e-9 && layout.levels.every((l) => l.radius > 0)
  return {
    key: 'round',
    titleId: 'Denahnya bundar: selebar itu ke segala arah',
    titleEn: 'The plan is round: as wide one way as the other',
    status: ok ? 'pass' : 'fail',
    detail: `${spanX.toFixed(2)} m × ${spanZ.toFixed(2)} m, beda ${(off * 1000).toFixed(0)} mm — sebundar yang bisa dicapai segibanyak ${layout.facets} sisi (${(sagitta * 1000).toFixed(0)} mm). Tidak ada muka, tidak ada sudut, dan tidak ada bubungan.`,
    detailEn: `${spanX.toFixed(2)} m × ${spanZ.toFixed(2)} m, differing by ${(off * 1000).toFixed(0)} mm — as round as a ${layout.facets}-sided polygon can be (${(sagitta * 1000).toFixed(0)} mm). No face, no corner and no ridge.`,
  }
}

/**
 * The thatch reaches the ground, so the whole exterior is roof.
 *
 * The negative claim this house makes, and the third of its kind in the
 * project after Bodi Caniago's missing step and a joglo with no pendhapa:
 * there is no wall, and the check is that there is nothing standing outside
 * the roof and nothing holding the roof up off the ground.
 */
export function checkThatchToGround(house: House, layout: Layout): CheckResult {
  const courses = house.parts.filter((p) => p.stage === 'ijuk')
  const lowest = courses.length
    ? Math.min(...courses.map((p) => partBounds(p).min[1] ?? Infinity))
    : Infinity
  const widest = courses.length
    ? Math.max(...courses.map((p) => Math.max(Math.abs(partBounds(p).min[0] ?? 0), Math.abs(partBounds(p).max[0] ?? 0))))
    : 0
  // Anything reaching further out than the thatch would be standing outside
  // the roof, and on this house there is no outside of the roof.
  const outside = house.parts.filter((p) => {
    if (p.stage === 'ijuk' || p.stage === 'puncak') return false
    const b = partBounds(p)
    return Math.max(Math.abs(b.min[0] ?? 0), Math.abs(b.max[0] ?? 0)) > widest + TOL
  })
  // Within the thickness of a course. The thatch beds on the rafters and the
  // rafters rest on the ground, so the lowest course sits a little proud of
  // grade — by less than one course, which is what "reaches the ground" means
  // for something laid in courses.
  const ok = lowest < DIMS.thatchThickness.value && outside.length === 0
  return {
    key: 'thatch-to-ground',
    titleId: 'Ijuk turun sampai ke tanah; seluruh bangunan adalah atap',
    titleEn: 'The thatch reaches the ground; the whole building is roof',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Lapis terbawah menyentuh tanah pada ${lowest.toFixed(2)} m dan menjangkau ${widest.toFixed(2)} m dari sumbu; tidak ada satu pun bagian yang berdiri di luarnya, karena tidak ada luar atap.`
      : `Lapis terbawah pada ${lowest.toFixed(2)} m; ${outside.length} bagian berdiri di luar atap.`,
    detailEn: ok
      ? `The lowest course meets the ground at ${lowest.toFixed(2)} m and reaches ${widest.toFixed(2)} m from the axis; nothing stands outside it, because there is no outside of the roof.`
      : `The lowest course sits at ${lowest.toFixed(2)} m; ${outside.length} parts stand outside the roof.`,
  }
}

/**
 * Five floors, named, each smaller than the one below.
 *
 * And each of those radii read off the cone rather than declared. The joglo
 * taught this one — derive from the thing that determines it, or two places
 * end up computing one shape and only one of them gets updated.
 */
export function checkFiveLevels(layout: Layout): CheckResult {
  const problems: string[] = []
  if (layout.levels.length !== DIMS.fiveLevels.value) {
    problems.push(`${layout.levels.length} floors, expected ${DIMS.fiveLevels.value}`)
  }
  layout.levels.forEach((level, i) => {
    if (level.name !== LEVELS[i]?.name) problems.push(`floor ${i + 1} is not the ${LEVELS[i]?.name}`)
    /*
     * Said plainly, because it is the way this house actually fails.
     *
     * Five floors is canon and the cone is what they stand in, so the two are
     * not independent: space the storeys further apart and the topmost climbs
     * into a part of the building too narrow to be a floor, or past the point
     * of the cone altogether. Reported as "not narrower than the one below" it
     * is technically true and tells the reader nothing.
     */
    if (level.radius <= TOL) {
      problems.push(
        `the ${level.name} sits at ${level.y.toFixed(2)} m, at or above the point of a cone that ends at ${layout.apexY.toFixed(2)} m — there is no building left at that height to be a floor`,
      )
      return
    }
    const want = radiusAtHeight(layout.profile, level.y)
    if (Math.abs(level.radius - want) > 1e-6) {
      problems.push(`the ${level.name} is ${Math.abs(level.radius - want).toFixed(3)} m off the cone`)
    }
    if (i > 0) {
      const below = layout.levels[i - 1]
      if (!below) return
      if (level.y <= below.y + TOL) problems.push(`the ${level.name} does not rise above the ${below.name}`)
      if (level.radius >= below.radius - TOL) problems.push(`the ${level.name} is not narrower than the ${below.name}`)
    }
  })
  const top = layout.levels[layout.levels.length - 1]
  const foot = layout.levels[0]
  return {
    key: 'five-levels',
    titleId: 'Lima lantai bernama, tiap yang di atas lebih sempit karena kerucutnya menyempit',
    titleEn: 'Five named floors, each narrower than the last because the cone narrows',
    status: problems.length === 0 ? 'pass' : 'fail',
    detail:
      problems.length === 0
        ? `${layout.levels.map((l) => l.name).join(' → ')}; dari ${foot?.radius.toFixed(2)} m di ${foot?.y.toFixed(2)} m sampai ${top?.radius.toFixed(2)} m di ${top?.y.toFixed(2)} m.`
        : problems.join('; '),
    detailEn:
      problems.length === 0
        ? `${layout.levels.map((l) => l.name).join(' → ')}; from ${foot?.radius.toFixed(2)} m at ${foot?.y.toFixed(2)} m to ${top?.radius.toFixed(2)} m at ${top?.y.toFixed(2)} m.`
        : problems.join('; '),
  }
}

/** One post from the stone to the apex, through all five floors. */
export function checkCentrePost(house: House, layout: Layout): CheckResult {
  const post = house.parts.find((p) => p.id === 'tiang-tengah')
  if (!post) return fail('centre-post', 'Tidak ada tiang tengah.', 'There is no centre post.')
  const b = partBounds(post)
  const through = layout.levels.filter((l) => l.y > (b.min[1] ?? 0) && l.y < (b.max[1] ?? 0))
  const ok = through.length === layout.levels.length && (b.max[1] ?? 0) >= layout.apexY - TOL
  return {
    key: 'centre-post',
    titleId: 'Satu tiang tengah menembus kelima lantai sampai ke puncak',
    titleEn: 'One centre post runs through all five floors to the apex',
    status: ok ? 'pass' : 'fail',
    detail: `dari ${(b.min[1] ?? 0).toFixed(2)} m sampai ${(b.max[1] ?? 0).toFixed(2)} m, menembus ${through.length} dari ${layout.levels.length} lantai. Tidak ada satu pun batang di rumah lain dalam projek ini yang menyentuh setiap tingkatnya.`,
    detailEn: `from ${(b.min[1] ?? 0).toFixed(2)} m to ${(b.max[1] ?? 0).toFixed(2)} m, passing through ${through.length} of ${layout.levels.length} floors. No single member in any other house here touches every storey.`,
  }
}

/** One partition per household, evenly spaced, and one post at each. */
export function checkSegments(house: House, layout: Layout): CheckResult {
  const n = layout.rules.keluarga
  const partitions = house.parts.filter((p) => p.id.startsWith('sekat-'))
  const posts = house.parts.filter((p) => p.id.startsWith('tiang-') && p.id !== 'tiang-tengah')
  const problems: string[] = []
  if (partitions.length !== n) problems.push(`${partitions.length} partitions, expected ${n}`)
  if (posts.length !== n) problems.push(`${posts.length} ring posts, expected ${n}`)
  if (layout.rafterCount % n !== 0) problems.push(`${layout.rafterCount} rafters do not divide by ${n}`)
  if (layout.facets % n !== 0) problems.push(`${layout.facets} facets do not divide by ${n}`)
  layout.segmentAngles.forEach((a, i) => {
    const want = (i / n) * Math.PI * 2
    if (Math.abs(a - want) > 1e-9) problems.push(`segment ${i + 1} is off its bearing`)
  })
  return {
    key: 'segments',
    titleId: 'Satu juring untuk tiap keluarga, dan seluruh rumah dibagi habis olehnya',
    titleEn: 'One segment per household, and the whole house divides evenly by it',
    status: problems.length === 0 ? 'pass' : 'fail',
    detail:
      problems.length === 0
        ? `${n} keluarga → ${n} sekat, ${n} tiang cincin, ${layout.rafterCount} kasau dan ${layout.facets} sisi jala — semuanya kelipatan ${n}.`
        : problems.join('; '),
    detailEn:
      problems.length === 0
        ? `${n} households → ${n} partitions, ${n} ring posts, ${layout.rafterCount} rafters and ${layout.facets} mesh facets — every one a multiple of ${n}.`
        : problems.join('; '),
  }
}

/** The drum hangs where the rule says, and nowhere else. */
export function checkDrum(house: House, layout: Layout): CheckResult {
  const role = peranInfo(layout.rules.peran)
  const drum = house.parts.find((p) => p.id === 'gendang')
  const ok = role.drum === Boolean(drum)
  return {
    key: 'drum',
    titleId: role.drum ? 'Niang gendang: gendang tergantung di dalamnya' : 'Rumah tinggal: tidak ada gendang di dalamnya',
    titleEn: role.drum ? 'Niang gendang: the drum hangs inside' : 'A dwelling: there is no drum inside',
    status: ok ? 'pass' : 'fail',
    detail: role.drum
      ? ok
        ? `Gendang ada, tergantung pada ${layout.drum.y.toFixed(2)} m di atas lantai lutur.`
        : 'Rumah gendang tanpa gendang.'
      : ok
        ? 'Tidak ada gendang, dan ketiadaan itulah yang membedakannya dari rumah gendang. Bentuknya sama persis.'
        : 'Gendang ditemukan di rumah yang bukan rumah gendang.',
    detailEn: role.drum
      ? ok
        ? `The drum is present, hung ${layout.drum.y.toFixed(2)} m above the lutur floor.`
        : 'A drum house with no drum.'
      : ok
        ? 'No drum, and that absence is the whole difference from the drum house. The form is exactly the same.'
        : 'A drum found in a house that is not the drum house.',
  }
}

/** Thatch courses lap with no bare ring, and the apex is covered. */
export function checkThatchCoverage(house: House, layout: Layout): CheckResult {
  const bands = thatchBands(layout)
  const gaps: string[] = []
  const first = bands[0]
  if (!first || first.foot < 1 - TOL) gaps.push('the lowest course does not reach the ground')
  for (let k = 1; k < bands.length; k++) {
    const below = bands[k - 1]
    const cur = bands[k]
    if (!below || !cur) continue
    if (cur.foot - below.head <= TOL) gaps.push(`course ${k + 1} does not lap course ${k}`)
  }
  const top = bands[bands.length - 1]
  if (!top || top.head > TOL) gaps.push('the top course does not reach the apex')
  if (!house.parts.some((p) => p.stage === 'puncak')) gaps.push('there is no ornament closing the apex')

  const minLap =
    bands.length > 1 ? Math.min(...bands.slice(1).map((b, i) => b.foot - (bands[i]?.head ?? 0))) : 1
  return {
    key: 'thatch-coverage',
    titleId: 'Lapis ijuk saling menindih tanpa celah, dari tanah sampai puncak',
    titleEn: 'Thatch courses lap with no bare ring, from the ground to the apex',
    status: gaps.length === 0 ? 'pass' : 'fail',
    detail:
      gaps.length === 0
        ? `${bands.length} lapis menutupi ${coneRun(layout.profile).toFixed(2)} m garis luar; tindihan terkecil ${(minLap * 100).toFixed(1)}%.`
        : gaps.join('; '),
    detailEn:
      gaps.length === 0
        ? `${bands.length} courses over ${coneRun(layout.profile).toFixed(2)} m of outline; smallest lap ${(minLap * 100).toFixed(1)}%.`
        : gaps.join('; '),
  }
}

function fail(key: string, detail: string, detailEn: string): CheckResult {
  return { key, titleId: key, titleEn: key, status: 'fail', detail, detailEn }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkFrameSymmetry(house),
    checkRadialRepeat(house, layout),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkRound(house, layout),
    checkThatchToGround(house, layout),
    checkFiveLevels(layout),
    checkCentrePost(house, layout),
    checkSegments(house, layout),
    checkDrum(house, layout),
    checkThatchCoverage(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
