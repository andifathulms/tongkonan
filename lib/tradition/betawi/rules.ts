/**
 * The rule pack for the Betawi rumah kebaya.
 *
 * The thirty-second pack, and the first whose building is bounded by other
 * people's property.
 *
 * `theFrontIsForStrangers` is canon and it is the entry. The langkan is a
 * raised terrace facing the road with a low rail and no door between it and
 * the street: a neighbour, a trader, a stranger can stand on it, be received
 * on it and leave from it without ever being let into the house. Twenty-nine
 * buildings before this divide space among people who belong to them. This one
 * has a room for people who do not, and it is the room the house shows the
 * road.
 *
 * `theLineIsSomebodyElses` is the second and it is where the limit comes from.
 * A tongkonan is stopped by a rank, a khaim by a tree, a sudung by what a
 * person can carry, a malige by the reach of an arm. This house is stopped by
 * a boundary — a plot line drawn by somebody who is not family, with a
 * neighbour on the other side of it. It is the first constraint in this
 * project that is a legal fact rather than a material or bodily one.
 *
 * `theRoofFolds` is the third. A kebaya's roof changes pitch on its way down:
 * steep over the house, then shallower out over the terrace, and it is that
 * fold seen from the side that gives the house its name. The Banjar rumah
 * bubungan tinggi also takes its name from a roof, and that is a different
 * claim — there four roofs stand in a row along one ridge, here one slope
 * bends once.
 *
 * `everythingIsBought` is the fourth and it is about a city rather than a
 * building. Nothing here is cut from the ground it stands on: timber sold by
 * the length, tiles fired somewhere else, a floor tile bought by the piece,
 * and nails, which no other building in this collection has at all.
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
  BetawiKinds,
  Dim,
  Layout,
  Letak,
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
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Khusus Ibukota Jakarta (Departemen Pendidikan dan Kebudayaan, ' +
      'Jakarta, 1986).',
    kind: 'reference',
  },
  {
    key: 'heuken-2007',
    citation: 'Heuken, A., Historical Sites of Jakarta (Cipta Loka Caraka, Jakarta, 2007).',
    kind: 'reference',
  },
  {
    key: 'swadarma-2013',
    citation: 'Swadarma, D. & Aryanto, Y., Rumah Etnik Betawi (Griya Kreasi, Jakarta, 2013).',
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
  /* the plot, which is not the house's to decide */
  plotWidth: dim(16, 'm', 'interpolated', 'none', 'Lebar kavling, dari garis batas ke garis batas. Angka ini bukan milik rumahnya: ia sudah ada sebelum rumahnya dibangun, dan di seberang garis itu ada orang lain. Yang diukur terhadap garis ini bukan dindingnya melainkan tritisannya — atap yang menjorok melewati batas adalah perkara antar tetangga, bukan soal tukang.', 'Width of the plot, boundary line to boundary line. It is not the house’s figure: it was there before the house was built, and on the far side of that line is somebody else. What is measured against it is not the wall but the eave — a roof that oversails a boundary is a matter between neighbours rather than a question for the builder.'),
  plotDepth: dim(22, 'm', 'interpolated', 'none', 'Dalam kavling, dari jalan ke belakang.', 'Depth of the plot, from the road backward.'),
  roadSetback: dim(4.5, 'm', 'interpolated', 'none', 'Jarak muka langkan dari garis jalan, pada kavling yang menghadap jalan.', 'Distance from the front of the langkan to the road line, on a plot that fronts the road.'),
  pathSetback: dim(8, 'm', 'interpolated', 'none', 'Jarak muka langkan dari jalan, pada kavling di dalam yang dicapai lewat gang. Rumah yang tidak menghadap jalan tetap diukur terhadap jalan itu.', 'Distance from the front of the langkan to the road, on an inner plot reached along a lane. A house that does not front the road is still measured against it.'),
  sideMargin: dim(1.2, 'm', 'interpolated', 'none', 'Jarak bebas terkecil yang harus tersisa antara rumah dan garis batas samping. Inilah batas bangunan ini, dan ia digambar orang lain.', 'The least clear distance that has to be left between the house and the side boundary. It is this building’s limit, and somebody else drew it.'),

  /* the house on it */
  roomWidth: dim(2.9, 'm', 'interpolated', 'none', 'Lebar tiap kamar. Menambah kamar melebarkan rumah, dan rumah yang melebar berjalan ke arah garis batas.', 'Width of each room. More rooms make a wider house, and a wider house walks toward the boundary.'),
  coreDepth: dim(9.5, 'm', 'interpolated', 'none', 'Dalam badan rumah, di belakang langkan.', 'Depth of the body of the house, behind the langkan.'),
  plinthHeight: dim(0.55, 'm', 'interpolated', 'none', 'Tinggi lantai bata di atas tanah. Rumah kota di tanah rendah yang banjir: panggung rendah dari pasangan, bukan tiang.', 'Height of the brick plinth above the ground. A city house on low ground that floods: a low masonry platform rather than posts.'),
  wallHeight: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi dinding sampai balok atap.', 'Height of the wall to the plate.'),
  wallThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),
  postSeat: dim(0.06, 'm', 'interpolated', 'none', 'Dalamnya kaki tiang duduk ke dalam lantai bata. Tanpanya tiang hanya menyentuh lantainya pada satu bidang, dan sambungan yang kedua bagiannya tidak saling memasuki tidak memegang apa-apa.', 'How far a post foot sits down into the brick plinth. Without it the post only touches the plinth on one plane, and a joint whose members do not enter each other holds nothing.'),
  postSection: dim(0.14, 'm', 'interpolated', 'none', 'Sisi penampang tiang kayu.', 'Section of a timber post.'),
  tileThickness: dim(0.03, 'm', 'interpolated', 'none', 'Tebal ubin lantai — dibeli sekeping-sekeping, dan itu lantai pertama dalam projek ini yang dibeli.', 'Thickness of a floor tile — bought by the piece, and the first floor in this project that was purchased.'),

  /* the terrace for people who are not let in */
  langkanDepth: dim(3.2, 'm', 'interpolated', 'none', 'Dalam langkan: cukup untuk menerima orang, duduk, dan berdagang tanpa membuka pintu.', 'Depth of the langkan: room enough to receive somebody, sit, and do business without opening a door.'),
  langkanRail: dim(0.62, 'm', 'interpolated', 'none', 'Tinggi pagar langkan. Rendah dengan sengaja: ia menandai batas, bukan menutupnya, dan orang di jalan tetap dapat melihat siapa yang di dalamnya.', 'Height of the langkan rail. Low on purpose: it marks the edge rather than closing it, and somebody on the road can still see who is on it.'),
  langkanStep: dim(0.18, 'm', 'interpolated', 'none', 'Tinggi anak tangga dari halaman ke langkan.', 'Rise of a step from the yard up to the langkan.'),

  /* the fold the house is named for */
  foldAt: dim(0.38, 'ratio', 'interpolated', 'none', 'Di mana atapnya berganti kemiringan, diukur dari bubungan ke tepi. Lipatan inilah yang dilihat dari samping dan yang memberi rumah ini namanya.', 'Where the roof changes pitch, measured from the ridge to the eave. That fold seen from the side is what gives this house its name.'),
  upperPitch: dim(0.62, 'ratio', 'interpolated', 'none', 'Kemiringan bidang atas: turun sekian meter untuk tiap meter mendatar.', 'Pitch of the upper plane: metres of fall for each metre out.'),
  lowerPitch: dim(0.3, 'ratio', 'interpolated', 'none', 'Kemiringan bidang bawah, yang harus lebih landai daripada bidang atas — kalau tidak, tidak ada lipatan dan rumahnya bukan rumah kebaya lagi.', 'Pitch of the lower plane, which has to be shallower than the upper one — otherwise there is no fold, and the house is no longer a rumah kebaya.'),
  eaveOversail: dim(0.7, 'm', 'interpolated', 'none', 'Tritisan atap genteng.', 'Overhang of the tiled roof.'),
  roofThickness: dim(0.09, 'm', 'interpolated', 'none', 'Tebal lapisan genteng.', 'Thickness of the tile covering.'),

  /* the carved fascia */
  gigiHeight: dim(0.28, 'm', 'interpolated', 'none', 'Tinggi papan gigi balang di sepanjang tepi atap.', 'Height of the gigi balang board along the eave.'),
  gigiThickness: dim(0.03, 'm', 'interpolated', 'none', 'Tebal papan gigi balang.', 'Thickness of the gigi balang board.'),
  gigiOverlap: dim(0.04, 'm', 'interpolated', 'none', 'Sejauh mana papan gigi balang naik ke dalam lapisan genteng yang dipakukan padanya.', 'How far the gigi balang board reaches up into the tiling it is nailed to.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  theFrontIsForStrangers: dim(1, 'count', 'canon', 'depdikbud-1986', 'Langkan adalah lantai terangkat di muka rumah, berpagar rendah dan tanpa pintu antara ia dan jalan: tetangga, pedagang, atau orang yang tidak dikenal dapat berdiri di situ, diterima di situ, dan pulang dari situ tanpa pernah dipersilakan masuk. Dua puluh sembilan bangunan sebelumnya membagi ruang di antara orang yang termasuk ke dalamnya; yang ini punya ruang untuk orang yang tidak.', 'The langkan is a raised floor at the front of the house, with a low rail and no door between it and the road: a neighbour, a trader or a stranger can stand on it, be received on it and leave from it without ever being let inside. The twenty-nine buildings before this divide space among people who belong to them; this one has a room for people who do not.'),
  theLineIsSomebodyElses: dim(1, 'count', 'canon', 'heuken-2007', 'Rumahnya berdiri di atas kavling dengan garis batas di kedua sisinya, dan di seberang garis itu ada orang lain. Tongkonan dibatasi pangkat, khaim oleh pohonnya, sudung oleh apa yang dapat dipikul orang, malige oleh jangkauan sebuah lengan. Yang ini dibatasi oleh sebuah garis — kendala pertama dalam projek ini yang berupa milik orang lain, bukan bahan atau tubuh.', 'The house stands on a plot with a boundary line down each side, and on the far side of that line is somebody else. A tongkonan is bounded by rank, a khaim by its tree, a sudung by what a person can carry, a malige by the reach of an arm. This one is bounded by a line — the first constraint in this project that is somebody else’s property rather than a material or a body.'),
  theRoofFolds: dim(2, 'count', 'canon', 'swadarma-2013', 'Atapnya berganti kemiringan di tengah jalannya turun: curam di atas rumah, lalu lebih landai di atas langkan. Lipatan itulah yang terlihat dari samping dan yang memberi rumah ini namanya. Rumah bubungan tinggi Banjar juga mengambil namanya dari atap, dan itu pernyataan yang lain: di sana empat atap berjajar pada satu bubungan, di sini satu bidang membelok satu kali.', 'The roof changes pitch partway down: steep over the house, then shallower out over the langkan. That fold seen from the side is what gives the house its name. The Banjar rumah bubungan tinggi also takes its name from a roof, and that is a different claim: there four roofs stand in a row along one ridge, here one slope bends once.'),
  everythingIsBought: dim(0, 'count', 'canon', 'heuken-2007', 'Nol bahan yang diambil dari tanah tempatnya berdiri. Kayunya turun sungai ke galangan dan dijual per batang; gentengnya dibakar di tempat lain; ubinnya dibeli sekeping-sekeping; dan pakunya — satu-satunya paku dalam kumpulan ini — juga dibeli. Ini bukan catatan tentang bahan melainkan tentang sebuah kota: rumah ini dibangun dari pasar, bukan dari hutan di sekelilingnya.', 'Zero materials taken from the ground it stands on. Its timber comes down a river to a yard and is sold by the length; its tiles are fired elsewhere; its floor tiles are bought by the piece; and its nails — the only nails in this collection — are bought too. This is not a note about materials but about a city: the house is built out of a market rather than out of the forest around it.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  pondasi: 1.2,
  rangka: 2.0,
  dinding: 1.6,
  atap: 2.2,
  langkan: 1.0,
  hias: 0.6,
}

export const PACK: RulePack<BetawiKinds> = {
  key: 'betawi',
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

/* ── Where the plot is ────────────────────────────────────────────────── */

export interface LetakInfo {
  readonly letak: Letak
  /** the dimension key, not a copy of its value — the Banjar pack's lesson */
  readonly key: DimKey
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const LETAK: readonly LetakInfo[] = [
  {
    letak: 'pinggir-jalan',
    key: 'roadSetback',
    name: 'Menghadap jalan',
    glossId: 'Kavling di tepi jalan: langkannya menghadap orang lewat, dan siapa pun yang berhenti di depan rumah sudah setengah diterima.',
    glossEn: 'A plot on the road: the langkan faces the people going past, and anybody who stops in front of the house is already half received.',
  },
  {
    letak: 'dalam',
    key: 'pathSetback',
    name: 'Kavling dalam',
    glossId: 'Kavling di dalam, dicapai lewat gang di antara kavling lain. Rumahnya lebih jauh dari jalan dan tetap diukur terhadap jalan itu — sebab yang menentukan letaknya tetap jalan, bukan kerabat.',
    glossEn: 'An inner plot, reached along a lane between other plots. The house sits further from the road and is still measured against it — because what places it is still the road rather than kin.',
  },
]

export function letakInfo(letak: Letak): LetakInfo {
  const found = LETAK.find((l) => l.letak === letak)
  if (!found) throw new Error(`unknown letak: ${letak}`)
  return found
}

/** The setback this rule selects, read live from the pack. */
export function setbackOf(letak: Letak): number {
  return DIMS[letakInfo(letak).key].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'pondasi',
    title: 'Pondasi',
    glossId: 'Lantai bata dinaikkan di atas tanah rendah yang banjir, di dalam garis kavling yang sudah ada sebelum rumahnya.',
    glossEn: 'A brick plinth goes up above low ground that floods, inside a plot line that was there before the house.',
  },
  {
    stage: 'rangka',
    title: 'Rangka',
    glossId: 'Rangka kayu berdiri di atas lantai itu — kayu yang dibeli per batang, bukan ditebang di sekitarnya.',
    glossEn: 'A timber frame stands on it — timber bought by the length rather than cut nearby.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding papan dan bata menutup badan rumah, dan mukanya sengaja dibiarkan terbuka.',
    glossEn: 'Board and brick walls close the body of the house, and its front is deliberately left open.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Genteng dipasang pada dua bidang yang berbeda kemiringannya, dan lipatan di antaranya yang memberi rumah ini namanya.',
    glossEn: 'Tiles go on over two planes of different pitch, and the fold between them is what gives this house its name.',
  },
  {
    stage: 'hias',
    title: 'Gigi balang',
    glossId: 'Papan gigi balang dipaku di sepanjang tepi atap, terakhir. Ukirannya sendiri tidak dimodelkan.',
    glossEn: 'The gigi balang board is nailed along the eave, last. Its carving itself is not modelled.',
  },
  {
    stage: 'langkan',
    title: 'Langkan',
    glossId: 'Langkan dipasang di muka: lantai terangkat berpagar rendah, tanpa pintu antara ia dan jalan.',
    glossEn: 'The langkan goes on at the front: a raised floor with a low rail, and no door between it and the road.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { kamar: 3, letak: 'pinggir-jalan', gigiBalang: true }

export const MIN_KAMAR = 2
export const MAX_KAMAR = 4

export function normaliseRules(rules: Rules): Rules {
  return {
    kamar: Math.min(MAX_KAMAR, Math.max(MIN_KAMAR, Math.round(rules.kamar))),
    letak: rules.letak,
    gigiBalang: rules.gigiBalang,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
