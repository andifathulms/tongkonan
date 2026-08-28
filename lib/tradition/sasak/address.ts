/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, MILIK, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'milik', param: 'milik', options: MILIK.map((m) => m.milik) },
    // An int, not a choice: a choice field writes a string, and the rumah
    // limas's level count came back as five from every three-step address
    // before that was found. The clamp in `normaliseRules` is what refuses a
    // count this tradition does not build.
    { kind: 'int', key: 'tiang', param: 'tiang' },
    { kind: 'flag', key: 'kolong', param: 'kolong' },
  ],
})

export const RULE_PARAMS = { milik: 'milik', tiang: 'tiang', kolong: 'kolong' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
