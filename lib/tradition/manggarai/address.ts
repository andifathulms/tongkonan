/**
 * The two rules, to and from a query string.
 *
 * Two, and the codec does not mind. Every other pack has three, and after
 * three houses that had started to look like a property of the project rather
 * than a coincidence of its contents.
 */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, PERAN, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'peran', param: 'peran', options: PERAN.map((p) => p.peran) },
    { kind: 'int', key: 'keluarga', param: 'keluarga' },
  ],
})

export const RULE_PARAMS = { peran: 'peran', keluarga: 'keluarga' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
