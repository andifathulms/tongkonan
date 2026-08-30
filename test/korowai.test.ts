import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/korowai/assembly'
import {
  checkHearthsCanFall,
  checkNothingUnderIt,
  checkStandsOnSomethingAlive,
  checkTrunkCarries,
  checkTwoSides,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/korowai/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_PERAPIAN,
  MIN_PERAPIAN,
  TINGGI,
  heightOf,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/korowai/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/korowai/address'
import { resolveLayout } from '@/lib/tradition/korowai/frame'
import { trunkCounterexample } from '@/lib/tradition/korowai/counterexample'
import { sceneModel } from '@/lib/tradition/korowai/scene'
import { withDimValue } from '@/lib/tradition/korowai/whatif'
import { STAGE_ORDER } from '@/lib/tradition/korowai/types'
import type { Rules } from '@/lib/tradition/korowai/types'

/** All three heights, both ends of the household count, tree and no tree. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { tinggi: 'rendah', perapian: MIN_PERAPIAN, pohon: false },
  { tinggi: 'tinggi', perapian: MAX_PERAPIAN, pohon: true },
  { tinggi: 'sedang', perapian: 4, pohon: false },
  { tinggi: 'tinggi', perapian: 4, pohon: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds at ${rules.tinggi} with ${rules.perapian} hearths, tree ${rules.pohon}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      /*
       * One skip on a house standing in a tree, two on one standing on poles.
       *
       * `checkAgainstSurvey` is always skipped and always will be. The second
       * is `checkTrunkCarries`, which has nothing to measure when there is no
       * trunk — a rule can turn off the thing a check is about, and saying so
       * is better than writing a version of the check that compares two
       * constants and can never fail.
       */
      expect(summarise(results).skipped).toBe(rules.pohon ? 1 : 2)
    })
  }
})

describe('a building that stands on something alive', () => {
  it('puts one living tree under it, from the ground to above the ridge', () => {
    for (const rules of COMBOS.filter((r) => r.pohon)) {
      const { house, layout } = buildHouse(rules)
      expect(checkStandsOnSomethingAlive(house, layout).status).toBe('pass')
      const trunk = house.parts.filter((p) => p.material === 'pohon')
      expect(trunk).toHaveLength(1)
      const first = trunk[0]
      if (!first) throw new Error('no trunk')
      const b = partBounds(first)
      expect(b.min[1]).toBeCloseTo(0, 6)
      expect(b.max[1]).toBeGreaterThan(layout.ridgeY)
      // Something is actually framed into it: a tree drawn beside a house is
      // scenery, and this project does not do scenery.
      expect(house.joints.some((j) => j.mortise === 'wanbon')).toBe(true)
    }
  })

  it('says so plainly when nothing about it is alive', () => {
    for (const rules of COMBOS.filter((r) => !r.pohon)) {
      const { house, layout } = buildHouse(rules)
      expect(checkStandsOnSomethingAlive(house, layout).status).toBe('pass')
      expect(house.parts.filter((p) => p.material === 'pohon')).toEqual([])
      // The trade the rule is about: no tree means more poles.
      const withTree = resolveLayout({ ...rules, pohon: true })
      expect(layout.posts.length).toBeGreaterThan(withTree.posts.length)
    }
  })

  /**
   * The height is the household's and the taper is the tree's, and the two
   * numbers are independent — which is what makes the check able to fail.
   */
  it('thins the trunk as the house rises', () => {
    const heights = TINGGI.map((t) => resolveLayout({ ...DEFAULT_RULES, tinggi: t.tinggi }))
    for (let i = 1; i < heights.length; i++) {
      const below = heights[i - 1]
      const above = heights[i]
      if (!below || !above) continue
      expect(above.floorY).toBeGreaterThan(below.floorY)
      expect(above.trunk.atFloor).toBeLessThan(below.trunk.atFloor)
    }
    for (const rules of COMBOS.filter((r) => r.pohon)) {
      expect(checkTrunkCarries(resolveLayout(rules)).status).toBe('pass')
    }
  })

  /**
   * The height table holds dimension keys, not copies of their values.
   *
   * The Banjar pack shipped the other way round and its counterexample went
   * blind: `withDimValue` swapped a number nothing read.
   */
  it('reads the height from the pack, not from a copy taken at import time', () => {
    const before = resolveLayout(DEFAULT_RULES).floorY
    const during = withDimValue('heightMid', DIMS.heightMid.value * 2, () => resolveLayout(DEFAULT_RULES).floorY)
    expect(during).toBeCloseTo(before * 2, 9)
    expect(heightOf('tinggi')).toBeCloseTo(DIMS.heightTall.value, 9)
  })
})

describe('the empty air under it', () => {
  /**
   * The one clearance in this project that is the purpose of the building
   * rather than a consequence of something else — so it is checked, not
   * commented.
   */
  it('keeps everything out of the space under the floor', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkNothingUnderIt(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        if (part.stage === 'tiang' || part.stage === 'tangga' || part.material === 'pohon') continue
        expect(partBounds(part).min[1]).toBeGreaterThan(layout.floorY - 0.35)
      }
    }
  })

  it('reports that height as the clearance, and it is the largest here', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      const scene = sceneModel(house, layout)
      expect(scene.underfloorHeight).toBeCloseTo(layout.floorY, 9)
    }
    // Comfortably past every other raised floor in the collection.
    expect(heightOf('tinggi')).toBeGreaterThan(10)
  })
})

describe('the fires', () => {
  /**
   * A hearth hangs in an opening so it can be cut loose and dropped, which
   * means the floor has to be *open* under every fire. It is the only check
   * here whose subject is a part leaving the building.
   */
  it('leaves a clear drop under every hearth', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkHearthsCanFall(house, layout).status).toBe('pass')
      expect(layout.hearths).toHaveLength(rules.perapian)
    }
  })

  /**
   * And the falsification, because a check nothing has been seen to fail is
   * indistinguishable from one that cannot. Widen the slab past the opening
   * left for it and the deck it is meant to fall through is in the way.
   */
  it('refuses a hearth wider than the hole it hangs in', () => {
    const wide = withDimValue('hearthSide', DIMS.hearthSide.value * 2.2, () => {
      const { house, layout } = buildHouse(DEFAULT_RULES)
      // The opening is cut from `hearthSide` too, so the failure has to be
      // staged: build the floor at the honest size and then grow the slab.
      const grown = {
        ...layout,
        hearths: layout.hearths.map((h) => ({ ...h, half: h.half * 2.2 })),
      }
      return checkHearthsCanFall(house, grown)
    })
    expect(wide.status).toBe('fail')
  })
})

describe('the two sides', () => {
  it('divides the floor with exactly one partition and a ladder each', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkTwoSides(house, layout).status).toBe('pass')
      expect(house.parts.filter((p) => p.name === 'sekat')).toHaveLength(1)
      expect(house.parts.filter((p) => p.stage === 'tangga')).toHaveLength(2)
    }
  })

  it('keeps the two sides the same size, and an odd count is moved up', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, perapian: 3 }).perapian).toBe(4)
    expect(normaliseRules({ ...DEFAULT_RULES, perapian: 99 }).perapian).toBe(MAX_PERAPIAN)
    expect(normaliseRules({ ...DEFAULT_RULES, perapian: 0 }).perapian).toBe(MIN_PERAPIAN)
    const layout = resolveLayout({ ...DEFAULT_RULES, perapian: 6 })
    expect(layout.hearths.filter((h) => h.side === -1)).toHaveLength(3)
    expect(layout.hearths.filter((h) => h.side === 1)).toHaveLength(3)
  })
})

describe('the counterexample', () => {
  it('raises the house until the tree carrying it is too thin', () => {
    const c = trunkCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.floorY).toBeGreaterThan(c.witness.sound.floorY)
    expect(c.witness.broken.atFloor).toBeLessThan(c.witness.broken.bearing)
    expect(c.witness.sound.atFloor).toBeGreaterThanOrEqual(c.witness.sound.bearing)
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
    expect(q).toContain('tinggi=')
    expect(q).toContain('perapian=')
    expect(q).toContain('pohon=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('tinggi=&perapian=&pohon=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('stands the tree before anything it carries, and leans the ladder last', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts[0]?.stage).toBe('tiang')
      expect(house.parts[house.parts.length - 1]?.stage).toBe('tangga')
    }
  })

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
      `korowai provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * Including the heights, which are the figures everybody quotes about this
   * building and the ones most distorted in circulation. A pack whose most
   * famous number is unsourced should say so where the table can be read.
   */
  it('keeps every metre unsourced', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.heightTall.class).toBe('interpolated')
    expect(ALL_DIMS.filter((d) => d.class === 'canon').length).toBeGreaterThanOrEqual(5)
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
