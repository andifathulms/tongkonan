/**
 * A check, shown doing its job.
 *
 * The mechanism and the reasoning are in `lib/core/counterexample.ts`. What
 * is chosen here is which check to run against a house built to break it.
 *
 * The first attempt used the eave oversail, and it could not be made to fail.
 * `eaveHalfWidth` is *defined* as half the body plus the oversail, so
 * `checkEaveOversail` restates its own inputs and no single dimension can
 * break it. A check that cannot fail is not evidence, and picking one that
 * happened to look good would have hidden that.
 *
 * The ridge profile is the honest choice instead, because it enforces
 * something a source actually says rather than something the arithmetic
 * guarantees: the front prow stands higher than the rear (canon,
 * kis-jovak-1988). Raise the rear prow past the front and the house stops
 * being able to say which end is its face.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkRidgeProfile } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, Rules, TorajaKinds } from './types'

/** The two numbers the check is comparing. */
export interface Prows {
  readonly front: number
  readonly rear: number
}

export type Counterexample = CoreCounterexample<TorajaKinds, Prows>

const DIM: DimKey = 'rearProwRise'

export function ridgeCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<TorajaKinds, Prows>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { layout } = buildHouse(rules)
      return { result: checkRidgeProfile(layout), witness: prowsOf(layout) }
    },
  })
  if (!found) {
    // Reaching here would mean the check restates its own inputs and is not
    // evidence. It is louder than a silent fallback on purpose.
    throw new Error('checkRidgeProfile could not be broken by rearProwRise alone')
  }
  return found
}

function prowsOf(layout: Layout): Prows {
  return { front: layout.frontProwY, rear: layout.rearProwY }
}
