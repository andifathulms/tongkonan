import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/bali/assembly'
import { runInvariants, summarise } from '@/lib/tradition/bali/invariants'
import {
  ALL_DIMS,
  BALE,
  DEFAULT_RULES,
  DIM_KEYS,
  MAX_DEPA,
  MIN_DEPA,
  PACK,
  baleInfo,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/bali/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/bali/address'
import { isWhole, sikut, unitLength } from '@/lib/tradition/bali/module'
import { resolveLayout } from '@/lib/tradition/bali/frame'
import { penguripCounterexample } from '@/lib/tradition/bali/counterexample'
import { sceneModel } from '@/lib/tradition/bali/scene'
import { STAGE_ORDER } from '@/lib/tradition/bali/types'
import type { Rules } from '@/lib/tradition/bali/types'

/**
 * Every bale, both ends of the human range, and one house with the pengurip
 * withheld — because the check that matters most here inverts when it is.
 */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { bale: 'sakepat', depa: MIN_DEPA, pengurip: true },
  { bale: 'sakenem', depa: 1700, pengurip: true },
  { bale: 'sangasari', depa: MAX_DEPA, pengurip: true },
  { bale: 'sakaroras', depa: 1650, pengurip: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.bale}, depa ${rules.depa}${rules.pengurip ? '' : ', no pengurip'}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the house is measured in its owner', () => {
  /**
   * The claim the whole tradition exists in this project to make. Asserted
   * against the arithmetic rather than against `checkModule`, so that the test
   * and the check are two independent readings of the same building — a check
   * that only agrees with itself is not evidence.
   */
  it('gives every principal length as a whole number of a body measure', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      const s = layout.sikut
      for (const m of layout.measured) {
        const unit = unitLength(s, m.unit)
        expect(Math.abs(m.metres - (m.count * unit + s.pengurip))).toBeLessThan(1e-9)
        expect(isWhole(m.metres - s.pengurip, unit)).toBe(true)
      }
      expect(layout.measured.length).toBeGreaterThan(6)
    }
  })

  /**
   * A different owner is a different building, not the same one drawn larger.
   *
   * The distinction is real and testable: a scale factor would leave every
   * ratio identical, and it does — but the *counts* stay identical too, which
   * is the thing being asserted. What changes is the metre value of a unit,
   * not how many of them the house is.
   */
  it('changes the metres and not the counts when the owner changes', () => {
    const short = resolveLayout({ bale: 'sakaroras', depa: 1550, pengurip: true })
    const tall = resolveLayout({ bale: 'sakaroras', depa: 1900, pengurip: true })
    expect(short.measured.map((m) => `${m.key}:${m.count}:${m.unit}`)).toEqual(
      tall.measured.map((m) => `${m.key}:${m.count}:${m.unit}`),
    )
    expect(tall.eaveY).toBeGreaterThan(short.eaveY)
    expect(tall.bataranHalfX).toBeGreaterThan(short.bataranHalfX)
  })

  /**
   * The pengurip is what keeps the house off its own module, and withholding
   * it puts the house squarely back on it. Both halves are asserted, because
   * the interesting claim is not that the increment exists but that it is the
   * only thing standing between this building and an exact one.
   */
  it('lands exactly on the module only when the pengurip is withheld', () => {
    const alive = resolveLayout({ bale: 'sakaroras', depa: 1700, pengurip: true })
    const dead = resolveLayout({ bale: 'sakaroras', depa: 1700, pengurip: false })
    for (const m of alive.measured) {
      expect(isWhole(m.metres, unitLength(alive.sikut, m.unit))).toBe(false)
    }
    for (const m of dead.measured) {
      expect(isWhole(m.metres, unitLength(dead.sikut, m.unit))).toBe(true)
    }
    expect(alive.sikut.pengurip).toBeGreaterThan(0)
    expect(dead.sikut.pengurip).toBe(0)
  })

  it('derives every body measure from the one arm span', () => {
    const s = sikut(1600, { hasta: 0.25, musti: 0.075, useran: 0.0125, nyari: 0.011 }, true)
    expect(s.depa).toBeCloseTo(1.6, 9)
    expect(s.hasta).toBeCloseTo(0.4, 9)
    expect(s.pengurip).toBeCloseTo(s.useran, 9)
  })
})

describe('what a pavilion breaks', () => {
  /**
   * The roof form is not declared anywhere; it falls out of the post count.
   * A square plan therefore has to produce a ridge of zero length, and the
   * check on it has to accept that rather than treat it as a degenerate roof.
   */
  it('turns a square bale into a pyramid with nothing written to do so', () => {
    for (const info of BALE) {
      const layout = resolveLayout({ bale: info.bale, depa: 1700, pengurip: true })
      const eave = layout.roof[0]
      const ridge = layout.roof[layout.roof.length - 1]
      expect(eave).toBeDefined()
      expect(ridge).toBeDefined()
      if (!eave || !ridge) continue
      const square = info.rows === info.cols
      expect(ridge.halfZ).toBeCloseTo(Math.max(0, eave.halfZ - eave.halfX), 9)
      if (square) expect(ridge.halfZ).toBeCloseTo(0, 9)
      else expect(ridge.halfZ).toBeGreaterThan(0)
    }
  })

  it('names itself by its post count', () => {
    for (const info of BALE) {
      const { house } = buildHouse({ bale: info.bale, depa: 1700, pengurip: true })
      expect(house.parts.filter((p) => /^saka-\d+-\d+$/.test(p.id)).length).toBe(info.saka)
      expect(info.rows * info.cols).toBe(info.saka)
    }
  })

  /**
   * `underfloorHeight` has now been asked to mean four different things, and
   * this is the smallest. Asserted as an order-of-magnitude claim rather than
   * a number, because the point is that the field reports a clearance and lets
   * the reader decide whether it is a storey, a step or a seat.
   */
  it('reports a platform you sit on rather than a storey you walk under', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.underfloorHeight).toBeGreaterThan(0)
    expect(scene.underfloorHeight).toBeLessThan(0.8)
    expect(scene.zones).toHaveLength(3)
    expect(scene.zones.map((z) => z.key)).toEqual(['nista', 'madya', 'utama'])
  })

  it('has no wall between the floor and the eave', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const enclosing = house.parts.filter(
      (p) => p.stage === 'sunduk' || p.stage === 'saka',
    )
    // Nothing else stands in the storey at all: the roof is what shelters it.
    for (const part of enclosing) expect(part.kind).toBe('box')
    const eave = layout.roof[0]
    expect(eave).toBeDefined()
    if (eave) expect(eave.halfX - layout.bataranHalfX).toBeGreaterThan(0)
  })
})

describe('the counterexample', () => {
  /**
   * The one check in this project that is broken by a house which stands up
   * perfectly well. Every other counterexample ends in a building that cannot
   * be constructed; this one ends in a building that is merely dead.
   */
  it('kills the house by growing the increment that keeps it alive', () => {
    const c = penguripCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeGreaterThan(c.actual)
    expect(c.witness.broken.pengurip).toBeGreaterThan(c.witness.sound.pengurip)
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
    expect(q).toContain('bale=')
    expect(q).toContain('depa=')
    expect(q).toContain('pengurip=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('bale=&depa=&pengurip=')).toEqual(normaliseRules(DEFAULT_RULES))
  })

  it('clamps a depa outside the range of a human being', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, depa: 10 }).depa).toBe(MIN_DEPA)
    expect(normaliseRules({ ...DEFAULT_RULES, depa: 99999 }).depa).toBe(MAX_DEPA)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `bali provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The split this house exists to make. The ratios between one body measure
   * and the next are not from the Balinese literature and must never be filed
   * under the same "no source" heading as a number nobody thought about — so
   * they carry their own key, and it has to stay distinguishable.
   */
  it('files the anthropometry apart from the unsourced', () => {
    const anthropometry = ALL_DIMS.filter((d) => d.source === 'anthropometry')
    expect(anthropometry.length).toBeGreaterThan(0)
    for (const d of anthropometry) expect(d.class).toBe('interpolated')
    expect(PACK.sourceFor('anthropometry').kind).toBe('none')
    expect(PACK.sourceFor('anthropometry').citation).not.toBe(PACK.sourceFor('none').citation)
  })

  /**
   * The builders route every length through the module and none of them
   * writes a count inline.
   *
   * The joglo pack has the same guard against a bare decimal times the rank
   * scale. Here the fault takes a different form and is worse: a number
   * written straight into `stockLength(s, 4, 'musti')` is a real dimension —
   * it changes the size of something a reader can see — but it is not in
   * `DIMS`, so `/sumber` never lists it and the provenance bar never counts
   * it. `checkModule` cannot see it either, because a set-out written that way
   * is still a whole number of a body measure and passes happily. Four of them
   * were sitting in the first draft.
   */
  it('writes no unit count inline in a builder', () => {
    const files = ['lib/tradition/bali/frame.ts', 'lib/tradition/bali/roof.ts']
    const offenders: string[] = []
    for (const file of files) {
      const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
      src.split('\n').forEach((line, i) => {
        const code = line.split('//')[0] ?? ''
        if (/(sikut|stock)Length\(\s*\w+\s*,\s*[\d.]/.test(code)) offenders.push(`${file}:${i + 1} ${line.trim()}`)
      })
    }
    expect(offenders).toEqual([])
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`bali parts: ${split.interpolated} interpolated of ${split.total}`)
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

  it('raises the platform before anything stands on it', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const first = house.parts[0]
    expect(first?.stage).toBe('bataran')
  })
})

describe('the bale table', () => {
  it('knows every bale and refuses one it does not', () => {
    for (const info of BALE) expect(baleInfo(info.bale).saka).toBe(info.saka)
    // @ts-expect-error the table is closed, and this is the runtime half of it
    expect(() => baleInfo('sakalima')).toThrow()
  })
})
