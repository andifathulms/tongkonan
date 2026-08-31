/**
 * What the renderer needs to know about a balai selaso jatuh kembar.
 *
 * `zones` are the underfloor, the two levels of floor, and the roof — and the
 * middle band is the only one in this collection that contains two floors at
 * once. That is not a fit problem: it is the building. What the field cannot
 * show is which of the two you are standing on, and that is precisely what
 * this hall is about, so the copy says it instead.
 */

import { groundBox } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const aisleY = layout.aisles[0]?.floorY ?? layout.middle.floorY
  return [
    {
      key: 'kolong',
      fromY: 0,
      toY: aisleY,
      nameId: 'kolong',
      nameEn: 'the underfloor',
      glossId: `${aisleY.toFixed(2)} m di atas tanah sampai lantai selaso, di atas batu. Tidak ada yang ditanam.`,
      glossEn: `${aisleY.toFixed(2)} m up to the aisle floor, on stones. Nothing is buried.`,
    },
    {
      key: 'lantai',
      fromY: aisleY,
      toY: layout.wallTop,
      nameId: 'dua tinggi lantai',
      nameEn: 'two levels of floor',
      glossId: `Pita ini memuat dua lantai sekaligus: selaso di ${aisleY.toFixed(2)} m dan ruang tengah ${(layout.drop.fall * 100).toFixed(0)} cm di atasnya. Yang tidak dapat ditunjukkan pita mendatar adalah lantai mana yang sedang dipijak seseorang — dan justru itulah yang dibicarakan bangunan ini.`,
      glossEn: `This band holds two floors at once: the selaso at ${aisleY.toFixed(2)} m and the middle room ${(layout.drop.fall * 100).toFixed(0)} cm above it. What a horizontal band cannot show is which of the two somebody is standing on — and that is exactly what this building is about.`,
    },
    {
      key: 'atap',
      fromY: layout.wallTop,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Satu atap sirap menutupi ketiga lantai sekaligus; tritisannya menaungi selaso, dan selembayung bersilang di kedua ujung bubungan.',
      glossEn: 'One shingle roof over all three floors; its overhang shades the selaso, and the selembayung cross at both ends of the ridge.',
    },
  ]
}

/**
 * The yard, the river, and the road to it.
 *
 * A balai stands where a negeri can reach it, and in Riau that has meant a
 * river bank for as long as there have been negeri. It is the third river in
 * the collection: the betang's runs past a village strung along it, Siberut's
 * is the street itself, and this one is what the hall faces and is reached by.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = DIMS.yardRadius.value
  const bank = layout.middle.halfZ + r * 0.75
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [0, 0, -(bank + 5)],
      size: [r * 3, 0.12, 10],
      material: 'air',
    },
  ]
  return [
    {
      key: 'halaman',
      nameId: 'Halaman dan sungai',
      nameEn: 'The yard and the river',
      glossId: `Halaman balai dan tepi sungai ${bank.toFixed(0)} m di mukanya. Balai berdiri di tempat yang dapat dicapai seluruh negeri, dan di Riau itu berarti tepi sungai. Ini sungai ketiga dalam kumpulan ini: yang di rumah betang mengalir melewati kampung, yang di Siberut adalah jalannya sendiri, dan yang ini yang dihadapi balai.`,
      glossEn: `The hall’s yard, and a river bank ${bank.toFixed(0)} m in front of it. A balai stands where the whole negeri can reach it, and in Riau that has meant a river bank. It is the third river in the collection: the betang’s runs past a village strung along it, Siberut’s is the street itself, and this one is what the hall faces.`,
      lines: [groundBox(0, -(bank + 5), r * 3, 10)],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.eaveOversail.value
  const aisleY = layout.aisles[0]?.floorY ?? layout.middle.floorY
  return {
    // The ridge runs along Z, down the length of the hall.
    ridgeAxis: 2,
    footprint: {
      x: layout.middle.halfX * 2 + DIMS.aisleWidth.value * 2,
      z: layout.middle.halfZ * 2,
    },
    drip: { x: layout.middle.halfX + DIMS.aisleWidth.value + over, z: layout.middle.halfZ + over },
    ridgeReach: layout.middle.halfZ + over,
    weatherTop: layout.ridgeY,
    // Measured to the lower of the two floors, because that is the one
    // somebody walking in steps onto first.
    underfloorHeight: aisleY,
    zoneLines: [0, aisleY, layout.wallTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the river side, at the end of the aisle you would walk in along.
    approachAt: [0, 0, -(layout.middle.halfZ + DIMS.yardRadius.value * 0.6)],
    figureAt: [layout.middle.halfX + DIMS.aisleWidth.value * 0.5, 0, -layout.middle.halfZ * 0.5],
  }
}
