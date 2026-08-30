/**
 * A check, shown doing its job.
 *
 * The check is `checkTooSmallToEnter` and what breaks it is `doorHeight` — the
 * opening in the front of the bhaga.
 *
 * Making the opening bigger is the most reasonable thing anybody could do to
 * this object. Whatever is kept inside a bhaga has to be put in and taken out
 * again, and a taller door makes that easier without changing the little
 * house at all: the pair still stands complete, the post still carries its
 * cap, the square is still ranged at one spacing, nothing is any less well
 * built. What stops being true is what the thing *is*. Past the height of a
 * stooping body, a model of a house that nobody can enter has become a very
 * small house that somebody can — and the difference between those two is the
 * entire reason a bhaga is built.
 *
 * The third counterexample in this project that ends with a perfectly sound
 * building, after the Balinese bale's and the Madurese tanean's — and the
 * first where what breaks is not a claim about the people but about the
 * category the object belongs to.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkTooSmallToEnter } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { NgadaKinds, Rules } from './types'

/** The two heights the check is comparing. */
export interface Opening {
  readonly opening: number
  readonly body: number
}

export type Counterexample = CoreCounterexample<NgadaKinds, Opening>

const DIM: DimKey = 'doorHeight'

export function openingCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<NgadaKinds, Opening>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return {
        result: checkTooSmallToEnter(layout),
        witness: { opening: layout.opening.height, body: layout.body.crouching },
      }
    },
    // Upward: a smaller opening is never the problem — it is the point.
    factors: Array.from({ length: 16 }, (_, i) => 1.15 + i * 0.15),
  })
  if (!found) throw new Error('checkTooSmallToEnter could not be broken by doorHeight alone')
  return found
}
