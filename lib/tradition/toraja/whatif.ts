/**
 * `withDimValue`, bound to the Toraja pack.
 *
 * The mechanism is in `lib/core/whatif.ts` and the reasoning is there too.
 * This is only the binding, so that a probe written against this tradition
 * cannot reach a dimension belonging to another one.
 */

import { withDimValue as coreWithDimValue } from '@/lib/core/whatif'
import { PACK } from './rules'
import type { DimKey } from './rules'

export function withDimValue<T>(key: DimKey, value: number, fn: () => T): T {
  return coreWithDimValue(PACK, key, value, fn)
}
