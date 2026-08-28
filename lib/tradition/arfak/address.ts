/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, HUNI, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'huni', param: 'huni', options: HUNI.map((h) => h.huni) },
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'int', key: 'kaki', param: 'kaki' },
  ],
})

export const RULE_PARAMS = { huni: 'huni', ruang: 'ruang', kaki: 'kaki' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
