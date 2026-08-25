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
 * Pure, like everything else in `lib/`: it takes a string and returns rules.
 * Reading `window.location` is the renderer's job.
 */

import { DEFAULT_RULES, normaliseRules } from './rules'
import type { Rank, Rules } from './types'

/**
 * Parameter names are Indonesian, because the rules are Indonesian and
 * Indonesian is the default locale. An English reader gets an address in
 * Indonesian for the same reason they get `tulak somba` rather than
 * `front cantilever post`: it is the name of the thing.
 */
export const RULE_PARAMS = {
  rank: 'pangkat',
  bays: 'ruang',
  horns: 'tanduk',
} as const

const RANKS: readonly Rank[] = ['layuk', 'pekamberan', 'batu-ariri']

function isRank(value: string): value is Rank {
  return (RANKS as readonly string[]).includes(value)
}

/**
 * Read rules out of a query string.
 *
 * The policy on a value that does not fit is to fall back to the default for
 * that field alone, never to fail: a hand-edited or truncated address should
 * still open a house. Out-of-range numbers are clamped by `normaliseRules`,
 * which is the same clamp the controls obey — there is one definition of what
 * the generator will build and this is not a second one.
 */
export function rulesFromQuery(search: string): Rules {
  const params = new URLSearchParams(search)

  const rankParam = params.get(RULE_PARAMS.rank)
  const rank = rankParam && isRank(rankParam) ? rankParam : DEFAULT_RULES.rank

  const bays = numberOr(params.get(RULE_PARAMS.bays), DEFAULT_RULES.bays)
  const horns = numberOr(params.get(RULE_PARAMS.horns), DEFAULT_RULES.horns)

  return normaliseRules({ rank, bays, horns })
}

/**
 * Write rules into a query string.
 *
 * All three are always written, even at their defaults. An address that omits
 * what happens to be default is not a description of a house, it is a diff
 * against one, and it stops being a complete statement the moment the
 * defaults change.
 */
export function rulesToQuery(rules: Rules): string {
  const r = normaliseRules(rules)
  const params = new URLSearchParams()
  params.set(RULE_PARAMS.rank, r.rank)
  params.set(RULE_PARAMS.bays, String(r.bays))
  params.set(RULE_PARAMS.horns, String(r.horns))
  return params.toString()
}

/** Whether two rule sets describe the same house. */
export function rulesEqual(a: Rules, b: Rules): boolean {
  return a.rank === b.rank && a.bays === b.bays && a.horns === b.horns
}

function numberOr(raw: string | null, fallback: number): number {
  if (raw === null || raw.trim() === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
