/**
 * Dalam Loka, assembled: ninety-nine stones, ninety-nine posts, a beam over
 * every line of them, and one roof over both halls.
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
import type { Bounds, House, Layout, Part, Rules, SumbawaKinds } from './types'
import { buildIstana, resolveLayout } from './frame'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<SumbawaKinds>
export type TimelineEntry = CoreTimelineEntry<SumbawaKinds>
export type StageSpan = CoreStageSpan<SumbawaKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const layout: Layout = { ...base, dims: dimsForLayout(base) }

  const tower = buildIstana(layout)
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
