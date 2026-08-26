/**
 * What the Toraja house calls things.
 *
 * Everything in here is a word from one building tradition — nine stages,
 * seven materials, three joints, five bibliography entries, three ranks. That
 * is exactly why it is here and not in `lib/core`: the core is generic over
 * these, and binding them is what a tradition is.
 *
 * The concrete aliases at the foot of the file are the ones the rest of the
 * Toraja generator and the renderer use. `Part` here means a Toraja part, and
 * a `switch` over its material is still exhaustively checked — the
 * generic-over-`Kinds` core costs nothing at the point of use.
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

/** Key into the source table in `rules.ts`. `none` means: nobody said this. */
export type SourceKey =
  | 'none'
  | 'kis-jovak-1988'
  | 'waterson-1990'
  | 'schefold-2003'
  | 'depdikbud-sulsel'
  | 'nooy-palm-1979'

/* ── Rules — the socially meaningful input set ────────────────────────────
 * Parameters are things a household would say about itself. There is no
 * roof-curvature slider and there is no orientation control: the house lies
 * north–south by rule, not by choice.
 */

export type Rank =
  /** the origin house of a lineage; the largest permitted elaboration */
  | 'layuk'
  /** a house holding customary office */
  | 'pekamberan'
  /** the ordinary house; literally "stone pillar" */
  | 'batu-ariri'

export interface Rules {
  readonly rank: Rank
  /** longitudinal division of the body: 2–5. Three is the common case. */
  readonly bays: number
  /** buffalo horns on the tulak somba — a tally of funerals held, 0–24+ */
  readonly horns: number
}

/* ── Build order ──────────────────────────────────────────────────────────
 * `stage` and `order` together are the build sequence. The assembly animation
 * walks it and the invariants check it. `order` is not a z-index.
 */

export type Stage =
  | 'batu'          // pad stones
  | 'ariri'         // a'riri — the posts
  | 'rangka-lantai' // sills and joists
  | 'lantai'        // the deck
  | 'dinding'       // walls
  | 'tulak-somba'   // the front cantilever post and its carved gable
  | 'rangka-atap'   // ridge, rafters, purlins
  | 'ijuk'          // the courses, from the eave upward
  | 'tanduk'        // the horns

export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'ariri',
  'rangka-lantai',
  'lantai',
  'dinding',
  'tulak-somba',
  'rangka-atap',
  'ijuk',
  'tanduk',
]

export interface StageInfo {
  readonly stage: Stage
  /** Toraja or Indonesian name of the act, as shown over the viewport. */
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────────
 * Named, not described. The renderer generates each one onto a canvas; the
 * generator only says which one a part is made of.
 */

export type MaterialKey =
  | 'batu'    // river stone pad
  | 'kayu'    // timber, wavy grain
  | 'papan'   // board, straighter and paler
  | 'bambu'   // bamboo, vertical fibres and node rings
  | 'ijuk'    // sugar-palm fibre thatch
  | 'ukiran'  // carved panel — constructed from the four pigments
  | 'tanduk'  // horn, waxy clearcoat

/* ── Joints ───────────────────────────────────────────────────────────────
 * The house is built without nails, so the joints are load-bearing claims and
 * the invariant suite checks every tenon sits inside its mortise.
 */

export type JointKind =
  /** pegged mortise and tenon */
  | 'pasak'
  /** a lap where two members cross */
  | 'takik'
  /** a post foot resting in the dish of its pad stone */
  | 'tumpu'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface TorajaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<TorajaKinds>
export type MeshPart = CoreMeshPart<TorajaKinds>
export type Part = CorePart<TorajaKinds>
export type Joint = CoreJoint<TorajaKinds>
export type House = CoreHouse<TorajaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * Every resolved dimension of one house, in metres, with its provenance
 * intact. The renderer reads from here rather than recomputing anything —
 * a number hardcoded in a component escapes the provenance layer.
 *
 * This stays tradition-side and is not generic. Two thirds of it is the
 * Toraja roof — prows, an eave that oversails, a knee across the slope, ijuk
 * courses, the tulak somba — and there is no honest way to write those as a
 * shared shape before a second house has said what it needs.
 */
export interface Layout {
  readonly rules: Rules

  /** overall body length along X, front (north) to rear (south) */
  readonly bodyLength: number
  /** body width along Z */
  readonly bodyWidth: number
  /** underfloor clear height — the sulluk banua */
  readonly kolongHeight: number
  /** floor-to-plate height of the living floor — the kale banua */
  readonly wallHeight: number

  /** post grid positions along X and Z, metres */
  readonly postX: readonly number[]
  readonly postZ: readonly number[]
  readonly postSection: number

  /** bay boundaries along X, length `bays + 1` */
  readonly bayEdges: readonly number[]
  readonly bayNames: readonly string[]

  /** y of the top of the pad stones — where the posts start */
  readonly padTop: number
  /** y of the underside of the floor frame */
  readonly floorFrameY: number
  /** y of the walking surface */
  readonly deckY: number
  /** y of the wall plate the rafters bear on */
  readonly plateY: number

  /** ridge sag and prow rise, resolved */
  readonly ridgeY: number
  readonly ridgeSag: number
  readonly frontProwX: number
  readonly frontProwY: number
  readonly rearProwX: number
  readonly rearProwY: number

  /** half-width of the roof at the eave, and the eave height at mid-span */
  readonly eaveHalfWidth: number
  readonly eaveY: number
  /**
   * Where the roof breaks, across the slope: 0 is the ridge, 1 the eave.
   * The knee sits on the wall line, which is why the rafters come in two
   * ranks and why the eave can hang below the plate while the wall stays
   * visible beneath it.
   */
  readonly breakFraction: number
  /** how much of the roof's total drop has happened at the knee, 0–1 */
  readonly kneeDrop: number
  /** how far the eave oversails the outer post line, metres */
  readonly eaveOversail: number

  readonly ijukCourses: number
  readonly hornCount: number
  /** where the tulak somba stands, X */
  readonly tulakSombaX: number

  /** every Dim that produced the numbers above, for the provenance strip */
  readonly dims: readonly Dim[]
}
