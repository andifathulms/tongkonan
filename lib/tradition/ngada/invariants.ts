/**
 * The checks that are claims about the pairs.
 *
 * `checkPairIsComplete` is the only invariant in this project whose subject is
 * that two *different* objects exist together. The baileo's check says several
 * things of one kind must be equal; this one says a thing of one kind is not
 * finished without a thing of another.
 *
 * `checkTooSmallToEnter` is the third check here to measure a building against
 * a human body, and the first to require the building to lose. The Balinese
 * bale is measured in units of its owner's body so that it fits them; the
 * Minahasa waruga's chamber is measured against a body seated and folded so
 * that one fits inside; here the opening is required to be smaller than
 * anybody, because that is the difference between a model of a house and a
 * very small house.
 *
 * No symmetry is claimed. A pair is a post on one side of the square and a
 * little house on the other, and they are not alike — asserting a mirror plane
 * that happened to pass would state something untrue, which is the call the
 * betang and the tanean made before this.
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
 * Every post has its little house, standing with it.
 *
 * One ngadhu and one bhaga to a clan, facing each other across the axis of the
 * square, within the spacing that separates one clan's pair from the next. A
 * post whose bhaga is a square away is not a pair, it is two things.
 */
export function checkPairIsComplete(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const posts = house.parts.filter((p) => p.name === 'ngadhu')
  const houses = house.parts.filter((p) => p.name === 'lantai' && p.stage === 'bhaga')
  if (posts.length !== layout.rules.pasangan) faults.push(`${posts.length} posts for ${layout.rules.pasangan} clans`)
  if (houses.length !== posts.length) faults.push(`${posts.length} ngadhu and ${houses.length} bhaga`)
  for (const pair of layout.pairs) {
    const post = posts.find((p) => Math.abs(partBounds(p).min[2] - (pair.z - DIMS.ngadhuSection.value / 2)) < TOL)
    if (!post) faults.push(`clan ${pair.index + 1} has no post at its place in the square`)
    const across = Math.abs(pair.bhaga.x - pair.ngadhu.x)
    if (across <= TOL) faults.push(`clan ${pair.index + 1} does not stand its pair apart`)
    if (across >= layout.spacing) faults.push(`clan ${pair.index + 1} stands its pair further apart than the next clan`)
  }
  const ok = faults.length === 0
  return {
    key: 'pair-is-complete',
    titleId: 'Tiap tiang punya rumah kecilnya, berdiri bersamanya',
    titleEn: 'Every post has its little house, standing with it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${posts.length} ngadhu dan ${houses.length} bhaga, berhadapan pada jarak ${(Math.abs((layout.pairs[0]?.bhaga.x ?? 0) - (layout.pairs[0]?.ngadhu.x ?? 0))).toFixed(2)} m, satu pasangan untuk tiap klan. Satu tanpa yang lain bukan pernyataan yang lebih kecil melainkan pernyataan yang belum utuh — dan itu satu-satunya pemeriksaan dalam projek ini yang pokoknya adalah dua benda berlainan jenis yang harus ada bersama.`
      : faults.join('; '),
    detailEn: ok
      ? `${posts.length} ngadhu and ${houses.length} bhaga, facing each other ${(Math.abs((layout.pairs[0]?.bhaga.x ?? 0) - (layout.pairs[0]?.ngadhu.x ?? 0))).toFixed(2)} m apart, one pair to a clan. One without the other is not a smaller statement but an unfinished one — and this is the only check in the project whose subject is two objects of different kinds having to exist together.`
      : faults.join('; '),
  }
}

/**
 * Nobody can get into the little house, and that is what makes it a model.
 *
 * The opening is compared against a declared human body, and the body figures
 * are the author's and say so with their own source key — the same one the
 * Bali and Waruga packs use.
 */
export function checkTooSmallToEnter(layout: Layout): CheckResult {
  const faults: string[] = []
  if (layout.opening.height >= layout.body.crouching - TOL) {
    faults.push(
      `the opening is ${layout.opening.height.toFixed(2)} m and a stooping body is ${layout.body.crouching.toFixed(2)} m`,
    )
  }
  if (layout.opening.width >= layout.body.shoulders - TOL) {
    faults.push(
      `the opening is ${layout.opening.width.toFixed(2)} m wide and shoulders are ${layout.body.shoulders.toFixed(2)} m`,
    )
  }
  const ok = faults.length === 0
  const first = layout.pairs[0]
  return {
    key: 'too-small-to-enter',
    titleId: 'Tidak ada yang dapat masuk ke bhaga, dan justru itu yang menjadikannya model',
    titleEn: 'Nobody can get into the bhaga, and that is what makes it a model',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Bukaannya ${(layout.opening.width * 100).toFixed(0)} × ${(layout.opening.height * 100).toFixed(0)} cm, terhadap bahu ${(layout.body.shoulders * 100).toFixed(0)} cm dan tubuh membungkuk setinggi ${(layout.body.crouching * 100).toFixed(0)} cm; lantainya ${((first?.bhaga.halfZ ?? 0) * 2).toFixed(2)} m — cukup luas untuk menaruh sesuatu, dan tidak dapat dimasuki. Bale Bali diukur menurut tubuh pemiliknya supaya muat; ruang waruga diukur menurut tubuh yang duduk berlipat supaya satu orang muat di dalamnya; yang ini diukur supaya tidak seorang pun muat.`
      : faults.join('; '),
    detailEn: ok
      ? `The opening is ${(layout.opening.width * 100).toFixed(0)} × ${(layout.opening.height * 100).toFixed(0)} cm against ${(layout.body.shoulders * 100).toFixed(0)} cm shoulders and a ${(layout.body.crouching * 100).toFixed(0)} cm stooping body; the floor is ${((first?.bhaga.halfZ ?? 0) * 2).toFixed(2)} m across — room enough to put something in, and no way to get into it. A Balinese bale is measured by its owner’s body so that they fit; a waruga’s chamber is measured against a body seated and folded so that one fits inside; this one is measured so that nobody does.`
      : faults.join('; '),
  }
}

/**
 * Neither of them shelters anybody.
 *
 * Not a claim about headroom — a bhaga is nearly two metres to its ridge, and
 * saying otherwise would be inventing a cramped little building to make a
 * point. The claim is about access and floor: there is no floor at all under
 * the ngadhu's cap, so nobody can stand in it, and the bhaga is closed on
 * every side but its one opening, which nobody fits through.
 *
 * It is a claim about a purpose the geometry would otherwise quietly acquire.
 * A cap on a post is one platform away from a shelter, and a little house with
 * an open side is a shed.
 */
export function checkNeitherIsShelter(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  // No floor under a cap: the only thing standing under it is its own post.
  for (const part of house.parts) {
    if (part.stage === 'nua') continue
    const b = partBounds(part)
    for (const pair of layout.pairs) {
      const dx = Math.abs((b.min[0] + b.max[0]) / 2 - pair.ngadhu.x)
      const dz = Math.abs((b.min[2] + b.max[2]) / 2 - pair.z)
      if (dx > pair.ngadhu.capRadius || dz > pair.ngadhu.capRadius) continue
      if (part.name !== 'ngadhu' && part.name !== 'lengan' && part.name !== 'topi') {
        faults.push(`${part.id} stands under the cap of pair ${pair.index + 1}`)
      }
    }
  }
  // Closed on every side but the opening: back, two sides, two front pieces
  // and the panel over the door.
  for (const pair of layout.pairs) {
    const walls = house.parts.filter(
      (p) => p.stage === 'bhaga' && (p.name === 'dinding' || p.name === 'ambang') && Math.abs(partBounds(p).min[2] - (pair.z - pair.bhaga.halfZ)) < pair.bhaga.halfZ * 2,
    )
    if (walls.length < 6) faults.push(`bhaga ${pair.index + 1} is open on a side`)
  }
  const ok = faults.length === 0
  return {
    key: 'neither-is-shelter',
    titleId: 'Tidak satu pun dari keduanya menaungi siapa pun',
    titleEn: 'Neither of them shelters anybody',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? 'Topi ijuk hanya menaungi tiangnya sendiri: tidak ada lantai di bawahnya, jadi tidak ada tempat siapa pun berdiri di situ. Bhaga tertutup pada semua sisinya kecuali satu bukaan yang tidak muat dilewati orang. Tumpang pada bade juga tidak menaungi apa pun, tetapi bade masih membawa satu tubuh; yang ini tidak membawa siapa-siapa.'
      : faults.join('; '),
    detailEn: ok
      ? 'The thatch cap covers its own post: there is no floor under it, so there is nowhere for anybody to stand. The bhaga is closed on every side but one opening nobody fits through. The bade’s tiers shelter nothing either, but a bade still carries a body; these carry nobody.'
      : faults.join('; '),
  }
}

/**
 * The pairs are ranged along the square at one spacing, and all of them are in
 * it.
 *
 * The length of the nua is a count of clans, the way a betang's length is a
 * count of households and a tanean's is a genealogy. What that requires of the
 * model is the plain thing: equal spacing, and nothing standing outside the
 * square it belongs to.
 */
export function checkRangedInTheSquare(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (let i = 1; i < layout.pairs.length; i++) {
    const before = layout.pairs[i - 1]
    const here = layout.pairs[i]
    if (!before || !here) continue
    if (Math.abs(here.z - before.z - layout.spacing) > TOL) {
      faults.push(`the gap before pair ${i + 1} is not the spacing`)
    }
  }
  for (const part of house.parts) {
    if (part.stage === 'nua') continue
    const b = partBounds(part)
    if (b.min[0] < -layout.nua.halfX - TOL || b.max[0] > layout.nua.halfX + TOL) {
      faults.push(`${part.id} stands outside the square`)
    }
    if (b.min[2] < -layout.nua.halfZ - TOL || b.max[2] > layout.nua.halfZ + TOL) {
      faults.push(`${part.id} stands beyond the end of the square`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'ranged-in-the-square',
    titleId: 'Pasangan-pasangannya berjajar di dalam nua, berjarak sama',
    titleEn: 'The pairs are ranged inside the nua, at one spacing',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.pairs.length} pasangan pada jarak ${layout.spacing.toFixed(2)} m di dalam alun-alun sepanjang ${(layout.nua.halfZ * 2).toFixed(1)} m. Panjang alun-alun ini adalah hitungan klan — seperti panjang rumah betang adalah hitungan rumah tangga.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.pairs.length} pairs at ${layout.spacing.toFixed(2)} m within a ${(layout.nua.halfZ * 2).toFixed(1)} m square. The length of this square is a count of clans — as a betang’s length is a count of households.`
      : faults.join('; '),
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkPairIsComplete(house, layout),
    checkTooSmallToEnter(layout),
    checkNeitherIsShelter(house, layout),
    checkRangedInTheSquare(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
