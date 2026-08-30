/**
 * A check, shown doing its job.
 *
 * The check is `checkInsideThePlot` and what breaks it is `roomWidth` — how
 * wide each room is made.
 *
 * Wider rooms are the plainest improvement anybody could ask for, and nothing
 * about the building objects. The plinth still stands, the frame still carries,
 * the roof still folds, the terrace still faces the road, the joints are still
 * pegged and nailed. What the house runs into is a line: past a point its eave
 * comes within the margin that has to be left to the boundary, and beyond that
 * boundary is a neighbour.
 *
 * It is the first limit in this project that belongs to somebody else. A
 * tongkonan is stopped by a rank, a khaim by the tree carrying it, a sudung by
 * what a person can carry, a malige by the reach of an arm, an ume kbubu by
 * what smoke will do. This one is stopped by property — and what crosses the
 * line first is not the wall but the roof, which is exactly how the argument
 * happens in life.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkInsideThePlot } from './invariants'
import { DEFAULT_RULES, DIMS, MAX_KAMAR, PACK } from './rules'
import type { DimKey } from './rules'
import type { BetawiKinds, Rules } from './types'

/** The two widths the check is comparing. */
export interface Plot {
  readonly reach: number
  readonly limit: number
}

export type Counterexample = CoreCounterexample<BetawiKinds, Plot>

const DIM: DimKey = 'roomWidth'

export function plotCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<BetawiKinds, Plot>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      // Tested at the most rooms the rules allow, because that is the
      // household this happens to: the one with the least room left over.
      const { house, layout } = buildHouse({ ...rules, kamar: MAX_KAMAR })
      return {
        result: checkInsideThePlot(house, layout),
        witness: {
          reach: layout.house.halfX + DIMS.eaveOversail.value,
          limit: layout.plot.halfX - DIMS.sideMargin.value,
        },
      }
    },
    // Upward: a narrower room is never what puts a house over a boundary.
    factors: Array.from({ length: 14 }, (_, i) => 1.03 + i * 0.04),
  })
  if (!found) throw new Error('checkInsideThePlot could not be broken by roomWidth alone')
  return found
}
