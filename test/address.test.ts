import { describe, expect, it } from 'vitest'
import { rulesEqual, rulesFromQuery, rulesToQuery } from '@/lib/tradition/toraja/address'
import { DEFAULT_RULES } from '@/lib/tradition/toraja/rules'
import { buildHouse } from '@/lib/tradition/toraja/assembly'
import type { Rules } from '@/lib/tradition/toraja/types'

describe('the rules as an address', () => {
  it('round-trips every house the rules admit', () => {
    for (const rank of ['layuk', 'pekamberan', 'batu-ariri'] as const) {
      for (let bays = 2; bays <= 5; bays++) {
        for (const horns of [0, 1, 7, 24, 32]) {
          const rules: Rules = { rank, bays, horns }
          expect(rulesFromQuery(rulesToQuery(rules))).toEqual(rules)
        }
      }
    }
  })

  it('the address is the house: the same query builds identical geometry', () => {
    const query = rulesToQuery({ rank: 'layuk', bays: 5, horns: 22 })
    const a = buildHouse(rulesFromQuery(query)).house
    const b = buildHouse(rulesFromQuery(`?${query}`)).house
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('states all three rules even when they are the defaults', () => {
    const query = rulesToQuery(DEFAULT_RULES)
    expect(query).toContain('pangkat=')
    expect(query).toContain('ruang=')
    expect(query).toContain('tanduk=')
  })

  it('falls back per field rather than failing, so a broken address still opens a house', () => {
    expect(rulesFromQuery('')).toEqual(DEFAULT_RULES)
    expect(rulesFromQuery('?pangkat=gedung&ruang=4').rank).toBe(DEFAULT_RULES.rank)
    expect(rulesFromQuery('?pangkat=gedung&ruang=4').bays).toBe(4)
    expect(rulesFromQuery('?ruang=abc').bays).toBe(DEFAULT_RULES.bays)
    expect(rulesFromQuery('?tanduk=').horns).toBe(DEFAULT_RULES.horns)
  })

  it('clamps out-of-range values with the same clamp the controls obey', () => {
    expect(rulesFromQuery('?ruang=99&tanduk=-5')).toEqual({
      rank: DEFAULT_RULES.rank,
      bays: 5,
      horns: 0,
    })
    expect(rulesFromQuery('?ruang=1').bays).toBe(2)
    expect(rulesFromQuery('?tanduk=1000').horns).toBe(32)
  })

  it('carries the rules and nothing else', () => {
    const query = rulesToQuery({ rank: 'layuk', bays: 4, horns: 3 })
    expect([...new URLSearchParams(query).keys()].sort()).toEqual(['pangkat', 'ruang', 'tanduk'])
  })

  it('compares houses by what they are, not by identity', () => {
    expect(rulesEqual({ rank: 'layuk', bays: 3, horns: 1 }, { rank: 'layuk', bays: 3, horns: 1 })).toBe(true)
    expect(rulesEqual({ rank: 'layuk', bays: 3, horns: 1 }, { rank: 'layuk', bays: 3, horns: 2 })).toBe(false)
  })
})
