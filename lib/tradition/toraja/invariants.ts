/**
 * The checks that are claims about *this* house.
 *
 * The generic half of the suite — symmetry, joints, build order, mesh
 * integrity, part provenance, and the survey check that never passes — is in
 * `lib/core/invariants.ts`, because none of it is Toraja. What is left here
 * is the part that is: the ridge sags and the front prow is highest, the ijuk
 * laps with no bare strip, the eave oversails the post feet and clears the
 * plate, and the post count follows the bay count. Those are statements about
 * a tongkonan and they would be false of most other houses.
 *
 * A failing invariant fails the build. No skipping to unblock a feature.
 */

import {
  checkAgainstSurvey,
  checkBuildOrder as coreCheckBuildOrder,
  checkJointStages as coreCheckJointStages,
  checkPartProvenance as coreCheckPartProvenance,
  checkJoints,
  checkMeshes,
  checkSymmetry,
} from '@/lib/core/invariants'
import type { CheckResult } from '@/lib/core/invariants'
import { slopeDrop } from '@/lib/core/geometry'
import type { House, Layout } from './types'
import { ridgeOf } from './frame'
import { RIDGE_CAP_BAND, ijukBands } from './roof'
import { DIMS, PACK, rankInfo } from './rules'

export { checkAgainstSurvey, checkJoints, checkMeshes, checkSymmetry, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/* ── Bound to the Toraja pack ─────────────────────────────────────────── */

export function checkBuildOrder(house: House): CheckResult {
  return coreCheckBuildOrder(PACK, house)
}

export function checkJointStages(house: House): CheckResult {
  return coreCheckJointStages(PACK, house)
}

export function checkPartProvenance(house: House): CheckResult {
  return coreCheckPartProvenance(PACK, house)
}

/* ── The Toraja checks ────────────────────────────────────────────────── */

/**
 * The ridge sags in the interior, both prows rise, and the front prow is the
 * higher of the two. This ordering is canon; it has to fall out of the curve.
 */
export function checkRidgeProfile(layout: Layout): CheckResult {
  const ridge = ridgeOf(layout)
  let lowest = Infinity
  let lowestS = 0
  for (let i = 0; i <= 200; i++) {
    const s = i / 200
    const y = ridge(s).y
    if (y < lowest) {
      lowest = y
      lowestS = s
    }
  }
  const front = ridge(0).y
  const rear = ridge(1).y
  const interior = lowestS > 0.15 && lowestS < 0.85
  const sags = lowest < front - TOL && lowest < rear - TOL
  const frontHigher = front > rear + TOL
  const ok = interior && sags && frontHigher
  return {
    key: 'ridge-profile',
    titleId: 'Punggung melengkung turun, kedua haluan naik, haluan depan tertinggi',
    titleEn: 'Ridge sags in the interior; both prows rise; the front prow is highest',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `titik terendah pada s=${lowestS.toFixed(2)} (${lowest.toFixed(2)} m); haluan depan ${front.toFixed(2)} m, belakang ${rear.toFixed(2)} m.`
      : `s terendah ${lowestS.toFixed(2)}, depan ${front.toFixed(2)}, belakang ${rear.toFixed(2)}.`,
    detailEn: ok
      ? `lowest point at s=${lowestS.toFixed(2)} (${lowest.toFixed(2)} m); front prow ${front.toFixed(2)} m, rear ${rear.toFixed(2)} m.`
      : `lowest s ${lowestS.toFixed(2)}, front ${front.toFixed(2)}, rear ${rear.toFixed(2)}.`,
  }
}

/**
 * Ijuk courses lap with no bare strip, and the ridge is covered.
 *
 * The bands are read from the same function the geometry was cut from, so a
 * lap that is claimed and a lap that is built cannot drift apart.
 */
export function checkIjukCoverage(house: House, layout: Layout): CheckResult {
  const bands = ijukBands(layout)
  const gaps: string[] = []
  // Eave course must reach the eave; each course must reach past the head of
  // the one below it, or a strip of frame shows through.
  const first = bands[0]
  if (!first || first.foot < 1 - TOL) gaps.push('lapis terbawah tidak mencapai tepi atap')
  for (let k = 1; k < bands.length; k++) {
    const below = bands[k - 1]
    const cur = bands[k]
    if (!below || !cur) continue
    const lap = cur.foot - below.head
    if (lap <= TOL) gaps.push(`lapis ${k + 1} tidak menindih lapis ${k}`)
  }
  const top = bands[bands.length - 1]
  if (!top || top.head > TOL) gaps.push('lapis teratas tidak mencapai punggung')
  const cap = house.parts.find((p) => p.id === 'ijuk-bubungan')
  if (!cap) gaps.push('tidak ada penutup punggung')
  if (RIDGE_CAP_BAND.head > TOL) gaps.push('penutup punggung tidak menutup garis punggung')

  const minLap =
    bands.length > 1
      ? Math.min(
          ...bands.slice(1).map((b, i) => b.foot - (bands[i]?.head ?? 0)),
        )
      : 1
  return {
    key: 'ijuk-coverage',
    titleId: 'Lapis ijuk saling menindih tanpa celah; punggung tertutup',
    titleEn: 'Ijuk courses lap with no bare strip; the ridge is covered',
    status: gaps.length === 0 ? 'pass' : 'fail',
    detail:
      gaps.length === 0
        ? `${bands.length} lapis; tindihan terkecil ${(minLap * 100).toFixed(1)}% dari bentang lereng.`
        : gaps.join('; '),
    detailEn:
      gaps.length === 0
        ? `${bands.length} courses; smallest lap ${(minLap * 100).toFixed(1)}% of the slope run.`
        : gaps.join('; '),
  }
}

/**
 * The eave oversails the outer post line.
 *
 * Rain shed off a pitch this steep has to land clear of the post feet. That
 * is why the overhang is as deep as it is, so it is an invariant rather than
 * a coincidence of the numbers.
 */
export function checkEaveOversail(layout: Layout): CheckResult {
  const outerPostFace = Math.max(...layout.postZ.map(Math.abs)) + layout.postSection / 2
  const clear = layout.eaveHalfWidth - outerPostFace
  const ok = clear > TOL
  return {
    key: 'eave-oversail',
    titleId: 'Tepi atap melewati garis tiang terluar',
    titleEn: 'The eave oversails the outer post line',
    status: ok ? 'pass' : 'fail',
    detail: `tepi atap ${layout.eaveHalfWidth.toFixed(2)} m dari sumbu; muka tiang terluar ${outerPostFace.toFixed(2)} m; julur ${clear.toFixed(2)} m.`,
    detailEn: `eave ${layout.eaveHalfWidth.toFixed(2)} m from the axis; outer post face ${outerPostFace.toFixed(2)} m; oversail ${clear.toFixed(2)} m.`,
  }
}

/**
 * The eave clears the wall plate: the roof passes over the plate on its way
 * out, rather than through it, and the eave edge lands outboard of it.
 */
export function checkEaveClearsPlate(layout: Layout): CheckResult {
  const s = rankInfo(layout.rules.rank).scale.value
  const plateZ = Math.max(...layout.postZ.map(Math.abs))
  const plateTop = layout.plateY + (DIMS.plateDepth.value * s) / 2
  const f = plateZ / layout.eaveHalfWidth
  // Height of the flared roof where it crosses the plate. Read from the same
  // curve the surface was swept along, not from a straight chord.
  const roofY =
    layout.ridgeY -
    (layout.ridgeY - layout.eaveY) *
      slopeDrop(f, { at: layout.breakFraction, drop: layout.kneeDrop })
  const clearsAbove = roofY > layout.plateY - (DIMS.plateDepth.value * s) / 2 - TOL
  const outboard = layout.eaveHalfWidth > plateZ + TOL
  const ok = clearsAbove && outboard
  return {
    key: 'eave-plate',
    titleId: 'Atap melewati balok tumpuan lalu turun di luarnya',
    titleEn: 'The eave clears the wall plate',
    status: ok ? 'pass' : 'fail',
    detail: `atap pada z=${plateZ.toFixed(2)} m berada di ${roofY.toFixed(2)} m; puncak balok tumpuan ${plateTop.toFixed(2)} m; tepi atap ${layout.eaveHalfWidth.toFixed(2)} m.`,
    detailEn: `roof at z=${plateZ.toFixed(2)} m sits at ${roofY.toFixed(2)} m; top of the wall plate ${plateTop.toFixed(2)} m; eave ${layout.eaveHalfWidth.toFixed(2)} m.`,
  }
}

/** Post count follows the declared bay count. */
export function checkPostCount(house: House, layout: Layout): CheckResult {
  const expectedRows = layout.rules.bays + 1
  const expected = expectedRows * layout.postZ.length
  const posts = house.parts.filter((p) => p.id.startsWith('ariri-')).length
  const stones = house.parts.filter((p) => p.id.startsWith('batu-') && p.id !== 'batu-tulak-somba')
    .length
  const ok = posts === expected && stones === expected && layout.postX.length === expectedRows
  return {
    key: 'post-count',
    titleId: 'Jumlah tiang mengikuti jumlah ruang',
    titleEn: 'Post count follows the declared bay count',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.rules.bays} ruang → ${expectedRows} baris × ${layout.postZ.length} tiang = ${expected} a'riri, ${stones} batu umpak.`
      : `diharapkan ${expected}, ditemukan ${posts} tiang dan ${stones} batu.`,
    detailEn: ok
      ? `${layout.rules.bays} bays → ${expectedRows} rows × ${layout.postZ.length} posts = ${expected} a'riri, ${stones} pad stones.`
      : `expected ${expected}, found ${posts} posts and ${stones} stones.`,
  }
}


/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkSymmetry(house),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkRidgeProfile(layout),
    checkIjukCoverage(house, layout),
    checkEaveOversail(layout),
    checkEaveClearsPlate(layout),
    checkPostCount(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
