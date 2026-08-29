/**
 * What the renderer needs to know about an imah.
 *
 * `zones` is the awkward field once more, and here the first band is the
 * novelty: it runs from the datum to the floor and it is not empty space, it
 * is a *hillside*. On every other building in the collection the lowest band
 * is a storey, a plinth, a clearance or a void; on this one it is the piece of
 * ground the rules forbid anybody to change.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { groundAt } from './frame'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'tanah',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'tanah dan kolong',
      nameEn: 'the ground and the space under the floor',
      glossId: `Lereng ${(layout.slope * 100).toFixed(0)}% yang tidak boleh digali atau diratakan, dan jarak antara lereng itu dan lantainya. Pita ini berbeda tingginya di tiap ujung rumah — di sisi bawah ${(layout.floorY - groundAt(layout, -layout.length / 2)).toFixed(2)} m dan di sisi atas ${(layout.floorY - groundAt(layout, layout.length / 2)).toFixed(2)} m — dan itulah seluruh isi larangannya.`,
      glossEn: `A ${(layout.slope * 100).toFixed(0)}% slope that may not be dug or levelled, and the space between it and the floor. This band is a different height at each end of the house — ${(layout.floorY - groundAt(layout, -layout.length / 2)).toFixed(2)} m downhill and ${(layout.floorY - groundAt(layout, layout.length / 2)).toFixed(2)} m uphill — and that difference is the whole content of the prohibition.`,
    },
    {
      key: 'imah',
      fromY: layout.floorY,
      toY: layout.plateY,
      nameId: 'imah',
      nameEn: 'the house',
      glossId:
        'Lantai bambu belah, dinding anyaman, dan tiga bagian dari muka ke belakang: sosoro tempat tamu berhenti, tepas di tengah, dan imah di dalam. Tamu tidak melewati yang pertama.',
      glossEn:
        'A split-bamboo floor, woven walls, and three parts from front to back: the sosoro where a visitor stops, the tepas in the middle, and the imah within. A visitor does not pass the first.',
    },
    {
      key: 'hateup',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'hateup',
      nameEn: 'the thatch',
      glossId: 'Atap daun di atas rangka yang diikat, tanpa satu paku pun di dalamnya.',
      glossEn: 'Palm thatch over a lashed frame, with no iron anywhere in it.',
    },
  ]
}

/**
 * The village: houses in a row along the contour, and the ground they are on.
 *
 * The site figure here is almost redundant, which is the point — this is the
 * only building in the collection whose ground is already a part of it. What
 * the figure adds is the neighbours, standing on the same hillside at their
 * own heights, because a Kanekes house is one of a row and the row steps down
 * the slope.
 */
function site(layout: Layout): readonly SiteMark[] {
  const gap = DIMS.groundMargin.value
  const halfZ = layout.halfZ + gap
  const volumes: SiteVolume[] = []
  for (const sz of [-1, 1] as const) {
    const z = sz * (layout.halfZ * 2 + gap)
    volumes.push({
      kind: 'box',
      at: [0, groundAt(layout, 0), z],
      size: [layout.length * 0.8, layout.floorY - groundAt(layout, 0), layout.halfZ * 1.6],
      material: 'kayu',
    })
  }
  return [
    {
      key: 'kampung',
      nameId: 'Kampung',
      nameEn: 'The village',
      glossId:
        'Jejak dua rumah tetangga di lereng yang sama, berdiri pada ketinggian tanahnya masing-masing. Kampung Kanekes adalah deretan rumah yang menuruni lereng, dan tidak satu pun lerengnya diratakan untuk mereka.',
      glossEn:
        'The footprints of two neighbouring houses on the same hillside, each standing at its own height of ground. A Kanekes village is a row of houses stepping down a slope, and none of the slope was levelled for any of them.',
      lines: [groundRect(-layout.length / 2, -halfZ, layout.length / 2, halfZ)],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    // The ridge runs up the slope, front to rear.
    ridgeAxis: 0,
    footprint: { x: layout.length, z: layout.halfZ * 2 },
    drip: { x: layout.length / 2 + layout.eaveOversail, z: layout.halfZ + layout.eaveOversail },
    ridgeReach: layout.length / 2 + layout.eaveOversail,
    weatherTop: layout.ridgeY,
    /*
     * The clearance measured at the downhill end, where it is greatest.
     *
     * The seventh meaning this field has carried, and the first that is not a
     * single number about the building: under this house the clearance is a
     * different height at every post, and the figure reported is the largest
     * of them — which is the honest reading of "how much room is under it".
     */
    underfloorHeight: layout.floorY - groundAt(layout, -layout.length / 2),
    zoneLines: [0, layout.floorY, layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met at the downhill end, at the sosoro, which is as far as a visitor goes.
    approachAt: [-layout.length / 2 - DIMS.sosoroDepth.value - DIMS.groundMargin.value, 0, 0],
    figureAt: [-layout.length / 2 - DIMS.sosoroDepth.value - 1.2, 0, layout.halfZ * 0.6],
  }
}
