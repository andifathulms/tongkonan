/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, TUTUP, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'jumlah', param: 'jumlah' },
    { kind: 'choice', key: 'tutup', param: 'tutup', options: TUTUP.map((t) => t.tutup) },
    { kind: 'flag', key: 'alas', param: 'alas' },
  ],
})

export const RULE_PARAMS = { jumlah: 'jumlah', tutup: 'tutup', alas: 'alas' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
