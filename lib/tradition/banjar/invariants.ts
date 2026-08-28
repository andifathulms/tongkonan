/**
 * The checks that are claims about the Banjar house.
 *
 * The generic half comes from the core unchanged for the fourteenth time.
 *
 * `checkRoofChain` and `checkCoreIsTallest` are the pair this building exists
 * for. Thirteen buildings here have one roof; this has four in a row along one
 * ridge, and what makes that a sequence rather than a heap is that they meet
 * end to end with no gap and that the middle one rises above its neighbours.
 * If it did not, the house would not be the type its own name states — so the
 * second check is not about structure at all. It is about whether the name is
 * true.
 *
 * What this pack cannot claim: the front and back segments are modelled as very
 * low gables rather than true single-slope sheds, because `steppedHip` is
 * symmetric about its ridge and a shed is not. That is a real simplification
 * and it is stated here and in the caution rather than hidden — the sequence of
 * *heights* is right and one of the four forms is approximate.
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
import { DIMS, PACK, jenisInfo } from './rules'
import { segmentLevels, shingleBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * Symmetric across the entry axis, and deliberately not along it.
 *
 * The whole building is a sequence front to back, so a mirror in X would be a
 * claim that the platform and the kitchen are alike. They are not, and the axis
 * this checks is the one that carries nothing.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris melintang sumbu masuk — sumbu yang tidak membawa urutannya',
    labelEn: 'Symmetric across the entry axis — the one that does not carry the sequence',
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

/* ── A chain of roofs ─────────────────────────────────────────────────── */

/** Four segments, in order, meeting end to end with no gap and no overlap. */
export function checkRoofChain(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const order = ['pelatar', 'surambi', 'palidangan', 'padu']
  if (layout.segments.map((s) => s.key).join(',') !== order.join(',')) {
    faults.push(`the segments run ${layout.segments.map((s) => s.key).join(' → ')}`)
  }
  for (let i = 1; i < layout.segments.length; i++) {
    const a = layout.segments[i - 1]
    const b = layout.segments[i]
    if (!a || !b) continue
    const gap = b.x - b.halfX - (a.x + a.halfX)
    if (Math.abs(gap) > 1e-6) faults.push(`${a.nameEn} and ${b.nameEn} do not meet`)
  }
  // Every segment has a ridge of its own, and they are not all the same height.
  const ridges = house.parts.filter(
    (p) => p.id.startsWith('bubungan-') && !p.id.startsWith('bubungan-anjung'),
  )
  if (ridges.length !== layout.segments.length) {
    faults.push(`${ridges.length} ridges for ${layout.segments.length} segments`)
  }
  const heights = new Set(layout.segments.map((s) => s.ridgeY.toFixed(3)))
  if (heights.size < 2) faults.push('every segment is the same height, so there is no sequence')

  const ok = faults.length === 0
  return {
    key: 'roof-chain',
    titleId: 'Empat ruas beratap, berurutan, bertemu ujung ke ujung sepanjang satu bubungan',
    titleEn: 'Four roofed segments, in order, meeting end to end along one ridge',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.segments.map((s) => `${s.nameId} (${s.bentuk})`).join(' → ')}, dengan ${heights.size} ketinggian bubungan yang berbeda. Tiga belas bangunan lain dalam projek ini punya satu atap yang menutupi seluruh denahnya; yang ini dibaca dengan menyusuri bubungannya dan menyebut apa yang berganti di atas kepala.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.segments.map((s) => `${s.nameEn} (${s.bentuk})`).join(' → ')}, at ${heights.size} distinct ridge heights. The other thirteen buildings in this project have one roof over the whole plan; this one is read by walking the ridge and naming what changes overhead.`
      : faults.join('; '),
  }
}

/**
 * The core is the tallest, and its form is the house's name.
 *
 * Not a structural claim. If the middle segment did not rise above the others
 * the sequence would not read, and a house called bubungan tinggi would have no
 * high ridge — so what this check tests is whether the building's own name is
 * true of it.
 */
export function checkCoreIsTallest(layout: Layout): CheckResult {
  const info = jenisInfo(layout.rules.jenis)
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const others = layout.segments.filter((s) => s.key !== 'palidangan')
  const faults: string[] = []
  if (!core) faults.push('there is no core')
  if (core && core.bentuk !== info.core) faults.push(`the core is a ${core.bentuk} on a ${info.name}`)
  if (core) {
    for (const s of others) {
      if (s.ridgeY >= core.ridgeY - TOL) faults.push(`${s.nameEn} stands as high as the core`)
    }
  }
  const ok = faults.length === 0
  const margin = core ? core.ridgeY - Math.max(...others.map((s) => s.ridgeY)) : 0
  return {
    key: 'core-tallest',
    titleId: 'Ruas tengah menjulang di atas keduanya, dan bentuknya adalah nama rumahnya',
    titleEn: 'The middle segment rises above both, and its form is the house’s name',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${info.name}: inti beratap ${core?.bentuk}, ${margin.toFixed(2)} m di atas tetangganya. Ini bukan pernyataan tentang struktur — kalau yang di tengah tidak menjulang, urutannya tidak terbaca dan rumah yang bernama bubungan tinggi tidak punya bubungan yang tinggi. Yang diuji adalah apakah nama bangunan ini benar tentang dirinya.`
      : faults.join('; '),
    detailEn: ok
      ? `${info.name}: a ${core?.bentuk} over the core, ${margin.toFixed(2)} m above its neighbours. This is not a claim about structure — if the middle did not rise, the sequence would not read and a house called bubungan tinggi would have no high ridge. What is tested is whether this building’s name is true of it.`
      : faults.join('; '),
  }
}

/** The type selects a form, and three types give three different cores. */
export function checkTypeSelectsAForm(layout: Layout): CheckResult {
  const info = jenisInfo(layout.rules.jenis)
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const levels = core ? segmentLevels(layout, core) : []
  const ridge = levels[1]
  const eave = levels[0]
  const faults: string[] = []
  if (!core || !ridge || !eave) faults.push('the core has no roof')
  if (core && ridge && eave) {
    if (info.core === 'limasan' && ridge.halfZ >= eave.halfZ - TOL) faults.push('a palimasan has no hip ends')
    if (info.core !== 'limasan' && Math.abs(ridge.halfZ - eave.halfZ) > TOL) faults.push('a gable has hip ends')
  }
  const ok = faults.length === 0
  return {
    key: 'type-form',
    titleId: 'Aturan jenis memilih sebuah bentuk, bukan sebuah angka',
    titleEn: 'The type rule selects a form rather than a number',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${info.name} → ${info.core}. Satu-satunya aturan dalam projek ini yang memilih primitif geometri: di tempat lain sebuah aturan memilih nilai lalu geometri mengikutinya, di sini ia memilih bentuknya langsung — dan rumahnya dinamai menurut pilihan itu.`
      : faults.join('; '),
    detailEn: ok
      ? `${info.name} → ${info.core}. The only rule in this project that selects a geometric primitive: elsewhere a rule picks a value and geometry follows it, here it picks the shape itself — and the house is named for that choice.`
      : faults.join('; '),
  }
}

/**
 * The floors step down toward the front — and it is not the limas's staircase.
 *
 * Stated as a check because the two look identical in a section and mean
 * opposite things. There a guest is seated on a step and the step is their
 * standing; here the steps follow the roofs and the water.
 */
export function checkFloorsStepDown(layout: Layout): CheckResult {
  /*
   * The core is the datum and the floor falls away from it in both directions,
   * furthest at the front. Written this way rather than as one monotonic run
   * front to back, because the padu at the back also sits below the core — the
   * kitchen steps down from the room it serves. A check that demanded a single
   * staircase from the water to the back wall would have been the Palembang
   * claim imported wholesale, which is exactly the reading this check exists to
   * deny.
   */
  const faults: string[] = []
  const first = layout.segments[0]
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const coreAt = layout.segments.findIndex((s) => s.key === 'palidangan')
  for (let i = 0; i < layout.segments.length; i++) {
    const seg = layout.segments[i]
    const inward = layout.segments[i < coreAt ? i + 1 : i - 1]
    if (!seg || !inward || i === coreAt) continue
    if (seg.floorY > inward.floorY + TOL) faults.push(`${seg.nameEn} is above ${inward.nameEn}`)
  }
  if (first && core && first.floorY >= core.floorY - TOL) faults.push('the front is not below the core')
  if (first && layout.segments.some((s) => s.floorY < first.floorY - TOL))
    faults.push('the platform is not the lowest floor')
  const ok = faults.length === 0
  return {
    key: 'floors-step',
    titleId: 'Lantainya turun bertingkat ke arah muka, dan itu bukan tangga kedudukan',
    titleEn: 'The floors step down toward the front, and it is not a staircase of rank',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Dari ${core?.floorY.toFixed(2)} m di inti turun ke ${first?.floorY.toFixed(2)} m di pelataran. Rumah limas Palembang juga bertingkat lantainya dan artinya berlawanan: di sana tempat duduk seorang tamu adalah kedudukannya, di sini tingkat itu mengikuti urutan atapnya dan air yang harus mengalir menjauh dari rumah yang berdiri di atas rawa pasang.`
      : faults.join('; '),
    detailEn: ok
      ? `From ${core?.floorY.toFixed(2)} m at the core down to ${first?.floorY.toFixed(2)} m at the platform. The Palembang rumah limas also steps its floor and means the opposite by it: there where a guest sits is their standing, here the steps follow the sequence of roofs and the water that has to run away from a house standing on a tidal swamp.`
      : faults.join('; '),
  }
}

/** Shingle courses lap with no bare band, on every segment. */
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
  return {
    key: 'shingle-coverage',
    titleId: 'Lapis sirap saling menindih tanpa celah, pada tiap ruas',
    titleEn: 'Shingle courses lap with no bare band, on every segment',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis pada tiap-tiap dari ${layout.segments.length} ruas. Sirap kayu belah menuntut tindihan lebih besar daripada atap daun, karena yang bocor adalah sambungannya.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses on each of ${layout.segments.length} segments. Split shingles need a greater lap than a thatched roof, because what leaks is the joint.`
      : gaps.join('; '),
  }
}

/** The wings stand beside the core, or not at all. */
export function checkAnjung(house: House, layout: Layout): CheckResult {
  const wings = house.parts.filter((p) => p.stage === 'anjung')
  const ok = layout.anjung.present ? wings.length >= 2 : wings.length === 0
  const outside =
    wings.length === 0 ||
    wings.every((p) => Math.abs(partBounds(p).max[2]) > layout.halfZ - TOL || Math.abs(partBounds(p).min[2]) > layout.halfZ - TOL)
  return {
    key: 'anjung',
    titleId: 'Anjung berdiri di kedua sisi inti, atau tidak sama sekali',
    titleEn: 'The anjung stand on either side of the core, or not at all',
    status: ok && outside ? 'pass' : 'fail',
    detail:
      ok && outside
        ? layout.anjung.present
          ? `Dua sayap, masing-masing menjorok ${layout.anjung.reach.toFixed(2)} m dari badan rumah, dengan atapnya sendiri yang lebih rendah daripada inti.`
          : `Tidak ada anjung: badan rumahnya lurus dari muka ke belakang.`
        : `${wings.length} bagian anjung.`,
    detailEn:
      ok && outside
        ? layout.anjung.present
          ? `Two wings, each projecting ${layout.anjung.reach.toFixed(2)} m from the body, with their own roofs lower than the core’s.`
          : `No anjung: the body runs straight from front to back.`
        : `${wings.length} anjung parts.`,
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
    checkRoofChain(house, layout),
    checkCoreIsTallest(layout),
    checkTypeSelectsAForm(layout),
    checkFloorsStepDown(layout),
    checkAnjung(house, layout),
    checkShingleCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
