/**
 * The checks that are claims about the sudung.
 *
 * `checkEveryMemberIsCarried` is the one this building runs into. Nothing here
 * is sawn or hauled: every pole is cut near where the shelter stands and
 * carried by hand, so the longest member the building contains is bounded by
 * what a person can pick up. That number and the number of people sleeping
 * under it are independent, which is what lets the check fail — and the
 * counterexample is simply a larger family.
 *
 * `checkFitsTheSleepers` is the plan, and it is the first anthropometric claim
 * in this project about people lying down. The bale's owner stands, the
 * waruga's dead sits folded, the bhaga's body cannot get through a door, the
 * ume kbubu's stoops through one — four heights. This is a width.
 *
 * `checkNothingIsFixed` is a check for an absence, and the absence is the
 * point: no peg, no nail, no buried post, nothing of value built in. A
 * building that has to be walked away from cannot hold anything back.
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

/**
 * Symmetric across the row of sleepers, and deliberately not along it: the
 * roof falls one way, which is the whole of its section.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap z = 0, melintang barisan orang yang tidur — dan sengaja tidak simetris pada arah jatuhnya atap',
    labelEn: 'Symmetric about z = 0, across the row of sleepers — and deliberately not so along the fall of the roof',
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
 * Nothing in it is longer than a person can carry.
 *
 * The longest member is the edge pole across the front, and it grows with the
 * number of people sleeping under the roof. What it is measured against is a
 * carrying length, which belongs to an arm and a path through the forest — so
 * a family large enough eventually needs a pole nobody can bring to the spot.
 */
export function checkEveryMemberIsCarried(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  let longest = 0
  let worst = ''
  for (const part of house.parts) {
    const b = partBounds(part)
    const len = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2])
    if (len > longest) {
      longest = len
      worst = part.id
    }
  }
  if (longest > layout.carry + TOL) {
    faults.push(`${worst} is ${longest.toFixed(2)} m and nobody carries more than ${layout.carry.toFixed(2)} m`)
  }
  const ok = faults.length === 0
  return {
    key: 'every-member-is-carried',
    titleId: 'Tidak ada bagiannya yang lebih panjang daripada yang dapat dibawa orang',
    titleEn: 'Nothing in it is longer than a person can carry',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Bagian terpanjang ${longest.toFixed(2)} m, terhadap ${layout.carry.toFixed(2)} m yang dapat ditebang di dekat situ dan dibawa dengan tangan. Rumah woloan dibatasi panjang bak truk dan imah Baduy oleh sebatang kayu yang tidak boleh disambung; yang ini oleh apa yang dapat diangkat orang sendiri, dan batas itu bertambah dekat setiap kali ada satu orang lagi yang harus tidur di bawahnya.`
      : faults.join('; '),
    detailEn: ok
      ? `The longest member is ${longest.toFixed(2)} m against the ${layout.carry.toFixed(2)} m that can be cut nearby and carried by hand. The woloan house is bounded by the length of a lorry and the Baduy imah by a pole that may not be spliced; this one by what a person can pick up — and that bound comes closer every time one more person has to sleep under it.`
      : faults.join('; '),
  }
}

/**
 * The floor is a row of sleeping bodies, and it fits them.
 *
 * The first plan in this project set by an anthropometric figure, and the
 * first that measures people lying down.
 */
export function checkFitsTheSleepers(layout: Layout): CheckResult {
  const faults: string[] = []
  const needed = layout.rules.orang * layout.body.shoulders + (layout.rules.orang - 1) * layout.body.gap
  if (layout.floor.halfZ * 2 < needed - TOL) {
    faults.push(`${layout.rules.orang} sleepers need ${needed.toFixed(2)} m and the floor is ${(layout.floor.halfZ * 2).toFixed(2)} m`)
  }
  if (layout.floor.halfX * 2 < layout.body.lying - TOL) {
    faults.push(`the floor is ${(layout.floor.halfX * 2).toFixed(2)} m and a body lying down is ${layout.body.lying.toFixed(2)} m`)
  }
  const ok = faults.length === 0
  return {
    key: 'fits-the-sleepers',
    titleId: 'Lantainya adalah barisan orang yang berbaring, dan mereka muat',
    titleEn: 'The floor is a row of sleeping bodies, and they fit',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.orang} orang berbaring bersebelahan memerlukan ${needed.toFixed(2)} m, dan lantainya ${(layout.floor.halfZ * 2).toFixed(2)} m × ${(layout.floor.halfX * 2).toFixed(2)} m. Empat pak lain dalam projek ini mengukur tubuh manusia dan keempatnya mengukur tinggi; yang ini mengukur lebar.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.rules.orang} people lying side by side need ${needed.toFixed(2)} m, and the floor is ${(layout.floor.halfZ * 2).toFixed(2)} m × ${(layout.floor.halfX * 2).toFixed(2)} m. Four other packs here measure a human body and all four measure a height; this one measures a width.`
      : faults.join('; '),
  }
}

/**
 * Nothing is pegged, nailed or buried.
 *
 * The reason is not simplicity. A shelter that will be left standing on the
 * day somebody dies must not have anything built into it that anybody would
 * have to come back for — so everything is lashed, everything stands on the
 * ground, and the two things worth keeping are a fire and what was carried in.
 */
export function checkNothingIsFixed(house: House): CheckResult {
  const faults: string[] = []
  for (const joint of house.joints) {
    if (joint.kind !== 'ikat') faults.push(`${joint.id} is not a lashing`)
  }
  for (const part of house.parts) {
    if (partBounds(part).min[1] < -TOL) faults.push(`${part.id} reaches below the ground`)
  }
  const kinds = new Set<string>(house.parts.map((p) => p.material))
  const bought: readonly string[] = ['batu', 'genteng', 'bata', 'papan', 'sirap']
  const found = [...kinds].filter((k) => bought.includes(k))
  if (found.length > 0) faults.push(`materials that are not cut on the spot: ${found.join(', ')}`)
  const ok = faults.length === 0
  return {
    key: 'nothing-is-fixed',
    titleId: 'Tidak ada yang dipasak, dipaku, atau ditanam',
    titleEn: 'Nothing is pegged, nailed or buried',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.joints.length} sambungan dan semuanya ikatan rotan; nol tiang tertanam; ${kinds.size} bahan dan semuanya berdiri di hutan itu sejam sebelum bangunannya ada. Bangunan yang harus dapat ditinggalkan pada hari seseorang meninggal tidak boleh menyimpan apa pun yang harus diambil kembali.`
      : faults.join('; '),
    detailEn: ok
      ? `${house.joints.length} joints and every one a rattan lashing; zero buried posts; ${kinds.size} materials and all of them were standing in that forest an hour before the building was. A shelter that has to be left on the day somebody dies cannot hold anything anybody would come back for.`
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
    checkFitsTheSleepers(layout),
    checkEveryMemberIsCarried(house, layout),
    checkNothingIsFixed(house),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
