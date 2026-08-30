/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, SUSUNAN, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'bilik', param: 'bilik' },
    { kind: 'choice', key: 'susunan', param: 'susunan', options: SUSUNAN.map((s) => s.susunan) },
    { kind: 'flag', key: 'serambi', param: 'serambi' },
  ],
})

export const RULE_PARAMS = { bilik: 'bilik', susunan: 'susunan', serambi: 'serambi' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
