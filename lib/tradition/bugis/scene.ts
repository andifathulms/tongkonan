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

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
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


/**
 * The yard the boards are counted from.
 *
 * The timpa laja is a statement addressed to whoever passes: a stack of
 * boards on the gable whose number is the household's rank, readable from the
 * road. So the distance a passer-by stands at is part of what the boards
 * mean, and a saoraja drawn on empty ground is a claim with nobody to make it
 * to.
 *
 * Interpolated, and deliberately so: that Bugis houses stand in yards off a
 * road is ordinary, but no source here fixes this arrangement, and the mark
 * says which of those two things it is.
 */
function site(layout: Layout): readonly SiteMark[] {
  const depth = DIMS.yardDepth.value
  const half = DIMS.yardWidth.value / 2
  const front = layout.eaveHalfZ
  /* The road itself: a band of packed earth, and nothing on it. */
  const roadW = DIMS.roadWidth.value
  const roadD = DIMS.roadDepth.value
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [0, 0, -front - depth + roadW / 2],
      size: [half * 2, roadD, roadW],
      material: 'tanah',
    },
  ]

  return [
    {
      key: 'halaman',
      nameId: 'Halaman dan tepi jalan',
      nameEn: 'The yard and the road',
      glossId:
        'Tepi jalan di muka tangga, di seberang halaman. Timpa laja dibaca dari sini — susunan papan itu ditujukan kepada orang yang lewat, jadi jarak berdirinya termasuk maknanya.',
      glossEn:
        'The edge of the road in front of the stair, across the yard. The timpa laja is read from here — the stack of boards is addressed to whoever passes, so how far away they stand is part of what it means.',
      lines: [groundRect(-half, -front - depth, half, -front)],
      closed: true,
      volumes,
      provenance: 'interpolated',
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
    site: site(layout),
    approachAt: [0, 0, -layout.eaveHalfZ - DIMS.yardDepth.value * 0.5],
    figureAt: [0, 0, -layout.eaveHalfZ - 1.6],
  }
}
