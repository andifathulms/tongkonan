/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, TANGGA, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'choice', key: 'tangga', param: 'tangga', options: TANGGA.map((t) => t.tangga) },
    { kind: 'flag', key: 'pindah', param: 'pindah' },
  ],
})

export const RULE_PARAMS = { ruang: 'ruang', tangga: 'tangga', pindah: 'pindah' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
