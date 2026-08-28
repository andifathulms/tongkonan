/**
 * The three rules, to and from a query string.
 *
 * The first pack whose query carries a measurement of a person. `depa` is an
 * integer field like a bay count or a household tally, and the codec cannot
 * tell the difference — which is right: the mechanism's job is fields, and
 * what the field means is this tradition's business.
 */

import { rulesCodec } from '@/lib/core/address'
import { BALE, DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'bale', param: 'bale', options: BALE.map((b) => b.bale) },
    { kind: 'int', key: 'depa', param: 'depa' },
    { kind: 'flag', key: 'pengurip', param: 'pengurip' },
  ],
})

export const RULE_PARAMS = { bale: 'bale', depa: 'depa', pengurip: 'pengurip' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
