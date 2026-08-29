/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, PAMALI, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'soa', param: 'soa' },
    { kind: 'choice', key: 'pamali', param: 'pamali', options: PAMALI.map((p) => p.pamali) },
    { kind: 'flag', key: 'sekat', param: 'sekat' },
  ],
})

export const RULE_PARAMS = { soa: 'soa', pamali: 'pamali', sekat: 'sekat' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
