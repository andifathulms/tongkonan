/**
 * What the Korowai house calls things.
 *
 * The twenty-fourth building, and the first whose structure is alive.
 *
 * A Korowai khaim stands high above the forest floor of the Becking–Dairam
 * headwaters, and what carries it is usually a living tree: a wanbon topped
 * off at floor height, its roots still in the ground and its stump still
 * putting out shoots. Poles are added around it, but the tree is the middle of
 * the building, and it goes on growing after the house is finished.
 *
 * Twenty-three buildings here stand on something inert — stone, piles,
 * masonry, a hillside, a keel, a crowd's shoulders. This one stands on
 * something that has a species, a girth that changes every year, and that can
 * die while the house is still being lived in. That is the whole reason to
 * build it: `lib/core/` assumes a part is placed and then stays as placed, and
 * a tree is the first thing here for which that is only approximately true.
 *
 * The second reason is the height itself. Every other clearance in this
 * project is a storey, a step, a plinth, a slab or the depth of a lattice.
 * Here the empty air under the floor *is* the building's argument — a house
 * put out of reach, and nothing is meant to be under it at all.
 *
 * On the words: `khaim` is the house and `wanbon` the tree, and those are the
 * only two Korowai terms used, because they are the two the author is
 * confident of. Everything else is named in Indonesian, on the policy the
 * joglo pack set and the lumbung pack applied widest where the sourcing is
 * thinnest.
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
  | 'vanenk-devries-1997'
  | 'stasch-2009'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How high the floor stands.
 *
 * Three heights rather than a slider, and each one is a declared dimension, so
 * `withDimValue` can move it and the sensitivity probe and the counterexample
 * can both see it. The Banjar pack shipped a table holding the *value* and the
 * counterexample went blind; this table holds the key.
 */
export type Tinggi = 'rendah' | 'sedang' | 'tinggi'

export interface Rules {
  readonly tinggi: Tinggi
  /**
   * How many hearths, which is how many households share the floor.
   *
   * A hearth is a household, and the floor lengthens by one bay for each. The
   * betang counts households the same way and gives each a room; here there
   * are no rooms, only a fire and the stretch of floor around it.
   */
  readonly perapian: number
  /**
   * Whether the middle of the building is a living tree.
   *
   * True and the house stands on a wanbon topped at floor height, still
   * rooted and still growing. False and it stands on cut poles, which is also
   * built and which rots — the difference is not decorative, and it is the one
   * rule in this project that decides whether part of a building is alive.
   */
  readonly pohon: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tiang'    // the tree and the poles around it
  | 'lantai'   // the floor frame and its deck, high in the air
  | 'dinding'  // bark walls and the partition between the two sides
  | 'atap'     // sago leaf over a light frame
  | 'perapian' // the clay hearths, hung in openings in the floor
  | 'tangga'   // the notched pole, leaned last and pulled up at night

export const STAGE_ORDER: readonly Stage[] = [
  'tiang',
  'lantai',
  'dinding',
  'atap',
  'perapian',
  'tangga',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

/**
 * Five substances, and one of them is alive.
 *
 * `pohon` is the standing wanbon: not timber, because timber is what a tree
 * becomes when it is felled, and this one is not. It is the only material key
 * in the project naming something that is still growing, which is why it
 * belongs to this pack and cannot be shared with anything.
 */
export type MaterialKey = 'pohon' | 'kayu' | 'kulit' | 'rumbia' | 'tanah'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing of rattan: the only fastening, and the only one a tree can take */
  | 'rotan'
  /** a fork: a member dropped into the crotch of another, held by its own weight */
  | 'cagak'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface KorowaiKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<KorowaiKinds>
export type MeshPart = CoreMeshPart<KorowaiKinds>
export type Part = CorePart<KorowaiKinds>
export type Joint = CoreJoint<KorowaiKinds>
export type House = CoreHouse<KorowaiKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One hearth: a household, and a slab of clay hung over a hole in the floor. */
export interface Perapian {
  readonly index: number
  /** which side of the partition it is on: −1 women, +1 men */
  readonly side: -1 | 1
  readonly at: readonly [number, number, number]
  readonly half: number
}

export interface Layout {
  readonly rules: Rules

  /** the height of the floor above the forest floor, and the whole argument */
  readonly floorY: number
  /** the support in the middle: a tree, or poles cut to length */
  readonly trunk: {
    readonly alive: boolean
    /** diameter at the ground */
    readonly base: number
    /** diameter where the floor is framed into it */
    readonly atFloor: number
    /** how far the crown stands above the ridge, still growing */
    readonly aboveRidge: number
    /** the least diameter that may carry a floor */
    readonly bearing: number
  }
  readonly floor: { readonly halfX: number; readonly halfZ: number; readonly depth: number }
  readonly posts: readonly (readonly [number, number])[]
  readonly hearths: readonly Perapian[]
  readonly wallTop: number
  readonly ridgeY: number
  readonly clearing: number

  readonly dims: readonly Dim[]
}
