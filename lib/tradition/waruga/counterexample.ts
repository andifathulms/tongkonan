/**
 * A check, shown doing its job.
 *
 * The check is `checkOneBlock` and what breaks it is `layerRise` — how much
 * height the chamber gains for each further person laid in it.
 *
 * The tomb is cut on the day the first of a family dies, and it has to be deep
 * enough for the ones who are not dead yet. Give each of them a little more
 * room and nothing about the building goes wrong: the chamber still takes a
 * seated body, the lid still fits, the face still looks north, the walls still
 * close. What happens is that the whole thing no longer comes out of one
 * stone — and a waruga is cut from one stone, never jointed.
 *
 * Twenty-two buildings, twenty-two rules that cannot be carried out. The
 * Baduy house runs into the length of a pole and the woloan house into the
 * length of a lorry; this one runs into the size of a block, and the reason it
 * gets there is the one thing nobody can plan for — how many of a family there
 * turn out to be.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkOneBlock } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, MAX_JUMLAH, PACK } from './rules'
import type { DimKey } from './rules'
import type { Rules, WarugaKinds } from './types'

/** The two heights the check is comparing. */
export interface Stone {
  readonly cut: number
  readonly block: number
}

export type Counterexample = CoreCounterexample<WarugaKinds, Stone>

const DIM: DimKey = 'layerRise'

export function blockCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<WarugaKinds, Stone>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      /*
       * Tested at the largest family the rule allows, because that is the case
       * the stone has to have been chosen for. A tomb cut for three that will
       * hold six is a tomb somebody has to break open.
       */
      const layout = resolveLayout({ ...rules, jumlah: MAX_JUMLAH })
      return {
        result: checkOneBlock(layout),
        witness: { cut: layout.block.height, block: layout.blockLimit },
      }
    },
    // Upward: less room per burial is never the problem.
    factors: Array.from({ length: 16 }, (_, i) => 1.15 + i * 0.2),
  })
  if (!found) throw new Error('checkOneBlock could not be broken by layerRise alone')
  return found
}
