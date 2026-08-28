import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/nias/assembly'
import { checkBracing, runInvariants, summarise } from '@/lib/tradition/nias/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  MAX_RUANG,
  MIN_RUANG,
  OMO,
  omoInfo,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/nias/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/nias/address'
import { resolveLayout } from '@/lib/tradition/nias/frame'
import { roofCounterexample } from '@/lib/tradition/nias/counterexample'
import { sceneModel } from '@/lib/tradition/nias/scene'
import { STAGE_ORDER } from '@/lib/tradition/nias/types'
import type { Rules } from '@/lib/tradition/nias/types'

/** Both classes, both ends of the bay range, and a house with no stones. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { omo: 'hada', ruang: MIN_RUANG, behu: false },
  { omo: 'hada', ruang: 5, behu: false },
  { omo: 'sebua', ruang: MAX_RUANG, behu: true },
  { omo: 'sebua', ruang: 4, behu: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.omo}, ${rules.ruang} bays${rules.behu ? ', with behu' : ''}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the frame is triangulated, and the check that says so has teeth', () => {
  /**
   * Every rectangle, in both planes.
   *
   * The count is asserted rather than taken on trust because the failure this
   * guards against is subtle and would look fine: bracing the long elevation
   * and leaving the short one bare gives a building that photographs correctly
   * and racks across its width.
   */
  it('records a bay for every rectangle in both planes', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      const rows = layout.rows
      const cols = layout.cols
      expect(layout.cells.filter((c) => c.plane === 0)).toHaveLength(rows * (cols - 1))
      expect(layout.cells.filter((c) => c.plane === 2)).toHaveLength(cols * (rows - 1))
    }
  })

  /**
   * The claim `checkBracing` makes cannot be broken by any dimension, because
   * the braces are built from the same cell list the check walks — see the
   * note in `counterexample.ts`. So it is falsified here instead, by taking
   * the cross-braces out of a house that has them.
   *
   * This is the test the counterexample search could not be: without it, the
   * strongest structural check in the pack would be one nothing had ever seen
   * fail, which is indistinguishable from one that cannot.
   */
  it('fails when one plane of bracing is removed', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(checkBracing(house, layout).status).toBe('pass')

    const crossPlaneRemoved = {
      ...house,
      parts: house.parts.filter((p) => !p.id.startsWith('driwa-petak-x-')),
    }
    const verdict = checkBracing(crossPlaneRemoved, layout)
    expect(verdict.status).toBe('fail')
    expect(verdict.detailEn).toContain('no diagonal reaching both corners')
  })

  it('fails when a single bay is left unbraced', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const one = layout.cells[0]
    expect(one).toBeDefined()
    if (!one) return
    const missing = { ...house, parts: house.parts.filter((p) => p.id !== `driwa-${one.id}`) }
    expect(checkBracing(missing, layout).status).toBe('fail')
  })

  /**
   * A brace that sits in the middle of its bay without reaching the corners
   * braces nothing. The check has to test reach rather than membership, and
   * this is what says it does.
   */
  it('fails a diagonal that does not reach the corners of its bay', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const one = layout.cells[0]
    expect(one).toBeDefined()
    if (!one) return
    const shrunk = house.parts.map((p) =>
      p.id === `driwa-${one.id}` && p.kind === 'box' ? { ...p, size: [p.size[0], p.size[1] * 0.4, p.size[2]] as const } : p,
    )
    expect(checkBracing({ ...house, parts: shrunk }, layout).status).toBe('fail')
  })

  it('adds two bays for every bay added to the plan', () => {
    const five = resolveLayout({ omo: 'sebua', ruang: 5, behu: false })
    const six = resolveLayout({ omo: 'sebua', ruang: 6, behu: false })
    // One more rectangle in each row along the length, and one more column of
    // them across the width.
    expect(six.cells.length - five.cells.length).toBe(five.rows + (five.rows - 1))
  })
})

describe('what a braced house breaks', () => {
  it('puts the part that does the work where it can be seen', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    // Within the footprint: the behu stand at the same height but out in the
    // yard, and a stone in the yard screens nothing.
    const inUnderstorey = house.parts.filter((p) => {
      if (p.kind !== 'box') return false
      const y = p.center[1]
      return y > layout.stoneHeight && y < layout.floorY && Math.abs(p.center[0]) < layout.eaveHalfX
    })
    // Only stones, posts and diagonals are down there. Nothing screens them.
    for (const part of inUnderstorey) {
      expect(['batu', 'ehomo', 'driwa']).toContain(part.stage)
    }
    expect(inUnderstorey.some((p) => p.stage === 'driwa')).toBe(true)
  })

  it('is mostly roof, and the body is the smallest of its three parts', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const under = layout.floorY
    const body = layout.eaveY - layout.floorY
    const roof = layout.ridgeY - layout.eaveY
    expect(roof).toBeGreaterThan(body)
    expect(under).toBeGreaterThan(body)
  })

  /**
   * The tallest understorey of the six, and the only one that matters
   * structurally. `underfloorHeight` has now carried five meanings; this test
   * pins the end of the range that the joglo and the bale pinned the other end
   * of.
   */
  it('reports the tallest understorey in the project', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeGreaterThan(3)
    expect(scene.zones.map((z) => z.key)).toEqual(['kolong', 'badan', 'atap'])
  })

  it('raises stones only where the household may, and only outside the building', () => {
    const withStones = buildHouse({ omo: 'sebua', ruang: 5, behu: true })
    const without = buildHouse({ omo: 'sebua', ruang: 5, behu: false })
    expect(withStones.house.parts.some((p) => p.stage === 'behu')).toBe(true)
    expect(without.house.parts.some((p) => p.stage === 'behu')).toBe(false)
    for (const stone of withStones.house.parts.filter((p) => p.stage === 'behu')) {
      if (stone.kind === 'box') expect(stone.center[0]).toBeLessThan(-withStones.layout.eaveHalfX)
    }
  })

  it('gives a loft to a si’ulu and not to anyone else', () => {
    for (const info of OMO) {
      const { house } = buildHouse({ omo: info.omo, ruang: 5, behu: false })
      expect(house.parts.some((p) => p.id === 'loteng')).toBe(info.loft)
      expect(omoInfo(info.omo).loft).toBe(info.loft)
    }
  })
})

describe('the counterexample', () => {
  it('shrinks the roof until the building is no longer this building', () => {
    const c = roofCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeLessThan(c.actual)
    expect(c.witness.broken.roof).toBeLessThan(c.witness.sound.roof)
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
    expect(q).toContain('omo=')
    expect(q).toContain('ruang=')
    expect(q).toContain('behu=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('omo=&ruang=&behu=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `nias provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`nias parts: ${split.interpolated} interpolated of ${split.total}`)
    expect(split.total).toBe(house.parts.length)
  })
})

describe('the build sequence', () => {
  /**
   * The diagonals are their own stage and they come after the posts, because
   * until they are in, what is standing is a set of rectangles. That ordering
   * is the argument the building makes, so it is asserted rather than assumed.
   */
  it('puts the diagonals in after the posts and before the floor', () => {
    const order = STAGE_ORDER
    expect(order.indexOf('driwa')).toBeGreaterThan(order.indexOf('ehomo'))
    expect(order.indexOf('driwa')).toBeLessThan(order.indexOf('lantai'))
  })

  it('walks every stage in order and places every part', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const timeline = buildTimeline(house)
    expect(timeline.stages.map((s) => s.stage)).toEqual(
      STAGE_ORDER.filter((s) => house.parts.some((p) => p.stage === s)),
    )
    expect(placedAt(timeline, 1).size).toBe(house.parts.length)
    expect(placedAt(timeline, 0).size).toBe(0)
  })
})
