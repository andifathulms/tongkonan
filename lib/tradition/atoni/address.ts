/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, DINDING, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'simpanan', param: 'simpanan' },
    { kind: 'choice', key: 'dinding', param: 'dinding', options: DINDING.map((d) => d.dinding) },
    { kind: 'flag', key: 'lopo', param: 'lopo' },
  ],
})

export const RULE_PARAMS = { simpanan: 'simpanan', dinding: 'dinding', lopo: 'lopo' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
