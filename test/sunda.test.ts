import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/sunda/assembly'
import {
  checkFloorIsLevel,
  checkGroundIsNotCut,
  checkNoIron,
  checkPostsFollowTheGround,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/sunda/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  LERENG,
  normaliseRules,
  partSplit,
  provenanceSplit,
  slopeOf,
} from '@/lib/tradition/sunda/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/sunda/address'
import { groundAt, resolveLayout } from '@/lib/tradition/sunda/frame'
import { slopeCounterexample } from '@/lib/tradition/sunda/counterexample'
import { sceneModel } from '@/lib/tradition/sunda/scene'
import { STAGE_ORDER } from '@/lib/tradition/sunda/types'
import type { Rules } from '@/lib/tradition/sunda/types'

/** Both villages, all three slopes, with and without the platform. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { wilayah: 'luar', lereng: 'landai', sosoro: true },
  { wilayah: 'luar', lereng: 'curam', sosoro: false },
  { wilayah: 'dalam', lereng: 'curam', sosoro: true },
  { wilayah: 'dalam', lereng: 'landai', sosoro: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.wilayah}, ${rules.lereng} ground, sosoro ${rules.sosoro}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a house on ground it may not touch', () => {
  /**
   * The claim this building exists for, in three pieces: the ground is a part,
   * the stones sit on it as it is, and the floor is level anyway.
   */
  it('carries the hillside in its own part list', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      const ground = house.parts.filter((p) => p.stage === 'tanah')
      expect(ground).toHaveLength(1)
      expect(ground[0]?.material).toBe('tanah')
      // And it is the first thing placed: nothing is built before the ground.
      expect(house.parts[0]?.stage).toBe('tanah')
    }
  })

  it('sets every stone on the ground as it lies', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkGroundIsNotCut(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        if (part.stage !== 'batu') continue
        const b = partBounds(part)
        const x = (b.min[0] + b.max[0]) / 2
        expect(Math.abs(b.min[1] - groundAt(layout, x))).toBeLessThan(0.02)
      }
    }
  })

  it('keeps one level floor over ground that is not level', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkFloorIsLevel(house, layout).status).toBe('pass')
      const drop = layout.length * layout.slope
      if (rules.lereng !== 'landai') expect(drop).toBeGreaterThan(1)
    }
  })

  /**
   * The cost of the prohibition, and the reason it is worth modelling: on
   * sloping ground no two posts are alike, and on level ground they would all
   * be the same.
   */
  it('cuts every post to what the ground leaves it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkPostsFollowTheGround(house, layout).status).toBe('pass')
      const lengths = house.parts
        .filter((p) => p.stage === 'tihang')
        .map((p) => {
          const b = partBounds(p)
          return Number((b.max[1] - b.min[1]).toFixed(3))
        })
      expect(new Set(lengths).size).toBeGreaterThan(1)
      expect(Math.max(...lengths)).toBeLessThanOrEqual(layout.poleLength + 1e-6)
      // The spread between the longest and the shortest is the slope itself.
      expect(Math.max(...lengths) - Math.min(...lengths)).toBeCloseTo(
        layout.length * layout.slope,
        2,
      )
    }
  })

  it('puts no iron in the frame at all', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkNoIron(house).status).toBe('pass')
      expect(new Set(house.joints.map((j) => j.kind))).toEqual(new Set(['takik', 'talian']))
    }
  })

  /**
   * The slope rule holds the dimension key rather than a copy of its value —
   * the correction the Banjar pack had to make, applied before it could go
   * wrong here.
   */
  it('reads each slope live from the pack', () => {
    for (const info of LERENG) {
      expect(slopeOf(info.lereng)).toBeCloseTo(DIMS[info.key].value, 9)
    }
    const gentle = resolveLayout({ ...DEFAULT_RULES, lereng: 'landai' })
    const steep = resolveLayout({ ...DEFAULT_RULES, lereng: 'curam' })
    expect(steep.slope).toBeGreaterThan(gentle.slope)
  })

  /** The inner villages have one door; the outer have two. Not a rank. */
  it('gives the stricter village fewer doors, not a smaller house', () => {
    const dalam = resolveLayout({ ...DEFAULT_RULES, wilayah: 'dalam' })
    const luar = resolveLayout({ ...DEFAULT_RULES, wilayah: 'luar' })
    expect(dalam.doors).toBe(1)
    expect(luar.doors).toBe(2)
    expect(dalam.length).toBeCloseTo(luar.length, 9)
    expect(dalam.floorY).toBeCloseTo(luar.floorY, 9)
  })

  /**
   * The seventh meaning of `underfloorHeight`, and the first that is not one
   * number about the building: the clearance differs at every post.
   */
  it('reports the clearance at the downhill end, where it is greatest', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeCloseTo(
      layout.floorY - groundAt(layout, -layout.length / 2),
      9,
    )
    expect(scene.underfloorHeight).toBeGreaterThan(
      layout.floorY - groundAt(layout, layout.length / 2),
    )
  })
})

describe('the counterexample', () => {
  it('steepens the ground until the prohibition cannot be kept', () => {
    const c = slopeCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.longest).toBeGreaterThan(c.witness.broken.available)
    expect(c.witness.sound.longest).toBeLessThanOrEqual(c.witness.sound.available)
  })
})

describe('the address', () => {
  it('round-trips every rule, defaults included', () => {
    for (const rules of COMBOS) {
      expect(rulesEqual(rulesFromQuery(rulesToQuery(rules)), normaliseRules(rules))).toBe(true)
    }
  })

  it('writes all three rules even at their defaults', () => {
    const q = rulesToQuery(DEFAULT_RULES)
    expect(q).toContain('wilayah=')
    expect(q).toContain('lereng=')
    expect(q).toContain('sosoro=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('wilayah=&lereng=&sosoro=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('raises the stages in order and times every part', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      const timeline = buildTimeline(house)
      expect(timeline.entries.length).toBe(house.parts.length)
      let seen = -1
      for (const part of house.parts) {
        const rank = STAGE_ORDER.indexOf(part.stage)
        expect(rank).toBeGreaterThanOrEqual(seen)
        seen = rank
      }
    }
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `sunda provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * Two of the canon rules here are prohibitions no model can test. They are
   * declared anyway, and this test holds them in the pack: a pack that wrote
   * down only the rules it could check would be editing the tradition to fit
   * the software.
   */
  it('declares the prohibitions it cannot test', () => {
    expect(DIMS.noSawnTimber.class).toBe('canon')
    expect(DIMS.noIronInTheFrame.class).toBe('canon')
    expect(DIMS.groundIsNotCut.class).toBe('canon')
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
  })

  it('every part cites only declared dimensions', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      for (const part of house.parts) {
        expect(part.dims.length).toBeGreaterThan(0)
        for (const key of part.dims) expect(DIM_KEYS).toContain(key)
      }
    }
    const { house } = buildHouse(DEFAULT_RULES)
    const split = partSplit(house.parts)
    expect(split.measured).toBe(0)
    expect(split.interpolated).toBe(split.total)
  })
})
