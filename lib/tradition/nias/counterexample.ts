/**
 * A check, shown doing its job — and a note on the one that cannot be.
 *
 * The mechanism is in `lib/core/counterexample.ts`, whose own documentation
 * says that a search returning null is a discovery rather than an error: a
 * check whose inputs define its own conclusion cannot fail, and a check that
 * cannot fail is not evidence. This pack ran into exactly that, and the honest
 * thing is to write down where.
 *
 * **`checkBracing` cannot be broken by pushing any single dimension.** The
 * braces are emitted from `layout.cells` and the check walks `layout.cells`,
 * so widening a bay lengthens the diagonal that crosses it and the two move
 * together for ever. That is deliberate — it is the same "one description"
 * discipline that fixed five separate faults elsewhere in this project — but
 * it means the strongest structural claim here is one no *dimension* can
 * falsify. It can only be falsified by a change in the code: bracing one plane
 * and not the other, or leaving a bay out. So that is tested directly, by
 * building a house and taking its cross-braces away, in `test/nias.test.ts`.
 * A counterexample search would have reported "unbreakable" and a reader could
 * reasonably have read that as "unfalsifiable".
 *
 * What is shown instead is `checkRoofDominates` against `ridgeRise`, which is
 * a genuine comparison of two independently declared numbers: the roof is the
 * greater part of this building, and shrink it far enough and what is left is
 * a house with a hat rather than an omo.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkRoofDominates } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { NiasKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Bulk {
  readonly body: number
  readonly roof: number
}

export type Counterexample = CoreCounterexample<NiasKinds, Bulk>

const DIM: DimKey = 'ridgeRise'

export function roofCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<NiasKinds, Bulk>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return {
        result: checkRoofDominates(layout),
        witness: { body: layout.eaveY - layout.floorY, roof: layout.ridgeY - layout.eaveY },
      }
    },
    // Downward: the roof is already the larger part, so it fails by shrinking.
    factors: Array.from({ length: 18 }, (_, i) => 0.9 - i * 0.05),
  })
  if (!found) throw new Error('checkRoofDominates could not be broken by ridgeRise alone')
  return found
}
