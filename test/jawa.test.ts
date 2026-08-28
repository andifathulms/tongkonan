import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/jawa/assembly'
import { runInvariants, summarise } from '@/lib/tradition/jawa/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  PACK,
  normaliseRules,
  partSplit,
  provenanceSplit,
  roofTiers,
  wujudInfo,
} from '@/lib/tradition/jawa/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/jawa/address'
import { hipLevelAt, hipRun, steppedHip } from '@/lib/core/hip'
import { STAGE_ORDER } from '@/lib/tradition/jawa/types'
import type { Rules } from '@/lib/tradition/jawa/types'

/** Both grades, both ends of the tier range, and a house with no pavilion. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { wujud: 'jompongan', tumpang: 3, pendhapa: false },
  { wujud: 'pangrawit', tumpang: 11, pendhapa: true },
  { wujud: 'sinom', tumpang: 9, pendhapa: false },
  { wujud: 'jompongan', tumpang: 11, pendhapa: true },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.wujud}, ${rules.tumpang} tiers, ${rules.pendhapa ? 'with' : 'without'} pendhapa`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the generator is pure', () => {
  it('produces identical output for identical input', () => {
    const a = buildHouse(DEFAULT_RULES)
    const b = buildHouse(DEFAULT_RULES)
    expect(JSON.stringify(a.house)).toBe(JSON.stringify(b.house))
  })

  it('refuses an even tier count, because odd is a rule', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 6 }).tumpang).toBe(5)
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 2 }).tumpang).toBe(3)
    expect(normaliseRules({ ...DEFAULT_RULES, tumpang: 99 }).tumpang).toBe(11)
  })
})

/**
 * The things this house does that neither of the others can, which is the
 * reason for building a third one at all.
 */
describe('what a third house was for', () => {
  it('sits on the ground: there is no room under the floor', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    // Both other houses are raised into a habitable void. This one is not, and
    // the difference is an order of magnitude rather than a matter of degree.
    expect(layout.floorY).toBeLessThan(1)
    expect(layout.floorY).toBeGreaterThan(0)
  })

  it('has a ridge far shorter than its building', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      const molo = layout.roof[layout.roof.length - 1]
      expect(molo?.halfX).toBe(0)
      expect((molo?.halfZ ?? 0) * 2).toBeLessThan(layout.bodyLength * 0.4)
    }
  })

  it('derives its roof tiers from its rings of pillars rather than declaring them', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      const info = wujudInfo(rules.wujud)
      expect(layout.roof.length - 1).toBe(roofTiers(info))
      expect(layout.sokoRings.length).toBe(info.rings)
    }
  })

  it('closes the tumpang sari inward and upward, and the count is the rank', () => {
    const low = buildHouse({ ...DEFAULT_RULES, tumpang: 3 })
    const high = buildHouse({ ...DEFAULT_RULES, tumpang: 11 })
    expect(high.layout.tumpangTopY).toBeGreaterThan(low.layout.tumpangTopY)
    // More tiers is a taller roof, which is how a signal read from inside
    // still shows from the yard.
    expect(high.layout.ridgeY).toBeGreaterThan(low.layout.ridgeY)
  })

  it('leaves the senthong tengah empty, and passes by finding nothing', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const check = runInvariants(house, layout).find((c) => c.key === 'senthong-empty')
    expect(check?.status).toBe('pass')
    expect(check?.detailEn).toContain('Nothing is inside it')
  })

  it('builds the pavilion when the rule says so and not otherwise', () => {
    const withOne = buildHouse({ ...DEFAULT_RULES, pendhapa: true })
    const without = buildHouse({ ...DEFAULT_RULES, pendhapa: false })
    expect(withOne.house.parts.some((p) => p.id.startsWith('pendhapa-'))).toBe(true)
    expect(without.house.parts.some((p) => p.id.startsWith('pendhapa-'))).toBe(false)
    // The pavilion reaches forward, so the compound is longer than the house.
    expect(withOne.house.bounds.min[0]).toBeLessThan(without.house.bounds.min[0])
  })
})

describe('the hipped surface', () => {
  const levels = [
    { key: 'eave', halfX: 6, halfZ: 6, y: 2 },
    { key: 'mid', halfX: 3, halfZ: 3, y: 4 },
    { key: 'molo', halfX: 0, halfZ: 1, y: 7 },
  ]

  it('emits no degenerate triangle where the ridge closes', () => {
    // The two end faces of the top band collapse to triangles because the
    // ridge has no width. Emitting the collapsed half would leave a zero-area
    // face, and the mesh check is right to refuse those.
    const mesh = steppedHip(levels, { uvScale: 1 })
    expect(mesh.indices.length % 3).toBe(0)
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const p = (k: number) => {
        const j = (mesh.indices[i + k] ?? 0) * 3
        return [mesh.positions[j] ?? 0, mesh.positions[j + 1] ?? 0, mesh.positions[j + 2] ?? 0]
      }
      const [a, b, c] = [p(0), p(1), p(2)]
      const e1 = [(b[0] ?? 0) - (a[0] ?? 0), (b[1] ?? 0) - (a[1] ?? 0), (b[2] ?? 0) - (a[2] ?? 0)]
      const e2 = [(c[0] ?? 0) - (a[0] ?? 0), (c[1] ?? 0) - (a[1] ?? 0), (c[2] ?? 0) - (a[2] ?? 0)]
      const area = Math.hypot(
        (e1[1] ?? 0) * (e2[2] ?? 0) - (e1[2] ?? 0) * (e2[1] ?? 0),
        (e1[2] ?? 0) * (e2[0] ?? 0) - (e1[0] ?? 0) * (e2[2] ?? 0),
        (e1[0] ?? 0) * (e2[1] ?? 0) - (e1[1] ?? 0) * (e2[0] ?? 0),
      )
      expect(area).toBeGreaterThan(1e-9)
    }
  })

  it('points every face outward and upward', () => {
    const mesh = steppedHip(levels, { uvScale: 1 })
    // A face whose normal pointed inward would be a hole visible from one side
    // only, which is the kind of fault a render finds and a mesh check does
    // not. Every normal on a roof rises; the outward half is checked by the
    // sign of the horizontal component matching the side it sits on.
    for (let i = 0; i < mesh.normals.length; i += 3) {
      const [nx, ny, nz] = [mesh.normals[i] ?? 0, mesh.normals[i + 1] ?? 0, mesh.normals[i + 2] ?? 0]
      const [px, , pz] = [mesh.positions[i] ?? 0, 0, mesh.positions[i + 2] ?? 0]
      expect(ny).toBeGreaterThan(0)
      // Skipping the ridge line itself: there x and z are exactly zero, so
      // there is no side for the normal to be on.
      if (Math.abs(nx) > 0.3 && Math.abs(px) > 1e-6) expect(Math.sign(nx)).toBe(Math.sign(px))
      if (Math.abs(nz) > 0.3 && Math.abs(pz) > 1e-6) expect(Math.sign(nz)).toBe(Math.sign(pz))
    }
  })

  it('measures a band by run, so a course crosses a step without noticing', () => {
    const whole = hipRun(levels)
    const half = hipLevelAt(levels, 0.5)
    // Halfway by run, not halfway by tier: the tiers are unequal on purpose.
    expect(half.y).toBeGreaterThan(2)
    expect(half.y).toBeLessThan(7)
    expect(whole).toBeGreaterThan(0)
  })
})

describe('the address', () => {
  it('round-trips every combination, including the flag', () => {
    for (const rules of COMBOS) {
      expect(rulesEqual(rulesFromQuery(rulesToQuery(rules)), normaliseRules(rules))).toBe(true)
    }
    expect(rulesFromQuery('?pendhapa=0').pendhapa).toBe(false)
    expect(rulesFromQuery('?pendhapa=1').pendhapa).toBe(true)
    // Anything that is not a flag falls back rather than reading as truthy.
    expect(rulesFromQuery('?pendhapa=yes').pendhapa).toBe(DEFAULT_RULES.pendhapa)
  })

  it('states every rule, defaults included', () => {
    const q = new URLSearchParams(rulesToQuery(DEFAULT_RULES))
    expect([...q.keys()].sort()).toEqual(['pendhapa', 'tumpang', 'wujud'])
  })
})

describe('the build sequence', () => {
  it('walks the declared stages in order and places every part exactly once', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const timeline = buildTimeline(house)
    expect(placedAt(timeline, 0).size).toBe(0)
    expect(placedAt(timeline, 1).size).toBe(house.parts.length)
    const seen = timeline.stages.map((s) => s.stage)
    expect(seen).toEqual(STAGE_ORDER.filter((s) => seen.includes(s)))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    const pct = (n: number) => Math.round((n / split.total) * 100)
    // eslint-disable-next-line no-console
    console.log(
      `jawa provenance: ${split.measured} measured (${pct(split.measured)}%), ` +
        `${split.canon} canon (${pct(split.canon)}%), ` +
        `${split.interpolated} interpolated (${pct(split.interpolated)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('every part cites only declared dimensions', () => {
    for (const rules of COMBOS) {
      const { house } = buildHouse(rules)
      // eslint-disable-next-line no-console
      if (rules === DEFAULT_RULES) console.log(`jawa parts: ${partSplit(house.parts).interpolated} interpolated of ${house.parts.length}`)
      for (const part of house.parts) {
        expect(part.dims.length).toBeGreaterThan(0)
        for (const key of part.dims) expect(DIM_KEYS).toContain(key)
      }
    }
  })

  it('declares the numbers that size and place what the reader can see', () => {
    const sources = ['lib/tradition/jawa/frame.ts', 'lib/tradition/jawa/roof.ts'].map(
      (f) => [f, readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')] as const,
    )
    const offenders: string[] = []
    for (const [file, src] of sources) {
      src.split('\n').forEach((line, i) => {
        const code = line.split('//')[0] ?? ''
        if (!/DIMS\.|layout\./.test(code)) return
        if (/\*\*?\s*\d+\.\d+/.test(code)) offenders.push(`${file}:${i + 1} ${line.trim()}`)
      })
    }
    expect(offenders, `undeclared dimensions:\n${offenders.join('\n')}`).toEqual([])
  })
})

describe('the three houses are separate', () => {
  it('do not share a rule pack, a stage order or a source table', async () => {
    const toraja = await import('@/lib/tradition/toraja/rules')
    const minang = await import('@/lib/tradition/minang/rules')
    expect(PACK.key).toBe('jawa')
    for (const other of [toraja.PACK, minang.PACK]) {
      expect(PACK.stageOrder).not.toEqual(other.stageOrder)
      expect(PACK.dimKeys).not.toBe(other.dimKeys)
    }
  })
})
