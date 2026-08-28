import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/sasak/assembly'
import {
  checkHoodCurves,
  checkNoOtherWayUp,
  checkRatGuard,
  runInvariants,
  summarise,
} from '@/lib/tradition/sasak/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  MILIK,
  normaliseRules,
  partSplit,
  provenanceSplit,
} from '@/lib/tradition/sasak/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/sasak/address'
import { roofLevels } from '@/lib/tradition/sasak/roof'
import { sceneModel } from '@/lib/tradition/sasak/scene'
import { guardCounterexample } from '@/lib/tradition/sasak/counterexample'
import { STAGE_ORDER } from '@/lib/tradition/sasak/types'
import type { Rules } from '@/lib/tradition/sasak/types'

/** Both owners, both post counts, and the shade floored or bare. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { milik: 'keluarga', tiang: 6, kolong: false },
  { milik: 'desa', tiang: 4, kolong: false },
  { milik: 'desa', tiang: 6, kolong: true },
  { milik: 'keluarga', tiang: 4, kolong: false },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.milik}, ${rules.tiang} posts${rules.kolong ? ', floored' : ''}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the defence is a difference and an absence', () => {
  /**
   * The overhang is what stops a rat, and it is the difference between two
   * independently declared numbers — asserted against the arithmetic so the
   * test and the check are separate readings.
   */
  it('overhangs every post by the disc less the post', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      expect(house.parts.filter((p) => p.stage === 'penghalang')).toHaveLength(rules.tiang)
      for (const post of layout.posts) {
        expect(post.guardRadius - layout.postSection / 2).toBeGreaterThan(0.1)
      }
      expect(checkRatGuard(house, layout).status).toBe('pass')
    }
  })

  /**
   * The half of the defence that is about everything other than the disc. A
   * model acquires a brace or a step by accident, and either would make the
   * guards ornaments.
   */
  /**
   * A route has to start near the ground. The hood's own skirt hangs below the
   * discs and is no path at all — it is a metre and a half in the air — so what
   * is asserted is that nothing reaches from about ground level to above them.
   */
  it('lets nothing reach from the ground past the guard height', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(checkNoOtherWayUp(house, layout).status).toBe('pass')
    const guardY = layout.posts[0]?.guardY ?? 0
    for (const part of house.parts) {
      if (part.stage === 'tiang' || part.stage === 'batu' || part.stage === 'penghalang') continue
      if (part.kind !== 'box') continue
      const low = part.center[1] - part.size[1] / 2
      const high = part.center[1] + part.size[1] / 2
      expect(low < 0.5 && high > guardY).toBe(false)
    }
  })

  it('fails the moment something bridges the guard', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const guardY = layout.posts[0]?.guardY ?? 1
    const ladder = house.parts.find((p) => p.id === 'lantai')
    expect(ladder).toBeDefined()
    if (!ladder || ladder.kind !== 'box') return
    // A prop reaching from the ground to above the discs: the classic way a
    // real granary loses its defence.
    const rigged = {
      ...house,
      parts: [
        ...house.parts,
        { ...ladder, id: 'penyangga', center: [0, guardY, 0] as [number, number, number], size: [0.1, guardY * 2, 0.1] as [number, number, number] },
      ],
    }
    expect(checkNoOtherWayUp(rigged, layout).status).toBe('fail')
  })

  it('stops the sitting platform short of every post', () => {
    const { house, layout } = buildHouse({ ...DEFAULT_RULES, kolong: true })
    const seat = house.parts.find((p) => p.stage === 'kolong')
    expect(seat).toBeDefined()
    if (!seat || seat.kind !== 'box') return
    for (const post of layout.posts) {
      const clear = Math.abs(post.x) - seat.size[0] / 2
      expect(clear).toBeGreaterThan(0)
    }
  })
})

describe('a building that is not for people', () => {
  it('has no storey anybody could stand up in', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      expect(layout.storeHeight).toBeLessThan(1.7)
    }
  })

  it('drops its eave below the floor it shelters', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      expect(layout.eaveY).toBeLessThan(layout.floorY)
    }
  })

  /**
   * The part people use is the part not built for them, and `zones` says so.
   */
  it('names the space beneath as the people’s and the box as the rice’s', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones.map((z) => z.key)).toEqual(['kolong', 'simpan', 'tudung'])
  })

  it('refuses a post count this tradition does not build', () => {
    expect(normaliseRules({ ...DEFAULT_RULES, tiang: 5 as 4 }).tiang).toBe(4)
    expect(rulesFromQuery('milik=keluarga&tiang=5&kolong=1').tiang).toBe(4)
    expect(rulesFromQuery('milik=keluarga&tiang=6&kolong=1').tiang).toBe(6)
  })
})

describe('a curve is many steps', () => {
  /**
   * What separates the hood from a faceted cone: the pitch keeps changing. A
   * check that only counted levels would not know the difference, so this
   * asserts the steepening directly.
   */
  /**
   * Convex: steepest at the skirt, easing into a rounded shoulder near the
   * ridge. The direction is the shape — written the other way round it gives a
   * form that flares outward as it rises, which is not a lumbung.
   */
  it('eases every band above the one below it', () => {
    for (const rules of COMBOS) {
      const { layout } = buildHouse(rules)
      const levels = roofLevels(layout)
      expect(levels.length).toBeGreaterThan(6)
      let previous = Infinity
      for (let i = 1; i < levels.length; i++) {
        const a = levels[i - 1]
        const b = levels[i]
        if (!a || !b) continue
        const pitch = Math.atan2(b.y - a.y, a.halfX - b.halfX)
        expect(pitch).toBeLessThan(previous)
        previous = pitch
      }
      expect(checkHoodCurves(layout).status).toBe('pass')
    }
  })

  it('bellies outward rather than running straight', () => {
    const { layout } = buildHouse(DEFAULT_RULES)
    const levels = roofLevels(layout)
    const first = levels[0]
    const last = levels[levels.length - 1]
    const middle = levels[Math.floor(levels.length / 2)]
    expect(first).toBeDefined()
    expect(last).toBeDefined()
    expect(middle).toBeDefined()
    if (!first || !last || !middle) return
    // A straight line between the ends would put the middle here; the bulge is
    // what makes it a hood.
    const t = (middle.y - first.y) / (last.y - first.y)
    const straight = first.halfX + (last.halfX - first.halfX) * t
    expect(middle.halfX).toBeGreaterThan(straight)
  })
})

describe('the counterexample', () => {
  it('thickens the post until it eats its own guard', () => {
    const c = guardCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeGreaterThan(c.actual)
    expect(c.witness.broken.overhang).toBeLessThan(c.witness.sound.overhang)
    // The disc never changed: only the post did.
    expect(c.witness.broken.post).toBeGreaterThan(c.witness.sound.post)
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
    expect(q).toContain('milik=')
    expect(q).toContain('tiang=')
    expect(q).toContain('kolong=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('milik=&tiang=&kolong=')).toEqual(normaliseRules(DEFAULT_RULES))
  })

  it('reads the post count back as a number', () => {
    const parsed = rulesFromQuery('milik=desa&tiang=6&kolong=0')
    expect(parsed.tiang).toBe(6)
    expect(typeof parsed.tiang).toBe('number')
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `sasak provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
        `${split.canon} canon (${Math.round((split.canon / split.total) * 100)}%), ` +
        `${split.interpolated} interpolated (${Math.round((split.interpolated / split.total) * 100)}%)`,
    )
    expect(split.measured).toBe(0)
    expect(split.total).toBe(DIM_KEYS.length)
  })

  /**
   * Both halves of the defence are the author's. That has to stay visible: a
   * later edit that "firmed up" either figure would be inventing evidence for
   * the one number in this pack that decides whether the thing works.
   */
  it('leaves both figures behind the defence openly unsupported', () => {
    for (const key of ['guardRadius', 'postSection'] as const) {
      expect(DIMS[key].class).toBe('interpolated')
      expect(DIMS[key].source).toBe('none')
    }
  })

  it('every part cites only declared dimensions', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const part of house.parts) {
      expect(part.dims.length).toBeGreaterThan(0)
      for (const key of part.dims) expect(DIM_KEYS).toContain(key)
    }
    const split = partSplit(house.parts)
    // eslint-disable-next-line no-console
    console.log(`sasak parts: ${split.interpolated} interpolated of ${split.total}`)
    expect(split.total).toBe(house.parts.length)
  })
})

describe('the build sequence', () => {
  /**
   * The guards go on before the floor, because afterwards they cannot. A
   * defence that dictates the order of work is worth asserting rather than
   * commenting.
   */
  it('threads the guards on before the floor', () => {
    expect(STAGE_ORDER.indexOf('penghalang')).toBeLessThan(STAGE_ORDER.indexOf('lantai'))
    const { house } = buildHouse(DEFAULT_RULES)
    const guard = house.parts.findIndex((p) => p.stage === 'penghalang')
    const floor = house.parts.findIndex((p) => p.stage === 'lantai')
    expect(guard).toBeGreaterThanOrEqual(0)
    expect(floor).toBeGreaterThan(guard)
  })

  it('walks every stage in order and places every part', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const timeline = buildTimeline(house)
    expect(timeline.stages.map((s) => s.stage)).toEqual(
      STAGE_ORDER.filter((s) => house.parts.some((p) => p.stage === s)),
    )
    expect(placedAt(timeline, 1).size).toBe(house.parts.length)
    expect(placedAt(timeline, 0).size).toBe(0)
  })

  it('offers both owners', () => {
    expect(MILIK).toHaveLength(2)
  })
})
