/**
 * The checks that are claims about the siwaluh jabu.
 *
 * The generic half comes from the core unchanged for the eighteenth time.
 *
 * `checkNoPartitions` is the one to read first, and it is the third member of
 * a set: the Dayak pack checks that every household's room is identical, the
 * Maluku pack checks that every clan's seat is identical, and this one checks
 * that **there is nothing between the households at all**. One social fact,
 * three buildings, and three checks that share no member.
 *
 * What none of them can test is that people got on. This project has nobody in
 * it, so an undivided floor is testable and a shared life is not.
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
import { ijukBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * Symmetric across the length, and deliberately not along it.
 *
 * The two households sharing a hearth are mirror images of each other; the
 * households at the two ends are not, because one end is the root of the tree
 * and the other is the tip. A check about the long axis would have to be false
 * or be softened, so the claim is scoped to the one axis where it is true —
 * the reading the Minang pack arrived at for its bilik.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang tengah memanjang, z = 0 — dan sengaja tidak terhadap panjangnya',
    labelEn: 'Symmetric about the long mid-plane, z = 0 — and deliberately not along its length',
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
 * Nothing stands between the households.
 *
 * The claim is the building. Every wall is on the perimeter and every post is
 * on it or on a cross line of the frame; nothing at all is emitted between one
 * household's place and the next. A single board on a bay line would turn this
 * into a small betang, and the difference between the two buildings is
 * precisely that board.
 */
export function checkNoPartitions(house: House, layout: Layout): CheckResult {
  const inner = layout.halfZ - layout.postSection * 1.5
  const ends = layout.length / 2 - layout.postSection * 1.5
  const offenders: string[] = []
  for (const part of house.parts) {
    if (part.stage !== 'dinding') continue
    const b = partBounds(part)
    const insideZ = Math.abs(b.min[2]) < inner && Math.abs(b.max[2]) < inner
    const insideX = Math.abs(b.min[0]) < ends && Math.abs(b.max[0]) < ends
    if (insideZ && insideX) offenders.push(part.id)
  }
  const ok = offenders.length === 0
  return {
    key: 'no-partitions',
    titleId: 'Tidak ada sekat: satu ruang untuk seluruh rumah tangga',
    titleEn: 'No partitions: one room for every household',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.jabu.length} rumah tangga dalam satu ruang ${layout.length.toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m, dan tidak satu papan pun berdiri di antara mereka. Rumah betang memberi tiap rumah tangga bilik sendiri; perbedaan antara kedua bangunan itu justru papan yang tidak ada di sini.`
      : `${offenders.length} bagian berdiri di dalam ruangnya: ${offenders.slice(0, 5).join(', ')}`,
    detailEn: ok
      ? `${layout.jabu.length} households in one room ${layout.length.toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m, and not one board stands between them. A rumah betang gives each household a room of its own; the difference between the two buildings is exactly the board that is not here.`
      : `${offenders.length} parts stand inside the room: ${offenders.slice(0, 5).join(', ')}`,
  }
}

/**
 * One hearth to every two households, and each pair on either side of it.
 *
 * Cooking is arranged for two rather than for one, and what arranges it is
 * where the fire is — not a wall, because there is no wall.
 */
export function checkSharedHearths(house: House, layout: Layout): CheckResult {
  const hearths = house.parts.filter((p) => p.stage === 'dapur')
  const faults: string[] = []
  if (hearths.length !== layout.jabu.length / 2) {
    faults.push(`${hearths.length} hearths for ${layout.jabu.length} households`)
  }
  for (const hearth of layout.hearths) {
    const sharing = layout.jabu.filter((j) => j.hearth === hearth.index)
    if (sharing.length !== 2) {
      faults.push(`hearth ${hearth.index + 1} is shared by ${sharing.length}`)
      continue
    }
    const [a, b] = sharing
    if (!a || !b || Math.abs(a.z + b.z) > TOL) {
      faults.push(`hearth ${hearth.index + 1} is not between its two households`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'shared-hearths',
    titleId: 'Satu tungku untuk tiap dua rumah tangga, dan keduanya di sisi berlawanan',
    titleEn: 'One hearth to every two households, one on each side of it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${hearths.length} tungku untuk ${layout.jabu.length} rumah tangga. Memasak adalah urusan berdua, dan yang mengaturnya adalah letak apinya.`
      : faults.join('; '),
    detailEn: ok
      ? `${hearths.length} hearths for ${layout.jabu.length} households. Cooking is a matter for two, and what arranges it is where the fire is.`
      : faults.join('; '),
  }
}

/**
 * Every hearth stands clear of every post and every wall.
 *
 * The check exists because there are no partitions. In a rumah betang each
 * fire is inside its own bilik and the bilik keeps it off the frame; here the
 * fire burns in the same room as everybody and everything, and what keeps it
 * off a post is distance — a number rather than a member.
 */
export function hearthGaps(
  house: House,
  layout: Layout,
): readonly { readonly id: string; readonly gap: number }[] {
  /*
   * Only what a fire can reach.
   *
   * Measured against every part at first, which put the door head — a lintel
   * two metres above the floor — among the things a hearth was too close to.
   * A member that begins above a standing person is not in the way of a fire
   * on the floor, and a check that says otherwise is measuring a plan rather
   * than a room.
   */
  const reach = layout.floorY + DIMS.floorThickness.value + 1
  const out: { id: string; gap: number }[] = []
  for (const hearth of layout.hearths) {
    for (const part of house.parts) {
      if (part.stage !== 'tiang' && part.stage !== 'dinding') continue
      const b = partBounds(part)
      if (b.min[1] > reach) continue
      const dx = Math.max(b.min[0] - hearth.x, 0, hearth.x - b.max[0])
      const dz = Math.max(b.min[2] - hearth.z, 0, hearth.z - b.max[2])
      out.push({ id: part.id, gap: Math.hypot(dx, dz) - hearth.radius })
    }
  }
  return out
}

export function checkHearthClearance(house: House, layout: Layout): CheckResult {
  const gaps = hearthGaps(house, layout)
  const risky = gaps
    .filter((g) => g.gap < layout.hearthClearance - TOL)
    .map((g) => `${g.id} (${g.gap.toFixed(2)} m)`)
  const tightest = gaps.reduce((min, g) => Math.min(min, g.gap), Infinity)
  const ok = risky.length === 0
  return {
    key: 'hearth-clearance',
    titleId: 'Tiap tungku berjarak bebas dari tiap tiang dan dinding',
    titleEn: 'Every hearth stands clear of every post and wall',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Jarak terkecil ${tightest.toFixed(2)} m, terhadap ${layout.hearthClearance.toFixed(2)} m yang disyaratkan. Pemeriksaan ini ada justru karena tidak ada sekat: di rumah betang tiap api berada dalam biliknya sendiri, di sini yang menjaganya dari tiang hanyalah jarak.`
      : `${risky.length} terlalu dekat: ${risky.slice(0, 4).join(', ')}`,
    detailEn: ok
      ? `The tightest gap is ${tightest.toFixed(2)} m against the ${layout.hearthClearance.toFixed(2)} m required. This check exists because there are no partitions: in a rumah betang each fire is inside its own bilik, here what keeps it off a post is distance.`
      : `${risky.length} too close: ${risky.slice(0, 4).join(', ')}`,
  }
}

/**
 * The senior place is at the root end of the timber.
 *
 * The great beams are laid with the tree's base at one end, and the order of
 * the households runs from there. Nothing in the geometry can show which end a
 * tree grew from — so the layout states it, the ranks are counted from it, and
 * this check holds the two together. Reverse the order and the model is
 * byte-identical except for which household is called senior, which is exactly
 * why it needs a check rather than a comment.
 */
export function checkOrderedByTheTree(layout: Layout): CheckResult {
  const sorted = [...layout.jabu].sort((a, b) => a.rank - b.rank)
  const faults: string[] = []
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) faults.push('no places')
  if (first && Math.abs(first.x - (layout.benaX + DIMS.bayLength.value / 2)) > TOL) {
    faults.push('the senior place is not at the root end')
  }
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (!prev || !cur) continue
    if (cur.x < prev.x - TOL) faults.push(`${cur.key} is nearer the root end than ${prev.key}`)
  }
  const ok = faults.length === 0
  return {
    key: 'ordered-by-tree',
    titleId: 'Tempat tertua ada di ujung pangkal kayu, dan urutannya berjalan dari sana',
    titleEn: 'The senior place is at the root end of the timber, and the order runs from there',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.jabu.length} tempat, diurutkan dari ${first?.nameId} di ujung pangkal ke ${last?.nameId} di ujung tip. Urutan kedudukan rumah ini diarahkan oleh arah tumbuh sebatang pohon.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.jabu.length} places, ordered from ${first?.nameEn} at the root end to ${last?.nameEn} at the tip. The order of standing in this house is oriented by the direction a tree grew.`
      : faults.join('; '),
  }
}

/** Ijuk courses lap with no bare band. */
export function checkIjukCoverage(layout: Layout): CheckResult {
  const bands = ijukBands(layout)
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
    key: 'ijuk-coverage',
    titleId: 'Lapis ijuk saling menindih tanpa celah',
    titleEn: 'Ijuk courses lap with no bare band',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis dari tepi ke bubungan, di atas badan yang rendah dan dinding yang condong.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses from eave to ridge, over a low body and leaning walls.`
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
    checkNoPartitions(house, layout),
    checkSharedHearths(house, layout),
    checkHearthClearance(house, layout),
    checkOrderedByTheTree(layout),
    checkIjukCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
