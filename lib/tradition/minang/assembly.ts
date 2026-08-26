/**
 * The rumah gadang, assembled.
 *
 * Pure and deterministic, like the other house: the same call runs in the
 * browser and in the test suite and produces identical output.
 */

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
import type { Bounds, House, Layout, MinangKinds, Part, Rules } from './types'
import { buildFrame, resolveLayout } from './frame'
import { buildGonjong, buildIjuk, buildRoofFrame } from './roof'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<MinangKinds>
export type TimelineEntry = CoreTimelineEntry<MinangKinds>
export type StageSpan = CoreStageSpan<MinangKinds>

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
  const parts = [...frame.parts, ...roof.parts, ...buildGonjong(layout), ...buildIjuk(layout)]
  const joints = [...frame.joints, ...roof.joints]

  const ordered = sortByBuildOrder(parts)
  return {
    layout,
    house: { rules: normalised, parts: ordered, joints, bounds: boundsOf(ordered) },
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
