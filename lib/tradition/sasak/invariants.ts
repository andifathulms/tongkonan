/**
 * The checks that are claims about the lumbung.
 *
 * The generic half comes from the core unchanged for the twelfth time.
 *
 * `checkRatGuard` and `checkNoOtherWayUp` are a pair, and only the pair says
 * anything. A disc on a post is not a defence; a disc on a post *with nothing
 * else reaching from the ground to the floor* is. So one check measures the
 * overhang and the other looks for a path — a brace touching both sides of the
 * guard, a wall reaching down past it, a platform close enough to a post to
 * step from. It is the only check in this project whose subject is the absence
 * of a route, and it is aimed at an animal rather than at a person.
 *
 * `checkHoodCurves` is the other one worth reading. The hood is built from the
 * same primitive as five earlier roofs, at nine levels instead of two, and what
 * makes it a curve rather than a faceted cone is that every band is steeper
 * than the one below it. A check that counted levels would not know the
 * difference.
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
import { DIMS, PACK, milikInfo } from './rules'
import { roofLevels, thatchBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 0,
    include: () => true,
    labelId: 'Simetris terhadap bidang bubungan, x = 0',
    labelEn: 'Symmetric about the ridge plane, x = 0',
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

/* ── The defence ──────────────────────────────────────────────────────── */

/** Every post carries a disc, and every disc overhangs its post. */
export function checkRatGuard(house: House, layout: Layout): CheckResult {
  const guards = house.parts.filter((p) => p.stage === 'penghalang')
  const faults: string[] = []
  if (guards.length !== layout.posts.length) {
    faults.push(`${guards.length} guards for ${layout.posts.length} posts`)
  }
  let worst = Infinity
  for (const post of layout.posts) {
    const over = post.guardRadius - layout.postSection / 2
    worst = Math.min(worst, over)
    if (over <= TOL) faults.push(`the guard on ${post.id} does not overhang its post`)
  }
  const ok = faults.length === 0 && guards.length > 0
  return {
    key: 'rat-guard',
    titleId: 'Tiap tiang memikul satu cakram, dan tiap cakram menjorok di luar tiangnya',
    titleEn: 'Every post carries a disc, and every disc overhangs its post',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${guards.length} cakram berjari-jari ${(DIMS.guardRadius.value * 1000).toFixed(0)} mm pada tiang bersisi ${(layout.postSection * 1000).toFixed(0)} mm, menyisakan juraian ${(worst * 1000).toFixed(0)} mm. Seluruh daya pertahanan ini ada pada selisih itu — dan kedua angkanya ditetapkan penulis, karena tidak ada sumber yang memberinya.`
      : faults.join('; '),
    detailEn: ok
      ? `${guards.length} discs of ${(DIMS.guardRadius.value * 1000).toFixed(0)} mm radius on posts of ${(layout.postSection * 1000).toFixed(0)} mm, leaving ${(worst * 1000).toFixed(0)} mm of overhang. The entire efficacy of this defence is that difference — and both figures are the author’s, because no source gives either.`
      : faults.join('; '),
  }
}

/**
 * Nothing else reaches from the ground to the store floor.
 *
 * The half of the defence that is about everything *other* than the guard. A
 * raking brace touching the ground and the floor, a wall carried down past the
 * disc, a platform set close enough to a post to step across — any of these
 * would make the discs ornaments, and every one of them is the sort of thing a
 * model acquires by accident.
 */
export function checkNoOtherWayUp(house: House, layout: Layout): CheckResult {
  const guardY = layout.posts[0]?.guardY ?? layout.floorY
  // How high something has to start for a rat to reach it from the ground.
  const reachable = 0.5
  const climbable: string[] = []
  for (const part of house.parts) {
    if (part.stage === 'tiang' || part.stage === 'batu' || part.stage === 'penghalang') continue
    const b = partBounds(part)
    /*
     * A route has to start near the ground to be a route.
     *
     * The first version flagged the hood's own skirt, which hangs below the
     * guards — and is a metre and a half in the air, which is not a path for
     * anything that has to start by walking. What makes a way up is a member
     * reaching from about the ground to above the discs.
     */
    if (b.min[1] < reachable && b.max[1] > guardY + TOL) climbable.push(part.id)
  }

  // And nothing may sit close enough to a post to be stepped across from.
  const near: string[] = []
  const seat = house.parts.find((p) => p.stage === 'kolong')
  if (seat) {
    const b = partBounds(seat)
    for (const post of layout.posts) {
      const gapX = Math.abs(post.x) - Math.max(Math.abs(b.min[0]), Math.abs(b.max[0]))
      const gapZ = Math.abs(post.z) - Math.max(Math.abs(b.min[2]), Math.abs(b.max[2]))
      if (gapX < layout.postSection / 2 - TOL && gapZ < layout.postSection / 2 - TOL) near.push(post.id)
    }
  }

  /*
   * And the hood stops above the guards.
   *
   * A skirt hanging past a disc is a roof handing back the route the disc
   * exists to close — and it also puts the one detail this building turns on
   * out of sight, where nobody could check it. Found by looking at the render:
   * the guards were tucked up inside the thatch and completely invisible.
   */
  const covered = layout.eaveY < guardY - TOL

  const ok = climbable.length === 0 && near.length === 0 && !covered
  return {
    key: 'no-other-way-up',
    titleId: 'Tidak ada jalan lain dari tanah ke lantai simpan',
    titleEn: 'Nothing else reaches from the ground to the store floor',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Nol bagian yang melintasi ketinggian cakram pada ${guardY.toFixed(2)} m selain tiangnya sendiri; lantai duduk berhenti sebelum tiap tiang; dan tepi tudung berhenti ${(layout.eaveY - guardY).toFixed(2)} m di atasnya, jadi cakramnya tergantung bebas dan terlihat. Cakram penghalang yang di sebelahnya ada sebatang bambu bukan penghalang — jadi separuh pertahanan ini adalah tentang segala hal yang bukan cakram.`
      : covered
        ? `Tepi tudung pada ${layout.eaveY.toFixed(2)} m turun melewati cakram pada ${guardY.toFixed(2)} m: atapnya sendiri menjadi jalan memutar, dan cakramnya tidak terlihat oleh siapa pun.`
        : `${climbable.length} bagian melintasi cakram (${climbable.slice(0, 4).join(', ')}); ${near.length} tiang bisa dijangkau dari lantai duduk.`,
    detailEn: ok
      ? `Zero parts cross the guard height at ${guardY.toFixed(2)} m except the posts themselves; the sitting platform stops short of every post; and the hood’s edge stops ${(layout.eaveY - guardY).toFixed(2)} m above them, so the discs hang clear and can be seen. A rat guard with a bamboo pole beside it is not a guard — so half of this defence is about everything that is not the disc.`
      : covered
        ? `The eave at ${layout.eaveY.toFixed(2)} m falls past the guards at ${guardY.toFixed(2)} m: the roof itself is the way round, and the discs are invisible to anyone.`
        : `${climbable.length} parts cross the guards (${climbable.slice(0, 4).join(', ')}); ${near.length} posts are reachable from the platform.`,
  }
}

/** Nobody could stand up in it, and nothing in it is for a person. */
export function checkNotForPeople(layout: Layout): CheckResult {
  const ok = layout.storeHeight < 1.7
  return {
    key: 'not-for-people',
    titleId: 'Tidak ada tingkat di dalamnya yang bisa ditegakkan seorang manusia',
    titleEn: 'There is no storey in it a person could stand up in',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Ruang simpan setinggi ${layout.storeHeight.toFixed(2)} m. Bangunan ini untuk padi, dan di pekarangan Sasak ia kerap yang paling cermat dikerjakan — kecermatannya mengikuti nilai yang disimpan, bukan kedudukan yang menyimpannya. Sebelas bangunan lain dalam projek ini menakarnya dengan cara yang kedua.`
      : `Ruang simpan setinggi ${layout.storeHeight.toFixed(2)} m: cukup untuk berdiri, jadi ini bukan lagi lumbung.`,
    detailEn: ok
      ? `A store ${layout.storeHeight.toFixed(2)} m high. This building is for rice, and in a Sasak yard it is often the most carefully made thing standing — its care follows the value of what is stored rather than the standing of whoever stores it. The other eleven in this project scale it the second way.`
      : `A store ${layout.storeHeight.toFixed(2)} m high: a person could stand in it, so this is no longer a lumbung.`,
  }
}

/** The eave falls past the floor it shelters. */
export function checkHoodFallsPastTheFloor(layout: Layout): CheckResult {
  const ok = layout.eaveY < layout.floorY - TOL
  return {
    key: 'hood',
    titleId: 'Tepi atap turun melewati lantai simpan',
    titleEn: 'The eave falls past the floor of the store',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Tepi atap pada ${layout.eaveY.toFixed(2)} m, lantai simpan pada ${layout.floorY.toFixed(2)} m — turun ${(layout.floorY - layout.eaveY).toFixed(2)} m di bawahnya. Itulah yang membuat bentuk ini terbaca sebagai tudung yang ditarikkan ke atas sebuah kotak, bukan sebagai atap yang diletakkan di atasnya.`
      : `Tepi atap pada ${layout.eaveY.toFixed(2)} m, tidak di bawah lantai simpan pada ${layout.floorY.toFixed(2)} m.`,
    detailEn: ok
      ? `An eave at ${layout.eaveY.toFixed(2)} m against a store floor at ${layout.floorY.toFixed(2)} m — ${(layout.floorY - layout.eaveY).toFixed(2)} m below it. That is what makes this form read as a hood pulled over a box rather than a roof set on top of one.`
      : `An eave at ${layout.eaveY.toFixed(2)} m, not below the store floor at ${layout.floorY.toFixed(2)} m.`,
  }
}

/**
 * The hood curves: every band is shallower than the one below it.
 *
 * Convex, and that direction is the shape. A lumbung's hood falls almost
 * vertically at its skirt and eases into a rounded shoulder near the ridge —
 * written the other way at first, which gave a form that flared outward as it
 * rose and was neither a lumbung nor anything else, and this check caught it
 * before a render did.
 *
 * What separates a curve from a faceted cone is that the pitch keeps changing,
 * which is also the reason `hoodSteps` is drawing resolution while `hoodBelly`
 * is not: a stack of levels at one pitch would satisfy any check that only
 * counted them.
 */
export function checkHoodCurves(layout: Layout): CheckResult {
  const levels = roofLevels(layout)
  const faults: string[] = []
  let previous = -Infinity
  let steepest = 0
  let shallowest = Infinity
  for (let i = 1; i < levels.length; i++) {
    const a = levels[i - 1]
    const b = levels[i]
    if (!a || !b) continue
    // Steepness as the rise over the horizontal closing-in of that band.
    const inward = a.halfX - b.halfX
    const rise = b.y - a.y
    const pitch = Math.atan2(rise, inward)
    steepest = Math.max(steepest, pitch)
    shallowest = Math.min(shallowest, pitch)
    if (i > 1 && pitch >= previous - 1e-9) faults.push(`band ${i} is no shallower than the one below it`)
    previous = pitch
  }
  const ok = faults.length === 0 && levels.length > 3
  return {
    key: 'hood-curves',
    titleId: 'Tudungnya melengkung ke luar: tiap pias lebih landai daripada pias di bawahnya',
    titleEn: 'The hood curves outward: every band is shallower than the one below it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${levels.length - 1} pias, dari ${((steepest * 180) / Math.PI).toFixed(0)}° di tepi sampai ${((shallowest * 180) / Math.PI).toFixed(0)}° di puncak. Dibuat dari primitif yang sama dengan lima atap sebelumnya, hanya dengan lebih banyak tingkat — sebuah lengkung adalah banyak tangga, dan yang membedakannya dari kerucut bersegi adalah bahwa kemiringannya berubah terus, yang tidak akan diketahui oleh pemeriksaan yang cuma menghitung tingkat.`
      : faults.join('; '),
    detailEn: ok
      ? `${levels.length - 1} bands, from ${((steepest * 180) / Math.PI).toFixed(0)}° at the eave to ${((shallowest * 180) / Math.PI).toFixed(0)}° at the top. Made from the same primitive as five earlier roofs with nothing but more levels — a curve is many steps, and what separates it from a faceted cone is that the pitch keeps changing, which a check that only counted levels would not know.`
      : faults.join('; '),
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
    titleId: 'Lapis alang-alang saling menindih tanpa celah sepanjang lengkungnya',
    titleEn: 'Thatch courses lap with no bare band, the whole way round the curve',
    status: ok ? 'pass' : 'fail',
    detail: ok ? `${bands.length} lapis menutupi ${hipRun(roofLevels(layout)).toFixed(2)} m.` : gaps.join('; '),
    detailEn: ok ? `${bands.length} courses over ${hipRun(roofLevels(layout)).toFixed(2)} m.` : gaps.join('; '),
  }
}

/** Four posts or six, and nothing between. */
export function checkPostCount(house: House, layout: Layout): CheckResult {
  const built = house.parts.filter((p) => /^tiang-\d+-\d+$/.test(p.id)).length
  const ok = built === layout.rules.tiang && (built === 4 || built === 6)
  return {
    key: 'posts',
    titleId: 'Empat tiang atau enam, dan tidak ada di antaranya',
    titleEn: 'Four posts or six, and nothing between',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${built} tiang, ${milikInfo(layout.rules.milik).name.toLowerCase()}. Lumbung berkaki lima bukan lumbung yang lebih kecil; ia bangunan yang tidak dibuat tradisi ini.`
      : `${built} tiang.`,
    detailEn: ok
      ? `${built} posts, a ${milikInfo(layout.rules.milik).name.toLowerCase()}. A lumbung on five posts is not a smaller one; it is a building this tradition does not make.`
      : `${built} posts.`,
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
    checkRatGuard(house, layout),
    checkNoOtherWayUp(house, layout),
    checkNotForPeople(layout),
    checkPostCount(house, layout),
    checkHoodFallsPastTheFloor(layout),
    checkHoodCurves(layout),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
