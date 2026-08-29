import { describe, expect, it } from 'vitest'
import { silhouette } from '@/lib/core/silhouette'
import { ROW_TARGET, packShelf } from '@/lib/draw/shelf'
import { TRADITIONS } from '@/lib/tradition/registry'

const GAP = 3
const PAD = 1

/** The collection as the landing draws it: every house at its default rules. */
function houses() {
  return TRADITIONS.map((t) => {
    const built = t.build(t.defaultQuery)
    const s = silhouette(built.house, built.scene.ridgeAxis ?? 0)
    return { key: t.key, width: s.max[0] - s.min[0], height: s.max[1] }
  })
}

describe('the shelf', () => {
  /**
   * The claim the hero exists to make. A wrapped shelf could break it silently
   * — each row sized to its own contents would draw a row of small houses
   * large — so every row is laid out in one width and this test says so.
   */
  it('draws every row in one viewBox width, which is one scale', () => {
    const shelf = packShelf(houses(), { gap: GAP, pad: PAD })
    expect(shelf.rows.length).toBeGreaterThan(1)
    for (const row of shelf.rows) expect(row.width).toBeLessThanOrEqual(shelf.width)
  })

  it('keeps every house, once, in registry order', () => {
    const items = houses()
    const shelf = packShelf(items, { gap: GAP, pad: PAD })
    expect(shelf.rows.flatMap((r) => r.items).map((i) => i.key)).toEqual(items.map((i) => i.key))
  })

  it('fills a row before starting another', () => {
    const shelf = packShelf(houses(), { gap: GAP, pad: PAD })
    for (const row of shelf.rows) {
      // Either the row is inside the target, or one house alone overruns it —
      // which is allowed, because the alternative is drawing that house small.
      expect(row.width - PAD <= ROW_TARGET || row.items.length === 1).toBe(true)
    }
  })

  /** A house too wide for a row is not squeezed; it takes the row. */
  it('gives a house wider than the target a row of its own', () => {
    const shelf = packShelf(
      [
        { key: 'a', width: 5, height: 3 },
        { key: 'wide', width: 200, height: 4 },
        { key: 'b', width: 5, height: 3 },
      ],
      { target: 50, gap: GAP, pad: PAD },
    )
    expect(shelf.rows.map((r) => r.items.map((i) => i.key))).toEqual([['a'], ['wide'], ['b']])
  })

  /** Nothing counts to fourteen: one house is one row and the arithmetic holds. */
  it('packs a collection of one', () => {
    const shelf = packShelf([{ key: 'only', width: 12, height: 8 }], { gap: GAP, pad: PAD })
    expect(shelf.rows).toHaveLength(1)
    expect(shelf.width).toBeCloseTo(14, 9)
  })
})
