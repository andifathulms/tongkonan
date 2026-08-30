/**
 * The rule pack for the Sabu ammu hawu.
 *
 * The thirty-first pack, and the one that tests whether a likeness is in the
 * shape or only in the words.
 *
 * `theHouseIsAVessel` is canon and it is the entry. On Rai Hawu a house is
 * built and spoken of as a boat: the ridge is a keel, the ends are a bow and a
 * stern, the family are its crew. Eleven buildings ago this project modelled
 * an actual hull — the Bajau lepa — so the question has an answer here rather
 * than an assertion: `hullLeast` and `hullMost` state the proportion a hull
 * holds, the plan is required to lie inside it, and the test compares that
 * range against the lepa's own numbers.
 *
 * `endsAreNotAlike` is the second. A boat has a bow and a stern and they are
 * not interchangeable; so does this house, and the model is required to be
 * asymmetric along its length for that reason and symmetric across it for the
 * same reason a hull is.
 *
 * `theRoofIsTheHull` is the third. The thatch comes down nearly to the floor,
 * so what would be a wall on any other house here is the lower part of the
 * roof — and the way in is a gap left under the eave rather than a door cut in
 * a wall. That gives the pack its limit: widen the hull and the eave comes
 * down, and past a point there is no way in at all.
 *
 * `lontarPaysForIt` is the fourth and it is about an island rather than a
 * building. Sabu lives on the lontar palm — juice, syrup, leaf, timber — and
 * the loft where those stores hang is why the inner room has a ceiling. A roof
 * of lontar leaf over a store of lontar syrup is not a coincidence worth
 * hiding in a materials list.
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
  Atap,
  Dim,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  SabuKinds,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'fox-1977',
    citation:
      'Fox, J. J., Harvest of the Palm: Ecological Change in Eastern Indonesia ' +
      '(Harvard University Press, Cambridge, 1977).',
    kind: 'ethnography',
  },
  {
    key: 'duggan-2016',
    citation:
      'Duggan, G. & Hägerdal, H., Savu: History and Oral Tradition on an Island of Indonesia ' +
      '(NUS Press, Singapore, 2016).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Nusa Tenggara Timur (Departemen Pendidikan dan Kebudayaan, ' +
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
  /* the hull */
  beam: dim(4.6, 'm', 'interpolated', 'none', 'Lebar rumah, yang di sini disebut lebar lambung. Angka inilah yang ditekan aturan bentuknya: rumah ingin lebih lebar, perahu tidak.', 'Width of the house, which is called the beam here. It is the figure the shape rule presses on: a house wants to be wider, a boat does not.'),
  bayLength: dim(2.6, 'm', 'interpolated', 'none', 'Panjang satu ruang di sepanjang lambung.', 'Length of one bay along the hull.'),
  hullLeast: dim(2.1, 'ratio', 'interpolated', 'none', 'Perbandingan panjang terhadap lebar yang paling kecil yang masih terbaca sebagai lambung perahu. Di bawah ini bentuknya sudah menjadi denah rumah biasa.', 'The least length-to-beam ratio that still reads as a hull. Below it the shape is an ordinary house plan.'),
  hullMost: dim(4.6, 'ratio', 'interpolated', 'none', 'Perbandingan panjang terhadap lebar yang paling besar yang masih dibangun. Ini rentang, bukan satu angka: lambung perahu pun bermacam-macam.', 'The greatest length-to-beam ratio that is built. It is a range rather than a figure: hulls vary too.'),

  /* the frame */
  floorHeight: dim(1.15, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah.', 'Height of the floor above the ground.'),
  padHeight: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi batu di bawah tiang; tidak ada yang ditanam.', 'Height of the stone under a post; nothing is buried.'),
  padSocket: dim(0.05, 'm', 'interpolated', 'none', 'Dalamnya cekungan pada batu tempat kaki tiang duduk, supaya keduanya benar-benar bertaut.', 'Depth of the hollow in the stone the post foot sits in, so that the two actually engage.'),
  postSection: dim(0.18, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a post.'),
  bearerDepth: dim(0.16, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar lantai.', 'Depth of a floor bearer.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor plank.'),
  keelSection: dim(0.2, 'm', 'interpolated', 'none', 'Sisi penampang balok bubungan, yang di sini disebut lunas.', 'Section of the ridge beam, which is called the keel here.'),
  keelRise: dim(3.4, 'm', 'interpolated', 'none', 'Tinggi lunas di atas lantai.', 'Height of the keel above the floor.'),
  roofFall: dim(0.72, 'ratio', 'interpolated', 'none', 'Turunnya atap untuk tiap meter dari lunas ke tepi. Karena atapnya turun hampir sampai lantai, angka ini dan lebar lambung menentukan berapa tinggi celah yang tersisa untuk masuk — dan lebar lambung dapat dilebarkan, sedangkan kemiringan atap tidak.', 'The fall of the roof for each metre out from the keel. Because the roof comes down nearly to the floor, this figure and the beam decide how much gap is left to get in by — and the beam can be widened while the pitch cannot.'),
  keelCamber: dim(0.35, 'm', 'interpolated', 'none', 'Lengkung lunas dari ujung ke tengah — seperti lunas perahu, ia tidak lurus.', 'Camber of the keel from end to middle — like a boat’s keel, it is not straight.'),
  ribSection: dim(0.08, 'm', 'interpolated', 'none', 'Sisi penampang gading atap.', 'Section of a roof rib.'),
  ribSpacing: dim(0.7, 'm', 'interpolated', 'none', 'Jarak antar gading.', 'Spacing of the ribs.'),
  thatchThickness: dim(0.15, 'm', 'interpolated', 'none', 'Tebal lapisan daun.', 'Thickness of the leaf covering.'),
  thatchOversail: dim(0.4, 'm', 'interpolated', 'none', 'Tritisan di ujung haluan dan buritan.', 'Overhang at the bow and the stern.'),

  /* the way in, under the eave */
  doorWidth: dim(0.85, 'm', 'interpolated', 'none', 'Lebar celah di bawah tritisan, yang menjadi satu-satunya jalan masuk.', 'Width of the gap under the eave, which is the only way in.'),
  doorHead: dim(1.35, 'm', 'interpolated', 'none', 'Tinggi kepala celah di atas lantai. Tepi atap harus berada di atas angka ini: kalau tidak, rumahnya tidak dapat dimasuki sama sekali.', 'Height of the head of the gap above the floor. The eave has to sit above this figure: below it there is no way into the house at all.'),

  /* bow and stern */
  bowPost: dim(0.22, 'm', 'interpolated', 'none', 'Sisi penampang tiang haluan, yang lebih besar daripada tiang lain dan tidak dapat ditukar tempatnya.', 'Section of the bow post, which is larger than the others and is not interchangeable with them.'),
  sternRise: dim(0.45, 'm', 'interpolated', 'none', 'Kelebihan tinggi ujung buritan terhadap haluan: kedua ujungnya memang tidak sama, seperti pada perahu.', 'How much higher the stern end stands than the bow: the two ends are not alike, as on a boat.'),

  /* the loft the island's economy hangs in */
  duruY: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi lantai duru di atas lantai rumah.', 'Height of the duru floor above the house floor.'),
  duruShare: dim(0.42, 'ratio', 'interpolated', 'none', 'Panjang duru dibanding panjang rumah.', 'Length of the duru against the length of the house.'),
  duruThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal lantai duru.', 'Thickness of the duru floor.'),

  /* the ground */
  yardRadius: dim(11, 'm', 'interpolated', 'none', 'Jari-jari halaman yang dibersihkan, dengan pohon lontar yang disadap di sekelilingnya — dan pohonnya tidak dimodelkan, seperti tumbuhan mana pun dalam projek ini.', 'Radius of the swept yard, with the tapped lontar palms around it — and the palms are not modelled, like every plant in this project.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  theHouseIsAVessel: dim(1, 'count', 'canon', 'duggan-2016', 'Rumah ini dibangun dan disebut sebagai perahu: bubungannya lunas, kedua ujungnya haluan dan buritan, keluarganya awaknya. Sebelas bangunan yang lalu projek ini memodelkan lambung sungguhan — lepa Bajau — jadi kemiripan ini dapat diuji dan bukan sekadar dinyatakan: denahnya harus memegang perbandingan lambung perahu, bukan perbandingan ruang.', 'This house is built and spoken of as a boat: its ridge is a keel, its ends a bow and a stern, its family a crew. Eleven buildings ago this project modelled an actual hull — the Bajau lepa — so the likeness can be tested rather than asserted: the plan has to hold a hull’s proportion rather than a room’s.'),
  endsAreNotAlike: dim(2, 'count', 'canon', 'depdikbud-1986', 'Perahu punya haluan dan buritan dan keduanya tidak dapat ditukar. Begitu pula rumah ini: tiang haluan lebih besar, ujung buritan lebih tinggi, dan modelnya memang tidak simetris pada arah panjangnya — sementara melintangnya simetris, persis seperti lambung perahu.', 'A boat has a bow and a stern and they cannot be swapped. Neither can this house’s: the bow post is larger, the stern end stands higher, and the model is deliberately asymmetric along its length — while across it, it is symmetric exactly as a hull is.'),
  theRoofIsTheHull: dim(1, 'count', 'canon', 'depdikbud-1986', 'Atapnya turun hampir sampai ke lantai, jadi yang pada rumah lain menjadi dinding di sini adalah bagian bawah atap, dan jalan masuknya adalah celah yang ditinggalkan di bawah tritisan — bukan pintu yang dilubangkan pada dinding. Dari situlah batas bangunan ini datang: lebarkan lambungnya dan tepi atapnya turun, dan lewat satu titik tidak ada lagi jalan masuk.', 'The roof comes down nearly to the floor, so what is a wall on other houses here is the lower part of the roof, and the way in is a gap left under the eave rather than a door cut in a wall. That is where this building’s limit comes from: widen the hull and the eave comes down, and past a point there is no way in.'),
  lontarPaysForIt: dim(1, 'count', 'canon', 'fox-1977', 'Sabu hidup dari lontar: niranya, gulanya, daunnya, kayunya. Duru di atas ruang dalam adalah tempat simpanan itu digantung, dan atap daun lontar di atas simpanan gula lontar bukan kebetulan yang pantas disembunyikan di dalam daftar bahan.', 'Sabu lives on the lontar palm: its juice, its syrup, its leaf, its timber. The duru over the inner room is where those stores hang, and a roof of lontar leaf over a store of lontar syrup is not a coincidence worth hiding in a materials list.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.8,
  tiang: 1.8,
  lantai: 1.4,
  lunas: 1.2,
  atap: 2.6,
  duru: 0.8,
}

export const PACK: RulePack<SabuKinds> = {
  key: 'sabu',
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

/* ── Which palm ───────────────────────────────────────────────────────── */

export interface AtapInfo {
  readonly atap: Atap
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const ATAP: readonly AtapInfo[] = [
  {
    atap: 'lontar',
    name: 'Daun lontar',
    glossId: 'Daun lontar, pohon yang menghidupi pulau ini: niranya diminum dan dimasak menjadi gula, daunnya menjadi atap dan anyaman, kayunya menjadi tiang. Atap dari pohon yang sama dengan isi lumbungnya.',
    glossEn: 'Lontar leaf, from the palm this island lives on: its juice is drunk and boiled into syrup, its leaf becomes roofing and plaiting, its timber becomes posts. A roof from the same tree as what is stored under it.',
  },
  {
    atap: 'gewang',
    name: 'Daun gewang',
    glossId: 'Daun gewang, palem yang lain: daunnya lebih lebar dan lebih murah dipakai, dan itu bukan pilihan seni melainkan pilihan siapa yang punya berapa banyak lontar.',
    glossEn: 'Gewang leaf, the other palm: broader and cheaper to use, and choosing it is not a matter of taste but of who has how much lontar.',
  },
]

export function atapInfo(atap: Atap): AtapInfo {
  const found = ATAP.find((a) => a.atap === atap)
  if (!found) throw new Error(`unknown atap: ${atap}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan lebih dulu; tidak ada tiang yang ditanam.',
    glossEn: 'The stones are set first; no post is buried.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang berdiri di atas batunya — dan tiang haluan bukan tiang biasa: ia lebih besar dan tempatnya tidak dapat ditukar.',
    glossEn: 'The posts stand on their stones — and the bow post is not an ordinary post: it is larger and its place cannot be swapped.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Gelagar dan papan lantai dipasang: lantai lambung.',
    glossEn: 'Bearers and planks go in: the floor of the hull.',
  },
  {
    stage: 'lunas',
    title: 'Lunas',
    glossId: 'Balok bubungan dinaikkan, dan di pulau ini balok itu disebut lunas. Ia melengkung, bukan lurus.',
    glossEn: 'The ridge beam goes up, and on this island that beam is called the keel. It is cambered rather than straight.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Daun palem ditutupkan sampai hampir menyentuh lantai. Yang pada rumah lain menjadi dinding, di sini bagian bawah atap.',
    glossEn: 'Palm leaf goes on down to within a hand of the floor. What is a wall on other houses is the lower part of this roof.',
  },
  {
    stage: 'duru',
    title: 'Duru',
    glossId: 'Duru dipasang terakhir di atas ruang dalam, tempat gula dan simpanan lontar digantung.',
    glossEn: 'The duru goes in last over the inner room, where the syrup and the lontar stores hang.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { ruang: 5, atap: 'lontar', duru: true }

export const MIN_RUANG = 4
export const MAX_RUANG = 8

export function normaliseRules(rules: Rules): Rules {
  return {
    ruang: Math.min(MAX_RUANG, Math.max(MIN_RUANG, Math.round(rules.ruang))),
    atap: rules.atap,
    duru: rules.duru,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
