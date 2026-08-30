/**
 * What the renderer needs to know about an ammu hawu.
 *
 * `zones` are the underfloor, the hull and the roof — and the middle one is
 * unusual for this project in that it is almost entirely roof already. There
 * is barely a wall in this building: the section is a floor, a hand's height
 * of board, and then thatch all the way to the keel.
 *
 * `ridgeReach` and `drip` are the same figure here, because the eave is not
 * far out from the hull: what oversails is the *ends*, at the bow and the
 * stern, which is where a boat's overhangs are too.
 */

import { groundRing } from '@/lib/core/scene'
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
      glossId: `${layout.floorY.toFixed(2)} m di atas tanah, di atas tiang yang berdiri pada batu. Tidak ada yang ditanam.`,
      glossEn: `${layout.floorY.toFixed(2)} m up, on posts standing on stones. Nothing is buried.`,
    },
    {
      key: 'lambung',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: 'lambung',
      nameEn: 'the hull',
      glossId: `Lantai dan dinding rendah setinggi ${(layout.eaveY - layout.floorY).toFixed(2)} m — dan itulah seluruh dindingnya. Celah di bawah tepi atap di ujung haluan adalah satu-satunya jalan masuk.`,
      glossEn: `The floor and a low wall ${(layout.eaveY - layout.floorY).toFixed(2)} m high — and that is all the wall there is. The gap under the eave at the bow is the only way in.`,
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap dan lunas',
      nameEn: 'the roof and the keel',
      glossId: `Daun palem sampai ke lunas ${(layout.ridgeY - layout.floorY).toFixed(2)} m di atas lantai, dan lunas itu melengkung seperti lunas perahu. Buritannya berdiri lebih tinggi daripada haluannya: kedua ujungnya memang tidak sama.`,
      glossEn: `Palm leaf to the keel ${(layout.ridgeY - layout.floorY).toFixed(2)} m above the floor, and that keel is cambered as a boat’s is. The stern stands higher than the bow: the two ends are not alike.`,
    },
  ]
}

/**
 * The swept yard, and the palms are not drawn.
 *
 * Sabu lives on the lontar, and a yard on Sabu has tapped palms around it —
 * which this project does not model, for the same reason it models no plant
 * anywhere. What is drawn is the ground that is kept clear, and the caution
 * says what is missing from it.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = DIMS.yardRadius.value
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [r * 0.66, 0, -r * 0.3],
      size: [1.2, 0.9, 1.2],
      material: 'kayu',
    },
  ]
  return [
    {
      key: 'halaman',
      nameId: 'Halaman',
      nameEn: 'The swept yard',
      glossId: `Tanah yang disapu bersih di sekeliling rumah, jari-jarinya ${r.toFixed(0)} m, dengan tempat memasak nira di salah satu sisinya. Pohon lontar yang disadap berdiri mengelilingi halaman ini dan tidak digambar — projek ini tidak menggambar tumbuhan mana pun — dan pada pulau yang hidup dari lontar, ketiadaan itu lebih terasa daripada di tempat lain.`,
      glossEn: `Ground swept bare around the house, ${r.toFixed(0)} m across, with the place the palm juice is boiled at one side. The tapped lontar palms stand around this yard and are not drawn — this project draws no plant anywhere — and on an island that lives on the lontar, that absence weighs more than it does elsewhere.`,
      lines: [groundRing(0, 0, r, 28)],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.thatchOversail.value
  return {
    // The keel runs along Z, from bow to stern.
    ridgeAxis: 2,
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    // The eave is barely outside the hull; what oversails is the two ends.
    drip: { x: layout.halfX, z: layout.halfZ + over },
    ridgeReach: layout.halfZ + over,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.eaveY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met at the bow, which is the end you get in by.
    approachAt: [0, 0, -(layout.halfZ + DIMS.yardRadius.value * 0.55)],
    figureAt: [layout.halfX * 1.5, 0, -layout.halfZ * 0.8],
  }
}
