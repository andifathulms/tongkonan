/**
 * What the Balinese bade calls things.
 *
 * The twenty-third building, and the only one made in order to be destroyed.
 *
 * A bade is the tower a body is carried to the cremation ground on. It is
 * built in a few weeks out of bamboo, timber, cloth and paper; it is lifted
 * onto the shoulders of dozens of people; it is carried, turned at every
 * crossroads so the spirit cannot find its way back, and burned. Nothing of it
 * is meant to exist the next morning.
 *
 * Twenty-two buildings in this project are made to stand. One of them, the
 * woloan house, is made to be taken apart and put up again somewhere else, and
 * one, the waruga, is made never to move at all. This one is made to be
 * carried once and then to stop existing — and the three of them together are
 * the whole range of answers to how long a building is for.
 *
 * It has no foundation. Nothing about it is fixed to the earth, because the
 * earth is not where it is going. What holds it up is a lattice of bamboo that
 * a crowd puts its shoulders under, so the thing this building has to do that
 * no other must is **balance over the people carrying it**.
 *
 * And it is the second Balinese building here, which is worth reading beside
 * the first. A bale is measured in units of its owner's living body and is
 * meant to outlast them. A bade is measured against the number of people who
 * can get under it, and is meant to outlast nobody.
 *
 * On the words: bade is the tower; tumpang the tiers; the bearers are called
 * by what they do. Where the author is not confident of the Balinese term the
 * part is named in Indonesian, on the joglo pack's policy.
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
  | 'covarrubias-1937'
  | 'eiseman-1990'
  | 'gelebet-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** How many shoulders go under it, which is a size and a claim at once. */
export type Pemikul = 'dua-puluh' | 'empat-puluh' | 'delapan-puluh'

export interface Rules {
  /**
   * How many tiers the tower carries.
   *
   * The count is the standing of the dead, and it runs 1, 3, 5, 7, 9, 11 —
   * odd, because the ladder of ranks is made of odd numbers rather than
   * because parity is the rule. The rumoh Aceh's ladder is the parity rule in
   * this project: there the tradition fixes that a number is odd and nothing
   * else about it. Here what is fixed is a ladder, and its rungs happen to be
   * odd numbers.
   */
  readonly tumpang: number
  readonly pemikul: Pemikul
  /** whether the crowning umbrella is fitted */
  readonly payung: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'usungan' // the carrying lattice, which is this building's whole foundation
  | 'badan'   // the body of the tower, where the dead ride
  | 'tumpang' // the tiers, counted
  | 'kain'    // the cloth and paper that cover it
  | 'payung'  // the umbrella at the top, last

export const STAGE_ORDER: readonly Stage[] = ['usungan', 'badan', 'tumpang', 'kain', 'payung']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

/**
 * Four substances, and every one of them burns.
 *
 * There is no stone in this list and no iron. That is not an omission: what is
 * built here has to go up in an afternoon, be light enough to lift, and leave
 * nothing behind. The waruga's material list has one member and it is the one
 * that lasts; this one has four and not one of them does.
 */
export type MaterialKey = 'bambu' | 'kayu' | 'kain' | 'kertas'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing of split rattan or cord: fast to tie and nothing to salvage */
  | 'tali'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface BadeKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<BadeKinds>
export type MeshPart = CoreMeshPart<BadeKinds>
export type Part = CorePart<BadeKinds>
export type Joint = CoreJoint<BadeKinds>
export type House = CoreHouse<BadeKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One tier: a roof in a stack of roofs that shelter nothing. */
export interface Tumpang {
  readonly index: number
  readonly y: number
  readonly halfX: number
  readonly halfZ: number
  readonly rise: number
}

export interface Layout {
  readonly rules: Rules

  /** the lattice the crowd carries: its plan, and how many shoulders */
  readonly frame: { readonly halfX: number; readonly halfZ: number; readonly y: number; readonly bearers: number }
  /** where the body rides */
  readonly body: { readonly y: number; readonly halfX: number; readonly halfZ: number; readonly height: number }
  readonly tiers: readonly Tumpang[]
  readonly apexY: number
  readonly payung: { readonly present: boolean; readonly radius: number; readonly y: number }

  /** how far the centre may sit from the middle of the lattice */
  readonly tipLimit: number

  readonly dims: readonly Dim[]
}
