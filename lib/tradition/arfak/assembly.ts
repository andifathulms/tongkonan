/** The rumah kaki seribu, assembled. Pure and deterministic, like the other ten. */

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
import type { ArfakKinds, Bounds, House, Layout, Part, Rules } from './types'
import { buildFrame, resolveLayout } from './frame'
import { buildRoofFrame, buildThatch } from './roof'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<ArfakKinds>
export type TimelineEntry = CoreTimelineEntry<ArfakKinds>
export type StageSpan = CoreStageSpan<ArfakKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const layout: Layout = { ...base, dims: dimsForLayout(base) }

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
