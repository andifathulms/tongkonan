/**
 * A check, shown doing its job.
 *
 * The check is `checkAboveTheTide` and what breaks it is `floorHeight` — how
 * high the builders cut the posts.
 *
 * Cut them short and the building is still perfectly well made: eight posts,
 * eight walls, three floors each smaller than the one below, a pole between
 * each pair of them, and a cone over the top of it. What happens is that the
 * sea comes up through the floor twice a day.
 *
 * Sixteen buildings and sixteen rules that cannot be carried out, and this is
 * the first one broken by something the builders do not control. A rank can be
 * refused, a screen can be left low, a ridge can be built high. The tide comes
 * in whatever anybody decides, which is what it means for a rule to come from
 * the sea rather than from a society — the widening the Nias pack started,
 * taken as far as it goes.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkAboveTheTide } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, TobatiKinds } from './types'

/** The two heights the check is comparing. */
export interface Water {
  readonly floor: number
  readonly highWater: number
}

export type Counterexample = CoreCounterexample<TobatiKinds, Water>

const DIM: DimKey = 'floorHeight'

export function tideCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<TobatiKinds, Water>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse(rules)
      return {
        result: checkAboveTheTide(house, layout),
        witness: {
          floor: layout.levels[0]?.y ?? 0,
          highWater: layout.waterDepth + layout.tide,
        },
      }
    },
    // Downward: more clearance is never the problem.
    factors: Array.from({ length: 16 }, (_, i) => 0.9 - i * 0.06),
  })
  if (!found) throw new Error('checkAboveTheTide could not be broken by freeboard alone')
  return found
}
