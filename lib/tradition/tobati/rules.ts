/**
 * The rule pack for the Tobati-Enggros kariwari.
 *
 * The sixteenth pack, and the first whose canon includes a fact about the sea.
 *
 * The Nias pack widened this project's premise to admit rules about the ground
 * as well as rules about people. This one takes that as far as it goes: there
 * is no ground. The building stands in Youtefa Bay on driven posts, so the
 * floor height is a statement about high water, the absence of a pad stone is
 * a fact rather than an omission, and the way in is a walkway over the sea.
 *
 * The other canon rules are about time. A kariwari's levels are age grades:
 * boys below, young men above them, elders at the top. That is the only
 * vertical division in this collection that a person passes through rather
 * than belongs to.
 *
 * Two rules where every other pack has three, and the pack says why in
 * `types.ts`: no third variation is recorded, and inventing one would be
 * inventing a building nobody has put up.
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
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  TobatiKinds,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'mansoben-1995',
    citation:
      'Mansoben, J. R., Sistem Politik Tradisional di Irian Jaya ' +
      '(LIPI–RUL, Jakarta, 1995).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-papua',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Irian Jaya ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'kemendikbud-kariwari',
    citation:
      'Kementerian Pendidikan dan Kebudayaan, Rumah Kariwari: rumah adat Tobati-Enggros, ' +
      'Teluk Youtefa, Jayapura (catatan warisan budaya takbenda).',
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
  /* the plan: an octagon, and the only one in the collection */
  radius: dim(3.3, 'm', 'interpolated', 'none', 'Jari-jari denah segi delapan pada lantai terbawah, diukur dari pusat ke sudut. Bahwa denahnya bersegi delapan adalah kanon; besarnya penetapan penulis.', 'Radius of the octagonal plan at the lowest floor, centre to corner. That the plan is eight-sided is canon; its size is the author’s.'),
  postSection: dim(0.2, 'm', 'interpolated', 'none', 'Sisi penampang tiang. Tiang dipancang ke dasar teluk, jadi tidak ada batu alas di bawahnya — bukan kelalaian melainkan keadaan: tidak ada tempat untuk meletakkan batu.', 'Section of a post. The posts are driven into the bed of the bay, so there is no pad stone under any of them — not an omission but the situation: there is nowhere to set a stone.'),
  embedment: dim(1.6, 'm', 'interpolated', 'none', 'Dalamnya tiang dipancang ke dalam lumpur dasar. Angka yang tidak dapat dilihat siapa pun pada bangunan jadi, dan justru karena itu perlu dinyatakan.', 'How deep a post is driven into the mud of the bed. A figure nobody can see on a finished building, and one that has to be declared for exactly that reason.'),

  /* the sea, which is where the ground would be */
  waterDepth: dim(1.5, 'm', 'interpolated', 'none', 'Dalamnya air pada pasang rata-rata di atas dasar teluk. Dalam projek ini y = 0 adalah tanah; di sini tanah itu dasar laut, dan airnya sebuah lembar di atasnya.', 'Depth of the water at mean tide above the bed of the bay. In this project y = 0 is the ground; here the ground is the sea bed, and the water is a sheet lying on it.'),
  tide: dim(0.85, 'm', 'interpolated', 'none', 'Jarak pasang: selisih air tertinggi dan air rata-rata. Ini angka yang menetapkan tinggi lantai, dan pada lima belas bangunan lain angka semacam ini tidak ada.', 'Tidal range: the difference between the highest water and the mean. It is the figure that sets the floor height, and on the other fifteen buildings no figure of this kind exists.'),
  floorHeight: dim(3.6, 'm', 'interpolated', 'none', 'Tinggi lantai terbawah di atas dasar teluk — setinggi apa tiangnya dipotong. Ini yang dipilih pembangunnya.', 'Height of the lowest floor above the bed of the bay — how high the posts are cut. This is what the builders choose.'),
  freeboard: dim(0.9, 'm', 'interpolated', 'none', 'Jarak bebas terkecil yang harus tersisa antara air tertinggi dan bawah gelagar. Ini yang diputuskan laut, bukan pembangunnya — dan justru karena itu ia angka yang berdiri sendiri: tinggi lantai adalah pilihan, jarak bebas adalah syarat, dan pemeriksaannya membandingkan keduanya. Menurunkan pilihan itu sampai air masuk ke lantai adalah tandingan bangunan ini, dan satu-satunya tandingan dalam projek ini yang dipatahkan oleh sesuatu yang tidak dikuasai siapa pun.', 'The least clearance that must be left between the highest water and the underside of the bearers. This one is decided by the sea rather than by the builders — and that is exactly why it stands on its own: the floor height is a choice, the clearance is a requirement, and the check compares the two. Lowering the choice until the water comes through the floor is this building’s counterexample, and the only one in the project defeated by something nobody controls.'),

  /* the levels, which are ages */
  levelHeight: dim(2.3, 'm', 'interpolated', 'none', 'Tinggi satu tingkat. Sama untuk semua tingkat: yang berkurang ke atas adalah luasnya, bukan tinggi ruangnya.', 'Height of one level. The same for every level: what falls as you go up is the floor area, not the headroom.'),
  taper: dim(0.55, 'ratio', 'interpolated', 'none', 'Jari-jari di kepala tiang dibanding jari-jari di kakinya. Tiangnya condong ke dalam sepanjang seluruh tingginya, dan tiap tingkat membaca jari-jarinya dari garis tiang itu — satu keterangan, bukan dua. Semakin tinggi golongan usianya semakin sedikit orangnya, dan bangunan ini menyatakan itu dengan menyempit ke atas: satu-satunya piramida usia dalam projek ini.', 'Radius at the head of a post against the radius at its foot. The posts lean inward over their whole height and every level reads its radius off that line — one description, not two. The older the grade the fewer the people in it, and the building states that by narrowing upward: the only pyramid of age in this project.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),
  bearerDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar.', 'Depth of a bearer.'),
  bearerWidth: dim(0.14, 'm', 'interpolated', 'none', 'Lebar penampang gelagar.', 'Width of a bearer.'),
  wallThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal dinding papan pada tiap sisi segi delapan.', 'Thickness of the board wall on each side of the octagon.'),

  /* the peak */
  apexRise: dim(6.4, 'm', 'interpolated', 'none', 'Tinggi puncak di atas lantai teratas. Tinggi dan lancip: kariwari dikenali dari kerucut bersegi delapan yang berdiri jauh di atas air, dan angka inilah yang membuatnya — dan angka ini penetapan penulis, seperti menara Sumba dan bubungan Banjar sebelumnya.', 'Rise of the peak above the topmost floor. Tall and sharp: a kariwari is recognised by an eight-sided cone standing well above the water, and this is the figure that makes it — and the figure is the author’s, as with the Sumbanese tower and the Banjar ridge before it.'),
  eaveOversail: dim(0.7, 'm', 'interpolated', 'none', 'Panjang tritisan di luar dinding teratas.', 'Depth of the overhang beyond the topmost wall.'),
  rafterSection: dim(0.08, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  thatchCourseDepth: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis daun rumbia.', 'Exposed depth of one course of sago thatch.'),
  thatchThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  thatchLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the way up and the way in */
  ladderWidth: dim(0.42, 'm', 'interpolated', 'none', 'Lebar galah bertakik yang menghubungkan dua tingkat. Ada satu antara tiap pasang tingkat berurutan dan tidak ada yang melompati satu tingkat: naik golongan usia dilakukan satu per satu.', 'Width of the notched pole between two levels. There is one between each consecutive pair and none that skips a level: an age grade is climbed one at a time.'),
  walkwayWidth: dim(1.1, 'm', 'interpolated', 'none', 'Lebar titian dari darat.', 'Width of the walkway from the shore.'),
  walkwayReach: dim(9, 'm', 'interpolated', 'none', 'Panjang titian yang digambar. Kampungnya jauh lebih luas daripada apa pun yang muat dalam model; ini secukupnya untuk menyatakan bahwa rumah ini dicapai lewat jalan di atas air.', 'Length of walkway drawn. The village is far larger than anything that fits in the model; this is enough to state that the house is reached along a road over the water.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  standsInWater: dim(1, 'count', 'canon', 'kemendikbud-kariwari', 'Rumah ini berdiri di dalam air Teluk Youtefa, di atas tiang yang dipancang ke dasar. Lima belas bangunan lain dalam projek ini berdiri di atas tanah — bumi, pasangan batu, rawa pasang, lereng yang dibuka. Yang ini tidak berdiri di atas tanah sama sekali, dan setiap akibatnya berbeda jenisnya dan bukan hanya derajatnya: tidak ada batu alas di bawah satu tiang pun, dan tinggi lantainya adalah pernyataan tentang air pasang.', 'This house stands in the water of Youtefa Bay, on posts driven into the bed. The other fifteen buildings in this project stand on ground — earth, masonry, tidal swamp, a cleared slope. This one does not stand on ground at all, and every consequence differs in kind rather than degree: there is no pad stone under a single post, and the height of the floor is a statement about the tide.'),
  eightSided: dim(8, 'count', 'canon', 'depdikbud-papua', 'Denahnya bersegi delapan. Lima belas bangunan lain di sini berdenah persegi panjang atau lingkaran, dan segi delapan bukan keduanya: ia punya sudut, tetapi tidak punya muka yang panjang dan sisi yang pendek — jadi tidak ada sisi yang dengan sendirinya menjadi depan.', 'The plan is eight-sided. The other fifteen buildings here are rectangles or circles, and an octagon is neither: it has corners, but it has no long face and no short side — so no side becomes the front by being the widest.'),
  levelsAreAges: dim(1, 'count', 'canon', 'mansoben-1995', 'Tingkat-tingkatnya adalah golongan usia: anak laki-laki diajar di bawah, pemuda tinggal di atasnya, dan orang tua bersidang di puncaknya. Ini satu-satunya pembagian tegak dalam projek ini yang dilalui seseorang, bukan yang ditempatinya: seorang laki-laki tidak memilih tingkatnya dan tidak tinggal di situ — ia menaikinya, sekali, sepanjang hidupnya.', 'The levels are age grades: boys are taught below, young men live above them, and the elders meet at the top. It is the only vertical division in this project that a person passes through rather than belongs to: a man does not choose his level and does not stay on it — he climbs it, once, over a lifetime.'),
  fewerHigherUp: dim(1, 'count', 'canon', 'mansoben-1995', 'Tiap tingkat lebih kecil daripada tingkat di bawahnya. Golongan usia yang lebih tua lebih sedikit orangnya, dan bangunannya menyempit sesuai itu — sebuah piramida usia yang dibangun, bukan digambar.', 'Each level is smaller than the one below it. The older grades hold fewer people, and the building narrows to match — a pyramid of age that is built rather than drawn.'),
  menOnly: dim(1, 'count', 'canon', 'mansoben-1995', 'Kariwari adalah rumah laki-laki. Perempuan punya bangunannya sendiri, dan projek ini tidak memodelkannya — sebuah ketiadaan yang dinyatakan, bukan sebuah bangunan yang netral.', 'A kariwari is a men’s house. Women have their own building, and this project does not model it — an absence stated rather than a building presented as neutral.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tiang: 1.6,
  gelagar: 1,
  lantai: 1.1,
  dinding: 1.3,
  tangga: 0.5,
  rangka: 1.5,
  atap: 2.2,
  titian: 0.7,
}

export const PACK: RulePack<TobatiKinds> = {
  key: 'tobati',
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

/* ── The grades ───────────────────────────────────────────────────────── */

export interface GradeInfo {
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  readonly glossId: string
  readonly glossEn: string
}

/**
 * The three grades, lowest first, and the two-level house holds the first and
 * the last.
 *
 * Dropping the middle one rather than the top is the honest reading: a house
 * with two levels still has boys and still has elders, and what it does not
 * have is a floor of its own for the men in between.
 */
export const GRADES: readonly GradeInfo[] = [
  {
    key: 'anak',
    nameId: 'Anak laki-laki',
    nameEn: 'The boys',
    glossId: 'Tingkat terbawah, tempat anak laki-laki diajar. Yang terluas, karena yang termuda paling banyak.',
    glossEn: 'The lowest level, where the boys are taught. The widest, because the youngest are the most numerous.',
  },
  {
    key: 'pemuda',
    nameId: 'Pemuda',
    nameEn: 'The young men',
    glossId: 'Tingkat tengah, tempat pemuda tinggal setelah meninggalkan tingkat di bawahnya.',
    glossEn: 'The middle level, where the young men live once they have left the level below.',
  },
  {
    key: 'tua',
    nameId: 'Orang tua',
    nameEn: 'The elders',
    glossId: 'Tingkat teratas, tempat orang tua bersidang. Yang tersempit, dan yang paling jauh dari air.',
    glossEn: 'The topmost level, where the elders meet. The narrowest, and the furthest from the water.',
  },
]

export function gradesFor(tingkat: number): readonly GradeInfo[] {
  const first = GRADES[0]
  const last = GRADES[GRADES.length - 1]
  if (!first || !last) throw new Error('no grades')
  if (tingkat >= 3) return GRADES
  return [first, last]
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Delapan tiang dipancang ke dasar teluk. Tidak ada batu alas: tidak ada tempat untuk meletakkannya, dan bagian tiang yang menahan bangunan ini justru bagian yang tidak akan pernah terlihat.',
    glossEn: 'Eight posts are driven into the bed of the bay. There are no pad stones: there is nowhere to set one, and the part of the post that holds this building up is the part nobody will ever see.',
  },
  {
    stage: 'gelagar',
    title: 'Gelagar',
    glossId: 'Gelagar dipasang di atas air tertinggi. Tingginya bukan soal ternak atau kedudukan melainkan soal pasang.',
    glossEn: 'The bearers go on above the highest water. Their height is not about livestock or standing but about the tide.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai dipasang, satu untuk tiap golongan usia, dan tiap lantai lebih kecil daripada yang di bawahnya.',
    glossEn: 'The floors go in, one for each age grade, each smaller than the one below it.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Delapan bidang dinding menutup tiap tingkat.',
    glossEn: 'Eight wall panels close each level.',
  },
  {
    stage: 'rangka',
    title: 'Rangka',
    glossId: 'Kerucut bersegi delapan disusun di atas tingkat teratas — bentuk yang dari jauh menandai bangunan ini di atas air.',
    glossEn: 'The eight-sided cone is framed over the topmost level — the shape that marks this building on the water from a distance.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Daun rumbia dipasang berlapis dari tepi ke puncak.',
    glossEn: 'Sago leaf goes on in courses from the eave to the point.',
  },
  {
    stage: 'tangga',
    title: 'Tangga',
    glossId: 'Galah bertakik dipasang di antara tingkat yang berurutan. Tidak ada yang melompati satu tingkat: golongan usia dinaiki satu per satu.',
    glossEn: 'Notched poles go in between consecutive levels. None skips a level: the grades are climbed one at a time.',
  },
  {
    stage: 'titian',
    title: 'Titian',
    glossId: 'Titian dari darat dipasang terakhir, bila ada. Tanpa titian rumah ini hanya dicapai dengan perahu.',
    glossEn: 'The walkway from the shore goes on last, where there is one. Without it the house is reached only by canoe.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { tingkat: 3, titian: true }

export const MIN_TINGKAT = 2
export const MAX_TINGKAT = 3

export function normaliseRules(rules: Rules): Rules {
  return {
    tingkat: Math.min(MAX_TINGKAT, Math.max(MIN_TINGKAT, Math.round(rules.tingkat))),
    titian: rules.titian,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
