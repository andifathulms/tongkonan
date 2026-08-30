/**
 * The rule pack for the Sama-Bajau lepa.
 *
 * The twenty-first pack, and the first that declares *no* orientation rule.
 *
 * Every other pack in this collection has one, and the variety of them has
 * been one of the project's better findings: a compass bearing, a granary
 * across a yard, a river, a road, a stone, the root of a tree, the fall of a
 * hillside, the direction of prayer. This pack has none, and the absence is
 * canon rather than an omission: a boat's bow is not a direction, and where a
 * lepa is tonight is not a property of the lepa.
 *
 * What replaces it is balance. `staysUpright` is the only canon rule in this
 * project about a building's *equilibrium* rather than its shape, and the
 * check that carries it is the first here to compute a centroid. The limit it
 * tests against is declared and is a proxy: there are no material properties
 * in this project and there will not be, so nothing can say whether a boat is
 * stable. What can be said is that the weight is kept low and on the
 * centreline, which is what the sources describe.
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
  BajauKinds,
  Dim,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  Ukuran,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'sather-1997',
    citation:
      'Sather, C., The Bajau Laut: Adaptation, History, and Fate in a Maritime ' +
      'Fishing Society of South-eastern Sabah (Oxford University Press, Kuala Lumpur, 1997).',
    kind: 'ethnography',
  },
  {
    key: 'nimmo-1972',
    citation:
      'Nimmo, H. A., The Sea People of Sulu: A Study of Social Change in the Philippines ' +
      '(Chandler, San Francisco, 1972).',
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
  /* three boats, and a boat is built to a size rather than scaled to a number */
  lengthSmall: dim(7.5, 'm', 'interpolated', 'none', 'Panjang lepa kecil: satu pasangan dan anak-anak yang masih kecil.', 'Length of a small lepa: one couple and young children.'),
  lengthMedium: dim(9.5, 'm', 'interpolated', 'none', 'Panjang lepa sedang, ukuran yang paling sering disebut sumber.', 'Length of a medium lepa, the size the sources describe most often.'),
  lengthLarge: dim(11.5, 'm', 'interpolated', 'none', 'Panjang lepa besar: satu rumah tangga penuh dengan orang tua di dalamnya.', 'Length of a large lepa: a full household with its elders aboard.'),
  beamRatio: dim(0.22, 'ratio', 'interpolated', 'none', 'Lebar terhadap panjang. Sempit, seperti perahu pada umumnya — dan kesempitan itulah yang membuat keseimbangan menjadi aturan dan bukan kemudahan.', 'Beam against length. Narrow, as a boat is — and that narrowness is what makes balance a rule rather than a convenience.'),
  depth: dim(0.78, 'm', 'interpolated', 'none', 'Tinggi lambung dari lunas ke tepi geladak.', 'Depth of the hull from the keel to the sheer.'),
  draught: dim(0.34, 'm', 'interpolated', 'none', 'Dalamnya lambung terbenam. Ini garis air, dan dalam pak ini y = 0 adalah dasar lunas — bukan tanah, karena tidak ada tanah.', 'How deep the hull sits. This is the waterline, and in this pack y = 0 is the bottom of the keel — not the ground, because there is no ground.'),
  sheerRise: dim(0.42, 'm', 'interpolated', 'none', 'Naiknya tepi geladak ke arah haluan dan buritan. Perahu ini melengkung ke atas di kedua ujungnya, dan lengkung itulah yang dibuat oleh sapuan penampang yang sama dengan atap tongkonan.', 'Rise of the sheer toward bow and stern. The boat curves up at both ends, and that curve is made by the same swept section as a tongkonan roof.'),
  keelRocker: dim(0.16, 'm', 'interpolated', 'none', 'Naiknya lunas ke arah kedua ujung.', 'Rise of the keel toward each end.'),
  bilgeAt: dim(0.55, 'ratio', 'interpolated', 'none', 'Di mana lambungnya membelok, diukur dari lunas ke tepi geladak. Ini “lutut” pada primitif sapuan yang sama — ditulis untuk membuat tepi atap menggantung di bawah balok dinding, dan di sini ia lengkung bilga.', 'Where the hull turns, measured from the keel to the sheer. It is the “knee” of the same swept primitive — written to let a roof edge hang below a wall plate, and here it is the turn of the bilge.'),
  bilgeDrop: dim(0.62, 'ratio', 'interpolated', 'none', 'Bagian dari lebar yang sudah tercapai di lengkung bilga.', 'The share of the beam already reached at the turn of the bilge.'),
  strakes: dim(6, 'count', 'interpolated', 'none', 'Jumlah papan pada tiap sisi lambung. Kehalusan gambar sekaligus jumlah papan yang nyata, seperti jumlah tiang dinding pada honai.', 'Number of strakes on each side. Drawing resolution and a real plank count at once, like the wall posts of a honai.'),
  frames: dim(7, 'count', 'interpolated', 'none', 'Jumlah gading di dalam lambung.', 'Number of frames inside the hull.'),
  frameSection: dim(0.07, 'm', 'interpolated', 'none', 'Sisi penampang gading.', 'Section of a frame.'),
  plankThickness: dim(0.035, 'm', 'interpolated', 'none', 'Tebal papan lambung.', 'Thickness of a hull plank.'),
  keelSection: dim(0.12, 'm', 'interpolated', 'none', 'Sisi penampang lunas.', 'Section of the keel.'),
  deckThickness: dim(0.04, 'm', 'interpolated', 'none', 'Tebal papan geladak.', 'Thickness of a deck plank.'),

  /* the awning that makes it a house */
  kajangFrom: dim(0.28, 'ratio', 'interpolated', 'none', 'Di mana kajang mulai, sebagai bagian dari panjang perahu diukur dari haluan.', 'Where the kajang begins, as a share of the length measured from the bow.'),
  kajangTo: dim(0.78, 'ratio', 'interpolated', 'none', 'Di mana kajang berakhir.', 'Where the kajang ends.'),
  kajangRise: dim(0.95, 'm', 'interpolated', 'none', 'Tinggi kajang di atas geladak. Rendah, dan harus rendah: berat yang tinggi pada perahu sempit adalah perahu yang berguling. Orang duduk dan berbaring di bawahnya, tidak berdiri.', 'Height of the kajang above the deck. Low, and it has to be: weight high in a narrow boat is a boat that rolls. People sit and lie under it; they do not stand.'),
  kajangCourses: dim(5, 'count', 'interpolated', 'none', 'Jumlah lapis daun nipah pada kajang.', 'Number of courses of nipa leaf on the kajang.'),

  /* the hearth, which is a fire in a wooden boat */
  hearthRadius: dim(0.3, 'm', 'interpolated', 'none', 'Jari-jari kotak tungku. Rumah tangga ini memasak di atas kayu yang mengapung, jadi apinya berdiri di dalam kotak berisi pasir.', 'Radius of the hearth box. This household cooks on floating timber, so its fire stands in a box of sand.'),
  hearthSand: dim(0.09, 'm', 'interpolated', 'none', 'Tebal lapisan pasir di dalam kotak itu. Ini satu-satunya alas api dalam projek ini yang harus dibawa serta.', 'Depth of the sand in that box. It is the only hearth bed in this project that has to be carried along.'),
  hearthAt: dim(0.86, 'ratio', 'interpolated', 'none', 'Letak tungku sepanjang perahu, dari haluan. Di belakang kajang, dekat buritan, di ruang terbuka.', 'Where the hearth sits along the boat, from the bow. Behind the kajang, near the stern, in the open.'),

  /* the outriggers */
  cadikReach: dim(1.5, 'm', 'interpolated', 'none', 'Jarak cadik dari sisi lambung.', 'How far an outrigger floats from the side of the hull.'),
  cadikSection: dim(0.14, 'm', 'interpolated', 'none', 'Sisi penampang cadik dan galangnya.', 'Section of an outrigger and its booms.'),

  /* the limit balance is tested against */
  centreLimit: dim(0.55, 'm', 'interpolated', 'none', 'Setinggi apa titik tengah seluruh bagian boleh berada di atas garis air. Ini batas, bukan hitungan: projek ini tidak punya sifat bahan dan tidak akan punya, jadi tidak ada yang dapat mengatakan sebuah perahu stabil. Yang dapat dikatakan adalah bahwa bebannya dijaga rendah, dan itulah yang diperiksa — dua angka yang berdiri sendiri, dibandingkan.', 'How high the centre of all the parts may sit above the waterline. A limit rather than a calculation: this project has no material properties and will not acquire any, so nothing here can say a boat is stable. What can be said is that the weight is kept low, and that is what is checked — two independent numbers, compared.'),
  listLimit: dim(0.05, 'm', 'interpolated', 'none', 'Sejauh apa titik tengah boleh menyimpang dari bidang lunas. Perahu yang miring adalah perahu yang kemasukan air, dan pada rumah yang mengapung kemiringan adalah kegagalan bangunan.', 'How far the centre may sit off the keel plane. A boat that lists is a boat taking water, and on a floating house a list is a building failure.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  noGround: dim(0, 'count', 'canon', 'sather-1997', 'Nol titik sentuh dengan tanah. Rumah ini mengapung: tidak ada tapak, tidak ada denah di atas tanah, tidak ada jarak ke tetangga, dan tempatnya malam ini bukan sifat bangunannya. Dua puluh bangunan lain dalam projek ini berdiri di atas sesuatu; yang ini tidak berdiri sama sekali.', 'Zero points of contact with the ground. This house floats: no site, no plan on any land, no distance to a neighbour, and where it is tonight is not a property of the building. The other twenty buildings in this project stand on something; this one does not stand at all.'),
  noOrientation: dim(0, 'count', 'canon', 'nimmo-1972', 'Nol aturan arah. Setiap pak lain dalam kumpulan ini punya satu — mata angin, lumbung di seberang halaman, sungai, jalan, batu, pangkal pohon, arah turun lereng, arah salat. Perahu ini tidak punya: haluan bukan sebuah arah, dan tidak ada apa pun yang tetap untuk dihadapi. Ketiadaan itu kanon, bukan kelalaian.', 'Zero orientation rules. Every other pack in this collection has one — a compass bearing, a granary across a yard, a river, a road, a stone, the root of a tree, the fall of a hillside, the direction of prayer. This boat has none: a bow is not a direction, and there is nothing fixed to face. The absence is canon rather than an oversight.'),
  staysUpright: dim(1, 'count', 'canon', 'sather-1997', 'Berat dijaga rendah dan di tengah. Rumah yang miring adalah rumah yang kemasukan air, jadi keseimbangan di sini adalah syarat bangunan dan bukan urusan pelayaran — satu-satunya aturan kanon dalam projek ini tentang kesetimbangan sebuah bangunan, bukan bentuknya.', 'The weight is kept low and on the centreline. A house that lists is a house taking water, so balance here is a building requirement rather than a sailing one — the only canon rule in this project about a building’s equilibrium rather than its shape.'),
  awningMakesItAHouse: dim(1, 'count', 'canon', 'nimmo-1972', 'Kajang itulah yang membuat lepa menjadi rumah dan bukan sekadar lambung. Di bawahnya orang tidur, makan, dan menyimpan miliknya. Menurunkannya tidak mengubah satu papan pun pada perahunya, dan bendanya berhenti menjadi tempat tinggal — pernyataan paling terang dalam kumpulan ini tentang apa bedanya.', 'The kajang is what makes a lepa a house rather than a hull. Under it people sleep, eat and keep what they own. Taking it down changes not one plank of the boat, and the thing stops being a dwelling — the clearest statement in this collection about what the difference is.'),
  hearthAboard: dim(1, 'count', 'canon', 'sather-1997', 'Rumah tangga ini memasak di atas kayu yang mengapung, dan apinya berdiri di dalam kotak berisi pasir. Ini satu-satunya perapian dalam projek ini yang alasnya harus dibawa serta.', 'This household cooks on floating timber, and its fire stands in a box of sand. It is the only hearth in the project whose bed has to be carried along.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  lunas: 0.8,
  papan: 2,
  gading: 1.2,
  geladak: 1,
  kajang: 1.1,
  dapur: 0.5,
  cadik: 0.7,
}

export const PACK: RulePack<BajauKinds> = {
  key: 'bajau',
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

/* ── The three boats ──────────────────────────────────────────────────── */

export interface UkuranInfo {
  readonly ukuran: Ukuran
  readonly key: DimKey
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const UKURAN: readonly UkuranInfo[] = [
  {
    ukuran: 'kecil',
    key: 'lengthSmall',
    name: 'Kecil',
    glossId: 'Satu pasangan dan anak-anak yang masih kecil.',
    glossEn: 'One couple and young children.',
  },
  {
    ukuran: 'sedang',
    key: 'lengthMedium',
    name: 'Sedang',
    glossId: 'Ukuran yang paling sering disebut sumber: satu rumah tangga dengan anak-anak yang sudah besar.',
    glossEn: 'The size the sources describe most often: a household with older children.',
  },
  {
    ukuran: 'besar',
    key: 'lengthLarge',
    name: 'Besar',
    glossId: 'Rumah tangga penuh, dengan orang tua ikut di dalamnya.',
    glossEn: 'A full household, with its elders aboard.',
  },
]

export function ukuranInfo(ukuran: Ukuran): UkuranInfo {
  const found = UKURAN.find((u) => u.ukuran === ukuran)
  if (!found) throw new Error(`unknown ukuran: ${ukuran}`)
  return found
}

/** The length this rule selects, read live from the pack. */
export function lengthOf(ukuran: Ukuran): number {
  return DIMS[ukuranInfo(ukuran).key].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'lunas',
    title: 'Lunas',
    glossId: 'Lunas diletakkan lebih dulu, seperti pada setiap perahu yang pernah dibuat. Di sinilah dasar bangunan ini: bukan batu, bukan tiang pancang, melainkan sebatang kayu yang akan mengapung.',
    glossEn: 'The keel is laid first, as in every boat ever built. This is this building’s foundation: not a stone and not a driven pile, but one piece of timber that will float.',
  },
  {
    stage: 'papan',
    title: 'Papan',
    glossId: 'Papan lambung dipasang dari lunas ke atas, dipasak tepi ke tepi. Bentuknya adalah penampang yang disapu sepanjang lunas — operasi yang sama dengan atap tongkonan, dibalik.',
    glossEn: 'The strakes go on from the keel upward, dowelled edge to edge. The shape is a section swept along the keel — the same operation as a tongkonan roof, turned over.',
  },
  {
    stage: 'gading',
    title: 'Gading',
    glossId: 'Gading dipasang di dalam lambung yang sudah berbentuk: pada perahu, kulitnya lebih dulu dan rangkanya kemudian.',
    glossEn: 'The frames go in after the shell has its shape: in a boat the skin comes first and the frame second.',
  },
  {
    stage: 'geladak',
    title: 'Geladak',
    glossId: 'Papan geladak dan bangku dipasang. Ini lantai rumah ini, dan ia tidak pernah rata terhadap apa pun kecuali air.',
    glossEn: 'The deck and the thwarts go down. This is the floor of the house, and it is never level with anything but the water.',
  },
  {
    stage: 'kajang',
    title: 'Kajang',
    glossId: 'Kajang daun nipah dipasang di atas bagian tengah. Sejak saat ini bendanya adalah sebuah rumah.',
    glossEn: 'The nipa awning goes up over the middle. From this moment the thing is a house.',
  },
  {
    stage: 'dapur',
    title: 'Dapur',
    glossId: 'Kotak tungku berisi pasir diletakkan di belakang kajang. Api di atas kayu yang mengapung, dan alasnya dibawa serta.',
    glossEn: 'The sand-filled hearth box goes in behind the awning. A fire on floating timber, with its bed carried along.',
  },
  {
    stage: 'cadik',
    title: 'Cadik',
    glossId: 'Cadik dipasang terakhir, bila dipakai. Ia menambah lebar tanpa menambah berat di tempat yang tinggi.',
    glossEn: 'The outriggers are shipped last, where they are used. They add width without adding weight up high.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { ukuran: 'sedang', kajang: true, cadik: true }

export function normaliseRules(rules: Rules): Rules {
  return { ukuran: rules.ukuran, kajang: rules.kajang, cadik: rules.cadik }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
