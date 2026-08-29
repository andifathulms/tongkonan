/**
 * The rule pack for the rumoh Aceh.
 *
 * The twentieth pack, and the first with a rule from outside the archipelago.
 *
 * `ridgeRunsEastWest` is canon and its reason is prayer: the house lies along
 * the line prayer is made on, so the room a person stands in is already turned
 * the right way. Nineteen buildings here are oriented by something local — a
 * compass rule of their own, a granary, a river, a road, a stone, the root of
 * a tree, the fall of a hillside — and this one is oriented by a doctrine that
 * is held in other countries as well. It is worth being exact about what that
 * changes for the model: nothing in the geometry. What changes is where the
 * rule comes from, and a project about rules becoming dimensions ought to have
 * one that arrived from somewhere else.
 *
 * `oddSteps` is the only parity rule in the collection. It is not a length and
 * not a proportion: the ladder is as tall as the floor, and what is fixed is
 * whether the number of treads comes out even or odd. It fails the way parity
 * fails — by one — which makes the counterexample the smallest in the project.
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
  AcehKinds,
  Dim,
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
    key: 'dall-1982',
    citation:
      'Dall, G., The traditional Acehnese house, in J. Maxwell (ed.), ' +
      'The Malay-Islamic World of Sumatra (Monash University, Melbourne, 1982).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-aceh',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Istimewa Aceh ' +
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
  /* the plan: long east–west, and three parts across the width */
  bayLength: dim(2.6, 'm', 'interpolated', 'none', 'Panjang satu ruang di sepanjang bubungan. Panjang rumah adalah angka ini dikali jumlah ruang, dan jumlah ruang selalu ganjil — rumah ini bahkan dinamai menurutnya. Angka ini juga harus cukup besar agar rumah yang paling pendek sekalipun tetap lebih panjang daripada lebarnya: bangunan yang membujur utara–selatan bukan rumoh Aceh, apa pun bentuk atapnya.', 'Length of one bay along the ridge. The length of the house is this figure times the number of bays, and that number is always odd — the house is named by it. It also has to be large enough that even the shortest house stays longer than it is wide: a building lying north–south is not a rumoh Aceh, whatever shape its roof is.'),
  keueDepth: dim(2.2, 'm', 'interpolated', 'none', 'Kedalaman seuramoë keuë, serambi depan tempat tamu dan laki-laki.', 'Depth of the seuramoë keuë, the front veranda where guests and the men are.'),
  tungaiDepth: dim(2.9, 'm', 'interpolated', 'none', 'Kedalaman tungai, ruang tengah yang ditinggikan. Di sinilah orang tidur dan di sinilah orang dilahirkan; ia bagian rumah yang paling tertutup.', 'Depth of the tungai, the raised middle room. This is where people sleep and where they are born; it is the most closed part of the house.'),
  likotDepth: dim(2, 'm', 'interpolated', 'none', 'Kedalaman seuramoë likôt, serambi belakang tempat perempuan bekerja dan memasak.', 'Depth of the seuramoë likôt, the back veranda where the women work and cook.'),
  raise: dim(0.35, 'm', 'interpolated', 'none', 'Tinggi lantai tungai di atas kedua serambinya. Rumah limas Palembang menaikkan lantainya untuk menyatakan kedudukan tamu; di sini yang dinaikkan adalah ruang yang paling tertutup, dan yang dinyatakan adalah sesuatu yang lain sama sekali: bukan siapa lebih tinggi, melainkan sampai di mana orang luar boleh melangkah.', 'Height of the tungai floor above the two verandas. The Palembang rumah limas raises its floor to state a guest’s standing; here what is raised is the most closed room, and what is stated is something else entirely: not who is higher, but how far an outsider goes.'),
  floorHeight: dim(2.5, 'm', 'interpolated', 'none', 'Tinggi lantai serambi di atas tanah. Tinggi, dan kolongnya dipakai untuk bekerja, menyimpan, dan menenun.', 'Height of the veranda floor above the ground. High, and the space beneath is used for work, storage and weaving.'),
  floorThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of the board floor.'),
  postSection: dim(0.2, 'm', 'interpolated', 'none', 'Sisi penampang tameh, tiang bulat yang berdiri bebas di atas alasnya.', 'Section of a tameh, the post standing free on its footing.'),
  postGrid: dim(1.6, 'm', 'interpolated', 'none', 'Jarak antar baris tiang melintang lebar rumah.', 'Spacing of the lines of posts across the width.'),
  beamDepth: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi penampang toi, balok yang menembus lubang pada tiang. Rangka ini diikat dan dipasak, tanpa paku, dan itu yang membuatnya dapat bergoyang tanpa patah.', 'Depth of a toi, the beam threaded through a mortise cut clean through the post. This frame is lashed and pegged with no nails, which is what lets it move without breaking.'),
  beamWidth: dim(0.14, 'm', 'interpolated', 'none', 'Lebar toi.', 'Width of a toi.'),
  wallHeight: dim(2.1, 'm', 'interpolated', 'none', 'Tinggi dinding papan dari lantai ke tepi atap.', 'Height of the board wall from the floor to the eave.'),
  wallThickness: dim(0.045, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),

  /* the ladder, which is counted */
  treadRise: dim(0.29, 'm', 'interpolated', 'none', 'Tinggi satu anak tangga. Angka ini menetapkan jumlah anak tangga, dan jumlah itu harus ganjil — jadi menggeser tinggi injakan sedikit saja dapat membalik ganjil menjadi genap tanpa mengubah apa pun yang lain. Inilah yang ditekan oleh tandingan bangunan ini, dan tandingan terkecil dalam projek ini.', 'Rise of one tread. This figure sets how many treads there are, and that number has to be odd — so nudging the rise can flip odd to even without changing anything else. It is what this building’s counterexample pushes, and the smallest counterexample in the project.'),
  treadDepth: dim(0.27, 'm', 'interpolated', 'none', 'Lebar injakan.', 'Depth of a tread.'),
  ladderWidth: dim(0.95, 'm', 'interpolated', 'none', 'Lebar tangga.', 'Width of the ladder.'),

  /* the roof */
  ridgeRise: dim(3.1, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap.', 'Rise of the ridge above the eave.'),
  eaveOversail: dim(1.1, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.08, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  plateSection: dim(0.14, 'm', 'interpolated', 'none', 'Sisi penampang balok tepi atap.', 'Section of the eave plate.'),
  rumbiaCourseDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis daun rumbia.', 'Exposed depth of one course of sago thatch.'),
  rumbiaThickness: dim(0.045, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  rumbiaLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  rumbiaBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  ridgeRunsEastWest: dim(1, 'count', 'canon', 'dall-1982', 'Bubungan rumah membujur timur–barat, karena salat menghadap ke barat: ruangannya sudah menghadap arah itu sebelum siapa pun berdiri di dalamnya. Sembilan belas bangunan lain dalam projek ini diarahkan oleh sesuatu yang setempat — aturan mata angin miliknya sendiri, lumbung, sungai, jalan, batu, pangkal pohon, arah turun lereng. Yang ini diarahkan oleh ajaran yang juga dipegang orang di negeri lain, dan itulah satu-satunya aturan dalam kumpulan ini yang datangnya dari luar Nusantara.', 'The ridge lies east–west, because prayer is toward the west: the room is already turned that way before anybody stands in it. The other nineteen buildings in this project are oriented by something local — a compass rule of their own, a granary, a river, a road, a stone, the root of a tree, the fall of a hillside. This one is oriented by a doctrine held by people in other countries too, and it is the only rule in the collection that arrived from outside the archipelago.'),
  oddSteps: dim(1, 'count', 'canon', 'depdikbud-aceh', 'Jumlah anak tangga ganjil. Bukan kira-kira ganjil dan bukan biasanya ganjil: ganjil, dan tradisinya menyebutkan itu. Ini satu-satunya aturan keganjilan dalam projek ini, dan ia dapat gagal dengan cara yang khas bagi keganjilan — meleset satu.', 'The number of treads is odd. Not roughly odd and not usually odd: odd, and the tradition says so. It is the only parity rule in this project, and it can fail in the way parity fails — by one.'),
  oddBays: dim(1, 'count', 'canon', 'depdikbud-aceh', 'Jumlah ruang ganjil, dan rumah ini dinamai menurut jumlah itu: rumoh lhee ruang, rumoh limong ruang. Ganjil karena ruang tengahnya harus benar-benar di tengah — ruang yang ditinggikan duduk di situ, dan jumlah genap akan menaruh sambungan di tempat yang seharusnya pusat.', 'The number of bays is odd, and the house is named by it: rumoh lhee ruang, rumoh limong ruang. Odd because the middle bay has to be the middle — the raised room sits on it, and an even count would put a joint where the centre should be.'),
  noNails: dim(0, 'count', 'canon', 'dall-1982', 'Nol paku pada rangka. Toi menembus lubang yang dipahat tembus pada tiang, lalu dipasak dan diikat — rangka yang dapat bergoyang tanpa patah, di tanah yang bergoyang. Rumah omo Nias menjawab persoalan yang sama dengan menyegitigakan tiap petaknya; ini jawaban yang berbeda dan sama sahnya: bukan kaku, melainkan lentur.', 'Zero nails in the frame. The toi pass through mortises cut clean through the posts and are pegged and lashed — a frame that can move without breaking, on ground that moves. The Nias omo answers the same problem by triangulating every bay; this is a different answer and an equally good one: not stiff, but limber.'),
  threeParts: dim(3, 'count', 'canon', 'dall-1982', 'Tiga bagian melintang lebar rumah: seuramoë keuë di muka untuk tamu dan laki-laki, tungai yang ditinggikan di tengah untuk tidur dan melahirkan, seuramoë likôt di belakang untuk perempuan bekerja. Urutan ini bukan tangga kedudukan melainkan urutan seberapa dekat seseorang boleh masuk.', 'Three parts across the width: the seuramoë keuë at the front for guests and the men, the raised tungai in the middle for sleeping and for birth, the seuramoë likôt behind for the women’s work. The sequence is not a staircase of rank but an order of how far in a person may come.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tameh: 1.5,
  toi: 1.2,
  aleue: 1.1,
  binteh: 1.4,
  gaseue: 1.5,
  bubong: 2.1,
  reunyeun: 0.5,
}

export const PACK: RulePack<AcehKinds> = {
  key: 'aceh',
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

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tameh',
    title: 'Tameh',
    glossId: 'Tiang berdiri bebas di atas alasnya, tidak ditanam. Rumah ini berdiri di atas tanah yang bergoyang, dan tiang yang tidak ditanam dapat ikut bergerak.',
    glossEn: 'The posts stand free on their footings and are not buried. This house stands on ground that moves, and a post that is not buried can move with it.',
  },
  {
    stage: 'toi',
    title: 'Toi',
    glossId: 'Balok menembus lubang yang dipahat tembus pada tiang, lalu dipasak dan diikat. Tidak ada paku di sini, dan itu yang membuat rangkanya lentur.',
    glossEn: 'The beams thread through mortises cut clean through the posts and are pegged and lashed. There is no iron here, and that is what makes the frame limber.',
  },
  {
    stage: 'aleue',
    title: 'Aleue',
    glossId: 'Lantai dipasang: dua serambi pada satu ketinggian, dan tungai di tengah yang lebih tinggi.',
    glossEn: 'The floors go down: the two verandas at one level, and the tungai in the middle above them.',
  },
  {
    stage: 'binteh',
    title: 'Binteh',
    glossId: 'Dinding papan dipasang, rapat pada tungai dan lebih terbuka pada serambinya.',
    glossEn: 'The board walls go on, closed around the tungai and more open on the verandas.',
  },
  {
    stage: 'gaseue',
    title: 'Gaseue',
    glossId: 'Rangka atap disusun sepanjang bubungan yang membujur timur–barat.',
    glossEn: 'The roof frame goes up along the ridge, which lies east–west.',
  },
  {
    stage: 'bubong',
    title: 'Bubong',
    glossId: 'Daun rumbia dipasang berlapis dari tepi ke bubungan.',
    glossEn: 'Sago leaf goes on in courses from the eave to the ridge.',
  },
  {
    stage: 'reunyeun',
    title: 'Reunyeun',
    glossId: 'Tangga dipasang terakhir, dan anak tangganya dihitung: jumlahnya harus ganjil.',
    glossEn: 'The ladder goes on last, and its treads are counted: the number has to be odd.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { ruang: 5, anakTangga: 9, seuramoeLikot: true }

export const MIN_RUANG = 3
export const MAX_RUANG = 7
export const MIN_STEPS = 5
export const MAX_STEPS = 11

/** Both counts are held odd here, because both are odd in the tradition. */
export function normaliseRules(rules: Rules): Rules {
  const odd = (n: number, lo: number, hi: number) => {
    const clamped = Math.min(hi, Math.max(lo, Math.round(n)))
    return clamped % 2 === 0 ? Math.min(hi, clamped + 1) : clamped
  }
  return {
    ruang: odd(rules.ruang, MIN_RUANG, MAX_RUANG),
    anakTangga: odd(rules.anakTangga, MIN_STEPS, MAX_STEPS),
    seuramoeLikot: rules.seuramoeLikot,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
