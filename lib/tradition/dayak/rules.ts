/**
 * The rule pack for the Dayak betang.
 *
 * The seventh pack, and the first whose principal rule is a count with no
 * upper bound in principle. Six houses have had rules that select among fixed
 * options or set a size; this one has a census, and the building is however
 * long the census makes it.
 *
 * That has a consequence for the provenance layer worth stating. In every
 * other pack, a survey would pin the building — measure a tongkonan and its
 * proportions are settled. Measuring one betang settles the *share*: the depth
 * of a bilik, the width of a gallery, the height of a floor. It says nothing
 * about how long the building is, because that is not a property of the
 * building type at all. So the interpolated share here would fall as far as
 * anywhere else with a survey, and the model would still be unable to tell you
 * how long a betang is — which is the correct answer and not a gap.
 *
 * On "Dayak": it is a name for many peoples across Borneo speaking many
 * languages, and their longhouses are not one building. The terms here lean
 * Ngaju and Ot Danum. That is stated on the reading route rather than smoothed
 * over, because a pack that quietly averages a dozen traditions into one
 * "Dayak house" would be doing the thing this project exists to refuse.
 *
 * Nothing here is `measured`.
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
  DayakKinds,
  Dim,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  Tumbuh,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'sellato-1989',
    citation:
      'Sellato, B., Hornbill and Dragon: Arts and Culture of Borneo ' +
      '(Elf Aquitaine, Jakarta / Kuala Lumpur, 1989).',
    kind: 'reference',
  },
  {
    key: 'waterson-1990',
    citation:
      'Waterson, R., The Living House: An Anthropology of Architecture in South-East Asia ' +
      '(Oxford University Press, Singapore, 1990).',
    kind: 'ethnography',
  },
  {
    key: 'schiller-1997',
    citation:
      'Schiller, A., Small Sacrifices: Religious Change and Cultural Identity Among the Ngaju of Indonesia ' +
      '(Oxford University Press, New York, 1997).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-kalteng',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Kalimantan Tengah ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
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
  /* the share — the unit the building is made of */
  shareLength: dim(4.2, 'm', 'interpolated', 'none', 'Panjang bagian satu keluarga di sepanjang rumah. Ini satuan yang menyusun bangunan: panjang seluruh rumah adalah angka ini dikali jumlah keluarga, dan bukan ukuran tersendiri. Satu-satunya rumah dalam projek ini yang panjangnya tidak pernah ditetapkan.', 'Length of one household’s share along the building. This is the unit the building is made of: the whole length is this figure times the household count, and never a dimension of its own. The only house in this project whose length is never declared.'),
  bilikDepth: dim(5.4, 'm', 'interpolated', 'none', 'Dalamnya bilik keluarga, diukur melintang. Bagian rumah yang tertutup dan menjadi milik satu keluarga.', 'Depth of a family’s bilik, measured across the building. The enclosed part, and the part that belongs to one household.'),
  samiDepth: dim(4.6, 'm', 'interpolated', 'none', 'Lebar sami, galeri bersama di muka bilik. Hampir seluas biliknya sendiri — dan itu pernyataan tentang berapa banyak kehidupan di sini dijalani bersama.', 'Width of the sami, the common gallery in front of the bilik. Nearly as deep as the private room itself — which is a statement about how much of life here is lived in common.'),

  /* the substructure */
  floorHeight: dim(2.9, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah. Tinggi karena sungai naik, karena babi dan anjing hidup di kolongnya, dan karena rumah yang tinggi lebih mudah dijaga.', 'Height of the floor above the ground. High because the river rises, because pigs and dogs live beneath it, and because a raised house is easier to hold.'),
  postSection: dim(0.28, 'm', 'interpolated', 'none', 'Sisi penampang tiang ulin.', 'Section of an ironwood post.'),
  postsPerShare: dim(2, 'count', 'interpolated', 'none', 'Banyaknya barisan tiang untuk tiap bagian keluarga. Menambah satu keluarga berarti menambah barisan sebanyak angka ini — jadi tiang pun sebuah cacah, bukan ukuran.', 'Ranks of posts for each household’s share. Adding one household adds this many ranks — so even the posts are a count rather than a dimension.'),
  bearerDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar yang membentang antar tiang.', 'Depth of a bearer spanning between posts.'),
  bearerWidth: dim(0.16, 'm', 'interpolated', 'none', 'Lebar penampang gelagar.', 'Width of a bearer.'),
  floorThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),

  /* the body */
  wallHeight: dim(2.4, 'm', 'interpolated', 'none', 'Tinggi dinding bilik dari lantai sampai balok atas.', 'Height of a bilik wall from the floor to the plate.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),
  partitionThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal sekat antar bilik. Sekat inilah batas antar rumah tangga, dan jumlahnya selalu satu kurang daripada jumlah keluarga.', 'Thickness of a partition between bilik. This partition is the boundary between households, and there is always one fewer of them than there are households.'),
  doorWidth: dim(0.9, 'm', 'interpolated', 'none', 'Lebar pintu dari sami ke bilik. Tiap keluarga punya satu, dan semuanya membuka ke galeri yang sama.', 'Width of the door from the sami into a bilik. Each household has one, and every one of them opens onto the same gallery.'),

  /* the roof */
  ridgeRise: dim(3.4, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap.', 'Rise of the ridge above the eave.'),
  eaveOversail: dim(1.3, 'm', 'interpolated', 'none', 'Panjang tritisan. Panjang, karena galeri di bawahnya harus tetap kering.', 'Depth of the overhang. Generous, because the gallery beneath it has to stay dry.'),
  rafterSection: dim(0.1, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerShare: dim(3, 'count', 'interpolated', 'none', 'Jumlah kasau tiap bagian keluarga.', 'Rafters over each household’s share.'),
  shingleCourseDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis sirap.', 'Exposed depth of one course of shingles.'),
  shingleThickness: dim(0.03, 'm', 'interpolated', 'none', 'Tebal satu lapis sirap yang menonjol dari lapis di bawahnya. Jauh lebih tipis daripada atap rumbut atau ijuk: ini kayu belah, bukan daun.', 'How far a shingle course stands proud of the one below. Far thinner than a thatched roof: this is split wood, not leaf.'),
  shingleLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya. Lebih besar daripada atap daun, karena sirap yang tidak cukup bertindih akan meloloskan air pada sambungannya.', 'The share of a course the course above laps. Greater than on a thatched roof, because a shingle that does not lap enough leaks at its joints.'),
  shingleBed: dim(0.03, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the way in */
  hejotReach: dim(3.6, 'm', 'interpolated', 'none', 'Panjang hejot, batang bertakik yang bersandar pada tepi galeri. Satu-satunya jalan naik, dan pada malam hari ia ditarik ke atas.', 'Length of the hejot, the notched log leaning against the gallery edge. The only way up, and at night it is pulled in.'),
  hejotSection: dim(0.34, 'm', 'interpolated', 'none', 'Sisi penampang hejot.', 'Section of the hejot.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  lengthIsACensus: dim(1, 'count', 'canon', 'waterson-1990', 'Panjang rumah adalah jumlah keluarganya. Rumah bertambah panjang dengan menambahkan bilik demi bilik, jadi ia bisa sepanjang empat puluh meter atau dua ratus tanpa ada perbandingan yang mengatur bedanya — karena panjang itu bukan perbandingan melainkan sensus. Ini satu-satunya bangunan dalam projek ini yang tidak punya ukuran khas.', 'The length of the house is the number of its households. It grows by adding bilik one at a time, so it may be forty metres long or two hundred with no proportion governing the difference — because the length is not a proportion, it is a census. It is the only building in this project with no characteristic size.'),
  onePerHousehold: dim(1, 'count', 'canon', 'sellato-1989', 'Satu bilik untuk tiap keluarga, semuanya sama besar, semuanya membuka ke galeri yang sama. Rumah ini bukan rumah besar yang dibagi-bagi; ia deretan bagian yang setara di bawah satu atap.', 'One bilik per household, all the same size, all opening onto the same gallery. This is not a large house divided up; it is a row of equal shares under one roof.'),
  galleryIsCommon: dim(1, 'count', 'canon', 'schiller-1997', 'Sami membentang sepanjang rumah di muka semua bilik dan menjadi milik semua orang. Di sinilah sebagian besar kehidupan dijalani, dan lebarnya yang hampir sama dengan bilik itu sendiri adalah pernyataan tentang perbandingan itu.', 'The sami runs the length of the house in front of every bilik and belongs to everyone. Most of life is lived on it, and its being nearly as deep as a bilik is a statement about that ratio.'),
  raisedOnPosts: dim(1, 'count', 'canon', 'depdikbud-kalteng', 'Rumah berdiri tinggi di atas tiang ulin.', 'The house stands high on ironwood posts.'),
  oneWayUp: dim(1, 'count', 'canon', 'sellato-1989', 'Naik ke rumah lewat hejot, batang bertakik, dan pada malam hari ia ditarik ke atas. Satu bangunan, satu jalan masuk, dan jalan itu bisa ditiadakan.', 'The way up is the hejot, a notched log, and at night it is pulled in. One building, one way in, and that way can be removed.'),
  ironwood: dim(1, 'count', 'canon', 'sellato-1989', 'Tiang dan sirapnya dari ulin, kayu besi. Bahan inilah alasan bangunan sepanjang ini bisa bertahan berpuluh tahun di iklim yang menghabiskan kayu lain.', 'The posts and shingles are ulin, ironwood. That material is why a building of this length lasts for decades in a climate that consumes other timber.'),

  /* The site: the river, which is the road. */
  facesTheRiver: dim(1, 'count', 'canon', 'sellato-1989', 'Rumah betang berdiri sejajar sungai dengan galerinya menghadap air, dan di Kalimantan sungai adalah jalannya. Panjang rumah ini adalah sensus; letaknya adalah sebuah tepian.', 'A rumah betang stands parallel to the river with its gallery facing the water, and in Borneo the river is the road. This house’s length is a census; its position is a bank.'),
  riverWidth: dim(26, 'm', 'interpolated', 'none', 'Lebar air yang digambar di muka rumah. Sungainya sendiri lebih lebar daripada apa pun yang muat dalam model; ini permukaan air yang cukup untuk menyatakan bahwa rumah berdiri di tepian.', 'Width of the water drawn in front of the house. The river itself is wider than anything that fits in the model; this is enough water surface to state that the house stands on a bank.'),
  bankDrop: dim(0.5, 'm', 'interpolated', 'none', 'Turunnya muka air di bawah tanah tempat rumah berdiri.', 'How far the water surface sits below the ground the house stands on.'),
  riverSetback: dim(14, 'm', 'interpolated', 'none', 'Jarak dari muka rumah ke tepi air.', 'Distance from the front of the house to the water’s edge.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tiang: 1.9,
  gelagar: 1.2,
  lantai: 1.3,
  bilik: 1.6,
  sami: 1.0,
  atap: 2.2,
  hejot: 0.5,
}

export const PACK: RulePack<DayakKinds> = {
  key: 'dayak',
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

/* ── Which end it grows from ──────────────────────────────────────────── */

export interface TumbuhInfo {
  readonly tumbuh: Tumbuh
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const TUMBUH: readonly TumbuhInfo[] = [
  {
    tumbuh: 'hilir',
    name: 'Tumbuh ke hilir',
    glossId: 'Bilik baru ditambahkan di ujung hilir, jadi ujung hulu tetap di tempatnya. Kedudukan sebuah keluarga terbaca dari letaknya di sepanjang rumah, dan cara tumbuh inilah yang menjaga urutan itu.',
    glossEn: 'New bilik are added at the downstream end, so the upstream end stays where it is. A household’s standing is read from its position along the house, and growing this way is what preserves that order.',
  },
  {
    tumbuh: 'hulu',
    name: 'Tumbuh ke hulu',
    glossId: 'Ditambahkan di ujung hulu. Kebalikannya, dan bukan hal yang sama dibalik: yang bergeser adalah ujung yang kedudukannya paling tinggi.',
    glossEn: 'Added at the upstream end. The reverse, and not the same thing reversed: what moves is the end that carries the most standing.',
  },
  {
    tumbuh: 'dua-arah',
    name: 'Tumbuh dua arah',
    glossId: 'Ditambahkan di kedua ujung, jadi bagian tengah tetap. Yang dilakukan rumah ketika ia menerima keluarga lebih cepat daripada ia menyusun kedudukannya.',
    glossEn: 'Added at both ends, so the middle stays put. What a house does when it is taking in families faster than it is ranking them.',
  },
]

export function tumbuhInfo(tumbuh: Tumbuh): TumbuhInfo {
  const found = TUMBUH.find((t) => t.tumbuh === tumbuh)
  if (!found) throw new Error(`unknown tumbuh: ${tumbuh}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang ulin ditegakkan, sebanyak yang diperlukan bagian keluarga yang ada. Menambah keluarga berarti menambah barisan tiang: bahkan rangkanya pun sebuah cacah.',
    glossEn: 'The ironwood posts go up, as many as the existing shares require. Adding a household adds ranks of posts: even the frame is a count.',
  },
  {
    stage: 'gelagar',
    title: 'Gelagar',
    glossId: 'Gelagar membentang di antara tiang, memanjang dan melintang, dan mengunci deretan menjadi satu rangka.',
    glossEn: 'Bearers span between the posts, along and across, locking the ranks into one frame.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Satu lantai menerus dari ujung ke ujung, di bawah bilik maupun galeri. Rumah ini satu bangunan, bukan sederet rumah yang berhimpitan.',
    glossEn: 'One floor, continuous end to end, under both the bilik and the gallery. This is one building rather than a row of houses touching.',
  },
  {
    stage: 'bilik',
    title: 'Bilik',
    glossId: 'Bilik dipasang satu demi satu, semuanya sama besar, dipisahkan sekat. Jumlah sekat selalu satu kurang daripada jumlah keluarga — dan angka itulah yang membuat rumah ini bisa dibaca dari luar.',
    glossEn: 'The bilik go in one at a time, all the same size, divided by partitions. There is always one fewer partition than there are households — and that number is what makes this house legible from outside.',
  },
  {
    stage: 'sami',
    title: 'Sami',
    glossId: 'Galeri bersama di muka semua bilik, membentang sepanjang rumah. Di sinilah sebagian besar kehidupan dijalani.',
    glossEn: 'The common gallery in front of every bilik, running the length of the house. Most of life is lived here.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Rangka atap dan sirap ulin, dipasang dari tepi ke atas. Sirap kayu belah, bukan daun: lebih tipis, lebih rapat bertindih, dan bertahan jauh lebih lama.',
    glossEn: 'The roof frame and its ironwood shingles, laid from the eave upward. Split wood rather than leaf: thinner, lapped more closely, and lasting far longer.',
  },
  {
    stage: 'hejot',
    title: 'Hejot',
    glossId: 'Batang bertakik disandarkan terakhir. Satu-satunya jalan naik, dan pada malam hari ia ditarik ke atas — sebuah bangunan yang jalan masuknya bisa ditiadakan.',
    glossEn: 'The notched log is leaned in last. The only way up, and at night it is pulled in — a building whose entrance can be removed.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { keluarga: 8, tumbuh: 'hilir', sami: true }

/**
 * The bounds are the model's, not the building's.
 *
 * A real betang has no upper limit worth writing down — accounts describe
 * houses of fifty households and more. The cap here is a limit on how much
 * geometry is worth putting on a screen at once, and it is the one range in
 * this project that does not describe its subject. The note on the control
 * says so, because a slider that stops at twenty could otherwise be read as a
 * claim that twenty-one is impossible.
 */
export const MIN_KELUARGA = 3
export const MAX_KELUARGA = 20

export function normaliseRules(rules: Rules): Rules {
  return {
    keluarga: Math.min(MAX_KELUARGA, Math.max(MIN_KELUARGA, Math.round(rules.keluarga))),
    tumbuh: rules.tumbuh,
    sami: rules.sami,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
