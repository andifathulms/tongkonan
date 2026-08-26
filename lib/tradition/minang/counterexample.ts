/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. What is chosen here is
 * which check to break, and the choice is the same kind as the other house's:
 * it has to enforce something a source says rather than something the
 * arithmetic already guarantees.
 *
 * `checkAnjuangFloor` is that check. Under the Koto Piliang laras the floor
 * at both ends stands above the middle — canon, Navis 1984 — and it is the
 * one claim in this pack that a reader could disprove by standing in the room
 * with a spirit level. So the counterexample flattens it: shrink the step
 * until the house can no longer say which laras built it.
 *
 * The threshold is searched, not picked, and where it lands is worth reading.
 * The step does not have to reach zero to stop being a step: once it is
 * shallower than the floor boards that form it, there is nothing to stand on,
 * and the generator refuses to build an anjuang at all. That refusal is what
 * the check reports.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkAnjuangFloor } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { MinangKinds, Rules } from './types'

/** The two floor heights the check is comparing. */
export interface Floors {
  readonly main: number
  readonly anjuang: number
}

export type Counterexample = CoreCounterexample<MinangKinds, Floors>

const DIM: DimKey = 'anjuangRise'

/** Descending, because this check breaks by the step vanishing, not growing. */
const FACTORS = Array.from({ length: 19 }, (_, i) => Number((0.95 - i * 0.05).toFixed(2)))

export function anjuangCounterexample(
  rules: Rules = { ...DEFAULT_RULES, laras: 'koto-piliang' },
): Counterexample {
  const found = searchCounterexample<MinangKinds, Floors>({
    pack: PACK,
    dim: DIM,
    factors: FACTORS,
    probe: () => {
      const { house, layout } = buildHouse(rules)
      return {
        result: checkAnjuangFloor(house, layout),
        witness: { main: layout.deckY, anjuang: layout.anjuangY },
      }
    },
  })
  if (!found) {
    throw new Error('checkAnjuangFloor could not be broken by anjuangRise alone')
  }
  return found
}
