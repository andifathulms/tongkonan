/**
 * The generator's vocabulary, with no tradition in it.
 *
 * Nothing in `lib/` may import three.js, touch `window`, or read the DOM.
 * These types are the whole surface the renderer is allowed to see, and they
 * are deliberately dumb: numbers, arrays and tags. A part is data about a
 * piece of timber, not a drawing instruction.
 *
 * Every type here is generic over `Kinds` — see `kinds.ts` for why. The rule
 * is that this file may not contain a word from any one building tradition,
 * because the moment it does, the second tradition has to be bent to fit the
 * first.
 */

import type { Kinds } from './kinds'

export type Vec3 = readonly [number, number, number]

/* ── Provenance ───────────────────────────────────────────────────────────
 * Every dimension declares where it came from. This is not decoration: the
 * rail reads it, the source route lists it, and a test prints the
 * interpolated share.
 */

export type ProvenanceClass =
  /** taken from a published measured drawing of a named, surveyed house */
  | 'measured'
  /** stated in a documented canon or ethnographic description, not measured */
  | 'canon'
  /** the author's own value, closing a gap the sources leave open */
  | 'interpolated'

/**
 * A number that knows its own epistemic status.
 *
 * Replacing an interpolated value with a measured one is a two-line edit —
 * change `value`, change `class`, point `source` at the survey. Nothing
 * downstream needs to know it happened.
 */
export interface Dim<S extends string = string> {
  readonly value: number
  readonly unit: 'm' | 'deg' | 'count' | 'ratio'
  readonly class: ProvenanceClass
  readonly source: S
  /** What the value means. Shown in full on the source route, in both locales. */
  readonly note: string
  readonly noteEn: string
}

export interface Source<S extends string = string> {
  readonly key: S
  readonly citation: string
  readonly kind: 'survey' | 'ethnography' | 'reference' | 'none'
}

/* ── Parts ────────────────────────────────────────────────────────────────
 * Two kinds only. Boxes stay boxes so joint containment has something exact
 * to test against; anything that cannot be a box carries its own triangles.
 */

interface PartBase<K extends Kinds> {
  readonly id: string
  /** The local name of the piece. Used as the name in every locale. */
  readonly name: string
  readonly nameId: string
  readonly nameEn: string
  readonly stage: K['stage']
  /**
   * Position within the stage. Together with `stage` this is the build
   * sequence, which the assembly animation walks and the invariants check.
   * `order` is not a z-index.
   */
  readonly order: number
  readonly material: K['material']
  /**
   * The dimensions that decided this part's size and place.
   *
   * The provenance bar says how much of the house is guessed. It cannot say
   * *which* of it, and that is the more useful half — the sources give
   * structure richly and metres almost never, so the topology is largely
   * sourced while the sizes are largely not. Declaring the governing
   * dimensions per part is what lets the model show that distinction instead
   * of asserting a single fraction over everything.
   *
   * A tradition-wide scale factor is not listed. Every dimension passes
   * through it, so listing it everywhere would say nothing; a part is classed
   * by its least-sourced input, so its absence changes no verdict.
   *
   * An empty list is a bug and `checkPartProvenance` fails the build on it.
   */
  readonly dims: readonly K['dim'][]
}

export interface BoxPart<K extends Kinds> extends PartBase<K> {
  readonly kind: 'box'
  readonly center: Vec3
  readonly size: Vec3
  /** XYZ-order Euler rotation in radians. Omitted means axis-aligned. */
  readonly rotation?: Vec3
}

export interface MeshPart<K extends Kinds> extends PartBase<K> {
  readonly kind: 'mesh'
  /** World coordinates, metres. Flat triples. */
  readonly positions: readonly number[]
  readonly normals: readonly number[]
  readonly uvs: readonly number[]
  readonly indices: readonly number[]
}

export type Part<K extends Kinds> = BoxPart<K> | MeshPart<K>

/* ── Joints ───────────────────────────────────────────────────────────────
 * Where a tradition builds without nails, the joints are load-bearing claims
 * and the invariant suite checks every tenon sits inside its mortise.
 */

export interface Joint<K extends Kinds> {
  readonly id: string
  readonly kind: K['joint']
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

export interface House<K extends Kinds> {
  readonly rules: K['rules']
  readonly parts: readonly Part<K>[]
  readonly joints: readonly Joint<K>[]
  readonly bounds: Bounds
}

/* ── Neutral aliases ──────────────────────────────────────────────────────
 * Every member of `Kinds` is a string or an object, and every field of a part
 * is readonly, so `House<TorajaKinds>` is assignable to `House<Kinds>`. That
 * is what lets the renderer take a house it cannot name a single stage of.
 *
 * Use these where something genuinely does not care which house it has —
 * the renderer, the registry, the provenance strip. Anything that switches on
 * a stage or a material wants the tradition's own concrete alias instead, so
 * that the switch stays exhaustively checked.
 */

export type AnyPart = Part<Kinds>
export type AnyJoint = Joint<Kinds>
export type AnyHouse = House<Kinds>
