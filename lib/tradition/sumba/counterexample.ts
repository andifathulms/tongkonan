/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkTowerDominates` and what breaks it is `menaraRise` — the ratio that
 * sets how far the peak stands above the house.
 *
 * Shrink it and nothing collapses, nothing is zeroed, the loft is still in the
 * tower and the thatch still covers it. What stops being true is that the
 * building is a container with a house at its foot: below a certain height it
 * is a house with a tall roof, which is a different object with a different
 * reason for existing. Nobody could look at the model and say which side of
 * the line it was on without being told what the line was for.
 *
 * That is the eighth house's version of a pattern this project has now found
 * eight times over — a rule that cannot be carried out, rather than one that
 * is disobeyed — with the difference that here the thing that fails is not
 * the geometry but the *claim the geometry makes*.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkTowerDominates } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, SumbaKinds } from './types'

/** The two numbers the check is comparing. */
export interface Reach {
  readonly house: number
  readonly tower: number
}

export type Counterexample = CoreCounterexample<SumbaKinds, Reach>

const DIM: DimKey = 'menaraRise'

export function towerCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<SumbaKinds, Reach>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return {
        result: checkTowerDominates(layout),
        witness: { house: layout.shoulderY, tower: layout.menara.peakY - layout.menara.footY },
      }
    },
    factors: Array.from({ length: 18 }, (_, i) => 0.9 - i * 0.05),
  })
  if (!found) throw new Error('checkTowerDominates could not be broken by menaraRise alone')
  return found
}
