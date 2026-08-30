/**
 * The rule pack for the Ngada ngadhu and bhaga.
 *
 * The twenty-seventh pack, and the first whose subject cannot be counted as
 * one thing.
 *
 * `pairIsTheUnit` is canon and it is the whole entry. A ngadhu is the male
 * ancestor of a clan and a bhaga the female, and a clan has both. One without
 * the other is not a lesser statement; it is an incomplete one, which is a
 * different kind of claim from anything else in this collection — every other
 * rule here says how large, how many, how high or where, and this one says
 * that a thing is only itself in company.
 *
 * `bhagaIsAModel` is the second. A bhaga is a house at reduced size, and its
 * dimensions come from being a *representation* rather than from a body or a
 * use. So the pack declares a body — crouching height and shoulder width,
 * against the same `anthropometry` key the Balinese bale and the Minahasa
 * waruga use — and requires the building to be smaller than it. Three packs
 * now measure a human being: one to size a house for a living body, one to
 * size a chamber for a folded dead one, and this one to prove that nobody can
 * get in at all.
 *
 * `neitherIsShelter` is the third. The ngadhu's cap covers its own post and
 * nothing else; the bhaga has a floor a metre across. The bade has tiers that
 * shelter nothing and at least carries a body; these carry nobody.
 *
 * On the buried part of the post, which is the interesting omission: a ngadhu
 * is planted deep, and the depth is a real dimension of the real object. The
 * core refuses any part below y = 0 — rightly, for every other building here —
 * so the depth is declared, used to state the proportion standing above
 * ground, and not drawn. See the caution.
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
  NgadaKinds,
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
    key: 'arndt-1954',
    citation: 'Arndt, P., Gesellschaftliche Verhältnisse der Ngadha (Anthropos-Institut, Wien, 1954).',
    kind: 'ethnography',
  },
  {
    key: 'schroter-1998',
    citation:
      'Schröter, S., “Death in Ngada: Ancestor Worship, Rituals and Social Structure”, ' +
      'Anthropos 93, 1998.',
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
    key: 'anthropometry',
    citation:
      'Ukuran tubuh manusia yang ditetapkan penulis, bukan dari sumber tentang Ngada. ' +
      'Kunci yang sama dipakai pak Bali dan pak Waruga.',
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
  /* the square, which is levelled before anything stands in it */
  nuaWidth: dim(14, 'm', 'interpolated', 'none', 'Lebar nua, dari deret sa’o ke deret sa’o.', 'Width of the nua, from one row of houses to the other.'),
  pairSpacing: dim(6.5, 'm', 'interpolated', 'none', 'Jarak dari satu pasangan ke pasangan berikutnya di sepanjang nua. Panjang alun-alun ini adalah hitungan klan.', 'Distance from one pair to the next along the nua. The length of this square is a count of clans.'),
  nuaMargin: dim(4, 'm', 'interpolated', 'none', 'Sisa nua di kedua ujungnya.', 'The stretch of nua left at either end.'),
  nuaThickness: dim(0.1, 'm', 'interpolated', 'none', 'Tebal perkerasan batu alun-alun.', 'Thickness of the stone paving of the square.'),
  pairOffset: dim(1.6, 'm', 'interpolated', 'none', 'Jarak ngadhu dan bhaga dari sumbu alun-alun, ke arah berlawanan. Keduanya berdiri berhadapan, dan itulah satu-satunya ukuran dalam projek ini yang menyatakan bahwa dua benda adalah satu pernyataan.', 'How far the ngadhu and the bhaga stand off the axis of the square, in opposite directions. They stand facing each other, and it is the only dimension in this project stating that two objects are one statement.'),

  /* the male post */
  ngadhuShort: dim(3.2, 'm', 'interpolated', 'none', 'Tinggi tiang ngadhu di atas tanah, untuk yang pendek.', 'Height of the ngadhu post above ground, for a short one.'),
  ngadhuMid: dim(4.1, 'm', 'interpolated', 'none', 'Tinggi tiang ngadhu di atas tanah, ukuran tengah.', 'Height of the ngadhu post above ground, middling.'),
  ngadhuTall: dim(5.3, 'm', 'interpolated', 'none', 'Tinggi tiang ngadhu di atas tanah, untuk yang tinggi. Sumber sepakat bahwa tiang yang lebih tinggi milik klan yang telah menyelenggarakan pesta lebih besar, dan tidak satu pun memberi angkanya.', 'Height of the ngadhu post above ground, for a tall one. The sources agree that a taller post belongs to a clan that has held the larger feasts, and not one of them gives a figure.'),
  ngadhuPlanted: dim(1.4, 'm', 'interpolated', 'none', 'Dalamnya tiang ngadhu tertanam. Angka ini dinyatakan dan tidak digambar: inti projek ini menolak bagian mana pun yang berada di bawah y = 0, dan penolakan itu benar untuk dua puluh enam bangunan lainnya.', 'How deep the ngadhu post is planted. The figure is declared and not drawn: the core refuses any part below y = 0, and that refusal is right for the other twenty-six buildings here.'),
  ngadhuSection: dim(0.34, 'm', 'interpolated', 'none', 'Garis tengah tiang ngadhu.', 'Diameter of the ngadhu post.'),
  ngadhuArm: dim(0.95, 'm', 'interpolated', 'none', 'Panjang lengan bercabang di puncak tiang.', 'Length of the forked arms at the head of the post.'),
  ngadhuArmSection: dim(0.13, 'm', 'interpolated', 'none', 'Sisi penampang lengan.', 'Section of an arm.'),
  capRadius: dim(1.15, 'm', 'interpolated', 'none', 'Jari-jari topi ijuk di atas tiang. Topi ini hanya menaungi tiangnya sendiri: tidak ada lantai di bawahnya, dan tidak ada seorang pun yang berteduh di situ.', 'Radius of the thatch cap over the post. The cap shelters its own post and nothing else: there is no floor under it, and nobody stands in it.'),
  capRise: dim(1.05, 'm', 'interpolated', 'none', 'Tinggi kerucut topi ijuk.', 'Rise of the thatch cone.'),
  capFacets: dim(20, 'count', 'interpolated', 'none', 'Banyaknya sisi kerucut yang digambar. Ini angka tesselasi, bukan ukuran bangunan.', 'How many facets the cone is drawn with. A tessellation count, not a dimension of the building.'),

  /* the female house, in miniature */
  bhagaWidth: dim(1.35, 'm', 'interpolated', 'none', 'Lebar bhaga. Ini bukan ruang untuk sesuatu: ini rumah yang dibuat kecil, dan ukurannya berasal dari apa yang digambarkannya, bukan dari apa yang ditampungnya.', 'Width of a bhaga. It is not room for anything: it is a house made small, and its size comes from what it depicts rather than from what it holds.'),
  bhagaDepth: dim(1.5, 'm', 'interpolated', 'none', 'Dalam bhaga.', 'Depth of a bhaga.'),
  bhagaFloorY: dim(0.55, 'm', 'interpolated', 'none', 'Tinggi lantai bhaga di atas tanah, di atas tiang-tiang pendeknya.', 'Height of a bhaga’s floor above the ground, on its short posts.'),
  bhagaWallHeight: dim(0.85, 'm', 'interpolated', 'none', 'Tinggi dinding bhaga.', 'Height of a bhaga’s wall.'),
  bhagaRise: dim(1.1, 'm', 'interpolated', 'none', 'Tinggi bubungan bhaga di atas dindingnya.', 'Rise of a bhaga’s ridge above its wall.'),
  bhagaEave: dim(0.3, 'm', 'interpolated', 'none', 'Tritisan atap bhaga.', 'Overhang of a bhaga’s roof.'),
  bhagaPost: dim(0.11, 'm', 'interpolated', 'none', 'Sisi penampang tiang pendek bhaga.', 'Section of a bhaga’s short post.'),
  bhagaBoard: dim(0.04, 'm', 'interpolated', 'none', 'Tebal papan bhaga.', 'Thickness of a bhaga’s boards.'),
  doorWidth: dim(0.42, 'm', 'interpolated', 'none', 'Lebar bukaan pada muka bhaga.', 'Width of the opening in the front of a bhaga.'),
  doorHeight: dim(0.5, 'm', 'interpolated', 'none', 'Tinggi bukaan pada muka bhaga. Bukaan ini lebih kecil daripada tubuh manusia dengan sengaja, dan itulah yang membedakan model rumah dari rumah yang sangat kecil.', 'Height of the opening in the front of a bhaga. It is smaller than a human body on purpose, and that is what separates a model of a house from a very small house.'),

  /* the body it is measured against, and not from a book about Ngada */
  crouchingHeight: dim(1.28, 'm', 'interpolated', 'anthropometry', 'Tinggi tubuh manusia yang membungkuk masuk. Bukan dari sumber tentang Ngada — kunci sumbernya sendiri supaya terlihat begitu, sama seperti pada pak Bali dan pak Waruga.', 'Height of a human body stooping through an opening. Not from a source about Ngada — its own source key so that this shows, exactly as in the Bali and Waruga packs.'),
  shoulderWidth: dim(0.46, 'm', 'interpolated', 'anthropometry', 'Lebar bahu manusia dewasa.', 'Shoulder width of an adult.'),

  /* the stone platform */
  tureWidth: dim(2.4, 'm', 'interpolated', 'none', 'Lebar susunan batu di samping pasangan.', 'Width of the stone platform beside a pair.'),
  tureDepth: dim(1.8, 'm', 'interpolated', 'none', 'Dalam susunan batu.', 'Depth of the stone platform.'),
  tureHeight: dim(0.4, 'm', 'interpolated', 'none', 'Tinggi susunan batu.', 'Height of the stone platform.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  pairIsTheUnit: dim(2, 'count', 'canon', 'arndt-1954', 'Ngadhu adalah leluhur laki-laki sebuah klan dan bhaga leluhur perempuannya, dan satu klan memiliki keduanya. Satu tanpa yang lain bukan pernyataan yang lebih kecil melainkan pernyataan yang belum utuh. Dua puluh enam entri sebelumnya adalah satu benda; yang ini dua benda yang berlainan jenis dan harus ada bersama-sama.', 'A ngadhu is a clan’s male ancestor and a bhaga its female one, and a clan has both. One without the other is not a smaller statement but an incomplete one. The twenty-six entries before this are one object each; this is two objects of different kinds that have to exist together.'),
  bhagaIsAModel: dim(1, 'count', 'canon', 'schroter-1998', 'Bhaga adalah rumah yang dibuat kecil: terlalu kecil untuk dimasuki, dan memang begitu maksudnya. Semua ukuran lain dalam projek ini berasal dari tubuh, ruang, pangkat, rumah tangga, atau kerumunan; yang ini berasal dari apa yang digambarkannya. Karena itu pak ini menyatakan ukuran tubuh manusia dan mengharuskan bangunannya lebih kecil daripada itu.', 'A bhaga is a house made small: too small to enter, and meant to be. Every other size in this project comes from a body, a room, a rank, a household or a crowd; this one comes from what it depicts. So the pack declares a human body and requires the building to be smaller than it.'),
  neitherIsShelter: dim(0, 'count', 'canon', 'depdikbud-1986', 'Nol orang berteduh. Topi ngadhu menaungi tiangnya sendiri dan tidak ada lantai di bawahnya; lantai bhaga selebar satu meter lebih sedikit. Tumpang pada bade juga tidak menaungi apa pun, tetapi bade masih membawa satu tubuh; yang ini tidak membawa siapa-siapa.', 'Zero people sheltered. A ngadhu’s cap covers its own post and has no floor under it; a bhaga’s floor is a little over a metre across. The bade’s tiers shelter nothing either, but a bade still carries a body; these carry nobody.'),
  onePairPerClan: dim(1, 'count', 'canon', 'arndt-1954', 'Satu pasangan untuk tiap klan, berjajar di sepanjang nua. Panjang alun-alun adalah hitungan klan — seperti panjang rumah betang adalah hitungan rumah tangga, dan panjang tanean adalah silsilah.', 'One pair for each clan, ranged along the nua. The length of the square is a count of clans — as the length of a betang is a count of households, and the length of a tanean is a genealogy.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  nua: 0.6,
  ngadhu: 2.4,
  bhaga: 2.0,
  ture: 0.8,
}

export const PACK: RulePack<NgadaKinds> = {
  key: 'ngada',
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

/* ── How tall the post stands ─────────────────────────────────────────── */

export interface TinggiInfo {
  readonly tinggi: Tinggi
  /** the dimension key, not a copy of its value — the Banjar pack's lesson */
  readonly key: DimKey
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const TINGGI: readonly TinggiInfo[] = [
  {
    tinggi: 'pendek',
    key: 'ngadhuShort',
    name: 'Pendek',
    glossId: 'Tiang pendek, untuk klan yang belum menyelenggarakan pesta besar.',
    glossEn: 'A short post, for a clan that has not yet held the larger feasts.',
  },
  {
    tinggi: 'sedang',
    key: 'ngadhuMid',
    name: 'Sedang',
    glossId: 'Ukuran tengah, yang paling banyak berdiri.',
    glossEn: 'The middling size, and the one most often standing.',
  },
  {
    tinggi: 'tinggi',
    key: 'ngadhuTall',
    name: 'Tinggi',
    glossId: 'Tiang tinggi. Sumber sepakat bahwa yang lebih tinggi milik klan yang telah menyelenggarakan pesta lebih besar; tidak satu pun memberi angkanya, jadi ketiga angka di sini adalah bacaan penulis.',
    glossEn: 'A tall post. The sources agree that the taller ones belong to clans that have held the larger feasts; none gives a figure, so all three heights here are the author’s reading.',
  },
]

export function tinggiInfo(tinggi: Tinggi): TinggiInfo {
  const found = TINGGI.find((t) => t.tinggi === tinggi)
  if (!found) throw new Error(`unknown tinggi: ${tinggi}`)
  return found
}

/** The post height this rule selects, read live from the pack. */
export function heightOf(tinggi: Tinggi): number {
  return DIMS[tinggiInfo(tinggi).key].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'nua',
    title: 'Nua',
    glossId: 'Alun-alun diratakan dan dikeraskan lebih dulu. Semua yang berdiri di sini berdiri di dalamnya, dan rumah-rumah berjajar mengelilinginya.',
    glossEn: 'The square is levelled and paved first. Everything that stands here stands inside it, and the houses are ranged around it.',
  },
  {
    stage: 'ngadhu',
    title: 'Ngadhu',
    glossId: 'Tiang ditanam dan diberi topi ijuk. Bagian yang tertanam tidak digambar — lihat catatan pada pak ini.',
    glossEn: 'The post is planted and given its thatch cap. What is buried is not drawn — see the note in this pack.',
  },
  {
    stage: 'bhaga',
    title: 'Bhaga',
    glossId: 'Rumah kecil didirikan berhadapan dengan tiangnya. Ia dibuat setelah tiangnya, dan tanpanya tiang itu belum berarti apa-apa.',
    glossEn: 'The little house goes up facing its post. It is made after the post, and without it the post does not yet mean anything.',
  },
  {
    stage: 'ture',
    title: 'Ture',
    glossId: 'Susunan batu di samping tiap pasangan, terakhir dan terendah.',
    glossEn: 'The stone platform beside each pair, last and lowest.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { pasangan: 3, tinggi: 'sedang', ture: true }

export const MIN_PASANGAN = 1
export const MAX_PASANGAN = 6

export function normaliseRules(rules: Rules): Rules {
  return {
    pasangan: Math.min(MAX_PASANGAN, Math.max(MIN_PASANGAN, Math.round(rules.pasangan))),
    tinggi: rules.tinggi,
    ture: rules.ture,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
