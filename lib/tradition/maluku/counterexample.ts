/**
 * A check, shown doing its job.
 *
 * The check is `checkOpenOnAllSides` and what breaks it is `screenHeight` —
 * the low board between the posts that a village may or may not fit.
 *
 * Raise it and nothing whatever fails structurally. The posts still stand, the
 * floor is still one plane, the seats are still equal, the roof still laps and
 * still sheds. What stops being true is that a person seated in their place
 * can be seen from outside — so a building whose entire form is an argument
 * about visible decisions goes on making that argument to nobody.
 *
 * Fifteen buildings and fifteen rules that cannot be carried out. This one
 * joins the saoraja's and the Banjar house's in the category where nothing
 * physical gives way, and it is the sharpest of the three: the screen that
 * defeats it is a handrail, which is the first thing anybody would add to a
 * floor two metres in the air with children on it.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkOpenOnAllSides } from './invariants'
import { DEFAULT_RULES, DIMS, PACK } from './rules'
import type { DimKey } from './rules'
import type { MalukuKinds, Rules } from './types'

/** The two heights the check is comparing. */
export interface SightLine {
  readonly screen: number
  readonly eye: number
}

export type Counterexample = CoreCounterexample<MalukuKinds, SightLine>

const DIM: DimKey = 'screenHeight'

export function screenCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<MalukuKinds, SightLine>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse({ ...rules, sekat: true })
      return {
        result: checkOpenOnAllSides(house, layout),
        witness: { screen: DIMS.screenHeight.value, eye: DIMS.seatedEye.value },
      }
    },
    // Upward: a lower screen is never the problem.
    factors: Array.from({ length: 14 }, (_, i) => 1.2 + i * 0.25),
  })
  if (!found) throw new Error('checkOpenOnAllSides could not be broken by screenHeight alone')
  return found
}
