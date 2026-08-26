/**
 * The honesty layer, generically.
 *
 * These functions are the reason a dimension is wrapped rather than written
 * as a bare number: they are what the provenance bar, the source route and
 * the invariant suite all read. None of them knows what is being built.
 */

import type { Kinds, RulePack } from './kinds'
import type { Dim, Part, ProvenanceClass } from './types'

export interface Split {
  readonly measured: number
  readonly canon: number
  readonly interpolated: number
  readonly total: number
}

/**
 * A tradition's own `dim(...)` constructor, bound to its source keys.
 *
 * The binding is what stops a Toraja dimension citing a Minang source: the
 * key is checked at the point the number is declared, which is the only place
 * anyone is in a position to know whether the citation is real.
 *
 * Parameterised on the source key alone rather than on the whole `Kinds` bag,
 * because a `Dim` genuinely only knows where it came from — and because
 * `Kinds['dim']` is `keyof typeof DIMS`, so a `Dim` that knew its tradition's
 * dimension keys would be defined in terms of the table it is an entry in.
 */
export function dimFactory<S extends string>() {
  return (
    value: number,
    unit: Dim<S>['unit'],
    cls: ProvenanceClass,
    source: S,
    note: string,
    noteEn: string,
  ): Dim<S> => ({ value, unit, class: cls, source, note, noteEn })
}

/**
 * The class of a part, given the dimensions that produced it.
 *
 * A part is only as sourced as its least-sourced input. A post whose section
 * is invented and whose spacing is invented is an invented post, and the fact
 * that its pairing is canon does not redeem the metres. Taking the worst is
 * the only rule that cannot flatter the model.
 */
export function worstClass<K extends Kinds>(
  pack: RulePack<K>,
  keys: readonly K['dim'][],
): ProvenanceClass {
  let worst: ProvenanceClass = 'measured'
  for (const key of keys) {
    const cls = pack.dim(key).class
    if (cls === 'interpolated') return 'interpolated'
    if (cls === 'canon') worst = 'canon'
  }
  return worst
}

/** The provenance class of one part, for the overlay and for the source route. */
export function partClass<K extends Kinds>(
  pack: RulePack<K>,
  part: Pick<Part<K>, 'dims'>,
): ProvenanceClass {
  return worstClass(pack, part.dims)
}

/**
 * How the house divides by provenance class, counted in parts rather than in
 * dimensions.
 *
 * This answers a different question from `provenanceSplit`, and the two will
 * disagree: one canon dimension can govern a hundred parts and one
 * interpolated dimension can govern three. Both numbers are true and neither
 * is the whole picture, so the app shows the dimension split as the metric
 * and this one only where the model itself is being marked up.
 */
export function partSplit<K extends Kinds>(
  pack: RulePack<K>,
  parts: readonly Pick<Part<K>, 'dims'>[],
): Split {
  const count = (c: ProvenanceClass) => parts.filter((p) => partClass(pack, p) === c).length
  return {
    measured: count('measured'),
    canon: count('canon'),
    interpolated: count('interpolated'),
    total: parts.length,
  }
}

/**
 * The provenance split, as counts. The rail draws this and it is the metric.
 *
 * Deliberately over one tradition's dimensions at a time. Two traditions have
 * two source tables and two interpolated shares, and averaging them would
 * produce the single most dishonest number this project could print: a house
 * nobody has surveyed hidden behind a house somebody has.
 */
export function provenanceSplit(dims: readonly Dim[]): Split {
  const count = (c: ProvenanceClass) => dims.filter((d) => d.class === c).length
  return {
    measured: count('measured'),
    canon: count('canon'),
    interpolated: count('interpolated'),
    total: dims.length,
  }
}
