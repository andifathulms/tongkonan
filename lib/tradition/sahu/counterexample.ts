/**
 * A check, shown doing its job.
 *
 * The check is `checkEverybodyBows` and what breaks it is `headHigh` — the
 * head of the highest opening, the one guests come in by.
 *
 * Raising it is the ordinary courtesy anybody would think of. People arrive
 * carrying dishes for a feast that the whole village eats together; a taller
 * opening is easier for them, and a guest of standing might reasonably be
 * offered a way in they do not have to duck through. Nothing about the
 * building objects: the hall still seats everybody, the openings still differ
 * from one another in order, there is still no wall and no door leaf anywhere.
 *
 * What stops being true is that everybody bows. Past the height of a standing
 * adult the highest door is a door somebody walks through upright — and the
 * gesture that was asked of everyone has become a gesture asked only of the
 * people whose openings are lower. The building has not become worse; it has
 * started saying something else.
 *
 * The fifth counterexample here that ends with a sound building, after the
 * bale, the tanean, the bhaga and the ume kbubu — and the second where what
 * fails is a claim about how people are treated rather than about whether
 * something stands up.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkEverybodyBows } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, SahuKinds } from './types'

/** The two heights the check is comparing. */
export interface Bow {
  readonly highest: number
  readonly standing: number
}

export type Counterexample = CoreCounterexample<SahuKinds, Bow>

const DIM: DimKey = 'headHigh'

export function bowCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<SahuKinds, Bow>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return {
        result: checkEverybodyBows(layout),
        witness: {
          highest: Math.max(...layout.doors.map((d) => d.head)),
          standing: layout.body.standing,
        },
      }
    },
    // Upward: a lower opening is a different failure, and the check has a
    // bound on that side too.
    factors: Array.from({ length: 14 }, (_, i) => 1.04 + i * 0.03),
  })
  if (!found) throw new Error('checkEverybodyBows could not be broken by headHigh alone')
  return found
}
