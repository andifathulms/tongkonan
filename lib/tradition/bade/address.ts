/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, PEMIKUL, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'tumpang', param: 'tumpang' },
    { kind: 'choice', key: 'pemikul', param: 'pemikul', options: PEMIKUL.map((p) => p.pemikul) },
    { kind: 'flag', key: 'payung', param: 'payung' },
  ],
})

export const RULE_PARAMS = { tumpang: 'tumpang', pemikul: 'pemikul', payung: 'payung' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
