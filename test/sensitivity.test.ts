import { describe, expect, it } from 'vitest'
import { PERTURBATION, sensitivities, sensitivityOf } from '@/lib/banua/sensitivity'
import { ALL_DIMS, DIMS, DIM_KEYS, DEFAULT_RULES } from '@/lib/banua/rules'
import { ridgeCounterexample } from '@/lib/banua/counterexample'
import { checkEaveOversail } from '@/lib/banua/invariants'
import { buildHouse } from '@/lib/banua/assembly'
import { withDimValue } from '@/lib/banua/whatif'
import { compareDimension } from '@/lib/draw/compare'

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

describe('a check, shown doing its job', () => {
  it('finds a house the ridge check actually refuses', () => {
    const c = ridgeCounterexample()
    expect(c.sound.status).toBe('pass')
    expect(c.broken.status).toBe('fail')
    expect(c.value).toBeGreaterThan(c.actual)
  })

  it('the broken house cannot say which end is its face', () => {
    const c = ridgeCounterexample()
    expect(c.prows.sound.front).toBeGreaterThan(c.prows.sound.rear)
    expect(c.prows.broken.front).toBeLessThanOrEqual(c.prows.broken.rear)
  })

  it('leaves the rule pack intact, the same as the sensitivity table does', () => {
    const before = DIM_KEYS.map((k) => DIMS[k].value)
    ridgeCounterexample()
    expect(DIM_KEYS.map((k) => DIMS[k].value)).toEqual(before)
  })

  /*
   * Recorded rather than fixed, because it is a statement about the evidence
   * and not about the code. checkEaveOversail compares eaveHalfWidth against
   * the post line, and eaveHalfWidth is *defined* as half the body plus the
   * oversail — so the check restates its own inputs and no single dimension
   * can break it. It is the one invariant in the suite that is true by
   * construction. If it is ever strengthened to constrain something the
   * arithmetic does not already guarantee, this test is what should fail.
   */
  it('records that the eave oversail check cannot be broken by any one dimension', () => {
    const unbreakable = DIM_KEYS.every((key) => {
      const base = DIMS[key].value
      if (base === 0) return true
      return [0.05, 0.3, 0.6, 1.6, 3].every((f) => {
        try {
          return withDimValue(key, base * f, () =>
            checkEaveOversail(buildHouse(DEFAULT_RULES).layout),
          ).status !== 'fail'
        } catch {
          // A dimension that makes the generator throw is not a counterexample
          // to the check; it never gets as far as being one.
          return true
        }
      })
    })
    expect(unbreakable).toBe(true)
  })
})

describe('showing what a wrong number looks like', () => {
  it('draws both roofs on the same axes and fits them in the frame', () => {
    const { svg } = compareDimension('bayLength', 1.2, DEFAULT_RULES)
    const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!
    const w = Number(vb[1])
    const h = Number(vb[2])
    const xs = [...svg.matchAll(/[ML](-?[\d.]+) -?[\d.]+/g)].map((m) => Number(m[1]))
    const ys = [...svg.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]))
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...xs)).toBeLessThanOrEqual(w)
    expect(Math.max(...ys)).toBeLessThanOrEqual(h)
  })

  it('the two roofs actually differ, or the figure is teaching nothing', () => {
    const { svg, from, to } = compareDimension('bayLength', 1.2, DEFAULT_RULES)
    expect(to).toBeCloseTo(from * 1.2, 6)
    const solid = svg.split('stroke-dasharray').length
    expect(solid).toBeGreaterThan(1)
    // A dimension that moves nothing should draw two identical roofs; one that
    // moves the house should not.
    const flat = compareDimension('deckThickness', 1.2, DEFAULT_RULES)
    expect(flat.svg).not.toBe(svg)
  })

  it('leaves the rule pack intact', () => {
    const before = DIM_KEYS.map((k) => DIMS[k].value)
    compareDimension('bayLength', 1.2, DEFAULT_RULES)
    expect(DIM_KEYS.map((k) => DIMS[k].value)).toEqual(before)
  })
})
