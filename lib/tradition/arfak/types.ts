/**
 * What the Arfak house calls things.
 *
 * The eleventh house, and the direct opposite of the sixth.
 *
 * The Nias omo answers a moving ground by *resisting* it: every bay of its
 * substructure is triangulated, because a rectangle racks and a triangle does
 * not. The rumah kaki seribu — the thousand-legged house — answers the same
 * problem the other way. It stands on a forest of small posts, none of them
 * braced to any other and none of them fixed into the earth, and when the
 * ground moves the posts move with it. Nothing is asked to be rigid. The
 * building sways and stays up.
 *
 * Two houses, one problem, opposite answers — which is the strongest thing
 * eleven houses have produced, because it shows that a rule of the second kind
 * (about the earth rather than about people) does not determine a form any
 * more than a rule of the first kind does. `checkNothingIsBraced` states this
 * one, and it is the exact negation of `checkBracing`: no diagonal anywhere in
 * the substructure, and no post rigidly tied to its neighbour.
 *
 * On the words: this house is called igkojei by the Arfak and is widely known
 * in Indonesian as rumah kaki seribu. Papua Barat has many peoples and the
 * literature on this building is thin; what is here leans on the Depdikbud
 * survey volumes and is flagged in the caution as the least-sourced pack in
 * the project. Where the author is not confident, the part is named in
 * Indonesian.
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
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Who lives in it.
 *
 * A family house and a house for a whole clan are the same building at
 * different lengths — but the clan house divides down the middle, men on one
 * side and women on the other, with a passage between. So the switch changes
 * what is inside rather than what is outside, which is the same kind of rule
 * as the mbaru niang's drum and the opposite of the saoraja's gable.
 */
export type Huni = 'keluarga' | 'marga'

export interface Rules {
  readonly huni: Huni
  /** how many bays long; the plan grows only in whole bays */
  readonly ruang: number
  /**
   * How closely the legs stand, as a count across the width.
   *
   * Not a structural rule in the ordinary sense: more legs do not make the
   * building stiffer, because none of them is braced. They spread the load so
   * that no single leg has to be big, which is what lets the whole substructure
   * be made of poles a person can carry — and it is why the house is named for
   * having a thousand of them rather than for having strong ones.
   */
  readonly kaki: number
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'kaki'    // the legs, and there are a great many
  | 'balok'   // the bearers laid across them
  | 'lantai'  // the sprung floor
  | 'dinding' // the bark walls
  | 'sekat'   // the division down the middle, in a clan house
  | 'rangka'  // the roof frame
  | 'atap'    // the thatch
  | 'tangga'  // the log at the door

export const STAGE_ORDER: readonly Stage[] = [
  'kaki',
  'balok',
  'lantai',
  'dinding',
  'sekat',
  'rangka',
  'atap',
  'tangga',
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
  | 'kulit'  // bark sheet, wall and floor: the fifth wall material and its own thing
  | 'bambu'
  | 'alang'  // grass thatch, as on the bale and the uma

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /**
   * A lashing, and it is the only kind here.
   *
   * Not a pegged tenon and not a notch: the members are tied, so the
   * connection can work a little without breaking. That is the whole
   * structural argument of the building, stated at the scale of one joint.
   */
  | 'ikat'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface ArfakKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<ArfakKinds>
export type MeshPart = CoreMeshPart<ArfakKinds>
export type Part = CorePart<ArfakKinds>
export type Joint = CoreJoint<ArfakKinds>
export type House = CoreHouse<ArfakKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One of the legs. There are a great many and none of them is special. */
export interface Kaki {
  readonly id: string
  readonly x: number
  readonly z: number
  readonly row: number
  readonly col: number
  /** how far its head leans off its foot, and in which direction */
  readonly leanX: number
  readonly leanZ: number
}

export interface Layout {
  readonly rules: Rules

  readonly halfX: number
  readonly halfZ: number
  readonly bays: number

  readonly floorY: number
  readonly legSection: number
  readonly legs: readonly Kaki[]
  readonly rows: number
  readonly cols: number

  readonly wallHeight: number
  readonly divided: boolean
  readonly passageWidth: number

  readonly eaveY: number
  readonly ridgeY: number
  readonly eaveHalfX: number
  readonly eaveHalfZ: number
  readonly thatchCourses: number

  readonly doorZ: number

  readonly dims: readonly Dim[]
}
