/**
 * What the Bugis house calls things.
 *
 * The tenth house, and the first whose rank is declared by something that
 * holds nothing up.
 *
 * A tongkonan's rank multiplies every dimension it has. A joglo's tier count
 * grows the roof that carries it. A rumah limas builds the standing into its
 * floor. In each of those, the claim and the structure are the same material:
 * you could not remove the statement without taking the building apart. Here
 * you could. The timpa laja is a stack of boards on the gable face, its count
 * is the household's rank, and it carries no load whatever — three for a
 * commoner's house, five and upward for nobility, and a household that put up
 * more than it was entitled to was making a claim its neighbours could count
 * from the road.
 *
 * So this is the first building in the project where the rank marker is
 * *detachable*, and the first where lying is architecturally trivial. That is
 * worth a house on its own: it separates two things every earlier pack had
 * fused, which is what `checkRankCarriesNothing` states — no timpa laja may be
 * load-bearing, and the house must stand identically without them.
 *
 * On the words: saoraja, bola, timpa laja, alliri, rakkeang, ale bola and awa
 * bola are Bugis terms. Where the author is not confident, the part is named
 * in Indonesian rather than in a word being guessed at.
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
  | 'pelras-1996'
  | 'depdikbud-sulsel'
  | 'waterson-1990'
  | 'rahim-2011'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Whose house it is, which sets what the gable may claim.
 *
 * A saoraja is a noble's house and a bola is everyone else's. The difference
 * in the building is real but small — a bola is the same house made plainer —
 * and the difference in what may be *displayed* is not small at all, which is
 * the whole point of a marker that carries nothing.
 */
export type Rumah = 'saoraja' | 'bola'

export interface Rules {
  readonly rumah: Rumah
  /**
   * How many boards in the timpa laja.
   *
   * The rank, stated on the gable and readable from the road. Odd, and bounded
   * by what the household is entitled to rather than by what will fit: a bola
   * may not put up five however large it is, and a saoraja that puts up three
   * is saying something too.
   */
  readonly timpa: number
  /**
   * How many bays long.
   *
   * Size, and only size — as in the rumah limas, though here the separation is
   * between the *rank* and the whole building rather than between two axes of
   * the plan. A larger bola is a larger house of the same standing.
   */
  readonly lontang: number
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'pallangga' // the pad stones
  | 'alliri'    // the posts, in ranks across and along
  | 'pattolo'   // the beams threaded through them
  | 'lantai'    // the floor of the ale bola
  | 'rinring'   // the walls
  | 'rakkeang'  // the loft under the roof, where the rice is
  | 'pamiring'  // the roof frame
  | 'atap'      // the covering
  | 'timpa'     // the gable stack, which holds nothing up

export const STAGE_ORDER: readonly Stage[] = [
  'pallangga',
  'alliri',
  'pattolo',
  'lantai',
  'rinring',
  'rakkeang',
  'pamiring',
  'atap',
  'timpa',
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
  | 'nipah' // nipa-palm thatch: a fourth plant, and a fourth generator

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a beam threaded through a mortise cut clean through the post */
  | 'pattolo'
  /** a lap where two members cross */
  | 'takik'
  /** a post foot standing on its stone */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface BugisKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<BugisKinds>
export type MeshPart = CoreMeshPart<BugisKinds>
export type Part = CorePart<BugisKinds>
export type Joint = CoreJoint<BugisKinds>
export type House = CoreHouse<BugisKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * One board of the gable stack, and one unit of the claim.
 *
 * `halfSpan` runs along X, because the gable faces are the two ends of the
 * ridge and a board on one of them crosses the house rather than along it.
 */
export interface Timpa {
  readonly id: string
  readonly index: number
  readonly y: number
  readonly halfSpan: number
  readonly depth: number
}

export interface Layout {
  readonly rules: Rules

  /** X runs front to rear across the house; Z along the ridge */
  readonly halfX: number
  readonly halfZ: number
  readonly bays: number

  readonly floorY: number
  readonly wallHeight: number
  readonly postSection: number
  readonly stoneHeight: number
  readonly postsX: readonly number[]
  readonly postsZ: readonly number[]

  /** the three worlds, which this house names and stacks */
  readonly awaBola: number
  readonly aleBola: number
  readonly rakkeang: number

  readonly eaveY: number
  readonly ridgeY: number
  readonly eaveHalfX: number
  readonly eaveHalfZ: number
  readonly thatchCourses: number

  /** the stack on the gable: the rank, and it carries nothing */
  readonly timpa: readonly Timpa[]

  readonly dims: readonly Dim[]
}
