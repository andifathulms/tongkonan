/**
 * A check, shown doing its job.
 *
 * The mechanism is in `lib/core/counterexample.ts`. The check is
 * `checkManySmallLegs` and what breaks it is `legSection` — the thickness of
 * one pole.
 *
 * Thicken them and the house is still standing, still unbraced, still on legs
 * that are not buried, still swaying when the ground does. Every other check
 * in this pack goes on passing. What stops being true is that the legs are
 * *small* — and once a leg is a post, the reason for having hundreds of them
 * is gone, and the building is an ordinary raised house with an oddly crowded
 * substructure.
 *
 * Eleven houses, eleven rules that cannot be carried out. This one fails in
 * the way a definition fails: nothing is broken, and the thing has stopped
 * being what it was called.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildFrame, resolveLayout } from './frame'
import { checkManySmallLegs } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { ArfakKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Poles {
  readonly section: number
  readonly legs: number
}

export type Counterexample = CoreCounterexample<ArfakKinds, Poles>

const DIM: DimKey = 'legSection'

export function legCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<ArfakKinds, Poles>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      const frame = buildFrame(layout)
      const house = {
        rules,
        parts: frame.parts,
        joints: frame.joints,
        bounds: { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] },
      }
      return {
        result: checkManySmallLegs(house, layout),
        witness: { section: layout.legSection, legs: layout.legs.length },
      }
    },
  })
  if (!found) throw new Error('checkManySmallLegs could not be broken by legSection alone')
  return found
}
