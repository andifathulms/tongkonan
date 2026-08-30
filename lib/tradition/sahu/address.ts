/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, PINTU, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'bentang', param: 'bentang' },
    { kind: 'choice', key: 'pintu', param: 'pintu', options: PINTU.map((p) => p.pintu) },
    { kind: 'flag', key: 'kain', param: 'kain' },
  ],
})

export const RULE_PARAMS = { bentang: 'bentang', pintu: 'pintu', kain: 'kain' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
