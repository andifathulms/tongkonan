/**
 * A check, shown doing its job.
 *
 * There is no measured drawing, so correctness rests on structural truth
 * instead of on a survey. That makes the invariants this project's evidence
 * rather than its housekeeping — and evidence that only ever reports "pass"
 * is indistinguishable from evidence that is not being collected. A reader
 * has no reason to believe eleven green rows.
 *
 * So one check is run against a house built to break it, and what the page
 * prints is the check's own verdict on that house. Nothing is described in
 * prose that the check does not say itself.
 *
 * On the choice of check: the first attempt used the eave oversail, and it
 * could not be made to fail. `eaveHalfWidth` is *defined* as half the body
 * plus the oversail, so `checkEaveOversail` restates its own inputs and no
 * single dimension can break it. A check that cannot fail is not evidence,
 * and picking one that happened to look good would have hidden that.
 *
 * The ridge profile is the honest choice instead, because it enforces
 * something a source actually says rather than something the arithmetic
 * guarantees: the front prow stands higher than the rear (canon,
 * kis-jovak-1988). Raise the rear prow past the front and the house stops
 * being able to say which end is its face.
 */

import { buildHouse } from './assembly'
import { checkRidgeProfile } from './invariants'
import type { CheckResult } from './invariants'
import { DEFAULT_RULES, DIMS } from './rules'
import type { DimKey } from './rules'
import type { Layout, Rules } from './types'
import { withDimValue } from './whatif'

export interface Counterexample {
  /** the dimension that was pushed */
  readonly dim: DimKey
  /** what it was pushed to, and what it is in the rule pack */
  readonly value: number
  readonly actual: number
  /** the check's verdict on the house as built, and on the broken one */
  readonly sound: CheckResult
  readonly broken: CheckResult
  /** prow heights in each house — the two numbers the check is comparing */
  readonly prows: {
    sound: { front: number; rear: number }
    broken: { front: number; rear: number }
  }
}

const DIM: DimKey = 'rearProwRise'

/**
 * Raise the rear prow until the check refuses the house.
 *
 * The factor is searched rather than picked, so the figure on the page is the
 * point at which this actually stops being a tongkonan rather than a number
 * chosen to make a tidy example.
 */
export function ridgeCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const actual = DIMS[DIM].value
  const soundLayout = buildHouse(rules).layout
  const sound = checkRidgeProfile(soundLayout)

  let value = actual
  let broken = sound
  let brokenProws = prowsOf(soundLayout)

  for (let factor = 1.1; factor <= 3; factor += 0.1) {
    const candidate = actual * factor
    const found = withDimValue(DIM, candidate, () => {
      const { layout } = buildHouse(rules)
      return { result: checkRidgeProfile(layout), prows: prowsOf(layout) }
    })
    if (found.result.status === 'fail') {
      value = candidate
      broken = found.result
      brokenProws = found.prows
      break
    }
  }

  return {
    dim: DIM,
    value,
    actual,
    sound,
    broken,
    prows: { sound: prowsOf(soundLayout), broken: brokenProws },
  }
}

function prowsOf(layout: Layout): { front: number; rear: number } {
  return { front: layout.frontProwY, rear: layout.rearProwY }
}
