/**
 * What the Sasak granary calls things.
 *
 * The twelfth building here, and the first that is not a house.
 *
 * A lumbung holds rice. Nobody lives in it, nobody sleeps in it, and there is
 * no storey in it a person could stand up in — and in a Sasak yard it is
 * routinely the most carefully made thing standing. That inverts an assumption
 * the other eleven share without stating it: that the care in a building tracks
 * the standing of the people inside. Here the care tracks the value of what is
 * stored, and the people sit underneath.
 *
 * Its defining detail follows from the same fact. Each post carries a broad
 * disc just below the floor, and that disc has exactly one job: a rat climbing
 * the post arrives under a wide flat overhang and cannot get past it. It is the
 * only element in this project whose function is directed at a non-human, and
 * `checkRatGuard` is the only check here whose subject is a path that must
 * *not* exist.
 *
 * On the words: `lumbung` is the term used throughout, and it is the only local
 * word this pack uses. The rat guard and the several parts of the roof all have
 * Sasak names that the author is not confident enough of to print, so they are
 * named in Indonesian — the policy the joglo pack set, applied here more widely
 * than anywhere else because the sourcing is thinner. The caution says so.
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
import type { RoofLevel } from '@/lib/core/hip'
import type { DimKey } from './rules'

export type { Bounds, ProvenanceClass, Vec3 } from '@/lib/core/types'
export type { DimKey } from './rules'
export type { RoofLevel }

export type SourceKey =
  | 'none'
  | 'depdikbud-ntb'
  | 'waterson-1990'
  | 'sumarni-2018'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Whose harvest it holds.
 *
 * A household's granary and a village's are the same building at different
 * sizes — but the village one stands in a row beside the meeting ground and is
 * built to be seen from it, which is why it is larger and why its roof comes
 * down further. The difference is not in kind, and that is worth saying,
 * because in most of this project a switch of this shape changes what the
 * building *is*.
 */
export type Milik = 'keluarga' | 'desa'

export interface Rules {
  readonly milik: Milik
  /** how many posts: four is usual, six for a larger store */
  readonly tiang: 4 | 6
  /**
   * Whether the space beneath is floored as a place to sit.
   *
   * People do sit under a lumbung — it is shaded, it is dry, and it is where
   * the work around the harvest happens. Flooring it is a choice about whether
   * the granary is also furniture. It changes nothing about the store above,
   * which is the point: the building's purpose is not up for negotiation, only
   * what happens in its shadow.
   */
  readonly kolong: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'      // the pad stones
  | 'tiang'     // the posts
  | 'penghalang' // the rat guards, and they go on before the floor
  | 'lantai'    // the floor of the store
  | 'dinding'   // the walls of the store
  | 'rangka'    // the roof frame
  | 'atap'      // the thatch
  | 'kolong'    // the sitting platform beneath, if there is one

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'tiang',
  'penghalang',
  'lantai',
  'dinding',
  'rangka',
  'atap',
  'kolong',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'batu'
  | 'kayu'
  | 'papan'
  | 'bambu'
  | 'alang' // grass thatch, as on the bale, the uma and the Arfak house

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a post foot on its stone */
  | 'tumpu'
  /** the guard threaded onto the post: it surrounds the post, not the reverse */
  | 'sarung'
  /** tenon and mortise, pegged */
  | 'pasak'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface SasakKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<SasakKinds>
export type MeshPart = CoreMeshPart<SasakKinds>
export type Part = CorePart<SasakKinds>
export type Joint = CoreJoint<SasakKinds>
export type House = CoreHouse<SasakKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One post, and the disc it carries. */
export interface Tiang {
  readonly id: string
  readonly x: number
  readonly z: number
  /** the guard's radius, which must exceed the post's own half-width */
  readonly guardRadius: number
  readonly guardY: number
}

export interface Layout {
  readonly rules: Rules

  readonly halfX: number
  readonly halfZ: number
  readonly posts: readonly Tiang[]
  readonly postSection: number
  readonly stoneHeight: number

  /** the store: a small box, and no part of it is for a person */
  readonly floorY: number
  readonly storeHalfX: number
  readonly storeHalfZ: number
  readonly storeHeight: number

  /**
   * The hood, as a stack of levels following a curve.
   *
   * A lumbung roof is not a straight-sided cone or hip: it swells outward from
   * the ridge and then falls steeply, and the eave comes down *below* the floor
   * of the store. The curve is approximated by many levels rather than by a new
   * primitive — see `roof.ts`.
   */
  readonly roof: readonly RoofLevel[]
  readonly eaveY: number
  readonly ridgeY: number
  readonly thatchCourses: number

  readonly seat: { readonly present: boolean; readonly y: number }

  readonly dims: readonly Dim[]
}
