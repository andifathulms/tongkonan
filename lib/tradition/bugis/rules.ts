/**
 * The rule pack for the Bugis saoraja.
 *
 * The tenth pack, and the first that separates the rank from the structure.
 *
 * In every earlier house the two are the same material. A Toraja rank
 * multiplies every dimension; a joglo's tier count grows the roof it sits
 * under; a rumah limas builds standing into the floor people walk on. You
 * cannot take the claim away without dismantling the building. Here the claim
 * is a stack of boards on the gable face carrying no load at all, so the house
 * stands identically with three or with seven — and the difference between
 * those is the difference between a commoner and a noble, readable from the
 * road by anyone who can count.
 *
 * That makes `timpa` the first rule in this project that is pure declaration.
 * It also makes it the first that can be *false*: a household could put up
 * more boards than it was entitled to, which is exactly why the number was
 * regulated and exactly why it is worth modelling. `checkRankCarriesNothing`
 * states the structural half — that removing every board leaves the building
 * standing — and it is the only invariant here whose subject is what a part
 * does *not* do.
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
  BugisKinds,
  Dim,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Rumah,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'pelras-1996',
    citation: 'Pelras, C., The Bugis (Blackwell, Oxford, 1996).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-sulsel',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sulawesi Selatan ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'rahim-2011',
    citation:
      'Abdul Rahim, M., “Tipologi Rumah Tradisional Bugis Makassar”, ' +
      'Jurnal Ruang, Universitas Hasanuddin (2011).',
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
  /* the plan */
  bayLength: dim(2.5, 'm', 'interpolated', 'none', 'Jarak antar alliri sepanjang rumah. Denahnya bertambah dengan kelipatan bulat angka ini.', 'Spacing between alliri along the house. The plan grows by whole multiples of this.'),
  bayDepth: dim(2.8, 'm', 'interpolated', 'none', 'Jarak antar alliri melintang.', 'Spacing between alliri across the house.'),
  rows: dim(3, 'count', 'interpolated', 'none', 'Baris tiang melintang. Tiga baris memberi denah tiga lajur, yang sesuai dengan pembagian ruang di dalamnya.', 'Ranks of posts across the house. Three gives a three-aisled plan, which matches how the space inside is divided.'),
  postSection: dim(0.22, 'm', 'interpolated', 'none', 'Sisi penampang alliri.', 'Section of an alliri.'),
  stoneHeight: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tiang berdiri.', 'Height of the stone a post foot stands on.'),
  stoneWidth: dim(0.44, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),

  /* the three worlds, stacked */
  awaBola: dim(2.3, 'm', 'interpolated', 'none', 'Tinggi awa bola, kolong. Dunia bawah dalam pembagian tiga: tempat ternak, alat dan kerja.', 'Height of the awa bola, the space beneath. The lower world of the threefold division: livestock, tools and work.'),
  aleBola: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi ale bola, badan rumah. Dunia tengah: tempat orang tinggal.', 'Height of the ale bola, the body of the house. The middle world: where people live.'),
  rakkeang: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi rakkeang, loteng di bawah atap tempat padi disimpan. Dunia atas — dan yang disimpan di sana bukan kebetulan.', 'Height of the rakkeang, the loft under the roof where rice is kept. The upper world — and what is kept there is not an accident.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),
  beamDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi penampang pattolo, balok yang menembus tiang.', 'Depth of a pattolo, the beam threaded through the posts.'),
  beamWidth: dim(0.13, 'm', 'interpolated', 'none', 'Lebar penampang pattolo.', 'Width of a pattolo.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),

  /* the roof */
  ridgeRise: dim(3.6, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap.', 'Rise of the ridge above the eave.'),
  eaveOversail: dim(1.0, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.09, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerBay: dim(3, 'count', 'interpolated', 'none', 'Jumlah kasau tiap ruang.', 'Rafters in each bay.'),
  thatchCourseDepth: dim(0.23, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis nipah.', 'Exposed depth of one course of nipa thatch.'),
  thatchThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  thatchLap: dim(0.44, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the claim */
  timpaRise: dim(0.34, 'm', 'interpolated', 'none', 'Tinggi tiap papan timpa laja. Angka inilah yang menentukan seberapa jauh susunan itu terbaca dari jalan — dan seluruh gunanya adalah terbaca.', 'Height of each timpa laja board. This figure sets how far the stack reads from the road — and being read is its entire function.'),
  timpaThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal satu papan timpa laja, dan sekaligus seberapa jauh ia menjorok — papan itu dipasang rata pada muka pelana, jadi tebalnya adalah tonjolannya dan tidak perlu angka kedua. Tipis, dan itu bagian dari pernyataannya: papan setipis ini jelas tidak memikul apa-apa. Semula ada dimensi tersendiri untuk tonjolannya, yang menaruh papan sejarak celah di depan atap sehingga ia tidak menyentuh apa pun — sebuah papan yang dipaku pada pelana memang dipikul pelananya, betapapun ringannya.', 'Thickness of one timpa laja board, and equally how far it stands proud — the board is fixed flat to the gable face, so its thickness is its projection and no second figure is needed. Thin, and that is part of the statement: a board this thin plainly carries nothing. There was a separate dimension for the projection at first, which held the board a gap in front of the roof touching nothing — a board nailed to a gable is carried by that gable, however lightly.'),
  timpaInset: dim(0.72, 'ratio', 'interpolated', 'none', 'Seberapa jauh tiap papan lebih pendek daripada papan di bawahnya, sehingga susunannya menyempit ke atas mengikuti pelana.', 'How much shorter each board is than the one below it, so the stack narrows upward with the gable.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu tempat kaki tiang duduk.', 'Depth of the dish in the stone the post foot seats into.'),
  saorajaScale: dim(1.18, 'ratio', 'interpolated', 'none', 'Besar saoraja dibanding bola. Bahwa rumah bangsawan lebih besar itu bersumber; seberapa besar bedanya adalah penetapan penulis — dan bedanya kecil, karena yang benar-benar membedakan keduanya ada di pelana dan bukan pada ukurannya.', 'Size of a saoraja relative to a bola. That a noble’s house is larger is sourced; how much larger is the author’s — and the difference is small, because what actually separates them is on the gable rather than in the size.'),

  /* rules that are structure, not measurement */
  rankCarriesNothing: dim(1, 'count', 'canon', 'pelras-1996', 'Timpa laja adalah susunan papan pada muka pelana, dan jumlahnya adalah pangkat rumah tangga. Papan itu tidak memikul apa pun: rumahnya berdiri sama saja dengan tiga papan atau tujuh. Ini satu-satunya rumah dalam projek ini yang penanda pangkatnya dapat dilepas — dan karena itu satu-satunya yang penandanya dapat berdusta.', 'The timpa laja is a stack of boards on the gable face, and their number is the household’s rank. Those boards carry nothing: the house stands identically with three or with seven. It is the only house in this project whose rank marker is detachable — and therefore the only one whose marker can lie.'),
  oddOnly: dim(1, 'count', 'canon', 'depdikbud-sulsel', 'Jumlah papannya ganjil. Tiga untuk rumah biasa, lima ke atas untuk bangsawan; genap tidak dipakai.', 'The number of boards is odd. Three for a commoner’s house, five and upward for nobility; even numbers are not used.'),
  threeWorlds: dim(3, 'count', 'canon', 'pelras-1996', 'Rumah terbagi tiga dari bawah ke atas: awa bola untuk ternak dan kerja, ale bola untuk orang, rakkeang untuk padi. Tongkonan juga membagi tiga; yang berbeda adalah apa yang ditaruh di atas — di sini yang paling tinggi adalah yang menghidupi.', 'The house divides into three from the bottom up: awa bola for livestock and work, ale bola for people, rakkeang for rice. The tongkonan divides into three as well; what differs is what is put at the top — here the highest thing is what feeds the household.'),
  threadedPosts: dim(1, 'count', 'canon', 'rahim-2011', 'Pattolo menembus lubang yang dipahat tembus pada alliri, bukan ditakik pada sisinya. Rangkanya dirakit dengan diayak dan dipasak, dan itulah sebabnya rumah ini bisa dibongkar dan dipindahkan utuh — yang memang dilakukan.', 'The pattolo pass through mortises cut clean through the alliri rather than being notched onto them. The frame is threaded and pegged, which is why this house can be taken apart and moved whole — and it is.'),
  seatedOnStone: dim(1, 'count', 'canon', 'waterson-1990', 'Kaki tiang berdiri di atas batu, tidak ditanam.', 'The post feet stand on stones; they are not buried.'),

  /* The site: the yard the boards are counted from. */
  yardDepth: dim(10, 'm', 'interpolated', 'none', 'Jarak dari muka rumah ke tepi jalan. Timpa laja dibaca dari jarak ini: susunan papan pada tampak gable adalah pernyataan yang ditujukan kepada orang yang lewat, jadi jarak berdirinya orang itu adalah bagian dari maknanya. Angkanya penetapan penulis.', 'Distance from the front of the house to the edge of the road. The timpa laja is read from here: the stack of boards on the gable is a statement addressed to whoever passes, so how far away they stand is part of what it means. The figure is the author’s.'),
  yardWidth: dim(14, 'm', 'interpolated', 'none', 'Lebar halaman muka.', 'Width of the front yard.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  pallangga: 0.6,
  alliri: 1.7,
  pattolo: 1.3,
  lantai: 1.0,
  rinring: 1.1,
  rakkeang: 0.9,
  pamiring: 1.5,
  atap: 2.1,
  timpa: 0.6,
}

export const PACK: RulePack<BugisKinds> = {
  key: 'bugis',
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

/* ── Whose house ──────────────────────────────────────────────────────── */

export interface RumahInfo {
  readonly rumah: Rumah
  readonly name: string
  readonly scale: number
  /** what the gable may claim */
  readonly minTimpa: number
  readonly maxTimpa: number
  readonly glossId: string
  readonly glossEn: string
}

export const RUMAH: readonly RumahInfo[] = [
  {
    rumah: 'saoraja',
    name: 'Saoraja',
    scale: DIMS.saorajaScale.value,
    minTimpa: 5,
    maxTimpa: 9,
    glossId:
      'Rumah bangsawan. Sedikit lebih besar, dan boleh memasang lima papan atau lebih pada pelananya. Yang benar-benar membedakannya dari rumah biasa ada di muka pelana, bukan pada ukurannya — dan papan itu tidak memikul apa pun.',
    glossEn:
      'A noble’s house. A little larger, and entitled to five boards or more on its gable. What actually separates it from an ordinary house is on the gable face rather than in the size — and those boards carry nothing.',
  },
  {
    rumah: 'bola',
    name: 'Bola',
    scale: 1,
    minTimpa: 3,
    maxTimpa: 3,
    glossId:
      'Rumah orang kebanyakan: bangunan yang sama, dibuat lebih sederhana, dengan tiga papan pada pelananya dan tidak boleh lebih. Batas itu bukan batas bangunan melainkan batas hak — sebuah bola sanggup memikul tujuh papan dengan mudah, dan justru itulah persoalannya.',
    glossEn:
      'A commoner’s house: the same building made plainer, with three boards on its gable and no more. That limit is not a limit of the building but of entitlement — a bola could carry seven boards easily, and that is precisely the point.',
  },
]

export function rumahInfo(rumah: Rumah): RumahInfo {
  const found = RUMAH.find((r) => r.rumah === rumah)
  if (!found) throw new Error(`unknown rumah: ${rumah}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'pallangga',
    title: 'Pallangga',
    glossId: 'Batu diletakkan lebih dahulu, satu untuk tiap tiang.',
    glossEn: 'The stones go down first, one for each post.',
  },
  {
    stage: 'alliri',
    title: 'Alliri',
    glossId: 'Tiang didirikan di atas batunya, dengan lubang yang sudah dipahat tembus untuk balok yang akan menembusnya.',
    glossEn: 'The posts are stood on their stones, already cut through with the mortises the beams will pass through.',
  },
  {
    stage: 'pattolo',
    title: 'Pattolo',
    glossId: 'Balok diayak menembus tiang dan dipasak. Rangkanya dirakit, bukan dipaku — dan itulah sebabnya rumah ini bisa diangkat dan dipindahkan utuh.',
    glossEn: 'The beams are threaded through the posts and pegged. The frame is assembled rather than nailed — which is why this house can be lifted and carried away whole.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai ale bola dipasang: dunia tengah, tempat orang tinggal.',
    glossEn: 'The floor of the ale bola is laid: the middle world, where people live.',
  },
  {
    stage: 'rinring',
    title: 'Rinring',
    glossId: 'Dinding papan berdiri di sekeliling badan rumah.',
    glossEn: 'The board walls go up around the body of the house.',
  },
  {
    stage: 'rakkeang',
    title: 'Rakkeang',
    glossId: 'Loteng dipasang di bawah atap. Di sinilah padi disimpan — yang tertinggi dalam rumah adalah yang menghidupinya.',
    glossEn: 'The loft goes in under the roof. Rice is kept here — the highest thing in the house is the thing that feeds it.',
  },
  {
    stage: 'pamiring',
    title: 'Pamiring',
    glossId: 'Rangka atap: bubungan dan kasau, pelana di kedua ujungnya.',
    glossEn: 'The roof frame: ridge and rafters, with a gable at each end.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Nipah dipasang dari tepi ke atas, tiap lapis menindih lapis di bawahnya.',
    glossEn: 'The nipa thatch is laid from the eave upward, each course lapping the one below.',
  },
  {
    stage: 'timpa',
    title: 'Timpa laja',
    glossId: 'Papan dipasang terakhir pada muka pelana, dan jumlahnya adalah pangkat rumah tangga. Ia dipasang terakhir karena ia tidak menahan apa pun — rumahnya sudah selesai sebelum ada satu papan pun terpasang, dan itu bukan kebetulan melainkan isi pernyataannya.',
    glossEn: 'The boards go on last, on the gable face, and their number is the household’s rank. They go on last because they hold nothing up — the house is finished before the first board is fixed, and that is not incidental but the content of the statement.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { rumah: 'saoraja', timpa: 5, lontang: 5 }

export const MIN_LONTANG = 3
export const MAX_LONTANG = 8

/**
 * The board count is clamped by *entitlement*, not by geometry.
 *
 * This is the only clamp in the project that refuses a value the building
 * could perfectly well carry. A bola will hold seven boards without noticing;
 * what stops it is that seven is not its to claim. Modelling the limit here
 * rather than in the geometry is the point — and a reader who tries it should
 * find the rail refusing on grounds of standing rather than of structure.
 */
export function normaliseRules(rules: Rules): Rules {
  const info = rumahInfo(rules.rumah)
  const wanted = Math.round(Number(rules.timpa))
  const odd = wanted % 2 === 0 ? wanted + 1 : wanted
  return {
    rumah: rules.rumah,
    timpa: Math.min(info.maxTimpa, Math.max(info.minTimpa, Number.isFinite(odd) ? odd : info.minTimpa)),
    lontang: Math.min(MAX_LONTANG, Math.max(MIN_LONTANG, Math.round(rules.lontang))),
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
