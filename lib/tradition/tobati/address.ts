/** The two rules, to and from a query string. See `types.ts` on why two. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'tingkat', param: 'tingkat' },
    { kind: 'flag', key: 'titian', param: 'titian' },
  ],
})

export const RULE_PARAMS = { tingkat: 'tingkat', titian: 'titian' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
