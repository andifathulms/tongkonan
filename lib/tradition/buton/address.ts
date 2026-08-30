/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, PALE, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'tingkat', param: 'tingkat' },
    { kind: 'choice', key: 'pale', param: 'pale', options: PALE.map((p) => p.pale) },
    { kind: 'flag', key: 'anjungan', param: 'anjungan' },
  ],
})

export const RULE_PARAMS = { tingkat: 'tingkat', pale: 'pale', anjungan: 'anjungan' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
