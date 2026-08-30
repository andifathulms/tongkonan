/**
 * The checks that are claims about the uma — and one claim that is not a check.
 *
 * `nobodyIsSenior` is the reason this building is in the collection and there
 * is no invariant for it, because there cannot be one: a building with no rank
 * in it and a building whose rank nobody modelled are the same model. Two
 * packs have met that wall before — the Baduy prohibitions on sawing and iron,
 * the Buton floors whose occupants are fixed — and both said so. This is the
 * first where the unprovable thing is the whole point, so it is worth being
 * exact about what the checks below *do* establish: that the shares are equal,
 * that the front is open to anybody, and that the record on the wall belongs
 * to the house. None of those three is the absence of a chief. Together they
 * are what a model can honestly say about one.
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

/**
 * Symmetric across the length and deliberately not along it.
 *
 * Front and back are public and private, so a mirror plane across the ridge
 * would be false. The plane that does hold is the one the ridge lies in.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 0,
    include: () => true,
    labelId: 'Simetris terhadap bidang bubungan, x = 0 — dan sengaja tidak simetris pada arah panjangnya, sebab depan dan belakang berbeda kegunaannya',
    labelEn: 'Symmetric about the plane of the ridge, x = 0 — and deliberately not along its length, because front and back are used differently',
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
 * Every household has the same share, and the same hearth.
 *
 * What this check can say is that nothing in the model distinguishes one
 * household from another. What it cannot say is that nothing outside the model
 * does — see the note at the head of this file.
 */
export function checkSharesAreEqual(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const hearths = house.parts.filter((p) => p.name === 'perapian')
  if (hearths.length !== layout.rules.keluarga) {
    faults.push(`${hearths.length} hearths for ${layout.rules.keluarga} households`)
  }
  const sizes = new Set(hearths.map((p) => (p.kind === 'box' ? p.size.map((v) => v.toFixed(4)).join('x') : 'mesh')))
  if (sizes.size > 1) faults.push('the hearths are not all the same size')
  for (let i = 1; i < layout.households.length; i++) {
    const before = layout.households[i - 1]
    const here = layout.households[i]
    if (!before || !here) continue
    if (Math.abs(here.share - before.share) > TOL) faults.push(`household ${i + 1} has a different share`)
    if (Math.abs(here.z - before.z - before.share) > TOL) faults.push(`household ${i + 1} is not one share along`)
  }
  const ok = faults.length === 0
  return {
    key: 'shares-are-equal',
    titleId: 'Tiap rumah tangga mendapat bagian yang sama',
    titleEn: 'Every household has the same share',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.keluarga} bagian, masing-masing ${(layout.households[0]?.share ?? 0).toFixed(2)} m, dengan perapian yang sama besarnya dan jarak yang sama. Yang dapat dikatakan pemeriksaan ini hanyalah bahwa tidak ada apa pun di dalam model yang membedakan satu rumah tangga dari yang lain; bahwa tidak ada pula yang membedakannya di luar model adalah pernyataan pak ini, bukan putusannya.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.rules.keluarga} shares of ${(layout.households[0]?.share ?? 0).toFixed(2)} m each, with hearths of one size at one spacing. All this check can say is that nothing inside the model distinguishes one household from another; that nothing outside it does either is this pack’s claim rather than its verdict.`
      : faults.join('; '),
  }
}

/**
 * The front is open, and it has no wall at all.
 *
 * The veranda is where anybody may come and where the house decides things
 * together, so what the model has to show is an absence: no wall, no
 * partition, nothing across it. It is the checkable half of a claim whose
 * other half cannot be checked.
 */
export function checkOpenAtTheFront(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (const part of house.parts) {
    if (part.name !== 'dinding' && part.name !== 'sekat') continue
    const b = partBounds(part)
    const mid = (b.min[2] + b.max[2]) / 2
    if (mid < layout.room.from - TOL) faults.push(`${part.id} closes part of the front veranda`)
  }
  const depth = layout.room.from - layout.front.from
  const ok = faults.length === 0
  return {
    key: 'open-at-the-front',
    titleId: 'Serambi depan terbuka, tanpa dinding sama sekali',
    titleEn: 'The front veranda is open, with no wall at all',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${depth.toFixed(1)} m lantai terbuka menghadap sungai: tidak ada dinding, tidak ada sekat, tidak ada apa pun yang melintanginya. Di situlah siapa pun boleh datang dan di situlah rumah ini mengambil keputusannya.`
      : faults.join('; '),
    detailEn: ok
      ? `${depth.toFixed(1)} m of open floor facing the river: no wall, no partition, nothing across it. That is where anybody may come and where this house takes its decisions.`
      : faults.join('; '),
  }
}

/**
 * One record, and it belongs to the house.
 *
 * There is exactly one jaraik, it is on the centre line, and it hangs in the
 * open veranda where everybody is — not in any household's share. Compare the
 * Nias behu, one stone to a household's feast, and the Bugis timpa laja, a
 * stack of boards that is one household's rank.
 */
export function checkTheRecordIsShared(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const boards = house.parts.filter((p) => p.name === 'jaraik')
  if (layout.jaraik.present) {
    if (boards.length !== 1) faults.push(`${boards.length} jaraik, expected exactly one`)
    const board = boards[0]
    if (board) {
      const b = partBounds(board)
      const mid = (b.min[0] + b.max[0]) / 2
      if (Math.abs(mid) > TOL) faults.push('the jaraik is not on the centre line')
      if ((b.min[2] + b.max[2]) / 2 > layout.room.from) faults.push('the jaraik hangs inside the closed room')
    }
  } else if (boards.length !== 0) {
    faults.push('a jaraik is built on a house that has none')
  }
  const ok = faults.length === 0
  return {
    key: 'the-record-is-shared',
    titleId: 'Satu catatan, dan catatan itu milik rumahnya',
    titleEn: 'One record, and it belongs to the house',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.jaraik.present
        ? 'Satu jaraik, di sumbu tengah, tergantung di serambi terbuka tempat semua orang berada — bukan di dalam bagian rumah tangga mana pun. Behu Nias mencatat pesta satu rumah tangga dan timpa laja Bugis mencatat kedudukan satu rumah tangga; yang ini tidak mencatat siapa-siapa secara khusus.'
        : 'Rumah ini tidak memasang jaraik, dan tidak ada penggantinya di bagian rumah tangga mana pun: yang tidak ada tetap tidak ada milik siapa-siapa.'
      : faults.join('; '),
    detailEn: ok
      ? layout.jaraik.present
        ? 'One jaraik, on the centre line, hanging in the open veranda where everybody is — not inside any household’s share. A Nias behu records one household’s feast and a Bugis timpa laja one household’s rank; this one records nobody in particular.'
        : 'This house carries no jaraik, and nothing stands in for one inside any household’s share: what is absent is still absent for everybody.'
      : faults.join('; '),
  }
}

/**
 * The floor can be danced on.
 *
 * The planks cross from bearer to bearer with nothing under the middle, and
 * turuk is danced on them, so the spacing of the bearers is bounded by what a
 * split plank will span. The two numbers are independent: the spacing is a
 * framing decision and the span belongs to the timber.
 */
export function checkFloorSpans(layout: Layout): CheckResult {
  const ok = layout.span.clear <= layout.span.plank + TOL
  return {
    key: 'floor-spans',
    titleId: 'Papan lantainya menyeberangi jarak gelagarnya',
    titleEn: 'The planks cross the space between the bearers',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Gelagarnya berjarak ${layout.span.clear.toFixed(2)} m dan sebilah papan menyeberangi ${layout.span.plank.toFixed(2)} m. Lantai ini dipakai menari turuk: ia memang harus melenting, dan justru itulah yang membuat jarak gelagarnya berbatas. Jaraknya keputusan tukang, bentangnya milik kayunya, dan tidak ada yang menghubungkan keduanya.`
      : `gelagarnya berjarak ${layout.span.clear.toFixed(2)} m dan papannya hanya menyeberangi ${layout.span.plank.toFixed(2)} m`,
    detailEn: ok
      ? `The bearers stand ${layout.span.clear.toFixed(2)} m apart and a plank crosses ${layout.span.plank.toFixed(2)} m. This floor is danced on for turuk: it is meant to spring, and that is exactly what bounds the spacing. The spacing is the builder’s decision, the span belongs to the timber, and nothing relates them.`
      : `the bearers stand ${layout.span.clear.toFixed(2)} m apart and a plank only crosses ${layout.span.plank.toFixed(2)} m`,
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
    checkSharesAreEqual(house, layout),
    checkOpenAtTheFront(house, layout),
    checkTheRecordIsShared(house, layout),
    checkFloorSpans(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}

/** The hearth spacing, for the tests that walk it. */
export function shareSpacing(layout: Layout): number {
  return DIMS.shareLength.value
}
