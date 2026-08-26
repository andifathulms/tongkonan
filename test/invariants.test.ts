import { describe, expect, it } from 'vitest'
import { buildHouse } from '@/lib/tradition/toraja/assembly'
import { runInvariants } from '@/lib/tradition/toraja/invariants'
import type { Rules } from '@/lib/tradition/toraja/types'
import { DEFAULT_RULES } from '@/lib/tradition/toraja/rules'

const CASES: Rules[] = [
  { rank: 'pekamberan', bays: 3, horns: 6 },
  { rank: 'layuk', bays: 5, horns: 24 },
  { rank: 'batu-ariri', bays: 2, horns: 0 },
  { rank: 'layuk', bays: 4, horns: 12 },
]

describe('invariants', () => {
  for (const rules of CASES) {
    it(`${rules.rank}/${rules.bays}/${rules.horns}`, () => {
      const { house, layout } = buildHouse(rules)
      const results = runInvariants(house, layout)
      for (const r of results) {
        if (r.status === 'fail') console.log('FAIL', r.key, r.detail)
      }
      expect(results.filter((r) => r.status === 'fail')).toEqual([])
    })
  }
})

describe('every check speaks both locales', () => {
  it('states its verdict in Indonesian and in English', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    for (const r of runInvariants(house, layout)) {
      expect(r.detail.length, `${r.key} has no Indonesian detail`).toBeGreaterThan(0)
      expect(r.detailEn.length, `${r.key} has no English detail`).toBeGreaterThan(0)
      // The two are translations, not a copy: a detail left untranslated is
      // the defect this test exists to catch.
      expect(r.detailEn, `${r.key} detail is not translated`).not.toBe(r.detail)
    }
  })
})
