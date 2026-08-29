/**
 * The rule pack for the Sasak lumbung.
 *
 * The twelfth pack, and the first for a building nobody lives in.
 *
 * That changes what the provenance layer is measuring. In eleven houses, the
 * dimensions describe a container for people and the social rules say who those
 * people are to each other. Here the dimensions describe a container for a
 * crop, and the one rule that is not about size — the rat guard — is about an
 * animal. `guardOverhang` is therefore the most consequential figure in the
 * pack and it is the author's: the sources agree the disc is there and that it
 * stops rats, and none of them gives a width. A defence whose whole efficacy is
 * a margin, with the margin invented, is exactly the kind of thing this bar
 * exists to show.
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
  Dim,
  Layout,
  Milik,
  Part,
  ProvenanceClass,
  Rules,
  SasakKinds,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'depdikbud-ntb',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Nusa Tenggara Barat ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'sumarni-2018',
    citation:
      'Sumarni, N. K., “Lumbung Padi Sasak: Bentuk, Fungsi dan Makna”, ' +
      'Jurnal Arsitektur Zonasi (2018).',
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
  /* the defence, which is the point */
  guardRadius: dim(0.36, 'm', 'interpolated', 'none', 'Jari-jari cakram penghalang. Sebuah papan dipotong menurut ukurannya sendiri, dan tiang yang menembusnya sebesar apa adanya — jadi juraian yang menghalau tikus adalah selisih keduanya, bukan angka tersendiri. Mula-mula ditulis sebagai juraian, yang membuat cakramnya membesar mengikuti tiangnya dan pemeriksaannya menjadi pengulangan yang tidak mungkin gagal. Sumber sepakat cakram itu ada dan gunanya menghalau tikus; tidak satu pun memberi ukurannya. Jadi sebuah pertahanan yang seluruh khasiatnya adalah sebuah selisih, dengan kedua angkanya dikarang.', 'Radius of the guard disc. A plank is cut to its own size and the post through it is whatever it is — so the overhang that stops a rat is the difference between the two rather than a figure of its own. Written as an overhang first, which made the disc grow with its post and the check on it a restatement that could not fail. The sources agree the disc is there and that it stops rats; none gives a size. So a defence whose whole efficacy is a difference, with both figures invented.'),
  guardThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal cakram penghalang.', 'Thickness of the guard disc.'),
  guardDrop: dim(0.55, 'm', 'interpolated', 'none', 'Jarak cakram di bawah lantai lumbung. Harus lebih rendah daripada tepi tudung: cakram yang tersembunyi di dalam atap tidak bisa diperiksa siapa pun, dan yang lebih penting, tudung yang turun melewatinya justru menjadi jalan memutar yang hendak ditutupnya. Mula-mula 0,34 m, yang menaruhnya di dalam tudung.', 'How far the disc sits below the granary floor. It has to be lower than the hood’s eave: a guard hidden inside the roof cannot be inspected by anyone, and more to the point, a hood falling past it becomes the way round that it exists to close. Written as 0.34 m first, which put it inside the hood.'),
  guardFacets: dim(20, 'count', 'interpolated', 'none', 'Sisi pada cakram penghalang. Kehalusan gambar, bukan ukuran bangunan.', 'Facets on the guard disc. Drawing resolution rather than a dimension of the building.'),

  /* the frame */
  postSection: dim(0.16, 'm', 'interpolated', 'none', 'Sisi penampang tiang. Ramping — dan itu bagian dari pertahanannya: tiang yang gemuk memperkecil juraian cakram di atasnya sampai tidak berguna lagi.', 'Section of a post. Slim — and that is part of the defence: a stout post shrinks the overhang of the disc above it until it is no longer any use.'),
  postSpacing: dim(1.85, 'm', 'interpolated', 'none', 'Jarak antar tiang.', 'Spacing between posts.'),
  stoneHeight: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tiang berdiri.', 'Height of the stone a post foot stands on.'),
  stoneWidth: dim(0.4, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),
  floorHeight: dim(2.0, 'm', 'interpolated', 'none', 'Tinggi lantai lumbung di atas tanah. Tinggi cukup untuk orang duduk dan bekerja di bawahnya, yang memang dilakukan.', 'Height of the granary floor above the ground. High enough for a person to sit and work beneath it, which is what happens.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),

  /* the store */
  storeHeight: dim(1.25, 'm', 'interpolated', 'none', 'Tinggi ruang simpan. Tidak ada orang yang bisa berdiri tegak di dalamnya, dan memang tidak perlu: yang disimpan padi, dan padi dimasukkan dari atas.', 'Height of the store. Nobody can stand up in it, and nobody needs to: what is kept there is rice, and rice goes in from above.'),
  storeInset: dim(0.1, 'm', 'interpolated', 'none', 'Seberapa jauh dinding ruang simpan berada di dalam garis tiang.', 'How far the store’s walls sit inside the line of the posts.'),
  wallThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),
  hatchWidth: dim(0.6, 'm', 'interpolated', 'none', 'Lebar bukaan di ujung ruang simpan, tempat padi dimasukkan dan diambil.', 'Width of the opening at the end of the store, where rice goes in and comes out.'),

  /* the hood */
  ridgeRise: dim(2.5, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas lantai simpan.', 'Rise of the ridge above the store floor.'),
  eaveDrop: dim(0.28, 'm', 'interpolated', 'none', 'Seberapa jauh tepi atap turun di bawah lantai simpan. Tepi atap yang turun melewati lantainya adalah yang membuat bentuk ini terbaca sebagai tudung, bukan sebagai atap — tetapi ia harus berhenti di atas cakram penghalang, karena tudung yang turun melewatinya menjadi jalan memutar.', 'How far the eave falls below the store floor. An eave that drops past its own floor is what makes this form read as a hood rather than as a roof — but it has to stop above the rat guards, because a hood falling past them becomes a way round.'),
  eaveReach: dim(1.55, 'm', 'interpolated', 'none', 'Jarak tepi atap dari sumbu, diukur mendatar.', 'Reach of the eave from the axis, measured horizontally.'),
  hoodBelly: dim(0.7, 'ratio', 'interpolated', 'none', 'Seberapa jauh sisi tudung menggembung ke luar dari garis lurus antara bubungan dan tepi atap. Nol memberi limas biasa; angka ini yang membuat lengkungnya.', 'How far the hood’s side bellies outward from a straight line between the ridge and the eave. Zero gives an ordinary hip; this figure is what makes the curve.'),
  hoodSteps: dim(9, 'count', 'interpolated', 'none', 'Jumlah tingkat yang dipakai untuk mendekati lengkung itu. Kehalusan gambar, bukan ukuran bangunan — tetapi angkanya harus cukup besar sehingga lengkungnya terbaca sebagai lengkung dan bukan sebagai tangga, dan pemeriksaannya menuntut tiap tingkat lebih curam daripada yang di bawahnya.', 'How many levels are used to approximate that curve. Drawing resolution rather than a dimension of the building — but it has to be large enough that the curve reads as a curve rather than as a stair, and the check requires each step to be steeper than the one below it.'),
  ridgeHalf: dim(0.22, 'm', 'interpolated', 'none', 'Setengah panjang bubungan di puncak tudung. Tidak nol: puncaknya sebuah garis pendek, bukan sebuah titik.', 'Half-length of the ridge at the top of the hood. Not zero: the top is a short line rather than a point.'),
  rafterSection: dim(0.07, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerSide: dim(5, 'count', 'interpolated', 'none', 'Jumlah kasau pada tiap bidang.', 'Rafters on each face.'),
  thatchCourseDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis alang-alang.', 'Exposed depth of one course of thatch.'),
  thatchThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  thatchLap: dim(0.45, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* underneath */
  seatHeight: dim(0.42, 'm', 'interpolated', 'none', 'Tinggi lantai duduk di bawah lumbung, bila ada.', 'Height of the sitting platform beneath the granary, where there is one.'),
  seatThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan lantai duduk itu.', 'Thickness of that platform’s boards.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu tempat kaki tiang duduk.', 'Depth of the dish in the stone the post foot seats into.'),
  desaScale: dim(1.24, 'ratio', 'interpolated', 'none', 'Besar lumbung desa dibanding lumbung keluarga. Bahwa yang milik desa lebih besar itu bersumber; seberapa besar bedanya adalah penetapan penulis.', 'Size of a village lumbung relative to a household one. That the village’s is larger is sourced; how much larger is the author’s.'),

  /* rules that are structure, not measurement */
  builtForRice: dim(1, 'count', 'canon', 'sumarni-2018', 'Bangunan ini untuk padi, bukan untuk orang. Tidak ada tingkat di dalamnya yang bisa ditegakkan seorang manusia, dan di pekarangan Sasak ia justru kerap bangunan yang paling cermat dikerjakan. Sebelas rumah lain dalam projek ini menakar kecermatan menurut kedudukan penghuninya; yang ini menakarnya menurut nilai yang disimpannya, dan orangnya duduk di bawah.', 'This building is for rice, not for people. There is no storey in it a person could stand up in, and in a Sasak yard it is routinely the most carefully made thing standing. The other eleven in this project scale their care to the standing of the people inside; this one scales it to the value of what is stored, and the people sit underneath.'),
  guardOnEveryPost: dim(1, 'count', 'canon', 'depdikbud-ntb', 'Tiap tiang memikul satu cakram tepat di bawah lantai, dan gunanya cuma satu: tikus yang memanjat tiang tidak bisa melewatinya. Ini satu-satunya unsur dalam projek ini yang ditujukan kepada makhluk selain manusia — dan ia hanya bekerja bila tidak ada jalan lain ke atas, jadi yang diuji pemeriksaannya adalah ketiadaan jalan itu.', 'Every post carries one disc just below the floor, and it has exactly one job: a rat climbing the post cannot get past it. It is the only element in this project aimed at something other than a person — and it only works if there is no other way up, so what the check tests is the absence of one.'),
  noOtherWayUp: dim(0, 'count', 'canon', 'depdikbud-ntb', 'Nol jalan lain dari tanah ke lantai simpan. Tidak ada tangga yang ditinggalkan bersandar, tidak ada penyangga miring yang menyentuh keduanya, tidak ada dinding yang turun melewati cakram, dan tepi tudung pun berhenti di atasnya. Sebuah cakram penghalang yang dilewati sebatang bambu bukan penghalang — dan begitu pula yang tertutup atapnya sendiri.', 'Zero other paths from the ground to the store floor. No ladder left leaning, no raking brace touching both, no wall reaching down past the disc — and the hood’s own edge stops above it too. A rat guard with a bamboo pole beside it is not a guard, and neither is one covered by its own roof.'),
  hoodFallsPastTheFloor: dim(1, 'count', 'canon', 'depdikbud-ntb', 'Tepi atap turun melewati lantai simpan. Bentuk ini terbaca sebagai tudung dan bukan atap justru karena tepinya berada di bawah bidang yang dilindunginya.', 'The eave falls past the floor of the store. This form reads as a hood rather than a roof precisely because its edge sits below the plane it protects.'),
  seatedOnStone: dim(1, 'count', 'canon', 'waterson-1990', 'Kaki tiang berdiri di atas batu, tidak ditanam — yang juga menutup jalan bagi rayap, bukan hanya bagi tikus.', 'The post feet stand on stones and are not buried — which closes a path to termites as well as to rats.'),

  /* The site: the row, because a lumbung is never the only one. */
  granaryRow: dim(1, 'count', 'canon', 'depdikbud-ntb', 'Lumbung berdiri berjajar di pekarangan bersama lumbung lain dan rumah-rumah tinggal. Bangunan yang paling dirawat di pekarangan itu bukan tempat orang tidur, dan itu hanya terbaca bila yang lain ikut terlihat.', 'Lumbung stand in a row in the compound alongside other granaries and the dwellings. The most carefully made building in the yard is not the one people sleep in, and that only reads when the others are in view.'),
  neighbourSpacing: dim(6, 'm', 'interpolated', 'none', 'Jarak antar lumbung sepanjang jajarannya.', 'Spacing between lumbung along their row.'),
  neighbourFloorY: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi lantai lumbung tetangga. Hanya massanya yang digambar — sebuah lumbung adalah bangunan yang berhak atas modelnya sendiri, dan yang ada di sini balok dengan tudung di atasnya.', 'Height of a neighbouring lumbung’s floor. Only its massing is drawn — a lumbung is a building entitled to its own model, and what stands here is a block with a hood over it.'),
  neighbourBodyHeight: dim(1.2, 'm', 'interpolated', 'none', 'Tinggi badan lumbung tetangga di atas lantainya, pada massa yang digambar.', 'Height of a neighbouring lumbung’s body above its floor, on the massing drawn here.'),
  neighbourPostWidth: dim(0.22, 'm', 'interpolated', 'none', 'Garis tengah tiang lumbung tetangga.', 'Diameter of a neighbouring lumbung’s post.'),
  neighbourHoodEave: dim(0.9, 'm', 'interpolated', 'none', 'Tritisan tudung di luar badannya.', 'Overhang of the hood beyond the body.'),
  neighbourHoodHeight: dim(2, 'm', 'interpolated', 'none', 'Tinggi tudung di atas massa itu.', 'Height of the hood over that massing.'),
  neighbourPlan: dim(3.2, 'm', 'interpolated', 'none', 'Sisi denah lumbung tetangga. Hanya jejaknya yang digambar.', 'Plan side of a neighbouring lumbung. Only the footprint is drawn.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  tiang: 1.2,
  penghalang: 0.9,
  lantai: 0.9,
  dinding: 1.1,
  rangka: 1.5,
  atap: 2.2,
  kolong: 0.6,
}

export const PACK: RulePack<SasakKinds> = {
  key: 'sasak',
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

/* ── Whose harvest ────────────────────────────────────────────────────── */

export interface MilikInfo {
  readonly milik: Milik
  readonly name: string
  readonly scale: number
  readonly glossId: string
  readonly glossEn: string
}

export const MILIK: readonly MilikInfo[] = [
  {
    milik: 'keluarga',
    name: 'Lumbung keluarga',
    scale: 1,
    glossId: 'Lumbung satu rumah tangga, berdiri di pekarangannya sendiri.',
    glossEn: 'One household’s granary, standing in its own yard.',
  },
  {
    milik: 'desa',
    name: 'Lumbung desa',
    scale: DIMS.desaScale.value,
    glossId:
      'Lumbung milik kampung, berdiri berderet di dekat tempat berkumpul dan dibuat untuk dilihat dari sana. Bangunan yang sama, dibuat lebih besar — bedanya beda derajat, bukan beda jenis, dan dalam projek ini justru itu yang tidak biasa.',
    glossEn:
      'The village’s granary, standing in a row beside the meeting ground and built to be seen from it. The same building made larger — a difference of degree rather than of kind, which in this project is the unusual case.',
  },
]

export function milikInfo(milik: Milik): MilikInfo {
  const found = MILIK.find((m) => m.milik === milik)
  if (!found) throw new Error(`unknown milik: ${milik}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan lebih dahulu, satu untuk tiap tiang.',
    glossEn: 'The stones go down first, one for each post.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang didirikan di atas batunya. Ramping, dan kerampingan itu bagian dari pertahanannya.',
    glossEn: 'The posts are stood on their stones. Slim, and that slimness is part of the defence.',
  },
  {
    stage: 'penghalang',
    title: 'Penghalang tikus',
    glossId: 'Cakram disarungkan pada tiap tiang, tepat di bawah lantai — dan dipasang sebelum lantainya, karena sesudah itu tidak bisa lagi. Ini satu-satunya tahap dalam projek ini yang seluruhnya ditujukan kepada seekor binatang.',
    glossEn: 'A disc is threaded onto each post just below floor level — and it goes on before the floor, because afterwards it cannot. It is the only stage in this project aimed entirely at an animal.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai ruang simpan dipasang di atas cakram.',
    glossEn: 'The floor of the store is laid above the discs.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding ruang simpan berdiri, dengan satu bukaan di ujung tempat padi masuk dan keluar.',
    glossEn: 'The walls of the store go up, with one opening at the end where rice goes in and comes out.',
  },
  {
    stage: 'rangka',
    title: 'Rangka tudung',
    glossId: 'Rangka tudung dipasang: melengkung ke luar dari bubungan lalu turun curam, dan tepinya berakhir di bawah lantai simpan.',
    glossEn: 'The frame of the hood goes up: bellying outward from the ridge and then falling steeply, ending below the floor of the store.',
  },
  {
    stage: 'atap',
    title: 'Alang-alang',
    glossId: 'Alang-alang dipasang dari tepi ke atas, mengikuti lengkungnya.',
    glossEn: 'The thatch is laid from the eave upward, following the curve.',
  },
  {
    stage: 'kolong',
    title: 'Kolong',
    glossId: 'Bila dipilih, lantai duduk dipasang di bawah lumbung — teduh, kering, dan tempat pekerjaan sekitar panen berlangsung. Terakhir, karena ia tambahan pada bangunan yang sudah selesai.',
    glossEn: 'If chosen, a sitting platform is laid beneath the granary — shaded, dry, and where the work around the harvest happens. Last, because it is an addition to a building already finished.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { milik: 'keluarga', tiang: 4, kolong: true }

export function normaliseRules(rules: Rules): Rules {
  return {
    milik: rules.milik,
    // Four or six, and nothing else: a lumbung on five posts is not a smaller
    // one, it is a building this tradition does not make.
    tiang: Number(rules.tiang) === 6 ? 6 : 4,
    kolong: rules.kolong,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
