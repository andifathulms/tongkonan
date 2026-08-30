/**
 * The checks that are claims about the rumoh Aceh.
 *
 * The generic half comes from the core unchanged for the twentieth time.
 *
 * Two of the particular ones are unlike anything else in the project.
 * `checkRidgeRunsEastWest` is a claim about an axis whose *reason* is a
 * doctrine — the first rule in the collection to arrive from outside the
 * archipelago, and after the Madurese tanean lanjang no longer the only one —
 * and in the model it is simply which way the building is long.
 * `checkOddSteps` is the only parity check here: it does not ask whether a
 * number is large enough or small enough but whether it is odd, and it fails
 * by one.
 *
 * What cannot be checked is the reason. Nothing in a model knows which way
 * Mecca is, and nothing in this one is asked to: the pack states the reason,
 * the check states the axis, and the two are held apart on purpose.
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
import { houseWidth } from './frame'
import { PACK } from './rules'
import { rumbiaBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * Symmetric across the length and deliberately not along the width.
 *
 * East and west are alike here: the bays repeat and the ladder comes up on the
 * mid-line. North and south are not, and must not be — the three parts across
 * the width are three different depths, because they are for three different
 * degrees of being inside. A check over both axes would have to be false or be
 * softened; this one says the true thing and the pack says why.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang tengah utara–selatan, z = 0 — dan sengaja tidak melintang lebarnya',
    labelEn: 'Symmetric about the north–south mid-plane, z = 0 — and deliberately not across its width',
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
 * The house is long on the east–west axis, and the ridge lies along it.
 *
 * The reason is prayer and the check cannot see it: what a model can hold is
 * that this building's long axis is the one the tradition names, and that the
 * ridge follows it rather than crossing it. Every other house in the
 * collection is turned by something local; the axis here is the same kind of
 * geometric fact and a different kind of rule.
 */
export function checkRidgeRunsEastWest(house: House, layout: Layout): CheckResult {
  const width = houseWidth(layout)
  const faults: string[] = []
  if (layout.length <= width + TOL) {
    faults.push(`the house is ${layout.length.toFixed(1)} m along the ridge and ${width.toFixed(1)} m across it`)
  }
  const ridge = house.parts.find((p) => p.id === 'bubungan')
  if (!ridge) faults.push('there is no ridge')
  else {
    const b = partBounds(ridge)
    if (b.max[2] - b.min[2] <= b.max[0] - b.min[0]) faults.push('the ridge does not run east–west')
  }
  const ok = faults.length === 0
  return {
    key: 'ridge-east-west',
    titleId: 'Rumah membujur timur–barat, dan bubungannya mengikutinya',
    titleEn: 'The house is long east–west, and the ridge lies along it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.length.toFixed(1)} m sepanjang bubungan terhadap ${width.toFixed(1)} m melintangnya. Alasannya salat, dan pemeriksaan ini tidak dapat melihat alasan itu: yang dapat dipegang sebuah model hanyalah sumbu mana yang panjang. Sembilan belas bangunan lain di sini diarahkan oleh sesuatu yang setempat; yang ini oleh ajaran yang juga dipegang orang di negeri lain.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.length.toFixed(1)} m along the ridge against ${width.toFixed(1)} m across it. The reason is prayer and this check cannot see it: what a model can hold is which axis is long. The other nineteen buildings here are turned by something local; this one by a doctrine held in other countries too.`
      : faults.join('; '),
  }
}

/**
 * The ladder has an odd number of treads, and the count is derived.
 *
 * The only parity check in the project. It is checkable *because* the count is
 * not declared: the height of the floor and the rise of a tread produce it,
 * and nothing in that arithmetic knows about odd and even — so the rule can be
 * broken by nudging a dimension by a centimetre, which is exactly what the
 * counterexample does.
 */
export function checkOddSteps(house: House, layout: Layout): CheckResult {
  const treads = house.parts.filter((p) => p.name === 'reunyeun' && p.id.startsWith('reunyeun-') && !p.id.includes('tiang'))
  const built = treads.length
  const faults: string[] = []
  if (built !== layout.ladder.steps) faults.push(`${built} treads built for ${layout.ladder.steps} counted`)
  if (built % 2 === 0) faults.push(`${built} treads, which is even`)
  const ok = faults.length === 0
  return {
    key: 'odd-steps',
    titleId: 'Anak tangganya ganjil',
    titleEn: 'The ladder has an odd number of treads',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${built} anak tangga, naik ${layout.ladder.rise.toFixed(2)} m sekali langkah ke lantai setinggi ${layout.floorY.toFixed(2)} m. Jumlahnya tidak dinyatakan melainkan keluar dari kedua angka itu — dan justru karena itu aturannya dapat dilanggar oleh pergeseran satu sentimeter.`
      : faults.join('; '),
    detailEn: ok
      ? `${built} treads, rising ${layout.ladder.rise.toFixed(2)} m at a step to a floor ${layout.floorY.toFixed(2)} m up. The count is not declared but falls out of those two figures — which is exactly why the rule can be broken by a centimetre.`
      : faults.join('; '),
  }
}

/**
 * Three parts across the width, with the middle one raised.
 *
 * The sequence is not a staircase of standing. The rumah limas seats a guest
 * on the step that states who they are; this house raises the room an outsider
 * does not enter, and what the height states is a boundary rather than a rank.
 */
export function checkThreeParts(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const middle = layout.rooms.find((r) => r.key === 'tungai')
  const front = layout.rooms.find((r) => r.key === 'keue')
  if (!middle || !front) faults.push('the house has no front veranda or no middle room')
  if (middle && front && middle.floorY <= front.floorY + TOL) {
    faults.push('the middle room is not raised above the veranda')
  }
  const floors = house.parts.filter((p) => p.stage === 'aleue')
  if (floors.length !== layout.rooms.length) {
    faults.push(`${floors.length} floors for ${layout.rooms.length} parts`)
  }
  const ok = faults.length === 0
  return {
    key: 'three-parts',
    titleId: 'Tiga bagian melintang lebarnya, dengan yang tengah ditinggikan',
    titleEn: 'Three parts across the width, with the middle one raised',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rooms.map((r) => r.nameId).join(' → ')}, dengan tungai ${layout.raise.toFixed(2)} m di atas serambinya. Yang dinyatakan tingginya bukan kedudukan tamu melainkan batas: sampai di mana orang luar boleh melangkah.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.rooms.map((r) => r.nameEn).join(' → ')}, with the tungai ${layout.raise.toFixed(2)} m above its verandas. What the height states is not a guest’s standing but a boundary: how far in an outsider comes.`
      : faults.join('; '),
  }
}

/** No iron in the frame: threaded beams, pegs and lashings only. */
export function checkNoNails(house: House): CheckResult {
  const kinds = new Set(house.joints.map((j) => j.kind))
  const ok = house.joints.length > 0 && [...kinds].every((k) => k === 'toi' || k === 'talo')
  return {
    key: 'no-nails',
    titleId: 'Tidak ada paku pada rangka: toi tembus, pasak, dan ikat',
    titleEn: 'No nails in the frame: threaded beams, pegs and lashings',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.joints.length} sambungan, semuanya toi atau ikat. Rangka yang dapat bergoyang tanpa patah, di tanah yang bergoyang — omo Nias menjawab persoalan yang sama dengan menyegitigakan tiap petaknya, dan ini jawaban yang berbeda: bukan kaku, melainkan lentur.`
      : `jenis sambungan: ${[...kinds].join(', ')}`,
    detailEn: ok
      ? `${house.joints.length} joints, every one a threaded beam or a lashing. A frame that moves without breaking, on ground that moves — the Nias omo answers the same problem by triangulating every bay, and this is a different answer: not stiff, but limber.`
      : `joint kinds: ${[...kinds].join(', ')}`,
  }
}

/** Thatch courses lap with no bare band. */
export function checkRumbiaCoverage(layout: Layout): CheckResult {
  const bands = rumbiaBands(layout)
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
    key: 'rumbia-coverage',
    titleId: 'Lapis rumbia saling menindih tanpa celah',
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
    checkRidgeRunsEastWest(house, layout),
    checkOddSteps(house, layout),
    checkThreeParts(house, layout),
    checkNoNails(house),
    checkRumbiaCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
