import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/bajau/assembly'
import {
  centreOf,
  checkAwning,
  checkBalance,
  checkFreeboard,
  checkNothingTouchesGround,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/bajau/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  UKURAN,
  lengthOf,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/bajau/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/bajau/address'
import { resolveLayout } from '@/lib/tradition/bajau/frame'
import { balanceCounterexample } from '@/lib/tradition/bajau/counterexample'
import { sceneModel } from '@/lib/tradition/bajau/scene'
import { STAGE_ORDER } from '@/lib/tradition/bajau/types'
import { tradition } from '@/lib/tradition/registry'
import type { Rules } from '@/lib/tradition/bajau/types'

/** All three boats, with and without the awning and the outriggers. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { ukuran: 'kecil', kajang: false, cadik: false },
  { ukuran: 'besar', kajang: true, cadik: false },
  { ukuran: 'kecil', kajang: true, cadik: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for a ${rules.ukuran} boat, awning ${rules.kajang}, outriggers ${rules.cadik}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a house that does not stand', () => {
  /**
   * The claim this building was added to make, as a zero: no footing, no
   * stone, nothing at all below the datum, which here is the keel.
   */
  it('touches no ground anywhere, because it has none', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkNothingTouchesGround(house, layout).status).toBe('pass')
      expect(house.parts.some((p) => p.name === 'batu')).toBe(false)
      for (const part of house.parts) expect(partBounds(part).min[1]).toBeGreaterThanOrEqual(-1e-4)
    }
  })

  /**
   * The only pack in the collection that declares no orientation rule, and it
   * says so as a canon zero rather than by omission.
   */
  it('declares no orientation rule at all', () => {
    expect(DIMS.noOrientation.value).toBe(0)
    expect(DIMS.noOrientation.class).toBe('canon')
    expect(DIMS.noGround.value).toBe(0)
    // Every other tradition names something it is turned by; this one names
    // the absence, in the same field the others use for the constraint.
    const t = tradition('bajau')
    expect(t.orientation.en).toContain('none')
  })

  /**
   * The awning is the dwelling: taking it down changes no plank of the boat
   * and the thing stops being a house.
   */
  it('is a house with the awning up and a hull without it', () => {
    const withAwning = buildHouse({ ...DEFAULT_RULES, kajang: true })
    const without = buildHouse({ ...DEFAULT_RULES, kajang: false })
    expect(checkAwning(withAwning.house, withAwning.layout).status).toBe('pass')
    expect(checkAwning(without.house, without.layout).status).toBe('pass')
    expect(without.house.parts.some((p) => p.stage === 'kajang')).toBe(false)

    // Not one plank of the boat differs: the hull, the deck and the frames are
    // identical, and only the dwelling has gone.
    const hullOf = (parts: readonly { id: string }[]) =>
      parts.filter((p) => !p.id.includes('kajang')).map((p) => p.id).sort()
    expect(hullOf(without.house.parts)).toEqual(hullOf(withAwning.house.parts))
  })

  /**
   * The first invariant in the project that computes a centre — and the limit
   * it tests against is declared, so the check compares two independent
   * numbers rather than restating one.
   */
  it('keeps the weight low and on the keel plane', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkBalance(house, layout).status).toBe('pass')
      const centre = centreOf(house.parts)
      expect(centre.y - layout.draught).toBeLessThanOrEqual(layout.centreLimit + 1e-4)
      expect(Math.abs(centre.z)).toBeLessThanOrEqual(DIMS.listLimit.value + 1e-4)
    }
  })

  /** The freeboard is the same at high water and low, because the house rises. */
  it('keeps its deck above the water at any state of tide', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkFreeboard(layout).status).toBe('pass')
      expect(layout.freeboard).toBeCloseTo(layout.sheerY - layout.draught, 9)
      expect(layout.deckY).toBeGreaterThan(layout.draught)
    }
  })

  /** The size rule holds a dimension key, not a copy of its value. */
  it('reads each boat length live from the pack', () => {
    for (const info of UKURAN) {
      expect(lengthOf(info.ukuran)).toBeCloseTo(DIMS[info.key].value, 9)
    }
    expect(lengthOf('besar')).toBeGreaterThan(lengthOf('kecil'))
  })

  /**
   * The eighth meaning of `underfloorHeight`: not a clearance but a draught —
   * how much of the house is in the water.
   */
  it('reports its draught where other houses report a clearance', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeCloseTo(layout.draught, 9)
    // And its site is water with no line drawn on any ground.
    expect(scene.site.some((m) => m.volumes.some((v) => v.material === 'air'))).toBe(true)
  })
})

describe('the counterexample', () => {
  it('raises the awning until the weight is too high', () => {
    const c = balanceCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.centre).toBeGreaterThan(c.witness.broken.limit)
    expect(c.witness.sound.centre).toBeLessThanOrEqual(c.witness.sound.limit)
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
    expect(q).toContain('ukuran=')
    expect(q).toContain('kajang=')
    expect(q).toContain('cadik=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('ukuran=&kajang=&cadik=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('lays the keel first and the frames after the planking', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    expect(house.parts[0]?.stage).toBe('lunas')
    const firstPlank = house.parts.findIndex((p) => p.stage === 'papan')
    const firstFrame = house.parts.findIndex((p) => p.stage === 'gading')
    expect(firstPlank).toBeLessThan(firstFrame)
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
      `bajau provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The balance limit is the figure the whole argument rests on and nobody
   * measured it. It is a declared proxy for a stability calculation this
   * project cannot do, and the caution says so.
   */
  it('leaves every metric figure unsourced, the balance limit included', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(10)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.centreLimit.class).toBe('interpolated')
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
