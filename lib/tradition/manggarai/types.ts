/**
 * What the Manggarai house calls things.
 *
 * The fourth house, and the first that is round. Everything the other three
 * share and never had to justify falls here at once: there is no ridge, so
 * there is no ridge axis; there is no rectangle, so a footprint of width and
 * depth is a bounding box rather than a plan; and there is no front, because a
 * cone has no face to turn toward you. The thatch reaches the ground, so from
 * outside there is no wall and no eave — the whole building is roof.
 *
 * What it has instead is a stack. Five floors, each named, each with a stated
 * use, rising from the living floor to the loft where offerings are kept. The
 * tongkonan divides into three worlds and says so with a section cut; this one
 * makes the same idea the primary organising rule of the building and gives it
 * five storeys to do it in.
 *
 * On the words: Manggarai terms are used where the term is the name of the
 * thing and I am confident of it — mbaru niang, niang gendang, and the five
 * levels. Where I am not, the part is named in Indonesian rather than in a
 * Manggarai word I would be guessing at. The apex ornament is one of those: it
 * is a real and specific object with a name I am not sure enough of to print.
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
  | 'antar-2010'
  | 'erb-1999'
  | 'depdikbud-ntt'
  | 'unesco-2012'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * What this house is for.
 *
 * A village has several mbaru niang and one of them is the niang gendang, the
 * drum house, which holds the drum and the ceremonial life of the village. The
 * rest are dwellings. It is not a grade and not a size: it is a role, held by
 * one house, and the drum is how you know which.
 */
export type Peran = 'gendang' | 'tinggal'

/**
 * Two rules, and that is the whole set.
 *
 * The other three packs have three each, and after three houses that started
 * to look like a shape the project had rather than a coincidence of the houses
 * it happened to contain. It was a coincidence. This building has two things a
 * household would say about itself — what the house is for, and how many
 * households are in it — and the five levels are canon rather than a choice,
 * so there is no third rule to find and inventing one would be worse than
 * having two.
 */
export interface Rules {
  readonly peran: Peran
  /** households sharing the living floor, one radial segment each */
  readonly keluarga: number
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'          // the stones the posts stand on
  | 'tiang'         // the centre post and the ring around it
  | 'kerangka-atap' // the cone's rafters, apex to ground
  | 'pengikat'      // the hoops that tie them and hold the frame round
  | 'lantai'        // the five floors
  | 'sekat'         // the radial partitions between households
  | 'ijuk'          // the courses, from the ground upward
  | 'puncak'        // the ornament at the apex

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'tiang',
  'kerangka-atap',
  'pengikat',
  'lantai',
  'sekat',
  'ijuk',
  'puncak',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

/**
 * The first house in this project with no carving.
 *
 * Every material here is one the other houses already build from, and there is
 * no `ukiran` in the set because a mbaru niang does not carry carved panels —
 * the building says what it has to say with its shape and its five floors. An
 * absence, and worth naming rather than quietly filling with something.
 */
export type MaterialKey =
  | 'batu'   // the flat stone a post stands on
  | 'kayu'   // timber
  | 'papan'  // board, for the floors
  | 'bambu'  // bamboo, in the cone's frame
  | 'ijuk'   // sugar-palm fibre thatch, all the way to the ground

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** pegged mortise and tenon */
  | 'pasak'
  /** a lap where two members cross */
  | 'takik'
  /** a post foot standing on its stone */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface ManggaraiKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<ManggaraiKinds>
export type MeshPart = CoreMeshPart<ManggaraiKinds>
export type Part = CorePart<ManggaraiKinds>
export type Joint = CoreJoint<ManggaraiKinds>
export type House = CoreHouse<ManggaraiKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One of the five floors: how high it sits, how wide it is, and what it is for. */
export interface Level {
  readonly key: string
  readonly name: string
  readonly y: number
  readonly radius: number
  readonly glossId: string
  readonly glossEn: string
}

/** A point on the cone's profile: a radius at a height. */
export interface ConePoint {
  readonly r: number
  readonly y: number
}

export interface Layout {
  readonly rules: Rules

  /** where the thatch meets the ground, and where it stops */
  readonly baseRadius: number
  readonly apexY: number
  /** the cone's outline, ground first and apex last */
  readonly profile: readonly ConePoint[]

  /** the five floors, lutur first */
  readonly levels: readonly Level[]

  /** the ring of posts under the living floor, and the one at the centre */
  readonly postRadius: number
  readonly postCount: number
  readonly postSection: number
  readonly centrePostSection: number

  /** one radial partition per household, at these bearings in radians */
  readonly segmentAngles: readonly number[]

  /** rafters, and facets round anything circular. Both multiples of the household count. */
  readonly rafterCount: number
  readonly facets: number

  readonly thatchCourses: number
  /** the drum, when this is the house that holds it */
  readonly drum: { readonly present: boolean; readonly y: number; readonly radius: number }

  readonly dims: readonly Dim[]
}
