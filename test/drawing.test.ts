import { describe, expect, it } from 'vitest'
import { buildHouse } from '@/lib/banua/assembly'
import { drawOrthographic, drawingFileName } from '@/lib/draw/orthographic'
import type { Projection } from '@/lib/draw/orthographic'
import { ALL_DIMS, DEFAULT_RULES, DIMS, DIM_KEYS } from '@/lib/banua/rules'
import { drawSheet, sheetFileName } from '@/lib/draw/sheet'

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

describe('the composed sheet', () => {
  it('carries all three drawings, the table and the bibliography on one page', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const svg = drawSheet(house, layout, { locale: 'en' })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('PLAN')
    expect(svg).toContain('FRONT ELEVATION (NORTH)')
    expect(svg).toContain('LONG SECTION')
    expect(svg).toContain('THE DIMENSIONS')
    expect(svg).toContain('SOURCES')
  })

  it('generates the table from the rule pack rather than restating it', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const svg = drawSheet(house, layout, { locale: 'en' })
    // Every dimension, by the key /sumber lists it under.
    for (const key of DIM_KEYS) expect(svg).toContain(`>${key}<`)
    // And the value as the pack currently holds it, so an edit to rules.ts
    // reaches the printed sheet with nothing else to remember.
    expect(svg).toContain(`${DIMS.bayLength.value.toFixed(2)} m`)
  })

  it('cites only sources a dimension on the sheet actually uses', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    const svg = drawSheet(house, layout, { locale: 'en' })
    expect(svg).not.toContain('>none<')
    const used = new Set(ALL_DIMS.map((d) => d.source))
    for (const key of used) {
      if (key === 'none') continue
      expect(svg).toContain(`>${key}<`)
    }
  })

  it('states its own scale and sheet size, so a print can be trusted', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(drawSheet(house, layout, { locale: 'en' })).toContain('1:50')
    expect(drawSheet(house, layout, { locale: 'en' })).toMatch(/Sheet \d+ × \d+ mm/)
    expect(drawSheet(house, layout, { locale: 'id' })).toContain('Cetak 100%')
  })

  it('says what share of itself is the author’s own', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(drawSheet(house, layout, { locale: 'en' })).toMatch(
      /\d+% of the dimensions on this sheet are the author's own/,
    )
  })

  it('puts north on the plan, because orientation is a rule', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(drawSheet(house, layout, { locale: 'en' })).toContain('>N<')
    expect(drawSheet(house, layout, { locale: 'id' })).toContain('>U<')
  })

  it('names the file after the rules and never after the clock', () => {
    const { house } = buildHouse({ rank: 'layuk', bays: 4, horns: 9 })
    expect(sheetFileName(house)).toBe('tongkonan-lembar-layuk-4ruang-9tanduk.svg')
  })

  it('is deterministic', () => {
    const { house, layout } = buildHouse(DEFAULT_RULES)
    expect(drawSheet(house, layout, { locale: 'id' })).toBe(
      drawSheet(house, layout, { locale: 'id' }),
    )
  })
})

describe('the sheet fits on the sheet', () => {
  /*
   * A drawing that runs off the paper is not a drawing. The single views size
   * themselves to their content, but the composed sheet places things at
   * computed offsets, and an off-by-one in a column width would only show up
   * when someone printed it.
   */
  const extents = (svg: string) => {
    const w = Number(/width="([\d.]+)mm"/.exec(svg)![1])
    const h = Number(/height="([\d.]+)mm"/.exec(svg)![1])
    const xs = [...svg.matchAll(/[ML](-?[\d.]+) -?[\d.]+/g)].map((m) => Number(m[1]))
    const ys = [...svg.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]))
    const tx = [...svg.matchAll(/<text[^>]*x="([\d.]+)"/g)].map((m) => Number(m[1]))
    const ty = [...svg.matchAll(/<text[^>]*y="([\d.]+)"/g)].map((m) => Number(m[1]))
    return { w, h, maxX: Math.max(...xs, ...tx), maxY: Math.max(...ys, ...ty) }
  }

  it('keeps every line and every label inside the paper, at any rules', () => {
    for (const rules of [
      DEFAULT_RULES,
      { rank: 'layuk', bays: 5, horns: 32 } as const,
      { rank: 'batu-ariri', bays: 2, horns: 0 } as const,
    ]) {
      const { house, layout } = buildHouse(rules)
      for (const locale of ['id', 'en'] as const) {
        const { w, h, maxX, maxY } = extents(drawSheet(house, layout, { locale }))
        expect(maxX, `${rules.rank} ${locale} runs off the right`).toBeLessThanOrEqual(w)
        expect(maxY, `${rules.rank} ${locale} runs off the bottom`).toBeLessThanOrEqual(h)
      }
    }
  })
})
