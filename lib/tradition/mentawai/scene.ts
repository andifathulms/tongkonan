/**
 * What the renderer needs to know about an uma.
 *
 * `zones` are a stack of three bands and they are the wrong axis on purpose,
 * which is worth saying plainly: this building's divisions run *along* it —
 * open veranda, closed room, back veranda — and a stack of horizontal bands
 * cannot show that. The joglo pack made the same complaint about a building
 * that divides from the centre outward, and the tanean about a cluster. The
 * answer is the one all three reached: report the bands honestly and put the
 * real division in the copy rather than bending a field until it lies.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'kolong',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'kolong',
      nameEn: 'the underfloor',
      glossId: `${layout.floorY.toFixed(2)} m di atas tanah, di atas tiang ulin yang hanya berdiri pada batunya. Tidak ada yang ditanam, di pulau yang tanahnya sering bergerak.`,
      glossEn: `${layout.floorY.toFixed(2)} m up, on ironwood posts that only stand on their stones. Nothing is buried, on an island whose ground moves often.`,
    },
    {
      key: 'lantai',
      fromY: layout.floorY,
      toY: layout.wallTop,
      nameId: 'lantai dan ruang',
      nameEn: 'the floor and the room',
      glossId: `Pembagian yang berarti pada bangunan ini justru tidak ada di sini: ia memanjang, bukan menaik — serambi depan yang terbuka, ruang dalam dengan ${layout.rules.keluarga} perapian, lalu serambi belakang. Pita mendatar tidak dapat mengatakan satu pun dari itu, dan pita ini hanya mengatakan tingginya.`,
      glossEn: `The division that matters in this building is not here at all: it runs along it rather than up it — an open front veranda, a closed room with ${layout.rules.keluarga} hearths, then a back veranda. Horizontal bands cannot say any of that, and this one only says how high it is.`,
    },
    {
      key: 'atap',
      fromY: layout.wallTop,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Satu atap daun sagu di atas seluruh panjangnya, dan atap itulah satu-satunya dinding yang dimiliki serambi.',
      glossEn: 'One sago-leaf roof over the whole length, and that roof is the only wall the verandas have.',
    },
  ]
}

/**
 * The river, which is the road.
 *
 * On Siberut the way to an uma is by water, and the house faces the bank. It
 * is the second river bank in the collection after the betang's, and the two
 * mean different things: there a river runs past a village strung along it,
 * here a river *is* the street and the house has its front on it.
 */
function site(layout: Layout): readonly SiteMark[] {
  const width = DIMS.riverWidth.value
  const bank = layout.halfZ + DIMS.clearingRadius.value * 0.6
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [0, 0, -(bank + width / 2)],
      size: [layout.halfX * 6, 0.12, width],
      material: 'air',
    },
  ]
  return [
    {
      key: 'sungai',
      nameId: 'Sungai',
      nameEn: 'The river',
      glossId: `Sungai selebar ${width.toFixed(0)} m di depan rumah, ${bank.toFixed(0)} m dari serambi. Di Siberut sungai adalah jalan: orang datang dengan perahu dan naik ke serambi depan, yang memang tidak berdinding. Ini tepi sungai kedua dalam kumpulan ini setelah rumah betang, dan keduanya berbeda maksudnya — di sana sungai mengalir melewati kampung, di sini sungai itulah jalannya.`,
      glossEn: `A ${width.toFixed(0)} m river in front of the house, ${bank.toFixed(0)} m from the veranda. On Siberut the river is the road: people arrive by canoe and step up onto the front veranda, which is exactly why it has no walls. It is the second river bank in the collection after the betang’s, and the two mean different things — there a river runs past a village, here the river is the street.`,
      lines: [groundRect(-layout.halfX * 3, -(bank + width), layout.halfX * 6, width)],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.eaveOversail.value
  return {
    // The ridge runs along Z, down the length of the house.
    ridgeAxis: 2,
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    drip: { x: layout.halfX + over, z: layout.halfZ + over },
    ridgeReach: layout.halfZ + over,
    weatherTop: layout.ridgeY,
    // A metre of open air under a house on an island that shakes: the posts
    // stand on stones and nothing is dug.
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.wallTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the river, at the open end, which is how anybody arrives.
    approachAt: [0, 0, -(layout.halfZ + DIMS.clearingRadius.value * 0.6)],
    figureAt: [layout.halfX * 0.6, 0, -layout.halfZ * 0.72],
  }
}
