import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/karo/assembly'
import {
  checkHearthClearance,
  checkNoPartitions,
  checkOrderedByTheTree,
  checkSharedHearths,
  hearthGaps,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/karo/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_JABU,
  MIN_JABU,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/karo/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/karo/address'
import { resolveLayout } from '@/lib/tradition/karo/frame'
import { hearthCounterexample } from '@/lib/tradition/karo/counterexample'
import { STAGE_ORDER } from '@/lib/tradition/karo/types'
import { buildHouse as buildBetang } from '@/lib/tradition/dayak/assembly'
import { DEFAULT_RULES as BETANG_RULES } from '@/lib/tradition/dayak/rules'
import type { Rules } from '@/lib/tradition/karo/types'

/** Every household count, both door rules, with and without the tier. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { jabu: MIN_JABU, tersek: false, pintu: 'satu' },
  { jabu: 6, tersek: true, pintu: 'satu' },
  { jabu: MAX_JABU, tersek: false, pintu: 'dua' },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.jabu} households, ${rules.pintu} door(s), tersek ${rules.tersek}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the third answer to households under one roof', () => {
  /**
   * The claim this building was added to make, and the comparison is the
   * point: the betang divides, this one does not.
   */
  it('puts every household in one room with nothing between them', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkNoPartitions(house, layout).status).toBe('pass')
      expect(layout.jabu).toHaveLength(rules.jabu)
    }

    /*
     * The betang, for contrast, and it is the whole reason this house is here:
     * the same social fact answered with a partition between every pair of
     * households, where this one answers it with nothing at all.
     */
    const betang = buildBetang(BETANG_RULES)
    const walls = betang.house.parts.filter((p) => p.name === 'sekat')
    expect(walls.length).toBeGreaterThan(0)
  })

  it('shares one hearth between each pair, one on either side of it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkSharedHearths(house, layout).status).toBe('pass')
      expect(layout.hearths).toHaveLength(rules.jabu / 2)
      for (const hearth of layout.hearths) {
        const pair = layout.jabu.filter((j) => j.hearth === hearth.index)
        expect(pair).toHaveLength(2)
        expect(pair[0]?.z).toBeCloseTo(-(pair[1]?.z ?? 0), 9)
      }
    }
  })

  /**
   * With no partitions the only thing keeping a fire off the frame is a
   * distance, which is why the clearance is a declared dimension here and is
   * not one anywhere else in the project.
   */
  it('keeps every fire clear of the frame by distance alone', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkHearthClearance(house, layout).status).toBe('pass')
      for (const gap of hearthGaps(house, layout)) {
        expect(gap.gap).toBeGreaterThanOrEqual(DIMS.hearthClearance.value - 1e-4)
      }
    }
  })

  /**
   * The order runs from the root end of the timber. Reverse it and the model
   * is byte-identical apart from which household is called senior — which is
   * exactly why it needs a check rather than a comment.
   */
  it('ranks the places from the root end of the tree', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkOrderedByTheTree(layout).status).toBe('pass')
      const sorted = [...layout.jabu].sort((a, b) => a.rank - b.rank)
      expect(sorted[0]?.nameEn).toContain('base-of-the-tree')
      expect(sorted[sorted.length - 1]?.nameEn).toContain('tip')
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]?.x ?? 0).toBeGreaterThanOrEqual((sorted[i - 1]?.x ?? 0) - 1e-9)
      }
    }
  })

  /** Households come in pairs, because a hearth is shared by two. */
  it('rounds an odd household count to a pair', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, jabu: 5 }).jabu).toBe(6)
    expect(normaliseRules({ ...DEFAULT_RULES, jabu: 7 }).jabu).toBe(8)
    expect(normaliseRules({ ...DEFAULT_RULES, jabu: 99 }).jabu).toBe(MAX_JABU)
  })

  /** One door means everybody enters past the senior household's place. */
  it('puts the door at the root end whichever rule is in force', () => {
    for (const pintu of ['satu', 'dua'] as const) {
      const layout = resolveLayout({ ...DEFAULT_RULES, pintu })
      expect(layout.doors).toHaveLength(pintu === 'dua' ? 2 : 1)
      expect(layout.doors[0]?.x).toBeCloseTo(layout.benaX, 9)
    }
  })

  /** The tersek shelters nothing: it stands on the roof, above the ridge. */
  it('stands the upper tier on the roof rather than on the building', () => {
    const withTier = buildHouse({ ...DEFAULT_RULES, tersek: true })
    const without = buildHouse({ ...DEFAULT_RULES, tersek: false })
    expect(withTier.house.parts.some((p) => p.stage === 'tersek')).toBe(true)
    expect(without.house.parts.some((p) => p.stage === 'tersek')).toBe(false)
    expect(withTier.house.bounds.max[1]).toBeGreaterThan(without.house.bounds.max[1])
    const tier = withTier.house.parts.find((p) => p.stage === 'tersek')
    if (!tier) throw new Error('no tersek')
    expect(partBounds(tier).min[1]).toBeGreaterThan(withTier.layout.plateY)
  })
})

describe('the counterexample', () => {
  it('grows the fire until it reaches the frame', () => {
    const c = hearthCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.gap).toBeLessThan(c.witness.broken.needed)
    expect(c.witness.sound.gap).toBeGreaterThanOrEqual(c.witness.sound.needed)
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
    expect(q).toContain('jabu=')
    expect(q).toContain('tersek=')
    expect(q).toContain('pintu=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('jabu=&tersek=&pintu=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('lays the great beams before the floor they carry', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const beam = house.parts.findIndex((p) => p.name === 'balok')
    const floor = house.parts.findIndex((p) => p.stage === 'lantai')
    expect(beam).toBeGreaterThanOrEqual(0)
    expect(beam).toBeLessThan(floor)
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
      `karo provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The clearance is the odd figure in this table: it is a safety distance
   * rather than a dimension of anything, and it exists only because there are
   * no partitions. Nobody measured it here either.
   */
  it('leaves every metric figure unsourced, the clearance included', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(10)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.hearthClearance.class).toBe('interpolated')
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
