/**
 * A check, shown doing its job — and it is the smallest one in the project.
 *
 * The check is `checkOddSteps` and what breaks it is `treadRise`, the height
 * of one step.
 *
 * Nudge it and the house does not move. The floor is at the same height, the
 * ladder reaches it, every tread is comfortable, the frame is untouched. What
 * changes is that the treads now come out even, and the tradition says they
 * are odd. It is the only counterexample here that turns on a *count* rather
 * than on a length, and it is the only one whose broken house is different
 * from the sound one by one piece of wood.
 *
 * That it works at all is because the count is derived rather than declared: a
 * pack that had written down "nine treads" would have had a check that could
 * not fail, which is the fault this project has caught four times already.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkOddSteps } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { AcehKinds, Rules } from './types'

/** The count, and the rise that produced it. */
export interface Flight {
  readonly steps: number
  readonly rise: number
}

export type Counterexample = CoreCounterexample<AcehKinds, Flight>

const DIM: DimKey = 'treadRise'

export function stepsCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<AcehKinds, Flight>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse(rules)
      return {
        result: checkOddSteps(house, layout),
        witness: { steps: layout.ladder.steps, rise: layout.ladder.rise },
      }
    },
    /*
     * Small steps, either way: parity does not care which direction a number
     * moves, only that it crosses. A percent at a time is enough — which is
     * itself the finding, because every other counterexample in this project
     * needs to move a dimension by a fifth or more.
     */
    factors: Array.from({ length: 24 }, (_, i) => 1 + (i % 2 === 0 ? 1 : -1) * (0.03 + i * 0.012)),
  })
  if (!found) throw new Error('checkOddSteps could not be broken by treadRise alone')
  return found
}
