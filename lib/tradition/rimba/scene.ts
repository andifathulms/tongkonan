/**
 * What the renderer needs to know about a sudung.
 *
 * The smallest reading in the project, and two fields say something by how
 * little they have to report.
 *
 * `zones` are two bands: the floor people sleep on and the one slope over it.
 * There is no third, because there is nothing else — no storey, no store, no
 * roof space, no ceremonial level. Every other building here divides into at
 * least three, and several of those divisions are what the building is *for*.
 *
 * `underfloorHeight` is the height of a sleeping platform above leaf litter,
 * and it goes to zero when the floor is laid on the ground. Fifteen meanings
 * in, and this is the smallest that is not zero.
 */

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'tidur',
      fromY: 0,
      toY: layout.floor.y + DIMS.deckThickness.value,
      nameId: 'tempat tidur',
      nameEn: 'where people sleep',
      glossId: `Lantai untuk ${layout.rules.orang} orang berbaring bersebelahan, ${(layout.floor.halfZ * 2).toFixed(2)} m lebarnya${layout.rules.panggung ? ` dan ${(layout.floor.y * 100).toFixed(0)} cm di atas tanah hutan` : ' dan langsung di atas tanah'}. Denah inilah satu-satunya dalam projek ini yang diukur dari orang yang berbaring.`,
      glossEn: `Floor for ${layout.rules.orang} people lying side by side, ${(layout.floor.halfZ * 2).toFixed(2)} m of it${layout.rules.panggung ? `, ${(layout.floor.y * 100).toFixed(0)} cm above the forest floor` : ', straight on the ground'}. It is the only plan in this project measured from people lying down.`,
    },
    {
      key: 'atap',
      fromY: layout.floor.y + DIMS.deckThickness.value,
      toY: topY,
      nameId: 'satu bidang atap',
      nameEn: 'one slope of roof',
      glossId: 'Satu bidang daun yang jatuh ke satu arah, tanpa bubungan dan tanpa sisi kedua. Tidak ada pita ketiga di sini sebab memang tidak ada apa-apa lagi: tidak ada lantai atas, tidak ada lumbung, tidak ada tingkat upacara.',
      glossEn: 'A single sheet of leaf falling one way, with no ridge and no second slope. There is no third band here because there is nothing else: no upper floor, no store, no ceremonial level.',
    },
  ]
}

/**
 * The last shelter, left standing where it was.
 *
 * The only site figure in this collection that is the same building as its
 * subject, abandoned. The waruga's burial ground is made of more waruga, but
 * those are in use; this is one sudung looking at the one the family walked
 * away from, and the reason it is still standing is that nobody took it down.
 */
function site(layout: Layout): readonly SiteMark[] {
  const away = layout.abandoned
  const volumes: SiteVolume[] = [
    {
      kind: 'gable',
      at: [away * 0.7, 0, -away * 0.45],
      size: [layout.floor.halfX * 2, layout.roof.highY * 0.8, layout.floor.halfZ * 2],
      ridgeAxis: 2,
      material: 'atap',
    },
  ]
  return [
    {
      key: 'melangun',
      nameId: 'Sudung yang ditinggalkan',
      nameEn: 'The shelter that was left',
      glossId: `Sudung sebelumnya, ${away.toFixed(0)} m dari sini, dibiarkan berdiri. Melangun berarti pergi dari tempat itu ketika ada yang meninggal dan tidak kembali kepadanya; yang tertinggal tidak dibongkar dan tidak dibakar, dan hutan yang menghabiskannya. Ini satu-satunya gambar tapak dalam kumpulan ini yang berisi bangunan yang sama dengan pokoknya, dalam keadaan ditinggalkan.`,
      glossEn: `The previous shelter, ${away.toFixed(0)} m away, left standing. Melangun means leaving a place when somebody dies and not returning to it; what is left is neither dismantled nor burned, and the forest finishes it. This is the only site figure in the collection containing the same building as its subject, abandoned.`,
      lines: [groundRing(0, 0, DIMS.clearingRadius.value, 24)],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    // The slope falls along X; the sleepers lie along Z.
    ridgeAxis: 2,
    footprint: { x: layout.floor.halfX * 2, z: layout.floor.halfZ * 2 },
    drip: { x: layout.floor.halfX + layout.roof.reach, z: layout.floor.halfZ },
    ridgeReach: layout.floor.halfZ,
    weatherTop: layout.roof.highY,
    // A sleeping platform above leaf litter, and zero when there is none.
    underfloorHeight: layout.floor.y,
    zoneLines: [0, layout.floor.y + DIMS.deckThickness.value, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the open side, which is the side the roof is high on.
    approachAt: [-layout.floor.halfX * 5, 0, 0],
    figureAt: [-layout.floor.halfX * 1.8, 0, layout.floor.halfZ * 1.2],
  }
}
