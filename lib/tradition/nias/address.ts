/**
 * The three rules, to and from a query string.
 */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, OMO, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'omo', param: 'omo', options: OMO.map((o) => o.omo) },
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'flag', key: 'behu', param: 'behu' },
  ],
})

export const RULE_PARAMS = { omo: 'omo', ruang: 'ruang', behu: 'behu' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
