import { describe, expect, it } from 'vitest'
import { derivation } from '@/lib/tradition/toraja/derivation'
import { buildHouse } from '@/lib/tradition/toraja/assembly'
import { DEFAULT_RULES } from '@/lib/tradition/toraja/rules'
import type { Rules } from '@/lib/tradition/toraja/types'

const CASES: Rules[] = [
  DEFAULT_RULES,
  { rank: 'layuk', bays: 5, horns: 22 },
  { rank: 'batu-ariri', bays: 2, horns: 0 },
]

describe('the worked example', () => {
  /*
   * The whole point of showing the working is that it is the same working.
   * A derivation that drifted from the generator would be worse than none —
   * it would teach a chain that does not produce the house on screen.
   */
  it('lands on the numbers the generator actually produced', () => {
    for (const rules of CASES) {
      const { layout } = buildHouse(rules)
      const steps = derivation(rules)
      const at = (key: string) => steps.find((s) => s.key === key)!.result
      expect(at('bodyLength')).toBeCloseTo(layout.bodyLength, 6)
      expect(at('plateY')).toBeCloseTo(layout.plateY, 6)
      expect(at('ridgeY')).toBeCloseTo(layout.ridgeY, 6)
      expect(at('frontProwY')).toBeCloseTo(layout.frontProwY, 6)
      expect(at('eaveHalfWidth')).toBeCloseTo(layout.eaveHalfWidth, 6)
      expect(at('ijukCourses')).toBe(layout.ijukCourses)
    }
  })

  it('the arithmetic on screen adds up', () => {
    for (const rules of CASES) {
      for (const step of derivation(rules)) {
        const values = step.terms.map((t) => t.value)
        if (step.op === 'product') {
          expect(values.reduce((a, b) => a * b, 1)).toBeCloseTo(step.result, 6)
        } else if (step.op === 'sum') {
          expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(step.result, 6)
        } else if (step.unit === 'count') {
          // A count of courses, rounded up — and the step says why it rounds up.
          expect(Math.ceil(values[0]! / values[1]!)).toBe(step.result)
        } else {
          // A share of a run, not rounded at all.
          expect(values[0]! / values[1]!).toBeCloseTo(step.result, 6)
        }
      }
    }
  })

  it('every term is either the reader’s, a declared dimension, or carried', () => {
    for (const step of derivation(DEFAULT_RULES)) {
      for (const term of step.terms) {
        expect(
          Boolean(term.dim) || term.input === true || term.carried === true,
          `${step.key}: "${term.labelEn}" cites nothing`,
        ).toBe(true)
      }
    }
  })

  it('says why the arithmetic is that arithmetic, in both locales', () => {
    for (const step of derivation(DEFAULT_RULES)) {
      expect(step.why.length).toBeGreaterThan(40)
      expect(step.whyEn.length).toBeGreaterThan(40)
      expect(step.why).not.toBe(step.whyEn)
    }
  })

  it('is the worked example a newcomer sees before touching anything', () => {
    const steps = derivation(DEFAULT_RULES)
    const at = (k: string) => steps.find((s) => s.key === k)!.result
    // The default house, from the top of the page: 3.00 × 3 × 1.00.
    expect(at('bodyLength')).toBeCloseTo(9, 6)
    expect(at('plateY')).toBeCloseTo(4.61, 2)
    expect(at('ridgeY')).toBeCloseTo(7.01, 2)
    expect(at('frontProwY')).toBeCloseTo(10.16, 2)
  })
})
