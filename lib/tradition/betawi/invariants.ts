/**
 * The checks that are claims about the rumah kebaya.
 *
 * `checkInsideThePlot` is the one this building runs into, and it is the first
 * check in this project whose limit belongs to somebody else. Every other
 * bound here is a material, a body, a tree, a crowd, or a rule the tradition
 * states about itself. This one is a line on the ground with a neighbour on
 * the far side of it, and the house may not cross it however well it is built.
 *
 * `checkFrontIsForStrangers` is the claim the building is for. The langkan has
 * to be reachable from the road without passing a door, and the house's first
 * door has to be behind it — so there is a place a stranger can be received
 * that is not inside.
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

/** Symmetric across the plot, and not front to back: the road is one end. */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 0,
    include: () => true,
    labelId: 'Simetris terhadap sumbu kavling, x = 0 — dan sengaja tidak simetris dari muka ke belakang, sebab yang di muka adalah jalan',
    labelEn: 'Symmetric about the axis of the plot, x = 0 — and deliberately not front to back, because what is at the front is a road',
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
 * Everything stands inside the plot, clear of the boundary.
 *
 * The two numbers are independent in the way that matters: the plot was there
 * before the house, and how wide the house is follows from how many rooms the
 * household wants. Nothing but this rule relates them, which is what lets a
 * reasonable house become an impossible one.
 */
export function checkInsideThePlot(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const limit = layout.plot.halfX - DIMS.sideMargin.value
  for (const part of house.parts) {
    const b = partBounds(part)
    if (b.max[0] > limit + TOL || b.min[0] < -limit - TOL) {
      faults.push(`${part.id} comes within ${DIMS.sideMargin.value.toFixed(2)} m of the boundary`)
    }
    if (b.min[2] < -layout.plot.halfZ + TOL || b.max[2] > layout.plot.halfZ + TOL) {
      faults.push(`${part.id} stands outside the plot`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'inside-the-plot',
    titleId: 'Semuanya berdiri di dalam kavling, tidak menyentuh garis batas',
    titleEn: 'Everything stands inside the plot, clear of the boundary',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Rumah selebar ${(layout.house.halfX * 2).toFixed(2)} m pada kavling ${(layout.plot.halfX * 2).toFixed(2)} m, menyisakan ${layout.margin.toFixed(2)} m ke garis batas terhadap ${DIMS.sideMargin.value.toFixed(2)} m yang harus disisakan. Kavlingnya sudah ada sebelum rumahnya, dan lebar rumahnya mengikuti berapa kamar yang dikehendaki: tidak ada yang menghubungkan kedua angka itu selain aturan ini — dan di seberang garis itu ada orang lain.`
      : faults.join('; '),
    detailEn: ok
      ? `A ${(layout.house.halfX * 2).toFixed(2)} m house on a ${(layout.plot.halfX * 2).toFixed(2)} m plot, leaving ${layout.margin.toFixed(2)} m to the boundary against the ${DIMS.sideMargin.value.toFixed(2)} m that has to be left. The plot was there before the house, and the width follows from how many rooms the household wants: nothing relates those two numbers but this rule — and on the far side of that line is somebody else.`
      : faults.join('; '),
  }
}

/**
 * The front is for people who are not let in.
 *
 * Two things have to hold: the terrace is reachable from the road without
 * passing a door, and the house's first door is behind it. It is the checkable
 * form of a claim about hospitality — a room you can be received in without
 * being admitted.
 */
export function checkFrontIsForStrangers(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const terrace = house.parts.filter((p) => p.stage === 'langkan')
  if (terrace.length === 0) faults.push('there is no langkan')
  const frontZ = -layout.plot.halfZ + layout.plot.setback
  // Nothing may close the road side of the terrace above the rail.
  for (const part of house.parts) {
    if (part.name !== 'dinding') continue
    const b = partBounds(part)
    if ((b.min[2] + b.max[2]) / 2 < layout.house.front - TOL) {
      faults.push(`${part.id} closes the terrace off from the road`)
    }
  }
  const rail = house.parts.find((p) => p.id === 'pagar-langkan')
  if (!rail) faults.push('the terrace has no rail')
  if (rail) {
    const b = partBounds(rail)
    if (b.max[1] - layout.floorY > DIMS.langkanRail.value + TOL) faults.push('the rail is higher than it should be')
    if (b.min[2] < frontZ - TOL) faults.push('the rail stands off the front of the terrace')
  }
  const ok = faults.length === 0
  return {
    key: 'front-is-for-strangers',
    titleId: 'Mukanya untuk orang yang tidak dipersilakan masuk',
    titleEn: 'The front is for people who are not let in',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Langkan sedalam ${layout.langkan.depth.toFixed(2)} m dengan pagar setinggi ${DIMS.langkanRail.value.toFixed(2)} m dan tanpa pintu antara ia dan jalan; pintu pertama rumah ini berada di belakangnya. Untuk naik ke langkan tidak seorang pun perlu melewati pintu, dan untuk melewatinya semua orang perlu.`
      : faults.join('; '),
    detailEn: ok
      ? `A ${layout.langkan.depth.toFixed(2)} m terrace with a ${DIMS.langkanRail.value.toFixed(2)} m rail and no door between it and the road; this house’s first door is behind it. To get onto the langkan nobody has to pass a door, and to get past it everybody does.`
      : faults.join('; '),
  }
}

/**
 * The roof folds, and the shallow part of it is over the terrace.
 *
 * Two claims, and the second is what keeps the first from being a comparison
 * of two constants: the fold has to land over the house so that what oversails
 * the langkan is the shallower plane.
 */
export function checkTheRoofFolds(layout: Layout): CheckResult {
  const faults: string[] = []
  if (layout.fold.upper <= layout.fold.lower + TOL) {
    faults.push(`the upper plane falls ${layout.fold.upper.toFixed(2)} and the lower ${layout.fold.lower.toFixed(2)}: there is no fold`)
  }
  const frontZ = -layout.plot.halfZ + layout.plot.setback
  const centre = (frontZ + layout.house.front + layout.house.halfZ * 2) / 2
  const foldZ = centre - layout.fold.at
  if (foldZ < layout.house.front - TOL) {
    faults.push('the fold lands over the terrace rather than over the house')
  }
  const ok = faults.length === 0
  return {
    key: 'roof-folds',
    titleId: 'Atapnya melipat, dan bidang landainya di atas langkan',
    titleEn: 'The roof folds, and its shallow plane is the one over the terrace',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Bidang atas turun ${layout.fold.upper.toFixed(2)} m tiap meter dan bidang bawah ${layout.fold.lower.toFixed(2)} m, dengan lipatannya ${(layout.house.front - foldZ >= 0 ? 0 : foldZ - layout.house.front).toFixed(2)} m di dalam garis rumah. Lipatan itulah yang terlihat dari samping dan yang memberi rumah ini namanya — dan bidang yang lebih landai itulah yang menaungi langkan.`
      : faults.join('; '),
    detailEn: ok
      ? `The upper plane falls ${layout.fold.upper.toFixed(2)} m per metre and the lower ${layout.fold.lower.toFixed(2)} m, with the fold inside the line of the house. That fold seen from the side is what gives this house its name — and the shallower plane is the one shading the langkan.`
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
    checkInsideThePlot(house, layout),
    checkFrontIsForStrangers(house, layout),
    checkTheRoofFolds(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
