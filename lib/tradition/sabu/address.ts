/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { ATAP, DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'choice', key: 'atap', param: 'atap', options: ATAP.map((a) => a.atap) },
    { kind: 'flag', key: 'duru', param: 'duru' },
  ],
})

export const RULE_PARAMS = { ruang: 'ruang', atap: 'atap', duru: 'duru' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
