import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/betawi/assembly'
import {
  checkFrontIsForStrangers,
  checkInsideThePlot,
  checkTheRoofFolds,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/betawi/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  LETAK,
  MAX_KAMAR,
  MIN_KAMAR,
  normaliseRules,
  partSplit,
  provenanceSplit,
  setbackOf,
} from '@/lib/tradition/betawi/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/betawi/address'
import { resolveLayout } from '@/lib/tradition/betawi/frame'
import { plotCounterexample } from '@/lib/tradition/betawi/counterexample'
import { sceneModel } from '@/lib/tradition/betawi/scene'
import { withDimValue } from '@/lib/tradition/betawi/whatif'
import { STAGE_ORDER } from '@/lib/tradition/betawi/types'
import type { Rules } from '@/lib/tradition/betawi/types'

/** Both ends of the room count, both plots, with and without the fascia. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { kamar: MIN_KAMAR, letak: 'dalam', gigiBalang: false },
  { kamar: MAX_KAMAR, letak: 'pinggir-jalan', gigiBalang: true },
  { kamar: 3, letak: 'dalam', gigiBalang: true },
  { kamar: 4, letak: 'dalam', gigiBalang: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.kamar} rooms on a ${rules.letak} plot, fascia ${rules.gigiBalang}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a limit that belongs to somebody else', () => {
  it('keeps everything inside the plot, eaves included', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkInsideThePlot(house, layout).status).toBe('pass')
      const limit = layout.plot.halfX - DIMS.sideMargin.value
      for (const part of house.parts) {
        expect(partBounds(part).max[0]).toBeLessThanOrEqual(limit + 1e-6)
      }
    }
  })

  /**
   * The plot was there before the house: it does not move when the household
   * wants another room, which is what makes the check able to fail.
   */
  it('does not widen the plot when the house widens', () => {
    const two = resolveLayout({ ...DEFAULT_RULES, kamar: 2 })
    const four = resolveLayout({ ...DEFAULT_RULES, kamar: 4 })
    expect(four.house.halfX).toBeGreaterThan(two.house.halfX)
    expect(four.plot.halfX).toBeCloseTo(two.plot.halfX, 9)
    expect(four.margin).toBeLessThan(two.margin)
    expect(four.house.halfX * 2 - two.house.halfX * 2).toBeCloseTo(DIMS.roomWidth.value * 2, 9)
  })

  /** What crosses the line first is the roof, not the wall. */
  it('is the eave that reaches furthest, not the wall', () => {
    const { house } = buildHouse({ ...DEFAULT_RULES, kamar: MAX_KAMAR })
    const roof = house.parts.find((p) => p.id === 'atap')
    const wall = house.parts.find((p) => p.id === 'dinding-a')
    if (!roof || !wall) throw new Error('missing parts')
    expect(partBounds(roof).max[0]).toBeGreaterThan(partBounds(wall).max[0])
  })

  /** The setback table holds dimension keys, not copies — the Banjar lesson. */
  it('reads the setback from the pack, not from a copy', () => {
    expect(setbackOf('pinggir-jalan')).toBeCloseTo(DIMS.roadSetback.value, 9)
    expect(setbackOf('dalam')).toBeCloseTo(DIMS.pathSetback.value, 9)
    const before = resolveLayout(DEFAULT_RULES).house.front
    const during = withDimValue('roadSetback', DIMS.roadSetback.value + 2, () => resolveLayout(DEFAULT_RULES).house.front)
    expect(during).toBeCloseTo(before + 2, 9)
    expect(LETAK.map((l) => l.letak)).toEqual(['pinggir-jalan', 'dalam'])
  })
})

describe('a room for people who are not let in', () => {
  it('opens the terrace to the road and puts the first door behind it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkFrontIsForStrangers(house, layout).status).toBe('pass')
      // Nothing that counts as a wall stands in front of the house line.
      for (const part of house.parts) {
        if (part.name !== 'dinding') continue
        const b = partBounds(part)
        expect((b.min[2] + b.max[2]) / 2).toBeGreaterThanOrEqual(layout.house.front - 1e-6)
      }
      // And the terrace really is a floor somebody can stand on.
      expect(house.parts.some((p) => p.id === 'langkan')).toBe(true)
      expect(house.parts.some((p) => p.id === 'pagar-langkan')).toBe(true)
    }
  })

  it('keeps the rail low enough to see over', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const rail = house.parts.find((p) => p.id === 'pagar-langkan')
    if (!rail) throw new Error('no rail')
    expect(partBounds(rail).max[1] - layout.floorY).toBeCloseTo(DIMS.langkanRail.value, 6)
    expect(DIMS.langkanRail.value).toBeLessThan(1)
  })
})

describe('the fold the house is named for', () => {
  it('makes the upper plane steeper and lands the fold over the house', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkTheRoofFolds(layout).status).toBe('pass')
      expect(layout.fold.upper).toBeGreaterThan(layout.fold.lower)
    }
  })

  it('refuses a roof with no fold in it', () => {
    const flat = withDimValue('lowerPitch', DIMS.upperPitch.value, () => checkTheRoofFolds(resolveLayout(DEFAULT_RULES)))
    expect(flat.status).toBe('fail')
  })
})

describe('the counterexample', () => {
  it('widens the rooms until the eave crosses the setback', () => {
    const c = plotCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.reach).toBeLessThanOrEqual(c.witness.sound.limit)
    expect(c.witness.broken.reach).toBeGreaterThan(c.witness.broken.limit)
    // The line does not move: it is not the household's to move.
    expect(c.witness.broken.limit).toBeCloseTo(c.witness.sound.limit, 9)
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
    expect(q).toContain('kamar=')
    expect(q).toContain('letak=')
    expect(q).toContain('gigi=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('kamar=&letak=&gigi=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  /**
   * The fascia is nailed to the roof, so it follows it directly — and the
   * terrace comes last, which is also how many of these were built.
   */
  it('raises the stages in order, with the trim on the roof and the terrace last', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts[0]?.stage).toBe('pondasi')
      expect(house.parts[house.parts.length - 1]?.stage).toBe('langkan')
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

describe('the scene model', () => {
  it('draws the boundary and the neighbours beyond it', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.site).toHaveLength(1)
    expect(scene.site[0]?.volumes).toHaveLength(2)
    expect(scene.site[0]?.lines.length).toBe(2)
    expect(scene.underfloorHeight).toBeCloseTo(DIMS.plinthHeight.value, 9)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `betawi provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('keeps every metre unsourced', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    for (const d of ALL_DIMS.filter((x) => x.class === 'canon')) expect(d.unit).not.toBe('m')
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
