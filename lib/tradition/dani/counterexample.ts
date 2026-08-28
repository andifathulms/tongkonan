/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkSmallVolume` and what breaks it is `radius`.
 *
 * Widen the wall and nothing fails structurally: the ring closes, the dome
 * still covers it, the door still stoops, the loft is still above the fire.
 * Every other check in this pack goes on passing. What stops being true is
 * that the room is small — and a honai that is not small is a round thatched
 * house with a fire in it, a description that fits a mbaru niang equally and
 * therefore says nothing about either.
 *
 * Thirteen buildings, thirteen rules that cannot be carried out. This one fails
 * the way the rumah kaki seribu's does: nothing breaks, and the thing stops
 * being what it was for.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkSmallVolume } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { DaniKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Room {
  readonly radius: number
  readonly volume: number
}

export type Counterexample = CoreCounterexample<DaniKinds, Room>

const DIM: DimKey = 'radius'

export function volumeCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<DaniKinds, Room>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return { result: checkSmallVolume(layout), witness: { radius: layout.radius, volume: layout.volume } }
    },
  })
  if (!found) throw new Error('checkSmallVolume could not be broken by radius alone')
  return found
}
