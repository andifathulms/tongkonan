/**
 * The checks that are claims about the malige.
 *
 * `checkWidensUpward` is the one this building exists for, and it is the first
 * check in the project whose subject is which way a stack of floors goes.
 * Nothing in the core ever required a plan to shrink as it rises — every pack
 * before this simply did it, so nothing was ever asked. A claim that has never
 * been tested and a claim that cannot be tested look the same from outside,
 * which is why this one is written down. The Tobati kariwari is the only other
 * building here with named stacked floors, and its levels get smaller as they
 * climb; `test/buton.test.ts` holds the two against each other.
 *
 * `checkOverhangIsCarried` is the one that couples rank to structure. How far
 * each storey projects follows from the rank rule; how far a bracket can reach
 * is a carpenter's figure; and nothing ties the two together, which is exactly
 * what makes the check able to fail.
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
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang tengah, z = 0 — termasuk tiap tritisan, yang keempat sisinya menjorok sama jauh',
    labelEn: 'Symmetric about the mid-plane, z = 0 — including every projection, which reaches equally on all four sides',
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
 * Every storey is wider than the one below it.
 *
 * The inversion, stated positively. A house with no pale projects nothing and
 * is required to be plumb instead, which is a different building rather than a
 * smaller one — so the check reads the rank first and then asserts one of two
 * opposite things, and both of them are claims.
 */
export function checkWidensUpward(layout: Layout): CheckResult {
  const faults: string[] = []
  const plumb = layout.brackets === 0
  for (let i = 1; i < layout.storeys.length; i++) {
    const below = layout.storeys[i - 1]
    const here = layout.storeys[i]
    if (!below || !here) continue
    if (plumb) {
      if (Math.abs(here.halfX - below.halfX) > TOL || Math.abs(here.halfZ - below.halfZ) > TOL) {
        faults.push(`storey ${i + 1} projects on a house entitled to no brackets`)
      }
    } else {
      if (here.halfX <= below.halfX + TOL) faults.push(`storey ${i + 1} is not wider than storey ${i}`)
      if (here.halfZ <= below.halfZ + TOL) faults.push(`storey ${i + 1} is not longer than storey ${i}`)
    }
  }
  const first = layout.storeys[0]
  const top = layout.storeys[layout.storeys.length - 1]
  const ok = faults.length === 0
  const grew = first && top ? (top.halfX * 2) / (first.halfX * 2) : 1
  return {
    key: 'widens-upward',
    titleId: plumb ? 'Tegak lurus dari batu sampai atap' : 'Tiap tingkat lebih lebar daripada tingkat di bawahnya',
    titleEn: plumb ? 'Plumb from stone to roof' : 'Every storey is wider than the one below it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? plumb
        ? 'Tidak ada pale, jadi tidak ada yang menjorok: rumahnya berdiri tegak lurus. Ini bukan bangunan yang sama dalam ukuran lebih kecil, melainkan bangunan yang tidak mengatakan apa pun ke arah luar.'
        : `Dari ${((first?.halfX ?? 0) * 2).toFixed(2)} m di tanah menjadi ${((top?.halfX ?? 0) * 2).toFixed(2)} m di puncak, yaitu ${grew.toFixed(2)} kali. Lantai terbesar bangunan ini adalah lantai tertingginya. Tidak ada bangunan lain di sini yang lantainya bertambah besar ke atas, dan tidak satu pun dari mereka pernah menyatakan itu sebagai aturan.`
      : faults.join('; '),
    detailEn: ok
      ? plumb
        ? 'No pale, so nothing projects: the house stands plumb. It is not the same building smaller — it is a building that says nothing outward at all.'
        : `From ${((first?.halfX ?? 0) * 2).toFixed(2)} m on the ground to ${((top?.halfX ?? 0) * 2).toFixed(2)} m at the top, ${grew.toFixed(2)} times over. The largest floor in this building is its highest. No other building here has floors that grow as they rise, and not one of them ever stated that as a rule.`
      : faults.join('; '),
  }
}

/**
 * Nothing projects further than a bracket can reach out to hold it.
 *
 * The rank sets the projection and the carpentry sets the reach. Nothing in
 * the building relates the two, which is the whole point: a household is
 * entitled to a certain amount of building outward, and a bracket arm is only
 * so long.
 */
export function checkOverhangIsCarried(layout: Layout): CheckResult {
  const faults: string[] = []
  const base = layout.storeys[0]
  /*
   * Measured from the frame, not from the storey below.
   *
   * The arms all spring from the same posts, so what each one has to span is
   * the *accumulated* projection at its own level — the topmost arm is always
   * the longest, and it is the top of the building that runs out of reach
   * first. Writing this against a single storey's oversail would have been a
   * check that never bites on the storey that matters.
   */
  for (const storey of layout.storeys) {
    if (storey.oversail <= TOL) continue
    if (layout.brackets === 0) faults.push(`storey ${storey.index + 1} projects with nothing to carry it`)
    const span = storey.halfX - (base?.halfX ?? 0)
    if (span > layout.reach + TOL) {
      faults.push(
        `storey ${storey.index + 1} stands ${span.toFixed(2)} m outside the frame, and an arm reaches ${layout.reach.toFixed(2)} m`,
      )
    }
  }
  const ok = faults.length === 0
  const top = layout.storeys[layout.storeys.length - 1]
  const span = (top?.halfX ?? 0) - (base?.halfX ?? 0)
  const oversail = layout.storeys[1]?.oversail ?? 0
  return {
    key: 'overhang-is-carried',
    titleId: 'Tidak ada yang menjorok lebih jauh daripada jangkauan lengan yang memikulnya',
    titleEn: 'Nothing projects further than the arm carrying it can reach',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.brackets === 0
        ? 'Tidak ada tritisan dan tidak ada lengan: keduanya nol, dan itu satu pernyataan yang utuh.'
        : `Tiap tingkat menjorok ${oversail.toFixed(2)} m melewati tingkat di bawahnya, sehingga lantai teratas berdiri ${span.toFixed(2)} m di luar rangka, terhadap lengan sepanjang ${layout.reach.toFixed(2)} m — ${layout.brackets} lengan pada tiap sisi. Yang menetapkan tritisannya adalah kedudukan; yang menetapkan jangkauannya adalah tukang; dan tidak ada apa pun yang menghubungkan keduanya.`
      : faults.join('; '),
    detailEn: ok
      ? layout.brackets === 0
        ? 'No projection and no arms: both are zero, and together they are one complete statement.'
        : `Each storey projects ${oversail.toFixed(2)} m past the one below, so the topmost floor stands ${span.toFixed(2)} m outside the frame against an arm reaching ${layout.reach.toFixed(2)} m — ${layout.brackets} arms to a side. What sets the projection is rank; what sets the reach is carpentry; and nothing relates the two.`
      : faults.join('; '),
  }
}

/**
 * The brackets are there, in the number the rank allows, and they are placed
 * before the floors they carry.
 *
 * The count is a rank marker that does structural work — unlike the Bugis
 * timpa laja, which is a rank marker that carries nothing and can therefore
 * lie. Here a household claiming four arms has to build four arms, and they
 * are holding the building up.
 */
export function checkBracketsAreRank(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const arms = house.parts.filter((p) => p.stage === 'pale')
  const projecting = layout.storeys.filter((s) => s.oversail > TOL).length
  const expected = projecting * layout.brackets * 2
  if (arms.length !== expected) faults.push(`${arms.length} brackets built, expected ${expected}`)
  for (const arm of arms) {
    const b = partBounds(arm)
    const under = layout.storeys.find((s) => Math.abs(s.y - b.max[1]) < 0.5)
    if (!under) faults.push(`${arm.id} does not reach the floor it carries`)
  }
  const firstFloor = house.parts.findIndex((p) => p.stage === 'lantai' && p.id !== 'lantai-0')
  const firstArm = house.parts.findIndex((p) => p.stage === 'pale')
  if (layout.brackets > 0 && firstArm >= 0 && firstFloor >= 0 && firstArm > firstFloor) {
    faults.push('a floor is framed before the bracket carrying it')
  }
  const ok = faults.length === 0
  return {
    key: 'brackets-are-rank',
    titleId: 'Lengannya sebanyak yang menjadi hak, dan lengan itu benar-benar memikul',
    titleEn: 'The arms are as many as the rank allows, and they actually carry',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${expected} lengan pada ${projecting} tingkat yang menjorok, ${layout.brackets} pada tiap sisi. Timpa laja pada saoraja Bugis juga menyatakan kedudukan dan tidak memikul apa-apa, sehingga dapat berdusta; yang ini memikul bangunannya, jadi kedudukan yang diakui harus benar-benar dibangun.`
      : faults.join('; '),
    detailEn: ok
      ? `${expected} arms on ${projecting} projecting storeys, ${layout.brackets} to a side. The Bugis saoraja’s timpa laja also states rank and carries nothing, so it can lie; these hold the building up, so a claimed standing has to actually be built.`
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
    checkWidensUpward(layout),
    checkOverhangIsCarried(layout),
    checkBracketsAreRank(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
