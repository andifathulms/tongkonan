/**
 * The checks that are claims about the waruga.
 *
 * The generic half comes from the core unchanged for the twenty-second time,
 * and it had less to do here than anywhere else: four solids, one joint, and
 * no sequence more complicated than base, box, lid.
 *
 * The particular ones are about a body, a stone and an absence.
 * `checkSeatedFit` is the second check in the project to measure a building
 * against a person — the first was the baileo's, against somebody sitting in
 * it — and this one measures against somebody who will not get up.
 * `checkNoWayIn` is a check for a zero, like the honai's windows: the claim is
 * that this building has no opening at all except the lid being lifted.
 *
 * What cannot be checked is the part a Minahasa would look at first. A waruga's
 * face carries a carving of what the person did in life — a fisherman, a
 * midwife, a soldier — and that record is the reason many of these stones can
 * still be read. It is not modelled, for the reason every other pack gives
 * about carving, and the caution says so.
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

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang utara–selatan, z = 0',
    labelEn: 'Symmetric about the north–south plane, z = 0',
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
 * The chamber takes a body that is seated, with room around it.
 *
 * The second check in this project to measure a building against a person, and
 * the first to measure it against one who will not stand up again. A Balinese
 * bale is set out in units of its owner's living body; this chamber is set out
 * against a body folded, and the clearance is there because a box that fits
 * exactly is a box nothing can be put into.
 */
export function checkSeatedFit(layout: Layout): CheckResult {
  const clear = DIMS.bodyClearance.value
  const faults: string[] = []
  if (layout.chamber.halfX * 2 < layout.body.depth + clear - TOL) faults.push('the chamber is shallower than a seated body')
  if (layout.chamber.halfZ * 2 < layout.body.width + clear - TOL) faults.push('the chamber is narrower than a pair of shoulders')
  if (layout.chamber.height < layout.body.seated + clear - TOL) faults.push('the chamber is lower than a seated body')
  const ok = faults.length === 0
  return {
    key: 'seated-fit',
    titleId: 'Ruangnya menerima tubuh yang duduk, dengan ruang sisa di sekelilingnya',
    titleEn: 'The chamber takes a seated body, with room around it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Ruang ${(layout.chamber.halfX * 2).toFixed(2)} × ${(layout.chamber.halfZ * 2).toFixed(2)} × ${layout.chamber.height.toFixed(2)} m terhadap tubuh duduk ${layout.body.depth.toFixed(2)} × ${layout.body.width.toFixed(2)} × ${layout.body.seated.toFixed(2)} m. Bale Bali diukur menurut tubuh pemiliknya yang hidup dan berdiri; ini asas yang sama pada peristiwa yang lain sama sekali.`
      : faults.join('; '),
    detailEn: ok
      ? `A ${(layout.chamber.halfX * 2).toFixed(2)} × ${(layout.chamber.halfZ * 2).toFixed(2)} × ${layout.chamber.height.toFixed(2)} m chamber against a seated body of ${layout.body.depth.toFixed(2)} × ${layout.body.width.toFixed(2)} × ${layout.body.seated.toFixed(2)} m. A Balinese bale is measured against its owner’s living, standing body; this is the same principle on an entirely different occasion.`
      : faults.join('; '),
  }
}

/**
 * It fits in one stone.
 *
 * A family keeps adding to the same box, so the chamber has to be cut deep on
 * the first day for people who have not died yet — and no waruga can be taller
 * than the block a quarry gives. The limit is declared and the height is
 * built, so the check compares two independent numbers.
 */
export function checkOneBlock(layout: Layout): CheckResult {
  const cut = layout.block.height
  const ok = cut <= layout.blockLimit + TOL
  return {
    key: 'one-block',
    titleId: 'Semuanya muat dalam satu batu',
    titleEn: 'It all fits in one stone',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Peti setinggi ${cut.toFixed(2)} m dipahat dari blok setinggi ${layout.blockLimit.toFixed(2)} m, untuk ${layout.rules.jumlah} orang. Sebuah keluarga menambah ke peti yang sama selama beberapa keturunan, jadi yang membatasi berapa banyak yang dapat ditampungnya bukan keluarganya melainkan batunya.`
      : `peti setinggi ${cut.toFixed(2)} m, dan blok terbesar yang ada ${layout.blockLimit.toFixed(2)} m`,
    detailEn: ok
      ? `A ${cut.toFixed(2)} m box cut from a ${layout.blockLimit.toFixed(2)} m block, for ${layout.rules.jumlah} people. A family adds to the same box over generations, so what limits how many it can hold is not the family but the stone.`
      : `the box is ${cut.toFixed(2)} m and the largest block is ${layout.blockLimit.toFixed(2)} m`,
  }
}

/**
 * There is no way in.
 *
 * A check for a zero. No door, no window, no gap: the lid is lifted and put
 * back, and that is the only opening this building has ever had. It is also
 * the only building here whose openings are counted at zero *including* the
 * one people use.
 */
export function checkNoWayIn(house: House, layout: Layout): CheckResult {
  const walls = house.parts.filter((p) => p.name === 'dinding')
  const faults: string[] = []
  if (walls.length !== 4) faults.push(`${walls.length} walls`)
  for (const wall of walls) {
    const b = partBounds(wall)
    const height = b.max[1] - b.min[1]
    if (Math.abs(height - layout.chamber.height) > TOL) {
      faults.push(`${wall.id} does not close the chamber`)
    }
    if (b.min[1] > layout.chamber.floorY + TOL) faults.push(`${wall.id} stands off the floor`)
  }
  const lid = house.parts.filter((p) => p.stage === 'tutup')
  if (lid.length === 0) faults.push('there is no lid')
  const ok = faults.length === 0
  return {
    key: 'no-way-in',
    titleId: 'Tidak ada jalan masuk',
    titleEn: 'There is no way in',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? 'Nol pintu, nol jendela, nol celah. Tutupnya diangkat dan diletakkan kembali, dan itulah satu-satunya bukaan yang pernah dimiliki bangunan ini. Honai adalah satu-satunya bangunan lain di sini tanpa jendela; ia masih punya pintu.'
      : faults.join('; '),
    detailEn: ok
      ? 'Zero doors, zero windows, zero gaps. The lid is lifted and put back, and that is the only opening this building has ever had. The honai is the only other building here with no window; it still has a door.'
      : faults.join('; '),
  }
}

/**
 * One material, and no joint between two of anything.
 *
 * Twenty-one buildings here are made of four or five substances fastened
 * together. This one is stone, cut, and the only thing resting on anything
 * else is the lid.
 */
export function checkOneMaterial(house: House): CheckResult {
  const kinds = new Set(house.parts.map((p) => p.material))
  const ok = kinds.size === 1 && kinds.has('batu')
  return {
    key: 'one-material',
    titleId: 'Satu bahan, dan tidak ada sambungan antara dua benda',
    titleEn: 'One material, and no joint between two of anything',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.parts.length} bagian, semuanya batu, dipahat dari satu blok. Daftar bahan pak ini punya satu anggota — daftar terpendek dalam projek ini — dan satu-satunya yang bertumpu pada yang lain adalah tutupnya.`
      : `bahan: ${[...kinds].join(', ')}`,
    detailEn: ok
      ? `${house.parts.length} parts, every one stone, cut from a single block. This pack’s material list has one member — the shortest in the project — and the only thing resting on anything else is the lid.`
      : `materials: ${[...kinds].join(', ')}`,
  }
}

/**
 * The face is to the north.
 *
 * The same compass rule as the tongkonan and an unrelated reason for it: there
 * because Toraja says a house faces north, here because the ancestors are said
 * to have come from that direction. Two buildings with one rule and two
 * reasons — a reminder that what is interesting about a rule is not its number.
 */
export function checkFacesNorth(house: House): CheckResult {
  const face = house.parts.find((p) => p.id === 'muka')
  const faults: string[] = []
  if (!face) faults.push('there is no face')
  else if (partBounds(face).max[0] > 0) faults.push('the face is not on the north side')
  const ok = faults.length === 0
  return {
    key: 'faces-north',
    titleId: 'Mukanya menghadap utara',
    titleEn: 'The face is to the north',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? 'Arah tempat leluhur dikatakan datang. Tongkonan memakai aturan mata angin yang sama karena alasan yang sama sekali lain, dan pada waruga sesungguhnya muka inilah yang diukir dengan apa yang dikerjakan orang itu semasa hidup — ukiran yang tidak ada dalam model ini.'
      : faults.join('; '),
    detailEn: ok
      ? 'The direction the ancestors are said to have come from. The tongkonan uses the same compass rule for an entirely different reason, and on a real waruga this face carries the carving of what the person did in life — a carving this model does not have.'
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
    checkSeatedFit(layout),
    checkOneBlock(layout),
    checkNoWayIn(house, layout),
    checkOneMaterial(house),
    checkFacesNorth(house),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
