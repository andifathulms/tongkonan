/**
 * The three rules, as an address.
 *
 * The claim the whole project rests on is that three social facts fully
 * determine the building. A query string carrying exactly those three facts
 * and nothing else is that claim written down as an address: hand it to
 * someone and they get the same house, because there is nothing else to send.
 *
 * So this is deliberately narrow. The address holds rules only — never the
 * camera, the view, the sun, or the scene toggles. Those are things a reader
 * is doing; the rules are what the household would say about itself, and only
 * the second kind is worth an address.
 *
 * Which tradition this is describing is not here either. That is a path
 * segment: a tradition selects a rule pack rather than being one of its rules.
 *
 * Pure, like everything else in `lib/`: it takes a string and returns rules.
 * Reading `window.location` is the renderer's job. The mechanism is
 * `rulesCodec` in the core; what is declared here is only which fields exist
 * and what they are called.
 */

import { rulesCodec } from '@/lib/core/address'
import { DEFAULT_RULES, RANKS, normaliseRules } from './rules'
import type { Rules } from './types'

/**
 * Parameter names are Indonesian, because the rules are Indonesian and
 * Indonesian is the default locale. An English reader gets an address in
 * Indonesian for the same reason they get `tulak somba` rather than
 * `front cantilever post`: it is the name of the thing.
 */
export const CODEC = rulesCodec<Rules>({
  defaults: DEFAULT_RULES,
  normalise: normaliseRules,
  fields: [
    { kind: 'choice', key: 'rank', param: 'pangkat', options: RANKS.map((r) => r.rank) },
    { kind: 'int', key: 'bays', param: 'ruang' },
    { kind: 'int', key: 'horns', param: 'tanduk' },
  ],
})

export const RULE_PARAMS = { rank: 'pangkat', bays: 'ruang', horns: 'tanduk' } as const

export const rulesFromQuery = CODEC.fromQuery
export const rulesToQuery = CODEC.toQuery
export const rulesEqual = CODEC.equal
