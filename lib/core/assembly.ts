/**
 * Build order, and the timeline the frame-raising sequence walks.
 *
 * None of this knows what is being raised. It knows there is a declared
 * sequence of stages, that parts carry a stage and a position within it, and
 * that a crew works through them in that order — which is true of every
 * house, and is the whole of what the animation and the invariants need.
 *
 * The tradition supplies the stages and their weights through its rule pack.
 */

import type { Kinds, RulePack } from './kinds'
import type { Bounds, House, Part, Vec3 } from './types'
import { rotatedHalfExtents } from './geometry'

/**
 * Build order: stage first, then the part's own order within it.
 *
 * `order` is not a z-index and it is not a draw order. It is the sequence a
 * crew would work in, and the invariant suite reads it as such — nothing may
 * be placed before the thing that carries it.
 */
export function sortByBuildOrder<K extends Kinds>(
  pack: RulePack<K>,
  parts: readonly Part<K>[],
): readonly Part<K>[] {
  const rank = new Map<K['stage'], number>(pack.stageOrder.map((s, i) => [s, i]))
  return [...parts].sort((a, b) => {
    const sa = rank.get(a.stage) ?? 0
    const sb = rank.get(b.stage) ?? 0
    if (sa !== sb) return sa - sb
    if (a.order !== b.order) return a.order - b.order
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

/* ── Bounds ───────────────────────────────────────────────────────────── */

export function boundsOf<K extends Kinds>(parts: readonly Part<K>[]): Bounds {
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

/** Seconds. Long enough to read the stage names, short enough to sit through. */
export const SEQUENCE_SECONDS = 15

export interface TimelineEntry<K extends Kinds> {
  readonly partId: string
  readonly stage: K['stage']
  /** normalised over the whole sequence, 0–1 */
  readonly start: number
  readonly end: number
}

export interface StageSpan<K extends Kinds> {
  readonly stage: K['stage']
  readonly start: number
  readonly end: number
  readonly partIds: readonly string[]
}

export interface Timeline<K extends Kinds> {
  readonly seconds: number
  readonly entries: readonly TimelineEntry<K>[]
  readonly stages: readonly StageSpan<K>[]
}

/**
 * The normalised timeline: every part gets a span, every stage gets a span,
 * both in 0–1. Parts within a stage overlap heavily, because a crew does not
 * place one board and wait.
 */
export function buildTimeline<K extends Kinds>(
  pack: RulePack<K>,
  house: House<K>,
  seconds = SEQUENCE_SECONDS,
): Timeline<K> {
  const present = pack.stageOrder.filter((s) => house.parts.some((p) => p.stage === s))
  const totalWeight = present.reduce((sum, s) => sum + pack.stageWeight(s), 0) || 1

  const entries: TimelineEntry<K>[] = []
  const stages: StageSpan<K>[] = []
  let cursor = 0

  for (const stage of present) {
    const span = pack.stageWeight(stage) / totalWeight
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
export function placedAt<K extends Kinds>(
  timeline: Timeline<K>,
  t: number,
): ReadonlySet<string> {
  const out = new Set<string>()
  for (const e of timeline.entries) if (t >= e.end) out.add(e.partId)
  return out
}

/**
 * How far a part is through its own drop at time `t`, 0–1.
 * Reduced-motion callers ignore this and take the ordered reveal instead:
 * the sequence is content, so it is de-animated, never removed.
 */
export function progressAt<K extends Kinds>(
  timeline: Timeline<K>,
  partId: string,
  t: number,
): number {
  const e = timeline.entries.find((x) => x.partId === partId)
  if (!e) return 1
  if (t <= e.start) return 0
  if (t >= e.end) return 1
  return (t - e.start) / Math.max(1e-6, e.end - e.start)
}
