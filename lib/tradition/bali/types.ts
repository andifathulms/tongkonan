/**
 * What the Balinese pavilion calls things.
 *
 * The fifth house, and the first whose argument is not about form. The other
 * four differ from each other in shape — swept, swept the other way, hipped,
 * turned — and this one is the plainest object in the project: a rectangular
 * platform, some posts, a hipped roof. What makes it worth building is that
 * every one of its lengths is a whole number of its owner's body, and that the
 * rule requires it not to be exact. See `module.ts`; that file is the house.
 *
 * Two things this pack states rather than models, and both are stated on
 * screen rather than buried here:
 *
 * A Balinese house is a *compound* — a walled yard with several pavilions
 * around it, a shrine in the kaja-kangin corner and a gate that you turn to
 * get past. This models one pavilion. That is the same standing as the rumah
 * gadang's missing rangkiang: an absence named, not a claim.
 *
 * And there is no carving. Balinese carving is not incidental to a Balinese
 * building, so leaving it out is a real omission — but the alternative is
 * inventing plausible members of a vocabulary that belongs to specific
 * carvers, which the mbaru niang pack already refused for the same reason and
 * on better grounds than a filled slot would give.
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
import type { Sikut } from './module'
import type { DimKey } from './rules'

export type { Bounds, ProvenanceClass, Vec3 } from '@/lib/core/types'
export type { DimKey } from './rules'
export type { RoofLevel }

export type SourceKey =
  | 'none'
  /** the ratios between one body measure and the next; nobody's but the author's */
  | 'anthropometry'
  | 'gelebet-1986'
  | 'budihardjo-1986'
  | 'eiseman-1990'
  | 'dwijendra-2008'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Which pavilion, named by how many posts it stands on.
 *
 * The name *is* the count — sakepat is four saka, sakenem is six, sangasari
 * nine, sakaroras twelve — so this is the one rule in the project where the
 * word a household uses and the number the generator needs are the same fact
 * said once. Larger is not merely bigger: the twelve-post bale is the
 * ceremonial one, and a household builds it when it has occasion to.
 */
export type Bale = 'sakepat' | 'sakenem' | 'sangasari' | 'sakaroras'

export interface Rules {
  readonly bale: Bale
  /**
   * The owner's arm span, in millimetres. Every length in the house is a whole
   * number of this or of a measure derived from it.
   *
   * The only rule in this project that is a measurement of a person. It is not
   * a preference, a rank or a count — two households of identical standing
   * build different buildings, and the difference is their bodies.
   */
  readonly depa: number
  /**
   * Whether the pengurip is added.
   *
   * A principal dimension is a whole number of units plus a small increment,
   * because a measure that lands exactly on its module is *mati* — dead. In a
   * real house this is not optional; the switch is here so the difference can
   * be seen, and turning it off produces a building an undagi would not raise.
   * That is a stronger statement than a fixed value would make, because the
   * check that enforces it can then be shown refusing the other case.
   */
  readonly pengurip: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'bataran'   // the raised masonry platform: the foot of the tri angga
  | 'sendi'     // the pad stones the posts seat on
  | 'saka'      // the posts, and the house is named for how many
  | 'sunduk'    // the ties that lock the post heads into a frame
  | 'lantai'    // the platform's paving and the sitting deck
  | 'iga-iga'   // the roof frame: ridge, hips and common rafters
  | 'alang'     // the thatch, laid from the eave upward
  | 'murda'     // the ridge finish

export const STAGE_ORDER: readonly Stage[] = [
  'bataran',
  'sendi',
  'saka',
  'sunduk',
  'lantai',
  'iga-iga',
  'alang',
  'murda',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'paras'  // the soft volcanic sandstone the platform is faced in
  | 'bata'   // brick, in the platform's body
  | 'kayu'   // timber
  | 'papan'  // board, in the sitting deck
  | 'alang'  // alang-alang thatch — grass, not the black fibre the other roofs use
  | 'bambu'  // bamboo, in the roof frame

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** tenon and mortise, pegged — the frame is demountable */
  | 'pemuput'
  /** a lap where two members cross */
  | 'takik'
  /** a post foot seated in the dish of its sendi, never buried */
  | 'sendi'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface BaliKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<BaliKinds>
export type MeshPart = CoreMeshPart<BaliKinds>
export type Part = CorePart<BaliKinds>
export type Joint = CoreJoint<BaliKinds>
export type House = CoreHouse<BaliKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** Where one post stands, and which grid position it holds. */
export interface Saka {
  readonly id: string
  readonly x: number
  readonly z: number
  readonly row: number
  readonly col: number
}

/**
 * One principal length, kept as what it is rather than as what it came to.
 *
 * This is the field no other Layout in the project has, and it exists because
 * `checkModule` needs to compare a metre figure against the count and unit it
 * was written as. Storing only the metres would leave the check re-deriving
 * the intent from the result, which is the failure this codebase keeps
 * finding — two places computing the same thing, and one of them guessing.
 */
export interface Measured {
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  readonly count: number
  readonly unit: 'depa' | 'hasta' | 'musti' | 'useran' | 'nyari'
  readonly metres: number
}

export interface Layout {
  readonly rules: Rules
  readonly sikut: Sikut

  /** the platform: X front to rear, Z along the ridge */
  readonly bataranHalfX: number
  readonly bataranHalfZ: number
  readonly bataranHeight: number
  readonly stepRise: number
  readonly stepCount: number

  /** the posts, and the rectangle they stand on */
  readonly saka: readonly Saka[]
  readonly sakaHalfX: number
  readonly sakaHalfZ: number
  readonly sakaHeight: number
  readonly sakaSection: number
  readonly rows: number
  readonly cols: number

  /** the roof, outermost first, ridge last. Two levels: it is a plain hip. */
  readonly roof: readonly RoofLevel[]
  readonly eaveY: number
  readonly ridgeY: number
  readonly thatchCourses: number

  /** the sitting platform inside, on the kaja side */
  readonly deck: {
    readonly halfX: number
    readonly halfZ: number
    readonly centreX: number
    readonly y: number
  }

  /** every principal length, as the count and unit it was set out in */
  readonly measured: readonly Measured[]
  readonly dims: readonly Dim[]
}
