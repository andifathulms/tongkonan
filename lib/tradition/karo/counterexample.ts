/**
 * A check, shown doing its job.
 *
 * The check is `checkHearthClearance` and what breaks it is `hearthRadius` —
 * how big the fire is.
 *
 * Grow it and nothing about the house changes: the room is the same room, the
 * eight places are the same places, the order still runs from the root end,
 * the roof still laps. What happens is that an open fire reaches a timber post
 * in a building with no partition anywhere to stop it.
 *
 * Eighteen buildings, eighteen rules that cannot be carried out. This one is
 * unusual in the set because the failure is a *consequence of the building's
 * own argument*: it is dangerous here precisely because there are no walls, and
 * the same fire in a rumah betang would be inside a bilik and nobody's problem
 * but that household's. Take the partitions away and distance is the only
 * safety left.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkHearthClearance, hearthGaps } from './invariants'
import { DEFAULT_RULES, DIMS, PACK } from './rules'
import type { DimKey } from './rules'
import type { KaroKinds, Rules } from './types'

/** The two distances the check is comparing. */
export interface Fire {
  readonly gap: number
  readonly needed: number
}

export type Counterexample = CoreCounterexample<KaroKinds, Fire>

const DIM: DimKey = 'hearthRadius'

export function hearthCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<KaroKinds, Fire>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse(rules)
      // The same reading the check takes, from the same function: two ways of
      // measuring one gap is two things to get wrong.
      const tightest = hearthGaps(house, layout).reduce((min, g) => Math.min(min, g.gap), Infinity)
      return {
        result: checkHearthClearance(house, layout),
        witness: { gap: tightest, needed: DIMS.hearthClearance.value },
      }
    },
    // Upward: a smaller fire is never the problem.
    factors: Array.from({ length: 14 }, (_, i) => 1.2 + i * 0.25),
  })
  if (!found) throw new Error('checkHearthClearance could not be broken by hearthRadius alone')
  return found
}
