/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, JENIS, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'jenis', param: 'jenis', options: JENIS.map((j) => j.jenis) },
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'flag', key: 'anjung', param: 'anjung' },
  ],
})

export const RULE_PARAMS = { jenis: 'jenis', ruang: 'ruang', anjung: 'anjung' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
