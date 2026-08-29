import { describe, expect, it } from 'vitest'
import { COASTLINE, FRAME } from '@/lib/geo/nusantara'
import { TRADITIONS } from '@/lib/tradition/registry'

/**
 * The map and the arithmetic, held together.
 *
 * The sites on the landing are the same coordinates the solar engine runs on —
 * that was true when the map was a bare graticule and it has to stay true now
 * that there is land under them. What this suite is really guarding against is
 * a projection that looks plausible: swap latitude for longitude, or flip a
 * sign, and a plotted marker still lands somewhere on a map of Indonesia. It
 * only stops looking right when you ask whether each house is standing on its
 * own island.
 */
describe('the coastline', () => {
  it('is closed loops of plausible degrees', () => {
    expect(COASTLINE.length).toBeGreaterThan(50)
    for (const ring of COASTLINE) {
      expect(ring.length).toBeGreaterThanOrEqual(4)
      for (const [lon, lat] of ring) {
        expect(lon).toBeGreaterThanOrEqual(FRAME.west)
        expect(lon).toBeLessThanOrEqual(FRAME.east)
        expect(lat).toBeGreaterThanOrEqual(FRAME.south)
        expect(lat).toBeLessThanOrEqual(FRAME.north)
      }
    }
  })

  it('frames every site the collection plots', () => {
    for (const t of TRADITIONS) {
      expect(t.site.longitude).toBeGreaterThan(FRAME.west)
      expect(t.site.longitude).toBeLessThan(FRAME.east)
      expect(t.site.latitude).toBeGreaterThan(FRAME.south)
      expect(t.site.latitude).toBeLessThan(FRAME.north)
    }
  })

  /**
   * The check worth having: every house is on land.
   *
   * A tolerance of a tenth of a degree — eleven kilometres — because the
   * coastline is simplified and several of these sites are within sight of the
   * sea. It is nowhere near loose enough to let a transposed coordinate pass:
   * the nearest land to Bawömataluo's mirror image is hundreds of kilometres
   * away.
   */
  it('puts every house on land', () => {
    const near = 0.1
    for (const t of TRADITIONS) {
      const p: [number, number] = [t.site.longitude, t.site.latitude]
      expect(`${t.key}: ${onLand(p, near) ? 'on land' : 'in the sea'}`).toBe(`${t.key}: on land`)
    }
  })
})

/** Even–odd point in polygon, with a margin for a simplified shore. */
function onLand([x, y]: [number, number], margin: number): boolean {
  for (const ring of COASTLINE) {
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i]
      const b = ring[j]
      if (!a || !b) continue
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside
      }
    }
    if (inside) return true
    for (const [vx, vy] of ring) if (Math.hypot(vx - x, vy - y) < margin) return true
  }
  return false
}
