/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkRankFitsTheGable` and what breaks it is `timpaRise` — the height of
 * one board.
 *
 * Grow it and nothing about the house changes: the frame, the roof, the three
 * worlds and every clearance are exactly as they were, because the boards hold
 * nothing and nothing holds them. What gives way is that the stack runs off
 * the top of the gable it is climbing — the household's claim, made taller so
 * it can be read from further away, ends up with no triangle left to sit on.
 *
 * Ten houses, ten rules that cannot be carried out. What is particular here is
 * that the failure is *purely rhetorical*: the building is untouched and would
 * stand for a century, and the only thing that has broken is a statement about
 * who lives in it.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkRankFitsTheGable } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BugisKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Reach {
  readonly topBoard: number
  readonly ridge: number
}

export type Counterexample = CoreCounterexample<BugisKinds, Reach>

const DIM: DimKey = 'timpaRise'

export function rankCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<BugisKinds, Reach>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      const top = layout.timpa[layout.timpa.length - 1]
      return {
        result: checkRankFitsTheGable(layout),
        witness: { topBoard: top?.y ?? 0, ridge: layout.ridgeY },
      }
    },
    factors: Array.from({ length: 40 }, (_, i) => 1.1 + i * 0.2),
  })
  if (!found) throw new Error('checkRankFitsTheGable could not be broken by timpaRise alone')
  return found
}
