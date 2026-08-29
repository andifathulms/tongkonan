/**
 * The rule pack for the Maluku baileo.
 *
 * The fifteenth pack, and the first whose social rule counts a community.
 *
 * A rank multiplies, a laras switches a floor, a household tally lengthens a
 * house, a body measures a pavilion. Here the number is how many clans make up
 * the village, and it is not a property of anyone who will use the building —
 * a soa does not live in the baileo, it *sits* in it. So the count produces
 * bays, posts and seats, and produces them equal, because the claim the
 * building makes is that the clans are peers.
 *
 * Three canon rules and none of them is a length: the building is open on
 * every side, it has one floor and no storey, and it stands with the batu
 * pamali. Every metre here is the author's, as everywhere else in this
 * project.
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
  MalukuKinds,
  Pamali,
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
    key: 'cooley-1962',
    citation:
      'Cooley, F. L., Ambonese Adat: A General Description ' +
      '(Yale University Southeast Asia Studies, New Haven, 1962).',
    kind: 'ethnography',
  },
  {
    key: 'lokollo-1997',
    citation:
      'Lokollo, J. E., dkk., Seri Budaya Hukum Adat: Sasi dan Baileo di Maluku Tengah ' +
      '(Universitas Pattimura, Ambon, 1997).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-maluku',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Maluku ' +
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
  /* the plan, which is a count of clans made into bays */
  soaBay: dim(2.6, 'm', 'interpolated', 'none', 'Panjang satu petak lantai untuk satu soa. Panjang bangunan adalah angka ini dikali jumlah soa: denahnya sebuah sensus, seperti rumah betang — hanya saja yang dihitung bukan keluarga yang tinggal di dalamnya melainkan klan yang berhak duduk di dalamnya.', 'Length of one bay of floor for one soa. The building’s length is this figure times the number of clans: the plan is a census like the rumah betang’s — except that what is counted is not the families living inside but the clans entitled to sit inside.'),
  halfWidth: dim(4.2, 'm', 'interpolated', 'none', 'Setengah lebar lantai. Tetap: yang bertambah menurut jumlah soa hanyalah panjangnya.', 'Half-width of the floor. Fixed: what grows with the number of soa is the length alone.'),
  floorHeight: dim(1.55, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah. Cukup tinggi untuk terlihat dari luar dan cukup rendah untuk terdengar dari luar — dua syarat yang saling menarik ke arah berlawanan, dan angkanya penetapan penulis.', 'Height of the floor above the ground. High enough to be seen into from outside and low enough to be heard from outside — two requirements pulling opposite ways, and the figure is the author’s.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of the board floor.'),
  postSection: dim(0.24, 'm', 'interpolated', 'none', 'Sisi penampang tiang utama. Tiap soa punya sepasang, dan tak satu pun lebih besar daripada yang lain.', 'Section of a principal post. Each soa has a pair, and none is larger than another.'),
  stoneHeight: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi batu alas tempat kaki tiang berdiri.', 'Height of the pad stone a post foot stands on.'),
  stoneWidth: dim(0.45, 'm', 'interpolated', 'none', 'Lebar batu alas itu.', 'Width of that pad stone.'),
  bearerDepth: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar.', 'Depth of a floor bearer.'),
  bearerWidth: dim(0.15, 'm', 'interpolated', 'none', 'Lebar penampang gelagar.', 'Width of a floor bearer.'),

  /* the sight band: the rule about seeing, as metres */
  postHeight: dim(2.4, 'm', 'interpolated', 'none', 'Tinggi tiang di atas lantai, sampai kepala tiang. Seluruh jarak ini terbuka pada keempat sisinya, dan itulah bangunannya: apa yang diputuskan di dalam terlihat dan terdengar dari luar.', 'Height of a post above the floor, to its head. This whole distance is open on all four sides, and that is the building: what is decided inside is visible and audible from outside.'),
  screenHeight: dim(0.55, 'm', 'interpolated', 'none', 'Tinggi sekat rendah di antara tiang, bila ada. Setinggi lutut: ia menahan orang jatuh dan tidak menahan satu pun pandangan. Bila angka ini naik melewati mata orang yang berdiri di luar, bangunan ini berhenti menjadi bangunan yang terbuka — dan itulah tandingannya.', 'Height of the low screen between the posts, where there is one. Knee height: it stops a person falling and stops no sight line at all. Raise this figure past the eye of a person standing outside and the building stops being an open one — which is its counterexample.'),
  screenThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan sekat itu.', 'Thickness of that screen board.'),
  seatedEye: dim(1.2, 'm', 'interpolated', 'none', 'Tinggi mata orang yang duduk di tempatnya, diukur dari lantai. Bukan ukuran bangunan melainkan ukuran orang yang harus dapat dilihat dari luar — dan justru karena itu ia sebuah dimensi: angka inilah yang menetapkan apa yang boleh berdiri di antara tiang. Kalau sekat naik melewatinya, saniri yang sedang duduk tidak lagi terlihat, dan bangunan ini berhenti mengerjakan satu-satunya hal yang membuatnya begini.', 'Eye height of a person seated in their place, measured from the floor. Not a dimension of the building but of the person who has to be visible from outside — and a dimension for exactly that reason: this figure is what decides what may stand between the posts. Let the screen rise past it and a seated saniri is no longer in view, and the building stops doing the one thing that made it this shape.'),

  /* the seats, and their equality */
  seatWidth: dim(1.6, 'm', 'interpolated', 'none', 'Lebar satu tempat duduk soa. Sama untuk semuanya, dan kesamaan itu bukan kemudahan menggambar: rumah limas Palembang menyatakan kedudukan dengan menaikkan lantainya, dan bangunan ini menyatakan kesetaraan dengan menolak melakukannya.', 'Width of one soa’s seat. The same for every one, and that sameness is not a drawing convenience: the Palembang rumah limas states standing by raising its floor, and this building states equality by refusing to.'),
  seatDepth: dim(0.55, 'm', 'interpolated', 'none', 'Dalamnya tempat duduk itu.', 'Depth of that seat.'),
  seatHeight: dim(0.42, 'm', 'interpolated', 'none', 'Tinggi tempat duduk di atas lantai. Satu angka untuk semua soa: tidak ada yang duduk lebih tinggi.', 'Height of a seat above the floor. One figure for every soa: nobody sits higher.'),

  /* the roof */
  ridgeRise: dim(3.4, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas kepala tiang. Atap baileo besar dan berat di atas bangunan yang tidak berdinding, dan perbandingan itulah yang membuatnya terbaca sebagai bangunan umum dan bukan sebagai pendopo.', 'Rise of the ridge above the post heads. A baileo’s roof is large and heavy over a building with no walls, and that proportion is what makes it read as a public building rather than as a shelter.'),
  eaveOversail: dim(1.4, 'm', 'interpolated', 'none', 'Panjang tritisan. Panjang, karena tidak ada dinding yang menahan hujan: yang menjaga lantai tetap kering hanyalah atap yang menjorok jauh.', 'Depth of the overhang. Long, because there is no wall to keep the rain out: what keeps the floor dry is a roof reaching well past it.'),
  rafterSection: dim(0.1, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  plateSection: dim(0.16, 'm', 'interpolated', 'none', 'Sisi penampang balok kepala tiang.', 'Section of the plate on the post heads.'),
  thatchCourseDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis daun rumbia.', 'Exposed depth of one course of sago thatch.'),
  thatchThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  thatchLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* the stone, and the way in */
  pamaliRadius: dim(0.62, 'm', 'interpolated', 'none', 'Jari-jari batu pamali. Bahwa ia ada dan bahwa bangunan ini berdiri terhadapnya adalah kanon; besarnya penetapan penulis, dan batu sungguhan tidak bundar.', 'Radius of the batu pamali. That it exists and that this building stands in relation to it is canon; its size is the author’s, and a real stone is not round.'),
  pamaliHeight: dim(0.5, 'm', 'interpolated', 'none', 'Tinggi batu itu di atas tanah.', 'Height of that stone above the ground.'),
  pamaliOffset: dim(3.6, 'm', 'interpolated', 'none', 'Jarak batu di muka bangunan, bila ia berdiri di luar.', 'How far in front of the building the stone stands, when it stands outside.'),
  stairWidth: dim(1.5, 'm', 'interpolated', 'none', 'Lebar tangga masuk.', 'Width of the entry stair.'),
  treadDepth: dim(0.29, 'm', 'interpolated', 'none', 'Lebar injakan anak tangga.', 'Depth of one tread.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  belongsToNobody: dim(1, 'count', 'canon', 'cooley-1962', 'Baileo adalah rumah negeri, bukan rumah siapa pun. Tidak ada yang tidur di dalamnya dan tidak ada rumah tangga yang memilikinya: ia tempat saniri bersidang dan tempat leluhur disapa. Empat belas bangunan lain dalam projek ini adalah milik sebuah rumah tangga; yang ini satu-satunya yang bukan milik siapa-siapa.', 'A baileo is the negeri’s house and nobody’s. No one sleeps in it and no household owns it: it is where the saniri sits and where the ancestors are addressed. The other fourteen buildings in this project belong to a household; this is the only one that belongs to no one.'),
  onePlaceEachSoa: dim(1, 'count', 'canon', 'lokollo-1997', 'Tiap soa punya satu tempat, dan semua tempat itu sama. Jumlah soa menetapkan jumlah petak lantai, pasang tiang, dan tempat duduk — sebuah cacah, seperti tanduk pada tongkonan dan bilik pada rumah betang, tetapi cacah atas sebuah masyarakat dan bukan atas sebuah rumah tangga.', 'Every soa has one place, and all the places are the same. The number of soa sets the number of floor bays, pairs of posts and seats — a tally, like the tongkonan’s horns and the betang’s bilik, but a tally of a community rather than of a household.'),
  openOnAllSides: dim(1, 'count', 'canon', 'lokollo-1997', 'Baileo tidak berdinding. Yang diputuskan di dalam harus terlihat dan terdengar dari luar, jadi keterbukaan itu aturan politik dan bukan aturan iklim — dan aturan itu diukur terhadap tinggi mata orang yang berdiri di tanah, bukan terhadap ada atau tidaknya papan.', 'A baileo has no walls. What is decided inside must be visible and audible from outside, so the openness is a political rule rather than a climatic one — and it is measured against the eye height of a person standing on the ground rather than against the presence or absence of boards.'),
  oneFloorNoStorey: dim(1, 'count', 'canon', 'depdikbud-maluku', 'Satu lantai, satu bidang, tanpa loteng dan tanpa tingkat. Soa duduk sebagai sesama, jadi tidak ada seorang pun yang berada di atas orang lain. Bandingkan rumah limas, yang menyatakan kedudukan justru dengan menaikkan lantainya.', 'One floor, one plane, no loft and no step. The soa sit as peers, so nobody is above anybody. Set it against the rumah limas, which states standing by raising its floor.'),
  standsWithTheStone: dim(1, 'count', 'canon', 'cooley-1962', 'Batu pamali berdiri di muka baileo — atau di dalamnya, dengan lantai dibuka mengelilinginya sehingga batu itu tetap menyentuh tanah. Bangunan ini berdiri terhadap batu itu, dan tidak pernah di atasnya.', 'The batu pamali stands in front of the baileo — or inside it, with the floor left open around it so the stone still touches the earth. The building stands in relation to that stone, and never over it.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  tiang: 1.4,
  gelagar: 1.1,
  lantai: 1,
  tempat: 0.7,
  sekat: 0.5,
  kuda: 1.6,
  atap: 2.2,
  tangga: 0.5,
}

export const PACK: RulePack<MalukuKinds> = {
  key: 'maluku',
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

/* ── Where the stone stands ───────────────────────────────────────────── */

export interface PamaliInfo {
  readonly pamali: Pamali
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const PAMALI: readonly PamaliInfo[] = [
  {
    pamali: 'depan',
    name: 'Di muka',
    glossId:
      'Batu berdiri di tanah di muka bangunan. Sesajen diletakkan di sana sebelum siapa pun menaiki tangga, jadi urutan sebuah pertemuan dimulai di luar bangunannya.',
    glossEn:
      'The stone stands on the ground in front of the building. Offerings are laid there before anyone climbs the stair, so the sequence of a meeting begins outside the building.',
  },
  {
    pamali: 'dalam',
    name: 'Di dalam',
    glossId:
      'Batu berdiri di dalam, dan lantai dibuka mengelilinginya. Bukan hiasan yang dipindahkan ke dalam: sebuah lubang pada lantai yang selebihnya satu bidang utuh, supaya batu itu tetap berdiri di tanah.',
    glossEn:
      'The stone stands inside, and the floor is opened around it. Not an ornament moved indoors: a hole in a floor that is otherwise one unbroken plane, so that the stone still stands on the earth.',
  },
]

export function pamaliInfo(pamali: Pamali): PamaliInfo {
  const found = PAMALI.find((p) => p.pamali === pamali)
  if (!found) throw new Error(`unknown pamali: ${pamali}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu pamali diletakkan lebih dulu, lalu batu-batu alas tiang. Bangunan ini didirikan terhadap batu itu, jadi batu itu ada sebelum tiang pertama.',
    glossEn: 'The pamali stone is set first, then the pad stones. The building is raised in relation to that stone, so the stone is there before the first post.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Sepasang tiang untuk tiap soa, semuanya sama besar. Jumlah tiang adalah jumlah klan, dan tidak ada tiang yang lebih besar daripada yang lain.',
    glossEn: 'A pair of posts for each soa, all of one size. The number of posts is the number of clans, and no post is larger than another.',
  },
  {
    stage: 'gelagar',
    title: 'Gelagar',
    glossId: 'Gelagar melintang di kepala bawah tiang, membentuk satu bidang lantai untuk seluruh panjangnya.',
    glossEn: 'Bearers cross the posts and set out one floor plane for the whole length.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Papan lantai dipasang. Satu bidang, tanpa tingkat: soa duduk sebagai sesama, dan sebuah tanjakan akan menempatkan seseorang di atas orang lain.',
    glossEn: 'The boards go down. One plane, with no step: the soa sit as peers, and a rise would put somebody above somebody.',
  },
  {
    stage: 'tempat',
    title: 'Tempat',
    glossId: 'Tempat duduk dipasang, satu untuk tiap soa dan semuanya sama ukuran dan sama tinggi.',
    glossEn: 'The seats go in, one for each soa and every one the same size and the same height.',
  },
  {
    stage: 'sekat',
    title: 'Sekat',
    glossId: 'Sekat setinggi lutut dipasang di antara tiang, bila negeri memakainya. Ia menahan orang jatuh dan tidak menahan pandangan.',
    glossEn: 'A knee-high screen goes between the posts, where the negeri uses one. It stops a person falling and stops no sight line.',
  },
  {
    stage: 'kuda',
    title: 'Kuda-kuda',
    glossId: 'Rangka atap disusun di atas kepala tiang. Atapnya besar karena tidak ada dinding: yang menahan hujan hanyalah tritisan yang panjang.',
    glossEn: 'The roof frame goes up on the post heads. The roof is large because there are no walls: what keeps the rain out is a long overhang and nothing else.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Daun rumbia dipasang berlapis dari tepi ke bubungan.',
    glossEn: 'Sago leaf goes on in courses from the eave to the ridge.',
  },
  {
    stage: 'tangga',
    title: 'Tangga',
    glossId: 'Tangga dipasang terakhir, di muka, menghadap batu. Di sanalah sebuah pertemuan bermula.',
    glossEn: 'The stair goes on last, at the front, facing the stone. That is where a meeting begins.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { soa: 5, pamali: 'depan', sekat: true }

export const MIN_SOA = 3
export const MAX_SOA = 9

export function normaliseRules(rules: Rules): Rules {
  return {
    soa: Math.min(MAX_SOA, Math.max(MIN_SOA, Math.round(rules.soa))),
    pamali: rules.pamali,
    sekat: rules.sekat,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
