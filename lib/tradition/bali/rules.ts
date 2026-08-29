/**
 * The rule pack for the Balinese bale.
 *
 * The first pack in this project where the provenance question splits in two,
 * and the split is the whole reason for building this house.
 *
 * Everywhere else a dimension is a length in metres and one class applies to
 * it. Here a principal length is *so many of a named body measure*, and the
 * two halves of that have different standing:
 *
 *   - **How many units.** The sources describe the set-out in units and the
 *     rule that the measures come from the owner's body, so the counts are
 *     `canon` where a source states the relationship and `interpolated` where
 *     the author chose a plausible whole number to fill a gap. They are
 *     counts, not metres, and they are the same for every owner.
 *
 *   - **How long a unit is.** A depa is a person's arm span. The ratios that
 *     get from it to a hasta, a musti, a useran and a nyari are anthropometry,
 *     and they are the author's — hence the `anthropometry` source key, which
 *     exists so that "not from a book about Bali" is visible in the table
 *     rather than hidden inside `none`.
 *
 * Merging those into one metre figure with one class would be the same fault
 * as averaging two houses' interpolated shares: a number whose worse half is
 * concealed by its better one. So they are declared apart, and `/sumber` lists
 * them apart.
 *
 * Nothing here is `measured`. No bale has been surveyed for this project, and
 * the fifth house does not move that bar any more than the second, third or
 * fourth did.
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
  Bale,
  BaliKinds,
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
    key: 'gelebet-1986',
    citation:
      'Gelebet, I N., Arsitektur Tradisional Daerah Bali ' +
      '(Departemen Pendidikan dan Kebudayaan, Denpasar, 1986).',
    kind: 'reference',
  },
  {
    key: 'budihardjo-1986',
    citation:
      'Budihardjo, E., Architectural Conservation in Bali ' +
      '(Gadjah Mada University Press, Yogyakarta, 1986).',
    kind: 'reference',
  },
  {
    key: 'eiseman-1990',
    citation:
      'Eiseman, F. B., Bali: Sekala and Niskala, Volume II — Essays on Society, Tradition and Craft ' +
      '(Periplus, Berkeley, 1990).',
    kind: 'ethnography',
  },
  {
    key: 'dwijendra-2008',
    citation:
      'Dwijendra, N. K. A., Arsitektur Rumah Tradisional Bali Berdasarkan Asta Kosala Kosali ' +
      '(Udayana University Press, Denpasar, 2008).',
    kind: 'reference',
  },
  {
    key: 'anthropometry',
    citation:
      'Tidak ada sumber Bali. Perbandingan antara satu ukuran tubuh dan ukuran berikutnya ' +
      'adalah antropometri umum yang ditetapkan penulis — bukan angka dari kepustakaan Bali mana pun. ' +
      'Kunci ini dipisahkan dari “tidak ada sumber” supaya perbedaannya terbaca di tabel.',
    kind: 'none',
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
  /* ── the body: how long a unit is ──────────────────────────────────── */

  hastaRatio: dim(0.25, 'ratio', 'interpolated', 'anthropometry', 'Panjang hasta — siku sampai ujung jari — dibanding depa. Seperempat rentang tangan adalah angka antropometri umum, bukan angka dari kepustakaan Bali. Yang bersumber adalah bahwa hasta itu ukuran tubuh pemiliknya; berapa perbandingannya adalah penetapan penulis.', 'Length of a hasta — elbow to fingertip — relative to a depa. A quarter of the arm span is ordinary anthropometry rather than a figure from the Balinese literature. What is sourced is that a hasta is a measure of the owner’s body; what the ratio is, is the author’s.'),
  mustiRatio: dim(0.075, 'ratio', 'interpolated', 'anthropometry', 'Panjang musti — kepalan dengan ibu jari melintang — dibanding depa. Antropometri penulis, sama seperti hasta.', 'Length of a musti — the closed fist with the thumb laid across — relative to a depa. The author’s anthropometry, as with the hasta.'),
  useranRatio: dim(0.0125, 'ratio', 'interpolated', 'anthropometry', 'Panjang useran — satu putaran ibu jari — dibanding depa. Ini juga besarnya pengurip, jadi angka inilah yang menentukan seberapa jauh rumah menyimpang dari kelipatan bulatnya.', 'Length of a useran — one rotation of the thumb — relative to a depa. It is also the size of the pengurip, so this figure is what sets how far the house departs from its own whole multiples.'),
  nyariRatio: dim(0.011, 'ratio', 'interpolated', 'anthropometry', 'Lebar satu jari dibanding depa.', 'Width of one finger relative to a depa.'),

  /* ── the set-out: how many units ───────────────────────────────────── */

  bayUnits: dim(1, 'count', 'interpolated', 'none', 'Jarak antar saka, dalam depa. Satu depa per ruang: cukup untuk orang berbaring melintangnya, yang memang kegunaan bale. Bahwa jaraknya diukur dalam depa itu kanon; bahwa satu, penetapan penulis.', 'Spacing between saka, in depa. One arm span per bay: enough for a person to lie across, which is what a bale is for. That the spacing is measured in depa is canon; that it is one, is the author’s.'),
  sakaHeightUnits: dim(5, 'count', 'interpolated', 'none', 'Tinggi saka, dalam hasta, diukur dari sendi sampai bawah balok. Lima hasta memberi kepala yang lega tanpa membuat bale terlihat seperti rumah.', 'Height of a saka, in hasta, from the sendi to the underside of the tie. Five hasta gives clear headroom without making the pavilion read as a house.'),
  bataranHeightUnits: dim(4, 'count', 'interpolated', 'none', 'Tinggi bataran, dalam musti. Panggungnya rendah — tempat duduk, bukan lantai atas — dan itulah yang membedakannya dari tiga rumah panggung di projek ini.', 'Height of the bataran, in musti. The platform is low — something to sit on rather than a storey — and that is what separates it from the three raised houses in this project.'),
  bataranOversailUnits: dim(2, 'count', 'interpolated', 'none', 'Seberapa jauh bataran menjorok di luar saka, dalam musti. Ada tepian untuk kaki di luar tiang, dan air dari atap jatuh di luar tepian itu.', 'How far the bataran stands outside the saka, in musti. There is a margin for a foot outside the posts, and the roof drops its water outside that margin.'),
  eaveOversailUnits: dim(2, 'count', 'interpolated', 'none', 'Seberapa jauh tepi atap melampaui bataran, dalam hasta. Inilah yang membuat bale terpakai saat hujan: bangunan tanpa dinding hanya kering sejauh atapnya menjangkau.', 'How far the eave reaches past the bataran, in hasta. This is what makes a bale usable in rain: a building with no walls is dry only as far as its roof reaches.'),
  ridgeRiseUnits: dim(6, 'count', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap, dalam hasta. Menentukan kemiringan, dan alang-alang menuntut kemiringan curam supaya air lekas turun. Mula-mula ditulis tiga hasta, yang memberi kemiringan 24° — catatan pada angka ini sudah mengatakan “curam” sementara angkanya tidak, dan siluetnya membacanya sebagai payung, bukan atap. Enam hasta memberi sekitar 42°.', 'Rise of the ridge above the eave, in hasta. It sets the pitch, and alang-alang needs a steep one so water leaves quickly. Written as three hasta first, which gives a pitch of 24° — this dimension’s own note already said “steep” while its value did not, and the silhouette read as an umbrella rather than a roof. Six hasta gives about 42°.'),
  deckHeightUnits: dim(2, 'count', 'interpolated', 'none', 'Tinggi bale-bale di dalam, dalam musti, di atas lantai bataran.', 'Height of the sitting platform inside, in musti, above the bataran paving.'),
  deckDepthUnits: dim(4, 'count', 'interpolated', 'none', 'Dalamnya bale-bale, dalam hasta — satu depa, cukup untuk orang berbaring melintangnya. Mula-mula dua hasta, 0,85 m, dan pada gambar bendanya terbaca sebagai rak dinding, bukan tempat orang duduk dan tidur. Bale-bale adalah kegunaan bangunan ini; membuatnya terlalu sempit untuk dipakai berarti membangun atap di atas ambalan.', 'Depth of the sitting platform, in hasta — one depa, enough for a person to lie across. Two hasta at first, 0.85 m, and in the render it read as a shelf rather than something to sit and sleep on. The bale-bale is what this building is for; making it too narrow to use is building a roof over a ledge.'),
  stepRiseUnits: dim(2, 'count', 'interpolated', 'none', 'Tinggi satu anak tangga naik ke bataran, dalam musti.', 'Rise of one step up to the bataran, in musti.'),

  /* ── stock sizes: sections and thicknesses, which take no pengurip ── */

  sakaSectionUnits: dim(8, 'count', 'interpolated', 'none', 'Sisi penampang saka, dalam jari. Ini ukuran batang, bukan ukuran tata letak, jadi tidak diberi pengurip — dan pemeriksaan modul menyatakan berapa panjang yang dikecualikannya karena alasan itu. Dinyatakan dalam jari dan bukan musti karena satu musti, 128 mm, membuat tiang setinggi 2,1 m terbaca sebagai lidi pada gambar; delapan jari memberi 150 mm. Batang diukur dengan jari — itu satuan yang dipakai orang untuk tebal, dan kelipatan bulatnya lebih rapat.', 'Section of a saka, in fingers. This is a size of timber rather than a set-out dimension, so it takes no pengurip — and the module check states how many lengths it excludes for that reason. Given in nyari rather than musti because one musti, 128 mm, makes a 2.1 m post read as a stick in the render; eight fingers gives 150 mm. Stock is measured in fingers — it is the unit a person reaches for when saying how thick a thing is, and its whole multiples are closer together.'),
  sunduSectionUnits: dim(3, 'count', 'interpolated', 'none', 'Tinggi penampang balok pengikat, dalam nyari.', 'Depth of a tie beam, in nyari.'),
  rafterSectionUnits: dim(2, 'count', 'interpolated', 'none', 'Sisi penampang kasau, dalam nyari.', 'Section of a rafter, in nyari.'),
  boardThicknessUnits: dim(1, 'count', 'interpolated', 'none', 'Tebal papan, dalam nyari.', 'Thickness of a board, in nyari.'),
  sendiHeightUnits: dim(2, 'count', 'interpolated', 'none', 'Tinggi sendi, batu tempat kaki saka duduk, dalam nyari.', 'Height of a sendi, the stone a saka foot seats on, in nyari.'),
  sendiWidthUnits: dim(2, 'count', 'interpolated', 'none', 'Lebar sendi dibanding sisi saka, dalam musti.', 'Width of a sendi relative to the saka section, in musti.'),
  stepWidthUnits: dim(4, 'count', 'interpolated', 'none', 'Lebar anak tangga, dalam musti.', 'Width of a step, in musti.'),
  stepDepthUnits: dim(3, 'count', 'interpolated', 'none', 'Dalamnya satu anak tangga, dalam musti.', 'Going of one step, in musti.'),
  murdaWidthUnits: dim(3, 'count', 'interpolated', 'none', 'Lebar tutup bubungan, dalam nyari.', 'Width of the ridge finish, in nyari.'),
  deckLegUnits: dim(1, 'count', 'interpolated', 'none', 'Sisi penampang kaki bale-bale, dalam musti.', 'Section of a deck leg, in musti.'),

  /* ── metres that are not set out in the body at all ────────────────── */

  raftersPerBay: dim(5, 'count', 'interpolated', 'none', 'Jumlah kasau di tiap ruang. Kerapatan reng, bukan ukuran tata letak.', 'Rafters in each bay. Batten spacing rather than a set-out dimension.'),
  thatchCourseDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis alang-alang. Lebih rapat daripada ijuk karena bahannya rumput, bukan serat.', 'Exposed depth of one course of alang-alang. Closer than ijuk because the material is grass rather than fibre.'),
  thatchThickness: dim(0.08, 'm', 'interpolated', 'none', 'Tebal satu lapis yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below it.'),
  thatchLap: dim(0.45, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course that the course above laps over.'),
  thatchBed: dim(0.04, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis pertama.', 'Clearance between the frame and the first course.'),
  murdaRise: dim(0.18, 'm', 'interpolated', 'none', 'Tinggi tutup bubungan di atas garis atap.', 'Height of the ridge finish above the roof line.'),
  batturFacing: dim(0.09, 'm', 'interpolated', 'none', 'Tebal lapisan paras yang membungkus badan bata bataran.', 'Thickness of the paras facing over the brick body of the bataran.'),
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan sendi tempat kaki saka duduk, sebagai bagian dari tinggi sendi.', 'Depth of the dish in the sendi that the saka foot seats into, as a share of its height.'),

  /* ── rules that are structure, not measurement ─────────────────────── */

  bodyMeasured: dim(1, 'count', 'canon', 'dwijendra-2008', 'Rumah diukur dengan tubuh pemiliknya: depa, hasta, musti, useran, jari. Ukurannya sendiri yang bersifat sosial — dua keluarga sederajat membangun bangunan yang berbeda karena tubuh mereka berbeda. Empat rumah lain di projek ini memilih angka; yang ini memilih satuannya.', 'The house is measured with its owner’s body: depa, hasta, musti, useran, finger. The unit itself is the social fact — two households of identical standing build different buildings because their bodies differ. The other four houses here select a number; this one selects the unit.'),
  penguripRule: dim(1, 'count', 'canon', 'dwijendra-2008', 'Ukuran pokok adalah kelipatan bulat satuan tubuh ditambah pengurip, karena ukuran yang tepat jatuh pada modulnya disebut mati. Rumah ini diwajibkan tidak persis sama dengan aturannya sendiri — dan itu satu-satunya aturan semacam itu dalam projek ini.', 'A principal measure is a whole number of body units plus a pengurip, because a measure landing exactly on its module is called mati — dead. This house is required not to be exactly its own rule, and that is the only rule of its kind in this project.'),
  triAngga: dim(3, 'count', 'canon', 'gelebet-1986', 'Tiga bagian tegak: bataran sebagai kaki, saka sebagai badan, atap sebagai kepala. Pembagian ini berlaku pada bangunan, pekarangan, dan desa dengan cara yang sama, dan di bangunan inilah ia paling langsung terbaca.', 'Three vertical parts: the bataran as foot, the saka as body, the roof as head. The division applies to a building, a compound and a village alike, and it is on the building that it reads most directly.'),
  nameIsCount: dim(1, 'count', 'canon', 'gelebet-1986', 'Nama bale adalah jumlah sakanya: sakepat empat, sakenem enam, sangasari sembilan, sakaroras dua belas. Satu-satunya aturan dalam projek ini yang kata dan angkanya adalah fakta yang sama, diucapkan sekali.', 'The name of a bale is the number of its saka: sakepat four, sakenem six, sangasari nine, sakaroras twelve. The only rule in this project where the word and the number are the same fact said once.'),
  openPavilion: dim(0, 'count', 'canon', 'budihardjo-1986', 'Bale terbuka pada sisi-sisinya: nol bidang dinding antara lantai dan tepi atap. Yang membuatnya bisa dipakai adalah jangkauan atap, bukan penutupnya — jadi ukuran yang menentukan kenyamanannya adalah panjang tritisan.', 'A bale is open on its sides: zero wall planes between the floor and the eave. What makes it usable is the reach of the roof rather than any enclosure — so the dimension that decides its comfort is the depth of the overhang.'),
  raisedOnBataran: dim(1, 'count', 'canon', 'gelebet-1986', 'Bangunan berdiri di atas bataran, panggung pasangan yang rendah. Bukan rumah panggung: tidak ada ruang di bawahnya, dan bataran itu adalah kaki dalam pembagian tiga.', 'The building stands on a bataran, a low masonry platform. Not a house on stilts: there is no space beneath it, and the bataran is the foot in the threefold division.'),
  seatedOnSendi: dim(1, 'count', 'canon', 'gelebet-1986', 'Kaki saka duduk di atas sendi, tidak ditanam — jadi rangkanya bisa dibongkar dan didirikan kembali.', 'A saka foot seats on its sendi and is not buried — so the frame can be taken apart and raised again.'),
  kajaKelod: dim(1, 'count', 'canon', 'eiseman-1990', 'Arah ditentukan sumbu kaja–kelod: kaja ke arah gunung, kelod ke arah laut. Ini bukan mata angin. Di Bali selatan kaja adalah utara; di Bali utara kaja adalah selatan — jadi arah hadap yang sama menghasilkan bujur yang berlawanan tergantung di sebelah mana gunung itu berdiri.', 'Orientation is set by the kaja–kelod axis: kaja toward the mountain, kelod toward the sea. It is not a compass direction. In south Bali kaja is north; in north Bali kaja is south — so the same rule gives opposite bearings depending on which side of the mountain you stand.'),
  hipRoof: dim(4, 'count', 'canon', 'gelebet-1986', 'Atap limas: empat bidang jatuh ke tepi atap yang menutup keliling, dan bubungannya lebih pendek daripada bangunannya. Pada bale bujur sangkar panjang bubungan itu menjadi nol dan atapnya menjadi limas sempurna — bentuknya mengikuti jumlah saka, bukan ditetapkan sendiri.', 'A hipped roof: four planes falling to an eave that closes all the way round, with a ridge shorter than the building. On a square bale that ridge length becomes zero and the roof becomes a true pyramid — the form follows from the number of saka rather than being declared.'),

  /* The site: the compound, which is the thing this house is one piece of. */
  walledCompound: dim(1, 'count', 'canon', 'gelebet-1986', 'Sebuah bale berdiri di dalam pekarangan bertembok bersama beberapa bale lain mengelilingi natah, dengan sanggah di sudut kaja-kangin. Bangunan tunggal adalah bagian; pekarangan itulah rumahnya.', 'A bale stands inside a walled compound with several others around the natah, with the shrine in the kaja-kangin corner. The single building is a part; the compound is the house.'),
  compoundSide: dim(22, 'm', 'interpolated', 'none', 'Sisi pekarangan bertembok. Bahwa ada pekarangan adalah kanon; ukurannya penetapan penulis.', 'Side of the walled compound. That there is a compound is canon; its size is the author’s.'),
  shrinePlan: dim(3, 'm', 'interpolated', 'none', 'Sisi denah sanggah di sudut kaja-kangin. Hanya jejaknya yang digambar.', 'Plan side of the shrine in the kaja-kangin corner. Only its footprint is drawn.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  bataran: 2.0,
  sendi: 0.5,
  saka: 1.5,
  sunduk: 1.2,
  lantai: 0.9,
  'iga-iga': 1.6,
  alang: 2.2,
  murda: 0.5,
}

export const PACK: RulePack<BaliKinds> = {
  key: 'bali',
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

/* ── The bale, named by its post count ────────────────────────────────── */

export interface BaleInfo {
  readonly bale: Bale
  readonly name: string
  readonly saka: number
  /** posts across X, front to rear */
  readonly rows: number
  /** posts along Z, the ridge axis */
  readonly cols: number
  readonly glossId: string
  readonly glossEn: string
}

/**
 * Rows × cols is the author's, and it is the one place the name does not
 * decide everything: nine saka is unambiguously three by three, but six could
 * be two by three or three by two, and twelve could be three by four or two by
 * six. The choices here keep the ridge running along Z in every case and keep
 * the plan from growing implausibly long, and the dimension note says so.
 */
export const BALE: readonly BaleInfo[] = [
  {
    bale: 'sakepat',
    name: 'Bale sakepat',
    saka: 4,
    rows: 2,
    cols: 2,
    glossId: 'Empat saka. Bale terkecil, satu ruang, denahnya bujur sangkar — dan karena bujur sangkar, bubungannya tidak punya panjang sama sekali dan atapnya menjadi limas sempurna. Bentuk itu tidak ditetapkan; ia jatuh dari jumlah saka.',
    glossEn: 'Four saka. The smallest bale, one bay, square in plan — and because it is square its ridge has no length at all and the roof becomes a true pyramid. That form is not declared; it falls out of the post count.',
  },
  {
    bale: 'sakenem',
    name: 'Bale sakenem',
    saka: 6,
    rows: 2,
    cols: 3,
    glossId: 'Enam saka, dua ruang memanjang. Bubungan mulai punya panjang, dan atapnya terbaca sebagai limas, bukan piramida.',
    glossEn: 'Six saka, two bays long. The ridge acquires a length, and the roof reads as a hip rather than a pyramid.',
  },
  {
    bale: 'sangasari',
    name: 'Bale sangasari',
    saka: 9,
    rows: 3,
    cols: 3,
    glossId: 'Sembilan saka, tiga kali tiga. Bujur sangkar lagi, dan piramida lagi — tetapi dua kali lebih besar daripada sakepat, jadi yang berubah bukan bentuknya melainkan ukurannya.',
    glossEn: 'Nine saka, three by three. Square again, and a pyramid again — but twice the size of the sakepat, so what changes is not the form but the reach.',
  },
  {
    bale: 'sakaroras',
    name: 'Bale gede (sakaroras)',
    saka: 12,
    rows: 3,
    cols: 4,
    glossId: 'Dua belas saka: bale gede, yang dipakai untuk upacara. Yang terbesar dan satu-satunya yang bubungannya cukup panjang untuk terbaca dari jauh sebagai bubungan.',
    glossEn: 'Twelve saka: the bale gede, the one used for ceremony. The largest, and the only one whose ridge is long enough to read as a ridge from a distance.',
  },
]

export function baleInfo(bale: Bale): BaleInfo {
  const found = BALE.find((b) => b.bale === bale)
  if (!found) throw new Error(`unknown bale: ${bale}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'bataran',
    title: 'Bataran',
    glossId: 'Panggung pasangan dibangun lebih dahulu, badan bata dibungkus paras. Ia kaki dari pembagian tiga, dan seluruh tata letak diukur dari permukaannya.',
    glossEn: 'The masonry platform goes up first, a brick body faced in paras. It is the foot of the threefold division, and the whole set-out is measured from its surface.',
  },
  {
    stage: 'sendi',
    title: 'Sendi',
    glossId: 'Batu sendi diletakkan di atas bataran, satu untuk tiap saka. Kaki tiang duduk di atasnya, tidak ditanam.',
    glossEn: 'The sendi stones are set on the bataran, one for each saka. The post feet seat on them; they are not buried.',
  },
  {
    stage: 'saka',
    title: 'Saka',
    glossId: 'Saka didirikan. Jumlahnya adalah nama bangunan ini — empat, enam, sembilan, dua belas — dan tinggi tiap batang adalah kelipatan bulat hasta pemiliknya, ditambah pengurip.',
    glossEn: 'The saka are raised. Their number is the name of this building — four, six, nine, twelve — and each one’s height is a whole number of its owner’s hasta, plus the pengurip.',
  },
  {
    stage: 'sunduk',
    title: 'Sunduk',
    glossId: 'Balok pengikat mengunci kepala saka menjadi satu rangka. Sampai balok terpasang, tiang-tiang hanya berdiri di atas batu.',
    glossEn: 'The ties lock the post heads into one frame. Until they are in, the posts are only standing on stones.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Bataran dipaving dan bale-bale dipasang di sisi kaja. Ini satu-satunya bidang di dalam bangunan, dan ia tempat duduk, bukan penyekat.',
    glossEn: 'The platform is paved and the sitting deck is laid on the kaja side. It is the only plane inside the building, and it is something to sit on rather than something that divides.',
  },
  {
    stage: 'iga-iga',
    title: 'Iga-iga',
    glossId: 'Bubungan, jurai dan kasau. Empat bidang jatuh ke tepi atap yang menutup keliling — dan pada bale bujur sangkar bubungannya menyusut menjadi satu titik.',
    glossEn: 'Ridge, hips and common rafters. Four planes fall to an eave that closes all the way round — and on a square bale the ridge shrinks to a point.',
  },
  {
    stage: 'alang',
    title: 'Alang-alang',
    glossId: 'Alang-alang dipasang dari tepi atap ke atas, tiap lapis menindih lapis di bawahnya. Rumput, bukan serat ijuk seperti dua rumah lain di sini.',
    glossEn: 'The alang-alang is laid from the eave upward, each course lapping the one below. Grass, not the black ijuk fibre two other houses here use.',
  },
  {
    stage: 'murda',
    title: 'Murda',
    glossId: 'Tutup bubungan dipasang terakhir, di tempat keempat bidang bertemu.',
    glossEn: 'The ridge finish goes on last, where the four planes meet.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { bale: 'sakaroras', depa: 1700, pengurip: true }

/**
 * The range of a human arm span, in millimetres.
 *
 * A range rather than a free number, and the bounds are people rather than
 * arithmetic: below about a metre and a half the owner is a child, and above
 * about two metres the depa is not an arm span any more. A slider that let the
 * module run to zero would produce a building that passed every check by
 * being infinitesimal.
 */
export const MIN_DEPA = 1500
export const MAX_DEPA = 1950

export function normaliseRules(rules: Rules): Rules {
  return {
    bale: rules.bale,
    depa: Math.min(MAX_DEPA, Math.max(MIN_DEPA, Math.round(rules.depa))),
    pengurip: rules.pengurip,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
