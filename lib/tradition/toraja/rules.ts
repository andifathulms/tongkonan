/**
 * The rule pack.
 *
 * A tongkonan is not a shape. It is a rule system, and this file is the
 * system: what rank permits, what a bay count means, and every dimension the
 * geometry is derived from — each one tagged with where it came from.
 *
 * On tagging honestly: the metric values here are almost all `interpolated`.
 * The sources describe the building richly in words and photographs and very
 * rarely in millimetres, so a number that sounds plausible is still the
 * author's. What the sources *do* give is structure — that the house faces
 * north, that the body divides into named bays, that the ridge sags and both
 * prows rise, that the horns are a tally. Those are tagged `canon`. Nothing
 * here is `measured`, because no survey has been wired in yet.
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
  Rank,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
  TorajaKinds,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'kis-jovak-1988',
    citation:
      "Kis-Jovak, J. I., Nooy-Palm, H., Schefold, R. & Schulz-Dornburg, U., " +
      "Banua Toraja: Changing Patterns in Architecture and Symbolism among the Sa'dan Toraja " +
      '(Royal Tropical Institute, Amsterdam, 1988).',
    kind: 'survey',
  },
  {
    key: 'waterson-1990',
    citation:
      'Waterson, R., The Living House: An Anthropology of Architecture in South-East Asia ' +
      '(Oxford University Press, Singapore, 1990).',
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
    key: 'nooy-palm-1979',
    citation:
      "Nooy-Palm, H., The Sa'dan-Toraja: A Study of Their Social Life and Religion, Vol. 1 " +
      '(Martinus Nijhoff, The Hague, 1979).',
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
  // The table is exhaustive over SourceKey; this is the type-checker's price
  // for `find` rather than a real branch.
  if (!found) throw new Error(`unknown source key: ${key}`)
  return found
}

/* ── Dimensions ───────────────────────────────────────────────────────── */

/**
 * Bound to this tradition's source keys, so a Toraja dimension cannot cite a
 * source table it does not appear in.
 */
const dim = dimFactory<SourceKey>()

/**
 * Base dimensions, before rank scales them. Keys are stable and are what
 * /sumber lists.
 */
export const DIMS = {
  /* body */
  bayLength: dim(3.0, 'm', 'interpolated', 'none', 'Panjang satu ruang di sepanjang sumbu utara–selatan.', 'Length of one bay along the north–south axis.'),
  bodyWidth: dim(4.2, 'm', 'interpolated', 'none', 'Lebar badan rumah, dari dinding ke dinding.', 'Width of the body, wall to wall.'),
  postSection: dim(0.18, 'm', 'interpolated', 'none', "Sisi penampang a'riri, tiang persegi.", "Section of an a'riri, the square underfloor post."),
  padHeight: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi batu umpak tempat tiang berdiri.', 'Height of the pad stone a post stands on.'),
  padDiameter: dim(0.42, 'm', 'interpolated', 'none', 'Lebar batu umpak.', 'Width of the pad stone.'),

  /* the three vertical zones */
  kolongHeight: dim(2.15, 'm', 'interpolated', 'none', 'Tinggi kolong (sulluk banua), dari tanah ke rangka lantai.', 'Clear underfloor height — the sulluk banua — from the ground to the floor frame.'),
  wallHeight: dim(1.95, 'm', 'interpolated', 'none', 'Tinggi dinding kale banua, dari lantai ke balok tumpuan.', 'Height of the kale banua wall, from the deck to the wall plate.'),
  floorFrameDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi balok rangka lantai.', 'Depth of the floor frame members.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor board.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),

  /* roof */
  ridgeRise: dim(2.95, 'm', 'interpolated', 'none', 'Tinggi punggung atap di atas balok tumpuan, di tengah bentang.', 'Height of the ridge above the wall plate, at mid-span.'),
  ridgeSag: dim(0.55, 'm', 'interpolated', 'none', 'Turunnya garis punggung di tengah bentang terhadap ujung.', 'How far the ridge line sags at mid-span relative to its ends.'),
  frontProwRise: dim(2.6, 'm', 'interpolated', 'none', 'Naiknya haluan depan di atas titik terendah punggung.', 'Rise of the front prow above the lowest point of the ridge.'),
  rearProwRise: dim(2.1, 'm', 'interpolated', 'none', 'Naiknya haluan belakang; selalu lebih rendah dari depan.', 'Rise of the rear prow; always lower than the front.'),
  prowOverhang: dim(3.0, 'm', 'interpolated', 'none', 'Julur haluan melewati ujung badan rumah.', 'How far each prow projects beyond the end of the body.'),
  eaveOversail: dim(1.5, 'm', 'interpolated', 'none', 'Julur atap melewati garis tiang terluar, agar tetesan air jatuh bebas.', 'How far the eave oversails the outer post line, so the drip falls clear.'),
  eaveDrop: dim(1.0, 'm', 'interpolated', 'none', 'Turunnya tepi atap di bawah balok tumpuan.', 'How far the eave hangs below the wall plate.'),
  roofKneeDrop: dim(0.70, 'ratio', 'interpolated', 'none', 'Bagian dari seluruh turunnya atap yang sudah tercapai di garis dinding. Di sinilah atap berpatah: curam di atas, melandai ke tepi.', "The share of the roof's total drop already reached at the wall line. This is where the roof breaks: steep above, shallower out to the eave."),
  plateDepth: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi balok tumpuan tempat kasau bertumpu.', 'Depth of the wall plate the rafters bear on.'),
  plateWidth: dim(0.16, 'm', 'interpolated', 'none', 'Lebar balok tumpuan.', 'Width of the wall plate.'),
  ijukCourseDepth: dim(0.34, 'm', 'interpolated', 'none', 'Tinggi tampak satu lapis ijuk.', 'Exposed depth of one ijuk course.'),
  ijukThickness: dim(0.11, 'm', 'interpolated', 'none', 'Tebal satu lapis ijuk yang menonjol dari lapis di bawahnya.', 'How far a course stands proud of the one below it.'),
  ijukLap: dim(0.4, 'ratio', 'interpolated', 'none', 'Bagian lapis yang tertindih lapis di atasnya.', 'The share of a course that the course above laps over.'),

  /* tulak somba and horns */
  tulakSombaSection: dim(0.40, 'm', 'interpolated', 'none', 'Sisi penampang tulak somba, tiang penyangga haluan depan.', 'Section of the tulak somba, the post carrying the front prow.'),
  hornSpacing: dim(0.42, 'm', 'interpolated', 'none', 'Jarak vertikal antar tanduk pada tulak somba.', 'Vertical spacing between horns on the tulak somba.'),
  hornSpread: dim(0.95, 'm', 'interpolated', 'none', 'Rentang tanduk kerbau dari ujung ke ujung. Angka sebelumnya, 0,62 m, ada di ujung bawah kisaran seekor tedong dan terlalu kecil untuk dihitung dari halaman — padahal dapat dihitung itulah seluruh fungsinya. Tetap perkiraan penulis; yang berubah adalah alasannya.', 'Spread of a buffalo horn, tip to tip. The previous figure, 0.62 m, sat at the small end of the range for a tedong and was too small to count from the courtyard — and being countable is the whole function. Still the author’s figure; what changed is the reasoning behind it.'),

  /*
   * Members and engagements.
   *
   * These were bare literals in frame.ts and roof.ts until the pedagogy pass
   * found them. Every one of them sizes or places something a reader can see,
   * which is the test for whether a number is a dimension — and a dimension
   * that is not declared here does not appear on /sumber, is not counted in
   * the provenance bar, and is therefore a guess the app was making while
   * telling the reader it declares all of them.
   *
   * They are all interpolated with no source, because that is what they are.
   * Declaring them makes the bar worse, which is the correct direction.
   */
  rafterWidth: dim(0.07, 'm', 'interpolated', 'none', 'Lebar penampang kasau.', 'Width of a rafter in section.'),
  rafterDepth: dim(0.11, 'm', 'interpolated', 'none', 'Tinggi penampang kasau.', 'Depth of a rafter in section.'),
  raftersAtProws: dim(4, 'count', 'interpolated', 'none', 'Tambahan kasau di luar hitungan per ruang, untuk kedua haluan.', 'Rafters added beyond the per-bay count, for the two prows.'),
  ridgeBeamRadius: dim(0.075, 'm', 'interpolated', 'none', 'Jari-jari balok punggung.', 'Radius of the ridge beam.'),
  purlinRadius: dim(0.045, 'm', 'interpolated', 'none', 'Jari-jari gording bambu.', 'Radius of a bamboo purlin.'),
  purlinAboveKnee: dim(0.5, 'ratio', 'interpolated', 'none', 'Letak gording atas, sebagai bagian dari jarak punggung ke patahan atap.', 'Position of the upper purlin, as a share of the run from ridge to the roof break.'),
  purlinBelowKnee: dim(0.55, 'ratio', 'interpolated', 'none', 'Letak gording bawah, sebagai bagian dari jarak patahan ke tepi atap.', 'Position of the lower purlin, as a share of the run from the break to the eave.'),
  sheathingOffset: dim(0.6, 'ratio', 'interpolated', 'none', 'Tinggi papan atap di atas sumbu kasau, sebagai bagian dari tinggi kasau.', 'How far the roof boarding sits above the rafter axis, as a share of rafter depth.'),
  ijukBedClearance: dim(0.02, 'm', 'interpolated', 'none', 'Jarak bebas antara papan atap dan lapis ijuk pertama.', 'Clearance between the roof boarding and the first ijuk course.'),
  deckBoardWidth: dim(0.26, 'm', 'interpolated', 'none', 'Lebar satu papan lantai.', 'Width of one floor board.'),
  sillWidth: dim(0.9, 'ratio', 'interpolated', 'none', 'Lebar balok rangka lantai, sebagai bagian dari sisi tiang.', 'Width of a floor-frame member, as a share of the post section.'),
  postSeat: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya cekungan batu umpak tempat kaki tiang duduk, sebagai bagian dari tinggi batu.', 'Depth of the dish in the pad stone that the post foot seats into, as a share of stone height.'),
  tenonRun: dim(0.7, 'ratio', 'interpolated', 'none', 'Sejauh mana kepala tiang masuk ke dalam rangka lantai, sebagai bagian dari tinggi rangka. Pen harus menembus cukup dalam agar pasak punya kayu di kedua sisi.', 'How far a post head runs up into the floor frame, as a share of frame depth. The tenon has to run deep enough that the peg has timber on both sides of it.'),
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* the ridge curve and the prows */
  ridgeUpsweep: dim(0.17, 'ratio', 'interpolated', 'none', 'Seberapa jauh lengkung punggung melampaui titik kendali sebelum naik ke haluan. Inilah yang membuat garis punggung melengkung, bukan patah.', 'How far the ridge curve overshoots its control point before rising to the prow. This is what makes the ridge line a curve rather than a kink.'),
  tipFraction: dim(0.055, 'ratio', 'interpolated', 'none', 'Bagian ujung haluan yang meruncing menjadi bilah.', 'The share of each prow that tapers into a blade.'),
  tulakSombaSet: dim(0.45, 'ratio', 'interpolated', 'none', "Letak tulak somba di sepanjang julur haluan. Tiang berdiri di tempat momen kantilever memerlukannya, bukan di ujungnya.", 'Where the tulak somba stands along the prow overhang. The post goes where the cantilever needs it, not at the tip.'),

  /* horns */
  hornColumnFoot: dim(0.6, 'm', 'interpolated', 'none', 'Tinggi terendah tanduk terbawah di atas tanah.', 'How low the bottom horn hangs above the ground.'),
  hornTaper: dim(0.78, 'ratio', 'interpolated', 'none', 'Ukuran tanduk terbawah dibanding yang teratas; yang tertua di atas.', 'Size of the lowest horn relative to the topmost; the oldest are at the top.'),

  /* rules that are structure, not measurement */
  orientation: dim(0, 'deg', 'canon', 'nooy-palm-1979', 'Rumah membujur utara–selatan; muka (ulunna banua) menghadap utara.', 'The house lies north–south; the front, ulunna banua, faces north.'),
  bayCountCommon: dim(3, 'count', 'canon', 'waterson-1990', "Pembagian umum badan rumah: tangdo', sali, sumbung.", "The common division of the body: tangdo', sali, sumbung."),
  ridgeSags: dim(1, 'ratio', 'canon', 'kis-jovak-1988', 'Garis punggung melengkung turun di tengah, kedua haluan naik.', 'The ridge line sags in the middle and both prows rise.'),
  frontHigher: dim(1, 'ratio', 'canon', 'kis-jovak-1988', 'Haluan depan lebih tinggi daripada haluan belakang.', 'The front prow stands higher than the rear.'),
  hornsAreTally: dim(1, 'count', 'canon', 'nooy-palm-1979', 'Tanduk kerbau adalah catatan jumlah upacara rambu solo yang pernah digelar.', 'The buffalo horns are a record of how many rambu solo funerals have been held.'),
  noNails: dim(1, 'ratio', 'canon', 'schefold-2003', 'Sambungan pasak; rangka disusun tanpa paku.', 'Pegged joints; the frame goes up without nails.'),
  raftersPerBay: dim(4, 'count', 'interpolated', 'none', 'Jumlah kasau tiap ruang, tiap sisi.', 'Number of rafters per bay, per side.'),
  postsPerRow: dim(2, 'count', 'canon', 'depdikbud-sulsel', 'Tiang berpasangan melintang, simetris terhadap bidang punggung.', 'Posts stand in transverse pairs, symmetric about the ridge plane.'),

  /* The site: what the house faces, which is what facing north means here. */
  alangOpposite: dim(1, 'count', 'canon', 'waterson-1990', 'Alang — lumbung padi — berdiri berjajar menghadap tongkonan di seberang halaman, jadi rumah dan lumbung saling berhadapan. Aturan hadap utara tidak menyebut arah mata angin saja: ia menyebut apa yang ada di hadapan rumah.', 'The alang — the rice barns — stand in a row facing the tongkonan across the yard, so house and barns face each other. The rule that the house faces north is not only a compass bearing: it says what stands in front of the house.'),
  halamanDepth: dim(9, 'm', 'interpolated', 'none', 'Jarak dari muka tongkonan ke jajaran alang. Bahwa alang berdiri di seberang halaman adalah kanon; seberapa lebar halaman itu adalah penetapan penulis.', 'Distance from the front of the tongkonan to the row of alang. That the barns stand across the yard is canon; how wide the yard is is the author’s.'),
  alangPlan: dim(3.6, 'm', 'interpolated', 'none', 'Sisi denah satu alang. Yang digambar hanyalah jejak denahnya di tanah: sebuah alang adalah bangunan tersendiri dan bangunan yang tidak dimodelkan di sini tidak akan didirikan dari terkaan.', 'Plan side of one alang. Only its footprint on the ground is drawn: an alang is a building in its own right, and a building this project does not model will not be raised from a guess.'),
  alangSpacing: dim(6, 'm', 'interpolated', 'none', 'Jarak antar alang sepanjang jajarannya.', 'Spacing between alang along their row.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────────
 * Everything the generic core is allowed to know about the Toraja house: how
 * to look a dimension up, how to look a source up, what order the stages come
 * in, and how long each one takes in the raising sequence. It cannot
 * enumerate the tables and it cannot name a part.
 */

/**
 * Relative durations of the nine stages.
 *
 * These are not proportional to part count. Raising the posts is the act that
 * decides whether the house stands, and the ijuk is a long patient job — the
 * sequence is meant to read like the work, not like a progress bar.
 */
const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  ariri: 1.6,
  'rangka-lantai': 1.1,
  lantai: 0.7,
  dinding: 1.0,
  'tulak-somba': 0.8,
  'rangka-atap': 1.7,
  ijuk: 2.0,
  tanduk: 0.9,
}

export const PACK: RulePack<TorajaKinds> = {
  key: 'toraja',
  dimKeys: DIM_KEYS,
  dim: (key) => DIMS[key],
  sources: SOURCES,
  sourceFor,
  stageOrder: STAGE_ORDER,
  stageWeight: (stage) => STAGE_WEIGHT[stage],
}

/* ── Provenance, bound to this pack ───────────────────────────────────────
 * The rules are in `lib/core/provenance.ts`; these are the Toraja-bound
 * spellings of them, so nothing downstream has to carry the pack around.
 */

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

/* ── Rank ─────────────────────────────────────────────────────────────── */

export interface RankInfo {
  readonly rank: Rank
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
  /** linear scale on every dimension of the body */
  readonly scale: Dim
  /** how far the roof is permitted to be elaborated, 0–1 */
  readonly elaboration: Dim
  /** whether the front gable carries a full carved panel */
  readonly carvedGable: boolean
  /** the largest bay count this rank customarily reaches */
  readonly maxBays: number
}

export const RANKS: readonly RankInfo[] = [
  {
    rank: 'layuk',
    name: 'Tongkonan layuk',
    glossId: 'Rumah asal satu keturunan; pusat adat, dan yang paling besar.',
    glossEn: 'The origin house of a lineage; seat of custom, and the largest.',
    scale: dim(1.15, 'ratio', 'canon', 'nooy-palm-1979', 'Tongkonan layuk berskala paling besar di antara tiga tingkat.', 'The tongkonan layuk is the largest of the three ranks.'),
    elaboration: dim(1, 'ratio', 'canon', 'waterson-1990', 'Ukiran penuh diizinkan pada tingkat ini.', 'Full carving is permitted at this rank.'),
    carvedGable: true,
    maxBays: 5,
  },
  {
    rank: 'pekamberan',
    name: 'Tongkonan pekamberan',
    glossId: 'Rumah yang memegang jabatan adat; menengah.',
    glossEn: 'A house holding customary office; the middle rank.',
    scale: dim(1.0, 'ratio', 'canon', 'nooy-palm-1979', 'Skala acuan; dua tingkat lain diukur terhadap ini.', 'The reference scale; the other two ranks are measured against it.'),
    elaboration: dim(0.65, 'ratio', 'interpolated', 'none', 'Sebagian bidang berukir.', 'Some surfaces carry carving.'),
    carvedGable: true,
    maxBays: 4,
  },
  {
    rank: 'batu-ariri',
    name: "Tongkonan batu a'riri",
    glossId: 'Rumah keluarga biasa; tanpa jabatan adat.',
    glossEn: 'An ordinary family house, holding no customary office.',
    scale: dim(0.88, 'ratio', 'canon', 'nooy-palm-1979', 'Tingkat terkecil; tanpa hak elaborasi.', 'The smallest rank, with no right of elaboration.'),
    elaboration: dim(0.25, 'ratio', 'interpolated', 'none', 'Ukiran terbatas atau tidak ada.', 'Carving limited or absent.'),
    carvedGable: false,
    maxBays: 3,
  },
]

export function rankInfo(rank: Rank): RankInfo {
  const found = RANKS.find((r) => r.rank === rank)
  if (!found) throw new Error(`unknown rank: ${rank}`)
  return found
}

/* ── Bay names ────────────────────────────────────────────────────────── */

/**
 * Bays run front (north) to rear (south). The three-bay case is the named
 * one; larger houses extend the sali, the central working floor, because that
 * is the room that absorbs additional length.
 */
export function bayNames(bays: number): readonly string[] {
  switch (bays) {
    case 2:
      return ["tangdo'", 'sumbung']
    case 3:
      return ["tangdo'", 'sali', 'sumbung']
    case 4:
      return ["tangdo'", 'sali tangnga', 'sali', 'sumbung']
    default:
      return ["tangdo'", 'sali tangnga', 'sali', 'sali sumbung', 'sumbung']
  }
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu umpak',
    glossId: 'Batu diletakkan lebih dahulu. Tiang berdiri di atasnya, tidak ditanam.',
    glossEn: 'The pad stones go down first. The posts stand on them; they are not buried.',
  },
  {
    stage: 'ariri',
    title: "A'riri",
    glossId: 'Tiang didirikan berpasangan, simetris terhadap bidang punggung.',
    glossEn: 'The posts are raised in transverse pairs, symmetric about the ridge plane.',
  },
  {
    stage: 'rangka-lantai',
    title: 'Rangka lantai',
    glossId: 'Balok memanjang dan melintang mengunci kepala tiang.',
    glossEn: 'Sills and joists lock the post heads together.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Papan lantai menutup rangka. Di sinilah kale banua bermula.',
    glossEn: 'The deck closes the frame. The kale banua begins here.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Papan dinding dipasang; bidang inilah yang kemudian diukir.',
    glossEn: 'The wall boards go up; these are the surfaces that later carry carving.',
  },
  {
    stage: 'tulak-somba',
    title: 'Tulak somba',
    glossId: 'Tiang muka menyangga haluan depan yang menjulur jauh ke luar.',
    glossEn: 'The front post takes the load of the prow that cantilevers far beyond the body.',
  },
  {
    stage: 'rangka-atap',
    title: 'Rangka atap',
    glossId: 'Punggung, kasau, dan gording. Bentuk atap muncul di sini, bukan digambar.',
    glossEn: 'Ridge, rafters, purlins. The roof shape appears here; it is not drawn.',
  },
  {
    stage: 'ijuk',
    title: 'Ijuk',
    glossId: 'Lapis ijuk dipasang dari tepi ke atas, tiap lapis menindih lapis di bawahnya.',
    glossEn: 'The courses are laid from the eave upward, each lapping the one below.',
  },
  {
    stage: 'tanduk',
    title: 'Tanduk',
    glossId: 'Tanduk dipasang terakhir, karena jumlahnya bertambah seiring umur rumah.',
    glossEn: 'The horns go on last, because their number keeps growing as the house ages.',
  },
]

export function stageInfo(stage: StageInfo['stage']): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { rank: 'pekamberan', bays: 3, horns: 6 }

/** Clamp to the declared ranges. The generator refuses to invent a house. */
export function normaliseRules(rules: Rules): Rules {
  const bays = Math.min(5, Math.max(2, Math.round(rules.bays)))
  const horns = Math.min(32, Math.max(0, Math.round(rules.horns)))
  return { rank: rules.rank, bays, horns }
}

/**
 * Whether a rule combination exceeds what the rank customarily reaches. This
 * is not an error — a house can be unusual — but the UI says so, because the
 * whole point is that these numbers mean something socially.
 */
export function bayCountIsUnusual(rules: Rules): boolean {
  return rules.bays > rankInfo(rules.rank).maxBays
}

/** Every Dim that fed a given layout, deduplicated, for the provenance strip. */
export function dimsForLayout(layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return [...ALL_DIMS, rankInfo(layout.rules.rank).scale, rankInfo(layout.rules.rank).elaboration]
}
