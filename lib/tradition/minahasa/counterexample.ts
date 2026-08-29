/**
 * A check, shown doing its job.
 *
 * The check is `checkCutToTheRoad` and what breaks it is `halfWidth` — how
 * wide the house is.
 *
 * Widen it and the building gets better by every ordinary measure: more room,
 * the same frame, the same joints, the same roof. What stops being true is
 * that the bearers fit on a lorry — and a woloan house that cannot be carried
 * away is a woloan house that has stopped being one. It is the only building
 * in this project limited by the size of a *journey*: the tongkonan is bounded
 * by rank, the saoraja by what a household may claim, the honai by a night's
 * warmth, and this one by the width of a road.
 *
 * Seventeen buildings and seventeen rules that cannot be carried out. This one
 * joins the group where nothing physical gives way — and it is the only one
 * where what fails is the building's ability to *leave*.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkCutToTheRoad, partBounds } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { MinahasaKinds, Rules } from './types'

/** The two lengths the check is comparing. */
export interface Load {
  readonly longest: number
  readonly allowed: number
}

export type Counterexample = CoreCounterexample<MinahasaKinds, Load>

const DIM: DimKey = 'halfWidth'

export function haulCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<MinahasaKinds, Load>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse({ ...rules, pindah: true })
      let longest = 0
      for (const part of house.parts) {
        if (part.stage === 'atap' || part.stage === 'batu') continue
        const b = partBounds(part)
        longest = Math.max(
          longest,
          b.max[0] - b.min[0],
          b.max[1] - b.min[1],
          b.max[2] - b.min[2],
        )
      }
      return {
        result: checkCutToTheRoad(house, layout),
        witness: { longest, allowed: layout.haulLength },
      }
    },
    // Upward: a narrower house is never the problem.
    factors: Array.from({ length: 12 }, (_, i) => 1.1 + i * 0.15),
  })
  if (!found) throw new Error('checkCutToTheRoad could not be broken by halfWidth alone')
  return found
}
