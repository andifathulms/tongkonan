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
        expect(built.house.parts.length).toBeGreaterThan(50)
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
        expect(s.underfloorHeight).toBeGreaterThan(0)
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

  it('does not share parameter names, sources or a site', () => {
    const [a, b] = TRADITIONS
    if (!a || !b) throw new Error('two traditions expected')
    expect(a.params.map((p) => p.param)).not.toEqual(b.params.map((p) => p.param))
    expect(a.site.name).not.toBe(b.site.name)
    expect(a.site.tzOffsetHours).not.toBe(b.site.tzOffsetHours)
  })

  it('runs the ridge along a different axis in each, which is the whole reason for a scene model', () => {
    const axes = TRADITIONS.map((t) => t.build(t.defaultQuery).scene.ridgeAxis)
    expect(new Set(axes).size).toBe(TRADITIONS.length)
  })

  it('keeps provenance separate: two bars, never one average', () => {
    for (const t of TRADITIONS) expect(t.split.total).toBe(t.dims.length)
    const totals = TRADITIONS.map((t) => t.split.total)
    expect(new Set(totals).size).toBe(TRADITIONS.length)
  })
})
