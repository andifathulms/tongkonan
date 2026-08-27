import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/manggarai/assembly'
import { runInvariants, summarise } from '@/lib/tradition/manggarai/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  LEVELS,
  PACK,
  facetsFor,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/manggarai/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/manggarai/address'
import { coneAt, coneRun, coneSurface } from '@/lib/tradition/manggarai/cone'
import { sceneModel } from '@/lib/tradition/manggarai/scene'
import { STAGE_ORDER } from '@/lib/tradition/manggarai/types'
import type { Rules } from '@/lib/tradition/manggarai/types'

/** Both roles, both ends of the household range, and the counts that do not divide neatly. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { peran: 'tinggal', keluarga: 4 },
  { peran: 'tinggal', keluarga: 5 },
  { peran: 'gendang', keluarga: 7 },
  { peran: 'tinggal', keluarga: 8 },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.peran}, ${rules.keluarga} households`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

/**
 * The four assumptions three rectangular houses were quietly sharing, and what
 * this one does to each of them.
 */
describe('what a round house breaks', () => {
  it('has no ridge axis at all', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    // Null rather than a default: the field was `0 | 2` while every house
    // happened to have a ridge, which looked like a fact about houses.
    expect(sceneModel(house, layout).ridgeAxis).toBeNull()
  })

  it('is as wide one way as the other, to within one facet of a polygon', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      const spanX = (house.bounds.max[0] ?? 0) - (house.bounds.min[0] ?? 0)
      const spanZ = (house.bounds.max[2] ?? 0) - (house.bounds.min[2] ?? 0)
      // The building is a circle; the mesh is a polygon inscribed in it, and
      // the shortfall is the sagitta of one facet rather than slack.
      const sagitta = spanX * (1 - Math.cos(Math.PI / layout.facets))
      expect(Math.abs(spanX - spanZ)).toBeLessThanOrEqual(sagitta + 1e-9)
    }
  })

  it('repeats by turning rather than by mirroring', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      const n = rules.keluarga
      // Everything countable divides by the household count, which is what
      // makes the repeat exact rather than approximate.
      expect(layout.segmentAngles.length % n).toBe(0)
      expect(layout.rafterCount % n).toBe(0)
      expect(layout.facets % n).toBe(0)
    }
  })

  it('rounds the mesh to the building’s own symmetry, not to a convenient number', () => {
    // Forty-eight facets happens to repeat every sixty degrees, so with six
    // households the two agree by luck. With five or seven they do not, and a
    // mesh that ignored it would claim a symmetry the model does not have.
    expect(facetsFor(6, 48)).toBe(48)
    expect(facetsFor(5, 48) % 5).toBe(0)
    expect(facetsFor(7, 48) % 7).toBe(0)
    expect(facetsFor(8, 48) % 8).toBe(0)
  })

  it('is roof all the way to the ground', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const check = runInvariants(house, layout).find((c) => c.key === 'thatch-to-ground')
    expect(check?.status).toBe('pass')
  })

  it('keeps every part inside the cone at its own height, not merely inside its widest ring', () => {
    /*
     * The household partitions were boxes run out to the radius of the floor
     * they stand on: right at the floor, half a metre outside the roof by
     * their own tops. The check that was supposed to catch it compared each
     * part against the *widest* point of the thatch — which is at the ground —
     * so anything could stand outside the roof above that and pass.
     */
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(runInvariants(house, layout).find((c) => c.key === 'inside-cone')?.status).toBe('pass')
    }
  })

  it('has one door, which is the only direction a round building has', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(house.parts.filter((p) => p.id.startsWith('pintu-')).length).toBe(3)
    expect(runInvariants(house, layout).find((c) => c.key === 'one-door')?.status).toBe('pass')
  })
})

describe('the five levels', () => {
  it('are named, canon, and not a rule', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    expect(layout.levels.map((l) => l.name)).toEqual(LEVELS.map((l) => l.name))
    // Two rules, where the other three packs have three. The count of levels
    // is not among them.
    expect(PACK.dimKeys.length).toBeGreaterThan(0)
    expect(new URLSearchParams(rulesToQuery(DEFAULT_RULES)).size).toBe(2)
  })

  it('narrow as they rise, because the cone narrows', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      for (let i = 1; i < layout.levels.length; i++) {
        const below = layout.levels[i - 1]
        const cur = layout.levels[i]
        expect(cur && below && cur.y).toBeGreaterThan(below?.y ?? 0)
        expect(cur && below && cur.radius).toBeLessThan(below?.radius ?? 0)
      }
    }
  })

  it('sit on the cone rather than near it', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    for (const level of layout.levels) {
      // The joglo's lesson: derive from the thing that determines it, or two
      // places end up computing one shape.
      const onCone = coneAt(layout.profile, 0)
      expect(onCone.r).toBeGreaterThan(level.radius)
    }
  })
})

describe('the cone surface', () => {
  const profile = [
    { r: 5, y: 0 },
    { r: 3, y: 6 },
    { r: 0, y: 12 },
  ]

  it('emits no degenerate triangle where the apex closes', () => {
    const mesh = coneSurface(profile, { facets: 12, uvScale: 1 })
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
    const mesh = coneSurface(profile, { facets: 12, uvScale: 1 })
    for (let i = 0; i < mesh.normals.length; i += 3) {
      const [nx, ny, nz] = [mesh.normals[i] ?? 0, mesh.normals[i + 1] ?? 0, mesh.normals[i + 2] ?? 0]
      const [px, , pz] = [mesh.positions[i] ?? 0, 0, mesh.positions[i + 2] ?? 0]
      expect(ny).toBeGreaterThan(0)
      // Outward means away from the axis, and on the axis there is no away.
      if (Math.hypot(px, pz) > 1e-6) expect(nx * px + nz * pz).toBeGreaterThan(0)
    }
  })

  it('measures a band by run, so a course sits straight on a bent outline', () => {
    expect(coneRun(profile)).toBeGreaterThan(12)
    const half = coneAt(profile, 0.5)
    expect(half.y).toBeGreaterThan(0)
    expect(half.y).toBeLessThan(12)
    expect(half.r).toBeLessThan(5)
  })
})

describe('the drum', () => {
  it('is the whole difference, and it is invisible from outside', () => {
    const gendang = buildHouse({ peran: 'gendang', keluarga: 6 })
    const tinggal = buildHouse({ peran: 'tinggal', keluarga: 6 })
    expect(gendang.house.parts.some((p) => p.id === 'gendang')).toBe(true)
    expect(tinggal.house.parts.some((p) => p.id === 'gendang')).toBe(false)
    // The drum house is a little larger, but nothing about the *shape* says
    // which is which — the sign is a thing inside.
    expect(gendang.layout.baseRadius).toBeGreaterThan(tinggal.layout.baseRadius)
  })
})

describe('the address', () => {
  it('round-trips, with two rules and not three', () => {
    for (const rules of COMBOS) {
      expect(rulesEqual(rulesFromQuery(rulesToQuery(rules)), normaliseRules(rules))).toBe(true)
    }
    const q = new URLSearchParams(rulesToQuery(DEFAULT_RULES))
    expect([...q.keys()].sort()).toEqual(['keluarga', 'peran'])
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

  it('puts the floors up after the rafters, because there is nothing else to reach', () => {
    // Every other house here decks out early. This one cannot: until the cone
    // is standing there is nothing at a floor's rim to bear on.
    expect(STAGE_ORDER.indexOf('lantai')).toBeGreaterThan(STAGE_ORDER.indexOf('kerangka-atap'))
    expect(STAGE_ORDER.indexOf('lantai')).toBeGreaterThan(STAGE_ORDER.indexOf('pengikat'))
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    const pct = (n: number) => Math.round((n / split.total) * 100)
    // eslint-disable-next-line no-console
    console.log(
      `manggarai provenance: ${split.measured} measured (${pct(split.measured)}%), ` +
        `${split.canon} canon (${pct(split.canon)}%), ` +
        `${split.interpolated} interpolated (${pct(split.interpolated)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    // eslint-disable-next-line no-console
    console.log(`manggarai parts: ${partSplit(house.parts).interpolated} interpolated of ${house.parts.length}`)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
  })

  it('declares the numbers that size and place what the reader can see', () => {
    const sources = [
      'lib/tradition/manggarai/frame.ts',
      'lib/tradition/manggarai/roof.ts',
      'lib/tradition/manggarai/cone.ts',
    ].map((f) => [f, readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')] as const)
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
