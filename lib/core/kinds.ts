/**
 * What a tradition is allowed to name for itself.
 *
 * The generator's neutral layer used to be neutral only by intention. In
 * practice `Part.stage` was one of nine Toraja words, `Part.material` one of
 * seven, `Dim.source` one of five Toraja bibliography entries, and
 * `Part.dims` was typed `keyof typeof DIMS` — so the file whose job was to be
 * the shared vocabulary imported the Toraja rule pack to say what a part is.
 * A second tradition could not have been added without widening four global
 * unions to hold both houses at once, which would have let a Minang part
 * claim a Toraja stage and type-check.
 *
 * So the four unions become one type parameter. A tradition declares its own
 * stages, materials, sources, dimensions and joint kinds; the core is generic
 * over them and can name none of them. Exhaustiveness survives at the
 * tradition boundary — a renderer switching on `MaterialKey` still gets told
 * when it misses a case — because each tradition binds `Kinds` to its own
 * closed unions and re-exports concrete aliases.
 *
 * Rules live in here too, rather than as a second type parameter. A rank/bay/
 * horn count and a Minang lineage-system switch have nothing in common but
 * the fact that a household would say them out loud, so there is no shared
 * `Rules` interface to write — only a slot for the one each tradition has.
 */

import type { Dim, Source } from './types'

export interface Kinds {
  /** the build stages, in the tradition's own words */
  readonly stage: string
  /** the materials the tradition builds from */
  readonly material: string
  /** keys into the tradition's own source table */
  readonly source: string
  /** keys into the tradition's own dimension table */
  readonly dim: string
  /** the joinery the tradition uses */
  readonly joint: string
  /** the socially meaningful input set — different in kind per tradition */
  readonly rules: object
}


/**
 * One tradition's rule pack, as the core is allowed to see it.
 *
 * Lookups are functions rather than records on purpose: the core never
 * enumerates a tradition's tables, it only asks. That keeps the shape of the
 * tables a tradition's own business, and it is what lets the generic checks
 * report on a house they cannot name a single part of.
 */
export interface RulePack<K extends Kinds> {
  /** stable identifier, used in the address and in file names */
  readonly key: string
  readonly dimKeys: readonly K['dim'][]
  readonly dim: (key: K['dim']) => Dim<K['source']>
  readonly sources: readonly Source<K['source']>[]
  readonly sourceFor: (key: K['source']) => Source<K['source']>
  /** the build sequence; index in this array is the order a crew works in */
  readonly stageOrder: readonly K['stage'][]
  /**
   * Relative duration of each stage in the raising sequence. Not proportional
   * to part count — the sequence is meant to read like the work.
   */
  readonly stageWeight: (stage: K['stage']) => number
}
