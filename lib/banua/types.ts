/**
 * The generator's vocabulary.
 *
 * Nothing in `lib/` may import three.js, touch `window`, or read the DOM. These
 * types are the whole surface the renderer is allowed to see, and they are
 * deliberately dumb: numbers, arrays and tags. A part is data about a piece of
 * timber, not a drawing instruction.
 */

export type Vec3 = readonly [number, number, number]

/* ── Provenance ───────────────────────────────────────────────────────────
 * Every dimension declares where it came from. This is not decoration: the
 * rail reads it, /sumber lists it, and a test prints the interpolated share.
 */

export type ProvenanceClass =
  /** taken from a published measured drawing of a named, surveyed house */
  | 'measured'
  /** stated in a documented canon or ethnographic description, not measured */
  | 'canon'
  /** the author's own value, closing a gap the sources leave open */
  | 'interpolated'

/** Key into the source table in `rules.ts`. `none` means: nobody said this. */
export type SourceKey =
  | 'none'
  | 'kis-jovak-1988'
  | 'waterson-1990'
  | 'schefold-2003'
  | 'depdikbud-sulsel'
  | 'nooy-palm-1979'

/**
 * A number that knows its own epistemic status.
 *
 * Replacing an interpolated value with a measured one is a two-line edit —
 * change `value`, change `class`, point `source` at the survey. Nothing
 * downstream needs to know it happened.
 */
export interface Dim {
  readonly value: number
  readonly unit: 'm' | 'deg' | 'count' | 'ratio'
  readonly class: ProvenanceClass
  readonly source: SourceKey
  /** What the value means, in Indonesian. Shown in /sumber. */
  readonly note: string
}

export interface Source {
  readonly key: SourceKey
  readonly citation: string
  readonly kind: 'survey' | 'ethnography' | 'reference' | 'none'
}

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

/* ── Parts ────────────────────────────────────────────────────────────────
 * Two kinds only. Boxes stay boxes so joint containment has something exact
 * to test against; anything that cannot be a box carries its own triangles.
 */

interface PartBase {
  readonly id: string
  /** The Toraja name of the piece. Used as the name in both locales. */
  readonly name: string
  readonly nameId: string
  readonly nameEn: string
  readonly stage: Stage
  readonly order: number
  readonly material: MaterialKey
}

export interface BoxPart extends PartBase {
  readonly kind: 'box'
  readonly center: Vec3
  readonly size: Vec3
  /** XYZ-order Euler rotation in radians. Omitted means axis-aligned. */
  readonly rotation?: Vec3
}

export interface MeshPart extends PartBase {
  readonly kind: 'mesh'
  /** World coordinates, metres. Flat triples. */
  readonly positions: readonly number[]
  readonly normals: readonly number[]
  readonly uvs: readonly number[]
  readonly indices: readonly number[]
}

export type Part = BoxPart | MeshPart

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

export interface Joint {
  readonly id: string
  readonly kind: JointKind
  /** the part carrying the mortise (or the socket) */
  readonly mortise: string
  /** the part whose tenon enters it */
  readonly tenon: string
  /** where the joint sits, world coordinates */
  readonly at: Vec3
  /** half-extents of the engagement, world-axis-aligned */
  readonly halfExtents: Vec3
}

/* ── Output ───────────────────────────────────────────────────────────────*/

export interface Bounds {
  readonly min: Vec3
  readonly max: Vec3
}

export interface House {
  readonly rules: Rules
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
  readonly bounds: Bounds
}

/**
 * Every resolved dimension of one house, in metres, with its provenance
 * intact. The renderer reads from here rather than recomputing anything —
 * a number hardcoded in a component escapes the provenance layer.
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
  /** how far the eave oversails the outer post line, metres */
  readonly eaveOversail: number

  readonly ijukCourses: number
  readonly hornCount: number
  /** where the tulak somba stands, X */
  readonly tulakSombaX: number

  /** every Dim that produced the numbers above, for the provenance strip */
  readonly dims: readonly Dim[]
}
