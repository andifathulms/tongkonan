/**
 * The rule pack for the Madurese tanean lanjang.
 *
 * The twenty-fifth pack, and the first whose subject is an arrangement.
 *
 * `yardIsTheRoom` is canon and it is why this is here. The tanean is not the
 * space between the buildings; it is what the buildings are put around. Drying
 * tobacco and rice, weddings, funerals, receiving anybody who is not family —
 * all of it happens on that beaten earth, and the houses are for sleeping in.
 * So the yard is a part of the model, and it is emitted first.
 *
 * `seniorityRunsEast` is the second. The parent household stands at the west
 * end of the row and each married daughter's house is added eastward in the
 * order she was born. Standing is a *position*, which the Karo house also
 * says — but there the positions are eight places in one room, and here they
 * are eight separate buildings, and the order is fixed by birth rather than by
 * which end of a beam was the root.
 *
 * `langgarClosesTheWest` is the third, and it corrects something this project
 * said about an earlier pack. The rumoh Aceh was described as the only
 * building here turned by a rule from outside the archipelago — it lies
 * east–west because prayer is toward the west. The langgar at the head of a
 * tanean stands where it stands for the same reason. That makes two, and the
 * Aceh pack's note is now wrong; the claim worth keeping is the narrower one,
 * that the rumoh Aceh is the only building whose *whole plan* is turned by it,
 * where here it is one small building in an arrangement.
 *
 * `housesAreAlike` is the fourth, and it is what the roof rule applies to: the
 * houses of one tanean are the same house repeated, with the tonghuh larger.
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
  Bentuk,
  Dim,
  Layout,
  MaduraKinds,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'wiryoprawiro-1986',
    citation:
      'Wiryoprawiro, Z. M., Arsitektur Tradisional Madura Sumenep dengan Pendekatan Historis dan ' +
      'Deskriptif (Laboratorium Arsitektur Tradisional, FTSP ITS, Surabaya, 1986).',
    kind: 'reference',
  },
  {
    key: 'tulistyantoro-2005',
    citation:
      'Tulistyantoro, L., “Makna Ruang pada Tanean Lanjang di Madura”, Dimensi Interior 3(2), 2005.',
    kind: 'reference',
  },
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Jawa Timur (Departemen Pendidikan dan Kebudayaan, ' +
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
  /* the yard, which is the room */
  yardWidth: dim(9.5, 'm', 'interpolated', 'none', 'Lebar tanean, dari deret rumah ke deret dapur. Ini bukan sisa ruang di antara bangunan: ini ruangannya, dan lebarnya ditetapkan oleh apa yang dikerjakan di atasnya — menjemur tembakau dan padi, hajatan, dan menerima siapa pun yang bukan keluarga.', 'Width of the tanean, from the row of houses to the row of kitchens. It is not space left over between buildings: it is the room, and its width is set by what is done on it — drying tobacco and rice, weddings and funerals, and receiving anybody who is not family.'),
  housePitch: dim(7.4, 'm', 'interpolated', 'none', 'Jarak dari satu rumah ke rumah berikutnya di sepanjang tanean. Panjang halaman adalah angka ini dikali jumlah rumah — jadi panjangnya adalah sebuah silsilah.', 'Distance from one house to the next along the tanean. The length of the yard is this figure times the number of houses — so the length is a genealogy.'),
  yardMargin: dim(2.2, 'm', 'interpolated', 'none', 'Sisa tanean di ujung timur, tempat rumah berikutnya akan berdiri.', 'The stretch of tanean left at the east end, where the next house will stand.'),
  yardThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal tanah padat yang diratakan menjadi tanean.', 'Thickness of the beaten earth levelled into the tanean.'),

  /* the houses of the row */
  houseWidth: dim(5.6, 'm', 'interpolated', 'none', 'Lebar muka rumah seorang anak perempuan yang sudah menikah, menghadap tanean.', 'Frontage of a married daughter’s house, facing the tanean.'),
  tonghuhWidth: dim(6.8, 'm', 'interpolated', 'none', 'Lebar muka rumah induk. Angka ini dan lebar rumah anak berdiri sendiri-sendiri, dan urutannya yang dijaga: rumah anak yang tumbuh melewati rumah induk membuat deret ini mengatakan hal yang tidak boleh dikatakannya.', 'Frontage of the parent household’s house. This figure and the daughters’ frontage are independent, and the order between them is what is guarded: a daughter’s house grown past the tonghuh makes the row say something it must not.'),
  houseDepth: dim(6.2, 'm', 'interpolated', 'none', 'Dalam rumah, dari muka ke belakang.', 'Depth of a house, front to back.'),
  plinthHeight: dim(0.45, 'm', 'interpolated', 'none', 'Tinggi lantai batu bata di atas tanean. Rumah Madura tidak berkolong: lantainya panggung rendah dari pasangan, dan bedanya dengan rumah panggung adalah satu tingkat besaran.', 'Height of the brick plinth above the tanean. A Madurese house is not raised on posts: its floor is a low masonry platform, and the difference from a stilt house is an order of magnitude.'),
  wallHeight: dim(2.35, 'm', 'interpolated', 'none', 'Tinggi dinding papan sampai ke balok atap.', 'Height of the board walls to the plate.'),
  wallThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),
  doorWidth: dim(1.05, 'm', 'interpolated', 'none', 'Lebar pintu, yang selalu menghadap tanean.', 'Width of the door, which always faces the tanean.'),
  postSection: dim(0.15, 'm', 'interpolated', 'none', 'Sisi penampang tiang kayu.', 'Section of a timber post.'),
  umpakSocket: dim(0.04, 'm', 'interpolated', 'none', 'Dalamnya lubang dangkal pada umpak tempat kaki tiang duduk. Tanpa angka ini tiang hanya menyentuh batunya pada satu bidang, dan sambungan yang kedua bagiannya tidak saling memasuki adalah sambungan yang tidak memegang apa-apa.', 'Depth of the shallow socket in the pad stone the foot of a post sits in. Without it a post only touches its stone on one plane, and a joint whose two members do not enter each other holds nothing.'),
  umpakHeight: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi umpak batu di bawah tiang.', 'Height of the stone pad under a post.'),

  /* the three roofs, held as dimensions so the rule can be pushed */
  trompesanRise: dim(1.55, 'm', 'interpolated', 'none', 'Tinggi atap trompesan di atas dinding: paling rendah, hampir limas, dan yang paling banyak berdiri.', 'Rise of a trompesan roof above the wall: the lowest, nearly a pyramid, and the one most often standing.'),
  pacenanRise: dim(2.15, 'm', 'interpolated', 'none', 'Tinggi atap pacenan: pelana, lebih curam, dan bubungannya sepanjang rumahnya.', 'Rise of a pacenan roof: a gable, steeper, its ridge as long as the house.'),
  bangsalRise: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi atap bangsal: yang paling tinggi, dan rumah yang memakainya adalah rumah yang paling banyak berkata tentang pemiliknya.', 'Rise of a bangsal roof: the tallest, and the house that carries one says the most about its household.'),
  ridgeShare: dim(0.45, 'ratio', 'interpolated', 'none', 'Panjang bubungan atap berlimas dibanding panjang rumahnya.', 'Length of a hipped roof’s ridge against the length of the house under it.'),
  eaveOversail: dim(0.65, 'm', 'interpolated', 'none', 'Tritisan di atas muka rumah, yang menaungi tepi tanean tempat orang duduk.', 'Overhang across the front of a house, shading the edge of the tanean where people sit.'),
  roofThickness: dim(0.1, 'm', 'interpolated', 'none', 'Tebal lapisan genteng.', 'Thickness of the tile covering.'),

  /* the langgar at the head of the yard */
  langgarSide: dim(4.4, 'm', 'interpolated', 'none', 'Sisi langgar yang menutup ujung barat tanean.', 'Side of the langgar closing the west end of the tanean.'),
  langgarRise: dim(2.2, 'm', 'interpolated', 'none', 'Tinggi atap langgar di atas dindingnya.', 'Rise of the langgar’s roof above its wall.'),
  langgarSetback: dim(2.6, 'm', 'interpolated', 'none', 'Jarak langgar dari rumah induk, di ujung barat halaman.', 'Distance of the langgar from the tonghuh, at the west end of the yard.'),

  /* the kitchens opposite */
  dapurWidth: dim(4.2, 'm', 'interpolated', 'none', 'Lebar muka dapur di seberang tanean.', 'Frontage of a kitchen across the tanean.'),
  dapurDepth: dim(3.4, 'm', 'interpolated', 'none', 'Dalam dapur.', 'Depth of a kitchen.'),
  dapurRise: dim(1.2, 'm', 'interpolated', 'none', 'Tinggi atap dapur.', 'Rise of a kitchen roof.'),

  /* the ground beyond */
  laneWidth: dim(3.2, 'm', 'interpolated', 'none', 'Lebar jalan yang melewati ujung timur tanean, tempat kelompok berikutnya berdiri.', 'Width of the lane past the east end of the tanean, where the next cluster stands.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  yardIsTheRoom: dim(1, 'count', 'canon', 'tulistyantoro-2005', 'Tanean adalah ruangnya, bukan sisa ruang di antara bangunan. Semua yang dikerjakan sebuah keluarga selain tidur dikerjakan di atasnya, dan bangunan-bangunan itu disusun mengelilinginya. Karena itu halaman ini ada di dalam daftar bagian, dan dibuat lebih dulu daripada apa pun yang berdiri di sekelilingnya.', 'The tanean is the room, not the space left between buildings. Everything a household does except sleep is done on it, and the buildings are arranged around it. So the yard is in the part list, and it is made before anything that stands around it.'),
  seniorityRunsEast: dim(1, 'count', 'canon', 'wiryoprawiro-1986', 'Rumah induk berdiri di ujung barat deret, dan rumah tiap anak perempuan yang menikah ditambahkan ke arah timur menurut urutan lahirnya. Kedudukan di sini adalah letak — seperti pada siwaluh jabu Karo, tetapi di sana letaknya adalah delapan tempat dalam satu ruang, dan di sini delapan bangunan yang berdiri sendiri-sendiri.', 'The parent household stands at the west end of the row, and each married daughter’s house is added eastward in the order she was born. Standing here is a position — as in the Karo siwaluh jabu, except that there the positions are eight places in one room and here they are eight separate buildings.'),
  langgarClosesTheWest: dim(1, 'count', 'canon', 'tulistyantoro-2005', 'Langgar berdiri di ujung barat tanean, karena salat menghadap ke barat. Ini aturan kedua dalam projek ini yang datang dari luar Nusantara: rumoh Aceh berbaring timur–barat karena alasan yang sama. Catatan pada pak Aceh yang menyebutnya satu-satunya sekarang keliru, dan yang masih benar adalah bentuk yang lebih sempit — di Aceh seluruh denah rumah yang diputar, di sini satu bangunan kecil dalam sebuah susunan.', 'The langgar stands at the west end of the tanean, because prayer is toward the west. It is the second rule in this project to come from outside the archipelago: the rumoh Aceh lies east–west for the same reason. The note in the Aceh pack calling it the only one is now wrong, and what survives is the narrower claim — there a whole house plan is turned by it, here one small building in an arrangement.'),
  housesAreAlike: dim(1, 'count', 'canon', 'depdikbud-1986', 'Rumah-rumah dalam satu tanean adalah rumah yang sama diulang, dengan rumah induk yang lebih besar. Karena itu aturan bentuk atap di sini berlaku untuk sekumpulan bangunan sekaligus — satu-satunya aturan dalam projek ini yang begitu.', 'The houses of one tanean are the same house repeated, with the parent household’s larger. So the roof rule here applies to a set of buildings at once — the only rule in this project that does.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tanean: 0.6,
  langgar: 1.2,
  rumah: 3.4,
  dapur: 1.0,
}

export const PACK: RulePack<MaduraKinds> = {
  key: 'madura',
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

/* ── The roof, and therefore the name ─────────────────────────────────── */

export interface BentukInfo {
  readonly bentuk: Bentuk
  /** the dimension key, not a copy of its value — the Banjar pack's lesson */
  readonly riseKey: DimKey
  /** how much of the house's length the ridge runs, 1 being a gable */
  readonly ridge: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const BENTUK: readonly BentukInfo[] = [
  {
    bentuk: 'trompesan',
    riseKey: 'trompesanRise',
    ridge: 0.2,
    name: 'Trompesan',
    glossId: 'Atap paling rendah, bubungannya pendek sehingga hampir berbentuk limas. Bentuk yang paling banyak berdiri, dan yang paling sedikit berkata.',
    glossEn: 'The lowest roof, with a ridge so short it is nearly a pyramid. The form most often standing, and the one that says least.',
  },
  {
    bentuk: 'pacenan',
    riseKey: 'pacenanRise',
    ridge: 1,
    name: 'Pacenan',
    glossId: 'Atap pelana: bubungannya sepanjang rumah dan kedua ujungnya berdinding sopi-sopi.',
    glossEn: 'A gable: its ridge runs the length of the house and both ends close with a wall.',
  },
  {
    bentuk: 'bangsal',
    riseKey: 'bangsalRise',
    ridge: 0.45,
    name: 'Bangsal',
    glossId: 'Atap berlimas yang paling tinggi. Rumah yang memakainya adalah rumah yang paling banyak berkata tentang pemiliknya — dan seluruh deret memakainya sekaligus, sebab rumah-rumah satu tanean adalah rumah yang sama diulang.',
    glossEn: 'The tallest hipped roof. A house carrying one says the most about its household — and the whole row carries it at once, because the houses of one tanean are the same house repeated.',
  },
]

export function bentukInfo(bentuk: Bentuk): BentukInfo {
  const found = BENTUK.find((b) => b.bentuk === bentuk)
  if (!found) throw new Error(`unknown bentuk: ${bentuk}`)
  return found
}

/** The rise this rule selects, read live from the pack. */
export function riseOf(bentuk: Bentuk): number {
  return DIMS[bentukInfo(bentuk).riseKey].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tanean',
    title: 'Tanean',
    glossId: 'Tanahnya diratakan dan dipadatkan lebih dulu. Halaman inilah yang sedang dibuat; bangunan-bangunannya kemudian disusun mengelilinginya.',
    glossEn: 'The ground is levelled and beaten first. The yard is the thing being made; the buildings are arranged around it afterwards.',
  },
  {
    stage: 'langgar',
    title: 'Langgar',
    glossId: 'Langgar didirikan di ujung barat, karena salat menghadap barat. Ia berdiri lebih dulu daripada rumah mana pun.',
    glossEn: 'The langgar is built at the west end, because prayer is toward the west. It stands before any of the houses.',
  },
  {
    stage: 'rumah',
    title: 'Rumah',
    glossId: 'Satu rumah untuk rumah induk, lalu satu lagi setiap kali seorang anak perempuan menikah — ke arah timur, menurut urutan lahir. Urutan pendirian dalam animasi ini bukan urutan tukang: ia urutan sebuah keluarga, dan jaraknya puluhan tahun.',
    glossEn: 'One house for the parent household, then one more each time a daughter marries — eastward, in order of birth. The raising order in this animation is not a carpenter’s: it is a family’s, and it is decades apart.',
  },
  {
    stage: 'dapur',
    title: 'Dapur',
    glossId: 'Deret dapur di seberang tanean, biasanya jauh belakangan.',
    glossEn: 'The kitchen row across the tanean, usually much later.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { rumah: 3, bentuk: 'trompesan', dapur: true }

export const MIN_RUMAH = 2
export const MAX_RUMAH = 7

export function normaliseRules(rules: Rules): Rules {
  return {
    rumah: Math.min(MAX_RUMAH, Math.max(MIN_RUMAH, Math.round(rules.rumah))),
    bentuk: rules.bentuk,
    dapur: rules.dapur,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
