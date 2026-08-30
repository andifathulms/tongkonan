/**
 * What the Sahu sasadu calls things.
 *
 * The thirty-third building, and the one that states a difference in a
 * clearance.
 *
 * A sasadu is the hall of a Sahu village in west Halmahera: open on every
 * side, roofed in sago leaf that comes down low, and used for the meetings and
 * the eating together that hold a village to itself. It has several entrances
 * and they are not the same height. Which one a person comes in by depends on
 * who they are — and every one of them is low enough that they have to bow to
 * do it.
 *
 * That is the reason to build it, and it is the exact inverse of a building
 * already here. The Maluku baileo's `checkPlacesAreEqual` says several things
 * of one kind must be *the same*, and the refusal to step its floor is the
 * statement. This one differs its openings on purpose: the difference is the
 * statement, and it is said in centimetres of headroom rather than in size,
 * position, height or number, which is how the other thirty-two say it.
 *
 * The second thing worth having is that nobody escapes the gesture. The
 * highest of the doors is still lower than a standing adult, so the bow is not
 * something the low-ranking do — it is what the building requires of everyone
 * who comes in, including whoever the lowest door was made low for.
 *
 * On the words: sasadu for the hall itself. Everything else is named in
 * Indonesian, on the joglo pack's policy, because the author is not confident
 * enough of Sahu to print more.
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
  | 'visser-1989'
  | 'depdikbud-1985'
  | 'yasin-2018'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How many entrances the hall has, and therefore how many kinds of person it
 * distinguishes on the way in.
 */
export type Pintu = 'dua' | 'tiga' | 'empat'

export interface Rules {
  /**
   * How many bays long the hall is, which is how many people can sit down to
   * eat at once. A headcount like the bade's — and here it decides the size of
   * a room rather than the size of a thing carried.
   */
  readonly bentang: number
  readonly pintu: Pintu
  /** whether the red and white cloths are tied to the posts */
  readonly kain: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'   // stones, and nothing dug
  | 'tiang'  // the posts, standing in the open
  | 'lantai' // the floor and the benches round it
  | 'atap'   // sago leaf, low enough to bow under
  | 'pintu'  // the openings, each cut to its own height
  | 'kain'   // the cloths, last

export const STAGE_ORDER: readonly Stage[] = ['batu', 'tiang', 'lantai', 'atap', 'pintu', 'kain']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'papan' | 'rumbia' | 'bambu' | 'batu' | 'kain'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon */
  | 'pasak'
  /** a lashing of rattan, which is what holds the leaf */
  | 'tali'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface SahuKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<SahuKinds>
export type MeshPart = CoreMeshPart<SahuKinds>
export type Part = CorePart<SahuKinds>
export type Joint = CoreJoint<SahuKinds>
export type House = CoreHouse<SahuKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One entrance: a side, a width, and a head height that is not like the others. */
export interface Bukaan {
  readonly index: number
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  /** which face it is in: −1 or +1 on X, or −1 or +1 on Z */
  readonly axis: 0 | 2
  readonly side: -1 | 1
  readonly width: number
  readonly head: number
}

export interface Layout {
  readonly rules: Rules

  readonly halfX: number
  readonly halfZ: number
  readonly floorY: number
  readonly eaveY: number
  readonly ridgeY: number

  readonly doors: readonly Bukaan[]
  /** the body every one of those heads is measured against */
  readonly body: { readonly standing: number; readonly stooping: number }
  readonly bench: { readonly y: number; readonly depth: number }
  readonly kain: boolean

  readonly dims: readonly Dim[]
}
