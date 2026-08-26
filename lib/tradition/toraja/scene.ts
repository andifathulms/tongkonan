/**
 * What the renderer needs to know about a tongkonan.
 *
 * The renderer used to read twenty fields off this `Layout` directly, which
 * meant it could only ever draw one building. This is that reading, done once
 * and on this side of the split, so the renderer can be handed a house it
 * cannot name a single stage of.
 *
 * The zone names live here rather than in the app copy because they are the
 * names of parts of the building, like `tulak somba` and `ijuk`. Copy that
 * describes the interface belongs in `lib/i18n.ts`; vocabulary belongs with
 * the house it is the vocabulary of.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

/**
 * The cosmological division, as spatial fact.
 *
 * Three worlds stacked: livestock and shadow below, people in the middle,
 * rice and heirlooms above. The section cut is what makes this an
 * observation about a building rather than a diagram beside one.
 */
function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'sulluk',
      fromY: 0,
      toY: layout.deckY,
      nameId: 'sulluk banua',
      nameEn: 'sulluk banua',
      glossId:
        'Kolong. Dunia bawah: ternak, kayu bakar, dan bayang-bayang dalam yang membuat badan rumah tampak melayang.',
      glossEn:
        'The underfloor. The lower world: livestock, firewood, and the deep shadow that makes the body appear to float.',
    },
    {
      key: 'kale',
      fromY: layout.deckY,
      toY: layout.plateY,
      nameId: 'kale banua',
      nameEn: 'kale banua',
      glossId: 'Lantai hunian. Dunia tengah: tempat manusia tinggal, dibagi menjadi ruang-ruang bernama.',
      glossEn: 'The living floor. The middle world: where people live, divided into named bays.',
    },
    {
      key: 'rattiang',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'rattiang banua',
      nameEn: 'rattiang banua',
      glossId: 'Loteng di bawah atap. Dunia atas: penyimpanan padi dan pusaka.',
      glossEn: 'The attic under the roof. The upper world: rice and heirlooms are kept here.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  // The prows are not symmetric, so the reach is the further of the two.
  const reach = Math.max(-layout.frontProwX, layout.rearProwX)
  return {
    // The ridge runs front to rear and the house mirrors across it.
    ridgeAxis: 0,
    footprint: { x: layout.bodyLength, z: layout.bodyWidth },
    drip: { x: reach, z: layout.eaveHalfWidth },
    ridgeReach: reach,
    weatherTop: layout.frontProwY,
    underfloorHeight: layout.kolongHeight,
    zoneLines: [0, layout.floorFrameY, layout.deckY, layout.plateY, topY],
    zones: zones(layout, topY),
    figureAt: [layout.bodyLength * 0.28, 0, layout.eaveHalfWidth + 1.4],
  }
}
