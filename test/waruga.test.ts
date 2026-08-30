import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/waruga/assembly'
import {
  checkFacesNorth,
  checkNoWayIn,
  checkOneBlock,
  checkOneMaterial,
  checkSeatedFit,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/waruga/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_JUMLAH,
  MIN_JUMLAH,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/waruga/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/waruga/address'
import { resolveLayout } from '@/lib/tradition/waruga/frame'
import { blockCounterexample } from '@/lib/tradition/waruga/counterexample'
import { sceneModel } from '@/lib/tradition/waruga/scene'
import { STAGE_ORDER } from '@/lib/tradition/waruga/types'
import { DIMS as BALI_DIMS } from '@/lib/tradition/bali/rules'
import type { Rules } from '@/lib/tradition/waruga/types'

/** Both lids, both ends of the family, with and without the base. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { jumlah: MIN_JUMLAH, tutup: 'limas', alas: false },
  { jumlah: MAX_JUMLAH, tutup: 'pelana', alas: false },
  { jumlah: 4, tutup: 'limas', alas: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.jumlah} inside, a ${rules.tutup} lid, base ${rules.alas}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a building that is not for the living', () => {
  /**
   * The chamber is measured against a body that will not stand up, which is
   * the Balinese principle on a different occasion — and both packs declare
   * their body figures against the same `anthropometry` source key, so that
   * "not from a book about this place" shows on both.
   */
  it('takes a seated body, with room around it', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkSeatedFit(layout).status).toBe('pass')
      expect(layout.chamber.height).toBeGreaterThanOrEqual(
        layout.body.seated + DIMS.bodyClearance.value - 1e-9,
      )
    }
    expect(DIMS.seatedHeight.source).toBe('anthropometry')
    // The bale measures a living, standing body against the same key, so the
    // two packs' body figures are filed together and apart from everything
    // else — which is what that key was invented for.
    expect(BALI_DIMS.hastaRatio.source).toBe('anthropometry')
  })

  /** A check for a zero: no door, no window, no gap. */
  it('has no way in at all', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkNoWayIn(house, layout).status).toBe('pass')
      expect(house.parts.filter((p) => p.name === 'dinding')).toHaveLength(4)
    }
  })

  /** One material, and it is the shortest material union in the project. */
  it('is made of stone and nothing else', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkOneMaterial(house).status).toBe('pass')
      expect(new Set(house.parts.map((p) => p.material))).toEqual(new Set(['batu']))
    }
  })

  /**
   * The family grows and the stone does not: the chamber rises, the plan does
   * not move, and nothing shows from outside.
   */
  it('grows upward as the family does, and only upward', () => {
    const one = resolveLayout({ ...DEFAULT_RULES, jumlah: 1 })
    const many = resolveLayout({ ...DEFAULT_RULES, jumlah: MAX_JUMLAH })
    expect(many.chamber.height).toBeGreaterThan(one.chamber.height)
    expect(many.chamber.halfX).toBeCloseTo(one.chamber.halfX, 9)
    expect(many.chamber.halfZ).toBeCloseTo(one.chamber.halfZ, 9)
    for (const rules of COMBOS) expect(checkOneBlock(resolveLayout(rules)).status).toBe('pass')
  })

  /** The same compass rule as the tongkonan, for an unrelated reason. */
  it('puts its carved face to the north', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(checkFacesNorth(house).status).toBe('pass')
      const face = house.parts.find((p) => p.id === 'muka')
      if (!face) throw new Error('no face')
      expect(partBounds(face).max[0]).toBeLessThanOrEqual(0)
    }
  })

  /** The ninth meaning of `underfloorHeight`, and the first with nobody under it. */
  it('reports the base slab where other buildings report a clearance', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeCloseTo(layout.base.height, 9)
    const without = buildHouse({ ...DEFAULT_RULES, alas: false })
    expect(sceneModel(without.house, without.layout).underfloorHeight).toBe(0)
  })
})

describe('the counterexample', () => {
  it('gives each burial more room until it stops coming out of one stone', () => {
    const c = blockCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.cut).toBeGreaterThan(c.witness.broken.block)
    expect(c.witness.sound.cut).toBeLessThanOrEqual(c.witness.sound.block)
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
    expect(q).toContain('jumlah=')
    expect(q).toContain('tutup=')
    expect(q).toContain('alas=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('jumlah=&tutup=&alas=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('cuts the box before the lid that closes it', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const boxAt = house.parts.findIndex((p) => p.stage === 'peti')
    const lidAt = house.parts.findIndex((p) => p.stage === 'tutup')
    expect(boxAt).toBeGreaterThanOrEqual(0)
    expect(boxAt).toBeLessThan(lidAt)
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
      `waruga provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The body figures are the author's and say so with their own source key,
   * exactly as the Bali pack's do. Everything else is unsourced metres — on
   * the one building in this project of which hundreds still stand and could
   * be measured tomorrow.
   */
  it('keeps the body figures distinguishable from the rest', () => {
    const body = ALL_DIMS.filter((d) => d.source === 'anthropometry')
    expect(body.length).toBe(3)
    for (const d of body) expect(d.class).toBe('interpolated')
    const metric = ALL_DIMS.filter((d) => d.unit === 'm' && d.source !== 'anthropometry')
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
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
