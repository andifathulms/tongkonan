/**
 * What the renderer needs to know about a siwaluh jabu.
 *
 * `zones` is three bands and the middle one is the whole point: one room, from
 * the floor to the eave, with eight households in it and nothing between them.
 * The field has been made to carry a cosmology, a set of storeys, a sequence
 * of ranks and a thermal argument; here it carries a band that is deliberately
 * undivided, which is the first time the *absence* of a division has been the
 * thing worth naming.
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
      glossId: 'Kolong untuk ternak dan kayu bakar, seperti pada rumah panggung lain di sini.',
      glossEn: 'The underfloor, for livestock and firewood, as on the other raised houses here.',
    },
    {
      key: 'ruang',
      fromY: layout.floorY,
      toY: layout.plateY,
      nameId: 'satu ruang',
      nameEn: 'one room',
      glossId: `Satu ruang untuk ${layout.jabu.length} rumah tangga, dengan ${layout.hearths.length} tungku yang masing-masing dipakai berdua, dan tanpa satu sekat pun. Yang membedakan satu rumah tangga dari yang lain di dalam pita ini bukan dinding melainkan letak: siapa yang paling dekat dengan ujung pangkal kayu.`,
      glossEn: `One room for ${layout.jabu.length} households, with ${layout.hearths.length} hearths each shared by two, and not one partition. What separates one household from another inside this band is not a wall but a position: who is nearest the root end of the timber.`,
    },
    {
      key: 'atap',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'atap ijuk',
      nameEn: 'the ijuk roof',
      glossId: 'Atap besar dan curam di atas badan yang rendah, dengan tersek berdiri di ujung pangkal.',
      glossEn: 'A large steep roof over a low body, with the tersek standing at the root end.',
    },
  ]
}

/**
 * The village street, and the rice barns across it.
 *
 * A Karo village is a row of these houses along a street with granaries facing
 * them, so the site figure is a street edge and two barn footprints — the same
 * arrangement the Nias pack draws and for the same reason: this house is one of
 * a row, not an object in a field.
 */
function site(layout: Layout): readonly SiteMark[] {
  const street = DIMS.bayLength.value * 2
  const front = -(layout.halfZ + DIMS.wallLean.value + layout.eaveOversail)
  const plan = DIMS.bayLength.value
  const volumes: SiteVolume[] = []
  for (const sx of [-1, 1] as const) {
    const cx = sx * layout.length * 0.25
    volumes.push({
      kind: 'box',
      at: [cx, 0, front - street + plan / 2],
      size: [plan, layout.floorY, plan],
      material: 'kayu',
    })
    volumes.push({
      kind: 'gable',
      at: [cx, layout.floorY, front - street + plan / 2],
      size: [plan * 1.4, DIMS.ridgeRise.value * 0.5, plan * 1.4],
      ridgeAxis: 0,
      material: 'atap',
    })
  }
  return [
    {
      key: 'jalan',
      nameId: 'Jalan kampung',
      nameEn: 'The village street',
      glossId:
        'Tepi jalan kampung di muka rumah, dan jejak dua lumbung di seberangnya. Rumah Karo berdiri berderet di sepanjang jalan dengan lumbung menghadapnya: yang ini satu rumah dari sebuah deretan, bukan bangunan yang berdiri sendiri.',
      glossEn:
        'The edge of the village street in front of the house, and the footprints of two granaries across it. Karo houses stand in a row along a street with the granaries facing them: this is one house of a row rather than a free-standing building.',
      lines: [groundRect(-layout.length / 2, front - street, layout.length / 2, front)],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const across = layout.halfZ + DIMS.wallLean.value + layout.eaveOversail
  return {
    // The ridge runs along the length, from the root end to the tip.
    ridgeAxis: 0,
    footprint: { x: layout.length, z: layout.halfZ * 2 },
    drip: { x: layout.length / 2 + layout.eaveOversail, z: across },
    ridgeReach: layout.length / 2 + layout.eaveOversail,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the street, at the root end, which is the end with the door
    // whichever rule is in force.
    approachAt: [layout.benaX - DIMS.bayLength.value, 0, -across - DIMS.bayLength.value],
    figureAt: [layout.benaX - 1.5, 0, 0],
  }
}
