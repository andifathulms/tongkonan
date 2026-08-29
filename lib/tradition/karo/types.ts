/**
 * What the Karo siwaluh jabu calls things.
 *
 * The eighteenth building, and the third answer to a question two others have
 * already answered differently.
 *
 * The question is what a building does when several households live in it. A
 * rumah betang gives each one a room of its own and grows by adding another —
 * so its length is a census and its plan is a row of identical bilik. A baileo
 * gives each clan a seat and makes the seats equal by rule. This house gives
 * eight households **one undivided room**: no partition anywhere, four hearths
 * shared between pairs, and a standing for each household that comes from
 * *where in that room it is* rather than from any wall.
 *
 * So hierarchy exists here with nothing physical to carry it. The rumah limas
 * puts standing in the height of a floor; the saoraja puts it in a stack of
 * boards; the tongkonan puts it in a multiplier. This house puts it in a
 * position — and a position is the one marker that cannot be removed without
 * removing the room.
 *
 * And the order of the positions is set by a tree. The great beams are laid
 * with the root end of the timber at one end of the house, and the household
 * at that end — jabu bena kayu, the base-of-the-tree place — is the senior
 * one, with jabu ujung kayu, the tip place, at the other. The building's
 * social order is oriented by the direction a tree grew.
 *
 * On the words: siwaluh jabu is "eight households", and jabu bena kayu and
 * jabu ujung kayu are the two positions the sources name plainly. The other
 * six are named in the literature and the author is not confident enough of
 * them to print, so this pack names positions by their end and their side and
 * says so in the caution — the policy the joglo pack set.
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
  | 'singarimbun-1975'
  | 'depdikbud-sumut'
  | 'domenig-2014'
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** How the house is entered: one door at the base end, or one at each end. */
export type Pintu = 'satu' | 'dua'

export interface Rules {
  /**
   * How many households share the room.
   *
   * Eight is the name of the thing — siwaluh jabu — and four and six are
   * built. Unlike the betang's tally this number does not lengthen the house
   * by a room each time: the room is one room, and what the count changes is
   * how many places are marked out inside it and how many hearths they share.
   */
  readonly jabu: number
  /**
   * Whether the gable carries its raised upper tier.
   *
   * A small second gable stands above the main one on many Karo houses. It
   * holds nothing and covers nothing that is not already covered; what it does
   * is make the end of the house taller, which is the only thing on the
   * outside of this building that says anything about the household inside.
   */
  readonly tersek: boolean
  readonly pintu: Pintu
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // the stones under the posts
  | 'tiang'   // the posts
  | 'rangka'  // the floor frame, and the great beams that set the order
  | 'lantai'  // the floor: one plane, one room
  | 'dinding' // the walls, on the perimeter and nowhere else
  | 'dapur'   // the hearths, each shared by two households
  | 'kuda'    // the roof frame
  | 'atap'    // ijuk, in courses
  | 'tersek'  // the raised gable tier, last

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'tiang',
  'rangka',
  'lantai',
  'dinding',
  'dapur',
  'kuda',
  'atap',
  'tersek',
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
  | 'ijuk'
  | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing of palm fibre */
  | 'ikat'
  /** a beam seated in a notch cut in a post head */
  | 'takik'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface KaroKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<KaroKinds>
export type MeshPart = CoreMeshPart<KaroKinds>
export type Part = CorePart<KaroKinds>
export type Joint = CoreJoint<KaroKinds>
export type House = CoreHouse<KaroKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * One household's place in the room.
 *
 * It has a position and a rank and no walls. `x` runs from the base end of the
 * timber to the tip end, and `rank` counts from the senior place at the base.
 */
export interface Jabu {
  readonly index: number
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  readonly x: number
  readonly z: number
  readonly rank: number
  /** which hearth this household shares, by index */
  readonly hearth: number
}

export interface Dapur {
  readonly index: number
  readonly x: number
  readonly z: number
  readonly radius: number
}

export interface Layout {
  readonly rules: Rules

  readonly jabu: readonly Jabu[]
  readonly hearths: readonly Dapur[]
  readonly length: number
  readonly halfZ: number

  readonly floorY: number
  readonly postSection: number
  readonly stoneHeight: number
  readonly plateY: number
  readonly ridgeY: number
  readonly eaveOversail: number

  /** the end the root of the timber is at, and so the senior household */
  readonly benaX: number
  readonly doors: readonly { readonly x: number }[]
  readonly tersek: { readonly present: boolean; readonly rise: number; readonly halfX: number }

  readonly hearthClearance: number
  readonly ijukCourses: number

  readonly dims: readonly Dim[]
}
