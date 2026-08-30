import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/riau/assembly'
import {
  checkAislesHaveFallen,
  checkOneStepNotAStair,
  checkPassWithoutEntering,
  checkRaisedOnlyAtTheEnds,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/riau/invariants'
import {
  ALL_DIMS,
  ANJUNG,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_RUANG,
  MIN_RUANG,
  anjungInfo,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/riau/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/riau/address'
import { resolveLayout } from '@/lib/tradition/riau/frame'
import { stepCounterexample } from '@/lib/tradition/riau/counterexample'
import { sceneModel } from '@/lib/tradition/riau/scene'
import { withDimValue } from '@/lib/tradition/riau/whatif'
import { STAGE_ORDER } from '@/lib/tradition/riau/types'
import { DIMS as PALEMBANG_DIMS } from '@/lib/tradition/palembang/rules'
import type { Rules } from '@/lib/tradition/riau/types'

/** Both ends of the hall, all three anjung arrangements, deck and no deck. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { ruang: MIN_RUANG, anjung: 'tidak', pelantar: false },
  { ruang: MAX_RUANG, anjung: 'satu', pelantar: true },
  { ruang: 4, anjung: 'dua', pelantar: false },
  { ruang: 6, anjung: 'tidak', pelantar: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.ruang} bays with ${rules.anjung} anjung, deck ${rules.pelantar}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a floor that steps down', () => {
  it('drops both aisles below the middle floor, and by the same amount', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkAislesHaveFallen(house, layout).status).toBe('pass')
      expect(layout.aisles).toHaveLength(2)
      const levels = new Set(layout.aisles.map((a) => a.floorY.toFixed(6)))
      expect(levels.size).toBe(1)
      for (const aisle of layout.aisles) {
        expect(aisle.floorY).toBeLessThan(layout.middle.floorY)
        expect(layout.middle.floorY - aisle.floorY).toBeCloseTo(DIMS.selasoDrop.value, 9)
      }
    }
  })

  /**
   * The claim worth stating against the rumah limas, which steps the same
   * plane in the other direction and means something else by it. Both packs
   * declare their rule as canon; this test notices if either stops.
   */
  it('is the opposite step from the rumah limas’s', () => {
    expect(DIMS.theAisleHasFallen.class).toBe('canon')
    expect(PALEMBANG_DIMS.floorIsTheHierarchy.class).toBe('canon')
  })

  /** The fall is in the frame: the aisle posts are cut shorter. */
  it('puts the fall in the length of a post', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const posts = house.parts.filter((p) => p.name === 'tiang' && p.kind === 'box')
    const tops = posts.map((p) => partBounds(p).max[1])
    const inner = layout.middle.floorY
    const outer = layout.aisles[0]?.floorY ?? 0
    expect(tops.some((t) => Math.abs(t - inner) < 1e-6)).toBe(true)
    expect(tops.some((t) => Math.abs(t - outer) < 1e-6)).toBe(true)
  })
})

describe('one step, not a stair', () => {
  it('keeps the fall inside a single step', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkOneStepNotAStair(layout).status).toBe('pass')
      expect(layout.drop.fall).toBeLessThanOrEqual(layout.drop.step)
    }
    expect(DIMS.stepLimit.source).toBe('anthropometry')
  })

  it('refuses a fall a person would have to negotiate', () => {
    const deep = withDimValue('selasoDrop', DIMS.stepLimit.value + 0.1, () =>
      checkOneStepNotAStair(resolveLayout(DEFAULT_RULES)),
    )
    expect(deep.status).toBe('fail')
  })
})

describe('a way past that is not a way in', () => {
  it('leaves both aisles clear from end to end', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkPassWithoutEntering(house, layout).status).toBe('pass')
      // The aisle floors run the full length of the middle room.
      const floors = house.parts.filter((p) => p.name === 'selaso')
      expect(floors).toHaveLength(2)
      for (const floor of floors) {
        const b = partBounds(floor)
        expect(b.max[2] - b.min[2]).toBeCloseTo(layout.middle.halfZ * 2, 6)
      }
    }
  })

  it('raises nothing inside the middle room', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      expect(checkRaisedOnlyAtTheEnds(layout).status).toBe('pass')
      expect(layout.anjung).toHaveLength(anjungInfo(rules.anjung).count)
      for (const end of layout.anjung) {
        expect(Math.abs(end.z)).toBeGreaterThan(layout.middle.halfZ)
        expect(end.floorY).toBeGreaterThan(layout.middle.floorY)
      }
    }
  })

  /** The rear deck stays at the level of the way through, not of the room. */
  it('keeps the rear deck at aisle level', () => {
    const layout = resolveLayout({ ...DEFAULT_RULES, pelantar: true })
    expect(layout.pelantar.present).toBe(true)
    expect(layout.pelantar.floorY).toBeCloseTo(layout.aisles[0]?.floorY ?? 0, 9)
  })
})

describe('the counterexample', () => {
  it('drops the aisles further until the step stops being one', () => {
    const c = stepCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.fall).toBeLessThanOrEqual(c.witness.sound.step)
    expect(c.witness.broken.fall).toBeGreaterThan(c.witness.broken.step)
    // The body does not move: the two numbers belong to different parties.
    expect(c.witness.broken.step).toBeCloseTo(c.witness.sound.step, 9)
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
    expect(q).toContain('anjung=')
    expect(q).toContain('pelantar=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('ruang=&anjung=&pelantar=')).toEqual(normaliseRules(DEFAULT_RULES))
    expect(ANJUNG.map((a) => a.count)).toEqual([0, 1, 2])
  })
})

describe('the build sequence', () => {
  it('sets the stones, stands posts of two lengths, then lays three floors', () => {
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
      expect(house.parts[house.parts.length - 1]?.stage).toBe('selembayung')
    }
  })
})

describe('the scene model', () => {
  it('reports the lower of the two floors as the clearance', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeCloseTo(layout.aisles[0]?.floorY ?? 0, 9)
    expect(scene.zones).toHaveLength(3)
    expect(scene.site).toHaveLength(1)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `riau provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('keeps every metre unsourced, and the body figure separately so', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(['none', 'anthropometry']).toContain(d.source)
    }
    expect(ALL_DIMS.filter((d) => d.source === 'anthropometry')).toHaveLength(1)
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
