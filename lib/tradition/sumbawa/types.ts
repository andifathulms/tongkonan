/**
 * What the Sumbawa Dalam Loka calls things.
 *
 * The thirty-fifth building, and the first whose plan is a number out of a
 * text.
 *
 * Dalam Loka is the sultan's palace at Sumbawa Besar, raised on ninety-nine
 * posts — the count of the names of God. Every other tally in this project is
 * a count of something in front of you: households in a betang, clans in a
 * baileo, hearths in a khaim, seats in a sasadu, shoulders under a bade,
 * bodies lying down in a sudung. This one is not counted off the world at all.
 * It is given, it is exact, and the building has to be arranged around it.
 *
 * Two consequences follow and both are the reason to build it.
 *
 * **The grid is not free.** Ninety-nine factors as nine by eleven, so that is
 * what the frame is: the rule does not merely decorate a plan, it fixes its
 * shape up to which way round it is laid.
 *
 * **Growth has to come out of the spans.** A household that wants a larger
 * palace cannot add posts, because the number is not theirs to change — so the
 * only thing left to enlarge is the distance between them, and that runs into
 * what a beam will cross. It is the first building here whose limit follows
 * from a count somebody else fixed.
 *
 * On the words: Dalam Loka for the palace, bala rea for its great hall.
 * Everything else is named in Indonesian, on the joglo pack's policy.
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
  | 'ntb-2012'
  | 'goethals-1961'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Which way the grid is laid.
 *
 * Ninety-nine is nine elevens, so the frame is nine post lines one way and
 * eleven the other. What a household may choose is which way round — and that
 * is the only freedom the number leaves in the plan.
 */
export type Susunan = 'sembilan-lintang' | 'sebelas-lintang'

export interface Rules {
  /** how many rooms the great hall is divided into behind its open front */
  readonly bilik: number
  readonly susunan: Susunan
  /** whether the covered walkway to the women's quarters is built */
  readonly serambi: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // stones, ninety-nine of them
  | 'tiang'   // the posts, and there are exactly ninety-nine
  | 'lantai'  // bearers and floor
  | 'dinding' // boards, and the divisions of the great hall
  | 'atap'    // one roof over both halls
  | 'serambi' // the walkway, last

export const STAGE_ORDER: readonly Stage[] = ['batu', 'tiang', 'lantai', 'dinding', 'atap', 'serambi']

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
  /** a peg through a mortise and tenon */
  | 'pasak'
  /** a wedged tenon, which is what ties a bearer down onto its post */
  | 'baji'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface SumbawaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<SumbawaKinds>
export type MeshPart = CoreMeshPart<SumbawaKinds>
export type Part = CorePart<SumbawaKinds>
export type Joint = CoreJoint<SumbawaKinds>
export type House = CoreHouse<SumbawaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  /** the grid the number fixes: rows across X, lines along Z */
  readonly grid: { readonly across: number; readonly along: number; readonly posts: number }
  readonly spacing: { readonly bay: number; readonly limit: number }
  readonly halfX: number
  readonly halfZ: number

  readonly floorY: number
  readonly wallTop: number
  readonly ridgeY: number

  /** the two halls under one roof, and the divisions inside the great one */
  readonly halls: readonly { readonly key: string; readonly from: number; readonly to: number }[]
  readonly bilik: readonly number[]
  readonly serambi: { readonly present: boolean; readonly x: number; readonly reach: number; readonly floorY: number }

  readonly dims: readonly Dim[]
}
