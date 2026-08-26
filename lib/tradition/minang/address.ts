/**
 * The three rules, as an address.
 *
 * Same contract as the other house and deliberately not the same parameter
 * names: the query string is a complete description of *this* house, and
 * `?pangkat=…` would describe a different one.
 *
 * Which tradition is being described is not in here. That is a path segment —
 * a tradition selects a rule pack rather than being one of its rules.
 */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, LARAS, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'laras', param: 'laras', options: LARAS.map((l) => l.laras) },
    { kind: 'int', key: 'ruang', param: 'ruang' },
    { kind: 'int', key: 'bilik', param: 'bilik' },
  ],
})

export const RULE_PARAMS = { laras: 'laras', ruang: 'ruang', bilik: 'bilik' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
