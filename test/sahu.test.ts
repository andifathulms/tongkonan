import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/sahu/assembly'
import {
  checkDoorsAreNotAlike,
  checkEverybodyBows,
  checkNobodyIsShutOut,
  checkSeatsEverybody,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/sahu/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_BENTANG,
  MIN_BENTANG,
  PINTU,
  normaliseRules,
  partSplit,
  pintuInfo,
  provenanceSplit,
} from '@/lib/tradition/sahu/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/sahu/address'
import { resolveLayout, seats } from '@/lib/tradition/sahu/frame'
import { bowCounterexample } from '@/lib/tradition/sahu/counterexample'
import { sceneModel } from '@/lib/tradition/sahu/scene'
import { withDimValue } from '@/lib/tradition/sahu/whatif'
import { STAGE_ORDER } from '@/lib/tradition/sahu/types'
import { DIMS as MALUKU_DIMS } from '@/lib/tradition/maluku/rules'
import type { Rules } from '@/lib/tradition/sahu/types'

/** Both ends of the hall, all three door counts, with and without the cloths. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { bentang: MIN_BENTANG, pintu: 'dua', kain: false },
  { bentang: MAX_BENTANG, pintu: 'empat', kain: true },
  { bentang: 6, pintu: 'dua', kain: true },
  { bentang: 4, pintu: 'empat', kain: false },
]

const suite = (rules: Rules) => {
  const { house, layout } = buildHouse(rules)
  return { house, layout, results: runInvariants(house, layout, seats(layout)) }
}

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.bentang} bays with ${rules.pintu} openings, cloths ${rules.kain}`, () => {
      const { results } = suite(rules)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a difference stated in headroom', () => {
  it('cuts no two openings to the same height, and steps them in order', () => {
    for (const rules of COMBOS) {
      const { house, layout } = suite(rules)
      expect(checkDoorsAreNotAlike(house, layout).status).toBe('pass')
      const heads = layout.doors.map((d) => d.head)
      expect(new Set(heads.map((h) => h.toFixed(4))).size).toBe(heads.length)
      for (let i = 1; i < heads.length; i++) {
        const before = heads[i - 1]
        const here = heads[i]
        if (before === undefined || here === undefined) throw new Error('missing head')
        expect(before - here).toBeCloseTo(DIMS.headStep.value, 9)
      }
      expect(layout.doors).toHaveLength(pintuInfo(rules.pintu).count)
    }
  })

  /**
   * The claim that keeps the first one from being about humiliation, and it is
   * bounded on both sides — the ume kbubu's two-sided check applied to a set
   * of openings that differ from each other.
   */
  it('keeps every opening between a stooping body and a standing one', () => {
    for (const rules of COMBOS) {
      const { layout } = suite(rules)
      expect(checkEverybodyBows(layout).status).toBe('pass')
      for (const door of layout.doors) {
        expect(door.head).toBeLessThan(layout.body.standing)
        expect(door.head).toBeGreaterThan(layout.body.stooping)
      }
    }
    // And it bites on both sides.
    const tall = withDimValue('headHigh', DIMS.standingHeight.value + 0.1, () =>
      checkEverybodyBows(resolveLayout(DEFAULT_RULES)),
    )
    expect(tall.status).toBe('fail')
    const low = withDimValue('headHigh', DIMS.stoopingHeight.value, () =>
      checkEverybodyBows(resolveLayout(DEFAULT_RULES)),
    )
    expect(low.status).toBe('fail')
  })

  /**
   * The pairing this building is here for. The baileo's check says several
   * things of one kind must be equal; this one says they must differ. Both
   * packs declare their rule as canon, and this test is what would notice if
   * either quietly stopped.
   */
  it('is the exact inverse of the baileo’s claim about equal places', () => {
    expect(DIMS.doorsAreNotAlike.class).toBe('canon')
    expect(MALUKU_DIMS.onePlaceEachSoa.class).toBe('canon')
    expect(MALUKU_DIMS.onePlaceEachSoa.noteEn).toContain('all the places are the same')
  })
})

describe('open on every side', () => {
  it('builds no wall and no door leaf', () => {
    for (const rules of COMBOS) {
      const { house, layout } = suite(rules)
      expect(checkNobodyIsShutOut(house, layout).status).toBe('pass')
      expect(house.parts.some((p) => p.name === 'dinding')).toBe(false)
      // Nothing at all stands between the eave and the floor except posts,
      // jambs, heads and the cloths.
      const between = house.parts.filter((p) => {
        const b = partBounds(p)
        return b.min[1] > layout.floorY && b.max[1] < layout.eaveY
      })
      for (const part of between) {
        expect(['kusen', 'ambang', 'kain', 'bangku', 'tiang']).toContain(part.name)
      }
    }
  })
})

describe('a headcount that makes a room', () => {
  it('lengthens by a bench for every bay', () => {
    for (const rules of COMBOS) {
      const { layout } = suite(rules)
      expect(checkSeatsEverybody(layout, seats(layout)).status).toBe('pass')
      expect(seats(layout)).toBe(rules.bentang * DIMS.seatsPerBay.value)
      expect(layout.halfZ * 2).toBeCloseTo(DIMS.bayLength.value * rules.bentang, 9)
    }
    // The width does not move with it: what grows is the length of the table.
    const three = resolveLayout({ ...DEFAULT_RULES, bentang: 3 })
    const eight = resolveLayout({ ...DEFAULT_RULES, bentang: 8 })
    expect(three.halfX).toBeCloseTo(eight.halfX, 9)
  })
})

describe('the counterexample', () => {
  it('raises the guests’ opening until nobody has to bow at it', () => {
    const c = bowCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.highest).toBeLessThan(c.witness.sound.standing)
    expect(c.witness.broken.highest).toBeGreaterThan(c.witness.broken.standing)
    // The body does not move: the two numbers are independent.
    expect(c.witness.broken.standing).toBeCloseTo(c.witness.sound.standing, 9)
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
    expect(q).toContain('bentang=')
    expect(q).toContain('pintu=')
    expect(q).toContain('kain=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('bentang=&pintu=&kain=')).toEqual(normaliseRules(DEFAULT_RULES))
    expect(PINTU.map((p) => p.count)).toEqual([2, 3, 4])
  })
})

describe('the build sequence', () => {
  /** The openings are cut after the roof, because their heads come off its eave. */
  it('roofs the hall before cutting its openings', () => {
    for (const rules of COMBOS) {
      const { house } = suite(rules)
      expect(house.parts[0]?.stage).toBe('batu')
      const roof = house.parts.findIndex((p) => p.stage === 'atap')
      const door = house.parts.findIndex((p) => p.stage === 'pintu')
      expect(roof).toBeLessThan(door)
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
  it('stands the hall in the middle of the village', () => {
    const { house, layout } = suite(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.site).toHaveLength(1)
    expect(scene.site[0]?.provenance).toBe('canon')
    expect(scene.zones).toHaveLength(3)
    expect(scene.underfloorHeight).toBeCloseTo(layout.floorY, 9)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `sahu provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The step between openings is the figure this whole pack rests on and it is
   * the author's. The caution says so, and this test pins it where somebody
   * would otherwise be tempted to promote it.
   */
  it('keeps the step between openings interpolated and unsourced', () => {
    expect(DIMS.headStep.class).toBe('interpolated')
    expect(DIMS.headStep.source).toBe('none')
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(['none', 'anthropometry']).toContain(d.source)
    }
    expect(ALL_DIMS.filter((d) => d.source === 'anthropometry')).toHaveLength(2)
    for (const d of ALL_DIMS.filter((x) => x.class === 'canon')) expect(d.unit).not.toBe('m')
  })

  it('every part cites only declared dimensions', () => {
    for (const rules of COMBOS) {
      const { house } = suite(rules)
      for (const part of house.parts) {
        expect(part.dims.length).toBeGreaterThan(0)
        for (const key of part.dims) expect(DIM_KEYS).toContain(key)
      }
    }
    const { house } = suite(DEFAULT_RULES)
    const split = partSplit(house.parts)
    expect(split.measured).toBe(0)
    expect(split.interpolated).toBe(split.total)
  })
})
