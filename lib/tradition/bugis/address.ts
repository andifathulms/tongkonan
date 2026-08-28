/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, RUMAH, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'rumah', param: 'rumah', options: RUMAH.map((r) => r.rumah) },
    // An int, and it is clamped by entitlement rather than by geometry — see
    // `normaliseRules`. `?timpa=7` on a bola is not a bigger house, it is a
    // claim that household is not permitted to make.
    { kind: 'int', key: 'timpa', param: 'timpa' },
    { kind: 'int', key: 'lontang', param: 'lontang' },
  ],
})

export const RULE_PARAMS = { rumah: 'rumah', timpa: 'timpa', lontang: 'lontang' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
