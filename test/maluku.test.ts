import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/maluku/assembly'
import {
  checkOnePlacePerSoa,
  checkOpenOnAllSides,
  checkPlacesAreEqual,
  checkStoneIsClear,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/maluku/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_SOA,
  MIN_SOA,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/maluku/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/maluku/address'
import { resolveLayout } from '@/lib/tradition/maluku/frame'
import { screenCounterexample } from '@/lib/tradition/maluku/counterexample'
import { sceneModel } from '@/lib/tradition/maluku/scene'
import { STAGE_ORDER } from '@/lib/tradition/maluku/types'
import { buildHouse as buildLimas } from '@/lib/tradition/palembang/assembly'
import { DEFAULT_RULES as LIMAS_RULES } from '@/lib/tradition/palembang/rules'
import type { Rules } from '@/lib/tradition/maluku/types'

/** Both stone arrangements, both ends of the tally, with and without a screen. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { soa: MIN_SOA, pamali: 'dalam', sekat: true },
  { soa: MAX_SOA, pamali: 'depan', sekat: false },
  { soa: 6, pamali: 'dalam', sekat: false },
  { soa: 7, pamali: 'depan', sekat: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.soa} soa, stone ${rules.pamali}, screen ${rules.sekat}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a building that belongs to nobody', () => {
  /**
   * The tally, and what makes it a different tally from every other one here:
   * it counts clans entitled to sit rather than families living inside.
   */
  it('gives every soa one bay, one pair of posts and one seat', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkOnePlacePerSoa(house, layout).status).toBe('pass')
      expect(layout.soa).toHaveLength(rules.soa)
      expect(house.parts.filter((p) => p.name === 'tiang')).toHaveLength(rules.soa * 2)
      expect(house.parts.filter((p) => p.name === 'tempat')).toHaveLength(rules.soa * 2)
    }
  })

  /**
   * The inverse of the Palembang kekijing, and the comparison is the reason
   * this building is here: the limas states standing by raising its floor, and
   * this one states equality by refusing to.
   */
  it('keeps its floor on one plane, where the rumah limas steps its own', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(checkPlacesAreEqual(house, layout).status).toBe('pass')
    const floors = house.parts.filter((p) => p.stage === 'lantai').map((p) => partBounds(p).max[1])
    expect(new Set(floors.map((y) => y.toFixed(4))).size).toBe(1)

    // The limas, for contrast: its floor is deliberately at several heights.
    const limas = buildLimas(LIMAS_RULES)
    const steps = limas.house.parts
      .filter((p) => p.stage === 'lantai')
      .map((p) => partBounds(p).max[1].toFixed(3))
    expect(new Set(steps).size).toBeGreaterThan(1)
  })

  it('makes every seat the same size and the same height', () => {
    const { house } = buildHouse({ soa: MAX_SOA, pamali: 'depan', sekat: false })
    const seats = house.parts.filter((p) => p.name === 'tempat').map((p) => {
      const b = partBounds(p)
      return [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2], b.max[1]]
        .map((n) => n.toFixed(4))
        .join('|')
    })
    expect(new Set(seats).size).toBe(1)
  })

  /**
   * The openness is measured against a person, not against a list of parts.
   * A knee-high screen is allowed and changes nothing; the counterexample is
   * the same board raised.
   */
  it('stays open past a seated eye, screen or no screen', () => {
    for (const sekat of [false, true]) {
      const { house, layout } = buildHouse({ ...DEFAULT_RULES, sekat })
      expect(checkOpenOnAllSides(house, layout).status).toBe('pass')
      const edge = house.parts.filter((p) => p.stage === 'sekat')
      expect(edge.length).toBe(sekat ? 3 : 0)
      for (const p of edge) {
        expect(partBounds(p).max[1] - layout.sightBand.fromY).toBeLessThan(DIMS.seatedEye.value)
      }
    }
  })

  /** No storey: one occupied level, and the scene model says so in its bands. */
  it('has one occupied level and no loft', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones).toHaveLength(3)
    expect(scene.zones[1]?.key).toBe('lantai')
    expect(house.parts.some((p) => p.stage === 'lantai' && partBounds(p).min[1] > layout.plateY)).toBe(
      false,
    )
  })

  /**
   * Both arrangements of the stone satisfy the same rule in different ways:
   * in front, nothing reaches over it; inside, the floor opens around it.
   */
  it('never builds over the stone, wherever it stands', () => {
    for (const pamali of ['depan', 'dalam'] as const) {
      const { house, layout } = buildHouse({ ...DEFAULT_RULES, pamali })
      expect(checkStoneIsClear(house, layout).status).toBe('pass')
      const floors = house.parts.filter((p) => p.stage === 'lantai')
      // In front, every bay is one board. Inside, the stone stands on a joint
      // between bays — there is no bearer there — so the two bays it reaches
      // into are each laid as a pair, and the slot runs between them.
      expect(floors.length).toBe(pamali === 'dalam' ? DEFAULT_RULES.soa + 2 : DEFAULT_RULES.soa)
    }
  })
})

describe('the counterexample', () => {
  it('raises the screen until a seated saniri cannot be seen', () => {
    const c = screenCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.screen).toBeGreaterThan(c.witness.broken.eye)
    expect(c.witness.sound.screen).toBeLessThan(c.witness.sound.eye)
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
    expect(q).toContain('soa=')
    expect(q).toContain('pamali=')
    expect(q).toContain('sekat=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('soa=&pamali=&sekat=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('sets the stone before the first post', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const stone = house.parts.findIndex((p) => p.id === 'batu-pamali')
    const post = house.parts.findIndex((p) => p.name === 'tiang')
    expect(stone).toBeGreaterThanOrEqual(0)
    expect(stone).toBeLessThan(post)
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
      `maluku provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * `seatedEye` is the odd one in this table and has to stay honest: it is a
   * dimension of a person, it moves nothing in the model, and it decides
   * whether the model passes. Nobody measured it here either.
   */
  it('leaves every metric figure unsourced, the eye height included', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(10)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.seatedEye.class).toBe('interpolated')
  })

  it('counts every part as interpolated, since every one depends on an invented metre', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const split = partSplit(house.parts)
    expect(split.measured).toBe(0)
    expect(split.interpolated).toBe(split.total)
  })

  it('every part cites only declared dimensions', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      for (const part of house.parts) {
        expect(part.dims.length).toBeGreaterThan(0)
        for (const key of part.dims) expect(DIM_KEYS).toContain(key)
      }
    }
  })
})
