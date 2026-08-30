/**
 * The checks that are claims about the ammu hawu.
 *
 * `checkHullProportion` is the one this building is here for, and it is the
 * first check in this project that tests a *likeness*. A tradition that calls
 * its house a boat is making a claim, and the claim can be either about words
 * or about shape. This one asks the second question: does the plan hold a
 * hull's proportion, or a room's? The bounds are declared in this pack, and
 * `test/sabu.test.ts` holds them against the Bajau lepa's actual hull —
 * because a pack may not import another tradition, and a test may.
 *
 * `checkEndsAreNotAlike` is its companion. A boat has a bow and a stern; so
 * the model is required to be asymmetric along its length, which is the only
 * check in this project whose success condition is that a symmetry *fails*.
 * Across the beam it is symmetric, exactly as a hull is, and that half is the
 * ordinary check.
 *
 * `checkWayIn` is where the shape costs something. The roof comes down nearly
 * to the floor, so the gap under the eave is the only way in — and the eave
 * follows from the beam. Widen the hull and the door closes.
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
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/** Symmetric across the beam, as a hull is. Along the length it is not. */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 0,
    include: () => true,
    labelId: 'Simetris terhadap lunas, x = 0 — seperti lambung perahu, dan hanya pada arah itu',
    labelEn: 'Symmetric about the keel, x = 0 — as a hull is, and only in that direction',
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
 * The plan holds a hull's proportion rather than a room's.
 *
 * The first check in this project to test a likeness. What makes it able to
 * fail is that the two numbers are independent: the length is a count of bays
 * and the beam is a width somebody chose, and nothing but this rule relates
 * them.
 */
export function checkHullProportion(layout: Layout): CheckResult {
  const faults: string[] = []
  if (layout.ratio.actual < layout.ratio.least - TOL) {
    faults.push(`${layout.ratio.actual.toFixed(2)} long to the beam, and a hull is at least ${layout.ratio.least.toFixed(2)}`)
  }
  if (layout.ratio.actual > layout.ratio.most + TOL) {
    faults.push(`${layout.ratio.actual.toFixed(2)} long to the beam, and nothing longer than ${layout.ratio.most.toFixed(2)} is built`)
  }
  const ok = faults.length === 0
  return {
    key: 'hull-proportion',
    titleId: 'Denahnya memegang perbandingan lambung perahu, bukan perbandingan ruang',
    titleEn: 'The plan holds a hull’s proportion rather than a room’s',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Panjang ${(layout.halfZ * 2).toFixed(2)} m terhadap lebar ${(layout.halfX * 2).toFixed(2)} m, yaitu ${layout.ratio.actual.toFixed(2)} : 1, di dalam rentang ${layout.ratio.least.toFixed(2)}–${layout.ratio.most.toFixed(2)}. Ini pemeriksaan pertama dalam projek ini yang mengujikan sebuah kemiripan: sebuah tradisi yang menyebut rumahnya perahu sedang membuat pernyataan, dan pernyataan itu dapat tentang kata atau tentang bentuk. Yang diperiksa di sini yang kedua.`
      : faults.join('; '),
    detailEn: ok
      ? `${(layout.halfZ * 2).toFixed(2)} m long to a ${(layout.halfX * 2).toFixed(2)} m beam, which is ${layout.ratio.actual.toFixed(2)} : 1, inside a ${layout.ratio.least.toFixed(2)}–${layout.ratio.most.toFixed(2)} range. It is the first check in this project to test a likeness: a tradition that calls its house a boat is making a claim, and the claim can be about words or about shape. This checks the second.`
      : faults.join('; '),
  }
}

/**
 * The two ends are not alike.
 *
 * The only check here whose success condition is that a symmetry fails: swap
 * the bow for the stern and the model changes, which is what makes the claim
 * more than a name.
 */
export function checkEndsAreNotAlike(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const bowPosts = house.parts.filter((p) => p.name === 'tiang-haluan')
  if (bowPosts.length !== 2) faults.push(`${bowPosts.length} bow posts, expected 2`)
  for (const post of bowPosts) {
    if (post.kind !== 'box') continue
    if (post.size[0] <= DIMS.postSection.value + TOL) faults.push(`${post.id} is no larger than an ordinary post`)
    if (partBounds(post).min[2] > layout.bow + DIMS.bayLength.value) faults.push(`${post.id} does not stand at the bow`)
  }
  const stern = house.parts.find((p) => p.name === 'buritan')
  if (!stern) faults.push('there is no stern')
  if (stern) {
    const b = partBounds(stern)
    if (b.max[1] <= layout.ridgeY + TOL) faults.push('the stern does not stand above the keel')
    if ((b.min[2] + b.max[2]) / 2 < 0) faults.push('the stern is at the bow end')
  }
  const ok = faults.length === 0
  return {
    key: 'ends-are-not-alike',
    titleId: 'Kedua ujungnya tidak sama',
    titleEn: 'The two ends are not alike',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Tiang haluan ${(DIMS.bowPost.value * 100).toFixed(0)} cm terhadap tiang biasa ${(DIMS.postSection.value * 100).toFixed(0)} cm, dan buritannya berdiri ${DIMS.sternRise.value.toFixed(2)} m di atas lunas. Perahu punya haluan dan buritan yang tidak dapat ditukar; ini satu-satunya pemeriksaan dalam projek ini yang berhasil justru ketika sebuah simetri gagal.`
      : faults.join('; '),
    detailEn: ok
      ? `A ${(DIMS.bowPost.value * 100).toFixed(0)} cm bow post against ${(DIMS.postSection.value * 100).toFixed(0)} cm elsewhere, and a stern standing ${DIMS.sternRise.value.toFixed(2)} m above the keel. A boat has a bow and a stern that cannot be swapped; this is the only check in the project that succeeds precisely when a symmetry fails.`
      : faults.join('; '),
  }
}

/**
 * There is a way in under the eave.
 *
 * The roof is the wall, so the opening is what the roof leaves. The eave
 * height follows from the beam and the pitch; the head of the gap is a
 * separate figure; nothing relates them, and a hull widened far enough closes
 * its own door.
 */
export function checkWayIn(layout: Layout): CheckResult {
  const clear = layout.eaveY - layout.floorY
  const ok = clear >= layout.door.head - TOL
  return {
    key: 'way-in',
    titleId: 'Ada jalan masuk di bawah tepi atap',
    titleEn: 'There is a way in under the eave',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Celah setinggi ${clear.toFixed(2)} m di bawah tepi atap, terhadap ${layout.door.head.toFixed(2)} m yang diperlukan. Tepi atapnya turun mengikuti lebar lambung: yang menentukan tinggi celah ini bukan pintunya melainkan seberapa lebar rumahnya dibuat.`
      : `celahnya tinggal ${clear.toFixed(2)} m dan yang diperlukan ${layout.door.head.toFixed(2)} m`,
    detailEn: ok
      ? `A ${clear.toFixed(2)} m gap under the eave against the ${layout.door.head.toFixed(2)} m needed. The eave falls with the beam: what sets the height of this opening is not the door but how wide the house was made.`
      : `the gap is down to ${clear.toFixed(2)} m and ${layout.door.head.toFixed(2)} m is needed`,
  }
}

/**
 * The roof is the wall.
 *
 * What separates this from an ordinary gabled house is that the eave is low
 * enough that there is barely a wall under it. Stated as an upper bound on the
 * wall, so a roof quietly lifted off the floor would be caught.
 */
export function checkRoofIsTheHull(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const wall = layout.eaveY - layout.floorY
  const room = layout.ridgeY - layout.floorY
  if (wall > room * 0.6) faults.push(`the wall is ${wall.toFixed(2)} m of a ${room.toFixed(2)} m section: this is a walled house`)
  for (const part of house.parts) {
    if (part.name !== 'dinding') continue
    if (partBounds(part).max[1] > layout.eaveY + TOL) faults.push(`${part.id} stands above the eave`)
  }
  const ok = faults.length === 0
  return {
    key: 'roof-is-the-hull',
    titleId: 'Atapnya adalah dindingnya',
    titleEn: 'The roof is the wall',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Dinding hanya ${wall.toFixed(2)} m dari potongan setinggi ${room.toFixed(2)} m; sisanya atap. Yang pada dua puluh delapan bangunan lain di sini menjadi dinding, di sini bagian bawah atap — dan itulah sebabnya jalan masuknya celah di bawah tritisan, bukan pintu yang dilubangkan.`
      : faults.join('; '),
    detailEn: ok
      ? `Only ${wall.toFixed(2)} m of wall in a ${room.toFixed(2)} m section; the rest is roof. What is a wall on the other twenty-eight buildings here is the lower part of this roof — which is why the way in is a gap under the eave rather than a door cut in something.`
      : faults.join('; '),
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
    checkHullProportion(layout),
    checkEndsAreNotAlike(house, layout),
    checkWayIn(layout),
    checkRoofIsTheHull(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
