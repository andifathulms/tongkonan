/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkHeadroom` and what breaks it is `stepRise` — the height of one step.
 *
 * Grow it and the sequence stays perfectly ordered: five levels, each above
 * the last, in the right order, named correctly. `checkStepsRise` goes on
 * passing. What runs out is the air over the top of the sequence, because the
 * roof does not step with the floor — so a household that insists on
 * distinguishing its guests more sharply eventually cannot stand up in its own
 * gegajah.
 *
 * That is the pattern this project has now found nine times: a rule that
 * cannot be carried out rather than one that is disobeyed. What is particular
 * here is *which* rule gives way. The social claim is satisfiable to any
 * degree; it is the building that runs out first, and the reader can watch the
 * point where a household's insistence on rank stops fitting under its roof.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkHeadroom } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { PalembangKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Clearance {
  readonly rise: number
  readonly headroom: number
}

export type Counterexample = CoreCounterexample<PalembangKinds, Clearance>

const DIM: DimKey = 'stepRise'

export function headroomCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<PalembangKinds, Clearance>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      const top = layout.levels[layout.levels.length - 1]
      return {
        result: checkHeadroom(layout),
        witness: {
          rise: layout.stepRise,
          headroom: top ? layout.eaveY - top.y : 0,
        },
      }
    },
  })
  if (!found) throw new Error('checkHeadroom could not be broken by stepRise alone')
  return found
}
