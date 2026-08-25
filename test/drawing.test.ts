import { describe, expect, it } from 'vitest'
import { buildHouse } from '@/lib/banua/assembly'
import { drawOrthographic, drawingFileName } from '@/lib/draw/orthographic'
import type { Projection } from '@/lib/draw/orthographic'
import { DEFAULT_RULES } from '@/lib/banua/rules'

const VIEWS: Projection[] = ['denah', 'tampak', 'potongan']

describe('orthographic drawings', () => {
  const { house, layout } = buildHouse(DEFAULT_RULES)

  for (const view of VIEWS) {
    it(`draws ${view} as well-formed SVG with content`, () => {
      const svg = drawOrthographic(house, layout, view, { locale: 'id' })
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
      expect(svg.split('<path').length).toBeGreaterThan(20)
      expect(svg).not.toContain('NaN')
      expect(svg).not.toContain('Infinity')
    })
  }

  it('states the interpolated share on every sheet', () => {
    // A drawing that leaves the room without saying how much of it is the
    // author's own guess is the failure mode the project exists to avoid.
    for (const view of VIEWS) {
      const svg = drawOrthographic(house, layout, view, { locale: 'en' })
      expect(svg).toMatch(/\d+% of the dimensions/)
    }
  })

  it('is deterministic, like everything else the rules produce', () => {
    const a = drawOrthographic(house, layout, 'potongan', { locale: 'id' })
    const b = drawOrthographic(buildHouse(DEFAULT_RULES).house, layout, 'potongan', {
      locale: 'id',
    })
    expect(a).toBe(b)
  })

  it('names the file from the rules, with no timestamp in it', () => {
    const name = drawingFileName(house, 'denah')
    expect(name).toBe('tongkonan-denah-pekamberan-3ruang-6tanduk.svg')
  })
})
