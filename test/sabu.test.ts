import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/sabu/assembly'
import {
  checkEndsAreNotAlike,
  checkHullProportion,
  checkRoofIsTheHull,
  checkWayIn,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/sabu/invariants'
import {
  ALL_DIMS,
  ATAP,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_RUANG,
  MIN_RUANG,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/sabu/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/sabu/address'
import { resolveLayout } from '@/lib/tradition/sabu/frame'
import { hullCounterexample } from '@/lib/tradition/sabu/counterexample'
import { sceneModel } from '@/lib/tradition/sabu/scene'
import { withDimValue } from '@/lib/tradition/sabu/whatif'
import { STAGE_ORDER } from '@/lib/tradition/sabu/types'
import { DIMS as BAJAU_DIMS } from '@/lib/tradition/bajau/rules'
import type { Rules } from '@/lib/tradition/sabu/types'

/** Both ends of the hull, both palms, with and without the loft. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { ruang: MIN_RUANG, atap: 'gewang', duru: false },
  { ruang: MAX_RUANG, atap: 'lontar', duru: true },
  { ruang: 6, atap: 'gewang', duru: true },
  { ruang: 7, atap: 'lontar', duru: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.ruang} bays in ${rules.atap}, duru ${rules.duru}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a house that says it is a boat', () => {
  it('holds a hull’s proportion at every length it is built to', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkHullProportion(layout).status).toBe('pass')
      expect(layout.ratio.actual).toBeGreaterThanOrEqual(DIMS.hullLeast.value)
      expect(layout.ratio.actual).toBeLessThanOrEqual(DIMS.hullMost.value)
    }
  })

  /**
   * The comparison the pack cannot make itself.
   *
   * A tradition may not import another tradition — that is a hard split, and
   * it is what keeps "what generalises" a finding rather than an accident. A
   * test may, and this is the first place in the project where one tradition's
   * building is measured against another's: the Bajau lepa is an actual hull,
   * and its length-to-beam has to fall inside the range this house claims a
   * hull holds. If it did not, the range here would be a number the author
   * invented to make his own house pass.
   */
  it('claims a range that the real hull in this collection falls inside', () => {
    const lepa = 1 / BAJAU_DIMS.beamRatio.value
    expect(lepa).toBeGreaterThanOrEqual(DIMS.hullLeast.value)
    expect(lepa).toBeLessThanOrEqual(DIMS.hullMost.value)
    // And the house is genuinely inside the same range rather than merely
    // adjacent to it: at its longest it approaches the boat's own proportion.
    const longest = resolveLayout({ ...DEFAULT_RULES, ruang: MAX_RUANG }).ratio.actual
    expect(longest).toBeLessThanOrEqual(lepa + 0.2)
    expect(longest).toBeGreaterThan(DIMS.hullLeast.value)
  })

  /** The only check here whose success condition is that a symmetry fails. */
  it('makes the two ends different from each other', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkEndsAreNotAlike(house, layout).status).toBe('pass')
      const bow = house.parts.filter((p) => p.name === 'tiang-haluan')
      expect(bow).toHaveLength(2)
      for (const post of bow) {
        expect(partBounds(post).min[2]).toBeLessThan(0)
      }
      const stern = house.parts.find((p) => p.name === 'buritan')
      if (!stern) throw new Error('no stern')
      expect(partBounds(stern).max[1]).toBeGreaterThan(layout.ridgeY)
    }
  })

  it('is symmetric across the keel and not along it', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const bowMost = Math.min(...house.parts.map((p) => partBounds(p).min[2]))
    const sternMost = Math.max(...house.parts.map((p) => partBounds(p).max[2]))
    // The overhangs are equal; what differs is what is at each end.
    expect(Math.abs(bowMost + sternMost)).toBeLessThan(0.5)
    const names = new Set(house.parts.map((p) => p.name))
    expect(names.has('tiang-haluan')).toBe(true)
    expect(names.has('buritan')).toBe(true)
  })
})

describe('the roof that is the wall', () => {
  it('leaves a way in under the eave', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkWayIn(layout).status).toBe('pass')
      expect(layout.eaveY - layout.floorY).toBeGreaterThanOrEqual(DIMS.doorHead.value)
    }
  })

  it('keeps the wall to a fraction of the section', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkRoofIsTheHull(house, layout).status).toBe('pass')
      for (const part of house.parts) {
        if (part.name !== 'dinding') continue
        expect(partBounds(part).max[1]).toBeLessThanOrEqual(layout.eaveY + 1e-6)
      }
    }
  })

  /**
   * The eave follows from the beam, which is what makes the door close when
   * the house is widened — and it is why the counterexample is about width
   * rather than about the door.
   */
  it('lowers the eave when the beam is widened', () => {
    const before = resolveLayout(DEFAULT_RULES)
    const wide = withDimValue('beam', DIMS.beam.value + 1, () => resolveLayout(DEFAULT_RULES))
    expect(wide.eaveY).toBeLessThan(before.eaveY)
    expect(before.eaveY - wide.eaveY).toBeCloseTo(DIMS.roofFall.value * 0.5, 9)
  })
})

describe('the counterexample', () => {
  it('widens the house until the plan stops being a hull', () => {
    const c = hullCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.ratio).toBeGreaterThanOrEqual(c.witness.sound.least)
    expect(c.witness.broken.ratio).toBeLessThan(c.witness.broken.least)
    // The range does not move: the two numbers are independent.
    expect(c.witness.broken.least).toBeCloseTo(c.witness.sound.least, 9)
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
    expect(q).toContain('atap=')
    expect(q).toContain('duru=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('ruang=&atap=&duru=')).toEqual(normaliseRules(DEFAULT_RULES))
    expect(ATAP.map((a) => a.atap)).toEqual(['lontar', 'gewang'])
  })
})

describe('the build sequence', () => {
  /** A keel is carried by what leans up to it, so the ribs come first. */
  it('sets the stones, then frames the hull, then lays the keel on its ribs', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts[0]?.stage).toBe('batu')
      const ribs = house.parts.findIndex((p) => p.name === 'gading')
      const keel = house.parts.findIndex((p) => p.name === 'lunas')
      expect(ribs).toBeGreaterThanOrEqual(0)
      expect(ribs).toBeLessThan(keel)
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
  it('reports a section that is nearly all roof', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones).toHaveLength(3)
    const wall = layout.eaveY - layout.floorY
    const section = layout.ridgeY - layout.floorY
    expect(wall / section).toBeLessThan(0.6)
    expect(scene.site).toHaveLength(1)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `sabu provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
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
