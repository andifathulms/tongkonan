/**
 * The three rules, to and from a query string.
 *
 * Same contract as the other two and a third set of names, because the query
 * string is a complete description of *this* house and neither of the others'
 * parameters mean anything here.
 *
 * The pendhapa is a flag rather than a count, which is a shape neither of the
 * other packs has: `rulesCodec` grew a `flag` field for it rather than the
 * house pretending it was a number.
 */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, WUJUD, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'wujud', param: 'wujud', options: WUJUD.map((w) => w.wujud) },
    { kind: 'int', key: 'tumpang', param: 'tumpang' },
    { kind: 'flag', key: 'pendhapa', param: 'pendhapa' },
  ],
})

export const RULE_PARAMS = { wujud: 'wujud', tumpang: 'tumpang', pendhapa: 'pendhapa' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
