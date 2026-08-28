/** The three rules, to and from a query string. */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, normaliseRules } from './rules'
import type { Rules } from './types'

export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    /*
     * An int, and it has to be.
     *
     * Written as a `choice` over ['3','5'] first, which type-checks and is
     * wrong: a choice field writes the raw *string* into the rule, so
     * `?kekijing=3` produced `'3'`, and `normaliseRules` compares against the
     * number 3. A three-step house read back from its own address came out
     * with five — the codec quietly giving a household two distinctions it
     * had not claimed. The clamp below is what refuses a value that is
     * neither, which is the job a choice would have done if the values were
     * strings.
     */
    { kind: 'int', key: 'kekijing', param: 'kekijing' },
    { kind: 'int', key: 'lebar', param: 'lebar' },
    { kind: 'flag', key: 'tenggalung', param: 'tenggalung' },
  ],
})

export const RULE_PARAMS = { kekijing: 'kekijing', lebar: 'lebar', tenggalung: 'tenggalung' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
