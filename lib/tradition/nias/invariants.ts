/**
 * The checks that are claims about the omo.
 *
 * The generic half comes from the core unchanged for the sixth time.
 *
 * `checkBracing` is the one worth reading. Every other structural invariant in
 * this project asserts that a thing is where a rule says it should be — a
 * ridge sags, a floor steps, five levels fit inside a cone. This one asserts
 * that no rectangle in the substructure has been left as a rectangle, which is
 * not a claim about custom at all. It is the claim that the building will not
 * rack, and its source is the ground rather than a household.
 *
 * That makes it the first check here that could in principle be settled by
 * engineering rather than by ethnography, and it is worth being honest about
 * what it does and does not test. It tests that a member spans each recorded
 * bay corner to corner. It does not test that the member is strong enough, and
 * it never will: this project has no material properties and inventing them
 * would be exactly the kind of plausible number the provenance layer exists to
 * refuse. The geometry is the claim; the sizing is not.
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
import { DIMS, PACK, omoInfo } from './rules'
import { roofLevels, thatchBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * The house mirrors about z = 0 — and the behu do not.
 *
 * The stones are laid on a plaza in front and their number is a record of
 * feasts, so an odd count is not a defect. Scoped to the building for the same
 * reason the rumah gadang's symmetry check is scoped to its frame: a claim
 * narrowed and stated truly beats a claim widened and softened. The verdict
 * prints how many parts were left out so the narrowing cannot read as a
 * whole-site one.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: (p) => p.stage !== 'behu',
    labelId: 'Bangunannya simetris terhadap bidang z = 0; behu di halaman tidak dihitung',
    labelEn: 'The building mirrors about z = 0; the behu on the plaza are not counted',
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

/* ── The reason the house stands ──────────────────────────────────────── */

/**
 * No rectangle of four posts is left without a diagonal across it.
 *
 * Walks the cells the layout recorded — the same list the braces were built
 * from — and for each one looks for a driwa whose own points reach both of the
 * cell's opposite corners. Reaching the corners is the test rather than
 * "a driwa exists in this cell", because a short diagonal sitting in the
 * middle of a bay braces nothing and would satisfy a membership check.
 */
export function checkBracing(house: House, layout: Layout): CheckResult {
  const braces = house.parts.filter((p) => p.stage === 'driwa')
  const reach = layout.braceSection * 1.5
  const unbraced: string[] = []

  for (const cell of layout.cells) {
    const spans = braces.some((brace) => {
      let low = false
      let high = false
      for (const [x, y, z] of partPoints(brace)) {
        const a = cell.plane === 0 ? z : x
        const off = cell.plane === 0 ? x : z
        if (Math.abs(off - cell.at) > reach) return false
        // Within reach of the bottom of one side and the top of the other.
        if (Math.abs(y - cell.minY) < reach && (Math.abs(a - cell.minA) < reach || Math.abs(a - cell.maxA) < reach)) low = true
        if (Math.abs(y - cell.maxY) < reach && (Math.abs(a - cell.minA) < reach || Math.abs(a - cell.maxA) < reach)) high = true
      }
      return low && high
    })
    if (!spans) unbraced.push(cell.id)
  }

  const ok = unbraced.length === 0 && layout.cells.length > 0
  const alongZ = layout.cells.filter((c) => c.plane === 0).length
  const alongX = layout.cells.filter((c) => c.plane === 2).length
  return {
    key: 'bracing',
    titleId: 'Setiap petak rangka bawah disilang driwa: tidak ada persegi yang dibiarkan persegi',
    titleEn: 'Every bay of the substructure is crossed by a driwa: no rectangle left a rectangle',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.cells.length} petak — ${alongZ} memanjang dan ${alongX} melintang — semuanya bersegitiga. Ini satu-satunya pemeriksaan dalam projek ini yang sumbernya tanah, bukan adat: persegi bergoyang, segitiga tidak. Yang diuji adalah geometrinya; kekuatan batangnya tidak, dan tidak akan pernah — projek ini tidak punya sifat bahan dan mengarangnya justru jenis angka yang hendak ditolak lapisan provenans.`
      : `${unbraced.length} petak tanpa diagonal yang menjangkau kedua sudut: ${unbraced.slice(0, 6).join(', ')}.`,
    detailEn: ok
      ? `${layout.cells.length} bays — ${alongZ} along the building and ${alongX} across it — every one triangulated. It is the only check in this project whose source is the ground rather than custom: a rectangle racks, a triangle does not. What is tested is the geometry; the strength of the members is not, and never will be — this project has no material properties, and inventing them would be exactly the kind of plausible number the provenance layer exists to refuse.`
      : `${unbraced.length} bays with no diagonal reaching both corners: ${unbraced.slice(0, 6).join(', ')}.`,
  }
}

/** The frame that does the work stands in the open, with nothing in front of it. */
export function checkBracingVisible(house: House, layout: Layout): CheckResult {
  const hidden = house.parts.filter((p) => {
    if (p.stage === 'driwa' || p.stage === 'ehomo' || p.stage === 'batu') return false
    const b = partBounds(p)
    /*
     * Reaching *into* the understorey, not grazing its ceiling.
     *
     * A tolerance of 1e-4 flagged all four walls: they lean, so their rotated
     * extent dips a fraction of a millimetre below the floor they stand on. A
     * member has to come down into the open storey by at least a post's width
     * before it screens anything.
     */
    if (b.min[1] >= layout.floorY - layout.postSection || b.max[1] <= layout.stoneHeight + TOL) return false
    /*
     * Under the building, not merely at the same height as it.
     *
     * The first version flagged the behu, which stand a couple of metres in
     * front of the house and are the same height as the understorey. A stone
     * in the yard screens nothing; what would screen this frame is something
     * built *within the footprint*, which is the question the check is
     * actually asking.
     */
    return Math.abs(b.min[0]) < layout.eaveHalfX && Math.abs(b.max[0]) < layout.eaveHalfX
  })
  const ok = hidden.length === 0
  return {
    key: 'bracing-visible',
    titleId: 'Kolongnya terbuka: yang membuat rumah ini berdiri juga yang paling mudah dilihat',
    titleEn: 'The understorey is open: what makes this house stand is what is easiest to see',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Tidak ada apa pun selain batu, ehomo dan driwa di bawah lantai setinggi ${layout.floorY.toFixed(2)} m.`
      : `${hidden.length} bagian menutupi kolong: ${hidden.map((h) => h.id).join(', ')}.`,
    detailEn: ok
      ? `Nothing but stones, ehomo and driwa below a floor at ${layout.floorY.toFixed(2)} m.`
      : `${hidden.length} parts screen the understorey: ${hidden.map((h) => h.id).join(', ')}.`,
  }
}

/** The posts stand on stones and are not buried. */
export function checkSeatedOnStone(house: House, layout: Layout): CheckResult {
  const posts = house.parts.filter((p) => p.id.startsWith('ehomo-'))
  const buried = posts.filter((p) => partBounds(p).min[1] < TOL)
  const ok = posts.length > 0 && buried.length === 0
  return {
    key: 'stone',
    titleId: 'Kaki tiang berdiri di atas batu, tidak ditanam',
    titleEn: 'The post feet stand on stones and are not buried',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${posts.length} ehomo duduk di batunya. Kaki yang boleh sedikit bergeser lebih baik daripada kaki yang harus patah — alasan yang sama dengan driwa, dinyatakan di ujung yang lain.`
      : `${buried.length} ehomo turun sampai ke tanah.`,
    detailEn: ok
      ? `${posts.length} ehomo seated on their stones. A footing allowed to shift a little is better than one that has to break — the same reasoning as the driwa, stated at the other end.`
      : `${buried.length} ehomo reach down into the ground.`,
  }
}

/** The front is opened by one continuous band, not a row of holes. */
export function checkWindowBand(house: House, layout: Layout): CheckResult {
  const band = house.parts.filter((p) => p.stage === 'jendela')
  const one = band.length === 1
  const first = band[0]
  const span = first ? partBounds(first) : undefined
  const want = layout.bukaan.toZ - layout.bukaan.fromZ
  const got = span ? span.max[2] - span.min[2] : 0
  const ok = one && Math.abs(got - want) < 0.01 && want > 0
  return {
    key: 'window-band',
    titleId: 'Muka rumah dibuka satu pita menerus, bukan sederet lubang',
    titleEn: 'The front is opened by one continuous band, not a row of holes',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Satu bukaan sepanjang ${got.toFixed(2)} m, setinggi ${layout.bukaan.height.toFixed(2)} m, berhenti ${DIMS.windowInset.value.toFixed(2)} m sebelum tiap sudut.`
      : `${band.length} bagian jendela, membentang ${got.toFixed(2)} m dari ${want.toFixed(2)} m.`,
    detailEn: ok
      ? `One opening ${got.toFixed(2)} m long and ${layout.bukaan.height.toFixed(2)} m high, stopping ${DIMS.windowInset.value.toFixed(2)} m short of each corner.`
      : `${band.length} window parts, spanning ${got.toFixed(2)} m of ${want.toFixed(2)} m.`,
  }
}

/**
 * The roof is the greater part of the building.
 *
 * A proportion rather than a dimension, and stated because it is the thing a
 * photograph of an omo is actually of. Measured against the body it covers —
 * floor to eave — so that scaling the whole house cannot satisfy it.
 */
export function checkRoofDominates(layout: Layout): CheckResult {
  const body = layout.eaveY - layout.floorY
  const roof = layout.ridgeY - layout.eaveY
  const ok = roof > body
  return {
    key: 'roof-dominates',
    titleId: 'Atapnya lebih besar daripada badan yang ditutupinya',
    titleEn: 'The roof is larger than the body it covers',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Badan ${body.toFixed(2)} m, atap ${roof.toFixed(2)} m — ${(roof / body).toFixed(2)} kali. Ruang di dalamnya terlalu berharga untuk dikosongkan, dan di rumah si’ulu memang tidak.`
      : `Badan ${body.toFixed(2)} m, atap ${roof.toFixed(2)} m.`,
    detailEn: ok
      ? `A body of ${body.toFixed(2)} m under a roof of ${roof.toFixed(2)} m — ${(roof / body).toFixed(2)} times. The space inside it is too valuable to leave empty, and in a si’ulu’s house it is not.`
      : `A body of ${body.toFixed(2)} m under a roof of ${roof.toFixed(2)} m.`,
  }
}

/** A loft in a si'ulu's house, and none in an ordinary one. */
export function checkLoft(house: House, layout: Layout): CheckResult {
  const info = omoInfo(layout.rules.omo)
  const built = house.parts.some((p) => p.id === 'loteng')
  const ok = built === info.loft
  return {
    key: 'loft',
    titleId: 'Loteng di dalam atap ada pada rumah si’ulu dan tidak ada pada rumah biasa',
    titleEn: 'A loft inside the roof in a si’ulu’s house, and none in an ordinary one',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? info.loft
        ? `${info.name}: loteng pada ${layout.loft.y.toFixed(2)} m, di dalam atap.`
        : `${info.name}: tidak ada loteng, dan ketiadaannya itulah yang membedakannya.`
      : `${info.name} ${info.loft ? 'seharusnya berloteng' : 'seharusnya tanpa loteng'}.`,
    detailEn: ok
      ? info.loft
        ? `${info.name}: a loft at ${layout.loft.y.toFixed(2)} m, inside the roof.`
        : `${info.name}: no loft, and that absence is the difference.`
      : `${info.name} ${info.loft ? 'should have a loft' : 'should have none'}.`,
  }
}

/** Behu stand only where the household may raise them. */
export function checkBehu(house: House, layout: Layout): CheckResult {
  const stones = house.parts.filter((p) => p.stage === 'behu')
  const ok = (stones.length > 0) === layout.rules.behu
  const outside = stones.every((p) => partBounds(p).max[0] < -layout.eaveHalfX)
  return {
    key: 'behu',
    titleId: 'Behu berdiri di halaman, di luar bangunan, dan hanya bila rumah tangganya berhak',
    titleEn: 'Behu stand on the plaza, outside the building, and only where the household is entitled',
    status: ok && outside ? 'pass' : 'fail',
    detail:
      ok && outside
        ? stones.length > 0
          ? `${stones.length} behu, semuanya di luar tepi atap. Tiap batu adalah catatan pesta yang pernah diadakan — satu-satunya hal dalam projek ini yang dinyatakan sebuah rumah tangga tanpa membangun apa pun pada rumahnya.`
          : `Tidak ada behu. Rumah tangganya tidak mendirikannya, dan ketiadaan itu terbaca sama jelasnya.`
        : `${stones.length} behu; ${outside ? 'jumlahnya' : 'letaknya'} tidak sesuai aturan.`,
    detailEn:
      ok && outside
        ? stones.length > 0
          ? `${stones.length} behu, every one outside the eave line. Each stone records a feast that was held — the only thing in this project a household states without building anything on its house.`
          : `No behu. This household has raised none, and that absence reads just as clearly.`
        : `${stones.length} behu; the ${outside ? 'count' : 'placement'} does not follow the rule.`,
  }
}

/** Thatch courses lap with no bare band, from the eave to the ridge. */
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
    titleId: 'Lapis rumbia saling menindih tanpa celah, dari tepi atap sampai bubungan',
    titleEn: 'Thatch courses lap with no bare band, from the eave to the ridge',
    status: ok ? 'pass' : 'fail',
    detail: ok ? `${bands.length} lapis menutupi ${hipRun(roofLevels(layout)).toFixed(2)} m kemiringan.` : gaps.join('; '),
    detailEn: ok ? `${bands.length} courses over ${hipRun(roofLevels(layout)).toFixed(2)} m of slope.` : gaps.join('; '),
  }
}

/** No frame member reaches outside the roof surface at its own height. */
export function checkFrameInsideRoof(house: House, layout: Layout): CheckResult {
  const levels = roofLevels(layout)
  const eave = levels[0]
  const ridge = levels[1]
  if (!eave || !ridge) {
    return {
      key: 'frame-inside-roof',
      titleId: 'Rangka atap berada di dalam permukaan atapnya',
      titleEn: 'The roof frame lies inside its own surface',
      status: 'fail',
      detail: 'Atap tidak punya tepi dan bubungan.',
      detailEn: 'The roof has no eave and ridge.',
    }
  }
  const rise = ridge.y - eave.y
  const skin = layout.postSection
  let worst = 0
  let worstId = ''
  for (const part of house.parts) {
    if (part.stage !== 'rangka') continue
    for (const [x, y, z] of partPoints(part)) {
      const t = rise <= 0 ? 0 : Math.max(0, Math.min(1, (y - eave.y) / rise))
      const over = Math.max(
        Math.abs(x) - (eave.halfX * (1 - t) + skin),
        Math.abs(z) - (eave.halfZ - (eave.halfZ - ridge.halfZ) * t + skin),
      )
      if (over > worst) {
        worst = over
        worstId = part.id
      }
    }
  }
  const ok = worst <= 0
  return {
    key: 'frame-inside-roof',
    titleId: 'Setiap batang rangka berhenti di tempat bidang atapnya habis',
    titleEn: 'Every frame member stops where its roof plane runs out',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? 'Tidak ada titik rangka yang keluar dari permukaan atap pada ketinggiannya sendiri.'
      : `${worstId} keluar ${(worst * 1000).toFixed(0)} mm dari bidang atapnya.`,
    detailEn: ok
      ? 'No point of the frame reaches outside the roof surface at its own height.'
      : `${worstId} reaches ${(worst * 1000).toFixed(0)} mm outside its roof plane.`,
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
    checkBracing(house, layout),
    checkBracingVisible(house, layout),
    checkSeatedOnStone(house, layout),
    checkWindowBand(house, layout),
    checkRoofDominates(layout),
    checkLoft(house, layout),
    checkBehu(house, layout),
    checkFrameInsideRoof(house, layout),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
