/**
 * What the Sabu ammu hawu calls things.
 *
 * The thirty-first building, and the first that is a boat without being one.
 *
 * On Rai Hawu a house is built and spoken of as a vessel. The ridge is its
 * keel turned over, the two ends are its bow and its stern and are not
 * interchangeable, the frame is a hull, and the family aboard it are a crew. It
 * never floats, never moves and is thatched in lontar palm — and every one of
 * those facts is stated in the vocabulary of something that does.
 *
 * That is the reason to build it, and it lands eleven buildings after an
 * actual boat. The Bajau lepa is a hull a family lives in; this is a house
 * that says it is a hull. The pair is worth having because they let the
 * project ask a question it could not ask before: **is the likeness in the
 * shape, or only in the words?** `checkHullProportion` is the honest answer —
 * the plan really does hold a boat's proportion rather than a room's, and
 * `test/sabu.test.ts` holds that against the lepa's own hull, which is the
 * first time in this project one tradition's building has been measured
 * against another's.
 *
 * The second thing worth having is that the roof comes down almost to the
 * floor. A hull turned over has no walls to speak of, and neither does this:
 * what would be a wall is the lower part of the roof, and the way in is a gap
 * left under the eave.
 *
 * On the words: ammu hawu is the house, duru the loft over the inner room.
 * The ends are named here in Indonesian — haluan and buritan, bow and stern —
 * because the author is not confident of the Sabu terms. That is the joglo
 * pack's policy, and on this building it is also the argument: even the
 * borrowed words are a boat's.
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
  | 'fox-1977'
  | 'duggan-2016'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** Which palm the roof is thatched in, and they are not the same island economy. */
export type Atap = 'lontar' | 'gewang'

export interface Rules {
  /**
   * How many bays the hull is long.
   *
   * A household tally like several here — and the one that decides whether the
   * plan still holds a boat's proportion, because a house grows in bays and a
   * boat has a shape.
   */
  readonly ruang: number
  readonly atap: Atap
  /** whether the loft over the inner room is built, where the lontar stores hang */
  readonly duru: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // stones, and nothing dug
  | 'tiang'   // the posts, four of them named and not interchangeable
  | 'lantai'  // the floor of the hull
  | 'lunas'   // the ridge, which is called the keel
  | 'atap'    // the palm thatch, down to the floor
  | 'duru'    // the loft, last, where the lontar is kept

export const STAGE_ORDER: readonly Stage[] = ['batu', 'tiang', 'lantai', 'lunas', 'atap', 'duru']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'papan' | 'bambu' | 'lontar' | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon */
  | 'pasak'
  /** a lashing, which is what a hull's ribs are held with */
  | 'ikat'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface SabuKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<SabuKinds>
export type MeshPart = CoreMeshPart<SabuKinds>
export type Part = CorePart<SabuKinds>
export type Joint = CoreJoint<SabuKinds>
export type House = CoreHouse<SabuKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  /** the hull: long along Z, and its two ends are not alike */
  readonly halfX: number
  readonly halfZ: number
  readonly ratio: { readonly actual: number; readonly least: number; readonly most: number }

  readonly floorY: number
  readonly ridgeY: number
  /** where the thatch stops, which is nearly the floor */
  readonly eaveY: number
  /** the gap left under the eave, which is the only way in */
  readonly door: { readonly width: number; readonly head: number }

  /** bow and stern, and what is at each of them */
  readonly bow: number
  readonly stern: number
  readonly duru: { readonly present: boolean; readonly y: number; readonly halfZ: number }

  readonly dims: readonly Dim[]
}
