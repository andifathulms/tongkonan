/**
 * The checks that are claims about Dalam Loka.
 *
 * `checkNinetyNine` is the one this building exists for, and it comes in two
 * halves because one of them alone would be worthless. The first is that there
 * are exactly ninety-nine posts. The second is that every one of them carries
 * something — because any building can be given ninety-nine posts by standing
 * eleven ornamental ones in its corners, and a count met that way is a fact
 * about arithmetic rather than about a frame.
 *
 * `checkSpansFollow` is where the limit lands. The count is not the builders'
 * to change, so the only way to a larger palace is a wider spacing, and that
 * runs into what a beam will cross. The count belongs to a text and the span
 * belongs to timber; nothing relates them, which is what lets the check fail.
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

/** Symmetric across the grid; along it the two halls differ, and should. */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 0,
    include: (part) => part.stage !== 'serambi' && part.name !== 'tiang-serambi' && !part.id.startsWith('batu-serambi'),
    labelId: 'Simetris terhadap sumbu grid, x = 0 — serambi ke bangunan belakang tidak termasuk',
    labelEn: 'Symmetric about the axis of the grid, x = 0 — the walkway to the building behind is not part of the claim',
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
 * Ninety-nine posts, and every one of them under something.
 *
 * The walkway's own posts are counted separately and deliberately: they carry
 * a walkway rather than the palace, and letting them into the tally would be
 * the exact trick the second half of this check exists to refuse.
 */
export function checkNinetyNine(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const posts = house.parts.filter((p) => p.name === 'tiang')
  if (posts.length !== DIMS.ninetyNinePosts.value) {
    faults.push(`${posts.length} posts, and the number is ${DIMS.ninetyNinePosts.value}`)
  }
  if (layout.grid.across * layout.grid.along !== DIMS.ninetyNinePosts.value) {
    faults.push(`a ${layout.grid.across} by ${layout.grid.along} grid is not ${DIMS.ninetyNinePosts.value}`)
  }
  const beams = house.parts.filter((p) => p.name === 'balok').map(partBounds)
  for (const post of posts) {
    const b = partBounds(post)
    const x = (b.min[0] + b.max[0]) / 2
    const z = (b.min[2] + b.max[2]) / 2
    const carried = beams.some(
      (beam) =>
        x > beam.min[0] - TOL && x < beam.max[0] + TOL && z > beam.min[2] - TOL && z < beam.max[2] + TOL,
    )
    if (!carried) faults.push(`${post.id} stands under nothing`)
  }
  const ok = faults.length === 0
  return {
    key: 'ninety-nine',
    titleId: 'Sembilan puluh sembilan tiang, dan tiap satunya memikul sesuatu',
    titleEn: 'Ninety-nine posts, and every one of them under something',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${posts.length} tiang pada susunan ${layout.grid.across} × ${layout.grid.along}, dan semuanya berada di bawah balok. Bangunan mana pun dapat dibuat bertiang sembilan puluh sembilan dengan menambahkan tiang hiasan; yang membuat cacah ini fakta tentang rangkanya adalah bagian kedua pemeriksaan ini.`
      : faults.join('; '),
    detailEn: ok
      ? `${posts.length} posts on a ${layout.grid.across} × ${layout.grid.along} grid, all of them under a beam. Any building can be given ninety-nine posts by adding ornamental ones; what makes this count a fact about the frame is the second half of this check.`
      : faults.join('; '),
  }
}

/**
 * The spacing stays inside what a beam will cross.
 *
 * This is the only way this building can grow, and it is the only way it can
 * fail: the count is fixed by a text, so a larger palace is a wider grid, and
 * a wider grid asks more of every beam in it.
 */
export function checkSpansFollow(layout: Layout): CheckResult {
  const ok = layout.spacing.bay <= layout.spacing.limit + TOL
  return {
    key: 'spans-follow',
    titleId: 'Jarak tiangnya masih dapat diseberangi satu balok',
    titleEn: 'The spacing stays inside what a beam will cross',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Jarak antar tiang ${layout.spacing.bay.toFixed(2)} m terhadap bentang ${layout.spacing.limit.toFixed(2)} m. Jumlah tiangnya tidak dapat ditambah, jadi satu-satunya jalan membesarkan istana ini adalah merenggangkan jaraknya — dan cacahnya milik sebuah teks sedangkan bentangnya milik kayunya.`
      : `jaraknya ${layout.spacing.bay.toFixed(2)} m dan satu balok hanya menyeberangi ${layout.spacing.limit.toFixed(2)} m`,
    detailEn: ok
      ? `A ${layout.spacing.bay.toFixed(2)} m spacing against a ${layout.spacing.limit.toFixed(2)} m span. The number of posts cannot be added to, so the only way to a larger palace is a wider grid — and the count belongs to a text while the span belongs to the timber.`
      : `the spacing is ${layout.spacing.bay.toFixed(2)} m and a beam only crosses ${layout.spacing.limit.toFixed(2)} m`,
  }
}

/**
 * Two halls, one frame, one roof.
 *
 * The great hall and the inner part are one building rather than two joined:
 * the same grid runs under both, the floor is one plane, and one roof covers
 * them. What separates them is a partition, which is the smallest thing that
 * can separate anything here.
 */
export function checkTwoHallsOneRoof(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  if (layout.halls.length !== 2) faults.push(`${layout.halls.length} halls, expected two`)
  const roofs = house.parts.filter((p) => p.stage === 'atap')
  if (roofs.length !== 1) faults.push(`${roofs.length} roofs, expected one over both`)
  const floors = house.parts.filter((p) => p.name === 'lantai')
  if (floors.length !== 1) faults.push(`${floors.length} floors, expected one plane`)
  for (const roof of roofs) {
    const b = partBounds(roof)
    if (b.min[2] > -layout.halfZ + TOL || b.max[2] < layout.halfZ - TOL) {
      faults.push('the roof does not reach over both halls')
    }
  }
  const ok = faults.length === 0
  const great = layout.halls[0]
  return {
    key: 'two-halls-one-roof',
    titleId: 'Dua balai, satu rangka, satu atap',
    titleEn: 'Two halls, one frame, one roof',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Bala rea sepanjang ${((great?.to ?? 0) - (great?.from ?? 0)).toFixed(1)} m dan bagian dalam di belakangnya, keduanya di atas grid yang sama dan di bawah satu atap. Yang memisahkan keduanya sebuah sekat — benda paling tipis yang dapat memisahkan apa pun dalam kumpulan ini.`
      : faults.join('; '),
    detailEn: ok
      ? `A ${((great?.to ?? 0) - (great?.from ?? 0)).toFixed(1)} m bala rea with the inner part behind it, both on the same grid and under one roof. What separates them is a partition — the thinnest thing that separates anything in this collection.`
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
    checkNinetyNine(house, layout),
    checkSpansFollow(layout),
    checkTwoHallsOneRoof(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
