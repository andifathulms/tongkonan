/**
 * Build order, and the timeline the frame-raising sequence walks.
 *
 * `buildHouse` is the whole public surface of the generator. It is pure and
 * deterministic — no unseeded randomness, no `Date.now()` — so the same call
 * runs in the browser and in the test suite and produces identical output.
 */

import { STAGE_ORDER } from './types'
import type { Bounds, House, Layout, Part, Rules, Stage, Vec3 } from './types'
import { buildFrame, buildHorns, resolveLayout } from './frame'
import { buildIjuk, buildRoofFrame } from './roof'
import { dimsForLayout, normaliseRules } from './rules'
import { rotatedHalfExtents } from './geometry'

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
  const parts = [...frame.parts, ...roof.parts, ...buildIjuk(layout), ...buildHorns(layout)]
  const joints = [...frame.joints, ...roof.joints]

  const ordered = sortByBuildOrder(parts)
  return {
    layout,
    house: { rules: normalised, parts: ordered, joints, bounds: boundsOf(ordered) },
  }
}

/**
 * Build order: stage first, then the part's own order within it.
 *
 * `order` is not a z-index and it is not a draw order. It is the sequence a
 * crew would work in, and the invariant suite reads it as such — nothing may
 * be placed before the thing that carries it.
 */
export function sortByBuildOrder(parts: readonly Part[]): readonly Part[] {
  const rank = new Map<Stage, number>(STAGE_ORDER.map((s, i) => [s, i]))
  return [...parts].sort((a, b) => {
    const sa = rank.get(a.stage) ?? 0
    const sb = rank.get(b.stage) ?? 0
    if (sa !== sb) return sa - sb
    if (a.order !== b.order) return a.order - b.order
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

/* ── Bounds ───────────────────────────────────────────────────────────── */

export function boundsOf(parts: readonly Part[]): Bounds {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity

  const grow = (x: number, y: number, z: number) => {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }

  for (const part of parts) {
    if (part.kind === 'box') {
      const h = rotatedHalfExtents(part.size, part.rotation)
      grow(part.center[0] - h[0], part.center[1] - h[1], part.center[2] - h[2])
      grow(part.center[0] + h[0], part.center[1] + h[1], part.center[2] + h[2])
    } else {
      for (let i = 0; i < part.positions.length; i += 3) {
        grow(part.positions[i] ?? 0, part.positions[i + 1] ?? 0, part.positions[i + 2] ?? 0)
      }
    }
  }

  if (!Number.isFinite(minX)) {
    const zero: Vec3 = [0, 0, 0]
    return { min: zero, max: zero }
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] }
}

/* ── The timeline ─────────────────────────────────────────────────────── */

/**
 * Relative durations of the nine stages.
 *
 * These are not proportional to part count. Raising the posts is the act that
 * decides whether the house stands, and the ijuk is a long patient job — the
 * sequence is meant to read like the work, not like a progress bar.
 */
const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.6,
  ariri: 1.6,
  'rangka-lantai': 1.1,
  lantai: 0.7,
  dinding: 1.0,
  'tulak-somba': 0.8,
  'rangka-atap': 1.7,
  ijuk: 2.0,
  tanduk: 0.9,
}

/** Seconds. Long enough to read the stage names, short enough to sit through. */
export const SEQUENCE_SECONDS = 15

export interface TimelineEntry {
  readonly partId: string
  readonly stage: Stage
  /** normalised over the whole sequence, 0–1 */
  readonly start: number
  readonly end: number
}

export interface StageSpan {
  readonly stage: Stage
  readonly start: number
  readonly end: number
  readonly partIds: readonly string[]
}

export interface Timeline {
  readonly seconds: number
  readonly entries: readonly TimelineEntry[]
  readonly stages: readonly StageSpan[]
}

/**
 * The normalised timeline: every part gets a span, every stage gets a span,
 * both in 0–1. Parts within a stage overlap heavily, because a crew does not
 * place one board and wait.
 */
export function buildTimeline(house: House, seconds = SEQUENCE_SECONDS): Timeline {
  const present = STAGE_ORDER.filter((s) => house.parts.some((p) => p.stage === s))
  const totalWeight = present.reduce((sum, s) => sum + STAGE_WEIGHT[s], 0) || 1

  const entries: TimelineEntry[] = []
  const stages: StageSpan[] = []
  let cursor = 0

  for (const stage of present) {
    const span = STAGE_WEIGHT[stage] / totalWeight
    const start = cursor
    const end = cursor + span
    cursor = end

    const inStage = house.parts.filter((p) => p.stage === stage)
    // Each part's own drop takes a generous share of its stage, so placements
    // overlap instead of ticking past one at a time.
    const each = inStage.length > 1 ? span * 0.45 : span
    const step = inStage.length > 1 ? (span - each) / (inStage.length - 1) : 0
    inStage.forEach((part, i) => {
      const s0 = start + step * i
      entries.push({ partId: part.id, stage, start: s0, end: Math.min(1, s0 + each) })
    })
    stages.push({ stage, start, end, partIds: inStage.map((p) => p.id) })
  }

  return { seconds, entries, stages }
}

/** Which parts are placed at a given point in the sequence, 0–1. */
export function placedAt(timeline: Timeline, t: number): ReadonlySet<string> {
  const out = new Set<string>()
  for (const e of timeline.entries) if (t >= e.end) out.add(e.partId)
  return out
}

/**
 * How far a part is through its own drop at time `t`, 0–1.
 * Reduced-motion callers ignore this and take the ordered reveal instead:
 * the sequence is content, so it is de-animated, never removed.
 */
export function progressAt(timeline: Timeline, partId: string, t: number): number {
  const e = timeline.entries.find((x) => x.partId === partId)
  if (!e) return 1
  if (t <= e.start) return 0
  if (t >= e.end) return 1
  return (t - e.start) / Math.max(1e-6, e.end - e.start)
}
