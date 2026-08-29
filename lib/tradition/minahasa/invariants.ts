/**
 * The checks that are claims about the woloan house.
 *
 * The generic half comes from the core unchanged for the seventeenth time, and
 * one of the particular ones is a kind this project has never had.
 *
 * `checkBuildOrder` asks whether every part, when it was placed, had something
 * under it. Sixteen buildings have answered that. `checkCanBeUnbuilt` asks the
 * same sequence in reverse — whether every part, when it is *removed*, has
 * nothing left resting on it — and only this building has ever had to. A house
 * that can only be demolished passes the first check and fails the second, and
 * until now nothing in the project could tell the two apart.
 *
 * What none of these can test is that the pieces go back together at the other
 * end. There is nobody in this model to number them.
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
import { PACK } from './rules'
import { shingleBands } from './roof'
import type { House, Layout, Part } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4
/** the slack the build-order check uses, so the two agree about touching */
const TOUCH = 0.02

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang tengah memanjang, z = 0',
    labelEn: 'Symmetric about the long mid-plane, z = 0',
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
 * Does `above` rest on `below` — that is, does its underside sit on the other's
 * top, over the same ground?
 *
 * Written as vertical support rather than as contact, and the difference is
 * what makes the reverse walk mean anything. Two ridge pieces meeting end to
 * end touch, and neither carries the other; a rafter's foot on a plate is
 * carried. The first version of this check said "touching" and reported every
 * pair of collinear members as holding each other up, which is a statement
 * about a bounding box rather than about a building.
 *
 * Mesh parts are never supporters. The covering is a single course of shingles
 * whose bounding box is the whole roof, and a bounding box is not a shape —
 * the coarseness this project warns about elsewhere, met here for the first
 * time in a check that walks pairs.
 */
function rests(above: Part, below: Part): boolean {
  if (below.kind === 'mesh' || above.kind === 'mesh') return false
  const a = partBounds(above)
  const b = partBounds(below)
  if (Math.abs(a.min[1] - b.max[1]) > TOUCH) return false
  return (
    a.min[0] <= b.max[0] - TOUCH &&
    a.max[0] >= b.min[0] + TOUCH &&
    a.min[2] <= b.max[2] - TOUCH &&
    a.max[2] >= b.min[2] + TOUCH
  )
}

/**
 * The sequence runs backwards: nothing is removed while something rests on it.
 *
 * This is the building. A woloan house is pegged together on the understanding
 * that it will be unpegged, numbered, carried away and put up again — so the
 * order that raised it has to be an order that can be walked in reverse, and
 * that is a stronger requirement than the one every other pack here satisfies.
 *
 * Two parts that lean on each other pass the forward check, because the second
 * one placed found the first already standing. They fail this one, because
 * neither can be taken out first — which is exactly what a frame you have to
 * cut apart looks like from the inside.
 */
export function checkCanBeUnbuilt(house: House): CheckResult {
  const parts = [...house.parts]
  const standing = new Set(parts.map((p) => p.id))
  const faults: string[] = []

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]
    if (!part) continue
    const held = parts.filter(
      (other) => other.id !== part.id && standing.has(other.id) && rests(other, part),
    )
    if (held.length > 0) {
      faults.push(`${part.id} still carries ${held.map((h) => h.id).slice(0, 3).join(', ')}`)
    }
    standing.delete(part.id)
  }

  const ok = faults.length === 0
  return {
    key: 'can-be-unbuilt',
    titleId: 'Urutannya dapat dijalankan mundur: tidak ada yang dilepas selagi ada yang bertumpu padanya',
    titleEn: 'The sequence runs backwards: nothing is removed while something rests on it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${parts.length} bagian dilepas satu per satu dari yang terakhir dipasang, dan tidak satu pun masih menahan sesuatu ketika gilirannya tiba. Enam belas bangunan lain dalam projek ini hanya diminta berdiri; yang ini juga diminta dapat dibongkar.`
      : faults.slice(0, 6).join('; '),
    detailEn: ok
      ? `${parts.length} parts come off one at a time from the last one placed, and not one of them is still carrying anything when its turn arrives. The other sixteen buildings in this project are only required to go up; this one is required to come down as well.`
      : faults.slice(0, 6).join('; '),
  }
}

/**
 * No member longer than the road allows — when the house is built to travel.
 *
 * The check is conditional on the rule, and deliberately: turning the rule off
 * is how a reader sees what it costs. A fixed house is a better-framed house
 * by every ordinary measure, with longer members and fewer joints, and this is
 * the check that goes quiet when it stops being movable.
 */
export function checkCutToTheRoad(house: House, layout: Layout): CheckResult {
  if (!layout.movable) {
    return {
      key: 'cut-to-road',
      titleId: 'Tidak ada batang yang lebih panjang daripada yang dapat diangkut',
      titleEn: 'No member longer than what can be carried',
      status: 'skip',
      detail:
        'Rumah ini tidak dibuat untuk pindah, jadi batangnya dipotong menurut bangunannya dan bukan menurut jalannya. Rangkanya lebih baik dan rumahnya tidak dapat diangkut.',
      detailEn:
        'This house is not built to move, so its members are cut to the building rather than to the road. The frame is better and the house cannot be carried away.',
    }
  }
  const over: string[] = []
  let longest = 0
  for (const part of house.parts) {
    if (part.stage === 'atap' || part.stage === 'batu') continue
    const b = partBounds(part)
    const run = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2])
    longest = Math.max(longest, run)
    if (run > layout.haulLength + TOL) over.push(`${part.id} (${run.toFixed(2)} m)`)
  }
  const ok = over.length === 0
  return {
    key: 'cut-to-road',
    titleId: 'Tidak ada batang yang lebih panjang daripada yang dapat diangkut',
    titleEn: 'No member longer than what can be carried',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Batang terpanjang ${longest.toFixed(2)} m, dan yang diizinkan jalan ${layout.haulLength.toFixed(2)} m. Rangkanya adalah kumpulan potongan yang berukuran untuk bepergian, bukan rangka yang berukuran untuk bangunannya.`
      : `${over.length} batang terlalu panjang: ${over.slice(0, 4).join(', ')}`,
    detailEn: ok
      ? `The longest member is ${longest.toFixed(2)} m against the ${layout.haulLength.toFixed(2)} m the road allows. The frame is a set of pieces sized to travel rather than a frame sized to the building.`
      : `${over.length} members are too long: ${over.slice(0, 4).join(', ')}`,
  }
}

/** Every joint is a peg, because a peg comes out again. */
export function checkEveryJointReversible(house: House): CheckResult {
  const kinds = new Set(house.joints.map((j) => j.kind))
  const ok = house.joints.length > 0 && [...kinds].every((k) => k === 'pasak')
  return {
    key: 'joints-reversible',
    titleId: 'Setiap sambungan adalah pasak, dan pasak dapat dikeluarkan lagi',
    titleEn: 'Every joint is a peg, and a peg comes out again',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.joints.length} sambungan, semuanya pasak. Satu-satunya pak dalam projek ini dengan satu jenis sambungan karena alasan yang bukan kekurangan: membuka sambungan di sini tidak boleh merusaknya.`
      : `jenis sambungan: ${[...kinds].join(', ')}`,
    detailEn: ok
      ? `${house.joints.length} joints, every one a peg. The only pack in this project with a single joint kind for a reason that is not a shortfall: undoing a joint here may not break it.`
      : `joint kinds: ${[...kinds].join(', ')}`,
  }
}

/** The stairs the front carries, and where they stand on it. */
export function checkStairs(house: House, layout: Layout): CheckResult {
  const treads = house.parts.filter((p) => p.name === 'tangga')
  const zs = new Set(treads.map((p) => partBounds(p).max[2].toFixed(3)))
  const wanted = layout.stairs.length
  const faults: string[] = []
  if (zs.size !== wanted) faults.push(`${zs.size} flights, wanted ${wanted}`)
  if (wanted === 2) {
    const [a, b] = layout.stairs
    if (!a || !b || Math.abs(a.z + b.z) > TOL) faults.push('the two flights are not a pair')
  }
  const ok = faults.length === 0
  return {
    key: 'stairs',
    titleId: 'Tangga di muka: dua yang setara, atau satu di tengah',
    titleEn: 'The stairs at the front: two equal ones, or one in the middle',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? wanted === 2
        ? 'Dua tangga, satu di tiap ujung serambi, dan keduanya sama. Serambi menjadi jalan lintas di muka rumah, dan tidak ada satu pun tangga yang menjadi pintu utama.'
        : 'Satu tangga di tengah: serambi menjadi pendaratan, dan rumah ini mendapat pintu utama yang biasanya tidak dimilikinya.'
      : faults.join('; '),
    detailEn: ok
      ? wanted === 2
        ? 'Two stairs, one at each end of the veranda, and the pair is equal. The veranda becomes a passage across the front, and neither stair is the main way in.'
        : 'One stair in the middle: the veranda becomes a landing, and the house acquires a main way in that it does not usually have.'
      : faults.join('; '),
  }
}

/** Shingle courses lap with no bare band. */
export function checkShingleCoverage(layout: Layout): CheckResult {
  const bands = shingleBands(layout)
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
  if (!top || top.head > TOL) gaps.push('the top course does not reach the ridge')
  const ok = gaps.length === 0
  return {
    key: 'shingle-coverage',
    titleId: 'Lapis sirap saling menindih tanpa celah',
    titleEn: 'Shingle courses lap with no bare band',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis dari tepi ke bubungan. Sirap adalah bagian yang paling jarang ikut pindah: yang dijual rangkanya.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses from eave to ridge. The shingles are the part least likely to travel: what is sold is the frame.`
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
    checkCanBeUnbuilt(house),
    checkCutToTheRoad(house, layout),
    checkEveryJointReversible(house),
    checkStairs(house, layout),
    checkShingleCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}

