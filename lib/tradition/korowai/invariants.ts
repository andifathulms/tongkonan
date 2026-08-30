/**
 * The checks that are claims about the khaim.
 *
 * The generic half comes from the core unchanged for the twenty-fourth time.
 *
 * `checkTrunkCarries` is the one this building exists for, and it is the first
 * check in this project whose two numbers belong to different parties. The
 * height is chosen by the household; the taper belongs to the tree. Nothing
 * ties them together, so a house can be put at a height the wanbon carrying it
 * is not thick enough to hold — and no amount of good building fixes that,
 * because the thing that runs out is the tree.
 *
 * It reports **skipped** when the house stands on cut poles, and that is
 * deliberate rather than a gap: with no tree there is nothing whose thickness
 * varies with height, and a version of this check written against a constant
 * pole section would compare two fixed numbers and could never fail. That is
 * the fault this project has now made four times, and refusing to write it a
 * fifth time is better than writing a check that always passes.
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

/**
 * The mirror plane is the partition.
 *
 * The two sides of this house are a women's side and a men's side, and they
 * are built alike: the same bays, the same hearths, the same way up at each
 * end. What the partition divides is who is on which side, which is a fact
 * about people and leaves no trace in the geometry — so the whole building is
 * symmetric about it, including the ladders.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap sekat, z = 0 — kedua sisinya dibangun sama, dan yang membedakannya bukan bentuknya',
    labelEn: 'Symmetric about the partition, z = 0 — the two sides are built alike, and what tells them apart is not their shape',
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
 * The trunk is still thick enough where the floor is framed into it.
 *
 * A wanbon narrows as it rises. The household picks a height; the tree decides
 * what is there when you get up to it.
 */
export function checkTrunkCarries(layout: Layout): CheckResult {
  if (!layout.trunk.alive) {
    return {
      key: 'trunk-carries',
      titleId: 'Batangnya masih cukup tebal di ketinggian lantai',
      titleEn: 'The trunk is still thick enough at floor height',
      status: 'skip',
      detail:
        'Rumah ini berdiri di atas tiang tebang, jadi tidak ada batang yang menipis ke atas dan tidak ada yang dapat diperiksa. Menuliskannya terhadap penampang tiang yang tetap akan menghasilkan perbandingan dua angka tetap — pemeriksaan yang tidak pernah dapat gagal, dan itu kesalahan yang sudah empat kali terjadi dalam projek ini.',
      detailEn:
        'This house stands on cut poles, so nothing narrows with height and there is nothing to check. Writing it against a fixed pole section would compare two constants — a check that can never fail, which is a fault this project has already made four times.',
    }
  }
  const ok = layout.trunk.atFloor >= layout.trunk.bearing - TOL
  return {
    key: 'trunk-carries',
    titleId: 'Batangnya masih cukup tebal di ketinggian lantai',
    titleEn: 'The trunk is still thick enough at floor height',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Garis tengah ${(layout.trunk.base * 1000).toFixed(0)} mm di tanah menjadi ${(layout.trunk.atFloor * 1000).toFixed(0)} mm di ketinggian ${layout.floorY.toFixed(1)} m, terhadap batas ${(layout.trunk.bearing * 1000).toFixed(0)} mm. Tingginya dipilih rumah tangga; penirusannya milik pohon. Tidak ada yang menghubungkan kedua angka itu.`
      : `garis tengah tinggal ${(layout.trunk.atFloor * 1000).toFixed(0)} mm di ketinggian ${layout.floorY.toFixed(1)} m, dan batasnya ${(layout.trunk.bearing * 1000).toFixed(0)} mm`,
    detailEn: ok
      ? `A diameter of ${(layout.trunk.base * 1000).toFixed(0)} mm at the ground becomes ${(layout.trunk.atFloor * 1000).toFixed(0)} mm at ${layout.floorY.toFixed(1)} m, against a limit of ${(layout.trunk.bearing * 1000).toFixed(0)} mm. The height is the household’s; the taper belongs to the tree. Nothing ties those two numbers together.`
      : `the diameter is down to ${(layout.trunk.atFloor * 1000).toFixed(0)} mm at ${layout.floorY.toFixed(1)} m, and the limit is ${(layout.trunk.bearing * 1000).toFixed(0)} mm`,
  }
}

/**
 * Something alive is holding it up, and it stands above the roof.
 *
 * The check is not that a tree is drawn but that the tree is *structural* and
 * *unfinished*: it reaches the ground, it carries the floor bearer at the
 * middle, and what is left of it stands above the ridge, where it goes on
 * growing after the builders have gone.
 */
export function checkStandsOnSomethingAlive(house: House, layout: Layout): CheckResult {
  const alive = house.parts.filter((p) => p.material === 'pohon')
  if (!layout.trunk.alive) {
    const ok = alive.length === 0
    return {
      key: 'stands-on-something-alive',
      titleId: 'Yang menahannya hidup atau tidak, dan pak ini menyatakan yang mana',
      titleEn: 'What holds it up is alive or it is not, and this pack says which',
      status: ok ? 'pass' : 'fail',
      detail: ok
        ? `Tidak ada bagian yang hidup: rumah ini berdiri di atas ${layout.posts.length} tiang tebang, yang semuanya mulai lapuk sejak hari dipancang. Ini pilihan yang dinyatakan, bukan penyederhanaan.`
        : 'ada bagian hidup pada rumah yang seharusnya berdiri di atas tiang tebang',
      detailEn: ok
        ? `Nothing here is alive: this house stands on ${layout.posts.length} cut poles, every one of them rotting from the day it was set. That is a stated choice, not a simplification.`
        : 'a living part is present on a house that is supposed to stand on cut poles',
    }
  }
  const faults: string[] = []
  if (alive.length !== 1) faults.push(`${alive.length} living parts, expected 1`)
  const trunk = alive[0]
  if (trunk) {
    const b = partBounds(trunk)
    if (b.min[1] > TOL) faults.push('the tree does not reach the ground')
    if (b.max[1] <= layout.ridgeY + TOL) faults.push('the tree does not stand above the ridge')
  }
  const carried = house.joints.some((j) => j.mortise === 'wanbon' || j.tenon === 'wanbon')
  if (!carried) faults.push('nothing is framed into the tree')
  const ok = faults.length === 0
  return {
    key: 'stands-on-something-alive',
    titleId: 'Yang menahannya masih hidup, dan masih tumbuh',
    titleEn: 'What holds it up is alive, and still growing',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Satu batang wanbon dari tanah sampai ${(layout.ridgeY + layout.trunk.aboveRidge).toFixed(1)} m — ${layout.trunk.aboveRidge.toFixed(1)} m di atas bubungan — dan gelagar tengah bertumpu padanya. Dua puluh tiga bangunan lain di sini berdiri di atas benda mati; ini satu-satunya yang bagian strukturnya akan lebih besar tahun depan.`
      : faults.join('; '),
    detailEn: ok
      ? `One wanbon from the ground to ${(layout.ridgeY + layout.trunk.aboveRidge).toFixed(1)} m — ${layout.trunk.aboveRidge.toFixed(1)} m above the ridge — with the middle floor bearer framed into it. The other twenty-three buildings here stand on something dead; this is the only one part of whose structure will be bigger next year.`
      : faults.join('; '),
  }
}

/**
 * The air under the floor is empty, and it is the building's argument.
 *
 * Nothing may occupy the height between the ground and the floor except what
 * is carrying the house and the ladder that is taken away at night. This is
 * the one clearance in the project that is a *purpose* rather than a
 * by-product, so it gets a check rather than a comment.
 */
export function checkNothingUnderIt(house: House, layout: Layout): CheckResult {
  const allowed = new Set(['tiang', 'tangga'])
  const faults: string[] = []
  for (const part of house.parts) {
    if (allowed.has(part.stage) || part.material === 'pohon') continue
    const b = partBounds(part)
    if (b.min[1] < layout.floorY - layout.floor.depth - DECK_ALLOWANCE) {
      faults.push(`${part.id} hangs into the space under the floor`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'nothing-under-it',
    titleId: 'Tidak ada apa pun di bawah lantai',
    titleEn: 'There is nothing under the floor',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.floorY.toFixed(1)} m udara kosong, dan kosongnya itulah maksud bangunannya: rumah didirikan di luar jangkauan. Di dua puluh tiga bangunan lain di sini, ruang di bawah lantai adalah akibat dari hal lain — satu lantai, satu tapakan, pasang surut, sebuah alas. Di sini ia pernyataannya.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.floorY.toFixed(1)} m of empty air, and the emptiness is the point of the building: a house put out of reach. In the other twenty-three buildings here the space under the floor is a consequence of something else — a storey, a step, a tide, a slab. Here it is the statement.`
      : faults.join('; '),
  }
}

/** A bearer is allowed to hang its own depth below the floor and no further. */
const DECK_ALLOWANCE = 0.35

/**
 * Every fire can be dropped.
 *
 * A hearth hangs in an opening with nothing under it, so that if it flares the
 * lashings are cut and the whole thing falls to the forest floor. The check is
 * the drop: the column under each hearth, down to the ground, has to be clear.
 *
 * It is the only check in this project whose subject is a part *leaving* the
 * building, and it is the reason the deck is laid as four strips to a bay
 * rather than as one sheet.
 */
export function checkHearthsCanFall(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (const hearth of layout.hearths) {
    const half = hearth.half
    for (const part of house.parts) {
      if (part.stage === 'perapian') continue
      const b = partBounds(part)
      if (b.min[1] >= hearth.at[1] - TOL) continue
      const overlapX = b.min[0] < half - TOL && b.max[0] > -half + TOL
      const overlapZ = b.min[2] < hearth.at[2] + half - TOL && b.max[2] > hearth.at[2] - half + TOL
      if (overlapX && overlapZ) faults.push(`${part.id} is under hearth ${hearth.index + 1}`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'hearths-can-fall',
    titleId: 'Tiap api dapat dijatuhkan',
    titleEn: 'Every fire can be dropped',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.hearths.length} perapian, masing-masing menggantung pada lubang yang di bawahnya tidak ada apa-apa sampai ke tanah ${layout.floorY.toFixed(1)} m di bawah. Pada bangunan lain di sini, lubang pada lantai adalah jalan bagi orang; di sini ia jalan keluar bagi api.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.hearths.length} hearths, each hung in an opening with nothing under it all the way to the ground ${layout.floorY.toFixed(1)} m below. On the other buildings here an opening in a floor is a way through for a person; here it is a way out for a fire.`
      : faults.join('; '),
  }
}

/**
 * Two sides, one partition, and a way up at each end.
 *
 * The Karo house holds eight households in one room and divides nothing; this
 * one holds two sides and divides them with exactly one wall. Both are answers
 * to the same question and neither is a version of the other.
 */
export function checkTwoSides(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const partitions = house.parts.filter((p) => p.name === 'sekat')
  if (partitions.length !== 1) faults.push(`${partitions.length} partitions, expected exactly 1`)
  const ladders = house.parts.filter((p) => p.stage === 'tangga')
  if (ladders.length !== 2) faults.push(`${ladders.length} ladders, expected one for each side`)
  const perSide = (side: -1 | 1) => layout.hearths.filter((h) => h.side === side).length
  if (perSide(-1) === 0 || perSide(1) === 0) faults.push('a side has no hearth of its own')
  if (perSide(-1) !== perSide(1)) faults.push('the two sides do not have the same number of hearths')
  const ok = faults.length === 0
  return {
    key: 'two-sides',
    titleId: 'Dua sisi, satu sekat, dan satu jalan naik untuk masing-masing',
    titleEn: 'Two sides, one partition, and a way up for each',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${perSide(-1)} perapian di sisi perempuan dan ${perSide(1)} di sisi laki-laki, dipisahkan satu sekat, dengan tangganya masing-masing di kedua ujung. Siwaluh jabu Karo menampung delapan rumah tangga dalam satu ruang tanpa sekat sama sekali — pertanyaan yang sama, jawaban yang berlawanan.`
      : faults.join('; '),
    detailEn: ok
      ? `${perSide(-1)} hearths on the women’s side and ${perSide(1)} on the men’s, divided by one partition, each with its own ladder at its own end. The Karo siwaluh jabu holds eight households in one room and divides nothing at all — the same question, the opposite answer.`
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
    checkStandsOnSomethingAlive(house, layout),
    checkTrunkCarries(layout),
    checkNothingUnderIt(house, layout),
    checkHearthsCanFall(house, layout),
    checkTwoSides(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}

/** Every part, for the tests that walk them. */
export function partsOf(house: House): readonly Part[] {
  return house.parts
}
