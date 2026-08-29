/**
 * What the Minahasa woloan house calls things.
 *
 * The seventeenth building, and the only one made to be taken apart.
 *
 * Every other building in this collection is raised where it will stand and
 * stays there: the joints are cut to hold, the members run as long as the
 * frame needs, and taking one down is destroying it. A woloan house is timber
 * carpentry pegged together on the understanding that it will be *unpegged* —
 * numbered, dismantled, carried away on a lorry and put up again somewhere
 * else. Around Tomohon that is a trade: houses are built to be sold whole and
 * they leave by road.
 *
 * Two things follow, and both are checkable. Nothing may be longer than the
 * road allows, so the frame is a set of pieces sized to travel rather than a
 * frame sized to the building; and the sequence that raises it has to run
 * *backwards*, which is a property no other pack in this project has ever had
 * to state — a house is normally only required to go up.
 *
 * On the words: woloan is the village near Tomohon the trade is named for.
 * The parts are named in Indonesian, on the policy the joglo pack set: where
 * the author is not confident of the Tontemboan term, the part is called what
 * it is.
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
  | 'depdikbud-sulut'
  | 'schouten-1998'
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How many stairs the front carries.
 *
 * A Minahasa house is entered up two stairs, one at each end of the front
 * veranda, and the sources are consistent about it. The single stair is the
 * other thing that gets built, and the difference is not decorative: two
 * stairs make the veranda a passage across the front of the house rather than
 * a landing at the top of one flight.
 */
export type Tangga = 'dua' | 'satu'

export interface Rules {
  /** how many bays long the body is — this house's size, and it is sold by it */
  readonly ruang: number
  readonly tangga: Tangga
  /**
   * Whether the house is built to be moved.
   *
   * The defining rule, made switchable so that what it costs can be seen. On,
   * every member is cut short enough to be carried and every junction falls on
   * a bay line, so the house can be numbered, unpegged and taken away. Off,
   * the frame is cut to the building instead — longer members, fewer joints, a
   * better house by every measure except the one that matters here.
   */
  readonly pindah: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // pad stones, which stay behind when the house leaves
  | 'tiang'   // the posts
  | 'gelagar' // the floor frame
  | 'lantai'  // the floor
  | 'dinding' // the walls, in panels
  | 'serambi' // the front veranda
  | 'tangga'  // the stairs, one at each end of it
  | 'kuda'    // the roof frame
  | 'atap'    // shingles

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'tiang',
  'gelagar',
  'lantai',
  'dinding',
  'serambi',
  'tangga',
  'kuda',
  'atap',
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
  | 'sirap'
  | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /**
   * A pegged tenon, and the only kind here.
   *
   * Not a shortage of joinery but the whole argument: a peg is a joint that
   * can be taken out. Nothing in this house is glued, nailed or notched so
   * that undoing it breaks it, because the building is expected to be undone.
   */
  | 'pasak'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface MinahasaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<MinahasaKinds>
export type MeshPart = CoreMeshPart<MinahasaKinds>
export type Part = CorePart<MinahasaKinds>
export type Joint = CoreJoint<MinahasaKinds>
export type House = CoreHouse<MinahasaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One bay: the unit the house is built in and the unit it is taken apart in. */
export interface Ruang {
  readonly index: number
  readonly x: number
  readonly halfX: number
}

export interface Layout {
  readonly rules: Rules

  readonly bays: readonly Ruang[]
  readonly length: number
  readonly halfZ: number

  readonly floorY: number
  readonly postSection: number
  readonly stoneHeight: number
  readonly wallHeight: number
  readonly plateY: number
  readonly ridgeY: number
  readonly eaveOversail: number

  readonly veranda: { readonly depth: number; readonly floorY: number }
  readonly stairs: readonly { readonly z: number }[]

  /**
   * The longest piece the road allows, and whether this house respects it.
   *
   * Carried on the Layout because it is what the building is *about*: a member
   * longer than this cannot be taken away, so a house made of them is a house
   * that has to be demolished rather than moved.
   */
  readonly haulLength: number
  readonly movable: boolean

  readonly shingleCourses: number

  readonly dims: readonly Dim[]
}
