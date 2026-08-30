/**
 * The rule pack for the Korowai khaim.
 *
 * The twenty-fourth pack, and the first whose principal support is alive.
 *
 * `livingSupport` is canon and it is the reason this building is here. A
 * wanbon is topped at the height the floor will sit, the floor is framed into
 * what is left, and the tree goes on living: it keeps its roots, it keeps
 * putting out shoots, and it keeps thickening. Nothing else in this project
 * has a structure that changes after the builders have gone home.
 *
 * `heightIsTheDefence` is the second, and it is what makes the empty air under
 * the floor part of the building rather than a by-product. Twenty-three
 * buildings here have a clearance under the floor that follows from something
 * else — a storey, a step, a tide, a slab. This one has a clearance that *is*
 * the statement, and the sources are plain that it is about being out of
 * reach: of raids, of neighbours, of the mud and of what lives in it.
 *
 * `twoSides` divides the floor into a women's side and a men's side, each with
 * its own hearth and its own way up. The Karo house holds eight households in
 * one room with no partition at all; this one holds two sides in one room with
 * exactly one, which is the same problem answered by putting a single wall in.
 *
 * `hearthCanBeDropped` is the one that is easiest to miss and hardest to
 * model honestly. A hearth is a clay slab on a light frame, hung in an opening
 * in the floor; if it flares, it is cut loose and falls to the ground. So the
 * floor is required to be *open* under every fire, in a building otherwise
 * made entirely of bark and leaf, twenty metres up.
 *
 * On the metres: every one of them is the author's. The ethnography is good on
 * how these houses are used and thin on how they are dimensioned, and the one
 * figure everybody quotes — the height — is the one most distorted in
 * circulation. See the caution in the facade.
 */

import type { RulePack } from '@/lib/core/kinds'
import type { Split } from '@/lib/core/provenance'
import {
  dimFactory,
  partClass as corePartClass,
  partSplit as corePartSplit,
  provenanceSplit as coreProvenanceSplit,
  worstClass as coreWorstClass,
} from '@/lib/core/provenance'
import { STAGE_ORDER } from './types'
import type {
  Dim,
  KorowaiKinds,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  Tinggi,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'vanenk-devries-1997',
    citation:
      'van Enk, G. J. & de Vries, L., The Korowai of Irian Jaya: Their Language in Its Cultural ' +
      'Context (Oxford University Press, New York, 1997).',
    kind: 'ethnography',
  },
  {
    key: 'stasch-2009',
    citation:
      'Stasch, R., Society of Others: Kinship and Mourning in a West Papuan Place ' +
      '(University of California Press, Berkeley, 2009).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Irian Jaya (Departemen Pendidikan dan Kebudayaan, ' +
      'Jakarta, 1986).',
    kind: 'reference',
  },
  {
    key: 'none',
    citation: 'Tidak ada sumber. Nilai ini ditetapkan penulis untuk menutup celah.',
    kind: 'none',
  },
]

export function sourceFor(key: SourceKey): Source {
  const found = SOURCES.find((s) => s.key === key)
  if (!found) throw new Error(`unknown source key: ${key}`)
  return found
}

/* ── Dimensions ───────────────────────────────────────────────────────── */

const dim = dimFactory<SourceKey>()

export const DIMS = {
  /* the three heights, held as dimensions so the rule can be pushed */
  heightLow: dim(5.5, 'm', 'interpolated', 'none', 'Tinggi lantai untuk rumah rendah. Ini tinggi yang paling sering benar-benar dibangun, dan yang paling jarang difoto.', 'Floor height for a low house. This is the height most often actually built, and the one least often photographed.'),
  heightMid: dim(11, 'm', 'interpolated', 'none', 'Tinggi lantai untuk rumah sedang.', 'Floor height for a middling house.'),
  heightTall: dim(22, 'm', 'interpolated', 'none', 'Tinggi lantai untuk rumah tinggi. Rumah setinggi ini ada, tetapi jarang, dan angka-angka yang beredar di luar sana lebih besar lagi karena alasan yang tidak ada hubungannya dengan membangun rumah.', 'Floor height for a tall house. Houses this high exist but are rare, and the figures in circulation are larger still for reasons that have nothing to do with building a house.'),

  /* the tree in the middle, which is the only part of this building that grows */
  trunkBase: dim(0.95, 'm', 'interpolated', 'none', 'Garis tengah batang wanbon di permukaan tanah.', 'Diameter of the wanbon trunk at ground level.'),
  trunkTaper: dim(0.018, 'ratio', 'interpolated', 'none', 'Berapa meter garis tengah batang berkurang untuk tiap meter naik. Angka pohon, bukan angka tukang — dan justru itu sebabnya ia dapat mematahkan tinggi yang dipilih orang.', 'How much diameter the trunk loses per metre of height. A number belonging to the tree rather than to the builder — which is exactly why it can defeat a height somebody chose.'),
  trunkBearing: dim(0.28, 'm', 'interpolated', 'none', 'Garis tengah batang terkecil yang masih boleh memikul lantai.', 'The least trunk diameter that may still carry a floor.'),
  trunkAboveRidge: dim(2.4, 'm', 'interpolated', 'none', 'Tinggi tunas dan sisa batang di atas bubungan. Ini satu-satunya bagian bangunan dalam projek ini yang bertambah panjang setelah tukangnya pulang.', 'Height of the shoots and the remaining stem above the ridge. It is the only part of a building in this project that goes on getting longer after the builders have gone home.'),
  postSection: dim(0.16, 'm', 'interpolated', 'none', 'Sisi penampang tiang kayu yang berdiri mengelilingi pohon.', 'Section of a cut pole standing around the tree.'),

  /* the floor */
  bayLength: dim(2.6, 'm', 'interpolated', 'none', 'Panjang lantai untuk tiap perapian. Satu perapian satu rumah tangga, dan lantai memanjang menurut hitungan itu.', 'Length of floor for each hearth. One hearth is one household, and the floor lengthens by that count.'),
  floorWidth: dim(4.2, 'm', 'interpolated', 'none', 'Lebar lantai, dari sisi perempuan ke sisi laki-laki.', 'Width of the floor, from the women’s side to the men’s.'),
  joistDepth: dim(0.14, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar lantai.', 'Depth of a floor bearer.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal lantai dari pelepah dan kulit kayu.', 'Thickness of the floor of split palm and bark.'),

  /* the room over it */
  wallHeight: dim(1.85, 'm', 'interpolated', 'none', 'Tinggi dinding kulit kayu.', 'Height of the bark walls.'),
  wallThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal lembar kulit kayu.', 'Thickness of a bark sheet.'),
  partitionThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal sekat antara kedua sisi. Satu-satunya sekat di dalam bangunan ini, dan seluruh pembagiannya.', 'Thickness of the partition between the two sides. It is the only partition in this building, and it is the whole division.'),
  roofRise: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas dinding.', 'Rise of the ridge above the wall.'),
  roofOverhang: dim(0.5, 'm', 'interpolated', 'none', 'Tritisan atap daun sagu.', 'Overhang of the sago-leaf roof.'),
  roofThickness: dim(0.12, 'm', 'interpolated', 'none', 'Tebal lapisan daun sagu.', 'Thickness of the sago-leaf roofing.'),

  /* the fires, and the hole each of them hangs in */
  hearthSide: dim(0.95, 'm', 'interpolated', 'none', 'Sisi lempeng tanah liat tempat api dinyalakan.', 'Side of the clay slab a fire is lit on.'),
  hearthThickness: dim(0.16, 'm', 'interpolated', 'none', 'Tebal lempeng tanah liat.', 'Thickness of the clay slab.'),
  hearthClear: dim(0.3, 'm', 'interpolated', 'none', 'Jarak bebas di sekeliling lubang tempat perapian tergantung, supaya api yang dilepas benar-benar jatuh ke tanah dan tidak menyangkut di rangka.', 'Clearance around the opening a hearth hangs in, so that a fire cut loose actually falls to the ground rather than catching on the frame.'),

  /* the way up, which is taken away */
  ladderWidth: dim(0.26, 'm', 'interpolated', 'none', 'Lebar batang bertakik yang dipakai naik.', 'Width of the notched pole climbed to get up.'),
  ladderLean: dim(1.6, 'm', 'interpolated', 'none', 'Sejauh mana kaki tangga berdiri dari tiang. Tangga hanya disandarkan, dan pada malam hari ia ditarik naik.', 'How far the foot of the ladder stands out from the post. The ladder only leans, and at night it is pulled up.'),

  /* the ground, which is cleared rather than built on */
  clearingRadius: dim(15, 'm', 'interpolated', 'none', 'Jari-jari tanah yang dibuka di sekeliling rumah, supaya tidak ada pohon yang dapat tumbang menimpanya atau dipakai orang untuk mencapainya. Ini satu-satunya ukuran tapak dalam projek ini yang merupakan jarak aman, bukan tata letak.', 'Radius of ground cleared around the house, so that no tree can fall on it or be used by anybody to reach it. It is the only site figure in this project that is a safe distance rather than an arrangement.'),
  stumpRadius: dim(0.45, 'm', 'interpolated', 'none', 'Jari-jari tunggul yang ditinggalkan di tanah yang dibuka.', 'Radius of a stump left standing in the cleared ground.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  livingSupport: dim(1, 'count', 'canon', 'vanenk-devries-1997', 'Tiang utamanya adalah pohon yang masih hidup: sebatang wanbon dipotong pucuknya setinggi lantai, akarnya tetap di tanah, dan tunasnya tetap tumbuh. Dua puluh tiga bangunan lain dalam projek ini berdiri di atas sesuatu yang mati — batu, tiang pancang, pasangan, lereng, lunas, bahu orang. Yang ini berdiri di atas sesuatu yang punya nama jenis, yang lingkarnya berubah tiap tahun, dan yang dapat mati sementara rumahnya masih ditinggali.', 'Its principal post is a living tree: a wanbon topped off at floor height, its roots still in the ground and its shoots still growing. The other twenty-three buildings in this project stand on something dead — stone, piles, masonry, a hillside, a keel, people’s shoulders. This one stands on something with a species, a girth that changes every year, and that can die while the house is still lived in.'),
  heightIsTheDefence: dim(1, 'count', 'canon', 'stasch-2009', 'Tinggi lantai adalah maksud bangunannya, bukan akibat dari hal lain. Rumah didirikan di luar jangkauan — dari serbuan, dari tetangga, dari lumpur dan dari apa yang hidup di dalamnya. Karena itu udara kosong di bawah lantai adalah bagian dari bangunan, dan tidak boleh ada apa pun di sana.', 'The height of the floor is the point of the building rather than a consequence of something else. A house is put up out of reach — of raids, of neighbours, of the mud and of what lives in it. So the empty air under the floor is part of the building, and nothing may be in it.'),
  twoSides: dim(2, 'count', 'canon', 'vanenk-devries-1997', 'Lantainya dibagi dua: sisi perempuan dan sisi laki-laki, masing-masing dengan perapiannya sendiri dan jalan naiknya sendiri, dipisahkan satu sekat. Siwaluh jabu Karo menampung delapan rumah tangga dalam satu ruang tanpa sekat sama sekali; yang ini menampung dua sisi dalam satu ruang dengan tepat satu sekat.', 'The floor is divided in two: a women’s side and a men’s side, each with its own hearth and its own way up, separated by one partition. The Karo siwaluh jabu holds eight households in one room with no partition at all; this one holds two sides in one room with exactly one.'),
  hearthCanBeDropped: dim(1, 'count', 'canon', 'stasch-2009', 'Perapian adalah lempeng tanah liat di atas rangka ringan, tergantung pada lubang di lantai. Kalau apinya membesar, ikatannya diputus dan seluruh perapian dijatuhkan ke tanah. Karena itu lantai justru harus terbuka di bawah tiap api, pada bangunan yang seluruhnya kulit kayu dan daun, dua puluh meter di atas tanah.', 'A hearth is a clay slab on a light frame, hung in an opening in the floor. If the fire flares, its lashings are cut and the whole hearth is dropped to the ground. So the floor is required to be open under every fire, on a building made entirely of bark and leaf, twenty metres up.'),
  ladderIsTakenAway: dim(1, 'count', 'canon', 'vanenk-devries-1997', 'Jalan naiknya sebatang kayu bertakik yang hanya disandarkan, dan malam hari ditarik naik. Tinggi tidak menjaga apa pun kalau tangganya tetap terpasang, jadi bagian bangunan ini justru dirancang untuk tidak tersambung.', 'The way up is a notched pole that only leans, and at night it is pulled up. Height defends nothing if the ladder stays in place, so this part of the building is designed not to be attached.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tiang: 2.4,
  lantai: 1.8,
  dinding: 1.2,
  atap: 1.6,
  perapian: 0.8,
  tangga: 0.4,
}

export const PACK: RulePack<KorowaiKinds> = {
  key: 'korowai',
  dimKeys: DIM_KEYS,
  dim: (key) => DIMS[key],
  sources: SOURCES,
  sourceFor,
  stageOrder: STAGE_ORDER,
  stageWeight: (stage) => STAGE_WEIGHT[stage],
}

/* ── Provenance, bound to this pack ───────────────────────────────────── */

export function worstClass(keys: readonly DimKey[]): ProvenanceClass {
  return coreWorstClass(PACK, keys)
}

export function partClass(part: Pick<Part, 'dims'>): ProvenanceClass {
  return corePartClass(PACK, part)
}

export function partSplit(parts: readonly Pick<Part, 'dims'>[]): Split {
  return corePartSplit(PACK, parts)
}

export function provenanceSplit(dims: readonly Dim[] = ALL_DIMS): Split {
  return coreProvenanceSplit(dims)
}

/* ── How high ─────────────────────────────────────────────────────────── */

export interface TinggiInfo {
  readonly tinggi: Tinggi
  /** the dimension key, not a copy of its value — see the note in types.ts */
  readonly key: DimKey
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const TINGGI: readonly TinggiInfo[] = [
  {
    tinggi: 'rendah',
    key: 'heightLow',
    name: 'Rendah',
    glossId: 'Setinggi beberapa meter saja. Inilah rumah yang paling sering benar-benar berdiri, dan yang paling jarang muncul di layar.',
    glossEn: 'A few metres up. This is the house most often actually standing, and the one that least often appears on a screen.',
  },
  {
    tinggi: 'sedang',
    key: 'heightMid',
    name: 'Sedang',
    glossId: 'Cukup tinggi untuk berada di luar jangkauan, dan masih dapat dinaiki sambil membawa sesuatu.',
    glossEn: 'High enough to be out of reach, and still climbable with something in your hands.',
  },
  {
    tinggi: 'tinggi',
    key: 'heightTall',
    name: 'Tinggi',
    glossId: 'Rumah yang benar-benar tinggi: jarang, dan setiap meternya harus dipikul oleh batang yang justru semakin tipis semakin ke atas.',
    glossEn: 'A genuinely tall house: rare, and every metre of it has to be carried by a trunk that gets thinner the higher it goes.',
  },
]

export function tinggiInfo(tinggi: Tinggi): TinggiInfo {
  const found = TINGGI.find((t) => t.tinggi === tinggi)
  if (!found) throw new Error(`unknown tinggi: ${tinggi}`)
  return found
}

/** The floor height this rule selects, read live from the pack. */
export function heightOf(tinggi: Tinggi): number {
  return DIMS[tinggiInfo(tinggi).key].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Wanbon dipilih dan dipotong pucuknya setinggi lantai, lalu tiang-tiang kayu didirikan mengelilinginya. Pohonnya tetap hidup; inilah satu-satunya bagian bangunan dalam projek ini yang masih tumbuh.',
    glossEn: 'A wanbon is chosen and topped off at floor height, and cut poles are stood around it. The tree stays alive; it is the only part of a building in this project that is still growing.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Gelagar dipasang ke batang dan ke tiang, lalu lantai pelepah dan kulit kayu ditutupkan — dengan lubang yang sengaja ditinggalkan untuk tiap perapian.',
    glossEn: 'Bearers are framed into the trunk and the poles, and a floor of split palm and bark is laid over them — with an opening deliberately left for each hearth.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding kulit kayu dipasang, dan satu sekat membagi lantai menjadi sisi perempuan dan sisi laki-laki.',
    glossEn: 'Bark walls go on, and one partition divides the floor into a women’s side and a men’s side.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Daun sagu ditutupkan di atas rangka ringan.',
    glossEn: 'Sago leaf is laid over a light frame.',
  },
  {
    stage: 'perapian',
    title: 'Perapian',
    glossId: 'Lempeng tanah liat digantung pada lubangnya masing-masing: satu untuk tiap rumah tangga, dan tiap satunya dapat diputus dan dijatuhkan.',
    glossEn: 'Clay slabs are hung in their openings: one for each household, and every one of them can be cut loose and dropped.',
  },
  {
    stage: 'tangga',
    title: 'Tangga',
    glossId: 'Batang bertakik disandarkan terakhir — dan justru karena hanya disandarkan, ia dapat ditarik naik pada malam hari.',
    glossEn: 'The notched pole is leaned against the house last — and precisely because it only leans, it can be pulled up at night.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { tinggi: 'sedang', perapian: 2, pohon: true }

export const MIN_PERAPIAN = 2
export const MAX_PERAPIAN = 6

/** Two sides, so there are at least two hearths and they come in pairs. */
export function normaliseRules(rules: Rules): Rules {
  const clamped = Math.min(MAX_PERAPIAN, Math.max(MIN_PERAPIAN, Math.round(rules.perapian)))
  return {
    tinggi: rules.tinggi,
    perapian: clamped % 2 === 0 ? clamped : Math.min(MAX_PERAPIAN, clamped + 1),
    pohon: rules.pohon,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
