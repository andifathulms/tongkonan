/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { BENTUK, DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'rumah', param: 'rumah' },
    { kind: 'choice', key: 'bentuk', param: 'bentuk', options: BENTUK.map((b) => b.bentuk) },
    { kind: 'flag', key: 'dapur', param: 'dapur' },
  ],
})

export const RULE_PARAMS = { rumah: 'rumah', bentuk: 'bentuk', dapur: 'dapur' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
