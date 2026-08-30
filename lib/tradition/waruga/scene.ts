/**
 * What the renderer needs to know about a waruga.
 *
 * Every field in `SceneModel` was written for a building people go into, and
 * this is the first that nobody does. Three of them read strangely on purpose
 * and the strangeness is the content: the zones are a base, a chamber and a
 * lid rather than a sequence of storeys; `underfloorHeight` is the base slab,
 * which is the ninth meaning that field has carried; and the site is a burial
 * ground, which is the only setting in the collection made of other buildings
 * of the same kind.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'alas',
      fromY: 0,
      toY: layout.chamber.floorY,
      nameId: 'alas dan dasar',
      nameEn: 'the base and the floor',
      glossId:
        'Lempeng alas dan dasar peti yang dipahat dari blok yang sama. Bagian bangunan yang menyentuh tanah, dan satu-satunya bagian yang tidak ada urusannya dengan tubuh di dalamnya.',
      glossEn:
        'The base slab and the floor of the box, cut from the same block. The part of the building that touches the ground, and the only part with nothing to do with the body inside it.',
    },
    {
      key: 'ruang',
      fromY: layout.chamber.floorY,
      toY: layout.lid.y,
      nameId: 'ruang',
      nameEn: 'the chamber',
      glossId: `Ruang setinggi ${layout.chamber.height.toFixed(2)} m, diukur menurut tubuh yang duduk berlipat dan bertambah sejengkal untuk tiap orang berikutnya dari keluarga itu. Tidak ada seorang pun yang masuk ke pita ini; yang ada di dalamnya diletakkan dari atas.`,
      glossEn: `A chamber ${layout.chamber.height.toFixed(2)} m high, measured against a body seated and folded and gaining a hand’s breadth for each further person of the family. Nobody enters this band; what is in it was put in from above.`,
    },
    {
      key: 'tutup',
      fromY: layout.lid.y,
      toY: topY,
      nameId: 'tutup',
      nameEn: 'the lid',
      glossId:
        'Tutup berbentuk atap. Bangunan yang tidak dimasuki siapa pun tetap dibuat menyerupai rumah, dan tutup inilah satu-satunya bukaan yang pernah dimilikinya.',
      glossEn:
        'A roof-shaped lid. A building nobody enters is still made to look like a house, and this lid is the only opening it has ever had.',
    },
  ]
}

/**
 * The burial ground: other waruga, standing in rows.
 *
 * The only site figure in the collection made of more of the same building. A
 * waruga is never alone — the ones at Sawangan and Airmadidi stand in ranks,
 * moved there from the family yards they were first set up in, which is the
 * one thing about them that did not follow the rules.
 */
function site(layout: Layout): readonly SiteMark[] {
  const gap = layout.block.halfX * 3
  const volumes: SiteVolume[] = []
  for (const sz of [-1, 1] as const) {
    for (const ex of [0, 1] as const) {
      volumes.push({
        kind: 'box',
        at: [ex * gap * 1.2, 0, sz * gap],
        size: [
          layout.block.halfX * 2,
          layout.base.height + layout.block.height * (ex ? 0.85 : 1),
          layout.block.halfZ * 2,
        ],
        material: 'batu',
      })
    }
  }
  return [
    {
      key: 'kompleks',
      nameId: 'Kompleks waruga',
      nameEn: 'The burial ground',
      glossId:
        'Waruga lain, berdiri berbaris. Tapak ini satu-satunya dalam kumpulan ini yang tersusun dari bangunan sejenis — dan barisannya sendiri bukan aturan adat: banyak waruga dipindahkan ke kompleks pada abad terakhir dari pekarangan keluarga tempatnya semula berdiri.',
      glossEn:
        'Other waruga, standing in ranks. This is the only site figure in the collection made of more of the same building — and the ranks are not a rule of the tradition: many waruga were moved into these grounds in the last century from the family yards they first stood in.',
      lines: [
        groundRect(
          -layout.block.halfX * 2,
          -gap * 1.6,
          gap * 1.8,
          gap * 1.6,
        ),
      ],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const reach = layout.block.halfX + layout.lid.overhang
  return {
    // The lid's ridge runs north–south, along the axis the face looks down.
    ridgeAxis: 0,
    footprint: { x: layout.block.halfX * 2, z: layout.block.halfZ * 2 },
    drip: { x: reach, z: layout.block.halfZ + layout.lid.overhang },
    ridgeReach: reach,
    weatherTop: topY,
    // The base slab: the ninth meaning of this field, and the only one that is
    // not a space anybody could be in.
    underfloorHeight: layout.base.height,
    zoneLines: [0, layout.chamber.floorY, layout.lid.y, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the north, where the face is, because that is the side that was
    // made to be read.
    approachAt: [-layout.block.halfX * 4, 0, 0],
    figureAt: [-layout.block.halfX * 2.2, 0, layout.block.halfZ * 1.6],
  }
}
