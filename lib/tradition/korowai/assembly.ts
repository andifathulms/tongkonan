/**
 * The khaim, assembled.
 *
 * Pure and deterministic like the other twenty-three — which is worth a note
 * here, because the one thing this building is made of that nothing else is
 * made of is alive, and a living support is exactly what a deterministic model
 * cannot follow. What is built is the tree on the day the house was finished.
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
import type { Bounds, House, Layout, Part, Rules, KorowaiKinds } from './types'
import { buildKhaim, resolveLayout } from './frame'
import { PACK, dimsForLayout, normaliseRules } from './rules'

export { SEQUENCE_SECONDS, placedAt, progressAt } from '@/lib/core/assembly'

export type Timeline = CoreTimeline<KorowaiKinds>
export type TimelineEntry = CoreTimelineEntry<KorowaiKinds>
export type StageSpan = CoreStageSpan<KorowaiKinds>

export interface BuildResult {
  readonly house: House
  readonly layout: Layout
}

export function buildHouse(rules: Rules): BuildResult {
  const normalised = normaliseRules(rules)
  const base = resolveLayout(normalised)
  const layout: Layout = { ...base, dims: dimsForLayout(base) }

  const tower = buildKhaim(layout)
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
