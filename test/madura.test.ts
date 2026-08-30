import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/madura/assembly'
import {
  checkLanggarClosesTheWest,
  checkRowIsRegular,
  checkSeniorityRunsEast,
  checkYardIsClear,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/madura/invariants'
import {
  ALL_DIMS,
  BENTUK,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_RUMAH,
  MIN_RUMAH,
  normaliseRules,
  partSplit,
  provenanceSplit,
  riseOf,
} from '@/lib/tradition/madura/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/madura/address'
import { neighbourLayout, resolveLayout } from '@/lib/tradition/madura/frame'
import { seniorityCounterexample } from '@/lib/tradition/madura/counterexample'
import { sceneModel } from '@/lib/tradition/madura/scene'
import { withDimValue } from '@/lib/tradition/madura/whatif'
import { STAGE_ORDER } from '@/lib/tradition/madura/types'
import { DIMS as ACEH_DIMS } from '@/lib/tradition/aceh/rules'
import type { Rules } from '@/lib/tradition/madura/types'

/** Both ends of the row, all three roof forms, with and without the kitchens. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { rumah: MIN_RUMAH, bentuk: 'pacenan', dapur: false },
  { rumah: MAX_RUMAH, bentuk: 'bangsal', dapur: true },
  { rumah: 4, bentuk: 'bangsal', dapur: false },
  { rumah: 5, bentuk: 'trompesan', dapur: true },
]

const suite = (rules: Rules) => {
  const { house, layout } = buildHouse(rules)
  return { house, layout, results: runInvariants(house, layout, neighbourLayout(rules)) }
}

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.rumah} houses under ${rules.bentuk}, kitchens ${rules.dapur}`, () => {
      const { results } = suite(rules)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a subject that is not a building', () => {
  /**
   * The claim this entry exists for. Every other pack hands the registry one
   * building; this one hands it nine, and nothing in the core noticed.
   */
  it('builds a cluster, not a house', () => {
    for (const rules of COMBOS) {
      const { house, layout } = suite(rules)
      const buildings = 1 + layout.houses.length + layout.kitchens.length
      expect(buildings).toBeGreaterThanOrEqual(3)
      expect(house.parts.filter((p) => p.stage === 'rumah').length).toBeGreaterThan(rules.rumah)
      expect(house.parts.filter((p) => p.stage === 'langgar').length).toBeGreaterThan(0)
      // Ten parts to a kitchen: two stones, two posts, a plinth, four walls, a roof.
      expect(house.parts.filter((p) => p.stage === 'dapur').length).toBe(rules.dapur ? layout.kitchens.length * 10 : 0)
    }
  })

  /**
   * The yard is a part and it is emitted first, because the yard is the thing
   * being made. Only one other pack has ground in its part list — the Baduy
   * imah, where the ground is what may not be cut.
   */
  it('makes the yard first and keeps it empty', () => {
    for (const rules of COMBOS) {
      const { house, layout } = suite(rules)
      expect(house.parts[0]?.stage).toBe('tanean')
      expect(house.parts[0]?.material).toBe('tanah')
      expect(checkYardIsClear(house, layout).status).toBe('pass')
    }
  })

  /**
   * And the falsification: a check nobody has seen fail is indistinguishable
   * from one that cannot. Put a kitchen in the middle of the yard and it does.
   */
  it('refuses a building standing in the yard', () => {
    const { house, layout } = suite(DEFAULT_RULES)
    const shrunk = { ...layout, yard: { ...layout.yard, halfX: layout.yard.halfX * 3 } }
    expect(checkYardIsClear(house, shrunk).status).toBe('fail')
  })

  /**
   * The eaves are allowed over the edge of it, and that is not a loophole:
   * the strip of shade at the edge of the tanean is where people sit.
   */
  it('lets the roofs oversail the yard they shade', () => {
    const { house, layout } = suite(DEFAULT_RULES)
    const roofs = house.parts.filter((p) => p.name === 'atap' && p.stage === 'rumah')
    expect(roofs.length).toBeGreaterThan(0)
    const over = roofs.some((p) => partBounds(p).max[0] > -layout.yard.halfX)
    expect(over).toBe(true)
  })
})

describe('the row', () => {
  it('puts the tonghuh westmost and lets no daughter outgrow it', () => {
    for (const rules of COMBOS) {
      const { layout } = suite(rules)
      expect(checkSeniorityRunsEast(layout).status).toBe('pass')
      const first = layout.houses[0]
      if (!first) throw new Error('no houses')
      expect(first.tonghuh).toBe(true)
      for (const house of layout.houses.slice(1)) {
        expect(house.z).toBeGreaterThan(first.z)
        expect(house.width).toBeLessThan(first.width)
      }
    }
  })

  /**
   * The betang's claim in a different shape: adding a household changes
   * nothing that is already standing. Measured from the langgar, because the
   * yard is drawn centred and absolute coordinates move when it lengthens.
   */
  it('lengthens only at the east end', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkRowIsRegular(layout, neighbourLayout(rules)).status).toBe('pass')
    }
    const three = resolveLayout({ ...DEFAULT_RULES, rumah: 3 })
    const four = resolveLayout({ ...DEFAULT_RULES, rumah: 4 })
    expect(four.yard.halfZ * 2 - three.yard.halfZ * 2).toBeCloseTo(DIMS.housePitch.value, 9)
    for (let i = 0; i < three.houses.length; i++) {
      const a = three.houses[i]
      const b = four.houses[i]
      if (!a || !b) throw new Error('missing house')
      expect(a.z - three.langgar.z).toBeCloseTo(b.z - four.langgar.z, 9)
    }
  })

  /** One roof form, applied to every building in the row at once. */
  it('repeats one roof form down the whole row', () => {
    for (const form of BENTUK) {
      const layout = resolveLayout({ ...DEFAULT_RULES, rumah: 4, bentuk: form.bentuk })
      const rise = riseOf(form.bentuk)
      for (const house of layout.houses) {
        expect(house.ridgeY).toBeCloseTo(layout.wallTop + rise, 9)
      }
    }
    // Three distinct heights, so the rule is doing something.
    expect(new Set(BENTUK.map((b) => riseOf(b.bentuk))).size).toBe(3)
  })

  /**
   * The roof table holds dimension keys rather than copies of their values —
   * the Banjar pack's lesson, checked rather than commented.
   */
  it('reads the rise from the pack, not from a copy taken at import time', () => {
    const before = resolveLayout(DEFAULT_RULES).houses[0]?.ridgeY ?? 0
    const during = withDimValue('trompesanRise', DIMS.trompesanRise.value + 1, () =>
      resolveLayout(DEFAULT_RULES).houses[0]?.ridgeY ?? 0,
    )
    expect(during).toBeCloseTo(before + 1, 9)
  })
})

describe('the langgar', () => {
  it('closes the west end, with nothing beyond it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = suite(rules)
      expect(checkLanggarClosesTheWest(house, layout).status).toBe('pass')
      expect(layout.langgar.z).toBeLessThan(layout.yard.westZ)
    }
  })

  /**
   * And the correction this pack forced. The Aceh pack said its west-facing
   * rule was the only one here from outside the archipelago; a langgar at the
   * head of a tanean is the same doctrine, so that note is now narrower. Both
   * packs declare the rule as canon, and this test is what would notice if
   * either of them quietly stopped.
   */
  it('is the second building here oriented from outside the archipelago', () => {
    expect(DIMS.langgarClosesTheWest.class).toBe('canon')
    expect(ACEH_DIMS.ridgeRunsEastWest.class).toBe('canon')
    expect(ACEH_DIMS.ridgeRunsEastWest.noteEn.toLowerCase()).toContain('first rule')
  })
})

describe('the counterexample', () => {
  it('widens the daughters’ houses until the row outranks its own eldest', () => {
    const c = seniorityCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.daughter).toBeLessThan(c.witness.sound.tonghuh)
    expect(c.witness.broken.daughter).toBeGreaterThan(c.witness.broken.tonghuh)
    // The tonghuh does not move: the two frontages are independent numbers.
    expect(c.witness.broken.tonghuh).toBeCloseTo(c.witness.sound.tonghuh, 9)
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
    expect(q).toContain('rumah=')
    expect(q).toContain('bentuk=')
    expect(q).toContain('dapur=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('rumah=&bentuk=&dapur=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  /**
   * The only sequence in this project that is a family rather than a build:
   * the yard, the langgar, then one house per daughter as she marries.
   */
  it('is generations, in order', () => {
    for (const rules of COMBOS) {
      const { house } = suite(rules)
      const timeline = buildTimeline(house)
      expect(timeline.entries.length).toBe(house.parts.length)
      let seen = -1
      for (const part of house.parts) {
        const rank = STAGE_ORDER.indexOf(part.stage)
        expect(rank).toBeGreaterThanOrEqual(seen)
        seen = rank
      }
      const langgar = house.parts.findIndex((p) => p.stage === 'langgar')
      const first = house.parts.findIndex((p) => p.stage === 'rumah')
      expect(langgar).toBeLessThan(first)
    }
  })
})

describe('the scene model', () => {
  /**
   * The first time `SceneModel` describes only part of its subject, and the
   * pack says so rather than bending a field until it lies.
   */
  it('reports one house’s roof and the whole cluster’s footprint', () => {
    const { house, layout } = suite(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.footprint.z).toBeCloseTo(layout.yard.halfZ * 2, 9)
    expect(scene.drip.z).toBeLessThan(layout.yard.halfZ)
    expect(scene.underfloorHeight).toBeCloseTo(DIMS.plinthHeight.value, 9)
    expect(scene.zones).toHaveLength(3)
    expect(scene.site).toHaveLength(1)
    // The only site figure whose contents are another instance of the subject.
    expect(scene.site[0]?.volumes.length).toBe(2)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `madura provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
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
      const { house } = suite(rules)
      for (const part of house.parts) {
        expect(part.dims.length).toBeGreaterThan(0)
        for (const key of part.dims) expect(DIM_KEYS).toContain(key)
      }
    }
    const { house } = suite(DEFAULT_RULES)
    const split = partSplit(house.parts)
    expect(split.measured).toBe(0)
    expect(split.interpolated).toBe(split.total)
  })
})
