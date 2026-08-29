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
