/**
 * What the renderer needs to know about a saoraja.
 *
 * `zones` fits cleanly here for the first time since the mbaru niang, and for
 * the same reason: the tradition itself divides the building into three
 * stacked bands and names them. Awa bola, ale bola, rakkeang — the field is
 * doing exactly what it was made for.
 *
 * What it cannot show is the thing this house is here for, because the rank is
 * on the gable and a band is a height. That is fine and worth noting: the
 * scene model describes the building, and the claim on the outside of it is
 * the readout's business.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'awa-bola',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'awa bola — dunia bawah',
      nameEn: 'awa bola — the lower world',
      glossId: 'Kolong: ternak, alat, dan pekerjaan yang tidak dibawa masuk.',
      glossEn: 'The space beneath: livestock, tools, and the work that is not brought inside.',
    },
    {
      key: 'ale-bola',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: 'ale bola — dunia tengah',
      nameEn: 'ale bola — the middle world',
      glossId: 'Badan rumah, tempat orang tinggal. Bagian tengah dari tiga, dan bukan yang tertinggi.',
      glossEn: 'The body of the house, where people live. The middle of three, and not the highest.',
    },
    {
      key: 'rakkeang',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'rakkeang — dunia atas',
      nameEn: 'rakkeang — the upper world',
      glossId:
        'Loteng tempat padi disimpan. Yang tertinggi dalam rumah ini adalah yang menghidupinya — tongkonan juga membagi tiga, dan yang berbeda adalah apa yang ditaruh di atas.',
      glossEn:
        'The loft where rice is kept. The highest thing in this house is the thing that feeds it — the tongkonan divides into three as well, and what differs is what is put at the top.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    ridgeAxis: 2,
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    drip: { x: layout.eaveHalfX, z: layout.eaveHalfZ },
    ridgeReach: Math.max(layout.eaveHalfX, layout.eaveHalfZ),
    weatherTop: topY,
    underfloorHeight: layout.awaBola,
    zoneLines: [0, layout.floorY, layout.eaveY, topY],
    zones: zones(layout, topY),
    // At the gable end, because that is where the claim is and where a
    // neighbour would stand to count it.
    figureAt: [0, 0, -layout.eaveHalfZ - 1.6],
  }
}
