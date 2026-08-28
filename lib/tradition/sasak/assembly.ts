/** The lumbung, assembled. Pure and deterministic, like the other eleven. */

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
import type { Bounds, House, Layout, Part, Rules, SasakKinds } from './types'
import { buildFrame, resolveLayout } from './frame'
import { buildRoofFrame, buildThatch, roofLevels, roofRun } from './roof'
import { DIMS, PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<SasakKinds>
export type TimelineEntry = CoreTimelineEntry<SasakKinds>
export type StageSpan = CoreStageSpan<SasakKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

/**
 * The roof is resolved in two passes, and it has to be.
 *
 * `roofLevels` needs the store's own length to place the hood, and the course
 * count needs the finished curve to know how long a slope it is covering. So
 * the layout is completed rather than computed in one go — which is the first
 * time in this project a Layout could not be produced by a single function,
 * and it is a consequence of the roof being derived from the building rather
 * than declared beside it.
 */
export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const provisional: Layout = { ...base, roof: [], dims: [] }
  const levels = roofLevels(provisional)
  const withRoof: Layout = { ...provisional, roof: levels }
  const run = roofRun(withRoof)
  const layout: Layout = {
    ...withRoof,
    thatchCourses: Math.max(3, Math.round(run / DIMS.thatchCourseDepth.value)),
    dims: dimsForLayout(withRoof),
  }

  const frame = buildFrame(layout)
  const roof = buildRoofFrame(layout)
  const parts = [...frame.parts, ...roof.parts, ...buildThatch(layout)]

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
