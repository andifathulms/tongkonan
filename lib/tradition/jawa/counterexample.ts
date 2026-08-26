/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. What is chosen here is
 * which check to break, and the choice follows the same rule as the other two:
 * it has to enforce something a source says rather than something the
 * arithmetic already guarantees.
 *
 * `checkTumpangSari` is that check. The tier count is the rank signal — odd,
 * and read by counting from underneath — so a stack that cannot make the
 * tiers it claims is a house that has lost the ability to state its standing.
 *
 * The way it breaks is the interesting part, and it is not the way you would
 * guess. Nothing here is set to zero and nothing collapses. The stack is asked
 * to close further, each tier steps in more than before, and at some point the
 * opening runs out before the count does: the stack shuts before it has made
 * the last of its tiers, and the generator stops rather than building a tier
 * with no room to stand in. The check reports the shortfall. A rule that
 * cannot be carried out is a different failure from a rule being disobeyed,
 * and it is the one this building is actually exposed to.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkTumpangSari } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { JawaKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Tiers {
  readonly built: number
  readonly declared: number
}

export type Counterexample = CoreCounterexample<JawaKinds, Tiers>

const DIM: DimKey = 'tumpangClose'

export function tumpangCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<JawaKinds, Tiers>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const { house, layout } = buildHouse(rules)
      const built = house.parts.filter((p) => p.id.endsWith('-0') && p.id.startsWith('tumpang-')).length
      return {
        result: checkTumpangSari(house, layout),
        witness: { built, declared: layout.tumpangCount },
      }
    },
  })
  if (!found) throw new Error('checkTumpangSari could not be broken by tumpangClose alone')
  return found
}
