import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/mentawai/assembly'
import {
  checkFloorSpans,
  checkOpenAtTheFront,
  checkSharesAreEqual,
  checkTheRecordIsShared,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/mentawai/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_KELUARGA,
  MIN_KELUARGA,
  SERAMBI,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/mentawai/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/mentawai/address'
import { resolveLayout } from '@/lib/tradition/mentawai/frame'
import { spanCounterexample } from '@/lib/tradition/mentawai/counterexample'
import { sceneModel } from '@/lib/tradition/mentawai/scene'
import { withDimValue } from '@/lib/tradition/mentawai/whatif'
import { STAGE_ORDER } from '@/lib/tradition/mentawai/types'
import type { Rules } from '@/lib/tradition/mentawai/types'

/** Both ends of the tally, both veranda arrangements, with and without the board. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { keluarga: MIN_KELUARGA, serambi: 'depan', jaraik: false },
  { keluarga: MAX_KELUARGA, serambi: 'depan-belakang', jaraik: true },
  { keluarga: 6, serambi: 'depan', jaraik: true },
  { keluarga: 4, serambi: 'depan-belakang', jaraik: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.keluarga} households, ${rules.serambi}, jaraik ${rules.jaraik}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('what a model can say about a house with no chief', () => {
  /**
   * The claim this entry is here for is `nobodyIsSenior`, and there is no
   * invariant for it on purpose. What the checks establish is narrower and
   * these tests hold them to exactly that.
   */
  it('gives every household the same share and the same hearth', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkSharesAreEqual(house, layout).status).toBe('pass')
      const hearths = house.parts.filter((p) => p.name === 'perapian')
      expect(hearths).toHaveLength(rules.keluarga)
      const sizes = new Set(hearths.map((p) => (p.kind === 'box' ? p.size.join(',') : 'mesh')))
      expect(sizes.size).toBe(1)
      const shares = new Set(layout.households.map((h) => h.share.toFixed(6)))
      expect(shares.size).toBe(1)
    }
  })

  /**
   * And the honest limit, asserted rather than assumed: the rule that matters
   * most is declared canon and no check reports on it. If somebody later
   * writes one, this test is what should make them stop and think about what
   * it could possibly be measuring.
   */
  it('declares the absence of a chief and checks nothing for it', () => {
    expect(DIMS.nobodyIsSenior.class).toBe('canon')
    expect(DIMS.nobodyIsSenior.value).toBe(0)
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const keys = runInvariants(house, layout).map((r) => r.key)
    expect(keys).not.toContain('nobody-is-senior')
    expect(keys).toContain('shares-are-equal')
  })

  it('leaves the front veranda open, with nothing across it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkOpenAtTheFront(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        if (part.name !== 'dinding' && part.name !== 'sekat') continue
        const b = partBounds(part)
        expect((b.min[2] + b.max[2]) / 2).toBeGreaterThanOrEqual(layout.room.from - 1e-6)
      }
    }
  })

  it('hangs one record, and hangs it where everybody is', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkTheRecordIsShared(house, layout).status).toBe('pass')
      const boards = house.parts.filter((p) => p.name === 'jaraik')
      expect(boards).toHaveLength(rules.jaraik ? 1 : 0)
      for (const board of boards) {
        const b = partBounds(board)
        expect((b.min[2] + b.max[2]) / 2).toBeLessThan(layout.room.from)
      }
    }
  })
})

describe('a floor that has to spring', () => {
  it('keeps the bearers inside what a plank crosses', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkFloorSpans(layout).status).toBe('pass')
      expect(layout.span.clear).toBeLessThanOrEqual(layout.span.plank)
    }
  })

  it('grows the house by one share for every household', () => {
    const four = resolveLayout({ ...DEFAULT_RULES, keluarga: 4 })
    const five = resolveLayout({ ...DEFAULT_RULES, keluarga: 5 })
    expect(five.halfZ * 2 - four.halfZ * 2).toBeCloseTo(DIMS.shareLength.value, 9)
    expect(four.halfX).toBeCloseTo(five.halfX, 9)
    // And the verandas do not move with it: what lengthens is the room.
    expect(four.room.from - four.front.from).toBeCloseTo(five.room.from - five.front.from, 9)
  })

  it('reads the veranda count from the rule, not from a copy', () => {
    const one = resolveLayout({ ...DEFAULT_RULES, serambi: 'depan' })
    const two = resolveLayout({ ...DEFAULT_RULES, serambi: 'depan-belakang' })
    expect(one.back.present).toBe(false)
    expect(two.back.present).toBe(true)
    expect(two.halfZ * 2 - one.halfZ * 2).toBeCloseTo(DIMS.backDepth.value, 9)
    expect(SERAMBI.map((s) => s.count)).toEqual([1, 2])
    const during = withDimValue('backDepth', DIMS.backDepth.value * 2, () =>
      resolveLayout({ ...DEFAULT_RULES, serambi: 'depan-belakang' }).halfZ * 2,
    )
    expect(during).toBeCloseTo(two.halfZ * 2 + DIMS.backDepth.value, 9)
  })
})

describe('the counterexample', () => {
  it('spaces the bearers for dancing until the planks no longer cross', () => {
    const c = spanCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.clear).toBeLessThanOrEqual(c.witness.sound.plank)
    expect(c.witness.broken.clear).toBeGreaterThan(c.witness.broken.plank)
    // The plank does not change: the two numbers are independent.
    expect(c.witness.broken.plank).toBeCloseTo(c.witness.sound.plank, 9)
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
    expect(q).toContain('keluarga=')
    expect(q).toContain('serambi=')
    expect(q).toContain('jaraik=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('keluarga=&serambi=&jaraik=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('sets the stones first and raises the stages in order', () => {
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
  it('says its bands are the wrong axis, and reports them anyway', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones).toHaveLength(3)
    expect(scene.underfloorHeight).toBeCloseTo(layout.floorY, 9)
    expect(scene.site).toHaveLength(1)
    expect(scene.site[0]?.provenance).toBe('canon')
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `mentawai provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
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
