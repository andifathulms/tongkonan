/**
 * What the Riau balai selaso jatuh kembar calls things.
 *
 * The thirty-fourth building, and the first where moving is done lower than
 * sitting.
 *
 * A balai selaso jatuh kembar is a Malay council hall: a raised floor in the
 * middle where people sit, and along each side an aisle — a selaso — whose
 * floor has *fallen*, one step below it. Twin, because there are two of them
 * and they are alike. You walk the length of the building in the low part and
 * you step up to be in the room.
 *
 * Every other building here that steps a floor steps it *up* to say something
 * about the person standing on the higher part. A rumah limas seats a guest on
 * the step that matches their standing; a rumah gadang raises an anjuang at the
 * ends under one of the two laras; a malige lifts a storey for the sultan. This
 * one lowers a floor to say something about an *activity*: passing through is
 * not being present, so the passage is not on the level of the room.
 *
 * On the words: selaso for the aisle, jatuh for the fall in its floor, kembar
 * because there are two and they match, anjung for a raised end room, and
 * selembayung for the crossed finials at the ends of the ridge. Those are used;
 * everything else is named in Indonesian, which for this building is close to
 * its own language anyway.
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
  | 'depdikbud-1986'
  | 'effendy-2004'
  | 'wahid-2013'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** How many raised end rooms the hall carries: none, one, or one at each end. */
export type Anjung = 'tidak' | 'satu' | 'dua'

export interface Rules {
  /**
   * How many bays long the seated room is — which is how many people the
   * council seats, and therefore how long the two aisles beside it run.
   */
  readonly ruang: number
  readonly anjung: Anjung
  /** whether the rear deck is built */
  readonly pelantar: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'     // stones, and nothing dug
  | 'tiang'    // the posts
  | 'lantai'   // the middle floor, and the two fallen ones beside it
  | 'dinding'  // low boarding, and none across the aisles
  | 'atap'     // one roof over all three floors
  | 'selembayung' // the crossed finials, last

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'tiang',
  'lantai',
  'dinding',
  'atap',
  'selembayung',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'papan' | 'sirap' | 'batu' | 'ukiran'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon */
  | 'pasak'
  /** a wedged tenon, which is what takes the drop between two floor levels */
  | 'baji'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface RiauKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<RiauKinds>
export type MeshPart = CoreMeshPart<RiauKinds>
export type Part = CorePart<RiauKinds>
export type Joint = CoreJoint<RiauKinds>
export type House = CoreHouse<RiauKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One of the two fallen aisles, and they are meant to be alike. */
export interface Selaso {
  readonly side: -1 | 1
  readonly halfX: number
  readonly x: number
  readonly floorY: number
}

export interface Layout {
  readonly rules: Rules

  readonly middle: { readonly halfX: number; readonly halfZ: number; readonly floorY: number }
  readonly aisles: readonly Selaso[]
  /** how far the aisle floor has fallen, and the most a single step may be */
  readonly drop: { readonly fall: number; readonly step: number }
  readonly anjung: readonly { readonly z: number; readonly floorY: number; readonly halfZ: number }[]
  readonly pelantar: { readonly present: boolean; readonly z: number; readonly floorY: number }

  readonly wallTop: number
  readonly ridgeY: number
  readonly selembayung: number

  readonly dims: readonly Dim[]
}
