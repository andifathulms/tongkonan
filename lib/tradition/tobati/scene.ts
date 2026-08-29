/**
 * What the renderer needs to know about a kariwari.
 *
 * Two fields mean something new here and both are worth stating.
 *
 * `underfloorHeight` has carried five meanings already — a storey, a thatched
 * metre and a quarter, a plinth, a step you sit on the edge of, and a zero
 * that was a decision. Here it is *freeboard*: the clearance from the highest
 * water to the underside of the floor, which is the only one of the six that
 * answers a number changing twice a day.
 *
 * And `site` is water. The ground plane in this project is y = 0; here that
 * plane is the bed of Youtefa Bay, and what lies on it is the sea. The house
 * is the only one in the collection whose setting is not somewhere a person
 * could stand.
 */

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

/**
 * The bands are the age grades, and for once the field fits exactly.
 *
 * `zones` is a stack of horizontal bands, which the joglo had to be talked
 * into and the rumah limas had to be kept out of. A kariwari is literally a
 * stack of floors, each one a stage of a life, so the bands are the building's
 * own division and not the closest honest reading of one.
 */
function zones(layout: Layout, topY: number): readonly Zone[] {
  const first = layout.levels[0]
  const bands: Zone[] = [
    {
      key: 'air',
      fromY: 0,
      // Up to the lowest floor, not up to the tide: the band a reader sees is
      // the water *and* the clearance above it, and the two together are what
      // this building's posts are for.
      toY: first?.y ?? layout.waterDepth + layout.tide,
      nameId: 'air',
      nameEn: 'the water',
      glossId:
        'Dari dasar teluk ke air tertinggi. Tidak ada bangunan di pita ini selain tiang: inilah satu-satunya bangunan dalam projek ini yang pita terbawahnya bukan tempat, melainkan laut.',
      glossEn:
        'From the bed of the bay to the highest water. Nothing of the building is in this band but the posts: this is the only building in the project whose lowest band is not a place but the sea.',
    },
  ]
  layout.levels.forEach((level, i) => {
    const above = layout.levels[i + 1]
    bands.push({
      key: level.key,
      fromY: level.y,
      toY: above ? above.y : layout.plateY,
      nameId: level.nameId,
      nameEn: level.nameEn,
      glossId: `Tingkat ${i + 1} dari ${layout.levels.length}, luas ${level.area.toFixed(1)} m². Golongan usia dinaiki, bukan ditempati: seseorang meninggalkan pita ini dengan naik ke pita di atasnya, sekali, sepanjang hidupnya.`,
      glossEn: `Level ${i + 1} of ${layout.levels.length}, ${level.area.toFixed(1)} m² of floor. A grade is climbed rather than occupied: a person leaves this band by going up into the one above it, once, over a lifetime.`,
    })
  })
  bands.push({
    key: 'puncak',
    fromY: layout.plateY,
    toY: topY,
    nameId: 'puncak',
    nameEn: 'the peak',
    glossId: 'Kerucut bersegi delapan di atas tingkat teratas. Dari kejauhan, di atas air, inilah yang menandai bangunan ini.',
    glossEn: 'The eight-sided cone over the topmost level. From a distance, over the water, this is what marks the building.',
  })
  return bands
}

/**
 * The bay: water lying on the bed the posts are driven into.
 *
 * The only site in the collection that is not ground. It is drawn the way this
 * project draws water everywhere — one poured sheet, nothing moving on it and
 * nothing reflected in it — and it runs out past the frame, because a bay does
 * not end nine metres from a house.
 */
function site(layout: Layout): readonly SiteMark[] {
  const width = DIMS.walkwayReach.value * 5
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [0, 0, 0],
      size: [width, layout.waterDepth + layout.tide, width],
      material: 'air',
    },
  ]
  return [
    {
      key: 'teluk',
      nameId: 'Teluk',
      nameEn: 'The bay',
      glossId:
        'Air Teluk Youtefa, setinggi pasang tertinggi, di atas dasar tempat tiang dipancang. Lima belas bangunan lain dalam projek ini berdiri di atas tanah; tapak yang ini bukan tempat seseorang dapat berdiri.',
      glossEn:
        'The water of Youtefa Bay at the height of the highest tide, over the bed the posts are driven into. The other fifteen buildings in this project stand on ground; this one’s site is not somewhere a person can stand.',
      lines: [groundRing(0, 0, layout.radius + DIMS.walkwayReach.value)],
      closed: false,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const first = layout.levels[0]
  const reach = layout.topRadius + layout.eaveOversail
  const high = layout.waterDepth + layout.tide
  return {
    // No ridge: an eight-sided cone has none, and every vertical cut through
    // the axis is the same cut — the reading the mbaru niang takes.
    ridgeAxis: null,
    footprint: { x: layout.radius * 2, z: layout.radius * 2 },
    drip: { x: reach, z: reach },
    ridgeReach: reach,
    weatherTop: layout.apexY,
    // Freeboard: the clearance above the highest water, which is the sixth
    // meaning this field has carried and the only one that moves with a tide.
    underfloorHeight: (first?.y ?? high) - high,
    zoneLines: [0, high, ...layout.levels.map((l) => l.y), layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Reached along the walkway, which lands on −X. Standing here means
    // standing on the titian, because there is nowhere else to stand.
    approachAt: [-layout.radius - DIMS.walkwayReach.value * 0.55, 0, 0],
    figureAt: [-layout.radius - DIMS.walkwayReach.value * 0.3, 0, 0],
  }
}
