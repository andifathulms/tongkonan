/**
 * What the Sama-Bajau lepa calls things.
 *
 * The twenty-first building, and the first with no ground under it at all.
 *
 * Nineteen of the twenty stand on earth, masonry, swamp, a hillside or a
 * bay's bed. The kariwari was the first that did not stand on land — but it
 * still stands: its posts are driven into the bottom, and its floor answers a
 * tide. A lepa is a house that floats. It has no site, no plot, no footprint
 * and no address; where it is tonight is not a property of the building.
 *
 * That takes away, one after another, most of the things this project has
 * used to describe a house. It has no orientation rule, because there is
 * nothing fixed to be oriented to — the only building in the collection whose
 * pack declares none. It has no foundation, no clearance above the ground, no
 * relationship to a neighbouring granary or street. What it has instead is
 * balance: a dwelling that leans is a dwelling that fills with water, so the
 * one thing this building must do that no other must is *stay upright*.
 *
 * And its hull is a swept surface — the same primitive that makes a tongkonan
 * roof, turned over. A saddle roof and a boat hull are one operation: a
 * section swept along a curve, with a break where the surface turns. The knee
 * that was written to let an eave hang below a wall plate is the turn of the
 * bilge here, and nothing in it had to change.
 *
 * On the words: lepa is the boat-house; kajang the palm awning over it. Where
 * the author is not confident of the Sama term the part is named in
 * Indonesian, on the policy the joglo pack set.
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
  | 'sather-1997'
  | 'depdikbud-sulsel'
  | 'nimmo-1972'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How big the boat is, which is how many people live aboard it.
 *
 * A lepa holds a household and no more, and the sizes are the sizes the
 * sources describe rather than a continuous range: a boat is built to a size,
 * not scaled to a number. The rule holds the dimension *key* rather than the
 * value, which is the correction the Banjar pack had to make.
 */
export type Ukuran = 'kecil' | 'sedang' | 'besar'

export interface Rules {
  readonly ukuran: Ukuran
  /**
   * Whether the kajang is up.
   *
   * The palm awning over the middle of the boat is what makes a lepa a house
   * rather than a hull: under it people sleep, eat and keep what they own.
   * Taking it down does not change one plank of the boat, and the thing stops
   * being a dwelling — which is as clear a statement as this collection has
   * about what the difference is.
   */
  readonly kajang: boolean
  /** whether the outriggers are shipped */
  readonly cadik: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'lunas'   // the keel, laid first, as in every boat ever built
  | 'papan'   // the strakes that make the hull
  | 'gading'  // the frames inside them
  | 'geladak' // the deck and the thwarts
  | 'kajang'  // the awning that makes it a house
  | 'dapur'   // the hearth box, because a household cooks aboard
  | 'cadik'   // the outriggers, last

export const STAGE_ORDER: readonly Stage[] = [
  'lunas',
  'papan',
  'gading',
  'geladak',
  'kajang',
  'dapur',
  'cadik',
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
  | 'nipah' // the palm leaf of the awning
  | 'pasir' // the sand the hearth stands in

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a dowel through the edges of two strakes */
  | 'pasak'
  /** a lashing of fibre */
  | 'ikat'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface BajauKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<BajauKinds>
export type MeshPart = CoreMeshPart<BajauKinds>
export type Part = CorePart<BajauKinds>
export type Joint = CoreJoint<BajauKinds>
export type House = CoreHouse<BajauKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  /** overall length, and the widest half-beam */
  readonly length: number
  readonly halfBeam: number
  /** the keel line and the sheer, measured up from the bottom of the keel */
  readonly keelY: number
  readonly sheerY: number
  /** how deep it sits: the waterline, above the same datum */
  readonly draught: number
  readonly freeboard: number

  readonly deckY: number
  readonly frames: number
  readonly strakes: number

  readonly kajang: { readonly present: boolean; readonly from: number; readonly to: number; readonly rise: number }
  readonly hearth: { readonly x: number; readonly side: number; readonly radius: number }
  readonly cadik: { readonly present: boolean; readonly reach: number; readonly y: number }

  /**
   * How high the centre of everything may sit above the waterline.
   *
   * A limit rather than a calculation. This project has no material properties
   * and will not acquire any, so nothing here can say whether a boat is
   * stable; what it can say is that the weight in it is kept low, which is
   * what the sources describe and what the check tests. Stated as a limit so
   * that the check compares two independent numbers.
   */
  readonly centreLimit: number

  readonly dims: readonly Dim[]
}
