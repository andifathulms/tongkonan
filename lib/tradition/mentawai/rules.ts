/**
 * The rule pack for the Mentawai uma.
 *
 * The thirtieth pack, and the one whose principal claim is stated rather than
 * checked — deliberately, and with the reason written where the table is read.
 *
 * `nobodyIsSenior` is canon and it is the entry. There is no chief in an uma:
 * the rimata leads ritual and does not command, and decisions are taken by
 * everybody on the front veranda. No household has a larger share, a better
 * position, a raised seat or an end of its own. **That cannot be checked.** A
 * building with no rank in it and a building whose rank nobody modelled are
 * the same model, so this pack does the only honest thing available: it checks
 * the things that *are* geometric — equal shares, an open front, one record
 * for everybody — and says plainly that the rest is a claim rather than a
 * verdict.
 *
 * `gradedByActivity` is the second, and it is the pairing worth having. A
 * rumah limas steps its floor front to back and where a guest is seated on
 * that sequence is their standing. An uma is graded front to back too —
 * veranda, room, back veranda, public to private — and the grade follows what
 * is being done rather than who is doing it. The same section, the opposite
 * claim.
 *
 * `theRecordIsShared` is the third. The jaraik in the front veranda carries
 * the skulls of what the house has hunted, and it belongs to the house rather
 * than to a person. Compare the Nias behu, where each stone records one
 * household's feast, and the Bugis timpa laja, where a stack of boards is one
 * household's rank: this is the only record in the collection that is nobody's
 * in particular.
 *
 * `theFloorIsDancedOn` is the fourth and the only one with a number in it. The
 * floor of the front veranda is sprung — turuk is danced on it — so it is laid
 * as planks over bearers with nothing under the middle of a span, which puts a
 * limit on how far apart the bearers can be.
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
  MentawaiKinds,
  Part,
  ProvenanceClass,
  Rules,
  Serambi,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'schefold-1988',
    citation: 'Schefold, R., Lia: Das grosse Ritual auf den Mentawai-Inseln (Dietrich Reimer, Berlin, 1988).',
    kind: 'ethnography',
  },
  {
    key: 'reeves-2001',
    citation: 'Reeves, G., “The Sakuddei of Siberut”, in Indonesian Heritage: Architecture (Archipelago Press, Singapore, 2001).',
    kind: 'reference',
  },
  {
    key: 'depdikbud-1986',
    citation:
      'Arsitektur Tradisional Daerah Sumatera Barat (Departemen Pendidikan dan Kebudayaan, Jakarta, 1986).',
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
  width: dim(8.4, 'm', 'interpolated', 'none', 'Lebar uma, melintang.', 'Width of the uma, across.'),
  shareLength: dim(2.9, 'm', 'interpolated', 'none', 'Panjang lantai untuk tiap rumah tangga di ruang dalam. Sama untuk semuanya, dan tidak ada yang lebih besar daripada yang lain.', 'Length of floor for each household in the closed room. The same for every one of them, and none is larger than another.'),
  frontDepth: dim(6.2, 'm', 'interpolated', 'none', 'Dalam serambi depan, tempat siapa pun boleh datang dan tempat keputusan diambil.', 'Depth of the front veranda, where anybody may come and where decisions are taken.'),
  backDepth: dim(3.6, 'm', 'interpolated', 'none', 'Dalam serambi belakang, tempat perempuan bekerja dan tempat orang luar tidak masuk.', 'Depth of the back veranda, where the women work and where outsiders do not go.'),

  /* the frame */
  floorHeight: dim(1.05, 'm', 'interpolated', 'none', 'Tinggi lantai di atas tanah, di atas tiang kayu ulin yang berdiri pada batu.', 'Height of the floor above the ground, on ironwood posts standing on stones.'),
  postSection: dim(0.24, 'm', 'interpolated', 'none', 'Sisi penampang tiang ulin.', 'Section of an ironwood post.'),
  padHeight: dim(0.28, 'm', 'interpolated', 'none', 'Tinggi batu sungai di bawah tiang. Tidak ada yang ditanam: seluruh rangka hanya berdiri di atasnya, di pulau yang gempanya sering.', 'Height of the river stone under a post. Nothing is buried: the frame stands on them, on an island that shakes often.'),
  padSocket: dim(0.05, 'm', 'interpolated', 'none', 'Dalamnya cekungan pada batu tempat kaki tiang duduk. Tanpanya tiang hanya menyentuh batunya pada satu bidang, dan sambungan yang kedua bagiannya tidak saling memasuki tidak memegang apa-apa.', 'Depth of the hollow in the stone the foot of a post sits in. Without it the post only touches its stone on one plane, and a joint whose members do not enter each other holds nothing.'),
  jaraikOverlap: dim(0.06, 'm', 'interpolated', 'none', 'Sejauh mana papan jaraik naik ke dalam lapisan atap yang menggantungnya. Ia digantung, bukan diletakkan — jadi ia harus benar-benar bertaut dengan atapnya.', 'How far the jaraik board reaches up into the roofing that carries it. It hangs rather than stands, so it has to actually engage the roof.'),
  bearerDepth: dim(0.18, 'm', 'interpolated', 'none', 'Tinggi penampang gelagar lantai.', 'Depth of a floor bearer.'),
  bearerSpacing: dim(1.55, 'm', 'interpolated', 'none', 'Jarak antar gelagar, dan karena itu bentang bersih papan lantai.', 'Spacing of the bearers, and therefore the clear span of a floor plank.'),
  plankSpan: dim(1.8, 'm', 'interpolated', 'none', 'Bentang terjauh yang masih dapat dilintasi sebilah papan belah tanpa tumpuan di tengah. Lantai uma dipakai menari turuk: ia memang harus melenting, tetapi melenting bukan melendut sampai patah.', 'The furthest a split plank crosses without support in the middle. An uma’s floor is danced on: it is meant to spring, and springing is not the same as failing.'),
  plankThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor plank.'),

  /* the room over it */
  wallHeight: dim(2.15, 'm', 'interpolated', 'none', 'Tinggi dinding papan ruang dalam.', 'Height of the board wall of the closed room.'),
  wallThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),
  eaveHeight: dim(1.6, 'm', 'interpolated', 'none', 'Tinggi tepi atap di serambi, yang tidak berdinding: atapnya turun rendah dan itulah seluruh dindingnya.', 'Height of the eave over the verandas, which have no walls: the roof comes down low and that is all the wall they have.'),
  roofRise: dim(3.1, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas dinding.', 'Rise of the ridge above the wall.'),
  eaveOversail: dim(1.15, 'm', 'interpolated', 'none', 'Tritisan atap daun sagu.', 'Overhang of the sago-leaf roof.'),
  roofThickness: dim(0.14, 'm', 'interpolated', 'none', 'Tebal lapisan daun sagu.', 'Thickness of the sago-leaf roofing.'),

  /* the hearths, and the one record */
  hearthSide: dim(0.95, 'm', 'interpolated', 'none', 'Sisi perapian tiap rumah tangga.', 'Side of a household’s hearth.'),
  hearthHeight: dim(0.16, 'm', 'interpolated', 'none', 'Tinggi kotak pasir perapian.', 'Height of the sand box of a hearth.'),
  jaraikHeight: dim(1.35, 'm', 'interpolated', 'none', 'Tinggi papan jaraik yang tergantung di serambi depan.', 'Height of the jaraik board hanging in the front veranda.'),
  jaraikWidth: dim(1.1, 'm', 'interpolated', 'none', 'Lebar papan jaraik.', 'Width of the jaraik board.'),
  jaraikThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan jaraik.', 'Thickness of the jaraik board.'),

  /* the ground */
  clearingRadius: dim(16, 'm', 'interpolated', 'none', 'Jari-jari tanah yang dibuka di sekeliling uma, di tepi sungai yang menjadi jalannya.', 'Radius of ground cleared around the uma, beside the river that is its road.'),
  riverWidth: dim(11, 'm', 'interpolated', 'none', 'Lebar sungai di depan rumah. Di Siberut sungai adalah jalan, dan muka rumah menghadapnya.', 'Width of the river in front of the house. On Siberut the river is the road, and the house faces it.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  nobodyIsSenior: dim(0, 'count', 'canon', 'schefold-1988', 'Nol kepala. Rimata memimpin upacara dan tidak memerintah, dan keputusan diambil bersama di serambi depan. Tidak ada rumah tangga yang mendapat bagian lebih besar, tempat yang lebih baik, tempat duduk yang ditinggikan, atau ujung sendiri. Ini tidak dapat diperiksa oleh model mana pun: bangunan yang memang tidak berjenjang dan bangunan yang jenjangnya tidak dimodelkan adalah model yang sama. Pak ini memeriksa yang dapat diperiksa dan menyatakan sisanya sebagai pernyataan, bukan putusan.', 'Zero chiefs. The rimata leads ritual and does not command, and decisions are taken together on the front veranda. No household gets a larger share, a better place, a raised seat, or an end of its own. This cannot be checked by any model: a building that genuinely has no rank and a building whose rank nobody modelled are the same model. The pack checks what can be checked and states the rest as a claim rather than a verdict.'),
  gradedByActivity: dim(1, 'count', 'canon', 'reeves-2001', 'Ruangnya berjenjang dari depan ke belakang — serambi depan, ruang dalam, serambi belakang — dan jenjang itu mengikuti apa yang sedang dikerjakan, bukan siapa yang mengerjakannya. Rumah limas Palembang berjenjang pada arah yang sama dan di sana tempat duduk seorang tamu adalah kedudukannya. Potongan yang sama, dua pernyataan yang berlawanan.', 'The space is graded front to back — front veranda, closed room, back veranda — and the grade follows what is being done rather than who is doing it. A Palembang rumah limas is graded along the same axis, and there where a guest is seated is their standing. The same section, two opposite claims.'),
  theRecordIsShared: dim(1, 'count', 'canon', 'schefold-1988', 'Satu jaraik untuk seluruh rumah, tergantung di serambi depan, membawa catatan perburuan uma itu. Behu Nias mencatat pesta satu rumah tangga dan timpa laja Bugis mencatat kedudukan satu rumah tangga; ini satu-satunya catatan dalam kumpulan ini yang bukan milik siapa-siapa secara khusus.', 'One jaraik for the whole house, hanging in the front veranda, carrying the record of what the uma has hunted. A Nias behu records one household’s feast and a Bugis timpa laja one household’s rank; this is the only record in the collection that belongs to nobody in particular.'),
  theFloorIsDancedOn: dim(1, 'count', 'canon', 'reeves-2001', 'Lantai serambi dipakai menari turuk, jadi ia dipasang sebagai papan di atas gelagar tanpa tumpuan di tengah bentang: ia harus melenting. Itu memberi batas seberapa jauh gelagar boleh berjarak — satu-satunya angka dalam pak ini yang datang dari apa yang dilakukan orang di atas lantainya.', 'The veranda floor is danced on for turuk, so it is laid as planks over bearers with nothing under the middle of a span: it is meant to spring. That puts a limit on how far apart the bearers may be — the only figure in this pack that comes from what people do on the floor.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.8,
  tiang: 2.0,
  lantai: 1.8,
  dinding: 1.4,
  atap: 2.4,
  perapian: 0.8,
}

export const PACK: RulePack<MentawaiKinds> = {
  key: 'mentawai',
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

/* ── How many verandas ────────────────────────────────────────────────── */

export interface SerambiInfo {
  readonly serambi: Serambi
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const SERAMBI: readonly SerambiInfo[] = [
  {
    serambi: 'depan',
    count: 1,
    name: 'Serambi depan saja',
    glossId: 'Hanya serambi depan: ruang terbuka menghadap sungai, tempat siapa pun boleh datang.',
    glossEn: 'The front veranda only: an open floor facing the river, where anybody may come.',
  },
  {
    serambi: 'depan-belakang',
    count: 2,
    name: 'Depan dan belakang',
    glossId: 'Serambi depan dan serambi belakang, dan yang belakang bukan versi kecil dari yang depan: di situ perempuan bekerja dan orang luar tidak masuk.',
    glossEn: 'A front veranda and a back one, and the back is not a smaller version of the front: the women work there and outsiders do not go into it.',
  },
]

export function serambiInfo(serambi: Serambi): SerambiInfo {
  const found = SERAMBI.find((s) => s.serambi === serambi)
  if (!found) throw new Error(`unknown serambi: ${serambi}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu sungai diletakkan lebih dulu. Tidak ada yang ditanam, di pulau yang tanahnya sering bergerak.',
    glossEn: 'River stones are set first. Nothing is buried, on an island whose ground moves often.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang kayu ulin berdiri di atas batunya, hanya ditahan beratnya sendiri.',
    glossEn: 'Ironwood posts stand on their stones, held by their own weight.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Gelagar dipasang lalu papan lantai — dan jarak gelagarnya ditentukan oleh lantai yang harus dapat melenting ketika ditari.',
    glossEn: 'Bearers go in and then the planks — and how far apart the bearers stand is set by a floor that has to spring when it is danced on.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Dinding papan menutup ruang dalam. Serambi tidak berdinding sama sekali: atapnya yang turun rendah, dan itulah seluruh dindingnya.',
    glossEn: 'Board walls close the inner room. The verandas have no walls at all: the roof comes down low, and that is all the wall they have.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Daun sagu menutupi seluruh panjangnya, satu atap untuk semua rumah tangga di bawahnya.',
    glossEn: 'Sago leaf covers the whole length, one roof over every household under it.',
  },
  {
    stage: 'perapian',
    title: 'Perapian',
    glossId: 'Satu perapian untuk tiap rumah tangga, berjarak sama, dan satu jaraik untuk seluruh rumah.',
    glossEn: 'One hearth for each household, equally spaced, and one jaraik for the whole house.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { keluarga: 5, serambi: 'depan-belakang', jaraik: true }

export const MIN_KELUARGA = 3
export const MAX_KELUARGA = 9

export function normaliseRules(rules: Rules): Rules {
  return {
    keluarga: Math.min(MAX_KELUARGA, Math.max(MIN_KELUARGA, Math.round(rules.keluarga))),
    serambi: rules.serambi,
    jaraik: rules.jaraik,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
