import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline } from '@/lib/tradition/banjar/assembly'
import {
  checkCoreIsTallest,
  checkFloorsStepDown,
  checkRoofChain,
  checkTypeSelectsAForm,
  runInvariants,
  summarise,
} from '@/lib/tradition/banjar/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  JENIS,
  MAX_RUANG,
  MIN_RUANG,
  jenisInfo,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/banjar/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/banjar/address'
import { resolveLayout } from '@/lib/tradition/banjar/frame'
import { ridgeCounterexample } from '@/lib/tradition/banjar/counterexample'
import { sceneModel } from '@/lib/tradition/banjar/scene'
import { STAGE_ORDER } from '@/lib/tradition/banjar/types'
import type { Rules } from '@/lib/tradition/banjar/types'

/** All three types, both ends of the core, and the wings withheld. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { jenis: 'palimasan', ruang: MIN_RUANG, anjung: true },
  { jenis: 'gajah-baliku', ruang: MAX_RUANG, anjung: false },
  { jenis: 'bubungan-tinggi', ruang: MAX_RUANG, anjung: true },
  { jenis: 'palimasan', ruang: 4, anjung: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.jenis}, ${rules.ruang} bays, anjung ${rules.anjung}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('a house that is a sequence of roofs', () => {
  /**
   * The claim this building was added to make. Thirteen buildings before it
   * have one roof over the whole plan; this one has four in a row, and they
   * have to meet — a gap between two of them is a stripe of open sky down the
   * length of the house.
   */
  it('runs four roofs along one ridge, meeting end to end', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(layout.segments).toHaveLength(4)
      expect(checkRoofChain(house, layout).status).toBe('pass')
      const ordered = [...layout.segments].sort((a, b) => a.x - b.x)
      for (let i = 1; i < ordered.length; i += 1) {
        const prev = ordered[i - 1]
        const next = ordered[i]
        if (!prev || !next) throw new Error('missing segment')
        expect(prev.x + prev.halfX).toBeCloseTo(next.x - next.halfX, 6)
      }
      expect(ordered.map((s) => s.key)).toEqual(['pelatar', 'surambi', 'palidangan', 'padu'])
    }
  })

  /**
   * The name is the roof, so the middle has to be the tall one. Every other
   * building in this project would still be itself with its roof lowered; this
   * one would be a different named type.
   */
  it('stands the core above every other segment', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkCoreIsTallest(layout).status).toBe('pass')
      const core = layout.segments.find((s) => s.key === 'palidangan')
      if (!core) throw new Error('no core')
      for (const seg of layout.segments) {
        if (seg.key !== 'palidangan') expect(core.ridgeY).toBeGreaterThan(seg.ridgeY)
      }
    }
  })

  /**
   * The rule that is unlike every other rule here: it selects a primitive.
   *
   * A rank multiplies, a laras switches a floor, a wujud grades a series, a
   * layer count thickens thatch. This one changes the *shape* over one segment
   * and nothing else — so the test is that the three types differ in form and
   * agree everywhere the form is not.
   */
  it('changes a shape and not a size when the type changes', () => {
    const forms = JENIS.map((j) => resolveLayout({ ...DEFAULT_RULES, jenis: j.jenis }))
    const cores = forms.map((l) => l.segments.find((s) => s.key === 'palidangan'))
    expect(new Set(cores.map((c) => c?.bentuk)).size).toBe(3)
    expect(new Set(cores.map((c) => c?.ridgeY)).size).toBe(3)
    // The plan is the same house at all three: same length, same width, same
    // floors, same posts. Only what is overhead differs.
    for (const l of forms) {
      expect(l.depth).toBeCloseTo(forms[0]?.depth ?? 0, 9)
      expect(l.halfZ).toBeCloseTo(forms[0]?.halfZ ?? 0, 9)
    }
    for (const c of cores) expect(c?.floorY).toBeCloseTo(cores[0]?.floorY ?? 0, 9)
    for (const rules of COMBOS) {
      expect(checkTypeSelectsAForm(resolveLayout(rules)).status).toBe('pass')
      expect(resolveLayout(rules).segments.find((s) => s.key === 'palidangan')?.bentuk).toBe(
        jenisInfo(rules.jenis).core,
      )
    }
  })

  /**
   * The floors step, and they mean something different by it than the Palembang
   * limas does. There the step *is* the hierarchy — where a guest sits is their
   * standing. Here it follows the roofs and the water, so the test is that the
   * sequence tracks the ridges rather than a rank.
   */
  it('steps the floor down toward the water, following the roofs', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      expect(checkFloorsStepDown(layout).status).toBe('pass')
      const ordered = [...layout.segments].sort((a, b) => a.x - b.x)
      const front = ordered[0]
      const core = layout.segments.find((s) => s.key === 'palidangan')
      if (!front || !core) throw new Error('missing segment')
      expect(front.floorY).toBeLessThan(core.floorY)
    }
  })

  it('adds two roofs across the chain when the wings stand', () => {
    const withWings = buildHouse({ ...DEFAULT_RULES, anjung: true })
    const without = buildHouse({ ...DEFAULT_RULES, anjung: false })
    expect(withWings.layout.anjung.present).toBe(true)
    expect(without.layout.anjung.present).toBe(false)
    expect(without.house.parts.some((p) => p.stage === 'anjung')).toBe(false)
    expect(withWings.house.parts.filter((p) => p.stage === 'anjung').length).toBeGreaterThan(0)
    // Both wings, and symmetric about the ridge they hang off.
    const zs = withWings.house.parts.flatMap((p) => (p.stage === 'anjung' && p.kind === 'box' ? [p.center[2]] : []))
    expect(zs.length).toBeGreaterThan(3)
    expect(Math.max(...zs)).toBeCloseTo(-Math.min(...zs), 6)
    // Each wing carries a roof of its own, which is the claim the readings make.
    expect(withWings.house.parts.filter((p) => p.id.startsWith('sirap-anjung-')).length).toBeGreaterThan(0)
  })
})

describe('the counterexample', () => {
  /**
   * The only counterexample in the collection that ends with a sound building.
   * Thirteen others end with something that cannot be built, or is dead, or has
   * stopped being what it was for. This one ends with a house that is fine and
   * is called something else.
   */
  it('lowers the ridge until the house is no longer what its name says', () => {
    const c = ridgeCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.witness.broken.core).toBeLessThan(c.witness.sound.core)
    expect(c.witness.broken.core).toBeLessThanOrEqual(c.witness.broken.neighbour)
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
    expect(q).toContain('jenis=')
    expect(q).toContain('ruang=')
    expect(q).toContain('anjung=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('jenis=&ruang=&anjung=')).toEqual(normaliseRules(DEFAULT_RULES))
  })
})

describe('the scene and the timeline', () => {
  it('reports a habitable void under the floor, as a river house has', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(sceneModel(house, layout).underfloorHeight).toBeGreaterThan(1)
  })

  it('raises the frames in stage order and never a ridge before its rafters', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      const timeline = buildTimeline(house)
      expect(timeline.entries.length).toBe(house.parts.length)
      // The array is the build sequence, so it is read in the order it is in.
      let seen = -1
      for (const part of house.parts) {
        const rank = STAGE_ORDER.indexOf(part.stage)
        expect(rank).toBeGreaterThanOrEqual(seen)
        seen = rank
      }
      // And the ridges come after the rafters that carry them, which is the
      // fault this building had.
      const at = (id: string) => house.parts.findIndex((p) => p.id === id)
      for (const seg of layout.segments) {
        const ridge = at(`bubungan-${seg.key}`)
        const rafter = house.parts.findIndex((p) => p.id.startsWith(`kasau-${seg.key}-`))
        expect(rafter).toBeGreaterThanOrEqual(0)
        expect(ridge).toBeGreaterThan(rafter)
      }
    }
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `banjar provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * The figure this house is recognised by is the author's. Sources agree the
   * core ridge is steep and none of them gives an angle, so the pitch that
   * makes a bubungan tinggi a bubungan tinggi is interpolated — which is worth
   * a test of its own, because it is exactly the number a later reader would
   * assume must be sourced.
   */
  it('leaves the pitch that names the house unsourced, as the caution states', () => {
    const metric = ALL_DIMS.filter((d) => d.unit === 'm')
    expect(metric.length).toBeGreaterThan(8)
    for (const d of metric) {
      expect(d.class).toBe('interpolated')
      expect(d.source).toBe('none')
    }
  })

  it('counts every part as interpolated, since every one depends on an invented metre', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const split = partSplit(house.parts)
    expect(split.measured).toBe(0)
    expect(split.interpolated).toBe(split.total)
  })

  it('every part cites only declared dimensions', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      for (const part of house.parts) {
        expect(part.dims.length).toBeGreaterThan(0)
        for (const key of part.dims) expect(DIM_KEYS).toContain(key)
      }
    }
  })
})
