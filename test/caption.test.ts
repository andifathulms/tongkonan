import { describe, expect, test } from 'vitest'
import { TRADITIONS } from '@/lib/tradition/registry'
import { captionAt } from '@/lib/core/scene'

/*
 * A ground figure's caption may not stand on the house.
 *
 * The renderer is not unit-tested, but where its captions go is arithmetic on
 * a ground plan rather than a drawing decision, so it lives in the core and
 * is checked here. The rule earned a test the way the geometry did: the
 * anchor was the mean of a figure's vertices, which is the centre for every
 * figure that surrounds the building — a yard, a clearing, a bay, a fortress
 * wall, a plot boundary — and the centre is where the house is. Sixteen of
 * the collection's thirty-five were labelling the roof, and nothing failed
 * when they did.
 */
describe('site captions', () => {
  for (const t of TRADITIONS) {
    const built = t.build(t.defaultQuery)
    if (built.scene.site.length === 0) continue
    test(t.key, () => {
      const { drip } = built.scene
      for (const mark of built.scene.site) {
        const [x, z] = captionAt(mark.lines, drip)
        const onHouse = Math.abs(x) <= drip.x && Math.abs(z) <= drip.z
        expect(
          onHouse,
          `${t.key}/${mark.key} ("${mark.nameId}") is captioned at ${x.toFixed(2)}, ${z.toFixed(2)}, inside the drip envelope ${drip.x.toFixed(2)} × ${drip.z.toFixed(2)}`,
        ).toBe(false)

        // And it stays on the ground the figure names, never out in the open
        // beyond it: a caption pointing at nothing is worse than none.
        let minX = Infinity
        let maxX = -Infinity
        let minZ = Infinity
        let maxZ = -Infinity
        for (const line of mark.lines)
          for (const p of line) {
            minX = Math.min(minX, p[0])
            maxX = Math.max(maxX, p[0])
            minZ = Math.min(minZ, p[1])
            maxZ = Math.max(maxZ, p[1])
          }
        expect(x).toBeGreaterThanOrEqual(minX)
        expect(x).toBeLessThanOrEqual(maxX)
        expect(z).toBeGreaterThanOrEqual(minZ)
        expect(z).toBeLessThanOrEqual(maxZ)
      }
    })
  }
})
