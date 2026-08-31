/**
 * What the renderer needs to know about a bade.
 *
 * Three fields read strangely and the strangeness is the content.
 *
 * `underfloorHeight` is the depth of the carrying lattice — the tenth meaning
 * that field has carried, and the only one that is not a space at all. On the
 * other buildings it is a storey, a plinth, a step, a slab, something you sit
 * on the edge of. Here it is the thickness of the thing on a crowd's
 * shoulders, and what is under it is the crowd.
 *
 * `zones` are three bands and none of them is a room. Nobody stands in any of
 * them, because there is nothing to stand in: this is a building with no
 * interior, which the field has never had to say before.
 *
 * The site is a crossroads. Every other setting in this collection is a place
 * the building stays; this is a place it passes through, and it is there
 * because at a crossroads the tower is turned about so the dead cannot find
 * the way home.
 */

import { groundBox } from '@/lib/core/scene'
import type { SceneModel, SiteMark, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'usungan',
      fromY: 0,
      toY: layout.frame.y,
      nameId: 'usungan',
      nameEn: 'the carrying lattice',
      glossId: `Rangka bambu yang dipikul ${layout.frame.bearers} orang. Ini satu-satunya pondasi bangunan ini, dan pondasi itu berjalan — lalu berbelok di tiap perempatan.`,
      glossEn: `A bamboo lattice carried by ${layout.frame.bearers} people. It is this building’s only foundation, and that foundation walks — and turns at every crossroads.`,
    },
    {
      key: 'badan',
      fromY: layout.frame.y,
      toY: layout.body.y + layout.body.height,
      nameId: 'badan',
      nameEn: 'the body',
      glossId:
        'Tempat jenazah dibaringkan. Satu-satunya pita di sini yang menampung sesuatu — dan yang ditampungnya tidak berdiri, tidak masuk sendiri, dan tidak keluar lagi.',
      glossEn:
        'Where the body is laid. The only band here that holds anything — and what it holds does not stand, does not walk in, and does not come out.',
    },
    {
      key: 'tumpang',
      fromY: layout.body.y + layout.body.height,
      toY: topY,
      nameId: 'tumpang',
      nameEn: 'the tiers',
      glossId: `${layout.rules.tumpang} tingkat, dan jumlahnya adalah kedudukan orang yang dibawa. Tidak ada apa pun di bawahnya: pada joglo tumpang adalah atap di atas sebuah ruang, di sini ia pernyataan dengan udara di bawahnya.`,
      glossEn: `${layout.rules.tumpang} tiers, and the count is the standing of the person being carried. There is nothing under them: on a joglo the tumpang are a roof over a room, here they are a statement with air beneath.`,
    },
  ]
}

/**
 * The crossroads, and the road out of the village.
 *
 * The only setting in the collection that is a route rather than a place. It
 * is drawn as ground, not as buildings, because what matters about it is the
 * turn: the tower is spun around at the crossing so the spirit loses its
 * bearings, which is a thing done to a building rather than a thing built.
 */
function site(layout: Layout): readonly SiteMark[] {
  const w = layout.frame.halfX * 2.6
  const reach = layout.frame.halfX * 9
  return [
    {
      key: 'pempatan',
      nameId: 'Pempatan agung',
      nameEn: 'The crossroads',
      glossId:
        'Jalan menuju setra dan perempatan yang dilaluinya. Di perempatan, menara diputar berkeliling supaya rohnya kehilangan arah dan tidak menemukan jalan pulang. Satu-satunya tapak dalam kumpulan ini yang berupa jalan, bukan tempat — sebab bangunan ini tidak tinggal di mana pun.',
      glossEn:
        'The road to the cremation ground and the crossing it passes. At the crossing the tower is spun about so the spirit loses its bearings and cannot find the way home. The only site figure in the collection that is a route rather than a place — because this building does not stay anywhere.',
      lines: [
        groundBox(0, 0, reach * 2, w),
        groundBox(0, 0, w, reach * 2),
      ],
      closed: true,
      volumes: [],
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const widest = layout.tiers[0]
  const reach = widest ? widest.halfX : layout.body.halfX
  return {
    /*
     * The ridge runs along X, but on this building that is a convention rather
     * than a fact: a bade has no ridge, it has an axis it is carried along.
     */
    ridgeAxis: 0,
    footprint: { x: layout.frame.halfX * 2, z: layout.frame.halfZ * 2 },
    drip: { x: reach, z: reach },
    ridgeReach: reach,
    weatherTop: topY,
    // The depth of the lattice: the tenth meaning of this field, and the only
    // one under which there is no space, only people.
    underfloorHeight: DIMS.frameDepth.value,
    zoneLines: [0, layout.frame.y, layout.body.y + layout.body.height, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the front, standing on the road it is coming down.
    approachAt: [-layout.frame.halfX * 5, 0, 0],
    figureAt: [-layout.frame.halfX * 1.9, 0, layout.frame.halfZ * 1.4],
  }
}
