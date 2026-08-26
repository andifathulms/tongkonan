/**
 * The ridge, as the Toraja house draws it.
 *
 * This was in the shared geometry file, where it did not belong: a curve that
 * sags in the middle and rises to a prow at each end, with the front always
 * higher, is not a primitive — it is a claim about one building. The
 * primitives it is built from (`catmullRom`, `lerp`, `smoothstep`) stay in
 * the core; the claim lives here, next to the rule pack that sources it.
 */

import { catmullRom, clamp01, lerp, smoothstep } from '@/lib/core/geometry'


export interface RidgeParams {
  /** X of the front (north) prow tip; negative */
  readonly frontX: number
  /** X of the rear (south) prow tip; positive */
  readonly rearX: number
  /** the lowest point of the ridge, at mid-span */
  readonly lowY: number
  readonly frontTipY: number
  readonly rearTipY: number
  /**
   * How much of the rise has happened by quarter-span. Low values keep the
   * belly of the ridge long and shallow and put the upsweep near the tips,
   * which is what makes the profile read as a prow rather than an arch.
   */
  readonly upsweep: number
}

/**
 * The ridge, sampled by `s` running 0 at the front tip to 1 at the rear tip.
 *
 * The curve sags in the interior and rises at both ends, with the front
 * always higher — that ordering is canon and the invariant suite checks it,
 * so it must fall out of the curve rather than being asserted afterwards.
 */
export function ridgeCurve(p: RidgeParams): (s: number) => { x: number; y: number } {
  const control: (readonly [number, number])[] = [
    [0, p.frontTipY],
    [0.25, lerp(p.lowY, p.frontTipY, p.upsweep)],
    [0.5, p.lowY],
    [0.75, lerp(p.lowY, p.rearTipY, p.upsweep)],
    [1, p.rearTipY],
  ]
  return (s: number) => ({
    x: lerp(p.frontX, p.rearX, clamp01(s)),
    y: catmullRom(control, clamp01(s)),
  })
}

/**
 * How wide the roof is at station `s`, as a fraction of its full width.
 *
 * Across the body the roof is at full width. Over the two overhangs it closes
 * down toward the tip, so the prow is a blade rather than a truncated box.
 */
export function prowTaper(s: number, bodyStart: number, bodyEnd: number, tip: number): number {
  const t = clamp01(s)
  if (t >= bodyStart && t <= bodyEnd) return 1
  const f = t < bodyStart ? t / Math.max(bodyStart, 1e-6) : (1 - t) / Math.max(1 - bodyEnd, 1e-6)
  return lerp(tip, 1, smoothstep(f))
}

