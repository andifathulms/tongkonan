/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, LERENG, WILAYAH, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'wilayah', param: 'wilayah', options: WILAYAH.map((w) => w.wilayah) },
    { kind: 'choice', key: 'lereng', param: 'lereng', options: LERENG.map((l) => l.lereng) },
    { kind: 'flag', key: 'sosoro', param: 'sosoro' },
  ],
})

export const RULE_PARAMS = { wilayah: 'wilayah', lereng: 'lereng', sosoro: 'sosoro' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
