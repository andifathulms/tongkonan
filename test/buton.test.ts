import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/buton/assembly'
import {
  checkBracketsAreRank,
  checkOverhangIsCarried,
  checkWidensUpward,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/buton/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_TINGKAT,
  MIN_TINGKAT,
  PALE,
  normaliseRules,
  paleInfo,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/buton/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/buton/address'
import { resolveLayout } from '@/lib/tradition/buton/frame'
import { overhangCounterexample } from '@/lib/tradition/buton/counterexample'
import { sceneModel } from '@/lib/tradition/buton/scene'
import { withDimValue } from '@/lib/tradition/buton/whatif'
import { STAGE_ORDER } from '@/lib/tradition/buton/types'
import { resolveLayout as tobatiLayout } from '@/lib/tradition/tobati/frame'
import type { Rules } from '@/lib/tradition/buton/types'

/** All three ranks, both ends of the storey count. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { tingkat: MIN_TINGKAT, pale: 'tanpa', anjungan: false },
  { tingkat: MAX_TINGKAT, pale: 'talu', anjungan: true },
  { tingkat: 3, pale: 'pata', anjungan: false },
  { tingkat: 3, pale: 'tanpa', anjungan: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.tingkat} storeys on ${rules.pale}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a building that widens as it rises', () => {
  it('makes its highest floor its largest', () => {
    for (const rules of COMBOS.filter((r) => r.pale !== 'tanpa')) {
      const layout = resolveLayout(rules)
      expect(checkWidensUpward(layout).status).toBe('pass')
      const first = layout.storeys[0]
      const top = layout.storeys[layout.storeys.length - 1]
      if (!first || !top) throw new Error('no storeys')
      expect(top.halfX).toBeGreaterThan(first.halfX)
      expect(top.halfZ).toBeGreaterThan(first.halfZ)
      for (let i = 1; i < layout.storeys.length; i++) {
        const below = layout.storeys[i - 1]
        const here = layout.storeys[i]
        if (!below || !here) continue
        expect(here.halfX).toBeGreaterThan(below.halfX)
      }
    }
  })

  /**
   * The pair that makes the claim precise.
   *
   * "Every other building narrows upward" is not a silhouette claim — a
   * tongkonan's boat roof is wider than its body, and so are half the roofs
   * here. It is a claim about *floors*, and the only other pack with named
   * stacked floors is the Tobati kariwari, whose levels get smaller as they
   * rise because the older grades hold fewer people. Two buildings, two stacks
   * of floors, opposite directions — which is worth a test rather than a
   * sentence, because either pack could be quietly changed.
   */
  it('stacks its floors the opposite way from the only other stack here', () => {
    const malige = resolveLayout({ tingkat: 4, pale: 'pata', anjungan: true })
    for (let i = 1; i < malige.storeys.length; i++) {
      const below = malige.storeys[i - 1]
      const here = malige.storeys[i]
      if (!below || !here) continue
      expect(here.halfX).toBeGreaterThan(below.halfX)
    }
    const kariwari = tobatiLayout({ tingkat: 3, titian: true })
    for (let i = 1; i < kariwari.levels.length; i++) {
      const below = kariwari.levels[i - 1]
      const here = kariwari.levels[i]
      if (!below || !here) continue
      expect(here.radius).toBeLessThan(below.radius)
    }
  })

  /** No brackets, no projection: a different building rather than a smaller one. */
  it('stands plumb when the household is entitled to no arms', () => {
    const layout = resolveLayout({ tingkat: 4, pale: 'tanpa', anjungan: false })
    expect(checkWidensUpward(layout).status).toBe('pass')
    const first = layout.storeys[0]
    for (const storey of layout.storeys) {
      expect(storey.halfX).toBeCloseTo(first?.halfX ?? 0, 9)
      expect(storey.oversail).toBeCloseTo(0, 9)
    }
    // And the projecting room goes with it: it belongs to a house that projects.
    expect(normaliseRules({ tingkat: 4, pale: 'tanpa', anjungan: true }).anjungan).toBe(false)
  })
})

describe('rank and the cantilever', () => {
  it('builds as many arms as the rank allows, and they carry the floors', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkBracketsAreRank(house, layout).status).toBe('pass')
      const arms = house.parts.filter((p) => p.stage === 'pale')
      const projecting = layout.storeys.filter((s) => s.oversail > 1e-6).length
      expect(arms.length).toBe(projecting * paleInfo(rules.pale).count * 2)
    }
  })

  /**
   * The arm goes on before the floor it carries. A cantilever built before
   * what holds it is a cantilever hanging off nothing, and this project has
   * caught that in five other packs.
   */
  it('places every arm before the floor over it', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const firstArm = house.parts.findIndex((p) => p.stage === 'pale')
    const upperFloor = house.parts.findIndex((p) => p.stage === 'lantai' && p.id !== 'lantai-0')
    expect(firstArm).toBeGreaterThanOrEqual(0)
    expect(firstArm).toBeLessThan(upperFloor)
  })

  /**
   * The projections accumulate from one frame, so the topmost arm is always
   * the longest — which is why the limit lands at the top rather than at the
   * bottom, and why the check is written against the accumulated span.
   */
  it('measures the reach from the frame, not from the storey below', () => {
    const layout = resolveLayout({ tingkat: 4, pale: 'pata', anjungan: true })
    const base = layout.storeys[0]
    const top = layout.storeys[layout.storeys.length - 1]
    if (!base || !top) throw new Error('no storeys')
    const span = top.halfX - base.halfX
    expect(span).toBeCloseTo(DIMS.oversail.value * 3, 9)
    expect(span).toBeGreaterThan(DIMS.oversail.value)
    expect(checkOverhangIsCarried(layout).status).toBe('pass')
    // And it bites: a shorter arm cannot carry the same building.
    const short = withDimValue('paleReach', DIMS.oversail.value, () =>
      checkOverhangIsCarried(resolveLayout({ tingkat: 4, pale: 'pata', anjungan: true })),
    )
    expect(short.status).toBe('fail')
  })
})

describe('the counterexample', () => {
  it('steps further out until the topmost arm cannot reach', () => {
    const c = overhangCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.span).toBeLessThanOrEqual(c.witness.sound.reach)
    expect(c.witness.broken.span).toBeGreaterThan(c.witness.broken.reach)
    // The arm does not change: the two numbers are independent.
    expect(c.witness.broken.reach).toBeCloseTo(c.witness.sound.reach, 9)
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
    expect(q).toContain('tingkat=')
    expect(q).toContain('pale=')
    expect(q).toContain('anjungan=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('tingkat=&pale=&anjungan=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('sets the stones, stands the frame, and raises the stages in order', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts[0]?.stage).toBe('batu')
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
  it('reports the ground floor as the footprint, and it is the smallest plan', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    const base = layout.storeys[0]
    const top = layout.storeys[layout.storeys.length - 1]
    expect(scene.footprint.x).toBeCloseTo((base?.halfX ?? 0) * 2, 9)
    expect(scene.drip.x).toBeGreaterThan((top?.halfX ?? 0))
    // The footprint is smaller than the drip line by more than an eave: three
    // storeys of building have stepped out in between.
    expect(scene.drip.x - scene.footprint.x / 2).toBeGreaterThan(DIMS.eaveOversail.value)
    expect(scene.zones).toHaveLength(layout.storeys.length)
    expect(scene.site).toHaveLength(1)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `buton provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * Zero measured on a building that is still standing and has been measured
   * by other people. That is the least defensible bar in this project after
   * the waruga's, and the caution says so.
   */
  it('keeps every metre unsourced', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    for (const d of ALL_DIMS.filter((x) => x.class === 'canon')) expect(d.unit).not.toBe('m')
    expect(PALE.map((p) => p.count)).toEqual([4, 3, 0])
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
