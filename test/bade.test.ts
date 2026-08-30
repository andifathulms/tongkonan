import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/bade/assembly'
import {
  centreOf,
  checkCarriedNotFounded,
  checkNothingLasts,
  checkOverTheBearers,
  checkTiers,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/bade/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_TUMPANG,
  MIN_TUMPANG,
  PEMIKUL,
  frameOf,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/bade/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/bade/address'
import { resolveLayout } from '@/lib/tradition/bade/frame'
import { bearersCounterexample } from '@/lib/tradition/bade/counterexample'
import { sceneModel } from '@/lib/tradition/bade/scene'
import { withDimValue } from '@/lib/tradition/bade/whatif'
import { STAGE_ORDER } from '@/lib/tradition/bade/types'
import type { Rules } from '@/lib/tradition/bade/types'

/** Both ends of the ladder, all three crowds, with and without the umbrella. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { tumpang: MIN_TUMPANG, pemikul: 'delapan-puluh', payung: false },
  { tumpang: MAX_TUMPANG, pemikul: 'dua-puluh', payung: true },
  { tumpang: 5, pemikul: 'empat-puluh', payung: false },
  { tumpang: 9, pemikul: 'delapan-puluh', payung: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.tumpang} tiers on ${rules.pemikul} bearers, umbrella ${rules.payung}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a building with no foundation', () => {
  /**
   * The claim the whole pack rests on, and it is a claim about absence: no
   * post is buried, no stone is set, nothing reaches below the lattice. The
   * other twenty-two buildings all fail this by design.
   */
  it('is carried rather than founded', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkCarriedNotFounded(house, layout).status).toBe('pass')
      const lattice = house.parts.filter((p) => p.stage === 'usungan')
      expect(lattice.length).toBeGreaterThan(2)
      const lowest = Math.min(...house.parts.map((p) => partBounds(p).min[1]))
      expect(lowest).toBeGreaterThanOrEqual(-1e-9)
      expect(Math.min(...lattice.map((p) => partBounds(p).min[1]))).toBeCloseTo(lowest, 9)
    }
  })

  /**
   * The plan is a headcount. Every other plan in this project comes from a
   * room, a rank, a body or a household; this one is how many shoulders can
   * get underneath, and the three sizes are three different crowds.
   */
  it('takes its plan from how many people can get under it', () => {
    const sides = PEMIKUL.map((p) => frameOf(p.pemikul))
    expect(sides).toEqual([...sides].sort((a, b) => a - b))
    expect(new Set(sides).size).toBe(3)
    for (const p of PEMIKUL) {
      const layout = resolveLayout({ ...DEFAULT_RULES, pemikul: p.pemikul })
      expect(layout.frame.halfX * 2).toBeCloseTo(frameOf(p.pemikul), 9)
      expect(layout.frame.bearers).toBe(p.count)
    }
  })

  /**
   * The lattice is read live from the pack rather than copied at import time.
   *
   * This is the fault the Banjar pack shipped and had to be fixed: a table
   * beside the dimension table holding `value` rather than the key, so
   * `withDimValue` moved a number nothing read and the sensitivity probe and
   * the counterexample were both blind to it.
   */
  it('reads the lattice from the pack, not from a copy taken at import time', () => {
    const before = resolveLayout(DEFAULT_RULES).frame.halfX
    const during = withDimValue('frameMedium', DIMS.frameMedium.value * 2, () =>
      resolveLayout(DEFAULT_RULES).frame.halfX,
    )
    expect(during).toBeCloseTo(before * 2, 9)
  })

  /** Everything on it burns, which is the waruga's claim turned inside out. */
  it('is made of four materials and not one of them lasts', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkNothingLasts(house).status).toBe('pass')
      // Widened to strings on purpose: this pack's `MaterialKey` union has no
      // stone in it, so asking whether stone is present does not type-check
      // against the union — the union has already made the claim. What is
      // worth asserting is that the parts use several materials and that none
      // of them is one of the permanent ones.
      const kinds = new Set<string>(house.parts.map((p) => p.material))
      expect([...kinds].filter((k) => ['batu', 'genteng', 'bata', 'paras'].includes(k))).toEqual([])
      expect(kinds.size).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('the tiers', () => {
  /** The rungs are odd, so an even count is not a smaller claim — it is not a claim. */
  it('moves an even count up to the next rung', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 6 }).tumpang).toBe(7)
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 2 }).tumpang).toBe(3)
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 99 }).tumpang).toBe(MAX_TUMPANG)
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 0 }).tumpang).toBe(MIN_TUMPANG)
  })

  it('climbs, narrows, and is counted', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkTiers(house, layout).status).toBe('pass')
      expect(house.parts.filter((p) => p.stage === 'tumpang')).toHaveLength(rules.tumpang)
    }
  })

  /**
   * Nothing is under them. On a joglo the tumpang are a roof over a room and
   * the rank is carried by what it shelters; here the tiers are the statement
   * with air beneath, which is a thing about the building that no geometry
   * check would notice, so it is asserted directly.
   */
  it('shelters nothing: no part stands inside the stack', () => {
    const { house, layout } = buildHouse({ ...DEFAULT_RULES, tumpang: 9 })
    const first = layout.tiers[0]
    if (!first) throw new Error('no tiers')
    const inside = house.parts.filter((p) => {
      const b = partBounds(p)
      return b.min[1] > first.y + 1e-6 && p.stage !== 'tumpang' && p.stage !== 'kain' && p.stage !== 'payung'
    })
    expect(inside).toEqual([])
  })
})

describe('balance over the crowd', () => {
  /**
   * The check was first written as the distance of the centre of all the parts
   * from the middle of the lattice — which is zero at every rule combination,
   * because the tower is symmetric about both axes. A check restating its own
   * input, for the fourth time in this project. This test is what would have
   * caught it: the number it reports has to move when a rule moves.
   */
  it('reports a number that the rules actually change', () => {
    const readings = COMBOS.map((rules) => {
      const layout = resolveLayout(rules)
      const { house } = buildHouse(rules)
      return centreOf(house.parts).y / layout.frame.halfX
    })
    expect(new Set(readings.map((r) => r.toFixed(3))).size).toBe(readings.length)
    const tall = readings[2]
    const low = readings[1]
    if (tall === undefined || low === undefined) throw new Error('missing readings')
    // Eleven tiers on twenty bearers is the most slender address the rules
    // allow; one tier on eighty is the least. They are the two ends of it.
    expect(tall).toBeGreaterThan(low * 2)
  })

  it('keeps everything above the lattice inboard of it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkOverTheBearers(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        if (part.stage === 'usungan') continue
        const b = partBounds(part)
        expect(b.max[0]).toBeLessThanOrEqual(layout.frame.halfX + 1e-6)
        expect(b.max[2]).toBeLessThanOrEqual(layout.frame.halfZ + 1e-6)
      }
    }
  })
})

describe('the counterexample', () => {
  it('raises each tier until the weight is too far above the people holding it', () => {
    const c = bearersCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.slenderness).toBeGreaterThan(c.witness.sound.slenderness)
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
    expect(q).toContain('tumpang=')
    expect(q).toContain('pemikul=')
    expect(q).toContain('payung=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('tumpang=&pemikul=&payung=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('builds the lattice before anything it carries', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      const lattice = house.parts.findIndex((p) => p.stage === 'usungan')
      const body = house.parts.findIndex((p) => p.stage === 'badan')
      expect(lattice).toBe(0)
      expect(body).toBeGreaterThan(lattice)
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

describe('the scene model', () => {
  /**
   * The tenth meaning of `underfloorHeight`, and the first with no space under
   * it at all: what is under this building is a crowd.
   */
  it('reports the depth of the lattice where other buildings report a clearance', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeCloseTo(DIMS.frameDepth.value, 9)
    expect(scene.zones).toHaveLength(3)
    expect(scene.site).toHaveLength(1)
    // A route rather than a place: the only site figure in the collection with
    // no volumes on it at all.
    expect(scene.site[0]?.volumes).toEqual([])
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `bade provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * Every metric figure here is the author's, and the reason is not laziness:
   * a bade is burned the afternoon it is finished, so the only one anybody
   * could measure is one that has not been used yet. The waruga, two buildings
   * ago, is the other end of that — hundreds still standing in fields.
   */
  it('keeps every metre unsourced, and says why in the pack', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(ALL_DIMS.some((d) => d.class === 'canon')).toBe(true)
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
