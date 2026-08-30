/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, LAMA, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'orang', param: 'orang' },
    { kind: 'choice', key: 'lama', param: 'lama', options: LAMA.map((l) => l.lama) },
    { kind: 'flag', key: 'panggung', param: 'panggung' },
  ],
})

export const RULE_PARAMS = { orang: 'orang', lama: 'lama', panggung: 'panggung' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
