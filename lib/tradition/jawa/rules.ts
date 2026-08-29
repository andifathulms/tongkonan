/**
 * The rule pack for the joglo.
 *
 * Same discipline as the other two and the same result: the sources describe
 * this building richly in words, in plans and in structural diagrams, and
 * almost never in millimetres, so nearly every metric value here is the
 * author's. What the sources give is structure — that four soko guru carry the
 * centre, that the tumpang sari is a corbelled stack whose tier count is odd
 * and reads as rank, that the joglo comes in a named graded series, that the
 * senthong tengah is left empty, that the frame is pegged and demountable.
 * Those are `canon`. Nothing is `measured`, because no survey has been wired
 * in for this house either.
 *
 * Two absences worth naming, because they are what a third house was for. This
 * pack has no rank *scale* like the Toraja one, and no *tally* like the horns
 * or the bilik: nothing here counts events or people. What it has instead is a
 * graded series and a tier count, both of which say standing without counting
 * anything. Three houses, three different ways for a social fact to become a
 * dimension, and no two of them the same shape.
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
  JawaKinds,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  Wujud,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'prijotomo-1984',
    citation:
      'Prijotomo, J., Ideas and Forms of Javanese Architecture ' +
      '(Gadjah Mada University Press, Yogyakarta, 1984).',
    kind: 'reference',
  },
  {
    key: 'dakung-depdikbud',
    citation:
      'Dakung, S., Arsitektur Tradisional Daerah Istimewa Yogyakarta ' +
      '(Departemen Pendidikan dan Kebudayaan, Jakarta).',
    kind: 'reference',
  },
  {
    key: 'frick-1997',
    citation:
      'Frick, H., Pola Struktural dan Teknik Bangunan di Indonesia ' +
      '(Kanisius, Yogyakarta, 1997).',
    kind: 'reference',
  },
  {
    key: 'tjahjono-1989',
    citation:
      'Tjahjono, G., “Center and Duality in the Javanese Dwelling”, in Bourdier, J.-P. & ' +
      'AlSayyad, N. (eds), Dwellings, Settlements and Tradition (University Press of America, 1989).',
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
  guruSpan: dim(4.8, 'm', 'interpolated', 'none', 'Jarak antar soko guru, kedua arah. Persegi ini adalah pusat rumah, dan seluruh denah tumbuh keluar darinya — jadi ia juga menentukan seberapa besar bagian atap yang ditempati brunjung. Terlalu kecil, dan atapnya terbaca sebagai bentangan datar yang lebar dengan topi kecil di atasnya, bukan sebagai pusat curam dengan serambi di sekelilingnya.', 'Spacing between the soko guru, both ways. This square is the centre of the house and the whole plan grows outward from it — so it also sets how much of the roof the brunjung occupies. Too small, and the roof reads as a wide flat apron with a small hat on it rather than as a steep centre with a skirt around it.'),
  ringStep: dim(1.55, 'm', 'interpolated', 'none', 'Jarak tiap cincin tiang di luar cincin di dalamnya.', 'How far each ring of pillars stands outside the one within it.'),
  sokoSection: dim(0.22, 'm', 'interpolated', 'none', 'Sisi penampang soko.', 'Section of a soko, the pillar.'),
  guruHeight: dim(3.4, 'm', 'interpolated', 'none', 'Tinggi soko guru dari umpak ke kepala tiang, tempat tumpang sari mulai.', 'Height of a soko guru from its umpak to the head, where the tumpang sari begins.'),
  ringDrop: dim(0.78, 'm', 'interpolated', 'none', 'Berkurangnya tinggi tiap cincin tiang di luar cincin di dalamnya. Bersama jarak antar cincin, angka ini adalah kemiringan penanggap — tidak ada dimensi tersendiri untuk itu, karena kemiringan atap yang bertumpu pada tiang adalah selisih tinggi dibagi jaraknya. Akibatnya semua jenjang penanggap sekemiringan: patahan yang terlihat pada joglo ini adalah antara penanggap dan brunjung, bukan antara jenjang penanggap yang satu dan yang lain.', 'How much shorter each ring of pillars is than the one within it. Together with the ring spacing this number *is* the penanggap pitch — there is no separate dimension for it, because the pitch of a roof resting on pillars is the height difference over the distance. One consequence is that every penanggap tier has the same pitch: the break this joglo shows is between the penanggap and the brunjung, not between one penanggap tier and the next.'),
  umpakHeight: dim(0.38, 'm', 'interpolated', 'none', 'Tinggi umpak, batu tempat soko berdiri.', 'Height of an umpak, the stone a soko stands on.'),
  umpakWidth: dim(0.44, 'm', 'interpolated', 'none', 'Lebar umpak di kakinya.', 'Width of an umpak at its foot.'),
  floorRise: dim(0.35, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah. Ini lantai yang ditinggikan, bukan rumah panggung: tidak ada ruang di bawahnya, dan di sinilah joglo berbeda paling tajam dari dua rumah lainnya.', 'Height of the floor above the ground. A raised floor, not a house on stilts: there is no room beneath it, and this is where the joglo differs most sharply from the other two houses.'),
  floorThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal lantai.', 'Thickness of the floor.'),
  wallHeight: dim(2.5, 'm', 'interpolated', 'none', 'Tinggi dinding gebyok dari lantai.', 'Height of the gebyok wall from the floor.'),
  wallThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal papan gebyok dan sekat senthong.', 'Thickness of a gebyok board and of a senthong partition.'),
  senthongDepth: dim(2.2, 'm', 'interpolated', 'none', 'Kedalaman senthong dari dinding belakang.', 'Depth of the senthong from the rear wall.'),

  /* the corbelled stack */
  tumpangRise: dim(0.19, 'm', 'interpolated', 'none', 'Naiknya tiap tingkat tumpang sari di atas tingkat di bawahnya.', 'How far each tier of the tumpang sari rises above the one below it.'),
  tumpangClose: dim(0.62, 'ratio', 'interpolated', 'none', 'Seberapa jauh bukaan tumpang sari menutup dari kaki ke puncak, sebagai bagian dari setengah bentang soko guru. Sebagai bagian, bukan jarak tetap tiap tingkat: sebelas tingkat berundak lebih halus daripada tiga, bukan menutup lebih jauh — dan tumpukan dengan langkah tetap akan kehabisan bukaan sebelum kehabisan hitungan, lalu berhenti sebelum menyatakan kedudukan yang dimaksud.', 'How far the tumpang sari’s opening closes from foot to top, as a share of the soko guru half-span. A share rather than a fixed step per tier: eleven tiers step more finely than three rather than closing further — and a stack with a fixed step runs out of opening before it runs out of count, and stops short of the standing it was meant to state.'),
  tumpangDepth: dim(0.19, 'm', 'interpolated', 'none', 'Tinggi penampang balok tumpang sari. Sama dengan naiknya tiap tingkat, sehingga balok-balok itu bertumpuk langsung: balok pengganjal pendek yang sebenarnya ada di antara tingkat tidak dimodelkan, dan menyisakan celah di antaranya akan membuat tumpukan itu berdiri di atas udara — yang memang ditolak oleh pemeriksaan urutan pendirian.', 'Depth of a tumpang sari beam in section. Equal to the rise per tier, so the beams stack directly on one another: the short spacer blocks that really sit between tiers are not modelled, and leaving the gap they occupy would stand the stack on air — which the build-order check duly refuses.'),
  tumpangWidth: dim(0.11, 'm', 'interpolated', 'none', 'Lebar penampang balok tumpang sari.', 'Width of a tumpang sari beam in section.'),

  /* the roof */
  brunjungRise: dim(2.9, 'm', 'interpolated', 'none', 'Tinggi molo di atas puncak tumpang sari. Brunjung curam; inilah bidang atap yang terlihat dari jauh.', 'Height of the molo above the top of the tumpang sari. The brunjung is steep, and it is the roof plane read from a distance.'),
  ridgeShare: dim(0.5, 'ratio', 'interpolated', 'none', 'Panjang molo sebagai bagian dari jarak antar soko guru — bukan dari panjang rumah, karena brunjung berdiri di atas persegi soko guru dan bubungannya tidak mungkin lebih panjang dari alasnya. Molo joglo jauh lebih pendek daripada bangunannya; itulah yang membuatnya atap limasan dan bukan atap pelana, dan yang membuatnya tak bisa dibuat dengan menyapu satu penampang sepanjang bubungan.', 'Length of the molo as a share of the soko guru spacing — not of the length of the house, because the brunjung stands on the soko guru square and its ridge cannot be longer than what it stands on. A joglo molo is far shorter than its building; that is what makes it a hipped roof rather than a gabled one, and what makes it impossible to build by sweeping one section along a ridge.'),
  eaveOversail: dim(1.15, 'm', 'interpolated', 'none', 'Julur atap melewati garis tiang terluar, agar tetesan air jatuh bebas dari kaki tiang. Turunnya tepi atap tidak ditetapkan tersendiri: atap meneruskan kemiringan penanggap sampai ke tepi, dan kemiringan itu sudah ditentukan oleh jarak dan beda tinggi antar cincin tiang.', 'How far the eave oversails the outer pillar line, so the drip falls clear of the pillar feet. How far the eave drops is not declared separately: the roof carries the penanggap pitch out to the edge, and that pitch is already set by the spacing and the height difference between the rings of pillars.'),
  emperRun: dim(1.4, 'm', 'interpolated', 'none', 'Julur emper, serambi rendah tambahan di luar tepi atap. Hanya bentuk paling tinggi yang memilikinya, dan itulah jenjang atap tambahannya.', 'Reach of the emper, the extra low skirt outside the eave. Only the highest grade carries one, and it is that grade’s extra roof tier.'),
  emperDrop: dim(0.42, 'm', 'interpolated', 'none', 'Turunnya emper di bawah tepi atap utama. Lebih landai daripada penanggap, sehingga jenjang tambahan itu terbaca sebagai jenjang.', 'How far the emper falls below the main eave. Shallower than the penanggap, so the extra tier reads as a tier.'),
  rafterWidth: dim(0.07, 'm', 'interpolated', 'none', 'Lebar penampang usuk.', 'Width of a rafter in section.'),
  rafterDepth: dim(0.10, 'm', 'interpolated', 'none', 'Tinggi penampang usuk.', 'Depth of a rafter in section.'),
  raftersPerSide: dim(9, 'count', 'interpolated', 'none', 'Jumlah usuk tiap bidang atap.', 'Number of rafters per roof plane.'),
  moloRadius: dim(0.085, 'm', 'interpolated', 'none', 'Jari-jari molo, balok bubungan.', 'Radius of the molo, the ridge beam.'),
  plateDepth: dim(0.20, 'm', 'interpolated', 'none', 'Tinggi balok tumpuan tiap cincin.', 'Depth of the plate on each ring.'),
  plateWidth: dim(0.14, 'm', 'interpolated', 'none', 'Lebar balok tumpuan.', 'Width of a plate.'),
  tileCourseDepth: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi tampak satu baris genteng.', 'Exposed depth of one course of tiles.'),
  tileThickness: dim(0.045, 'm', 'interpolated', 'none', 'Tebal satu baris genteng yang menonjol dari baris di bawahnya.', 'How far a course of tiles stands proud of the one below it.'),
  tileLap: dim(0.35, 'ratio', 'interpolated', 'none', 'Bagian baris genteng yang tertindih baris di atasnya.', 'The share of a course of tiles that the course above laps over.'),
  tileBedClearance: dim(0.02, 'm', 'interpolated', 'none', 'Jarak bebas antara reng dan baris genteng pertama.', 'Clearance between the battens and the first course of tiles.'),

  /* the pendhapa */
  pendhapaSpan: dim(6.4, 'm', 'interpolated', 'none', 'Sisi pendhapa, pendopo terbuka di muka.', 'Side of the pendhapa, the open pavilion at the front.'),
  pendhapaGap: dim(2.4, 'm', 'interpolated', 'none', 'Jarak antara pendhapa dan dalem. Ruang di antaranya adalah pringgitan, tempat wayang dimainkan — penonton di pendhapa, dalang di antara keduanya.', 'The distance between the pendhapa and the dalem. The space between them is the pringgitan, where wayang is performed — the audience in the pendhapa, the screen between the two.'),
  pendhapaBrunjung: dim(0.7, 'ratio', 'interpolated', 'none', 'Tinggi brunjung pendhapa dibanding brunjung dalem. Pendopo lebih rendah daripada rumahnya, dan memang harus begitu: yang menerima tamu tidak boleh menaungi yang ditinggali.', 'Height of the pendhapa’s brunjung relative to the dalem’s. The pavilion stands lower than the house, and should: the place where guests are received does not overtop the place where the household lives.'),
  pendhapaGuruShare: dim(0.42, 'ratio', 'interpolated', 'none', 'Bentang soko guru pendhapa sebagai bagian dari sisi pendhapa.', 'The pendhapa’s soko guru spacing, as a share of its side.'),
  hipRafterGirth: dim(0.75, 'ratio', 'interpolated', 'none', 'Ketebalan usuk jurai dibanding usuk biasa.', 'Girth of a hip rafter relative to a common one.'),
  sheathingOffset: dim(0.5, 'ratio', 'interpolated', 'none', 'Tinggi papan atap di atas sumbu usuk, sebagai bagian dari tinggi usuk.', 'How far the roof boarding sits above the rafter axis, as a share of rafter depth.'),
  pendhapaHeight: dim(3.0, 'm', 'interpolated', 'none', 'Tinggi soko guru pendhapa.', 'Height of the pendhapa’s own soko guru.'),

  /* engagements */
  sundukDepth: dim(0.20, 'm', 'interpolated', 'none', 'Tinggi penampang sunduk, balok pengikat kepala tiang.', 'Depth of a sunduk, the beam tying the pillar heads.'),
  sundukWidth: dim(0.12, 'm', 'interpolated', 'none', 'Lebar penampang sunduk.', 'Width of a sunduk.'),
  purusRun: dim(0.65, 'ratio', 'interpolated', 'none', 'Sejauh mana kepala tiang masuk ke dalam sunduk, sebagai bagian dari tinggi sunduk.', 'How far a pillar head runs up into the sunduk, as a share of the sunduk’s depth.'),
  sokoSeat: dim(0.28, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan umpak tempat kaki soko duduk, sebagai bagian dari tinggi umpak.', 'Depth of the dish in the umpak that the pillar foot seats into, as a share of stone height.'),
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  floorBoardWidth: dim(0.24, 'm', 'interpolated', 'none', 'Lebar satu papan lantai.', 'Width of one floor board.'),

  /* rules that are structure, not measurement */
  sokoGuruFour: dim(4, 'count', 'canon', 'prijotomo-1984', 'Empat soko guru memikul pusat rumah, dan bidang persegi di antaranya adalah pusat itu.', 'Four soko guru carry the centre of the house, and the square between them is that centre.'),
  tumpangIsOdd: dim(1, 'count', 'canon', 'dakung-depdikbud', 'Jumlah tingkat tumpang sari ganjil, dan jumlahnya terbaca sebagai kedudukan.', 'The tumpang sari has an odd number of tiers, and the count reads as standing.'),
  gradedSeries: dim(1, 'ratio', 'canon', 'dakung-depdikbud', 'Joglo hadir sebagai deret bernama yang berjenjang, tiap jenjang menambah satu tingkat atap dan satu cincin tiang. Nama-namanya terdokumentasi; berapa tingkat yang dimiliki tiap nama di sini adalah bacaan penulis.', 'The joglo comes as a named graded series, each grade adding a roof tier and a ring of pillars. The names are documented; how many tiers each name carries here is the author’s reading.'),
  senthongTengahEmpty: dim(1, 'count', 'canon', 'tjahjono-1989', 'Tiga senthong di belakang dalem, dan yang tengah dibiarkan kosong. Ruang yang paling bermakna di rumah ini adalah ruang yang tidak ditempati.', 'Three senthong at the back of the dalem, and the middle one is left empty. The most meaningful room in this house is the one nobody occupies.'),
  centreNotStack: dim(1, 'ratio', 'canon', 'tjahjono-1989', 'Rumah ini terbagi dari pusat ke tepi, bukan dari bawah ke atas. Tidak ada kolong, dan tidak ada tiga dunia bertumpuk; yang ada adalah pusat di bawah brunjung dan tepi di bawah penanggap.', 'This house divides from the centre outward, not from the ground upward. There is no underfloor and no three stacked worlds; there is a centre under the brunjung and a periphery under the penanggap.'),
  noNails: dim(1, 'ratio', 'canon', 'frick-1997', 'Sambungan purus berpasak; rangka disusun tanpa paku dan dapat dibongkar kembali.', 'Pegged purus joints; the frame goes up without nails and comes apart again.'),
  hipped: dim(1, 'ratio', 'canon', 'prijotomo-1984', 'Atapnya limasan berjenjang: molo lebih pendek daripada bangunannya, dan keempat bidang atap turun ke tepi.', 'The roof is a stepped hip: the molo is shorter than the building, and four planes fall away to the eave.'),
  seatedOnStone: dim(1, 'count', 'canon', 'frick-1997', 'Soko berdiri di atas umpak, tidak ditanam.', 'The soko stand on umpak stones; they are not buried.'),

  /* The site: the yard the house sits inside. */
  walledYard: dim(1, 'count', 'canon', 'dakung-depdikbud', 'Omah berdiri di dalam pekarangan berpagar, dengan pendhapa di muka dan halaman di antaranya. Rumah Jawa bukan benda di tengah lapangan: ia bagian belakang sebuah pekarangan yang dimasuki dari muka.', 'The omah stands inside a walled pekarangan, with the pendhapa in front and the yard between. A Javanese house is not an object in a field: it is the back of a yard entered from the front.'),
  pekaranganDepth: dim(16, 'm', 'interpolated', 'none', 'Kedalaman pekarangan dari pagar muka ke belakang rumah.', 'Depth of the pekarangan from the front wall to the back of the house.'),
  yardWallHeight: dim(1.5, 'm', 'interpolated', 'none', 'Tinggi tembok pekarangan, dengan pintu masuk di muka. Tembok rendah agar tidak menutupi rumah dari luar; tingginya penetapan penulis.', 'Height of the yard wall, with the entrance in the front. Low enough not to hide the house from outside; the height is the author’s.'),
  yardWallThickness: dim(0.3, 'm', 'interpolated', 'none', 'Tebal tembok itu.', 'Thickness of that wall.'),
  gateWidth: dim(3, 'm', 'interpolated', 'none', 'Lebar bukaan masuk di muka pekarangan.', 'Width of the entrance opening at the front of the yard.'),
  pekaranganWidth: dim(20, 'm', 'interpolated', 'none', 'Lebar pekarangan.', 'Width of the pekarangan.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  umpak: 0.6,
  soko: 1.6,
  sunduk: 1.1,
  lantai: 0.7,
  gebyok: 1.0,
  senthong: 0.8,
  'tumpang-sari': 1.5,
  'rangka-atap': 1.7,
  genteng: 1.8,
}

export const PACK: RulePack<JawaKinds> = {
  key: 'jawa',
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

/* ── The graded series ────────────────────────────────────────────────── */

export interface WujudInfo {
  readonly wujud: Wujud
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
  /** rings of pillars, counting the soko guru as one */
  readonly rings: number
  /**
   * Whether the grade carries an emper, the extra low skirt outside the eave.
   *
   * The roof tiers are not declared: there is one band between each ring and
   * the next, one from the outer ring out to the eave, one from the soko guru
   * square up to the molo, and one more where there is an emper. The tier
   * count is what the pillars make, which is the same relation the tongkonan's
   * post rows have to its bays.
   */
  readonly emper: boolean
}

/** Bands of roof this grade produces. Derived, never set. */
export function roofTiers(info: WujudInfo): number {
  return info.rings + 1 + (info.emper ? 1 : 0)
}

export const WUJUD: readonly WujudInfo[] = [
  {
    wujud: 'jompongan',
    name: 'Joglo jompongan',
    glossId: 'Bentuk paling sederhana: soko guru dengan satu cincin di luarnya, dan atap berjenjang dua.',
    glossEn: 'The simplest form: the soko guru with one ring outside them, and a roof of two tiers.',
    rings: 2,
    emper: false,
  },
  {
    wujud: 'sinom',
    name: 'Joglo sinom',
    glossId: 'Satu cincin lagi dan satu jenjang atap lagi; tepi atap turun lebih jauh dan lebih landai.',
    glossEn: 'One more ring and one more roof tier; the eave reaches further out and lies shallower.',
    rings: 3,
    emper: false,
  },
  {
    wujud: 'pangrawit',
    name: 'Joglo pangrawit',
    glossId: 'Sama tiga cincin seperti sinom, ditambah emper: serambi rendah mengelilingi tepi atap, dan satu jenjang atap lagi karenanya.',
    glossEn: 'The same three rings as the sinom, plus an emper: a low skirt around the eave, and one more tier of roof because of it.',
    rings: 3,
    emper: true,
  },
]

export function wujudInfo(wujud: Wujud): WujudInfo {
  const found = WUJUD.find((w) => w.wujud === wujud)
  if (!found) throw new Error(`unknown wujud: ${wujud}`)
  return found
}

/* ── Names ────────────────────────────────────────────────────────────── */

/**
 * How far one tier steps in, given how many there are.
 *
 * Derived rather than declared, because the thing that is fixed about a
 * tumpang sari is how far the opening closes, not how big each step is.
 */
export function tumpangInset(guruHalf: number, tiers: number): number {
  return (guruHalf * DIMS.tumpangClose.value) / Math.max(1, tiers)
}

/** The three rear chambers, left to right. The middle one stays empty. */
export const SENTHONG_NAMES: readonly string[] = ['senthong kiwa', 'senthong tengah', 'senthong tengen']

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'umpak',
    title: 'Umpak',
    glossId: 'Batu diletakkan lebih dahulu. Soko berdiri di atasnya, tidak ditanam, dan karena itu rumah bisa dibongkar dan dipindah.',
    glossEn: 'The stones go down first. The soko stand on them rather than in the ground, which is why the house can be taken apart and moved.',
  },
  {
    stage: 'soko',
    title: 'Soko',
    glossId: 'Empat soko guru lebih dahulu — persegi di antaranya adalah pusat rumah — lalu cincin-cincin di luarnya, makin pendek makin ke luar.',
    glossEn: 'The four soko guru first — the square between them is the centre of the house — then the rings outside them, each shorter than the last.',
  },
  {
    stage: 'sunduk',
    title: 'Sunduk',
    glossId: 'Balok pengikat mengunci kepala tiang. Purus dan pasak, tanpa paku.',
    glossEn: 'Tie beams lock the pillar heads. Purus and peg, and no nails.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai ditinggikan sedikit di atas tanah. Tidak ada ruang di bawahnya: ini bukan rumah panggung.',
    glossEn: 'The floor is raised a little above the ground. There is no room beneath it: this is not a house on stilts.',
  },
  {
    stage: 'gebyok',
    title: 'Gebyok',
    glossId: 'Papan dinding berukir dipasang; bidang inilah yang membawa ukiran.',
    glossEn: 'The carved wall panels go up; these are the surfaces that carry the carving.',
  },
  {
    stage: 'senthong',
    title: 'Senthong',
    glossId: 'Tiga bilik di belakang dalem. Yang tengah dibiarkan kosong, dan justru itulah ruang yang paling bermakna.',
    glossEn: 'Three chambers at the back of the dalem. The middle one is left empty, and that is the most meaningful room in the house.',
  },
  {
    stage: 'tumpang-sari',
    title: 'Tumpang sari',
    glossId: 'Balok bertumpuk di atas soko guru, tiap tingkat masuk ke dalam dan naik. Jumlah tingkatnya ganjil, dan jumlah itu terbaca sebagai kedudukan.',
    glossEn: 'Beams stacked over the soko guru, each tier stepping inward and upward. The number of tiers is odd, and that number reads as standing.',
  },
  {
    stage: 'rangka-atap',
    title: 'Rangka atap',
    glossId: 'Molo, usuk, dan balok tumpuan. Molo jauh lebih pendek daripada rumahnya, dan keempat bidang atap turun ke tepi.',
    glossEn: 'Molo, rafters and plates. The molo is far shorter than the house, and four planes of roof fall away to the eave.',
  },
  {
    stage: 'genteng',
    title: 'Genteng',
    glossId: 'Genteng dipasang dari tepi ke atas, tiap baris menindih baris di bawahnya.',
    glossEn: 'The tiles are laid from the eave upward, each course lapping the one below.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { wujud: 'sinom', tumpang: 5, pendhapa: true }

export const MIN_TUMPANG = 3
export const MAX_TUMPANG = 11

/**
 * Clamp to the declared ranges.
 *
 * The tier count is forced odd rather than merely clamped, because odd is a
 * rule and not a preference — the same move the rumah gadang makes with its
 * ruang count, and for the same reason.
 */
export function normaliseRules(rules: Rules): Rules {
  let tumpang = Math.min(MAX_TUMPANG, Math.max(MIN_TUMPANG, Math.round(rules.tumpang)))
  if (tumpang % 2 === 0) tumpang -= 1
  return { wujud: rules.wujud, tumpang, pendhapa: rules.pendhapa }
}

/** Every Dim that fed a given layout. No rank scale in this pack: see the head of the file. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
