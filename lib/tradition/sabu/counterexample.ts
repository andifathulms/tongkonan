/**
 * A check, shown doing its job.
 *
 * The check is `checkHullProportion` and what breaks it is `beam` — how wide
 * the house is made.
 *
 * A wider house is a better house by every ordinary measure: more floor for
 * the same length, more room around the hearth, less crowding. Nothing about
 * the building objects. The posts still carry it, the keel still cambers, the
 * stern still stands above the bow, the roof still comes down to the floor.
 * What stops being true is that the plan is a hull's. Past a point the
 * proportion is a room's, and a house that calls itself a boat has stopped
 * looking like one — which on this island is not a figure of speech.
 *
 * Keep widening and a second thing goes: the roof falls at its own pitch, so a
 * broader hull has a lower eave, and the gap under it that is the only way in
 * closes. The likeness fails first and the door fails afterwards, which is the
 * right order for what this pack is about.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkHullProportion } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, MIN_RUANG, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, SabuKinds } from './types'

/** The proportion the check is comparing, and the range it has to be in. */
export interface Hull {
  readonly ratio: number
  readonly least: number
}

export type Counterexample = CoreCounterexample<SabuKinds, Hull>

const DIM: DimKey = 'beam'

export function hullCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<SabuKinds, Hull>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      // Tested on the shortest house the rules allow, because that is the one
      // with the least length to hold the proportion up.
      const layout = resolveLayout({ ...rules, ruang: MIN_RUANG })
      return { result: checkHullProportion(layout), witness: { ratio: layout.ratio.actual, least: layout.ratio.least } }
    },
    // Upward: a narrower house is more boat-like, not less.
    factors: Array.from({ length: 14 }, (_, i) => 1.04 + i * 0.05),
  })
  if (!found) throw new Error('checkHullProportion could not be broken by beam alone')
  return found
}
