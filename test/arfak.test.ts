import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/arfak/assembly'
import { checkNothingIsBraced, runInvariants, summarise } from '@/lib/tradition/arfak/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  HUNI,
  MAX_KAKI,
  MAX_RUANG,
  MIN_KAKI,
  MIN_RUANG,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/arfak/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/arfak/address'
import { resolveLayout } from '@/lib/tradition/arfak/frame'
import { legCounterexample } from '@/lib/tradition/arfak/counterexample'
import { sceneModel } from '@/lib/tradition/arfak/scene'
import { STAGE_ORDER } from '@/lib/tradition/arfak/types'
import type { Rules } from '@/lib/tradition/arfak/types'

/** Both kinds of household, and both ends of both counts. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { huni: 'keluarga', ruang: MIN_RUANG, kaki: MIN_KAKI },
  { huni: 'keluarga', ruang: 9, kaki: MAX_KAKI },
  { huni: 'marga', ruang: MAX_RUANG, kaki: MIN_KAKI },
  { huni: 'marga', ruang: 5, kaki: MAX_KAKI },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.huni}, ${rules.ruang} bays, ${rules.kaki} legs across`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('nothing is braced, and that is the point', () => {
  /**
   * The exact negation of the Nias omo's central claim, asserted against the
   * parts rather than against the check.
   */
  it('ties no leg to any other', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      for (const joint of house.joints) {
        const legToLeg = joint.mortise.startsWith('kaki-') && joint.tenon.startsWith('kaki-')
        expect(legToLeg).toBe(false)
      }
    }
  })

  it('fails the check the moment one leg is lashed to another', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(checkNothingIsBraced(house, layout).status).toBe('pass')
    const braced = {
      ...house,
      joints: [
        ...house.joints,
        {
          id: 'brace',
          kind: 'ikat' as const,
          mortise: 'kaki-0-0',
          tenon: 'kaki-0-1',
          at: [0, 0.5, 0] as [number, number, number],
          halfExtents: [0.05, 0.05, 0.05] as [number, number, number],
        },
      ],
    }
    expect(checkNothingIsBraced(braced, layout).status).toBe('fail')
  })

  it('stands every leg on the ground rather than in it', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      for (const leg of house.parts.filter((p) => p.stage === 'kaki')) {
        if (leg.kind !== 'box') continue
        // Its rotated extent may not dip below grade.
        expect(leg.center[1] - leg.size[1] / 2).toBeGreaterThan(-0.2)
      }
    }
  })

  /**
   * The lean has to be arbitrary-looking and completely deterministic. `lib/`
   * forbids randomness, and a house that came out a different shape on every
   * load would be a screensaver rather than a model.
   */
  it('leans every leg its own way, reproducibly', () => {
    const a = resolveLayout(DEFAULT_RULES)
    const b = resolveLayout(DEFAULT_RULES)
    expect(a.legs.map((l) => `${l.leanX},${l.leanZ}`)).toEqual(b.legs.map((l) => `${l.leanX},${l.leanZ}`))
    for (const leg of a.legs) expect(Math.hypot(leg.leanX, leg.leanZ)).toBeGreaterThan(0)
    const bearings = new Set(a.legs.map((l) => Math.atan2(l.leanZ, l.leanX).toFixed(3)))
    expect(bearings.size).toBeGreaterThan(a.legs.length * 0.8)
  })

  /** Many, and small: the two halves of the name. */
  it('builds a great many legs, each smaller than any post in the project', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(layout.legs.length).toBeGreaterThan(60)
    expect(house.parts.filter((p) => p.stage === 'kaki').length).toBe(layout.legs.length)
    expect(DIMS.legSection.value).toBeLessThan(0.12)
  })

  it('makes the leg count a consequence of density and size', () => {
    const sparse = resolveLayout({ ...DEFAULT_RULES, kaki: MIN_KAKI })
    const dense = resolveLayout({ ...DEFAULT_RULES, kaki: MAX_KAKI })
    expect(dense.legs.length).toBeGreaterThan(sparse.legs.length)
    const short = resolveLayout({ ...DEFAULT_RULES, ruang: MIN_RUANG })
    const long = resolveLayout({ ...DEFAULT_RULES, ruang: MAX_RUANG })
    expect(long.legs.length).toBeGreaterThan(short.legs.length)
    // And the body itself is unchanged by density.
    expect(dense.halfX).toBeCloseTo(sparse.halfX, 9)
    expect(dense.halfZ).toBeCloseTo(sparse.halfZ, 9)
  })
})

describe('what an unbraced house breaks', () => {
  /** One joint kind, and it is the only house here with one. */
  it('uses lashings and nothing else', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    expect(house.joints.length).toBeGreaterThan(0)
    for (const joint of house.joints) expect(joint.kind).toBe('ikat')
    expect(new Set(house.joints.map((j) => j.kind)).size).toBe(1)
  })

  it('divides a clan house in two and a family house not at all', () => {
    for (const info of HUNI) {
      const { house } = buildHouse({ ...DEFAULT_RULES, huni: info.huni })
      expect(house.parts.filter((p) => p.stage === 'sekat').length).toBe(info.divided ? 2 : 0)
    }
  })

  /**
   * The difference is inside, like the mbaru niang's drum and unlike the
   * saoraja's gable. Asserted on the outside geometry being identical.
   */
  it('looks the same from outside whoever lives in it', () => {
    const clan = resolveLayout({ ...DEFAULT_RULES, huni: 'marga' })
    const family = resolveLayout({ ...DEFAULT_RULES, huni: 'keluarga' })
    expect(clan.halfX).toBeCloseTo(family.halfX, 9)
    expect(clan.halfZ).toBeCloseTo(family.halfZ, 9)
    expect(clan.eaveY).toBeCloseTo(family.eaveY, 9)
    expect(clan.ridgeY).toBeCloseTo(family.ridgeY, 9)
    expect(clan.legs.length).toBe(family.legs.length)
  })

  it('reports the understorey as the subject even though it is low', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones.map((z) => z.key)).toEqual(['kaki', 'badan', 'atap'])
    expect(scene.underfloorHeight).toBeLessThan(2)
  })
})

describe('the counterexample', () => {
  it('thickens the legs until they stop being legs', () => {
    const c = legCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeGreaterThan(c.actual)
    // The count did not change: nothing broke, the definition did.
    expect(c.witness.broken.legs).toBe(c.witness.sound.legs)
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
    expect(q).toContain('huni=')
    expect(q).toContain('ruang=')
    expect(q).toContain('kaki=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('huni=&ruang=&kaki=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `arfak provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The thinnest-sourced pack here, and the caution says so. This pins that
   * every metric figure is the author's — including the leg count, which is
   * the single best-known thing about the building.
   */
  it('leaves every metric figure unsourced, as the caution states', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(8)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`arfak parts: ${split.interpolated} interpolated of ${split.total}`)
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

  it('puts the legs in first, because there are more of them than anything else', () => {
    expect(STAGE_ORDER[0]).toBe('kaki')
  })
})
