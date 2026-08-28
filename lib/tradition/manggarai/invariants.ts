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
import { doorOpening, radiusAtHeight } from './frame'
import { coneRun } from '@/lib/core/cone'
import { thatchBands } from './roof'
import { DIMS, LEVELS, PACK, peranInfo } from './rules'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/** The things there is exactly one of, which therefore cannot repeat. */
const SINGULAR = /^(gendang|pintu-|ijuk-pintu-)/

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
   * There is one drum and one door, and neither repeats. That is not a defect:
   * a building can be regular in its fabric and deliberately singular in the
   * few things that give it a use and a direction — the same exception the
   * rumah gadang's bilik needed. The count of what was left out is printed, so
   * the narrowing is never silent, and each of the two has its own check.
   */
  const scoped = house.parts.filter((p) => !SINGULAR.test(p.id))
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
/**
 * The extent of the parts that go the whole way round.
 *
 * `house.bounds` cannot answer a question about roundness any more, because
 * the courses the door opens through are arcs rather than rings and stop a
 * facet short of bearing zero. That shortfall is the doorway, not slack in the
 * circle, so the claim is measured over what actually closes.
 */
export function ringBounds(house: House): { readonly spanX: number; readonly spanZ: number } {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const part of house.parts) {
    if (SINGULAR.test(part.id)) continue
    const b = partBounds(part)
    minX = Math.min(minX, b.min[0])
    maxX = Math.max(maxX, b.max[0])
    minZ = Math.min(minZ, b.min[2])
    maxZ = Math.max(maxZ, b.max[2])
  }
  return { spanX: maxX - minX, spanZ: maxZ - minZ }
}

export function checkRound(house: House, layout: Layout): CheckResult {
  const { spanX, spanZ } = ringBounds(house)
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
  // Measured against the widest closed ring, which is the thatch standing
  // proud of the frame rather than the frame itself.
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
 * there is no wall, and the check is that there is nothing holding the roof up
 * off the ground.
 */
export function checkThatchToGround(house: House, layout: Layout): CheckResult {
  const courses = house.parts.filter((p) => p.stage === 'ijuk')
  const lowest = courses.length
    ? Math.min(...courses.map((p) => partBounds(p).min[1] ?? Infinity))
    : Infinity
  // Within the thickness of a course. The thatch beds on the rafters and the
  // rafters rest on the ground, so the lowest course sits a little proud of
  // grade — by less than one course, which is what "reaches the ground" means
  // for something laid in courses.
  const ok = lowest < DIMS.thatchThickness.value
  return {
    key: 'thatch-to-ground',
    titleId: 'Ijuk turun sampai ke tanah; seluruh bangunan adalah atap',
    titleEn: 'The thatch reaches the ground; the whole building is roof',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Lapis terbawah menyentuh tanah pada ${lowest.toFixed(2)} m. Tidak ada dinding, tidak ada tepi atap, dan tidak ada yang menahannya di atas tanah.`
      : `Lapis terbawah pada ${lowest.toFixed(2)} m, terlalu tinggi untuk disebut menyentuh tanah.`,
    detailEn: ok
      ? `The lowest course meets the ground at ${lowest.toFixed(2)} m. No wall, no eave, and nothing holding it up off the ground.`
      : `The lowest course sits at ${lowest.toFixed(2)} m, too high to be said to reach the ground.`,
  }
}

/**
 * Nothing stands through the roof, at any height.
 *
 * The general form of a fault this project keeps making in new disguises. The
 * household partitions were rectangles run out to the radius of the floor they
 * stand on — correct at the floor, and half a metre outside the roof by their
 * own tops, because the cone closes in above them and a box does not. They
 * showed in a render as slits round the base.
 *
 * The previous version of the check compared every part against the *widest*
 * point of the thatch, which is at the ground, so a part could stand well
 * outside the roof anywhere above that and pass. Compared against the cone at
 * its own height it cannot — which is the same correction the rumah gadang's
 * `checkRoofFollowsSection` needed, one house later and one axis over.
 */
export function checkInsideCone(house: House, layout: Layout): CheckResult {
  // What a part is allowed: the thatch stands this far off the frame, so
  // anything within it is under the roof rather than through it.
  const skin = DIMS.rafterRadius.value + DIMS.thatchBed.value + DIMS.thatchThickness.value
  const problems: string[] = []
  let worst = -Infinity
  let checked = 0

  for (const part of house.parts) {
    // The thatch is the roof, the ornament sits on top of it, and the rafters
    // *are* the cone's own line.
    if (part.stage === 'ijuk' || part.stage === 'puncak' || part.id.startsWith('kasau-')) continue
    /*
     * Vertex by vertex, and against the cone at each vertex's own height.
     *
     * The first version took a part's widest reach and compared it against the
     * cone above its highest point. That is exact for a box, whose reach is the
     * same at every height, and wrong for anything shaped — the partitions
     * follow the cone perfectly and were failed for the radius they have at
     * their feet. A check that cannot tell a wall leaning correctly from one
     * standing through the roof is not measuring the thing it names.
     */
    const points = vertices(part)
    let over = -Infinity
    let at = 0
    for (let i = 0; i < points.length; i += 3) {
      const y = points[i + 1] ?? 0
      const reach = Math.hypot(points[i] ?? 0, points[i + 2] ?? 0)
      const d = reach - (radiusAtHeight(layout.profile, y) + skin)
      if (d > over) {
        over = d
        at = y
      }
      checked++
    }
    if (over > worst) worst = over
    if (over > TOL) problems.push(`${part.id}: ${over.toFixed(2)} m through the roof at ${at.toFixed(2)} m`)
  }

  return {
    key: 'inside-cone',
    titleId: 'Tidak ada bagian yang menembus kerucut, pada ketinggian mana pun',
    titleEn: 'Nothing stands through the cone, at any height',
    status: problems.length === 0 ? 'pass' : 'fail',
    detail:
      problems.length === 0
        ? `${checked} titik diuji terhadap kerucut pada ketinggiannya masing-masing; yang paling dekat ke luar masih ${Math.abs(worst).toFixed(2)} m di dalamnya.`
        : problems.slice(0, 6).join('; '),
    detailEn:
      problems.length === 0
        ? `${checked} points tested against the cone at each one's own height; the closest comes within ${Math.abs(worst).toFixed(2)} m of it.`
        : problems.slice(0, 6).join('; '),
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

/**
 * One door, and it is the only direction this building has.
 *
 * Worth its own check because the reading route says so in words. A round form
 * holds no orientation in itself; the door is where the claim lives, and for a
 * while the claim was made in prose over a house that did not have one.
 */
export function checkOneDoor(house: House, layout: Layout): CheckResult {
  const jambs = house.parts.filter((p) => p.id.startsWith('pintu-tiang-'))
  const lintel = house.parts.find((p) => p.id === 'pintu-ambang')
  const door = doorOpening(layout)
  const faults: string[] = []
  if (jambs.length !== 2 || !lintel) {
    faults.push(`${jambs.length} door jambs and ${lintel ? 'one' : 'no'} lintel`)
  }

  /*
   * The part of this check that matters, and the part it did not have.
   *
   * Counting three pieces of timber says a door was built; it does not say a
   * door can be seen or walked through. This model had a frame standing behind
   * an unbroken thatch cone and passed. So: no thatch may cross the doorway,
   * and the frame must stand proud of the bare cone rather than under it.
   */
  const blocked = house.parts.filter((p) => {
    if (p.kind !== 'mesh' || p.stage !== 'ijuk') return false
    for (let i = 0; i < p.positions.length; i += 3) {
      const x = p.positions[i] ?? 0
      const y = p.positions[i + 1] ?? 0
      const z = p.positions[i + 2] ?? 0
      if (y < TOL || y > door.headY - TOL) continue
      if (Math.abs(Math.atan2(z, x)) < door.halfAngle / 2) return true
    }
    return false
  })
  if (blocked.length) faults.push(`${blocked.length} thatch courses close over the opening`)

  const buried = jambs.filter((p) => {
    if (p.kind !== 'box') return false
    return p.center[0] <= radiusAtHeight(layout.profile, p.center[1]) + TOL
  })
  if (buried.length) faults.push(`${buried.length} jambs stand inside the cone, behind the thatch`)

  const ok = faults.length === 0
  const bearing = jambs.length
    ? Math.atan2(
        jambs.reduce((sum, p) => sum + (p.kind === 'box' ? p.center[2] : 0), 0) / jambs.length,
        jambs.reduce((sum, p) => sum + (p.kind === 'box' ? p.center[0] : 0), 0) / jambs.length,
      )
    : 0
  const openWidth = 2 * door.rHead * Math.sin(door.halfAngle)
  return {
    key: 'one-door',
    titleId: 'Satu pintu yang benar-benar berlubang, dan hanya itulah arah yang dimiliki bangunan ini',
    titleEn: 'One door that is actually open, and it is the only direction this building has',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Selebar ${DIMS.doorWidth.value.toFixed(2)} m pada arah ${((bearing * 180) / Math.PI).toFixed(0)}°, menghadap compang; ijuk terpotong selebar ${openWidth.toFixed(2)} m sampai ketinggian ${door.headY.toFixed(2)} m. Bentuk yang bundar tidak menyimpan arah; pintu inilah yang menyatakannya, dan hanya ada satu.`
      : faults.join('; '),
    detailEn: ok
      ? `${DIMS.doorWidth.value.toFixed(2)} m wide on a bearing of ${((bearing * 180) / Math.PI).toFixed(0)}°, facing the compang; the thatch is cut back ${openWidth.toFixed(2)} m to a height of ${door.headY.toFixed(2)} m. A round form holds no direction; this door is what states it, and there is one.`
      : faults.join('; '),
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
    checkInsideCone(house, layout),
    checkFiveLevels(layout),
    checkCentrePost(house, layout),
    checkSegments(house, layout),
    checkDrum(house, layout),
    checkOneDoor(house, layout),
    checkThatchCoverage(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
