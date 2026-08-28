/**
 * What the Banjar house calls things.
 *
 * The fourteenth building, and the first that is a sequence of roofs.
 *
 * Every other building here has one roof — swept, hipped, gabled, conical,
 * domed, hooded, towered — and whatever it is, it is one thing covering the
 * whole plan. A Banjar house is a chain of them along a single ridge: an open
 * platform, a veranda under a low shed, the core under its own tall form, and
 * the back under another low one. You do not read the building by its plan.
 * You read it by walking the ridge and naming what changes overhead.
 *
 * And the *type* of the house is the form over its core. Rumah bubungan tinggi
 * is named for the very steep gable in the middle of that chain; a palimasan
 * is the same building with a hipped one there instead. So the rule that says
 * which house this is does not scale it, count it, or switch a part on — it
 * **selects a roof primitive**, which nothing else in this project does.
 *
 * On the words: bubungan tinggi, palimasan, gajah baliku, pelatar, surambi,
 * palidangan, padu and anjung are Banjar terms and are used for those parts.
 * Where the author is not confident the part is named in Indonesian.
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
  | 'seman-2001'
  | 'depdikbud-kalsel'
  | 'mentayani-2017'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Which house this is, which is to say what is over its core.
 *
 * The Banjar house is a family of named types and the name is the roof: a
 * bubungan tinggi has the tall steep gable, a palimasan a hipped roof, a gajah
 * baliku a lower gable with a curved break. They are otherwise the same
 * building with the same sequence around them.
 */
export type Jenis = 'bubungan-tinggi' | 'palimasan' | 'gajah-baliku'

/** The forms a segment's roof can take. */
export type Bentuk = 'sengkuap' | 'pelana' | 'tinggi' | 'limasan'

export interface Rules {
  readonly jenis: Jenis
  /** how many bays deep the core is; size, and only size */
  readonly ruang: number
  /** whether the two side wings stand */
  readonly anjung: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tongkat'  // the posts
  | 'gelagar'  // the bearers
  | 'lantai'   // the floors, which step down toward the street
  | 'dinding'  // the walls
  | 'anjung'   // the side wings
  | 'kuda'     // the roof frames, one per segment
  | 'sirap'    // the ironwood shingles

export const STAGE_ORDER: readonly Stage[] = [
  'tongkat',
  'gelagar',
  'lantai',
  'dinding',
  'anjung',
  'kuda',
  'sirap',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'ulin'  // ironwood, as on the betang — the same substance and generator
  | 'papan'
  | 'sirap'
  | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** tenon and mortise, pegged */
  | 'pasak'
  /** a bearer let into a post */
  | 'takik'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface BanjarKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<BanjarKinds>
export type MeshPart = CoreMeshPart<BanjarKinds>
export type Part = CorePart<BanjarKinds>
export type Joint = CoreJoint<BanjarKinds>
export type House = CoreHouse<BanjarKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * One length of the ridge, with its own roof over it.
 *
 * The unit this building is made of. Each has a name, a stretch of the entry
 * axis, a floor at its own level and a roof of its own form — and reading the
 * house is reading this list in order.
 */
export interface Ruas {
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  readonly bentuk: Bentuk
  /** centre and half-length along X, front to rear */
  readonly x: number
  readonly halfX: number
  readonly floorY: number
  readonly eaveY: number
  readonly ridgeY: number
}

export interface Layout {
  readonly rules: Rules

  readonly halfZ: number
  readonly depth: number
  readonly segments: readonly Ruas[]

  readonly postSection: number
  readonly stoneHeight: number
  readonly postsX: readonly number[]
  readonly postsZ: readonly number[]

  readonly eaveOversail: number
  readonly shingleCourses: number

  readonly anjung: { readonly present: boolean; readonly halfX: number; readonly reach: number; readonly ridgeY: number; readonly eaveY: number }

  readonly dims: readonly Dim[]
}
