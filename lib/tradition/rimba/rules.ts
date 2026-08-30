/**
 * The rule pack for the Orang Rimba sudung.
 *
 * The twenty-ninth pack, the smallest building in the collection, and the one
 * whose sourcing is thinnest — which is stated here at the front rather than
 * buried, because it is the honest thing this pack has to say about itself.
 *
 * `melangunEndsIt` is canon and it is the entry. When somebody dies the family
 * leaves the place and does not return to it, so the shelter is not
 * dismantled, not burned, not inherited: it is left standing and the forest
 * takes it. Three other buildings here end deliberately — the bade is burned
 * the afternoon it is finished, the woloan house is unpegged and carried away,
 * the waruga is made never to move at all. This one ends on a day nobody
 * chooses, which is a fourth answer and not a version of any of them.
 *
 * `sizeIsSleepingBodies` is the second. The plan is a row of people lying side
 * by side. Four packs already measure a person — the bale a standing owner,
 * the waruga a folded corpse, the ngada bhaga a body that must not fit through
 * a door, the ume kbubu a body stooping under one — and all four measure a
 * height. This measures bodies lying down, and it is the first anthropometric
 * figure in the project that sets a plan.
 *
 * `everythingIsCarried` is the third, and it is what bounds the building.
 * Nothing is sawn, hauled or bought: every member is cut within reach of where
 * the shelter stands and carried to it by hand. So the size of a sudung is
 * limited by an arm and an afternoon, and the counterexample walks straight
 * into that.
 *
 * A word on the provenance table, which is the worst in this project. The
 * ethnography of the Orang Rimba is about how people live and move, not about
 * how they build; nobody has published a measured drawing of a sudung, and it
 * would be a strange thing to go and make. Every metre here is the author's,
 * and unlike the Buton malige — still standing, already measured by somebody —
 * there is no drawing anywhere that would fix it.
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
  Lama,
  Layout,
  Part,
  ProvenanceClass,
  RimbaKinds,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'sandbukt-1988',
    citation:
      'Sandbukt, Ø., “Resource Constraints and Relations of Appropriation among Tropical Forest ' +
      'Foragers: The Case of the Sumatran Kubu”, Research in Economic Anthropology 10, 1988.',
    kind: 'ethnography',
  },
  {
    key: 'prasetijo-2011',
    citation: 'Prasetijo, A., Orang Rimba: True Custodian of the Forest (Ekonesia, Jakarta, 2011).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Jambi (Departemen Pendidikan dan Kebudayaan, Jakarta, 1986).',
    kind: 'reference',
  },
  {
    key: 'anthropometry',
    citation:
      'Ukuran tubuh manusia yang ditetapkan penulis, bukan dari sumber tentang Orang Rimba. ' +
      'Kunci yang sama dipakai pak Bali, Waruga, Ngada, dan Atoni.',
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
  /* the body the plan is measured from */
  lyingLength: dim(1.72, 'm', 'interpolated', 'anthropometry', 'Panjang orang dewasa yang berbaring. Bukan dari sumber tentang Orang Rimba — kunci sumbernya sendiri supaya terlihat begitu. Ini ukuran tubuh pertama dalam projek ini yang menetapkan denah, bukan tinggi.', 'Length of an adult lying down. Not from a source about the Orang Rimba — its own source key so that this shows. It is the first body figure in this project to set a plan rather than a height.'),
  shoulderWidth: dim(0.46, 'm', 'interpolated', 'anthropometry', 'Lebar bahu orang dewasa.', 'Shoulder width of an adult.'),
  sleepGap: dim(0.12, 'm', 'interpolated', 'anthropometry', 'Sela antara orang yang berbaring bersebelahan.', 'The gap between people lying side by side.'),
  floorMargin: dim(0.35, 'm', 'interpolated', 'none', 'Sisa lantai di luar barisan orang yang tidur.', 'Floor left over beyond the row of sleepers.'),

  /* the frame, all of it cut nearby */
  carryLength: dim(4.4, 'm', 'interpolated', 'none', 'Batang terpanjang yang dapat ditebang di dekat situ dan dibawa dengan tangan oleh satu atau dua orang. Ini batas seluruh bangunan: tidak ada yang digergaji, ditarik, atau dibeli.', 'The longest pole that can be cut nearby and carried to the spot by hand by one or two people. It bounds the whole building: nothing here is sawn, hauled or bought.'),
  postSection: dim(0.08, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a pole.'),
  floorHeight: dim(0.42, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah hutan, pada bentuk yang berlantai panggung.', 'Height of the floor above the forest floor, on the raised form.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal lantai dari batang belah.', 'Thickness of the floor of split poles.'),
  frontHeight: dim(1.65, 'm', 'interpolated', 'none', 'Tinggi tepi atap yang tinggi di atas lantai: cukup untuk duduk dan bekerja di bawahnya, tidak lebih.', 'Height of the high edge of the roof above the floor: enough to sit and work under, and no more.'),
  dropShort: dim(0.75, 'm', 'interpolated', 'none', 'Turunnya atap dari tepi tinggi ke tepi rendah, pada sudung semalam.', 'Fall of the roof from its high edge to its low one, on the overnight kind.'),
  dropLong: dim(1.05, 'm', 'interpolated', 'none', 'Turunnya atap pada sudung semusim: lebih curam, sebab hujan satu musim bukan hujan satu malam.', 'Fall of the roof on the seasonal kind: steeper, because a season of rain is not a night of it.'),
  eaveReach: dim(0.5, 'm', 'interpolated', 'none', 'Tritisan di sisi rendah, yang menjadi satu-satunya perlindungan dari tampias.', 'Overhang on the low side, which is all there is against blown rain.'),
  leafThickness: dim(0.11, 'm', 'interpolated', 'none', 'Tebal lapisan daun.', 'Thickness of the leaf covering.'),
  ridgeSection: dim(0.07, 'm', 'interpolated', 'none', 'Sisi penampang balok tepi atap.', 'Section of a roof edge pole.'),
  rafterSpacing: dim(0.55, 'm', 'interpolated', 'none', 'Jarak antar kasau.', 'Spacing of the rafters.'),

  /* the few things that are brought and the few that leave */
  hearthSide: dim(0.5, 'm', 'interpolated', 'none', 'Sisi perapian di tanah, di samping lantai dan bukan di atasnya.', 'Side of the fire on the ground, beside the floor rather than on it.'),
  hearthHeight: dim(0.1, 'm', 'interpolated', 'none', 'Tinggi tumpukan kayu dan abu perapian.', 'Height of the wood and ash of the fire.'),

  /* what is left behind */
  abandonedAt: dim(22, 'm', 'interpolated', 'none', 'Jarak sudung sebelumnya, yang ditinggalkan berdiri. Melangun berarti pergi dan tidak kembali ke tempat itu; yang tertinggal tidak dibongkar dan tidak dibakar.', 'Distance to the previous shelter, left standing. Melangun means going and not returning to the place; what is left is neither dismantled nor burned.'),
  clearingRadius: dim(7, 'm', 'interpolated', 'none', 'Jari-jari tanah yang dibersihkan seadanya di sekeliling sudung.', 'Radius of the roughly cleared ground around a sudung.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  melangunEndsIt: dim(1, 'count', 'canon', 'sandbukt-1988', 'Ketika seseorang meninggal, keluarganya pergi dari tempat itu dan tidak kembali: itulah melangun. Sudungnya tidak dibongkar, tidak dibakar, dan tidak diwariskan — ia ditinggalkan berdiri dan hutan mengambilnya kembali. Tiga bangunan lain di sini juga berakhir: bade dibakar sore itu juga, rumah woloan dilepas pasaknya lalu diangkut, waruga dibuat untuk tidak pernah berpindah. Yang ini berakhir pada hari yang tidak dipilih siapa pun.', 'When somebody dies, their family leaves the place and does not return: that is melangun. The shelter is not dismantled, not burned and not inherited — it is left standing and the forest takes it back. Three other buildings here also end: a bade is burned the same afternoon, a woloan house is unpegged and carried away, a waruga is made never to move at all. This one ends on a day nobody chooses.'),
  sizeIsSleepingBodies: dim(1, 'count', 'canon', 'prasetijo-2011', 'Denahnya adalah barisan orang yang berbaring bersebelahan. Empat pak lain dalam projek ini mengukur tubuh manusia — pemilik bale yang berdiri, jenazah yang duduk berlipat dalam waruga, tubuh yang tidak boleh muat lewat pintu bhaga, tubuh yang membungkuk masuk ume kbubu — dan keempatnya mengukur tinggi. Yang ini mengukur orang yang berbaring, dan ini ukuran tubuh pertama di sini yang menetapkan denah.', 'The plan is a row of people lying side by side. Four other packs in this project measure a human body — a bale’s standing owner, a waruga’s folded dead, a body that must not fit through a bhaga’s door, a body stooping into an ume kbubu — and all four measure a height. This one measures people lying down, and it is the first body figure here that sets a plan.'),
  everythingIsCarried: dim(1, 'count', 'canon', 'depdikbud-1986', 'Tidak ada yang digergaji, ditarik, atau dibeli. Tiap batang ditebang di dekat tempat sudung berdiri dan dibawa dengan tangan, jadi besarnya bangunan ini dibatasi oleh sebuah lengan dan satu sore. Rumah woloan dibatasi panjang bak truk dan imah Baduy oleh panjang sebatang kayu yang tidak boleh disambung; yang ini oleh apa yang dapat diangkat orang sendiri.', 'Nothing is sawn, hauled or bought. Every pole is cut near where the shelter stands and carried by hand, so the size of this building is bounded by an arm and an afternoon. The woloan house is bounded by the length of a lorry and the Baduy imah by the length of a pole that may not be spliced; this one by what a person can pick up.'),
  nothingIsFixed: dim(0, 'count', 'canon', 'prasetijo-2011', 'Nol pasak, nol paku, nol tiang tertanam. Semuanya diikat rotan dan berdiri di atas tanah, sebab bangunan yang harus dapat ditinggalkan tanpa biaya tidak boleh menahan apa pun yang berharga di dalam dirinya.', 'Zero pegs, zero nails, zero buried posts. Everything is lashed with rattan and stands on the ground, because a building that has to be walkable-away-from cannot hold anything valuable inside itself.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tiang: 1.4,
  lantai: 1.0,
  atap: 1.8,
  perkakas: 0.4,
}

export const PACK: RulePack<RimbaKinds> = {
  key: 'rimba',
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

/* ── How long it is meant to stand ────────────────────────────────────── */

export interface LamaInfo {
  readonly lama: Lama
  /** the dimension key, not a copy of its value — the Banjar pack's lesson */
  readonly key: DimKey
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const LAMA: readonly LamaInfo[] = [
  {
    lama: 'sehari',
    key: 'dropShort',
    name: 'Semalam',
    glossId: 'Satu malam di perjalanan: satu bidang daun, atapnya landai, didirikan dalam satu sore.',
    glossEn: 'One night on the way somewhere: a single sheet of leaf, a shallow fall, up in an afternoon.',
  },
  {
    lama: 'musim',
    key: 'dropLong',
    name: 'Semusim',
    glossId: 'Berdiri selama satu musim di dekat kebun yang sedang dikerjakan: bangunan yang sama dengan atap lebih curam, sebab hujan satu musim bukan hujan satu malam. Tetap tidak dimaksudkan bertahan lebih lama daripada itu.',
    glossEn: 'Standing a season beside a patch being worked: the same building with a steeper roof, because a season of rain is not a night of it. Still not meant to last past that.',
  },
]

export function lamaInfo(lama: Lama): LamaInfo {
  const found = LAMA.find((l) => l.lama === lama)
  if (!found) throw new Error(`unknown lama: ${lama}`)
  return found
}

/** The roof's fall for this rule, read live from the pack. */
export function dropOf(lama: Lama): number {
  return DIMS[lamaInfo(lama).key].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Batang ditebang di sekitar tempat itu dan didirikan. Tidak ada yang ditanam: tiangnya berdiri di atas tanah.',
    glossEn: 'Poles are cut from around the spot and stood up. Nothing is buried: they stand on the ground.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Batang belah dijajarkan menjadi tempat tidur, cukup untuk orang yang akan berbaring di atasnya dan tidak lebih.',
    glossEn: 'Split poles are laid as a sleeping platform, enough for the people who will lie on it and no more.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Satu bidang daun diikatkan pada kasau. Ini seluruh atapnya: tidak ada bubungan dan tidak ada sisi kedua.',
    glossEn: 'A single sheet of leaf is lashed to the rafters. This is the whole roof: there is no ridge and no second slope.',
  },
  {
    stage: 'perkakas',
    title: 'Perkakas',
    glossId: 'Api di tanah di samping lantai, dan barang-barang yang dibawa. Justru inilah yang ikut pergi ketika keluarga itu melangun; bangunannya tidak.',
    glossEn: 'A fire on the ground beside the platform, and what was carried in. These are what leave when the family goes; the building does not.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { orang: 4, lama: 'musim', panggung: true }

export const MIN_ORANG = 2
export const MAX_ORANG = 6

export function normaliseRules(rules: Rules): Rules {
  return {
    orang: Math.min(MAX_ORANG, Math.max(MIN_ORANG, Math.round(rules.orang))),
    lama: rules.lama,
    panggung: rules.panggung,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
