/**
 * What the renderer needs to know about a joglo.
 *
 * And the first house that does not fit the shape of the question.
 *
 * `SceneModel` asks for an underfloor height, because both earlier houses
 * stand on posts and the void beneath them is a room — livestock and firewood
 * under a tongkonan, the kolong of a rumah gadang. A joglo has no such room.
 * Its floor is a plinth a third of a metre off the ground; you cannot get
 * under it, and the camera preset that drops beneath the floor and looks up
 * has nothing to look at. The field is reported honestly as the clearance it
 * is, and the tradition's own view list simply does not offer that vantage.
 *
 * The zones are the other misfit, and a deeper one. Both earlier houses divide
 * *vertically* — three stacked worlds in the tongkonan, kolong and floor and
 * loft in the rumah gadang — and `SceneModel.zones` is a stack of horizontal
 * bands because that is what two houses needed. This one divides from the
 * centre outward: what matters is being under the brunjung, in the square held
 * by the four soko guru, rather than out under the penanggap. The bands below
 * are the closest honest reading of that as a vertical thing — the periphery
 * is low because the outer rings are short, and the centre is high because the
 * soko guru are tall — but the division being named here is not really a
 * height, and a fourth house should not be made to pretend it is either.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const outer = layout.sokoRings[layout.sokoRings.length - 1]
  const peripheryTop = outer ? layout.eaveY : layout.floorY
  return [
    {
      key: 'jogan',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'jogan',
      nameEn: 'the floor',
      glossId:
        'Lantai, ditinggikan sedikit di atas tanah. Tidak ada ruang di bawahnya: joglo bukan rumah panggung, dan di sinilah ia paling jelas berbeda dari dua rumah lainnya.',
      glossEn:
        'The floor, raised a little above the ground. There is no room beneath it: a joglo is not a house on stilts, and this is where it differs most plainly from the other two houses.',
    },
    {
      key: 'penanggap',
      fromY: layout.floorY,
      toY: peripheryTop,
      nameId: 'bawah penanggap',
      nameEn: 'under the penanggap',
      glossId:
        'Tepi rumah, di bawah atap yang melandai. Langit-langitnya rendah karena cincin tiang di luar memang lebih pendek, dan itu disengaja: makin ke tepi makin rendah.',
      glossEn:
        'The edge of the house, under the shallow part of the roof. The ceiling is low because the outer rings of pillars are short, and that is deliberate: the further out, the lower.',
    },
    {
      key: 'brunjung',
      fromY: peripheryTop,
      toY: topY,
      nameId: 'bawah brunjung',
      nameEn: 'under the brunjung',
      glossId:
        'Pusat rumah, persegi yang dipikul empat soko guru, dengan tumpang sari menutup naik di atasnya. Pembagian rumah ini sebenarnya dari pusat ke tepi, bukan dari bawah ke atas — dan pusat itulah yang paling tinggi.',
      glossEn:
        'The centre of the house, the square carried by the four soko guru, with the tumpang sari closing upward above it. This house really divides from the centre outward rather than from the ground up — and the centre is the tall part.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const eave = layout.roof[0]
  const halfX = eave?.halfX ?? layout.bodyDepth / 2
  const halfZ = eave?.halfZ ?? layout.bodyLength / 2
  // The compound reaches forward when the pendhapa stands, and the model has
  // to frame both buildings or the reader sees half a house.
  const reachX = layout.pendhapa.present
    ? Math.max(halfX, -layout.pendhapa.centreX + layout.pendhapa.halfX + 1)
    : halfX

  return {
    // The molo runs left to right as you face the house, like the rumah
    // gadang's. Unlike either of them the roof is not swept along it.
    ridgeAxis: 2,
    footprint: { x: layout.bodyDepth, z: layout.bodyLength },
    drip: { x: reachX, z: halfZ },
    ridgeReach: halfZ,
    weatherTop: layout.ridgeY,
    // Reported as what it is: a step, not a storey. Nothing can stand here.
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.eaveY, layout.tumpangFootY, topY],
    zones: zones(layout, topY),
    figureAt: [halfX + 1.6, 0, halfZ * 0.4],
  }
}
