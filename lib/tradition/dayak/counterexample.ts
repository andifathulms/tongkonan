/**
 * A check, shown doing its job — and a second note on the ones that cannot be.
 *
 * The Nias pack found that its strongest check could not be broken by pushing
 * any dimension, because the braces and the check read one list. This pack has
 * the same property in two places, and it is worth recording that it is now a
 * pattern rather than an accident.
 *
 * **`checkNoCharacteristicLength` cannot be falsified by a dimension**, because
 * the ratio it watches is length over width and the length is a count times a
 * share — scale either and the spread across household counts is unchanged.
 * **`checkGalleryOpen` cannot either**, because the bilik wall stands exactly
 * on the gallery boundary by construction, so narrowing the gallery moves the
 * wall with it for ever. Both are tested directly in `test/dayak.test.ts`
 * instead, against the arithmetic rather than against themselves.
 *
 * What is shown here is `checkShingleCoverage` against `shingleLap`, which
 * genuinely compares two independent numbers. A shingle roof does not leak
 * through its shingles; it leaks at the joints between them, and the only
 * thing standing between the two is how far each course laps the one below.
 * Take the lap away and the courses stop overlapping — the roof is still made
 * of exactly the same amount of ironwood, laid over exactly the same rafters,
 * and it no longer covers itself.
 *
 * The factors run far further down than the default range, because a lap has
 * to be reduced to almost nothing before the courses part. That is a fact
 * about shingling worth seeing rather than a search that needed help.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { resolveLayout } from './frame'
import { checkShingleCoverage } from './invariants'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { DayakKinds, Rules } from './types'

/** The two numbers the check is comparing. */
export interface Lap {
  readonly lap: number
  readonly courses: number
}

export type Counterexample = CoreCounterexample<DayakKinds, Lap>

const DIM: DimKey = 'shingleLap'

export function shingleCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<DayakKinds, Lap>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      const layout = resolveLayout(rules)
      return {
        result: checkShingleCoverage(layout),
        witness: { lap: PACK.dim('shingleLap').value, courses: layout.shingleCourses },
      }
    },
    // Far below the default range: a lap has to be taken almost entirely away
    // before the courses part, which is a fact about shingling.
    factors: [0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005],
  })
  if (!found) throw new Error('checkShingleCoverage could not be broken by shingleLap alone')
  return found
}
