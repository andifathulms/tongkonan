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

import type { Vec3 } from './types'

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
   * Where the scale figure stands: beside the house and clear of the eave, so
   * it reads as a measure of the building rather than as a person doing
   * something.
   */
  readonly figureAt: Vec3
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
