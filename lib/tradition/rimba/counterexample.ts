/**
 * A check, shown doing its job.
 *
 * The check is `checkEveryMemberIsCarried` and what breaks it is `sleepGap` —
 * the space between people lying side by side.
 *
 * Giving everybody a little more room to sleep is not an indulgence; it is the
 * first thing a family would change about a shelter six people share. And
 * nothing about the building objects: it still stands, the roof still falls
 * one way, the floor still holds everybody, nothing is pegged or buried, it
 * still goes up in an afternoon. What breaks is that the edge pole across the
 * front is now longer than anybody can cut nearby and carry to the spot — so
 * the shelter that would be more comfortable to sleep in is a shelter that
 * cannot be built where it is needed.
 *
 * The third counterexample in this project bounded by what people can move:
 * the woloan house runs into the length of a lorry, the Baduy imah into a pole
 * that may not be spliced, and this one into what a person can pick up. It is
 * the smallest of the three limits and it arrives soonest.
 *
 * Tested at the largest household the rules allow, because that is the family
 * this happens to.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkEveryMemberIsCarried } from './invariants'
import { DEFAULT_RULES, MAX_ORANG, PACK } from './rules'
import type { DimKey } from './rules'
import type { RimbaKinds, Rules } from './types'

/** The two lengths the check is comparing. */
export interface Carry {
  readonly longest: number
  readonly carry: number
}

export type Counterexample = CoreCounterexample<RimbaKinds, Carry>

const DIM: DimKey = 'sleepGap'

export function carryCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<RimbaKinds, Carry>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse({ ...rules, orang: MAX_ORANG })
      return {
        result: checkEveryMemberIsCarried(house, layout),
        witness: { longest: layout.longest, carry: layout.carry },
      }
    },
    // Upward: sleeping closer together is never what breaks a building.
    factors: Array.from({ length: 16 }, (_, i) => 1.1 + i * 0.12),
  })
  if (!found) throw new Error('checkEveryMemberIsCarried could not be broken by sleepGap alone')
  return found
}
