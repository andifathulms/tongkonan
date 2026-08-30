/**
 * The checks that are claims about the bade.
 *
 * The generic half comes from the core unchanged for the twenty-third time.
 *
 * `checkOverTheBearers` is the second balance check in this project and asks a
 * different question from the first. The lepa's asks whether the weight is
 * *low*, because a narrow hull with weight up high rolls. This one asks
 * whether the weight is *inside a footprint* — the lattice a crowd is standing
 * under — because a tower that leans past its bearers falls on them. Both
 * limits are declared and both are proxies: there are no material properties
 * in this project, so neither check can say a thing will stay up. What they
 * can say is where the parts are.
 *
 * `checkNothingLasts` is the inverse of the waruga's `checkOneMaterial`. That
 * building is one substance and the substance is the one that survives; this
 * one is four and not one of them does. Two buildings for the dead, and the
 * checks on them are opposite claims about what should remain.
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
import type { House, Layout, Part } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang tengah, z = 0 — dan di sini simetri adalah bagian dari keseimbangannya',
    labelEn: 'Symmetric about the mid-plane, z = 0 — and here symmetry is part of its balance',
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

/** The centre of every part, by bounding-box volume. */
export function centreOf(parts: readonly Part[]): { x: number; y: number; z: number } {
  let total = 0
  let x = 0
  let y = 0
  let z = 0
  for (const part of parts) {
    const b = partBounds(part)
    const v =
      Math.max(1e-6, b.max[0] - b.min[0]) *
      Math.max(1e-6, b.max[1] - b.min[1]) *
      Math.max(1e-6, b.max[2] - b.min[2])
    total += v
    x += ((b.min[0] + b.max[0]) / 2) * v
    y += ((b.min[1] + b.max[1]) / 2) * v
    z += ((b.min[2] + b.max[2]) / 2) * v
  }
  if (total <= 0) return { x: 0, y: 0, z: 0 }
  return { x: x / total, y: y / total, z: z / total }
}

/**
 * The weight sits over the people carrying it.
 *
 * The first draft of this check measured how far the centre of all the parts
 * lay from the middle of the lattice — and the answer is zero at every rule
 * combination, because the tower is symmetric about both axes and the centre
 * is on the axis by construction. A check that restates its own input, for the
 * fourth time in this project.
 *
 * What actually varies is slenderness. The lattice comes from a headcount and
 * the height comes from a tier count, and nothing ties the two together: eleven
 * tiers over a twenty-bearer lattice is a real address, and it is a tower whose
 * weight is three times its own base above the shoulders holding it. So the
 * check is a ratio between two independent numbers, plus the plainer claim that
 * nothing above reaches outboard of the frame.
 */
export function checkOverTheBearers(house: House, layout: Layout): CheckResult {
  const centre = centreOf(house.parts)
  const half = layout.frame.halfX
  const slenderness = centre.y / half
  const faults: string[] = []
  if (slenderness > layout.tipLimit + TOL) {
    faults.push(
      `the centre of gravity is ${slenderness.toFixed(2)} half-widths up, against a limit of ${layout.tipLimit.toFixed(2)}`,
    )
  }
  for (const part of house.parts) {
    if (part.stage === 'usungan') continue
    const b = partBounds(part)
    if (b.max[0] > half + TOL || b.min[0] < -half - TOL || b.max[2] > layout.frame.halfZ + TOL || b.min[2] < -layout.frame.halfZ - TOL) {
      faults.push(`${part.id} reaches outboard of the lattice`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'over-the-bearers',
    titleId: 'Beratnya berada di atas orang-orang yang memikulnya',
    titleEn: 'The weight sits over the people carrying it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Titik berat ${centre.y.toFixed(2)} m di atas tanah, yaitu ${slenderness.toFixed(2)} kali setengah lebar usungan ${(half * 2).toFixed(2)} m, terhadap batas ${layout.tipLimit.toFixed(2)}, dengan ${layout.frame.bearers} pemikul di bawahnya. Batas ini penetapan penulis: projek ini tidak punya sifat bahan, jadi tidak ada yang dapat mengatakan menara ini berdiri — hanya di mana bagian-bagiannya berada.`
      : faults.join('; '),
    detailEn: ok
      ? `The centre of gravity is ${centre.y.toFixed(2)} m up, ${slenderness.toFixed(2)} times the half-width of a ${(half * 2).toFixed(2)} m lattice, against a limit of ${layout.tipLimit.toFixed(2)}, with ${layout.frame.bearers} bearers under it. The limit is the author’s: this project has no material properties, so nothing can say this tower stands — only where its parts are.`
      : faults.join('; '),
  }
}

/**
 * Nothing is founded: the lattice is the lowest thing and nothing is buried.
 *
 * A check for a zero, and the zero is a foundation. Twenty-two buildings here
 * rest on stones, piles, masonry, a hillside or a keel; this one rests on
 * shoulders, and what it is standing on while it is built is a courtyard it
 * will leave in an hour.
 */
export function checkCarriedNotFounded(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (const part of house.parts) {
    const b = partBounds(part)
    if (b.min[1] < -TOL) faults.push(`${part.id} is below the ground`)
  }
  const lattice = house.parts.filter((p) => p.stage === 'usungan')
  if (lattice.length === 0) faults.push('there is no lattice')
  const lowest = Math.min(...house.parts.map((p) => partBounds(p).min[1]))
  const latticeLow = Math.min(...lattice.map((p) => partBounds(p).min[1]))
  if (latticeLow > lowest + TOL) faults.push('something reaches below the lattice')
  const ok = faults.length === 0
  return {
    key: 'carried-not-founded',
    titleId: 'Tidak ada pondasi: usungan adalah bagian terbawah, dan tidak ada yang ditanam',
    titleEn: 'No foundation: the lattice is the lowest thing, and nothing is buried',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Nol tiang tertanam, nol batu, nol jangkar. Dua puluh dua bangunan lain di sini bertumpu pada batu, tiang pancang, pasangan, lereng, atau lunas; yang ini bertumpu pada ${layout.frame.bearers} bahu — dan pondasi itu berjalan, lalu berbelok di tiap perempatan.`
      : faults.join('; '),
    detailEn: ok
      ? `Zero buried posts, zero stones, zero anchors. The other twenty-two buildings here bear on stone, piles, masonry, a hillside or a keel; this one bears on ${layout.frame.bearers} shoulders — and that foundation walks, and turns at every crossroads.`
      : faults.join('; '),
  }
}

/**
 * Every material burns.
 *
 * The inverse of the waruga's one-material check: that building is stone and
 * the point is that it lasts; this one is bamboo, timber, cloth and paper, and
 * the point is that none of it will.
 */
export function checkNothingLasts(house: House): CheckResult {
  /*
   * Named as strings rather than as `MaterialKey`, and the type checker is the
   * reason: this pack declares four materials and none of them is stone, so
   * comparing a `MaterialKey` against `'batu'` does not type-check at all. That
   * is the union doing its job — but a check that cannot be written is a check
   * that cannot fail, so the list is of substances rather than of this pack's
   * keys, and it still bites if a fifth material is ever added here.
   */
  const PERMANENT: readonly string[] = ['batu', 'genteng', 'bata', 'paras']
  const kinds = new Set<string>(house.parts.map((p) => p.material))
  const lasting = [...kinds].filter((k) => PERMANENT.includes(k))
  const ok = lasting.length === 0 && kinds.size > 0
  return {
    key: 'nothing-lasts',
    titleId: 'Semua bahannya terbakar',
    titleEn: 'Every material burns',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${kinds.size} bahan — ${[...kinds].join(', ')} — dan tidak satu pun tersisa setelah sore itu. Waruga Minahasa punya satu bahan dan bahan itulah yang bertahan; dua bangunan untuk orang mati, dua jawaban yang berlawanan tentang apa yang harus tersisa.`
      : `bahan yang tidak terbakar: ${lasting.join(', ')}`,
    detailEn: ok
      ? `${kinds.size} materials — ${[...kinds].join(', ')} — and not one of them is there the next morning. The Minahasa waruga has one material and it is the one that lasts; two buildings for the dead, and two opposite answers about what should remain.`
      : `materials that do not burn: ${lasting.join(', ')}`,
  }
}

/**
 * The tiers climb, narrow and count the standing of the dead.
 *
 * The oddness comes from the ladder of rank — one, three, five, seven, nine,
 * eleven — rather than from a rule about odd numbers. The rumoh Aceh's ladder
 * is the parity rule in this project; this is a rank rule whose rungs happen
 * to be odd.
 */
export function checkTiers(house: House, layout: Layout): CheckResult {
  const tiers = house.parts.filter((p) => p.stage === 'tumpang')
  const faults: string[] = []
  if (tiers.length !== layout.rules.tumpang) {
    faults.push(`${tiers.length} tiers built for ${layout.rules.tumpang}`)
  }
  if (layout.rules.tumpang % 2 === 0) faults.push('the count is not a rung of the ladder')
  for (let i = 1; i < layout.tiers.length; i++) {
    const below = layout.tiers[i - 1]
    const cur = layout.tiers[i]
    if (!below || !cur) continue
    if (cur.halfX >= below.halfX - TOL) faults.push(`tier ${i + 1} is not narrower than tier ${i}`)
    if (cur.y <= below.y) faults.push(`tier ${i + 1} is not above tier ${i}`)
  }
  const ok = faults.length === 0
  return {
    key: 'tiers',
    titleId: 'Tingkatnya menaik, menyempit, dan jumlahnya adalah kedudukan',
    titleEn: 'The tiers climb, narrow, and their number is the standing',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.tumpang} tingkat sampai ${layout.apexY.toFixed(1)} m. Tidak ada apa pun di bawah tingkat-tingkat itu: pada joglo tumpang adalah atap di atas sebuah ruang, di sini ia pernyataannya sendiri dengan udara di bawahnya.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.rules.tumpang} tiers to ${layout.apexY.toFixed(1)} m. There is nothing under them: on a joglo the tumpang are a roof over a room, here they are the statement itself with air beneath.`
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
    checkOverTheBearers(house, layout),
    checkCarriedNotFounded(house, layout),
    checkNothingLasts(house),
    checkTiers(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
