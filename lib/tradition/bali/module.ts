/**
 * The sikut: the house measured in its owner's body.
 *
 * This is the reason the fifth house is here, and it is not a geometry idea.
 *
 * The other four traditions each let a household say something about itself by
 * picking among fixed numbers — a rank that scales the tongkonan, a lineage
 * system that steps the rumah gadang's floor, a tier count on the joglo, a
 * household count on the mbaru niang. In every one of them the metre is
 * neutral: the social fact selects a value, and the unit the value is written
 * in is nobody's. Asta Kosala Kosali does not work that way. The unit is the
 * owner's own body — the span of their arms, the length of their forearm, the
 * width of their finger — so the house is not scaled to its owner, it is
 * *measured* in them. Two households of identical standing build different
 * buildings because they are different sizes.
 *
 * What that does to this project is specific. Everywhere else, a dimension is
 * a number in metres whose provenance is one of three classes. Here a
 * dimension is a whole number of a named unit, and there are two independent
 * provenance questions behind it: how many units (which the sources give, and
 * which is the canon part), and how long a unit is in metres (which is a
 * human being, and is the author's anthropometry). Those must never be merged
 * into one figure — the same rule that keeps two houses' interpolated shares
 * apart, applied one level down. `rules.ts` declares them separately and the
 * source table says which is which.
 *
 * ── The pengurip ─────────────────────────────────────────────────────────
 *
 * And then the part that has no counterpart anywhere else in this project: a
 * principal dimension is a whole number of units *plus a small addition*,
 * because a measurement that lands exactly on its module is `mati` — dead. The
 * house is required not to be exactly its own rule. `checkPengurip` is that
 * claim, and it is the only invariant here that passes by finding an
 * inexactness rather than by finding an agreement.
 *
 * On the words: depa, hasta, musti, useran and nyari are the names of body
 * measures and are used because they are the names of the things. The ratios
 * between them are anthropometric and are the author's — see the note on each
 * in `rules.ts`. Where a Balinese term for a *part* is not one this author is
 * confident of, the part is named in Indonesian rather than in a word being
 * guessed at, which is the policy the joglo pack set.
 */

/** The named body measures, largest first. */
export type Unit = 'depa' | 'hasta' | 'musti' | 'useran' | 'nyari'

export interface Sikut {
  /** the owner's arm span, fingertip to fingertip, in metres */
  readonly depa: number
  /** elbow to fingertip */
  readonly hasta: number
  /** the closed fist with the thumb laid across */
  readonly musti: number
  /** one rotation of the thumb — the smallest measure that is still a step */
  readonly useran: number
  /** a finger's width */
  readonly nyari: number
  /**
   * The addition that keeps a measure from being exact.
   *
   * One useran. Not a fraction of anything: an increment of the same kind as
   * the units themselves, which is why turning it off leaves whole numbers
   * behind rather than rounding errors.
   */
  readonly pengurip: number
  /** whether that addition is being made */
  readonly alive: boolean
}

export interface Ratios {
  readonly hasta: number
  readonly musti: number
  readonly useran: number
  readonly nyari: number
}

/**
 * The body, resolved.
 *
 * `depa` arrives from the rules in millimetres because that is how a person is
 * measured; everything downstream is metres, like the rest of this project.
 */
export function sikut(depaMm: number, ratios: Ratios, alive: boolean): Sikut {
  const depa = depaMm / 1000
  return {
    depa,
    hasta: depa * ratios.hasta,
    musti: depa * ratios.musti,
    useran: depa * ratios.useran,
    nyari: depa * ratios.nyari,
    pengurip: alive ? depa * ratios.useran : 0,
    alive,
  }
}

export function unitLength(s: Sikut, unit: Unit): number {
  return s[unit]
}

/**
 * A principal dimension: so many of a named unit, plus the pengurip.
 *
 * Every visible length in this house comes through here, and that is what
 * `checkModule` is able to assert. A number written straight into a builder
 * would be a metre nobody's body accounts for — the same fault as an
 * undeclared dimension, one level deeper, and invisible to the provenance bar
 * because the bar counts declarations rather than arithmetic.
 */
export function sikutLength(s: Sikut, count: number, unit: Unit): number {
  return count * unitLength(s, unit) + s.pengurip
}

/**
 * A length that takes no pengurip.
 *
 * Not every measurement in a building is a principal one. The thickness of a
 * board and the section of a rafter are stock sizes rather than set-out
 * dimensions, and adding the increment to them would say something about them
 * that is not true. `checkModule` scopes itself to the principal set for
 * exactly this reason, and reports how many lengths it left out so a narrowed
 * claim cannot read as a whole-building one.
 */
export function stockLength(s: Sikut, count: number, unit: Unit): number {
  return count * unitLength(s, unit)
}

/** Whether a length is a whole number of a unit, to within a tenth of a millimetre. */
export function isWhole(length: number, unit: number): boolean {
  if (unit <= 0) return false
  const n = length / unit
  return Math.abs(n - Math.round(n)) < 1e-4
}
