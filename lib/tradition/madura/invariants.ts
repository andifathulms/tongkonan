/**
 * The checks that are claims about the tanean lanjang.
 *
 * The generic half comes from the core unchanged for the twenty-fifth time,
 * which is the more surprising result: nothing in the core's build order,
 * joints, meshes or provenance noticed that it was being handed nine buildings
 * instead of one.
 *
 * `checkSymmetry` is not run, for the second time in this project. A row grown
 * from one end is not symmetric, and the two sides of the yard are a row of
 * houses and a row of kitchens, which are not alike either. The betang made
 * the same call and replaced the claim with the regularity it actually has;
 * `checkRowIsRegular` is this pack's version of that.
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
 * The yard is empty, and it is the room.
 *
 * Everything a household does that is not sleeping happens on this ground, so
 * a tanean with anything standing in it is not a tanean. It is the plan
 * equivalent of the Korowai check about the air under the floor: one void that
 * is the point of the arrangement rather than what is left over from it.
 */
export function checkYardIsClear(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  for (const part of house.parts) {
    if (part.stage === 'tanean') continue
    const b = partBounds(part)
    const insideX = b.min[0] < layout.yard.halfX - TOL && b.max[0] > -layout.yard.halfX + TOL
    const insideZ = b.min[2] < layout.yard.halfZ - TOL && b.max[2] > -layout.yard.halfZ + TOL
    /*
     * Standing in it, not reaching over it. The eaves oversail the edge of the
     * tanean on purpose — that strip of shade is where people sit — so what
     * the check refuses is anything occupying the room, which is everything
     * whose lowest point is below the eaves.
     */
    if (insideX && insideZ && b.min[1] < layout.wallTop - TOL && b.max[1] > DIMS.yardThickness.value + TOL) {
      faults.push(`${part.id} stands in the yard`)
    }
  }
  const ok = faults.length === 0
  const area = layout.yard.halfX * 2 * layout.yard.halfZ * 2
  return {
    key: 'yard-is-clear',
    titleId: 'Taneannya kosong, dan tanean itulah ruangnya',
    titleEn: 'The yard is empty, and the yard is the room',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${area.toFixed(0)} m² tanah padat yang tidak ditempati apa pun. Ia bukan sisa ruang di antara bangunan: bangunan-bangunannya disusun mengelilinginya, dan hampir semua yang dikerjakan sebuah keluarga dikerjakan di atasnya.`
      : faults.join('; '),
    detailEn: ok
      ? `${area.toFixed(0)} m² of beaten earth with nothing on it. It is not space left between buildings: the buildings are arranged around it, and nearly everything a household does is done on it.`
      : faults.join('; '),
  }
}

/**
 * Seniority runs from the west, and no daughter's house outgrows the tonghuh.
 *
 * Standing is stated twice here — in position and in size — and the check
 * holds both. The position cannot be wrong by accident; the size can, because
 * the tonghuh's frontage and the daughters' are two independent numbers with
 * nothing but this rule between them.
 */
export function checkSeniorityRunsEast(layout: Layout): CheckResult {
  const faults: string[] = []
  const first = layout.houses[0]
  if (!first) faults.push('there is no house at all')
  if (first && !first.tonghuh) faults.push('the westmost house is not the tonghuh')
  for (let i = 1; i < layout.houses.length; i++) {
    const before = layout.houses[i - 1]
    const here = layout.houses[i]
    if (!before || !here) continue
    if (here.z <= before.z + TOL) faults.push(`house ${i + 1} does not stand east of house ${i}`)
    if (here.tonghuh) faults.push(`house ${i + 1} claims to be the tonghuh`)
    if (first && here.width > first.width + TOL) {
      faults.push(`house ${i + 1} is wider than the tonghuh`)
    }
  }
  const ok = faults.length === 0
  return {
    key: 'seniority-runs-east',
    titleId: 'Kedudukan berjalan dari barat, dan tidak ada rumah anak yang melewati rumah induk',
    titleEn: 'Seniority runs from the west, and no daughter’s house outgrows the tonghuh',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.houses.length} rumah, rumah induk selebar ${(first?.width ?? 0).toFixed(2)} m di ujung barat dan rumah anak selebar ${(layout.houses[1]?.width ?? first?.width ?? 0).toFixed(2)} m menyusul ke timur menurut urutan lahir. Letaknya tidak dapat keliru dengan sendirinya; ukurannya dapat, sebab kedua lebar itu angka yang berdiri sendiri-sendiri.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.houses.length} houses, a ${(first?.width ?? 0).toFixed(2)} m tonghuh at the west end and ${(layout.houses[1]?.width ?? first?.width ?? 0).toFixed(2)} m daughters’ houses following eastward in order of birth. The positions cannot go wrong by themselves; the sizes can, because those two frontages are independent numbers.`
      : faults.join('; '),
  }
}

/**
 * The langgar closes the west end, and nothing is built west of it.
 *
 * The second rule in this project that comes from outside the archipelago —
 * the rumoh Aceh lies east–west for the same reason, and the note calling that
 * one unique is corrected in this pack's rule table.
 */
export function checkLanggarClosesTheWest(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  const langgar = house.parts.filter((p) => p.stage === 'langgar')
  if (langgar.length === 0) faults.push('there is no langgar')
  const west = Math.min(...langgar.map((p) => partBounds(p).min[2]))
  for (const part of house.parts) {
    if (part.stage === 'langgar') continue
    if (partBounds(part).min[2] < west - TOL) faults.push(`${part.id} stands west of the langgar`)
  }
  const east = Math.max(...langgar.map((p) => partBounds(p).max[2]))
  if (east > layout.yard.westZ + TOL) faults.push('the langgar stands in the yard rather than closing it')
  const ok = faults.length === 0
  return {
    key: 'langgar-closes-the-west',
    titleId: 'Langgar menutup ujung barat, dan tidak ada apa pun di sebelah baratnya',
    titleEn: 'The langgar closes the west end, and nothing stands west of it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Langgar berdiri ${DIMS.langgarSetback.value.toFixed(1)} m di barat rumah induk, sebab salat menghadap barat. Ini aturan kedua dalam projek ini yang datang dari luar Nusantara; yang pertama rumoh Aceh, dan di sana yang diputar adalah seluruh denah rumahnya.`
      : faults.join('; '),
    detailEn: ok
      ? `The langgar stands ${DIMS.langgarSetback.value.toFixed(1)} m west of the tonghuh, because prayer is toward the west. It is the second rule in this project to come from outside the archipelago; the first is the rumoh Aceh, and there what is turned is a whole house plan.`
      : faults.join('; '),
  }
}

/**
 * The row is regular, and it lengthens only at the east end.
 *
 * This is the betang's claim in a different shape: what is asserted is not a
 * symmetry but that adding a household changes nothing that is already there.
 * The check is a rebuild — the only way to state it, because the fact is about
 * two versions of the arrangement rather than about one of them.
 */
export function checkRowIsRegular(a: Layout, b: Layout): CheckResult {
  const faults: string[] = []
  const pitch = DIMS.housePitch.value
  // Either order: the claim is that the shorter is a prefix of the longer, and
  // at the top of the range the neighbour to compare against is one fewer.
  const layout = a.houses.length <= b.houses.length ? a : b
  const longer = a.houses.length <= b.houses.length ? b : a
  for (let i = 1; i < layout.houses.length; i++) {
    const before = layout.houses[i - 1]
    const here = layout.houses[i]
    if (!before || !here) continue
    if (Math.abs(here.z - before.z - pitch) > TOL) faults.push(`the gap before house ${i + 1} is not the pitch`)
  }
  /*
   * Measured from the langgar rather than from the origin: the yard is drawn
   * centred, so absolute coordinates move when a household is added even
   * though nothing about the existing houses has changed. What the tradition
   * fixes is the distance from the west end, and that is what is compared.
   */
  const from = (l: Layout, i: number) => (l.houses[i]?.z ?? 0) - l.langgar.z
  for (let i = 0; i < layout.houses.length; i++) {
    if (Math.abs(from(layout, i) - from(longer, i)) > TOL) {
      faults.push(`house ${i + 1} moved when a household was added`)
    }
    const a = layout.houses[i]
    const b = longer.houses[i]
    if (a && b && Math.abs(a.width - b.width) > TOL) faults.push(`house ${i + 1} changed size`)
  }
  if (longer.houses.length !== layout.houses.length + 1) faults.push('the longer arrangement is not one house longer')
  const ok = faults.length === 0
  return {
    key: 'row-is-regular',
    titleId: 'Deretnya teratur, dan ia memanjang hanya di ujung timur',
    titleEn: 'The row is regular, and it lengthens only at the east end',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Jarak antar rumah tetap ${pitch.toFixed(2)} m, dan menambah satu rumah tangga tidak menggeser satu pun rumah yang sudah berdiri: yang bertambah hanya panjang halaman di ujung timur. Tidak ada pernyataan simetri di sepanjang tanean, sebab deret yang tumbuh dari satu ujung memang tidak simetris — ini kedua kalinya dalam projek ini, setelah rumah betang.`
      : faults.join('; '),
    detailEn: ok
      ? `The pitch stays ${pitch.toFixed(2)} m, and adding a household moves none of the houses already standing: what grows is the yard at the east end. No symmetry is claimed along the tanean, because a row grown from one end is not symmetric — the second time in this project, after the betang.`
      : faults.join('; '),
  }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout, longer: Layout): readonly CheckResult[] {
  return [
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkYardIsClear(house, layout),
    checkSeniorityRunsEast(layout),
    checkLanggarClosesTheWest(house, layout),
    checkRowIsRegular(layout, longer),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
