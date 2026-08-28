/** The saoraja, assembled. Pure and deterministic, like the other nine. */

import {
  boundsOf as coreBoundsOf,
  buildTimeline as coreBuildTimeline,
  sortByBuildOrder as coreSortByBuildOrder,
} from '@/lib/core/assembly'
import type {
  StageSpan as CoreStageSpan,
  Timeline as CoreTimeline,
  TimelineEntry as CoreTimelineEntry,
} from '@/lib/core/assembly'
import type { Bounds, BugisKinds, House, Layout, Part, Rules } from './types'
import { buildFrame, resolveLayout } from './frame'
import { buildRoofFrame, buildThatch, buildTimpa } from './roof'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<BugisKinds>
export type TimelineEntry = CoreTimelineEntry<BugisKinds>
export type StageSpan = CoreStageSpan<BugisKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

/**
 * The rank goes on after the house is finished, and the order matters.
 *
 * `buildTimpa` is last in this list and `timpa` is last in the stage order,
 * which together mean the raising sequence shows a completed building and then
 * a household making a claim about itself on the outside of it. Every other
 * house in this project finishes with a roof or an ornament that completes the
 * structure; this one finishes with an assertion.
 */
export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const layout: Layout = { ...base, dims: dimsForLayout(base) }

  const frame = buildFrame(layout)
  const roof = buildRoofFrame(layout)
  const parts = [...frame.parts, ...roof.parts, ...buildThatch(layout), ...buildTimpa(layout)]

  const ordered = sortByBuildOrder(parts)
  return {
    layout,
    house: { rules: normalised, parts: ordered, joints: [...frame.joints, ...roof.joints], bounds: boundsOf(ordered) },
  }
}

export function sortByBuildOrder(parts: readonly Part[]): readonly Part[] {
  return coreSortByBuildOrder(PACK, parts)
}

export function boundsOf(parts: readonly Part[]): Bounds {
  return coreBoundsOf(parts)
}

export function buildTimeline(house: House, seconds?: number): Timeline {
  return coreBuildTimeline(PACK, house, seconds)
}
