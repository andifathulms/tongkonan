/**
 * The checks that are claims about the sasadu.
 *
 * `checkDoorsAreNotAlike` is the one this building exists for, and it is the
 * only check in this project whose subject is that several things of one kind
 * *differ* in a stated order. The Maluku baileo's `checkPlacesAreEqual` is its
 * exact opposite and was written eighteen buildings ago: there the refusal to
 * distinguish is the statement, here the distinction is.
 *
 * `checkEverybodyBows` is what keeps that from being about humiliation. Every
 * opening, the highest included, has to be lower than a standing adult and
 * higher than a stooping one. It is the ume kbubu's two-sided check applied to
 * a *set* of openings that differ from each other, which is new.
 */

import {
  checkAgainstSurvey,
  checkBuildOrder as coreCheckBuildOrder,
  checkJointStages as coreCheckJointStages,
  checkPartProvenance as coreCheckPartProvenance,
  checkJoints,
  checkMeshes,
  partBounds,
} from '@/lib/core/invariants'
import type { CheckResult } from '@/lib/core/invariants'
import { DIMS, PACK } from './rules'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

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
 * The openings differ, and they differ in order.
 *
 * No two heads are the same, each is one step below the one before it, and
 * none of them is on the same side as another. It is the inverse of the
 * baileo's claim, and the two are worth reading together.
 */
export function checkDoorsAreNotAlike(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const heads = layout.doors.map((d) => d.head)
  for (let i = 1; i < heads.length; i++) {
    const before = heads[i - 1]
    const here = heads[i]
    if (before === undefined || here === undefined) continue
    if (here >= before - TOL) faults.push(`opening ${i + 1} is not lower than the one before it`)
    if (Math.abs(before - here - DIMS.headStep.value) > TOL) {
      faults.push(`the step to opening ${i + 1} is not the declared step`)
    }
  }
  const sides = new Set(layout.doors.map((d) => `${d.axis}:${d.side}`))
  if (sides.size !== layout.doors.length) faults.push('two openings share a side')
  const built = house.parts.filter((p) => p.name === 'ambang')
  if (built.length !== layout.doors.length) {
    faults.push(`${built.length} heads built for ${layout.doors.length} openings`)
  }
  const ok = faults.length === 0
  return {
    key: 'doors-are-not-alike',
    titleId: 'Bukaannya berbeda-beda, dan bedanya berurutan',
    titleEn: 'The openings differ, and they differ in order',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.doors.length} bukaan, dari ${(heads[0] ?? 0).toFixed(2)} m turun ${DIMS.headStep.value.toFixed(2)} m tiap kali, masing-masing pada sisinya sendiri. Baileo Maluku memeriksa hal yang persis berlawanan — di sana beberapa hal sejenis harus sama, dan penolakan untuk membedakan itulah pernyataannya. Di sini perbedaannya yang menjadi pernyataan, dan ia diucapkan dalam sentimeter di atas kepala orang.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.doors.length} openings, from ${(heads[0] ?? 0).toFixed(2)} m and stepping down ${DIMS.headStep.value.toFixed(2)} m each time, each on its own side. The Maluku baileo checks the exact opposite — there several things of one kind must be the same, and the refusal to distinguish is the statement. Here the distinction is, and it is said in centimetres over somebody’s head.`
      : faults.join('; '),
  }
}

/**
 * Everybody bows, including whoever the highest door was made for.
 *
 * Two bounds on every opening: above a stooping adult so it can be used, below
 * a standing one so it has to be stooped through. The lower bound is what
 * makes this a threshold rather than an obstruction; the upper is what makes
 * the gesture general rather than a humiliation.
 */
export function checkEverybodyBows(layout: Layout): CheckResult {
  const faults: string[] = []
  for (const door of layout.doors) {
    if (door.head >= layout.body.standing - TOL) {
      faults.push(`${door.key} is ${door.head.toFixed(2)} m and a standing adult is ${layout.body.standing.toFixed(2)} m: nobody has to bow at it`)
    }
    if (door.head <= layout.body.stooping + TOL) {
      faults.push(`${door.key} is ${door.head.toFixed(2)} m and a stooping adult needs ${layout.body.stooping.toFixed(2)} m`)
    }
  }
  const highest = Math.max(...layout.doors.map((d) => d.head))
  const ok = faults.length === 0
  return {
    key: 'everybody-bows',
    titleId: 'Semua orang membungkuk, termasuk yang bukaan tertinggi dibuat untuknya',
    titleEn: 'Everybody bows, including whoever the highest opening was made for',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Bukaan tertinggi ${highest.toFixed(2)} m, masih di bawah ${layout.body.standing.toFixed(2)} m orang berdiri; yang terendah masih di atas ${layout.body.stooping.toFixed(2)} m orang membungkuk. Membungkuk di sini bukan yang dituntut dari yang berkedudukan rendah melainkan yang diminta bangunan ini dari semua orang.`
      : faults.join('; '),
    detailEn: ok
      ? `The highest opening is ${highest.toFixed(2)} m, still under the ${layout.body.standing.toFixed(2)} m of a standing adult; the lowest is still over the ${layout.body.stooping.toFixed(2)} m of a stooping one. The bow here is not what is demanded of the low-ranking but what the building asks of everybody.`
      : faults.join('; '),
  }
}

/**
 * There is no wall and no door leaf anywhere.
 *
 * A check for an absence, and the absence is the point: a hall that
 * distinguishes people by headroom is a different thing from one that
 * distinguishes them with a lock.
 */
export function checkNobodyIsShutOut(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (const part of house.parts) {
    if (part.name === 'dinding' || part.name === 'daun-pintu') faults.push(`${part.id} closes the hall`)
  }
  // Nothing but posts, jambs and cloths may stand between the floor and the eave
  // around the edge: the space under the roof has to be open on every side.
  for (const part of house.parts) {
    if (part.stage !== 'atap') continue
    const b = partBounds(part)
    if (b.min[1] < layout.eaveY - DIMS.roofThickness.value - TOL) {
      faults.push(`${part.id} reaches below the eave`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'nobody-is-shut-out',
    titleId: 'Tidak ada dinding dan tidak ada daun pintu',
    titleEn: 'There is no wall and no door leaf',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Nol dinding dan nol daun pintu: ruang di bawah atap terbuka pada keempat sisinya, dan yang membedakan orang adalah tinggi bukaan tempat mereka masuk. Balai yang membedakan dengan ruang di atas kepala adalah hal yang lain sama sekali daripada balai yang membedakan dengan kunci.`
      : faults.join('; '),
    detailEn: ok
      ? `Zero walls and zero door leaves: the space under the roof is open on all four sides, and what distinguishes people is the height of the opening they come in by. A hall that distinguishes with headroom is an entirely different thing from a hall that distinguishes with a lock.`
      : faults.join('; '),
  }
}

/**
 * The hall is as long as the number of people who eat in it.
 *
 * A headcount, like the bade's lattice — and where that one counts the people
 * carrying a thing, this counts the people sitting down in one.
 */
export function checkSeatsEverybody(layout: Layout, seats: number): CheckResult {
  const perBay = DIMS.seatsPerBay.value
  const ok = Math.abs(seats - layout.rules.bentang * perBay) < TOL && layout.halfZ * 2 > 0
  return {
    key: 'seats-everybody',
    titleId: 'Panjangnya adalah jumlah orang yang makan di dalamnya',
    titleEn: 'Its length is the number of people who eat in it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.bentang} bentang × ${perBay} orang = ${seats} orang duduk sekaligus, sepanjang ${(layout.halfZ * 2).toFixed(1)} m. Usungan bade juga berasal dari hitungan orang, dan yang dihitungnya orang yang memikul; yang ini orang yang duduk makan.`
      : 'the length does not follow from the number of seats',
    detailEn: ok
      ? `${layout.rules.bentang} bays × ${perBay} people = ${seats} sitting down at once, along ${(layout.halfZ * 2).toFixed(1)} m. A bade’s lattice also comes from a headcount, and that one counts people carrying; this counts people sitting down to eat.`
      : 'the length does not follow from the number of seats',
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout, seats: number): readonly CheckResult[] {
  return [
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkDoorsAreNotAlike(house, layout),
    checkEverybodyBows(layout),
    checkNobodyIsShutOut(house, layout),
    checkSeatsEverybody(layout, seats),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
