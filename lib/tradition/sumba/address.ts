/**
 * The three rules, to and from a query string.
 *
 * `menara` is an integer field carrying tenths — see MENARA_SCALE. The codec
 * has no fractional field kind and should not grow one for a single pack; a
 * rule stored in tenths and divided at the point of use is a smaller change
 * than a new field kind, and does not make the other seven traditions pay for
 * this one's arithmetic.
 */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, UMA, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'uma', param: 'uma', options: UMA.map((u) => u.uma) },
    { kind: 'int', key: 'menara', param: 'menara' },
    { kind: 'flag', key: 'bangga', param: 'bangga' },
  ],
})

export const RULE_PARAMS = { uma: 'uma', menara: 'menara', bangga: 'bangga' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
