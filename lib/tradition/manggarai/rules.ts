/**
 * The rule pack for the mbaru niang.
 *
 * Same discipline as the other three and the same result: the sources describe
 * this building well in words and photographs and rarely in millimetres, so
 * nearly every metric value here is the author's. What the sources give is
 * structure — that the plan is round, that the thatch reaches the ground, that
 * there are five floors and what each is for, that the living floor is divided
 * into one segment per household, that a village has one niang gendang. Those
 * are `canon`. Nothing is `measured`.
 *
 * Two absences worth naming. There is no carving in this pack, because this
 * house does not carry any; every other pack has an `ukiran` and this one
 * would have to invent one. And there are only two rules, because there are
 * only two things a household says about itself here — the five floors are
 * canon, not a choice. Three rules apiece across three houses looked like the
 * shape of the project and turned out to be a coincidence of which three it
 * contained.
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
  ManggaraiKinds,
  Part,
  Peran,
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
    key: 'antar-2010',
    citation:
      'Antar, Y., Pesan dari Wae Rebo: Kelahiran Kembali Arsitektur Nusantara ' +
      '(Gramedia Pustaka Utama, Jakarta, 2010).',
    kind: 'reference',
  },
  {
    key: 'erb-1999',
    citation:
      'Erb, M., The Manggaraians: A Guide to Traditional Lifestyles ' +
      '(Times Editions, Singapore, 1999).',
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
    key: 'unesco-2012',
    citation:
      'UNESCO Asia-Pacific Awards for Cultural Heritage Conservation 2012, ' +
      'Award of Excellence: Wae Rebo Village, Flores.',
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
  /* the cone */
  baseRadius: dim(5.5, 'm', 'interpolated', 'none', 'Jari-jari tempat ijuk menyentuh tanah. Karena atap turun sampai ke tanah, angka ini sekaligus denah rumahnya: tidak ada dinding di luar atap.', 'Radius where the thatch meets the ground. Because the roof comes all the way down, this figure is also the plan of the house: there is no wall outside the roof.'),
  apexRise: dim(15.2, 'm', 'interpolated', 'none', 'Tinggi puncak kerucut di atas tanah. Bentuknya jauh lebih tinggi daripada lebarnya, dan justru perbandingan itulah yang membuatnya terbaca dari kejauhan.', 'Height of the cone’s apex above the ground. The form is far taller than it is wide, and that proportion is what makes it read from a distance.'),
  coneBelly: dim(0.09, 'ratio', 'interpolated', 'none', 'Seberapa jauh sisi kerucut menggembung ke luar dari garis lurus antara tanah dan puncak. Nilai sebelumnya, 0,055, hampir tak terlihat dan bentuknya terbaca sebagai kerucut geometris; ijuk yang bertumpuk lapis demi lapis membuat sisinya jelas melengkung. Bacaan penulis atas foto, bukan ukuran dari siapa pun.', 'How far the cone’s side bellies outward from a straight line between the ground and the apex. The previous figure, 0.055, was barely visible and the form read as a geometric cone; thatch laid course on course bows the side out noticeably. The author’s reading of photographs, not anyone’s measurement.'),
  coneShoulder: dim(0.85, 'ratio', 'interpolated', 'none', 'Seberapa tumpul bahu kerucut di dekat puncak. Nilai satu memberi kerucut lurus yang meruncing ke satu titik matematis; nilai kurang dari satu melebarkan bagian atasnya, karena ijuk menumpuk di sana dan tidak pernah berakhir sebagai jarum.', 'How blunt the cone’s shoulder is near the top. A value of one gives a straight cone tapering to a mathematical point; less than one widens the upper part, because thatch bunches there and never finishes as a needle.'),
  profileSteps: dim(24, 'count', 'interpolated', 'none', 'Titik pada garis luar kerucut. Ini kehalusan gambar, bukan ukuran bangunan.', 'Points along the cone’s outline. This is drawing resolution rather than a dimension of the building.'),
  facets: dim(48, 'count', 'interpolated', 'none', 'Sisi yang dituju pada keliling kerucut. Kehalusan gambar, bukan ukuran bangunan — tetapi jumlah sebenarnya dibulatkan ke kelipatan jumlah keluarga, karena jala yang tidak menghormati simetri rumahnya membuat model menyatakan simetri yang tidak dimilikinya.', 'Target facets around the cone. Drawing resolution rather than a dimension of the building — but the actual count is rounded to a multiple of the household count, because a mesh that does not respect the building’s symmetry makes the model claim a symmetry it does not have.'),

  /* the five floors */
  luturRise: dim(1.25, 'm', 'interpolated', 'none', 'Tinggi lantai hunian di atas tanah. Rumah ini berpanggung, tetapi kolongnya tertutup ijuk yang turun ke tanah, jadi dari luar tidak terlihat sebagai rumah panggung.', 'Height of the living floor above the ground. The house is raised, but the thatch closes the space beneath it, so from outside it does not read as a house on stilts.'),
  storeyRise: dim(2.45, 'm', 'interpolated', 'none', 'Jarak antar lantai. Sama untuk keempat lantai di atas lutur, sehingga jari-jari tiap lantai ditentukan oleh kerucut, bukan ditetapkan sendiri.', 'Distance between floors. The same for all four above the lutur, so each floor’s radius is set by the cone rather than declared on its own.'),
  floorThickness: dim(0.07, 'm', 'interpolated', 'none', 'Tebal lantai papan.', 'Thickness of a board floor.'),
  floorBoardWidth: dim(0.22, 'm', 'interpolated', 'none', 'Lebar satu papan lantai.', 'Width of one floor board.'),

  /* the frame */
  centrePostSection: dim(0.30, 'm', 'interpolated', 'none', 'Sisi penampang tiang tengah, yang berdiri dari tanah sampai puncak dan menjadi sumbu seluruh rumah.', 'Section of the centre post, which stands from the ground to the apex and is the axis the whole house is set out from.'),
  postSection: dim(0.19, 'm', 'interpolated', 'none', 'Sisi penampang tiang cincin.', 'Section of a ring post.'),
  postRadiusShare: dim(0.62, 'ratio', 'interpolated', 'none', 'Letak cincin tiang, sebagai bagian dari jari-jari dasar.', 'Where the ring of posts stands, as a share of the base radius.'),
  stoneHeight: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi batu tempat tiang berdiri.', 'Height of the stone a post stands on.'),
  stoneWidth: dim(0.40, 'm', 'interpolated', 'none', 'Lebar batu tempat tiang berdiri.', 'Width of the stone a post stands on.'),
  ringDepth: dim(0.13, 'm', 'interpolated', 'none', 'Tinggi penampang cincin pengikat yang menahan rangka tetap bundar.', 'Depth of a tie ring, the hoop that holds the frame round.'),
  ringWidth: dim(0.09, 'm', 'interpolated', 'none', 'Lebar penampang cincin pengikat.', 'Width of a tie ring.'),
  raftersPerSegment: dim(4, 'count', 'interpolated', 'none', 'Jumlah kasau di atas juring tiap keluarga. Jumlah kasau seluruhnya adalah angka ini dikali jumlah keluarga, bukan angka tersendiri — supaya tiap keluarga bernaung di bawah bagian atap yang sama banyaknya, dan supaya rumah benar-benar berulang setiap satu juring.', 'Rafters over each household’s segment. The total is this number times the household count rather than a figure of its own — so that every household stands under the same amount of roof, and so that the building actually repeats every one segment.'),
  rafterRadius: dim(0.05, 'm', 'interpolated', 'none', 'Jari-jari kasau.', 'Radius of a rafter.'),

  /* the partitions */
  partitionThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal sekat antar keluarga.', 'Thickness of a partition between households.'),
  partitionHeight: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi sekat di lantai lutur. Tidak sampai ke lantai di atasnya: pembagian ini menandai tempat tiap keluarga, bukan mengurungnya.', 'Height of a partition on the lutur floor. It does not reach the floor above: the division marks each household’s place rather than shutting it in.'),
  hearthRadius: dim(0.55, 'm', 'interpolated', 'none', 'Jari-jari tungku di tengah lantai lutur.', 'Radius of the hearth at the centre of the lutur floor.'),

  /* the thatch */
  thatchCourseDepth: dim(0.30, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis ijuk.', 'Exposed depth of one course of thatch.'),
  thatchThickness: dim(0.10, 'm', 'interpolated', 'none', 'Tebal satu lapis ijuk yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below it.'),
  thatchLap: dim(0.4, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course that the course above laps over.'),
  thatchBed: dim(0.05, 'm', 'interpolated', 'none', 'Jarak bebas antara rangka dan lapis ijuk pertama.', 'Clearance between the frame and the first course of thatch.'),

  /* the apex, and the drum */
  finialRise: dim(1.1, 'm', 'interpolated', 'none', 'Tinggi hiasan puncak di atas ujung kerucut. Bendanya nyata dan bernama; namanya tidak dicetak di sini karena penulis tidak cukup yakin akan kata itu.', 'Height of the apex ornament above the point of the cone. The object is real and has a name; the name is not printed here because the author is not confident enough of the word.'),
  doorWidth: dim(0.95, 'm', 'interpolated', 'none', 'Lebar pintu. Hanya ada satu, dan pintu itulah satu-satunya hal pada bangunan bundar ini yang menentukan arah.', 'Width of the door. There is only one, and it is the only thing on this round building that fixes a direction.'),
  doorHeight: dim(1.75, 'm', 'interpolated', 'none', 'Tinggi pintu, diukur dari tanah.', 'Height of the door, measured from the ground.'),
  jambSection: dim(0.13, 'm', 'interpolated', 'none', 'Sisi penampang kusen pintu.', 'Section of a door jamb.'),
  finialWaist: dim(0.55, 'ratio', 'interpolated', 'none', 'Pinggang hiasan puncak dibanding pangkalnya.', 'Waist of the apex ornament relative to its foot.'),
  finialWaistRise: dim(0.45, 'ratio', 'interpolated', 'none', 'Ketinggian pinggang itu, sebagai bagian dari tinggi hiasan.', 'Height of that waist, as a share of the ornament’s height.'),
  finialCollar: dim(0.12, 'ratio', 'interpolated', 'none', 'Ketinggian cincin di pangkal hiasan puncak.', 'Height of the ring round the foot of the apex ornament.'),
  centreStoneShare: dim(0.72, 'ratio', 'interpolated', 'none', 'Jari-jari batu tiang tengah dibanding lebar batu tiang cincin. Bundar, bukan persegi, karena batu di sumbu harus tetap sama ketika rumahnya diputar satu juring.', 'Radius of the centre post’s stone relative to the width of a ring post’s. Round rather than square, because a stone on the axis has to look the same after the house is turned by one segment.'),
  hearthDepth: dim(1.4, 'ratio', 'interpolated', 'none', 'Tebal tungku dibanding tebal lantai.', 'Depth of the hearth relative to the thickness of a floor.'),
  drumHang: dim(0.8, 'ratio', 'interpolated', 'none', 'Ketinggian gendang digantung, sebagai bagian dari tinggi sekat.', 'How high the drum hangs, as a share of the partition height.'),
  finialRadius: dim(0.34, 'm', 'interpolated', 'none', 'Lebar hiasan puncak.', 'Width of the apex ornament.'),
  gendangScale: dim(1.12, 'ratio', 'interpolated', 'none', 'Besar niang gendang dibanding rumah biasa. Bahwa rumah gendang adalah yang utama di kampung itu kanon; seberapa besar bedanya adalah penetapan penulis.', 'Size of the niang gendang relative to an ordinary house. That the drum house is the principal one in the village is canon; how much larger it is, is the author’s.'),
  drumRadius: dim(0.42, 'm', 'interpolated', 'none', 'Jari-jari gendang yang digantung di rumah gendang.', 'Radius of the drum hung in the drum house.'),
  drumLength: dim(1.15, 'm', 'interpolated', 'none', 'Panjang gendang.', 'Length of the drum.'),

  /* engagements */
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu tempat kaki tiang duduk, sebagai bagian dari tinggi batu.', 'Depth of the dish in the stone that the post foot seats into, as a share of stone height.'),
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  oneDoor: dim(1, 'count', 'canon', 'erb-1999', 'Satu pintu, menghadap compang — batu upacara di tengah kampung. Bentuk yang bundar tidak menyimpan arah apa pun pada dirinya sendiri, jadi satu-satunya arah yang dimiliki rumah ini datang dari tempat ia berdiri, dan pintu itulah yang menyatakannya.', 'One door, facing the compang — the ceremonial stone at the centre of the village. A round form holds no direction in itself, so the only orientation this house has comes from where it stands, and the door is what states it.'),
  roundInPlan: dim(1, 'ratio', 'canon', 'antar-2010', 'Denahnya bundar dan atapnya kerucut. Tidak ada bubungan, tidak ada muka, dan tidak ada sudut — dan karena itu tidak ada arah hadap yang bisa dibaca dari bentuknya sendiri.', 'The plan is round and the roof is a cone. There is no ridge, no face and no corner — and so no orientation that can be read off the form itself.'),
  thatchToGround: dim(1, 'ratio', 'canon', 'antar-2010', 'Ijuk turun sampai ke tanah. Dari luar seluruh bangunan adalah atap: tidak ada dinding dan tidak ada tepi atap yang berdiri di atas tanah.', 'The thatch comes down to the ground. From outside the whole building is roof: there is no wall and no eave standing above the ground.'),
  fiveLevels: dim(5, 'count', 'canon', 'erb-1999', 'Lima lantai bertumpuk, masing-masing bernama dan masing-masing untuk sesuatu — dari lantai hunian sampai loteng persembahan. Ini bukan pilihan, dan itulah sebabnya pak aturan ini hanya punya dua aturan.', 'Five stacked floors, each named and each for something — from the living floor up to the loft where offerings are kept. It is not a choice, which is why this pack has only two rules.'),
  segmentPerHousehold: dim(1, 'count', 'canon', 'erb-1999', 'Lantai lutur dibagi menyerupai juring, satu untuk tiap keluarga yang tinggal di dalamnya. Jumlah keluarga terbaca dari pembagian itu.', 'The lutur floor is divided into segments, one for each household living in it. The number of households is read off that division.'),
  oneGendang: dim(1, 'count', 'canon', 'antar-2010', 'Satu kampung punya satu niang gendang. Ia memegang gendang dan kehidupan adat kampung; sisanya rumah tinggal.', 'A village has one niang gendang. It holds the drum and the ceremonial life of the village; the rest are dwellings.'),
  centrePostThrough: dim(1, 'count', 'canon', 'depdikbud-ntt', 'Satu tiang tengah berdiri dari tanah sampai puncak dan menembus kelima lantai. Seluruh rumah diukur dari tiang itu.', 'A single centre post stands from the ground to the apex and passes through all five floors. The whole house is set out from it.'),
  noNails: dim(1, 'ratio', 'canon', 'unesco-2012', 'Sambungan pasak dan ikat; rangka disusun tanpa paku.', 'Pegged and lashed joints; the frame goes up without nails.'),
  seatedOnStone: dim(1, 'count', 'canon', 'unesco-2012', 'Tiang berdiri di atas batu, tidak ditanam.', 'The posts stand on stones; they are not buried.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  tiang: 1.7,
  pengikat: 1.2,
  lantai: 1.4,
  sekat: 0.8,
  'kerangka-atap': 1.6,
  ijuk: 2.2,
  puncak: 0.7,
}

export const PACK: RulePack<ManggaraiKinds> = {
  key: 'manggarai',
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

/* ── The role ─────────────────────────────────────────────────────────── */

export interface PeranInfo {
  readonly peran: Peran
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
  /** whether the drum hangs here */
  readonly drum: boolean
  readonly scale: number
}

export const PERAN: readonly PeranInfo[] = [
  {
    peran: 'gendang',
    name: 'Niang gendang',
    glossId: 'Rumah gendang: satu di tiap kampung. Ia memegang gendang dan kehidupan adat kampung, dan berdiri sedikit lebih besar daripada yang lain.',
    glossEn: 'The drum house: one to a village. It holds the drum and the village’s ceremonial life, and stands a little larger than the rest.',
    drum: true,
    scale: DIMS.gendangScale.value,
  },
  {
    peran: 'tinggal',
    name: 'Mbaru tinggal',
    glossId: 'Rumah tinggal. Bentuknya sama persis; yang tidak ada di dalamnya adalah gendang, dan ketiadaan itulah yang membedakannya.',
    glossEn: 'A dwelling house. The form is exactly the same; what is not inside it is the drum, and that absence is the difference.',
    drum: false,
    scale: 1,
  },
]

export function peranInfo(peran: Peran): PeranInfo {
  const found = PERAN.find((p) => p.peran === peran)
  if (!found) throw new Error(`unknown peran: ${peran}`)
  return found
}

/* ── The five levels ──────────────────────────────────────────────────── */

/**
 * Named from the living floor up. Every one of them is a store except the
 * first, and they ascend from what is eaten now to what is kept for the
 * ancestors — which is the building's argument, made in floors.
 */
export const LEVELS: readonly {
  key: string
  name: string
  glossId: string
  glossEn: string
}[] = [
  {
    key: 'lutur',
    name: 'lutur',
    glossId: 'Lantai hunian. Semua keluarga tinggal di sini, di juring masing-masing, mengelilingi tungku di tengah.',
    glossEn: 'The living floor. Every household lives here, each in its own segment, around the hearth at the centre.',
  },
  {
    key: 'lobo',
    name: 'lobo',
    glossId: 'Loteng untuk barang sehari-hari dan makanan yang sedang dipakai.',
    glossEn: 'The loft for everyday goods and the food in use.',
  },
  {
    key: 'lentar',
    name: 'lentar',
    glossId: 'Tempat menyimpan benih untuk musim tanam berikutnya.',
    glossEn: 'Where seed is kept for the next planting.',
  },
  {
    key: 'lempa-rae',
    name: 'lempa rae',
    glossId: 'Cadangan makanan untuk masa paceklik. Lantai yang hanya berguna bila tahun berikutnya buruk.',
    glossEn: 'The reserve of food against a bad season. A floor that only matters if the next year is poor.',
  },
  {
    key: 'hekang-kode',
    name: 'hekang kode',
    glossId: 'Yang paling atas: tempat sesaji bagi leluhur. Kelima lantai naik dari yang dimakan hari ini sampai yang dipersembahkan, dan urutan itulah isi bangunannya.',
    glossEn: 'The topmost: where offerings to the ancestors are kept. The five floors rise from what is eaten today to what is given, and that order is the content of the building.',
  },
]

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan lebih dahulu, di tengah dan pada lingkaran. Tiang berdiri di atasnya, tidak ditanam.',
    glossEn: 'The stones go down first, at the centre and around the ring. The posts stand on them; they are not buried.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang tengah lebih dahulu — ia berdiri sampai ke puncak dan menjadi sumbu seluruh rumah — lalu lingkaran tiang di sekelilingnya.',
    glossEn: 'The centre post first — it stands all the way to the apex and is the axis the house is set out from — then the ring of posts around it.',
  },
  {
    stage: 'kerangka-atap',
    title: 'Kerangka atap',
    glossId: 'Kasau disandarkan pada tiang tengah dan turun sampai ke tanah. Tidak ada bubungan untuk ditumpu: yang menahan bentuk adalah lingkaran.',
    glossEn: 'The rafters lean on the centre post and run all the way down to the ground. There is no ridge to bear on: what holds the shape is the circle.',
  },
  {
    stage: 'pengikat',
    title: 'Pengikat',
    glossId: 'Cincin pengikat menahan kasau tetap bundar, dan di cincin itulah kelima lantai kelak bertumpu. Di rumah persegi pekerjaan ini dilakukan balok lurus; di sini lingkaran itu sendiri yang harus dijaga.',
    glossEn: 'Hoops hold the rafters round, and it is on those hoops that the five floors will later bear. In a rectangular house straight beams do this work; here it is the circle itself that has to be kept.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lima lantai, dari lutur ke atas. Tiap lantai lebih kecil daripada yang di bawahnya karena kerucut menyempit, bukan karena ditetapkan begitu.',
    glossEn: 'Five floors, from the lutur upward. Each is smaller than the one below because the cone narrows, not because anyone decided so.',
  },
  {
    stage: 'sekat',
    title: 'Sekat',
    glossId: 'Sekat dipasang dari tiang tengah ke luar, satu batas untuk tiap keluarga. Jumlah keluarga terbaca dari jumlah juringnya.',
    glossEn: 'Partitions run from the centre post outward, one boundary for each household. The number of households is read off the number of segments.',
  },
  {
    stage: 'ijuk',
    title: 'Ijuk',
    glossId: 'Lapis ijuk dipasang dari tanah ke atas, tiap lapis menindih lapis di bawahnya, sampai seluruh bangunan tertutup atap.',
    glossEn: 'The courses are laid from the ground upward, each lapping the one below, until the whole building is roof.',
  },
  {
    stage: 'puncak',
    title: 'Puncak',
    glossId: 'Hiasan puncak dipasang terakhir, di ujung tiang tengah, tempat semua kasau bertemu.',
    glossEn: 'The apex ornament goes on last, at the head of the centre post where every rafter meets.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { peran: 'gendang', keluarga: 6 }

export const MIN_KELUARGA = 4
export const MAX_KELUARGA = 8

export function normaliseRules(rules: Rules): Rules {
  return {
    peran: rules.peran,
    keluarga: Math.min(MAX_KELUARGA, Math.max(MIN_KELUARGA, Math.round(rules.keluarga))),
  }
}

/**
 * A facet count that respects the building's own symmetry.
 *
 * A round house repeats every one segment, and a mesh sampled at some count
 * unrelated to that repeats at its own interval instead. With six households
 * and forty-eight facets the two agree by luck; with five or seven they do
 * not, and every vertex of every ring lands somewhere its rotated twin is not.
 * The radial check would then fail a house that is perfectly symmetric, or —
 * worse — a looser check would pass one that is not.
 */
export function facetsFor(keluarga: number, target: number): number {
  return keluarga * Math.max(1, Math.round(target / keluarga))
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
