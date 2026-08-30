/**
 * What the Butonese malige calls things.
 *
 * The twenty-sixth building, and the only one that gets wider as it rises.
 *
 * A malige is the Wolio sultanate's house at Baubau: four storeys of timber
 * jointed without a nail, standing inside the Keraton wall. Every storey
 * projects past the one below it, carried on brackets under the overhang, so
 * the building leans outward all the way up and its largest floor is its
 * highest one.
 *
 * No other building in this project has a floor larger than the one under it.
 * Several have roofs that oversail, which is a different thing; the Tobati
 * kariwari, the only other one with a named stack of floors, gets *smaller*
 * upward because the older age grades hold fewer people. This one is the other
 * way round, and it is the reason to build it: nothing in the core required a
 * plan to shrink as it rises, but every pack so far has quietly done it.
 *
 * The second reason is what the overhang costs. The projection is carried by
 * brackets, and how many brackets a household may put up is a rank rule — so
 * on this building **rank decides how far you may build outward**. It is the
 * only pack here where a social rule sets a cantilever.
 *
 * On the words: `malige` is the building and `pale` the bracket arms whose
 * number states rank. Those two are used. Everything else is named in
 * Indonesian, on the joglo pack's policy, because the author is not confident
 * enough of Wolio to print more.
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
  | 'zahari-1977'
  | 'depdikbud-1985'
  | 'schoorl-2003'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How many bracket arms carry each overhang, which is a rank.
 *
 * The Butonese classify a timber house by its pale. Four is the highest, three
 * the next, and a house entitled to none does not project at all — so the rule
 * does not decorate the building, it decides whether the building leans out
 * over its own footprint or stands straight up.
 */
export type Pale = 'pata' | 'talu' | 'tanpa'

export interface Rules {
  /** how many storeys stand, the fourth being the sultan's own */
  readonly tingkat: number
  readonly pale: Pale
  /** whether the projecting room at the top is built */
  readonly anjungan: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // the pad stones, and nothing is dug
  | 'tiang'   // the standing frame of the lowest storey
  | 'pale'    // the brackets, before the floor they carry
  | 'lantai'  // the floors, each one wider than the last
  | 'dinding' // boards between the posts
  | 'atap'    // shingles over the top storey

export const STAGE_ORDER: readonly Stage[] = ['batu', 'tiang', 'pale', 'lantai', 'dinding', 'atap']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'papan' | 'sirap' | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg driven through a mortise and tenon: there is no iron in this building */
  | 'pasak'
  /** a wedge, which is what tightens a bracket into the post it leans out of */
  | 'baji'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface ButonKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<ButonKinds>
export type MeshPart = CoreMeshPart<ButonKinds>
export type Part = CorePart<ButonKinds>
export type Joint = CoreJoint<ButonKinds>
export type House = CoreHouse<ButonKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One storey: a floor plate wider than the one under it, and how far it leans. */
export interface Tingkat {
  readonly index: number
  readonly y: number
  readonly halfX: number
  readonly halfZ: number
  /** how far this floor projects past the storey below, on every side */
  readonly oversail: number
  readonly height: number
}

export interface Layout {
  readonly rules: Rules

  readonly storeys: readonly Tingkat[]
  /** how many brackets carry each side of each overhang: the rank */
  readonly brackets: number
  /** how far a bracket can reach out from the post it leans from */
  readonly reach: number
  readonly padY: number
  readonly wallTop: number
  readonly ridgeY: number
  readonly anjungan: { readonly present: boolean; readonly halfX: number; readonly halfZ: number; readonly y: number }
  /** the fortress wall this house stands inside */
  readonly benteng: number

  readonly dims: readonly Dim[]
}
