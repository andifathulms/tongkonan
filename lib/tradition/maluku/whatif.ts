/**
 * `withDimValue`, bound to the Maluku pack. The mechanism and the reasoning are
 * in `lib/core/whatif.ts`; this is only the binding.
 */

import { withDimValue as coreWithDimValue } from '@/lib/core/whatif'
import { PACK } from './rules'
import type { DimKey } from './rules'

export function withDimValue<T>(key: DimKey, value: number, fn: () => T): T {
  return coreWithDimValue(PACK, key, value, fn)
}
