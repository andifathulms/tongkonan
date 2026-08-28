/**
 * What the Dayak longhouse calls things.
 *
 * The seventh house, and the first whose plan has no fixed proportion.
 *
 * Every building in this project so far has a shape that its rules size. A
 * tongkonan's rank scales it, a bale's depa measures it, an omo's bay count
 * lengthens it within a form that stays recognisably the same object. A betang
 * does something none of them does: it *aggregates*. Each household that joins
 * adds its own bilik and its own share of the veranda to the end of the
 * building, and the result is a house that may be forty metres long or two
 * hundred, with no proportion governing the difference — because the length is
 * not a proportion. It is a census.
 *
 * That breaks an assumption the other six shared silently: that a building has
 * a characteristic size. Here `checkNoCharacteristicLength` states the
 * opposite, and it is the only invariant in this project that passes by
 * showing a ratio *failing* to stay put.
 *
 * On the words: betang, bilik, sami and hejot are the terms used here. Dayak
 * is many peoples and many languages, and the longhouse is not one building
 * with one vocabulary — the terms below lean Ngaju and Ot Danum, which is
 * stated on the reading route rather than smoothed over. Where the author is
 * not confident, the part is named in Indonesian.
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
  | 'sellato-1989'
  | 'waterson-1990'
  | 'depdikbud-kalteng'
  | 'schiller-1997'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Which end the building grows from.
 *
 * A betang is extended by adding bilik, and where they are added is not
 * arbitrary: one end of the building is the senior end, and a household's
 * position along the length says something about its standing and its age in
 * the house. Growing from the junior end leaves the senior end where it was;
 * growing from both keeps the middle fixed and is what a house does when it is
 * absorbing families faster than it is ranking them.
 */
export type Tumbuh = 'hilir' | 'hulu' | 'dua-arah'

export interface Rules {
  /**
   * How many households live in it.
   *
   * The only rule in this project whose value has no upper bound in principle.
   * A betang is as long as its households require, so this is a census rather
   * than a dimension — and it is why this house has no characteristic length.
   */
  readonly keluarga: number
  readonly tumbuh: Tumbuh
  /**
   * Whether the veranda is roofed for its whole length.
   *
   * The sami is the common gallery running the length of the house in front of
   * the bilik, and it is where the household that is the village actually
   * lives. Roofing all of it is a statement about how much of life is lived in
   * common; leaving the far end open is what a house does when its length has
   * outrun its means.
   */
  readonly sami: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tiang'   // the ironwood posts, tall and driven
  | 'gelagar' // the bearers spanning between them
  | 'lantai'  // the floor: bilik and gallery together
  | 'bilik'   // the family rooms, one per household
  | 'sami'    // the common gallery in front of them
  | 'atap'    // the roof frame and its shingles
  | 'hejot'   // the notched log that is the only way up

export const STAGE_ORDER: readonly Stage[] = [
  'tiang',
  'gelagar',
  'lantai',
  'bilik',
  'sami',
  'atap',
  'hejot',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'ulin'   // ironwood: the reason these buildings last, and named because it is
  | 'papan'  // board
  | 'sirap'  // ironwood shingle, split not sawn
  | 'bambu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a bearer let into the head of a post */
  | 'takik'
  /** tenon and mortise, pegged */
  | 'pasak'
/*
 * There is no third kind, and the absence is the point: the hejot is leaned
 * against the gallery edge and joined to nothing, so that it can be taken
 * away. This house has the fewest joint kinds of the seven for a reason a
 * reader can see.
 */

/* ── The binding ──────────────────────────────────────────────────────── */

export interface DayakKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<DayakKinds>
export type MeshPart = CoreMeshPart<DayakKinds>
export type Part = CorePart<DayakKinds>
export type Joint = CoreJoint<DayakKinds>
export type House = CoreHouse<DayakKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * One household's share of the building.
 *
 * The unit the house is made of, and the reason its length is a count. Each
 * carries a bilik and the stretch of gallery in front of it, and they are
 * identical apart from where they sit — which is the whole point: a betang is
 * not a large house divided up, it is a row of equal shares that happen to be
 * under one roof.
 */
export interface Share {
  readonly id: string
  readonly index: number
  /** centre of this household's stretch, along Z */
  readonly z: number
  readonly halfZ: number
}

export interface Layout {
  readonly rules: Rules

  /** X runs across the building: gallery in front, bilik behind. Z is length. */
  readonly bilikDepth: number
  readonly samiDepth: number
  readonly halfX: number
  readonly halfZ: number
  readonly length: number

  readonly floorY: number
  readonly wallHeight: number
  readonly postSection: number

  readonly shares: readonly Share[]
  /** posts run in rows across and ranks along; the ranks follow the shares */
  readonly postRows: readonly number[]
  readonly postRanks: readonly number[]

  readonly eaveY: number
  readonly ridgeY: number
  readonly eaveHalfX: number
  readonly shingleCourses: number

  /** how far the gallery is roofed, as a share of the length */
  readonly samiRoofed: number

  /** the notched log, at the end the house is entered from */
  readonly hejot: { readonly z: number; readonly reach: number }

  readonly dims: readonly Dim[]
}
