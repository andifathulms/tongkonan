/**
 * The checks that are claims about the saoraja.
 *
 * The generic half comes from the core unchanged for the tenth time.
 *
 * `checkRankCarriesNothing` is the one no earlier house could make, and it is
 * the only invariant in this project whose subject is what a part does *not*
 * do. Every other structural check asks whether something bears, spans,
 * reaches or holds. This one asks whether the boards on the gable hold
 * anything — and requires that they do not, because a rank marker that carried
 * load would be a rank you could not lie about, and the whole interest of the
 * timpa laja is that you can.
 *
 * The way it is tested is worth stating: the house is rebuilt with every board
 * removed and the *structural* checks are run again. If they all still pass,
 * the boards were carrying nothing. That is a stronger statement than
 * inspecting their joints, because it does not depend on the joints having
 * been declared honestly.
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
import { DIMS, PACK, rumahInfo } from './rules'
import { roofLevels, thatchBands } from './roof'
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

/* ── The rank holds nothing up ────────────────────────────────────────── */

/**
 * Take every board off, and the building must be unchanged.
 *
 * Tested by rebuilding without them and running the structural checks again,
 * rather than by inspecting what the boards are jointed to — a part can be
 * declared jointless and still be the only thing under a rafter.
 */
export function checkRankCarriesNothing(house: House, layout: Layout): CheckResult {
  const boards = house.parts.filter((p) => p.stage === 'timpa')
  const without: House = { ...house, parts: house.parts.filter((p) => p.stage !== 'timpa') }

  const faults: string[] = []
  if (boards.length !== layout.rules.timpa * 2) {
    faults.push(`${boards.length} boards for a rank of ${layout.rules.timpa} on two gables`)
  }
  // Nothing is jointed to a board, at either end.
  const jointed = house.joints.filter(
    (j) => j.mortise.startsWith('timpa-') || j.tenon.startsWith('timpa-'),
  )
  if (jointed.length > 0) faults.push(`${jointed.length} joints engage the gable boards`)

  // And the house stands without them.
  const structural = [
    coreCheckBuildOrder(PACK, without),
    checkJoints(without),
    checkMeshes(without),
  ]
  for (const result of structural) {
    if (result.status === 'fail') faults.push(`without the boards, ${result.key} fails`)
  }

  // They stand outside the roof rather than in it.
  const inside = boards.filter((p) => Math.abs(partBounds(p).min[2]) < layout.eaveHalfZ - TOL)
  if (inside.length > 0) faults.push(`${inside.length} boards are set into the roof rather than onto it`)

  const ok = faults.length === 0
  return {
    key: 'rank-carries-nothing',
    titleId: 'Papan pangkat tidak memikul apa pun: cabut semuanya dan rumahnya tetap berdiri',
    titleEn: 'The rank boards hold nothing up: take them all off and the house still stands',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${boards.length} papan pada dua pelana, tidak satu pun bersambungan, semuanya di luar bidang atap — dan seluruh pemeriksaan struktur tetap lulus tanpa mereka. Ini satu-satunya pemeriksaan dalam projek ini yang pokok soalnya adalah apa yang tidak dilakukan sebuah bagian. Penanda pangkat yang memikul beban adalah pangkat yang tidak bisa didustakan; seluruh dayanya justru terletak pada bisa.`
      : faults.join('; '),
    detailEn: ok
      ? `${boards.length} boards across two gables, not one of them jointed, every one outside the roof plane — and every structural check still passes without them. It is the only check in this project whose subject is what a part does not do. A rank marker that carried load would be a rank nobody could lie about; its whole force is that they can.`
      : faults.join('; '),
  }
}

/** The count is odd, and within what this household may claim. */
export function checkRankIsEntitled(layout: Layout): CheckResult {
  const info = rumahInfo(layout.rules.rumah)
  const n = layout.rules.timpa
  const faults: string[] = []
  if (n % 2 === 0) faults.push(`${n} is even`)
  if (n < info.minTimpa || n > info.maxTimpa) {
    faults.push(`${n} is outside what a ${info.name} may claim (${info.minTimpa}–${info.maxTimpa})`)
  }
  const ok = faults.length === 0
  return {
    key: 'entitled',
    titleId: 'Jumlah papannya ganjil, dan tidak melebihi hak rumah tangganya',
    titleEn: 'The board count is odd, and within what the household is entitled to',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${n} papan pada ${info.name}, dalam batas ${info.minTimpa}–${info.maxTimpa}. Batas itu bukan batas bangunan: sebuah bola sanggup memikul tujuh papan tanpa terasa, yang menahannya adalah bahwa tujuh bukan haknya. Ini satu-satunya batas dalam projek ini yang menolak angka yang sebenarnya sanggup dibangun.`
      : faults.join('; '),
    detailEn: ok
      ? `${n} boards on a ${info.name}, within ${info.minTimpa}–${info.maxTimpa}. That limit is not a limit of the building: a bola would carry seven boards without noticing, and what stops it is that seven is not its to claim. It is the only bound in this project that refuses a number the building could perfectly well take.`
      : faults.join('; '),
  }
}

/** The stack climbs the gable rather than overflowing it. */
export function checkRankFitsTheGable(layout: Layout): CheckResult {
  const faults: string[] = []
  let previous = Infinity
  for (const board of layout.timpa) {
    if (board.y > layout.ridgeY - TOL) faults.push(`board ${board.index + 1} stands above the ridge`)
    if (board.halfSpan <= 0) faults.push(`board ${board.index + 1} has no length`)
    if (board.halfSpan > previous + TOL) faults.push(`board ${board.index + 1} is wider than the one below it`)
    previous = board.halfSpan
  }
  const ok = faults.length === 0 && layout.timpa.length > 0
  const top = layout.timpa[layout.timpa.length - 1]
  return {
    key: 'rank-fits',
    titleId: 'Susunan papan menaiki pelana dan tidak melimpahinya',
    titleEn: 'The stack climbs the gable rather than overflowing it',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.timpa.length} papan, dari ${(layout.timpa[0]?.halfSpan ?? 0) * 2} m menyempit ke ${((top?.halfSpan ?? 0) * 2).toFixed(2)} m, berhenti ${(layout.ridgeY - (top?.y ?? 0)).toFixed(2)} m di bawah bubungan. Panjang tiap papan diambil dari pelananya, bukan ditetapkan sendiri — jadi tujuh papan pada rumah kecil tetap terbaca sebagai tujuh papan.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.timpa.length} boards, narrowing to ${((top?.halfSpan ?? 0) * 2).toFixed(2)} m and stopping ${(layout.ridgeY - (top?.y ?? 0)).toFixed(2)} m below the ridge. Each board's length is taken from the gable rather than declared — so seven boards on a small house still read as seven boards.`
      : faults.join('; '),
  }
}

/** Three worlds, stacked, and the highest is the one that feeds the household. */
export function checkThreeWorlds(house: House, layout: Layout): CheckResult {
  const faults: string[] = []
  if (layout.awaBola <= TOL) faults.push('there is no space beneath')
  if (layout.aleBola <= TOL) faults.push('there is no body')
  if (!house.parts.some((p) => p.stage === 'rakkeang')) faults.push('there is no loft')
  const loft = house.parts.find((p) => p.id === 'rakkeang')
  if (loft && partBounds(loft).min[1] < layout.eaveY - TOL) faults.push('the loft is not above the body')
  const ok = faults.length === 0
  return {
    key: 'three-worlds',
    titleId: 'Tiga dunia bertumpuk, dan yang tertinggi adalah yang menghidupi',
    titleEn: 'Three worlds stacked, and the highest is the one that feeds the household',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Awa bola ${layout.awaBola.toFixed(2)} m untuk ternak dan kerja, ale bola ${layout.aleBola.toFixed(2)} m untuk orang, rakkeang di atasnya untuk padi. Tongkonan juga membagi tiga; bedanya ada pada apa yang ditaruh paling atas.`
      : faults.join('; '),
    detailEn: ok
      ? `An awa bola of ${layout.awaBola.toFixed(2)} m for livestock and work, an ale bola of ${layout.aleBola.toFixed(2)} m for people, and the rakkeang above it for rice. The tongkonan divides into three as well; the difference is what is put at the top.`
      : faults.join('; '),
  }
}

/** Every beam passes through its post rather than sitting on it. */
export function checkThreadedFrame(house: House): CheckResult {
  const threaded = house.joints.filter((j) => j.kind === 'pattolo')
  const ok = threaded.length > 0 && threaded.every((j) => j.mortise.startsWith('alliri-'))
  return {
    key: 'threaded',
    titleId: 'Balok menembus tiang, bukan duduk di atasnya',
    titleEn: 'The beams pass through the posts rather than sitting on them',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${threaded.length} sambungan tembus. Rangkanya dirakit dan dipasak, bukan dipaku — dan itulah sebabnya rumah ini bisa diangkat dari batunya dan dipindahkan utuh, yang memang dilakukan. Bangunan yang bisa dipindahkan bukan bangunan yang terikat pada sebidang tanah.`
      : `${threaded.length} sambungan tembus.`,
    detailEn: ok
      ? `${threaded.length} threaded joints. The frame is assembled and pegged rather than nailed — which is why this house can be lifted off its stones and carried away whole, and is. A building you can move is not a building tied to a plot.`
      : `${threaded.length} threaded joints.`,
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
    titleId: 'Lapis nipah saling menindih tanpa celah, dari tepi atap sampai bubungan',
    titleEn: 'Thatch courses lap with no bare band, from the eave to the ridge',
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
    checkRankCarriesNothing(house, layout),
    checkRankIsEntitled(layout),
    checkRankFitsTheGable(layout),
    checkThreeWorlds(house, layout),
    checkThreadedFrame(house),
    checkThatchCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
