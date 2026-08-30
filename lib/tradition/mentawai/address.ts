/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, SERAMBI, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'keluarga', param: 'keluarga' },
    { kind: 'choice', key: 'serambi', param: 'serambi', options: SERAMBI.map((s) => s.serambi) },
    { kind: 'flag', key: 'jaraik', param: 'jaraik' },
  ],
})

export const RULE_PARAMS = { keluarga: 'keluarga', serambi: 'serambi', jaraik: 'jaraik' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
