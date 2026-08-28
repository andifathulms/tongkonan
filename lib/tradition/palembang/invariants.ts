/**
 * The checks that are claims about the rumah limas.
 *
 * The generic half comes from the core unchanged for the ninth time.
 *
 * `checkAxesAreIndependent` is the one no earlier house could make. In the
 * other eight a plan is one thing: change a rule and the whole footprint moves
 * with it. Here the two axes carry different kinds of statement — the depth is
 * a social sequence and the width is only size — so the check rebuilds the
 * house across both rules and asserts that each moves its own axis and leaves
 * the other exactly where it was. A model in which widening the house also
 * lengthened the guest list would be saying something false about the
 * tradition, and it would look completely reasonable.
 *
 * `checkStepsRise` is the plainest and the most important. The floor has to go
 * up, in order, by equal steps, from the street to the family — because that
 * sequence *is* the hierarchy, and a floor that stepped down anywhere would be
 * seating an honoured guest below a stranger.
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
import { DIMS, PACK, levelsFor } from './rules'
import { resolveLayout } from './frame'
import { roofLevels, tileBands } from './roof'
import type { House, Layout } from './types'

export { checkAgainstSurvey, checkJoints, checkMeshes, partBounds, summarise } from '@/lib/core/invariants'
export type { CheckResult, CheckStatus } from '@/lib/core/invariants'

const TOL = 1e-4

/**
 * The building mirrors about z = 0 — the axis that carries nothing.
 *
 * Worth saying which axis this is. The house is deliberately not symmetric
 * front to back, because front to back is where it makes its statement; it is
 * symmetric across, because across is only width. So a mirror check here is a
 * claim about the *plain* axis, and the label says so rather than letting a
 * reader take it for a claim about the building's whole geometry.
 */
export function checkFrameSymmetry(house: House): CheckResult {
  return checkSymmetry(house, {
    axis: 2,
    include: () => true,
    labelId: 'Simetris terhadap sumbu lebar — sumbu yang tidak membawa apa-apa',
    labelEn: 'Symmetric about the width axis — the one that carries nothing',
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

/* ── The floor is the hierarchy ───────────────────────────────────────── */

/** The floor rises, in order, in equal steps, from the street to the family. */
export function checkStepsRise(layout: Layout): CheckResult {
  const faults: string[] = []
  const want = layout.rules.kekijing
  if (layout.levels.length !== want) faults.push(`${layout.levels.length} levels for a ${want}-step house`)

  for (let i = 1; i < layout.levels.length; i++) {
    const below = layout.levels[i - 1]
    const above = layout.levels[i]
    if (!below || !above) continue
    const rise = above.y - below.y
    if (rise <= TOL) faults.push(`${above.nameEn} does not stand above the ${below.nameEn}`)
    else if (Math.abs(rise - layout.stepRise) > 1e-6) faults.push(`${above.nameEn} rises by an odd amount`)
    if (above.x <= below.x) faults.push(`${above.nameEn} is not deeper into the house than the ${below.nameEn}`)
  }

  const first = layout.levels[0]
  const last = layout.levels[layout.levels.length - 1]
  if (first && last && last.y <= first.y) faults.push('the sequence does not rise overall')

  const ok = faults.length === 0
  const total = last && first ? last.y - first.y : 0
  return {
    key: 'steps-rise',
    titleId: 'Lantai naik bertingkat, berurutan, dari jalan sampai keluarga',
    titleEn: 'The floor rises in order, step by step, from the street to the family',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.levels.length} tingkat, tiap satunya ${layout.stepRise.toFixed(2)} m di atas yang sebelumnya, seluruhnya naik ${total.toFixed(2)} m dari ${first?.nameId} sampai ${last?.nameId}. Urutan inilah kedudukan: lantai yang turun di mana pun akan mendudukkan tamu terhormat di bawah orang asing.`
      : faults.join('; '),
    detailEn: ok
      ? `${layout.levels.length} levels, each ${layout.stepRise.toFixed(2)} m above the last, rising ${total.toFixed(2)} m in all from the ${first?.nameEn} to the ${last?.nameEn}. That sequence is the standing: a floor that stepped down anywhere would seat an honoured guest below a stranger.`
      : faults.join('; '),
  }
}

/**
 * The depth is social and the width is not, and neither moves the other.
 *
 * The check this house exists to make. Rebuilds across both rules and asserts
 * that changing the guest list leaves the width alone, and that widening the
 * house leaves the guest list alone. No other pack here could state it,
 * because in every other house a plan is a single thing.
 */
export function checkAxesAreIndependent(layout: Layout): CheckResult {
  const faults: string[] = []
  const base = layout.rules

  // Changing the width must not touch the sequence.
  const narrow = resolveLayout({ ...base, lebar: 3 })
  const wide = resolveLayout({ ...base, lebar: 7 })
  if (narrow.levels.length !== wide.levels.length) faults.push('widening the house changed the number of levels')
  if (Math.abs(narrow.halfX - wide.halfX) > 1e-6) faults.push('widening the house changed its depth')
  if (Math.abs(narrow.topY - wide.topY) > 1e-6) faults.push('widening the house changed how high the sequence reaches')
  if (Math.abs(wide.halfZ - narrow.halfZ) < 1e-6) faults.push('widening the house did not widen it')

  // Changing the sequence must not touch the width.
  const short = resolveLayout({ ...base, kekijing: 3 })
  const long = resolveLayout({ ...base, kekijing: 5 })
  if (Math.abs(short.halfZ - long.halfZ) > 1e-6) faults.push('adding levels changed the width')
  if (short.levels.length !== 3 || long.levels.length !== 5) faults.push('the level count did not follow the rule')
  if (long.halfX <= short.halfX) faults.push('adding levels did not deepen the house')

  const ok = faults.length === 0
  return {
    key: 'axes',
    titleId: 'Kedalaman membawa urutan sosial, lebar hanya membawa ukuran, dan keduanya tidak saling menggerakkan',
    titleEn: 'The depth carries the sequence, the width carries only size, and neither moves the other',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Menambah kekijing memperdalam rumah dari ${(short.halfX * 2).toFixed(2)} m menjadi ${(long.halfX * 2).toFixed(2)} m dan tidak mengubah lebarnya sama sekali; melebarkan rumah dari ${(narrow.halfZ * 2).toFixed(2)} m menjadi ${(wide.halfZ * 2).toFixed(2)} m dan tidak menambah satu tingkat pun. Delapan rumah lain dalam projek ini memperlakukan denah sebagai satu hal; model yang melebar sekaligus memanjangkan daftar tamu akan menyatakan sesuatu yang tidak benar dan tampak sangat masuk akal.`
      : faults.join('; '),
    detailEn: ok
      ? `Adding kekijing deepens the house from ${(short.halfX * 2).toFixed(2)} m to ${(long.halfX * 2).toFixed(2)} m and does not touch its width; widening it runs from ${(narrow.halfZ * 2).toFixed(2)} m to ${(wide.halfZ * 2).toFixed(2)} m and adds not one level. The other eight houses here treat a plan as one thing; a model that lengthened the guest list by widening the house would say something untrue and look entirely reasonable.`
      : faults.join('; '),
  }
}

/** A person enters at the lowest level, and the gallery is the threshold. */
export function checkEntryIsLowest(house: House, layout: Layout): CheckResult {
  const gallery = house.parts.find((p) => p.id === 'tenggalung-lantai')
  const first = layout.levels[0]
  const faults: string[] = []
  if (!gallery) faults.push('there is no front gallery')
  if (!first) faults.push('there are no levels')
  if (gallery && first) {
    const b = partBounds(gallery)
    if (b.max[0] > first.x - first.depth / 2 + TOL) faults.push('the gallery reaches into the first level')
    if (Math.abs(b.min[1] - first.y) > 0.01) faults.push('the gallery is not at the level of the first step')
  }
  for (const level of layout.levels) {
    if (first && level.y < first.y - TOL) faults.push(`${level.nameEn} lies below the level a person enters at`)
  }
  const ok = faults.length === 0
  return {
    key: 'entry',
    titleId: 'Orang masuk pada tingkat terendah, dan galeri depan adalah ambang, bukan anak tangga',
    titleEn: 'A person enters at the lowest level, and the front gallery is a threshold rather than a step',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `Pagar tenggalung sedalam ${layout.tenggalung.depth.toFixed(2)} m pada ketinggian yang sama dengan ${first?.nameId}. Menaruhnya satu tingkat lebih rendah akan menjadikan rumah bertingkat lima sebagai rumah bertingkat enam, dan diam-diam memberi rumah tangga ini satu pembedaan yang tidak pernah diakuinya.`
      : faults.join('; '),
    detailEn: ok
      ? `A pagar tenggalung ${layout.tenggalung.depth.toFixed(2)} m deep, at the same height as the ${first?.nameEn}. Putting it one rise lower would make a five-step house into a six-step one, and quietly give this household a distinction it never claimed.`
      : faults.join('; '),
  }
}

/**
 * Every rank of posts stands to its own level.
 *
 * The sequence is legible from underneath before a board is laid, and this is
 * what says so. It is not a restatement of `checkStepsRise`: that one asks
 * about the floors, this one asks whether the structure carrying them actually
 * differs, which a model could easily get wrong by standing every post to the
 * same height and letting the boards float.
 */
export function checkPostsFollowTheSteps(house: House, layout: Layout): CheckResult {
  const heights = new Set<string>()
  for (const part of house.parts) {
    /*
     * The level-carrying ranks only.
     *
     * `tiang-muka-N` are the gallery posts, which run to the eave to hold the
     * front plate and say nothing about the sequence — a prefix match counted
     * them and reported one more post length than there are levels.
     */
    if (!/^tiang-\d+-\d+$/.test(part.id)) continue
    heights.add(partBounds(part).max[1].toFixed(3))
  }
  // One height per level, plus the front rank at the gallery's level — which
  // shares the first level's height, so the count is the level count.
  const ok = heights.size === layout.levels.length && heights.size > 1
  return {
    key: 'posts',
    titleId: 'Tiap barisan tiang berdiri setinggi tingkatnya sendiri',
    titleEn: 'Every rank of posts stands to its own level',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${heights.size} panjang tiang yang berbeda untuk ${layout.levels.length} tingkat. Urutan sosial rumah ini sudah terbaca dari kolongnya sebelum satu papan pun dipasang — dan itulah sebabnya pemeriksaan ini bukan pengulangan pemeriksaan lantai.`
      : `${heights.size} panjang tiang yang berbeda untuk ${layout.levels.length} tingkat.`,
    detailEn: ok
      ? `${heights.size} distinct post lengths for ${layout.levels.length} levels. This house’s social sequence is legible from underneath before a single board is laid — which is why this is not a restatement of the floor check.`
      : `${heights.size} distinct post lengths for ${layout.levels.length} levels.`,
  }
}

/** The topmost level still has headroom under the roof. */
export function checkHeadroom(layout: Layout): CheckResult {
  const top = layout.levels[layout.levels.length - 1]
  const clear = top ? layout.eaveY - top.y : 0
  const ok = clear > 1.9
  return {
    key: 'headroom',
    titleId: 'Tingkat teratas masih punya kepala di bawah atapnya',
    titleEn: 'The topmost level still has headroom under its roof',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${clear.toFixed(2)} m di atas ${top?.nameId}. Dindingnya satu papan dari lantai terendah, dan atapnya tidak ikut bertingkat — jadi tiap kekijing memakan kepala di atasnya. Rumah tangga yang membedakan tamunya makin tegas pada akhirnya tidak bisa berdiri tegak di gegajahnya sendiri.`
      : `hanya ${clear.toFixed(2)} m di atas ${top?.nameId}: urutannya sudah memakan habis udara di bawah atapnya.`,
    detailEn: ok
      ? `${clear.toFixed(2)} m above the ${top?.nameEn}. The wall is one board from the lowest floor and the roof does not step with it — so every kekijing eats into the air above it. A household distinguishing its guests ever more sharply eventually cannot stand up in its own gegajah.`
      : `only ${clear.toFixed(2)} m above the ${top?.nameEn}: the sequence has eaten the air under its own roof.`,
  }
}

/** The lattice screens without enclosing: bars, not a panel. */
export function checkLattice(house: House, layout: Layout): CheckResult {
  const bars = house.parts.filter((p) => p.id.startsWith('kisi-'))
  const ok = layout.tenggalung.screened ? bars.length > 4 : bars.length === 0
  return {
    key: 'lattice',
    titleId: 'Kisi-kisi menyekat tanpa menutup: batang, bukan bidang',
    titleEn: 'The lattice screens without enclosing: bars, not a panel',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? layout.tenggalung.screened
        ? `${bars.length} batang berjarak ${DIMS.kisiPitch.value.toFixed(2)} m. Sekat yang bisa dilihat tembus bukan dinding, dan sebuah bidang utuh akan menyatakan bahwa ia dinding.`
        : `Tidak ada kisi-kisi: rumah tangga ini menerima menurut aturan jalan.`
      : `${bars.length} batang kisi-kisi.`,
    detailEn: ok
      ? layout.tenggalung.screened
        ? `${bars.length} bars at ${DIMS.kisiPitch.value.toFixed(2)} m. A screen you can see through is not a wall, and a solid panel would have said it was.`
        : `No lattice: this household receives on the street’s terms.`
      : `${bars.length} lattice bars.`,
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

/** Tile courses lap with no bare band, from the eave to the ridge. */
export function checkTileCoverage(layout: Layout): CheckResult {
  const bands = tileBands(layout)
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
    key: 'tile-coverage',
    titleId: 'Lapis genteng saling menindih tanpa celah, dari tepi atap sampai bubungan',
    titleEn: 'Tile courses lap with no bare band, from the eave to the ridge',
    status: ok ? 'pass' : 'fail',
    detail: ok ? `${bands.length} lapis menutupi ${hipRun(roofLevels(layout)).toFixed(2)} m kemiringan.` : gaps.join('; '),
    detailEn: ok ? `${bands.length} courses over ${hipRun(roofLevels(layout)).toFixed(2)} m of slope.` : gaps.join('; '),
  }
}

/** The level table gives the right names for the right count. */
export function checkLevelNames(layout: Layout): CheckResult {
  const names = levelsFor(layout.rules.kekijing)
  const ok =
    names.length === layout.levels.length &&
    names.every((n, i) => layout.levels[i]?.key === n.key) &&
    layout.levels[0]?.key === 'jogan' &&
    layout.levels[layout.levels.length - 1]?.key === 'gegajah'
  return {
    key: 'level-names',
    titleId: 'Tiap tingkat bernama, dan urutannya bermula di jalan dan berakhir pada keluarga',
    titleEn: 'Every level is named, and the sequence begins at the street and ends at the family',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? `${layout.levels.map((l) => l.nameId).join(' → ')}. Rumah bertingkat tiga mempertahankan yang pertama, yang tengah dan yang terakhir; dua pembedaan yang dilepaskannya ada di antaranya, dan itulah arti daftar tamu yang lebih pendek.`
      : `Urutan tingkat tidak sesuai dengan tabelnya.`,
    detailEn: ok
      ? `${layout.levels.map((l) => l.nameEn).join(' → ')}. A three-step house keeps the first, the middle and the last; the two distinctions it drops are the ones in between, and that is what a shorter guest list means.`
      : `The level sequence does not match the table.`,
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
    checkStepsRise(layout),
    checkAxesAreIndependent(layout),
    checkLevelNames(layout),
    checkEntryIsLowest(house, layout),
    checkPostsFollowTheSteps(house, layout),
    checkHeadroom(layout),
    checkLattice(house, layout),
    checkFrameInsideRoof(house, layout),
    checkTileCoverage(layout),
    checkPartProvenance(house),
    checkAgainstSurvey(),
  ]
}
