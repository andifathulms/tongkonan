/**
 * A check, shown doing its job.
 *
 * The check is `checkBalance` and what breaks it is `kajangRise` — how tall
 * the awning is.
 *
 * Raise it and the house gets better in every way a house is normally
 * measured: more room under it, room to sit up, room to stand. Not one plank
 * of the hull changes and nothing about the boat's shape is touched. What
 * happens is that the weight of the dwelling moves up, and a narrow hull with
 * weight high in it is a hull that rolls.
 *
 * Twenty-one buildings and twenty-one rules that cannot be carried out. This
 * one is the only one where the improvement everybody would want — headroom —
 * is exactly the thing that sinks it. And the limit it is tested against is a
 * declared proxy rather than a stability calculation: this project has no
 * material properties, and the pack says so rather than pretending to physics.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { centreOf, checkBalance } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BajauKinds, Rules } from './types'

/** The two heights the check is comparing. */
export interface Trim {
  readonly centre: number
  readonly limit: number
}

export type Counterexample = CoreCounterexample<BajauKinds, Trim>

const DIM: DimKey = 'kajangRise'

export function balanceCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<BajauKinds, Trim>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse({ ...rules, kajang: true })
      const centre = centreOf(house.parts)
      return {
        result: checkBalance(house, layout),
        witness: { centre: centre.y - layout.draught, limit: layout.centreLimit },
      }
    },
    // Upward: a lower awning is never the problem.
    factors: Array.from({ length: 16 }, (_, i) => 1.2 + i * 0.35),
  })
  if (!found) throw new Error('checkBalance could not be broken by kajangRise alone')
  return found
}
