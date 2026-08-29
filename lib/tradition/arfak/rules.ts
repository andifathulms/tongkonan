/**
 * The rule pack for the rumah kaki seribu.
 *
 * The eleventh pack, and the one this project should be most careful about.
 *
 * It is the least-sourced house here by a wide margin. The Nias omo, the
 * Sumbanese uma and the Bugis saoraja each have an ethnographic literature to
 * lean on; this one has the Depdikbud provincial survey and very little else
 * that the author could reach. So the canon list is short, it states only what
 * those sources state plainly — that the house stands on very many small legs,
 * that the legs are not fixed to the ground, that a clan house divides down
 * the middle — and everything metric is the author's. The caution says this in
 * as many words on the reading route, because a thin pack that reads like a
 * thick one is the exact failure this project exists to avoid.
 *
 * What it contributes is worth the care. `nothingIsBraced` is the negation of
 * the omo's `everyBayTriangulated`: two houses, one problem, opposite answers.
 * That is a strong result about the project's premise — a rule about the earth
 * no more determines a form than a rule about people does — and it needed the
 * two houses to be here together to be visible at all.
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
  ArfakKinds,
  Dim,
  Huni,
  Layout,
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
    key: 'depdikbud-papua',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Irian Jaya ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'mansoben-1995',
    citation:
      'Mansoben, J. R., Sistem Politik Tradisional di Irian Jaya ' +
      '(LIPI–RUL, Jakarta, 1995).',
    kind: 'ethnography',
  },
  {
    key: 'waterson-1990',
    citation:
      'Waterson, R., The Living House: An Anthropology of Architecture in South-East Asia ' +
      '(Oxford University Press, Singapore, 1990).',
    kind: 'ethnography',
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
  /* the legs, which are the subject */
  legSection: dim(0.09, 'm', 'interpolated', 'none', 'Sisi penampang satu kaki. Kecil — tiang setipis ini tidak akan dipakai rumah lain mana pun dalam projek ini, dan justru itulah pokoknya: bebannya disebar sampai tiap batang bisa dipikul satu orang.', 'Section of one leg. Small — no other house in this project would use a post this thin, and that is exactly the point: the load is spread until each pole can be carried by one person.'),
  legPitch: dim(0.62, 'm', 'interpolated', 'none', 'Jarak antar kaki. Rapat, dan jumlah kaki mengikuti dari jarak ini dan luas bangunannya — bukan sebaliknya. Nama rumah ini datang dari jumlah itu.', 'Spacing between legs. Close, and the number of legs follows from this and the size of the building rather than the other way about. The house is named for that number.'),
  legLean: dim(0.13, 'm', 'interpolated', 'none', 'Seberapa jauh kepala kaki menyimpang dari kakinya. Tiap batang miring sedikit dan tidak ada dua yang searah, jadi seluruh rangka bawah adalah kerumunan batang yang saling menyilang tanpa satu pun disilangkan pada yang lain. Inilah kebalikan langsung dari driwa Nias.', 'How far the head of a leg stands off its foot. Each pole leans a little and no two lean alike, so the whole substructure is a crowd of poles crossing each other without one of them being braced to another. This is the direct opposite of the Nias driwa.'),
  floorHeight: dim(1.55, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah. Rendah dibanding rumah panggung lain di sini: kolongnya bukan ruang melainkan akibat.', 'Height of the floor above the ground. Low compared with the other raised houses here: the space beneath is not a room but a consequence.'),

  /* the plan */
  bayLength: dim(1.9, 'm', 'interpolated', 'none', 'Jarak antar balok memanjang. Denahnya bertambah dengan kelipatan bulat angka ini.', 'Spacing of the bearers along the house. The plan grows by whole multiples of this.'),
  bodyWidth: dim(4.6, 'm', 'interpolated', 'none', 'Lebar badan rumah. Tetap: yang berubah menurut aturan hanyalah panjangnya.', 'Width of the body. Fixed: only the length changes with the rules.'),
  bearerDepth: dim(0.14, 'm', 'interpolated', 'none', 'Tinggi penampang balok yang melintang di atas kaki.', 'Depth of a bearer laid across the legs.'),
  bearerWidth: dim(0.1, 'm', 'interpolated', 'none', 'Lebar penampang balok itu.', 'Width of that bearer.'),
  floorThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal lantai kulit kayu. Tipis dan lentur — lantai yang memantul, bukan yang kaku.', 'Thickness of the bark floor. Thin and flexible — a floor that springs rather than one that is rigid.'),

  /* the body */
  wallHeight: dim(1.85, 'm', 'interpolated', 'none', 'Tinggi dinding kulit kayu.', 'Height of the bark wall.'),
  wallThickness: dim(0.04, 'm', 'interpolated', 'none', 'Tebal lembar kulit kayu.', 'Thickness of a bark sheet.'),
  passageWidth: dim(1.0, 'm', 'interpolated', 'none', 'Lebar lorong di tengah rumah marga, antara sisi laki-laki dan sisi perempuan.', 'Width of the passage down the middle of a clan house, between the men’s side and the women’s.'),
  doorWidth: dim(0.85, 'm', 'interpolated', 'none', 'Lebar pintu di ujung rumah.', 'Width of the door at the end of the house.'),

  /* the roof */
  ridgeRise: dim(2.4, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap.', 'Rise of the ridge above the eave.'),
  eaveOversail: dim(0.85, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.07, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerBay: dim(3, 'count', 'interpolated', 'none', 'Jumlah kasau tiap ruang.', 'Rafters in each bay.'),
  thatchCourseDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis alang-alang.', 'Exposed depth of one course of thatch.'),
  thatchThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  thatchLap: dim(0.45, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the way in */
  laddarReach: dim(2.2, 'm', 'interpolated', 'none', 'Panjang batang bertakik di pintu.', 'Length of the notched log at the door.'),
  ladderSection: dim(0.22, 'm', 'interpolated', 'none', 'Sisi penampang batang itu.', 'Section of that log.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  nothingIsBraced: dim(0, 'count', 'canon', 'depdikbud-papua', 'Nol diagonal di seluruh rangka bawah. Rumah ini berdiri di atas banyak sekali kaki kecil yang tidak diikat satu sama lain dan tidak ditanam, jadi ketika tanah bergoyang kaki-kaki itu ikut bergoyang dan bangunannya tetap berdiri. Ini kebalikan langsung dari omo Nias, yang menjawab persoalan yang sama dengan menyegitigakan setiap petaknya. Dua rumah, satu persoalan, dua jawaban yang berlawanan — dan itulah sebabnya keduanya ada di sini.', 'Zero diagonals in the whole substructure. This house stands on a great many small legs tied to nothing and buried in nothing, so when the ground shakes the legs move with it and the building stays up. It is the direct opposite of the Nias omo, which answers the same problem by triangulating every bay. Two houses, one problem, two opposite answers — which is why both are here.'),
  legsNotBuried: dim(1, 'count', 'canon', 'depdikbud-papua', 'Kaki berdiri di atas tanah, tidak ditanam. Batang yang ditanam harus patah sebelum bergerak; batang yang berdiri saja boleh bergeser lalu kembali.', 'The legs stand on the ground and are not buried. A pole set into the earth has to break before it can move; a pole merely standing may shift and settle back.'),
  manyLegs: dim(1, 'count', 'canon', 'depdikbud-papua', 'Kakinya sangat banyak dan sangat kecil. Bebannya disebar sehingga tidak ada satu batang pun yang perlu besar — rumah ini dinamai dari jumlah kakinya, bukan dari kekuatannya.', 'The legs are very many and very small. The load is spread so that no single pole needs to be large — the house is named for how many legs it has rather than for how strong they are.'),
  clanDividesInTwo: dim(2, 'count', 'canon', 'mansoben-1995', 'Rumah marga terbagi dua memanjang, sisi laki-laki dan sisi perempuan, dengan lorong di tengahnya. Rumah keluarga tidak dibagi. Yang berubah ada di dalam, dan dari luar kedua rumah itu sama.', 'A clan house divides lengthwise into a men’s side and a women’s side with a passage between. A family house is not divided. What changes is inside, and from outside the two are the same.'),
  tiedNotPegged: dim(1, 'count', 'canon', 'waterson-1990', 'Sambungannya ikat, bukan pasak dan bukan takik. Ikatan boleh bekerja sedikit tanpa patah, dan itulah seluruh gagasan bangunan ini dinyatakan pada satu sambungan.', 'The joints are lashings rather than pegs or notches. A lashing can work a little without breaking, and that is the whole idea of the building stated at one connection.'),

  /* The site: the clearing. */
  stumpHeight: dim(0.55, 'm', 'interpolated', 'none', 'Tinggi tunggul di tepi lahan yang dibuka. Rumah ini berdiri di tanah yang ditebang; tunggul adalah cara menyatakan itu tanpa menggambar hutan yang tidak diukur siapa pun.', 'Height of the stumps at the edge of the cleared ground. This house stands on ground that was felled; stumps state that without drawing a forest nobody measured.'),
  stumpWidth: dim(0.5, 'm', 'interpolated', 'none', 'Garis tengah tunggul.', 'Diameter of a stump.'),
  stumpSetback: dim(2, 'm', 'interpolated', 'none', 'Jarak tunggul ke dalam dari tepi lahan yang dibuka.', 'How far inside the edge of the clearing the stumps stand.'),
  stumpCount: dim(7, 'count', 'interpolated', 'none', 'Berapa tunggul yang digambar di tepi lahan. Sebuah angka yang dipilih agar terbaca, bukan bacaan atas suatu tempat.', 'How many stumps are drawn at the edge of the clearing. A number chosen to read, not a reading of any place.'),
  clearingRadius: dim(13, 'm', 'interpolated', 'none', 'Jari-jari lahan terbuka di sekeliling rumah, di antara rumah dan hutan. Rumah kaki seribu berdiri di tanah yang dibuka di lereng berhutan; letak persisnya dan besar bukaannya adalah penetapan penulis, seperti hampir semua angka pada pak ini.', 'Radius of the cleared ground around the house, between the house and the forest. A rumah kaki seribu stands on ground cut out of a wooded slope; the exact siting and the size of the clearing are the author’s, like nearly every figure in this pack.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  kaki: 2.2,
  balok: 1.2,
  lantai: 1.0,
  dinding: 1.2,
  sekat: 0.6,
  rangka: 1.4,
  atap: 2.0,
  tangga: 0.4,
}

export const PACK: RulePack<ArfakKinds> = {
  key: 'arfak',
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

/* ── Who lives in it ──────────────────────────────────────────────────── */

export interface HuniInfo {
  readonly huni: Huni
  readonly name: string
  readonly divided: boolean
  readonly glossId: string
  readonly glossEn: string
}

export const HUNI: readonly HuniInfo[] = [
  {
    huni: 'marga',
    name: 'Rumah marga',
    divided: true,
    glossId:
      'Rumah untuk satu marga, terbagi dua memanjang — sisi laki-laki dan sisi perempuan, dengan lorong di tengah. Dari luar tidak ada bedanya dengan rumah keluarga; yang membedakan ada di dalam.',
    glossEn:
      'A house for a whole clan, divided lengthwise into a men’s side and a women’s side with a passage between. From outside there is nothing to tell it from a family house; the difference is inside.',
  },
  {
    huni: 'keluarga',
    name: 'Rumah keluarga',
    divided: false,
    glossId: 'Rumah satu keluarga: bangunan yang sama, tidak dibagi.',
    glossEn: 'A house for one family: the same building, undivided.',
  },
]

export function huniInfo(huni: Huni): HuniInfo {
  const found = HUNI.find((h) => h.huni === huni)
  if (!found) throw new Error(`unknown huni: ${huni}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'kaki',
    title: 'Kaki',
    glossId: 'Ratusan batang kecil ditegakkan rapat, masing-masing miring sedikit ke arahnya sendiri, tidak diikat satu sama lain dan tidak ditanam. Tahap ini yang paling lama dan yang menamai rumahnya.',
    glossEn: 'Hundreds of small poles are stood close together, each leaning a little its own way, tied to nothing and buried in nothing. This is the longest stage and the one the house is named for.',
  },
  {
    stage: 'balok',
    title: 'Balok',
    glossId: 'Balok diletakkan melintang di atas kerumunan kaki dan diikat. Diikat, bukan dipasak: ikatan boleh bekerja sedikit tanpa patah.',
    glossEn: 'Bearers are laid across the crowd of legs and lashed. Lashed rather than pegged: a lashing can work a little without breaking.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai kulit kayu dipasang. Tipis dan lentur — lantai yang memantul, bukan yang kaku.',
    glossEn: 'The bark floor is laid. Thin and flexible — a floor that springs rather than one that is rigid.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding kulit kayu berdiri di keempat sisi.',
    glossEn: 'Bark walls go up on all four sides.',
  },
  {
    stage: 'sekat',
    title: 'Sekat',
    glossId: 'Pada rumah marga, sekat memanjang membagi dua dengan lorong di tengahnya. Pada rumah keluarga tahap ini tidak ada, dan ketiadaannya itulah bedanya.',
    glossEn: 'In a clan house, a lengthwise partition divides it in two with a passage between. In a family house this stage does not happen, and that absence is the difference.',
  },
  {
    stage: 'rangka',
    title: 'Rangka atap',
    glossId: 'Bubungan dan kasau, diikat seperti yang lain.',
    glossEn: 'Ridge and rafters, lashed like everything else.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Alang-alang dipasang dari tepi ke atas.',
    glossEn: 'The thatch is laid from the eave upward.',
  },
  {
    stage: 'tangga',
    title: 'Tangga',
    glossId: 'Batang bertakik disandarkan di pintu, di ujung rumah.',
    glossEn: 'A notched log is leaned at the door, at the end of the house.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { huni: 'marga', ruang: 7, kaki: 8 }

export const MIN_RUANG = 4
export const MAX_RUANG = 12
export const MIN_KAKI = 5
export const MAX_KAKI = 11

export function normaliseRules(rules: Rules): Rules {
  return {
    huni: rules.huni,
    ruang: Math.min(MAX_RUANG, Math.max(MIN_RUANG, Math.round(rules.ruang))),
    kaki: Math.min(MAX_KAKI, Math.max(MIN_KAKI, Math.round(rules.kaki))),
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
