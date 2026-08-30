/**
 * The rule pack for the Balinese bade.
 *
 * The twenty-third pack, and the only one whose building is finished when it
 * is destroyed.
 *
 * `builtToBeBurned` is canon and it is the whole thing. Everything else in
 * this collection is made to last some length of time — a season of rain, a
 * generation, an ancestor's memory. This is made for one afternoon: light
 * enough to lift, quick enough to build, and leaving nothing.
 *
 * `carriedNotFounded` is the other one, and it is where the geometry lives.
 * A bade has no foundation because the ground is not where it is going: what
 * holds it up is a bamboo lattice with a crowd underneath. So the requirement
 * this building has and no other does is that its weight sits over the people
 * carrying it — the second balance rule in the project after the lepa's, and a
 * different kind: that one is about keeping weight low, this one about keeping
 * it inside a footprint that is walking.
 *
 * The tier count is a ladder of standing whose rungs are odd numbers. That is
 * not the same as the rumoh Aceh's rule, which fixes parity and nothing else,
 * and the two are worth keeping apart.
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
  BadeKinds,
  Dim,
  Layout,
  Part,
  Pemikul,
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
    key: 'covarrubias-1937',
    citation: 'Covarrubias, M., Island of Bali (Knopf, New York, 1937).',
    kind: 'ethnography',
  },
  {
    key: 'eiseman-1990',
    citation:
      'Eiseman, F. B., Bali: Sekala and Niskala, Volume I — Essays on Religion, Ritual and Art ' +
      '(Periplus, Berkeley, 1990).',
    kind: 'ethnography',
  },
  {
    key: 'gelebet-1986',
    citation:
      'Gelebet, I. N., dkk., Arsitektur Tradisional Daerah Bali ' +
      '(Departemen Pendidikan dan Kebudayaan, Denpasar, 1986).',
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
  /* the lattice a crowd gets under, which is this building's foundation */
  frameSmall: dim(3.4, 'm', 'interpolated', 'none', 'Sisi usungan untuk dua puluh pemikul.', 'Side of the carrying lattice for twenty bearers.'),
  frameMedium: dim(4.6, 'm', 'interpolated', 'none', 'Sisi usungan untuk empat puluh pemikul.', 'Side of the carrying lattice for forty bearers.'),
  frameLarge: dim(6.2, 'm', 'interpolated', 'none', 'Sisi usungan untuk delapan puluh pemikul. Denah bangunan ini adalah jawaban atas satu pertanyaan: berapa orang yang dapat masuk ke bawahnya sekaligus.', 'Side of the carrying lattice for eighty bearers. This building’s plan answers one question: how many people can get underneath it at once.'),
  frameDepth: dim(0.22, 'm', 'interpolated', 'none', 'Tinggi penampang balok usungan.', 'Depth of a lattice beam.'),
  frameSection: dim(0.13, 'm', 'interpolated', 'none', 'Lebar penampang balok usungan.', 'Width of a lattice beam.'),
  shoulderY: dim(1.35, 'm', 'interpolated', 'none', 'Tinggi bahu pemikul. Bangunan ini didirikan di tanah dan diangkat setinggi ini; itulah satu-satunya “pondasi” yang pernah dimilikinya, dan pondasi itu berjalan.', 'Shoulder height of a bearer. This building is put up on the ground and lifted to here; that is the only “foundation” it ever has, and the foundation walks.'),
  bearerSpacing: dim(0.62, 'm', 'interpolated', 'none', 'Jarak antar pemikul di sepanjang balok usungan. Angka ini dikalikan jumlah balok memberi berapa banyak bahu yang muat, dan dari situlah denahnya berasal.', 'Spacing of bearers along a lattice beam. This figure times the number of beams gives how many shoulders fit, and the plan comes from that.'),

  /* the body of the tower */
  bodyHeight: dim(2.2, 'm', 'interpolated', 'none', 'Tinggi badan bade, tempat jenazah dibaringkan.', 'Height of the body of the tower, where the dead ride.'),
  bodyInset: dim(0.55, 'm', 'interpolated', 'none', 'Jarak badan bade ke dalam dari tepi usungan.', 'How far the body stands inside the edge of the lattice.'),
  postSection: dim(0.11, 'm', 'interpolated', 'none', 'Sisi penampang tiang bambu.', 'Section of a bamboo post.'),

  /* the tiers, which are the rank */
  tumpangRise: dim(0.62, 'm', 'interpolated', 'none', 'Tinggi satu tingkat atap. Angka ini yang membuat bade sebelas tingkat menjadi bangunan yang harus dibawa lewat jalan yang kabel listriknya sudah diturunkan lebih dulu.', 'Rise of one tier. This is the figure that makes an eleven-tier bade a building that has to be carried along a road whose power lines were taken down in advance.'),
  tumpangTaper: dim(0.82, 'ratio', 'interpolated', 'none', 'Lebar tiap tingkat dibanding tingkat di bawahnya.', 'Width of each tier against the one below it.'),
  tumpangEave: dim(0.28, 'm', 'interpolated', 'none', 'Tritisan tiap tingkat.', 'Overhang of each tier.'),
  clothThickness: dim(0.04, 'm', 'interpolated', 'none', 'Tebal lapisan kain dan kertas pada rangka.', 'Thickness of the cloth and paper over the frame.'),
  payungRadius: dim(0.85, 'm', 'interpolated', 'none', 'Jari-jari payung di puncaknya.', 'Radius of the umbrella at the top.'),

  /* the limit balance is tested against */
  tipLimit: dim(1.9, 'ratio', 'interpolated', 'none', 'Setinggi apa titik berat boleh berada di atas usungan, sebagai kelipatan setengah lebar usungan. Ditulis mula-mula sebagai jarak titik tengah dari sumbu — dan itu pemeriksaan yang mengulang masukannya sendiri, sebab bangunan ini simetris, jadi angkanya nol menurut cara ia dibangun. Yang benar-benar berubah adalah kerampingannya: menara tinggi di atas usungan kecil terguling, dan kedua angka itu berdiri sendiri-sendiri. Ini tetap batas penulis, bukan hitungan.', 'How high the centre of gravity may sit above the lattice, as a multiple of the lattice half-width. Written first as the centre’s distance from the axis — which is a check restating its own input, because this building is symmetric, so that number is zero by construction. What actually varies is slenderness: a tall tower on a small lattice tips, and those two numbers are independent. It is still the author’s limit and not a calculation.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  builtToBeBurned: dim(1, 'count', 'canon', 'covarrubias-1937', 'Bade dibangun untuk dibakar. Ia dibuat dalam beberapa minggu dari bambu, kayu, kain, dan kertas; dipikul ke setra; dan habis pada sore yang sama. Dua puluh dua bangunan lain dalam projek ini dibuat untuk bertahan — semusim hujan, satu keturunan, atau selamanya. Yang ini selesai justru ketika ia tidak ada lagi.', 'A bade is built to be burned. It is made in a few weeks out of bamboo, timber, cloth and paper; carried to the cremation ground; and gone by the same evening. The other twenty-two buildings in this project are made to last — a season of rain, a generation, or for ever. This one is finished at the moment it stops existing.'),
  carriedNotFounded: dim(0, 'count', 'canon', 'eiseman-1990', 'Nol pondasi. Tidak ada tiang yang ditanam, tidak ada batu, tidak ada apa pun yang tetap di tanah, karena tanah bukan tempat bangunan ini akan berada. Yang menahannya adalah usungan bambu dengan puluhan orang di bawahnya — jadi pondasi bangunan ini berjalan, dan berbelok di tiap perempatan.', 'Zero foundations. No post is buried, there is no stone, and nothing is fixed to the earth, because the earth is not where this building is going. What holds it up is a bamboo lattice with dozens of people underneath — so this building’s foundation walks, and turns at every crossroads.'),
  weightOverTheBearers: dim(1, 'count', 'canon', 'eiseman-1990', 'Beratnya harus berada di atas orang-orang yang memikulnya. Ini syarat bangunan dan bukan syarat upacara: menara yang titik beratnya keluar dari usungan adalah menara yang jatuh menimpa pemikulnya. Lepa Bajau juga harus menjaga keseimbangan, dan menjaga hal yang lain: di sana beratnya harus rendah, di sini harus berada di dalam sebuah denah yang sedang berjalan.', 'The weight has to sit over the people carrying it. That is a building requirement rather than a ceremonial one: a tower whose centre leaves the lattice is a tower that falls on its bearers. The Bajau lepa also has to balance, and balances something else: there the weight must be low, here it must be inside a footprint that is walking.'),
  tiersAreStanding: dim(1, 'count', 'canon', 'gelebet-1986', 'Jumlah tingkat menyatakan kedudukan orang yang meninggal, dan jumlahnya menaik ganjil: satu, tiga, lima, tujuh, sembilan, sebelas. Ganjilnya berasal dari tangga kedudukannya, bukan dari aturan tentang ganjil — bedanya dengan tangga rumoh Aceh, yang aturannya justru keganjilan itu sendiri dan tidak ada yang lain.', 'The number of tiers states the standing of the dead, and the numbers climb in odds: one, three, five, seven, nine, eleven. The oddness comes from the ladder of rank rather than from a rule about odd numbers — the difference from the rumoh Aceh’s ladder, whose rule is the parity itself and nothing else.'),
  everythingBurns: dim(4, 'count', 'canon', 'covarrubias-1937', 'Empat bahan, dan keempatnya terbakar: bambu, kayu, kain, kertas. Tidak ada batu dan tidak ada besi. Waruga Minahasa punya satu bahan dan bahan itu yang bertahan; bade punya empat dan tidak satu pun bertahan — dua bangunan untuk orang mati, dua jawaban yang berlawanan tentang apa yang harus tersisa.', 'Four materials, and every one of them burns: bamboo, timber, cloth, paper. There is no stone and no iron. The Minahasa waruga has one material and it is the one that lasts; a bade has four and not one of them does — two buildings for the dead, and two opposite answers about what should remain.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  usungan: 1.4,
  badan: 1.2,
  tumpang: 2.2,
  kain: 1.3,
  payung: 0.5,
}

export const PACK: RulePack<BadeKinds> = {
  key: 'bade',
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

/* ── The crowd underneath ─────────────────────────────────────────────── */

export interface PemikulInfo {
  readonly pemikul: Pemikul
  readonly key: DimKey
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const PEMIKUL: readonly PemikulInfo[] = [
  {
    pemikul: 'dua-puluh',
    key: 'frameSmall',
    count: 20,
    name: 'Dua puluh',
    glossId: 'Usungan untuk dua puluh bahu: satu banjar kecil, dan menara yang tidak melebihi apa yang dapat dikumpulkannya.',
    glossEn: 'A lattice for twenty shoulders: one small banjar, and a tower no larger than what it can muster.',
  },
  {
    pemikul: 'empat-puluh',
    key: 'frameMedium',
    count: 40,
    name: 'Empat puluh',
    glossId: 'Ukuran yang paling sering disebut sumber.',
    glossEn: 'The size the sources describe most often.',
  },
  {
    pemikul: 'delapan-puluh',
    key: 'frameLarge',
    count: 80,
    name: 'Delapan puluh',
    glossId: 'Delapan puluh orang di bawah satu bangunan. Denah bade adalah jawaban atas pertanyaan berapa banyak orang yang dapat masuk ke bawahnya sekaligus — satu-satunya denah dalam projek ini yang berasal dari sana.',
    glossEn: 'Eighty people under one building. A bade’s plan answers the question of how many can get underneath it at once — the only plan in this project that comes from there.',
  },
]

export function pemikulInfo(pemikul: Pemikul): PemikulInfo {
  const found = PEMIKUL.find((p) => p.pemikul === pemikul)
  if (!found) throw new Error(`unknown pemikul: ${pemikul}`)
  return found
}

/** The lattice this rule selects, read live from the pack. */
export function frameOf(pemikul: Pemikul): number {
  return DIMS[pemikulInfo(pemikul).key].value
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'usungan',
    title: 'Usungan',
    glossId: 'Kisi bambu disusun lebih dulu, dan inilah seluruh pondasi bangunan ini. Ia tidak ditanam ke tanah: ia diangkat ke bahu, dan berjalan.',
    glossEn: 'The bamboo lattice is built first, and it is this building’s entire foundation. It is not set into the ground: it goes onto shoulders, and it walks.',
  },
  {
    stage: 'badan',
    title: 'Badan',
    glossId: 'Badan bade disusun di atas usungan: di sinilah jenazah dibaringkan untuk perjalanan yang satu itu.',
    glossEn: 'The body of the tower goes up on the lattice: this is where the dead ride for the one journey.',
  },
  {
    stage: 'tumpang',
    title: 'Tumpang',
    glossId: 'Tingkat-tingkat atap disusun, satu di atas yang lain, dan jumlahnya adalah kedudukan orang yang meninggal.',
    glossEn: 'The tiers are stacked one above another, and how many there are is the standing of the dead.',
  },
  {
    stage: 'kain',
    title: 'Kain',
    glossId: 'Kain dan kertas menutupi rangkanya. Semua ini akan habis dalam beberapa menit di setra.',
    glossEn: 'Cloth and paper cover the frame. All of it will be gone in a few minutes at the cremation ground.',
  },
  {
    stage: 'payung',
    title: 'Payung',
    glossId: 'Payung dipasang di puncak, terakhir dan paling tinggi.',
    glossEn: 'The umbrella goes on at the top, last and highest.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { tumpang: 7, pemikul: 'empat-puluh', payung: true }

export const MIN_TUMPANG = 1
export const MAX_TUMPANG = 11

/** The rungs of the ladder are odd numbers, so an even count moves up one. */
export function normaliseRules(rules: Rules): Rules {
  const clamped = Math.min(MAX_TUMPANG, Math.max(MIN_TUMPANG, Math.round(rules.tumpang)))
  return {
    tumpang: clamped % 2 === 0 ? Math.min(MAX_TUMPANG, clamped + 1) : clamped,
    pemikul: rules.pemikul,
    payung: rules.payung,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
