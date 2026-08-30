/**
 * A check, shown doing its job.
 *
 * The check is `checkLoftInTheSmoke` and what breaks it is `loftBase` — how
 * high the loft floor sits above the fire.
 *
 * Raising it is the first thing anybody would do. A fire on an earth floor
 * under a bamboo platform hung with dry maize is exactly as dangerous as it
 * sounds, and lifting the seed away from the flame gives more headroom, more
 * room to work, and less to worry about. Nothing in the building objects: the
 * dome is unchanged, the door still makes you stoop, there is still no window,
 * the loft is still carried by the frame that carried it before.
 *
 * What fails is the seed. Past a point the smoke arriving at the top of the
 * store is too cool and too thin to cure anything, and a store out of its
 * reach is a store of maize that rots before the rains. It is the fourth
 * counterexample in this project that leaves a sound building standing — after
 * the bale, the tanean and the bhaga — and the first where what is lost is not
 * a claim about people but a crop.
 *
 * Tested at the largest store the rules allow, because that is the household
 * this happens to: the one keeping four years' seed against a bad run.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkLoftInTheSmoke } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, MAX_SIMPANAN, PACK } from './rules'
import type { DimKey } from './rules'
import type { AtoniKinds, Rules } from './types'

/** The two heights the check is comparing. */
export interface Smoke {
  readonly seedTop: number
  readonly smokeTop: number
}

export type Counterexample = CoreCounterexample<AtoniKinds, Smoke>

const DIM: DimKey = 'loftBase'

export function smokeCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<AtoniKinds, Smoke>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout({ ...rules, simpanan: MAX_SIMPANAN })
      return {
        result: checkLoftInTheSmoke(layout),
        witness: {
          seedTop: layout.loft.y + layout.loft.depth,
          smokeTop: layout.smoke.to,
        },
      }
    },
    // Upward: a loft nearer the fire is a different problem, and the check
    // has a bound on that side too.
    factors: Array.from({ length: 16 }, (_, i) => 1.05 + i * 0.08),
  })
  if (!found) throw new Error('checkLoftInTheSmoke could not be broken by loftBase alone')
  return found
}
