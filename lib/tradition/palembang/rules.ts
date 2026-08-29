/**
 * The rule pack for the rumah limas.
 *
 * The ninth pack, and the first whose principal rule produces a dimension
 * *directly* rather than through anything. A rank scales a tongkonan, a laras
 * steps a floor, a census lengthens a betang — in each of those the social
 * fact selects a value and the value becomes geometry. Here the social fact
 * *is* a height: where a guest sits on the kekijing is their standing, and
 * that place is a number of metres above the floor of the room they walked
 * into. Nothing is translated.
 *
 * Which puts an unusually sharp point on the provenance question. `stepRise`
 * — how far each level stands above the last — is `interpolated`, and it is
 * the single number that says how strongly this household distinguishes
 * between its guests. The sources describe the sequence, name the levels and
 * say what each is for; none gives a rise. So the most socially loaded figure
 * in the pack is one the author invented, and that is stated on the dimension
 * rather than left for a reader to discover.
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
  Kekijing,
  Layout,
  PalembangKinds,
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
    key: 'depdikbud-sumsel',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sumatera Selatan ' +
      '(Proyek Inventarisasi dan Dokumentasi Kebudayaan Daerah, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'siswanto-2009',
    citation:
      'Siswanto, A., “Kearifan Lokal Arsitektur Tradisional Sumatera Selatan”, ' +
      'Jurnal Rekayasa Sriwijaya (2009).',
    kind: 'reference',
  },
  {
    key: 'ju-saito-2012',
    citation:
      'Ju, S.-R. and Saito, Y., “Traditional Houses of Southeast Asia”, ' +
      'Journal of Asian Architecture and Building Engineering 11(1) (2012).',
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
  /* the sequence, which is the building's argument */
  stepRise: dim(0.32, 'm', 'interpolated', 'none', 'Tinggi tiap kekijing di atas yang sebelumnya. Inilah satu-satunya angka dalam pak ini yang menyatakan seberapa tegas rumah tangga ini membedakan tamunya — dan ia ditetapkan penulis. Sumber memerikan urutannya, menamai tingkatnya, dan menjelaskan gunanya; tak satu pun memberi tingginya. Angka paling bermuatan sosial di sini adalah angka karangan, dan hal itu dinyatakan di sini, bukan dibiarkan ditemukan sendiri.', 'Rise of each kekijing above the one before it. This is the only figure in the pack that states how sharply this household distinguishes between its guests — and it is the author’s. The sources describe the sequence, name the levels and say what each is for; none gives a rise. The most socially loaded number here is an invented one, and that is said here rather than left to be discovered.'),
  stepDepth: dim(2.3, 'm', 'interpolated', 'none', 'Dalamnya satu kekijing, diukur dari muka ke belakang. Tiap tingkat cukup dalam untuk duduk bersila berhadapan, karena itulah gunanya.', 'Depth of one kekijing, front to back. Each level is deep enough to sit cross-legged facing another, which is what it is for.'),
  bayWidth: dim(2.6, 'm', 'interpolated', 'none', 'Lebar satu ruang. Sumbu inilah yang tidak membawa apa-apa: rumah yang lebih lebar hanyalah rumah yang lebih besar.', 'Width of one bay. This is the axis that carries nothing: a wider house is only a larger house.'),

  /* the substructure */
  floorHeight: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi lantai terdepan di atas tanah. Tingkat berikutnya naik dari sini, jadi angka ini alas seluruh urutannya.', 'Height of the frontmost floor above the ground. The levels rise from here, so this figure is the base of the whole sequence.'),
  postSection: dim(0.24, 'm', 'interpolated', 'none', 'Sisi penampang tiang unglen. Tiang di rumah ini tidak sama panjang — tiap tingkat menuntut tingginya sendiri, dan itu terlihat dari kolongnya.', 'Section of an unglen post. The posts in this house are not all the same length — each level calls for its own height, and that shows from beneath.'),
  stoneHeight: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi batu tempat kaki tiang berdiri.', 'Height of the stone a post foot stands on.'),
  stoneWidth: dim(0.42, 'm', 'interpolated', 'none', 'Lebar batu itu.', 'Width of that stone.'),
  bearerDepth: dim(0.2, 'm', 'interpolated', 'none', 'Tinggi penampang kijing, balok yang menetapkan tiap tingkat.', 'Depth of a kijing, the bearer that sets each level.'),
  bearerWidth: dim(0.14, 'm', 'interpolated', 'none', 'Lebar penampang kijing.', 'Width of a kijing.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),

  /* the body */
  wallHeight: dim(3.4, 'm', 'interpolated', 'none', 'Tinggi dinding di atas lantai terdepan — yang terendah. Diukur dari sana karena begitulah dinding dibuat: satu papan dari lantai paling bawah sampai balok atas, bukan satu papan per tingkat. Akibatnya kepala di tingkat teratas adalah angka ini dikurangi seluruh naiknya urutan, dan itu perbandingan dua angka yang berdiri sendiri. Mula-mula ditulis diukur dari tingkat teratas, yang membuat kepala di sana selalu tepat setinggi angka ini dan pemeriksaannya menjadi pengulangan belaka.', 'Height of the wall above the frontmost floor — the lowest. Measured from there because that is how a wall is built: one board from the bottom floor to the plate, not one board per level. It follows that headroom at the top level is this figure less the whole rise of the sequence, which is a comparison of two independent numbers. Written first as measured from the topmost level, which made headroom there exactly this figure and the check on it a restatement.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal dinding papan.', 'Thickness of a board wall.'),
  tenggalungDepth: dim(2.1, 'm', 'interpolated', 'none', 'Dalamnya pagar tenggalung, galeri terdepan tempat rumah bertemu jalan.', 'Depth of the pagar tenggalung, the front gallery where the house meets the street.'),
  kisiHeight: dim(1.05, 'm', 'interpolated', 'none', 'Tinggi kisi-kisi yang menyekat galeri depan bila disekat.', 'Height of the lattice screening the front gallery when it is screened.'),
  kisiPitch: dim(0.16, 'm', 'interpolated', 'none', 'Jarak antar batang kisi-kisi.', 'Spacing between the lattice bars.'),
  kisiSection: dim(0.05, 'm', 'interpolated', 'none', 'Sisi penampang satu batang kisi-kisi.', 'Section of one lattice bar.'),

  /* the roof */
  ridgeRise: dim(5.0, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap. Mula-mula 3,2 m, yang memberi kemiringan 23° — pada gambar atapnya terbaca sebagai tutup datar di atas kotak, dan rumah ini dinamai dari atapnya. Lima meter memberi sekitar 32°.', 'Rise of the ridge above the eave. Written as 3.2 m first, which gives a pitch of 23° — in the render the roof read as a flat lid on a box, and this house is named for its roof. Five metres gives about 32°.'),
  eaveOversail: dim(1.2, 'm', 'interpolated', 'none', 'Panjang tritisan.', 'Depth of the overhang.'),
  rafterSection: dim(0.1, 'm', 'interpolated', 'none', 'Sisi penampang kasau.', 'Section of a rafter.'),
  raftersPerBay: dim(3, 'count', 'interpolated', 'none', 'Jumlah kasau tiap ruang.', 'Rafters in each bay.'),
  tileCourseDepth: dim(0.19, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis genteng.', 'Exposed depth of one course of tile.'),
  tileThickness: dim(0.035, 'm', 'interpolated', 'none', 'Tebal satu lapis genteng yang menonjol dari lapis di bawahnya.', 'How far a course of tile stands proud of the one below.'),
  tileLap: dim(0.5, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course the course above laps.'),
  tileBed: dim(0.03, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),
  simbarRise: dim(0.7, 'm', 'interpolated', 'none', 'Tinggi simbar di ujung bubungan.', 'Height of a simbar at the end of the ridge.'),
  simbarSection: dim(0.09, 'm', 'interpolated', 'none', 'Sisi penampang simbar.', 'Section of a simbar.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu tempat kaki tiang duduk.', 'Depth of the dish in the stone the post foot seats into.'),

  /* rules that are structure, not measurement */
  floorIsTheHierarchy: dim(1, 'count', 'canon', 'depdikbud-sumsel', 'Lantai naik bertingkat dari muka ke belakang, dan tempat seorang tamu didudukkan pada urutan itu adalah kedudukannya. Tidak ada yang ditolak masuk; yang berbeda adalah setinggi apa ia duduk. Ini satu-satunya rumah dalam projek ini yang fakta sosialnya benar-benar sebuah ketinggian, bukan sesuatu yang darinya ketinggian diturunkan.', 'The floor rises in steps from the front to the back, and where a guest is seated on that sequence is their standing. Nobody is refused entry; what differs is how high they sit. It is the only house in this project where the social fact is literally a height rather than something a height is derived from.'),
  depthIsSocialWidthIsNot: dim(1, 'count', 'canon', 'siswanto-2009', 'Kedalaman rumah bertambah dengan menambah kekijing; lebarnya bertambah dengan menambah ruang. Kedua sumbu itu terpisah dan mengatakan hal yang berbeda — yang satu urutan sosial, yang lain sekadar ukuran. Delapan rumah lain dalam projek ini memperlakukan denah sebagai satu hal.', 'The house grows deeper by adding a kekijing and wider by adding a bay. The two axes are separate and say different things — one a social sequence, the other merely size. The other eight houses in this project treat a plan as one thing.'),
  threeOrFive: dim(1, 'count', 'canon', 'depdikbud-sumsel', 'Tingkatnya tiga atau lima, dan tidak ada yang genap. Rumah bertingkat tiga bukan rumah bertingkat lima yang lebih kecil; ia rumah tangga dengan daftar tamu yang lebih pendek.', 'The levels are three or five, and never an even number. A three-step house is not a smaller five-step house; it is a household with a shorter guest list.'),
  entryIsLowest: dim(1, 'count', 'canon', 'depdikbud-sumsel', 'Orang masuk pada tingkat terendah dan naik dari sana. Urutannya bermula di jalan dan berakhir pada keluarga.', 'A person enters at the lowest level and rises from there. The sequence begins at the street and ends at the family.'),
  raisedOnPosts: dim(1, 'count', 'canon', 'waterson-1990', 'Rumah berdiri di atas tiang, dan tiangnya tidak sama panjang karena lantainya bertingkat.', 'The house stands on posts, and the posts are not all one length because the floor is stepped.'),
  seatedOnStone: dim(1, 'count', 'canon', 'waterson-1990', 'Kaki tiang berdiri di atas batu, tidak ditanam.', 'The post feet stand on stones; they are not buried.'),
  limasRoof: dim(4, 'count', 'canon', 'ju-saito-2012', 'Atap limas: empat bidang jatuh ke tepi atap yang menutup keliling, dan bubungannya lebih pendek daripada bangunannya. Rumah ini dinamai dari atapnya, bukan dari lantainya — meski lantainya yang mengatakan sesuatu.', 'A limas roof: four planes falling to an eave that closes all the way round, with a ridge shorter than the building. The house is named for its roof rather than for its floor — though it is the floor that says something.'),

  /* The site: the yard the sequence starts in. */
  yardDepth: dim(11, 'm', 'interpolated', 'none', 'Kedalaman halaman muka dari tangga ke pagar. Kekijing dimulai sebelum tangga: tamu berhenti di halaman, naik, lalu didudukkan pada tingkat yang menyatakan kedudukannya. Bahwa ada halaman di muka adalah lazim; ukuran dan pagarnya penetapan penulis.', 'Depth of the front yard from the stair to the fence. The kekijing begins before the stair: a guest stops in the yard, climbs, and is then seated on the step that states their standing. That there is a yard in front is ordinary; its size and its fence are the author’s.'),
  yardWidth: dim(16, 'm', 'interpolated', 'none', 'Lebar halaman muka.', 'Width of the front yard.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  tiang: 1.6,
  kijing: 1.4,
  lantai: 1.3,
  dinding: 1.2,
  tenggalung: 0.9,
  rangka: 1.6,
  genteng: 2.0,
  simbar: 0.5,
}

export const PACK: RulePack<PalembangKinds> = {
  key: 'palembang',
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

/* ── The levels ───────────────────────────────────────────────────────── */

/**
 * Named from the street inward.
 *
 * Five names for a five-step house; a three-step house takes the first, the
 * middle and the last — the distinctions it drops are the two in between,
 * which is what a shorter guest list means. The names and their uses are as
 * the sources give them; the choice of which three survive is the author's,
 * and the dimension note says so.
 */
export const LEVELS: readonly {
  key: string
  nameId: string
  nameEn: string
  glossId: string
  glossEn: string
}[] = [
  {
    key: 'jogan',
    nameId: 'Jogan',
    nameEn: 'Jogan',
    glossId: 'Tingkat terendah, tempat orang masuk. Siapa pun boleh berada di sini, dan itulah artinya.',
    glossEn: 'The lowest level, where a person enters. Anyone may be here, and that is what it means.',
  },
  {
    key: 'kekijing-dua',
    nameId: 'Kekijing kedua',
    nameEn: 'The second kekijing',
    glossId: 'Untuk tamu yang dikenal tetapi tidak dekat.',
    glossEn: 'For guests who are known but not close.',
  },
  {
    key: 'kekijing-tiga',
    nameId: 'Kekijing ketiga',
    nameEn: 'The third kekijing',
    glossId: 'Untuk kerabat dan orang yang dituakan.',
    glossEn: 'For kin and for those who are deferred to.',
  },
  {
    key: 'kekijing-empat',
    nameId: 'Kekijing keempat',
    nameEn: 'The fourth kekijing',
    glossId: 'Untuk yang paling dihormati di antara tamu.',
    glossEn: 'For the most honoured among guests.',
  },
  {
    key: 'gegajah',
    nameId: 'Gegajah',
    nameEn: 'Gegajah',
    glossId: 'Tingkat teratas dan terdalam: ruang keluarga, tempat urusan rumah tangga diputuskan.',
    glossEn: 'The highest and deepest level: the family’s room, where the household’s business is settled.',
  },
]

/** Which of the five a house of this many steps builds. */
export function levelsFor(kekijing: Kekijing): readonly (typeof LEVELS)[number][] {
  if (kekijing === 5) return LEVELS
  const first = LEVELS[0]
  const middle = LEVELS[2]
  const last = LEVELS[4]
  if (!first || !middle || !last) throw new Error('the level table is incomplete')
  return [first, middle, last]
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang unglen didirikan, dan tidak ada dua barisan yang sama panjang: tiap tingkat menuntut tingginya sendiri. Urutan sosial rumah ini sudah terbaca dari kolongnya, sebelum ada satu papan pun dipasang.',
    glossEn: 'The unglen posts go up, and no two ranks are the same length: each level calls for its own height. This house’s social sequence is legible from underneath, before a single board is laid.',
  },
  {
    stage: 'kijing',
    title: 'Kijing',
    glossId: 'Balok yang menetapkan tiap tingkat dipasang, dari yang terendah ke yang tertinggi — urutan yang sama dengan urutan orang naik.',
    glossEn: 'The bearers that set each level go in, lowest to highest — the same order a person climbs them.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai tiap tingkat dipasang. Di sinilah bangunan ini menyatakan hal yang dinyatakannya.',
    glossEn: 'The floor of each level is laid. This is where this building says the thing it says.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding berdiri di sekeliling, dari lantai terendah sampai balok atas.',
    glossEn: 'The walls go up around the whole, from the lowest floor to the plate.',
  },
  {
    stage: 'tenggalung',
    title: 'Pagar tenggalung',
    glossId: 'Galeri depan tempat rumah bertemu jalan, dengan atau tanpa kisi-kisi. Yang diubah kisi-kisi adalah ambangnya, bukan urutannya.',
    glossEn: 'The front gallery where the house meets the street, with its lattice or without. What the lattice changes is the threshold, not the hierarchy.',
  },
  {
    stage: 'rangka',
    title: 'Rangka atap',
    glossId: 'Bubungan, jurai dan kasau: atap limas di atas lantai yang bertingkat-tingkat.',
    glossEn: 'Ridge, hips and rafters: a limas roof over a floor that is anything but level.',
  },
  {
    stage: 'genteng',
    title: 'Genteng',
    glossId: 'Genteng dipasang dari tepi ke atas. Tanah bakar, seperti pada joglo, dan bukan daun.',
    glossEn: 'The tiles are laid from the eave upward. Fired clay, as on the joglo, and not leaf.',
  },
  {
    stage: 'simbar',
    title: 'Simbar',
    glossId: 'Hiasan ujung bubungan dipasang terakhir.',
    glossEn: 'The ridge-end ornaments go on last.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { kekijing: 5, lebar: 4, tenggalung: true }

export const MIN_LEBAR = 3
export const MAX_LEBAR = 7

export function normaliseRules(rules: Rules): Rules {
  return {
    /*
     * Three or five, and nothing else.
     *
     * Anything that is neither falls to the default, which is how the codec
     * treats an unrecognised choice — `?kekijing=4` describes no house this
     * tradition builds, so it is a truncated address rather than a smaller
     * one. Compared as a number: the same rule written against a string was
     * the bug that made every three-step house come back with five.
     */
    kekijing: Number(rules.kekijing) === 3 ? 3 : 5,
    lebar: Math.min(MAX_LEBAR, Math.max(MIN_LEBAR, Math.round(rules.lebar))),
    tenggalung: rules.tenggalung,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
