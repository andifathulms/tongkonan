import { describe, expect, it } from 'vitest'
import { courseBands } from '@/lib/core/courses'
import { rulesCodec } from '@/lib/core/address'
import { partBuilders } from '@/lib/core/parts'
import { buildHouse as buildToraja } from '@/lib/tradition/toraja/assembly'
import { ijukBands as torajaBands } from '@/lib/tradition/toraja/roof'
import { DIMS as TORAJA_DIMS, DEFAULT_RULES as TORAJA_RULES } from '@/lib/tradition/toraja/rules'
import { buildHouse as buildMinang } from '@/lib/tradition/minang/assembly'
import { ijukBands as minangBands } from '@/lib/tradition/minang/roof'
import { DIMS as MINANG_DIMS, DEFAULT_RULES as MINANG_RULES } from '@/lib/tradition/minang/rules'

/**
 * These are the pieces two houses agreed on. The point of testing them here
 * rather than only through the traditions is that a change to one of them now
 * changes both buildings at once, which is exactly the risk an extraction
 * takes on in exchange for saying something true.
 */

describe('lapped courses', () => {
  it('covers the slope end to end, with every course lapping the one below', () => {
    for (const count of [4, 9, 35, 60]) {
      for (const lap of [0.2, 0.4, 0.55]) {
        const bands = courseBands(count, lap)
        expect(bands.length).toBe(count)
        expect(bands[0]?.foot).toBe(1) // the eave course reaches the eave
        expect(bands[count - 1]?.head).toBeCloseTo(0, 10) // the top reaches the ridge
        for (let k = 1; k < count; k++) {
          const below = bands[k - 1]
          const cur = bands[k]
          expect(cur && below && cur.foot - below.head).toBeGreaterThan(0)
        }
      }
    }
  })

  it('is what both houses are thatched with', () => {
    const toraja = buildToraja(TORAJA_RULES).layout
    expect(torajaBands(toraja)).toEqual(
      courseBands(toraja.ijukCourses, TORAJA_DIMS.ijukLap.value),
    )
    const minang = buildMinang(MINANG_RULES).layout
    expect(minangBands(minang)).toEqual(
      courseBands(minang.ijukCourses, MINANG_DIMS.ijukLap.value),
    )
  })

  it('laps more of the slope when the lap is deeper', () => {
    const shallow = courseBands(20, 0.2)
    const deep = courseBands(20, 0.5)
    const lapAt = (b: readonly { head: number; foot: number }[], k: number) =>
      (b[k]?.foot ?? 0) - (b[k - 1]?.head ?? 0)
    expect(lapAt(deep, 5)).toBeGreaterThan(lapAt(shallow, 5))
  })
})

describe('the rules codec', () => {
  interface Toy {
    readonly kind: 'a' | 'b'
    readonly n: number
  }
  const codec = rulesCodec<Toy>({
    defaults: { kind: 'a', n: 3 },
    normalise: (r) => ({ kind: r.kind, n: Math.min(9, Math.max(1, Math.round(r.n))) }),
    fields: [
      { kind: 'choice', key: 'kind', param: 'jenis', options: ['a', 'b'] },
      { kind: 'int', key: 'n', param: 'jumlah' },
    ],
  })

  it('writes every field, defaults included', () => {
    expect(codec.toQuery({ kind: 'a', n: 3 })).toBe('jenis=a&jumlah=3')
  })

  it('round-trips', () => {
    expect(codec.fromQuery(codec.toQuery({ kind: 'b', n: 7 }))).toEqual({ kind: 'b', n: 7 })
    expect(codec.fromQuery(`?${codec.toQuery({ kind: 'b', n: 7 })}`)).toEqual({ kind: 'b', n: 7 })
  })

  it('falls back per field rather than failing', () => {
    expect(codec.fromQuery('?jenis=zebra&jumlah=5')).toEqual({ kind: 'a', n: 5 })
    expect(codec.fromQuery('?jumlah=abc').n).toBe(3)
    // An empty value says nothing. It is a truncated address, not a zero.
    expect(codec.fromQuery('?jumlah=').n).toBe(3)
  })

  it('clamps with the pack’s own clamp and nothing else', () => {
    expect(codec.fromQuery('?jumlah=99').n).toBe(9)
    expect(codec.fromQuery('?jumlah=-4').n).toBe(1)
  })

  it('carries the rules and nothing else', () => {
    const q = new URLSearchParams(codec.toQuery({ kind: 'b', n: 2 }))
    expect([...q.keys()].sort()).toEqual(['jenis', 'jumlah'])
  })

  it('ignores a parameter belonging to another house', () => {
    expect(codec.fromQuery('?pangkat=layuk&jumlah=4')).toEqual({ kind: 'a', n: 4 })
  })
})

describe('part builders', () => {
  const { box, mesh } = partBuilders<{
    stage: 'satu'
    material: 'kayu'
    source: 'none'
    dim: 'panjang'
    joint: 'pasak'
    rules: object
  }>()
  const naming = { name: 'x', nameId: 'X', nameEn: 'X' }

  it('omits the rotation key entirely when a part is axis-aligned', () => {
    // Not cosmetic: the drawing layer and the invariants both branch on
    // whether `rotation` is present, and an explicit [0,0,0] is a different
    // object shape from an absent one.
    const plain = box('a', naming, 'satu', 0, 'kayu', ['panjang'], [0, 0, 0], [1, 1, 1])
    expect('rotation' in plain).toBe(false)
    const turned = box('b', naming, 'satu', 1, 'kayu', ['panjang'], [0, 0, 0], [1, 1, 1], [0, 0, 1])
    expect(turned.rotation).toEqual([0, 0, 1])
  })

  it('carries mesh data through without copying it into a different shape', () => {
    const data = { positions: [0, 0, 0], normals: [0, 1, 0], uvs: [0, 0], indices: [] }
    const part = mesh('c', naming, 'satu', 2, 'kayu', ['panjang'], data)
    expect(part.positions).toBe(data.positions)
    expect(part.kind).toBe('mesh')
  })
})
