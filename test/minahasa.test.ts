import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/minahasa/assembly'
import {
  checkCanBeUnbuilt,
  checkCutToTheRoad,
  checkEveryJointReversible,
  checkStairs,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/minahasa/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_RUANG,
  MIN_RUANG,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/minahasa/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/minahasa/address'
import { pieceAlong, resolveLayout } from '@/lib/tradition/minahasa/frame'
import { haulCounterexample } from '@/lib/tradition/minahasa/counterexample'
import { STAGE_ORDER } from '@/lib/tradition/minahasa/types'
import type { Rules } from '@/lib/tradition/minahasa/types'

/** Both stair arrangements, both ends of the size, movable and not. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { ruang: MIN_RUANG, tangga: 'satu', pindah: true },
  { ruang: MAX_RUANG, tangga: 'dua', pindah: false },
  { ruang: 5, tangga: 'satu', pindah: false },
  { ruang: 6, tangga: 'dua', pindah: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.ruang} bays, ${rules.tangga} stairs, movable ${rules.pindah}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      // The survey always skips; the haul check skips too when the house is
      // not built to move, which is the rule going quiet rather than passing.
      expect(summarise(results).skipped).toBe(rules.pindah ? 1 : 2)
    })
  }
})

describe('a house made to be taken apart', () => {
  /**
   * The check this building exists for. Every other pack asks whether the
   * house can go up; this one also asks whether it can come down.
   */
  it('runs its own build order backwards with nothing left carrying anything', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkCanBeUnbuilt(house).status).toBe('pass')
    }
  })

  /**
   * And the check has teeth: a part placed before the thing that holds it up
   * passes the forward check — it touches the body of the house — and fails
   * this one, which is exactly the fault that was found writing this pack.
   */
  it('refuses a house whose parts hold each other up in the wrong order', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const parts = [...house.parts]
    const deck = parts.findIndex((p) => p.id === 'serambi')
    const post = parts.findIndex((p) => p.id === 'tiang-serambi-a')
    expect(deck).toBeGreaterThan(post)
    // Put the deck back before its own posts, as the first draft had it.
    const moved = [...parts]
    const [taken] = moved.splice(deck, 1)
    if (!taken) throw new Error('no veranda')
    moved.splice(post, 0, taken)
    expect(checkCanBeUnbuilt({ ...house, parts: moved }).status).toBe('fail')
  })

  it('cuts every member short enough to be carried, when it is built to move', () => {
    for (const rules of COMBOS.filter((r) => r.pindah)) {
      const { house, layout } = buildHouse(rules)
      expect(checkCutToTheRoad(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        if (part.stage === 'atap' || part.stage === 'batu') continue
        const b = partBounds(part)
        const run = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2])
        expect(run).toBeLessThanOrEqual(layout.haulLength + 1e-6)
      }
    }
  })

  /**
   * Turning the rule off is how a reader sees what it costs: the same house
   * with longer members, fewer pieces, and no way to move it.
   */
  it('makes longer members and fewer of them when it is not', () => {
    const movable = buildHouse({ ...DEFAULT_RULES, pindah: true })
    const fixed = buildHouse({ ...DEFAULT_RULES, pindah: false })
    expect(pieceAlong(movable.layout)).toHaveLength(DEFAULT_RULES.ruang)
    expect(pieceAlong(fixed.layout)).toHaveLength(1)
    expect(fixed.house.parts.length).toBeLessThan(movable.house.parts.length)
    expect(checkCutToTheRoad(fixed.house, fixed.layout).status).toBe('skip')
    // And the fixed house is still a sound building: it simply cannot leave.
    expect(checkCanBeUnbuilt(fixed.house).status).toBe('pass')
  })

  it('pegs every joint, because a peg comes out again', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkEveryJointReversible(house).status).toBe('pass')
      expect(new Set(house.joints.map((j) => j.kind))).toEqual(new Set(['pasak']))
    }
  })

  it('leaves the stones behind, which is the one part that does not travel', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const stones = house.parts.filter((p) => p.stage === 'batu')
    expect(stones.length).toBe((DEFAULT_RULES.ruang + 1) * 2)
    for (const stone of stones) expect(partBounds(stone).min[1]).toBeCloseTo(0, 6)
  })

  it('carries two equal stairs, or one in the middle', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkStairs(house, layout).status).toBe('pass')
      expect(layout.stairs).toHaveLength(rules.tangga === 'dua' ? 2 : 1)
    }
  })
})

describe('the counterexample', () => {
  it('widens the house until it can no longer leave', () => {
    const c = haulCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.longest).toBeGreaterThan(c.witness.broken.allowed)
    expect(c.witness.sound.longest).toBeLessThanOrEqual(c.witness.sound.allowed)
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
    expect(q).toContain('ruang=')
    expect(q).toContain('tangga=')
    expect(q).toContain('pindah=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('ruang=&tangga=&pindah=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('sets the stones first and the shingles last', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    expect(house.parts[0]?.stage).toBe('batu')
    expect(house.parts[house.parts.length - 1]?.stage).toBe('atap')
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
      `minahasa provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The haul length is the odd number in this table: it is not a dimension of
   * the building, of the people in it, or of the place. It is the size of a
   * journey, and nobody measured it here either.
   */
  it('leaves every metric figure unsourced, the haul length included', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(10)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.haulLength.class).toBe('interpolated')
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
