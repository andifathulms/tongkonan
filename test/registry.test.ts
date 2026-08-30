import { describe, expect, it } from 'vitest'
import { TRADITIONS, TRADITION_KEYS, isTraditionKey, tradition } from '@/lib/tradition/registry'
import { sectionAxis } from '@/lib/core/scene'

/**
 * The registry's promise is that a route, a rail or a renderer can hold a
 * house without knowing which one it has. These tests are that promise: every
 * assertion below is written against the neutral shape, and none of them
 * mentions a rank or a laras.
 */

describe('every tradition answers the same questions', () => {
  for (const t of TRADITIONS) {
    describe(t.key, () => {
      const built = t.build(t.defaultQuery)

      it('builds a house with parts, joints and bounds', () => {
        /*
         * Twenty was fifty until a boat joined the collection.
         *
         * The threshold was a stand-in for "this actually built something",
         * and fifty was the number the buildings that existed happened to
         * clear. A lepa is a hull, a deck, an awning and a hearth: forty-one
         * parts, and complete. The fifth test in this project fitted to its
         * own examples rather than to what it meant.
         */
        expect(built.house.parts.length).toBeGreaterThan(20)
        expect(built.house.joints.length).toBeGreaterThan(0)
        expect(built.house.bounds.max[1]).toBeGreaterThan(built.house.bounds.min[1])
      })

      it('passes its own invariants and skips the survey', () => {
        expect(built.checks.filter((c) => c.status === 'fail')).toEqual([])
        expect(built.checks.filter((c) => c.status === 'skip').map((c) => c.key)).toEqual(['survey'])
      })

      it('reports a provenance split that adds up and claims nothing measured', () => {
        const { measured, canon, interpolated, total } = built.split
        expect(measured + canon + interpolated).toBe(total)
        expect(measured).toBe(0)
        expect(built.parts.total).toBe(built.house.parts.length)
      })

      it('classes every part it built', () => {
        for (const part of built.house.parts) {
          expect(['measured', 'canon', 'interpolated']).toContain(built.classOf(part))
        }
      })

      it('gives the renderer a scene it can place without a Layout', () => {
        const s = built.scene
        expect(s.footprint.x).toBeGreaterThan(0)
        expect(s.footprint.z).toBeGreaterThan(0)
        expect(s.ridgeReach).toBeGreaterThan(0)
        /*
         * Non-negative, not positive.
         *
         * Asserted as "greater than zero" while every building here stood on
         * posts or masonry, which made it look like a fact about buildings. It
         * was a fact about the twelve that existed. A honai sits on the earth
         * because the ground holds heat, and its zero is a decision rather than
         * a missing value — the third time in this project a test has been
         * over-fitted to the examples it was written against.
         */
        expect(s.underfloorHeight).toBeGreaterThanOrEqual(0)
        expect(s.weatherTop).toBeGreaterThan(s.underfloorHeight)
        // The section is cut on the axis the ridge does not run along.
        expect(sectionAxis(s)).not.toBe(s.ridgeAxis)
      })

      it('divides the house into contiguous named zones from the ground up', () => {
        const zones = built.scene.zones
        expect(zones.length).toBeGreaterThan(0)
        expect(zones[0]?.fromY).toBe(0)
        for (let i = 1; i < zones.length; i++) {
          expect(zones[i]?.fromY).toBe(zones[i - 1]?.toY)
        }
        expect(zones[zones.length - 1]?.toY).toBeCloseTo(built.house.bounds.max[1], 6)
      })

      it('round-trips its own address and states every rule', () => {
        const again = t.build(built.query)
        expect(again.query).toBe(built.query)
        const q = new URLSearchParams(built.query)
        expect([...q.keys()].sort()).toEqual(t.params.map((p) => p.param).sort())
      })

      it('names every stage it builds in, in build order', () => {
        const used = new Set(built.house.parts.map((p) => p.stage))
        const named = new Set(t.stages.map((s) => s.stage))
        for (const stage of used) expect(named).toContain(stage)
        expect(t.stages.map((s) => s.stage)).toEqual([...t.stageOrder])
      })

      it('has something to say about itself and about the façade', () => {
        expect(built.readout.length).toBeGreaterThan(3)
        expect(built.readings.length).toBeGreaterThan(3)
        for (const row of built.readout) {
          expect(row.label.id).toBeTruthy()
          expect(row.label.en).toBeTruthy()
          expect(row.value).toBeTruthy()
        }
        for (const reading of built.readings) {
          expect(reading.title.id).toBeTruthy()
          expect(reading.title.en).toBeTruthy()
          expect(reading.body.id).toBeTruthy()
        }
      })

      it('cites only sources that exist in its own table', () => {
        const keys = new Set(t.sources.map((s) => s.key))
        for (const { dim } of t.dims) expect(keys).toContain(dim.source)
      })

      it('can show one of its checks refusing a house', () => {
        const c = t.counterexample()
        expect(c.sound.status).toBe('pass')
        expect(c.broken.status).toBe('fail')
        expect(c.value).not.toBe(c.actual)
        expect(c.witness.sound.length).toBeGreaterThan(0)
      })
    })
  }
})

describe('the traditions are distinct all the way up', () => {
  it('lists every key exactly once', () => {
    expect(TRADITIONS.map((t) => t.key).sort()).toEqual([...TRADITION_KEYS].sort())
    expect(TRADITIONS.length).toBe(new Set(TRADITIONS.map((t) => t.key)).size)
  })

  it('validates keys rather than trusting a path segment', () => {
    expect(isTraditionKey('toraja')).toBe(true)
    expect(isTraditionKey('bangun')).toBe(false)
    expect(() => tradition('nowhere' as never)).toThrow()
  })

  it('does not share parameter names or a site with any other', () => {
    for (const a of TRADITIONS) {
      for (const b of TRADITIONS) {
        if (a.key === b.key) continue
        expect(a.params.map((p) => p.param)).not.toEqual(b.params.map((p) => p.param))
        expect(a.site.name).not.toBe(b.site.name)
      }
    }
  })

  it('does not agree on which way a house is long, which is why the scene model carries it', () => {
    /*
     * Written against two houses, this asserted every tradition had a
     * different axis — which was true of two and is false of three: the rumah
     * gadang and the joglo both run their ridge on Z, and the tongkonan runs
     * it on X. Uniqueness was never the claim worth making. What matters is
     * that the houses disagree at all, because a renderer cannot then assume
     * one and the field has to exist.
     */
    const axes = new Set(TRADITIONS.map((t) => t.build(t.defaultQuery).scene.ridgeAxis))
    expect(axes.size).toBeGreaterThan(1)
  })

  it('does not agree on whether there is a room under the floor', () => {
    /*
     * Some stand on posts with a named room beneath; some on a plinth you
     * cannot get under; one on a low platform you sit on the edge of; and one
     * flat on the earth, on purpose, because the ground holds heat.
     * `underfloorHeight` reports the clearance honestly in every case, and the
     * spread across them is the whole range from a storey to nothing at all.
     *
     * Stated as a difference rather than a ratio now, because a ratio needs a
     * non-zero smallest and the smallest is now zero — which is itself the
     * answer this test is asking about.
     */
    const heights = TRADITIONS.map((t) => t.build(t.defaultQuery).scene.underfloorHeight)
    expect(Math.min(...heights)).toBe(0)
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(2)
  })

  it('keeps provenance separate: one bar per house, never one average', () => {
    /*
     * This used to require every pack to have a *different* number of
     * dimensions, which was true of three by chance and stopped being true at
     * four. Distinct totals were never the claim: what matters is that each
     * house counts its own dimensions and that no bar is ever an average over
     * more than one of them. Two packs arriving at the same count is a
     * coincidence, not a merge.
     */
    for (const t of TRADITIONS) {
      expect(t.split.total).toBe(t.dims.length)
      expect(t.split.measured + t.split.canon + t.split.interpolated).toBe(t.split.total)
    }
    // Every pack's dimensions are its own objects, whatever the counts are.
    const seen = new Set<unknown>()
    for (const t of TRADITIONS) {
      for (const { dim } of t.dims) {
        expect(seen.has(dim)).toBe(false)
        seen.add(dim)
      }
    }
  })
})
