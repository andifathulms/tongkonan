/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { ANJUNG, DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'choice', key: 'anjung', param: 'anjung', options: ANJUNG.map((a) => a.anjung) },
    { kind: 'flag', key: 'pelantar', param: 'pelantar' },
  ],
})

export const RULE_PARAMS = { ruang: 'ruang', anjung: 'anjung', pelantar: 'pelantar' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
