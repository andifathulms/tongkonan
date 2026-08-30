/**
 * The rule pack for the Minahasa waruga.
 *
 * The twenty-second pack, and the second from the people who make the woloan
 * house — which is the reason to read the two together. That house is pegged
 * so that it can be taken apart, numbered and carried to another island. This
 * one is cut from a single block so that it will never move again. The same
 * tradition, asked two different questions, gives two answers that could not
 * be further apart.
 *
 * `sizedByASeatedBody` is the rule that makes this pack unlike any other. The
 * Balinese pack measures a house against its owner's living, standing body and
 * has an `anthropometry` source key so that "not from a book about Bali" is
 * visible in the table rather than hidden inside `none`. This pack borrows that
 * key for the same reason and uses it for a body that is seated, folded and
 * dead. Two buildings, one principle, two occasions.
 *
 * `cutFromOneBlock` is the limit everything runs into. A family keeps adding
 * to the same tomb, the chamber has to be deep enough for the ones not dead
 * yet, and no waruga can be larger than the stone a quarry gives.
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
  Tutup,
  WarugaKinds,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'schouten-1998',
    citation:
      'Schouten, M. J. C., Leadership and Social Mobility in a Southeast Asian Society: ' +
      'Minahasa, 1677–1983 (KITLV Press, Leiden, 1998).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-sulut',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sulawesi Utara ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'tim-waruga',
    citation:
      'Catatan lapangan dan laporan pelestarian kompleks waruga Sawangan dan Airmadidi ' +
      '(Balai Pelestarian Cagar Budaya, Sulawesi Utara).',
    kind: 'reference',
  },
  {
    key: 'anthropometry',
    citation:
      'Ukuran tubuh: penetapan penulis, bukan dari sumber tentang Minahasa. Kunci sumber ' +
      'ini dipakai bersama pak Bali agar “bukan dari buku tentang tempat ini” terlihat di ' +
      'tabel dan tidak tersembunyi di dalam “tidak ada sumber”.',
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
  /* the body the inside is measured by, and it is seated */
  seatedHeight: dim(0.86, 'm', 'interpolated', 'anthropometry', 'Tinggi tubuh yang duduk berlipat, dari alas ke ubun-ubun. Ini ukuran orang, bukan ukuran bangunan — dan tidak diambil dari buku tentang Minahasa melainkan ditetapkan penulis, seperti ukuran tubuh pada pak Bali. Bedanya: di sana tubuh itu hidup dan berdiri.', 'Height of a body seated and folded, from the seat to the crown. This is a measurement of a person rather than of a building — and it is not taken from a book about Minahasa but set by the author, like the body figures in the Bali pack. The difference: there the body is living and standing.'),
  seatedDepth: dim(0.62, 'm', 'interpolated', 'anthropometry', 'Dalam tubuh yang duduk berlipat, dari punggung ke lutut.', 'Depth of a body seated and folded, from the back to the knees.'),
  shoulderWidth: dim(0.46, 'm', 'interpolated', 'anthropometry', 'Lebar bahu.', 'Width across the shoulders.'),
  bodyClearance: dim(0.12, 'm', 'interpolated', 'none', 'Ruang sisa di sekeliling tubuh di dalam ruangnya. Sebuah peti yang pas persis adalah peti yang tidak dapat diisi.', 'The space left around a body inside the chamber. A box that fits exactly is a box nothing can be put into.'),

  /* the chamber, which grows as a family does */
  layerRise: dim(0.12, 'm', 'interpolated', 'none', 'Tinggi yang ditambahkan ruang untuk tiap orang berikutnya — sejengkal, bukan setinggi satu tubuh, karena sisa-sisa yang lebih dulu digeser dan memakan ruang jauh lebih sedikit daripada tubuh yang utuh. Sebuah keluarga menambah ke peti yang sama selama beberapa keturunan, jadi ruangnya harus sudah cukup dalam sejak awal untuk orang-orang yang belum meninggal. Rumah betang memanjang satu bilik tiap kali keluarga bertambah; yang ini bertambah ke atas, dan bertambahnya tidak dapat dilihat dari luar.', 'How much height the chamber gains for each further person — a hand’s breadth rather than a body, because earlier remains are moved aside and take far less room than a whole body does. A family adds to the same box over generations, so the chamber has to have been cut deep enough at the start for the ones who are not dead yet. A rumah betang lengthens by a room each time a household is added; this one grows upward, and its growth cannot be seen from outside.'),
  wallThickness: dim(0.16, 'm', 'interpolated', 'none', 'Tebal dinding batu peti.', 'Thickness of the stone wall of the box.'),
  floorThickness: dim(0.18, 'm', 'interpolated', 'none', 'Tebal dasar peti, yang dipahat dari blok yang sama.', 'Thickness of the base of the box, cut from the same block.'),

  /* the block it is all cut from */
  blockLimit: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi blok terbesar yang diberikan tempat pengambilan batunya. Ini batas keras dan bukan pilihan: waruga dipahat dari satu batu, tidak disambung, jadi berapa banyak orang yang dapat ditampungnya dibatasi oleh sebesar apa batu yang ada. Inilah yang ditekan oleh tandingan bangunan ini.', 'Height of the largest block the quarry gives. A hard limit rather than a choice: a waruga is cut from one stone and never jointed, so how many people it can hold is bounded by how large a stone there is. It is what this building’s counterexample pushes.'),

  /* the lid, which is a roof */
  lidRise: dim(0.42, 'm', 'interpolated', 'none', 'Tinggi tutup di atas mulut peti. Tutupnya berbentuk atap: sebuah rumah yang tidak dimasuki siapa pun tetap dibuat menyerupai rumah.', 'Rise of the lid above the mouth of the box. The lid has the shape of a roof: a house nobody enters is still made to look like one.'),
  lidOverhang: dim(0.09, 'm', 'interpolated', 'none', 'Jauh tutup menjorok di luar peti, yang membuat air hujan jatuh di luar mulutnya.', 'How far the lid oversails the box, which is what puts rain outside its mouth.'),
  lidSeat: dim(0.05, 'm', 'interpolated', 'none', 'Dalam takik tempat tutup duduk. Tutup diangkat dan diletakkan kembali; tidak ada sambungan lain pada bangunan ini.', 'Depth of the rebate the lid sits in. The lid is lifted and put back; there is no other joint in this building.'),

  /* the base */
  baseHeight: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi lempeng alas.', 'Height of the base slab.'),
  baseMargin: dim(0.14, 'm', 'interpolated', 'none', 'Jauh alas menjorok di luar peti.', 'How far the base slab stands proud of the box.'),

  /* rules that are structure, not measurement */
  forTheDead: dim(1, 'count', 'canon', 'schouten-1998', 'Bangunan ini untuk orang mati. Dua puluh satu bangunan lain dalam projek ini untuk yang hidup, untuk padi, atau untuk musyawarah; yang ini tidak dimasuki siapa pun dan tidak dipakai untuk apa pun. Tutupnya diangkat, orang yang meninggal dimasukkan, dan tutupnya diletakkan kembali.', 'This building is for the dead. The other twenty-one in this project are for the living, for rice, or for a council; nobody enters this one and it is used for nothing. The lid is lifted, the dead are put in, and the lid is put back.'),
  sizedByASeatedBody: dim(1, 'count', 'canon', 'depdikbud-sulut', 'Orang mati diletakkan dalam keadaan duduk berlipat, jadi ruang di dalamnya diukur menurut tubuh yang duduk dan bukan tubuh yang berdiri. Bale Bali diukur menurut tubuh pemiliknya yang hidup; ini asas yang sama pada peristiwa yang lain sama sekali.', 'The dead are placed seated and folded, so the chamber is measured against a seated body rather than a standing one. A Balinese bale is measured against its living owner’s body; this is the same principle on an entirely different occasion.'),
  facesNorth: dim(1, 'count', 'canon', 'tim-waruga', 'Muka waruga menghadap utara, arah tempat leluhur dikatakan datang. Tongkonan juga menghadap utara dan alasannya berbeda; dua bangunan dengan aturan mata angin yang sama dan dua alasan yang tidak berhubungan adalah pengingat bahwa yang menarik dari sebuah aturan bukan angkanya.', 'A waruga faces north, the direction the ancestors are said to have come from. A tongkonan also faces north for a different reason; two buildings with the same compass rule and two unrelated reasons are a reminder that what is interesting about a rule is not its number.'),
  cutFromOneBlock: dim(1, 'count', 'canon', 'tim-waruga', 'Peti dan tutupnya dipahat dari batu, tanpa sambungan: tidak ada kayu, tidak ada ikat, tidak ada paku, dan tidak ada bahan kedua. Daftar bahan pak ini punya satu anggota, dan itu daftar terpendek dalam projek ini.', 'The box and its lid are cut from stone with no joint between materials: no timber, no lashing, no iron, no second substance. This pack’s material list has one member, and it is the shortest in the project.'),
  familyKeepsAdding: dim(1, 'count', 'canon', 'schouten-1998', 'Satu peti menampung beberapa orang dari satu keluarga, ditambahkan selama beberapa keturunan. Bangunan ini bertambah isinya tanpa bertambah ukurannya — jadi ia harus sudah cukup besar sejak hari pertama untuk orang-orang yang belum meninggal.', 'One box holds several of one family, added over generations. This building gains occupants without gaining size — so it has to have been large enough on the first day for the people who have not died yet.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  alas: 0.8,
  peti: 2.4,
  tutup: 1.6,
  muka: 0.6,
}

export const PACK: RulePack<WarugaKinds> = {
  key: 'waruga',
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

/* ── The lid ──────────────────────────────────────────────────────────── */

export interface TutupInfo {
  readonly tutup: Tutup
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const TUTUP: readonly TutupInfo[] = [
  {
    tutup: 'pelana',
    name: 'Pelana',
    glossId:
      'Tutup berbentuk pelana: dua bidang bertemu pada satu bubungan, seperti atap rumah yang ditaruh di atas peti batu.',
    glossEn:
      'A gabled lid: two planes meeting at a ridge, like a house roof set on a stone box.',
  },
  {
    tutup: 'limas',
    name: 'Limas',
    glossId:
      'Tutup berbentuk limas: empat bidang menuju satu titik. Bentuk yang sama dengan atap rumah, di atas ruang yang tidak dimasuki siapa pun.',
    glossEn:
      'A hipped lid: four planes to a point. The same shape as a house roof, over a room nobody enters.',
  },
]

export function tutupInfo(tutup: Tutup): TutupInfo {
  const found = TUTUP.find((t) => t.tutup === tutup)
  if (!found) throw new Error(`unknown tutup: ${tutup}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'alas',
    title: 'Alas',
    glossId: 'Lempeng alas diletakkan, bila dipakai, agar peti tidak duduk langsung di tanah.',
    glossEn: 'The base slab is set, where one is used, so the box does not sit straight on the earth.',
  },
  {
    stage: 'peti',
    title: 'Peti',
    glossId: 'Ruang dipahat ke dalam satu blok batu. Ruang itu diukur menurut tubuh yang duduk, dan cukup dalam untuk orang-orang yang belum meninggal.',
    glossEn: 'The chamber is cut into a single block of stone. It is measured against a seated body, and it is deep enough for the people who have not died yet.',
  },
  {
    stage: 'tutup',
    title: 'Tutup',
    glossId: 'Tutup berbentuk atap diletakkan pada takiknya. Ia diangkat lagi setiap kali ada yang meninggal, dan itulah satu-satunya bukaan bangunan ini.',
    glossEn: 'The roof-shaped lid is set in its rebate. It is lifted again at each death, and it is this building’s only opening.',
  },
  {
    stage: 'muka',
    title: 'Muka',
    glossId: 'Muka menghadap utara, arah tempat leluhur dikatakan datang. Pada waruga sesungguhnya muka inilah yang diukir dengan apa yang dikerjakan orang itu semasa hidup; ukiran itu tidak ada dalam model ini.',
    glossEn: 'The face looks north, the direction the ancestors are said to have come from. On a real waruga this face is carved with what the person did in life; that carving is not in this model.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { jumlah: 3, tutup: 'pelana', alas: true }

export const MIN_JUMLAH = 1
export const MAX_JUMLAH = 6

export function normaliseRules(rules: Rules): Rules {
  return {
    jumlah: Math.min(MAX_JUMLAH, Math.max(MIN_JUMLAH, Math.round(rules.jumlah))),
    tutup: rules.tutup,
    alas: rules.alas,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
