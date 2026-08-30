/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, UKURAN, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'ukuran', param: 'ukuran', options: UKURAN.map((u) => u.ukuran) },
    { kind: 'flag', key: 'kajang', param: 'kajang' },
    { kind: 'flag', key: 'cadik', param: 'cadik' },
  ],
})

export const RULE_PARAMS = { ukuran: 'ukuran', kajang: 'kajang', cadik: 'cadik' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
