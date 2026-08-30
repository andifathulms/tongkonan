/**
 * A check, shown doing its job.
 *
 * The check is `checkOneStepNotAStair` and what breaks it is `selasoDrop` —
 * how far the aisle floors have fallen.
 *
 * Dropping them further is the obvious way to make the building say what it
 * means more clearly. The distinction between passing through and being
 * present is the whole point of the plan, and a deeper fall states it from
 * further away: you can see at a glance which floor is the room. Nothing about
 * the building objects — the two aisles are still twins, they still run clear
 * end to end, the roof still covers all three floors, the frame is still
 * pegged.
 *
 * What runs out is the step. People cross that edge many times in one meeting:
 * carrying food in, sitting down, getting up to leave, going out to talk. Past
 * a certain fall it is no longer something a person crosses without thinking —
 * and a hall whose two levels have to be negotiated is a hall where the aisles
 * stop being the way through.
 *
 * The two numbers belong to different parties, which is what lets the check
 * fail: the fall is what the custom wants legible, and how big a step a body
 * takes without noticing is not the custom's to decide.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkOneStepNotAStair } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { RiauKinds, Rules } from './types'

/** The two heights the check is comparing. */
export interface Step {
  readonly fall: number
  readonly step: number
}

export type Counterexample = CoreCounterexample<RiauKinds, Step>

const DIM: DimKey = 'selasoDrop'

export function stepCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<RiauKinds, Step>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return { result: checkOneStepNotAStair(layout), witness: { fall: layout.drop.fall, step: layout.drop.step } }
    },
    // Upward: a shallower fall says less, and saying less is not a failure of
    // this kind — it is a different building with a different name.
    factors: Array.from({ length: 14 }, (_, i) => 1.05 + i * 0.06),
  })
  if (!found) throw new Error('checkOneStepNotAStair could not be broken by selasoDrop alone')
  return found
}
