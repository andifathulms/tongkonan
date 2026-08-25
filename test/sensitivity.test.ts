import { describe, expect, it } from 'vitest'
import { PERTURBATION, sensitivities, sensitivityOf } from '@/lib/banua/sensitivity'
import { ALL_DIMS, DIMS, DIM_KEYS, DEFAULT_RULES } from '@/lib/banua/rules'

describe('what a survey would change', () => {
  it('leaves the rule pack exactly as it found it', () => {
    const before = DIM_KEYS.map((k) => DIMS[k].value)
    sensitivities()
    const after = DIM_KEYS.map((k) => DIMS[k].value)
    expect(after).toEqual(before)
  })

  it('is deterministic, like everything else the generator does', () => {
    expect(JSON.stringify(sensitivities())).toBe(JSON.stringify(sensitivities()))
  })

  it('covers every dimension in the pack', () => {
    const table = sensitivities()
    expect(table.length).toBe(DIM_KEYS.length)
    for (const key of DIM_KEYS) expect(sensitivityOf(table, key)).toBeDefined()
  })

  it('ranks the load-bearing guesses above the cosmetic ones', () => {
    const table = sensitivities()
    const of = (k: (typeof DIM_KEYS)[number]) => sensitivityOf(table, k)?.worst ?? 0
    // A board's thickness cannot move the house as far as its length can.
    expect(of('bayLength')).toBeGreaterThan(of('deckThickness'))
    expect(of('ridgeRise')).toBeGreaterThan(of('wallThickness'))
  })

  it('is sorted, so the first row is the number most worth measuring', () => {
    const table = sensitivities()
    for (let i = 1; i < table.length; i++) {
      expect(table[i - 1]!.worst).toBeGreaterThanOrEqual(table[i]!.worst)
    }
  })

  it('reports the ranking, so the project can see what to survey first', () => {
    const table = sensitivities()
    const lines = table
      .filter((s) => s.worst > 0)
      .slice(0, 8)
      .map((s) => `${s.dim} ±${Math.round(PERTURBATION * 100)}% → ${s.worst.toFixed(2)} m (${s.worstProbe})`)
    console.log(`most load-bearing dimensions:\n  ${lines.join('\n  ')}`)
    expect(lines.length).toBeGreaterThan(0)
  })

  it('a dimension that moves nothing says so rather than being hidden', () => {
    const table = sensitivities()
    const inert = table.filter((s) => s.worst === 0)
    // The canon entries are structural statements, not lengths; pushing them
    // by a fifth changes no measurement, and that is worth being able to see.
    expect(inert.length).toBeGreaterThan(0)
    for (const s of inert) expect(s.moved).toHaveLength(0)
  })

  it('every dimension it reports on is one /sumber cites', () => {
    const cited = new Set(ALL_DIMS)
    for (const s of sensitivities()) expect(cited.has(DIMS[s.dim])).toBe(true)
  })
})
