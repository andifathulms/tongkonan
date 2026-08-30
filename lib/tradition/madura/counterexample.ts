/**
 * A check, shown doing its job.
 *
 * The check is `checkSeniorityRunsEast` and what breaks it is `houseWidth` —
 * the frontage of a married daughter's house.
 *
 * Every daughter builds the same house, so making that house a little wider
 * makes all of them wider at once, and nothing about the arrangement goes
 * wrong: the langgar still closes the west end, the yard is still clear, the
 * row still runs in birth order, the pitch is still the pitch. What breaks is
 * that the daughters' houses grow past the tonghuh — and the row then states
 * something it must not, which is that the youngest household outranks the
 * eldest.
 *
 * It is the second counterexample in this project that ends with a perfectly
 * sound building, after the Balinese bale's. Nothing here would fall down. The
 * arrangement would simply be saying the wrong thing about the family living
 * in it, in the one medium a tanean has for saying anything: size and place.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkSeniorityRunsEast } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { MaduraKinds, Rules } from './types'

/** The two frontages the check is comparing. */
export interface Row {
  readonly tonghuh: number
  readonly daughter: number
}

export type Counterexample = CoreCounterexample<MaduraKinds, Row>

const DIM: DimKey = 'houseWidth'

export function seniorityCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<MaduraKinds, Row>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout({ ...rules, rumah: Math.max(3, rules.rumah) })
      return {
        result: checkSeniorityRunsEast(layout),
        witness: {
          tonghuh: layout.houses[0]?.width ?? 0,
          daughter: layout.houses[1]?.width ?? 0,
        },
      }
    },
    // Upward: a smaller house for a daughter is never the problem the rule is
    // about — a household may build modestly, it may not build above itself.
    factors: Array.from({ length: 14 }, (_, i) => 1.05 + i * 0.08),
  })
  if (!found) throw new Error('checkSeniorityRunsEast could not be broken by houseWidth alone')
  return found
}
