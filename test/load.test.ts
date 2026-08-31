import { describe, expect, test } from 'vitest'
import { TRADITIONS, tradition } from '@/lib/tradition/registry'
import { TRADITION_KEYS } from '@/lib/tradition/keys'
import { loadTradition } from '@/lib/tradition/load'

/*
 * The lazy loaders and the registry are two lists of the same thirty-five
 * pairings, and two lists drift — that is this project's oldest lesson. So
 * the loaders are held against the registry entry by entry: same key, same
 * slug, same site, and the same house from the same default rules. A
 * thirty-sixth tradition added to one list and not the other fails here.
 */
describe('lazy loaders match the registry', () => {
  test('every registry entry has a key and every key an entry', () => {
    expect(TRADITIONS.map((t) => t.key)).toEqual([...TRADITION_KEYS])
  })

  for (const key of TRADITION_KEYS) {
    test(key, async () => {
      const lazy = await loadTradition(key)
      const eager = tradition(key)
      expect(lazy.key).toBe(eager.key)
      expect(lazy.slug).toBe(eager.slug)
      expect(lazy.site).toEqual(eager.site)
      expect(lazy.defaultQuery).toBe(eager.defaultQuery)
      expect(lazy.build(lazy.defaultQuery).house).toEqual(
        eager.build(eager.defaultQuery).house,
      )
    })
  }
})
