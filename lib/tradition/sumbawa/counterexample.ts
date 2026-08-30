/**
 * A check, shown doing its job.
 *
 * The check is `checkSpansFollow` and what breaks it is `bayLength` — the
 * distance between the posts.
 *
 * A sultan wanting a larger palace has exactly one move available. The number
 * of posts is not his: ninety-nine is the count of the names of God, and a
 * hundred and eight would be a different building making a different claim. So
 * the grid has to be stretched, and stretching it is the whole of what
 * "larger" can mean here.
 *
 * Nothing about the building objects. There are still ninety-nine posts, every
 * one still under a beam, the two halls are still under one roof, the frame is
 * still square and pegged. What runs out is the beam: past a point a single
 * piece of timber will not cross from one post line to the next, and the only
 * fix is a post in the middle of the span — which is the one thing the rule
 * forbids.
 *
 * It is the first limit in this project produced by a count somebody else
 * fixed. The Baduy pole and the woloan lorry are limits of transport; the
 * Korowai trunk and the Rimba carry are limits of what the world provides; the
 * Betawi setback is a neighbour's. This one is a text's.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkSpansFollow } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, SumbawaKinds } from './types'

/** The two lengths the check is comparing. */
export interface Span {
  readonly bay: number
  readonly limit: number
}

export type Counterexample = CoreCounterexample<SumbawaKinds, Span>

const DIM: DimKey = 'bayLength'

export function spanCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<SumbawaKinds, Span>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return { result: checkSpansFollow(layout), witness: { bay: layout.spacing.bay, limit: layout.spacing.limit } }
    },
    // Upward: a tighter grid is a smaller palace, which is allowed.
    factors: Array.from({ length: 14 }, (_, i) => 1.05 + i * 0.05),
  })
  if (!found) throw new Error('checkSpansFollow could not be broken by bayLength alone')
  return found
}
