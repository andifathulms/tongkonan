import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/palembang/assembly'
import { checkAxesAreIndependent, checkStepsRise, runInvariants, summarise } from '@/lib/tradition/palembang/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  LEVELS,
  MAX_LEBAR,
  MIN_LEBAR,
  levelsFor,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/palembang/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/palembang/address'
import { resolveLayout } from '@/lib/tradition/palembang/frame'
import { headroomCounterexample } from '@/lib/tradition/palembang/counterexample'
import { sceneModel } from '@/lib/tradition/palembang/scene'
import { STAGE_ORDER } from '@/lib/tradition/palembang/types'
import type { Rules } from '@/lib/tradition/palembang/types'

/** Both step counts, both ends of the width, and an open front. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { kekijing: 3, lebar: MIN_LEBAR, tenggalung: true },
  { kekijing: 3, lebar: MAX_LEBAR, tenggalung: false },
  { kekijing: 5, lebar: MIN_LEBAR, tenggalung: false },
  { kekijing: 5, lebar: 6, tenggalung: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.kekijing} kekijing, ${rules.lebar} bays`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the floor is the hierarchy', () => {
  /**
   * Asserted against the arithmetic rather than against the check, so the two
   * are independent readings of the same building.
   */
  it('rises in order, by equal steps, from the street to the family', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(layout.levels).toHaveLength(rules.kekijing)
      for (let i = 1; i < layout.levels.length; i++) {
        const below = layout.levels[i - 1]
        const above = layout.levels[i]
        expect(below).toBeDefined()
        expect(above).toBeDefined()
        if (!below || !above) continue
        expect(above.y - below.y).toBeCloseTo(DIMS.stepRise.value, 9)
        expect(above.x).toBeGreaterThan(below.x)
      }
      expect(layout.levels[0]?.key).toBe('jogan')
      expect(layout.levels[layout.levels.length - 1]?.key).toBe('gegajah')
      expect(checkStepsRise(layout).status).toBe('pass')
    }
  })

  /**
   * The claim this house exists in the project to make. Both directions, and
   * both matter: a model that widened the guest list by widening the house
   * would look entirely reasonable and would be saying something false.
   */
  it('moves each axis with its own rule and neither with the other', () => {
    const narrow = resolveLayout({ ...DEFAULT_RULES, lebar: MIN_LEBAR })
    const wide = resolveLayout({ ...DEFAULT_RULES, lebar: MAX_LEBAR })
    expect(wide.halfZ).toBeGreaterThan(narrow.halfZ)
    expect(wide.halfX).toBeCloseTo(narrow.halfX, 9)
    expect(wide.levels).toHaveLength(narrow.levels.length)
    expect(wide.topY).toBeCloseTo(narrow.topY, 9)

    const short = resolveLayout({ ...DEFAULT_RULES, kekijing: 3 })
    const long = resolveLayout({ ...DEFAULT_RULES, kekijing: 5 })
    expect(long.halfX).toBeGreaterThan(short.halfX)
    expect(long.halfZ).toBeCloseTo(short.halfZ, 9)
    expect(long.topY).toBeGreaterThan(short.topY)

    const { layout } = buildHouse(DEFAULT_RULES)
    expect(checkAxesAreIndependent(layout).status).toBe('pass')
  })

  /**
   * The sequence is legible from underneath. Not a restatement of the floor
   * check: a model could stand every post to one height and let the boards
   * float, and every floor test above would still pass.
   */
  it('stands each rank of posts to its own level', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const tops = new Set(
      house.parts.filter((p) => /^tiang-\d+-\d+$/.test(p.id) && p.kind === 'box').map((p) =>
        p.kind === 'box' ? (p.center[1] + p.size[1] / 2).toFixed(3) : '',
      ),
    )
    expect(tops.size).toBe(layout.levels.length)
    expect(tops.size).toBeGreaterThan(1)
  })

  /** A three-step house keeps the first, the middle and the last. */
  it('drops the two middle distinctions rather than the last ones', () => {
    const three = levelsFor(3).map((l) => l.key)
    const five = levelsFor(5).map((l) => l.key)
    expect(five).toHaveLength(5)
    expect(three).toEqual([five[0], five[2], five[4]])
    expect(LEVELS).toHaveLength(5)
  })

  /**
   * The gallery is a threshold, not a step: putting it a rise lower would turn
   * a five-step house into a six-step one and give the household a
   * distinction it never claimed.
   */
  it('keeps the front gallery at the height of the first level', () => {
    const layout = resolveLayout(DEFAULT_RULES)
    expect(layout.tenggalung.y).toBeCloseTo(layout.levels[0]?.y ?? -1, 9)
  })
})

describe('what a stepped floor breaks', () => {
  /**
   * The roof stays level while the floor climbs, so the lowest standing gets
   * the most room. Asserted because it is a consequence nobody designed and
   * the sort of thing a later change could quietly reverse.
   */
  it('gives the lowest level the most headroom and the highest the least', () => {
    const layout = resolveLayout(DEFAULT_RULES)
    const first = layout.levels[0]
    const last = layout.levels[layout.levels.length - 1]
    expect(first).toBeDefined()
    expect(last).toBeDefined()
    if (!first || !last) return
    expect(layout.eaveY - first.y).toBeGreaterThan(layout.eaveY - last.y)
  })

  /**
   * `zones` deliberately does not show the five levels as five bands. The
   * numbers would fit and the meaning would not: they are five parts of one
   * room, and a reader shown five bands would take them for storeys.
   */
  it('reports three zones rather than one per level', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones.map((z) => z.key)).toEqual(['kolong', 'lantai', 'atap'])
    expect(layout.levels.length).toBe(5)
  })

  it('screens the front with bars rather than a panel, or not at all', () => {
    const screened = buildHouse({ ...DEFAULT_RULES, tenggalung: true })
    const open = buildHouse({ ...DEFAULT_RULES, tenggalung: false })
    expect(screened.house.parts.filter((p) => p.id.startsWith('kisi-')).length).toBeGreaterThan(4)
    expect(open.house.parts.filter((p) => p.id.startsWith('kisi-'))).toHaveLength(0)
  })
})

describe('the counterexample', () => {
  it('steepens the sequence until the top level loses its headroom', () => {
    const c = headroomCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeGreaterThan(c.actual)
    expect(c.witness.broken.headroom).toBeLessThan(c.witness.sound.headroom)
    // The sequence itself is still perfectly well ordered — only the building
    // has run out, which is the point.
    const steep = resolveLayout(DEFAULT_RULES)
    expect(checkStepsRise(steep).status).toBe('pass')
  })
})

describe('the address', () => {
  it('round-trips every rule, defaults included', () => {
    for (const rules of COMBOS) {
      expect(rulesEqual(rulesFromQuery(rulesToQuery(rules)), normaliseRules(rules))).toBe(true)
    }
  })

  /**
   * The bug this test exists for: `kekijing` was declared as a `choice`, which
   * writes the raw string into the rule, so a three-step house read back from
   * its own address came out with five — the codec quietly giving a household
   * two distinctions it had not claimed.
   */
  it('reads the level count back as a number, not a string', () => {
    const parsed = rulesFromQuery('kekijing=3&lebar=4&tenggalung=1')
    expect(parsed.kekijing).toBe(3)
    expect(typeof parsed.kekijing).toBe('number')
    expect(resolveLayout(parsed).levels).toHaveLength(3)
  })

  it('refuses a level count this tradition does not build', () => {
    expect(rulesFromQuery('kekijing=4&lebar=4&tenggalung=1').kekijing).toBe(5)
    expect(normaliseRules({ ...DEFAULT_RULES, kekijing: 4 as 3 }).kekijing).toBe(5)
  })

  it('writes all three rules even at their defaults', () => {
    const q = rulesToQuery(DEFAULT_RULES)
    expect(q).toContain('kekijing=')
    expect(q).toContain('lebar=')
    expect(q).toContain('tenggalung=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('kekijing=&lebar=&tenggalung=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `palembang provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The figure carrying the building's only social claim is the author's, and
   * that has to stay visible rather than being quietly upgraded to make the
   * bar read better. Same guard as the uma's tower.
   */
  it('leaves the number that carries the argument openly unsupported', () => {
    expect(DIMS.stepRise.class).toBe('interpolated')
    expect(DIMS.stepRise.source).toBe('none')
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`palembang parts: ${split.interpolated} interpolated of ${split.total}`)
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
})
