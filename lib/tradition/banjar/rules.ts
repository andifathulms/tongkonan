/**
 * The rule pack for the Banjar house.
 *
 * The fourteenth pack, and the first whose principal rule selects a *shape*
 * rather than a number, a name or a switch.
 *
 * Everywhere else a rule picks a value that geometry then follows: a rank
 * multiplier, a household count, a body measure, a board count. Here `jenis`
 * picks which roof form stands over the core, and the three options are three
 * different primitives — a tall gable, a hipped roof, a lower gable with a
 * break. The house is *named* for that choice, which is why the rule is the
 * house's identity rather than one of its properties.
 *
 * What that costs the provenance layer is worth stating. The pitch of the tall
 * gable is the single figure this building is recognised by, and it is the
 * author's: the sources are unanimous that a bubungan tinggi is steep and that
 * the steepness is the point, and none gives an angle. The same shape of
 * problem as the Sumbanese tower and the Palembang step, arriving for the third
 * time — which by now looks less like an accident of these three packs and more
 * like a property of what published sources on vernacular building contain.
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
  BanjarKinds,
  Bentuk,
  Dim,
  Jenis,
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
    key: 'seman-2001',
    citation:
      'Seman, S. and Irhamna, Arsitektur Tradisional Banjar Kalimantan Selatan ' +
      '(Ikatan Arsitek Indonesia Daerah Kalimantan Selatan, Banjarmasin, 2001).',
    kind: 'reference',
  },
  {
    key: 'mentayani-2017',
    citation:
      'Mentayani, I., “Identitas dan Eksistensi Permukiman Tepi Sungai di Banjarmasin”, ' +
      'Prosiding Temu Ilmiah IPLBI (2017).',
    kind: 'reference',
  },
  {
    key: 'depdikbud-kalsel',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Kalimantan Selatan ' +
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
  /* the chain */
  bayDepth: dim(2.4, 'm', 'interpolated', 'none', 'Panjang satu ruang inti sepanjang sumbu masuk.', 'Length of one bay of the core along the entry axis.'),
  halfWidth: dim(3.6, 'm', 'interpolated', 'none', 'Setengah lebar rumah. Tetap: yang berubah menurut aturan hanyalah kedalamannya dan bentuk atapnya.', 'Half-width of the house. Fixed: what the rules change is its depth and the form of its roof.'),
  pelatarDepth: dim(2.6, 'm', 'interpolated', 'none', 'Panjang pelataran terbuka di muka, tempat rumah bertemu jalan atau sungai.', 'Length of the open platform at the front, where the house meets the road or the river.'),
  surambiDepth: dim(3.0, 'm', 'interpolated', 'none', 'Panjang surambi, serambi beratap di antara pelataran dan inti.', 'Length of the surambi, the roofed veranda between the platform and the core.'),
  paduDepth: dim(3.2, 'm', 'interpolated', 'none', 'Panjang padu di belakang, tempat dapur dan pekerjaan rumah.', 'Length of the padu at the back, where the kitchen and the household work are.'),

  /* the roofs, and their heights are the subject */
  tinggiRise: dim(4.6, 'm', 'interpolated', 'none', 'Tinggi bubungan inti di atas tepi atapnya, pada rumah bubungan tinggi. Ini angka yang membuat rumah ini dikenali, dan ia ditetapkan penulis: sumber sepakat bubungannya curam dan bahwa kecuramannya adalah pokoknya, tidak satu pun memberi sudutnya. Persoalan yang sama bentuknya dengan menara Sumba dan tanjakan Palembang, muncul untuk ketiga kalinya.', 'Rise of the core ridge above its eave, on a rumah bubungan tinggi. This is the figure the house is recognised by and it is the author’s: the sources agree the ridge is steep and that the steepness is the point, and none gives an angle. The same shape of problem as the Sumbanese tower and the Palembang step, arriving for the third time.'),
  pelanaRise: dim(2.3, 'm', 'interpolated', 'none', 'Tinggi bubungan inti pada gajah baliku: pelana biasa, jauh lebih rendah.', 'Rise of the core ridge on a gajah baliku: an ordinary gable, far lower.'),
  limasanRise: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi bubungan inti pada palimasan: atap limas, dan bubungannya lebih pendek daripada bangunannya.', 'Rise of the core ridge on a palimasan: a hipped roof, its ridge shorter than the building.'),
  shedRise: dim(1.1, 'm', 'interpolated', 'none', 'Tinggi bubungan sengkuap pada ruas depan dan belakang. Rendah, dan harus rendah: yang membuat urutan ini terbaca adalah bahwa yang di tengah menjulang di atas keduanya.', 'Rise of a shed ridge on the front and back segments. Low, and it has to be: what makes the sequence legible is that the middle one rises above both.'),
  eaveY: dim(3.1, 'm', 'interpolated', 'none', 'Tinggi tepi atap inti di atas tanah. Ruas lain menurunkan tepinya bersama lantainya.', 'Height of the core eave above the ground. The other segments drop their eaves with their floors.'),
  eaveOversail: dim(0.9, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),

  /* the frame */
  floorHeight: dim(1.8, 'm', 'interpolated', 'none', 'Tinggi lantai inti di atas tanah. Banjarmasin dibangun di atas rawa dan pasang; rumah panggung di sini bukan pilihan.', 'Height of the core floor above the ground. Banjarmasin is built on swamp and tide; a raised house here is not a preference.'),
  stepDown: dim(0.3, 'm', 'interpolated', 'none', 'Turunnya lantai tiap ruas ke arah muka. Rumah limas Palembang juga bertingkat lantainya, dan bedanya penting: di sana tingkat itu adalah kedudukan, di sini ia akibat dari urutan atapnya dan dari air yang harus mengalir menjauh.', 'How far each segment’s floor drops toward the front. The Palembang rumah limas also steps its floor, and the difference matters: there the steps are the standing, here they follow from the sequence of roofs and from water having to run away.'),
  postSection: dim(0.2, 'm', 'interpolated', 'none', 'Sisi penampang tongkat ulin.', 'Section of an ironwood post.'),
  stoneHeight: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tongkat berdiri.', 'Height of the stone a post foot stands on.'),
  stoneWidth: dim(0.4, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),
  bearerDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar.', 'Depth of a bearer.'),
  bearerWidth: dim(0.14, 'm', 'interpolated', 'none', 'Lebar penampang gelagar.', 'Width of a bearer.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),

  /* the wings */
  anjungReach: dim(2.2, 'm', 'interpolated', 'none', 'Seberapa jauh anjung menjorok ke samping dari badan rumah.', 'How far an anjung projects to the side from the body.'),
  anjungDepth: dim(3.4, 'm', 'interpolated', 'none', 'Panjang anjung sepanjang sumbu masuk.', 'Length of an anjung along the entry axis.'),
  anjungRise: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi bubungan anjung di atas tepi atapnya.', 'Rise of an anjung’s ridge above its eave.'),

  /* the covering */
  shingleCourseDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis sirap.', 'Exposed depth of one course of shingles.'),
  shingleThickness: dim(0.03, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below.'),
  shingleLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  shingleBed: dim(0.03, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  namedForItsRoof: dim(1, 'count', 'canon', 'seman-2001', 'Rumah Banjar adalah keluarga jenis yang dinamai menurut atap intinya: bubungan tinggi untuk pelana curam itu, palimasan untuk atap limas, gajah baliku untuk pelana yang lebih rendah. Selebihnya bangunan yang sama. Ini satu-satunya aturan dalam projek ini yang memilih sebuah primitif geometri, bukan sebuah angka, nama, atau saklar.', 'The Banjar house is a family of types named for the roof over the core: bubungan tinggi for that steep gable, palimasan for a hipped roof, gajah baliku for a lower gable. The rest is the same building. It is the only rule in this project that selects a geometric primitive rather than a number, a name or a switch.'),
  aChainOfRoofs: dim(1, 'count', 'canon', 'depdikbud-kalsel', 'Rumah ini berturut-turut beratap sepanjang satu bubungan: pelataran, surambi di bawah sengkuap, inti di bawah bentuknya sendiri, lalu padu di bawah sengkuap lagi. Tiga belas bangunan lain dalam projek ini punya satu atap, apa pun bentuknya, menutupi seluruh denahnya. Yang ini dibaca dengan menyusuri bubungannya dan menyebut apa yang berganti di atas kepala.', 'This house is roofed in succession along one ridge: the platform, the surambi under a shed, the core under its own form, then the padu under a shed again. The other thirteen buildings in this project have one roof, whatever its shape, over the whole plan. This one is read by walking the ridge and naming what changes overhead.'),
  coreIsTallest: dim(1, 'count', 'canon', 'seman-2001', 'Yang di tengah menjulang di atas keduanya. Kalau tidak, urutannya tidak terbaca dan rumahnya tidak lagi jenis yang disebut namanya — jadi ketinggian itu bukan hiasan melainkan yang membuat nama itu benar.', 'The middle one rises above both. If it did not, the sequence would not read and the house would no longer be the type its name says — so that height is not ornament but what makes the name true.'),
  raisedOnPosts: dim(1, 'count', 'canon', 'mentayani-2017', 'Rumah berdiri di atas tongkat ulin. Banjarmasin dibangun di atas rawa dan pasang, jadi ini bukan pilihan melainkan syarat.', 'The house stands on ironwood posts. Banjarmasin is built on swamp and tide, so this is a requirement rather than a preference.'),
  ironwood: dim(1, 'count', 'canon', 'mentayani-2017', 'Tongkat dan sirapnya dari ulin, kayu besi — bahan yang sama dengan rumah betang, karena hutan yang sama, dan karena air yang sama.', 'The posts and shingles are ulin, ironwood — the same material as the rumah betang, because the same forest and because the same water.'),

  /* The site: the river the pelatar meets. */
  facesTheRiver: dim(1, 'count', 'canon', 'mentayani-2017', 'Rumah menghadap sungai, dan pelataran adalah tempat rumah bertemu air. Di Banjarmasin sungai adalah jalannya, jadi tepi air itulah yang menetapkan ujung mana yang muka — dan karena itu ke arah mana urutan empat atapnya berjalan.', 'The house faces the river, and the pelatar is where the house meets the water. In Banjarmasin the river is the road, so the water’s edge is what fixes which end is the front — and therefore which way the sequence of four roofs runs.'),
  riverSetback: dim(7, 'm', 'interpolated', 'none', 'Jarak dari muka pelataran ke tepi air. Jaraknya penetapan penulis; bahwa air ada di sana bukan.', 'Distance from the front of the pelatar to the water’s edge. The distance is the author’s; that the water is there is not.'),
  titianWidth: dim(1.4, 'm', 'interpolated', 'none', 'Lebar titian dari pelataran ke air.', 'Width of the walkway from the platform to the water.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tongkat: 1.5,
  gelagar: 1.1,
  lantai: 1.1,
  dinding: 1.2,
  anjung: 0.9,
  kuda: 1.7,
  sirap: 2.1,
}

export const PACK: RulePack<BanjarKinds> = {
  key: 'banjar',
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

/* ── The types, which are roofs ───────────────────────────────────────── */

export interface JenisInfo {
  readonly jenis: Jenis
  readonly name: string
  /** the form over the core — and the reason the type has the name it has */
  readonly core: Bentuk
  /**
   * The dimension holding this type's ridge rise — the *key*, not the value.
   *
   * It was the value, and that was a bug with a name: the table is built at
   * import time, so it froze a copy of a number the rest of the project reads
   * live. `withDimValue` swaps the value in the pack, so the sensitivity probe
   * and the counterexample search moved a figure nothing was looking at, and
   * the counterexample could not break its own check at any factor. A table of
   * constants beside a table of dimensions is the provenance layer being
   * escaped quietly.
   */
  readonly riseKey: DimKey
  readonly glossId: string
  readonly glossEn: string
}

export const JENIS: readonly JenisInfo[] = [
  {
    jenis: 'bubungan-tinggi',
    name: 'Bubungan tinggi',
    core: 'tinggi',
    riseKey: 'tinggiRise',
    glossId:
      'Pelana curam yang menjulang jauh di atas ruas di depan dan di belakangnya. Jenis utama, dan namanya adalah atapnya: “bubungan tinggi” berarti bubungan yang tinggi.',
    glossEn:
      'The steep gable that rises far above the segments before and behind it. The principal type, and its name is its roof: “bubungan tinggi” means a high ridge.',
  },
  {
    jenis: 'palimasan',
    name: 'Palimasan',
    core: 'limasan',
    riseKey: 'limasanRise',
    glossId:
      'Atap limas di atas inti: empat bidang, bubungan lebih pendek daripada bangunannya. Rumah yang sama, dengan satu ruas berganti bentuk — dan karena itu berganti nama.',
    glossEn:
      'A hipped roof over the core: four planes, its ridge shorter than the building. The same house with one segment’s form changed — and therefore its name changed.',
  },
  {
    jenis: 'gajah-baliku',
    name: 'Gajah baliku',
    core: 'pelana',
    riseKey: 'pelanaRise',
    glossId:
      'Pelana biasa di atas inti, jauh lebih rendah daripada bubungan tinggi. Yang berubah hanya satu ruas dari empat, dan itu cukup untuk menjadikannya rumah yang lain.',
    glossEn:
      'An ordinary gable over the core, far lower than a bubungan tinggi. One segment of four changes, and that is enough to make it a different house.',
  },
]

/** The rise this type puts over the core, read live from the pack. */
export function jenisRise(jenis: Jenis): number {
  return DIMS[jenisInfo(jenis).riseKey].value
}

export function jenisInfo(jenis: Jenis): JenisInfo {
  const found = JENIS.find((j) => j.jenis === jenis)
  if (!found) throw new Error(`unknown jenis: ${jenis}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tongkat',
    title: 'Tongkat',
    glossId: 'Tongkat ulin didirikan di atas batunya. Banjarmasin berdiri di atas rawa dan pasang, jadi rumah panggung di sini bukan pilihan.',
    glossEn: 'The ironwood posts are stood on their stones. Banjarmasin is built on swamp and tide, so a raised house here is not a preference.',
  },
  {
    stage: 'gelagar',
    title: 'Gelagar',
    glossId: 'Gelagar membentang di antara tongkat, pada ketinggian yang berbeda-beda menurut ruasnya.',
    glossEn: 'Bearers span between the posts, at a different height for each segment.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai tiap ruas dipasang, turun bertingkat ke arah muka — bukan sebagai kedudukan seperti pada rumah limas, melainkan mengikuti urutan atapnya dan air yang harus mengalir menjauh.',
    glossEn: 'Each segment’s floor is laid, stepping down toward the front — not as standing, as on the rumah limas, but following the sequence of roofs and the water that has to run away.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding papan mengelilingi inti dan padu; surambi dan pelataran dibiarkan terbuka.',
    glossEn: 'Board walls go round the core and the padu; the surambi and the platform are left open.',
  },
  {
    stage: 'anjung',
    title: 'Anjung',
    glossId: 'Sayap di kedua sisi inti, masing-masing dengan atapnya sendiri yang lebih rendah.',
    glossEn: 'The wings on either side of the core, each with its own lower roof.',
  },
  {
    stage: 'kuda',
    title: 'Kuda-kuda',
    glossId: 'Rangka atap tiap ruas, satu per satu di sepanjang bubungan. Di sinilah bangunan ini menjadi jenis yang disebut namanya: bentuk di atas inti yang menentukannya.',
    glossEn: 'The roof frame of each segment, one after another along the ridge. This is where the building becomes the type its name says: the form over the core is what decides it.',
  },
  {
    stage: 'sirap',
    title: 'Sirap',
    glossId: 'Sirap ulin dipasang dari tepi ke atas pada tiap ruas.',
    glossEn: 'Ironwood shingles are laid from the eave upward on each segment.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { jenis: 'bubungan-tinggi', ruang: 3, anjung: true }

export const MIN_RUANG = 2
export const MAX_RUANG = 6

export function normaliseRules(rules: Rules): Rules {
  return {
    jenis: rules.jenis,
    ruang: Math.min(MAX_RUANG, Math.max(MIN_RUANG, Math.round(rules.ruang))),
    anjung: rules.anjung,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
