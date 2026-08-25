/**
 * What a survey would change.
 *
 * Almost every metre in the rule pack is the author's own, and the provenance
 * bar says so. What it cannot say is whether that matters — whether the
 * guesses are load-bearing or cosmetic. A reader deciding how seriously to
 * take this model has no way to tell, and neither does the author.
 *
 * This answers it the only way the project is allowed to: by building the
 * house again. Perturb one dimension, rebuild, and measure how far a handful
 * of named outputs move. Nothing is estimated and nothing is modelled; every
 * figure is the difference between two runs of `buildHouse`, so it traces to
 * a rule exactly like the numbers it is about.
 *
 * It is emphatically not a control. The perturbation is fixed, it is stated
 * on screen, and it is an output — there is no slider here and there will not
 * be one.
 */

import { buildHouse } from './assembly'
import { DIMS, DIM_KEYS, DEFAULT_RULES } from './rules'
import type { DimKey } from './rules'
import type { Layout, Rules } from './types'

/**
 * How far each dimension is pushed.
 *
 * A fifth is itself a judgement — an interpolated figure about interpolated
 * figures — so it is named rather than buried. It is large enough that a
 * dimension which matters moves something visible, and small enough that the
 * house stays a house and the comparison stays meaningful.
 */
export const PERTURBATION = 0.2

/**
 * The outputs a reader would actually notice moving.
 *
 * Chosen because each one is something you can see from the courtyard, not
 * because it is convenient to measure: how big the house is, how high it
 * stands, how far the roof reaches, where the ridge sits.
 */
const PROBES = [
  { key: 'bodyLength', read: (l: Layout) => l.bodyLength },
  { key: 'bodyWidth', read: (l: Layout) => l.bodyWidth },
  { key: 'ridgeY', read: (l: Layout) => l.ridgeY },
  { key: 'frontProwY', read: (l: Layout) => l.frontProwY },
  { key: 'eaveY', read: (l: Layout) => l.eaveY },
  { key: 'eaveHalfWidth', read: (l: Layout) => l.eaveHalfWidth },
  { key: 'deckY', read: (l: Layout) => l.deckY },
] as const

export type ProbeKey = (typeof PROBES)[number]['key']

export interface Sensitivity {
  readonly dim: DimKey
  /**
   * The largest movement in any probe, in metres — how far the house shifts
   * if this one number is a fifth out.
   */
  readonly worst: number
  /** Which probe moved that far. */
  readonly worstProbe: ProbeKey
  /** Every probe that moved at all, largest first. */
  readonly moved: readonly { probe: ProbeKey; metres: number }[]
}

/**
 * Run `fn` with one dimension temporarily changed.
 *
 * The generator reads the rule pack directly, everywhere, which is what makes
 * a dimension a single source of truth. Asking what the house would look like
 * if a number were different therefore means changing that number, and this
 * is the only sanctioned place it happens.
 *
 * The value is restored in a `finally`, so nothing outside this function can
 * observe a modified pack — `keepsTheRulePackIntact` in the tests is what
 * holds that. Do not reach for this anywhere else; if a second caller ever
 * wants it, the right move is to thread overrides through `buildHouse`
 * instead.
 */
function withDimValue<T>(key: DimKey, value: number, fn: () => T): T {
  const slot = DIMS[key] as { value: number }
  const original = slot.value
  slot.value = value
  try {
    return fn()
  } finally {
    slot.value = original
  }
}

function readProbes(rules: Rules): Map<ProbeKey, number> {
  const { layout } = buildHouse(rules)
  return new Map(PROBES.map((p) => [p.key, p.read(layout)] as const))
}

/** Rebuild with one dimension scaled, and read the probes. */
function probe(rules: Rules, override?: { key: DimKey; factor: number }): Map<ProbeKey, number> {
  if (!override) return readProbes(rules)
  const scaled = DIMS[override.key].value * override.factor
  return withDimValue(override.key, scaled, () => readProbes(rules))
}

/**
 * How much each dimension matters, largest first.
 *
 * Dimensions with a `count` or `ratio` unit that act as switches rather than
 * measurements are included on the same terms as everything else: if pushing
 * them moves nothing, they report zero, which is itself worth seeing.
 */
export function sensitivities(rules: Rules = DEFAULT_RULES): readonly Sensitivity[] {
  const base = probe(rules)

  const out: Sensitivity[] = []
  for (const key of DIM_KEYS) {
    const up = probe(rules, { key, factor: 1 + PERTURBATION })
    const moved: { probe: ProbeKey; metres: number }[] = []
    for (const p of PROBES) {
      const delta = Math.abs((up.get(p.key) ?? 0) - (base.get(p.key) ?? 0))
      // Below a millimetre is noise, not a consequence.
      if (delta >= 0.001) moved.push({ probe: p.key, metres: delta })
    }
    moved.sort((a, b) => b.metres - a.metres)
    const worst = moved[0]
    out.push({
      dim: key,
      worst: worst ? worst.metres : 0,
      worstProbe: worst ? worst.probe : 'bodyLength',
      moved,
    })
  }

  out.sort((a, b) => b.worst - a.worst)
  return out
}

/** Look one dimension up in a computed table. */
export function sensitivityOf(
  table: readonly Sensitivity[],
  key: DimKey,
): Sensitivity | undefined {
  return table.find((s) => s.dim === key)
}

export const PROBE_LABELS: Record<ProbeKey, { id: string; en: string }> = {
  bodyLength: { id: 'panjang badan', en: 'body length' },
  bodyWidth: { id: 'lebar badan', en: 'body width' },
  ridgeY: { id: 'tinggi punggung', en: 'ridge height' },
  frontProwY: { id: 'puncak haluan depan', en: 'front prow tip' },
  eaveY: { id: 'tinggi tepi atap', en: 'eave height' },
  eaveHalfWidth: { id: 'jangkauan atap', en: 'roof reach' },
  deckY: { id: 'tinggi lantai', en: 'floor height' },
}
