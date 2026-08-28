/**
 * What the Palembang house calls things.
 *
 * The ninth house, and the first where the floor is the hierarchy.
 *
 * Every other building here says something about standing with its size, its
 * shape, its roof or what it holds. A rumah limas says it with *height within
 * a single storey*: the floor rises in named steps — the kekijing — from the
 * front, where the house meets the street, to the back, where the family is,
 * and where a guest is seated on that sequence is their standing. Nobody is
 * kept out; they are seated lower. That is a different kind of statement from
 * a rank multiplier or a tier count, and it is made in the one dimension every
 * other house in this project treats as merely structural.
 *
 * It also does something none of the other eight do: **it separates its two
 * plan axes.** The depth carries the social sequence and grows only by adding
 * a kekijing; the width is just size and grows by bays. Changing one leaves
 * the other untouched, which `checkAxesAreIndependent` states — and which no
 * earlier house could state, because in all of them a plan is one thing.
 *
 * On the words: limas, kekijing, gegajah, pagar tenggalung and jogan are
 * Palembang Malay terms. Where the author is not confident, the part is named
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
  | 'depdikbud-sumsel'
  | 'siswanto-2009'
  | 'waterson-1990'
  | 'ju-saito-2012'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How many stepped levels the floor rises through.
 *
 * Three or five, and it is not a matter of size: each kekijing is a place a
 * particular kind of guest is seated, so adding two adds two distinctions the
 * household is claiming to make. A house with three steps is not a smaller
 * five-step house — it is a household with a shorter guest list.
 */
export type Kekijing = 3 | 5

export interface Rules {
  readonly kekijing: Kekijing
  /**
   * How many bays wide.
   *
   * The plain one. This is the axis that carries nothing: a wider house is a
   * larger house and says nothing further, which is exactly what makes the
   * other axis legible as social.
   */
  readonly lebar: number
  /**
   * Whether the front gallery is screened by its lattice.
   *
   * The pagar tenggalung is the open front where the house meets the street.
   * Screened, the household receives at a remove; open, it receives on the
   * street's terms. Either way the sequence behind it is the same, which is
   * the point: the screen changes the threshold, not the hierarchy.
   */
  readonly tenggalung: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tiang'    // the posts, and they are not all the same length
  | 'kijing'   // the bearers that set each level, low to high
  | 'lantai'   // the stepped floors themselves
  | 'dinding'  // the walls
  | 'tenggalung' // the front gallery and its lattice
  | 'rangka'   // the roof frame
  | 'genteng'  // the tiles
  | 'simbar'   // the ridge ornaments

export const STAGE_ORDER: readonly Stage[] = [
  'tiang',
  'kijing',
  'lantai',
  'dinding',
  'tenggalung',
  'rangka',
  'genteng',
  'simbar',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'unglen'  // the ironwood the posts are of, named because the choice is the point
  | 'tembesu' // the timber of the frame and the boards
  | 'papan'
  | 'genteng' // fired clay, as on the joglo
  | 'kisi'    // the turned lattice of the front gallery
  | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** tenon and mortise, pegged */
  | 'pasak'
  /** a bearer let into a post */
  | 'takik'
  /** a post foot on its stone */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface PalembangKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<PalembangKinds>
export type MeshPart = CoreMeshPart<PalembangKinds>
export type Part = CorePart<PalembangKinds>
export type Joint = CoreJoint<PalembangKinds>
export type House = CoreHouse<PalembangKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * One step of the floor, and one rank of guest.
 *
 * The unit this house is made of along its depth. Each carries a name and a
 * use, and the sequence runs from the street to the family — so a person's
 * place in the household's regard is a height in metres, which is the only
 * time in this project that a social fact is *literally* a dimension rather
 * than something a dimension follows from.
 */
export interface Kijing {
  readonly key: string
  readonly index: number
  readonly nameId: string
  readonly nameEn: string
  readonly glossId: string
  readonly glossEn: string
  /** centre of this level along X, front to rear */
  readonly x: number
  readonly depth: number
  readonly y: number
}

export interface Layout {
  readonly rules: Rules

  /** X runs front (street) to rear (family); Z is the plain axis */
  readonly halfX: number
  readonly halfZ: number
  readonly bays: number

  readonly levels: readonly Kijing[]
  readonly stepRise: number
  readonly floorY: number
  readonly topY: number

  readonly postSection: number
  readonly stoneHeight: number
  readonly postsX: readonly number[]
  readonly postsZ: readonly number[]

  readonly wallHeight: number
  readonly tenggalung: { readonly depth: number; readonly screened: boolean; readonly y: number }

  readonly eaveY: number
  readonly ridgeY: number
  readonly eaveHalfX: number
  readonly eaveHalfZ: number
  readonly ridgeHalfZ: number
  readonly tileCourses: number

  readonly dims: readonly Dim[]
}
