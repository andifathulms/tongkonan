/**
 * The rule pack for the Karo siwaluh jabu.
 *
 * The eighteenth pack, and the one that completes a set of three.
 *
 * `manyHouseholdsOneRoom` is canon and it is the whole building: eight
 * households, no partition anywhere, four hearths shared between pairs. Set it
 * beside `checkSectionIsConstant` in the Dayak pack, where every household has
 * an identical room and the house lengthens by one each time, and beside
 * `checkPlacesAreEqual` in the Maluku pack, where every clan's seat is the
 * same by rule. Three buildings, one social fact — several households under
 * one roof — and three answers that share no member.
 *
 * `orderedByTheTree` is the other one worth reading twice. The great beams are
 * laid with the root end of the timber at one end of the house, and the senior
 * household stands at that end. The building's hierarchy is oriented by the
 * direction a tree grew, which is the only rule in this project whose datum is
 * a fact about the material rather than about the people or the place.
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
  KaroKinds,
  Layout,
  Part,
  Pintu,
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
    key: 'singarimbun-1975',
    citation:
      'Singarimbun, M., Kinship, Descent and Alliance among the Karo Batak ' +
      '(University of California Press, Berkeley, 1975).',
    kind: 'ethnography',
  },
  {
    key: 'domenig-2014',
    citation:
      'Domenig, G., Religion und Architektur im westlichen Indonesien ' +
      '(Harrassowitz, Wiesbaden, 2014).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-sumut',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sumatera Utara ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
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
  /* the one room */
  bayLength: dim(3.1, 'm', 'interpolated', 'none', 'Panjang satu petak lantai antara dua baris tiang. Dua rumah tangga menempati satu petak, satu di tiap sisi, dan tidak ada sekat di antara keduanya — jadi petak ini satuan letak, bukan satuan ruang.', 'Length of one bay between two lines of posts. Two households occupy a bay, one on each side, and there is no partition between them — so the bay is a unit of position rather than a unit of room.'),
  halfWidth: dim(3.6, 'm', 'interpolated', 'none', 'Setengah lebar ruangnya. Satu ruang untuk seluruh rumah tangga: yang membagi mereka adalah tempat, bukan dinding.', 'Half-width of the room. One room for every household: what divides them is position, not a wall.'),
  floorHeight: dim(1.85, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah.', 'Height of the floor above the ground.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of the board floor.'),
  postSection: dim(0.22, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a post.'),
  stoneHeight: dim(0.28, 'm', 'interpolated', 'none', 'Tinggi batu alas.', 'Height of a pad stone.'),
  stoneWidth: dim(0.5, 'm', 'interpolated', 'none', 'Lebar batu alas.', 'Width of a pad stone.'),
  beamDepth: dim(0.3, 'm', 'interpolated', 'none', 'Tinggi penampang balok besar yang membujur. Balok inilah yang menyimpan arah tumbuh pohonnya, dan karena itu menetapkan urutan rumah tangganya.', 'Depth of the great beam running the length. This is the member that keeps the direction the tree grew, and so sets the order of the households.'),
  beamWidth: dim(0.16, 'm', 'interpolated', 'none', 'Lebar balok itu.', 'Width of that beam.'),
  wallHeight: dim(1.55, 'm', 'interpolated', 'none', 'Tinggi dinding miring dari lantai ke tepi atap. Dinding rumah Karo condong ke luar, dan hanya ada di keliling: tidak ada satu pun di dalam.', 'Height of the outward-leaning wall from the floor to the eave. A Karo house’s walls lean out, and they are only on the perimeter: there is not one inside.'),
  wallLean: dim(0.28, 'm', 'interpolated', 'none', 'Jauh dinding condong ke luar dari kaki ke tepi atap.', 'How far the wall leans out from its foot to the eave.'),
  wallThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),

  /* the hearths, and the space an open fire needs in a room with no walls */
  hearthRadius: dim(0.55, 'm', 'interpolated', 'none', 'Jari-jari tungku. Satu tungku dipakai bersama oleh dua rumah tangga, dan pada rumah ini tungku itu berdiri di ruang terbuka: tidak ada bilik yang mengurungnya.', 'Radius of a hearth. One hearth is shared by two households, and in this house it stands in open room: there is no cubicle around it.'),
  hearthClearance: dim(0.85, 'm', 'interpolated', 'none', 'Jarak bebas terkecil dari tepi tungku ke tiang atau dinding terdekat. Angka ini ada karena tidak ada sekat: pada rumah betang tiap tungku berada di dalam biliknya sendiri, di sini api menyala di ruang yang sama dengan semua orang, dan yang menjaganya hanyalah jarak.', 'Least clearance from the edge of a hearth to the nearest post or wall. This figure exists because there are no partitions: in a rumah betang each hearth is inside its own bilik, here the fire burns in the same room as everybody, and what keeps it apart is distance and nothing else.'),
  hearthDepth: dim(0.16, 'm', 'interpolated', 'none', 'Tinggi bibir tungku di atas lantai.', 'Height of the hearth kerb above the floor.'),

  /* the roof */
  ridgeRise: dim(3.9, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap. Atap ijuk rumah Karo besar dan curam di atas badan yang rendah.', 'Rise of the ridge above the eave. A Karo house’s ijuk roof is large and steep over a low body.'),
  eaveOversail: dim(1.15, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.09, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  plateSection: dim(0.15, 'm', 'interpolated', 'none', 'Sisi penampang balok tepi atap.', 'Section of the eave plate.'),
  ijukCourseDepth: dim(0.23, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis ijuk.', 'Exposed depth of one course of ijuk.'),
  ijukThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  ijukLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  ijukBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),
  tersekRise: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi tingkat atas pada ujung atap. Ia tidak menutupi apa pun yang belum tertutup: yang dikerjakannya hanya membuat ujung rumah ini lebih tinggi.', 'Rise of the upper tier at the end of the roof. It covers nothing that is not already covered: what it does is make the end of the house taller.'),
  tersekReach: dim(1.9, 'm', 'interpolated', 'none', 'Panjang tingkat atas itu ke arah dalam dari ujung atap.', 'How far that upper tier reaches in from the end of the roof.'),

  /* the way in */
  doorWidth: dim(1.1, 'm', 'interpolated', 'none', 'Lebar pintu di ujung rumah.', 'Width of the door at the end of the house.'),
  doorHeight: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi pintu.', 'Height of the door.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  manyHouseholdsOneRoom: dim(1, 'count', 'canon', 'singarimbun-1975', 'Delapan rumah tangga tinggal dalam satu ruang tanpa sekat. Rumah betang memberi tiap rumah tangga bilik sendiri dan memanjang satu bilik tiap kali; baileo membuat tempat duduk tiap klan sama besar menurut aturan; rumah ini tidak membagi apa pun. Satu fakta sosial, tiga bangunan, dan tiga jawaban yang tidak berbagi satu anggota pun.', 'Eight households live in one room with no partition. A rumah betang gives each household a room of its own and lengthens by one each time; a baileo makes every clan’s seat equal by rule; this house divides nothing at all. One social fact, three buildings, and three answers that share no member.'),
  standingIsPosition: dim(1, 'count', 'canon', 'singarimbun-1975', 'Kedudukan sebuah rumah tangga adalah letaknya di dalam ruang itu. Rumah limas menyatakan kedudukan dengan tinggi lantai, saoraja dengan tumpukan papan, tongkonan dengan pengali ukuran; rumah ini menyatakannya dengan tempat — dan tempat adalah satu-satunya penanda yang tidak dapat dilepas tanpa membongkar ruangannya.', 'A household’s standing is where it sits in that room. The rumah limas states standing in the height of a floor, the saoraja in a stack of boards, the tongkonan in a multiplier; this house states it in a position — and a position is the one marker that cannot be removed without removing the room.'),
  sharedHearths: dim(1, 'count', 'canon', 'depdikbud-sumut', 'Satu tungku dipakai bersama oleh dua rumah tangga: delapan jabu, empat tungku. Memasak adalah urusan berdua, bukan urusan sendiri, dan itu diatur oleh letak tungkunya dan bukan oleh sekat.', 'One hearth is shared by two households: eight jabu, four hearths. Cooking is a matter for two rather than for one, and what arranges it is where the hearth is rather than any partition.'),
  orderedByTheTree: dim(1, 'count', 'canon', 'domenig-2014', 'Balok besar dipasang dengan pangkal pohon di satu ujung rumah, dan rumah tangga di ujung itu — jabu bena kayu — adalah yang tertua; jabu ujung kayu ada di ujung yang lain. Urutan kedudukan di rumah ini diarahkan oleh arah tumbuh sebatang pohon: satu-satunya aturan dalam projek ini yang datumnya sifat bahan, bukan orang atau tempat.', 'The great beams are laid with the root end of the tree at one end of the house, and the household at that end — jabu bena kayu — is the senior one; jabu ujung kayu is at the other. The order of standing in this house is oriented by the direction a tree grew: the only rule in this project whose datum is a fact about the material rather than about people or place.'),
  wallsLeanOut: dim(1, 'count', 'canon', 'depdikbud-sumut', 'Dinding condong ke luar dari lantai ke tepi atap.', 'The walls lean outward from the floor to the eave.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  tiang: 1.3,
  rangka: 1.2,
  lantai: 1,
  dinding: 1.4,
  dapur: 0.7,
  kuda: 1.5,
  atap: 2.3,
  tersek: 0.6,
}

export const PACK: RulePack<KaroKinds> = {
  key: 'karo',
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

/* ── The way in ───────────────────────────────────────────────────────── */

export interface PintuInfo {
  readonly pintu: Pintu
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const PINTU: readonly PintuInfo[] = [
  {
    pintu: 'dua',
    count: 2,
    name: 'Dua pintu',
    glossId:
      'Satu di tiap ujung. Rumah tangga di ujung pangkal dan di ujung tip masing-masing punya pintunya sendiri, dan tidak ada seorang pun yang harus melewati tempat orang lain untuk masuk.',
    glossEn:
      'One at each end. The households at the base end and at the tip end each have their own door, and nobody has to cross another household’s place to get in.',
  },
  {
    pintu: 'satu',
    count: 1,
    name: 'Satu pintu',
    glossId:
      'Satu di ujung pangkal saja. Semua orang masuk melewati tempat rumah tangga yang tertua — sebuah susunan yang membuat kedudukan itu terasa setiap hari, bukan hanya pada upacara.',
    glossEn:
      'One at the base end only. Everybody enters past the senior household’s place — an arrangement that makes the standing felt daily rather than only at a ceremony.',
  },
]

export function pintuInfo(pintu: Pintu): PintuInfo {
  const found = PINTU.find((p) => p.pintu === pintu)
  if (!found) throw new Error(`unknown pintu: ${pintu}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu alas',
    glossId: 'Batu diletakkan pada denahnya, satu di bawah tiap tiang.',
    glossEn: 'The pad stones are set out, one under each post.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang berdiri di atas batu. Semuanya ada di keliling dan di garis melintang; tidak ada satu pun yang berdiri untuk membagi ruangnya.',
    glossEn: 'The posts stand on the stones. All of them are on the perimeter or on a cross line; not one stands in order to divide the room.',
  },
  {
    stage: 'rangka',
    title: 'Rangka',
    glossId: 'Balok besar dipasang membujur, dengan pangkal pohon di ujung bena kayu. Sejak saat ini rumah ini punya urutan: ujung mana yang tertua sudah ditetapkan oleh kayunya.',
    glossEn: 'The great beams go on along the length, root end at the bena kayu end. From this moment the house has an order: which end is senior has been settled by the timber.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Papan lantai dipasang. Satu bidang, satu ruang, dan tidak ada apa pun yang membaginya.',
    glossEn: 'The floor goes down. One plane, one room, and nothing divides it.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding condong ke luar dipasang di keliling, dan hanya di keliling.',
    glossEn: 'The outward-leaning walls go on around the perimeter, and only there.',
  },
  {
    stage: 'dapur',
    title: 'Dapur',
    glossId: 'Tungku diletakkan, satu untuk tiap dua rumah tangga. Di ruang tanpa sekat, yang memisahkan api dari tiang hanyalah jarak.',
    glossEn: 'The hearths go in, one to every two households. In a room with no partitions, what keeps a fire off a post is distance and nothing else.',
  },
  {
    stage: 'kuda',
    title: 'Kuda-kuda',
    glossId: 'Rangka atap disusun di atas kepala tiang.',
    glossEn: 'The roof frame goes up on the post heads.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Ijuk dipasang berlapis dari tepi ke bubungan.',
    glossEn: 'Ijuk goes on in courses from the eave to the ridge.',
  },
  {
    stage: 'tersek',
    title: 'Tersek',
    glossId: 'Tingkat atas dipasang pada ujung atap, bila ada. Ia tidak menaungi apa pun yang belum ternaungi.',
    glossEn: 'The upper tier goes on at the end of the roof, where there is one. It shelters nothing that is not already sheltered.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { jabu: 8, tersek: true, pintu: 'dua' }

export const MIN_JABU = 4
export const MAX_JABU = 8

/** Households come in pairs, because a hearth is shared by two. */
export function normaliseRules(rules: Rules): Rules {
  const jabu = Math.min(MAX_JABU, Math.max(MIN_JABU, Math.round(rules.jabu / 2) * 2))
  return { jabu, tersek: rules.tersek, pintu: rules.pintu }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
