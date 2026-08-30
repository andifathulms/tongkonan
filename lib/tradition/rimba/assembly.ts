/**
 * The sudung, assembled — the whole of it an afternoon's work, and the only
 * sequence here that the people who will sleep under it carry out themselves.
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
import type { Bounds, House, Layout, Part, Rules, RimbaKinds } from './types'
import { buildSudung, resolveLayout } from './frame'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<RimbaKinds>
export type TimelineEntry = CoreTimelineEntry<RimbaKinds>
export type StageSpan = CoreStageSpan<RimbaKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const layout: Layout = { ...base, dims: dimsForLayout(base) }

  const tower = buildSudung(layout)
  const ordered = sortByBuildOrder(tower.parts)
  return {
    layout,
    house: { rules: normalised, parts: ordered, joints: [...tower.joints], bounds: boundsOf(ordered) },
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
