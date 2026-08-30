/**
 * A check, shown doing its job.
 *
 * The check is `checkOverTheBearers` and what breaks it is `tumpangRise` — how
 * much height each tier of the tower takes.
 *
 * The tiers are the standing of the dead, and standing is read from the road.
 * Make each tier taller and every one of them is more visible, the count is
 * unchanged, the tower is still symmetric, still narrows correctly, still
 * carries nothing that could fall off. What runs out is the base: the lattice
 * comes from how many shoulders can get under it and nothing ties it to how
 * high the thing above it goes. Past a point the weight is too far above the
 * people holding it, and the tower that says the most is the tower that cannot
 * be carried down the road it was built to go down.
 *
 * Twenty-three buildings, twenty-three rules that cannot be carried out. This
 * one is unusual in what gives way: not a member, not a clearance, not a
 * material, but the crowd.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { buildHouse } from './assembly'
import { checkOverTheBearers } from './invariants'
import { DEFAULT_RULES, MAX_TUMPANG, PACK } from './rules'
import type { DimKey } from './rules'
import type { BadeKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Balance {
  readonly slenderness: number
  readonly limit: number
}

export type Counterexample = CoreCounterexample<BadeKinds, Balance>

const DIM: DimKey = 'tumpangRise'

export function bearersCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<BadeKinds, Balance>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      /*
       * Tested at the smallest lattice the rules allow and the tallest tower,
       * because that is the household this happens to: the one claiming the
       * most standing with the fewest people to carry it.
       */
      const at: Rules = { ...rules, tumpang: MAX_TUMPANG, pemikul: 'dua-puluh' }
      const { house, layout } = buildHouse(at)
      const result = checkOverTheBearers(house, layout)
      return {
        result,
        witness: { slenderness: layout.apexY / layout.frame.halfX, limit: layout.tipLimit },
      }
    },
    // Upward: a lower tier is never the problem.
    factors: Array.from({ length: 16 }, (_, i) => 1.1 + i * 0.15),
  })
  if (!found) throw new Error('checkOverTheBearers could not be broken by tumpangRise alone')
  return found
}
