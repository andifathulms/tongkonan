/**
 * What the Javanese house calls things.
 *
 * The third house, and the first that refuses the shape of the other two. It
 * does not stand on stilts, so there is no habitable void beneath it and the
 * three stacked worlds the tongkonan divides into have no counterpart here.
 * Its roof is hipped rather than swept, so the ridge is shorter than the
 * building and the ends fall away in planes rather than rising into anything.
 * And the thing that carries its rank is a stack of beams inside the ceiling,
 * which neither of the others has any equivalent of.
 *
 * On the words: Javanese terms are used where the term is the name of the
 * thing and I am confident of it — soko guru, tumpang sari, brunjung,
 * penanggap, molo, umpak, senthong, gebyok, pendhapa, dalem, purus. Where I am
 * not, the part is named in Indonesian rather than in a Javanese word I would
 * be guessing at.
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
  | 'prijotomo-1984'
  | 'dakung-depdikbud'
  | 'frick-1997'
  | 'tjahjono-1989'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * The graded forms of the joglo.
 *
 * A named series rather than a spectrum, and the name is a statement about the
 * household: each grade adds a tier to the roof and a ring of pillars under
 * it. The names are documented; which tier count belongs to which is the
 * author's reading, and the dimension says so.
 */
export type Wujud = 'jompongan' | 'sinom' | 'pangrawit'

export interface Rules {
  readonly wujud: Wujud
  /**
   * Tiers of the tumpang sari, the corbelled stack over the soko guru.
   * Odd by rule, and the count is a rank signal — more tiers, higher standing,
   * and a taller roof, because the stack is what the brunjung sits on.
   */
  readonly tumpang: number
  /**
   * Whether the open pavilion stands in front.
   *
   * A household that receives publicly builds one; a household that does not,
   * does not. The switch is the same kind as the rumah gadang's laras: what it
   * says is said by a thing being there or not being there.
   */
  readonly pendhapa: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'umpak'        // the pad stones; the pillars are seated, never buried
  | 'soko'         // the pillars, guru first and outward from there
  | 'sunduk'       // the tie beams and bracing that lock the pillar heads
  | 'lantai'       // the floor
  | 'gebyok'       // the carved wall panels
  | 'senthong'     // the three rear chambers
  | 'tumpang-sari' // the corbelled stack over the soko guru
  | 'rangka-atap'  // molo, rafters, plates
  | 'genteng'      // the tiles, from the eave upward

export const STAGE_ORDER: readonly Stage[] = [
  'umpak',
  'soko',
  'sunduk',
  'lantai',
  'gebyok',
  'senthong',
  'tumpang-sari',
  'rangka-atap',
  'genteng',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'batu'    // the umpak stone
  | 'jati'    // teak, and it is named rather than called timber because it is
  | 'papan'   // board
  | 'bambu'   // bamboo, in the roof frame
  | 'genteng' // fired clay tile — neither other house has one
  | 'ukiran'  // carved panel

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** purus and its mortise, pegged — the frame comes apart again */
  | 'purus'
  /** a lap where two members cross */
  | 'takik'
  /** a pillar foot standing on its umpak */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface JawaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<JawaKinds>
export type MeshPart = CoreMeshPart<JawaKinds>
export type Part = CorePart<JawaKinds>
export type Joint = CoreJoint<JawaKinds>
export type House = CoreHouse<JawaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * A hipped roof is a stack of rectangles, and that stack now lives in the core
 * — a second house hips, so `steppedHip` moved. The type comes back with it.
 */
import type { RoofLevel } from '@/lib/core/hip'
export type { RoofLevel }

export interface Layout {
  readonly rules: Rules

  /** the dalem: the enclosed house. X front to rear, Z along the ridge. */
  readonly bodyDepth: number
  readonly bodyLength: number
  /** floor above ground — a plinth, not a storey; there is no room under it */
  readonly floorY: number
  readonly wallHeight: number

  /** pillar rings, outward from the soko guru. Each is a rectangle in plan. */
  readonly sokoRings: readonly { readonly halfX: number; readonly halfZ: number; readonly height: number }[]
  readonly sokoSection: number

  /** the corbelled stack: its foot, its tiers, and the plate it ends at */
  readonly tumpangCount: number
  readonly tumpangFootY: number
  readonly tumpangTopY: number

  /** the roof, outermost first, ridge last */
  readonly roof: readonly RoofLevel[]
  readonly eaveY: number
  readonly ridgeY: number

  /** the three rear chambers; the middle one is left empty */
  readonly senthongZ: readonly number[]
  readonly senthongDepth: number

  /** the open pavilion in front, when there is one */
  readonly pendhapa: {
    readonly present: boolean
    /** centre of the pavilion along X; negative, in front of the dalem */
    readonly centreX: number
    readonly halfX: number
    readonly halfZ: number
    readonly roof: readonly RoofLevel[]
    readonly eaveY: number
  }

  readonly tileCourses: number
  readonly dims: readonly Dim[]
}
