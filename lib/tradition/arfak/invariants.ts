/**
 * The checks that are claims about the rumah kaki seribu.
 *
 * The generic half comes from the core unchanged for the eleventh time.
 *
 * `checkNothingIsBraced` is the exact negation of the Nias omo's
 * `checkBracing`, and the two together are the strongest thing eleven houses
 * have produced. Both buildings answer a moving ground. One triangulates every
 * bay of its substructure because a rectangle racks; the other braces nothing
 * at all, stands on a crowd of small unfixed poles, and lets the whole thing
 * move. Neither is a compromise or a lesser version of the other.
 *
 * What that settles: a rule about the earth constrains a form no more tightly
 * than a rule about people does. The project's premise — that the rules a
 * tradition states about its building become its dimensions — survives, and
 * the reason it survives is that the *rule* here is "let it move", not "be
 * stiff". The Nias pack's note says the premise had to be narrowed to admit
 * rules of the second kind; this pack says the narrowing was enough.
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
  partPoints,
} from '@/lib/core/invariants'
import type { CheckResult } from '@/lib/core/invariants'
import { hipRun } from '@/lib/core/hip'
import { DIMS, PACK, huniInfo } from './rules'
import { roofLevels, thatchBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * Symmetric about the ridge plane — and the legs are not counted.
 *
 * Each leg leans its own way, so the crowd of them is deliberately not a
 * mirror of itself. Scoped for the same reason the rumah gadang's bilik and
 * the omo's behu are: a claim narrowed and stated truly beats a claim widened
 * and softened, and the verdict prints how many parts were left out.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    /*
     * About x = 0, not z = 0.
     *
     * The ridge runs along Z, so the plane this house mirrors about is the one
     * the ridge lies in — and mirroring across Z instead would have been a
     * claim about the two ends, which are not alike: the door is at one of
     * them. Written the other way first, where it failed on exactly those
     * three wall boards, which is the check being right about a claim that was
     * wrong.
     */
    axis: 0,
    include: (p) => p.stage !== 'kaki',
    labelId: 'Simetris terhadap bidang bubungan, x = 0; kaki-kakinya tidak dihitung karena tiap batang miring sendiri-sendiri',
    labelEn: 'Symmetric about the ridge plane, x = 0; the legs are not counted, because each pole leans its own way',
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

/* ── Nothing is braced, and that is the point ─────────────────────────── */

/**
 * No diagonal anywhere under the floor, and no leg tied to another.
 *
 * Written as the negation of the omo's central claim. Two tests: no member in
 * the substructure spans between two legs, and no joint connects one leg to
 * another. A house that grew a single brace would still stand up perfectly
 * well and would have stopped being this building.
 */
export function checkNothingIsBraced(house: House, layout: Layout): CheckResult {
  const faults: string[] = []

  // No joint ties one leg to another.
  const legToLeg = house.joints.filter(
    (j) => j.mortise.startsWith('kaki-') && j.tenon.startsWith('kaki-'),
  )
  if (legToLeg.length > 0) faults.push(`${legToLeg.length} joints tie one leg to another`)

  /*
   * And nothing spans between them under the floor.
   *
   * A brace would be a member down in the substructure reaching across more
   * than one leg spacing. The legs themselves are near-vertical, so they are
   * told apart by how far they travel horizontally over their own length.
   */
  const pitch = layout.cols > 1 ? (layout.halfX * 2) / (layout.cols - 1) : layout.halfX
  const spans: string[] = []
  for (const part of house.parts) {
    const b = partBounds(part)
    if (b.max[1] > layout.floorY - DIMS.bearerDepth.value + TOL) continue
    const across = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2])
    const tall = b.max[1] - b.min[1]
    if (across > pitch * 0.75 && across > tall * 0.5) spans.push(part.id)
  }
  if (spans.length > 0) faults.push(`${spans.length} members span between legs: ${spans.slice(0, 4).join(', ')}`)

  const legs = house.parts.filter((p) => p.stage === 'kaki')
  if (legs.length < 20) faults.push(`only ${legs.length} legs`)

  const ok = faults.length === 0
  return {
    key: 'nothing-braced',
    titleId: 'Nol diagonal di seluruh rangka bawah: tidak ada satu kaki pun diikat pada kaki lain',
    titleEn: 'Zero diagonals in the whole substructure: not one leg is tied to another',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${legs.length} kaki, tidak satu pun disilangkan atau diikat pada tetangganya. Ini kebalikan persis dari omo Nias, yang menyegitigakan setiap petak rangka bawahnya karena persegi bergoyang. Dua rumah, satu persoalan — tanah yang bergerak — dan dua jawaban yang berlawanan: yang satu menolak bergoyang, yang lain ikut bergoyang. Keduanya berdiri.`
      : faults.join('; '),
    detailEn: ok
      ? `${legs.length} legs, not one of them crossed or lashed to a neighbour. This is the exact opposite of the Nias omo, which triangulates every bay of its substructure because a rectangle racks. Two houses, one problem — a ground that moves — and two opposite answers: one refuses to sway, the other sways. Both stand.`
      : faults.join('; '),
  }
}

/** The legs stand on the ground and are not set into it. */
export function checkLegsNotBuried(house: House): CheckResult {
  const legs = house.parts.filter((p) => p.stage === 'kaki')
  const buried = legs.filter((p) => {
    let low = Infinity
    for (const [, y] of partPoints(p)) low = Math.min(low, y)
    return low < -TOL
  })
  const ok = legs.length > 0 && buried.length === 0
  return {
    key: 'not-buried',
    titleId: 'Kaki berdiri di atas tanah, tidak ditanam',
    titleEn: 'The legs stand on the ground and are not buried',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${legs.length} kaki, semuanya berdiri di permukaan. Batang yang ditanam harus patah sebelum bergerak; batang yang berdiri saja boleh bergeser lalu kembali — alasan yang sama dengan tidak adanya diagonal, dinyatakan di ujung yang lain.`
      : `${buried.length} kaki masuk ke dalam tanah.`,
    detailEn: ok
      ? `${legs.length} legs, every one standing on the surface. A pole set into the earth has to break before it can move; a pole merely standing may shift and settle back — the same reasoning as the absence of diagonals, stated at the other end.`
      : `${buried.length} legs reach below the ground.`,
  }
}

/** Many legs, and each one small. */
export function checkManySmallLegs(house: House, layout: Layout): CheckResult {
  const legs = house.parts.filter((p) => p.stage === 'kaki')
  const others = house.parts.filter((p) => p.stage !== 'kaki')
  const ok = legs.length > others.length * 0.4 && layout.legSection < 0.15
  return {
    key: 'many-small',
    titleId: 'Kakinya sangat banyak dan sangat kecil',
    titleEn: 'The legs are very many and very small',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${legs.length} kaki bersisi ${(layout.legSection * 1000).toFixed(0)} mm. Tidak ada rumah lain dalam projek ini yang memakai tiang setipis itu — bebannya disebar sampai tiap batang bisa dipikul satu orang, dan rumah ini dinamai dari jumlahnya, bukan dari kekuatannya.`
      : `${legs.length} kaki bersisi ${(layout.legSection * 1000).toFixed(0)} mm.`,
    detailEn: ok
      ? `${legs.length} legs of ${(layout.legSection * 1000).toFixed(0)} mm. No other house in this project uses a post that thin — the load is spread until each pole can be carried by one person, and the house is named for how many there are rather than for how strong they are.`
      : `${legs.length} legs of ${(layout.legSection * 1000).toFixed(0)} mm.`,
  }
}

/** Every leg leans, and no two the same way. */
export function checkLegsLean(layout: Layout): CheckResult {
  const bearings = new Set(
    layout.legs.map((l) => (Math.atan2(l.leanZ, l.leanX) * 180) / Math.PI).map((a) => a.toFixed(1)),
  )
  const straight = layout.legs.filter((l) => Math.hypot(l.leanX, l.leanZ) < 1e-6)
  const ok = straight.length === 0 && bearings.size > layout.legs.length * 0.8
  return {
    key: 'lean',
    titleId: 'Tiap kaki miring, dan hampir tidak ada dua yang searah',
    titleEn: 'Every leg leans, and almost no two lean alike',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bearings.size} arah berbeda pada ${layout.legs.length} kaki. Miringnya dihitung dari letak tiap kaki, bukan diacak: lib/ tidak boleh memakai keacakan, dan rumah yang berubah bentuk tiap kali digambar bukan model melainkan layar hemat.`
      : `${straight.length} kaki tegak lurus, ${bearings.size} arah berbeda.`,
    detailEn: ok
      ? `${bearings.size} distinct bearings across ${layout.legs.length} legs. The lean is computed from each leg's own position rather than randomised: lib/ may not use randomness, and a house that came out a different shape every time it was drawn would be a screensaver rather than a model.`
      : `${straight.length} legs stand plumb, and there are ${bearings.size} distinct bearings.`,
  }
}

/** A clan house divides in two; a family house does not. */
export function checkDivision(house: House, layout: Layout): CheckResult {
  const info = huniInfo(layout.rules.huni)
  const walls = house.parts.filter((p) => p.stage === 'sekat')
  const ok = info.divided ? walls.length === 2 : walls.length === 0
  return {
    key: 'division',
    titleId: 'Rumah marga terbagi dua memanjang; rumah keluarga tidak',
    titleEn: 'A clan house divides lengthwise in two; a family house does not',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? info.divided
        ? `Dua sekat dengan lorong selebar ${layout.passageWidth.toFixed(2)} m di antaranya. Dari luar rumah ini sama saja dengan rumah keluarga — yang berubah ada di dalam.`
        : `Tidak ada sekat. Dari luar tidak ada bedanya dengan rumah marga, dan ketiadaan itu yang membedakannya.`
      : `${walls.length} sekat.`,
    detailEn: ok
      ? info.divided
        ? `Two partitions with a ${layout.passageWidth.toFixed(2)} m passage between them. From outside this house is identical to a family house — what changes is inside.`
        : `No partition. From outside there is nothing to tell it from a clan house, and that absence is the difference.`
      : `${walls.length} partitions.`,
  }
}

/** Everything is lashed; nothing is pegged or notched. */
export function checkEverythingIsTied(house: House): CheckResult {
  const wrong = house.joints.filter((j) => j.kind !== 'ikat')
  const ok = house.joints.length > 0 && wrong.length === 0
  return {
    key: 'tied',
    titleId: 'Semua sambungannya ikat: tidak ada pasak dan tidak ada takik',
    titleEn: 'Every joint is a lashing: no pegs and no notches',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${house.joints.length} ikatan, dan hanya itu jenisnya. Ikatan boleh bekerja sedikit tanpa patah — seluruh gagasan bangunan ini, dinyatakan pada satu sambungan. Ini satu-satunya rumah dalam projek ini yang cuma punya satu jenis sambungan.`
      : `${wrong.length} sambungan bukan ikat.`,
    detailEn: ok
      ? `${house.joints.length} lashings, and no other kind. A lashing can work a little without breaking — the whole idea of this building, stated at one connection. It is the only house in this project with a single joint kind.`
      : `${wrong.length} joints are not lashings.`,
  }
}

/** Thatch courses lap with no bare band. */
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
  if (!top || top.head > TOL) gaps.push('the top course does not reach the ridge')
  const ok = gaps.length === 0
  return {
    key: 'thatch-coverage',
    titleId: 'Lapis alang-alang saling menindih tanpa celah',
    titleEn: 'Thatch courses lap with no bare band',
    status: ok ? 'pass' : 'fail',
    detail: ok ? `${bands.length} lapis menutupi ${hipRun(roofLevels(layout)).toFixed(2)} m kemiringan.` : gaps.join('; '),
    detailEn: ok ? `${bands.length} courses over ${hipRun(roofLevels(layout)).toFixed(2)} m of slope.` : gaps.join('; '),
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
    checkNothingIsBraced(house, layout),
    checkLegsNotBuried(house),
    checkManySmallLegs(house, layout),
    checkLegsLean(layout),
    checkDivision(house, layout),
    checkEverythingIsTied(house),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
