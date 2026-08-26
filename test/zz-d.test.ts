import { describe, it } from 'vitest'
import { buildHouse } from '@/lib/tradition/minang/assembly'
import { stationAt } from '@/lib/tradition/minang/roof'
import { DEFAULT_RULES } from '@/lib/tradition/minang/rules'
import { partBounds } from '@/lib/core/invariants'
describe('d', () => { it('end rafters vs the roof', () => {
  const { house, layout: l } = buildHouse(DEFAULT_RULES)
  const ends = house.parts.filter(p => p.id.startsWith('kasau-ujung-'))
  console.log('end rafters:', ends.length)
  for (const p of ends.slice(0, 4)) {
    const b = partBounds(p)
    const z = p.kind === 'box' ? p.center[2] : 0
    const st = stationAt(l, z)
    console.log(`  ${p.id} @z=${z.toFixed(2)}`)
    console.log(`     reaches x ±${Math.max(Math.abs(b.min[0]), Math.abs(b.max[0])).toFixed(2)}, down to y ${b.min[1].toFixed(2)}`)
    console.log(`     roof there: halfWidth ${st.halfWidth.toFixed(2)}, edge at y ${st.eaveY.toFixed(2)}`)
  }
  console.log(`layout level values used by placeRafters: eaveHalfDepth ${l.eaveHalfDepth.toFixed(2)}, eaveY ${l.eaveY.toFixed(2)}`)
}) })
