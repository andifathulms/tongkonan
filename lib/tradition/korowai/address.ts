/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, TINGGI, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'tinggi', param: 'tinggi', options: TINGGI.map((t) => t.tinggi) },
    { kind: 'int', key: 'perapian', param: 'perapian' },
    { kind: 'flag', key: 'pohon', param: 'pohon' },
  ],
})

export const RULE_PARAMS = { tinggi: 'tinggi', perapian: 'perapian', pohon: 'pohon' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
