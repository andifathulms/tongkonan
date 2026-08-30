/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, TINGGI, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'pasangan', param: 'pasangan' },
    { kind: 'choice', key: 'tinggi', param: 'tinggi', options: TINGGI.map((t) => t.tinggi) },
    { kind: 'flag', key: 'ture', param: 'ture' },
  ],
})

export const RULE_PARAMS = { pasangan: 'pasangan', tinggi: 'tinggi', ture: 'ture' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
