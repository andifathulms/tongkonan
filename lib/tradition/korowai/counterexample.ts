/**
 * A check, shown doing its job.
 *
 * The check is `checkTrunkCarries` and what breaks it is `heightTall` — how
 * high a tall house puts its floor.
 *
 * Height is the whole argument of this building: out of reach of raids, of
 * neighbours, of the mud. So the obvious way to build a better one is to build
 * it higher, and every part of the house survives that unchanged — the frame,
 * the floor, the two sides, the partition, the fires that can still be
 * dropped. What runs out is the tree. A wanbon thins as it rises, and past a
 * point the trunk where the floor is framed in is no longer thick enough to
 * carry it.
 *
 * It is the first counterexample in this project where the two numbers belong
 * to different parties. Every earlier one pushes a figure a builder chose
 * against a limit somebody else's building sets. Here the height is the
 * household's and the taper is the tree's, and no amount of care on the
 * building side moves the second one at all.
 */

import { searchCounterexample } from '@/lib/core/counterexample'
import type { Counterexample as CoreCounterexample } from '@/lib/core/counterexample'
import { checkTrunkCarries } from './invariants'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { KorowaiKinds, Rules } from './types'

/** The two diameters the check is comparing. */
export interface Trunk {
  readonly atFloor: number
  readonly bearing: number
  readonly floorY: number
}

export type Counterexample = CoreCounterexample<KorowaiKinds, Trunk>

const DIM: DimKey = 'heightTall'

export function trunkCounterexample(rules: Rules = DEFAULT_RULES): Counterexample {
  const found = searchCounterexample<KorowaiKinds, Trunk>({
    pack: PACK,
    dim: DIM,
    probe: () => {
      // Tested on the tall house standing on a living tree, because that is
      // the only combination in which the tree is the thing carrying it.
      const layout = resolveLayout({ ...rules, tinggi: 'tinggi', pohon: true })
      return {
        result: checkTrunkCarries(layout),
        witness: {
          atFloor: layout.trunk.atFloor,
          bearing: layout.trunk.bearing,
          floorY: layout.floorY,
        },
      }
    },
    // Upward: a lower house is never the problem.
    factors: Array.from({ length: 20 }, (_, i) => 1.1 + i * 0.1),
  })
  if (!found) throw new Error('checkTrunkCarries could not be broken by heightTall alone')
  return found
}
