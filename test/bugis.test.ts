import { describe, expect, it } from 'vitest'
import { buildHouse, buildTimeline, placedAt } from '@/lib/tradition/bugis/assembly'
import { checkRankCarriesNothing, checkRankIsEntitled, runInvariants, summarise } from '@/lib/tradition/bugis/invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIM_KEYS,
  MAX_LONTANG,
  MIN_LONTANG,
  RUMAH,
  normaliseRules,
  partSplit,
  provenanceSplit,
  rumahInfo,
} from '@/lib/tradition/bugis/rules'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/bugis/address'
import { resolveLayout } from '@/lib/tradition/bugis/frame'
import { rankCounterexample } from '@/lib/tradition/bugis/counterexample'
import { sceneModel } from '@/lib/tradition/bugis/scene'
import { STAGE_ORDER } from '@/lib/tradition/bugis/types'
import type { Rules } from '@/lib/tradition/bugis/types'

/** Both classes, the range of claims, and both ends of the size. */
const COMBOS: readonly Rules[] = [
  DEFAULT_RULES,
  { rumah: 'bola', timpa: 3, lontang: MIN_LONTANG },
  { rumah: 'bola', timpa: 3, lontang: MAX_LONTANG },
  { rumah: 'saoraja', timpa: 7, lontang: 4 },
  { rumah: 'saoraja', timpa: 9, lontang: MAX_LONTANG },
]

describe('the invariants gate the build', () => {
  for (const rules of COMBOS) {
    it(`holds for ${rules.rumah}, ${rules.timpa} boards, ${rules.lontang} bays`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      expect(results.filter((r) => r.status === 'fail').map((r) => `${r.key}: ${r.detailEn}`)).toEqual([])
      expect(summarise(results).skipped).toBe(1)
    })
  }
})

describe('the rank holds nothing up', () => {
  /**
   * The claim this house exists to make, asserted the hard way: rebuild
   * without every board and check the building is unchanged. Inspecting the
   * boards' joints would be weaker, because a part can be declared jointless
   * and still be the only thing under a rafter.
   */
  it('leaves the house standing when every board is removed', () => {
    for (const rules of COMBOS) {
      const { house, layout } = buildHouse(rules)
      const boards = house.parts.filter((p) => p.stage === 'timpa')
      expect(boards.length).toBe(rules.timpa * 2)

      const stripped = { ...house, parts: house.parts.filter((p) => p.stage !== 'timpa') }
      const before = runInvariants(house, layout).filter((r) => r.status === 'fail')
      expect(before).toEqual([])
      // Everything structural still holds without them.
      for (const key of ['build-order', 'joints', 'meshes', 'three-worlds', 'threaded']) {
        const after = runInvariants(stripped, layout).find((r) => r.key === key)
        expect(after?.status).toBe('pass')
      }
    }
  })

  it('joints nothing to a board, at either end', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    for (const joint of house.joints) {
      expect(joint.mortise.startsWith('timpa-')).toBe(false)
      expect(joint.tenon.startsWith('timpa-')).toBe(false)
    }
  })

  it('fails the check if a board is made to carry something', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(checkRankCarriesNothing(house, layout).status).toBe('pass')
    // A joint onto a board is exactly the thing the check refuses.
    const rigged = {
      ...house,
      joints: [
        ...house.joints,
        {
          id: 'rigged',
          kind: 'takik' as const,
          mortise: 'timpa-0-a',
          tenon: 'bubungan',
          at: [0, 0, 0] as [number, number, number],
          halfExtents: [0.1, 0.1, 0.1] as [number, number, number],
        },
      ],
    }
    expect(checkRankCarriesNothing(rigged, layout).status).toBe('fail')
  })

  /**
   * The building is identical at every rank. That is the separation between
   * claim and structure stated as arithmetic rather than as prose.
   */
  it('builds the same house whatever the household claims', () => {
    const five = resolveLayout({ rumah: 'saoraja', timpa: 5, lontang: 5 })
    const nine = resolveLayout({ rumah: 'saoraja', timpa: 9, lontang: 5 })
    expect(nine.halfX).toBeCloseTo(five.halfX, 9)
    expect(nine.halfZ).toBeCloseTo(five.halfZ, 9)
    expect(nine.floorY).toBeCloseTo(five.floorY, 9)
    expect(nine.eaveY).toBeCloseTo(five.eaveY, 9)
    expect(nine.ridgeY).toBeCloseTo(five.ridgeY, 9)
    expect(nine.timpa.length).toBeGreaterThan(five.timpa.length)
  })
})

describe('the claim is bounded by entitlement, not by geometry', () => {
  /**
   * The only clamp in the project that refuses a number the building could
   * carry. A bola holds nine boards without noticing; what stops it is that
   * nine is not its to claim.
   */
  it('refuses a bola five boards though it would carry them', () => {
    expect(normaliseRules({ rumah: 'bola', timpa: 9, lontang: 5 }).timpa).toBe(3)
    expect(normaliseRules({ rumah: 'saoraja', timpa: 9, lontang: 5 }).timpa).toBe(9)
    const { layout } = buildHouse({ rumah: 'bola', timpa: 9, lontang: 5 })
    expect(checkRankIsEntitled(layout).status).toBe('pass')
    expect(layout.rules.timpa).toBe(3)
  })

  it('keeps the count odd', () => {
    for (const n of [4, 6, 8]) {
      expect(normaliseRules({ rumah: 'saoraja', timpa: n, lontang: 5 }).timpa % 2).toBe(1)
    }
  })

  it('gives each class its own range', () => {
    expect(RUMAH).toHaveLength(2)
    expect(rumahInfo('bola').maxTimpa).toBeLessThan(rumahInfo('saoraja').minTimpa)
  })
})

describe('what a detachable rank breaks', () => {
  it('stacks the boards up the gable without overflowing it', () => {
    for (const rules of COMBOS) {
      const layout = resolveLayout(rules)
      let previous = Infinity
      for (const board of layout.timpa) {
        expect(board.y).toBeLessThan(layout.ridgeY)
        expect(board.halfSpan).toBeGreaterThan(0)
        expect(board.halfSpan).toBeLessThanOrEqual(previous + 1e-9)
        previous = board.halfSpan
      }
    }
  })

  it('puts the boards outside the roof rather than into it', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    for (const board of house.parts.filter((p) => p.stage === 'timpa')) {
      if (board.kind !== 'box') continue
      expect(Math.abs(board.center[2])).toBeGreaterThan(layout.eaveHalfZ)
    }
  })

  /** Three worlds, and the highest is the rice. */
  it('stacks three named worlds with the store on top', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const scene = sceneModel(house, layout)
    expect(scene.zones.map((z) => z.key)).toEqual(['awa-bola', 'ale-bola', 'rakkeang'])
    expect(house.parts.some((p) => p.stage === 'rakkeang')).toBe(true)
    expect(layout.awaBola).toBeGreaterThan(0)
  })

  it('threads every beam through its post', () => {
    const { house } = buildHouse(DEFAULT_RULES)
    const threaded = house.joints.filter((j) => j.kind === 'pattolo')
    expect(threaded.length).toBeGreaterThan(0)
    for (const joint of threaded) expect(joint.mortise.startsWith('alliri-')).toBe(true)
  })

  /** The rank goes on last, after a finished building. */
  it('raises the claim after the house is complete', () => {
    expect(STAGE_ORDER[STAGE_ORDER.length - 1]).toBe('timpa')
    const { house } = buildHouse(DEFAULT_RULES)
    const firstBoard = house.parts.findIndex((p) => p.stage === 'timpa')
    const lastOther = house.parts.map((p) => p.stage).lastIndexOf('atap')
    expect(firstBoard).toBeGreaterThan(lastOther)
  })
})

describe('the counterexample', () => {
  it('raises the claim until it runs off the gable carrying it', () => {
    const c = rankCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeGreaterThan(c.actual)
    // The ridge did not move: the building is untouched and only the statement
    // has broken, which is what makes this failure unlike the other nine.
    expect(c.witness.broken.ridge).toBeCloseTo(c.witness.sound.ridge, 9)
    expect(c.witness.broken.topBoard).toBeGreaterThan(c.witness.sound.topBoard)
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
    expect(q).toContain('rumah=')
    expect(q).toContain('timpa=')
    expect(q).toContain('lontang=')
  })

  it('falls back rather than reading an empty value as zero', () => {
    expect(rulesFromQuery('rumah=&timpa=&lontang=')).toEqual(normaliseRules(DEFAULT_RULES))
  })

  /** An address cannot promote a household past its entitlement. */
  it('clamps a claim the household could not make', () => {
    expect(rulesFromQuery('rumah=bola&timpa=9&lontang=5').timpa).toBe(3)
  })
})

describe('provenance', () => {
  it('reports the interpolated share', () => {
    const split = provenanceSplit(ALL_DIMS)
    // eslint-disable-next-line no-console
    console.log(
      `bugis provenance: ${split.measured} measured (${Math.round((split.measured / split.total) * 100)}%), ` +
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
    console.log(`bugis parts: ${split.interpolated} interpolated of ${split.total}`)
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
})
