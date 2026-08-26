/**
 * The three rules, to and from a query string.
 *
 * Same contract as the other house and deliberately not the same parameter
 * names: the query string is a complete description of *this* house, and
 * `?pangkat=…` would describe a different one. All three are always written,
 * defaults included, because a description that omits its defaults is a diff
 * rather than a citation.
 *
 * Which tradition is being described is not in here. That is a path segment —
 * a tradition selects a rule pack rather than being one of its rules.
 */

import { DEFAULT_RULES, normaliseRules } from './rules'
import type { Laras, Rules } from './types'

export const RULE_PARAMS = {
  laras: 'laras',
  ruang: 'ruang',
  bilik: 'bilik',
} as const

function isLaras(value: string): value is Laras {
  return value === 'koto-piliang' || value === 'bodi-caniago'
}

function numberOr(raw: string | null, fallback: number): number {
  if (raw === null) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function rulesFromQuery(search: string): Rules {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const rawLaras = q.get(RULE_PARAMS.laras)
  return normaliseRules({
    laras: rawLaras && isLaras(rawLaras) ? rawLaras : DEFAULT_RULES.laras,
    ruang: numberOr(q.get(RULE_PARAMS.ruang), DEFAULT_RULES.ruang),
    bilik: numberOr(q.get(RULE_PARAMS.bilik), DEFAULT_RULES.bilik),
  })
}

export function rulesToQuery(rules: Rules): string {
  const r = normaliseRules(rules)
  const q = new URLSearchParams()
  q.set(RULE_PARAMS.laras, r.laras)
  q.set(RULE_PARAMS.ruang, String(r.ruang))
  q.set(RULE_PARAMS.bilik, String(r.bilik))
  return `?${q.toString()}`
}

export function rulesEqual(a: Rules, b: Rules): boolean {
  return a.laras === b.laras && a.ruang === b.ruang && a.bilik === b.bilik
}
