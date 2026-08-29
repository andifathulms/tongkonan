/**
 * A check, shown doing its job.
 *
 * The check is `checkPostsFollowTheGround` and what breaks it is `slopeSteep` —
 * how steep the steep ground is.
 *
 * Steepen it and everything the builders do stays correct: the stones still
 * sit where they lie, the floor is still one level plane, no iron goes into
 * the frame, nothing is sawn. What happens is that the downhill post grows
 * longer than a single pole, and a post is not spliced. At that point the only
 * way to put a house on that piece of hillside is to cut the hillside — which
 * is the prohibition the whole building exists to keep.
 *
 * Nineteen buildings and nineteen rules that cannot be carried out, and this
 * is the first where **the rule defeats itself**: the prohibition is what
 * makes the slope matter, and a steep enough slope makes the prohibition
 * impossible to keep. The others end with something that cannot stand, or is
 * dead, or has stopped being what it was for, or is merely called something
 * else. This one ends with a piece of ground you may not build on.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkPostsFollowTheGround, partBounds } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, SundaKinds } from './types'

/** The two lengths the check is comparing. */
export interface Pole {
  readonly longest: number
  readonly available: number
}

export type Counterexample = CoreCounterexample<SundaKinds, Pole>

const DIM: DimKey = 'slopeSteep'

export function slopeCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<SundaKinds, Pole>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse({ ...rules, lereng: 'curam' })
      const lengths = house.parts
        .filter((p) => p.stage === 'tihang')
        .map((p) => {
          const b = partBounds(p)
          return b.max[1] - b.min[1]
        })
      return {
        result: checkPostsFollowTheGround(house, layout),
        witness: {
          longest: lengths.length > 0 ? Math.max(...lengths) : 0,
          available: layout.poleLength,
        },
      }
    },
    // Upward: gentler ground is never the problem.
    factors: Array.from({ length: 14 }, (_, i) => 1.15 + i * 0.2),
  })
  if (!found) throw new Error('checkPostsFollowTheGround could not be broken by slopeSteep alone')
  return found
}
