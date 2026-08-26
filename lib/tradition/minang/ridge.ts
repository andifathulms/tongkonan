/**
 * The ridge, and the gonjong that stand on its ends.
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
import type { Vec3 } from '@/lib/core/types'

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

export interface GonjongParams {
  /** where the spire springs from, on the ridge */
  readonly base: Vec3
  /** vertical rise from base to tip */
  readonly rise: number
  /** how far the tip stands off the ridge plane in X; signed */
  readonly splay: number
  /** how far the tip leans out beyond its base in Z; signed */
  readonly lean: number
  /** how late the tip pulls away from the ridge plane. 1 is a straight line. */
  readonly splayCurve: number
  /** how late it leans outward */
  readonly leanCurve: number
}

/**
 * The path of one gonjong, as a list of points for a tube sweep.
 *
 * The two exponents are what make it a gonjong and not a stick: the tip pulls
 * away from the ridge plane late and leans outward later still, so the spire
 * leaves the ridge almost vertically and only opens out near the top. A
 * straight line between the same two endpoints reads as a radio mast.
 *
 * They arrive as parameters because they are dimensions — they change the
 * shape of something the reader can see — and a dimension that sits inline in
 * a builder is a number the provenance bar never counted.
 */
export function gonjongPath(p: GonjongParams, steps = 16): Vec3[] {
  const [bx, by, bz] = p.base
  const out: Vec3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    out.push([bx + p.splay * t ** p.splayCurve, by + p.rise * t, bz + p.lean * t ** p.leanCurve])
  }
  return out
}
