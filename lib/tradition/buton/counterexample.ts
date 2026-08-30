/**
 * A check, shown doing its job.
 *
 * The check is `checkOverhangIsCarried` and what breaks it is `oversail` — how
 * far each storey steps out past the one below.
 *
 * Stepping out is what this building is for. It is the whole silhouette, it is
 * what the rank rule is about, and more of it is more of the thing the house
 * exists to say. Push it and nothing else goes wrong: every storey is still
 * wider than the last, the arms are still there in the number the rank allows,
 * the frame is still plumb, the roof still covers. What runs out is the arm.
 * The projections accumulate from the same frame, so the topmost floor is
 * always the furthest out and the topmost arm is always the longest — and past
 * a point it is longer than a piece of timber leaning out of a post can be.
 *
 * Which is the interesting half: the limit lands at the *top* of a building
 * whose top storey is the one that matters most. The household that overreaches
 * loses exactly the floor it was overreaching for.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkOverhangIsCarried } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, MAX_TINGKAT, PACK } from './rules'
import type { DimKey } from './rules'
import type { ButonKinds, Rules } from './types'

/** The two lengths the check is comparing. */
export interface Arm {
  readonly span: number
  readonly reach: number
}

export type Counterexample = CoreCounterexample<ButonKinds, Arm>

const DIM: DimKey = 'oversail'

export function overhangCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<ButonKinds, Arm>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      // Tested on the full four storeys with the highest rank, because that is
      // the house this happens to: the one entitled to reach furthest out.
      const layout = resolveLayout({ ...rules, tingkat: MAX_TINGKAT, pale: 'pata' })
      const base = layout.storeys[0]
      const top = layout.storeys[layout.storeys.length - 1]
      return {
        result: checkOverhangIsCarried(layout),
        witness: {
          span: (top?.halfX ?? 0) - (base?.halfX ?? 0),
          reach: layout.reach,
        },
      }
    },
    // Upward: a smaller step out is never the problem.
    factors: Array.from({ length: 16 }, (_, i) => 1.1 + i * 0.12),
  })
  if (!found) throw new Error('checkOverhangIsCarried could not be broken by oversail alone')
  return found
}
