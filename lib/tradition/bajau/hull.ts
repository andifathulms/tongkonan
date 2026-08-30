/**
 * The hull, from the roof primitive.
 *
 * `sweepSurface` sweeps a transverse section along a ridge line and drops it
 * to an eave, with a knee where the slope breaks. Turn that upside down and it
 * is a boat: the ridge is the keel, the eave is the sheer, the drop is the
 * rise of the topsides, and the knee is the turn of the bilge.
 *
 * Nothing in the primitive had to change, which is the finding. It was written
 * for a tongkonan's saddle roof; the Minang pack turned it a quarter and asked
 * whether the axis belonged in `SweepOptions`; the joglo declined to vote; and
 * here it makes something that is not a roof at all. A section swept along a
 * curve with a break in it turns out to be a shape, not a roof — which is
 * exactly the sort of thing a collection of buildings is for finding out.
 */

import { sweepSurface } from '@/lib/core/geometry'
import type { MeshData, Station } from '@/lib/core/geometry'
import { DIMS } from './rules'
import type { Layout } from './types'

/**
 * The stations along the keel.
 *
 * `ridgeY` is the keel — which rises toward both ends, the rocker — and
 * `eaveY` is the sheer, which rises further. `halfWidth` is the half-beam,
 * falling to almost nothing at bow and stern.
 */
export function hullStations(layout: Layout): readonly Station[] {
  const n = 24
  const stations: Station[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    // −1 at the bow, +1 at the stern: everything about a hull is symmetric
    // about amidships except which end you point.
    const u = t * 2 - 1
    const along = u * (layout.length / 2)
    const taper = Math.cos((u * Math.PI) / 2)
    stations.push({
      x: along,
      ridgeY: layout.keelY + DIMS.keelRocker.value * u * u,
      eaveY: layout.sheerY + DIMS.sheerRise.value * u * u,
      // A little beam kept at the ends, because a plank boat has stems rather
      // than points: a hull tapering to zero would be a needle.
      halfWidth: layout.halfBeam * (0.12 + 0.88 * Math.pow(taper, 0.7)),
    })
  }
  return stations
}

/** One side of the hull, as a surface. */
export function hullSide(layout: Layout, side: 1 | -1, strake?: { from: number; to: number }): MeshData {
  return sweepSurface(hullStations(layout), {
    side,
    across: 12,
    knee: { at: DIMS.bilgeAt.value, drop: DIMS.bilgeDrop.value },
    uvScale: 0.5,
    fFrom: strake?.from,
    fTo: strake?.to,
  })
}
