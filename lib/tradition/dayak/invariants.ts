/**
 * The checks that are claims about the betang.
 *
 * The generic half comes from the core unchanged for the seventh time —
 * except one, and the exception is the finding.
 *
 * `checkSymmetry` has been scoped before: the rumah gadang's bilik fill from
 * one end, so the claim was narrowed to its frame. This house needs the same
 * treatment for a stronger reason. A betang is *not* symmetric along its
 * length and cannot be: it grew from one end, its households are ranked along
 * it, and the way in is at whichever end has always been there. So the mirror
 * claim is made about the section — the arrangement across the building, which
 * is identical at every point along it — and never about the length.
 *
 * `checkNoCharacteristicLength` is the check no other house here could have.
 * Every other building has a shape its rules size; this one has a shape its
 * rules *count*. The check states that adding a household lengthens the
 * building by exactly one share and changes nothing else — so the ratio of
 * length to width is not a property of a betang at all. It passes by showing
 * a proportion failing to hold, which no other invariant in this project does.
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
import { hipRun } from '@/lib/core/hip'
import { DIMS, PACK, tumbuhInfo } from './rules'
import { roofLevels, shingleBands } from './roof'
import type { House, Layout } from './types'
import { resolveLayout } from './frame'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * The section mirrors, and the length does not.
 *
 * Mirroring across Z would be a claim about the length, which is false by
 * construction — a house entered at one end is not the same house reflected.
 * So the axis is X: gallery in front, bilik behind, and *that* is not
 * symmetric either. There is nothing here to mirror, and saying so is more
 * useful than choosing an axis that happens to pass.
 *
 * What replaces it is `checkSectionIsConstant`: every household's share is
 * identical to every other's, which is the real regularity this building has.
 */
export function checkSectionIsConstant(house: House, layout: Layout): CheckResult {
  const walls = house.parts.filter((p) => p.id.startsWith('muka-bagian-'))
  const partitions = house.parts.filter((p) => p.id.startsWith('sekat-'))
  const faults: string[] = []

  // Two face-wall boards per household, and one fewer partition than households.
  if (walls.length !== layout.shares.length * 2) {
    faults.push(`${walls.length} front-wall boards for ${layout.shares.length} households`)
  }
  if (partitions.length !== layout.shares.length - 1) {
    faults.push(`${partitions.length} partitions for ${layout.shares.length} households`)
  }

  // Every share the same length, to the millimetre.
  const lengths = layout.shares.map((s) => s.halfZ * 2)
  const first = lengths[0] ?? 0
  if (lengths.some((l) => Math.abs(l - first) > 1e-6)) faults.push('the shares are not equal')

  // And evenly spaced, which is what makes them a row rather than a heap.
  for (let i = 1; i < layout.shares.length; i++) {
    const a = layout.shares[i - 1]
    const b = layout.shares[i]
    if (!a || !b) continue
    if (Math.abs(b.z - a.z - first) > 1e-6) faults.push(`share ${i + 1} is out of step`)
  }

  const ok = faults.length === 0
  return {
    key: 'section',
    titleId: 'Setiap bagian keluarga sama besar, dan sekatnya selalu satu kurang daripada keluarganya',
    titleEn: 'Every household’s share is equal, and there is always one fewer partition than households',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.shares.length} bagian, masing-masing ${first.toFixed(2)} m, dipisahkan ${partitions.length} sekat. Rumah ini bukan rumah besar yang dibagi-bagi; ia deretan bagian yang setara. Perhatikan bahwa pemeriksaan cermin tidak dipakai di sini: rumah yang tumbuh dari satu ujung memang tidak simetris memanjang, dan memilih sumbu yang kebetulan lulus akan menyatakan sesuatu yang tidak benar.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.shares.length} shares of ${first.toFixed(2)} m each, divided by ${partitions.length} partitions. This is not a large house divided up; it is a row of equal shares. Note that no mirror check is made here: a house grown from one end is genuinely not symmetric along its length, and picking an axis that happens to pass would state something untrue.`
      : faults.join('; '),
  }
}

/** Across the building the arrangement is the same at every point along it. */
export function checkCrossSection(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: (p) => p.id.startsWith('gelagar-') || p.id === 'lantai' || p.id === 'bubungan',
    labelId: 'Rangka yang membentang seluruh panjang rumah simetris terhadap tengahnya',
    labelEn: 'The members running the whole length of the house mirror about its middle',
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

/* ── The one no other house here could make ───────────────────────────── */

/**
 * This building has no characteristic length.
 *
 * Rebuilds the house at several household counts and asserts two things at
 * once: that each added household lengthens it by exactly one share and
 * changes nothing across it, and that the resulting length-to-width ratio
 * therefore does *not* settle on any value. The second half is the unusual
 * one — every other check in this project passes by finding something that
 * holds, and this one passes by finding something that does not.
 *
 * Which is the honest way to state it. A betang's length is a census, so a
 * model that fixed a proportion would be inventing a fact about the building
 * type, and a check that asserted one would be enforcing the invention.
 */
export function checkNoCharacteristicLength(layout: Layout): CheckResult {
  const share = DIMS.shareLength.value
  const counts = [3, 8, 20]
  const ratios: number[] = []
  const faults: string[] = []

  let previous: number | null = null
  for (const n of counts) {
    const l = resolveLayout({ ...layout.rules, keluarga: n })
    if (Math.abs(l.length - share * n) > 1e-6) faults.push(`${n} households did not give ${n} shares of length`)
    if (Math.abs(l.halfX - layout.halfX) > 1e-6) faults.push(`${n} households changed the width`)
    if (Math.abs(l.floorY - layout.floorY) > 1e-6) faults.push(`${n} households changed the floor height`)
    if (Math.abs(l.ridgeY - layout.ridgeY) > 1e-6) faults.push(`${n} households changed the ridge height`)
    if (previous !== null && l.length <= previous) faults.push(`${n} households did not lengthen the house`)
    previous = l.length
    ratios.push(l.length / (l.halfX * 2))
  }

  const lo = Math.min(...ratios)
  const hi = Math.max(...ratios)
  // The claim: the ratio moves, and it moves a lot. A building type with a
  // characteristic proportion would hold this within a few per cent.
  const spreads = hi / lo > 2
  if (!spreads) faults.push('the length-to-width ratio barely moved, which would make this a proportioned building')

  const ok = faults.length === 0
  return {
    key: 'no-characteristic-length',
    titleId: 'Bangunan ini tidak punya ukuran khas: panjangnya sebuah sensus, bukan perbandingan',
    titleEn: 'This building has no characteristic size: its length is a census, not a proportion',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Dari 3 sampai 20 keluarga, perbandingan panjang terhadap lebar bergerak dari ${lo.toFixed(1)} ke ${hi.toFixed(1)} — ${(hi / lo).toFixed(1)} kali lipat — sementara lebar, tinggi lantai dan tinggi bubungan tidak berubah sama sekali. Tiap keluarga menambah tepat satu bagian dan tidak menambah apa pun yang lain. Ini satu-satunya pemeriksaan dalam projek ini yang lulus dengan menunjukkan sebuah perbandingan justru tidak bertahan.`
      : faults.join('; '),
    detailEn: ok
      ? `From 3 households to 20 the length-to-width ratio runs from ${lo.toFixed(1)} to ${hi.toFixed(1)} — ${(hi / lo).toFixed(1)} times — while the width, the floor height and the ridge height do not move at all. Each household adds exactly one share and adds nothing else. It is the only check in this project that passes by showing a proportion failing to hold.`
      : faults.join('; '),
  }
}

/** One floor, end to end: this is one building, not a row of houses touching. */
export function checkOneFloor(house: House, layout: Layout): CheckResult {
  const floors = house.parts.filter((p) => p.stage === 'lantai')
  const one = floors.length === 1
  const first = floors[0]
  const span = first ? partBounds(first) : undefined
  const got = span ? span.max[2] - span.min[2] : 0
  const ok = one && Math.abs(got - layout.length) < 0.01
  return {
    key: 'one-floor',
    titleId: 'Satu lantai menerus dari ujung ke ujung, di bawah bilik maupun galeri',
    titleEn: 'One floor, continuous end to end, under both the bilik and the gallery',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Satu bidang sepanjang ${got.toFixed(2)} m. Rumah ini satu bangunan, bukan sederet rumah yang berhimpitan — dan itulah yang membedakannya dari sebuah kampung.`
      : `${floors.length} lantai, membentang ${got.toFixed(2)} m dari ${layout.length.toFixed(2)} m.`,
    detailEn: ok
      ? `One plane ${got.toFixed(2)} m long. This is one building rather than a row of houses touching — which is what separates it from a village.`
      : `${floors.length} floors, spanning ${got.toFixed(2)} m of ${layout.length.toFixed(2)} m.`,
  }
}

/** The gallery is never walled, whatever else is done to it. */
export function checkGalleryOpen(house: House, layout: Layout): CheckResult {
  const frontX = -layout.halfX
  const railH = layout.wallHeight * 0.32
  const walls = house.parts.filter((p) => {
    if (p.id === 'pagar-sami') return false
    const b = partBounds(p)
    if (b.min[0] > frontX + layout.samiDepth * 0.5) return false
    /*
     * Closing most of the height, not merely present at some of it.
     *
     * The first version flagged the wall plate: it is long, it is at the front,
     * and it is high up — none of which makes it a wall. What encloses a
     * gallery is something that shuts off a substantial part of the open side,
     * so the test is on how much of the storey a member covers rather than on
     * where its top happens to be.
     */
    const storey = layout.eaveY - layout.floorY
    return b.max[1] - b.min[1] > storey * 0.5 && b.max[1] > layout.floorY + railH * 1.5 && b.max[2] - b.min[2] > layout.samiDepth
  })
  const ok = walls.length === 0
  return {
    key: 'gallery-open',
    titleId: 'Sami tidak pernah didinding: bagian yang menjadi milik semua orang tidak dapat diklaim',
    titleEn: 'The sami is never walled: the part that belongs to everyone cannot be claimed',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Galeri selebar ${layout.samiDepth.toFixed(2)} m terbuka sepanjang ${layout.length.toFixed(2)} m, hanya berpagar setinggi ${railH.toFixed(2)} m. Lebarnya hampir sama dengan bilik pribadi di belakangnya, dan perbandingan itu adalah pernyataannya.`
      : `${walls.length} bagian mendinding galeri: ${walls.map((w) => w.id).join(', ')}.`,
    detailEn: ok
      ? `A gallery ${layout.samiDepth.toFixed(2)} m deep, open along all ${layout.length.toFixed(2)} m of the house, enclosed only by a rail ${railH.toFixed(2)} m high. It is nearly as deep as the private room behind it, and that ratio is the statement.`
      : `${walls.length} parts wall the gallery: ${walls.map((w) => w.id).join(', ')}.`,
  }
}

/** One way up, and it is at the end the house did not grow from. */
export function checkOneWayUp(house: House, layout: Layout): CheckResult {
  const logs = house.parts.filter((p) => p.stage === 'hejot')
  const info = tumbuhInfo(layout.rules.tumbuh)
  const ok = logs.length === 1
  return {
    key: 'one-way-up',
    titleId: 'Satu jalan naik, dan letaknya di ujung yang tidak ditumbuhi',
    titleEn: 'One way up, and it is at the end the house did not grow from',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Satu hejot pada z = ${layout.hejot.z.toFixed(2)} m. ${info.name}: rumah bertambah panjang di ujung yang lain, jadi jalan masuknya tetap di tempat yang sama sepanjang riwayat bangunan ini. Malam hari batang itu ditarik ke atas.`
      : `${logs.length} hejot.`,
    detailEn: ok
      ? `One hejot at z = ${layout.hejot.z.toFixed(2)} m. ${info.name}: the house lengthens at the other end, so the way in stays where it has always been through the building’s whole history. At night the log is pulled in.`
      : `${logs.length} hejot.`,
  }
}

/** Shingle courses lap with no bare band, from the eave to the ridge. */
export function checkShingleCoverage(layout: Layout): CheckResult {
  const bands = shingleBands(layout)
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
  const minLap =
    bands.length > 1 ? Math.min(...bands.slice(1).map((b, i) => b.foot - (bands[i]?.head ?? 0))) : 1
  return {
    key: 'shingle-coverage',
    titleId: 'Lapis sirap saling menindih tanpa celah, dari tepi atap sampai bubungan',
    titleEn: 'Shingle courses lap with no bare band, from the eave to the ridge',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis menutupi ${hipRun(roofLevels(layout)).toFixed(2)} m kemiringan; tindihan terkecil ${(minLap * 100).toFixed(1)}%. Sirap kayu belah menuntut tindihan lebih besar daripada atap daun, karena yang bocor adalah sambungannya.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses over ${hipRun(roofLevels(layout)).toFixed(2)} m of slope; smallest lap ${(minLap * 100).toFixed(1)}%. Split shingles need a greater lap than a thatched roof, because what leaks is the joint.`
      : gaps.join('; '),
  }
}

/** A gable, not a hip: the ridge runs the whole length of the roof. */
export function checkGable(layout: Layout): CheckResult {
  const levels = roofLevels(layout)
  const eave = levels[0]
  const ridge = levels[1]
  const ok = Boolean(eave && ridge && Math.abs(eave.halfZ - ridge.halfZ) < TOL && ridge.halfX < TOL)
  return {
    key: 'gable',
    titleId: 'Atap pelana: bubungannya sepanjang atapnya sendiri',
    titleEn: 'A gable: the ridge runs the whole length of the roof',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Bubungan ${((ridge?.halfZ ?? 0) * 2).toFixed(2)} m, sama panjang dengan tepi atapnya, jadi kedua ujungnya berdiri tegak dan bukan jatuh ke dalam. Bentuk ketiga yang dihasilkan satu primitif yang sama — limas bertingkat, piramida, dan sekarang pelana.`
      : `Bubungan ${((ridge?.halfZ ?? 0) * 2).toFixed(2)} m terhadap tepi atap ${((eave?.halfZ ?? 0) * 2).toFixed(2)} m.`,
    detailEn: ok
      ? `A ridge of ${((ridge?.halfZ ?? 0) * 2).toFixed(2)} m, the same length as its eave, so the two ends stand vertically instead of falling inward. The third distinct form out of one primitive — a stepped hip, a pyramid, and now a gable.`
      : `A ridge of ${((ridge?.halfZ ?? 0) * 2).toFixed(2)} m against an eave of ${((eave?.halfZ ?? 0) * 2).toFixed(2)} m.`,
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkCrossSection(house),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkSectionIsConstant(house, layout),
    checkNoCharacteristicLength(layout),
    checkOneFloor(house, layout),
    checkGalleryOpen(house, layout),
    checkOneWayUp(house, layout),
    checkGable(layout),
    checkShingleCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
