/**
 * The rule pack for the Sahu sasadu.
 *
 * The thirty-third pack, and the one whose social rule is written in
 * centimetres of headroom.
 *
 * `doorsAreNotAlike` is canon and it is the entry. A sasadu has several
 * entrances and they are cut to different heights; which one a person comes in
 * by follows from who they are. Thirty-two buildings before this state
 * standing in size, position, height, count, tiers, brackets or a stack of
 * boards. This one states it in the clearance over somebody's head, and it is
 * the only pack here that does.
 *
 * `everybodyBows` is the second and it is what keeps the first from being
 * about humiliation. The highest of the doors is still lower than a standing
 * adult: the bow is not something required of the low, it is what the building
 * asks of everyone who comes in. The check is two-sided in the sense the ume
 * kbubu's was — every opening has to be passable and none may be walked
 * through upright — but here it is applied to a *set* of openings that differ
 * from each other, which no other check in this project does.
 *
 * `nobodyIsShutOut` is the third. There is no wall and there is no leaf on any
 * door: what the building has is openings of different heights, not doors that
 * can be closed. A hall where the difference between people is a clearance is
 * a different thing from a hall where it is a lock.
 *
 * `eatenInTogether` is the fourth, and it is where the size comes from. The
 * length is how many people sit down at once — a headcount, like the bade's
 * lattice, except that this one is a room rather than a thing carried.
 *
 * The baileo, eighteen buildings back, is the pack to read this one against:
 * there several things of one kind must be equal, and the refusal to step a
 * floor is the statement. Here the difference is the statement. Two communal
 * halls, two opposite claims, and neither is a version of the other.
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
  Pintu,
  ProvenanceClass,
  Rules,
  SahuKinds,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'visser-1989',
    citation:
      'Visser, L. E., My Rice Field is My Child: Social and Territorial Aspects of Swidden ' +
      'Cultivation in Sahu, Eastern Indonesia (Foris, Dordrecht, 1989).',
    kind: 'ethnography',
  },
  {
    key: 'depdikbud-1985',
    citation:
      'Arsitektur Tradisional Daerah Maluku (Departemen Pendidikan dan Kebudayaan, Jakarta, 1985).',
    kind: 'reference',
  },
  {
    key: 'yasin-2018',
    citation:
      'Yasin, dkk., “Sasadu: Rumah Adat Suku Sahu di Halmahera Barat”, dalam kajian arsitektur ' +
      'tradisional Maluku Utara, 2018.',
    kind: 'reference',
  },
  {
    key: 'anthropometry',
    citation:
      'Ukuran tubuh manusia yang ditetapkan penulis, bukan dari sumber tentang Sahu. ' +
      'Kunci yang sama dipakai pak Bali, Waruga, Ngada, Atoni, dan Rimba.',
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
  /* the hall */
  width: dim(7.8, 'm', 'interpolated', 'none', 'Lebar sasadu, melintang.', 'Width of the sasadu, across.'),
  bayLength: dim(2.4, 'm', 'interpolated', 'none', 'Panjang satu bentang, dan satu bentang adalah sepotong bangku tempat beberapa orang duduk makan.', 'Length of one bay, and a bay is a length of bench several people eat at.'),
  seatsPerBay: dim(6, 'count', 'interpolated', 'none', 'Berapa orang duduk pada satu bentang, dihitung dua sisi. Dari sinilah panjang bangunannya berasal: ia sepanjang jumlah orang yang harus dapat makan bersama sekaligus.', 'How many people sit at one bay, counting both sides. This is where the length comes from: the hall is as long as the number of people who have to be able to eat together at once.'),

  /* the frame */
  floorHeight: dim(0.45, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah.', 'Height of the floor above the ground.'),
  padHeight: dim(0.24, 'm', 'interpolated', 'none', 'Tinggi batu di bawah tiang; tidak ada yang ditanam.', 'Height of the stone under a post; nothing is buried.'),
  padSocket: dim(0.05, 'm', 'interpolated', 'none', 'Dalamnya cekungan pada batu tempat kaki tiang duduk, supaya keduanya benar-benar bertaut.', 'Depth of the hollow in the stone the post foot sits in, so that the two actually engage.'),
  postSection: dim(0.17, 'm', 'interpolated', 'none', 'Sisi penampang tiang.', 'Section of a post.'),
  bearerDepth: dim(0.16, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar lantai.', 'Depth of a floor bearer.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor plank.'),
  benchHeight: dim(0.42, 'm', 'interpolated', 'none', 'Tinggi bangku keliling di atas lantai.', 'Height of the bench around the floor above the floor.'),
  benchDepth: dim(0.5, 'm', 'interpolated', 'none', 'Dalam bangku.', 'Depth of the bench.'),

  /* the roof that comes down low */
  eaveHeight: dim(1.45, 'm', 'interpolated', 'none', 'Tinggi tepi atap di atas lantai. Rendah dengan sengaja: dari sinilah tinggi tiap bukaan diambil, dan tidak ada bukaan yang lebih tinggi daripada tepi atapnya sendiri.', 'Height of the eave above the floor. Low on purpose: it is where the head of every opening comes from, and no opening is higher than the eave over it.'),
  roofRise: dim(3.2, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas tepi atap.', 'Rise of the ridge above the eave.'),
  eaveOversail: dim(1.3, 'm', 'interpolated', 'none', 'Tritisan atap daun sagu, yang menjadi satu-satunya dinding bangunan ini.', 'Overhang of the sago-leaf roof, which is the only wall this building has.'),
  roofThickness: dim(0.14, 'm', 'interpolated', 'none', 'Tebal lapisan daun sagu.', 'Thickness of the sago-leaf roofing.'),

  /* the openings, and they are not alike */
  headHigh: dim(1.42, 'm', 'interpolated', 'none', 'Tinggi kepala bukaan yang tertinggi: untuk tamu dan untuk yang datang dari luar kampung. Ini yang tertinggi dari semuanya dan masih lebih rendah daripada orang berdiri.', 'Head height of the highest opening: for guests and for people from outside the village. It is the highest of them and it is still lower than a standing adult.'),
  headStep: dim(0.11, 'm', 'interpolated', 'none', 'Selisih tinggi dari satu bukaan ke bukaan berikutnya. Inilah satuan yang dipakai bangunan ini untuk menyatakan perbedaan — bukan ukuran, bukan letak, bukan jumlah, melainkan sekian sentimeter di atas kepala orang.', 'The step in head height from one opening to the next. It is the unit this building states difference in — not size, not position, not number, but so many centimetres over somebody’s head.'),
  doorWidth: dim(0.9, 'm', 'interpolated', 'none', 'Lebar tiap bukaan; semuanya sama lebar, sebab yang membedakan adalah tingginya.', 'Width of each opening; they are all the same, because what differs is the height.'),
  jambSection: dim(0.1, 'm', 'interpolated', 'none', 'Sisi penampang kusen bukaan.', 'Section of an opening’s jamb.'),
  standingHeight: dim(1.62, 'm', 'interpolated', 'anthropometry', 'Tinggi orang dewasa berdiri. Bukan dari sumber tentang Sahu — kunci sumbernya sendiri supaya terlihat begitu.', 'Standing height of an adult. Not from a source about Sahu — its own source key so that this shows.'),
  stoopingHeight: dim(1.05, 'm', 'interpolated', 'anthropometry', 'Tinggi orang dewasa yang membungkuk melewati bukaan rendah. Bukaan terendah pun harus di atas angka ini: membungkuk itu tanda hormat, bukan penghalang.', 'Height of an adult stooping through a low opening. Even the lowest opening has to be above it: the bow is a mark of respect rather than an obstruction.'),

  /* the cloths */
  kainWidth: dim(0.34, 'm', 'interpolated', 'none', 'Lebar kain merah putih yang diikatkan pada tiang.', 'Width of the red and white cloth tied to a post.'),
  kainDrop: dim(0.85, 'm', 'interpolated', 'none', 'Panjang kain yang menjuntai.', 'How far the cloth hangs.'),

  /* the ground */
  yardRadius: dim(13, 'm', 'interpolated', 'none', 'Jari-jari tanah lapang di sekeliling sasadu, di tengah kampung.', 'Radius of the open ground around the sasadu, in the middle of the village.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  doorsAreNotAlike: dim(1, 'count', 'canon', 'yasin-2018', 'Bukaan-bukaannya dipotong pada tinggi yang berbeda-beda, dan lewat mana seseorang masuk mengikuti siapa dia. Tiga puluh dua bangunan sebelum ini menyatakan kedudukan lewat ukuran, letak, tinggi lantai, jumlah, tingkat atap, lengan, atau tumpukan papan. Yang ini menyatakannya dalam ruang di atas kepala orang, dan hanya pak ini yang begitu.', 'Its openings are cut to different heights, and which one a person comes in by follows from who they are. The thirty-two buildings before this state standing through size, position, floor height, count, roof tiers, brackets or a stack of boards. This one states it in the space over somebody’s head, and it is the only pack here that does.'),
  everybodyBows: dim(1, 'count', 'canon', 'visser-1989', 'Bukaan yang tertinggi pun masih lebih rendah daripada orang dewasa berdiri: membungkuk bukan hal yang dituntut dari yang berkedudukan rendah, melainkan yang diminta bangunan ini dari semua orang yang masuk — termasuk dari orang yang bukaan terendah itu dibuat untuknya.', 'Even the highest opening is lower than a standing adult: the bow is not something demanded of the low-ranking but what the building asks of everybody who comes in — including of the person the lowest opening was made low for.'),
  nobodyIsShutOut: dim(0, 'count', 'canon', 'depdikbud-1985', 'Nol daun pintu dan nol dinding. Yang dimiliki bangunan ini adalah bukaan dengan tinggi berbeda, bukan pintu yang dapat ditutup. Balai yang membedakan orang dengan ruang di atas kepala adalah hal yang lain sama sekali daripada balai yang membedakannya dengan kunci.', 'Zero door leaves and zero walls. What this building has is openings of different heights, not doors that can be shut. A hall that distinguishes people by headroom is an entirely different thing from a hall that distinguishes them with a lock.'),
  eatenInTogether: dim(1, 'count', 'canon', 'visser-1989', 'Panjangnya adalah berapa orang yang harus dapat duduk makan bersama sekaligus. Denah usungan bade juga berasal dari hitungan orang, dan itu hitungan orang yang memikul; yang ini hitungan orang yang duduk.', 'Its length is how many people have to be able to sit down and eat together at once. A bade’s lattice also comes from a headcount, and that one counts people carrying; this one counts people sitting.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.8,
  tiang: 1.8,
  lantai: 1.6,
  atap: 2.6,
  pintu: 1.0,
  kain: 0.4,
}

export const PACK: RulePack<SahuKinds> = {
  key: 'sahu',
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

/* ── How many ways in ─────────────────────────────────────────────────── */

export interface PintuInfo {
  readonly pintu: Pintu
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const PINTU: readonly PintuInfo[] = [
  {
    pintu: 'dua',
    count: 2,
    name: 'Dua bukaan',
    glossId: 'Dua: satu untuk laki-laki dan satu untuk perempuan, pada dua sisi yang berhadapan.',
    glossEn: 'Two: one for the men and one for the women, on opposite sides.',
  },
  {
    pintu: 'tiga',
    count: 3,
    name: 'Tiga bukaan',
    glossId: 'Tiga: ditambah satu untuk tamu dan orang dari luar kampung — dan bukaan tamu itulah yang paling tinggi.',
    glossEn: 'Three: with one more for guests and people from outside the village — and the guests’ opening is the highest of them.',
  },
  {
    pintu: 'empat',
    count: 4,
    name: 'Empat bukaan',
    glossId: 'Empat: tiap sisi punya bukaannya sendiri, dan keempatnya berbeda tinggi.',
    glossEn: 'Four: every side has its own opening, and all four differ in height.',
  },
]

export function pintuInfo(pintu: Pintu): PintuInfo {
  const found = PINTU.find((p) => p.pintu === pintu)
  if (!found) throw new Error(`unknown pintu: ${pintu}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu diletakkan di tanah lapang tengah kampung. Tidak ada yang ditanam.',
    glossEn: 'Stones are set on the open ground in the middle of the village. Nothing is buried.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang berdiri di atas batunya, di ruang terbuka — bangunan ini tidak pernah punya dinding.',
    glossEn: 'Posts stand on their stones in the open — this building never has walls.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Lantai dan bangku keliling dipasang: panjangnya sepanjang jumlah orang yang harus dapat makan bersama.',
    glossEn: 'The floor and the bench around it go in: as long as the number of people who have to be able to eat together.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Daun sagu ditutupkan dan diturunkan rendah. Tepi atap inilah yang menentukan tinggi tiap bukaan.',
    glossEn: 'Sago leaf goes on and comes down low. That eave is what sets the height of every opening.',
  },
  {
    stage: 'pintu',
    title: 'Bukaan',
    glossId: 'Tiap bukaan dipotong pada tingginya sendiri. Tidak ada daun pintu: yang ada perbedaan tinggi, bukan kunci.',
    glossEn: 'Each opening is cut to its own height. There are no door leaves: what there is is a difference in height, not a lock.',
  },
  {
    stage: 'kain',
    title: 'Kain',
    glossId: 'Kain merah putih diikatkan pada tiang, terakhir.',
    glossEn: 'Red and white cloths are tied to the posts, last.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { bentang: 5, pintu: 'tiga', kain: true }

export const MIN_BENTANG = 3
export const MAX_BENTANG = 8

export function normaliseRules(rules: Rules): Rules {
  return {
    bentang: Math.min(MAX_BENTANG, Math.max(MIN_BENTANG, Math.round(rules.bentang))),
    pintu: rules.pintu,
    kain: rules.kain,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
