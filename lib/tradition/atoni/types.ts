/**
 * What the Atoni ume kbubu calls things.
 *
 * The twenty-eighth building, and the only one that must not breathe.
 *
 * An ume kbubu is a round house in the hills of South Central Timor: a low
 * dome of thatch to the ground, one door a person has to stoop through, no
 * window at all, a fire on the floor and a loft above it where the seed corn
 * hangs. The smoke is the point. It cures the maize, keeps the weevils out of
 * it, and holds it fit to plant until the next rains — so the building is a
 * granary you live in, and it is built to trap what every other roof in this
 * project is built to let go.
 *
 * That is the argument, and it needs stating carefully because a Dani honai
 * is also round, also thatched to the ground, and also dark. Roundness says
 * nothing on its own — the mbaru niang and the honai settled that between
 * them, forty times apart in volume. What separates this one is the *purpose
 * of the smoke*: the honai's fire answers cold nights at sixteen hundred
 * metres, and its loft is where people sleep. Here the fire answers rot and
 * insects, and the loft is where the seed is. A honai is a room with a fire in
 * it; an ume kbubu is a store with a fire under it and people in the gap.
 *
 * The second thing worth having is the lopo, which by rule stands in the same
 * yard: an open round pavilion on posts, all air and no wall, with its own
 * raised store. The same people build a thing that must not ventilate and a
 * thing that is nothing but ventilation, a few metres apart, and both are
 * round with a conical thatch roof.
 *
 * On the words: ume kbubu is the house, lopo the open pavilion. Those two are
 * used; everything else is named in Indonesian, on the joglo pack's policy.
 */

import type { Kinds } from '@/lib/core/kinds'
import type {
  BoxPart as CoreBoxPart,
  Dim as CoreDim,
  House as CoreHouse,
  Joint as CoreJoint,
  MeshPart as CoreMeshPart,
  Part as CorePart,
  Source as CoreSource,
} from '@/lib/core/types'
import type { DimKey } from './rules'

export type { Bounds, ProvenanceClass, Vec3 } from '@/lib/core/types'
export type { DimKey } from './rules'

export type SourceKey =
  | 'none'
  | 'anthropometry'
  | 'schulteNordholt-1971'
  | 'cunningham-1964'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * What the thatch does when it reaches the bottom.
 *
 * Both forms are built. `penuh` takes the thatch to the ground, so there is no
 * wall at all and the roof is the whole building; `rendah` stands it on a low
 * timber wall, which is a little more room and a little more to lose.
 */
export type Dinding = 'penuh' | 'rendah'

export interface Rules {
  /**
   * How many harvests of seed the loft has to hold.
   *
   * The only size in this project taken from a length of *time*. A household
   * that keeps one year's seed is a household that must have a good year; four
   * is insurance against three bad ones in a row. It sets how deep the loft is
   * and therefore how tall the house has to be over the fire.
   */
  readonly simpanan: number
  readonly dinding: Dinding
  /** whether the open pavilion stands in the same yard */
  readonly lopo: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tiang'  // the ring of posts, and the middle one the loft hangs from
  | 'rangka' // the rafters that make the dome
  | 'para'   // the loft, fitted before the roof closes over it
  | 'atap'   // the thatch, to the ground or to a low wall
  | 'tungku' // the hearth, laid last on the floor under the loft
  | 'lopo'   // the open pavilion in the same yard

export const STAGE_ORDER: readonly Stage[] = ['tiang', 'rangka', 'para', 'atap', 'tungku', 'lopo']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'bambu' | 'alang' | 'batu' | 'tanah'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing of split bamboo or fibre, which is nearly everything here */
  | 'tali'
  /** a fork: a rafter dropped into the crotch of the centre post */
  | 'cabang'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface AtoniKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<AtoniKinds>
export type MeshPart = CoreMeshPart<AtoniKinds>
export type Part = CorePart<AtoniKinds>
export type Joint = CoreJoint<AtoniKinds>
export type House = CoreHouse<AtoniKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  readonly radius: number
  readonly facets: number
  /** the ring of posts, and the height of the eave or the low wall on them */
  readonly wallY: number
  readonly apexY: number
  readonly profile: readonly { readonly r: number; readonly y: number }[]

  /** the loft: where the seed is, and how far it sits above the fire */
  readonly loft: { readonly radius: number; readonly y: number; readonly depth: number; readonly years: number }
  /** the band of smoke the seed has to hang in, which is the author's */
  readonly smoke: { readonly from: number; readonly to: number }
  readonly hearth: { readonly radius: number; readonly height: number }
  readonly door: { readonly width: number; readonly height: number; readonly halfAngle: number }
  /** the body the door is measured against, and it is not from a book about Timor */
  readonly body: { readonly standing: number; readonly stooping: number }
  readonly lopo: { readonly present: boolean; readonly radius: number; readonly floorY: number; readonly apexY: number }

  readonly dims: readonly Dim[]
}
