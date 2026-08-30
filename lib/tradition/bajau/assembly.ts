/** The lepa, assembled. Pure and deterministic, like the other twenty. */

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
import type { BajauKinds, Bounds, House, Layout, Part, Rules } from './types'
import { buildFittings, buildHull, resolveLayout } from './frame'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<BajauKinds>
export type TimelineEntry = CoreTimelineEntry<BajauKinds>
export type StageSpan = CoreStageSpan<BajauKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const layout: Layout = { ...base, dims: dimsForLayout(base) }

  const hull = buildHull(layout)
  const fittings = buildFittings(layout)
  const parts = [...hull.parts, ...fittings.parts]

  const ordered = sortByBuildOrder(parts)
  return {
    layout,
    house: {
      rules: normalised,
      parts: ordered,
      joints: [...hull.joints, ...fittings.joints],
      bounds: boundsOf(ordered),
    },
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
