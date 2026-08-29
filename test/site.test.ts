import { describe, expect, it } from 'vitest'
import { TRADITIONS } from '@/lib/tradition/registry'

/**
 * The ground figures, checked for the things a drawing cannot show you.
 *
 * These are the only marks in the project that are not parts of a building, so
 * none of the structural invariants sees them: a yard drawn four hundred
 * metres away, or an outline that never closes, would render as nothing at all
 * and read as a house standing on bare ground. That is the failure mode worth
 * catching — not a wrong shape, which a person looking at it would see, but a
 * shape that is silently absent.
 *
 * What is deliberately *not* asserted: that every tradition has one. An empty
 * site is a real answer, and a test demanding one would be the fourth in this
 * project written against the examples that happened to exist.
 */
describe('the site figures', () => {
  for (const tradition of TRADITIONS) {
    const built = tradition.build(tradition.defaultQuery)
    const marks = built.scene.site

    it(`${tradition.key}: draws lines that exist and can be seen`, () => {
      for (const mark of marks) {
        expect(mark.lines.length).toBeGreaterThan(0)
        for (const line of mark.lines) {
          expect(line.length).toBeGreaterThanOrEqual(2)
          for (const [x, z] of line) {
            expect(Number.isFinite(x)).toBe(true)
            expect(Number.isFinite(z)).toBe(true)
            // The site is the ground around this house, not a map. Anything
            // beyond this is a typo that would draw off the edge of the world.
            expect(Math.hypot(x, z)).toBeLessThan(80)
          }
        }
      }
    })

    it(`${tradition.key}: closes what it says is closed`, () => {
      for (const mark of marks) {
        if (!mark.closed) continue
        for (const line of mark.lines) {
          const first = line[0]
          const last = line[line.length - 1]
          if (!first || !last) throw new Error('empty line')
          expect(Math.hypot(first[0] - last[0], first[1] - last[1])).toBeLessThan(1e-9)
        }
      }
    })

    /**
     * A mark has to be about the surroundings. One drawn entirely inside the
     * house's own plan would be a stripe on the floor rather than a site.
     */
    it(`${tradition.key}: says something outside the building`, () => {
      const halfX = built.scene.footprint.x / 2
      const halfZ = built.scene.footprint.z / 2
      for (const mark of marks) {
        const outside = mark.lines.some((line) =>
          line.some(([x, z]) => Math.abs(x) > halfX || Math.abs(z) > halfZ),
        )
        expect(`${tradition.key}/${mark.key}: ${outside ? 'outside' : 'all indoors'}`).toBe(
          `${tradition.key}/${mark.key}: outside`,
        )
      }
    })

    /**
     * The condition the whole setting was accepted under: it may not get in
     * the way of the house.
     *
     * A rice barn is a building and it now stands as a solid, so this is no
     * longer true by construction the way it was when everything was flat. A
     * volume overlapping the house's own plan would be a barn built through
     * a wall; one taller than the house would be a neighbour drawn to hide the
     * thing the reader came for.
     */
    it(`${tradition.key}: keeps its solids out of the house`, () => {
      const halfX = built.scene.footprint.x / 2
      const halfZ = built.scene.footprint.z / 2
      const ridge = built.house.bounds.max[1]
      for (const mark of marks) {
        for (const v of mark.volumes) {
          /*
           * Water is the exception, and it is the only one.
           *
           * This rule was written while every building in the collection stood
           * on land, and it says a solid may not stand where the house stands.
           * A house in a bay stands *in* the water — the fourth test in this
           * project fitted to the examples that happened to exist — so the
           * substance is exempted rather than the building.
           */
          if (v.material === 'air') continue
          // Touching is allowed and meant: a walkway that stops short of the
          // platform it serves is a walkway to nowhere.
          const clearX = Math.abs(v.at[0]) - v.size[0] / 2 >= halfX - 1e-6
          const clearZ = Math.abs(v.at[2]) - v.size[2] / 2 >= halfZ - 1e-6
          expect(`${mark.key}: ${clearX || clearZ ? 'clear' : 'through the house'}`).toBe(
            `${mark.key}: clear`,
          )
          expect(v.at[1] + v.size[1]).toBeLessThanOrEqual(ridge)
          for (const n of [...v.at, ...v.size]) expect(Number.isFinite(n)).toBe(true)
          expect(v.size[0]).toBeGreaterThan(0)
          expect(v.size[1]).toBeGreaterThan(0)
          expect(v.size[2]).toBeGreaterThan(0)
        }
      }
    })

    /**
     * And the vantage the setting made necessary: standing in the yard, is the
     * house actually in view?
     *
     * This is the fault the setting introduced. Barns stand where barns stand,
     * so the default three-quarter view now has them in front of the building;
     * the answer is a place to stand rather than a moved barn, and the place
     * has to be one where nothing is in the way. Anything below a metre is not
     * in the way — a paving slab, a plinth, the water — so only things a
     * person could not see over count.
     */
    it(`${tradition.key}: can be looked at from where it is met`, () => {
      const [ax, , az] = built.scene.approachAt
      const halfX = built.scene.footprint.x / 2
      const halfZ = built.scene.footprint.z / 2
      // Outside the building, and not so far off that the house is a speck.
      expect(Math.abs(ax) > halfX || Math.abs(az) > halfZ).toBe(true)
      expect(Math.hypot(ax, az)).toBeLessThan(45)

      for (const mark of marks) {
        for (const v of mark.volumes) {
          // Nothing under a metre is in the way, and neither is water: you see
          // across a bay, you do not see through a wall.
          if (v.size[1] < 1 || v.material === 'air') continue
          const blocking = crosses([ax, az], [0, 0], v)
          expect(`${mark.key}: ${blocking ? 'in the way' : 'clear'}`).toBe(`${mark.key}: clear`)
        }
      }
    })

    /** Names in both languages, since the legend prints one of them. */
    it(`${tradition.key}: names every mark in both languages`, () => {
      for (const mark of marks) {
        for (const text of [mark.nameId, mark.nameEn, mark.glossId, mark.glossEn]) {
          expect(text.trim().length).toBeGreaterThan(0)
        }
      }
      expect(new Set(marks.map((m) => m.key)).size).toBe(marks.length)
    })
  }
})

/**
 * Does the line from the vantage to the house pass through this solid, in plan?
 *
 * A slab test on the plan rectangle: the solids in a setting are boxes, cones
 * and cylinders standing upright, so what matters is whether the segment from
 * where a person stands to the middle of the house enters that rectangle.
 * Written out because the answer has to be a fact rather than an impression —
 * "it looked fine when I tried it" is how a barn ends up in front of a house.
 */
function crosses(
  from: readonly [number, number],
  to: readonly [number, number],
  v: {
    readonly at: readonly [number, number, number]
    readonly size: readonly [number, number, number]
  },
): boolean {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  let lo = 0
  let hi = 1
  const spans: readonly (readonly [number, number, number, number])[] = [
    [from[0], dx, v.at[0] - v.size[0] / 2, v.at[0] + v.size[0] / 2],
    [from[1], dz, v.at[2] - v.size[2] / 2, v.at[2] + v.size[2] / 2],
  ]
  for (const [o, d, min, max] of spans) {
    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return false
      continue
    }
    const t1 = (min - o) / d
    const t2 = (max - o) / d
    lo = Math.max(lo, Math.min(t1, t2))
    hi = Math.min(hi, Math.max(t1, t2))
  }
  return hi > lo
}
