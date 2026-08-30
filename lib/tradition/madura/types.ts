/**
 * What the Madurese tanean lanjang calls things.
 *
 * The twenty-fifth entry, and the first that is not a building.
 *
 * A tanean lanjang is a long yard with buildings around it: a langgar closing
 * the west end, a row of houses along the north side facing south into the
 * yard, and a row of kitchens opposite. The eldest household stands at the
 * west end of the row, nearest the langgar, and each married daughter's house
 * is added eastward in the order she was born. The yard is not what is left
 * over between the buildings — it is the room they are arranged around, and
 * everything a household does that is not sleeping is done in it.
 *
 * This is the gap the Bali pack named and could not fill: "a Balinese house is
 * a compound and this models one building." Here the compound is the subject,
 * which the registry took without complaint — but `SceneModel` did not, and
 * the honest reading of that is written down in `scene.ts` rather than hidden.
 *
 * Two consequences worth stating at the top:
 *
 * The **stages are not stages of building**. Every other pack raises one
 * building in an order a carpenter would recognise. Here the order is a
 * family: the yard is levelled, the langgar goes up, then one house per
 * daughter as she marries, over thirty or forty years. The raising animation
 * on `/rakit` is the only one in this project that shows generations.
 *
 * And **no symmetry claim is made along the yard**, for the second time in the
 * project after the betang. A row grown from one end is not symmetric, and
 * asserting a mirror plane that happens to pass would state something untrue.
 *
 * On the words: tanean is the yard, langgar the prayer house, tonghuh the
 * parent household's house. Those three are used; everything else is named in
 * Indonesian, on the joglo pack's policy.
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
  | 'wiryoprawiro-1986'
  | 'tulistyantoro-2005'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * The form of the roof, which is also what a Madurese house is called.
 *
 * The Banjar pack has a rule that selects a roof and therefore a name too, and
 * this is deliberately not the same claim. There, four different roofs stand
 * over one building in a row along one ridge. Here one form is chosen and
 * *repeated* down the whole row, because the houses of one tanean are alike —
 * so the rule applies to a set of buildings at once, which no other rule in
 * this project does.
 */
export type Bentuk = 'trompesan' | 'pacenan' | 'bangsal'

export interface Rules {
  /**
   * How many houses stand in the row.
   *
   * One for the parent household and one for each married daughter, in birth
   * order from the west. It is a household tally like the betang's and the
   * siwaluh jabu's, and it is the first that counts *buildings* rather than
   * rooms, hearths or seats.
   */
  readonly rumah: number
  readonly bentuk: Bentuk
  /** whether the kitchen row on the south side of the yard is built */
  readonly dapur: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

/**
 * These are generations, not trades.
 *
 * `tanean` is the yard, levelled before anything is built around it, because
 * the yard is the thing being made. `langgar` is the prayer house at the west
 * end. `rumah` is one house per household, added as daughters marry. `dapur`
 * is the kitchen row, which comes last and is often much later.
 */
export type Stage = 'tanean' | 'langgar' | 'rumah' | 'dapur'

export const STAGE_ORDER: readonly Stage[] = ['tanean', 'langgar', 'rumah', 'dapur']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'papan' | 'genteng' | 'bata' | 'batu' | 'tanah'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon, as in the Javanese timber tradition */
  | 'pathok'
  /** a post set on its stone, held by its own weight */
  | 'umpak'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface MaduraKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<MaduraKinds>
export type MeshPart = CoreMeshPart<MaduraKinds>
export type Part = CorePart<MaduraKinds>
export type Joint = CoreJoint<MaduraKinds>
export type House = CoreHouse<MaduraKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One house in the row: a household, and a position that states its standing. */
export interface Rumah {
  readonly index: number
  /** true for the parent household's house, which stands westmost */
  readonly tonghuh: boolean
  /** the centre of the house, along the yard */
  readonly z: number
  readonly width: number
  readonly depth: number
  readonly ridgeY: number
}

export interface Layout {
  readonly rules: Rules

  /** the yard: the room this whole arrangement is built around */
  readonly yard: { readonly halfX: number; readonly halfZ: number; readonly westZ: number }
  readonly houses: readonly Rumah[]
  readonly langgar: { readonly z: number; readonly side: number; readonly ridgeY: number }
  readonly kitchens: readonly (readonly [number, number])[]
  readonly floorY: number
  readonly wallTop: number
  readonly lane: number

  readonly dims: readonly Dim[]
}
