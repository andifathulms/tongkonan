/**
 * The rule pack for the Riau balai selaso jatuh kembar.
 *
 * The thirty-fourth pack, and the first whose floor steps *down* to say
 * something.
 *
 * `theAisleHasFallen` is canon and it is the entry. Three floors: a middle one
 * where the council sits, and a selaso along each side one step below it. Every
 * other stepped floor in this project is raised to say something about a
 * person — the rumah limas seats a guest on the step that matches their
 * standing, the rumah gadang lifts an anjuang under one of its two laras, the
 * malige raises a storey for a sultan. This one is lowered to say something
 * about what is being done: passing through is not being present, so the
 * passage is not on the level of the room.
 *
 * `twinAndAlike` is the second and it is the *kembar* in the name. There are
 * two aisles and they match: the same width, the same fall, on both sides. A
 * hall with one selaso, or with two at different levels, is a different
 * building with a different name.
 *
 * `oneStepNotAStair` is the third, and it is where the limit comes from. The
 * fall is a step, not a storey: it has to stay inside what a person crosses
 * without thinking, because the point is to move between the two levels
 * constantly. Push it and the distinction gets clearer and the building stops
 * working.
 *
 * `youPassWithoutEntering` is the fourth: the aisles run clear from end to
 * end, so somebody can walk the length of the hall without ever setting foot
 * in the room. It is the geometric half of what the fallen floor means.
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
  Anjung,
  Dim,
  Layout,
  Part,
  ProvenanceClass,
  RiauKinds,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Riau (Departemen Pendidikan dan Kebudayaan, Jakarta, 1986).',
    kind: 'reference',
  },
  {
    key: 'effendy-2004',
    citation: 'Effendy, T., Tunjuk Ajar Melayu (Balai Kajian dan Pengembangan Budaya Melayu, Yogyakarta, 2004).',
    kind: 'reference',
  },
  {
    key: 'wahid-2013',
    citation:
      'Wahid, J. & Alamsyah, B., Arsitektur & Sosial Budaya Sumatera Utara dan Melayu ' +
      '(Graha Ilmu, Yogyakarta, 2013).',
    kind: 'reference',
  },
  {
    key: 'anthropometry',
    citation:
      'Ukuran tubuh manusia yang ditetapkan penulis, bukan dari sumber tentang Melayu Riau. ' +
      'Kunci yang sama dipakai pak Bali, Waruga, Ngada, Atoni, Rimba, dan Sahu.',
    kind: 'none',
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
  /* the three floors */
  middleWidth: dim(6.4, 'm', 'interpolated', 'none', 'Lebar ruang tengah, tempat orang duduk bermusyawarah.', 'Width of the middle room, where the council sits.'),
  bayLength: dim(2.5, 'm', 'interpolated', 'none', 'Panjang satu ruang di sepanjang balai.', 'Length of one bay along the hall.'),
  aisleWidth: dim(2.2, 'm', 'interpolated', 'none', 'Lebar tiap selaso. Keduanya sama, sebab itulah arti kembar pada namanya.', 'Width of each selaso. The two are the same, because that is what kembar in its name means.'),
  selasoDrop: dim(0.32, 'm', 'interpolated', 'none', 'Sedalam apa lantai selaso jatuh di bawah lantai tengah. Inilah satu-satunya ukuran dalam projek ini yang menurunkan lantai untuk menyatakan sesuatu, dan yang dinyatakannya adalah kegiatan, bukan orang.', 'How far the selaso floor falls below the middle one. It is the only dimension in this project that lowers a floor in order to say something, and what it says is about an activity rather than about a person.'),
  stepLimit: dim(0.42, 'm', 'interpolated', 'anthropometry', 'Setinggi apa satu langkah masih dapat dilalui orang tanpa berpikir. Bukan dari sumber tentang Melayu Riau — kunci sumbernya sendiri supaya terlihat begitu. Jatuhnya lantai harus tetap di dalam angka ini, sebab orang menyeberanginya berkali-kali dalam satu pertemuan.', 'How high a single step can be and still be crossed without thinking about it. Not from a source about Riau — its own source key so that this shows. The fall has to stay inside it, because people cross it many times in one meeting.'),

  /* the frame */
  floorHeight: dim(1.35, 'm', 'interpolated', 'none', 'Tinggi lantai tengah di atas tanah.', 'Height of the middle floor above the ground.'),
  padHeight: dim(0.3, 'm', 'interpolated', 'none', 'Tinggi batu di bawah tiang; tidak ada yang ditanam.', 'Height of the stone under a post; nothing is buried.'),
  padSocket: dim(0.05, 'm', 'interpolated', 'none', 'Dalamnya cekungan pada batu tempat kaki tiang duduk, supaya keduanya benar-benar bertaut.', 'Depth of the hollow in the stone the post foot sits in, so the two actually engage.'),
  postSection: dim(0.19, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a post.'),
  bearerDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar lantai.', 'Depth of a floor bearer.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor plank.'),

  /* what stands on it */
  railHeight: dim(0.75, 'm', 'interpolated', 'none', 'Tinggi pagar rendah di tepi selaso. Rendah dengan sengaja: selaso adalah jalan lewat, dan jalan lewat tidak ditutup.', 'Height of the low rail at the edge of the selaso. Low on purpose: a selaso is a way through, and a way through is not closed off.'),
  wallHeight: dim(2.5, 'm', 'interpolated', 'none', 'Tinggi dinding papan ruang tengah sampai balok atap.', 'Height of the middle room’s board wall to the plate.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),
  anjungRise: dim(0.28, 'm', 'interpolated', 'none', 'Naiknya lantai anjung di atas lantai tengah. Rumah gadang Minang juga menaikkan lantai di ujungnya, dan di sana yang dinyatakan adalah laras yang dianut rumah tangganya; di sini yang dinaikkan adalah tempat tuan rumah pada hajatan.', 'Rise of the anjung floor above the middle one. A Minang rumah gadang also raises a floor at its ends, and there what is stated is which laras the household follows; here what is raised is where the hosts sit at a ceremony.'),
  anjungDepth: dim(2.8, 'm', 'interpolated', 'none', 'Dalam anjung di ujung balai.', 'Depth of an anjung at the end of the hall.'),
  pelantarDepth: dim(2.4, 'm', 'interpolated', 'none', 'Dalam pelantar di belakang.', 'Depth of the rear deck.'),

  /* the roof */
  roofRise: dim(3.4, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas balok atap.', 'Rise of the ridge above the plate.'),
  ridgeShare: dim(0.5, 'ratio', 'interpolated', 'none', 'Panjang bubungan dibanding panjang balai.', 'Length of the ridge against the length of the hall.'),
  eaveOversail: dim(1.1, 'm', 'interpolated', 'none', 'Tritisan atap, yang menaungi selaso di bawahnya.', 'Overhang of the roof, which shades the selaso under it.'),
  roofThickness: dim(0.1, 'm', 'interpolated', 'none', 'Tebal lapisan sirap.', 'Thickness of the shingle covering.'),
  selembayungHeight: dim(1.1, 'm', 'interpolated', 'none', 'Tinggi selembayung yang bersilang di ujung bubungan. Ukirannya sendiri tidak dimodelkan.', 'Height of the selembayung crossing at the end of the ridge. Its carving itself is not modelled.'),
  selembayungSection: dim(0.09, 'm', 'interpolated', 'none', 'Sisi penampang batang selembayung.', 'Section of a selembayung member.'),

  /* the ground */
  yardRadius: dim(14, 'm', 'interpolated', 'none', 'Jari-jari halaman balai, di tepi sungai yang menjadi jalan negeri ini.', 'Radius of the hall’s yard, beside the river that is this country’s road.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  theAisleHasFallen: dim(1, 'count', 'canon', 'depdikbud-1986', 'Lantai selaso jatuh satu tapak di bawah lantai tengah. Tiap lantai berjenjang lain dalam projek ini dinaikkan untuk menyatakan sesuatu tentang orang yang berdiri di atasnya — rumah limas mendudukkan tamu pada jenjang yang sesuai kedudukannya, rumah gadang menaikkan anjuang menurut larasnya, malige menaikkan tingkat untuk sultan. Yang ini menurunkan lantai untuk menyatakan sesuatu tentang kegiatan: lewat bukan hadir, jadi jalan lewatnya tidak sedatar ruangnya.', 'The selaso floor falls one step below the middle floor. Every other stepped floor in this project is raised to say something about the person standing on it — a rumah limas seats a guest on the step matching their standing, a rumah gadang raises an anjuang according to its laras, a malige lifts a storey for a sultan. This one is lowered to say something about an activity: passing through is not being present, so the way through is not on the level of the room.'),
  twinAndAlike: dim(2, 'count', 'canon', 'effendy-2004', 'Dua selaso, dan keduanya sama: sama lebar, sama dalam jatuhnya, di kedua sisi. Itulah arti kembar pada namanya, dan balai dengan satu selaso atau dengan dua yang berbeda tinggi adalah bangunan lain dengan nama lain.', 'Two selaso, and they are alike: the same width, the same fall, on both sides. That is what kembar in its name means, and a hall with one selaso, or with two at different levels, is a different building with a different name.'),
  oneStepNotAStair: dim(1, 'count', 'canon', 'wahid-2013', 'Jatuhnya lantai adalah satu tapak, bukan satu tingkat. Orang menyeberanginya berkali-kali dalam satu pertemuan, jadi ia harus tetap di dalam ukuran langkah yang dapat dilalui tanpa berpikir — yang menjadi batas bangunan ini, dan batas itu ada pada tubuh orang, bukan pada kayunya.', 'The fall is one step, not one storey. People cross it many times in a single meeting, so it has to stay inside the size of step somebody crosses without thinking — which is this building’s limit, and the limit is in a person’s body rather than in its timber.'),
  youPassWithoutEntering: dim(1, 'count', 'canon', 'effendy-2004', 'Kedua selaso lapang dari ujung ke ujung, jadi orang dapat menyusuri seluruh panjang balai tanpa sekali pun menginjak ruang tengahnya. Inilah sisi ukur dari apa yang dimaksud lantai yang jatuh itu.', 'Both selaso run clear from end to end, so somebody can walk the whole length of the hall without once setting foot in the middle room. This is the measurable half of what the fallen floor means.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.8,
  tiang: 1.8,
  lantai: 2.2,
  dinding: 1.4,
  atap: 2.4,
  selembayung: 0.5,
}

export const PACK: RulePack<RiauKinds> = {
  key: 'riau',
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

/* ── How many raised end rooms ────────────────────────────────────────── */

export interface AnjungInfo {
  readonly anjung: Anjung
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const ANJUNG: readonly AnjungInfo[] = [
  {
    anjung: 'tidak',
    count: 0,
    name: 'Tanpa anjung',
    glossId: 'Tanpa ruang naik di ujungnya: hanya ruang tengah dan dua selaso yang jatuh di sisinya.',
    glossEn: 'No raised room at either end: only the middle floor and the two fallen aisles beside it.',
  },
  {
    anjung: 'satu',
    count: 1,
    name: 'Satu anjung',
    glossId: 'Satu anjung di ujung hulu, tempat tuan rumah duduk pada hajatan.',
    glossEn: 'One anjung at the upstream end, where the hosts sit at a ceremony.',
  },
  {
    anjung: 'dua',
    count: 2,
    name: 'Dua anjung',
    glossId: 'Anjung di kedua ujung. Rumah gadang Minang juga menaikkan lantai di ujungnya dan yang dinyatakannya laras rumah tangga itu; di sini yang dinaikkan tempat orang pada satu peristiwa, bukan kedudukan yang tetap.',
    glossEn: 'An anjung at each end. A Minang rumah gadang also raises a floor at its ends and what that states is the household’s laras; here what is raised is where people sit at one occasion rather than a standing that holds.',
  },
]

export function anjungInfo(anjung: Anjung): AnjungInfo {
  const found = ANJUNG.find((a) => a.anjung === anjung)
  if (!found) throw new Error(`unknown anjung: ${anjung}`)
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
    glossId: 'Tiang berdiri di atas batunya, dan tiang di sisi selaso dipotong lebih pendek — jatuhnya lantai sudah ada di dalam rangkanya.',
    glossEn: 'Posts stand on their stones, and the ones down the aisles are cut shorter — the fall of the floor is already in the frame.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Tiga lantai dipasang: ruang tengah, lalu dua selaso yang jatuh satu tapak di bawahnya.',
    glossEn: 'Three floors go in: the middle room, then the two selaso fallen one step below it.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding papan menutup ruang tengah, dan selaso hanya diberi pagar rendah — jalan lewat tidak ditutup.',
    glossEn: 'Board walls close the middle room, and the selaso get only a low rail — a way through is not closed off.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Satu atap sirap menutupi ketiga lantai sekaligus, dengan tritisan yang menaungi selaso.',
    glossEn: 'One shingle roof covers all three floors at once, its overhang shading the selaso.',
  },
  {
    stage: 'selembayung',
    title: 'Selembayung',
    glossId: 'Selembayung bersilang dipasang di kedua ujung bubungan, terakhir. Ukirannya tidak dimodelkan.',
    glossEn: 'The crossed selembayung go on at both ends of the ridge, last. Their carving is not modelled.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { ruang: 5, anjung: 'dua', pelantar: true }

export const MIN_RUANG = 3
export const MAX_RUANG = 7

export function normaliseRules(rules: Rules): Rules {
  return {
    ruang: Math.min(MAX_RUANG, Math.max(MIN_RUANG, Math.round(rules.ruang))),
    anjung: rules.anjung,
    pelantar: rules.pelantar,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
