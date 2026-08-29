/**
 * The rule pack for the Sumbanese uma.
 *
 * The eighth pack, and the first whose principal rule is not about size,
 * shape, count or unit but about *purpose*. An uma mbatangu builds a tower
 * because it keeps the marapu; an uma kamadungu keeps nothing and builds none.
 * Every other either/or in this project changes a proportion or adds a part.
 * This one changes what kind of object the building is, and it is the sharpest
 * rule in the collection for that reason.
 *
 * It also puts a strain on the provenance layer worth naming. `menaraRise` —
 * how tall the tower stands relative to the house — is `interpolated` and
 * heavily so, and it is the single most visible number in the pack: it sets
 * the silhouette a photograph of Sumba is recognisable by. The sources are
 * emphatic that the peak is tall and that taller says more; none of them gives
 * a figure. So the most consequential dimension here is also among the least
 * supported, and that is stated rather than buried — a pack where the boldest
 * number is the softest one is exactly what the bar exists to reveal.
 *
 * On "Sumba": the island has many domains with real variation in plan, in
 * naming and in practice. The terms here are Kambera, from East Sumba. The
 * reading route says so, for the same reason the Dayak pack states its lean.
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
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  SumbaKinds,
  Uma,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'forth-1981',
    citation:
      'Forth, G. L., Rindi: An Ethnographic Study of a Traditional Domain in Eastern Sumba ' +
      '(Martinus Nijhoff, The Hague, 1981).',
    kind: 'ethnography',
  },
  {
    key: 'hoskins-1998',
    citation:
      'Hoskins, J., Biographical Objects: How Things Tell the Stories of People’s Lives ' +
      '(Routledge, New York, 1998).',
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
    key: 'depdikbud-ntt',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Nusa Tenggara Timur ' +
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
  /* the core, set out from four posts */
  coreSpanX: dim(6.2, 'm', 'interpolated', 'none', 'Jarak antar kambaniru melintang. Rumah ini ditata dari empat tiang itu dan bukan dari suatu jala: keempatnya bernama dan masing-masing punya peran.', 'Span between the kambaniru across the building. The house is set out from those four posts rather than from a grid: each is named and each has a role.'),
  coreSpanZ: dim(6.8, 'm', 'interpolated', 'none', 'Jarak antar kambaniru memanjang.', 'Span between the kambaniru along the building.'),
  postSection: dim(0.3, 'm', 'interpolated', 'none', 'Sisi penampang kambaniru. Besar, karena keempatnya memikul seluruh menara.', 'Section of a kambaniru. Heavy, because these four carry the whole tower.'),
  stoneHeight: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tiang berdiri.', 'Height of the stone a post foot stands on.'),
  stoneWidth: dim(0.5, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),
  floorHeight: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah. Rendah dibanding rumah panggung lain di sini: yang penting pada rumah ini bukan kolongnya melainkan puncaknya.', 'Height of the floor above the ground. Low compared with the other raised houses here: what matters on this building is not what is beneath it but what is on top.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),
  wallHeight: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi dinding inti, dari lantai sampai balok atas. Rendah — orang duduk di dalam rumah ini, bukan berdiri.', 'Height of the core wall from the floor to the plate. Low — this is a house people sit in rather than stand in.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),
  beamDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi penampang balok pengikat kepala tiang.', 'Depth of the beam tying the post heads.'),
  beamWidth: dim(0.15, 'm', 'interpolated', 'none', 'Lebar penampang balok itu.', 'Width of that beam.'),

  /* the veranda */
  banggaDepth: dim(1.7, 'm', 'interpolated', 'none', 'Lebar bangga, serambi di luar inti.', 'Depth of the bangga, the veranda outside the core.'),
  banggaDrop: dim(0.35, 'm', 'interpolated', 'none', 'Turunnya bangga di bawah lantai inti.', 'How far the bangga sits below the core floor.'),

  /* the lower roof, which every uma has */
  eaveOversail: dim(1.5, 'm', 'interpolated', 'none', 'Panjang tritisan di luar bangga. Panjang, karena serambi di bawahnya harus tetap kering.', 'Depth of the overhang outside the bangga. Generous, because the veranda beneath it has to stay dry.'),
  eaveDrop: dim(0.5, 'm', 'interpolated', 'none', 'Turunnya tepi atap di bawah balok atas.', 'How far the eave falls below the plate.'),
  shoulderRise: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi bahu atap bawah di atas tepinya. Di sinilah atap bawah berhenti dan — pada rumah bermenara — menara mulai.', 'Rise of the lower roof’s shoulder above its eave. This is where the lower roof stops and, on a towered house, where the tower begins.'),

  /* the tower */
  menaraRise: dim(2.1, 'ratio', 'interpolated', 'none', 'Tinggi menara dibanding tinggi rumah di bawahnya, sebagai nilai dasar sebelum aturan menara mengalikannya. Ini angka paling terlihat di seluruh pak ini — ia yang menentukan siluet yang membuat foto Sumba langsung dikenali — dan ia juga di antara yang paling lemah dasarnya. Sumber sepakat bahwa puncaknya menjulang dan bahwa yang lebih tinggi menyatakan lebih banyak; tidak satu pun memberi angka. Bahwa yang paling berani di sini juga yang paling lunak adalah hal yang justru harus terbaca, bukan disembunyikan.', 'Height of the tower relative to the house beneath it, as a base value before the tower rule multiplies it. This is the most visible number in the pack — it sets the silhouette a photograph of Sumba is recognisable by — and it is also among the least supported. The sources agree the peak is tall and that taller says more; none gives a figure. That the boldest number here is also the softest is precisely what should be legible rather than hidden.'),
  menaraTaper: dim(0.34, 'ratio', 'interpolated', 'none', 'Lebar puncak menara dibanding alasnya. Tidak nol: puncaknya rata, bukan runcing, dan di situlah tanduk berdiri.', 'Width of the tower’s top relative to its foot. Not zero: the peak is flat rather than pointed, and that is where the finials stand.'),
  towerSection: dim(0.16, 'm', 'interpolated', 'none', 'Sisi penampang rangka menara.', 'Section of a tower frame member.'),

  /* the thatch */
  thatchCourseDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis alang-alang.', 'Exposed depth of one course of alang-alang.'),
  thatchThickness: dim(0.09, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below it.'),
  thatchLap: dim(0.45, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps over.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),
  rafterSection: dim(0.1, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerSide: dim(7, 'count', 'interpolated', 'none', 'Jumlah kasau pada tiap bidang atap bawah.', 'Rafters on each plane of the lower roof.'),

  /* the finials */
  tandukRise: dim(0.9, 'm', 'interpolated', 'none', 'Tinggi tanduk di ujung bubungan menara.', 'Height of a finial at the end of the tower’s ridge.'),
  tandukSection: dim(0.1, 'm', 'interpolated', 'none', 'Sisi penampang tanduk.', 'Section of a finial.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu tempat kaki tiang duduk, sebagai bagian dari tinggi batu.', 'Depth of the dish in the stone the post foot seats into, as a share of stone height.'),

  /* rules that are structure, not measurement */
  loftIsTheTowerFloor: dim(1, 'count', 'canon', 'forth-1981', 'Uma deta adalah lantai di kaki menara: langit-langit rumah di bawahnya sekaligus alas ruang tempat marapu disimpan. Ketinggiannya tidak ditetapkan penulis — ia jatuh di tempat menara bermula, yaitu di kepala keempat kambaniru. Semula ditulis sebagai sekian bagian dari tinggi menara, yang menaruhnya di tengah udara dan menuntut penopang yang tidak ada di bangunan sebenarnya.', 'The uma deta is the floor at the foot of the tower: the ceiling of the house below and the base of the space the marapu are kept in. Its height is not the author’s to set — it falls where the tower begins, on the heads of the four kambaniru. Written first as a share of the tower’s height, which put it in mid-air and called for a support the real building does not have.'),
  towerHoldsTheMarapu: dim(1, 'count', 'canon', 'forth-1981', 'Menara ada karena loteng di dalamnya: uma deta, tempat marapu — benda-benda leluhur — disimpan. Atap pada tujuh rumah lain dalam projek ini menaungi sesuatu; yang ini mewadahi sesuatu. Rumah yang tidak menyimpan marapu tidak punya alasan bermenara, dan memang tidak membangunnya.', 'The tower exists because of the loft inside it: the uma deta, where the marapu — the ancestral objects — are kept. On the other seven houses here the roof shelters something; this one contains something. A house that keeps no marapu has no reason for a tower, and does not build one.'),
  fourNamedPosts: dim(4, 'count', 'canon', 'forth-1981', 'Empat kambaniru, masing-masing bernama dan masing-masing berperan — beras disimpan di satu sudut, sesaji dipersembahkan di sudut lain, dan sisi laki-laki serta perempuan bermula di dua sisanya. Satu-satunya rumah dalam projek ini yang tiangnya perorangan, bukan anggota barisan.', 'Four kambaniru, each named and each with a role — rice is kept at one corner, offerings made at another, and the men’s and women’s sides begin at the remaining two. The only house in this project whose posts are individuals rather than members of a rank.'),
  towerIsARank: dim(1, 'count', 'canon', 'hoskins-1998', 'Menara yang lebih tinggi menyatakan lebih banyak tentang marapu yang disimpannya, dan karena itu tentang rumah tangga yang memegangnya. Ini satu-satunya aturan dalam projek ini yang berupa perbandingan dan bukan pilihan atau cacah.', 'A taller tower says more about the marapu it holds and therefore about the household holding them. It is the only rule in this project that is a ratio rather than a choice or a count.'),
  peakIsFlat: dim(1, 'count', 'canon', 'depdikbud-ntt', 'Puncak menara rata, bukan runcing, dan di sanalah tanduk berdiri. Bentuk yang seluruhnya meruncing akan menghilangkan tempat loteng itu berada.', 'The top of the tower is flat rather than pointed, and the finials stand on it. A form tapering to a point would remove the place the loft occupies.'),
  seatedOnStone: dim(1, 'count', 'canon', 'waterson-1990', 'Kaki tiang berdiri di atas batu, tidak ditanam.', 'The post feet stand on stones; they are not buried.'),
  raisedOnPosts: dim(1, 'count', 'canon', 'waterson-1990', 'Rumah berdiri di atas tiang, tetapi rendah — yang penting di sini bukan kolongnya.', 'The house stands on posts, but low — what matters here is not what is under it.'),

  /* The site: the square, and the stones in it. */
  villageSquare: dim(1, 'count', 'canon', 'hoskins-1998', 'Uma berdiri mengelilingi sebuah pelataran kampung di puncak bukit, dan di pelataran itu terletak kubur batu megalitik para leluhur. Rumah yang menyimpan marapu di menaranya berdiri berhadapan dengan kubur orang-orang yang diwakilinya.', 'Uma stand around a village square on a hilltop, and in the square lie the megalithic graves of the ancestors. The house that keeps the marapu in its tower stands facing the graves of the people it keeps them for.'),
  squareDepth: dim(12, 'm', 'interpolated', 'none', 'Jarak dari muka rumah ke seberang pelataran.', 'Distance from the front of the house across the square.'),
  gravePlan: dim(2.6, 'm', 'interpolated', 'none', 'Sisi denah satu kubur batu. Hanya jejaknya yang digambar; batunya tidak dimodelkan.', 'Plan side of one stone grave. Only the footprint is drawn; the slabs are not modelled.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  kambaniru: 1.6,
  balok: 1.1,
  lantai: 1.0,
  dinding: 1.1,
  'uma-deta': 1.0,
  menara: 1.8,
  alang: 2.2,
  tanduk: 0.5,
}

export const PACK: RulePack<SumbaKinds> = {
  key: 'sumba',
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

/* ── With a tower, or without ─────────────────────────────────────────── */

export interface UmaInfo {
  readonly uma: Uma
  readonly name: string
  readonly tower: boolean
  readonly glossId: string
  readonly glossEn: string
}

export const UMA: readonly UmaInfo[] = [
  {
    uma: 'mbatangu',
    name: 'Uma mbatangu',
    tower: true,
    glossId:
      'Rumah bermenara. Di dalam puncaknya ada uma deta, tempat marapu disimpan — dan menara itu ada karena loteng itu, bukan sebaliknya. Bangunan ini bukan rumah beratap tinggi; ia sebuah wadah dengan rumah di kakinya.',
    glossEn:
      'A house with a tower. Inside its peak is the uma deta where the marapu are kept — and the tower exists because of that loft rather than the other way about. This is not a house with a tall roof; it is a container with a house around its foot.',
  },
  {
    uma: 'kamadungu',
    name: 'Uma kamadungu',
    tower: false,
    glossId:
      'Rumah tanpa menara: atap limas rendah, tanpa loteng, tanpa yang disimpan. Bukan rumah yang lebih kecil — rumah yang tidak menyimpan apa-apa, dan karena itu tidak punya alasan untuk membangun puncak.',
    glossEn:
      'A house without a tower: a low hipped roof, no loft, nothing kept. Not a smaller house — a house that keeps nothing, and therefore has no reason to build a peak.',
  },
]

export function umaInfo(uma: Uma): UmaInfo {
  const found = UMA.find((u) => u.uma === uma)
  if (!found) throw new Error(`unknown uma: ${uma}`)
  return found
}

/* ── The four posts ───────────────────────────────────────────────────── */

/**
 * Named, with roles, and in a fixed arrangement.
 *
 * The names and their associations are the least certain thing in this pack
 * and the most consequential to get wrong, so they are given as roles rather
 * than as a claim about ritual practice, and the caution says so. What is
 * certain and sourced is that there are four, that they are named, and that
 * each corner of the house means something different.
 */
export const KAMBANIRU: readonly {
  key: string
  name: string
  sx: -1 | 1
  sz: -1 | 1
  glossId: string
  glossEn: string
}[] = [
  {
    key: 'uratungu',
    name: 'Kambaniru uratungu',
    sx: -1,
    sz: -1,
    glossId: 'Sudut tempat sesaji dipersembahkan. Tiang ini yang pertama didirikan dan yang seluruh rumah ditata darinya.',
    glossEn: 'The corner where offerings are made. This post is raised first, and the whole house is set out from it.',
  },
  {
    key: 'kambaniru-uma',
    name: 'Kambaniru uma',
    sx: -1,
    sz: 1,
    glossId: 'Sudut sisi perempuan, tempat tungku dan pekerjaan sehari-hari.',
    glossEn: 'The corner of the women’s side, where the hearth and the day’s work are.',
  },
  {
    key: 'kambaniru-padua',
    name: 'Kambaniru padua',
    sx: 1,
    sz: -1,
    glossId: 'Sudut sisi laki-laki, tempat tamu diterima.',
    glossEn: 'The corner of the men’s side, where guests are received.',
  },
  {
    key: 'kambaniru-mata',
    name: 'Kambaniru mata',
    sx: 1,
    sz: 1,
    glossId: 'Sudut tempat beras dan benih disimpan.',
    glossEn: 'The corner where rice and seed are kept.',
  },
]

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan lebih dahulu, satu untuk tiap tiang.',
    glossEn: 'The stones go down first, one for each post.',
  },
  {
    stage: 'kambaniru',
    title: 'Kambaniru',
    glossId: 'Keempat tiang bernama didirikan, dan seluruh rumah ditata dari keempatnya. Ini satu-satunya rumah dalam projek ini yang tiangnya perorangan: masing-masing punya nama dan peran, bukan nomor dalam barisan.',
    glossEn: 'The four named posts are raised, and the whole house is set out from them. This is the only house in this project whose posts are individuals: each has a name and a role rather than a number in a rank.',
  },
  {
    stage: 'balok',
    title: 'Balok',
    glossId: 'Balok mengunci kepala keempat tiang. Di atas rangka inilah menara kelak berdiri.',
    glossEn: 'Beams lock the four post heads. It is on this frame that the tower will later stand.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai inti dan bangga di luarnya, yang duduk sedikit lebih rendah.',
    glossEn: 'The core floor, and the bangga outside it, sitting a little lower.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding inti, rendah. Orang duduk di dalam rumah ini, bukan berdiri.',
    glossEn: 'The walls of the core, and they are low. This is a house people sit in rather than stand in.',
  },
  {
    stage: 'uma-deta',
    title: 'Uma deta',
    glossId: 'Lantai loteng dipasang. Inilah alasan menara ada — dan karena itu ia dibangun sebelum menaranya, bukan sesudah.',
    glossEn: 'The loft floor goes in. This is why the tower exists — and so it is built before the tower, not after.',
  },
  {
    stage: 'menara',
    title: 'Menara',
    glossId: 'Rangka menara naik dari bahu atap bawah, mengecil ke puncak yang rata.',
    glossEn: 'The tower frame rises from the shoulder of the lower roof, narrowing to a flat top.',
  },
  {
    stage: 'alang',
    title: 'Alang-alang',
    glossId: 'Alang-alang dipasang dari tepi atap ke atas, melewati bahu, terus sampai puncak menara.',
    glossEn: 'The alang-alang is laid from the eave upward, past the shoulder and on to the top of the tower.',
  },
  {
    stage: 'tanduk',
    title: 'Tanduk',
    glossId: 'Hiasan puncak dipasang terakhir, di ujung bubungan menara.',
    glossEn: 'The finials go on last, at the ends of the tower’s ridge.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { uma: 'mbatangu', menara: 12, bangga: true }

/**
 * The tower multiplier, in tenths.
 *
 * Carried as an integer because the address codec has no fractional field and
 * should not grow one for a single pack — the rule is stored as tenths and
 * divided at the point of use, which is a smaller change than a new field kind
 * and does not make every other tradition pay for this one's arithmetic.
 */
export const MIN_MENARA = 6
export const MAX_MENARA = 20
export const MENARA_SCALE = 10

export function normaliseRules(rules: Rules): Rules {
  return {
    uma: rules.uma,
    menara: Math.min(MAX_MENARA, Math.max(MIN_MENARA, Math.round(rules.menara))),
    bangga: rules.bangga,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
