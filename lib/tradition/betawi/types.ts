/**
 * What the Betawi rumah kebaya calls things.
 *
 * The thirty-second building, and the first whose neighbours are not kin.
 *
 * Every other entry in this collection is placed by a relationship. A
 * tongkonan faces north; a tanean is a family's yard; a ngadhu stands in its
 * clan's square; a betang lengthens for its households; a khaim is sited by a
 * tree; a sudung by wherever the family stopped. This one stands on a plot
 * beside a road, next to people it may never have met, and the line it may not
 * build past was drawn by somebody who is not family.
 *
 * That is the reason to build it, and it brings two things nothing else here
 * has.
 *
 * **A front room for strangers.** The langkan is a raised terrace open to the
 * road: a person can stand on it, be received on it, and do business on it
 * without ever being let into the house. Twenty-nine buildings here divide
 * space among people who belong to them; this one has a room for people who do
 * not.
 *
 * **A limit drawn by a neighbour.** The counterexample in every other pack
 * runs into a material, a body, a tree, a crowd or a rule the tradition itself
 * states. Here it runs into a boundary line — the first constraint in this
 * project that is somebody else's property.
 *
 * On the words: rumah kebaya for the house, named for a roof that folds like
 * the pleats of the blouse; langkan for the front terrace; gigi balang for the
 * carved fascia along the eave. Those three are used and everything else is
 * named in Indonesian, which on this building is not a policy but a fact —
 * Betawi is the language of the city this house is in.
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
  | 'depdikbud-1986'
  | 'heuken-2007'
  | 'swadarma-2013'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** Where the plot is: on the road, or behind other plots and reached by a path. */
export type Letak = 'pinggir-jalan' | 'dalam'

export interface Rules {
  /**
   * How many rooms the house holds behind its front room.
   *
   * A count like several here, and the first that is bounded by something
   * outside the household: rooms make the house wider, and the house may not
   * pass the boundary of a plot it does not own beyond.
   */
  readonly kamar: number
  readonly letak: Letak
  /** whether the carved fascia runs along the eaves */
  readonly gigiBalang: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'pondasi' // the brick plinth, on a plot with a line around it
  | 'rangka'  // the timber frame
  | 'dinding' // boards and brick, and the front left open
  | 'atap'    // the folded roof
  | 'hias'    // the fascia nailed along its eave
  | 'langkan' // the terrace for people who are not let in, and it comes last

/*
 * The fascia is nailed to the roof and so has to follow it directly: a joint
 * that skips a stage is a joint between two things that were never on site
 * together, and the terrace between them made it one. Putting the terrace last
 * is also how many of these were actually built — a langkan is a thing a
 * household adds when it can.
 */
export const STAGE_ORDER: readonly Stage[] = ['pondasi', 'rangka', 'dinding', 'atap', 'hias', 'langkan']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

/**
 * Five, and every one of them is bought.
 *
 * Nothing here is cut from the ground it stands on. The timber comes down a
 * river to a yard and is sold by the length; the tiles are fired somewhere
 * else; the floor is a tile a shop sells by the piece. It is the first
 * building in this project whose material list is a set of purchases.
 */
export type MaterialKey = 'kayu' | 'papan' | 'genteng' | 'bata' | 'ubin'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon, in the Javanese and Malay manner */
  | 'pasak'
  /** a nail: the first building here that has any, and it is a bought thing too */
  | 'paku'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface BetawiKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<BetawiKinds>
export type MeshPart = CoreMeshPart<BetawiKinds>
export type Part = CorePart<BetawiKinds>
export type Joint = CoreJoint<BetawiKinds>
export type House = CoreHouse<BetawiKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  /** the plot: a line drawn by somebody who is not family */
  readonly plot: { readonly halfX: number; readonly halfZ: number; readonly setback: number }
  /** the house on it */
  readonly house: { readonly halfX: number; readonly halfZ: number; readonly front: number }
  /** the terrace in front of the house, and outside its first door */
  readonly langkan: { readonly depth: number; readonly floorY: number; readonly railY: number }

  readonly floorY: number
  readonly wallTop: number
  readonly ridgeY: number
  /** the fold: where the roof changes pitch on its way down */
  readonly fold: { readonly at: number; readonly y: number; readonly upper: number; readonly lower: number }

  readonly gigiBalang: boolean
  /** how much room is left between the house and the line it may not cross */
  readonly margin: number

  readonly dims: readonly Dim[]
}
