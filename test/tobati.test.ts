import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/tobati/assembly'
import {
  checkAboveTheTide,
  checkEightSided,
  checkFewerHigherUp,
  checkOneGradeAtATime,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/tobati/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_TINGKAT,
  MIN_TINGKAT,
  gradesFor,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/tobati/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/tobati/address'
import { resolveLayout } from '@/lib/tradition/tobati/frame'
import { tideCounterexample } from '@/lib/tradition/tobati/counterexample'
import { sceneModel } from '@/lib/tradition/tobati/scene'
import { STAGE_ORDER } from '@/lib/tradition/tobati/types'
import type { Rules } from '@/lib/tradition/tobati/types'

/** Both level counts, with the walkway and without it. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { tingkat: MIN_TINGKAT, titian: true },
  { tingkat: MAX_TINGKAT, titian: false },
  { tingkat: MIN_TINGKAT, titian: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.tingkat} levels, walkway ${rules.titian}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a house that does not stand on land', () => {
  /**
   * The claim this building was added to make. Everything a person uses is
   * above the highest water, and there is no pad stone anywhere — because
   * there is nowhere to set one.
   */
  it('keeps everything above the tide and stands on no stone at all', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkAboveTheTide(house, layout).status).toBe('pass')
      // Stated at the type level as well as in the model: this pack has no
      // stone in its material union at all, because there is nowhere to set
      // one — so the absence cannot be undone by a builder forgetting.
      expect(house.parts.some((p) => p.name.includes('batu'))).toBe(false)
      const first = layout.levels[0]
      if (!first) throw new Error('no levels')
      expect(first.y).toBeGreaterThan(layout.waterDepth + layout.tide)
    }
  })

  /**
   * The floor height and the clearance are two numbers, not one. They were one
   * at first, which made the check a restatement of its own input: no value of
   * any dimension could flood a floor that was defined as being above the
   * water.
   */
  it('measures a chosen height against a required clearance', () => {
    const layout = resolveLayout(DEFAULT_RULES)
    const first = layout.levels[0]
    if (!first) throw new Error('no levels')
    expect(first.y).toBeCloseTo(DIMS.floorHeight.value, 9)
    expect(layout.freeboard).toBeGreaterThanOrEqual(DIMS.freeboard.value)
    // Independent: the choice moves and the requirement does not.
    expect(DIMS.floorHeight.value).not.toBeCloseTo(DIMS.freeboard.value, 3)
  })

  /** Age, as floor area: each grade above holds fewer people than the one below. */
  it('narrows upward, so the oldest grade has the smallest floor', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkFewerHigherUp(layout).status).toBe('pass')
      expect(layout.levels).toHaveLength(rules.tingkat)
      for (let i = 1; i < layout.levels.length; i++) {
        const below = layout.levels[i - 1]
        const above = layout.levels[i]
        if (!below || !above) throw new Error('missing level')
        expect(above.area).toBeLessThan(below.area)
        expect(above.y).toBeGreaterThan(below.y)
      }
    }
  })

  /**
   * A rule about a route rather than about a member: an age grade is left by
   * climbing into the next one, and there is no short cut to the top.
   */
  it('puts one pole between consecutive levels and none that skips', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkOneGradeAtATime(house, layout).status).toBe('pass')
      const poles = house.parts.filter((p) => p.stage === 'tangga')
      expect(poles).toHaveLength(rules.tingkat - 1)
      for (const pole of poles) {
        const b = partBounds(pole)
        const spans = layout.levels.filter((l) => l.y > b.min[1] + 0.01 && l.y < b.max[1] - 0.01)
        expect(spans).toHaveLength(0)
      }
    }
  })

  it('is eight-sided in its plan and in its peak', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkEightSided(house, layout).status).toBe('pass')
      expect(layout.facets).toBe(8)
      expect(house.parts.filter((p) => p.name === 'tiang')).toHaveLength(8)
      expect(house.parts.filter((p) => p.stage === 'rangka')).toHaveLength(8)
    }
  })

  /**
   * A two-level house keeps the boys and the elders and loses the floor for
   * the men in between — the honest reading, since a house with two levels
   * still has both ends of a life in it.
   */
  it('drops the middle grade rather than the top one', () => {
    expect(gradesFor(3).map((g) => g.key)).toEqual(['anak', 'pemuda', 'tua'])
    expect(gradesFor(2).map((g) => g.key)).toEqual(['anak', 'tua'])
  })

  /** With no walkway there is no front, because no side of an octagon is wider. */
  it('has a walkway or is reached by canoe', () => {
    const withWalk = buildHouse({ ...DEFAULT_RULES, titian: true })
    const without = buildHouse({ ...DEFAULT_RULES, titian: false })
    expect(withWalk.house.parts.some((p) => p.stage === 'titian')).toBe(true)
    expect(without.house.parts.some((p) => p.stage === 'titian')).toBe(false)
  })

  /**
   * The sixth meaning of `underfloorHeight`, and the only one that answers a
   * number changing twice a day.
   */
  it('reports its freeboard as the clearance under the floor', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    const high = layout.waterDepth + layout.tide
    expect(scene.underfloorHeight).toBeCloseTo((layout.levels[0]?.y ?? high) - high, 9)
    expect(scene.ridgeAxis).toBeNull()
    // The site is water, and it is the only site in the collection that is.
    expect(scene.site.some((m) => m.volumes.some((v) => v.material === 'air'))).toBe(true)
  })
})

describe('the counterexample', () => {
  it('cuts the posts short until the sea comes through the floor', () => {
    const c = tideCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.floor).toBeLessThan(c.witness.sound.floor)
    expect(c.witness.broken.highWater).toBeCloseTo(c.witness.sound.highWater, 9)
  })
})

describe('the address', () => {
  it('round-trips both rules, defaults included', () => {
    for (const rules of COMBOS) {
      expect(rulesEqual(rulesFromQuery(rulesToQuery(rules)), normaliseRules(rules))).toBe(true)
    }
  })

  it('writes both rules even at their defaults', () => {
    const q = rulesToQuery(DEFAULT_RULES)
    expect(q).toContain('tingkat=')
    expect(q).toContain('titian=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('tingkat=&titian=')).toEqual(normaliseRules(DEFAULT_RULES))
  })

  /** Two rules, and the pack says why rather than inventing a third. */
  it('declares two rules and no more', () => {
    expect(Object.keys(normaliseRules(DEFAULT_RULES))).toHaveLength(2)
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

  it('fits the poles after the roof, not before it', () => {
    expect(STAGE_ORDER.indexOf('tangga')).toBeGreaterThan(STAGE_ORDER.indexOf('atap'))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `tobati provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The thinnest-sourced pack in the collection, and it says so at the front:
   * every metric figure is the author's, the height of the peak included.
   */
  it('leaves every metric figure unsourced, as the caution states', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(10)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.apexRise.class).toBe('interpolated')
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
