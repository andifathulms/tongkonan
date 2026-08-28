/**
 * What the Nias house calls things.
 *
 * The sixth house, and the first whose primary structure is not orthogonal.
 *
 * Every building in this project so far stands on posts that go straight up
 * and beams that go straight across. That is not a fact about houses; it is a
 * fact about the five houses that happened to come first. South Nias sits on
 * an active margin and its houses are built to be shaken: under the floor is a
 * forest of vertical ehomo *and* massive driwa laid across them on the
 * diagonal, so that every bay of the substructure is a triangle rather than a
 * rectangle. A rectangle of four posts racks. A triangle does not.
 *
 * That makes it the first house here whose governing rule is an engineering
 * response rather than a social one, which is a real test of this project's
 * premise and not a comfortable one. The premise survives, but only after
 * being narrowed: see `checkBracing` and the note in `rules.ts` on
 * `everyBayTriangulated`. What a household says about itself is still in the
 * building — the size, the loft, the stones out front — but the thing that
 * decides the *shape* of the structure is the ground moving.
 *
 * On the words: omo, omo sebua, ehomo, driwa, behu and si'ulu are Nias terms
 * and are used because they are the names of the things. Where the author is
 * not confident of a Nias word, the part is named in Indonesian rather than in
 * a word being guessed at — the policy the joglo pack set and every pack since
 * has followed.
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
  | 'feldman-1979'
  | 'viaro-1980'
  | 'gruber-herbig-2009'
  | 'depdikbud-sumut'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Whose house it is.
 *
 * An omo sebua is the house of a si'ulu, a noble: larger, taller, and with a
 * loft in the roof. An omo hada is everyone else's, and is the same building
 * made smaller. The difference is one of degree rather than of kind, which is
 * unlike the rumah gadang's laras and unlike the mbaru niang's drum — and that
 * variety across six houses is itself the finding.
 */
export type Omo = 'sebua' | 'hada'

export interface Rules {
  readonly omo: Omo
  /** bays along the ridge; the plan grows by whole bays and nothing else */
  readonly ruang: number
  /**
   * Whether the stone plaza and its standing behu are laid in front.
   *
   * The first rule in this project that puts something outside the building.
   * Only a si'ulu erects behu, and they are the visible record of the feasts
   * that entitled them to — so the stones say something about the household
   * that no part of the house does. It is a flag because a household either
   * has that standing or has not.
   */
  readonly behu: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // the pad stones; nothing is buried
  | 'ehomo'   // the vertical posts
  | 'driwa'   // the diagonals, and the reason the house stands
  | 'lantai'  // the floor
  | 'dinding' // the walls, leaning out toward the eave
  | 'jendela' // the window band along the front
  | 'rangka'  // the roof frame
  | 'rumbia'  // sago-palm thatch
  | 'behu'    // the standing stones on the plaza

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'ehomo',
  'driwa',
  'lantai',
  'dinding',
  'jendela',
  'rangka',
  'rumbia',
  'behu',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'batu'   // river stone, under every post foot
  | 'kayu'   // timber
  | 'papan'  // board
  | 'rumbia' // sago-palm thatch: leaf, not fibre and not grass
  | 'behu'   // the dressed standing stone, which is not the same rock as a pad

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a diagonal notched across the post it braces */
  | 'takik'
  /** tenon and mortise, pegged */
  | 'pasak'
  /** a post foot standing on its stone, never buried */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface NiasKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<NiasKinds>
export type MeshPart = CoreMeshPart<NiasKinds>
export type Part = CorePart<NiasKinds>
export type Joint = CoreJoint<NiasKinds>
export type House = CoreHouse<NiasKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One post in the substructure grid. */
export interface Post {
  readonly id: string
  readonly x: number
  readonly z: number
  readonly row: number
  readonly col: number
}

/**
 * One rectangle of the substructure, named by the four posts at its corners.
 *
 * The cell is what `checkBracing` walks: a bay of the understorey is either
 * triangulated or it is a mechanism, and no other house in this project has a
 * structural claim that can be stated cell by cell. Kept on the Layout rather
 * than re-derived in the check, so that the thing being tested is the thing
 * that was built.
 */
export interface Cell {
  readonly id: string
  /** the plane the cell lies in: 0 for a plane of constant z, 2 for constant x */
  readonly plane: 0 | 2
  readonly minA: number
  readonly maxA: number
  readonly minY: number
  readonly maxY: number
  /** the coordinate the plane is at */
  readonly at: number
}

export interface Layout {
  readonly rules: Rules

  /** the body: X front to rear, Z along the ridge */
  readonly bodyHalfX: number
  readonly bodyHalfZ: number
  readonly floorY: number
  readonly wallHeight: number
  /** how far the wall head stands outboard of its foot */
  readonly wallLean: number

  readonly posts: readonly Post[]
  readonly rows: number
  readonly cols: number
  readonly postSection: number
  readonly bay: number
  readonly stoneHeight: number

  /** every rectangle of the understorey, and the diagonals that answer them */
  readonly cells: readonly Cell[]
  readonly braceSection: number

  readonly eaveY: number
  readonly ridgeY: number
  readonly ridgeHalfZ: number
  readonly eaveHalfX: number
  readonly eaveHalfZ: number
  readonly thatchCourses: number

  /** the loft under the ridge, in a si'ulu's house */
  /**
   * The loft under the ridge, in a si'ulu's house.
   *
   * Both half-extents are read off the roof at the loft's own height rather
   * than declared, so the floor lands on the frame that carries it.
   */
  readonly loft: {
    readonly present: boolean
    readonly y: number
    readonly halfX: number
    readonly halfZ: number
  }

  /**
   * The window band along the front wall.
   *
   * Named `bukaan` — an opening — and not `window`, because the architecture
   * test greps `lib/` for `window.` to catch the DOM leaking into the
   * generator, and `layout.window.height` reads exactly like that. Renaming
   * the field rather than loosening the guard: the guard's value is that it is
   * blunt, and a field called `window` in a module that must never touch the
   * DOM is a trap left for the next person.
   */
  readonly bukaan: { readonly y: number; readonly height: number; readonly fromZ: number; readonly toZ: number }

  /** the plaza and its standing stones, when the household may raise them */
  readonly behu: readonly { readonly id: string; readonly x: number; readonly z: number; readonly height: number }[]

  readonly dims: readonly Dim[]
}
