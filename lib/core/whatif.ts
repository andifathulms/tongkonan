/**
 * The one place a rule is temporarily something else.
 *
 * A generator reads its rule pack directly, everywhere. That is what makes a
 * dimension a single source of truth, and it is also why asking "what would
 * this build if the number were different" means changing the number.
 *
 * Two kinds of caller need that and no others should: sensitivity analysis,
 * which asks how much each guess matters, and counterexamples, which ask what
 * a check is actually preventing. Both are introspection — they report on the
 * rule pack rather than building from it.
 *
 * The value is restored in a `finally`, so nothing outside can observe a
 * modified pack, and a test asserts that after the fact. If a third kind of
 * caller ever appears, that is the signal to thread overrides through the
 * generator properly instead of widening this.
 *
 * Taking the pack as an argument rather than importing one is what keeps this
 * honest across traditions: a probe into the Toraja pack cannot reach into
 * the Minang one, because it was never handed it.
 */

import type { Kinds, RulePack } from './kinds'

export function withDimValue<K extends Kinds, T>(
  pack: RulePack<K>,
  key: K['dim'],
  value: number,
  fn: () => T,
): T {
  const slot = pack.dim(key) as { value: number }
  const original = slot.value
  slot.value = value
  try {
    return fn()
  } finally {
    slot.value = original
  }
}
