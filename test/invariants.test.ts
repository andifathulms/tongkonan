import { describe, expect, it } from 'vitest'
import { buildHouse } from '@/lib/banua/assembly'
import { runInvariants } from '@/lib/banua/invariants'
import type { Rules } from '@/lib/banua/types'

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
