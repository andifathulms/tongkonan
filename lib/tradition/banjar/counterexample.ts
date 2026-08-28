/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkCoreIsTallest` and what breaks it is `tinggiRise` — the height of the
 * ridge the house is named for.
 *
 * Lower it and nothing fails: the chain still meets end to end, every segment
 * still has its own roof, the shingles still lap, the floors still step. What
 * stops being true is that the middle rises above the rest — and at that point
 * a building called *bubungan tinggi* has no high ridge, which makes the name
 * a description of something that is not there.
 *
 * Fourteen buildings, fourteen rules that cannot be carried out. This is the
 * only one where what fails is the *name*: every other counterexample ends with
 * a building that cannot be constructed, or is dead, or has stopped being what
 * it was for. This one ends with a building that is fine and is called
 * something else.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkCoreIsTallest } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BanjarKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Ridges {
  readonly core: number
  readonly neighbour: number
}

export type Counterexample = CoreCounterexample<BanjarKinds, Ridges>

const DIM: DimKey = 'tinggiRise'

export function ridgeCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<BanjarKinds, Ridges>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      const core = layout.segments.find((s) => s.key === 'palidangan')
      const others = layout.segments.filter((s) => s.key !== 'palidangan')
      return {
        result: checkCoreIsTallest(layout),
        witness: {
          core: core?.ridgeY ?? 0,
          neighbour: Math.max(...others.map((s) => s.ridgeY)),
        },
      }
    },
    // Downward: a taller ridge is never the problem.
    factors: Array.from({ length: 18 }, (_, i) => 0.9 - i * 0.05),
  })
  if (!found) throw new Error('checkCoreIsTallest could not be broken by tinggiRise alone')
  return found
}
