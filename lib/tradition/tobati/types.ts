/**
 * What the Tobati-Enggros kariwari calls things.
 *
 * The sixteenth building, and the first that does not stand on land.
 *
 * Every other building in this collection has ground under it — earth,
 * masonry, a tidal swamp, a cleared slope. A kariwari stands in the water of
 * Youtefa Bay, on posts driven into the mud, and everything that follows from
 * that is different in kind rather than in degree: there is no pad stone under
 * any post, because there is nothing to stand a stone on; the height of the
 * floor is not a matter of privacy or livestock but of high water; and the
 * building is reached along a walkway or not at all.
 *
 * Its second peculiarity is what the storeys are for. A tongkonan divides
 * vertically into three worlds, a rumah limas into ranks, a honai into a room
 * and the warm place above it. Here the levels are *ages*: boys are taught on
 * the lowest, young men live on the one above, and the elders meet at the top.
 * A person does not choose their level and does not stay on it. They climb it,
 * once, over a lifetime — which makes this the only building in the project
 * whose section is a biography.
 *
 * And it is eight-sided, which nothing else here is: the others are
 * rectangles or circles, and an octagon is neither.
 *
 * On the words: kariwari, and the peoples' own names Tobati and Enggros. The
 * parts are named in Indonesian, on the policy the joglo pack set.
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
  | 'depdikbud-papua'
  | 'mansoben-1995'
  | 'kemendikbud-kariwari'

/* ── Rules — the socially meaningful input set ────────────────────────── */

export interface Rules {
  /**
   * How many levels the house holds, which is how many age grades it holds.
   *
   * Two or three. Not a size and not a rank: each level is a stage of life, and
   * the count is how finely this house divides one. Adding the third does not
   * make the building grander — it makes the boys' floor a floor of its own
   * instead of a corner of the young men's.
   */
  readonly tingkat: number
  /**
   * Whether a walkway runs from the shore.
   *
   * The village is over the water and its houses are joined by titian; a
   * kariwari reached only by canoe is a kariwari that fewer people reach. The
   * flag is here because it is the one thing about this building that is about
   * who gets to it rather than about who is inside it.
   */
  readonly titian: boolean
}

/*
 * Two rules, where every other pack has three, and the shortfall is the
 * finding rather than a gap.
 *
 * The other fifteen buildings vary in ways their own sources record: a rank, a
 * lineage system, a tier count, a household tally, a body, a roof type. What
 * the sources record about kariwari is the number of levels and the walkway,
 * and no third variation is described anywhere the author could find. Adding
 * one to match the shape of the other packs would be inventing a variation
 * nobody has ever built — which is a worse thing to invent than a metre.
 */

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tiang'   // the posts, driven into the bed
  | 'gelagar' // the bearers, above high water
  | 'lantai'  // the floors, one per age grade
  | 'dinding' // the eight walls
  | 'tangga'  // the poles between the levels
  | 'rangka'  // the eight-sided frame of the peak
  | 'atap'    // sago thatch on it
  | 'titian'  // the walkway to the shore, last

/**
 * The poles between the levels go in after the roof, not before it.
 *
 * `checkJointStages` is what settled it: a rafter lands on the head of the
 * wall it stands on, and with the ladders between them that joint spanned two
 * stages. It is also how the work goes — a notched pole is dropped into a
 * finished shell, which is the same order the honai's loft is fitted in.
 */
export const STAGE_ORDER: readonly Stage[] = [
  'tiang',
  'gelagar',
  'lantai',
  'dinding',
  'rangka',
  'atap',
  'tangga',
  'titian',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'kayu'
  | 'papan'
  | 'bambu'
  | 'rumbia'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing */
  | 'ikat'
  /** a bearer notched over a post */
  | 'takik'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface TobatiKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<TobatiKinds>
export type MeshPart = CoreMeshPart<TobatiKinds>
export type Part = CorePart<TobatiKinds>
export type Joint = CoreJoint<TobatiKinds>
export type House = CoreHouse<TobatiKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One level of the house, which is one stage of a life. */
export interface Tingkat {
  readonly index: number
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  /** floor level, and the radius of the octagon at it */
  readonly y: number
  readonly radius: number
  readonly height: number
  /** floor area, which falls as the grade rises */
  readonly area: number
}

export interface Layout {
  readonly rules: Rules

  /** eight, always: the plan is an octagon and that is canon */
  readonly facets: number
  readonly radius: number
  readonly postSection: number

  /** the bed the posts are driven into is y = 0; the water lies on it */
  readonly waterDepth: number
  readonly tide: number
  /** the underside of the lowest floor, above the highest water */
  readonly freeboard: number

  readonly levels: readonly Tingkat[]
  readonly plateY: number
  /** the radius at the head of the battered posts */
  readonly topRadius: number
  readonly apexY: number
  readonly eaveOversail: number
  readonly thatchCourses: number

  readonly ladder: { readonly radius: number; readonly width: number }
  readonly walkway: { readonly present: boolean; readonly y: number; readonly width: number; readonly reach: number }

  readonly dims: readonly Dim[]
}
