import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/aceh/assembly'
import {
  checkNoNails,
  checkOddSteps,
  checkRidgeRunsEastWest,
  checkThreeParts,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/aceh/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_RUANG,
  MAX_STEPS,
  MIN_RUANG,
  MIN_STEPS,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/aceh/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/aceh/address'
import { houseWidth, resolveLayout } from '@/lib/tradition/aceh/frame'
import { stepsCounterexample } from '@/lib/tradition/aceh/counterexample'
import { sceneModel } from '@/lib/tradition/aceh/scene'
import { STAGE_ORDER } from '@/lib/tradition/aceh/types'
import type { Rules } from '@/lib/tradition/aceh/types'

/** Both ends of both counts, with and without the back veranda. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { ruang: MIN_RUANG, anakTangga: MIN_STEPS, seuramoeLikot: true },
  { ruang: MAX_RUANG, anakTangga: MAX_STEPS, seuramoeLikot: false },
  { ruang: 5, anakTangga: 7, seuramoeLikot: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.ruang} bays, ${rules.anakTangga} treads, back veranda ${rules.seuramoeLikot}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a house turned by something that is not from here', () => {
  /**
   * The claim this building was added to make. What a model can hold is the
   * axis; the reason is stated in the pack and cannot be checked, and the two
   * are kept apart deliberately.
   */
  it('lies long on the east–west axis, with the ridge along it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkRidgeRunsEastWest(house, layout).status).toBe('pass')
      expect(layout.length).toBeGreaterThan(houseWidth(layout))
      expect(sceneModel(house, layout).ridgeAxis).toBe(2)
      const ridge = house.parts.find((p) => p.id === 'bubungan')
      if (!ridge) throw new Error('no ridge')
      const b = partBounds(ridge)
      expect(b.max[2] - b.min[2]).toBeGreaterThan(b.max[0] - b.min[0])
    }
  })

  /**
   * The only parity rule in the project, and it is checkable because the count
   * is derived: floor height over tread rise, with nothing in that arithmetic
   * that knows about odd and even.
   */
  it('builds an odd number of treads, and derives the number', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkOddSteps(house, layout).status).toBe('pass')
      expect(layout.ladder.steps % 2).toBe(1)
      const treads = house.parts.filter((p) => p.id.startsWith('reunyeun-') && !p.id.includes('tiang'))
      expect(treads).toHaveLength(layout.ladder.steps)
      // Derived, not declared: the count follows the height and the rise.
      expect(layout.ladder.steps).toBe(
        Math.round((layout.floorY + DIMS.floorThickness.value) / DIMS.treadRise.value),
      )
    }
  })

  /** Both counts are held odd, whatever an address asks for. */
  it('rounds an even count up to an odd one', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, ruang: 4 }).ruang % 2).toBe(1)
    expect(normaliseRules({ ...DEFAULT_RULES, anakTangga: 8 }).anakTangga % 2).toBe(1)
    expect(normaliseRules({ ...DEFAULT_RULES, ruang: 99 }).ruang).toBe(MAX_RUANG)
  })

  /**
   * Three parts across the width, and the raised one is the closed one — the
   * inverse of the rumah limas, which raises the floor a guest is seated on.
   */
  it('raises the room a guest does not enter', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkThreeParts(house, layout).status).toBe('pass')
      const middle = layout.rooms.find((r) => r.key === 'tungai')
      const front = layout.rooms.find((r) => r.key === 'keue')
      if (!middle || !front) throw new Error('missing room')
      expect(middle.floorY).toBeGreaterThan(front.floorY)
      expect(layout.rooms).toHaveLength(rules.seuramoeLikot ? 3 : 2)
    }
  })

  it('puts no iron anywhere in the frame', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkNoNails(house).status).toBe('pass')
      expect(new Set(house.joints.map((j) => j.kind))).toEqual(new Set(['toi', 'talo']))
    }
  })
})

describe('the counterexample', () => {
  /**
   * The smallest in the project: the difference between the sound house and
   * the broken one is one piece of wood.
   */
  it('flips the count to even by moving the rise a centimetre', () => {
    const c = stepsCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.steps % 2).toBe(1)
    expect(c.witness.broken.steps % 2).toBe(0)
    expect(Math.abs(c.witness.broken.steps - c.witness.sound.steps)).toBe(1)
    // And the dimension barely moved: a few centimetres, where every other
    // counterexample here needs a fifth or more.
    expect(Math.abs(c.value - c.actual) / c.actual).toBeLessThan(0.2)
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
    expect(q).toContain('likot=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('ruang=&tangga=&likot=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('fits the ladder last, because it is what is counted', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    expect(house.parts[house.parts.length - 1]?.stage).toBe('reunyeun')
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
      `aceh provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The rise of a tread is the most consequential figure in this pack — it
   * decides whether the parity rule is kept — and it is the author's, like
   * every other metre here.
   */
  it('leaves every metric figure unsourced, the tread rise included', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(10)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
    expect(DIMS.treadRise.class).toBe('interpolated')
    expect(DIMS.ridgeRunsEastWest.class).toBe('canon')
    expect(DIMS.oddSteps.class).toBe('canon')
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
