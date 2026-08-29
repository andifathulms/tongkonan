/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, PINTU, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'jabu', param: 'jabu' },
    { kind: 'flag', key: 'tersek', param: 'tersek' },
    { kind: 'choice', key: 'pintu', param: 'pintu', options: PINTU.map((p) => p.pintu) },
  ],
})

export const RULE_PARAMS = { jabu: 'jabu', tersek: 'tersek', pintu: 'pintu' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
