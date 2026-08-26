/**
 * The checks that are claims about the rumah gadang.
 *
 * The generic half — joints, build order, mesh integrity, part provenance and
 * the survey check that never passes — comes from the core unchanged, which
 * is the first real evidence that the split was made in the right place.
 *
 * Symmetry did not come through unchanged, and the reason is worth stating.
 * This house mirrors about z = 0 like the other one, but the plane is no
 * longer the ridge plane — the ridge lies *along* it — so the label was wrong.
 * And the house is symmetric in its frame and deliberately asymmetric in its
 * bilik, because the bilik are a tally that grows from one end. A check over
 * everything would have had to be false or be softened; scoped to the frame
 * and paired with a check on the tally itself, it says two true things
 * instead of one weakened one.
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
import { slopeDrop } from '@/lib/core/geometry'
import type { House, Layout, Part } from './types'
import { ridgeOf } from './frame'
import { RIDGE_CAP_BAND, ijukBands, roofStations } from './roof'
import { DIMS, PACK, larasInfo } from './rules'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/* ── Bound to the Minang pack ─────────────────────────────────────────── */

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
 * The frame mirrors about the transverse mid-plane.
 *
 * Scoped past the bilik, and the verdict prints how many parts were left out
 * so the narrowing is never silent. What the bilik do instead is checked by
 * `checkBilikTally`, which is the sharper claim: they are not symmetric, they
 * are sequential, and being sequential is the thing that makes them readable.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: (p: Part) => p.stage !== 'bilik',
    labelId: 'bidang tengah melintang',
    labelEn: 'the transverse mid-plane',
  })
}

/* ── The Minang checks ────────────────────────────────────────────────── */

/**
 * The ruang count is odd.
 *
 * Not a preference and not a range: a four-ruang rumah gadang is not an
 * unusual house, it is a different thing. Compare the tongkonan, where a bay
 * count beyond what the rank customarily reaches is allowed and merely
 * reported as unusual.
 */
export function checkRuangIsOdd(layout: Layout): CheckResult {
  const ok = layout.rules.ruang % 2 === 1 && layout.rules.ruang >= 3
  return {
    key: 'ruang-odd',
    titleId: 'Jumlah ruang ganjil',
    titleEn: 'The ruang count is odd',
    status: ok ? 'pass' : 'fail',
    detail: `${layout.rules.ruang} ruang; tepi ruang ${layout.ruangEdges.length}.`,
    detailEn: `${layout.rules.ruang} ruang; ${layout.ruangEdges.length} ruang boundaries.`,
  }
}

/**
 * The ridge sags in the interior and both ends rise to the same height.
 *
 * The second half is where this house parts company with the tongkonan,
 * whose front prow must stand higher than its rear. Here neither end is the
 * higher one, and a curve that made one so would be describing a different
 * building.
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
  const a = ridge(0).y
  const b = ridge(1).y
  const interior = lowestS > 0.3 && lowestS < 0.7
  const sags = lowest < a - TOL && lowest < b - TOL
  const level = Math.abs(a - b) < 1e-6
  const ok = interior && sags && level
  return {
    key: 'ridge-profile',
    titleId: 'Bubungan melengkung turun di tengah; kedua ujungnya naik sama tinggi',
    titleEn: 'The ridge sags in the interior; both ends rise to the same height',
    status: ok ? 'pass' : 'fail',
    detail: `titik terendah pada s=${lowestS.toFixed(2)} (${lowest.toFixed(2)} m); kedua ujung ${a.toFixed(2)} m dan ${b.toFixed(2)} m.`,
    detailEn: `lowest point at s=${lowestS.toFixed(2)} (${lowest.toFixed(2)} m); the two ends at ${a.toFixed(2)} m and ${b.toFixed(2)} m.`,
  }
}

/**
 * The laras is legible in the floor.
 *
 * This is the check the whole second tradition was chosen for. Under Koto
 * Piliang the floor at both ends stands above the middle and there are parts
 * holding it there; under Bodi Caniago there is no step and no such parts at
 * all. A social claim, tested with a spirit level.
 */
export function checkAnjuangFloor(house: House, layout: Layout): CheckResult {
  const laras = larasInfo(layout.rules.laras)
  const raised = house.parts.filter((p) => p.stage === 'anjuang')
  const deckTop = house.parts
    .filter((p) => p.stage === 'lantai')
    .map((p) => partBounds(p).max[1] ?? 0)
  const mainTop = deckTop.length ? Math.max(...deckTop) : 0

  if (!laras.anjuang) {
    const ok = raised.length === 0 && Math.abs(layout.anjuangRise) < TOL
    return {
      key: 'anjuang-floor',
      titleId: 'Bodi Caniago: lantai satu bidang, tanpa anjuang',
      titleEn: 'Bodi Caniago: one floor plane, no anjuang',
      status: ok ? 'pass' : 'fail',
      detail: ok
        ? `lantai rata pada ${mainTop.toFixed(2)} m; tidak ada bagian anjuang, dan ketiadaan itulah pernyataannya.`
        : `${raised.length} bagian anjuang ditemukan pada laras yang tidak mengenalnya.`,
      detailEn: ok
        ? `the floor is level at ${mainTop.toFixed(2)} m; no anjuang parts, and their absence is the statement.`
        : `${raised.length} anjuang parts found under a laras that does not have them.`,
    }
  }

  const floors = raised.filter((p) => p.id.startsWith('anjuang-lantai-'))
  if (floors.length === 0) {
    // Said plainly rather than reported as a step of minus two metres, which
    // is what subtracting an absent floor from a present one produces. A
    // verdict a reader cannot act on is not evidence.
    return {
      key: 'anjuang-floor',
      titleId: 'Koto Piliang: lantai kedua ujung naik menjadi anjuang',
      titleEn: 'Koto Piliang: the floor at both ends rises into anjuang',
      status: 'fail',
      detail: `Tidak ada anjuang yang terbangun. Naiknya lantai ${layout.anjuangRise.toFixed(3)} m lebih tipis daripada papan lantai ${DIMS.deckThickness.value.toFixed(3)} m, jadi tidak ada yang bisa dipijak.`,
      detailEn: `No anjuang was built. The step of ${layout.anjuangRise.toFixed(3)} m is thinner than the ${DIMS.deckThickness.value.toFixed(3)} m floor board that would form it, so there is nothing to stand on.`,
    }
  }
  const tops = floors.map((p) => partBounds(p).max[1] ?? 0)
  const lowestRaised = Math.min(...tops)
  const step = lowestRaised - mainTop
  const ok = step > TOL && Math.abs(step - layout.anjuangRise) < 1e-6
  return {
    key: 'anjuang-floor',
    titleId: 'Koto Piliang: lantai kedua ujung naik menjadi anjuang',
    titleEn: 'Koto Piliang: the floor at both ends rises into anjuang',
    status: ok ? 'pass' : 'fail',
    detail: `lantai tengah ${mainTop.toFixed(2)} m, lantai anjuang ${lowestRaised.toFixed(2)} m; naik ${step.toFixed(2)} m pada ${floors.length} papan.`,
    detailEn: `main floor ${mainTop.toFixed(2)} m, anjuang floor ${lowestRaised.toFixed(2)} m; a step of ${step.toFixed(2)} m over ${floors.length} boards.`,
  }
}

/**
 * The gonjong are part of the roof, at every tip.
 *
 * The first version of this check counted spires and asked whether each one
 * cleared the ridge. Four rods standing on the ridge satisfied both, and a
 * render showed the house had antennae instead of a roof — a form the whole
 * suite passed because nothing in it asked the one question that matters:
 * whether the roof surface actually reaches the point.
 *
 * So it does now. Every declared tip must have roof boarding within reach of
 * it, and the tip must stand above the ridge end rather than merely above
 * mid-span, because a gonjong that failed to clear the end of its own ridge
 * would not be a gonjong.
 */
export function checkGonjongCount(house: House, layout: Layout): CheckResult {
  const expected = larasInfo(layout.rules.laras).gonjong
  const spars = house.parts.filter((p) => p.stage === 'gonjong')
  const roof = house.parts.find((p) => p.id === 'papan-atap')

  // How near a tip the roof has to come. One rafter depth: close enough that
  // the surface is what ends in the point, far enough that a station grid
  // does not have to land exactly on it.
  const reach = DIMS.rafterDepth.value * 2
  const orphans: string[] = []
  let worst = 0
  for (const [i, tip] of layout.gonjongTips.entries()) {
    if (!roof || roof.kind !== 'mesh') {
      orphans.push(`tip ${i + 1}: no roof`)
      continue
    }
    let best = Infinity
    for (let v = 0; v < roof.positions.length; v += 3) {
      const d = Math.hypot(
        (roof.positions[v] ?? 0) - tip[0],
        (roof.positions[v + 1] ?? 0) - tip[1],
        (roof.positions[v + 2] ?? 0) - tip[2],
      )
      if (d < best) best = d
    }
    if (best > reach) orphans.push(`tip ${i + 1}: roof ${best.toFixed(2)} m away`)
    if (best > worst) worst = best
  }

  const low = layout.gonjongTips.filter((tip) => tip[1] <= layout.ridgeEndY + TOL)
  const ok =
    spars.length === expected &&
    layout.gonjongTips.length === expected &&
    orphans.length === 0 &&
    low.length === 0

  return {
    key: 'gonjong-count',
    titleId: 'Gonjong adalah bagian dari atap, bukan tiang di atasnya',
    titleEn: 'The gonjong are part of the roof, not masts standing on it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${expected} gonjong; puncak tertinggi ${Math.max(...layout.gonjongTips.map((t) => t[1])).toFixed(2)} m, ujung bubungan ${layout.ridgeEndY.toFixed(2)} m; atap mencapai tiap puncak dalam ${worst.toFixed(2)} m.`
      : `diharapkan ${expected}, ditemukan ${spars.length}; ${low.length} tidak melampaui ujung bubungan. ${orphans.join('; ')}`,
    detailEn: ok
      ? `${expected} gonjong; highest tip ${Math.max(...layout.gonjongTips.map((t) => t[1])).toFixed(2)} m against a ridge end of ${layout.ridgeEndY.toFixed(2)} m; the roof reaches every tip within ${worst.toFixed(2)} m.`
      : `expected ${expected}, found ${spars.length}; ${low.length} do not clear the ridge end. ${orphans.join('; ')}`,
  }
}

/**
 * The roof edge is level over the house and rises over the overhangs.
 *
 * The other half of the same lesson. A roof with a dead-level eave from end to
 * end is a shed, and the check above could be satisfied by bolting the tips on
 * afterwards; this one says the surface has to get there by itself.
 */
export function checkEaveRises(layout: Layout): CheckResult {
  const stations = roofStations(layout)
  const half = layout.bodyLength / 2
  const overBody = stations.filter((s) => Math.abs(s.x) <= half + 1e-9)
  const level = overBody.every((s) => Math.abs(s.eaveY - layout.eaveY) < 1e-6)
  const ends = stations.filter((s) => Math.abs(s.x) > half)
  const highest = ends.length ? Math.max(...ends.map((s) => s.eaveY)) : layout.eaveY
  const narrowest = ends.length
    ? Math.min(...ends.map((s) => s.halfWidth))
    : layout.eaveHalfDepth
  const ok = level && highest > layout.ridgeEndY + TOL && narrowest < layout.eaveHalfDepth - TOL

  return {
    key: 'eave-rises',
    titleId: 'Tepi atap mendatar di sepanjang badan rumah, lalu naik melewati bubungan di kedua ujungnya',
    titleEn: 'The roof edge runs level along the body, then rises past the ridge at both ends',
    status: ok ? 'pass' : 'fail',
    detail: `tepi mendatar di ${layout.eaveY.toFixed(2)} m sepanjang badan; naik sampai ${highest.toFixed(2)} m, melewati ujung bubungan ${layout.ridgeEndY.toFixed(2)} m, sambil menyempit dari ${layout.eaveHalfDepth.toFixed(2)} m ke ${narrowest.toFixed(2)} m.`,
    detailEn: `edge level at ${layout.eaveY.toFixed(2)} m along the body; rises to ${highest.toFixed(2)} m, past the ridge end at ${layout.ridgeEndY.toFixed(2)} m, narrowing from ${layout.eaveHalfDepth.toFixed(2)} m to ${narrowest.toFixed(2)} m.`,
  }
}

/**
 * The bilik are a sequence, not a scatter.
 *
 * One room per married daughter, filling the rear lanjar from one end with no
 * gaps — which is what makes the count readable off the building. This is the
 * claim `checkFrameSymmetry` steps around, stated positively.
 */
export function checkBilikTally(house: House, layout: Layout): CheckResult {
  const rooms = house.parts.filter((p) => p.id.startsWith('bilik-muko-'))
  const span = layout.bodyLength / layout.rules.ruang
  const interiorMin = -layout.bodyLength / 2 + span
  const interiorMax = layout.bodyLength / 2 - span

  const outside = layout.bilikZ.filter((z) => z < interiorMin - TOL || z > interiorMax + TOL)
  const sorted = [...layout.bilikZ].sort((a, b) => a - b)
  let gaps = 0
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs((sorted[i] ?? 0) - (sorted[i - 1] ?? 0) - span) > 1e-6) gaps++
  }

  const ok =
    rooms.length === layout.bilikCount &&
    layout.bilikCount === layout.rules.bilik &&
    outside.length === 0 &&
    gaps === 0
  return {
    key: 'bilik-tally',
    titleId: 'Bilik terisi berurutan di lanjar belakang, tanpa selang',
    titleEn: 'The bilik fill the rear lanjar in sequence, with no gaps',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.bilikCount} bilik dari ${layout.rules.ruang - 2} ruang dalam; berurutan, tiap satu selebar satu ruang.`
      : `${rooms.length} bilik terbangun, ${layout.bilikCount} tercatat, ${outside.length} di luar ruang dalam, ${gaps} selang.`,
    detailEn: ok
      ? `${layout.bilikCount} bilik out of ${layout.rules.ruang - 2} interior ruang; consecutive, one ruang wide each.`
      : `${rooms.length} built, ${layout.bilikCount} recorded, ${outside.length} outside the interior ruang, ${gaps} gaps.`,
  }
}

/**
 * The walls lean outward: the body is wider at the plate than at the deck.
 *
 * Stated by the sources qualitatively and left flat in the first house
 * because no source gave the tongkonan an angle. Here it is built, so it is
 * checked — measured off the wall parts themselves rather than off the number
 * that was supposed to produce them.
 */
export function checkWallsLeanOut(house: House, layout: Layout): CheckResult {
  const walls = house.parts.filter((p) => p.id.startsWith('dindiang-muko-'))
  const outer = walls.length ? Math.max(...walls.map((p) => -(partBounds(p).min[0] ?? 0))) : 0
  const foot = layout.bodyDepth / 2
  const head = foot + layout.wallLeanRun
  const ok = layout.wallLeanRun > TOL && outer > foot + layout.wallLeanRun * 0.5 && walls.length > 0
  return {
    key: 'walls-lean',
    titleId: 'Dinding condong ke luar; badan rumah melebar ke atas',
    titleEn: 'The walls lean outward; the body widens as it rises',
    status: ok ? 'pass' : 'fail',
    detail: `kaki dinding ${foot.toFixed(2)} m dari sumbu, kepala ${head.toFixed(2)} m; papan terjauh mencapai ${outer.toFixed(2)} m pada sudut ${DIMS.wallLean.value}°.`,
    detailEn: `wall foot ${foot.toFixed(2)} m from the axis, head ${head.toFixed(2)} m; the outermost board reaches ${outer.toFixed(2)} m at ${DIMS.wallLean.value}°.`,
  }
}

/** The eave oversails the outer post line, so the drip lands clear of the feet. */
export function checkEaveOversail(layout: Layout): CheckResult {
  const outerPostFace = Math.max(...layout.postX.map(Math.abs)) + layout.postSection / 2
  const clear = layout.eaveHalfDepth - outerPostFace
  const ok = clear > TOL
  return {
    key: 'eave-oversail',
    titleId: 'Tepi atap melewati garis tonggak terluar',
    titleEn: 'The eave oversails the outer post line',
    status: ok ? 'pass' : 'fail',
    detail: `tepi atap ${layout.eaveHalfDepth.toFixed(2)} m dari sumbu; muka tonggak terluar ${outerPostFace.toFixed(2)} m; julur ${clear.toFixed(2)} m.`,
    detailEn: `eave ${layout.eaveHalfDepth.toFixed(2)} m from the axis; outer post face ${outerPostFace.toFixed(2)} m; oversail ${clear.toFixed(2)} m.`,
  }
}

/** The eave clears the wall plate: over it on the way out, then down outboard of it. */
export function checkEaveClearsPlate(layout: Layout): CheckResult {
  const wallHeadX = layout.eaveHalfDepth * layout.breakFraction
  const plateTop = layout.plateY + DIMS.plateDepth.value / 2
  const roofY =
    layout.ridgeY -
    (layout.ridgeY - layout.eaveY) *
      slopeDrop(layout.breakFraction, { at: layout.breakFraction, drop: layout.kneeDrop })
  const ok =
    roofY > layout.plateY - DIMS.plateDepth.value / 2 - TOL && layout.eaveHalfDepth > wallHeadX + TOL
  return {
    key: 'eave-plate',
    titleId: 'Atap melewati balok tumpuan lalu turun di luarnya',
    titleEn: 'The eave clears the wall plate',
    status: ok ? 'pass' : 'fail',
    detail: `atap pada x=${wallHeadX.toFixed(2)} m berada di ${roofY.toFixed(2)} m; puncak balok tumpuan ${plateTop.toFixed(2)} m; tepi atap ${layout.eaveHalfDepth.toFixed(2)} m.`,
    detailEn: `roof at x=${wallHeadX.toFixed(2)} m sits at ${roofY.toFixed(2)} m; top of the wall plate ${plateTop.toFixed(2)} m; eave ${layout.eaveHalfDepth.toFixed(2)} m.`,
  }
}

/** Ijuk courses lap with no bare strip, and the ridge is covered. */
export function checkIjukCoverage(house: House, layout: Layout): CheckResult {
  const bands = ijukBands(layout)
  const gaps: string[] = []
  const first = bands[0]
  if (!first || first.foot < 1 - TOL) gaps.push('lapis terbawah tidak mencapai tepi atap')
  for (let k = 1; k < bands.length; k++) {
    const below = bands[k - 1]
    const cur = bands[k]
    if (!below || !cur) continue
    if (cur.foot - below.head <= TOL) gaps.push(`lapis ${k + 1} tidak menindih lapis ${k}`)
  }
  const top = bands[bands.length - 1]
  if (!top || top.head > TOL) gaps.push('lapis teratas tidak mencapai bubungan')
  if (!house.parts.find((p) => p.id === 'ijuk-bubungan')) gaps.push('tidak ada penutup bubungan')
  if (RIDGE_CAP_BAND.head > TOL) gaps.push('penutup bubungan tidak menutup garis bubungan')

  const minLap =
    bands.length > 1
      ? Math.min(...bands.slice(1).map((b, i) => b.foot - (bands[i]?.head ?? 0)))
      : 1
  return {
    key: 'ijuk-coverage',
    titleId: 'Lapis ijuk saling menindih tanpa celah; bubungan tertutup',
    titleEn: 'Ijuk courses lap with no bare strip; the ridge is covered',
    status: gaps.length === 0 ? 'pass' : 'fail',
    detail:
      gaps.length === 0
        ? `${bands.length} lapis; tindihan terkecil ${(minLap * 100).toFixed(1)}% dari bentang lereng.`
        : gaps.join('; '),
    detailEn:
      gaps.length === 0
        ? `${bands.length} courses; smallest lap ${(minLap * 100).toFixed(1)}% of the slope run.`
        : gaps.join('; '),
  }
}

/** Post count follows the ruang and lanjar counts. */
export function checkPostCount(house: House, layout: Layout): CheckResult {
  const expected = (layout.rules.ruang + 1) * (layout.lanjarCount + 1)
  const posts = house.parts.filter((p) => p.id.startsWith('tonggak-')).length
  const stones = house.parts.filter((p) => p.id.startsWith('batu-')).length
  const ok = posts === expected && stones === expected
  return {
    key: 'post-count',
    titleId: 'Jumlah tonggak mengikuti jumlah ruang dan lanjar',
    titleEn: 'Post count follows the ruang and lanjar counts',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.ruang} ruang × ${layout.lanjarCount} lanjar → ${layout.rules.ruang + 1} × ${layout.lanjarCount + 1} = ${expected} tonggak, ${stones} batu sandi.`
      : `diharapkan ${expected}, ditemukan ${posts} tonggak dan ${stones} batu.`,
    detailEn: ok
      ? `${layout.rules.ruang} ruang × ${layout.lanjarCount} lanjar → ${layout.rules.ruang + 1} × ${layout.lanjarCount + 1} = ${expected} posts, ${stones} pad stones.`
      : `expected ${expected}, found ${posts} posts and ${stones} stones.`,
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkFrameSymmetry(house),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkRuangIsOdd(layout),
    checkRidgeProfile(layout),
    checkAnjuangFloor(house, layout),
    checkGonjongCount(house, layout),
    checkEaveRises(layout),
    checkBilikTally(house, layout),
    checkWallsLeanOut(house, layout),
    checkIjukCoverage(house, layout),
    checkEaveOversail(layout),
    checkEaveClearsPlate(layout),
    checkPostCount(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
