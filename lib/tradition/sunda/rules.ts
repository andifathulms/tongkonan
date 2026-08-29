/**
 * The rule pack for the Baduy imah.
 *
 * The nineteenth pack, and the first whose canon is a list of things that may
 * not be done.
 *
 * `groundIsNotCut` is the one with geometry in it, and it is the reason this
 * building is here. Everywhere else in the collection the site is a datum: the
 * ground is level because a model needs somewhere to start. Here the ground is
 * a *given* that the rule forbids anybody to change, so it is in the model as
 * a part, the stones are set where they lie, and the posts come out at
 * whatever lengths that leaves — while the floor is one level plane, which is
 * a harder thing to build than a platform on cut ground and is the point.
 *
 * The other prohibitions are canon and carry no geometry a model can check:
 * no sawn timber, no iron in the frame, nothing the forest did not grow. They
 * are declared anyway, because a pack that only wrote down the rules it could
 * test would be quietly editing the tradition to fit the software.
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
  Lereng,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  SundaKinds,
  Wilayah,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'garna-1993',
    citation:
      'Garna, J. K., Masyarakat Baduy di Banten, dalam Koentjaraningrat (ed.), ' +
      'Masyarakat Terasing di Indonesia (Gramedia, Jakarta, 1993).',
    kind: 'ethnography',
  },
  {
    key: 'permana-2006',
    citation:
      'Permana, R. C. E., Tata Ruang Masyarakat Baduy ' +
      '(Wedatama Widya Sastra, Jakarta, 2006).',
    kind: 'ethnography',
  },
  {
    key: 'iskandar-2016',
    citation:
      'Iskandar, J. & Iskandar, B. S., Ethnoecology and Sustainable Agriculture ' +
      'among the Baduy, Banten (Biodiversitas / journal literature).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-jabar',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Jawa Barat ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
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
  /* the house */
  length: dim(7.2, 'm', 'interpolated', 'none', 'Panjang badan rumah, naik lereng.', 'Length of the body, running up the slope.'),
  halfWidth: dim(2.9, 'm', 'interpolated', 'none', 'Setengah lebar badan rumah.', 'Half-width of the body.'),
  clearance: dim(0.55, 'm', 'interpolated', 'none', 'Jarak bebas terkecil dari tanah ke bawah lantai, diukur di titik tertinggi tanahnya. Lantai satu bidang datar; yang berubah bukan lantainya melainkan panjang tiap tiang.', 'Least clearance from the ground to the underside of the floor, measured at the highest point of the ground. The floor is one level plane; what changes is not the floor but the length of each post.'),
  postSection: dim(0.15, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a post.'),
  stoneHeight: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tiang berdiri. Batu diletakkan di tempat batu itu berada, tidak digali dan tidak diratakan.', 'Height of the stone a post foot stands on. The stones are set where they lie: nothing is dug and nothing is levelled.'),
  stoneWidth: dim(0.4, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),
  bay: dim(2.4, 'm', 'interpolated', 'none', 'Jarak antar baris tiang di sepanjang lereng.', 'Spacing of the lines of posts along the slope.'),
  beamSection: dim(0.13, 'm', 'interpolated', 'none', 'Sisi penampang balok lantai.', 'Section of a floor beam.'),
  floorThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal lantai palupuh: bambu belah, bukan papan gergajian.', 'Thickness of the palupuh floor: split bamboo, not sawn board.'),
  wallHeight: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi dinding bilik anyaman dari lantai ke tepi atap.', 'Height of the woven bilik wall from the floor to the eave.'),
  wallThickness: dim(0.04, 'm', 'interpolated', 'none', 'Tebal anyaman bambu.', 'Thickness of the woven bamboo.'),

  /* the ground, which is the thing the rule is about */
  slopeGentle: dim(0.1, 'ratio', 'interpolated', 'none', 'Kemiringan tanah yang landai, sebagai naik per panjang.', 'Slope of gentle ground, as rise over run.'),
  slopeMedium: dim(0.22, 'ratio', 'interpolated', 'none', 'Kemiringan tanah yang sedang. Kampung Kanekes berada di perbukitan, dan tanah datar bukan yang biasa.', 'Slope of medium ground. Kanekes is hill country, and level ground is not what is usual.'),
  slopeSteep: dim(0.34, 'ratio', 'interpolated', 'none', 'Kemiringan tanah yang curam. Angka inilah yang ditekan oleh tandingan bangunan ini: pada lereng yang cukup curam, tiang terpanjang melebihi satu batang, dan satu-satunya jalan keluar adalah memotong tanahnya — yang justru dilarang.', 'Slope of steep ground. This is the figure the counterexample pushes: on steep enough ground the longest post exceeds a single pole, and the only way out is to cut the ground — which is the thing that is forbidden.'),
  groundThickness: dim(0.5, 'm', 'interpolated', 'none', 'Tebal lempeng tanah yang digambar. Tanah bukan bagian yang dibangun; ia ada dalam model justru karena ia satu-satunya hal yang tidak boleh diubah.', 'Thickness of the slab of ground that is drawn. The ground is not a built part; it is in the model precisely because it is the one thing that may not be changed.'),
  groundMargin: dim(2.5, 'm', 'interpolated', 'none', 'Berapa jauh tanah yang digambar melewati denah rumahnya.', 'How far the drawn ground runs past the plan of the house.'),

  /* the limit the slope runs into */
  poleLength: dim(3.4, 'm', 'interpolated', 'none', 'Panjang tiang terpanjang yang dapat dibuat dari satu batang. Tiang tidak disambung, dan kayu tidak digergaji — jadi angka ini batas keras: pada lereng yang cukup curam, tiang di sisi bawah melewatinya dan rumahnya tidak dapat berdiri di situ tanpa melanggar larangan.', 'The longest post one piece of timber gives. Posts are not spliced and timber is not sawn — so this is a hard limit: on steep enough ground the downhill post passes it, and the house cannot stand there without breaking a prohibition.'),

  /* the roof */
  ridgeRise: dim(2.3, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap.', 'Rise of the ridge above the eave.'),
  eaveOversail: dim(0.95, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.07, 'm', 'interpolated', 'none', 'Sisi penampang kasau bambu.', 'Section of a bamboo rafter.'),
  plateSection: dim(0.11, 'm', 'interpolated', 'none', 'Sisi penampang balok tepi atap.', 'Section of the eave plate.'),
  hateupCourseDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis atap daun.', 'Exposed depth of one course of palm thatch.'),
  hateupThickness: dim(0.04, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  hateupLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  hateupBed: dim(0.03, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the front */
  sosoroDepth: dim(1.8, 'm', 'interpolated', 'none', 'Kedalaman sosoro, bale-bale di muka rumah tempat tamu diterima. Tamu berhenti di sini; bagian dalam rumah bukan tempat orang luar masuk.', 'Depth of the sosoro, the front platform where visitors are received. A visitor stops here; the inner room is not where an outsider goes.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement — and here they are prohibitions */
  groundIsNotCut: dim(1, 'count', 'canon', 'garna-1993', 'Tanah tidak boleh digali atau diratakan untuk sebuah rumah. Batu diletakkan di tempat batu itu berada dan tiang dipotong sepanjang yang disisakan tanah — jadi tiap tiang berbeda panjangnya sementara lantainya satu bidang datar. Delapan belas bangunan lain dalam projek ini berdiri di atas tanah yang datar karena model memerlukan titik awal; yang ini berdiri di atas lereng yang ada dalam daftar bagiannya, justru karena itulah satu-satunya hal yang tidak boleh diubah.', 'The ground may not be dug or levelled for a house. The stones are set where they lie and the posts are cut to what the ground leaves — so every post is a different length while the floor is one level plane. The other eighteen buildings in this project stand on level ground because a model needs somewhere to start; this one stands on a hillside that is in its own part list, precisely because that is the one thing which may not be changed.'),
  noSawnTimber: dim(1, 'count', 'canon', 'permana-2006', 'Kayu dibelah, tidak digergaji, dan tiang tidak disambung. Larangan ini tidak dapat diperiksa oleh model mana pun — sebuah balok yang digergaji dan yang dibelah berbentuk sama — dan ia dinyatakan di sini karena pak yang hanya menuliskan aturan yang dapat diuji berarti diam-diam menyunting tradisinya agar muat ke dalam perangkat lunaknya.', 'Timber is split, not sawn, and posts are not spliced. This prohibition cannot be checked by any model — a sawn beam and a split one are the same shape — and it is stated here because a pack that wrote down only the rules it could test would be quietly editing the tradition to fit the software.'),
  noIronInTheFrame: dim(0, 'count', 'canon', 'garna-1993', 'Nol paku pada rangka: sambungannya ikat dan takik. Pada rumah woloan Minahasa sambungan yang dapat dilepas adalah pilihan yang memungkinkan rumah diangkut; di sini ia sebuah larangan, dan kedua bangunan itu sampai pada sambungan yang sama lewat dua alasan yang tidak berhubungan.', 'Zero nails in the frame: the joints are lashings and notches. On the Minahasa woloan house a reversible joint is a choice that lets the building be carried away; here it is a prohibition, and the two buildings arrive at the same joint by two unrelated reasons.'),
  guestStopsOutside: dim(1, 'count', 'canon', 'depdikbud-jabar', 'Tamu diterima di sosoro, bale-bale di muka rumah, dan tidak masuk ke ruang dalam. Rumah limas Palembang mendudukkan tamu pada tingkat yang menyatakan kedudukannya; rumah ini tidak mendudukkannya di dalam sama sekali.', 'A visitor is received on the sosoro, the platform at the front, and does not enter the inner room. The Palembang rumah limas seats a guest on the step that states their standing; this house does not seat them inside at all.'),
  innerVillagesStricter: dim(1, 'count', 'canon', 'garna-1993', 'Baduy Dalam memegang larangan itu seutuhnya dan Baduy Luar sebagiannya. Ini bukan pangkat: tidak ada yang lebih tinggi, dan yang paling ketat justru yang paling sedikit memiliki.', 'Baduy Dalam keeps the prohibitions in full and Baduy Luar keeps most of them. This is not a rank: neither is above the other, and the strictest have the least.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tanah: 0.2,
  batu: 0.8,
  tihang: 1.4,
  palupuh: 1.2,
  bilik: 1.3,
  sosoro: 0.7,
  suhunan: 1.4,
  hateup: 2,
}

export const PACK: RulePack<SundaKinds> = {
  key: 'sunda',
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

/* ── The ground, and the villages ─────────────────────────────────────── */

export interface LerengInfo {
  readonly lereng: Lereng
  readonly key: DimKey
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

/**
 * Three slopes, each a declared dimension.
 *
 * The rule holds the *key* and not the value, which is the correction the
 * Banjar pack had to make: a table of constants beside the table of dimensions
 * is the provenance layer being escaped quietly, and a counterexample cannot
 * push a number nothing reads.
 */
export const LERENG: readonly LerengInfo[] = [
  {
    lereng: 'landai',
    key: 'slopeGentle',
    name: 'Landai',
    glossId: 'Tanah yang hampir datar. Di sini larangan itu hampir tidak berbiaya apa-apa.',
    glossEn: 'Nearly level ground. Here the prohibition costs almost nothing.',
  },
  {
    lereng: 'sedang',
    key: 'slopeMedium',
    name: 'Sedang',
    glossId: 'Lereng biasa di Kanekes. Tiang sisi bawah menjadi jauh lebih panjang daripada tiang sisi atas, dan lantainya tetap satu bidang datar.',
    glossEn: 'The usual slope in Kanekes. The downhill posts become far longer than the uphill ones, and the floor stays one level plane.',
  },
  {
    lereng: 'curam',
    key: 'slopeSteep',
    name: 'Curam',
    glossId: 'Lereng yang curam. Di sinilah larangan itu mulai mahal — dan tandingan bangunan ini menekan angka ini sampai satu batang tidak lagi cukup panjang.',
    glossEn: 'Steep ground. This is where the prohibition starts to cost — and this building’s counterexample pushes this figure until one pole is no longer long enough.',
  },
]

export function lerengInfo(lereng: Lereng): LerengInfo {
  const found = LERENG.find((l) => l.lereng === lereng)
  if (!found) throw new Error(`unknown lereng: ${lereng}`)
  return found
}

/** The slope this rule selects, read live from the pack. */
export function slopeOf(lereng: Lereng): number {
  return DIMS[lerengInfo(lereng).key].value
}

export interface WilayahInfo {
  readonly wilayah: Wilayah
  readonly name: string
  readonly doors: number
  readonly glossId: string
  readonly glossEn: string
}

export const WILAYAH: readonly WilayahInfo[] = [
  {
    wilayah: 'dalam',
    name: 'Baduy Dalam',
    doors: 1,
    glossId:
      'Larangan dipegang seutuhnya: tidak ada besi pada rangka, satu pintu, dan tidak ada apa pun yang tidak ditumbuhkan hutan. Yang paling ketat adalah yang paling sedikit memiliki, dan itu bukan kekurangan melainkan kedudukan.',
    glossEn:
      'The prohibitions in full: no iron in the frame, one door, and nothing the forest did not grow. The strictest have the least, and that is a standing rather than a shortfall.',
  },
  {
    wilayah: 'luar',
    name: 'Baduy Luar',
    doors: 2,
    glossId:
      'Sebagian besar larangan dipegang, dan beberapa hal diizinkan yang tidak diizinkan di dalam — termasuk pintu kedua di sisi rumah. Ini bukan tingkat yang lebih rendah: keduanya satu masyarakat dengan dua kesanggupan.',
    glossEn:
      'Most of the prohibitions are kept, and some things are allowed that the inner villages do not allow — a second door on the side among them. This is not a lower rank: they are one society with two undertakings.',
  },
]

export function wilayahInfo(wilayah: Wilayah): WilayahInfo {
  const found = WILAYAH.find((w) => w.wilayah === wilayah)
  if (!found) throw new Error(`unknown wilayah: ${wilayah}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tanah',
    title: 'Tanah',
    glossId: 'Tanahnya ada lebih dulu, dan tetap seperti apa adanya. Ia ada dalam daftar bagian bangunan ini justru karena ia satu-satunya hal yang tidak boleh diubah: tidak digali, tidak diratakan, tidak dipotong.',
    glossEn: 'The ground is there first and stays as it is. It is in this building’s part list precisely because it is the one thing that may not be changed: not dug, not levelled, not cut.',
  },
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan di tempat batu itu berada. Ketinggiannya berbeda-beda karena tanahnya berbeda-beda, dan tidak ada satu pun yang dibenamkan.',
    glossEn: 'The stones are set where they lie. They are at different heights because the ground is, and not one of them is bedded in.',
  },
  {
    stage: 'tihang',
    title: 'Tihang',
    glossId: 'Tiang dipotong sepanjang yang disisakan tanah: tiap tiang berbeda panjangnya, dan yang di sisi bawah paling panjang. Inilah biaya larangan itu, dinyatakan dalam meter.',
    glossEn: 'The posts are cut to what the ground leaves: every one a different length, the downhill ones longest. This is the cost of the prohibition, stated in metres.',
  },
  {
    stage: 'palupuh',
    title: 'Palupuh',
    glossId: 'Balok dan lantai bambu belah dipasang. Lantainya satu bidang datar di atas tanah yang tidak datar — dan itu pekerjaan yang lebih sulit daripada meratakan tanahnya.',
    glossEn: 'The beams and the split-bamboo floor go on. The floor is one level plane over ground that is not level — which is harder work than levelling the ground would have been.',
  },
  {
    stage: 'bilik',
    title: 'Bilik',
    glossId: 'Dinding anyaman bambu dipasang di keliling.',
    glossEn: 'The woven bamboo walls go on around the perimeter.',
  },
  {
    stage: 'sosoro',
    title: 'Sosoro',
    glossId: 'Bale-bale muka dipasang, tempat tamu diterima. Tamu berhenti di sini.',
    glossEn: 'The front platform goes on, where visitors are received. A visitor stops here.',
  },
  {
    stage: 'suhunan',
    title: 'Suhunan',
    glossId: 'Rangka atap disusun dan diikat; tidak ada paku pada rangka ini.',
    glossEn: 'The roof frame goes up and is lashed; there is no iron in this frame.',
  },
  {
    stage: 'hateup',
    title: 'Hateup',
    glossId: 'Atap daun dipasang berlapis dari tepi ke bubungan.',
    glossEn: 'The palm thatch goes on in courses from the eave to the ridge.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { wilayah: 'dalam', lereng: 'sedang', sosoro: true }

export function normaliseRules(rules: Rules): Rules {
  return { wilayah: rules.wilayah, lereng: rules.lereng, sosoro: rules.sosoro }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
