/**
 * The rule pack for the rumah gadang.
 *
 * Same discipline as the Toraja pack and the same result: the sources
 * describe this building richly in words and almost never in millimetres, so
 * nearly every metric value here is the author's and is tagged as such. What
 * the sources do give is structure — that the ruang count is odd, that Koto
 * Piliang steps the end floors up and Bodi Caniago refuses to, that the walls
 * lean outward, that the bilik are a count of married daughters, that the
 * frame goes up without nails. Those are `canon`. Nothing is `measured`,
 * because no survey has been wired in for this house either.
 *
 * There is no rank scale in this pack, and its absence is a finding rather
 * than an omission. Every Toraja dimension passes through a single multiplier
 * set by rank, because there the social parameter governs size. Here the
 * social parameter governs *shape* — whether the floor steps — and size comes
 * from the plan counts directly. A shared `scale` in some future common
 * schema would have been the first thing the second house broke.
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
  Laras,
  Layout,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  MinangKinds,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'navis-1984',
    citation:
      'Navis, A. A., Alam Terkembang Jadi Guru: Adat dan Kebudayaan Minangkabau ' +
      '(Grafiti Pers, Jakarta, 1984).',
    kind: 'ethnography',
  },
  {
    key: 'vellinga-2004',
    citation:
      'Vellinga, M., Constituting Unity and Difference: Vernacular Architecture in a ' +
      'Minangkabau Village (KITLV Press, Leiden, 2004).',
    kind: 'ethnography',
  },
  {
    key: 'schefold-2003',
    citation:
      'Schefold, R., Domenig, G. & Nas, P. (eds), Indonesian Houses Vol. 1: Tradition and ' +
      'Transformation in Vernacular Architecture (KITLV Press, Leiden, 2003).',
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
    key: 'depdikbud-sumbar',
    citation:
      'Departemen Pendidikan dan Kebudayaan, Arsitektur Tradisional Daerah Sumatera Barat ' +
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
  ruangLength: dim(3.1, 'm', 'interpolated', 'none', 'Panjang satu ruang di sepanjang sumbu bubungan.', 'Length of one ruang along the ridge axis.'),
  lanjarDepth: dim(2.5, 'm', 'interpolated', 'none', 'Kedalaman satu lanjar, dari muka ke belakang.', 'Depth of one lanjar, front to rear.'),
  lanjarCount: dim(3, 'count', 'interpolated', 'none', 'Jumlah lanjar. Sumber menyebut lanjar sebagai pembagian ruang dalam, tetapi tidak menetapkan jumlahnya untuk rumah biasa, jadi angka ini milik penulis.', 'Number of lanjar. The sources name the lanjar as a division of the interior but do not fix a count for the ordinary house, so this number is the author’s.'),
  postSection: dim(0.20, 'm', 'interpolated', 'none', 'Sisi penampang tonggak.', 'Section of a tonggak, the underfloor post.'),
  padHeight: dim(0.25, 'm', 'interpolated', 'none', 'Tinggi batu sandi tempat tonggak berdiri.', 'Height of the batu sandi a post stands on.'),
  padDiameter: dim(0.46, 'm', 'interpolated', 'none', 'Lebar batu sandi.', 'Width of the batu sandi.'),

  /* the three heights */
  kolongHeight: dim(1.90, 'm', 'interpolated', 'none', 'Tinggi kolong, dari tanah ke rangka lantai.', 'Clear underfloor height, from the ground to the floor frame.'),
  wallHeight: dim(2.10, 'm', 'interpolated', 'none', 'Tinggi dinding di kaki, dari lantai ke balok tumpuan.', 'Height of the wall at its foot, from the deck to the wall plate.'),
  wallLean: dim(8, 'deg', 'interpolated', 'none', 'Sudut condong dinding ke luar. Sumber menyatakan dindingnya melebar ke atas; besar sudutnya tidak, jadi angka ini perkiraan penulis.', 'Outward lean of the wall. The sources state that the body widens toward the plate; none gives the angle, so this figure is the author’s.'),
  floorFrameDepth: dim(0.26, 'm', 'interpolated', 'none', 'Tinggi rasuak, balok rangka lantai.', 'Depth of a rasuak, the floor-frame beam.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor board.'),
  deckBoardWidth: dim(0.26, 'm', 'interpolated', 'none', 'Lebar satu papan lantai.', 'Width of one floor board.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan dinding dan papan sekat bilik.', 'Thickness of a wall board and of a bilik partition.'),
  anjuangRise: dim(0.42, 'm', 'interpolated', 'none', 'Tinggi naiknya lantai anjuang di atas lantai tengah. Adanya tingkat itu kanon; tingginya bukan.', 'How far the anjuang floor steps up above the main floor. That the step exists is canon; how high it is, is not.'),

  /* the roof */
  ridgeRise: dim(3.20, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas balok tumpuan, di tengah bentang.', 'Height of the ridge above the wall plate, at mid-span.'),
  ridgeSag: dim(0.42, 'm', 'interpolated', 'none', 'Turunnya garis bubungan di tengah bentang terhadap ujungnya.', 'How far the ridge line sags at mid-span relative to its ends.'),
  ridgeEndRise: dim(0.5, 'm', 'interpolated', 'none', 'Naiknya kedua ujung bubungan. Simetris: tidak seperti tongkonan, tak ada ujung yang lebih tinggi.', 'Rise of both ends of the ridge. Symmetric: unlike the tongkonan, neither end is the higher one.'),
  ridgeOverhang: dim(2.6, 'm', 'interpolated', 'none', 'Julur atap melewati ujung badan rumah. Di sinilah gonjong hidup, jadi julurnya dalam: tepi atap sudah meninggalkan rumah sebelum mulai naik, dan itulah sebabnya tampak muka masih punya garis tepi yang lurus.', 'How far the roof projects beyond the end of the body. This is where the gonjong lives, so the projection is deep: the roof edge has already left the house before it starts to climb, which is why the long façade still reads as a straight eave.'),
  ridgeUpsweep: dim(0.20, 'ratio', 'interpolated', 'none', 'Seberapa jauh lengkung bubungan melampaui titik kendali sebelum naik ke ujung; inilah yang membuat garis bubungan melengkung, bukan patah.', 'How far the ridge curve overshoots its control point before rising to the end; this is what makes the ridge a curve rather than a kink.'),
  gonjongRise: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi puncak gonjong di atas ujung bubungan. Puncaknya jauh lebih tinggi daripada ujung bubungan, dan lekuk di antara sepasang gonjong itulah siluet yang paling dikenali.', 'Height of a gonjong tip above the end of the ridge. The tips stand well above the ridge end, and the hollow between a pair of them is the most recognisable part of the silhouette.'),
  gonjongSplay: dim(0.58, 'ratio', 'interpolated', 'none', 'Letak puncak gonjong melintang, sebagai bagian dari setengah lebar atap. Sepasang gonjong berdiri lebar — pangkalnya di tepi atap dan puncaknya condong masuk — jadi jaraknya adalah sifat lebar atap, bukan panjang tersendiri. Bacaan penulis atas bentuknya; tak satu sumber pun memberi angkanya.', 'Where a gonjong tip stands across the roof, as a share of its half-width. A pair stands wide — footed at the roof edge and leaning inward toward the tips — so the separation is a property of how wide the roof is rather than a length of its own. The author’s reading of the form; no source gives the figure.'),
  gonjongReach: dim(0.12, 'ratio', 'interpolated', 'none', 'Sejauh mana ke dalam badan rumah kenaikan itu masuk, sebagai bagian dari setengah panjangnya. Nyaris seluruh lengkungan terjadi di luar rumah; sedikit masuk ke dalam hanya agar peralihannya bukan lipatan tepat di garis ujung. Nilai besar mengangkat tepi atap terlalu awal sehingga ujung atap sudah rata dengan bubungan sebelum mencapai dinding ujung, dan gable pun hilang.', 'How far the lift reaches back into the body, as a share of its half-length. Nearly all the curve happens outside the house; it encroaches slightly so the transition is not a crease on the gable line. A large value lifts the edge too early, so the roof has flattened to ridge height before it reaches the end wall and there is no gable left.'),
  gonjongSweep: dim(2.2, 'ratio', 'interpolated', 'none', 'Seberapa lambat tepi atap berbelok naik menjadi gonjong. Nilai satu memberi kenaikan lurus dari ujung badan rumah; nilai tinggi menahan tepi atap tetap mendatar lalu mengangkatnya dengan tajam di dekat puncak.', 'How late the roof edge turns upward into the gonjong. A value of one lifts it in a straight line from the end of the body; a high value holds the eave level and then raises it sharply near the tip.'),
  gonjongSparTaper: dim(0.25, 'ratio', 'interpolated', 'none', 'Penampang bilah tepi di puncak dibanding di pangkalnya. Inilah yang membuat ujungnya meruncing dan bukan terpotong.', 'Section of the verge member at the tip relative to its foot. This is what makes the point a point rather than a cut-off stub.'),
  gonjongSparRadius: dim(0.055, 'm', 'interpolated', 'none', 'Jari-jari bilah tepi yang membawa gonjong sampai ke puncaknya.', 'Radius of the verge member that carries the gonjong out to its point.'),
  eaveOversail: dim(1.35, 'm', 'interpolated', 'none', 'Julur atap melewati garis tonggak terluar, agar tetesan air jatuh bebas.', 'How far the eave oversails the outer post line, so the drip falls clear.'),
  eaveDrop: dim(0.90, 'm', 'interpolated', 'none', 'Turunnya tepi atap di bawah balok tumpuan.', 'How far the eave hangs below the wall plate.'),
  plateDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi balok tumpuan tempat kasau bertumpu.', 'Depth of the wall plate the rafters bear on.'),
  plateWidth: dim(0.16, 'm', 'interpolated', 'none', 'Lebar balok tumpuan.', 'Width of the wall plate.'),
  rafterWidth: dim(0.07, 'm', 'interpolated', 'none', 'Lebar penampang kasau.', 'Width of a rafter in section.'),
  rafterDepth: dim(0.11, 'm', 'interpolated', 'none', 'Tinggi penampang kasau.', 'Depth of a rafter in section.'),
  raftersPerRuang: dim(3, 'count', 'interpolated', 'none', 'Jumlah kasau tiap ruang, tiap sisi.', 'Number of rafters per ruang, per side.'),
  raftersAtEnds: dim(4, 'count', 'interpolated', 'none', 'Tambahan kasau di luar hitungan per ruang, untuk kedua ujung yang menjulur.', 'Rafters added beyond the per-ruang count, for the two projecting ends.'),
  ridgeBeamRadius: dim(0.08, 'm', 'interpolated', 'none', 'Jari-jari balok bubungan.', 'Radius of the ridge beam.'),
  purlinRadius: dim(0.045, 'm', 'interpolated', 'none', 'Jari-jari gording bambu.', 'Radius of a bamboo purlin.'),
  purlinAboveKnee: dim(0.5, 'ratio', 'interpolated', 'none', 'Letak gording atas, sebagai bagian dari jarak bubungan ke patahan atap.', 'Position of the upper purlin, as a share of the run from ridge to the roof break.'),
  purlinBelowKnee: dim(0.55, 'ratio', 'interpolated', 'none', 'Letak gording bawah, sebagai bagian dari jarak patahan ke tepi atap.', 'Position of the lower purlin, as a share of the run from the break to the eave.'),
  sheathingOffset: dim(0.6, 'ratio', 'interpolated', 'none', 'Tinggi papan atap di atas sumbu kasau, sebagai bagian dari tinggi kasau.', 'How far the roof boarding sits above the rafter axis, as a share of rafter depth.'),
  ijukBedClearance: dim(0.02, 'm', 'interpolated', 'none', 'Jarak bebas antara papan atap dan lapis ijuk pertama.', 'Clearance between the roof boarding and the first ijuk course.'),
  ijukCourseDepth: dim(0.32, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis ijuk.', 'Exposed depth of one ijuk course.'),
  ijukThickness: dim(0.10, 'm', 'interpolated', 'none', 'Tebal satu lapis ijuk yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below it.'),
  ijukLap: dim(0.40, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course that the course above laps over.'),
  singokThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan singok, bidang segitiga di ujung atap.', 'Thickness of the singok, the triangular board closing the gable end.'),

  /* engagements */
  sillWidth: dim(0.9, 'ratio', 'interpolated', 'none', 'Lebar rasuak, sebagai bagian dari sisi tonggak.', 'Width of a rasuak, as a share of the post section.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu sandi tempat kaki tonggak duduk, sebagai bagian dari tinggi batu.', 'Depth of the dish in the batu sandi that the post foot seats into, as a share of stone height.'),
  tenonRun: dim(0.7, 'ratio', 'interpolated', 'none', 'Sejauh mana kepala tonggak masuk ke dalam rasuak, sebagai bagian dari tinggi rasuak.', 'How far a post head runs up into the floor frame, as a share of frame depth.'),
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  orientation: dim(0, 'deg', 'canon', 'navis-1984', 'Muka rumah menghadap halaman, dengan rangkiang berjajar di seberangnya. Aturannya bersifat hubungan, bukan arah mata angin — dan di sinilah rumah gadang berbeda dari tongkonan, yang menghadap utara.', 'The front faces the halaman, with the rangkiang ranged across it. The rule is relational rather than a compass bearing — and this is where the rumah gadang differs from the tongkonan, which faces north.'),
  ruangIsOdd: dim(1, 'count', 'canon', 'navis-1984', 'Jumlah ruang selalu ganjil: tiga, lima, tujuh, sembilan.', 'The ruang count is always odd: three, five, seven, nine.'),
  anjuangKotoPiliang: dim(1, 'ratio', 'canon', 'navis-1984', 'Pada laras Koto Piliang lantai kedua ujung dinaikkan menjadi anjuang; pada Bodi Caniago lantainya satu bidang rata. Perbedaan adat itu terbaca pada ketinggian lantai.', 'Under the Koto Piliang laras the floor at both ends is raised into anjuang; under Bodi Caniago the floor is one level plane. The difference in adat is legible as a difference in floor height.'),
  gonjongBase: dim(4, 'count', 'canon', 'depdikbud-sumbar', 'Bentuk dasar bergonjong empat: satu di tiap sudut atap, tempat tepi atap terangkat menjadi puncak.', 'The base form carries four gonjong: one at each corner of the roof, where the eave lifts into a point.'),
  bilikAreTally: dim(1, 'count', 'canon', 'waterson-1990', 'Bilik bertambah seiring anak perempuan menikah; jumlahnya adalah catatan pertumbuhan garis ibu.', 'A bilik is added as each daughter marries; their number is a record of how the matriline has grown.'),
  bilikFillOrder: dim(1, 'ratio', 'interpolated', 'none', 'Bilik terisi berurutan dari satu ujung tanpa selang. Bahwa bilik bertambah satu per satu adalah kanon; arah pengisiannya dan ketiadaan selang adalah penetapan penulis, dan itulah sebabnya rumah ini tidak simetris pada sekat-sekatnya.', 'The bilik fill sequentially from one end with no gaps. That they are added one at a time is canon; the direction of fill and the absence of gaps are the author’s, and they are why this house is not symmetric in its partitions.'),
  wallsLeanOut: dim(1, 'ratio', 'canon', 'schefold-2003', 'Dinding badan rumah condong ke luar, melebar ke arah balok tumpuan.', 'The body walls lean outward, widening toward the wall plate.'),
  noNails: dim(1, 'ratio', 'canon', 'schefold-2003', 'Sambungan pasak; rangka disusun tanpa paku.', 'Pegged joints; the frame goes up without nails.'),
  postsOnGrid: dim(1, 'count', 'canon', 'depdikbud-sumbar', 'Tonggak berdiri pada kisi ruang dan lanjar, simetris terhadap bidang tengah melintang.', 'The posts stand on the grid of ruang and lanjar, symmetric about the transverse mid-plane.'),

  /* The site: the rangkiang, which are the other half of the orientation rule. */
  rangkiangOpposite: dim(1, 'count', 'canon', 'navis-1984', 'Rangkiang berdiri di seberang halaman menghadap rumah gadang. Kendala hadap rumah ini bersifat hubungan, bukan mata angin — dan inilah benda yang dihadapinya, jadi tanpa rangkiang aturan itu tidak menyebut apa pun.', 'The rangkiang stand across the halaman facing the rumah gadang. This house’s orientation constraint is relational rather than compass-bound — and these are what it is relative to, so without them the rule says nothing.'),
  halamanDepth: dim(10, 'm', 'interpolated', 'none', 'Lebar halaman antara rumah dan rangkiang.', 'Width of the halaman between the house and the rangkiang.'),
  rangkiangPlan: dim(3, 'm', 'interpolated', 'none', 'Sisi denah satu rangkiang. Hanya jejaknya yang digambar: rangkiang tidak dimodelkan, dan itu sudah dinyatakan sebagai kekurangan.', 'Plan side of one rangkiang. Only the footprint is drawn: the rangkiang are not modelled, and that is already stated as an absence.'),
  rangkiangSpacing: dim(5, 'm', 'interpolated', 'none', 'Jarak antar rangkiang sepanjang halaman.', 'Spacing between rangkiang along the halaman.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

/**
 * Relative durations of the ten stages. Not proportional to part count: the
 * gonjong are four sticks and they are the moment the house becomes a rumah
 * gadang, so they get their own beat.
 */
const STAGE_WEIGHT: Record<Stage, number> = {
  'batu-sandi': 0.6,
  tonggak: 1.6,
  rasuak: 1.1,
  lantai: 0.7,
  anjuang: 0.6,
  dindiang: 1.0,
  bilik: 0.8,
  'rangka-atap': 1.7,
  gonjong: 1.0,
  ijuk: 2.0,
}

export const PACK: RulePack<MinangKinds> = {
  key: 'minang',
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

/* ── Laras ────────────────────────────────────────────────────────────── */

export interface LarasInfo {
  readonly laras: Laras
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
  /** whether the floor steps up at both ends */
  readonly anjuang: boolean
  /**
   * How many gonjong the roof carries. Four under both laras, for now.
   *
   * Houses with anjuang are commonly said to carry more, and the extra ones
   * belong to a roof over the projecting bay rather than to the main ridge —
   * a bay this model does not build. The first attempt stood the extra pair on
   * the middle of the ridge, which is a shape nobody builds, so it is four
   * until the bay is modelled and the gap is recorded rather than filled.
   */
  readonly gonjong: number
}

export const LARAS: readonly LarasInfo[] = [
  {
    laras: 'koto-piliang',
    name: 'Koto Piliang',
    glossId: 'Laras berjenjang naik. Lantai kedua ujung dinaikkan menjadi anjuang, tempat duduk yang berpangkat.',
    glossEn: 'The tiered laras. The floor at both ends is raised into anjuang, where those holding rank sit.',
    anjuang: true,
    gonjong: DIMS.gonjongBase.value,
  },
  {
    laras: 'bodi-caniago',
    name: 'Bodi Caniago',
    glossId: 'Laras duduk sama rendah. Lantainya satu bidang rata, dan ketiadaan tingkat itulah pernyataannya.',
    glossEn: 'The laras of sitting at one level. The floor is a single plane, and the absence of a step is the statement.',
    anjuang: false,
    gonjong: DIMS.gonjongBase.value,
  },
]

export function larasInfo(laras: Laras): LarasInfo {
  const found = LARAS.find((l) => l.laras === laras)
  if (!found) throw new Error(`unknown laras: ${laras}`)
  return found
}

/* ── Names ────────────────────────────────────────────────────────────── */

/**
 * Ruang run end to end along the ridge. Under Koto Piliang the two end ruang
 * are the anjuang and are named for what they are; under Bodi Caniago they
 * are ruang like any other, which is the whole of the difference.
 */
export function ruangNames(rules: Rules): readonly string[] {
  const anjuang = larasInfo(rules.laras).anjuang
  return Array.from({ length: rules.ruang }, (_, i) => {
    if (anjuang && (i === 0 || i === rules.ruang - 1)) return 'anjuang'
    return `ruang ${i + 1}`
  })
}

/** Lanjar run front to rear. The rear one carries the bilik. */
export function lanjarNames(lanjar: number): readonly string[] {
  if (lanjar <= 2) return ['labuah gajah', 'lanjar bilik']
  const middle = Array.from({ length: lanjar - 2 }, () => 'ruang tangah')
  return ['labuah gajah', ...middle, 'lanjar bilik']
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu-sandi',
    title: 'Batu sandi',
    glossId: 'Batu diletakkan lebih dahulu. Tonggak berdiri di atasnya, tidak ditanam.',
    glossEn: 'The pad stones go down first. The posts stand on them; they are not buried.',
  },
  {
    stage: 'tonggak',
    title: 'Tonggak',
    glossId: 'Tonggak didirikan pada kisi ruang dan lanjar.',
    glossEn: 'The posts are raised on the grid of ruang and lanjar.',
  },
  {
    stage: 'rasuak',
    title: 'Rasuak',
    glossId: 'Balok memanjang dan melintang mengunci kepala tonggak.',
    glossEn: 'Beams along and across lock the post heads together.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Papan lantai menutup rangka.',
    glossEn: 'The deck closes the frame.',
  },
  {
    stage: 'anjuang',
    title: 'Anjuang',
    glossId: 'Lantai kedua ujung dinaikkan. Pada laras Bodi Caniago tahap ini tidak ada sama sekali, dan justru itulah pernyataannya.',
    glossEn: 'The floor at both ends is raised. Under the Bodi Caniago laras this stage does not happen at all, and that is precisely the statement.',
  },
  {
    stage: 'dindiang',
    title: 'Dindiang',
    glossId: 'Papan dinding dipasang condong ke luar; badan rumah melebar ke atas.',
    glossEn: 'The wall boards go up leaning outward; the body widens as it rises.',
  },
  {
    stage: 'bilik',
    title: 'Bilik',
    glossId: 'Sekat bilik dipasang di lanjar belakang, satu untuk tiap anak perempuan yang menikah.',
    glossEn: 'The partitions go into the rear lanjar, one for each daughter who has married.',
  },
  {
    stage: 'rangka-atap',
    title: 'Rangka atap',
    glossId: 'Bubungan, kasau, gording, dan singok. Bentuk atap muncul di sini, bukan digambar.',
    glossEn: 'Ridge, rafters, purlins and the gable singok. The roof shape appears here; it is not drawn.',
  },
  {
    stage: 'gonjong',
    title: 'Gonjong',
    glossId: 'Gonjong dipasang di kedua ujung bubungan, dan di atas anjuang bila ada.',
    glossEn: 'The gonjong are set at both ends of the ridge, and over the anjuang where there are any.',
  },
  {
    stage: 'ijuk',
    title: 'Ijuk',
    glossId: 'Lapis ijuk dipasang dari tepi ke atas, tiap lapis menindih lapis di bawahnya.',
    glossEn: 'The courses are laid from the eave upward, each lapping the one below.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { laras: 'koto-piliang', ruang: 5, bilik: 3 }

/** The most bilik any house here will hold: the interior ruang of a nine-ruang house. */
export const MAX_BILIK = 7

/**
 * Clamp to the declared ranges. The generator refuses to invent a house.
 *
 * The ruang count is forced odd rather than merely clamped, because odd is a
 * rule and not a preference — a four-ruang rumah gadang is not an unusual
 * house, it is a different thing. Compare the tongkonan, where an unusual bay
 * count for the rank is allowed and simply reported as unusual.
 */
export function normaliseRules(rules: Rules): Rules {
  let ruang = Math.min(9, Math.max(3, Math.round(rules.ruang)))
  if (ruang % 2 === 0) ruang -= 1
  const bilik = Math.min(ruang - 2, Math.max(0, Math.round(rules.bilik)))
  return { laras: rules.laras, ruang, bilik }
}

/** Every Dim that fed a given layout. Nothing rank-scaled: this pack has no rank. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
