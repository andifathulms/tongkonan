/**
 * What the Dani house calls things.
 *
 * The thirteenth building, and the only one here whose problem is cold.
 *
 * Every other building in this project answers rain, or a moving ground, or
 * rot, or rats, or standing. The Baliem valley is at sixteen hundred metres on
 * the equator, where the days are mild and the nights are not, and a honai is
 * a device for keeping a fire's heat until morning. Everything about it follows
 * from that: it is small, because a small volume is cheaper to warm; it is
 * round, because a circle encloses the most floor for the least wall; it is
 * low, because heat leaves upward; it has no window at all; and its door is
 * small enough that a person must stoop through it. It is the only building
 * here that is *worse* at every other job than its neighbours and is not
 * trying to be good at them.
 *
 * The mbaru niang is also round and also thatched, and setting the two beside
 * each other is the point of building this one. That one is fifteen metres tall
 * and holds five floors of stores; this one is three metres tall and holds a
 * fire. Roundness turns out to say nothing on its own.
 *
 * On the words: honai is the men's house, ebei the women's, and wamai the pig
 * house; a Dani compound has all three inside one fence. Those four terms are
 * used and nothing else is, for the reason the lumbung pack gives at greater
 * length — where the author is not confident, the part is named in Indonesian.
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
  | 'heider-1970'
  | 'depdikbud-papua'
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Which of the three buildings in the compound this is.
 *
 * A Dani compound holds a honai for the men, an ebei for the women and
 * children, and a wamai for the pigs, all inside one fence. They are the same
 * building at three sizes and with three different things kept warm — which is
 * the least hierarchical set of options in this project: none of the three is
 * a lesser version of another, and the pigs' one is warm for the same reason
 * the men's is.
 */
export type Bangunan = 'honai' | 'ebei' | 'wamai'

export interface Rules {
  readonly bangunan: Bangunan
  /**
   * Thickness of the thatch, in courses.
   *
   * The only rule in this project that is purely thermal. More courses is more
   * blanket: it changes nothing about who lives there, what they may claim, or
   * how the building is used — only how long the fire's heat stays in. It is a
   * rule because a household decides it, and it decides it against the cost of
   * cutting and carrying the grass.
   */
  readonly lapis: number
  /**
   * Whether the upper floor is fitted.
   *
   * A honai is one small round room with a sleeping platform above it, reached
   * by a notched pole, and the fire below. The loft is where people sleep
   * precisely because heat goes up — so this switch is the building's thermal
   * argument made into a floor.
   */
  readonly loteng: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'lantai'  // the ground floor, laid on the earth
  | 'dinding' // the ring of wall posts
  | 'pintu'   // the low door
  | 'loteng'  // the sleeping platform above
  | 'rangka'  // the roof frame
  | 'atap'    // the thatch, and there is a great deal of it
  | 'tungku'  // the hearth, which is the reason for all of it

/**
 * The door frame is set before the wall, and the loft after the roof.
 *
 * Both are how the work actually goes — a close-set post wall is built round a
 * doorway rather than having one cut into it, and a sleeping platform is fitted
 * inside a finished shell. Both were the other way round at first, and
 * `checkJointStages` refused the arrangement: a rafter resting on a wall post
 * has to follow it immediately, and with the door and the loft in between it
 * did not.
 */
export const STAGE_ORDER: readonly Stage[] = [
  'lantai',
  'pintu',
  'dinding',
  'rangka',
  'atap',
  'loteng',
  'tungku',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'kayu'
  | 'papan'
  | 'alang' // grass thatch, and a great deal of it
  | 'batu'  // the hearth stones

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing */
  | 'ikat'
  /** a rafter resting on the wall ring */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface DaniKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<DaniKinds>
export type MeshPart = CoreMeshPart<DaniKinds>
export type Part = CorePart<DaniKinds>
export type Joint = CoreJoint<DaniKinds>
export type House = CoreHouse<DaniKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  readonly radius: number
  readonly facets: number
  readonly wallHeight: number
  readonly postSection: number
  readonly floorY: number

  /** the dome over it: a low cap, not a cone */
  readonly eaveY: number
  readonly apexY: number
  readonly thatchCourses: number
  readonly thatchDepth: number

  readonly door: { readonly width: number; readonly height: number; readonly halfAngle: number }
  readonly loft: { readonly present: boolean; readonly y: number; readonly radius: number }
  readonly hearth: { readonly radius: number; readonly depth: number }

  /**
   * The enclosed volume, in cubic metres.
   *
   * Carried on the Layout because it is the number this building is *about*,
   * and because `checkSmallVolume` compares it against the mbaru niang's — the
   * other round thatched house here, and forty times the size.
   */
  readonly volume: number

  readonly dims: readonly Dim[]
}
