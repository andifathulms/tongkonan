/**
 * What the renderer needs to know about a baileo.
 *
 * The zones are the awkward field again, and this building is the clearest
 * case yet of why the note at the head of `jawa/scene.ts` exists. A tongkonan
 * has three worlds stacked; a rumah limas has a sequence of steps that had to
 * be refused as bands because five of them would have read as storeys. This
 * building has *one* occupied level and says so as its point — so the bands
 * here are the underfloor, the one floor, and the roof, and the middle one
 * being the only one that matters is the whole argument.
 */

import { groundRect, groundRing } from '@/lib/core/scene'
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
      glossId:
        'Ruang di bawah lantai. Tidak dipakai untuk apa pun dan tidak dimaksudkan untuk apa pun: ia ada supaya lantainya kering dan supaya yang duduk di atas terlihat dari tanah.',
      glossEn:
        'The space under the floor. It is used for nothing and meant for nothing: it exists so the floor stays dry and so that those seated above are visible from the ground.',
    },
    {
      key: 'lantai',
      fromY: layout.floorY,
      toY: layout.plateY,
      nameId: 'lantai baileo',
      nameEn: 'the floor of the baileo',
      glossId:
        'Satu bidang, terbuka pada keempat sisinya, dengan satu tempat duduk untuk tiap soa dan tidak ada satu pun yang lebih tinggi. Seluruh bangunan ini adalah pita ini; yang di bawah menyangganya dan yang di atas menaunginya.',
      glossEn:
        'One plane, open on all four sides, with one seat for each soa and not one of them higher than another. The whole building is this band; what is below holds it up and what is above keeps it dry.',
    },
    {
      key: 'atap',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId:
        'Atap besar di atas bangunan tanpa dinding. Tidak ada loteng dan tidak ada tingkat: tidak ada seorang pun yang berada di atas orang lain di dalam sini.',
      glossEn:
        'A large roof over a building with no walls. There is no loft and no storey: nobody in here is above anybody.',
    },
  ]
}

/**
 * The negeri: the stone, and the ground the village stands on to watch.
 *
 * The site figure of a building that belongs to everybody is the ground
 * everybody stands on. The stone is drawn where the rule puts it, and the open
 * ground in front of the stair is where a negeri gathers — which is not
 * scenery but the other half of the openness rule: a building you can see into
 * needs somewhere to be seen from.
 */
function site(layout: Layout): readonly SiteMark[] {
  const yard = DIMS.pamaliOffset.value * 2
  const front = -layout.length / 2
  const halfWidth = layout.halfZ + yard / 2
  const volumes: SiteVolume[] = []
  if (layout.pamali.where === 'depan') {
    // The stone is a part of the building when it stands in front of it, so
    // nothing is drawn here — it is already in the model, on the ground.
  }
  return [
    {
      key: 'negeri',
      nameId: 'Halaman negeri',
      nameEn: 'The village ground',
      glossId:
        'Tanah terbuka di muka tangga, tempat negeri berkumpul. Bangunan yang boleh dilihat ke dalamnya memerlukan tempat untuk melihatnya dari sana — jadi halaman ini bagian dari aturan keterbukaan itu dan bukan hiasan.',
      glossEn:
        'The open ground in front of the stair, where the negeri gathers. A building that can be seen into needs somewhere to be seen from, so this ground is part of the openness rule rather than a decoration.',
      lines: [
        groundRect(front - yard, -halfWidth, front, halfWidth),
        groundRing(layout.pamali.x, 0, layout.pamali.radius * 1.6),
      ],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const reach = layout.length / 2 + layout.eaveOversail
  return {
    // The ridge runs front to rear, along the row of soa.
    ridgeAxis: 0,
    footprint: { x: layout.length, z: layout.halfZ * 2 },
    drip: { x: reach, z: layout.halfZ + layout.eaveOversail },
    ridgeReach: reach,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the front, on the ground, where the stone is and where anyone
    // arriving stops before climbing.
    approachAt: [-layout.length / 2 - DIMS.pamaliOffset.value * 1.6, 0, 0],
    figureAt: [-layout.length / 2 - 1.6, 0, layout.halfZ * 0.6],
  }
}
