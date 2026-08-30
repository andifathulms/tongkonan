/**
 * What the renderer needs to know about a sasadu.
 *
 * `zones` are the underfloor, the room, and the roof — and the middle one is
 * the only band in this collection whose divisions are *entrances*. Nothing
 * inside a sasadu separates anybody: the separating happens on the way in, and
 * a horizontal band cannot show a doorway.
 */

import { groundRing } from '@/lib/core/scene'
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
      glossId: `${(layout.floorY * 100).toFixed(0)} cm di atas tanah, di atas batu. Tidak ada yang ditanam.`,
      glossEn: `${(layout.floorY * 100).toFixed(0)} cm above the ground, on stones. Nothing is buried.`,
    },
    {
      key: 'ruang',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: 'ruang makan bersama',
      nameEn: 'the room they eat in',
      glossId: `Satu ruang tanpa sekat dengan bangku keliling, cukup untuk ${layout.rules.bentang * DIMS.seatsPerBay.value} orang. Di dalamnya tidak ada yang memisahkan siapa pun: pemisahan terjadi di jalan masuk, dan pita mendatar tidak dapat menunjukkan sebuah bukaan.`,
      glossEn: `One undivided room with a bench around it, room for ${layout.rules.bentang * DIMS.seatsPerBay.value} people. Nothing inside separates anybody: the separating happens on the way in, and a horizontal band cannot show a doorway.`,
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Daun sagu di atas ruang terbuka: tidak ada dinding di bawahnya, dan tepi atap yang rendah itulah yang menentukan tinggi tiap bukaan.',
      glossEn: 'Sago leaf over an open room: there is no wall under it, and that low eave is what sets the height of every opening.',
    },
  ]
}

/**
 * The open ground in the middle of the village.
 *
 * A sasadu stands where everybody can reach it from their own house, and the
 * ground around it is kept clear because the eating spills onto it. The two
 * blocks are houses of the village, drawn only far enough to say that this
 * building is in the middle of them rather than at an edge.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = DIMS.yardRadius.value
  const volumes: SiteVolume[] = []
  for (const sx of [-1, 1] as const) {
    volumes.push({
      kind: 'gable',
      at: [sx * r * 0.8, 0, -r * 0.35],
      size: [5.2, layout.eaveY, 6.4],
      ridgeAxis: 2,
      material: 'atap',
    })
  }
  return [
    {
      key: 'lapangan',
      nameId: 'Tanah lapang kampung',
      nameEn: 'The open ground of the village',
      glossId: `Tanah lapang berjari-jari ${r.toFixed(0)} m di tengah kampung, dengan rumah-rumah mengelilinginya. Sasadu berdiri di tengah supaya semua orang mencapainya dari rumah masing-masing, dan tanah di sekelilingnya dibiarkan kosong sebab acara makannya meluber ke situ.`,
      glossEn: `Open ground ${r.toFixed(0)} m across in the middle of the village, with houses around it. A sasadu stands in the middle so that everybody reaches it from their own house, and the ground around it is kept clear because the eating spills out onto it.`,
      lines: [groundRing(0, 0, r, 28)],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.eaveOversail.value
  return {
    // The ridge runs along Z, down the length of the hall.
    ridgeAxis: 2,
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    drip: { x: layout.halfX + over, z: layout.halfZ + over },
    ridgeReach: layout.halfZ + over,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.eaveY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met at the guests' opening, which is the highest of them and still low.
    approachAt: [0, 0, -(layout.halfZ + DIMS.yardRadius.value * 0.5)],
    figureAt: [layout.halfX * 1.4, 0, -layout.halfZ * 0.6],
  }
}
