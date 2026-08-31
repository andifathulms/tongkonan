/**
 * What the renderer needs to know about a malige.
 *
 * `drip` is the widest reading any building here has given it, and it is worth
 * saying why: on every other house the water lands somewhere between the eave
 * and the wall, and on this one the wall it lands outside of is four storeys
 * of building that have each stepped out over the one below. The drip line is
 * a long way from the stones.
 *
 * `zones` fit this building better than most, because its storeys really are a
 * stack of horizontal bands — and the one thing the field cannot say is the
 * part that matters most: who is allowed on which of them.
 */

import { groundRect, groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const bands: Zone[] = []
  layout.storeys.forEach((storey, i) => {
    const last = i === layout.storeys.length - 1
    bands.push({
      key: `tingkat-${i}`,
      fromY: i === 0 ? 0 : storey.y,
      toY: last ? topY : (layout.storeys[i + 1]?.y ?? topY),
      nameId: i === 0 ? 'tingkat bawah' : `tingkat ${i + 1}`,
      nameEn: i === 0 ? 'the ground storey' : `storey ${i + 1}`,
      glossId: last
        ? `Lantai ${(storey.halfX * 2).toFixed(2)} m — yang terbesar dalam bangunan ini, dan yang tertinggi. Siapa yang boleh berada di sini sudah ditetapkan, dan itulah satu hal yang tidak dapat dikatakan oleh pita mendatar mana pun.`
        : `Lantai ${(storey.halfX * 2).toFixed(2)} m, menjorok ${storey.oversail.toFixed(2)} m melewati tingkat di bawahnya.`,
      glossEn: last
        ? `A ${(storey.halfX * 2).toFixed(2)} m floor — the largest in this building, and the highest. Who may be up here is fixed, and that is the one thing no horizontal band can say.`
        : `A ${(storey.halfX * 2).toFixed(2)} m floor, projecting ${storey.oversail.toFixed(2)} m past the storey below it.`,
    })
  })
  return bands
}

/**
 * The fortress, and it is the only site figure in the collection that is a
 * fortification.
 *
 * The malige stands inside the Keraton wall at Baubau, which encloses a whole
 * settlement rather than a compound. What is drawn is the run of wall nearest
 * the house and the gate through it: a distance and an opening, which is what
 * a wall is to a building standing inside one.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = layout.benteng
  const h = DIMS.bentengHeight.value
  const volumes: SiteVolume[] = []
  const thickness = h * 0.55
  volumes.push({
    kind: 'box',
    at: [-r, 0, 0],
    size: [thickness, h, r * 1.5],
    material: 'batu',
  })
  volumes.push({
    kind: 'box',
    at: [0, 0, -r],
    size: [r * 1.5, h, thickness],
    material: 'batu',
  })
  return [
    {
      key: 'benteng',
      nameId: 'Dinding benteng',
      nameEn: 'The fortress wall',
      glossId: `Rumah ini berdiri di dalam benteng Keraton Buton, dinding batu karang yang melingkupi satu kampung utuh, bukan satu pekarangan. Yang digambar adalah sisi dinding yang terdekat dan jaraknya, ${r.toFixed(0)} m. Ini satu-satunya tapak dalam kumpulan ini yang berupa pertahanan.`,
      glossEn: `This house stands inside the Keraton wall at Baubau, a coral-stone wall enclosing a whole settlement rather than a compound. What is drawn is the nearest run of it and its distance, ${r.toFixed(0)} m. It is the only site in this collection that is a fortification.`,
      /*
       * The two runs of wall themselves, as an open corner — not a rectangle
       * around the house. It was a rectangle whose far corner was given as a
       * size, so it enclosed the house at a size nothing had chosen; the wall
       * is what is drawn here, and it is drawn where the two volumes above
       * stand, because a figure and its solids may not disagree about where
       * the same wall is.
       */
      lines: [
        [
          [-r, r * 0.75],
          [-r, -r],
          [r * 0.75, -r],
        ],
        groundRing(0, 0, r * 0.75, 24),
      ],
      closed: false,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const top = layout.storeys[layout.storeys.length - 1]
  const base = layout.storeys[0]
  const over = DIMS.eaveOversail.value
  return {
    // The ridge runs along X, front to back.
    ridgeAxis: 0,
    // The footprint is the ground storey, which is the *smallest* plan in the
    // building — the opposite of what this field usually reports.
    footprint: { x: (base?.halfX ?? 0) * 2, z: (base?.halfZ ?? 0) * 2 },
    drip: { x: (top?.halfX ?? 0) + over, z: (top?.halfZ ?? 0) + over },
    ridgeReach: (top?.halfX ?? 0) + over,
    weatherTop: layout.ridgeY,
    // The stones: the thirteenth meaning of this field, and among the smallest,
    // on the tallest building in the collection.
    underfloorHeight: layout.padY,
    zoneLines: [0, ...layout.storeys.slice(1).map((s) => s.y), topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the front, from far enough back that the lean-out reads.
    approachAt: [-(base?.halfX ?? 0) * 3, 0, 0],
    figureAt: [-(base?.halfX ?? 0) * 1.6, 0, (base?.halfZ ?? 0) * 0.8],
  }
}
