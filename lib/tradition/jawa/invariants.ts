/**
 * The checks that are claims about the joglo.
 *
 * The generic half comes from the core unchanged, for the third time, which is
 * now reasonable evidence that it is generic.
 *
 * What is here is what this building says and the other two do not. That it is
 * not raised — a negative claim, and the hardest kind to check, because the
 * evidence is an absence. That its roof is a hip, so the ridge is shorter than
 * the house and the ends fall away. That the roof rests on the rings of
 * pillars rather than being drawn near them. That the tumpang sari closes
 * inward and upward, tier by tier, an odd number of times. And that the middle
 * chamber is empty, which is the only check in this project that passes by
 * finding nothing.
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
import type { House, Layout } from './types'
import { hipRun } from './hip'
import { tileBands } from './roof'
import { wallRing } from './frame'
import { DIMS, PACK, SENTHONG_NAMES, wujudInfo, roofTiers } from './rules'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/* ── Bound to the Javanese pack ───────────────────────────────────────── */

export function checkBuildOrder(house: House): CheckResult {
  return coreCheckBuildOrder(PACK, house)
}

export function checkJointStages(house: House): CheckResult {
  return coreCheckJointStages(PACK, house)
}

export function checkPartProvenance(house: House): CheckResult {
  return coreCheckPartProvenance(PACK, house)
}

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    labelId: 'bidang tengah, sejajar molo',
    labelEn: 'the centre plane, along the molo',
  })
}

/* ── The Javanese checks ──────────────────────────────────────────────── */

/**
 * The house is not raised, and that is a claim rather than an omission.
 *
 * Both other houses stand on posts with a room underneath — livestock and
 * firewood under a tongkonan, the kolong of a rumah gadang — and both give it
 * a name and a camera. This one has a plinth. Nobody can get under it, and the
 * check is that nobody can: the clearance has to be too small to stand in, or
 * this is a different building from the one the sources describe.
 */
export function checkNotRaised(layout: Layout): CheckResult {
  const clearance = layout.floorY
  // A third of a person. Anything approaching a metre would be a kolong.
  const ok = clearance > TOL && clearance < 1
  return {
    key: 'not-raised',
    titleId: 'Lantai adalah lantai yang ditinggikan, bukan rumah panggung',
    titleEn: 'The floor is a plinth, not a storey on stilts',
    status: ok ? 'pass' : 'fail',
    detail: `Ruang bebas di bawah lantai ${clearance.toFixed(2)} m — cukup untuk mengangkat lantai dari tanah, tidak cukup untuk apa pun berada di bawahnya.`,
    detailEn: `Clearance under the floor ${clearance.toFixed(2)} m — enough to lift the floor off the ground, not enough for anything to be under it.`,
  }
}

/**
 * The roof is a hip: the ridge is shorter than the house, and the ends fall
 * away as planes.
 *
 * Both other houses run a ridge the whole length of the building and finish it
 * with something — a prow, a gonjong. This roof does not reach the ends at
 * all, and that is the geometric fact the third house was built to test.
 */
export function checkHipped(layout: Layout): CheckResult {
  const molo = layout.roof[layout.roof.length - 1]
  const eave = layout.roof[0]
  if (!molo || !eave) {
    return fail('hipped', 'Atap tanpa tepi atau tanpa molo.', 'A roof with no eave or no ridge.')
  }
  const shortening = 1 - (molo.halfZ * 2) / layout.bodyLength
  const ok = molo.halfX < TOL && molo.halfZ > TOL && molo.halfZ * 2 < layout.bodyLength * 0.6
  return {
    key: 'hipped',
    titleId: 'Molo lebih pendek daripada rumahnya, dan keempat bidang atap turun ke tepi',
    titleEn: 'The molo is shorter than its house, and four planes fall away to the eave',
    status: ok ? 'pass' : 'fail',
    detail: `Molo ${(molo.halfZ * 2).toFixed(2)} m di atas rumah ${layout.bodyLength.toFixed(2)} m — ${(shortening * 100).toFixed(0)}% lebih pendek; lebarnya nol, sehingga kedua ujung menjadi bidang, bukan gable.`,
    detailEn: `A molo of ${(molo.halfZ * 2).toFixed(2)} m over a house of ${layout.bodyLength.toFixed(2)} m — ${(shortening * 100).toFixed(0)}% shorter; its width is zero, so both ends are planes rather than gables.`,
  }
}

/**
 * The roof rests on the rings of pillars.
 *
 * The lesson the rumah gadang taught four times over, stated once here before
 * it can happen again: the roof's levels are not near the pillar rings, they
 * are the pillar rings, at the top of the beam that ties each ring's heads. An
 * earlier version of this file interpolated them instead, and the eave plate
 * ended up floating in mid-air with nothing under it.
 */
export function checkRoofRestsOnRings(layout: Layout): CheckResult {
  const orphans: string[] = []
  let worst = 0
  const umpakTop = DIMS.umpakHeight.value
  for (const [i, ring] of layout.sokoRings.entries()) {
    const want = umpakTop + ring.height + DIMS.sundukDepth.value
    const level = layout.roof.find((l) => Math.abs(l.halfX - ring.halfX) < 1e-6)
    if (!level) {
      orphans.push(`ring ${i + 1}: no roof level`)
      continue
    }
    const off = Math.abs(level.y - want)
    if (off > worst) worst = off
    if (off > 1e-6) orphans.push(`ring ${i + 1}: roof ${off.toFixed(3)} m off the beam`)
  }
  const expected = roofTiers(wujudInfo(layout.rules.wujud))
  const bands = layout.roof.length - 1
  if (bands !== expected) orphans.push(`${bands} tiers of roof, expected ${expected}`)

  return {
    key: 'roof-on-rings',
    titleId: 'Atap bertumpu pada cincin tiang, bukan sekadar berada di dekatnya',
    titleEn: 'The roof rests on the rings of pillars rather than merely near them',
    status: orphans.length === 0 ? 'pass' : 'fail',
    detail:
      orphans.length === 0
        ? `${layout.sokoRings.length} cincin tiang → ${bands} jenjang atap; tiap jenjang duduk pada sunduknya dalam ${(worst * 1000).toFixed(0)} mm.`
        : orphans.join('; '),
    detailEn:
      orphans.length === 0
        ? `${layout.sokoRings.length} rings of pillars → ${bands} tiers of roof; each sits on its beam within ${(worst * 1000).toFixed(0)} mm.`
        : orphans.join('; '),
  }
}

/** The stack closes inward and upward, an odd number of times. */
export function checkTumpangSari(house: House, layout: Layout): CheckResult {
  /*
   * Measured at the opening, not at the extent.
   *
   * Each tier's beams run outward to land on the tier below, so the outermost
   * timber does not move inward as the stack rises — the *hole in the middle*
   * does, and that is the thing a person standing under it watches close. The
   * first version of this check measured the outer edge and failed a stack
   * that was closing perfectly well.
   */
  const stack: { half: number; y: number }[] = []
  for (let t = 0; t < layout.tumpangCount; t++) {
    const beam = house.parts.find((p) => p.id === `tumpang-${t}-0`)
    if (!beam || beam.kind !== 'box') break
    stack.push({ half: Math.abs(beam.center[2]), y: beam.center[1] })
  }

  const problems: string[] = []
  if (layout.tumpangCount % 2 === 0) problems.push('the tier count is even')
  if (stack.length !== layout.tumpangCount) {
    problems.push(`${stack.length} tiers built, ${layout.tumpangCount} declared`)
  }
  for (let i = 1; i < stack.length; i++) {
    const below = stack[i - 1]
    const cur = stack[i]
    if (!below || !cur) continue
    if (cur.half >= below.half - TOL) problems.push(`tier ${i + 1} does not step inward`)
    if (cur.y <= below.y + TOL) problems.push(`tier ${i + 1} does not rise`)
  }
  const top = stack[stack.length - 1]
  const foot = stack[0]
  const closed = top && foot ? foot.half - top.half : 0

  return {
    key: 'tumpang-sari',
    titleId: 'Tumpang sari menutup ke dalam dan ke atas, dengan jumlah tingkat ganjil',
    titleEn: 'The tumpang sari closes inward and upward, an odd number of times',
    status: problems.length === 0 ? 'pass' : 'fail',
    detail:
      problems.length === 0
        ? `${stack.length} tingkat, ganjil; bukaan menyempit ${closed.toFixed(2)} m dari kaki ke puncak, dan naik ${(layout.tumpangTopY - layout.tumpangFootY).toFixed(2)} m.`
        : problems.join('; '),
    detailEn:
      problems.length === 0
        ? `${stack.length} tiers, odd; the opening closes ${closed.toFixed(2)} m from foot to top, and rises ${(layout.tumpangTopY - layout.tumpangFootY).toFixed(2)} m.`
        : problems.join('; '),
  }
}

/**
 * The senthong tengah is empty.
 *
 * The only check in this project that passes by finding nothing. Three
 * chambers stand at the back of the dalem and the middle one holds no bed, no
 * store and nobody; a generator that furnished it would be describing a
 * different house. So the check looks inside it and requires that there be
 * nothing there.
 */
export function checkSenthongTengahEmpty(house: House, layout: Layout): CheckResult {
  const wall = wallRing(layout)
  const middleZ = layout.senthongZ[Math.floor(SENTHONG_NAMES.length / 2)] ?? 0
  const span =
    layout.senthongZ.length > 1
      ? Math.abs((layout.senthongZ[1] ?? 0) - (layout.senthongZ[0] ?? 0))
      : wall.halfZ * 2
  // Inset past the chamber's own walls: what is being checked is the room, not
  // the boards that make it.
  const inset = DIMS.wallThickness.value * 2
  const inside = (x: number, y: number, z: number) =>
    x > wall.halfX - layout.senthongDepth + inset &&
    x < wall.halfX - inset &&
    z > middleZ - span / 2 + inset &&
    z < middleZ + span / 2 - inset &&
    y > layout.floorY + inset &&
    y < layout.floorY + layout.wallHeight - inset

  const intruders = house.parts.filter((p) => {
    if (p.kind !== 'box') return false
    return inside(p.center[0], p.center[1], p.center[2])
  })

  return {
    key: 'senthong-empty',
    titleId: 'Senthong tengah dibiarkan kosong',
    titleEn: 'The senthong tengah is left empty',
    status: intruders.length === 0 ? 'pass' : 'fail',
    detail:
      intruders.length === 0
        ? `Tidak ada apa pun di dalamnya. Ruang paling bermakna di rumah ini adalah ruang yang tidak ditempati, dan pemeriksaan ini lulus justru karena tidak menemukan apa-apa.`
        : `${intruders.length} bagian berada di dalam senthong tengah: ${intruders.slice(0, 4).map((p) => p.id).join(', ')}.`,
    detailEn:
      intruders.length === 0
        ? `Nothing is inside it. The most meaningful room in this house is the one nobody occupies, and this check passes precisely by finding nothing.`
        : `${intruders.length} parts stand inside the senthong tengah: ${intruders.slice(0, 4).map((p) => p.id).join(', ')}.`,
  }
}

/** Pillar count follows the grade, and each ring outward is shorter. */
export function checkPillarRings(house: House, layout: Layout): CheckResult {
  const w = wujudInfo(layout.rules.wujud)
  const guru = house.parts.filter((p) => p.id.startsWith('soko-0-')).length
  const rings = layout.sokoRings.length
  const problems: string[] = []
  if (rings !== w.rings) problems.push(`${rings} rings, expected ${w.rings}`)
  if (guru !== DIMS.sokoGuruFour.value) problems.push(`${guru} soko guru, expected four`)
  for (let i = 1; i < layout.sokoRings.length; i++) {
    const inner = layout.sokoRings[i - 1]
    const outerRing = layout.sokoRings[i]
    if (!inner || !outerRing) continue
    if (outerRing.height >= inner.height - TOL) problems.push(`ring ${i + 1} is not shorter than ring ${i}`)
    if (outerRing.halfX <= inner.halfX + TOL) problems.push(`ring ${i + 1} is not outside ring ${i}`)
  }
  return {
    key: 'pillar-rings',
    titleId: 'Empat soko guru di pusat, dan tiap cincin di luarnya lebih pendek',
    titleEn: 'Four soko guru at the centre, and each ring outside them is shorter',
    status: problems.length === 0 ? 'pass' : 'fail',
    detail:
      problems.length === 0
        ? `${w.name}: ${rings} cincin, ${guru} soko guru; tinggi turun dari ${layout.sokoRings[0]?.height.toFixed(2)} m ke ${layout.sokoRings[rings - 1]?.height.toFixed(2)} m ke arah luar.`
        : problems.join('; '),
    detailEn:
      problems.length === 0
        ? `${w.name}: ${rings} rings, ${guru} soko guru; height falls from ${layout.sokoRings[0]?.height.toFixed(2)} m to ${layout.sokoRings[rings - 1]?.height.toFixed(2)} m going outward.`
        : problems.join('; '),
  }
}

/** The pendhapa stands where the rule says, and stands clear of the dalem. */
export function checkPendhapa(house: House, layout: Layout): CheckResult {
  const parts = house.parts.filter((p) => p.id.startsWith('pendhapa-'))
  const p = layout.pendhapa
  if (!p.present) {
    const ok = parts.length === 0
    return {
      key: 'pendhapa',
      titleId: 'Tanpa pendhapa: rumah yang tidak menerima tamu tidak membangunnya',
      titleEn: 'No pendhapa: a household that does not receive publicly does not build one',
      status: ok ? 'pass' : 'fail',
      detail: ok
        ? 'Tidak ada bagian pendhapa, dan ketiadaannya itulah pernyataannya.'
        : `${parts.length} bagian pendhapa terbangun pada rumah yang tidak memilikinya.`,
      detailEn: ok
        ? 'No pendhapa parts, and their absence is the statement.'
        : `${parts.length} pendhapa parts built on a house that has none.`,
    }
  }
  const gap = -p.centreX - p.halfX - layout.bodyDepth / 2
  const ok = parts.length > 0 && gap > TOL
  return {
    key: 'pendhapa',
    titleId: 'Pendhapa berdiri di muka, terpisah oleh pringgitan',
    titleEn: 'The pendhapa stands in front, separated by the pringgitan',
    status: ok ? 'pass' : 'fail',
    detail: `${parts.length} bagian; jarak ke dalem ${gap.toFixed(2)} m — ruang di antaranya adalah pringgitan, ruang yang dibentuk oleh jarak, bukan oleh dinding.`,
    detailEn: `${parts.length} parts; ${gap.toFixed(2)} m clear of the dalem — the space between them is the pringgitan, a room made of a gap rather than of walls.`,
  }
}

/** The eave oversails the outer pillar line. */
export function checkEaveOversail(layout: Layout): CheckResult {
  const outer = layout.sokoRings[layout.sokoRings.length - 1]
  const eave = layout.roof[0]
  if (!outer || !eave) return fail('eave-oversail', 'Tidak ada tepi atap.', 'No eave.')
  const face = outer.halfX + layout.sokoSection / 2
  const clear = eave.halfX - face
  return {
    key: 'eave-oversail',
    titleId: 'Tepi atap melewati garis tiang terluar',
    titleEn: 'The eave oversails the outer pillar line',
    status: clear > TOL ? 'pass' : 'fail',
    detail: `tepi atap ${eave.halfX.toFixed(2)} m dari sumbu; muka tiang terluar ${face.toFixed(2)} m; julur ${clear.toFixed(2)} m.`,
    detailEn: `eave ${eave.halfX.toFixed(2)} m from the axis; outer pillar face ${face.toFixed(2)} m; oversail ${clear.toFixed(2)} m.`,
  }
}

/** Tile courses lap with no bare strip, and the ridge is covered. */
export function checkTileCoverage(house: House, layout: Layout): CheckResult {
  const bands = tileBands(layout)
  const gaps: string[] = []
  const first = bands[0]
  if (!first || first.foot < 1 - TOL) gaps.push('the eave course does not reach the eave')
  for (let k = 1; k < bands.length; k++) {
    const below = bands[k - 1]
    const cur = bands[k]
    if (!below || !cur) continue
    if (cur.foot - below.head <= TOL) gaps.push(`course ${k + 1} does not lap course ${k}`)
  }
  const top = bands[bands.length - 1]
  if (!top || top.head > TOL) gaps.push('the top course does not reach the molo')
  if (!house.parts.some((p) => p.id === `genteng-${bands.length - 1}`)) gaps.push('the ridge course is missing')

  const minLap =
    bands.length > 1 ? Math.min(...bands.slice(1).map((b, i) => b.foot - (bands[i]?.head ?? 0))) : 1
  return {
    key: 'tile-coverage',
    titleId: 'Baris genteng saling menindih tanpa celah; molo tertutup',
    titleEn: 'Tile courses lap with no bare strip; the molo is covered',
    status: gaps.length === 0 ? 'pass' : 'fail',
    detail:
      gaps.length === 0
        ? `${bands.length} baris menutupi bentang lereng ${hipRun(layout.roof).toFixed(2)} m; tindihan terkecil ${(minLap * 100).toFixed(1)}%.`
        : gaps.join('; '),
    detailEn:
      gaps.length === 0
        ? `${bands.length} courses over ${hipRun(layout.roof).toFixed(2)} m of slope; smallest lap ${(minLap * 100).toFixed(1)}%.`
        : gaps.join('; '),
  }
}

function fail(key: string, detail: string, detailEn: string): CheckResult {
  return { key, titleId: key, titleEn: key, status: 'fail', detail, detailEn }
}

/* ── The suite ────────────────────────────────────────────────────────── */

export function runInvariants(house: House, layout: Layout): readonly CheckResult[] {
  return [
    checkFrameSymmetry(house),
    checkJoints(house),
    checkJointStages(house),
    checkBuildOrder(house),
    checkMeshes(house),
    checkNotRaised(layout),
    checkHipped(layout),
    checkRoofRestsOnRings(layout),
    checkTumpangSari(house, layout),
    checkSenthongTengahEmpty(house, layout),
    checkPillarRings(house, layout),
    checkPendhapa(house, layout),
    checkEaveOversail(layout),
    checkTileCoverage(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
