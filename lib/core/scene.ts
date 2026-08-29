/**
 * What the renderer needs to know that the part list does not say.
 *
 * The parts are already neutral — a box with a centre, a size and a material
 * is the same claim whoever built it — so the renderer could always draw a
 * house it had never heard of. What it could not do was place the ground, aim
 * the cameras, stand the scale figure, cut the section or make it rain,
 * because all of that came from reading twenty fields off a `Layout` that
 * belongs to one tradition.
 *
 * This is that reading, done once, tradition-side. Everything in here is a
 * fact about a building rather than about a rendering decision: where the
 * water lands, how the house divides vertically, how far the roof reaches.
 * The renderer decides what to do with them.
 *
 * The `Layout` types themselves stay tradition-side and are not shared. Two
 * houses were not enough to say what a shared one would contain, and this is
 * the narrower question — what a *renderer* needs — which two houses did
 * answer.
 */

import type { ProvenanceClass, Vec3 } from './types'

/** One named band of occupancy, between two heights. */
export interface Zone {
  readonly key: string
  readonly fromY: number
  readonly toY: number
  readonly nameId: string
  readonly nameEn: string
  readonly glossId: string
  readonly glossEn: string
}

/**
 * One thing on the ground that is not the building.
 *
 * Every house here answers to something outside itself — a yard the rice
 * barns stand across, a village street, a river bank, a compound wall — and
 * until now all of that lived in prose. It is a fact about the building in
 * the same way the drip line is: the tongkonan faces its alang because that
 * is what facing north *means* here, and a reader looking at a model standing
 * on nothing cannot see it.
 *
 * What this is not: scenery. Every mark lies flat on the ground, so nothing
 * here can hide any part of the house, and nothing in it is a plant, a hill,
 * a texture or a sky. A plausible landscape would state, without provenance
 * and very persuasively, a great deal that nobody measured.
 *
 * `provenance` is about the *arrangement* — whether a source says the barns
 * stand opposite, or the author put them there. The distances are ordinary
 * dimensions and live in the rule pack with everything else, so a site figure
 * moves the interpolated bar the way any other invented number does.
 */
/**
 * What a site volume is made of, in the few substances a setting needs.
 *
 * Deliberately not the tradition's own material keys. Those name a species and
 * a working — ulin, jati, nipah, paras — because on the house the choice was
 * made and stated by a builder. Nobody stated the stone of a grave this model
 * invented the size of, so the setting gets a short neutral list and no claim
 * beyond substance.
 */
export type SiteMaterial = 'batu' | 'kayu' | 'atap' | 'air' | 'tanah'

/**
 * One solid in the setting: a grave slab, a barn's massing, a fence post, the
 * water in front of a house.
 *
 * These are not parts. They carry no stage, no joint and no order, they are
 * not in `house.parts`, and no structural invariant runs over them — because
 * nothing here is claimed to be a building that was surveyed, jointed or
 * raised. A rice barn appears as its massing: a body and a roof at the size
 * the sources give the barn, with none of the sixty parts a real one has.
 *
 * The distances and heights are ordinary dimensions in the rule pack, so the
 * setting is counted in the provenance bar like everything else. What is
 * bought by giving them volume is that a reader can see where they are and
 * what they are; what is not bought is any new knowledge, and the legend says
 * so.
 */
export interface SiteVolume {
  /**
   * `gable` is a prism: a box with a ridge over it, along `ridgeAxis`.
   * `cone` and `cylinder` take their radius from half of `size` in X.
   */
  readonly kind: 'box' | 'gable' | 'cone' | 'cylinder'
  /** centre in plan, base on the ground: [x, baseY, z] */
  readonly at: Vec3
  /** [x, height, z] */
  readonly size: Vec3
  /** for a gable, the axis its ridge runs on; 0 = X, 2 = Z */
  readonly ridgeAxis?: 0 | 2
  readonly material: SiteMaterial
}

export interface SiteMark {
  readonly key: string
  readonly nameId: string
  readonly nameEn: string
  readonly glossId: string
  readonly glossEn: string
  /** polylines on the ground, in metres: [x, z], y is always zero */
  readonly lines: readonly (readonly (readonly [number, number])[])[]
  /** true when every line closes back onto its first point */
  readonly closed: boolean
  /**
   * The solids standing on that ground, if any.
   *
   * A figure may be lines alone — a river's edge is an edge, not an object —
   * but where the sources say a thing stands there, it stands there.
   */
  readonly volumes: readonly SiteVolume[]
  readonly provenance: ProvenanceClass
}

export interface SceneModel {
  /**
   * The axis the ridge runs on. 0 = X, 2 = Z, or null for a house with no
   * ridge at all.
   *
   * The tongkonan's runs on X and it mirrors across it; the rumah gadang's and
   * the joglo's run on Z. The fourth house is round: a cone has no ridge, no
   * face and no corner, so there is no axis to name and every vertical cut
   * through it is the same cut.
   *
   * `null` rather than a default, because a default would be a quiet lie. The
   * field was `0 | 2` while every house happened to have a ridge, which looked
   * like a fact about houses and was a fact about the three that existed.
   */
  readonly ridgeAxis: 0 | 2 | null

  /**
   * Plan extent of the body, per axis, metres.
   *
   * A plan for the three rectangular houses and a bounding box for the round
   * one, where the two numbers are equal and neither is a side of anything.
   */
  readonly footprint: { readonly x: number; readonly z: number }

  /**
   * Half-extents of the drip envelope: where water leaves the roof. The two
   * lines on the ground stand just outside it, and the point of the whole
   * demonstration is that they land clear of the post feet.
   */
  readonly drip: { readonly x: number; readonly z: number }

  /** how far the roof reaches along the ridge, from the centre each way */
  readonly ridgeReach: number

  /** the highest point weather has to fall from */
  readonly weatherTop: number

  /** clear height under the floor — what the under-floor camera aims at */
  readonly underfloorHeight: number

  /** every plane worth a line on the cut face, ascending */
  readonly zoneLines: readonly number[]

  /** the named occupancy zones, ascending and contiguous */
  readonly zones: readonly Zone[]

  /**
   * What is on the ground around the house, and what it is.
   *
   * Empty is a real answer and means the sources say nothing this model is
   * willing to draw — not that the house stands in a void.
   */
  readonly site: readonly SiteMark[]

  /**
   * Where a person arriving at this house stands, in plan.
   *
   * Not a camera position and not a rendering decision: it is where the front
   * of the building is addressed *from*, which every tradition here already
   * states in its orientation rule. A tongkonan is met from the north, across
   * the yard the alang stand on the far side of; a rumah gadang from the
   * halaman; a betang from the water; a mbaru niang from the middle of the
   * village circle.
   *
   * The renderer uses it for a vantage that stands on the ground and looks at
   * the front, which is where the house is meant to be read from and which the
   * three-quarter default cannot be: the setting now stands between the two,
   * and a barn in the way is not a bug in the barn.
   *
   * Y is ignored — a person stands on the ground — but the field is a Vec3 so
   * it reads the same as `figureAt` beside it.
   */
  readonly approachAt: Vec3

  /**
   * Where the scale figure stands: beside the house and clear of the eave, so
   * it reads as a measure of the building rather than as a person doing
   * something.
   */
  readonly figureAt: Vec3
}

/* ── Ground figures ───────────────────────────────────────────────────── */

/**
 * A rectangle on the ground, corners first and last the same point.
 *
 * Here rather than in fourteen scene files, because a yard is a rectangle in
 * every tradition that has one and the arithmetic knows nothing about which.
 */
export function groundRect(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
): readonly (readonly [number, number])[] {
  return [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
    [x0, z0],
  ]
}

/** A circle on the ground, as a closed polyline. */
export function groundRing(
  cx: number,
  cz: number,
  radius: number,
  segments = 48,
): readonly (readonly [number, number])[] {
  const points: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    points.push([cx + Math.cos(a) * radius, cz + Math.sin(a) * radius])
  }
  return points
}

/**
 * The axis the section plane's normal runs on: the one the ridge does not.
 *
 * A house with no ridge is cut on Z, and the choice is arbitrary in the way
 * the building is arbitrary about it — every vertical plane through the axis
 * of a cone gives the same section, so any of them is the right one.
 */
export function sectionAxis(model: SceneModel): 0 | 2 {
  return model.ridgeAxis === 0 ? 2 : 0
}
