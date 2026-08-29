/**
 * The rule pack for the Minahasa woloan house.
 *
 * The seventeenth pack, and the first whose canon is about what happens to the
 * building *after* it is finished.
 *
 * Every other pack states what a building is, who it is for, and what it has
 * to survive. This one states that it has to come apart: pegged joints so that
 * undoing them breaks nothing, members short enough to be carried, junctions
 * on bay lines so the pieces are countable. A house around Tomohon is a thing
 * that can be sold and taken away, and that is a social fact in the same sense
 * a rank is — it says what a house *is* to the people who build it.
 *
 * The consequence for this project is a check of a kind it has never had:
 * `checkCanBeUnbuilt` runs the build order backwards. Sixteen buildings have
 * been required to go up. This is the first required to come down.
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
  MinahasaKinds,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  Tangga,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'depdikbud-sulut',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sulawesi Utara ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'schouten-1998',
    citation:
      'Schouten, M. J. C., Leadership and Social Mobility in a Southeast Asian Society: ' +
      'Minahasa, 1677–1983 (KITLV Press, Leiden, 1998).',
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
  /* the plan, in bays, because a bay is also a bundle */
  bayLength: dim(2.7, 'm', 'interpolated', 'none', 'Panjang satu ruang. Juga panjang satu ikat papan dinding, karena rumah ini dibongkar menurut garis ruangnya: ukuran denah dan ukuran muatan adalah angka yang sama.', 'Length of one bay. Also the length of one bundle of wall boards, because the house is taken apart along its bay lines: the plan module and the load module are the same figure.'),
  halfWidth: dim(3.4, 'm', 'interpolated', 'none', 'Setengah lebar badan rumah.', 'Half-width of the body.'),
  floorHeight: dim(1.7, 'm', 'interpolated', 'none', 'Tinggi lantai di atas batu alas. Kolongnya dipakai untuk kerja dan simpanan, dan tetap kosong ketika rumahnya diangkut.', 'Height of the floor above the pad stones. The space beneath is used for work and storage, and stays behind when the house is carried away.'),
  postSection: dim(0.18, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a post.'),
  stoneHeight: dim(0.3, 'm', 'interpolated', 'none', 'Tinggi batu alas. Batu tetap tinggal ketika rumahnya pergi: ia bagian dari tanahnya, bukan bagian dari rumahnya — dan itu satu-satunya bagian di sini yang tidak ikut pindah.', 'Height of a pad stone. The stones stay when the house goes: they belong to the site rather than to the building — the only part here that does not travel.'),
  stoneWidth: dim(0.42, 'm', 'interpolated', 'none', 'Lebar batu alas itu.', 'Width of that pad stone.'),
  bearerDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar.', 'Depth of a bearer.'),
  bearerWidth: dim(0.12, 'm', 'interpolated', 'none', 'Lebar penampang gelagar.', 'Width of a bearer.'),
  floorThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor board.'),
  wallHeight: dim(2.5, 'm', 'interpolated', 'none', 'Tinggi dinding dari lantai ke kepala tiang.', 'Height of the wall from the floor to the post heads.'),
  wallThickness: dim(0.045, 'm', 'interpolated', 'none', 'Tebal panel dinding papan.', 'Thickness of a board wall panel.'),

  /* the thing the whole building is measured against */
  haulLength: dim(7.2, 'm', 'interpolated', 'none', 'Batang terpanjang yang boleh ada dalam rumah ini: sepanjang apa yang dapat diangkat beberapa orang dan diangkut lewat jalan. Ini satu-satunya angka dalam projek ini yang bukan tentang bangunannya, bukan tentang penghuninya, dan bukan tentang tempatnya — melainkan tentang perjalanan yang akan ditempuhnya. Rumah ini dibatasi oleh ukuran sebuah benda yang harus bepergian.', 'The longest member allowed in this house: as long as a few people can lift and a road can take. It is the only figure in this project that is not about the building, not about the people in it and not about the place — it is about the journey it will make. This house is limited by the size of a thing that has to travel.'),

  /* the roof */
  ridgeRise: dim(2.4, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas kepala tiang.', 'Rise of the ridge above the post heads.'),
  eaveOversail: dim(0.85, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.09, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  plateSection: dim(0.14, 'm', 'interpolated', 'none', 'Sisi penampang balok kepala tiang. Ia terpotong pada tiap garis ruang, karena satu balok sepanjang rumah tidak akan muat di jalan.', 'Section of the head plate. It is cut at every bay line, because one plate the length of the house would not go on the road.'),
  shingleCourseDepth: dim(0.19, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis sirap.', 'Exposed depth of one course of shingles.'),
  shingleThickness: dim(0.025, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  shingleLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  shingleBed: dim(0.03, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the front */
  verandaDepth: dim(2.1, 'm', 'interpolated', 'none', 'Kedalaman serambi depan. Dua tangga menjepitnya di kedua ujung, jadi serambi ini jalan lintas di muka rumah dan bukan pendaratan di atas satu tangga.', 'Depth of the front veranda. Two stairs bracket it, so it is a passage across the front of the house rather than a landing at the top of one flight.'),
  stairWidth: dim(1.2, 'm', 'interpolated', 'none', 'Lebar satu tangga.', 'Width of one stair.'),
  treadDepth: dim(0.28, 'm', 'interpolated', 'none', 'Lebar injakan anak tangga.', 'Depth of one tread.'),
  stairOffset: dim(0.7, 'm', 'interpolated', 'none', 'Jarak tangga ke dalam dari ujung serambi.', 'How far in from the end of the veranda a stair stands.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  builtToBeMoved: dim(1, 'count', 'canon', 'depdikbud-sulut', 'Rumah kayu Minahasa dibuat untuk dibongkar, diangkut, dan didirikan kembali di tempat lain; di sekitar Woloan dan Tomohon itu sebuah perdagangan — rumah dijual utuh dan berangkat lewat jalan. Enam belas bangunan lain dalam projek ini didirikan di tempat ia akan berdiri dan tinggal di situ; membongkarnya berarti merusaknya. Yang ini tidak.', 'Minahasa timber houses are made to be dismantled, carried and re-erected somewhere else; around Woloan and Tomohon that is a trade — houses are sold whole and leave by road. The other sixteen buildings in this project are raised where they will stand and stay there; taking one down means destroying it. This one is not like that.'),
  everyJointReversible: dim(1, 'count', 'canon', 'depdikbud-sulut', 'Sambungannya pasak, dan hanya pasak. Bukan kekurangan ragam melainkan seluruh alasannya: pasak adalah sambungan yang dapat dikeluarkan lagi. Tidak ada yang dilem, dipaku, atau ditakik sedemikian rupa sehingga membukanya merusaknya.', 'The joints are pegged, and pegged only. Not a shortage of joinery but the entire argument: a peg is a joint that can be taken out again. Nothing is glued, nailed, or notched so that undoing it breaks it.'),
  cutToTheRoad: dim(1, 'count', 'canon', 'depdikbud-sulut', 'Tidak ada batang yang lebih panjang daripada yang dapat diangkut. Rangkanya adalah kumpulan potongan yang berukuran untuk bepergian, bukan rangka yang berukuran untuk bangunannya — dan sambungannya jatuh pada garis ruang supaya potongannya dapat dihitung dan dinomori.', 'No member is longer than what can be carried. The frame is a set of pieces sized to travel rather than a frame sized to the building — and its junctions fall on the bay lines so the pieces can be counted and numbered.'),
  twoStairs: dim(2, 'count', 'canon', 'schouten-1998', 'Dua tangga di muka, satu di tiap ujung serambi. Serambi menjadi jalan lintas dan bukan pendaratan, dan rumah ini punya dua cara masuk yang setara — tidak ada satu pun yang menjadi pintu utama.', 'Two stairs at the front, one at each end of the veranda. The veranda becomes a passage rather than a landing, and the house has two equal ways in — neither of which is the main door.'),
  stonesStay: dim(1, 'count', 'canon', 'depdikbud-sulut', 'Batu alas tetap tinggal. Ia bagian dari tanahnya, bukan bagian dari rumahnya, dan ketika rumahnya pergi yang tertinggal adalah sebuah denah dari batu.', 'The pad stones stay. They belong to the site rather than to the building, and when the house leaves what is left behind is a plan drawn in stone.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  tiang: 1.4,
  gelagar: 1,
  lantai: 1,
  dinding: 1.6,
  serambi: 0.8,
  tangga: 0.6,
  kuda: 1.5,
  atap: 2,
}

export const PACK: RulePack<MinahasaKinds> = {
  key: 'minahasa',
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

/* ── The front ────────────────────────────────────────────────────────── */

export interface TanggaInfo {
  readonly tangga: Tangga
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const TANGGA: readonly TanggaInfo[] = [
  {
    tangga: 'dua',
    count: 2,
    name: 'Dua tangga',
    glossId:
      'Satu di tiap ujung serambi. Serambi menjadi jalan lintas di muka rumah, dan tidak ada satu pun tangga yang menjadi pintu utama.',
    glossEn:
      'One at each end of the veranda. The veranda becomes a passage across the front, and neither stair is the main way in.',
  },
  {
    tangga: 'satu',
    count: 1,
    name: 'Satu tangga',
    glossId:
      'Satu di tengah. Serambi menjadi pendaratan di atas satu tangga, dan rumah ini mendapat pintu utama yang tidak dimilikinya.',
    glossEn:
      'One in the middle. The veranda becomes a landing at the top of one flight, and the house acquires a main way in that it does not otherwise have.',
  },
]

export function tanggaInfo(tangga: Tangga): TanggaInfo {
  const found = TANGGA.find((t) => t.tangga === tangga)
  if (!found) throw new Error(`unknown tangga: ${tangga}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu alas',
    glossId: 'Batu diletakkan pada denahnya. Batu ini bagian dari tanahnya: ketika rumahnya dijual dan diangkut, batunya tetap tinggal.',
    glossEn: 'The pad stones are set out on the plan. They belong to the site: when the house is sold and carried away, the stones stay.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang berdiri di atas batu dan dipasak. Tidak ada yang dipaku — pasak adalah sambungan yang bisa dikeluarkan lagi.',
    glossEn: 'The posts stand on the stones and are pegged. Nothing is nailed — a peg is a joint that can be taken out again.',
  },
  {
    stage: 'gelagar',
    title: 'Gelagar',
    glossId: 'Gelagar dipasang ruang demi ruang, tiap batang terpotong pada garis ruang supaya cukup pendek untuk diangkut.',
    glossEn: 'The bearers go in bay by bay, each one cut at a bay line so that it is short enough to be carried.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Papan lantai dipasang per ruang, jadi lantai ini juga sekumpulan ikat papan yang dapat dihitung.',
    glossEn: 'The floor goes down bay by bay, so the floor is also a set of countable bundles.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding dipasang sebagai panel, satu per ruang. Panel itulah satuan pindahnya: dinomori, dilepas, dan dipasang kembali dalam urutan yang sama.',
    glossEn: 'The walls go on as panels, one to a bay. The panel is the unit of the move: numbered, taken off, and put back in the same order.',
  },
  {
    stage: 'serambi',
    title: 'Serambi',
    glossId: 'Serambi depan dipasang, lebih rendah daripada lantai dalam.',
    glossEn: 'The front veranda goes on, lower than the inside floor.',
  },
  {
    stage: 'tangga',
    title: 'Tangga',
    glossId: 'Tangga dipasang di ujung serambi. Dua buah, dan keduanya setara.',
    glossEn: 'The stairs go on at the ends of the veranda. Two of them, and neither is the greater.',
  },
  {
    stage: 'kuda',
    title: 'Kuda-kuda',
    glossId: 'Kuda-kuda disusun per ruang dan dipasak pada kepala tiang.',
    glossEn: 'The trusses go up bay by bay and are pegged to the post heads.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Sirap dipasang berlapis. Ini bagian yang paling jarang ikut pindah: yang dijual adalah rangkanya, dan atapnya sering dibuat baru di tempat barunya.',
    glossEn: 'The shingles go on in courses. This is the part least likely to travel: what is sold is the frame, and the roof is often made new at the other end.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { ruang: 4, tangga: 'dua', pindah: true }

export const MIN_RUANG = 3
export const MAX_RUANG = 7

export function normaliseRules(rules: Rules): Rules {
  return {
    ruang: Math.min(MAX_RUANG, Math.max(MIN_RUANG, Math.round(rules.ruang))),
    tangga: rules.tangga,
    pindah: rules.pindah,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
