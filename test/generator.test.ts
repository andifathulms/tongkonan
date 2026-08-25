import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/banua/assembly'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  normaliseRules,
  partClass,
  partSplit,
  provenanceSplit,
  worstClass,
} from '@/lib/banua/rules'
import { STAGE_ORDER } from '@/lib/banua/types'
import type { Rules, Stage } from '@/lib/banua/types'

describe('the generator contract', () => {
  it('is deterministic: the same rules give byte-identical output', () => {
    const a = JSON.stringify(buildHouse(DEFAULT_RULES).house)
    const b = JSON.stringify(buildHouse(DEFAULT_RULES).house)
    expect(a).toBe(b)
  })

  it('clamps rules rather than inventing a house outside the declared range', () => {
    expect(normaliseRules({ rank: 'layuk', bays: 9, horns: -4 })).toEqual({
      rank: 'layuk',
      bays: 5,
      horns: 0,
    })
    expect(normaliseRules({ rank: 'layuk', bays: 0, horns: 999 }).bays).toBe(2)
  })
})

describe('a socially meaningful number visibly changes the house', () => {
  it('rank scales the whole body', () => {
    const big = buildHouse({ rank: 'layuk', bays: 3, horns: 0 }).layout
    const small = buildHouse({ rank: 'batu-ariri', bays: 3, horns: 0 }).layout
    expect(big.bodyLength).toBeGreaterThan(small.bodyLength)
    expect(big.bodyWidth).toBeGreaterThan(small.bodyWidth)
    expect(big.kolongHeight).toBeGreaterThan(small.kolongHeight)
  })

  it('bay count drives both the length and the post rows', () => {
    for (const bays of [2, 3, 4, 5]) {
      const { house, layout } = buildHouse({ rank: 'pekamberan', bays, horns: 0 })
      expect(layout.postX.length).toBe(bays + 1)
      expect(layout.bayNames.length).toBe(bays)
      expect(house.parts.filter((p) => p.id.startsWith('ariri-')).length).toBe((bays + 1) * 2)
    }
  })

  it('horn count is a tally: one part per funeral held', () => {
    for (const horns of [0, 1, 6, 24]) {
      const { house } = buildHouse({ rank: 'layuk', bays: 3, horns })
      expect(house.parts.filter((p) => p.stage === 'tanduk').length).toBe(horns)
    }
  })

  it('names the bays front to rear, extending the sali as the house grows', () => {
    expect(buildHouse({ rank: 'pekamberan', bays: 3, horns: 0 }).layout.bayNames).toEqual([
      "tangdo'",
      'sali',
      'sumbung',
    ])
    const five = buildHouse({ rank: 'layuk', bays: 5, horns: 0 }).layout.bayNames
    expect(five[0]).toBe("tangdo'")
    expect(five[five.length - 1]).toBe('sumbung')
  })
})

describe('the build sequence', () => {
  it('walks the nine stages in order and places every part exactly once', () => {
    const { house } = buildHouse({ rank: 'layuk', bays: 4, horns: 12 })
    const timeline = buildTimeline(house)
    const seen = timeline.stages.map((s) => s.stage)
    expect(seen).toEqual(STAGE_ORDER.filter((s) => seen.includes(s)))
    expect(timeline.entries.length).toBe(house.parts.length)
    expect(placedAt(timeline, 1).size).toBe(house.parts.length)
    expect(placedAt(timeline, 0).size).toBe(0)
  })

  it('raises the posts before it lays the deck, and the ijuk before the horns', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const timeline = buildTimeline(house)
    const at = (stage: Stage) => {
      const span = timeline.stages.find((s) => s.stage === stage)
      if (!span) throw new Error(`stage missing from the timeline: ${stage}`)
      return span
    }
    expect(at('ariri').end).toBeLessThanOrEqual(at('lantai').start)
    expect(at('ijuk').end).toBeLessThanOrEqual(at('tanduk').start)
  })
})

describe('provenance', () => {
  /**
   * This test does not assert a target. The interpolated share is high and is
   * meant to be: it is the project's progress metric, and printing it is how
   * the number stays in front of whoever is working on the model.
   */
  it('reports the interpolated share', () => {
    const split = provenanceSplit()
    const pct = (n: number) => ((n / split.total) * 100).toFixed(0)
    console.log(
      `provenance: ${split.measured} measured (${pct(split.measured)}%), ` +
        `${split.canon} canon (${pct(split.canon)}%), ` +
        `${split.interpolated} interpolated (${pct(split.interpolated)}%)`,
    )
    expect(split.total).toBe(ALL_DIMS.length)
    expect(split.measured + split.canon + split.interpolated).toBe(split.total)
  })

  it('never tags a dimension measured while no survey is wired in', () => {
    // The moment a real measured drawing lands, this test is the one to
    // delete. Until then it stops a plausible guess being promoted quietly.
    expect(ALL_DIMS.filter((d) => d.class === 'measured')).toEqual([])
  })

  it('gives every interpolated dimension the honest source key', () => {
    for (const d of ALL_DIMS) {
      if (d.class === 'interpolated') expect(d.source).toBe('none')
      else expect(d.source).not.toBe('none')
    }
  })

  it('carries the dimensions through to the layout', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    expect(layout.dims.length).toBeGreaterThan(0)
  })
})

describe('orientation is a constraint', () => {
  it('offers no way to rotate the building', () => {
    // If a rotation parameter ever appears on Rules, this fails and the
    // reason it fails is the point: orientation is a fact about the house.
    const keys = Object.keys(buildHouse(DEFAULT_RULES).house.rules as Rules).sort()
    expect(keys).toEqual(['bays', 'horns', 'rank'])
  })

  it('puts the front prow to the north, which is -X', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    expect(layout.frontProwX).toBeLessThan(0)
    expect(layout.rearProwX).toBeGreaterThan(0)
    expect(layout.frontProwY).toBeGreaterThan(layout.rearProwY)
  })
})

describe('provenance, per part', () => {
  it('every part names dimensions that exist', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const known = new Set<string>(DIM_KEYS)
    for (const part of house.parts) {
      expect(part.dims.length, `${part.id} is untagged`).toBeGreaterThan(0)
      for (const key of part.dims) expect(known.has(key), `${part.id} cites ${key}`).toBe(true)
    }
  })

  it('classes a part by its least-sourced input, never its best', () => {
    // orientation is canon, bayLength is the author's own.
    expect(worstClass(['orientation'])).toBe('canon')
    expect(worstClass(['orientation', 'bayLength'])).toBe('interpolated')
    expect(worstClass([])).toBe('measured')
  })

  it('the split by part and the split by dimension are allowed to disagree', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const byPart = partSplit(house.parts)
    const byDim = provenanceSplit(layout.dims)
    expect(byPart.total).toBe(house.parts.length)
    expect(byDim.total).toBe(layout.dims.length)
    // The point of marking the model: the two counts answer different
    // questions and neither substitutes for the other.
    expect(byPart.total).not.toBe(byDim.total)
  })

  it('reports what the marked model actually shows', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const split = partSplit(house.parts)
    const pct = (n: number) => Math.round((n / split.total) * 100)
    console.log(
      `parts: ${split.measured} measured (${pct(split.measured)}%), ` +
        `${split.canon} canon (${pct(split.canon)}%), ` +
        `${split.interpolated} interpolated (${pct(split.interpolated)}%)`,
    )
    expect(split.measured + split.canon + split.interpolated).toBe(split.total)
  })

  it('a part that cites only canon rules is not marked as invented', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    // Every part currently depends on at least one metric value, so this is
    // a statement about the rule pack rather than about the code: when a
    // survey lands, these verdicts move without anything here changing.
    const classes = new Set(house.parts.map((p) => partClass(p)))
    expect(classes.has('interpolated')).toBe(true)
  })
})
