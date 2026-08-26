import { describe, expect, it } from 'vitest'
import { rulesToQuery, rulesFromQuery } from '@/lib/banua/address'
import { formatHash, parseHash, readChoice, readInt } from '@/lib/reader'

/* Simulates the two writers against one location, in both orders. */
describe('the two halves of the address coexist', () => {
  const loc = { pathname: '/id/bangun/', search: '', hash: '' }
  const writeRules = (q: string) => {
    loc.search = `?${q}`
  }
  const writeVantage = (h: string) => {
    loc.hash = h ? `#${h}` : ''
  }

  it('neither writer erases the other, in either order', () => {
    writeRules(rulesToQuery({ rank: 'layuk', bays: 5, horns: 22 }))
    writeVantage(formatHash([['tampilan', 'kolong'], ['waktu', '735']]))
    const url = `${loc.pathname}${loc.search}${loc.hash}`
    expect(url).toBe('/id/bangun/?pangkat=layuk&ruang=5&tanduk=22#tampilan=kolong&waktu=735')

    // and the other way round
    loc.search = ''
    loc.hash = ''
    writeVantage(formatHash([['tampilan', 'kolong']]))
    writeRules(rulesToQuery({ rank: 'layuk', bays: 5, horns: 22 }))
    expect(`${loc.pathname}${loc.search}${loc.hash}`).toBe(
      '/id/bangun/?pangkat=layuk&ruang=5&tanduk=22#tampilan=kolong',
    )
  })

  it('a full address decodes back to both halves', () => {
    const url = '/id/bangun/?pangkat=layuk&ruang=5&tanduk=22#tampilan=kolong&waktu=735'
    const [, qs] = url.split('?')
    const [query, hash] = qs!.split('#')
    expect(rulesFromQuery(query!)).toEqual({ rank: 'layuk', bays: 5, horns: 22 })
    const p = parseHash(hash!)
    expect(readChoice(p.get('tampilan'), ['perspektif', 'kolong'] as const, 'perspektif')).toBe('kolong')
    expect(readInt(p.get('waktu'), 0, 1439, 540)).toBe(735)
  })

  it('an untouched vantage leaves the citable half clean', () => {
    expect(formatHash([['tampilan', null], ['sosok', null]])).toBe('')
    const url = `/id/bangun/?${rulesToQuery({ rank: 'pekamberan', bays: 3, horns: 6 })}`
    expect(url).toBe('/id/bangun/?pangkat=pekamberan&ruang=3&tanduk=6')
    expect(url).not.toContain('#')
  })
})
