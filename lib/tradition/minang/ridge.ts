/**
 * The ridge.
 *
 * The gonjong used to be here too, as a path for a tube sweep. They are not a
 * path any more: a gonjong is the raised end of the roof's own edge, so it
 * lives in `roofStations` where the surface is described. What is left is the
 * ridge, which really is a curve.
 *
 * Written here rather than shared with the Toraja ridge, deliberately. The
 * arithmetic is close enough that sharing it would be tempting and the
 * temptation should be resisted until a third house votes: the tongkonan's
 * ridge is asymmetric by rule — the front prow is always the higher — and
 * this one is symmetric by rule, so the two curves agree by coincidence and
 * disagree in what they claim. A shared `ridgeCurve` would have to drop the
 * claim to hold both, and the claim is the part worth keeping.
 *
 * The other difference is the axis. Here the ridge runs along Z and the house
 * mirrors along it; in the tongkonan the ridge runs along X and the house
 * mirrors across it.
 */

import { catmullRom, clamp01, lerp } from '@/lib/core/geometry'

export interface RidgeParams {
  /** Z of the near end; negative */
  readonly startZ: number
  /** Z of the far end; positive */
  readonly endZ: number
  /** the lowest point of the ridge, at mid-span */
  readonly lowY: number
  /** height of both ends. One value, because they are the same height. */
  readonly endY: number
  /**
   * How much of the rise has happened by quarter-span. Low values keep the
   * belly long and shallow and put the upsweep near the ends, which is what
   * makes the line read as a sweep rather than an arch.
   */
  readonly upsweep: number
}

/**
 * The ridge, sampled by `s` running 0 at one end to 1 at the other.
 *
 * Symmetric about s = 0.5 by construction, because the invariant suite checks
 * the whole house mirrors about z = 0 and a ridge that did not would take the
 * entire roof with it.
 */
export function ridgeCurve(p: RidgeParams): (s: number) => { z: number; y: number } {
  const shoulder = lerp(p.lowY, p.endY, p.upsweep)
  const control: (readonly [number, number])[] = [
    [0, p.endY],
    [0.25, shoulder],
    [0.5, p.lowY],
    [0.75, shoulder],
    [1, p.endY],
  ]
  return (s: number) => ({
    z: lerp(p.startZ, p.endZ, clamp01(s)),
    y: catmullRom(control, clamp01(s)),
  })
}
