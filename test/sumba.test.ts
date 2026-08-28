import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/sumba/assembly'
import { checkLoftBeforeTower, checkTowerHoldsSomething, runInvariants, summarise } from '@/lib/tradition/sumba/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  KAMBANIRU,
  MAX_MENARA,
  MENARA_SCALE,
  MIN_MENARA,
  UMA,
  normaliseRules,
  partSplit,
  provenanceSplit,
  umaInfo,
} from '@/lib/tradition/sumba/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/sumba/address'
import { resolveLayout } from '@/lib/tradition/sumba/frame'
import { roofLevels } from '@/lib/tradition/sumba/roof'
import { towerCounterexample } from '@/lib/tradition/sumba/counterexample'
import { sceneModel } from '@/lib/tradition/sumba/scene'
import { STAGE_ORDER } from '@/lib/tradition/sumba/types'
import type { Rules } from '@/lib/tradition/sumba/types'

/** Both kinds of house, both ends of the tower rule, and a partial veranda. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { uma: 'kamadungu', menara: 12, bangga: true },
  { uma: 'kamadungu', menara: MAX_MENARA, bangga: false },
  { uma: 'mbatangu', menara: MIN_MENARA, bangga: false },
  { uma: 'mbatangu', menara: MAX_MENARA, bangga: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.uma}, tower ${rules.menara}${rules.bangga ? ', full bangga' : ''}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the roof is a container, not a shelter', () => {
  /**
   * The claim this house exists in the project to make. A tower with nothing
   * in it would be a tall roof, which is a different building — so the loft
   * has to be there, and it has to be *inside*.
   */
  it('puts a loft inside every tower and none in a house without one', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      const towered = umaInfo(rules.uma).tower
      const loft = house.parts.find((p) => p.id === 'uma-deta')
      expect(Boolean(loft)).toBe(towered)
      if (loft && loft.kind === 'box') {
        expect(loft.center[1]).toBeGreaterThan(layout.menara.footY)
        expect(loft.center[1]).toBeLessThan(layout.menara.peakY)
      }
      expect(checkTowerHoldsSomething(house, layout).status).toBe('pass')
    }
  })

  /**
   * An order rather than a geometry, and the only check of its kind here.
   * Reversing it produces an identical model — which is exactly why it needs
   * asserting rather than commenting.
   */
  it('builds the loft before the tower that exists for it', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(checkLoftBeforeTower(house, layout).status).toBe('pass')
    const loft = house.parts.findIndex((p) => p.id === 'uma-deta')
    const tower = house.parts.findIndex((p) => p.stage === 'menara')
    expect(loft).toBeGreaterThanOrEqual(0)
    expect(tower).toBeGreaterThan(loft)
    expect(STAGE_ORDER.indexOf('uma-deta')).toBeLessThan(STAGE_ORDER.indexOf('menara'))
  })

  it('fails the check when the loft is taken out of a towered house', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const hollow = { ...house, parts: house.parts.filter((p) => p.id !== 'uma-deta') }
    const verdict = checkTowerHoldsSomething(hollow, layout)
    expect(verdict.status).toBe('fail')
    expect(verdict.detailEn).toContain('no loft')
  })

  /**
   * The tower is taller than everything under it, and the ratio is the rule.
   * Asserted across the whole range because it is the only rule in the project
   * that is a proportion.
   */
  it('stands the tower taller than the house at every setting', () => {
    for (let m = MIN_MENARA; m <= MAX_MENARA; m++) {
      const l = resolveLayout({ uma: 'mbatangu', menara: m, bangga: true })
      expect(l.menara.peakY - l.menara.footY).toBeGreaterThan(l.shoulderY)
    }
  })

  it('scales the tower with the rule and leaves the house alone', () => {
    const low = resolveLayout({ uma: 'mbatangu', menara: MIN_MENARA, bangga: true })
    const high = resolveLayout({ uma: 'mbatangu', menara: MAX_MENARA, bangga: true })
    expect(high.menara.peakY).toBeGreaterThan(low.menara.peakY)
    expect(high.shoulderY).toBeCloseTo(low.shoulderY, 9)
    expect(high.floorY).toBeCloseTo(low.floorY, 9)
    expect(high.coreHalfX).toBeCloseTo(low.coreHalfX, 9)
    const ratio = (high.menara.peakY - high.menara.footY) / (low.menara.peakY - low.menara.footY)
    expect(ratio).toBeCloseTo(MAX_MENARA / MIN_MENARA, 6)
  })

  /** A house with no tower stops at its shoulder, and the peak is flat when there is one. */
  it('gives a towered house a flat peak and an untowered one a plain hip', () => {
    const towered = roofLevels(resolveLayout({ uma: 'mbatangu', menara: 12, bangga: true }))
    const plain = roofLevels(resolveLayout({ uma: 'kamadungu', menara: 12, bangga: true }))
    const peak = towered[towered.length - 1]
    const ridge = plain[plain.length - 1]
    expect(peak).toBeDefined()
    expect(ridge).toBeDefined()
    if (!peak || !ridge) return
    expect(peak.halfX).toBeGreaterThan(0)
    expect(ridge.halfX).toBe(0)
  })
})

describe('what a container breaks', () => {
  it('names its four posts and puts each at its own corner', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const posts = house.parts.filter((p) => p.stage === 'kambaniru')
    expect(posts).toHaveLength(4)
    expect(new Set(posts.map((p) => p.nameEn)).size).toBe(4)
    expect(KAMBANIRU).toHaveLength(4)
    const corners = posts.map((p) => (p.kind === 'box' ? `${Math.sign(p.center[0])}${Math.sign(p.center[2])}` : ''))
    expect(new Set(corners).size).toBe(4)
  })

  /**
   * The house is low and the tower is not, and the ratio between them is the
   * content of the building. Pinned because a model that quietly grew the
   * walls would lose the argument without failing anything.
   */
  it('keeps the house people use far shorter than the store above it', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    expect(layout.wallHeight).toBeLessThan(2)
    expect(layout.menara.peakY - layout.menara.footY).toBeGreaterThan(layout.shoulderY)
  })

  it('carries a zone for the tower that is neither a storey nor a roof', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones.map((z) => z.key)).toEqual(['rumah', 'atap', 'menara'])
    const plain = buildHouse({ uma: 'kamadungu', menara: 12, bangga: true })
    expect(sceneModel(plain.house, plain.layout).zones.map((z) => z.key)).toEqual(['rumah', 'atap'])
  })

  it('runs the veranda round four sides or along two', () => {
    const full = buildHouse({ ...DEFAULT_RULES, bangga: true })
    const part = buildHouse({ ...DEFAULT_RULES, bangga: false })
    expect(full.house.parts.filter((p) => p.id.startsWith('bangga-'))).toHaveLength(4)
    expect(part.house.parts.filter((p) => p.id.startsWith('bangga-'))).toHaveLength(2)
  })
})

describe('the counterexample', () => {
  it('shrinks the tower until the building stops being a container', () => {
    const c = towerCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeLessThan(c.actual)
    expect(c.witness.broken.tower).toBeLessThan(c.witness.sound.tower)
    // Nothing else moved: the house beneath is untouched, which is the point.
    expect(c.witness.broken.house).toBeCloseTo(c.witness.sound.house, 9)
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
    expect(q).toContain('uma=')
    expect(q).toContain('menara=')
    expect(q).toContain('bangga=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('uma=&menara=&bangga=')).toEqual(normaliseRules(DEFAULT_RULES))
  })

  /**
   * The tower rule is carried in tenths because the codec has no fractional
   * field. Pinned so nobody later "tidies" it into a float and finds the
   * address writing `menara=1.2000000000000002`.
   */
  it('carries the tower rule as an integer in tenths', () => {
    expect(Number.isInteger(DEFAULT_RULES.menara)).toBe(true)
    expect(MENARA_SCALE).toBe(10)
    expect(rulesToQuery(DEFAULT_RULES)).toContain(`menara=${DEFAULT_RULES.menara}`)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `sumba provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The most consequential number in this pack is interpolated with no source,
   * and that has to stay visible rather than being quietly upgraded to make
   * the bar look better.
   */
  it('leaves the number that sets the silhouette openly unsupported', () => {
    const rise = ALL_DIMS.find((d) => d.noteEn.includes('most visible number in the pack'))
    expect(rise).toBeDefined()
    expect(rise?.class).toBe('interpolated')
    expect(rise?.source).toBe('none')
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`sumba parts: ${split.interpolated} interpolated of ${split.total}`)
    expect(split.total).toBe(house.parts.length)
  })
})

describe('the build sequence', () => {
  it('walks every stage in order and places every part', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const timeline = buildTimeline(house)
    expect(timeline.stages.map((s) => s.stage)).toEqual(
      STAGE_ORDER.filter((s) => house.parts.some((p) => p.stage === s)),
    )
    expect(placedAt(timeline, 1).size).toBe(house.parts.length)
    expect(placedAt(timeline, 0).size).toBe(0)
  })

  it('offers both kinds of house from the same rule pack', () => {
    expect(UMA).toHaveLength(2)
    expect(UMA.filter((u) => u.tower)).toHaveLength(1)
  })
})
