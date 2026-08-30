/**
 * The checks that are claims about the balai.
 *
 * `checkAislesHaveFallen` is the one this building is here for, and it is the
 * first check in this project about a floor that steps *down*. Everything else
 * that steps here steps up — the limas for a guest's standing, the gadang for
 * its laras, the malige for a sultan. This one lowers a floor to say that
 * passing through is not being present.
 *
 * `checkOneStepNotAStair` is where the limit is, and its two numbers belong to
 * different parties: the fall is what the tradition wants legible, and how big
 * a step a person crosses without thinking is a fact about bodies. Nothing
 * relates them, so a hall can be built whose distinction is perfectly clear
 * and whose aisles nobody wants to keep stepping in and out of.
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

/**
 * Symmetric across the hall, which is the *kembar* of the name in geometric
 * form: the two aisles are mirror images or they are not twins.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 0,
    include: () => true,
    labelId: 'Simetris terhadap sumbu balai, x = 0 — dan itulah arti kembar pada namanya',
    labelEn: 'Symmetric about the axis of the hall, x = 0 — and that is what kembar in its name means',
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
 * Both aisles have fallen, and they have fallen the same.
 *
 * Two claims in one: lower than the middle floor, and identical to each other.
 * A hall with one selaso, or with two at different levels, is a different
 * building with a different name.
 */
export function checkAislesHaveFallen(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  if (layout.aisles.length !== 2) faults.push(`${layout.aisles.length} aisles, and kembar means two`)
  const levels = new Set(layout.aisles.map((a) => a.floorY.toFixed(6)))
  if (levels.size > 1) faults.push('the two aisles are at different levels')
  const widths = new Set(layout.aisles.map((a) => a.halfX.toFixed(6)))
  if (widths.size > 1) faults.push('the two aisles are different widths')
  for (const aisle of layout.aisles) {
    if (aisle.floorY >= layout.middle.floorY - TOL) faults.push('an aisle floor has not fallen below the middle one')
    if (Math.abs(layout.middle.floorY - aisle.floorY - layout.drop.fall) > TOL) {
      faults.push('an aisle has not fallen by the declared drop')
    }
  }
  const floors = house.parts.filter((p) => p.name === 'selaso')
  if (floors.length !== 2) faults.push(`${floors.length} aisle floors built`)
  const ok = faults.length === 0
  return {
    key: 'aisles-have-fallen',
    titleId: 'Kedua selaso jatuh, dan jatuh sama dalamnya',
    titleEn: 'Both aisles have fallen, and fallen the same',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Dua selaso, masing-masing selebar ${((layout.aisles[0]?.halfX ?? 0) * 2).toFixed(2)} m, keduanya jatuh ${(layout.drop.fall * 100).toFixed(0)} cm di bawah lantai tengah. Tiap lantai berjenjang lain dalam projek ini dinaikkan untuk menyatakan sesuatu tentang orangnya; yang ini diturunkan untuk menyatakan sesuatu tentang kegiatannya.`
      : faults.join('; '),
    detailEn: ok
      ? `Two selaso, each ${((layout.aisles[0]?.halfX ?? 0) * 2).toFixed(2)} m wide, both fallen ${(layout.drop.fall * 100).toFixed(0)} cm below the middle floor. Every other stepped floor in this project is raised to say something about a person; this one is lowered to say something about an activity.`
      : faults.join('; '),
  }
}

/**
 * The fall is one step, not a storey.
 *
 * The fall is what the tradition wants legible; the size of step a person
 * crosses without thinking is a fact about bodies. Nothing relates the two,
 * which is what lets a perfectly clear distinction become a hall nobody wants
 * to keep stepping in and out of.
 */
export function checkOneStepNotAStair(layout: Layout): CheckResult {
  const ok = layout.drop.fall <= layout.drop.step + TOL
  return {
    key: 'one-step-not-a-stair',
    titleId: 'Jatuhnya satu tapak, bukan satu tingkat',
    titleEn: 'The fall is one step, not a storey',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Jatuh ${(layout.drop.fall * 100).toFixed(0)} cm terhadap ${(layout.drop.step * 100).toFixed(0)} cm yang masih dapat dilangkahi orang tanpa berpikir. Orang menyeberanginya berkali-kali dalam satu pertemuan: yang satu angka adat, yang satu angka tubuh, dan tidak ada yang menghubungkan keduanya.`
      : `jatuhnya ${(layout.drop.fall * 100).toFixed(0)} cm dan satu langkah paling banyak ${(layout.drop.step * 100).toFixed(0)} cm`,
    detailEn: ok
      ? `A ${(layout.drop.fall * 100).toFixed(0)} cm fall against the ${(layout.drop.step * 100).toFixed(0)} cm a person crosses without thinking about it. People cross it many times in one meeting: one figure belongs to the custom, the other to the body, and nothing relates them.`
      : `the fall is ${(layout.drop.fall * 100).toFixed(0)} cm and a single step is at most ${(layout.drop.step * 100).toFixed(0)} cm`,
  }
}

/**
 * You can pass the length of the hall without entering the room.
 *
 * The measurable half of what a fallen floor means: both aisles run clear from
 * end to end, with nothing standing in them and no wall across them.
 */
export function checkPassWithoutEntering(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (const aisle of layout.aisles) {
    const from = aisle.x - aisle.halfX
    const to = aisle.x + aisle.halfX
    for (const part of house.parts) {
      if (part.name === 'selaso' || part.name === 'gelagar' || part.name === 'batu') continue
      if (part.name === 'tiang' || part.name === 'pagar' || part.stage === 'atap') continue
      const b = partBounds(part)
      const inside = b.min[0] < to - TOL && b.max[0] > from + TOL
      const low = b.min[1] < aisle.floorY + DIMS.railHeight.value
      if (inside && low) faults.push(`${part.id} stands in the aisle`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'pass-without-entering',
    titleId: 'Orang dapat menyusuri balai tanpa masuk ke ruangnya',
    titleEn: 'You can walk the length of the hall without entering the room',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Kedua selaso lapang sepanjang ${(layout.middle.halfZ * 2).toFixed(1)} m, hanya berpagar rendah di tepi luarnya dan tidak ada sekat melintanginya. Inilah sisi ukur dari lantai yang jatuh itu: lewat bukan hadir.`
      : faults.join('; '),
    detailEn: ok
      ? `Both selaso run clear for ${(layout.middle.halfZ * 2).toFixed(1)} m, with only a low rail on their outer edge and nothing across them. This is the measurable half of the fallen floor: passing through is not being present.`
      : faults.join('; '),
  }
}

/**
 * What is raised is raised at the ends, and only there.
 *
 * The anjung is the one thing in this hall that steps *up*, and it is worth
 * checking that it does not creep into the middle: a raised floor in the body
 * of the room would be the Palembang claim, which this building does not make.
 */
export function checkRaisedOnlyAtTheEnds(layout: Layout): CheckResult {
  const faults: string[] = []
  for (const end of layout.anjung) {
    if (Math.abs(end.z) <= layout.middle.halfZ - TOL) faults.push('an anjung stands inside the middle room')
    if (end.floorY <= layout.middle.floorY + TOL) faults.push('an anjung is not raised above the middle floor')
  }
  const ok = faults.length === 0
  return {
    key: 'raised-only-at-the-ends',
    titleId: 'Yang dinaikkan hanya di ujung',
    titleEn: 'What is raised is raised only at the ends',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.anjung.length === 0
        ? 'Balai ini tanpa anjung: satu lantai tengah dan dua selaso yang jatuh, dan tidak ada apa pun yang dinaikkan.'
        : `${layout.anjung.length} anjung, keduanya di luar ruang tengah dan ${(DIMS.anjungRise.value * 100).toFixed(0)} cm di atasnya. Lantai ruang tengahnya sendiri tetap satu bidang: menaikkan lantai di dalam ruang akan menjadi pernyataan rumah limas, dan bangunan ini tidak membuat pernyataan itu.`
      : faults.join('; '),
    detailEn: ok
      ? layout.anjung.length === 0
        ? 'This hall has no anjung: one middle floor and two fallen aisles, and nothing raised at all.'
        : `${layout.anjung.length} anjung, both outside the middle room and ${(DIMS.anjungRise.value * 100).toFixed(0)} cm above it. The middle floor itself stays one plane: a raised floor inside the room would be the rumah limas’s claim, and this building does not make it.`
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
    checkAislesHaveFallen(house, layout),
    checkOneStepNotAStair(layout),
    checkPassWithoutEntering(house, layout),
    checkRaisedOnlyAtTheEnds(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
