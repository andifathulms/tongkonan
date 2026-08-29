/**
 * The checks that are claims about the baileo.
 *
 * The generic half comes from the core unchanged for the fifteenth time.
 *
 * Three of the four particular ones are about equality and sight, which is
 * what happens when the building being checked belongs to a village rather
 * than to a household. `checkOnePlacePerSoa` is a tally like the tongkonan's
 * horns; `checkPlacesAreEqual` is the first check in this project whose
 * subject is that two parts are the *same*; and `checkOpenOnAllSides` is the
 * first that measures a building against the eye of somebody in it rather
 * than against another part of the building.
 *
 * What none of them can test is that anybody actually watched. This project
 * has no people in it and will not acquire any, so an open side is testable
 * and a public decision is not — the same limit the Nias pack states about its
 * triangles and the Dani pack about warmth.
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
import type { House, Layout, Part } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

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
 * One bay, one pair of posts and one seat for every soa.
 *
 * A tally, like the tongkonan's horns and the betang's bilik — and the first
 * one in this project that counts a community rather than a household or its
 * ceremonies. A soa does not live here; it sits here.
 */
export function checkOnePlacePerSoa(house: House, layout: Layout): CheckResult {
  const soa = layout.rules.soa
  // By name, not by stage: the plate that ties the post heads is raised with
  // the posts and is not one of them.
  const posts = house.parts.filter((p) => p.name === 'tiang').length
  const seats = house.parts.filter((p) => p.name === 'tempat').length
  const faults: string[] = []
  if (layout.soa.length !== soa) faults.push(`${layout.soa.length} bays for ${soa} soa`)
  if (posts !== soa * 2) faults.push(`${posts} posts for ${soa} soa`)
  if (seats !== soa * 2) faults.push(`${seats} seats for ${soa} soa`)
  const ok = faults.length === 0
  return {
    key: 'one-place-each',
    titleId: 'Satu petak, sepasang tiang dan satu tempat duduk untuk tiap soa',
    titleEn: 'One bay, a pair of posts and a seat for every soa',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${soa} soa: ${layout.soa.length} petak, ${posts} tiang, ${seats} tempat. Denah bangunan ini sebuah cacah — bukan atas keluarga yang tinggal di dalamnya seperti rumah betang, melainkan atas klan yang berhak duduk di dalamnya.`
      : faults.join('; '),
    detailEn: ok
      ? `${soa} soa: ${layout.soa.length} bays, ${posts} posts, ${seats} seats. The plan is a tally — not of the families living inside, as on the rumah betang, but of the clans entitled to sit inside.`
      : faults.join('; '),
  }
}

/**
 * Every place the same, and the floor one plane.
 *
 * The only invariant in this project whose subject is that two parts are
 * identical. It is the exact inverse of the Palembang kekijing, where a guest's
 * standing is the step they are seated on: here the seats are equal by rule and
 * the floor refuses to step, and that refusal is the statement.
 */
export function checkPlacesAreEqual(house: House, layout: Layout): CheckResult {
  const seats = house.parts.filter((p) => p.stage === 'tempat')
  const faults: string[] = []
  const first = seats[0]
  if (!first) faults.push('no seats')
  const key = (p: Part) => {
    const b = partBounds(p)
    return [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2], b.max[1]]
      .map((n) => n.toFixed(3))
      .join(' × ')
  }
  const shapes = new Set(seats.map(key))
  if (shapes.size > 1) faults.push(`${shapes.size} different seats: ${[...shapes].join(' / ')}`)

  const floors = house.parts.filter((p) => p.stage === 'lantai')
  const tops = new Set(floors.map((p) => partBounds(p).max[1].toFixed(4)))
  if (tops.size > 1) faults.push(`the floor is at ${tops.size} heights`)

  const ok = faults.length === 0
  const floorTop = layout.sightBand.fromY
  return {
    key: 'places-equal',
    titleId: 'Semua tempat duduk sama, dan lantainya satu bidang',
    titleEn: 'Every seat is the same, and the floor is one plane',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${seats.length} tempat duduk dengan ukuran dan ketinggian yang sama, di atas satu lantai setinggi ${floorTop.toFixed(2)} m. Rumah limas Palembang menyatakan kedudukan dengan menaikkan lantainya; bangunan ini menyatakan kesetaraan dengan menolak melakukannya.`
      : faults.join('; '),
    detailEn: ok
      ? `${seats.length} seats of one size and one height, on a single floor at ${floorTop.toFixed(2)} m. The Palembang rumah limas states standing by raising its floor; this building states equality by refusing to.`
      : faults.join('; '),
  }
}

/**
 * Open on every side, at the height of somebody sitting inside.
 *
 * The claim is not that the building has no boards. It is that a person seated
 * in their place can be seen from outside, which is why the test is run against
 * `seatedEye` — a dimension of a person, declared in the pack for exactly this
 * purpose — rather than against a list of parts that are allowed to exist.
 *
 * Posts are permitted and everything else is not: a post interrupts a sight
 * line, a wall ends it.
 */
export function checkOpenOnAllSides(house: House, layout: Layout): CheckResult {
  const floorTop = layout.sightBand.fromY
  const eye = floorTop + DIMS.seatedEye.value
  const offenders: string[] = []
  let highest = floorTop

  for (const part of house.parts) {
    // Posts interrupt a sight line; the roof is over it. Neither ends it.
    if (part.stage === 'tiang' || part.stage === 'atap' || part.stage === 'kuda') continue
    const b = partBounds(part)
    if (b.max[1] <= floorTop + TOL) continue
    // Only what stands on the edge of the floor can close it in.
    const onEdge =
      Math.abs(b.max[2]) > layout.halfZ - layout.postSection ||
      Math.abs(b.min[2]) < -layout.halfZ + layout.postSection ||
      Math.abs(b.max[0]) > layout.length / 2 - layout.postSection
    if (!onEdge) continue
    highest = Math.max(highest, b.max[1])
    // The test is what rises past the eye of somebody seated inside. A
    // knee-high screen is allowed and changes nothing; a chest-high one ends
    // the sight line and with it the reason this building has no walls.
    if (b.max[1] > eye + TOL) offenders.push(part.id)
  }
  const blocked = highest - floorTop

  const ok = offenders.length === 0
  const screen = layout.screen.present ? DIMS.screenHeight.value : 0
  return {
    key: 'open-all-sides',
    titleId: 'Terbuka pada keempat sisi, setinggi mata orang yang duduk di dalamnya',
    titleEn: 'Open on all four sides, at the eye height of somebody seated inside',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Tidak ada apa pun selain tiang di antara lantai dan ketinggian ${DIMS.seatedEye.value.toFixed(2)} m di atasnya${layout.screen.present ? `; sekat berhenti di ${screen.toFixed(2)} m` : '; tanpa sekat'}. Yang diputuskan di dalam terlihat dari luar, dan itu aturan politik dan bukan aturan iklim.`
      : `${offenders.length} bagian naik sampai ${blocked.toFixed(2)} m di atas lantai, melewati mata orang yang duduk di ${DIMS.seatedEye.value.toFixed(2)} m: ${offenders.slice(0, 6).join(', ')}`,
    detailEn: ok
      ? `Nothing but posts stands between the floor and ${DIMS.seatedEye.value.toFixed(2)} m above it${layout.screen.present ? `; the screen stops at ${screen.toFixed(2)} m` : '; there is no screen'}. What is decided inside is visible from outside, and that is a political rule rather than a climatic one.`
      : `${offenders.length} parts rise ${blocked.toFixed(2)} m above the floor, past the eye of somebody seated at ${DIMS.seatedEye.value.toFixed(2)} m: ${offenders.slice(0, 6).join(', ')}`,
  }
}

/**
 * The stone is never built over.
 *
 * Both arrangements have to satisfy it and they satisfy it differently: in
 * front, nothing reaches out over it; inside, the floor is opened around it so
 * that it still stands on the earth. The roof is exempt and deliberately so —
 * a baileo whose stone is inside is a building put *around* a stone, and the
 * roof is the building.
 */
export function checkStoneIsClear(house: House, layout: Layout): CheckResult {
  const stone = layout.pamali
  const faults: string[] = []
  for (const part of house.parts) {
    if (part.id === 'batu-pamali') continue
    if (part.stage === 'atap' || part.stage === 'kuda') continue
    const b = partBounds(part)
    if (b.min[1] < stone.height - TOL) continue
    const overX = b.min[0] < stone.x + stone.radius && b.max[0] > stone.x - stone.radius
    const overZ = b.min[2] < stone.radius && b.max[2] > -stone.radius
    if (overX && overZ) faults.push(part.id)
  }
  const ok = faults.length === 0
  return {
    key: 'stone-clear',
    titleId: 'Tidak ada yang dibangun di atas batu pamali',
    titleEn: 'Nothing is built over the pamali stone',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? stone.where === 'dalam'
        ? `Batu berdiri di dalam, dan lantainya dibuka mengelilinginya sehingga batu itu tetap berdiri di tanah. Bangunan ini dibangun mengelilingi batu, bukan di atasnya.`
        : `Batu berdiri ${Math.abs(stone.x + layout.length / 2).toFixed(2)} m di muka bangunan, di luar jangkauan tritisan.`
      : `${faults.length} bagian berada di atas batu: ${faults.slice(0, 5).join(', ')}`,
    detailEn: ok
      ? stone.where === 'dalam'
        ? `The stone stands inside and the floor is opened around it, so it still stands on the earth. The building is built around the stone rather than over it.`
        : `The stone stands ${Math.abs(stone.x + layout.length / 2).toFixed(2)} m in front of the building, outside the reach of the eave.`
      : `${faults.length} parts stand over the stone: ${faults.slice(0, 5).join(', ')}`,
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
  if (!top || top.head > TOL) gaps.push('the top course does not reach the ridge')
  const ok = gaps.length === 0
  return {
    key: 'thatch-coverage',
    titleId: 'Lapis rumbia saling menindih tanpa celah',
    titleEn: 'Thatch courses lap with no bare band',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis dari tepi ke bubungan, dengan tritisan ${layout.eaveOversail.toFixed(2)} m — panjang, karena tidak ada dinding yang menahan hujan.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses from eave to ridge, with a ${layout.eaveOversail.toFixed(2)} m overhang — long, because there is no wall to keep the rain out.`
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
    checkOnePlacePerSoa(house, layout),
    checkPlacesAreEqual(house, layout),
    checkOpenOnAllSides(house, layout),
    checkStoneIsClear(house, layout),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
