import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/minang/assembly'
import { runInvariants, summarise } from '@/lib/tradition/minang/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  PACK,
  larasInfo,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/minang/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/minang/address'
import { roofStations } from '@/lib/tradition/minang/roof'
import { STAGE_ORDER } from '@/lib/tradition/minang/types'
import type { Rules } from '@/lib/tradition/minang/types'

/**
 * The rule combinations the suite is run over.
 *
 * Both laras, the smallest and largest ruang counts, and a house with no
 * bilik at all — because a tally that can be zero is the case that catches a
 * builder assuming there is always at least one.
 */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { laras: 'bodi-caniago', ruang: 5, bilik: 3 },
  { laras: 'koto-piliang', ruang: 3, bilik: 1 },
  { laras: 'bodi-caniago', ruang: 9, bilik: 7 },
  { laras: 'koto-piliang', ruang: 9, bilik: 0 },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.laras}, ${rules.ruang} ruang, ${rules.bilik} bilik`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      const failed = results.filter((r) => r.status === 'fail')
      expect(failed.map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      const { skipped } = summarise(results)
      expect(skipped).toBe(1)
    })
  }

  it('never lets the survey check pass', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const survey = runInvariants(house, layout).find((r) => r.key === 'survey')
    expect(survey?.status).toBe('skip')
  })
})

describe('the generator is pure', () => {
  it('produces identical output for identical input', () => {
    const a = buildHouse(DEFAULT_RULES)
    const b = buildHouse(DEFAULT_RULES)
    expect(JSON.stringify(a.house)).toBe(JSON.stringify(b.house))
    expect(JSON.stringify(a.layout)).toBe(JSON.stringify(b.layout))
  })

  it('refuses to build an even-ruang house', () => {
    expect(normaliseRules({ laras: 'koto-piliang', ruang: 4, bilik: 1 }).ruang).toBe(3)
    expect(normaliseRules({ laras: 'koto-piliang', ruang: 8, bilik: 1 }).ruang).toBe(7)
    expect(normaliseRules({ laras: 'koto-piliang', ruang: 99, bilik: 99 }).ruang).toBe(9)
  })

  it('will not hold more bilik than there are interior ruang', () => {
    const r = normaliseRules({ laras: 'bodi-caniago', ruang: 3, bilik: 9 })
    expect(r.bilik).toBe(1)
  })
})

/**
 * The reason this tradition was chosen second. Everything else here could
 * have been checked on a house that merely looked different.
 */
describe('the laras is legible in the floor', () => {
  it('steps the ends up under Koto Piliang and refuses to under Bodi Caniago', () => {
    const koto = buildHouse({ laras: 'koto-piliang', ruang: 5, bilik: 2 })
    const bodi = buildHouse({ laras: 'bodi-caniago', ruang: 5, bilik: 2 })

    expect(koto.layout.anjuangRise).toBeGreaterThan(0)
    expect(koto.layout.anjuangY).toBeGreaterThan(koto.layout.deckY)
    expect(koto.house.parts.some((p) => p.stage === 'anjuang')).toBe(true)

    expect(bodi.layout.anjuangRise).toBe(0)
    expect(bodi.layout.anjuangY).toBe(bodi.layout.deckY)
    expect(bodi.house.parts.some((p) => p.stage === 'anjuang')).toBe(false)
  })

  it('shows in the floor and nowhere else', () => {
    // The gonjong count used to differ by laras, with the extra pair standing
    // on the middle of the ridge — a shape nobody builds. Both carry four
    // until a roof over the anjuang is modelled, so the floor is the only
    // place the laras is legible, which is where the sources put it.
    expect(larasInfo('koto-piliang').gonjong).toBe(larasInfo('bodi-caniago').gonjong)
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      expect(house.parts.filter((p) => p.stage === 'gonjong').length).toBe(
        larasInfo(rules.laras).gonjong,
      )
    }
  })
})

/**
 * The form a render caught and the invariants had not.
 *
 * Every check passed on a house with four rods standing on its ridge, because
 * none of them asked whether the roof surface was what rose into the point.
 * These are that question, asked three ways.
 */
describe('the gonjong is the roof', () => {
  it('lifts the roof edge past the ridge instead of standing on it', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const stations = roofStations(layout)
    const middle = stations.filter((s) => Math.abs(s.x) < layout.bodyLength * 0.25)

    // Level over the middle of the house...
    for (const s of middle) expect(s.eaveY).toBeCloseTo(layout.eaveY, 9)
    // ...and past its own ridge by the end.
    expect(Math.max(...stations.map((s) => s.eaveY))).toBeGreaterThan(layout.ridgeEndY)
    // The tips sit above the ridge end, which is what makes the hollow.
    for (const tip of layout.gonjongTips) expect(tip[1]).toBeGreaterThan(layout.ridgeEndY)
  })

  it('gives the sweep room to be a curve rather than a cliff', () => {
    // It rose ten metres over nine hundred millimetres once — eleven to one,
    // which renders as a flat sail welded to the end of the roof.
    const { layout } = buildHouse(DEFAULT_RULES)
    const stations = roofStations(layout)
    const lifted = stations.filter((s) => s.eaveY > layout.eaveY + 1e-6)
    const run = layout.ridgeEndZ - Math.min(...lifted.map((s) => Math.abs(s.x)))
    const rise = Math.max(...lifted.map((s) => s.eaveY)) - layout.eaveY
    expect(rise / run).toBeLessThan(4)
    expect(run).toBeGreaterThan(layout.bodyLength * 0.15)
    // And enough stations across it to describe a curve at all.
    expect(lifted.length).toBeGreaterThan(8)
  })

  it('narrows toward the tips rather than ending square', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const stations = roofStations(layout)
    const last = stations[stations.length - 1]
    expect(last?.halfWidth).toBeLessThan(layout.eaveHalfDepth)
    // But not to a pinch: a pair of gonjong stands wide, footed near the
    // roof's own edge.
    expect(last?.halfWidth).toBeGreaterThan(layout.eaveHalfDepth * 0.4)
  })

  it('straightens the transverse break over the overhang', () => {
    // The break in the slope sits on the wall head; past the end of the wall
    // there is nothing for it to sit on, and carrying it out would put a kink
    // down the middle of a spire.
    const { layout } = buildHouse(DEFAULT_RULES)
    const stations = roofStations(layout)
    const tip = stations[stations.length - 1]
    expect(tip?.knee?.drop).toBeCloseTo(layout.breakFraction, 6)
    const middle = stations[Math.floor(stations.length / 2)]
    expect(middle?.knee?.drop).toBeCloseTo(layout.kneeDrop, 6)
  })

  it('makes the roof the dominant mass, as it is in the building', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const roof = Math.max(...layout.gonjongTips.map((t) => t[1])) - layout.plateY
    /*
     * Measured against the wall and not against the plate, because the kolong
     * is air. What reads as the box of the house is the walled storey; the
     * posts under it read as the ground the house stands off. Comparing the
     * roof to the whole height above ground flatters a house on tall stilts
     * and says nothing about how the building looks.
     */
    expect(roof / layout.wallHeight).toBeGreaterThan(2.5)
    // And not so tall that the body disappears under it: it hit 3.0 times the
    // full height once, which is a spire with a house at the bottom.
    expect(Math.max(...layout.gonjongTips.map((t) => t[1])) / layout.plateY).toBeLessThan(2.6)
  })
})

describe('the plan counts govern the frame', () => {
  it('puts a post row on every ruang boundary', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(layout.postZ.length).toBe(rules.ruang + 1)
      expect(house.parts.filter((p) => p.id.startsWith('tonggak-')).length).toBe(
        (rules.ruang + 1) * (layout.lanjarCount + 1),
      )
    }
  })

  it('adds a room per bilik and none when the tally is zero', () => {
    const none = buildHouse({ laras: 'koto-piliang', ruang: 9, bilik: 0 })
    expect(none.house.parts.filter((p) => p.stage === 'bilik').length).toBe(0)
    const some = buildHouse({ laras: 'koto-piliang', ruang: 9, bilik: 4 })
    expect(some.house.parts.filter((p) => p.id.startsWith('bilik-muko-')).length).toBe(4)
  })

  it('leans the walls out, which the first house could not do', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    expect(layout.wallLeanRun).toBeGreaterThan(0)
    expect(layout.eaveHalfDepth).toBeGreaterThan(layout.bodyDepth / 2 + layout.wallLeanRun)
  })
})

describe('the build sequence', () => {
  it('walks the declared stages in order and places every part exactly once', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const timeline = buildTimeline(house)
    expect(placedAt(timeline, 0).size).toBe(0)
    expect(placedAt(timeline, 1).size).toBe(house.parts.length)
    const seen = timeline.stages.map((s) => s.stage)
    const ordered = STAGE_ORDER.filter((s) => seen.includes(s))
    expect(seen).toEqual(ordered)
  })
})

describe('the address', () => {
  it('round-trips every combination', () => {
    for (const rules of COMBOS) {
      expect(rulesEqual(rulesFromQuery(rulesToQuery(rules)), normaliseRules(rules))).toBe(true)
    }
  })

  it('writes all three rules, defaults included', () => {
    const q = rulesToQuery(DEFAULT_RULES)
    expect(q).toContain('laras=')
    expect(q).toContain('ruang=')
    expect(q).toContain('bilik=')
  })

  it('does not answer to the other house’s parameter names', () => {
    // ?pangkat=… describes a tongkonan. Asking this generator for one gets
    // the default rumah gadang with the one parameter it does recognise, and
    // the rank is simply not a thing it can be told.
    const got = rulesFromQuery('?pangkat=layuk&ruang=3')
    expect(rulesEqual(got, normaliseRules({ ...DEFAULT_RULES, ruang: 3 }))).toBe(true)
    expect(got.ruang).toBe(3)
    expect(got.laras).toBe(DEFAULT_RULES.laras)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    const pct = (n: number) => Math.round((n / split.total) * 100)
    // eslint-disable-next-line no-console
    console.log(
      `minang provenance: ${split.measured} measured (${pct(split.measured)}%), ` +
        `${split.canon} canon (${pct(split.canon)}%), ` +
        `${split.interpolated} interpolated (${pct(split.interpolated)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('reports what the marked model would show, counted by part', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(
      `minang parts: ${split.measured} measured, ${split.canon} canon, ${split.interpolated} interpolated`,
    )
    expect(split.total).toBe(house.parts.length)
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

  /*
   * The same guard the first house has, tuned to this one.
   *
   * There is no rank scale here, so "a decimal times the scale" catches
   * nothing. What it catches instead is a declared value being nudged by an
   * undeclared factor — `DIMS.gonjongRise.value * 0.55` — which is exactly the
   * form six real dimensions were hiding in when this file was first written.
   */
  it('declares the numbers that size and place what the reader can see', () => {
    const sources = [
      'lib/tradition/minang/frame.ts',
      'lib/tradition/minang/roof.ts',
      'lib/tradition/minang/ridge.ts',
    ].map((f) => [f, readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')] as const)

    const offenders: string[] = []
    for (const [file, src] of sources) {
      src.split('\n').forEach((line, i) => {
        const code = line.split('//')[0] ?? ''
        if (!/DIMS\.|layout\./.test(code)) return
        // A decimal immediately after * or ** is a factor on a real value.
        // Whole numbers are tessellation counts and are deliberately allowed.
        if (/\*\*?\s*\d+\.\d+/.test(code)) offenders.push(`${file}:${i + 1} ${line.trim()}`)
      })
    }
    expect(offenders, `undeclared dimensions:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('the two houses are separate', () => {
  it('do not share a rule pack', async () => {
    const toraja = await import('@/lib/tradition/toraja/rules')
    expect(PACK.key).toBe('minang')
    expect(toraja.PACK.key).toBe('toraja')
    expect(PACK.dimKeys).not.toBe(toraja.PACK.dimKeys)
    expect(PACK.stageOrder).not.toEqual(toraja.PACK.stageOrder)
  })

  it('do not share a source table', async () => {
    const toraja = await import('@/lib/tradition/toraja/rules')
    const mine = new Set(PACK.sources.map((s) => s.key))
    const theirs = new Set(toraja.PACK.sources.map((s) => s.key))
    // They overlap only where a work genuinely covers both, and never wholly.
    expect(mine).not.toEqual(theirs)
    expect(DIMS.orientation.source).toBe('navis-1984')
  })
})
