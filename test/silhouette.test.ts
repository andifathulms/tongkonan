import { describe, expect, test } from 'vitest'
import { TRADITIONS } from '@/lib/tradition/registry'
import { silhouette } from '@/lib/core/silhouette'

/*
 * The elevation silhouette, over every tradition in the registry.
 *
 * The silhouette is the landing's picture of a house, and its claim is that
 * it is drawn from the built parts and nothing else. So the checks here are
 * containment and reach: every traced point stays inside the house's own
 * bounds, and the trace actually gets to the top of the house and both ends
 * of it — a silhouette that misses the roof peak is a picture of some other
 * house. Tolerances are a few grid cells, because the trace runs on cell
 * corners, never further.
 */
describe('silhouette', () => {
  for (const t of TRADITIONS) {
    test(t.key, () => {
      const b = t.build(t.defaultQuery)
      const axis = b.scene.ridgeAxis ?? 0
      const s = silhouette(b.house, axis)
      const h0 = b.house.bounds.min[axis]
      const h1 = b.house.bounds.max[axis]
      const v1 = b.house.bounds.max[1]
      const cell = (h1 - h0) / 400
      const tol = cell * 3

      expect(s.loops.length).toBeGreaterThan(0)
      for (const loop of s.loops) {
        expect(loop.length).toBeGreaterThanOrEqual(3)
        for (const [x, y] of loop) {
          expect(x).toBeGreaterThanOrEqual(h0 - tol)
          expect(x).toBeLessThanOrEqual(h1 + tol)
          expect(y).toBeGreaterThanOrEqual(0 - tol)
          expect(y).toBeLessThanOrEqual(v1 + tol)
        }
      }
      // the trace reaches the extremes of the house it claims to draw
      expect(Math.abs(s.max[1] - v1)).toBeLessThanOrEqual(tol)
      expect(Math.abs(s.min[0] - h0)).toBeLessThanOrEqual(tol)
      expect(Math.abs(s.max[0] - h1)).toBeLessThanOrEqual(tol)
      // the ground line is real: something stands on it
      expect(s.min[1]).toBeLessThanOrEqual(tol)

      // pure: the same house traces to the same loops
      expect(silhouette(b.house, axis)).toEqual(s)
    })
  }
})
