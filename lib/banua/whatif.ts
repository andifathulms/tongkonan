/**
 * The one place a rule is temporarily something else.
 *
 * The generator reads the rule pack directly, everywhere. That is what makes
 * a dimension a single source of truth, and it is also why asking "what would
 * this build if the number were different" means changing the number.
 *
 * Two callers need that and no others should: `sensitivity.ts`, which asks
 * how much each guess matters, and `counterexample.ts`, which asks what a
 * check is actually preventing. Both are introspection — they report on the
 * rule pack rather than building from it.
 *
 * The value is restored in a `finally`, so nothing outside can observe a
 * modified pack, and a test asserts that after the fact. If a third caller
 * ever appears, that is the signal to thread overrides through `buildHouse`
 * properly instead of widening this.
 */

import { DIMS } from './rules'
import type { DimKey } from './rules'

export function withDimValue<T>(key: DimKey, value: number, fn: () => T): T {
  const slot = DIMS[key] as { value: number }
  const original = slot.value
  slot.value = value
  try {
    return fn()
  } finally {
    slot.value = original
  }
}
