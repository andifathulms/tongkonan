/**
 * The checks that are claims about the kariwari.
 *
 * The generic half comes from the core unchanged for the sixteenth time, and
 * it took the water without noticing — which is worth saying, because y = 0 is
 * the bed of a bay here rather than the ground, and `checkBuildOrder` reads
 * that datum as ground the way it always has. Nothing in the core knew the
 * difference, which is the correct answer: a post standing on the bed is a
 * post standing on something.
 *
 * The particular checks are about water, age and the way between them. What
 * none of them can test is that anybody ever climbed: this project has no
 * people in it, so a grade is a floor area and a life course is a sequence of
 * floor areas, which is exactly as far as a model of a building can go.
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
import { DIMS, PACK } from './rules'
import { thatchBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * An octagon mirrors about eight planes and this model uses one of them.
 *
 * The walkway is left out, because it lands on one side and is the only thing
 * here that gives an eight-sided building a front — the same scoping the Nias
 * pack uses for its standing stones, and for the same reason.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: (part) => part.stage !== 'titian',
    labelId: 'Simetris terhadap z = 0 — satu dari delapan bidang cerminnya',
    labelEn: 'Symmetric about z = 0 — one of its eight mirror planes',
  })
}

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
 * Everything a person uses is above the highest water, and nothing is bedded
 * on a stone.
 *
 * The first half is what raising this house is *for*: not livestock, not
 * privacy, not standing — the tide. The second half is the thing that makes it
 * a different building from every other raised one here: there is no pad stone
 * under any post, because there is nowhere to put one.
 */
export function checkAboveTheTide(house: House, layout: Layout): CheckResult {
  const high = layout.waterDepth + layout.tide
  const wet: string[] = []
  for (const part of house.parts) {
    if (part.stage === 'tiang' || part.stage === 'titian') continue
    const b = partBounds(part)
    if (b.min[1] < high + TOL) wet.push(part.id)
  }
  const first = layout.levels[0]
  const clear = (first ? first.y - DIMS.floorThickness.value - DIMS.bearerDepth.value : 0) - high
  const faults: string[] = []
  if (wet.length > 0) faults.push(`${wet.length} parts stand in the tide: ${wet.slice(0, 5).join(', ')}`)
  // The chosen height against the required clearance: two numbers, and the
  // house is only dry while the first leaves room for the second.
  if (clear < DIMS.freeboard.value - TOL) {
    faults.push(
      clear < 0
        ? `the water is ${(-clear).toFixed(2)} m over the floor at high tide`
        : `only ${clear.toFixed(2)} m of clearance, where ${DIMS.freeboard.value.toFixed(2)} m is needed`,
    )
  }
  if (house.parts.some((p) => p.name === 'batu alas')) faults.push('there is a pad stone')

  const ok = faults.length === 0
  return {
    key: 'above-the-tide',
    titleId: 'Semuanya di atas air tertinggi, dan tidak ada satu pun batu alas',
    titleEn: 'Everything above the highest water, and not one pad stone',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Air rata-rata ${layout.waterDepth.toFixed(2)} m, pasang ${layout.tide.toFixed(2)} m, dan gelagar terendah ${clear.toFixed(2)} m di atas air tertinggi. Tiang dipancang ke dasar tanpa batu alas — tidak ada tempat untuk meletakkannya, dan bagian tiang yang menahan bangunan ini tidak akan pernah terlihat.`
      : faults.join('; '),
    detailEn: ok
      ? `Mean water at ${layout.waterDepth.toFixed(2)} m, a ${layout.tide.toFixed(2)} m tide, and the lowest bearer ${clear.toFixed(2)} m above the highest water. The posts are driven into the bed with no pad stone — there is nowhere to set one, and the part of the post that holds this building up will never be seen.`
      : faults.join('; '),
  }
}

/**
 * Every level smaller than the one below it.
 *
 * The building is a pyramid of age: the youngest grade is the most numerous
 * and has the widest floor, and each grade above it is fewer and narrower. It
 * is the only vertical division in this project that says something about *how
 * many* people belong to each band rather than what happens in it.
 */
export function checkFewerHigherUp(layout: Layout): CheckResult {
  const faults: string[] = []
  for (let i = 1; i < layout.levels.length; i++) {
    const below = layout.levels[i - 1]
    const above = layout.levels[i]
    if (!below || !above) continue
    if (above.area >= below.area - TOL) {
      faults.push(`${above.nameEn} (${above.area.toFixed(1)} m²) is not smaller than ${below.nameEn}`)
    }
    if (above.y <= below.y) faults.push(`${above.nameEn} is not above ${below.nameEn}`)
  }
  const ok = faults.length === 0
  return {
    key: 'fewer-higher',
    titleId: 'Tiap tingkat lebih kecil daripada tingkat di bawahnya',
    titleEn: 'Every level is smaller than the one below it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.levels.map((l) => `${l.nameId} ${l.area.toFixed(1)} m²`).join(' → ')
      : faults.join('; '),
    detailEn: ok
      ? layout.levels.map((l) => `${l.nameEn} ${l.area.toFixed(1)} m²`).join(' → ')
      : faults.join('; '),
  }
}

/**
 * One pole between each pair of consecutive levels, and none that skips one.
 *
 * The claim is about a route rather than a member, which puts it beside the
 * lumbung's `checkNoOtherWayUp`: there the subject is the absence of a way up,
 * here it is the absence of a *short cut*. A man leaves the boys' floor by
 * climbing into the young men's, and there is no other way to the top.
 */
export function checkOneGradeAtATime(house: House, layout: Layout): CheckResult {
  const poles = house.parts.filter((p) => p.stage === 'tangga')
  const faults: string[] = []
  const wanted = Math.max(0, layout.levels.length - 1)
  if (poles.length !== wanted) faults.push(`${poles.length} poles for ${layout.levels.length} levels`)
  for (const pole of poles) {
    const b = partBounds(pole)
    const from = layout.levels.findIndex((l) => Math.abs(l.y - b.min[1]) < 0.2)
    const to = layout.levels.findIndex((l) => Math.abs(l.y - b.max[1]) < 0.2)
    if (from < 0 || to < 0) {
      faults.push(`${pole.id} does not run between two floors`)
      continue
    }
    if (to - from !== 1) faults.push(`${pole.id} skips ${to - from - 1} level(s)`)
  }
  const ok = faults.length === 0
  return {
    key: 'one-grade',
    titleId: 'Satu galah antara tingkat yang berurutan, dan tidak ada yang melompat',
    titleEn: 'One pole between consecutive levels, and none that skips',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${poles.length} galah untuk ${layout.levels.length} tingkat. Golongan usia ditinggalkan dengan menaiki golongan berikutnya: tidak ada jalan dari lantai anak-anak ke lantai orang tua yang tidak melewati lantai di antaranya.`
      : faults.join('; '),
    detailEn: ok
      ? `${poles.length} poles for ${layout.levels.length} levels. A grade is left by climbing into the next one: there is no route from the boys’ floor to the elders’ that does not pass through the floor between.`
      : faults.join('; '),
  }
}

/** Eight sides, eight posts, eight rafters — the plan and the peak agree. */
export function checkEightSided(house: House, layout: Layout): CheckResult {
  const posts = house.parts.filter((p) => p.name === 'tiang').length
  const rafters = house.parts.filter((p) => p.stage === 'rangka').length
  // By name: the plate ring is raised with the walls and is not one of them.
  const walls = house.parts.filter((p) => p.name === 'dinding').length
  const faults: string[] = []
  if (layout.facets !== 8) faults.push(`${layout.facets} sides`)
  if (posts !== 8) faults.push(`${posts} posts`)
  if (rafters !== 8) faults.push(`${rafters} rafters`)
  if (walls !== 8 * layout.levels.length) faults.push(`${walls} wall panels for ${layout.levels.length} levels`)
  const ok = faults.length === 0
  return {
    key: 'eight-sided',
    titleId: 'Bersegi delapan, dan denah serta puncaknya sepakat tentang itu',
    titleEn: 'Eight-sided, and the plan and the peak agree about it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Delapan sisi, delapan tiang, delapan kasau, ${walls} bidang dinding. Lima belas bangunan lain di sini berdenah persegi panjang atau lingkaran; segi delapan bukan keduanya, dan tidak ada sisinya yang menjadi muka hanya karena paling lebar.`
      : faults.join('; '),
    detailEn: ok
      ? `Eight sides, eight posts, eight rafters, ${walls} wall panels. The other fifteen buildings here are rectangles or circles; an octagon is neither, and no side of it becomes the front by being the widest.`
      : faults.join('; '),
  }
}

/** Thatch courses lap with no bare band. */
export function checkThatchCoverage(layout: Layout): CheckResult {
  const bands = thatchBands(layout)
  const gaps: string[] = []
  const first = bands[0]
  if (!first || first.foot < 1 - TOL) gaps.push('the lowest course does not reach the eave')
  for (let k = 1; k < bands.length; k++) {
    const below = bands[k - 1]
    const cur = bands[k]
    if (!below || !cur) continue
    if (cur.foot - below.head <= TOL) gaps.push(`course ${k + 1} does not lap course ${k}`)
  }
  const top = bands[bands.length - 1]
  if (!top || top.head > TOL) gaps.push('the top course does not reach the point')
  const ok = gaps.length === 0
  return {
    key: 'thatch-coverage',
    titleId: 'Lapis rumbia saling menindih tanpa celah sampai ke puncak',
    titleEn: 'Thatch courses lap with no bare band, up to the point',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis dari tepi ke puncak, naik ${(layout.apexY - layout.plateY).toFixed(1)} m.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses from the eave to the point, rising ${(layout.apexY - layout.plateY).toFixed(1)} m.`
      : gaps.join('; '),
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
    checkAboveTheTide(house, layout),
    checkFewerHigherUp(layout),
    checkOneGradeAtATime(house, layout),
    checkEightSided(house, layout),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
