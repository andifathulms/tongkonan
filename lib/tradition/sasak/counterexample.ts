/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkRatGuard` and what breaks it is `postSection` — the thickness of the
 * post the guard is threaded onto.
 *
 * The disc does not change. Its radius is a fixed overhang measured from the
 * post's own face, so a stouter post eats the overhang from the inside until
 * there is none left — and the guard becomes a collar flush with the timber it
 * is supposed to project beyond. Nothing about the granary looks weaker. The
 * posts look sturdier.
 *
 * Twelve buildings, twelve rules that cannot be carried out. What is particular
 * here is the direction: the thing that defeats the defence is the *improvement*
 * a builder would reach for first.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildFrame, resolveLayout } from './frame'
import { checkRatGuard } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, Rules, SasakKinds } from './types'

/** The two numbers the check is comparing. */
export interface Margin {
  readonly post: number
  readonly overhang: number
}

export type Counterexample = CoreCounterexample<SasakKinds, Margin>

const DIM: DimKey = 'postSection'

export function guardCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<SasakKinds, Margin>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const base = resolveLayout(rules)
      const layout: Layout = { ...base, roof: [], dims: [] }
      const frame = buildFrame(layout)
      const house = {
        rules,
        parts: frame.parts,
        joints: frame.joints,
        bounds: { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] },
      }
      const post = layout.posts[0]
      return {
        result: checkRatGuard(house, layout),
        witness: {
          post: layout.postSection,
          overhang: (post?.guardRadius ?? 0) - layout.postSection / 2,
        },
      }
    },
    factors: Array.from({ length: 40 }, (_, i) => 1.1 + i * 0.2),
  })
  if (!found) throw new Error('checkRatGuard could not be broken by postSection alone')
  return found
}
