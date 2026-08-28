/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, TUMBUH, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'keluarga', param: 'keluarga' },
    { kind: 'choice', key: 'tumbuh', param: 'tumbuh', options: TUMBUH.map((t) => t.tumbuh) },
    { kind: 'flag', key: 'sami', param: 'sami' },
  ],
})

export const RULE_PARAMS = { keluarga: 'keluarga', tumbuh: 'tumbuh', sami: 'sami' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
