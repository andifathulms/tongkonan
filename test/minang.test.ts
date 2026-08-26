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

  it('gives the roof its gonjong count without anyone setting one', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      const spires = house.parts.filter((p) => p.stage === 'gonjong')
      expect(spires.length).toBe(larasInfo(rules.laras).gonjong)
    }
    expect(larasInfo('koto-piliang').gonjong).toBeGreaterThan(larasInfo('bodi-caniago').gonjong)
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
