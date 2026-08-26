/**
 * What the renderer needs to know about a rumah gadang.
 *
 * The same reading as the other house's and almost none of the same fields,
 * which is why the renderer takes this rather than a `Layout`.
 *
 * On the names: `kolong` is the ordinary word for the space under a raised
 * house and is used as such. Where a Minang term would be a guess the zone is
 * named in Indonesian instead, on the same principle the part names follow —
 * guessing at a name is the same failure as guessing at a metre, and less
 * visible.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'kolong',
      fromY: 0,
      toY: layout.deckY,
      nameId: 'kolong',
      nameEn: 'kolong',
      glossId:
        'Ruang di bawah lantai. Rumah diangkat di atas tonggak yang berdiri pada batu sandi, tidak ditanam.',
      glossEn:
        'The space beneath the floor. The house stands on posts seated on stones rather than buried.',
    },
    {
      key: 'lantai',
      fromY: layout.deckY,
      toY: layout.plateY,
      nameId: 'ruang dalam',
      nameEn: 'the living floor',
      glossId:
        'Satu ruang panjang tanpa sekat di depan, dengan bilik berjajar di lanjar belakang. Pada laras Koto Piliang lantainya naik di kedua ujung menjadi anjuang.',
      glossEn:
        'One long unpartitioned space at the front, with the bilik ranged along the rear lanjar. Under the Koto Piliang laras the floor rises at both ends into anjuang.',
    },
    {
      key: 'para',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'para',
      nameEn: 'the loft',
      glossId: 'Ruang di bawah atap, tempat penyimpanan.',
      glossEn: 'The space under the roof, used for storage.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const lines = [0, layout.floorFrameY, layout.deckY]
  // The anjuang floor is a line worth drawing only where there is one, and
  // its absence under Bodi Caniago is the statement rather than an omission.
  if (layout.anjuangRise > 0) lines.push(layout.anjuangY)
  lines.push(layout.plateY, topY)

  return {
    // The ridge runs end to end and the house mirrors along it, so the
    // section is cut on X — a cut across the ridge would show one bay, and
    // the thing worth seeing is the floor stepping up at both ends.
    ridgeAxis: 2,
    footprint: { x: layout.bodyDepth, z: layout.bodyLength },
    drip: { x: layout.eaveHalfDepth, z: layout.ridgeEndZ },
    ridgeReach: layout.ridgeEndZ,
    weatherTop: layout.ridgeEndY,
    underfloorHeight: layout.kolongHeight,
    zoneLines: lines,
    zones: zones(layout, topY),
    figureAt: [layout.eaveHalfDepth + 1.4, 0, layout.bodyLength * 0.28],
  }
}
