/**
 * What the Orang Rimba sudung calls things.
 *
 * The twenty-ninth entry, and the only building here that ends by being
 * walked away from.
 *
 * A sudung is a shelter in the forest of Bukit Duabelas in Jambi: a single
 * slope of leaf on a light frame, over a floor just off the ground, built in
 * an afternoon out of what is within reach of where it stands. It is not a
 * lesser version of a house. It is what a house is for people who move —
 * and it ends the way it does because of *melangun*: when somebody dies, the
 * family leaves the place and does not come back to it.
 *
 * Three things make it worth building here.
 *
 * **It is ended by an event nobody chooses.** The bade is destroyed on a
 * schedule, the woloan house is taken apart to be sold and re-erected, the
 * waruga is made never to move at all. This one is simply left standing, and
 * what ends it is a death — so its life is not a length of time anybody could
 * plan for.
 *
 * **Its size is a row of sleeping bodies.** Four packs already measure a
 * person; all of them measure one standing, seated or folded, and all of them
 * measure a height. This is the first that measures bodies lying down, and
 * the first anthropometric figure in the project that decides a *plan*.
 *
 * **Every piece of it has to be carried by hand.** Nothing here is sawn,
 * hauled or bought: the longest member is what one or two people cut nearby
 * and carry to the spot, so the size of the building is bounded by an arm and
 * an afternoon.
 *
 * On the words: sudung, and melangun for the leaving. Those two are used;
 * everything else is named in Indonesian, on the joglo pack's policy — and
 * here that policy matters more than anywhere, because this is the
 * thinnest-sourced pack in the collection.
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
  | 'sandbukt-1988'
  | 'prasetijo-2011'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How long the shelter is meant to stand.
 *
 * `sehari` is the overnight kind: one slope of leaf, thrown up in an
 * afternoon on the way somewhere. `musim` stands for a season while a patch is
 * worked, and is the same building with more of it. Neither is permanent, and
 * the difference between them is not quality but expectation.
 */
export type Lama = 'sehari' | 'musim'

export interface Rules {
  /**
   * How many people sleep under it.
   *
   * The plan is a row of bodies lying side by side. It is the first size in
   * this project taken from people lying down, and the first anthropometric
   * figure here that decides a plan rather than a height.
   */
  readonly orang: number
  readonly lama: Lama
  /** whether the floor is lifted on short posts, or laid on the forest floor */
  readonly panggung: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tiang'  // poles cut nearby and stood up
  | 'lantai' // a platform of split poles, or none
  | 'atap'   // one slope of leaf
  | 'perkakas' // the few things brought to it, which are also what leaves

export const STAGE_ORDER: readonly Stage[] = ['tiang', 'lantai', 'atap', 'perkakas']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

/**
 * Three things, and all three are standing in the forest an hour before the
 * shelter is built. There is no stone under anything, nothing fired, nothing
 * bought and nothing sawn.
 *
 * Rattan is not in this list, though the whole building is tied together with
 * it: the lashings are joints, and a joint is not a part. The material set is
 * what parts are made *of*, and the test that asks whether a declared material
 * is actually used is what said so.
 */
export type MaterialKey = 'kayu' | 'bambu' | 'daun'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a rattan lashing, and it is the only fastening here */
  | 'ikat'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface RimbaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<RimbaKinds>
export type MeshPart = CoreMeshPart<RimbaKinds>
export type Part = CorePart<RimbaKinds>
export type Joint = CoreJoint<RimbaKinds>
export type House = CoreHouse<RimbaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  /** the sleeping floor: a row of bodies wide, and a body long */
  readonly floor: { readonly halfX: number; readonly halfZ: number; readonly y: number }
  /** the body the plan is measured from, and it is not from a book about Jambi */
  readonly body: { readonly lying: number; readonly shoulders: number; readonly gap: number }
  /** the single slope */
  readonly roof: { readonly highY: number; readonly lowY: number; readonly reach: number }
  /** the longest thing one or two people can cut nearby and carry here */
  readonly carry: number
  /** the longest member the shelter actually contains */
  readonly longest: number
  /** where the last shelter stands, left where it was */
  readonly abandoned: number

  readonly dims: readonly Dim[]
}
