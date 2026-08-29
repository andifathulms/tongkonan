/**
 * What the rumoh Aceh calls things.
 *
 * The twentieth building, and the first whose orientation comes from outside
 * the archipelago.
 *
 * Every other house in this collection is turned by something local. The
 * tongkonan faces north because Toraja says so. The rumah gadang faces its own
 * rice barns, the betang its river, the woloan house its road, the baileo a
 * stone, the Karo house the root end of a tree, the Baduy house the fall of
 * its own hillside. A rumoh Aceh lies east–west because prayer is toward
 * Mecca, and Mecca is not in Indonesia. It is the only building here whose
 * datum is a doctrine held by people in other countries too.
 *
 * The second thing worth building it for is smaller and just as particular:
 * the ladder has an odd number of steps. Not roughly odd, not usually odd —
 * odd, and the tradition says so. It is the only *parity* rule in the project
 * and it can fail in the one way parity fails: by one.
 *
 * On the words: rumoh is the house; seuramoë keuë the front veranda, tungai
 * the raised middle room, seuramoë likôt the back veranda. The frame is named
 * in Indonesian where the author is not confident of the Acehnese term, on
 * the policy the joglo pack set.
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
  | 'dall-1982'
  | 'depdikbud-aceh'
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────── */

export interface Rules {
  /**
   * How many bays long the house is, and it is always odd.
   *
   * A house is named by this number — rumoh lhee ruang, rumoh limong ruang —
   * so the count is not only a size but the name of the thing. Odd because the
   * middle bay is the middle: the raised room sits on it, and an even count
   * would leave the house with a joint where its centre should be.
   */
  readonly ruang: number
  /**
   * How many steps the ladder has, and it is always odd.
   *
   * The only parity rule in this project. It is not a proportion and not a
   * height — the ladder is as tall as the floor is, and what the tradition
   * fixes is whether the number of treads is even or odd.
   */
  readonly anakTangga: number
  /** whether the back veranda is built */
  readonly seuramoeLikot: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tameh'   // the posts
  | 'toi'     // the tie beams that thread through them
  | 'aleue'   // the floors, the middle one raised
  | 'binteh'  // the board walls
  | 'gaseue' // the roof frame
  | 'bubong'  // the thatch
  | 'reunyeun' // the ladder, last and counted

export const STAGE_ORDER: readonly Stage[] = [
  'tameh',
  'toi',
  'aleue',
  'binteh',
  'gaseue',
  'bubong',
  'reunyeun',
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
  | 'bambu'
  | 'rumbia'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a beam threaded through a mortise cut clean through the post */
  | 'toi'
  /** a lashing of fibre */
  | 'talo'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface AcehKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<AcehKinds>
export type MeshPart = CoreMeshPart<AcehKinds>
export type Part = CorePart<AcehKinds>
export type Joint = CoreJoint<AcehKinds>
export type House = CoreHouse<AcehKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One of the three parts of the house, front to back across the width. */
export interface Ruang {
  readonly key: 'keue' | 'tungai' | 'likot'
  readonly nameId: string
  readonly nameEn: string
  /** centre across the width, and how deep it is */
  readonly x: number
  readonly halfX: number
  readonly floorY: number
}

export interface Layout {
  readonly rules: Rules

  /** the length, which runs east–west, and the width, which runs north–south */
  readonly length: number
  readonly halfZ: number
  readonly bays: number
  readonly rooms: readonly Ruang[]

  readonly floorY: number
  readonly raise: number
  readonly postSection: number
  readonly plateY: number
  readonly ridgeY: number
  readonly eaveOversail: number

  readonly ladder: { readonly steps: number; readonly rise: number; readonly width: number; readonly z: number }
  readonly rumbiaCourses: number

  readonly dims: readonly Dim[]
}
