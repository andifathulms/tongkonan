/**
 * What the renderer needs to know about a honai.
 *
 * `underfloorHeight` is zero here, and it is the first zero in the collection.
 * Twelve buildings stand on posts or masonry and the field has meant a storey,
 * a plinth, something to sit on the edge of, a shaded working place. This one
 * sits on the earth on purpose — the ground holds heat — so the zero is a
 * decision, and the gloss says so rather than letting an empty field read as a
 * missing one.
 *
 * `ridgeAxis` is null, as on the mbaru niang and for the same reason: a circle
 * has no ridge and no face. That both round buildings need the null is the
 * evidence the field was right to be nullable.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import { domeProfile } from './roof'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const bands: Zone[] = [
    {
      key: 'api',
      fromY: 0,
      toY: layout.loft.present ? layout.loft.y : layout.eaveY,
      nameId: 'lantai dan api',
      nameEn: 'the floor and the fire',
      glossId:
        'Tungku di tengah, tanpa cerobong, di atas tanah yang menyimpan panasnya. Seluruh bangunan di atasnya ada untuk menahan panas yang keluar dari sini — dan tidak ada satu jendela pun di mana pun.',
      glossEn:
        'A hearth at the centre with no chimney, on ground that holds its heat. Everything above exists to keep in the warmth that comes off it — and there is no window anywhere at all.',
    },
  ]
  if (layout.loft.present) {
    bands.push({
      key: 'loteng',
      fromY: layout.loft.y,
      toY: layout.eaveY,
      nameId: 'loteng — tempat tidur',
      nameEn: 'the loft — where people sleep',
      glossId:
        'Panas naik, jadi bidang tidurnya diletakkan di tempat panas itu berada. Ini bukan penjelasan tentang mengapa rumah ini hangat; ini lantai yang diletakkan menurut penjelasan itu.',
      glossEn:
        'Heat rises, so the sleeping plane is put where the heat is. This is not an explanation of why the house is warm; it is a floor placed according to one.',
    })
  }
  bands.push({
    key: 'kubah',
    fromY: layout.eaveY,
    toY: topY,
    nameId: 'kubah',
    nameEn: 'the cap',
    glossId:
      'Rendah dan tebal. Bandingkan dengan mbaru niang, yang juga bundar dan juga beratap sampai tanah dan naik lima belas meter: kebundaran tidak mengatakan apa-apa dengan sendirinya.',
    glossEn:
      'Low and thick. Set it beside the mbaru niang, also round and also thatched to the ground and rising fifteen metres: roundness says nothing on its own.',
  })
  return bands
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const profile = domeProfile(layout)
  const reach = (profile[0]?.r ?? layout.radius) + layout.thatchDepth
  return {
    // No ridge, no face, no corner — as on the mbaru niang.
    ridgeAxis: null,
    footprint: { x: layout.radius * 2, z: layout.radius * 2 },
    drip: { x: reach, z: reach },
    ridgeReach: reach,
    weatherTop: topY,
    // Zero, and deliberately: see the note at the head of this file.
    underfloorHeight: 0,
    zoneLines: layout.loft.present ? [0, layout.loft.y, layout.eaveY, topY] : [0, layout.eaveY, topY],
    zones: zones(layout, topY),
    figureAt: [reach + DIMS.eaveOversail.value + 1.2, 0, 0],
  }
}
