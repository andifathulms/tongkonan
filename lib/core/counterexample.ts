/**
 * A check, shown doing its job.
 *
 * There is no measured drawing for either house, so correctness rests on
 * structural truth instead of on a survey. That makes the invariants this
 * project's evidence rather than its housekeeping — and evidence that only
 * ever reports "pass" is indistinguishable from evidence that is not being
 * collected. A reader has no reason to believe a column of green rows.
 *
 * So one check is run against a house built to break it, and what the page
 * prints is the check's own verdict on that house. Nothing is described in
 * prose that the check does not say itself.
 *
 * On choosing which check: it has to be one that enforces something a source
 * says, not something the arithmetic already guarantees. A check whose inputs
 * define its own conclusion cannot be made to fail, and a check that cannot
 * fail is not evidence. `search` returning null is that discovery, not an
 * error, and the caller should say so rather than swallow it.
 */

import type { CheckResult } from './invariants'
import type { Kinds, RulePack } from './kinds'
import { withDimValue } from './whatif'

export interface Counterexample<K extends Kinds, W> {
  /** the dimension that was pushed */
  readonly dim: K['dim']
  /** what it was pushed to, and what it is in the rule pack */
  readonly value: number
  readonly actual: number
  /** the check's verdict on the house as built, and on the broken one */
  readonly sound: CheckResult
  readonly broken: CheckResult
  /** the numbers the check is comparing, in each house */
  readonly witness: { readonly sound: W; readonly broken: W }
}

/**
 * Push one dimension until the check refuses the house.
 *
 * The factor is searched rather than picked, so the figure on the page is the
 * point at which this actually stops being the building it claims to be,
 * rather than a number chosen to make a tidy example.
 *
 * @returns null when no factor in range breaks it — which means the check is
 *   restating its own inputs and is worth replacing, not hiding.
 */
export function searchCounterexample<K extends Kinds, W>(opts: {
  readonly pack: RulePack<K>
  readonly dim: K['dim']
  /** run the check against the house as the pack currently stands */
  readonly probe: () => { readonly result: CheckResult; readonly witness: W }
  readonly factors?: readonly number[]
}): Counterexample<K, W> | null {
  const { pack, dim, probe } = opts
  const factors = opts.factors ?? defaultFactors()
  const actual = pack.dim(dim).value
  const sound = probe()
  if (sound.result.status === 'fail') return null

  for (const factor of factors) {
    const candidate = actual * factor
    const found = withDimValue(pack, dim, candidate, probe)
    if (found.result.status === 'fail') {
      return {
        dim,
        value: candidate,
        actual,
        sound: sound.result,
        broken: found.result,
        witness: { sound: sound.witness, broken: found.witness },
      }
    }
  }
  return null
}

function defaultFactors(): readonly number[] {
  const out: number[] = []
  for (let f = 1.1; f <= 3.0001; f += 0.1) out.push(Number(f.toFixed(2)))
  return out
}
