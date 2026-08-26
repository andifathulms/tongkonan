/**
 * What the Minangkabau house calls things.
 *
 * The same shape as the Toraja file and deliberately not shared with it. This
 * is the second house, and the second house is here to say where the first
 * one's vocabulary was a coincidence — so it declares its own stages,
 * materials, joinery and sources, and the only thing the two have in common
 * is the core they both bind.
 *
 * On the words: Minangkabau terms are used where the term is the name of the
 * thing and I am confident of it — gonjong, anjuang, bilik, ruang, lanjar,
 * singok, tonggak, rasuak. Where I am not, the part is named in Indonesian
 * rather than in a Minang word I would be guessing at. Guessing at a name is
 * the same failure as guessing at a metre, and it is less visible.
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
  | 'navis-1984'
  | 'vellinga-2004'
  | 'schefold-2003'
  | 'depdikbud-sumbar'
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────────
 * As with the tongkonan, these are things a household would say about itself.
 * "Rumah gadang sembilan ruang" is a sentence people say; a roof curvature is
 * not.
 */

/**
 * The two adat systems, and the reason this tradition is the one worth
 * building second.
 *
 * Koto Piliang is hierarchical and says so in the floor: the end bays step up
 * into anjuang, where those with rank sit. Bodi Caniago is egalitarian and
 * says that in the floor too, by refusing the step — one plane, everyone at
 * the same height. It is a social claim you can measure with a spirit level,
 * which is exactly the kind of thing this app exists to show.
 */
export type Laras = 'koto-piliang' | 'bodi-caniago'

export interface Rules {
  readonly laras: Laras
  /** bays along the ridge. Odd by rule: 3, 5, 7, 9. */
  readonly ruang: number
  /** sleeping rooms along the rear lanjar — one per married daughter, 0–7 */
  readonly bilik: number
}

/* ── Build order ────────────────────────────────────────────────────────*/

export type Stage =
  | 'batu-sandi'  // the pad stones
  | 'tonggak'     // the posts
  | 'rasuak'      // the tie beams and the floor frame
  | 'lantai'      // the deck
  | 'anjuang'     // the raised end floors — Koto Piliang only
  | 'dindiang'    // the outward-leaning walls
  | 'bilik'       // the sleeping-room partitions
  | 'rangka-atap' // ridge, rafters, purlins, the gable singok
  | 'gonjong'     // the spires
  | 'ijuk'        // the courses, from the eave upward

export const STAGE_ORDER: readonly Stage[] = [
  'batu-sandi',
  'tonggak',
  'rasuak',
  'lantai',
  'anjuang',
  'dindiang',
  'bilik',
  'rangka-atap',
  'gonjong',
  'ijuk',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'batu'     // river stone pad
  | 'kayu'     // timber
  | 'papan'    // board, paler and straighter
  | 'bambu'    // bamboo
  | 'ijuk'     // sugar-palm fibre thatch
  | 'ukiran'   // carved panel
  | 'anyaman'  // woven bamboo — sasak, the infill the tongkonan has no use for

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** pegged mortise and tenon */
  | 'pasak'
  /** a lap where two members cross */
  | 'takik'
  /** a post foot resting on the dish of its batu sandi */
  | 'sandi'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface MinangKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<MinangKinds>
export type MeshPart = CoreMeshPart<MinangKinds>
export type Part = CorePart<MinangKinds>
export type Joint = CoreJoint<MinangKinds>
export type House = CoreHouse<MinangKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * Every resolved dimension of one house, in metres, with its provenance
 * intact.
 *
 * Compare this with the Toraja `Layout` and the axes have swapped: there the
 * ridge runs along X and the house mirrors across it; here the ridge runs
 * along Z and the house mirrors along it. The shared convention survives —
 * X still runs front to rear, and the mirror plane is still z = 0 — but the
 * relationship between the ridge and the mirror is not the same building fact
 * in the two houses, and it was only ever a coincidence that it looked like
 * one.
 */
export interface Layout {
  readonly rules: Rules

  /** overall length along Z, end to end — the ridge axis */
  readonly bodyLength: number
  /** overall depth along X, front (courtyard, negative) to rear */
  readonly bodyDepth: number
  /** underfloor clear height */
  readonly kolongHeight: number
  /** floor-to-plate height of the living floor, measured at the wall base */
  readonly wallHeight: number
  /** how far the wall head stands outboard of its foot, metres */
  readonly wallLeanRun: number

  /** post grid: `lanjar + 1` positions across X, `ruang + 1` along Z */
  readonly postX: readonly number[]
  readonly postZ: readonly number[]
  readonly postSection: number
  readonly lanjarCount: number

  /** bay boundaries along Z, length `ruang + 1` */
  readonly ruangEdges: readonly number[]
  readonly ruangNames: readonly string[]
  /** lanjar boundaries along X, length `lanjar + 1` */
  readonly lanjarEdges: readonly number[]

  readonly padTop: number
  readonly floorFrameY: number
  /** the main floor */
  readonly deckY: number
  /** the raised end floors. Equal to `deckY` when there are none. */
  readonly anjuangY: number
  /** how far the anjuang steps up. Zero under Bodi Caniago, and that is the point. */
  readonly anjuangRise: number
  readonly plateY: number

  /** the ridge: sags at mid-span, rises symmetrically to both ends */
  readonly ridgeY: number
  readonly ridgeSag: number
  readonly ridgeEndZ: number
  readonly ridgeEndY: number

  /** half-depth of the roof at the eave, measured across X */
  readonly eaveHalfDepth: number
  readonly eaveY: number
  /** where the roof breaks across the slope: 0 at the ridge, 1 at the eave */
  readonly breakFraction: number
  readonly kneeDrop: number
  readonly eaveOversail: number

  /** the resolved gonjong tips, in build order. Their count follows the laras. */
  readonly gonjongTips: readonly (readonly [number, number, number])[]

  readonly ijukCourses: number
  readonly bilikCount: number
  /** centre of each bilik along Z, in the order they were added */
  readonly bilikZ: readonly number[]

  readonly dims: readonly Dim[]
}
