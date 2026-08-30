/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, LETAK, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'kamar', param: 'kamar' },
    { kind: 'choice', key: 'letak', param: 'letak', options: LETAK.map((l) => l.letak) },
    { kind: 'flag', key: 'gigiBalang', param: 'gigi' },
  ],
})

export const RULE_PARAMS = { kamar: 'kamar', letak: 'letak', gigiBalang: 'gigi' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
