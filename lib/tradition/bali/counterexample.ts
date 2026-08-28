/**
 * A check, shown doing its job — and this is the one worth watching.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check chosen is
 * `checkPengurip`, and what breaks it is the size of the pengurip itself.
 *
 * The increment is one useran. Grow it and nothing bends, nothing collapses
 * and no member goes to zero: the addition simply climbs until it is a whole
 * unit of something, at which point the measure it was keeping inexact lands
 * squarely back on its module and the house is `mati` again — one unit larger
 * than it started, and dead in exactly the way the rule exists to prevent.
 *
 * Every other counterexample in this project ends with a building that cannot
 * be constructed. This one ends with a building that constructs perfectly well
 * and is wrong for a reason no amount of looking at it would reveal, which is
 * the strongest argument the project has for why the rules are in the model
 * rather than in the caption.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkPengurip } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BaliKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Exactness {
  readonly pengurip: number
  readonly exact: number
}

export type Counterexample = CoreCounterexample<BaliKinds, Exactness>

const DIM: DimKey = 'useranRatio'

export function penguripCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<BaliKinds, Exactness>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return {
        result: checkPengurip(layout),
        witness: { pengurip: layout.sikut.pengurip, exact: layout.sikut.pengurip / layout.sikut.nyari },
      }
    },
    /*
     * Further than the default range, and the reason is the finding.
     *
     * A pengurip only stops being an increment when it grows to a whole unit
     * of something the house is set out in — the smallest of those is the
     * musti, six useran away. Nothing between here and there breaks anything:
     * the house simply gets very slightly larger and stays alive. The search
     * has to be allowed to run that far or it would report that the check
     * cannot be broken, which would be false.
     */
    factors: Array.from({ length: 70 }, (_, i) => 1.1 + i * 0.1),
  })
  if (!found) throw new Error('checkPengurip could not be broken by useranRatio alone')
  return found
}
