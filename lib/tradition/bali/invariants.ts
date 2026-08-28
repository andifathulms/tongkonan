/**
 * The checks that are claims about the bale.
 *
 * The generic half comes from the core unchanged for the fifth time. What is
 * here is what this house says and the other four cannot, and two of them are
 * unlike any check in the project so far:
 *
 * `checkModule` asserts that every principal length in the building is a whole
 * number of a named measure of its owner's body. No other house can state
 * that, because no other house has a unit that belongs to anybody. It is also
 * the only check here that would catch a hardcoded metre — the provenance bar
 * counts declarations, and a number written straight into a builder is
 * invisible to it. This one sees the arithmetic.
 *
 * `checkPengurip` asserts the opposite of what a check normally asserts. Every
 * other invariant in this project passes by finding an agreement; this one
 * passes by finding that no principal dimension lands exactly on its module,
 * because a measure that does is called mati — dead. The house is required not
 * to be exactly its own rule, and turning the pengurip off is how you watch
 * the check refuse it.
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
import { isWhole, unitLength } from './module'
import { DIMS, PACK, baleInfo } from './rules'
import { thatchBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Bangunan simetris terhadap bidang z = 0, tempat bubungan berjalan',
    labelEn: 'The building mirrors about z = 0, the plane the ridge runs along',
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

/* ── The name is the count ────────────────────────────────────────────── */

/**
 * The number of saka is the name of the building.
 *
 * Trivial to satisfy and worth stating, because it is the only rule in the
 * project where the word a household uses and the number the generator needs
 * are the same fact. If they ever disagree, the building is called something
 * it is not.
 */
export function checkSakaCount(house: House, layout: Layout): CheckResult {
  const info = baleInfo(layout.rules.bale)
  const built = house.parts.filter((p) => /^saka-\d+-\d+$/.test(p.id)).length
  const ok = built === info.saka && info.rows * info.cols === info.saka
  return {
    key: 'saka-count',
    titleId: 'Jumlah saka adalah nama bangunan ini',
    titleEn: 'The number of saka is the name of this building',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${info.name}: ${built} saka, ${info.rows} × ${info.cols}. Nama dan jumlah adalah satu hal yang sama, diucapkan sekali.`
      : `${info.name} seharusnya ${info.saka} saka; terbangun ${built}.`,
    detailEn: ok
      ? `${info.name}: ${built} saka, ${info.rows} × ${info.cols}. The name and the count are one fact said once.`
      : `${info.name} calls for ${info.saka} saka; ${built} were built.`,
  }
}

/* ── The module ───────────────────────────────────────────────────────── */

/**
 * Every principal length is a whole number of the owner's body.
 *
 * The check subtracts the pengurip first and then asks whether what is left is
 * a whole multiple of the named unit. That order matters: the increment is not
 * a rounding error to be tolerated, it is a declared part of the measurement,
 * so tolerating it as slack would let a genuinely arbitrary metre through as
 * long as it happened to be small.
 */
export function checkModule(layout: Layout): CheckResult {
  const s = layout.sikut
  const wrong = layout.measured.filter((m) => !isWhole(m.metres - s.pengurip, unitLength(s, m.unit)))
  const ok = wrong.length === 0
  const kinds = new Set(layout.measured.map((m) => m.unit))
  return {
    key: 'module',
    titleId: 'Setiap ukuran pokok adalah kelipatan bulat ukuran tubuh pemiliknya',
    titleEn: 'Every principal length is a whole number of its owner’s body',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.measured.length} ukuran pokok, dalam ${kinds.size} satuan tubuh, dari depa ${(s.depa * 1000).toFixed(0)} mm. Tidak ada satu pun panjang di bangunan ini yang ditulis sebagai meter; semuanya dihitung dari tubuh pemiliknya.`
      : `${wrong.length} ukuran bukan kelipatan bulat satuannya: ${wrong.map((m) => m.nameId).join(', ')}.`,
    detailEn: ok
      ? `${layout.measured.length} principal lengths, in ${kinds.size} body measures, from a depa of ${(s.depa * 1000).toFixed(0)} mm. Not one length in this building is written as a metre; every one is counted off its owner.`
      : `${wrong.length} lengths are not whole multiples of their unit: ${wrong.map((m) => m.nameEn).join(', ')}.`,
  }
}

/**
 * No principal length lands exactly on its module — or every one does.
 *
 * The check that passes by finding an inexactness. With the pengurip added,
 * a measure that came out exact would be `mati`, so an exact one is the
 * failure. With it withheld, the claim inverts and every measure must be
 * exact, because then the increment is genuinely absent rather than merely
 * small — which is how you can watch the rule being refused rather than being
 * told about it.
 */
export function checkPengurip(layout: Layout): CheckResult {
  const s = layout.sikut
  const exact = layout.measured.filter((m) => isWhole(m.metres, unitLength(s, m.unit)))
  const ok = s.alive ? exact.length === 0 : exact.length === layout.measured.length
  const mm = s.pengurip * 1000
  return {
    key: 'pengurip',
    titleId: s.alive
      ? 'Tidak ada ukuran pokok yang jatuh tepat pada modulnya: ukuran yang tepat itu mati'
      : 'Tanpa pengurip, setiap ukuran pokok jatuh tepat pada modulnya',
    titleEn: s.alive
      ? 'No principal length lands exactly on its module: an exact measure is dead'
      : 'Without the pengurip, every principal length lands exactly on its module',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? s.alive
        ? `Pengurip satu useran, ${mm.toFixed(1)} mm, ditambahkan pada ${layout.measured.length} ukuran pokok. Bangunan ini diwajibkan tidak persis sama dengan aturannya sendiri, dan hanya aturan inilah yang berbentuk demikian di seluruh projek ini.`
        : `Pengurip ditiadakan, dan ${exact.length} ukuran pokok kini kelipatan bulat yang tepat. Undagi tidak akan mendirikan rumah ini: inilah yang dimaksud mati.`
      : s.alive
        ? `${exact.length} ukuran masih jatuh tepat pada modulnya meskipun pengurip ditambahkan.`
        : `${layout.measured.length - exact.length} ukuran tidak tepat meskipun pengurip ditiadakan.`,
    detailEn: ok
      ? s.alive
        ? `A pengurip of one useran, ${mm.toFixed(1)} mm, added to ${layout.measured.length} principal lengths. This building is required not to be exactly its own rule, and no other rule in this project has that shape.`
        : `The pengurip is withheld, and ${exact.length} principal lengths are now exact whole multiples. An undagi would not raise this house: this is what mati means.`
      : s.alive
        ? `${exact.length} lengths still land exactly on their module even with the pengurip added.`
        : `${layout.measured.length - exact.length} lengths are inexact even with the pengurip withheld.`,
  }
}

/* ── Tri angga ────────────────────────────────────────────────────────── */

/** Foot, body and head, in that order and each with real extent. */
export function checkTriAngga(house: House, layout: Layout): CheckResult {
  const body = layout.bataranHeight
  const head = layout.eaveY
  const top = house.bounds.max[1]
  const faults: string[] = []
  if (!(body > TOL)) faults.push('the bataran has no height')
  if (!(head > body + TOL)) faults.push('the saka do not stand above the bataran')
  if (!(top > head + TOL)) faults.push('the roof does not rise above the eave')
  const ok = faults.length === 0
  return {
    key: 'tri-angga',
    titleId: 'Tiga bagian tegak, berurutan: bataran, saka, atap',
    titleEn: 'Three vertical parts, in order: bataran, saka, roof',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Kaki 0 → ${body.toFixed(2)} m, badan → ${head.toFixed(2)} m, kepala → ${top.toFixed(2)} m. Kepala bagian terbesar, seperti seharusnya.`
      : faults.join('; '),
    detailEn: ok
      ? `Foot 0 → ${body.toFixed(2)} m, body → ${head.toFixed(2)} m, head → ${top.toFixed(2)} m. The head is the largest part, as it should be.`
      : faults.join('; '),
  }
}

/* ── Open on every side ───────────────────────────────────────────────── */

/**
 * Nothing stands between the floor and the eave except the posts.
 *
 * A check that passes by finding nothing, like the mbaru niang's wall check —
 * but for the opposite reason. There the whole exterior is roof, so a wall
 * would be redundant; here the building is deliberately unenclosed, and what
 * makes it usable is the reach of the overhang instead. A part counts as
 * enclosure if it stands in the storey height and is broad in both plan
 * directions, which a post is not and a panel would be.
 */
export function checkOpen(house: House, layout: Layout): CheckResult {
  const floor = layout.bataranHeight
  const broad = layout.sakaSection * 3
  const walls = house.parts.filter((p) => {
    const b = partBounds(p)
    /*
     * A part has to sit substantially *within* the storey to be enclosure.
     *
     * The first version asked only that a part overlap the storey at all, and
     * flagged the four hip rafters: a hip rafter's foot dips a rafter's depth
     * below the eave, so it overlapped, and its bounding box spans the whole
     * roof in plan, so it looked broad. Neither fact is about a wall. What a
     * wall does is stand in the storey for most of the storey's height.
     */
    if (b.min[1] > layout.eaveY - broad || b.max[1] <= floor + TOL) return false
    // The sitting deck is inside the storey but is a thing to sit on, and it
    // is low. Enclosure is what reaches up toward the eave.
    if (b.max[1] < layout.deck.y + broad) return false
    return b.max[0] - b.min[0] > broad && b.max[2] - b.min[2] > broad
  })
  const ok = walls.length === 0
  return {
    key: 'open',
    titleId: 'Terbuka pada setiap sisi: tidak ada satu bidang dinding pun antara lantai dan tepi atap',
    titleEn: 'Open on every side: not one wall plane between the floor and the eave',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Nol bidang penutup di ketinggian ${floor.toFixed(2)} m sampai ${layout.eaveY.toFixed(2)} m. Yang membuat bale ini terpakai saat hujan bukan dindingnya melainkan tritisan sepanjang ${(layout.roof[0] ? layout.roof[0].halfX - layout.bataranHalfX : 0).toFixed(2)} m.`
      : `${walls.length} bagian menutup sisi bangunan: ${walls.map((w) => w.id).join(', ')}.`,
    detailEn: ok
      ? `Zero enclosing planes between ${floor.toFixed(2)} m and ${layout.eaveY.toFixed(2)} m. What makes this bale usable in rain is not a wall but ${(layout.roof[0] ? layout.roof[0].halfX - layout.bataranHalfX : 0).toFixed(2)} m of overhang.`
      : `${walls.length} parts enclose the sides: ${walls.map((w) => w.id).join(', ')}.`,
  }
}

/* ── The hip ──────────────────────────────────────────────────────────── */

/**
 * The four planes fall at one pitch, which is what makes it a hip.
 *
 * Stated as a relation rather than as a pitch: the ridge is shorter than the
 * eave by the eave's own depth at each end. Declaring a ridge length instead
 * would have let the four planes fall at four different pitches and still be
 * called a hip — and on a square plan the relation is what produces a pyramid
 * with nothing written to produce one.
 */
export function checkHipFromPlan(layout: Layout): CheckResult {
  const eave = layout.roof[0]
  const ridge = layout.roof[layout.roof.length - 1]
  if (!eave || !ridge) {
    return {
      key: 'hip',
      titleId: 'Atap limas',
      titleEn: 'A hipped roof',
      status: 'fail',
      detail: 'Atap tidak punya tepi dan bubungan.',
      detailEn: 'The roof has no eave and ridge.',
    }
  }
  const want = Math.max(0, eave.halfZ - eave.halfX)
  const ok = Math.abs(ridge.halfZ - want) < TOL && ridge.halfX < TOL
  const pyramid = want < TOL
  return {
    key: 'hip',
    titleId: 'Empat bidang atap satu kemiringan, dan bubungan lebih pendek daripada bangunannya',
    titleEn: 'Four roof planes at one pitch, and a ridge shorter than the building',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? pyramid
        ? `Denah bujur sangkar, jadi panjang bubungan nol dan atapnya limas sempurna. Bentuk ini tidak ditetapkan di mana pun — ia jatuh dari jumlah saka.`
        : `Bubungan ${(ridge.halfZ * 2).toFixed(2)} m di atas tepi atap ${(eave.halfZ * 2).toFixed(2)} × ${(eave.halfX * 2).toFixed(2)} m: lebih pendek tepat sedalam setengah tepi atap di tiap ujung.`
      : `Bubungan ${(ridge.halfZ * 2).toFixed(2)} m; seharusnya ${(want * 2).toFixed(2)} m untuk kemiringan yang sama pada keempat bidang.`,
    detailEn: ok
      ? pyramid
        ? `The plan is square, so the ridge has zero length and the roof is a true pyramid. That form is declared nowhere — it falls out of the post count.`
        : `A ridge of ${(ridge.halfZ * 2).toFixed(2)} m over an eave of ${(eave.halfZ * 2).toFixed(2)} × ${(eave.halfX * 2).toFixed(2)} m: shorter by exactly half the eave depth at each end.`
      : `The ridge is ${(ridge.halfZ * 2).toFixed(2)} m; one pitch on all four planes needs ${(want * 2).toFixed(2)} m.`,
  }
}

/** The roof drops its water clear of the platform it shelters. */
export function checkDripClearsBataran(layout: Layout): CheckResult {
  const eave = layout.roof[0]
  const outX = (eave?.halfX ?? 0) - layout.bataranHalfX
  const outZ = (eave?.halfZ ?? 0) - layout.bataranHalfZ
  const ok = outX > TOL && outZ > TOL
  return {
    key: 'drip',
    titleId: 'Tepi atap melampaui bataran di keempat sisinya',
    titleEn: 'The eave reaches past the bataran on all four sides',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Menjorok ${outX.toFixed(2)} m melintang dan ${outZ.toFixed(2)} m memanjang. Pada bangunan tanpa dinding, angka inilah yang menentukan bagian mana yang tetap kering.`
      : `Menjorok ${outX.toFixed(2)} m dan ${outZ.toFixed(2)} m; air jatuh di atas panggungnya sendiri.`,
    detailEn: ok
      ? `${outX.toFixed(2)} m across and ${outZ.toFixed(2)} m along. On a building with no walls this figure is what decides which of it stays dry.`
      : `${outX.toFixed(2)} m and ${outZ.toFixed(2)} m; the water lands on the platform it is meant to clear.`,
  }
}

/** The posts stand on their stones rather than in the platform. */
export function checkSeatedOnSendi(house: House, layout: Layout): CheckResult {
  const posts = house.parts.filter((p) => /^saka-\d+-\d+$/.test(p.id))
  const sunk = posts.filter((p) => partBounds(p).min[1] < layout.bataranHeight + TOL)
  const ok = posts.length > 0 && sunk.length === 0
  return {
    key: 'sendi',
    titleId: 'Kaki saka duduk di atas sendi, tidak ditanam di bataran',
    titleEn: 'The saka feet seat on their sendi and are not buried in the bataran',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${posts.length} saka berdiri di atas batunya. Karena tidak ditanam, rangkanya bisa dibongkar dan didirikan kembali.`
      : `${sunk.length} saka masuk ke dalam bataran.`,
    detailEn: ok
      ? `${posts.length} saka standing on their stones. Because none is buried, the frame can be taken apart and raised again.`
      : `${sunk.length} saka reach down into the bataran.`,
  }
}

/** Thatch courses lap with no bare band, from the eave to the ridge. */
export function checkThatchCoverage(house: House, layout: Layout): CheckResult {
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
  if (!house.parts.some((p) => p.stage === 'murda')) gaps.push('there is no finish over the ridge')
  const ok = gaps.length === 0
  return {
    key: 'thatch-coverage',
    titleId: 'Lapis alang-alang saling menindih tanpa celah, dari tepi atap sampai bubungan',
    titleEn: 'Thatch courses lap with no bare band, from the eave to the ridge',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${bands.length} lapis menutupi ${hipRun(layout.roof).toFixed(2)} m kemiringan.`
      : gaps.join('; '),
    detailEn: ok
      ? `${bands.length} courses over ${hipRun(layout.roof).toFixed(2)} m of slope.`
      : gaps.join('; '),
  }
}

/**
 * No member reaches outboard of the surface it belongs to.
 *
 * The general form of a fault this project has now found five times, written
 * here before it happens rather than after: a rafter cut to a line the roof no
 * longer follows. On a hip the four planes close inward as they rise, so a
 * rafter near a corner is shorter than one near the middle, and a loop that
 * gives every rafter the full run produces a frame of sticks passing through
 * each other and out into the air — completely hidden once the thatch is on.
 */
export function checkFrameInsideRoof(house: House, layout: Layout): CheckResult {
  const eave = layout.roof[0]
  const ridge = layout.roof[layout.roof.length - 1]
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
  const skin = layout.sakaSection
  let worst = 0
  let worstId = ''

  for (const part of house.parts) {
    if (part.stage !== 'iga-iga') continue
    for (const [x, y, z] of partPoints(part)) {
      // Each point against the roof at its own height, never against the
      // member's extremes. Written the coarse way first — the height of the
      // whole member's top against the plan of its whole footprint — and every
      // hip rafter failed by nearly three metres, because a diagonal member's
      // topmost point and its outermost point are not the same point. That is
      // the same fault this project found in the mbaru niang's cone check, and
      // it has the same fix.
      const t = rise <= 0 ? 0 : Math.max(0, Math.min(1, (y - eave.y) / rise))
      const overX = Math.abs(x) - (eave.halfX * (1 - t) + skin)
      const overZ = Math.abs(z) - (eave.halfZ - (eave.halfZ - ridge.halfZ) * t + skin)
      const over = Math.max(overX, overZ)
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
      ? 'Tidak ada titik rangka yang keluar dari permukaan atap pada ketinggiannya sendiri. Pada atap limas keempat bidang menyempit sambil naik, jadi kasau di dekat sudut lebih pendek — dan kesalahan semacam ini tertutup rapat oleh alang-alang.'
      : `${worstId} keluar ${(worst * 1000).toFixed(0)} mm dari bidang atapnya.`,
    detailEn: ok
      ? 'No point of the frame reaches outside the roof surface at its own height. On a hip the four planes narrow as they rise, so a rafter near a corner is shorter — and a fault of this kind is completely hidden by the thatch.'
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
    checkSakaCount(house, layout),
    checkModule(layout),
    checkPengurip(layout),
    checkTriAngga(house, layout),
    checkOpen(house, layout),
    checkHipFromPlan(layout),
    checkDripClearsBataran(layout),
    checkSeatedOnSendi(house, layout),
    checkFrameInsideRoof(house, layout),
    checkThatchCoverage(house, layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}

