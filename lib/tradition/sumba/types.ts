/**
 * What the Sumbanese peaked house calls things.
 *
 * The eighth house, and the first whose roof is not a shelter.
 *
 * On every other building here the roof covers something: it sheds water off a
 * body, and its size follows from what is underneath. A uma mbatangu inverts
 * that. Above a low four-post core rises a tower of thatch several times the
 * height of the house, and it is there because of what is kept inside it — the
 * uma deta, the loft where the marapu, the ancestral objects, are held. The
 * building is not a house with a tall roof. It is a container with a house
 * around its foot.
 *
 * Which breaks the assumption the other seven share: that the roof is
 * downstream of the plan. Here the plan is downstream of the peak. A house
 * with no marapu to keep has no reason for a tower, and it does not build one
 * — that is the `mbatangu` rule, and it is the sharpest either/or in the
 * project because it changes not a proportion but what kind of object this is.
 *
 * On the words: uma, uma mbatangu, uma kamadungu, marapu and the four post
 * names are Kambera terms from East Sumba. Sumba has many domains and much
 * variation, which the reading route states rather than smooths over. Where
 * the author is not confident, the part is named in Indonesian.
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
  | 'forth-1981'
  | 'hoskins-1998'
  | 'waterson-1990'
  | 'depdikbud-ntt'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Whether the house has a peak, and therefore whether it is a container.
 *
 * An uma mbatangu — a "house with a tower" — keeps the marapu in its loft and
 * builds the peak that holds them. An uma kamadungu is the same house without
 * one: a low hipped roof, no loft, and nothing kept. This is not a matter of
 * degree. Every other either/or in this project changes a proportion or adds a
 * part; this one changes what kind of object the building is.
 */
export type Uma = 'mbatangu' | 'kamadungu'

export interface Rules {
  readonly uma: Uma
  /**
   * How tall the peak stands, as a multiple of the house beneath it.
   *
   * The one rule in this project that is a ratio rather than a count or a
   * choice, and it is a rank signal: a taller tower says more about the
   * standing of the marapu it holds — and about the household holding them —
   * than any dimension of the house below. Ignored entirely when there is no
   * tower, which is the point of the flag above.
   */
  readonly menara: number
  /**
   * Whether the outer veranda runs all the way round.
   *
   * The bangga is the raised platform outside the core, and a full circuit is
   * a house that receives on every side. Where it does not go all the way, it
   * is the two long sides only.
   */
  readonly bangga: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'      // pad stones
  | 'kambaniru' // the four named posts, and the house is set out from them
  | 'balok'     // the beams that tie them
  | 'lantai'    // the floor, and the veranda outside it
  | 'dinding'   // the walls of the core
  | 'uma-deta'  // the loft: the reason the tower exists
  | 'menara'    // the tower frame
  | 'alang'     // the thatch, from the eave to the peak
  | 'tanduk'    // the finials at the ridge ends

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'kambaniru',
  'balok',
  'lantai',
  'dinding',
  'uma-deta',
  'menara',
  'alang',
  'tanduk',
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
  | 'alang' // alang-alang, as on the bale — the same plant, and the same generator

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** tenon and mortise, pegged */
  | 'pasak'
  /** a lap where two members cross */
  | 'takik'
  /** a post foot standing on its stone */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface SumbaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<SumbaKinds>
export type MeshPart = CoreMeshPart<SumbaKinds>
export type Part = CorePart<SumbaKinds>
export type Joint = CoreJoint<SumbaKinds>
export type House = CoreHouse<SumbaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * One of the four principal posts.
 *
 * Named, and the names are not decoration: each corner has a role — where the
 * rice is kept, where offerings are made, where the men's and women's sides
 * begin. It is the only house in this project whose posts are individuals
 * rather than members of a rank, which is why they are a list of four rather
 * than a grid.
 */
export interface Kambaniru {
  readonly id: string
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
  readonly x: number
  readonly z: number
}

export interface Layout {
  readonly rules: Rules

  /** the core: X front to rear, Z along the ridge */
  readonly coreHalfX: number
  readonly coreHalfZ: number
  readonly floorY: number
  readonly wallHeight: number
  readonly postSection: number
  readonly stoneHeight: number

  readonly posts: readonly Kambaniru[]

  /** the raised veranda outside the core */
  readonly bangga: { readonly present: boolean; readonly depth: number; readonly full: boolean; readonly y: number }

  /** the lower hipped roof, which every uma has */
  readonly eaveY: number
  readonly eaveHalfX: number
  readonly eaveHalfZ: number
  readonly shoulderY: number
  readonly shoulderHalfX: number
  readonly shoulderHalfZ: number

  /** the tower, when there is one */
  readonly menara: {
    readonly present: boolean
    readonly footY: number
    readonly peakY: number
    readonly halfX: number
    readonly halfZ: number
    /** the loft floor inside it — the reason the whole thing is there */
    readonly loftY: number
    /** its own half-extents: the tower's section at the loft's height */
    readonly loftHalfX: number
    readonly loftHalfZ: number
  }

  readonly thatchCourses: number
  readonly towerCourses: number

  readonly dims: readonly Dim[]
}
