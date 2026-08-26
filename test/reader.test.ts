import { describe, expect, it } from 'vitest'
import { flag, formatHash, parseHash, readChoice, readFlag, readInt, unless } from '@/lib/reader'

describe('the reader’s vantage, in the fragment', () => {
  it('says nothing when nothing has been touched', () => {
    expect(
      formatHash([
        ['tampilan', unless('perspektif', 'perspektif', String)],
        ['sosok', unless(true, true, flag)],
      ]),
    ).toBe('')
  })

  it('carries only what differs from the default', () => {
    const hash = formatHash([
      ['tampilan', unless('kolong', 'perspektif', String)],
      ['sosok', unless(true, true, flag)],
      ['hujan', unless(true, false, flag)],
    ])
    expect(hash).toBe('tampilan=kolong&hujan=1')
    expect(hash).not.toContain('sosok')
  })

  it('round-trips', () => {
    const p = parseHash('#tampilan=kolong&waktu=735&hujan=1')
    expect(readChoice(p.get('tampilan'), ['perspektif', 'tampak', 'kolong'] as const, 'perspektif')).toBe('kolong')
    expect(readInt(p.get('waktu'), 0, 1439, 540)).toBe(735)
    expect(readFlag(p.get('hujan'), false)).toBe(true)
  })

  it('tolerates a fragment with or without its hash', () => {
    expect(parseHash('a=1').get('a')).toBe('1')
    expect(parseHash('#a=1').get('a')).toBe('1')
    expect(parseHash('').size).toBe(0)
    expect(parseHash('#').size).toBe(0)
  })

  it('falls back per field rather than failing, so a mangled link still opens', () => {
    const p = parseHash('#tampilan=belakang&waktu=abc&hujan=maybe')
    expect(readChoice(p.get('tampilan'), ['perspektif', 'kolong'] as const, 'perspektif')).toBe('perspektif')
    expect(readInt(p.get('waktu'), 0, 1439, 540)).toBe(540)
    expect(readFlag(p.get('hujan'), false)).toBe(false)
  })

  it('clamps out-of-range values instead of rendering nonsense', () => {
    expect(readInt('99999', 0, 1439, 540)).toBe(1439)
    expect(readInt('-5', 0, 1439, 540)).toBe(0)
    expect(readInt('12.7', 0, 1439, 540)).toBe(13)
  })

  it('keeps the two halves of the address apart', () => {
    // Nothing here may emit a rule: the house is the query string's business.
    const hash = formatHash([
      ['tampilan', 'kolong'],
      ['waktu', '735'],
    ])
    for (const rule of ['pangkat', 'ruang', 'tanduk']) expect(hash).not.toContain(rule)
  })
})
