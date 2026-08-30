import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/rimba/assembly'
import {
  checkEveryMemberIsCarried,
  checkFitsTheSleepers,
  checkNothingIsFixed,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/rimba/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  LAMA,
  MAX_ORANG,
  MIN_ORANG,
  dropOf,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/rimba/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/rimba/address'
import { resolveLayout } from '@/lib/tradition/rimba/frame'
import { carryCounterexample } from '@/lib/tradition/rimba/counterexample'
import { sceneModel } from '@/lib/tradition/rimba/scene'
import { withDimValue } from '@/lib/tradition/rimba/whatif'
import { STAGE_ORDER } from '@/lib/tradition/rimba/types'
import type { Rules } from '@/lib/tradition/rimba/types'

/** Both ends of the family, both lengths of stay, on the ground and off it. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { orang: MIN_ORANG, lama: 'sehari', panggung: false },
  { orang: MAX_ORANG, lama: 'musim', panggung: true },
  { orang: 3, lama: 'sehari', panggung: true },
  { orang: 5, lama: 'musim', panggung: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.orang} people, ${rules.lama}, raised ${rules.panggung}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a plan made of sleeping bodies', () => {
  /**
   * The first anthropometric figure in this project that sets a plan. Four
   * other packs measure a person and all four measure a height.
   */
  it('widens by one body for every person', () => {
    for (let n = MIN_ORANG; n <= MAX_ORANG; n++) {
      const layout = resolveLayout({ ...DEFAULT_RULES, orang: n })
      expect(checkFitsTheSleepers(layout).status).toBe('pass')
      const needed = n * DIMS.shoulderWidth.value + (n - 1) * DIMS.sleepGap.value
      expect(layout.floor.halfZ * 2).toBeCloseTo(needed + DIMS.floorMargin.value * 2, 9)
    }
    // The depth does not move: one body long is one body long.
    const two = resolveLayout({ ...DEFAULT_RULES, orang: 2 })
    const six = resolveLayout({ ...DEFAULT_RULES, orang: 6 })
    expect(two.floor.halfX).toBeCloseTo(six.floor.halfX, 9)
    expect(DIMS.lyingLength.source).toBe('anthropometry')
    expect(DIMS.shoulderWidth.source).toBe('anthropometry')
  })

  it('refuses a floor narrower than the people on it', () => {
    const layout = resolveLayout({ ...DEFAULT_RULES, orang: 6 })
    const narrow = { ...layout, floor: { ...layout.floor, halfZ: layout.floor.halfZ * 0.5 } }
    expect(checkFitsTheSleepers(narrow).status).toBe('fail')
  })
})

describe('bounded by what a person can carry', () => {
  it('keeps every member inside the carrying length', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkEveryMemberIsCarried(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        const b = partBounds(part)
        const len = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2])
        expect(len).toBeLessThanOrEqual(layout.carry + 1e-6)
      }
    }
  })

  /** The bound gets closer with every person added, which is the whole story. */
  it('closes on the limit as the family grows', () => {
    const margins = [2, 4, 6].map((n) => {
      const layout = resolveLayout({ ...DEFAULT_RULES, orang: n })
      return layout.carry - layout.longest
    })
    for (let i = 1; i < margins.length; i++) {
      const before = margins[i - 1]
      const here = margins[i]
      if (before === undefined || here === undefined) throw new Error('missing margin')
      expect(here).toBeLessThan(before)
    }
  })

  /**
   * The fall table holds dimension keys rather than copies of their values —
   * the Banjar pack's lesson, checked rather than commented.
   */
  it('reads the roof’s fall from the pack, not from a copy', () => {
    const before = resolveLayout(DEFAULT_RULES).roof.lowY
    const during = withDimValue('dropLong', DIMS.dropLong.value + 0.3, () => resolveLayout(DEFAULT_RULES).roof.lowY)
    expect(during).toBeCloseTo(before - 0.3, 9)
    expect(LAMA.map((l) => dropOf(l.lama))).toEqual([DIMS.dropShort.value, DIMS.dropLong.value])
  })
})

describe('nothing that would bring anybody back', () => {
  it('lashes everything, buries nothing, and buys nothing', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkNothingIsFixed(house).status).toBe('pass')
      for (const joint of house.joints) expect(joint.kind).toBe('ikat')
      for (const part of house.parts) expect(partBounds(part).min[1]).toBeGreaterThanOrEqual(-1e-9)
      const kinds = new Set<string>(house.parts.map((p) => p.material))
      expect([...kinds].filter((k) => ['batu', 'genteng', 'bata', 'papan', 'sirap'].includes(k))).toEqual([])
    }
  })
})

describe('the counterexample', () => {
  it('gives everyone more room until the pole cannot be carried', () => {
    const c = carryCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.longest).toBeLessThanOrEqual(c.witness.sound.carry)
    expect(c.witness.broken.longest).toBeGreaterThan(c.witness.broken.carry)
    // The carrying length does not move: the two numbers are independent.
    expect(c.witness.broken.carry).toBeCloseTo(c.witness.sound.carry, 9)
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
    expect(q).toContain('orang=')
    expect(q).toContain('lama=')
    expect(q).toContain('panggung=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('orang=&lama=&panggung=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('is short, and in order', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      const timeline = buildTimeline(house)
      expect(timeline.entries.length).toBe(house.parts.length)
      expect(house.parts.length).toBeLessThan(25)
      let seen = -1
      for (const part of house.parts) {
        const rank = STAGE_ORDER.indexOf(part.stage)
        expect(rank).toBeGreaterThanOrEqual(seen)
        seen = rank
      }
      expect(house.parts[0]?.stage).toBe('tiang')
    }
  })
})

describe('the scene model', () => {
  /**
   * Two bands, because there is nothing else — and a site figure that is the
   * same building, abandoned.
   */
  it('reports two zones and the shelter that was left', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones).toHaveLength(2)
    expect(scene.site).toHaveLength(1)
    expect(scene.site[0]?.provenance).toBe('canon')
    expect(scene.site[0]?.volumes).toHaveLength(1)
    expect(scene.underfloorHeight).toBeCloseTo(DIMS.floorHeight.value, 9)
    const flat = buildHouse({ ...DEFAULT_RULES, panggung: false })
    expect(sceneModel(flat.house, flat.layout).underfloorHeight).toBe(0)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `rimba provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The thinnest-sourced pack in the collection, and it says so in its own
   * caution. There is no measured drawing of a sudung anywhere.
   */
  it('keeps every metre unsourced, body figures separately so', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(['none', 'anthropometry']).toContain(d.source)
    }
    expect(ALL_DIMS.filter((d) => d.source === 'anthropometry')).toHaveLength(3)
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
