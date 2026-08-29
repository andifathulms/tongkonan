/**
 * The rule pack for the Nias omo.
 *
 * The sixth pack, and the first where a canon entry states a *structural*
 * requirement rather than a social one. That is worth being careful about,
 * because it is exactly the kind of thing this project could get wrong in a
 * flattering direction.
 *
 * `everyBayTriangulated` is canon and it is not a claim about what a household
 * says. It is a claim about what the ground does. South Nias is on an active
 * margin, the substructure carries driwa on the diagonal as well as ehomo on
 * the vertical, and the sources are unanimous that this is why the buildings
 * survive shaking. Filing it as canon is right — a source states it — but it
 * means this pack's canon list is doing two different jobs at once, and the
 * dimension notes say which is which rather than letting the reader assume the
 * whole list is about standing and lineage.
 *
 * What that settles for the project: "a social fact becomes a dimension" is
 * not the whole story and never was. It is that *the rules a tradition states
 * about its own building become dimensions*, and some of those rules are about
 * people while others are about the earth. The five earlier houses could not
 * have shown that, because none of them has a rule of the second kind.
 *
 * Nothing here is `measured`. No omo has been surveyed for this project.
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
  NiasKinds,
  Omo,
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
    key: 'feldman-1979',
    citation:
      'Feldman, J., The Architecture of Nias, Indonesia, with Special Reference to Bawomataluo Village ' +
      '(PhD dissertation, Columbia University, 1979).',
    kind: 'reference',
  },
  {
    key: 'viaro-1980',
    citation:
      'Viaro, A., Urbanisme et architecture traditionnels du sud de l’île de Nias ' +
      '(UNESCO / PNUD, Paris, 1980).',
    kind: 'reference',
  },
  {
    key: 'gruber-herbig-2009',
    citation:
      'Gruber, P. and Herbig, U., “Settlements and Housing on Nias Island: Adaptation and Development”, ' +
      'in Proceedings of the International Conference on Vernacular Heritage and Earthen Architecture (2009).',
    kind: 'reference',
  },
  {
    key: 'depdikbud-sumut',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sumatera Utara ' +
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
  /* the plan */
  bayLength: dim(2.4, 'm', 'interpolated', 'none', 'Jarak antar tiang sepanjang bubungan. Denahnya bertambah dengan kelipatan bulat angka ini dan tidak dengan cara lain.', 'Spacing between posts along the ridge. The plan grows by whole multiples of this and by nothing else.'),
  bayDepth: dim(2.7, 'm', 'interpolated', 'none', 'Jarak antar tiang melintang. Sedikit lebih besar daripada jarak memanjang, sehingga petak bawahnya bukan bujur sangkar dan diagonalnya punya arah yang jelas.', 'Spacing between posts across the building. A little larger than the spacing along it, so the bays beneath are not square and their diagonals have a definite direction.'),
  bodyRows: dim(4, 'count', 'interpolated', 'none', 'Baris tiang melintang. Menentukan kedalaman rumah; jumlah baris memanjang datang dari aturan ruang.', 'Rows of posts across the building. It sets the depth; the number along the building comes from the bay rule.'),
  postSection: dim(0.34, 'm', 'interpolated', 'none', 'Sisi penampang ehomo. Tiang ini besar — bukan karena beban tegaknya, melainkan karena ia juga yang menerima gaya dari driwa.', 'Section of an ehomo. These posts are heavy — not for the load standing on them, but because they are also what the driwa deliver their force into.'),
  braceSection: dim(0.26, 'm', 'interpolated', 'none', 'Sisi penampang driwa. Lebih kecil daripada ehomo tetapi tidak jauh lebih kecil: batang ini bekerja, bukan menyangga.', 'Section of a driwa. Smaller than an ehomo but not much smaller: these members work rather than merely prop.'),
  stoneHeight: dim(0.30, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tiang berdiri.', 'Height of the stone a post foot stands on.'),
  stoneWidth: dim(0.58, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),

  /* the storey beneath, which is the subject */
  floorHeight: dim(3.1, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah. Kolongnya tinggi dan terbuka, dan justru di situlah seluruh gagasan bangunannya terlihat: rangka diagonal itu tidak disembunyikan.', 'Height of the floor above the ground. The understorey is tall and open, and it is there that the whole idea of the building is visible: the diagonal frame is not hidden.'),
  floorThickness: dim(0.09, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),

  /* the body */
  wallHeight: dim(2.3, 'm', 'interpolated', 'none', 'Tinggi dinding dari lantai sampai tepi atap.', 'Height of the wall from the floor to the eave.'),
  wallLean: dim(0.42, 'm', 'interpolated', 'none', 'Seberapa jauh kepala dinding berdiri di luar kakinya. Miring ke luar, jadi badan rumah melebar ke atas — kebalikan dari yang dilakukan tongkonan, yang dindingnya tegak karena tidak ada sumber yang memberi sudutnya.', 'How far the head of the wall stands outboard of its foot. It leans outward, so the body widens as it rises — the opposite of the tongkonan, whose walls are left vertical because no source gives an angle.'),
  wallThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),
  windowHeight: dim(0.62, 'm', 'interpolated', 'none', 'Tinggi pita jendela di muka rumah. Satu bukaan menerus, bukan sederet lubang terpisah.', 'Height of the window band across the front. One continuous opening rather than a row of separate holes.'),
  windowDrop: dim(0.55, 'm', 'interpolated', 'none', 'Jarak dari tepi atap turun ke atas pita jendela.', 'Distance from the eave down to the head of the window band.'),
  windowInset: dim(0.9, 'm', 'interpolated', 'none', 'Jarak pita jendela berhenti sebelum sudut, di tiap ujungnya.', 'How far the window band stops short of the corner, at each end.'),

  /* the roof */
  ridgeRise: dim(5.6, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap. Atapnya jauh lebih besar daripada badan yang ditutupinya, dan bagian terbesar bangunan ini adalah atap.', 'Rise of the ridge above the eave. The roof is far larger than the body it covers, and the greatest part of this building is roof.'),
  eaveOversail: dim(1.1, 'm', 'interpolated', 'none', 'Panjang tritisan di luar dinding.', 'Depth of the overhang outside the wall.'),
  rafterSection: dim(0.11, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerBay: dim(4, 'count', 'interpolated', 'none', 'Jumlah kasau tiap ruang.', 'Rafters in each bay.'),
  thatchCourseDepth: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis rumbia.', 'Exposed depth of one course of sago thatch.'),
  thatchThickness: dim(0.09, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below it.'),
  thatchLap: dim(0.42, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps over.'),
  thatchBed: dim(0.05, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the loft */
  loftHeight: dim(2.0, 'm', 'interpolated', 'none', 'Tinggi loteng di atas lantai, di rumah si’ulu. Ruang di dalam atap besar itu dipakai; ia bukan rongga.', 'Height of the loft above the floor, in a si’ulu’s house. The space inside that large roof is used; it is not a void.'),

  /* the plaza */
  behuHeight: dim(1.6, 'm', 'interpolated', 'none', 'Tinggi batu tegak di depan rumah.', 'Height of a standing stone in front of the house.'),
  behuWidth: dim(0.44, 'm', 'interpolated', 'none', 'Lebar batu tegak itu.', 'Width of that standing stone.'),
  behuCount: dim(4, 'count', 'interpolated', 'none', 'Jumlah behu yang dipasang model ini bila rumah tangganya berhak. Jumlah sebenarnya adalah catatan pesta yang telah diadakan dan bukan angka yang dapat ditetapkan penulis; empat adalah pengganti yang jujur dan bukan bacaan atas suatu tempat.', 'How many behu this model raises when the household is entitled to. The real number is a record of the feasts that have been held and is not a figure the author can set; four is an honest placeholder rather than a reading of any one place.'),
  behuSpacing: dim(1.9, 'm', 'interpolated', 'none', 'Jarak antar batu tegak.', 'Spacing between standing stones.'),
  plazaOffset: dim(2.6, 'm', 'interpolated', 'none', 'Jarak batu tegak di depan muka rumah.', 'How far the standing stones sit in front of the house.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu tempat kaki tiang duduk, sebagai bagian dari tinggi batu.', 'Depth of the dish in the stone the post foot seats into, as a share of stone height.'),
  sebuaScale: dim(1.22, 'ratio', 'interpolated', 'none', 'Besar omo sebua dibanding omo hada. Bahwa rumah si’ulu lebih besar dan berloteng itu bersumber; seberapa besar bedanya adalah penetapan penulis.', 'Size of an omo sebua relative to an omo hada. That a si’ulu’s house is larger and has a loft is sourced; how much larger is the author’s.'),

  /* rules that are structure, not measurement */
  everyBayTriangulated: dim(1, 'count', 'canon', 'gruber-herbig-2009', 'Setiap petak rangka bawah disilang driwa: tidak ada persegi empat tiang yang dibiarkan tanpa diagonal. Ini satu-satunya aturan kanon dalam projek ini yang bukan pernyataan tentang manusia melainkan tentang tanah — Nias selatan berdiri di tepi lempeng aktif, persegi bergoyang dan segitiga tidak, dan itulah sebabnya bangunan ini bertahan diguncang. Perhatikan bahwa daftar kanon pak ini karena itu mengerjakan dua hal sekaligus.', 'Every bay of the substructure is crossed by driwa: no rectangle of four posts is left without a diagonal. It is the only canon rule in this project that is not a statement about people but about the ground — South Nias sits on an active margin, a rectangle racks and a triangle does not, and that is why these buildings survive shaking. Note that this pack’s canon list is therefore doing two jobs at once.'),
  bracingVisible: dim(1, 'count', 'canon', 'feldman-1979', 'Rangka diagonal itu berada di kolong yang terbuka dan tidak ditutupi apa pun. Bagian yang membuat rumah ini berdiri adalah bagian yang paling mudah dilihat, yang tidak berlaku bagi lima rumah lain di sini.', 'The diagonal frame stands in an open understorey and nothing is put in front of it. The part that makes this house stand is the part easiest to see, which is true of none of the other five here.'),
  raisedOnPosts: dim(1, 'count', 'canon', 'viaro-1980', 'Rumah berdiri di atas tiang, dan kolongnya tinggi serta terbuka.', 'The house stands on posts, and the understorey is tall and open.'),
  seatedOnStone: dim(1, 'count', 'canon', 'viaro-1980', 'Kaki tiang berdiri di atas batu, tidak ditanam — sambungan yang boleh sedikit bergerak lebih baik daripada sambungan yang harus patah.', 'The post feet stand on stones and are not buried — a footing allowed to move a little is better than one that has to break.'),
  windowBand: dim(1, 'count', 'canon', 'feldman-1979', 'Muka rumah dibuka oleh satu pita jendela menerus di bawah tepi atap, bukan oleh sederet lubang terpisah.', 'The front is opened by a single continuous window band under the eave rather than by a row of separate holes.'),
  behuAreEarned: dim(1, 'count', 'canon', 'feldman-1979', 'Behu didirikan oleh si’ulu, dan tiap batu adalah catatan pesta yang pernah diadakan. Batu-batu itu berada di luar rumah dan menyatakan sesuatu tentang rumah tangganya yang tidak dinyatakan oleh bagian bangunan mana pun — satu-satunya aturan dalam projek ini yang menambahkan sesuatu di luar bangunan.', 'Behu are raised by si’ulu, and each stone records a feast that was held. They stand outside the house and state something about the household that no part of the building states — the only rule in this project that adds something outside the building.'),
  loftInRoof: dim(1, 'count', 'canon', 'depdikbud-sumut', 'Rumah si’ulu punya loteng di dalam atapnya. Atap sebesar itu terlalu berharga untuk dikosongkan.', 'A si’ulu’s house has a loft inside its roof. A roof that large is too valuable to leave empty.'),

  /* The site: the street, which is what an omo is one of. */
  streetTerrace: dim(1, 'count', 'canon', 'viaro-1980', 'Rumah-rumah Nias Selatan berdiri berderet rapat di sepanjang jalan kampung berbatu, saling bersinggungan sisi demi sisi. Omo bukan benda yang berdiri sendiri di tanah lapang: ia satu petak dari sebuah deretan, dan jalan itulah yang dihadapinya.', 'South Nias houses stand in a close terrace along a paved village street, side against side. An omo is not a free-standing object on open ground: it is one unit of a terrace, and the street is what it faces.'),
  streetWidth: dim(9, 'm', 'interpolated', 'none', 'Lebar jalan berbatu di muka rumah.', 'Width of the paved street in front of the house.'),
  neighbourHeight: dim(5.5, 'm', 'interpolated', 'none', 'Tinggi massa rumah tetangga di kiri dan kanan. Tetangga adalah omo lain dan berhak atas seluruh modelnya sendiri; yang digambar hanya balok setinggi tepi atapnya, agar terbaca bahwa rumah ini satu petak dari deretan tanpa mengarang tiga belas rumah lagi.', 'Height of the neighbouring houses’ massing on either side. A neighbour is another omo and is entitled to a whole model of its own; what is drawn is a block the height of its eave, enough to read that this house is one unit of a terrace without inventing thirteen more houses.'),
  pavingDepth: dim(0.12, 'm', 'interpolated', 'none', 'Tebal perkerasan batu jalan kampung.', 'Thickness of the stone paving of the village street.'),
  neighbourGap: dim(0.8, 'm', 'interpolated', 'none', 'Jarak ke rumah tetangga di kiri dan kanan. Bahwa rumah berderet rapat adalah kanon; celah sekecil ini adalah penetapan penulis.', 'Distance to the neighbouring house on either side. That the houses stand in a close terrace is canon; a gap this small is the author’s.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.7,
  ehomo: 1.7,
  driwa: 2.0,
  lantai: 1.0,
  dinding: 1.2,
  jendela: 0.5,
  rangka: 1.6,
  rumbia: 2.2,
  behu: 0.8,
}

export const PACK: RulePack<NiasKinds> = {
  key: 'nias',
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

export interface OmoInfo {
  readonly omo: Omo
  readonly name: string
  readonly scale: number
  readonly loft: boolean
  readonly glossId: string
  readonly glossEn: string
}

export const OMO: readonly OmoInfo[] = [
  {
    omo: 'sebua',
    name: 'Omo sebua',
    scale: DIMS.sebuaScale.value,
    loft: true,
    glossId:
      'Rumah si’ulu, golongan bangsawan. Lebih besar, lebih tinggi, dan berloteng di dalam atapnya. Bedanya dengan rumah biasa adalah beda derajat, bukan beda jenis — tidak ada bagian yang hanya dimiliki rumah ini dan tidak dimiliki yang lain.',
    glossEn:
      'The house of a si’ulu, of the noble class. Larger, taller, and with a loft inside its roof. The difference from an ordinary house is one of degree rather than of kind — there is no part this house has that the other lacks.',
  },
  {
    omo: 'hada',
    name: 'Omo hada',
    scale: 1,
    loft: false,
    glossId:
      'Rumah biasa: bangunan yang sama, dibuat lebih kecil, tanpa loteng. Rangka diagonalnya persis sama, karena tanah tidak membedakan pemiliknya.',
    glossEn:
      'An ordinary house: the same building made smaller, without a loft. Its diagonal frame is exactly the same, because the ground does not distinguish between owners.',
  },
]

export function omoInfo(omo: Omo): OmoInfo {
  const found = OMO.find((o) => o.omo === omo)
  if (!found) throw new Error(`unknown omo: ${omo}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan lebih dahulu, satu untuk tiap tiang. Tidak ada yang ditanam: kaki yang boleh sedikit bergeser lebih baik daripada kaki yang harus patah.',
    glossEn: 'The stones go down first, one for each post. Nothing is buried: a footing allowed to shift a little is better than one that has to break.',
  },
  {
    stage: 'ehomo',
    title: 'Ehomo',
    glossId: 'Tiang tegak didirikan di atas batunya. Sampai driwa terpasang, yang berdiri di sini barulah sekumpulan persegi — dan persegi bergoyang.',
    glossEn: 'The vertical posts are stood on their stones. Until the driwa go in, what is standing here is a set of rectangles — and a rectangle racks.',
  },
  {
    stage: 'driwa',
    title: 'Driwa',
    glossId: 'Diagonal dipasang melintang pada setiap petak, dan pada saat itulah bangunan ini menjadi bangunan. Ini tahap yang tidak dimiliki lima rumah lain di sini, dan alasannya bukan adat melainkan tanah.',
    glossEn: 'The diagonals go across every bay, and at that moment this becomes a building. It is the stage none of the other five houses here has, and the reason for it is not custom but the ground.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai dipasang di atas rangka yang sudah kaku.',
    glossEn: 'The floor is laid over a frame that is already stiff.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding berdiri miring ke luar, jadi badan rumah melebar ke atas.',
    glossEn: 'The walls stand leaning outward, so the body widens as it rises.',
  },
  {
    stage: 'jendela',
    title: 'Jendela',
    glossId: 'Satu pita bukaan menerus di muka rumah, di bawah tepi atap.',
    glossEn: 'One continuous band of opening across the front, under the eave.',
  },
  {
    stage: 'rangka',
    title: 'Rangka atap',
    glossId: 'Bubungan dan kasau. Atapnya jauh lebih besar daripada badan yang ditutupinya.',
    glossEn: 'Ridge and rafters. The roof is far larger than the body it covers.',
  },
  {
    stage: 'rumbia',
    title: 'Rumbia',
    glossId: 'Daun rumbia dipasang dari tepi atap ke atas, tiap lapis menindih lapis di bawahnya. Daun, bukan serat ijuk dan bukan rumput alang-alang.',
    glossEn: 'Sago-palm leaf is laid from the eave upward, each course lapping the one below. Leaf: not the black ijuk fibre and not alang-alang grass.',
  },
  {
    stage: 'behu',
    title: 'Behu',
    glossId: 'Batu tegak didirikan di halaman di muka rumah, bila rumah tangganya berhak. Ini satu-satunya tahap dalam projek ini yang tidak membangun bagian dari bangunannya.',
    glossEn: 'The standing stones are raised on the plaza in front, if the household is entitled to. It is the only stage in this project that builds no part of the building.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { omo: 'sebua', ruang: 6, behu: true }

export const MIN_RUANG = 3
export const MAX_RUANG = 9

export function normaliseRules(rules: Rules): Rules {
  return {
    omo: rules.omo,
    ruang: Math.min(MAX_RUANG, Math.max(MIN_RUANG, Math.round(rules.ruang))),
    behu: rules.behu,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
