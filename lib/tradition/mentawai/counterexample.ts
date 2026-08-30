/**
 * A check, shown doing its job.
 *
 * The check is `checkFloorSpans` and what breaks it is `bearerSpacing` — how
 * far apart the bearers under the floor stand.
 *
 * Standing them further apart is exactly what this floor is for. The front
 * veranda is danced on; turuk wants a long clear floor with nothing in the way
 * and plenty of spring in it, and fewer bearers gives more of both. Nothing
 * else objects: the posts still carry the house, every household still has the
 * same share, the front is still open, the roof still covers the whole length.
 * What runs out is the plank. Past a point a split board will not cross from
 * one bearer to the next, and a floor that springs has become a floor that
 * gives way — which is the same event to everybody standing on it and a very
 * different one afterwards.
 *
 * The two numbers are independent: the spacing is a decision made while
 * framing, and the span belongs to the timber. That is what lets the check
 * fail.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkFloorSpans } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { MentawaiKinds, Rules } from './types'

/** The two lengths the check is comparing. */
export interface Span {
  readonly clear: number
  readonly plank: number
}

export type Counterexample = CoreCounterexample<MentawaiKinds, Span>

const DIM: DimKey = 'bearerSpacing'

export function spanCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<MentawaiKinds, Span>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return { result: checkFloorSpans(layout), witness: { clear: layout.span.clear, plank: layout.span.plank } }
    },
    // Upward: more bearers is never what breaks a floor.
    factors: Array.from({ length: 14 }, (_, i) => 1.05 + i * 0.06),
  })
  if (!found) throw new Error('checkFloorSpans could not be broken by bearerSpacing alone')
  return found
}
