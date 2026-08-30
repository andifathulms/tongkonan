import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/ngada/assembly'
import {
  checkNeitherIsShelter,
  checkPairIsComplete,
  checkRangedInTheSquare,
  checkTooSmallToEnter,
  partBounds,
  runInvariants,
  summarise,
} from '@/lib/tradition/ngada/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_PASANGAN,
  MIN_PASANGAN,
  TINGGI,
  heightOf,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/ngada/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/ngada/address'
import { resolveLayout } from '@/lib/tradition/ngada/frame'
import { openingCounterexample } from '@/lib/tradition/ngada/counterexample'
import { sceneModel } from '@/lib/tradition/ngada/scene'
import { withDimValue } from '@/lib/tradition/ngada/whatif'
import { STAGE_ORDER } from '@/lib/tradition/ngada/types'
import { DIMS as BALI_DIMS } from '@/lib/tradition/bali/rules'
import { DIMS as WARUGA_DIMS } from '@/lib/tradition/waruga/rules'
import type { Rules } from '@/lib/tradition/ngada/types'

/** Both ends of the clan count, all three post heights, with and without the stones. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { pasangan: MIN_PASANGAN, tinggi: 'pendek', ture: false },
  { pasangan: MAX_PASANGAN, tinggi: 'tinggi', ture: true },
  { pasangan: 4, tinggi: 'sedang', ture: false },
  { pasangan: 2, tinggi: 'tinggi', ture: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.pasangan} pairs on ${rules.tinggi} posts, stones ${rules.ture}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a subject that is a pair', () => {
  /**
   * The claim this entry exists for. Every other pack hands the registry one
   * kind of thing; this one hands it two, and neither means anything alone.
   */
  it('builds one post and one little house for every clan', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkPairIsComplete(house, layout).status).toBe('pass')
      expect(house.parts.filter((p) => p.name === 'ngadhu')).toHaveLength(rules.pasangan)
      expect(house.parts.filter((p) => p.name === 'lantai' && p.stage === 'bhaga')).toHaveLength(rules.pasangan)
      expect(layout.pairs).toHaveLength(rules.pasangan)
    }
  })

  /** They stand facing each other, on opposite sides of the square's axis. */
  it('stands the two halves across the axis from each other', () => {
    const layout = resolveLayout(DEFAULT_RULES)
    for (const pair of layout.pairs) {
      expect(Math.sign(pair.ngadhu.x)).toBe(-Math.sign(pair.bhaga.x))
      expect(Math.abs(pair.ngadhu.x - pair.bhaga.x)).toBeCloseTo(DIMS.pairOffset.value * 2, 9)
    }
  })

  /** The post goes up first, and it is unfinished until its bhaga is there. */
  it('raises the post before the little house', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const post = house.parts.findIndex((p) => p.stage === 'ngadhu')
    const bhaga = house.parts.findIndex((p) => p.stage === 'bhaga')
    expect(post).toBeGreaterThanOrEqual(0)
    expect(post).toBeLessThan(bhaga)
  })
})

describe('a house at a size nobody can enter', () => {
  /**
   * The third pack to measure a human body, and the first where the building
   * has to lose. All three declare their body figures against the same
   * `anthropometry` key, so "not from a book about this place" shows on each.
   */
  it('keeps the opening smaller than a body, against a declared body', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkTooSmallToEnter(layout).status).toBe('pass')
      expect(layout.opening.height).toBeLessThan(layout.body.crouching)
      expect(layout.opening.width).toBeLessThan(layout.body.shoulders)
    }
    expect(DIMS.crouchingHeight.source).toBe('anthropometry')
    expect(DIMS.shoulderWidth.source).toBe('anthropometry')
    expect(BALI_DIMS.hastaRatio.source).toBe('anthropometry')
    expect(WARUGA_DIMS.seatedHeight.source).toBe('anthropometry')
  })

  it('shelters nobody, under either half', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkNeitherIsShelter(house, layout).status).toBe('pass')
      // Nothing stands on the ground under a cap but the post carrying it.
      for (const pair of layout.pairs) {
        const under = house.parts.filter((p) => {
          const b = partBounds(p)
          const cx = (b.min[0] + b.max[0]) / 2
          const cz = (b.min[2] + b.max[2]) / 2
          return (
            p.stage !== 'nua' &&
            Math.abs(cx - pair.ngadhu.x) < pair.ngadhu.capRadius &&
            Math.abs(cz - pair.z) < pair.ngadhu.capRadius
          )
        })
        for (const part of under) expect(['ngadhu', 'lengan', 'topi']).toContain(part.name)
      }
    }
  })
})

describe('the square', () => {
  it('ranges the pairs at one spacing and keeps them inside it', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(checkRangedInTheSquare(house, layout).status).toBe('pass')
      for (let i = 1; i < layout.pairs.length; i++) {
        const before = layout.pairs[i - 1]
        const here = layout.pairs[i]
        if (!before || !here) continue
        expect(here.z - before.z).toBeCloseTo(DIMS.pairSpacing.value, 9)
      }
    }
  })

  /** The length of the square is a count of clans. */
  it('lengthens by one spacing for every clan', () => {
    const three = resolveLayout({ ...DEFAULT_RULES, pasangan: 3 })
    const four = resolveLayout({ ...DEFAULT_RULES, pasangan: 4 })
    expect(four.nua.halfZ * 2 - three.nua.halfZ * 2).toBeCloseTo(DIMS.pairSpacing.value, 9)
    expect(three.nua.halfX).toBeCloseTo(four.nua.halfX, 9)
  })

  /**
   * The height table holds dimension keys, not copies of their values — the
   * Banjar pack's lesson, checked rather than commented.
   */
  it('reads the post height from the pack, not from a copy taken at import time', () => {
    const before = resolveLayout(DEFAULT_RULES).pairs[0]?.ngadhu.postTop ?? 0
    const during = withDimValue('ngadhuMid', DIMS.ngadhuMid.value * 2, () =>
      resolveLayout(DEFAULT_RULES).pairs[0]?.ngadhu.postTop ?? 0,
    )
    expect(during).toBeCloseTo(before * 2, 9)
    expect(TINGGI.map((t) => heightOf(t.tinggi))).toEqual([
      DIMS.ngadhuShort.value,
      DIMS.ngadhuMid.value,
      DIMS.ngadhuTall.value,
    ])
  })
})

describe('the counterexample', () => {
  it('opens the door until the model becomes a very small house', () => {
    const c = openingCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.sound.opening).toBeLessThan(c.witness.sound.body)
    expect(c.witness.broken.opening).toBeGreaterThan(c.witness.broken.body)
    // The body does not move: the two numbers are independent.
    expect(c.witness.broken.body).toBeCloseTo(c.witness.sound.body, 9)
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
    expect(q).toContain('pasangan=')
    expect(q).toContain('tinggi=')
    expect(q).toContain('ture=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('pasangan=&tinggi=&ture=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the build sequence', () => {
  it('levels the square first and raises the stages in order', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts[0]?.stage).toBe('nua')
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
  /** The only site figure in the project that is canon rather than the author's. */
  it('makes the houses the setting and the ancestors the subject', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.site).toHaveLength(1)
    expect(scene.site[0]?.provenance).toBe('canon')
    expect((scene.site[0]?.volumes.length ?? 0)).toBeGreaterThanOrEqual(4)
    expect(scene.underfloorHeight).toBeCloseTo(DIMS.bhagaFloorY.value, 9)
    expect(scene.zones).toHaveLength(3)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `ngada provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('keeps every metre unsourced, and the body figures separately so', () => {
    for (const d of ALL_DIMS.filter((x) => x.unit === 'm')) {
      expect(d.class).toBe('interpolated')
      expect(['none', 'anthropometry']).toContain(d.source)
    }
    expect(ALL_DIMS.filter((d) => d.source === 'anthropometry')).toHaveLength(2)
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
