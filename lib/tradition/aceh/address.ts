/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'int', key: 'anakTangga', param: 'tangga' },
    { kind: 'flag', key: 'seuramoeLikot', param: 'likot' },
  ],
})

export const RULE_PARAMS = { ruang: 'ruang', anakTangga: 'tangga', seuramoeLikot: 'likot' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
