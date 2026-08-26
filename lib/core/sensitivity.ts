/**
 * What a survey would change.
 *
 * Almost every metre in either rule pack is the author's own, and the
 * provenance bar says so. What it cannot say is whether that matters —
 * whether the guesses are load-bearing or cosmetic. A reader deciding how
 * seriously to take a model has no way to tell, and neither does the author.
 *
 * This answers it the only way the project is allowed to: by building the
 * house again. Perturb one dimension, rebuild, and measure how far a handful
 * of named outputs move. Nothing is estimated and nothing is modelled; every
 * figure is the difference between two builds, so it traces to a rule exactly
 * like the numbers it is about.
 *
 * It is emphatically not a control. The perturbation is fixed, it is stated
 * on screen, and it is an output — there is no slider here and there will not
 * be one.
 *
 * The mechanism is here; what counts as a visible output is not, because that
 * is a judgement about a particular building. Each tradition names its own
 * probes.
 */

import type { Kinds, RulePack } from './kinds'
import { withDimValue } from './whatif'

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
 * One output a reader would actually notice moving.
 *
 * Chosen because you can see it from the courtyard, not because it is
 * convenient to measure.
 */
export interface Probe<L> {
  readonly key: string
  readonly labelId: string
  readonly labelEn: string
  readonly read: (layout: L) => number
}

export interface Sensitivity<K extends Kinds> {
  readonly dim: K['dim']
  /**
   * The largest movement in any probe, in metres — how far the house shifts
   * if this one number is a fifth out.
   */
  readonly worst: number
  /** Which probe moved that far. */
  readonly worstProbe: string
  /** Every probe that moved at all, largest first. */
  readonly moved: readonly { readonly probe: string; readonly metres: number }[]
}

/**
 * How much each dimension matters, largest first.
 *
 * Dimensions with a `count` or `ratio` unit that act as switches rather than
 * measurements are included on the same terms as everything else: if pushing
 * them moves nothing they report zero, which is itself worth seeing.
 *
 * @param layoutFor rebuilds the layout under whatever the pack currently says.
 *   It has to re-read the pack on every call, which is why it is a thunk.
 */
export function sensitivities<K extends Kinds, L>(
  pack: RulePack<K>,
  probes: readonly Probe<L>[],
  layoutFor: () => L,
): readonly Sensitivity<K>[] {
  const read = () => {
    const layout = layoutFor()
    return new Map(probes.map((p) => [p.key, p.read(layout)] as const))
  }

  const base = read()
  const out: Sensitivity<K>[] = []

  for (const key of pack.dimKeys) {
    const scaled = pack.dim(key).value * (1 + PERTURBATION)
    const up = withDimValue(pack, key, scaled, read)
    const moved: { probe: string; metres: number }[] = []
    for (const p of probes) {
      const delta = Math.abs((up.get(p.key) ?? 0) - (base.get(p.key) ?? 0))
      // Below a millimetre is noise, not a consequence.
      if (delta >= 0.001) moved.push({ probe: p.key, metres: delta })
    }
    moved.sort((a, b) => b.metres - a.metres)
    const worst = moved[0]
    out.push({
      dim: key,
      worst: worst ? worst.metres : 0,
      worstProbe: worst ? worst.probe : (probes[0]?.key ?? ''),
      moved,
    })
  }

  out.sort((a, b) => b.worst - a.worst)
  return out
}

export function sensitivityOf<K extends Kinds>(
  table: readonly Sensitivity<K>[],
  key: K['dim'],
): Sensitivity<K> | undefined {
  return table.find((s) => s.dim === key)
}
