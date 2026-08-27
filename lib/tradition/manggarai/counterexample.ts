/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check chosen here is
 * `checkFiveLevels`, and what breaks it is the storey height.
 *
 * Five floors is canon and the cone is what they sit in, so the two are not
 * independent: push the storeys further apart and the topmost one climbs into
 * a part of the cone too narrow to be a floor at all. The house does not fall
 * down and nothing is set to zero — it simply runs out of building before it
 * runs out of floors, which is the same shape of failure the joglo's tumpang
 * sari has and, on reflection, the shape most of these buildings are exposed
 * to. A rule that cannot be carried out, rather than a rule disobeyed.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkFiveLevels } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { ManggaraiKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Reach {
  readonly topRadius: number
  readonly apex: number
}

export type Counterexample = CoreCounterexample<ManggaraiKinds, Reach>

const DIM: DimKey = 'storeyRise'

export function levelsCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<ManggaraiKinds, Reach>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      const top = layout.levels[layout.levels.length - 1]
      return {
        result: checkFiveLevels(layout),
        witness: { topRadius: top?.radius ?? 0, apex: layout.apexY },
      }
    },
  })
  if (!found) throw new Error('checkFiveLevels could not be broken by storeyRise alone')
  return found
}
