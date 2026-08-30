/**
 * The checks that are claims about the lepa.
 *
 * The generic half comes from the core unchanged for the twenty-first time,
 * and this is the hardest test it has had: y = 0 is the bottom of a keel here
 * rather than the ground, and `checkBuildOrder` reads that datum as ground the
 * way it always has. A strake resting on a keel is a part resting on
 * something, and the core has no opinion about what is underneath the keel.
 *
 * The particular checks are about balance and about absence. `checkBalance` is
 * the first invariant in this project to compute a centre — and it comes with
 * the limit stated on it rather than implied: **it cannot say whether a boat
 * floats.** There are no material properties here and there will not be. What
 * it can say is that the parts of this building are arranged low and on the
 * centreline, which is what the sources describe and what a geometry can hold.
 *
 * `checkNothingTouchesGround` is a check for a zero, like the honai's windows
 * and the Arfak house's bracing: the claim is that there is no site.
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
import type { House, Layout, Part } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * Symmetric about the keel plane, and this is the one house where symmetry is
 * not an aesthetic claim but the difference between floating and not.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap bidang lunas, z = 0 — di sini simetri bukan soal rupa',
    labelEn: 'Symmetric about the keel plane, z = 0 — here symmetry is not a matter of looks',
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

/** The centre of every part, by bounding-box volume: the balance reading. */
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
 * The weight is low and on the centreline.
 *
 * The first check in this project that computes a centre, and the limit is
 * declared rather than derived, so the comparison is between two independent
 * numbers. It cannot say the boat is stable — nothing here can — and the
 * caution says so. What it says is that this building keeps its parts where a
 * floating house has to keep them.
 */
export function checkBalance(house: House, layout: Layout): CheckResult {
  const centre = centreOf(house.parts)
  const above = centre.y - layout.draught
  const off = Math.abs(centre.z)
  const faults: string[] = []
  if (above > layout.centreLimit + TOL) {
    faults.push(`the centre sits ${above.toFixed(2)} m above the waterline, and ${layout.centreLimit.toFixed(2)} m is the limit`)
  }
  if (off > DIMS.listLimit.value + TOL) {
    faults.push(`the centre is ${off.toFixed(3)} m off the keel plane`)
  }
  const ok = faults.length === 0
  return {
    key: 'balance',
    titleId: 'Beratnya rendah dan di tengah',
    titleEn: 'The weight is low and on the centreline',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Titik tengah seluruh bagian berada ${above.toFixed(2)} m di atas garis air, terhadap batas ${layout.centreLimit.toFixed(2)} m, dan ${(off * 1000).toFixed(0)} mm dari bidang lunas. Pemeriksaan ini tidak dapat mengatakan perahunya stabil — projek ini tidak punya sifat bahan — melainkan bahwa bagian-bagiannya diletakkan di tempat rumah yang mengapung harus meletakkannya.`
      : faults.join('; '),
    detailEn: ok
      ? `The centre of all the parts sits ${above.toFixed(2)} m above the waterline against a ${layout.centreLimit.toFixed(2)} m limit, and ${(off * 1000).toFixed(0)} mm off the keel plane. This check cannot say the boat is stable — this project has no material properties — only that its parts are where a floating house has to keep them.`
      : faults.join('; '),
  }
}

/**
 * Nothing touches the ground, because there is no ground.
 *
 * A check for a zero, like the honai's windows and the Arfak house's bracing.
 * The datum in this pack is the bottom of the keel and the only thing at it is
 * the keel: no stone, no post, no footing, no plan on any land.
 */
export function checkNothingTouchesGround(house: House, layout: Layout): CheckResult {
  // Nothing in this pack's material union is a footing, and that is the
  // point: there is no stone in it at all, because there is nothing to set
  // one on.
  const footings = house.parts.filter((p) => p.name === 'batu')
  const below: string[] = []
  for (const part of house.parts) {
    if (partBounds(part).min[1] < -TOL) below.push(part.id)
  }
  const wet = house.parts.filter((p) => partBounds(p).min[1] < layout.draught - TOL).length
  const ok = footings.length === 0 && below.length === 0
  return {
    key: 'no-ground',
    titleId: 'Tidak ada yang menyentuh tanah, karena tidak ada tanah',
    titleEn: 'Nothing touches the ground, because there is no ground',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Nol batu alas, nol tiang pancang, nol tapak. Yang ada di titik nol pak ini hanyalah lunas, dan yang di bawahnya air: ${wet} bagian berada di bawah garis air. Dua puluh bangunan lain berdiri di atas sesuatu; yang ini tidak berdiri sama sekali.`
      : `${footings.length} tumpuan tanah, ${below.length} bagian di bawah datum`,
    detailEn: ok
      ? `Zero pad stones, zero driven piles, zero footprint. The only thing at this pack’s zero is the keel, and what is under it is water: ${wet} parts sit below the waterline. The other twenty buildings stand on something; this one does not stand at all.`
      : `${footings.length} ground bearings, ${below.length} parts below the datum`,
  }
}

/**
 * The deck stays above the water.
 *
 * The one thing this house shares with the kariwari, and it means something
 * different: there the floor clears a tide that comes and goes, here the
 * freeboard is what the boat has *left* — and it is the same number whether
 * the tide is in or out, because the house rises with it.
 */
export function checkFreeboard(layout: Layout): CheckResult {
  const ok = layout.freeboard > 0 && layout.deckY > layout.draught + TOL
  return {
    key: 'freeboard',
    titleId: 'Geladaknya di atas garis air',
    titleEn: 'The deck stands above the waterline',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Lambung terbenam ${layout.draught.toFixed(2)} m dan tepi geladak ${layout.freeboard.toFixed(2)} m di atas air. Kariwari juga menjaga lantainya di atas air, dan artinya berbeda: di sana lantainya melewati pasang yang datang dan pergi, di sini jarak ini tetap sama entah pasang atau surut — karena rumahnya ikut naik.`
      : `sisa lambung ${layout.freeboard.toFixed(2)} m`,
    detailEn: ok
      ? `The hull sits ${layout.draught.toFixed(2)} m deep and the sheer stands ${layout.freeboard.toFixed(2)} m above the water. The kariwari also keeps its floor above the water, and means something else by it: there the floor clears a tide that comes and goes, here this figure is the same at high water and low — because the house rises with it.`
      : `freeboard is ${layout.freeboard.toFixed(2)} m`,
  }
}

/**
 * The awning is what makes it a house, and it is low.
 *
 * Two claims in one, and they are the same claim: the kajang is the dwelling,
 * and a dwelling on a narrow hull may not be tall. Nobody stands up in a lepa.
 */
export function checkAwning(house: House, layout: Layout): CheckResult {
  const parts = house.parts.filter((p) => p.stage === 'kajang')
  const faults: string[] = []
  if (layout.kajang.present && parts.length === 0) faults.push('the awning is up and has no parts')
  if (!layout.kajang.present && parts.length > 0) faults.push('the awning is down and has parts')
  if (layout.kajang.present) {
    const top = Math.max(...parts.map((p) => partBounds(p).max[1]))
    const height = top - (layout.deckY + DIMS.deckThickness.value)
    if (height > 1.5) faults.push(`the awning stands ${height.toFixed(2)} m over the deck`)
  }
  const ok = faults.length === 0
  return {
    key: 'awning',
    titleId: 'Kajang itulah rumahnya, dan ia rendah',
    titleEn: 'The awning is the house, and it is low',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.kajang.present
        ? `Kajang setinggi ${layout.kajang.rise.toFixed(2)} m di atas geladak: orang duduk dan berbaring di bawahnya, tidak berdiri. Itu bukan soal ruang kepala melainkan soal keseimbangan — berat yang tinggi pada lambung sempit adalah perahu yang berguling.`
        : `Kajang diturunkan. Tidak satu papan pun pada perahunya berubah, dan bendanya berhenti menjadi tempat tinggal.`
      : faults.join('; '),
    detailEn: ok
      ? layout.kajang.present
        ? `The awning stands ${layout.kajang.rise.toFixed(2)} m over the deck: people sit and lie under it, they do not stand. That is not a matter of headroom but of balance — weight high in a narrow hull is a boat that rolls.`
        : `The awning is down. Not one plank of the boat has changed, and the thing has stopped being a dwelling.`
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
    checkBalance(house, layout),
    checkNothingTouchesGround(house, layout),
    checkFreeboard(layout),
    checkAwning(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
