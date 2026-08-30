import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/sumbawa/assembly'
import {
  checkNinetyNine,
  checkSpansFollow,
  checkTwoHallsOneRoof,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/sumbawa/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_BILIK,
  MIN_BILIK,
  SUSUNAN,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/sumbawa/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/sumbawa/address'
import { postCount, resolveLayout } from '@/lib/tradition/sumbawa/frame'
import { spanCounterexample } from '@/lib/tradition/sumbawa/counterexample'
import { sceneModel } from '@/lib/tradition/sumbawa/scene'
import { withDimValue } from '@/lib/tradition/sumbawa/whatif'
import { STAGE_ORDER } from '@/lib/tradition/sumbawa/types'
import type { Rules } from '@/lib/tradition/sumbawa/types'

/** Both grids, both ends of the room count, with and without the walkway. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { bilik: MIN_BILIK, susunan: 'sebelas-lintang', serambi: false },
  { bilik: MAX_BILIK, susunan: 'sembilan-lintang', serambi: true },
  { bilik: 3, susunan: 'sebelas-lintang', serambi: true },
  { bilik: 5, susunan: 'sembilan-lintang', serambi: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.bilik} rooms on the ${rules.susunan} grid, walkway ${rules.serambi}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a count that comes from a text', () => {
  it('stands on exactly ninety-nine posts, whatever the rules say', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkNinetyNine(house, layout).status).toBe('pass')
      expect(postCount(house.parts)).toBe(99)
      expect(layout.grid.across * layout.grid.along).toBe(99)
    }
  })

  /**
   * The second half of the check, which is what keeps the first honest: a
   * count met with ornamental posts is a fact about arithmetic. Stand eleven
   * of them where no beam runs and the check has to notice.
   */
  it('refuses posts that stand under nothing', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const beamless = { ...house, parts: house.parts.filter((p) => p.name !== 'balok') }
    expect(checkNinetyNine(beamless, layout).status).toBe('fail')
  })

  /**
   * The number fixes a shape, which no other rule in this project does: the
   * two grids are the two factorisations of ninety-nine that make a building.
   */
  it('leaves only which way round the grid runs', () => {
    expect(SUSUNAN.map((s) => s.across * s.along)).toEqual([99, 99])
    const [nine, eleven] = SUSUNAN
    if (!nine || !eleven) throw new Error('missing arrangements')
    expect(nine.across).toBe(eleven.along)
    expect(nine.along).toBe(eleven.across)
    const long = resolveLayout({ ...DEFAULT_RULES, susunan: 'sembilan-lintang' })
    const wide = resolveLayout({ ...DEFAULT_RULES, susunan: 'sebelas-lintang' })
    expect(long.halfZ).toBeGreaterThan(long.halfX)
    expect(wide.halfX).toBeGreaterThan(wide.halfZ)
    // And the plan area is the same either way: it is one grid, turned.
    expect(long.halfX * long.halfZ).toBeCloseTo(wide.halfX * wide.halfZ, 9)
  })

  /** Dividing the inner part changes nothing in the frame. */
  it('does not move a post when the rooms are divided differently', () => {
    const two = buildHouse({ ...DEFAULT_RULES, bilik: 2 })
    const six = buildHouse({ ...DEFAULT_RULES, bilik: 6 })
    const posts = (h: typeof two) =>
      h.house.parts
        .filter((p) => p.name === 'tiang')
        .map((p) => partBounds(p))
        .map((b) => `${((b.min[0] + b.max[0]) / 2).toFixed(3)},${((b.min[2] + b.max[2]) / 2).toFixed(3)}`)
        .sort()
    expect(posts(two)).toEqual(posts(six))
  })
})

describe('growth comes out of the spans', () => {
  it('keeps the spacing inside what a beam crosses', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkSpansFollow(layout).status).toBe('pass')
      expect(layout.spacing.bay).toBeLessThanOrEqual(layout.spacing.limit)
    }
  })

  it('refuses a grid stretched past a single beam', () => {
    const wide = withDimValue('bayLength', DIMS.beamSpan.value + 0.4, () =>
      checkSpansFollow(resolveLayout(DEFAULT_RULES)),
    )
    expect(wide.status).toBe('fail')
  })

  /** A larger palace is a wider grid, because it cannot be more posts. */
  it('grows only by spacing', () => {
    const before = resolveLayout(DEFAULT_RULES)
    const after = withDimValue('bayLength', DIMS.bayLength.value * 1.1, () => resolveLayout(DEFAULT_RULES))
    expect(after.halfX).toBeGreaterThan(before.halfX)
    expect(after.grid.posts).toBe(before.grid.posts)
  })
})

describe('two halls under one roof', () => {
  it('puts one floor and one roof over both', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkTwoHallsOneRoof(house, layout).status).toBe('pass')
      expect(house.parts.filter((p) => p.stage === 'atap')).toHaveLength(1)
      expect(house.parts.filter((p) => p.name === 'lantai')).toHaveLength(1)
      expect(layout.halls).toHaveLength(2)
    }
  })
})

describe('the counterexample', () => {
  it('stretches the grid until a beam will not cross it', () => {
    const c = spanCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.bay).toBeLessThanOrEqual(c.witness.sound.limit)
    expect(c.witness.broken.bay).toBeGreaterThan(c.witness.broken.limit)
    // The span does not move: it belongs to the timber, not to the palace.
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
    expect(q).toContain('bilik=')
    expect(q).toContain('susunan=')
    expect(q).toContain('serambi=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('bilik=&susunan=&serambi=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('sets ninety-nine stones before ninety-nine posts', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts[0]?.stage).toBe('batu')
      const stones = house.parts.filter((p) => p.name === 'batu' && !p.id.startsWith('batu-serambi'))
      expect(stones).toHaveLength(99)
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
  it('reports a plan that is a grid rather than a proportion', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.footprint.x).toBeCloseTo((layout.grid.across - 1) * layout.spacing.bay, 9)
    expect(scene.footprint.z).toBeCloseTo((layout.grid.along - 1) * layout.spacing.bay, 9)
    expect(scene.zones).toHaveLength(3)
    expect(scene.site).toHaveLength(1)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `sumbawa provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * Ninety-nine is the one figure in this project that a tape measure can
   * check and cannot correct: a survey coming back with ninety-seven posts
   * would be a finding about a restoration rather than about the rule.
   */
  it('keeps the count canon and every metre unsourced', () => {
    expect(DIMS.ninetyNinePosts.class).toBe('canon')
    expect(DIMS.ninetyNinePosts.value).toBe(99)
    expect(DIMS.ninetyNinePosts.unit).toBe('count')
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
