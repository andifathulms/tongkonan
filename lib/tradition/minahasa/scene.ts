/**
 * What the renderer needs to know about a woloan house.
 *
 * The site figure is the one that gives this pack away: the yard holds the
 * numbered bundles of *another* house, stacked and waiting for the lorry. It
 * is the only setting in the collection that is a building in transit rather
 * than a place — and it is low enough to walk past, which is the condition
 * every site figure here is drawn under.
 */

import { groundRect } from '@/lib/core/scene'
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
        'Ruang di bawah lantai, dipakai untuk kerja dan simpanan. Ketika rumahnya dijual dan diangkut, yang tertinggal di pita ini hanyalah batu alasnya: sebuah denah dari batu.',
      glossEn:
        'The space under the floor, used for work and storage. When the house is sold and carried away, what is left in this band is the pad stones: a plan drawn in stone.',
    },
    {
      key: 'lantai',
      fromY: layout.floorY,
      toY: layout.plateY,
      nameId: 'badan rumah',
      nameEn: 'the body',
      glossId:
        'Lantai dan dinding, keduanya dibuat per ruang. Panel dinding adalah satuan pindahnya: dinomori, dilepas, diangkut, dan dipasang kembali dalam urutan yang sama.',
      glossEn:
        'The floor and the walls, both made bay by bay. The wall panel is the unit of the move: numbered, taken off, carried, and put back in the same order.',
    },
    {
      key: 'atap',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId:
        'Rangka atap dan sirapnya. Ini bagian yang paling jarang ikut pindah: yang dijual adalah rangkanya, dan atapnya sering dibuat baru di tempat barunya.',
      glossEn:
        'The roof frame and its shingles. This is the part least likely to travel: what is sold is the frame, and the roof is often made new at the other end.',
    },
  ]
}

/**
 * The yard, with another house stacked in it.
 *
 * Bundles at bay length, laid out in rows: this is what the trade looks like
 * on the ground at Woloan, and it is the only site figure in the collection
 * that is a building rather than a place. Everything in it is knee height, so
 * it can no more hide this house than a yard can.
 */
function site(layout: Layout): readonly SiteMark[] {
  const bay = DIMS.bayLength.value
  const yardX = -layout.length / 2 - layout.veranda.depth - bay * 2
  const halfZ = layout.halfZ + bay
  const volumes: SiteVolume[] = []
  const stack = 4
  for (let i = 0; i < stack; i++) {
    volumes.push({
      kind: 'box',
      at: [yardX - bay * 0.6, 0, -halfZ + bay * 0.6 + i * bay * 0.55],
      size: [bay, DIMS.stoneHeight.value * (1 + (i % 2) * 0.6), bay * 0.4],
      material: 'kayu',
    })
  }
  return [
    {
      key: 'ikat',
      nameId: 'Ikat rumah lain',
      nameEn: 'Another house, bundled',
      glossId:
        'Tumpukan bagian rumah lain di halaman, dinomori dan menunggu diangkut. Di Woloan itulah pekerjaannya: rumah dibuat untuk dijual utuh dan berangkat lewat jalan, dan tapak satu-satunya dalam projek ini yang bukan sebuah tempat melainkan sebuah bangunan dalam perjalanan.',
      glossEn:
        'The stacked parts of another house in the yard, numbered and waiting for the lorry. At Woloan that is the work: houses are made to be sold whole and to leave by road — the only site in this project that is not a place but a building in transit.',
      lines: [groundRect(yardX - bay * 1.2, -halfZ, yardX, halfZ)],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const reach = layout.length / 2 + layout.veranda.depth
  return {
    // The ridge runs front to rear, over the veranda and the body alike.
    ridgeAxis: 0,
    footprint: { x: layout.length + layout.veranda.depth, z: layout.halfZ * 2 },
    drip: { x: layout.length / 2 + layout.eaveOversail, z: layout.halfZ + layout.eaveOversail },
    ridgeReach: reach,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met at the front, off the end of the veranda where the stairs come down.
    approachAt: [-layout.length / 2 - layout.veranda.depth - DIMS.bayLength.value, 0, 0],
    figureAt: [-layout.length / 2 - layout.veranda.depth - 1.4, 0, layout.halfZ * 0.5],
  }
}
