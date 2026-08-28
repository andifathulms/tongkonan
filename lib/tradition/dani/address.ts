/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { BANGUNAN, DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'bangunan', param: 'bangunan', options: BANGUNAN.map((b) => b.bangunan) },
    { kind: 'int', key: 'lapis', param: 'lapis' },
    { kind: 'flag', key: 'loteng', param: 'loteng' },
  ],
})

export const RULE_PARAMS = { bangunan: 'bangunan', lapis: 'lapis', loteng: 'loteng' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
