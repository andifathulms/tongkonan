/**
 * The checks that are claims about the uma.
 *
 * The generic half comes from the core unchanged for the eighth time.
 *
 * Two here are unlike anything earlier. `checkTowerHoldsSomething` asserts
 * that the tower is not empty — that there is a loft inside it, and that the
 * loft is inside it rather than merely near it. That is the whole difference
 * between a roof and a container, and it is the only check in this project
 * that tests a *purpose* rather than a form.
 *
 * `checkLoftBeforeTower` asserts an order rather than a geometry. The loft is
 * why the tower exists, so it is built first and the tower goes round it. Every
 * other house here builds its roof and then finds out what is under it, and a
 * build sequence that got this backwards would still produce an identical
 * model — which is exactly why it needs a check rather than a comment.
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
import { DIMS, KAMBANIRU, PACK, umaInfo } from './rules'
import { roofLevels, thatchBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * The building mirrors about z = 0, and the bangga is scoped out when it is
 * not a full circuit — a house that receives on two sides is deliberately not
 * the same on all four.
 */
export function checkFrameSymmetry(house: House, layout: Layout): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: (p) => (layout.bangga.full ? true : !p.id.startsWith('bangga-')),
    labelId: layout.bangga.full
      ? 'Bangunan simetris terhadap bidang z = 0'
      : 'Bangunan simetris terhadap bidang z = 0; bangga yang tidak melingkar penuh tidak dihitung',
    labelEn: layout.bangga.full
      ? 'The building mirrors about z = 0'
      : 'The building mirrors about z = 0; a bangga that is not a full circuit is not counted',
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

/* ── The tower is a container ─────────────────────────────────────────── */

/**
 * The tower has something in it, and the something is inside it.
 *
 * Two claims and both matter. A tower with no loft would be a tall roof, which
 * is a different building. A loft that sat below the tower's foot, or reached
 * outside its walls, would be a floor the tower happened to stand over rather
 * than a floor the tower was built around.
 */
export function checkTowerHoldsSomething(house: House, layout: Layout): CheckResult {
  const info = umaInfo(layout.rules.uma)
  const loft = house.parts.find((p) => p.id === 'uma-deta')
  const faults: string[] = []

  if (info.tower !== Boolean(loft)) {
    faults.push(info.tower ? 'a towered house with no loft in it' : 'a loft in a house with no tower')
  }
  if (loft) {
    const b = partBounds(loft)
    if (b.min[1] < layout.menara.footY - TOL) faults.push('the loft hangs below the foot of the tower')
    if (b.max[1] > layout.menara.peakY + TOL) faults.push('the loft reaches above the peak')
    // Inside the tower's walls, which narrow as they rise.
    const t = (b.min[1] - layout.menara.footY) / Math.max(1e-9, layout.menara.peakY - layout.menara.footY)
    const allowX = layout.menara.halfX * (1 - t * (1 - DIMS.menaraTaper.value))
    if (Math.max(Math.abs(b.max[0]), Math.abs(b.min[0])) > allowX + TOL) {
      faults.push('the loft reaches outside the tower it is meant to be inside')
    }
  }

  const ok = faults.length === 0
  const height = layout.menara.peakY - layout.menara.footY
  return {
    key: 'tower-holds',
    titleId: 'Menara berisi sesuatu, dan yang diisinya berada di dalamnya',
    titleEn: 'The tower holds something, and what it holds is inside it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? info.tower
        ? `Menara setinggi ${height.toFixed(2)} m dengan uma deta pada ${layout.menara.loftY.toFixed(2)} m di dalamnya. Pada tujuh rumah lain di sini atap menaungi sesuatu; yang ini mewadahi sesuatu — dan itulah satu-satunya pemeriksaan dalam projek ini yang menguji kegunaan, bukan bentuk.`
        : `Tidak ada menara dan tidak ada yang disimpan. Rumah yang tidak menyimpan marapu tidak punya alasan membangun puncak, dan ketiadaan itu bukan versi yang lebih kecil melainkan jenis bangunan yang lain.`
      : faults.join('; '),
    detailEn: ok
      ? info.tower
        ? `A tower ${height.toFixed(2)} m tall with the uma deta at ${layout.menara.loftY.toFixed(2)} m inside it. On the other seven houses here the roof shelters something; this one contains something — and it is the only check in this project that tests a purpose rather than a form.`
        : `No tower and nothing kept. A house that keeps no marapu has no reason to build a peak, and that absence is not a smaller version but a different kind of building.`
      : faults.join('; '),
  }
}

/**
 * The loft is built before the tower that exists for it.
 *
 * An order rather than a geometry, and the only check of its kind here. Build
 * the tower first and the finished model is byte-identical; what changes is
 * what the raising sequence says the building is for.
 */
export function checkLoftBeforeTower(house: House, layout: Layout): CheckResult {
  if (!layout.menara.present) {
    return {
      key: 'loft-first',
      titleId: 'Uma deta dipasang sebelum menara yang mewadahinya',
      titleEn: 'The loft goes in before the tower that exists for it',
      status: 'pass',
      detail: 'Rumah tanpa menara: tidak ada urutan untuk diuji, dan tidak adanya keduanya itu konsisten.',
      detailEn: 'A house with no tower: there is no order to test, and the absence of both is consistent.',
    }
  }
  const loft = house.parts.findIndex((p) => p.id === 'uma-deta')
  const tower = house.parts.findIndex((p) => p.stage === 'menara')
  const ok = loft >= 0 && tower >= 0 && loft < tower
  return {
    key: 'loft-first',
    titleId: 'Uma deta dipasang sebelum menara yang mewadahinya',
    titleEn: 'The loft goes in before the tower that exists for it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? 'Loteng didahulukan, lalu menara dibangun mengelilinginya. Membaliknya akan menghasilkan model yang sama persis — yang berubah hanyalah apa yang dinyatakan urutan pendiriannya tentang kegunaan bangunan ini, dan itulah sebabnya hal ini perlu diperiksa dan bukan sekadar dikomentari.'
      : 'Menara dibangun lebih dahulu, jadi urutannya menyatakan bahwa loteng adalah temuan di dalam atap.',
    detailEn: ok
      ? 'The loft first, and the tower built around it. Reversing them produces a byte-identical model — what changes is what the raising sequence says the building is for, which is why this needs a check rather than a comment.'
      : 'The tower is built first, so the sequence says the loft is something discovered inside a roof.',
  }
}

/** Four posts, each named, each at its own corner. */
export function checkFourNamedPosts(house: House, layout: Layout): CheckResult {
  const built = house.parts.filter((p) => p.stage === 'kambaniru')
  const names = new Set(built.map((p) => p.nameEn))
  const corners = new Set(
    built.map((p) => (p.kind === 'box' ? `${Math.sign(p.center[0])}|${Math.sign(p.center[2])}` : '')),
  )
  const ok = built.length === 4 && names.size === 4 && corners.size === 4 && layout.posts.length === 4
  return {
    key: 'four-posts',
    titleId: 'Empat kambaniru, masing-masing bernama, masing-masing di sudutnya sendiri',
    titleEn: 'Four kambaniru, each named, each at its own corner',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${KAMBANIRU.map((k) => k.name).join(', ')}. Satu-satunya rumah dalam projek ini yang tiangnya perorangan dan bukan anggota barisan — di rumah lain, tiang ke-tujuh sama saja dengan tiang ke-delapan.`
      : `${built.length} tiang, ${names.size} nama, ${corners.size} sudut.`,
    detailEn: ok
      ? `${KAMBANIRU.map((k) => k.name).join(', ')}. The only house in this project whose posts are individuals rather than members of a rank — elsewhere the seventh post is the same thing as the eighth.`
      : `${built.length} posts, ${names.size} names, ${corners.size} corners.`,
  }
}

/**
 * The tower is taller than the house it stands on.
 *
 * A proportion, and it is what the silhouette is. Measured against the whole
 * house below the shoulder rather than against the wall, so scaling the model
 * cannot satisfy it.
 */
export function checkTowerDominates(layout: Layout): CheckResult {
  if (!layout.menara.present) {
    return {
      key: 'tower-dominates',
      titleId: 'Menara lebih tinggi daripada rumah yang menyangganya',
      titleEn: 'The tower stands taller than the house beneath it',
      status: 'pass',
      detail: 'Rumah tanpa menara: tidak ada yang menjulang, dan memang itu maksudnya.',
      detailEn: 'A house without a tower: nothing rises, which is the point.',
    }
  }
  const house = layout.shoulderY
  const tower = layout.menara.peakY - layout.menara.footY
  const ok = tower > house
  return {
    key: 'tower-dominates',
    titleId: 'Menara lebih tinggi daripada rumah yang menyangganya',
    titleEn: 'The tower stands taller than the house beneath it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Rumah ${house.toFixed(2)} m, menara ${tower.toFixed(2)} m — ${(tower / house).toFixed(2)} kali. Perbandingan inilah, bukan ukurannya, yang membuat siluet Sumba langsung dikenali; dan angka yang menetapkannya adalah angka paling lemah dasarnya di seluruh pak ini.`
      : `Rumah ${house.toFixed(2)} m, menara ${tower.toFixed(2)} m.`,
    detailEn: ok
      ? `A house of ${house.toFixed(2)} m under a tower of ${tower.toFixed(2)} m — ${(tower / house).toFixed(2)} times. That proportion, rather than any dimension, is what makes the Sumba silhouette recognisable; and the figure that sets it is the least supported number in this pack.`
      : `A house of ${house.toFixed(2)} m under a tower of ${tower.toFixed(2)} m.`,
  }
}

/** The peak is flat, because the loft has to be somewhere. */
export function checkPeakIsFlat(layout: Layout): CheckResult {
  const levels = roofLevels(layout)
  const top = levels[levels.length - 1]
  const ok = !layout.menara.present || Boolean(top && top.halfX > TOL && top.halfZ > TOL)
  return {
    key: 'peak-flat',
    titleId: 'Puncak menara rata, bukan runcing',
    titleEn: 'The top of the tower is flat rather than pointed',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.menara.present
        ? `Puncak ${((top?.halfX ?? 0) * 2).toFixed(2)} × ${((top?.halfZ ?? 0) * 2).toFixed(2)} m, dan di sanalah tanduk berdiri. Bentuk yang meruncing sempurna akan menghapus tempat loteng itu berada — jadi puncak yang rata adalah akibat dari kegunaannya, bukan pilihan gaya.`
        : `Tidak ada menara, jadi tidak ada puncak untuk dirat kan.`
      : `Puncak menara menyempit menjadi titik.`,
    detailEn: ok
      ? layout.menara.present
        ? `A top of ${((top?.halfX ?? 0) * 2).toFixed(2)} × ${((top?.halfZ ?? 0) * 2).toFixed(2)} m, and that is where the finials stand. A form tapering to a point would remove the place the loft occupies — so the flat peak follows from the purpose rather than from taste.`
        : `No tower, so no peak to flatten.`
      : `The tower narrows to a point.`,
  }
}

/** The veranda goes all the way round, or along the two long sides. */
export function checkBangga(house: House, layout: Layout): CheckResult {
  const boards = house.parts.filter((p) => p.id.startsWith('bangga-'))
  const want = layout.bangga.full ? 4 : 2
  const ok = boards.length === want
  return {
    key: 'bangga',
    titleId: 'Bangga melingkar penuh, atau pada dua sisi panjangnya',
    titleEn: 'The bangga runs all the way round, or along the two long sides',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.bangga.full
        ? `Melingkar penuh: rumah yang menerima dari segala sisi.`
        : `Dua sisi saja: rumah yang menerima dari sisi tempat tetangganya berada — dan model ini tidak punya tetangga, jadi sisi mana yang dipilih adalah penetapan penulis.`
      : `${boards.length} papan bangga, seharusnya ${want}.`,
    detailEn: ok
      ? layout.bangga.full
        ? `A full circuit: a house that receives on every side.`
        : `Two sides only: a house that receives on the sides its neighbours are — and this model has no neighbours, so which two is the author’s choice.`
      : `${boards.length} bangga boards where ${want} were called for.`,
  }
}

/** Thatch courses lap with no bare band, from the eave to the top. */
export function checkThatchCoverage(layout: Layout): CheckResult {
  const bands = thatchBands(layout)
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
  if (!top || top.head > TOL) gaps.push('the top course does not reach the peak')
  const ok = gaps.length === 0
  return {
    key: 'thatch-coverage',
    titleId: 'Lapis alang-alang saling menindih tanpa celah, dari tepi atap sampai puncak',
    titleEn: 'Thatch courses lap with no bare band, from the eave to the peak',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis menutupi ${hipRun(roofLevels(layout)).toFixed(2)} m — melewati bahu, terus ke atas menara, tanpa terputus di tempat bentuknya berubah.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses over ${hipRun(roofLevels(layout)).toFixed(2)} m — past the shoulder and on up the tower, unbroken where the form changes.`
      : gaps.join('; '),
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkFrameSymmetry(house, layout),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkFourNamedPosts(house, layout),
    checkTowerHoldsSomething(house, layout),
    checkLoftBeforeTower(house, layout),
    checkTowerDominates(layout),
    checkPeakIsFlat(layout),
    checkBangga(house, layout),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
