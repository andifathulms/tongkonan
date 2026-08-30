/**
 * The rule pack for the Sumbawa Dalam Loka.
 *
 * The thirty-fifth pack, and the first whose count comes from a text rather
 * than from anything in front of the builders.
 *
 * `ninetyNinePosts` is canon and it is the entry. The palace stands on
 * ninety-nine posts, for the ninety-nine names of God. Every other tally in
 * this project counts something present — households, clans, hearths, seats,
 * shoulders, sleeping bodies — and could in principle come out differently
 * next year. This one cannot: it is given, it is exact, and the frame is
 * arranged around it.
 *
 * `theGridIsNotFree` is the second. Ninety-nine is nine elevens, so the frame
 * is nine post lines one way and eleven the other, and the only choice left is
 * which way round they run. A rule that fixes a *count* turns out to fix a
 * shape, which is not a thing any other rule in this collection does.
 *
 * `growthComesOutOfTheSpans` is the third and it is where the limit is. A
 * household that wants a larger palace cannot add posts, because the number is
 * not theirs; the only thing left to enlarge is the distance between them, and
 * that runs into what a beam will cross. The count belongs to a text and the
 * span belongs to timber, and nothing relates them.
 *
 * `everyPostCarries` is the fourth, and it is what keeps the first honest. A
 * building can always be made to have ninety-nine posts by standing eleven
 * extra ones in the corners; what makes the count a fact about the structure
 * rather than about the arithmetic is that every one of them is under
 * something.
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
  SumbawaKinds,
  Susunan,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Nusa Tenggara Barat (Departemen Pendidikan dan Kebudayaan, ' +
      'Jakarta, 1986).',
    kind: 'reference',
  },
  {
    key: 'ntb-2012',
    citation:
      'Dinas Kebudayaan dan Pariwisata Nusa Tenggara Barat, Istana Dalam Loka Sumbawa ' +
      '(Mataram, 2012).',
    kind: 'reference',
  },
  {
    key: 'goethals-1961',
    citation:
      'Goethals, P. R., Aspects of Local Government in a Sumbawan Village ' +
      '(Cornell Modern Indonesia Project, Ithaca, 1961).',
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
  /* the grid, and what it may be stretched to */
  bayLength: dim(3.1, 'm', 'interpolated', 'none', 'Jarak antar tiang, dan satu-satunya angka yang tersisa untuk membesarkan bangunan ini. Jumlah tiangnya tidak dapat ditambah, jadi rumah tangga yang menghendaki istana yang lebih besar hanya punya angka ini.', 'The spacing of the posts, and the only figure left for making this building larger. The number of posts cannot be added to, so a household that wants a bigger palace has only this.'),
  beamSpan: dim(3.7, 'm', 'interpolated', 'none', 'Bentang terjauh yang masih diseberangi satu balok tanpa tiang di tengahnya. Angka kayu, bukan angka aturan — dan justru karena kedua angka itu milik pihak yang berbeda, jumlah tiang yang ditetapkan sebuah teks dapat berbenturan dengan apa yang dapat dipikul sebatang kayu.', 'The furthest a single beam crosses with no post under the middle of it. A figure belonging to timber rather than to a rule — and because the two belong to different parties, a post count fixed by a text can run into what a piece of wood will carry.'),

  /* the frame */
  floorHeight: dim(1.55, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah.', 'Height of the floor above the ground.'),
  padHeight: dim(0.32, 'm', 'interpolated', 'none', 'Tinggi batu di bawah tiang; tidak ada yang ditanam.', 'Height of the stone under a post; nothing is buried.'),
  padSocket: dim(0.05, 'm', 'interpolated', 'none', 'Dalamnya cekungan pada batu tempat kaki tiang duduk, supaya keduanya benar-benar bertaut.', 'Depth of the hollow in the stone the post foot sits in, so that the two actually engage.'),
  postSection: dim(0.2, 'm', 'interpolated', 'none', 'Sisi penampang tiang. Kesembilan puluh sembilannya sama, sebab yang dihitung tiang dan bukan tiang besar.', 'Section of a post. All ninety-nine are the same, because what is counted is posts rather than great posts.'),
  bearerDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi penampang balok lantai.', 'Depth of a floor beam.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor plank.'),

  /* the halls on it */
  wallHeight: dim(2.7, 'm', 'interpolated', 'none', 'Tinggi dinding papan sampai balok atap.', 'Height of the board wall to the plate.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),
  hallShare: dim(0.58, 'ratio', 'interpolated', 'none', 'Bagian panjang bangunan yang menjadi bala rea, balai besar; sisanya bagian dalam. Keduanya berdiri di bawah satu atap dan di atas satu rangka.', 'The share of the length that is the bala rea, the great hall; the rest is the inner part. The two stand under one roof and on one frame.'),
  bilikWidth: dim(2.6, 'm', 'interpolated', 'none', 'Lebar tiap bilik di bagian dalam.', 'Width of each room in the inner part.'),

  /* the roof */
  roofRise: dim(3.6, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas balok atap.', 'Rise of the ridge above the plate.'),
  ridgeShare: dim(0.42, 'ratio', 'interpolated', 'none', 'Panjang bubungan dibanding panjang bangunan.', 'Length of the ridge against the length of the building.'),
  eaveOversail: dim(1.2, 'm', 'interpolated', 'none', 'Tritisan atap sirap.', 'Overhang of the shingle roof.'),
  roofThickness: dim(0.1, 'm', 'interpolated', 'none', 'Tebal lapisan sirap.', 'Thickness of the shingle covering.'),

  /* the walkway */
  serambiReach: dim(6.5, 'm', 'interpolated', 'none', 'Panjang serambi tertutup ke bangunan di belakangnya.', 'Length of the covered walkway to the building behind.'),
  serambiWidth: dim(2.1, 'm', 'interpolated', 'none', 'Lebar serambi.', 'Width of the walkway.'),

  /* the ground */
  courtRadius: dim(24, 'm', 'interpolated', 'none', 'Jari-jari halaman istana di dalam pagar keliling.', 'Radius of the palace yard inside its wall.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  ninetyNinePosts: dim(99, 'count', 'canon', 'ntb-2012', 'Sembilan puluh sembilan tiang, sebanyak nama Tuhan. Tiap cacah lain dalam projek ini menghitung sesuatu yang ada di depan mata — rumah tangga, marga, perapian, tempat duduk, bahu, tubuh yang berbaring — dan tahun depan dapat berbeda. Yang ini tidak: ia diberikan, tepat, dan rangkanya yang harus disusun mengelilinginya.', 'Ninety-nine posts, as many as the names of God. Every other tally in this project counts something in front of the builders — households, clans, hearths, seats, shoulders, sleeping bodies — and could come out differently next year. This one cannot: it is given, it is exact, and the frame has to be arranged around it.'),
  theGridIsNotFree: dim(1, 'count', 'canon', 'depdikbud-1986', 'Sembilan puluh sembilan adalah sembilan kali sebelas, jadi rangkanya sembilan baris tiang ke satu arah dan sebelas ke arah lain, dan yang tersisa untuk dipilih hanyalah yang mana ke mana. Aturan yang menetapkan sebuah cacah ternyata menetapkan sebuah bentuk — dan tidak ada aturan lain dalam kumpulan ini yang berbuat begitu.', 'Ninety-nine is nine elevens, so the frame is nine post lines one way and eleven the other, and all that is left to choose is which way round. A rule that fixes a count turns out to fix a shape — and no other rule in this collection does that.'),
  growthComesOutOfTheSpans: dim(1, 'count', 'canon', 'goethals-1961', 'Yang menghendaki istana lebih besar tidak dapat menambah tiang, sebab jumlahnya bukan miliknya. Yang tersisa hanyalah merenggangkan jaraknya — dan jarak itu berbenturan dengan bentang yang dapat diseberangi sebatang balok. Cacahnya milik sebuah teks, bentangnya milik kayunya, dan tidak ada yang menghubungkan keduanya.', 'Anybody wanting a larger palace cannot add posts, because the number is not theirs. All that is left is to stretch the spacing — and that runs into the span a single beam will cross. The count belongs to a text, the span belongs to the timber, and nothing relates them.'),
  everyPostCarries: dim(1, 'count', 'canon', 'ntb-2012', 'Tiap tiang dari kesembilan puluh sembilan itu memikul sesuatu. Bangunan mana pun dapat dibuat bertiang sembilan puluh sembilan dengan menambahkan sebelas tiang hiasan di sudutnya; yang membuat cacah ini fakta tentang bangunannya dan bukan tentang hitungannya adalah bahwa tidak ada satu pun yang berdiri tanpa memikul apa-apa.', 'Every one of the ninety-nine carries something. Any building can be made to have ninety-nine posts by standing eleven ornamental ones in its corners; what makes this count a fact about the structure rather than about arithmetic is that not one of them stands under nothing.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 1.0,
  tiang: 2.6,
  lantai: 1.8,
  dinding: 1.6,
  atap: 2.4,
  serambi: 0.8,
}

export const PACK: RulePack<SumbawaKinds> = {
  key: 'sumbawa',
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

/* ── Which way the grid runs ──────────────────────────────────────────── */

export interface SusunanInfo {
  readonly susunan: Susunan
  readonly across: number
  readonly along: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

/**
 * The only two arrangements the number allows.
 *
 * Ninety-nine has other factorisations — three by thirty-three, one by
 * ninety-nine — and neither is a building. What is left is nine by eleven,
 * either way round.
 */
export const SUSUNAN: readonly SusunanInfo[] = [
  {
    susunan: 'sembilan-lintang',
    across: 9,
    along: 11,
    name: 'Sembilan melintang',
    glossId: 'Sembilan baris tiang melintang dan sebelas memanjang: bangunan yang lebih panjang daripada lebarnya.',
    glossEn: 'Nine post lines across and eleven along: a building longer than it is wide.',
  },
  {
    susunan: 'sebelas-lintang',
    across: 11,
    along: 9,
    name: 'Sebelas melintang',
    glossId: 'Sebelas melintang dan sembilan memanjang: bangunan yang lebih lebar daripada panjangnya, dan itulah satu-satunya kebebasan yang ditinggalkan angka sembilan puluh sembilan.',
    glossEn: 'Eleven across and nine along: a building wider than it is long, and that is the only freedom ninety-nine leaves.',
  },
]

export function susunanInfo(susunan: Susunan): SusunanInfo {
  const found = SUSUNAN.find((s) => s.susunan === susunan)
  if (!found) throw new Error(`unknown susunan: ${susunan}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Sembilan puluh sembilan batu diletakkan lebih dulu, satu untuk tiap tiang. Tidak ada yang ditanam.',
    glossEn: 'Ninety-nine stones are set first, one for each post. Nothing is buried.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Sembilan puluh sembilan tiang berdiri di atas batunya, sembilan baris ke satu arah dan sebelas ke arah lain.',
    glossEn: 'Ninety-nine posts stand on their stones, nine lines one way and eleven the other.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Balok dan papan lantai dipasang di atas seluruh rangka: satu lantai untuk dua bagian bangunan.',
    glossEn: 'Beams and floor go on over the whole frame: one floor for both parts of the building.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding papan menutupnya, dan bagian dalam dibagi menjadi bilik-bilik; bala rea di depan dibiarkan lapang.',
    glossEn: 'Board walls close it, and the inner part is divided into rooms; the bala rea at the front is left open.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Satu atap sirap menutupi kedua bagian sekaligus.',
    glossEn: 'One shingle roof covers both parts at once.',
  },
  {
    stage: 'serambi',
    title: 'Serambi',
    glossId: 'Serambi tertutup ke bangunan di belakang dipasang terakhir.',
    glossEn: 'The covered walkway to the building behind goes on last.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { bilik: 4, susunan: 'sembilan-lintang', serambi: true }

export const MIN_BILIK = 2
export const MAX_BILIK = 6

export function normaliseRules(rules: Rules): Rules {
  return {
    bilik: Math.min(MAX_BILIK, Math.max(MIN_BILIK, Math.round(rules.bilik))),
    susunan: rules.susunan,
    serambi: rules.serambi,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
