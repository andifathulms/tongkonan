import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/dayak/assembly'
import { checkNoCharacteristicLength, runInvariants, summarise } from '@/lib/tradition/dayak/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MAX_KELUARGA,
  MIN_KELUARGA,
  TUMBUH,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/dayak/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/dayak/address'
import { resolveLayout } from '@/lib/tradition/dayak/frame'
import { roofLevels } from '@/lib/tradition/dayak/roof'
import { shingleCounterexample } from '@/lib/tradition/dayak/counterexample'
import { sceneModel } from '@/lib/tradition/dayak/scene'
import { STAGE_ORDER } from '@/lib/tradition/dayak/types'
import type { Rules } from '@/lib/tradition/dayak/types'

/** Both ends of the census, all three ways of growing, and an open gallery. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { keluarga: MIN_KELUARGA, tumbuh: 'hulu', sami: true },
  { keluarga: 11, tumbuh: 'dua-arah', sami: false },
  { keluarga: MAX_KELUARGA, tumbuh: 'hilir', sami: true },
  { keluarga: 6, tumbuh: 'hulu', sami: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.keluarga} households, ${rules.tumbuh}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the length is a census, not a proportion', () => {
  /**
   * The claim this house exists in the project to make, asserted against the
   * arithmetic rather than against the check — so that the test and the check
   * are two independent readings of the same building.
   */
  it('lengthens by exactly one share per household and changes nothing else', () => {
    let previous = resolveLayout({ ...DEFAULT_RULES, keluarga: MIN_KELUARGA })
    for (let n = MIN_KELUARGA + 1; n <= MAX_KELUARGA; n++) {
      const l = resolveLayout({ ...DEFAULT_RULES, keluarga: n })
      expect(l.length - previous.length).toBeCloseTo(DIMS.shareLength.value, 9)
      expect(l.halfX).toBeCloseTo(previous.halfX, 9)
      expect(l.floorY).toBeCloseTo(previous.floorY, 9)
      expect(l.ridgeY).toBeCloseTo(previous.ridgeY, 9)
      expect(l.shares).toHaveLength(n)
      previous = l
    }
  })

  /**
   * The unusual half: the ratio has to *fail* to settle. A building type with
   * a characteristic proportion would hold this within a few per cent across
   * its whole range, and asserting the opposite is the only way to state that
   * this one has none.
   */
  it('never settles on a length-to-width ratio', () => {
    const ratios = [MIN_KELUARGA, 8, MAX_KELUARGA].map((n) => {
      const l = resolveLayout({ ...DEFAULT_RULES, keluarga: n })
      return l.length / (l.halfX * 2)
    })
    const lo = Math.min(...ratios)
    const hi = Math.max(...ratios)
    expect(hi / lo).toBeGreaterThan(2)
  })

  it('says so in the check as well', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const verdict = checkNoCharacteristicLength(layout)
    expect(verdict.status).toBe('pass')
    expect(verdict.detailEn).toContain('failing to hold')
  })

  /**
   * One fewer partition than households: the number a stranger counts to know
   * how many families live here. Trivial arithmetic and worth pinning, because
   * an off-by-one would make the building lie about its own census.
   */
  it('builds one fewer partition than there are households', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts.filter((p) => p.id.startsWith('sekat-'))).toHaveLength(rules.keluarga - 1)
      expect(house.parts.filter((p) => p.id.startsWith('muka-bagian-'))).toHaveLength(rules.keluarga * 2)
    }
  })

  /**
   * A survey would pin the share and not the house. Stated as a test because
   * it is the thing most likely to be misread about this pack's provenance:
   * every figure here could become measured and the length would still be
   * unknown, because the length is not a property of the building type.
   */
  it('takes its length from the share and never declares one', () => {
    expect(DIM_KEYS).toContain('shareLength')
    expect(DIM_KEYS.some((k) => /^(length|houseLength|bodyLength)$/.test(k))).toBe(false)
    const l = resolveLayout(DEFAULT_RULES)
    expect(l.length).toBeCloseTo(DIMS.shareLength.value * DEFAULT_RULES.keluarga, 9)
  })
})

describe('what a longhouse breaks', () => {
  /**
   * No mirror along the length, and the pack says why rather than picking an
   * axis that happens to pass. This test pins the reasoning: a house grown
   * from one end genuinely is not symmetric, so the hejot moves with `tumbuh`.
   */
  it('puts the way up at the end the house did not grow from', () => {
    const hilir = resolveLayout({ ...DEFAULT_RULES, tumbuh: 'hilir' })
    const hulu = resolveLayout({ ...DEFAULT_RULES, tumbuh: 'hulu' })
    const both = resolveLayout({ ...DEFAULT_RULES, tumbuh: 'dua-arah' })
    expect(hilir.hejot.z).toBeLessThan(0)
    expect(hulu.hejot.z).toBeGreaterThan(0)
    expect(both.hejot.z).toBeCloseTo(0, 9)
    expect(TUMBUH).toHaveLength(3)
  })

  it('keeps the gallery nearly as deep as the room behind it', () => {
    const l = resolveLayout(DEFAULT_RULES)
    const ratio = l.samiDepth / l.bilikDepth
    expect(ratio).toBeGreaterThan(0.6)
    expect(ratio).toBeLessThan(1)
  })

  it('is one building and not a row of houses touching', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const floors = house.parts.filter((p) => p.stage === 'lantai')
    expect(floors).toHaveLength(1)
    const floor = floors[0]
    expect(floor).toBeDefined()
    if (floor && floor.kind === 'box') expect(floor.size[2]).toBeCloseTo(layout.length, 9)
  })

  /**
   * `footprint` now reports something that is not a property of the building
   * type. Pinned because a reader comparing footprints across the registry is
   * comparing buildings everywhere except here, where they are comparing
   * censuses.
   */
  it('reports a footprint that is a census rather than a type', () => {
    const small = buildHouse({ ...DEFAULT_RULES, keluarga: MIN_KELUARGA })
    const large = buildHouse({ ...DEFAULT_RULES, keluarga: MAX_KELUARGA })
    const a = sceneModel(small.house, small.layout)
    const b = sceneModel(large.house, large.layout)
    expect(a.footprint.x).toBeCloseTo(b.footprint.x, 9)
    expect(b.footprint.z / a.footprint.z).toBeCloseTo(MAX_KELUARGA / MIN_KELUARGA, 6)
  })

  /**
   * A gable out of the hip primitive: equal half-lengths at both levels. The
   * third distinct roof form from one piece of core code, which is the
   * strongest evidence yet that it was extracted for the right reason.
   */
  it('gets a gable from the hip primitive by making the ridge as long as the eave', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const levels = roofLevels(layout)
    const eave = levels[0]
    const ridge = levels[1]
    expect(eave).toBeDefined()
    expect(ridge).toBeDefined()
    if (!eave || !ridge) return
    // Equal half-lengths is the whole difference between a hip and a gable,
    // and `steppedHip` needed to know nothing about it.
    expect(eave.halfZ).toBeCloseTo(ridge.halfZ, 9)
    expect(ridge.halfX).toBe(0)
  })
})

describe('the counterexample', () => {
  it('takes the lap away until the roof stops covering itself', () => {
    const c = shingleCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeLessThan(c.actual)
    expect(c.witness.broken.lap).toBeLessThan(c.witness.sound.lap)
    // Same amount of ironwood, same rafters: only the overlap changed.
    expect(c.witness.broken.courses).toBe(c.witness.sound.courses)
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
    expect(q).toContain('keluarga=')
    expect(q).toContain('tumbuh=')
    expect(q).toContain('sami=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('keluarga=&tumbuh=&sami=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `dayak provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`dayak parts: ${split.interpolated} interpolated of ${split.total}`)
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

  it('leans the way up in last, because it is the thing that can be taken away', () => {
    const order = STAGE_ORDER
    expect(order[order.length - 1]).toBe('hejot')
  })
})
