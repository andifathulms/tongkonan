/**
 * The checks that are claims about the imah.
 *
 * The generic half comes from the core unchanged for the nineteenth time, and
 * it took a sloping site without noticing — which is worth stating, because
 * `checkBuildOrder` reads "on the ground" as a height near zero and here the
 * ground is a part. A stone resting on the hillside is a stone resting on
 * something, and the core had no opinion about what.
 *
 * Three of the particular checks are one argument in three pieces: the ground
 * is not cut, the floor is level anyway, and every post is therefore a
 * different length. Take any one away and the other two stop meaning anything.
 *
 * What cannot be checked is most of what the tradition actually says. A sawn
 * beam and a split one are the same shape; a house built with iron and one
 * built without look identical once the frame is closed. Those prohibitions
 * are declared in the pack and tested by nothing, and saying so is the honest
 * form of the limit — the same one the Nias pack states about strength and the
 * Dani pack about warmth.
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
import { groundAt } from './frame'
import { PACK } from './rules'
import { hateupBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * Symmetric across the slope and deliberately not along it.
 *
 * Uphill and downhill are not alike here and must not be: the posts at one end
 * are longer than the posts at the other, and that difference is the building.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    // The side door the outer villages are allowed is on one side by
    // definition, so it is left out of the claim rather than the claim being
    // softened — the scoping the Minang pack arrived at for its bilik.
    include: (part) => part.id !== 'bilik-samping',
    labelId: 'Simetris melintang lereng, z = 0 — dan sengaja tidak sepanjang lerengnya',
    labelEn: 'Symmetric across the slope, z = 0 — and deliberately not along it',
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
 * Nothing is dug and nothing is levelled: every stone sits on the hillside as
 * it is.
 *
 * The prohibition, as far as a model can carry it. A stone below the surface
 * would be a hole somebody dug; a stone above it would be a platform somebody
 * built. Both are the same fault and both are refused here.
 */
export function checkGroundIsNotCut(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  let worst = 0
  for (const part of house.parts) {
    if (part.stage !== 'batu') continue
    const b = partBounds(part)
    const x = (b.min[0] + b.max[0]) / 2
    const expected = groundAt(layout, x)
    const off = b.min[1] - expected
    worst = Math.max(worst, Math.abs(off))
    if (Math.abs(off) > 0.02) {
      faults.push(`${part.id} sits ${off > 0 ? 'above' : 'below'} the ground by ${Math.abs(off).toFixed(2)} m`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'ground-not-cut',
    titleId: 'Tidak ada yang digali dan tidak ada yang diratakan: tiap batu duduk pada tanah apa adanya',
    titleEn: 'Nothing dug and nothing levelled: every stone sits on the ground as it is',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.parts.filter((p) => p.stage === 'batu').length} batu di atas lereng ${(layout.slope * 100).toFixed(0)}%, dan tidak satu pun menyimpang lebih dari ${(worst * 1000).toFixed(0)} mm dari permukaan tanahnya. Delapan belas bangunan lain di sini berdiri di atas tanah datar karena model memerlukan titik awal; yang ini berdiri di atas lereng yang ada dalam daftar bagiannya.`
      : faults.slice(0, 5).join('; '),
    detailEn: ok
      ? `${house.parts.filter((p) => p.stage === 'batu').length} stones on a ${(layout.slope * 100).toFixed(0)}% slope, and not one of them off its own patch of ground by more than ${(worst * 1000).toFixed(0)} mm. The other eighteen buildings here stand on level ground because a model needs somewhere to start; this one stands on a hillside that is in its own part list.`
      : faults.slice(0, 5).join('; '),
  }
}

/**
 * The floor is one level plane, over ground that is not.
 *
 * The other half of the prohibition. Refusing to cut the ground is only a
 * claim if something above it is level: otherwise the house would simply be a
 * tilted box, which is easier to build and states nothing.
 */
export function checkFloorIsLevel(house: House, layout: Layout): CheckResult {
  const floors = house.parts.filter((p) => p.stage === 'palupuh' && p.name === 'palupuh')
  const tops = floors.map((p) => partBounds(p).max[1])
  const spread = tops.length > 0 ? Math.max(...tops) - Math.min(...tops) : 0
  const drop = layout.length * layout.slope
  const ok = spread < TOL && floors.length > 0
  return {
    key: 'floor-level',
    titleId: 'Lantainya satu bidang datar, di atas tanah yang tidak datar',
    titleEn: 'The floor is one level plane, over ground that is not',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Tanahnya turun ${drop.toFixed(2)} m sepanjang rumah dan lantainya tidak turun sama sekali. Menolak meratakan tanah baru menjadi pernyataan kalau ada sesuatu di atasnya yang datar; kalau tidak, rumahnya hanya sebuah kotak yang miring.`
      : `lantai pada ${tops.length} ketinggian, selisih ${spread.toFixed(3)} m`,
    detailEn: ok
      ? `The ground falls ${drop.toFixed(2)} m along the house and the floor does not fall at all. Refusing to level the ground is only a statement if something above it is level; otherwise the house is just a tilted box.`
      : `the floor is at ${tops.length} heights, spread ${spread.toFixed(3)} m`,
  }
}

/**
 * Every post is a different length, and none is longer than one pole.
 *
 * The cost of the prohibition, in metres, and the limit it runs into. A post
 * is one piece of split timber: it is not spliced, so when the slope makes the
 * downhill post longer than a pole, the house cannot be built on that ground
 * without doing the one thing that is forbidden.
 */
export function checkPostsFollowTheGround(house: House, layout: Layout): CheckResult {
  const posts = house.parts.filter((p) => p.stage === 'tihang')
  const lengths = posts.map((p) => {
    const b = partBounds(p)
    return b.max[1] - b.min[1]
  })
  const longest = lengths.length > 0 ? Math.max(...lengths) : 0
  const shortest = lengths.length > 0 ? Math.min(...lengths) : 0
  const distinct = new Set(lengths.map((l) => l.toFixed(3))).size
  const faults: string[] = []
  if (longest > layout.poleLength + TOL) {
    faults.push(
      `the downhill post is ${longest.toFixed(2)} m, and one pole gives ${layout.poleLength.toFixed(2)} m`,
    )
  }
  if (layout.slope > TOL && distinct < 2) faults.push('every post is the same length on sloping ground')
  const ok = faults.length === 0
  return {
    key: 'posts-follow-ground',
    titleId: 'Tiap tiang sepanjang yang disisakan tanah, dan tidak ada yang melebihi satu batang',
    titleEn: 'Every post as long as the ground leaves it, and none longer than one pole',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${distinct} panjang berbeda, dari ${shortest.toFixed(2)} m di sisi atas sampai ${longest.toFixed(2)} m di sisi bawah, terhadap ${layout.poleLength.toFixed(2)} m yang diberikan satu batang. Selisih antara tiang terpanjang dan terpendek adalah lerengnya, dinyatakan dalam meter.`
      : faults.join('; '),
    detailEn: ok
      ? `${distinct} different lengths, from ${shortest.toFixed(2)} m uphill to ${longest.toFixed(2)} m downhill, against the ${layout.poleLength.toFixed(2)} m one pole gives. The difference between the longest post and the shortest is the slope, stated in metres.`
      : faults.join('; '),
  }
}

/** No iron in the frame: every joint is a lashing or a notch. */
export function checkNoIron(house: House): CheckResult {
  const kinds = new Set(house.joints.map((j) => j.kind))
  const ok = house.joints.length > 0 && [...kinds].every((k) => k === 'talian' || k === 'takik')
  return {
    key: 'no-iron',
    titleId: 'Tidak ada besi pada rangka: ikat dan takik saja',
    titleEn: 'No iron in the frame: lashings and notches only',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.joints.length} sambungan, semuanya ikat atau takik. Rumah woloan Minahasa sampai pada sambungan yang dapat dilepas karena rumahnya harus dapat diangkut; di sini alasannya larangan, dan keduanya berakhir pada sambungan yang sama lewat dua jalan yang tidak berhubungan.`
      : `jenis sambungan: ${[...kinds].join(', ')}`,
    detailEn: ok
      ? `${house.joints.length} joints, every one a lashing or a notch. The Minahasa woloan house arrives at reversible joints because the building has to be carried away; here the reason is a prohibition, and the two end at the same joint by two unrelated routes.`
      : `joint kinds: ${[...kinds].join(', ')}`,
  }
}

/** Thatch courses lap with no bare band. */
export function checkHateupCoverage(layout: Layout): CheckResult {
  const bands = hateupBands(layout)
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
    key: 'hateup-coverage',
    titleId: 'Lapis atap daun saling menindih tanpa celah',
    titleEn: 'Thatch courses lap with no bare band',
    status: ok ? 'pass' : 'fail',
    detail: ok ? `${bands.length} lapis dari tepi ke bubungan.` : gaps.join('; '),
    detailEn: ok ? `${bands.length} courses from eave to ridge.` : gaps.join('; '),
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
    checkGroundIsNotCut(house, layout),
    checkFloorIsLevel(house, layout),
    checkPostsFollowTheGround(house, layout),
    checkNoIron(house),
    checkHateupCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}

