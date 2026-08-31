import type { Tradition } from '@/lib/tradition/registry'

/*
 * The collection arranged by geography, shared by every surface that lists
 * it — the landing's index and the comparison's pickers must not disagree
 * about where a house is filed. Both facts are computed: the island comes
 * off each site and the order off each group's westernmost longitude, so
 * the arrangement is geography rather than an editorial list a new house
 * would have to be filed into by hand.
 */
export interface IslandGroup<T extends { t: Tradition }> {
  readonly island: { readonly id: string; readonly en: string }
  readonly west: number
  readonly items: readonly (T & { readonly plate: number })[]
}

export function groupByIsland<T extends { t: Tradition }>(
  built: readonly T[],
): IslandGroup<T>[] {
  interface Group {
    island: { id: string; en: string }
    west: number
    items: (T & { plate: number })[]
  }
  const groups = new Map<string, Group>()
  built.forEach((entry, i) => {
    const island = entry.t.site.island
    const group: Group = groups.get(island.id) ?? { island, west: Infinity, items: [] }
    group.west = Math.min(group.west, entry.t.site.longitude)
    group.items.push({ ...entry, plate: i + 1 })
    groups.set(island.id, group)
  })
  return [...groups.values()].sort((a, b) => a.west - b.west)
}

/** Everything a reader might type to find a house, in either language. */
export function searchText(t: Tradition): string {
  return [
    t.house.id,
    t.house.en,
    t.people.id,
    t.people.en,
    t.place.id,
    t.place.en,
    t.site.name,
    t.site.island.id,
    t.site.island.en,
  ]
    .join(' ')
    .toLowerCase()
}
